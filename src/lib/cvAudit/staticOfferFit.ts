import type { OfferFit } from "@/lib/cvAudit/offerFitSchema";
import type { Offer, Profile } from "@/types/database";

// Repli statique de generateOfferFitWithAnthropic -- ZÉRO appel IA, même
// doctrine de fiabilité que staticAudit.ts/staticGenerator.ts. Volontairement
// plus modeste que la version Claude (recoupement de compétences déclarées
// plutôt qu'une vraie lecture du CV) : mieux vaut un résultat honnête et
// limité que d'inventer des détails qu'on ne peut pas extraire de façon
// fiable sans IA.

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`, "iu");
  return pattern.test(haystack);
}

type OfferInput = Pick<Offer, "description" | "requirements">;

export function computeStaticOfferFit(
  profileSkills: Profile["skills"],
  offer: OfferInput,
): OfferFit {
  const offerText = `${offer.description} ${offer.requirements ?? ""}`;
  const matched = profileSkills.filter((skill) => containsWholeWord(offerText, skill));
  const ratio = profileSkills.length > 0 ? matched.length / profileSkills.length : 0;
  const score = Math.max(30, Math.min(95, Math.round(40 + ratio * 55)));

  const gaps: string[] =
    offer.requirements && matched.length < profileSkills.length
      ? [
          "Certains prérequis de l'offre (voir \"Profil recherché\" ci-dessus) ne recoupent aucune compétence indiquée dans ton profil -- vérifie que tu peux les justifier avant de postuler.",
        ]
      : [];

  const advice =
    matched.length === 0
      ? ["Mets en avant, dans ta lettre ou ton CV, tout élément concret qui répond aux prérequis listés par cette offre."]
      : ["Cite explicitement " + matched.slice(0, 2).join(" et ") + " dans ta candidature : ce sont des recoupements directs avec cette offre."];

  return {
    score,
    matched: matched.length > 0 ? matched.map((s) => `Compétence "${s}" présente dans ton profil`) : [],
    gaps,
    advice,
  };
}
