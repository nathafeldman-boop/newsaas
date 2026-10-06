// Barèmes légaux 2026 -- source unique pour le simulateur de salaire
// (/outils/simulateur-salaire-alternance). Vérifiés le 06/10/2026 :
// - SMIC mensuel brut 1 867,02 € (35 h) depuis la revalorisation du
//   01/06/2026 (info.gouv.fr) ;
// - grilles apprentissage et contrat de professionnalisation (Code du
//   travail D6222-26 et D6325-15, inchangées depuis 2019) ;
// - gratification de stage 4,50 €/h = 15 % du plafond horaire SS 2026 (30 €) ;
// - apprentis : depuis les contrats signés le 01/03/2025, exonération de
//   cotisations salariales et de CSG/CRDS limitée à 50 % du SMIC (avant :
//   cotisations exonérées jusqu'à 79 % du SMIC, CSG/CRDS totalement).
// À mettre à jour à chaque revalorisation du SMIC (+ la date ci-dessous).
export const LEGAL_RATES_UPDATED_AT = "2026-10-06";
export const SMIC_MONTHLY_GROSS = 1867.02;
export const SMIC_EFFECTIVE_DATE = "1er juin 2026";
export const STAGE_HOURLY_MIN = 4.5;
export const STAGE_MANDATORY_AFTER = "2 mois (44 jours ou 308 heures)";

export type AgeBracket = "under18" | "18to20" | "21to25" | "26plus";
export type ContractYear = 1 | 2 | 3;
export type ProLevel = "belowBacPro" | "bacProOrMore";

export const AGE_LABEL: Record<AgeBracket, string> = {
  under18: "Moins de 18 ans",
  "18to20": "18 à 20 ans",
  "21to25": "21 à 25 ans",
  "26plus": "26 ans et plus",
};

// % du SMIC par âge et année d'exécution du contrat d'apprentissage.
export const APPRENTICE_RATES: Record<AgeBracket, Record<ContractYear, number>> = {
  under18: { 1: 0.27, 2: 0.39, 3: 0.55 },
  "18to20": { 1: 0.43, 2: 0.51, 3: 0.67 },
  "21to25": { 1: 0.53, 2: 0.61, 3: 0.78 },
  "26plus": { 1: 1, 2: 1, 3: 1 },
};

// Contrat de professionnalisation : % du SMIC selon l'âge (moins de 21 ans /
// 21-25 ans) et le niveau de diplôme déjà obtenu (au moins un bac pro ou un
// titre professionnel de niveau bac).
export const PRO_RATES = {
  under21: { belowBacPro: 0.55, bacProOrMore: 0.65 },
  "21to25": { belowBacPro: 0.7, bacProOrMore: 0.8 },
} as const satisfies Record<string, Record<ProLevel, number>>;

// Taux de cotisations salariales d'un non-cadre (hors mutuelle/prévoyance,
// qui varient selon l'entreprise) : vieillesse 7,30 % + retraite
// complémentaire et CEG 4,01 % = ~11,3 % ; + CSG/CRDS 9,7 % sur 98,25 %
// du brut = ~9,5 %. D'où des montants nets toujours présentés comme des
// ESTIMATIONS.
const SOCIAL_CONTRIBUTIONS_RATE = 0.113;
const CSG_CRDS_RATE = 0.095;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEuros(value: number, decimals = 2): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} €`;
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

export type SalaryResult = {
  gross: number;
  netEstimate: number;
  rate: number | null;
  explanation: string;
};

export function apprenticeSalary(age: AgeBracket, year: ContractYear, signedSinceMarch2025: boolean): SalaryResult {
  const rate = APPRENTICE_RATES[age][year];
  const gross = round2(SMIC_MONTHLY_GROSS * rate);

  let deductions: number;
  let explanation: string;
  if (signedSinceMarch2025) {
    const threshold = SMIC_MONTHLY_GROSS * 0.5;
    const taxable = Math.max(0, gross - threshold);
    deductions = taxable * (SOCIAL_CONTRIBUTIONS_RATE + CSG_CRDS_RATE);
    explanation =
      taxable > 0
        ? `Contrat signé depuis le 1er mars 2025 : pas de cotisations jusqu'à ${formatEuros(round2(threshold))} (50 % du SMIC), environ 21 % sur les ${formatEuros(round2(taxable))} au-dessus.`
        : `Contrat signé depuis le 1er mars 2025 : ton salaire reste sous 50 % du SMIC (${formatEuros(round2(threshold))}), donc aucune cotisation salariale, net = brut.`;
  } else {
    const threshold = SMIC_MONTHLY_GROSS * 0.79;
    const taxable = Math.max(0, gross - threshold);
    deductions = taxable * SOCIAL_CONTRIBUTIONS_RATE;
    explanation =
      taxable > 0
        ? `Contrat signé avant le 1er mars 2025 : pas de CSG/CRDS, et cotisations seulement sur la part au-dessus de ${formatEuros(round2(threshold))} (79 % du SMIC).`
        : `Contrat signé avant le 1er mars 2025 : ni cotisations ni CSG/CRDS sous 79 % du SMIC, net = brut.`;
  }

  return { gross, netEstimate: round2(gross - deductions), rate, explanation };
}

export function proContractSalary(age: AgeBracket, level: ProLevel): SalaryResult {
  if (age === "26plus") {
    const gross = SMIC_MONTHLY_GROSS;
    return {
      gross,
      netEstimate: round2(gross * (1 - SOCIAL_CONTRIBUTIONS_RATE - CSG_CRDS_RATE)),
      rate: 1,
      explanation:
        "À partir de 26 ans : au moins le SMIC, ou 85 % du minimum conventionnel de ta branche s'il est plus élevé. Cotisations salariales normales (environ 21 %).",
    };
  }
  const rate = PRO_RATES[age === "21to25" ? "21to25" : "under21"][level];
  const gross = round2(SMIC_MONTHLY_GROSS * rate);
  return {
    gross,
    netEstimate: round2(gross * (1 - SOCIAL_CONTRIBUTIONS_RATE - CSG_CRDS_RATE)),
    rate,
    explanation:
      "Le contrat de professionnalisation n'a pas d'exonération spécifique côté salarié : environ 21 % de cotisations sur tout le brut.",
  };
}

// Heures mensuelles moyennes = heures hebdo × 52 / 12 (151,67 h pour 35 h).
export function internshipGratification(weeklyHours: number): SalaryResult {
  const monthlyHours = (weeklyHours * 52) / 12;
  const gross = round2(STAGE_HOURLY_MIN * monthlyHours);
  return {
    gross,
    netEstimate: gross,
    rate: null,
    explanation: `${STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/h × ${monthlyHours.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} h par mois en moyenne. Au minimum légal, la gratification n'est soumise à aucune cotisation : net = brut. Obligatoire dès que le stage dépasse ${STAGE_MANDATORY_AFTER}.`,
  };
}
