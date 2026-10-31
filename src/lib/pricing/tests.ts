import { AUTO_PRICES, PLAN_PRICES, PRICE_TEST_START } from "@/lib/pricing/plans";

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
    id: "prix-2026-10-29",
    title: "Prix +25 % : Premium à 9,99 €, Auto avec prix de bienvenue",
    start: PRICE_TEST_START,
    plannedMs: 48 * 60 * 60 * 1000,
    end: null,
    changes: [
      { label: "Premium mensuel, prix de bienvenue (10 min)", before: "7,99 €", after: PLAN_PRICES.monthly.welcome },
      { label: "Premium mensuel, ensuite", before: "12,79 €", after: PLAN_PRICES.monthly.regular },
      { label: "Premium à vie", before: "39,99 € puis 63,99 €", after: "39,99 € puis 63,99 € (inchangé pendant le test ; 50 € de bienvenue à partir du 31/10)" },
      { label: "Stageio Auto mensuel", before: "17,99 €", after: `${AUTO_PRICES.monthly.welcome} puis ${AUTO_PRICES.monthly.regular}` },
      { label: "Stageio Auto à vie", before: "80 €", after: `${AUTO_PRICES.lifetime.welcome} puis ${AUTO_PRICES.lifetime.regular}` },
    ],
  },
];
