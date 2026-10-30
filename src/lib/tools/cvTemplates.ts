import { METIERS } from "@/lib/seo/metiers";
import { METIER_PACKS } from "@/lib/coverLetter/metierPacks";
import { CV_METIERS } from "@/lib/tools/cvMetiers";
import type { CvContract } from "@/lib/tools/cv";

// Contenu de départ des CV par métier (30/10). Chargé à la demande par le
// générateur (import dynamique) : la taxonomie et les fiches métier ne
// pèsent pas sur la page publique tant qu'on ne choisit pas de métier.

/** Métiers proposés dans le générateur, par ordre alphabétique. */
export const CV_METIER_OPTIONS: { slug: string; label: string }[] = METIERS.filter((m) => CV_METIERS[m.slug])
  .map((m) => ({ slug: m.slug, label: m.label.charAt(0).toUpperCase() + m.label.slice(1) }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

export type CvMetierPrefill = { headline: string; summary: string; skills: string[]; qualities: string[] };

/**
 * Contenu de départ d'un CV pour un métier. Ce qu'on ne sait pas reste entre
 * crochets (formation, date), comme dans les lettres : le générateur liste
 * ces passages à compléter.
 */
export function cvMetierPrefill(slug: string, contract: CvContract, formation?: string | null): CvMetierPrefill | null {
  const metier = METIERS.find((m) => m.slug === slug);
  const content = CV_METIERS[slug];
  if (!metier || !content) return null;
  const pack = METIER_PACKS[slug];
  const f = formation?.trim() || "[ta formation]";
  const headline =
    contract === "alternance"
      ? `Alternance ${metier.domain} – ${f} – rentrée [mois et année]`
      : `Stage ${metier.domain} – [durée] à partir de [mois et année]`;
  const intro = formation?.trim() ? `En ${f}` : "En [ta formation]";
  const missions = pack ? ` pour apprendre à ${pack.missions}` : "";
  const summary = `${intro}, je cherche ${contract === "alternance" ? "une alternance" : "un stage"} ${metier.domain}${missions}. [Une phrase sur ce que tu apportes : un job, un projet, un engagement.]`;
  return { headline, summary, skills: content.skills, qualities: content.qualities };
}
