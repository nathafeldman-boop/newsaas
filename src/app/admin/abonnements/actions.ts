"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { loadSnapshot } from "@/lib/admin/cockpit/load";
import { DAY_MS } from "@/lib/admin/cockpit/metrics";
import { scheduledCandidates, winbackCandidates } from "@/lib/churn/candidates";
import { WINBACK_EVENT, sendScheduledMessageOnce, sendWinbackMessageOnce } from "@/lib/churn/outreach";
import { KEEP_PREMIUM_EVENT } from "@/lib/stripe/keepPremium";
import { createAdminClient } from "@/lib/supabase/admin";

// Messages aux abonnés qui partent (25/10), déclenchés par Nathan depuis
// « Abonnements et churn » pour ceux d'avant l'envoi automatique : jamais
// d'envoi sans son clic. Une seule fois par abonnement ou par compte.

const pause = () => new Promise((resolve) => setTimeout(resolve, 600)); // Resend : 2 envois par seconde au plus.
// La page admin a 60 s par action : on s'arrête avant, le bouton reste
// affiché avec le nombre restant (déjà prévenus jamais renvoyés).
const BUDGET_MS = 40_000;

export async function sendKeepPremiumRemindersAction(): Promise<void> {
  await assertAdminSession();
  const { snap } = await loadSnapshot();
  if (!snap) redirect("/admin/abonnements?statut=programme&rappel=erreur");

  const scheduled = scheduledCandidates(snap, Date.now());
  const db = createAdminClient();
  const { data: profiles } = await db.from("profiles").select("id, email, full_name, stripe_customer_id").in("id", [...new Set(scheduled.map((s) => s.userId!))]);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const started = Date.now();
  let sent = 0;
  let skipped = 0;
  for (const s of scheduled) {
    if (Date.now() - started > BUDGET_MS) break;
    const p = byId.get(s.userId!);
    try {
      if (p && (await sendScheduledMessageOnce(db, p, s.customer)) === "sent") {
        sent++;
        await pause();
      } else skipped++;
    } catch (err) {
      console.error("sendKeepPremiumRemindersAction: envoi en échec", err, { userId: s.userId });
      skipped++;
    }
  }
  redirect(`/admin/abonnements?statut=programme&rappel=${sent}-${skipped}`);
}

export async function sendWinbackMessagesAction(): Promise<void> {
  await assertAdminSession();
  const { snap } = await loadSnapshot();
  if (!snap) redirect("/admin/abonnements?statut=termine&retour=erreur");

  const now = Date.now();
  const candidates = winbackCandidates(snap, now);
  const ids = candidates.map((c) => c.userId);
  const db = createAdminClient();
  const [{ data: profiles }, { data: found }, { data: recentKeep }] = await Promise.all([
    db.from("profiles").select("id, email, full_name, stripe_customer_id, notify_new_offers").in("id", ids),
    db.from("subscription_cancellations").select("user_id").in("user_id", ids).ilike("reason", "%trouvé%"),
    db.from("user_events").select("user_id").eq("event_type", KEEP_PREMIUM_EVENT).in("user_id", ids).gte("created_at", new Date(now - 30 * DAY_MS).toISOString()),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  // Déjà trouvé son alternance, ou déjà reçu le message à sa résiliation : on ne relance pas.
  const exclude = new Set([...(found ?? []).map((r) => r.user_id), ...(recentKeep ?? []).map((r) => r.user_id)]);

  const started = Date.now();
  let sent = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (Date.now() - started > BUDGET_MS) break;
    const p = byId.get(c.userId);
    // Désinscrit des e-mails (lien « Ne plus recevoir ces emails »), a trouvé,
    // ou vient de recevoir le message de résiliation : rien, et noté pour ne
    // plus le compter dans les envois restants.
    if (!p || p.notify_new_offers === false || exclude.has(c.userId)) {
      if (p) await db.from("user_events").insert({ user_id: p.id, event_type: WINBACK_EVENT, metadata: { subscriptionId: c.subscriptionId, skipped: true } });
      skipped++;
      continue;
    }
    try {
      if ((await sendWinbackMessageOnce(db, p, c.endedAt, c.subscriptionId)) === "sent") {
        sent++;
        await pause();
      } else skipped++;
    } catch (err) {
      console.error("sendWinbackMessagesAction: envoi en échec", err, { userId: c.userId });
      skipped++;
    }
  }
  redirect(`/admin/abonnements?statut=termine&retour=${sent}-${skipped}`);
}
