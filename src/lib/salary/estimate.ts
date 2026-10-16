import { APPRENTICE_RATES, SMIC_MONTHLY_GROSS, STAGE_HOURLY_MIN } from "@/lib/salary/legalRates";
import type { Offer } from "@/types/database";

// Salaire affiché sur la carte d'offre (16/10, demande de Nathan : « le
// salaire ne doit pas être flouté, et quand il n'est pas mis, il faut
// toujours l'estimer »). Quand l'annonce ne donne pas de montant chiffré,
// on affiche la fourchette légale la plus courante, marquée « estimation » :
// - alternance : 1re année d'apprentissage, 18-20 ans → 21-25 ans
//   (43 % → 53 % du SMIC), ou 21-25 ans en 1re → 2e année pour un bac+4 et
//   plus (53 % → 61 %) ;
// - stage : gratification minimale légale à 35 h/semaine.
// Jamais présenté comme le salaire de l'offre, toujours comme une estimation.

const HIGH_LEVELS = new Set(["Bac+4", "Bac+5", "Bac+6 et plus"]);

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function euros(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function offerSalary(
  offer: Pick<Offer, "salary" | "contract_type" | "education_level">,
): { value: string; estimated: boolean } {
  // « Selon profil », « À négocier »… : pas de montant, donc on estime.
  if (offer.salary && /\d/.test(offer.salary)) return { value: offer.salary, estimated: false };

  if (offer.contract_type === "stage") {
    const monthly = roundTo((STAGE_HOURLY_MIN * 35 * 52) / 12, 10);
    return { value: `${euros(monthly)} €`, estimated: true };
  }

  const [low, high] = HIGH_LEVELS.has(offer.education_level ?? "")
    ? [APPRENTICE_RATES["21to25"][1], APPRENTICE_RATES["21to25"][2]]
    : [APPRENTICE_RATES["18to20"][1], APPRENTICE_RATES["21to25"][1]];
  return {
    value: `${euros(roundTo(SMIC_MONTHLY_GROSS * low, 50))}–${euros(roundTo(SMIC_MONTHLY_GROSS * high, 50))} €`,
    estimated: true,
  };
}
