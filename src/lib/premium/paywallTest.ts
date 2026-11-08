import type { ContractType } from "@/types/database";
import { contractNouns } from "@/lib/offers/contractLabels";

// Test du paywall (Nathan, « lance » du 8/11) : 501 comptes ont vu le
// paywall en 7 jours, 38 ont ouvert le paiement (7,6 %), 27 ont payé. La
// fuite est avant le clic. Moitié des comptes : onglet « À vie » ouvert par
// défaut (paiement unique, mêmes prix, rien de barré) au lieu de
// « Mensuel ». Tirage fixe par compte : la même personne voit toujours la
// même version. Résultats dans l'admin, onglet Tests.

export const PAYWALL_TEST = { name: "paywall-a-vie-1", startIso: "2026-11-08T00:00:00Z" } as const;

export type PaywallVariant = "mensuel" | "a_vie";

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function paywallVariant(userId: string): PaywallVariant {
  return hash(`${PAYWALL_TEST.name}:${userId}`) % 2 === 0 ? "mensuel" : "a_vie";
}

// Titre du paywall selon ce que la personne cherche (« Trouve ton CDI plus
// efficacement. ») : il disait « ton alternance » à tout le monde.
export function paywallHeadline(lookingFor: ContractType[] | null | undefined): string {
  const goal = contractNouns(lookingFor ?? [], "ton");
  return `Trouve ${goal} plus efficacement.`;
}
