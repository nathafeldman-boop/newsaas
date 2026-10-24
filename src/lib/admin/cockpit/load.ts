import { getStripeSnapshot } from "@/lib/admin/cockpit/stripeSnapshot";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";

/** Heure de calcul de la page (hors rendu des composants). */
export function nowMs(): number {
  return Date.now();
}

/** Instantané Stripe, ou le message d'erreur à afficher à la place des chiffres. */
export async function loadSnapshot(): Promise<{ snap: StripeSnapshot | null; error: string | null }> {
  try {
    return { snap: await getStripeSnapshot(), error: null };
  } catch (err) {
    console.error("cockpit: lecture Stripe en échec", err);
    return { snap: null, error: err instanceof Error ? err.message : String(err) };
  }
}
