"use server";

import { updateTag } from "next/cache";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { COCKPIT_STRIPE_TAG } from "@/lib/admin/cockpit/stripeSnapshot";

// Bouton « Actualiser » du cockpit : relit Stripe au prochain affichage au
// lieu d'attendre la fin des 30 min de cache.
export async function refreshCockpitAction(): Promise<void> {
  await assertAdminSession();
  updateTag(COCKPIT_STRIPE_TAG);
}
