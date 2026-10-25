import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { SITE_URL } from "@/lib/site";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { renderCheckoutRelance, type Target } from "@/lib/campaigns/relanceCheckout";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { parisClock } from "@/lib/campaigns/serieVente";

// Panier abandonné, chaque jour (Nathan, 25/10 : « tous les jours, les
// clients Stripe qui n'ont pas payé, comme dans une boutique : ils ont fait
// un panier mais n'ont pas payé ») : comptes qui ont ouvert le paiement
// Stripe ces 7 derniers jours sans payer. Un email par jour, 5 au plus par
// compte ; la relance s'arrête d'elle-même quand il paie ou que sa dernière
// tentative a plus de 7 jours. Même email chaque jour (« Ton passage Premium
// n'est pas terminé »), à l'adresse de son compte Stageio.
// Le compte Stripe est partagé avec d'autres sites : seules les sessions
// qui reviennent sur stageio.fr ET rattachées à un compte Stageio comptent ;
// jamais un client d'un autre site.
// Exclus : désabonnés des emails, Premium ou ayant déjà payé, recherche
// terminée, comptes admin, paiement ouvert il y a moins d'une heure (la
// relance « Tu y étais presque » est en cours), et ceux qui ont déjà reçu un
// email de la série Premium aujourd'hui (jamais deux relances le même jour).

export const CHECKOUT_DAILY_MAX = 5;
const WINDOW_MS = 7 * 86_400_000;
const RECENT_MS = 60 * 60 * 1000;
const TAG = "relance_checkout_quotidienne";

export type DailyCheckoutResult =
  | { kind: "no_sender" }
  | { kind: "sent"; sessions: number; candidates: number; sent: number; failures: string[] };

type Session = { userId: string; created: number; status: Stripe.Checkout.Session.Status | null; paid: boolean };

/** Comptes Stageio à relancer d'après les sessions Stripe (pur, testable). */
export function abandonedUsers(sessions: Session[], now: number): string[] {
  const lastOpened = new Map<string, number>();
  const paid = new Set<string>();
  for (const s of sessions) {
    if (s.status === "complete" || s.paid) paid.add(s.userId);
    lastOpened.set(s.userId, Math.max(lastOpened.get(s.userId) ?? 0, s.created));
  }
  return [...lastOpened].filter(([id, at]) => !paid.has(id) && now - at >= RECENT_MS && now - at <= WINDOW_MS).map(([id]) => id);
}

export async function sendDailyCheckoutRelance(now: number = Date.now()): Promise<DailyCheckoutResult> {
  const from = campaignSender();
  if (!from) return { kind: "no_sender" };

  const sessions: Session[] = [];
  for await (const s of getStripeClient().checkout.sessions.list({ created: { gte: Math.floor((now - WINDOW_MS) / 1000) }, limit: 100 })) {
    const session = s as Stripe.Checkout.Session;
    if (!session.success_url?.startsWith(SITE_URL) || !session.client_reference_id) continue;
    sessions.push({ userId: session.client_reference_id, created: session.created * 1000, status: session.status, paid: session.payment_status === "paid" });
  }
  const userIds = abandonedUsers(sessions, now);

  const db = createAdminClient();
  const midnight = new Date(parisClock(now).midnight).toISOString();
  const targets: Target[] = [];
  for (let i = 0; i < userIds.length; i += 200) {
    const ids = userIds.slice(i, i + 200);
    const [{ data: profiles, error }, { data: history, error: historyError }] = await Promise.all([
      db
        .from("profiles")
        .select("id, email, full_name, subscription_status, current_period_end, total_paid_cents, notify_new_offers, search_completed_at")
        .in("id", ids),
      db.from("user_events").select("user_id, event_type, created_at").in("event_type", [CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT]).in("user_id", ids).limit(5000),
    ]);
    if (error || historyError) throw new Error((error ?? historyError)!.message);
    const count = new Map<string, number>();
    const today = new Set<string>();
    for (const e of history ?? []) {
      if (e.event_type === CHECKOUT_DAILY_EVENT) count.set(e.user_id, (count.get(e.user_id) ?? 0) + 1);
      if (e.created_at >= midnight) today.add(e.user_id);
    }
    for (const p of profiles ?? []) {
      if (!p.email || isAdminEmail(p.email) || today.has(p.id) || (count.get(p.id) ?? 0) >= CHECKOUT_DAILY_MAX) continue;
      if (p.notify_new_offers === false || p.search_completed_at) continue;
      if (isPremium(p) || (p.total_paid_cents ?? 0) > 0) continue;
      targets.push({ id: p.id, email: p.email, full_name: p.full_name });
    }
  }

  // Chaque compte noté avant l'envoi, dé-noté si Resend refuse : jamais deux
  // fois le même jour.
  const resend = getResendClient();
  const day = midnight.slice(0, 10);
  const failures: string[] = [];
  let sent = 0;
  for (let i = 0; i < targets.length; i += 100) {
    const chunk = targets.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((p) => ({ user_id: p.id, event_type: CHECKOUT_DAILY_EVENT, metadata: { day } })))
      .select("id, user_id");
    if (reserveError || !reserved) {
      failures.push(`Base indisponible, rien envoyé : ${reserveError?.message ?? "réponse vide"}`);
      break;
    }
    const reservedIdByUser = new Map(reserved.map((r) => [r.user_id, r.id]));
    const release = async (ids: string[]) => {
      const eventIds = ids.map((u) => reservedIdByUser.get(u)).filter((id): id is string => Boolean(id));
      if (eventIds.length > 0) await db.from("user_events").delete().in("id", eventIds);
    };
    const { data, error } = await resend.batch.send(
      chunk.map((p) => ({
        from,
        to: p.email,
        ...renderCheckoutRelance(p),
        headers: unsubscribeHeaders(p.id),
        tags: [{ name: "campaign", value: TAG }],
      })),
      { batchValidation: "permissive", idempotencyKey: `${TAG}-${day}-${chunk[0].id}-${chunk[chunk.length - 1].id}` },
    );
    if (error || !data) {
      await release(chunk.map((p) => p.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }
    const rejected = (data.errors ?? []).map((e) => chunk[e.index]).filter(Boolean);
    await release(rejected.map((p) => p.id));
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.email}: ${e.message}`);
    sent += chunk.length - rejected.length;
  }

  return { kind: "sent", sessions: sessions.length, candidates: targets.length, sent, failures };
}
