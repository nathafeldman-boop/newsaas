import type { ContractType } from "@/types/database";
import { APPRENTICE_RATES, SMIC_MONTHLY_GROSS, STAGE_HOURLY_MIN } from "@/lib/salary/legalRates";

// Douleur et investissement (Nathan, 12/11 : « appuie beaucoup plus sur la
// douleur pendant l'onboarding et dans le paywall, sur le fait que c'est
// bientôt fini et que c'est un investissement vu qu'ils auront un salaire »).
// Uniquement des faits vérifiables : règle des 3 mois sans contrat
// (Code du travail L6222-12-1), minimums légaux de legalRates.ts, et le prix
// normal de Premium (15,99 €/mois, pas le prix de bienvenue) pour que
// « X ans de Premium » reste vrai quel que soit le prix affiché.

const REGULAR_MONTHLY_EUROS = 15.99;
// Stage à temps plein : 35 h × 52 semaines / 12 mois.
const STAGE_MONTHLY_MIN = STAGE_HOURLY_MIN * 35 * (52 / 12);
const APPRENTICE_MONTHLY_MIN = SMIC_MONTHLY_GROSS * APPRENTICE_RATES.under18[1];

const euros = (n: number) => `${Math.floor(n).toLocaleString("fr-FR")} €`;

function yearsOfPremium(monthlyPay: number): string {
  const months = Math.floor(monthlyPay / REGULAR_MONTHLY_EUROS);
  if (months >= 24) return `${Math.floor(months / 12)} ans de Premium`;
  return `${months} mois de Premium`;
}

export type PainCopy = {
  /** Ce qui se passe si tu attends. */
  deadline: string;
  /** Ce que ça te coûte de ne rien faire. */
  pain: string;
  /** Pourquoi Premium est un investissement (salaire réel, minimum légal). */
  investment: string;
};

function primary(lookingFor: ContractType[] | null | undefined): ContractType {
  const list = lookingFor ?? [];
  for (const t of ["alternance", "cdd", "cdi", "stage"] as const) if (list.includes(t)) return t;
  return "alternance";
}

export function painCopy(lookingFor: ContractType[] | null | undefined): PainCopy {
  const type = primary(lookingFor);
  if (type === "alternance") {
    return {
      deadline: "Sans contrat, ton école ne peut te garder que 3 mois après ta rentrée. Pour la plupart des rentrées de septembre et d'octobre, la limite tombe en décembre ou en janvier.",
      pain: "Passé ce délai, tu risques de devoir quitter ta formation ou de la payer toi-même.",
      investment: `Une alternance, c'est un salaire : au minimum ${euros(APPRENTICE_MONTHLY_MIN)} brut par mois, souvent bien plus. Ton premier salaire paie déjà ${yearsOfPremium(APPRENTICE_MONTHLY_MIN)}.`,
    };
  }
  if (type === "stage") {
    return {
      deadline: "Beaucoup d'entreprises choisissent leurs stagiaires des mois avant le début. Chaque semaine qui passe, il reste moins de places.",
      pain: "Sans stage, pas de validation de ton année dans la plupart des formations.",
      investment: `Au-delà de 2 mois, un stage est payé au moins ${STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/h, environ ${euros(STAGE_MONTHLY_MIN)} par mois à temps plein. Un seul mois paie ${yearsOfPremium(STAGE_MONTHLY_MIN)}.`,
    };
  }
  return {
    deadline: "Chaque mois sans poste, c'est un mois de salaire que tu ne récupéreras jamais.",
    pain: `Au SMIC, ça fait ${euros(SMIC_MONTHLY_GROSS)} brut de perdus par mois d'attente.`,
    investment: `Ton premier salaire, même au SMIC, paie ${yearsOfPremium(SMIC_MONTHLY_GROSS)}. Et Premium coûte moins qu'une journée de SMIC par mois.`,
  };
}
