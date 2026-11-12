import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders, unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import { goLink } from "@/lib/premium/goLink";
import { SITE_URL } from "@/lib/site";
import { PLAN_PRICES } from "@/lib/pricing/plans";
import { painCopy } from "@/lib/premium/painCopy";
import {
  CAMPAIGNS,
  PROFILE_COLUMNS,
  baseExclusion,
  escapeHtml,
  firstName,
  loadCatalog,
  pickOffers,
  typePhrase,
  type Catalog,
  type CampaignProfile,
  type RenderedEmail,
} from "@/lib/campaigns/relanceOffres";
import { OFFER48_REMINDER_EVENT } from "@/lib/campaigns/offre48Rappel";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { CHECKOUT_DAILY_EVENT, PRICES_SEEN_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";

// Email « tu as regardé Premium » (Nathan, 7/11 : « si tu voulais qu'on fasse
// 100 euros aujourd'hui juste avec toi », puis « lance »). Ce qui se vend :
// le Premium mensuel à 9,99 € (31 des 40 derniers paiements). Les plus près
// de payer : les comptes qui ont vu la page Premium dans les 7 derniers
// jours sans payer. Une seule fois par compte, le 7/11 à partir de 9 h.
// - D'abord ce qui a de la valeur pour eux : les offres arrivées pour eux
//   depuis leur dernière visite de la page Premium. Puis Premium, avec les
//   vrais prix de bienvenue (9,99 €/mois, 40 € à vie) : l'email est ajouté
//   aux événements qui relancent le prix de bienvenue (lib/pricing/welcome.ts),
//   donc ces prix tiennent 10 minutes à partir du clic, comme l'écrit l'email.
//   Ni prix barré ni « réduction ».
// - Bouton signé du compte (lib/premium/goLink.ts, plan=choix) : la page de
//   paiement s'ouvre sans connexion.
// - Mêmes garde-fous que les campagnes (désabonnés, payants, admins, inscrits
//   depuis moins de 3 jours…) ; pas les destinataires de l'offre du 5/11 (ils
//   ont leur offre à 30 €) ; personne qui a déjà reçu aujourd'hui (depuis
//   minuit à Paris) un autre email de vente (série Premium, relance de
//   paiement, salves, rappel du 5/11). La série Premium et les salves de
//   l'après-midi sautent à leur tour les destinataires de celui-ci : pour eux,
//   cet email remplace celui du jour au lieu de s'y ajouter (ces comptes ont
//   presque tous reçu un email de vente la veille).

// 2e vague le 13/11 (Nathan, 12/11 : « demain c'est minimum 100 € », email
// accepté pour les 814 comptes qui ont vu Premium en 14 jours sans payer).
// Une fois par compte et par vague : « déjà reçu » ne compte que les envois
// depuis PRICES_SEEN_DAY_START (même événement, le prix de bienvenue repart
// toujours au clic).
export const PRICES_SEEN_TAG = "prix_vus_2026_11_13";
// 9 h à midi, heure de Paris (heure d'hiver : UTC+1).
export const PRICES_SEEN_START = Date.parse("2026-11-13T08:00:00Z");
export const PRICES_SEEN_END = Date.parse("2026-11-13T11:00:00Z");
export const PRICES_SEEN_LOOKBACK_MS = 14 * 86_400_000;
// Minuit à Paris le 13/11 (heure d'hiver).
export const PRICES_SEEN_DAY_START = Date.parse("2026-11-12T23:00:00Z");
// Plafond par passage (réputation du domaine) : l'audience attendue est de
// quelques centaines de comptes.
export const PRICES_SEEN_MAX_PER_RUN = 900;
export const PRICES_SEEN_UTM = "utm_source=email&utm_medium=relance&utm_campaign=prix-vus-1311";
const OFFERS_SHOWN = 3;

export type PricesSeenCandidate = { profile: CampaignProfile; lastViewAt: number };
export type PricesSeenExclusion = ReturnType<typeof baseExclusion> | "offre_du_5_11" | "email_aujourdhui";

export function pricesSeenExclusion(
  c: PricesSeenCandidate,
  sent: Set<string>,
  offer48: Set<string>,
  recentEmail: Set<string>,
  now: number,
): PricesSeenExclusion {
  const base = baseExclusion(c.profile, sent, now);
  if (base) return base;
  if (offer48.has(c.profile.id)) return "offre_du_5_11";
  if (recentEmail.has(c.profile.id)) return "email_aujourdhui";
  return null;
}

export function inPricesSeenWindow(now: number): boolean {
  return now >= PRICES_SEEN_START && now < PRICES_SEEN_END;
}

// « Chargé de recrutement (H/F) » → « Chargé de recrutement ».
function cleanTitle(title: string): string {
  return title.replace(/\s*[([]\s*(h\s*\/\s*f|f\s*\/\s*h)\s*[)\]]\s*/gi, " ").trim();
}

function cityOf(location: string): string {
  return location.replace(/^\d{2,3}\s*-\s*/, "").trim();
}

export function renderPricesSeenEmail(p: CampaignProfile, catalog: Catalog, lastViewAt: number): RenderedEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `Salut ${name},` : "Salut,";
  const kind = typePhrase(p.looking_for);
  const { offers, forYou } = pickOffers(catalog, p, new Date(lastViewAt).toISOString(), OFFERS_SHOWN);
  const swipeUrl = `${SITE_URL}/swipe?${PRICES_SEEN_UTM}`;
  const premiumUrl = goLink(p.id, "choix", PRICES_SEEN_UTM);
  const unsubscribeUrl = unsubscribeUrlFor(p.id);
  const monthly = PLAN_PRICES.monthly.welcome;
  const lifetime = PLAN_PRICES.lifetime.welcome;

  const subject = forYou ? `De nouvelles offres ${kind} pour toi, et Premium à ${monthly}/mois` : `Tes offres ${kind}, et Premium à ${monthly}/mois`;
  const intro = forYou
    ? "Voilà les offres les plus récentes qui collent à ta recherche :"
    : `Voilà les offres ${kind} les plus récentes sur Stageio :`;
  const lines = offers.map((o) => ({ title: cleanTitle(o.title), meta: `${o.company} · ${cityOf(o.location)}` }));
  const premiumLine = `Tu as regardé Premium ces derniers jours. Pour postuler sans limite, avec une lettre de motivation pour chaque offre et l'audit de ton CV : ${monthly}/mois sans engagement, ou ${lifetime} une fois pour toujours.`;
  const timing = "Ces prix tiennent 10 minutes à partir de ton clic.";
  const pain = painCopy(p.looking_for);
  const urgency = `${pain.deadline} ${pain.investment}`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>${escapeHtml(intro)}</p>
<ul style="padding-left:18px;margin:0 0 8px">
${lines.map((l) => `<li style="margin:0 0 8px"><strong>${escapeHtml(l.title)}</strong><br><span style="color:#555">${escapeHtml(l.meta)}</span></li>`).join("\n")}
</ul>
<p style="margin:20px 0"><a href="${swipeUrl}" style="background:#ffffff;color:#0c7a44;border:2px solid #0c7a44;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:bold;display:inline-block">Voir mes offres</a></p>
<p style="background:#fdeee6;border-radius:10px;padding:10px 14px">${escapeHtml(urgency)}</p>
<p>${escapeHtml(premiumLine)}</p>
<p style="margin:20px 0 6px"><a href="${premiumUrl}" style="background:#0c7a44;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Débloquer Premium</a></p>
<p style="font-size:13px;color:#555;margin:0 0 20px">${escapeHtml(timing)} Paiement sécurisé par Stripe, sans te reconnecter.</p>
<p>Bonne recherche,<br>Nathan, de Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">Tu reçois cet email parce que tu as un compte sur stageio.fr. Pas de série derrière. <a href="${unsubscribeUrl}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;

  const text = [
    greeting,
    "",
    intro,
    ...lines.map((l) => `- ${l.title} (${l.meta})`),
    "",
    `Voir mes offres : ${swipeUrl}`,
    "",
    urgency,
    "",
    premiumLine,
    `Débloquer Premium, sans te reconnecter : ${premiumUrl}`,
    `${timing} Paiement sécurisé par Stripe.`,
    "",
    "Bonne recherche,",
    "Nathan, de Stageio",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Pas de série derrière.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export type PricesSeenResult =
  | { kind: "skipped"; reason: "hors_fenetre" | "no_sender" | "base_illisible" }
  | { kind: "sent"; sent: number; excluded: Partial<Record<NonNullable<PricesSeenExclusion>, number>>; failures: string[] };

const RECENT_EMAIL_EVENTS = [
  SALES_SERIES_EVENT,
  CHECKOUT_DAILY_EVENT,
  CAMPAIGNS.offres.event,
  CAMPAIGNS.dernierappel.event,
  CAMPAIGNS.nouveautes.event,
  OFFER48_REMINDER_EVENT,
];

export async function sendPricesSeenEmails(now: number = Date.now()): Promise<PricesSeenResult> {
  if (!inPricesSeenWindow(now)) return { kind: "skipped", reason: "hors_fenetre" };
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

  let candidates: PricesSeenCandidate[];
  let sent: Set<string>;
  let offer48: Set<string>;
  let recentEmail: Set<string>;
  let catalog: Catalog;
  try {
    const [views, already, offerRows, recent] = await Promise.all([
      events(["paywall_viewed"], now - PRICES_SEEN_LOOKBACK_MS),
      events([PRICES_SEEN_EVENT], PRICES_SEEN_DAY_START),
      events([CAMPAIGNS.offre48.event]),
      events(RECENT_EMAIL_EVENTS, PRICES_SEEN_DAY_START),
    ]);
    const lastView = new Map<string, number>();
    for (const v of views) {
      const t = Date.parse(v.created_at);
      if (t > (lastView.get(v.user_id) ?? 0)) lastView.set(v.user_id, t);
    }
    sent = new Set(already.map((r) => r.user_id));
    offer48 = new Set(offerRows.map((r) => r.user_id));
    recentEmail = new Set(recent.map((r) => r.user_id));
    const ids = [...lastView.keys()].filter((id) => !sent.has(id));
    const profiles: CampaignProfile[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).in("id", ids.slice(i, i + 100));
      if (error) throw new Error(error.message);
      profiles.push(...((data ?? []) as unknown as CampaignProfile[]));
    }
    candidates = profiles.map((profile) => ({ profile, lastViewAt: lastView.get(profile.id)! }));
    catalog = candidates.length > 0 ? await loadCatalog(db) : { offers: [] };
  } catch (e) {
    console.error("prix-vus: base illisible, rien envoyé", e instanceof Error ? e.message : e);
    return { kind: "skipped", reason: "base_illisible" };
  }

  const excluded: Partial<Record<NonNullable<PricesSeenExclusion>, number>> = {};
  const batch: PricesSeenCandidate[] = [];
  for (const c of candidates) {
    const reason = pricesSeenExclusion(c, sent, offer48, recentEmail, now);
    if (reason) excluded[reason] = (excluded[reason] ?? 0) + 1;
    else batch.push(c);
  }
  // Les plus récemment venus d'abord (les plus près de payer).
  batch.sort((a, b) => b.lastViewAt - a.lastViewAt);
  const toSend = batch.slice(0, PRICES_SEEN_MAX_PER_RUN);

  // Comme sendNextCampaignBatch : chaque compte est noté avant l'envoi,
  // dé-noté si Resend refuse ; clé d'idempotence par lot.
  const resend = getResendClient();
  let count = 0;
  const failures: string[] = [];
  for (let i = 0; i < toSend.length; i += 100) {
    const chunk = toSend.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(chunk.map((c) => ({ user_id: c.profile.id, event_type: PRICES_SEEN_EVENT, metadata: {} })))
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
      if (error) console.error("prix-vus: dé-notage en échec (ces comptes ne seront pas relancés)", error.message);
    };
    const payload = chunk.map((c) => {
      const email = renderPricesSeenEmail(c.profile, catalog, c.lastViewAt);
      return {
        from,
        to: c.profile.email as string,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: unsubscribeHeaders(c.profile.id),
        tags: [{ name: "campaign", value: PRICES_SEEN_TAG }],
      };
    });
    const { data, error } = await resend.batch.send(payload, {
      batchValidation: "permissive",
      idempotencyKey: `${PRICES_SEEN_TAG}-${chunk[0].profile.id}-${chunk[chunk.length - 1].profile.id}`,
    });
    if (error || !data) {
      await release(chunk.map((c) => c.profile.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }
    const rejected = (data.errors ?? []).map((e) => chunk[e.index]).filter(Boolean);
    await release(rejected.map((c) => c.profile.id));
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.profile.email}: ${e.message}`);
    count += chunk.length - rejected.length;
  }

  return { kind: "sent", sent: count, excluded, failures };
}
