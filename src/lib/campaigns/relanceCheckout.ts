import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { isAdminEmail } from "@/lib/admin/assertAdmin";
import { isPremium } from "@/lib/subscription/isPremium";
import { GUARANTEE_MONTHS } from "@/lib/premium/guaranteeTerms";
import { SITE_URL } from "@/lib/site";
import { campaignSender } from "@/lib/campaigns/sendBatch";

// Relance ponctuelle du 23/10 (Nathan : « tous ceux qui ont ouvert le
// checkout et qui n'ont pas payé, aujourd'hui, hier, avant-hier,
// avant-avant-hier ») : sessions Stripe de Stageio ouvertes depuis le 20/10
// à minuit (heure de Paris), sans aucun paiement de la même personne depuis.
// Un email par compte, noté dans user_events (jamais deux fois). Exclus :
// désabonnés, Premium ou ayant déjà payé, recherche terminée, comptes admin,
// et ceux qui ont ouvert le paiement il y a moins d'une heure (leur relance
// « Tu y étais presque » est en cours). Le compte Stripe est partagé avec
// d'autres sites : seules les sessions qui reviennent sur stageio.fr comptent.
// Pas de prix ni de remise : ils dépendent du moment (prix de bienvenue).

export const CHECKOUT_RELANCE_EVENT = "email_relance_checkout_2026_10_23";
const CHECKOUT_RELANCE_TAG = "relance_checkout_2026_10_23";
const SINCE = Date.parse("2026-10-19T22:00:00Z");
const RECENT_MS = 60 * 60 * 1000;

type Target = { id: string; email: string; full_name: string | null };

export type CheckoutRelanceResult =
  | { kind: "no_sender" }
  | { kind: "sent"; sessions: number; candidates: number; sent: number; failures: string[] };

function render(p: Target) {
  const first = p.full_name?.trim().split(/\s+/)[0] ?? "";
  const name = first && first.length <= 30 ? first : null;
  const url = `${SITE_URL}/premium?utm_source=email&utm_medium=relance&utm_campaign=checkout-abandonne`;
  const benefits = [
    "Toutes les offres en clair : entreprise, analyse, description",
    "Ta lettre de motivation sur mesure en quelques secondes, pour chaque offre",
    "Likes, favoris et candidatures illimités",
    `La garantie : pas d'entretien au bout de ${GUARANTEE_MONTHS} mois de Premium ? On te rembourse (conditions sur la page Premium)`,
  ];
  const greeting = name ? `Salut ${name},` : "Salut,";
  const intro =
    "Tu as commencé à passer Premium sur Stageio ces derniers jours, mais le paiement n'a pas été finalisé : rien n'a été débité.";
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return {
    subject: name ? `${name}, ton passage Premium n'est pas terminé` : "Ton passage Premium n'est pas terminé",
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escape(greeting)}</p>
<p>${intro}</p>
<p style="margin-bottom:4px">Ce qui t'attend :</p>
<ul style="margin-top:0;padding-left:20px">
${benefits.map((b) => `<li style="margin-bottom:6px">${b}</li>`).join("\n")}
</ul>
<p style="margin:24px 0"><a href="${url}" style="background:#0c7a44;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Terminer mon passage Premium</a></p>
<p>Bonne recherche,<br>Nathan, de Stageio</p>
${unsubscribeFooterHtml(p.id)}
</div>`,
    text: [
      greeting,
      "",
      intro,
      "",
      "Ce qui t'attend :",
      ...benefits.map((b) => `- ${b}`),
      "",
      `Terminer mon passage Premium : ${url}`,
      "",
      "Bonne recherche,",
      "Nathan, de Stageio",
    ].join("\n"),
  };
}

export async function sendCheckoutRelance(now: number = Date.now()): Promise<CheckoutRelanceResult> {
  const from = campaignSender();
  if (!from) return { kind: "no_sender" };

  // Dernière ouverture du paiement par compte, et comptes ayant payé.
  const lastOpened = new Map<string, number>();
  const paid = new Set<string>();
  let sessions = 0;
  for await (const s of getStripeClient().checkout.sessions.list({ created: { gte: Math.floor(SINCE / 1000) }, limit: 100 })) {
    const session = s as Stripe.Checkout.Session;
    if (!session.success_url?.startsWith(SITE_URL) || !session.client_reference_id) continue;
    sessions++;
    const userId = session.client_reference_id;
    if (session.status === "complete" || session.payment_status === "paid") paid.add(userId);
    lastOpened.set(userId, Math.max(lastOpened.get(userId) ?? 0, session.created * 1000));
  }
  const userIds = [...lastOpened]
    .filter(([id, at]) => !paid.has(id) && now - at >= RECENT_MS)
    .map(([id]) => id);

  const db = createAdminClient();
  const targets: Target[] = [];
  for (let i = 0; i < userIds.length; i += 200) {
    const ids = userIds.slice(i, i + 200);
    const [{ data: profiles, error }, { data: already, error: sentError }] = await Promise.all([
      db
        .from("profiles")
        .select("id, email, full_name, subscription_status, current_period_end, total_paid_cents, notify_new_offers, search_completed_at")
        .in("id", ids),
      db.from("user_events").select("user_id").eq("event_type", CHECKOUT_RELANCE_EVENT).in("user_id", ids),
    ]);
    if (error || sentError) throw new Error((error ?? sentError)!.message);
    const done = new Set((already ?? []).map((e) => e.user_id));
    for (const p of profiles ?? []) {
      if (!p.email || isAdminEmail(p.email) || done.has(p.id)) continue;
      if (p.notify_new_offers === false || p.search_completed_at) continue;
      if (isPremium(p) || (p.total_paid_cents ?? 0) > 0) continue;
      targets.push({ id: p.id, email: p.email, full_name: p.full_name });
    }
  }

  // Même principe que les campagnes : chaque compte noté avant l'envoi,
  // dé-noté si Resend refuse ; personne ne reçoit l'email deux fois.
  const resend = getResendClient();
  const failures: string[] = [];
  let sent = 0;
  for (let i = 0; i < targets.length; i += 100) {
    const chunk = targets.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((p) => ({ user_id: p.id, event_type: CHECKOUT_RELANCE_EVENT, metadata: {} })))
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
        ...render(p),
        headers: unsubscribeHeaders(p.id),
        tags: [{ name: "campaign", value: CHECKOUT_RELANCE_TAG }],
      })),
      { batchValidation: "permissive", idempotencyKey: `${CHECKOUT_RELANCE_TAG}-${chunk[0].id}-${chunk[chunk.length - 1].id}` },
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

  return { kind: "sent", sessions, candidates: targets.length, sent, failures };
}
