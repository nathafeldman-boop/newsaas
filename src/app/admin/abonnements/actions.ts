"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { loadSnapshot } from "@/lib/admin/cockpit/load";
import { activeAt, firstPaidBySub, paidSubs } from "@/lib/admin/cockpit/metrics";
import { notifyKeepPremium } from "@/lib/resend/notifyKeepPremium";
import { KEEP_PREMIUM_EVENT, endDateLabel, findScheduledEnd, priceLabel } from "@/lib/stripe/keepPremium";
import { createAdminClient } from "@/lib/supabase/admin";

// Rappel « Garder mon Premium » (25/10) aux abonnés dont la résiliation est
// programmée. Déclenché par Nathan depuis « Abonnements et churn » : jamais
// d'envoi automatique. Une seule fois par abonnement (événement noté), et
// chaque résiliation est revérifiée dans Stripe juste avant l'envoi.
export async function sendKeepPremiumRemindersAction(): Promise<void> {
  await assertAdminSession();
  const { snap } = await loadSnapshot();
  if (!snap) redirect("/admin/abonnements?statut=programme&rappel=erreur");

  const now = Date.now();
  const scheduled = paidSubs(snap, firstPaidBySub(snap.invoices)).filter(
    (s) => s.userId && activeAt(s, now) && s.status !== "past_due" && s.status !== "unpaid" && (s.cancelAt !== null || s.cancelAtPeriodEnd),
  );
  const db = createAdminClient();
  const userIds = [...new Set(scheduled.map((s) => s.userId!))];
  const [{ data: profiles }, { data: already }] = await Promise.all([
    db.from("profiles").select("id, email, full_name, stripe_customer_id").in("id", userIds),
    db.from("user_events").select("metadata").eq("event_type", KEEP_PREMIUM_EVENT).in("user_id", userIds).limit(2000),
  ]);
  const sentSubs = new Set((already ?? []).map((e) => (e.metadata as { subscriptionId?: string } | null)?.subscriptionId).filter(Boolean));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  let skipped = 0;
  for (const s of scheduled) {
    const p = byId.get(s.userId!);
    if (!p?.email || sentSubs.has(s.id)) {
      skipped++;
      continue;
    }
    try {
      const end = await findScheduledEnd(p.stripe_customer_id ?? s.customer, p.id);
      if (!end || end.endsAt <= now) {
        skipped++;
        continue;
      }
      await notifyKeepPremium(p.email, p.full_name, endDateLabel(end.endsAt), priceLabel(end));
      await db.from("user_events").insert({ user_id: p.id, event_type: KEEP_PREMIUM_EVENT, metadata: { subscriptionId: end.subscriptionId, endsAt: new Date(end.endsAt).toISOString() } });
      sentSubs.add(end.subscriptionId);
      sent++;
      // Resend : 2 envois par seconde au plus.
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      console.error("sendKeepPremiumRemindersAction: envoi en échec", err, { userId: p.id });
      skipped++;
    }
  }
  redirect(`/admin/abonnements?statut=programme&rappel=${sent}-${skipped}`);
}
