import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { SearchCompletedCard } from "@/components/swipe/SearchCompletedCard";
import { computeMatchScore, computeMatchReasons, computeCvMatchBonus, isNearbyCity } from "@/lib/matching/score";
import { buildLearnedAffinity, type SwipeHistoryEntry } from "@/lib/matching/learning";
import { isPremium } from "@/lib/subscription/isPremium";
import { computeApplicationStreak } from "@/lib/engagement/applicationStreak";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";

export default async function SwipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/swipe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Recherche clôturée ("j'ai trouvé mon alternance", voir
  // RETENTION_AUDIT.md section 17E) : on ne considère jamais ça comme un
  // échec produit -- état de félicitations avec une sortie simple pour
  // reprendre la recherche, plutôt que de forcer un compte inactif à revoir
  // un deck qui ne l'intéresse plus.
  if (profile?.search_completed_at) {
    return (
      <div className="flex flex-1 flex-col items-center">
        <SearchCompletedCard reason={profile.search_completed_reason} />
      </div>
    );
  }

  const [{ data: swiped }, { data: applications }] = await Promise.all([
    supabase
      .from("swipes")
      .select("offer_id, direction, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("applications").select("offer_id, applied_at").eq("user_id", user.id),
  ]);

  const appliedOfferIds = new Set((applications ?? []).map((a) => a.offer_id));

  // Un "pass" n'exclut plus une offre pour toujours : sous le hard paywall,
  // la navigation est illimitée (voir RETENTION_AUDIT.md, 26/09), donc un
  // compte actif peut désormais parcourir tout le pool disponible en une
  // seule session -- avant, le quota hebdomadaire (3 swipes/semaine)
  // rationnait mécaniquement l'exposition et ce problème n'était jamais
  // visible. Un "pass" vieux de plus de RECYCLE_PASS_AFTER_DAYS peut donc
  // réapparaître (le catalogue tourne trop lentement, vu le volume prudent
  // d'ingestion quotidienne -- sync-adzuna/discover-offers -- pour se
  // permettre d'exclure définitivement chaque offre passée une fois).
  // "like" (= favori) et toute offre déjà candidatée restent, eux, exclus
  // pour toujours : les revoir dans le deck n'aurait aucun sens.
  const RECYCLE_PASS_AFTER_DAYS = 14;
  const recycleCutoff = new Date();
  recycleCutoff.setDate(recycleCutoff.getDate() - RECYCLE_PASS_AFTER_DAYS);
  const excludeIds = (swiped ?? [])
    .filter((s) => {
      if (s.direction === "like" || appliedOfferIds.has(s.offer_id)) return true;
      return new Date(s.created_at) >= recycleCutoff;
    })
    .map((s) => s.offer_id);

  // Série de jours consécutifs avec au moins une candidature réelle -- voir
  // src/lib/engagement/applicationStreak.ts. Affichée sur le deck pour
  // donner une vraie raison de revenir candidater chaque jour, pas juste
  // parcourir les offres.
  const applicationStreak = computeApplicationStreak(
    (applications ?? []).map((a) => a.applied_at),
  );

  // Apprend des vrais likes/passes/candidatures passés (pas seulement des
  // réponses figées de l'onboarding) : voir src/lib/matching/learning.ts.
  // Les offres déjà swipées ne sont jamais dans `offers` (exclues ci-dessous
  // pour ne pas les remontrer), donc il faut aller chercher leurs attributs
  // séparément pour reconstruire ce que le profil a réellement aimé/passé.
  let swipeHistory: SwipeHistoryEntry[] = [];
  if (excludeIds.length > 0) {
    const { data: swipedOffersData } = await supabase
      .from("offers")
      .select("id, sector, title, remote_policy")
      .in("id", excludeIds);
    const swipedOffersById = new Map((swipedOffersData ?? []).map((o) => [o.id, o]));

    swipeHistory = (swiped ?? []).flatMap((s) => {
      const offer = swipedOffersById.get(s.offer_id);
      if (!offer) return [];
      return [{
        direction: s.direction,
        applied: appliedOfferIds.has(s.offer_id),
        offer,
        swipedAt: s.created_at,
      }];
    });
  }
  const affinity = buildLearnedAffinity(swipeHistory);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const swipesToday = (swiped ?? []).filter(
    (s) => new Date(s.created_at) >= todayStart,
  ).length;

  const premium = isPremium(profile);

  // Taille du deck réellement montré, une fois trié par pertinence. Remis à
  // 30 (revert du 8/09 -> 20, jamais concluant) : remise à l'identique de
  // l'état du 8/09 10h-12h à la demande explicite, en attendant une
  // décision produit plus posée plutôt qu'une nouvelle expérimentation.
  const DECK_SIZE = 30;
  // Bassin de candidats scoré AVANT tri : doit couvrir tout le volume actif
  // réaliste, sinon le tri par score ne s'applique qu'aux offres les plus
  // récentes (ce qu'on récupérait avant) et les meilleurs matchs d'un
  // profil peuvent ne jamais apparaître s'ils ne sont pas parmi les toutes
  // dernières publiées.
  const CANDIDATE_POOL_SIZE = 600;

  // Hard paywall (pas d'essai gratuit, voir RETENTION_AUDIT.md) : la
  // navigation dans le deck n'est plus plafonnée, y compris pour un compte
  // gratuit -- seules les actions (like, candidature) sont réservées au
  // Premium (voir SwipeDeck). Donc on récupère toujours les offres, qu'on
  // soit Premium ou pas.
  //
  // Pas de filtre dur par looking_for ici : le sélecteur Stage/Alternance/
  // Les deux dans SwipeDeck doit pouvoir montrer les deux types même si
  // l'utilisateur n'a coché qu'un seul lors de l'onboarding. La préférence
  // continue de peser sur le tri via computeMatchScore.
  //
  // Filtre dur par secteur : demandé explicitement à l'onboarding
  // (obligatoire depuis peu), donc on ne montre que les offres dans le(s)
  // secteur(s) choisi(s) plutôt que de le laisser peser juste sur le tri.
  // Les comptes créés avant que ce champ soit obligatoire (sectors vide)
  // ne sont pas filtrés, sinon leur deck se viderait d'un coup.
  const hardSectors = profile && profile.sectors.length > 0 ? profile.sectors : [];
  let offers = await fetchActiveOffers(supabase, { excludeIds, sectors: hardSectors, limit: CANDIDATE_POOL_SIZE });

  // Filet de sécurité : si le filtre secteur ne renvoie rien (secteur trop
  // niche, catalogue encore mince dessus...), on se retrouvait avec un deck
  // vide -- donc directement sur l'écran "Plus d'offres" sans avoir pu
  // parcourir une seule carte. On retente sans le filtre secteur plutôt que
  // de bloquer sur un filtre qu'on a nous-même ajouté.
  if (offers.length === 0 && hardSectors.length > 0) {
    offers = await fetchActiveOffers(supabase, { excludeIds, limit: CANDIDATE_POOL_SIZE });
  }

  // Score de base (réponses onboarding) + bonus appris de l'historique réel
  // de swipes/candidatures (voir src/lib/matching/learning.ts) -- ce dernier
  // reste à 0 pour un profil qui n'a encore rien swipé, donc n'affecte
  // jamais un tout nouveau compte.
  const scores: Record<string, number> = {};
  if (profile) {
    // Bonus supplémentaire réservé aux Premium : va chercher dans le texte
    // réel du CV (profiles.cv_text, mis en cache à l'upload -- voir
    // src/app/(app)/cv/actions.ts) des recoupements avec l'offre, au-delà
    // des champs figés de l'onboarding. Reste à 0 pour un compte gratuit ou
    // sans CV exploitable, donc sans effet sur le deck des non-abonnés.
    const cvText = premium ? (profile.cv_text ?? null) : null;
    for (const offer of offers) {
      const base = computeMatchScore(profile, offer);
      const learnedBonus =
        affinity.sectorBonus(offer.sector) +
        affinity.remoteBonus(offer.remote_policy) +
        affinity.keywordBonus(offer.title);
      const cvBonus = computeCvMatchBonus(cvText, offer);
      scores[offer.id] = Math.max(30, Math.min(99, Math.round(base + learnedBonus + cvBonus)));
    }
  }

  const rankedOffers = profile
    ? [...offers].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    : offers;

  // Un profil qui a renseigné des préférences (secteur, métier visé ou
  // compétences) attend des offres qui matchent réellement au moins un de
  // ces critères. Sans ce filtre, dès que peu d'offres pertinentes
  // existaient dans le pool, le deck se remplissait quand même jusqu'à
  // DECK_SIZE avec du remplissage hors-sujet (le score de base à 40 suffit
  // à faire apparaître n'importe quelle offre) — d'où par exemple un CAP
  // pâtisserie proposé à quelqu'un qui vise la finance. Mieux vaut montrer
  // un deck plus court (ou vide, déjà géré par SwipeDeck) que hors-sujet.
  const hasPreferences =
    !!profile &&
    (profile.sectors.length > 0 ||
      profile.target_jobs.length > 0 ||
      profile.skills.length > 0 ||
      !!profile.city);

  // Le seuil monte une fois qu'on a assez d'historique pour lui faire
  // confiance : "trop de swipes, pas assez de candidatures" -- un deck qui
  // reste en permanence rempli à ras le score de base (40) laisse passer du
  // remplissage correct-mais-pas-motivant. Passé un peu d'historique réel,
  // on ne montre plus que ce qui ressort vraiment (déclenché à 8 swipes).
  //
  // Le seuil "à froid" pour les comptes GRATUITS reste à 40, sans y
  // retoucher : il était brièvement passé à 48 le 8 septembre pour TOUS les
  // comptes, dans l'idée de filtrer plus fort dès la toute première carte
  // -- revenu à 40 par précaution le lendemain : chute des paiements
  // observée précisément sur la première cohorte d'inscrits (donc
  // gratuits) entièrement passée par ce seuil plus strict, corrélation
  // temporelle trop nette pour l'ignorer. Cause réelle non confirmée, mais
  // mieux vaut ne plus jamais resserrer l'entrée gratuite sans preuve.
  //
  // Les PREMIUM ont leurs propres seuils, nettement plus stricts (déjà
  // payé -- resserrer leur deck ne peut plus faire baisser une conversion
  // qui a déjà eu lieu) : l'objectif devient "chaque carte donne envie de
  // candidater", pas juste "assez pertinente pour ne pas être hors-sujet".
  // Filet de sécurité inchangé plus bas : si ce seuil viderait le deck, on
  // retombe sur les offres les mieux classées quand même.
  const relevanceThreshold = premium
    ? (affinity.sampleSize >= 8 ? 68 : 60)
    : (affinity.sampleSize >= 8 ? 58 : 40);

  // Même logique de filet de sécurité que ci-dessus : si ce filtre viderait
  // un pool pourtant non vide, on préfère montrer les offres quand même
  // (déjà triées par score, donc les moins hors-sujet en premier) plutôt que
  // de renvoyer un compte gratuit vers l'écran de blocage sans un seul swipe.
  const filteredByRelevance = rankedOffers.filter((o) => (scores[o.id] ?? 0) > relevanceThreshold);
  const relevantOffers =
    hasPreferences && filteredByRelevance.length > 0 ? filteredByRelevance : rankedOffers;

  const sortedOffers = relevantOffers.slice(0, DECK_SIZE);

  const reasons: Record<string, string[]> = {};
  if (profile) {
    for (const offer of sortedOffers) {
      const offerReasons = computeMatchReasons(profile, offer);
      if (offerReasons.length < 3 && affinity.isStrongContentMatch(offer)) {
        offerReasons.push("Proche d'offres que tu as aimées");
      }
      reasons[offer.id] = offerReasons;
    }
  }

  // Bandeau "X offres vers [ville], puis d'autres villes" : prévient plutôt
  // que de laisser deviner pourquoi une offre à l'autre bout du pays
  // apparaît dans le deck d'un profil basé quelque part de précis.
  let cityBanner: string | null = null;
  if (profile?.city && sortedOffers.length > 0) {
    const cityLower = profile.city.toLowerCase().trim();
    // Compte aussi les offres de l'agglomération (ex: "Villeurbanne" pour un
    // profil à "Lyon") comme "dans la ville" -- sinon le bandeau annonçait
    // "puis d'autres villes" pour des offres en réalité toutes proches,
    // ce qui donnait l'impression trompeuse que rien n'était proposé
    // autour de la ville choisie.
    const inCityCount = sortedOffers.filter((o) => {
      const locationLower = o.location.toLowerCase();
      return locationLower.includes(cityLower) || isNearbyCity(cityLower, locationLower);
    }).length;
    cityBanner =
      inCityCount === sortedOffers.length
        ? `${sortedOffers.length} offre${sortedOffers.length > 1 ? "s" : ""} à ${profile.city} et alentours.`
        : `${sortedOffers.length} offres vers ${profile.city}, puis d'autres villes.`;
  }

  const sectorLabel =
    profile && profile.sectors.length === 1
      ? profile.sectors[0]
      : profile && profile.sectors.length > 1
        ? `${profile.sectors.length} secteurs`
        : null;

  return (
    <div className="flex flex-1 flex-col items-center">
      <SwipeDeck
        offers={sortedOffers}
        scores={scores}
        reasons={reasons}
        userId={user.id}
        swipesToday={swipesToday}
        isPremium={premium}
        cityBanner={cityBanner}
        sectorLabel={sectorLabel}
        applicationStreak={applicationStreak}
      />
    </div>
  );
}
