import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { computeMatchScore, computeMatchReasons } from "@/lib/matching/score";
import { computeQuotaStatus, FREE_WEEKLY_SWIPE_QUOTA } from "@/lib/subscription/quota";
import type { Offer } from "@/types/database";

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

  const [{ data: swiped }, { data: applications }] = await Promise.all([
    supabase.from("swipes").select("offer_id, created_at").eq("user_id", user.id),
    supabase.from("applications").select("offer_id").eq("user_id", user.id),
  ]);

  const excludeIds = (swiped ?? []).map((s) => s.offer_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const swipesToday = (swiped ?? []).filter(
    (s) => new Date(s.created_at) >= todayStart,
  ).length;

  const { premium, quotaReached, browseSwipesThisWeek } = computeQuotaStatus(
    profile,
    swiped ?? [],
    applications ?? [],
  );
  const remainingSwipes = premium
    ? null
    : Math.max(0, FREE_WEEKLY_SWIPE_QUOTA - browseSwipesThisWeek);

  // Taille du deck réellement montré, une fois trié par pertinence.
  const DECK_SIZE = 30;
  // Bassin de candidats scoré AVANT tri : doit couvrir tout le volume actif
  // réaliste, sinon le tri par score ne s'applique qu'aux offres les plus
  // récentes (ce qu'on récupérait avant) et les meilleurs matchs d'un
  // profil peuvent ne jamais apparaître s'ils ne sont pas parmi les toutes
  // dernières publiées.
  const CANDIDATE_POOL_SIZE = 400;

  let offers: Offer[] = [];

  if (!quotaReached) {
    let query = supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(CANDIDATE_POOL_SIZE);

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    // Filtre dur par secteur : demandé explicitement à l'onboarding
    // (obligatoire depuis peu), donc on ne montre que les offres dans le(s)
    // secteur(s) choisi(s) plutôt que de le laisser peser juste sur le tri.
    // Les comptes créés avant que ce champ soit obligatoire (sectors vide)
    // ne sont pas filtrés, sinon leur deck se viderait d'un coup.
    if (profile && profile.sectors.length > 0) {
      query = query.in("sector", profile.sectors);
    }

    // Pas de filtre dur par looking_for ici : le sélecteur Stage/Alternance/
    // Les deux dans SwipeDeck doit pouvoir montrer les deux types même si
    // l'utilisateur n'a coché qu'un seul lors de l'onboarding. La préférence
    // continue de peser sur le tri via computeMatchScore.
    const { data: rawOffers } = await query;
    offers = rawOffers ?? [];

    // Filet de sécurité : si le filtre secteur ne renvoie rien (secteur trop
    // niche, catalogue encore mince dessus...), un compte gratuit qui n'a
    // pourtant pas encore atteint son quota se retrouvait avec un deck vide
    // -- donc directement sur l'écran "Plus d'offres" au style paywall,
    // sans avoir pu swiper une seule fois. On retente sans le filtre secteur
    // plutôt que de bloquer sur un filtre qu'on a nous-même ajouté.
    if (offers.length === 0 && profile && profile.sectors.length > 0) {
      let fallbackQuery = supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false })
        .limit(CANDIDATE_POOL_SIZE);
      if (excludeIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${excludeIds.join(",")})`);
      }
      const { data: fallbackOffers } = await fallbackQuery;
      offers = fallbackOffers ?? [];
    }
  }

  const scores: Record<string, number> = {};
  if (profile) {
    for (const offer of offers) {
      scores[offer.id] = computeMatchScore(profile, offer);
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

  // Même logique de filet de sécurité que ci-dessus : si ce filtre viderait
  // un pool pourtant non vide, on préfère montrer les offres quand même
  // (déjà triées par score, donc les moins hors-sujet en premier) plutôt que
  // de renvoyer un compte gratuit vers l'écran de blocage sans un seul swipe.
  const filteredByRelevance = rankedOffers.filter((o) => (scores[o.id] ?? 0) > 40);
  const relevantOffers =
    hasPreferences && filteredByRelevance.length > 0 ? filteredByRelevance : rankedOffers;

  const sortedOffers = relevantOffers.slice(0, DECK_SIZE);

  const reasons: Record<string, string[]> = {};
  if (profile) {
    for (const offer of sortedOffers) {
      reasons[offer.id] = computeMatchReasons(profile, offer);
    }
  }

  // Bandeau "X offres vers [ville], puis d'autres villes" : prévient plutôt
  // que de laisser deviner pourquoi une offre à l'autre bout du pays
  // apparaît dans le deck d'un profil basé quelque part de précis.
  let cityBanner: string | null = null;
  if (profile?.city && sortedOffers.length > 0) {
    const cityLower = profile.city.toLowerCase().trim();
    const inCityCount = sortedOffers.filter((o) =>
      o.location.toLowerCase().includes(cityLower),
    ).length;
    cityBanner =
      inCityCount === sortedOffers.length
        ? `${sortedOffers.length} offre${sortedOffers.length > 1 ? "s" : ""} à ${profile.city}.`
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
        quotaReached={quotaReached}
        remainingSwipes={remainingSwipes}
        cityBanner={cityBanner}
        sectorLabel={sectorLabel}
      />
    </div>
  );
}
