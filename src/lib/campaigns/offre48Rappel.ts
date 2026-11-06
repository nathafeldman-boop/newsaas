import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { EMAIL_OFFER } from "@/lib/pricing/plans";
import { OFFER48_CAMPAIGN_EVENT, PROFILE_COLUMNS, baseExclusion, type CampaignProfile } from "@/lib/campaigns/relanceOffres";
import { renderOffer48Email } from "@/lib/campaigns/offre48";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { HOURLY_SERIES_GUARD_MS } from "@/lib/campaigns/salvesHoraires";

// Rappel « lien direct » de l'offre de l'email (Nathan, 6/11 : « 0 paiement
// aujourd'hui, vite fais en sorte que ça change »). Les 400 emails du 5/11
// (Premium à vie 30 €, Auto à vie 63,23 €) ont eu 4 clics, tous tombés sur
// la page de connexion, et aucun destinataire n'a atteint le paiement : leur
// lien ne portait pas encore de signature (lib/premium/goLink.ts). Ce rappel,
// une seule fois par compte, renvoie la même offre avec un lien signé qui
// ouvre directement la page de paiement, sans connexion.
// - Seulement ceux dont l'offre tient encore : lien de l'email d'origine
//   valable au moins 4 h de plus (EMAIL_OFFER.linkMs après leur envoi) et
//   jamais venus sur la page Premium depuis (leurs 20 minutes ne sont pas
//   ouvertes : ils ont toujours droit aux 30 €).
// - Mêmes garde-fous que les campagnes (désabonnés, payants, admins…), et
//   personne dans les 3 h qui suivent un email de la série Premium ou une
//   relance de paiement (repris au passage suivant).
// - Aucune nouvelle échéance : l'email donne la fin du lien d'origine.

export const OFFER48_REMINDER_EVENT = "email_offre_48h_rappel_2026_11";
export const OFFER48_REMINDER_TAG = "offre_48h_rappel_2026_11";
export const OFFER48_REMINDER_START = Date.parse("2026-11-06T13:30:00Z");
export const OFFER48_REMINDER_END = Date.parse("2026-11-07T12:55:00Z");
export const OFFER48_REMINDER_MIN_LEFT_MS = 4 * 3_600_000;

export type ReminderCandidate = { profile: CampaignProfile; sentAt: number; viewedSince: boolean };
export type ReminderExclusion = ReturnType<typeof baseExclusion> | "lien_bientot_fini" | "deja_venu" | "serie_recente";

export function reminderExclusion(c: ReminderCandidate, reminded: Set<string>, recentSeries: Set<string>, now: number): ReminderExclusion {
  const base = baseExclusion(c.profile, reminded, now);
  if (base) return base;
  if (c.sentAt + EMAIL_OFFER.linkMs - now < OFFER48_REMINDER_MIN_LEFT_MS) return "lien_bientot_fini";
  if (c.viewedSince) return "deja_venu";
  if (recentSeries.has(c.profile.id)) return "serie_recente";
  return null;
}

export function inReminderWindow(now: number): boolean {
  return now >= OFFER48_REMINDER_START && now < OFFER48_REMINDER_END;
}

export type ReminderResult =
  | { kind: "skipped"; reason: "hors_fenetre" | "no_sender" | "base_illisible" }
  | { kind: "sent"; sent: number; waiting: number; excluded: Partial<Record<NonNullable<ReminderExclusion>, number>>; failures: string[] };

export async function sendOffer48Reminders(now: number = Date.now()): Promise<ReminderResult> {
  if (!inReminderWindow(now)) return { kind: "skipped", reason: "hors_fenetre" };
  const from = campaignSender();
  if (!from) return { kind: "skipped", reason: "no_sender" };
  const db = createAdminClient();

  const events = (types: string[], since?: number) =>
    fetchAllRowsByIdCursor<{ id: string; user_id: string; created_at: string }>((afterId, limit) => {
      let q = db.from("user_events").select("id, user_id, created_at").in("event_type", types);
      if (since !== undefined) q = q.gte("created_at", new Date(since).toISOString());
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit);
    });

  let candidates: ReminderCandidate[];
  let reminded: Set<string>;
  let recentSeries: Set<string>;
  try {
    const [offers, reminders, series] = await Promise.all([
      events([OFFER48_CAMPAIGN_EVENT]),
      events([OFFER48_REMINDER_EVENT]),
      events([SALES_SERIES_EVENT, CHECKOUT_DAILY_EVENT], now - HOURLY_SERIES_GUARD_MS),
    ]);
    const sentAt = new Map<string, number>();
    for (const e of offers) {
      const t = Date.parse(e.created_at);
      if (!sentAt.has(e.user_id) || t < sentAt.get(e.user_id)!) sentAt.set(e.user_id, t);
    }
    if (sentAt.size === 0) return { kind: "sent", sent: 0, waiting: 0, excluded: {}, failures: [] };
    const earliest = Math.min(...sentAt.values());
    const views = await events(["paywall_viewed"], earliest);
    const viewed = new Set(views.filter((v) => sentAt.has(v.user_id) && Date.parse(v.created_at) >= sentAt.get(v.user_id)!).map((v) => v.user_id));
    const ids = [...sentAt.keys()];
    const profiles: CampaignProfile[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).in("id", ids.slice(i, i + 100));
      if (error) throw new Error(error.message);
      profiles.push(...((data ?? []) as unknown as CampaignProfile[]));
    }
    candidates = profiles.map((profile) => ({ profile, sentAt: sentAt.get(profile.id)!, viewedSince: viewed.has(profile.id) }));
    reminded = new Set(reminders.map((r) => r.user_id));
    recentSeries = new Set(series.map((r) => r.user_id));
  } catch (e) {
    console.error("offre-48h-rappel: base illisible, rien envoyé", e instanceof Error ? e.message : e);
    return { kind: "skipped", reason: "base_illisible" };
  }

  const excluded: Partial<Record<NonNullable<ReminderExclusion>, number>> = {};
  const batch: ReminderCandidate[] = [];
  for (const c of candidates) {
    const reason = reminderExclusion(c, reminded, recentSeries, now);
    if (reason) excluded[reason] = (excluded[reason] ?? 0) + 1;
    else batch.push(c);
  }

  // Même principe que sendNextCampaignBatch : chaque compte est noté avant
  // l'envoi, dé-noté si Resend refuse ; clé d'idempotence par lot.
  const resend = getResendClient();
  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((c) => ({ user_id: c.profile.id, event_type: OFFER48_REMINDER_EVENT, metadata: {} })))
      .select("id, user_id");
    if (reserveError || !reserved) {
      failures.push(`Base indisponible, rien envoyé : ${reserveError?.message ?? "réponse vide"}`);
      break;
    }
    const reservedIdByUser = new Map(reserved.map((r) => [r.user_id, r.id]));
    const release = async (userIds: string[]) => {
      const rows = userIds.map((u) => reservedIdByUser.get(u)).filter((id): id is string => Boolean(id));
      if (rows.length === 0) return;
      const { error } = await db.from("user_events").delete().in("id", rows);
      if (error) console.error("offre-48h-rappel: dé-notage en échec (ces comptes ne seront pas relancés)", error.message);
    };
    const payload = chunk.map((c) => {
      const email = renderOffer48Email(c.profile, now, { sentAt: c.sentAt });
      return {
        from,
        to: c.profile.email as string,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: unsubscribeHeaders(c.profile.id),
        tags: [{ name: "campaign", value: OFFER48_REMINDER_TAG }],
      };
    });
    const { data, error } = await resend.batch.send(payload, {
      batchValidation: "permissive",
      idempotencyKey: `${OFFER48_REMINDER_TAG}-${chunk[0].profile.id}-${chunk[chunk.length - 1].profile.id}`,
    });
    if (error || !data) {
      await release(chunk.map((c) => c.profile.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }
    const rejected = (data.errors ?? []).map((e) => chunk[e.index]).filter(Boolean);
    await release(rejected.map((c) => c.profile.id));
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.profile.email}: ${e.message}`);
    sent += chunk.length - rejected.length;
  }

  return { kind: "sent", sent, waiting: excluded.serie_recente ?? 0, excluded, failures };
}
