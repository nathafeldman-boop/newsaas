import { PLAN_PRICES, PRICE_TEST_START } from "@/lib/pricing/plans";

// Date approximative de mise en ligne de la hausse de +30 % (Nathan, 25/11) : à corriger au déploiement.
export const PRICE_RAISE_30_START = Date.parse("2026-11-25T17:52:00Z");
// Paywall trimestriel du 26/11 : date approximative, à corriger au déploiement.
export const QUARTERLY_START = Date.parse("2026-11-26T18:00:00Z");

// Tests de prix (29/10, Nathan : « on va tester ça pendant 2 jours, et si
// c'est pas concluant je remettrai à la normale [...] tu vas mettre un
// onglet test, et à chaque test [...] tu mettras les stats, si c'est
// concluant ou pas »). Un test par entrée, le plus récent en premier. Le
// test est comparé aux mêmes heures juste avant son début (même durée).
// Fin : null tant que les prix du test sont en place.

export type PriceTest = {
  id: string;
  title: string;
  start: number;
  /** Durée prévue avant de trancher. */
  plannedMs: number;
  /** Retour aux anciens prix ou décision de garder ; null tant que le test tourne. */
  end: number | null;
  changes: { label: string; before: string; after: string }[];
};

export const PRICE_TESTS: PriceTest[] = [
  {
    id: "prix-2026-11-26",
    title: "Trimestriel à 22 €, à vie à 50 €, plus d'Auto, +60 % après le chrono",
    start: QUARTERLY_START,
    plannedMs: 7 * 24 * 60 * 60 * 1000,
    end: null,
    changes: [
      { label: "Premium mensuel", before: "12,99 € puis 22,09 €", after: `${PLAN_PRICES.monthly.welcome} puis ${PLAN_PRICES.monthly.regular}` },
      { label: "Premium trimestriel (nouveau)", before: "—", after: `${PLAN_PRICES.quarterly.welcome} puis ${PLAN_PRICES.quarterly.regular} les 3 mois` },
      { label: "Premium à vie", before: "52 € puis 88,40 €", after: `${PLAN_PRICES.lifetime.welcome} puis ${PLAN_PRICES.lifetime.regular}` },
      { label: "Stageio Auto", before: "23,39 €/mois ou 104 € à vie", after: "retirée de la vente" },
    ],
  },
  {
    id: "prix-2026-11-25",
    title: "Prix +30 % : Premium à 12,99 €, Auto à 23,39 € (bienvenue), toujours +70 % ensuite",
    start: PRICE_RAISE_30_START,
    plannedMs: 7 * 24 * 60 * 60 * 1000,
    end: QUARTERLY_START,
    changes: [
      { label: "Premium mensuel, prix de bienvenue (10 min)", before: "9,99 €", after: "12,99 €" },
      { label: "Premium mensuel, ensuite", before: "16,99 €", after: "22,09 €" },
      { label: "Premium à vie", before: "40 € puis 68 €", after: "52 € puis 88,40 €" },
      { label: "Stageio Auto mensuel", before: "17,99 € puis 30,59 €", after: "23,39 € puis 39,77 €" },
      { label: "Stageio Auto à vie", before: "80 € puis 136 €", after: "104 € puis 176,80 €" },
    ],
  },
  {
    id: "prix-2026-10-29",
    title: "Prix +25 % : Premium à 9,99 €, Auto avec prix de bienvenue",
    start: PRICE_TEST_START,
    plannedMs: 48 * 60 * 60 * 1000,
    end: Date.parse("2026-11-21T00:00:00Z"), // prix gardés, puis +70 % le 21/11,
    changes: [
      { label: "Premium mensuel, prix de bienvenue (10 min)", before: "7,99 €", after: "9,99 €" },
      { label: "Premium mensuel, ensuite", before: "12,79 €", after: "15,99 €" },
      { label: "Premium à vie", before: "40 € puis 63,99 €", after: "40 € puis 63,99 €" },
      { label: "Stageio Auto mensuel", before: "17,99 €", after: "17,99 € puis 28,79 €" },
      { label: "Stageio Auto à vie", before: "80 €", after: "80 € puis 128 €" },
    ],
  },
];
