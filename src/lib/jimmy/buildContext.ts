import type { SupabaseClient } from "@supabase/supabase-js";
import { computeMatchScore } from "@/lib/matching/score";
import { buildProfileContextLines } from "@/lib/gemini/profileContext";
import { MIN_QUALITY_FOR_FEED } from "@/lib/offers/quality";
import type { Database } from "@/types/database";

export type JimmyOfferRef = {
  id: string;
  title: string;
  company: string;
  location: string;
  score?: number;
};

export type JimmyContext = {
  /** Bloc de texte français prêt à injecter dans le prompt -- construit à
   * partir de vraies données uniquement (aucune statistique inventée). */
  summaryText: string;
  /** Offres réellement éligibles à être citées par Jimmy (candidatures,
   * favoris, meilleures offres actuelles) -- sert à vérifier après coup
   * qu'aucune offre hors de cette liste n'a été inventée, si besoin d'un
   * contrôle plus strict à l'avenir. */
  knownOfferIds: Set<string>;
};

// Contexte réel du compte, reconstruit à chaque message (jamais mis en
// cache) -- Jimmy doit toujours répondre avec l'état le plus à jour du
// compte, pas un instantané périmé. Réutilise buildProfileContextLines
// (src/lib/gemini/profileContext.ts), le même bloc de profil que la lettre
// de motivation et l'audit CV, pour que "connaître le profil aussi bien que
// l'algo de matching" (demande explicite de Nathan) reste vrai partout.
export async function buildJimmyContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<JimmyContext> {
  // select("*") plutôt que PROFILE_FOR_AI_COLUMNS seul : computeMatchScore
  // (utilisé plus bas pour classer les meilleures offres) prend le type
  // Profile complet, pas un sous-ensemble -- même contrainte que
  // src/app/(app)/swipe/page.tsx et dashboard/page.tsx.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  const [{ data: applications }, { data: likedSwipes }, { data: allSwipes }] = await Promise.all([
    supabase
      .from("applications")
      .select("offer_id, status, applied_at")
      .eq("user_id", userId)
      .order("applied_at", { ascending: false })
      .limit(15),
    supabase
      .from("swipes")
      .select("offer_id")
      .eq("user_id", userId)
      .eq("direction", "like")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("swipes").select("offer_id").eq("user_id", userId),
  ]);

  const relatedOfferIds = [
    ...new Set([
      ...(applications ?? []).map((a) => a.offer_id),
      ...(likedSwipes ?? []).map((s) => s.offer_id),
    ]),
  ];
  const { data: relatedOffers } = relatedOfferIds.length
    ? await supabase.from("offers").select("id, title, company, location").in("id", relatedOfferIds)
    : { data: [] as { id: string; title: string; company: string; location: string }[] };
  const offerById = new Map((relatedOffers ?? []).map((o) => [o.id, o]));

  const excludeIds = (allSwipes ?? []).map((s) => s.offer_id);
  let candidateQuery = supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .gte("quality_score", MIN_QUALITY_FOR_FEED)
    .order("quality_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(200);
  if (excludeIds.length > 0) {
    candidateQuery = candidateQuery.not("id", "in", `(${excludeIds.join(",")})`);
  }
  if (profile && profile.sectors.length > 0) {
    candidateQuery = candidateQuery.in("sector", profile.sectors);
  }
  const { data: candidates } = await candidateQuery;

  const topOffers: JimmyOfferRef[] = profile
    ? (candidates ?? [])
        .map((o) => ({ offer: o, score: computeMatchScore(profile, o) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ offer, score }) => ({
          id: offer.id,
          title: offer.title,
          company: offer.company,
          location: offer.location,
          score,
        }))
    : [];

  const knownOfferIds = new Set<string>([...relatedOfferIds, ...topOffers.map((o) => o.id)]);

  const lines: string[] = [];
  const profileLines = buildProfileContextLines(profile);
  if (profileLines.length > 0) {
    lines.push("PROFIL DU CANDIDAT :", ...profileLines);
  } else {
    lines.push("PROFIL DU CANDIDAT : pas encore renseigné en détail.");
  }
  lines.push(profile?.cv_text ? "Un CV est disponible (texte fourni ci-dessous, tronqué)." : "Aucun CV disponible pour ce candidat.");
  if (profile?.cv_text) {
    lines.push(`Extrait du CV :\n${profile.cv_text.slice(0, 3000)}`);
  }

  lines.push("", "CANDIDATURES RÉCENTES (données réelles, les seules à considérer) :");
  if (applications && applications.length > 0) {
    for (const app of applications) {
      const offer = offerById.get(app.offer_id);
      if (!offer) continue;
      lines.push(`- ${offer.title} chez ${offer.company} (${offer.location}) — statut : ${app.status}, postulé le ${app.applied_at.slice(0, 10)}.`);
    }
  } else {
    lines.push("Aucune candidature envoyée pour l'instant.");
  }

  lines.push("", "OFFRES SAUVEGARDÉES / FAVORIS (données réelles) :");
  const appliedOfferIds = new Set((applications ?? []).map((a) => a.offer_id));
  const favoritesNotApplied = (likedSwipes ?? []).filter((s) => !appliedOfferIds.has(s.offer_id));
  if (favoritesNotApplied.length > 0) {
    for (const s of favoritesNotApplied) {
      const offer = offerById.get(s.offer_id);
      if (!offer) continue;
      lines.push(`- ${offer.title} chez ${offer.company} (${offer.location}) — sauvegardée, pas encore de candidature envoyée.`);
    }
  } else {
    lines.push("Aucun favori en attente de candidature.");
  }

  lines.push(
    "",
    "MEILLEURES OFFRES ACTUELLEMENT DISPONIBLES POUR CE PROFIL (données réelles, calculées par l'algo de matching -- CE SONT LES SEULES OFFRES QUE TU PEUX RECOMMANDER OU CITER PAR LEUR NOM) :",
  );
  if (topOffers.length > 0) {
    for (const o of topOffers) {
      lines.push(`- [${o.id}] ${o.title} chez ${o.company} (${o.location}) — ${o.score}% compatible.`);
    }
  } else {
    lines.push("Aucune offre disponible à recommander pour l'instant.");
  }

  return { summaryText: lines.join("\n"), knownOfferIds };
}
