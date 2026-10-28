import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { studentSender } from "@/lib/inbox/sender";
import { isInboxAddress } from "@/lib/inbox/address";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { FOLLOW_UP_DAYS, isFollowUpDue } from "@/lib/applications/status";
import { followUpMessage } from "@/lib/applications/followUpMessage";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { SITE_URL } from "@/lib/site";
import type { Application, Offer, Profile } from "@/types/database";

// Relances des candidatures sans réponse (28/10, Nathan : « qu'ils aient
// juste besoin de postuler ») à la date de relance du suivi (7 jours après
// l'envoi par défaut, comme annoncé sur le paywall) :
// - Stageio Auto, candidature partie par email depuis son adresse Stageio :
//   la relance part toute seule, au recruteur, depuis la même adresse, une
//   seule fois, si aucune réponse n'est arrivée ;
// - sinon (Premium, ou candidature passée par La bonne alternance) : un
//   email à l'étudiant avec ses candidatures à relancer et le message prêt
//   dans Mes candidatures. Une fois par candidature.

type Admin = ReturnType<typeof createAdminClient>;

export const AUTO_FOLLOW_UP_EVENT = "application_follow_up_sent";
export const FOLLOW_UP_REMINDER_EVENT = "follow_up_reminder_sent";
const MAX_AUTO_PER_RUN = 150;
const MAX_REMINDERS_PER_RUN = 300;

type DueApp = Application & { offer: Pick<Offer, "id" | "title" | "company" | "contract_type"> };

export function renderFollowUpReminder(profile: Pick<Profile, "id" | "full_name">, apps: Pick<DueApp, "offer">[]): { subject: string; html: string; text: string } {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const n = apps.length;
  const url = `${SITE_URL}/mes-candidatures?utm_source=email&utm_medium=abonnes&utm_campaign=relances`;
  const subject = n === 1 ? `Relance ta candidature chez ${apps[0].offer.company} (message prêt)` : `${n} candidatures à relancer : ton message est prêt`;
  const items = apps
    .slice(0, 8)
    .map((a) => `<li style="margin-bottom:6px"><strong>${escapeHtml(a.offer.title)}</strong> · ${escapeHtml(a.offer.company)}</li>`)
    .join("");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${first ? `Salut ${escapeHtml(first)},` : "Salut,"}</p>
<p>${n === 1 ? "Ta candidature n'a pas encore eu de réponse" : `${n} de tes candidatures n'ont pas encore eu de réponse`} depuis ${FOLLOW_UP_DAYS} jours. C'est le bon moment pour relancer : une relance courte et polie montre ta motivation, et beaucoup de recruteurs répondent à ce moment-là.</p>
<ul style="padding-left:20px">${items}</ul>
<p>Ton message de relance est déjà écrit pour chacune, il ne reste qu'à l'envoyer.</p>
<p><a href="${url}" style="display:inline-block;background:#0c7a44;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Relancer mes candidatures →</a></p>
<p>Bonne recherche,<br>Nathan, de Stageio</p>
${unsubscribeFooterHtml(profile.id)}
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    `${n === 1 ? "Ta candidature n'a pas encore eu de réponse" : `${n} de tes candidatures n'ont pas encore eu de réponse`} depuis ${FOLLOW_UP_DAYS} jours. C'est le bon moment pour relancer.`,
    "",
    ...apps.slice(0, 8).map((a) => `- ${a.offer.title} · ${a.offer.company}`),
    "",
    `Ton message de relance est déjà écrit : ${url}`,
    "",
    "Bonne recherche,",
    "Nathan, de Stageio",
  ].join("\n");
  return { subject, html, text };
}

export async function runFollowUps(admin: Admin, subscribers: Profile[], now: number = Date.now()) {
  const summary = { due: 0, autoSent: 0, reminders: 0, failures: [] as string[] };
  if (subscribers.length === 0) return summary;
  const byId = new Map(subscribers.map((p) => [p.id, p]));
  const ids = [...byId.keys()];

  // Candidatures envoyées, à leur date de relance.
  const apps: Application[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const rows = await fetchAllRows<Application>((from, to) =>
      admin.from("applications").select("*").in("user_id", ids.slice(i, i + 200)).eq("status", "envoyee").order("id").range(from, to),
    );
    apps.push(...rows.filter((a) => isFollowUpDue(a, now)));
  }
  if (apps.length === 0) return summary;

  // Déjà relancées (automatiquement) ou déjà signalées à l'étudiant.
  const done = new Set<string>();
  const events = await fetchAllRows<{ metadata: Record<string, unknown> | null }>((from, to) =>
    admin
      .from("user_events")
      .select("metadata")
      .in("event_type", [AUTO_FOLLOW_UP_EVENT, FOLLOW_UP_REMINDER_EVENT])
      .in("user_id", [...new Set(apps.map((a) => a.user_id))])
      .order("created_at")
      .range(from, to),
  );
  for (const e of events) {
    const m = e.metadata ?? {};
    if (typeof m.applicationId === "string") done.add(m.applicationId);
    if (Array.isArray(m.applicationIds)) for (const id of m.applicationIds) if (typeof id === "string") done.add(id);
  }

  const offerIds = [...new Set(apps.map((a) => a.offer_id))];
  const offers = new Map<string, DueApp["offer"]>();
  for (let i = 0; i < offerIds.length; i += 200) {
    const { data } = await admin.from("offers").select("id, title, company, contract_type").in("id", offerIds.slice(i, i + 200));
    for (const o of data ?? []) offers.set(o.id, o);
  }
  const due: DueApp[] = apps.filter((a) => !done.has(a.id) && offers.has(a.offer_id)).map((a) => ({ ...a, offer: offers.get(a.offer_id)! }));
  summary.due = due.length;

  const resend = getResendClient();
  const toRemind = new Map<string, DueApp[]>();
  let autoBudget = MAX_AUTO_PER_RUN;

  for (const app of due) {
    const profile = byId.get(app.user_id)!;
    if (isAutoTier(profile) && autoBudget > 0) {
      // Message de la candidature, parti par email depuis l'adresse Stageio de l'étudiant.
      const { data: sent } = await admin
        .from("inbox_messages")
        .select("from_address, to_address, subject, created_at")
        .eq("user_id", app.user_id)
        .eq("offer_id", app.offer_id)
        .eq("direction", "out")
        .order("created_at", { ascending: true })
        .limit(1);
      const original = sent?.[0];
      if (original && original.to_address.includes("@") && isInboxAddress(original.from_address)) {
        const { count: replies } = await admin
          .from("inbox_messages")
          .select("id", { count: "exact", head: true })
          .eq("user_id", app.user_id)
          .eq("offer_id", app.offer_id)
          .eq("direction", "in");
        if ((replies ?? 0) > 0) continue;
        autoBudget--;
        const message = followUpMessage({ title: app.offer.title, company: app.offer.company, contractType: app.offer.contract_type, sentAt: app.sent_at ?? app.applied_at, fullName: profile.full_name });
        const subject = original.subject ? `Re: ${original.subject}` : message.subject;
        const text = `${message.body}\n\n--\nMessage envoyé par ${profile.full_name?.trim() || "le candidat"} via Stageio (stageio.fr). Répondez directement à ce message pour le joindre.`;
        const { error } = await resend.emails.send(
          { ...studentSender(profile.full_name, original.from_address), to: original.to_address, subject, text, tags: [{ name: "campaign", value: "application_follow_up" }] },
          { idempotencyKey: `follow-up-${app.id}` },
        );
        if (error) {
          summary.failures.push(`relance ${app.id} : ${error.message}`);
          continue;
        }
        summary.autoSent++;
        await admin.from("user_events").insert({ user_id: app.user_id, event_type: AUTO_FOLLOW_UP_EVENT, metadata: { applicationId: app.id, offerId: app.offer_id } });
        await admin.from("inbox_messages").insert({
          user_id: app.user_id,
          direction: "out",
          from_address: original.from_address,
          from_name: profile.full_name,
          to_address: original.to_address,
          subject,
          body_text: text,
          offer_id: app.offer_id,
          read_at: new Date(now).toISOString(),
        });
        continue;
      }
    }
    if (profile.notify_new_offers === false) continue;
    const list = toRemind.get(app.user_id) ?? [];
    list.push(app);
    toRemind.set(app.user_id, list);
  }

  const from = campaignSender();
  if (!from) return summary;
  let remindBudget = MAX_REMINDERS_PER_RUN;
  for (const [userId, list] of toRemind) {
    if (remindBudget-- <= 0) break;
    const profile = byId.get(userId)!;
    const { error } = await resend.emails.send(
      { from, to: profile.email as string, ...renderFollowUpReminder(profile, list), headers: unsubscribeHeaders(profile.id), tags: [{ name: "campaign", value: "follow_up_reminder" }] },
      { idempotencyKey: `follow-up-reminder-${userId}-${new Date(now).toISOString().slice(0, 10)}` },
    );
    if (error) {
      summary.failures.push(`rappel ${userId} : ${error.message}`);
      continue;
    }
    summary.reminders++;
    await admin.from("user_events").insert({ user_id: userId, event_type: FOLLOW_UP_REMINDER_EVENT, metadata: { applicationIds: list.map((a) => a.id) } });
  }
  return summary;
}
