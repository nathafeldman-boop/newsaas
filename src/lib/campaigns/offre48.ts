import { SITE_URL } from "@/lib/site";
import { AUTO_DAILY_LIMIT, AUTO_PRICES, FLASH_OFFER, PLAN_PRICES } from "@/lib/pricing/plans";
import { unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import type { CampaignProfile, RenderedEmail } from "@/lib/campaigns/relanceOffres";

// Salve « offre 48 h » (Nathan, 5/11 : « Programme une autre salve de 400
// emails avec l'accès à vie à 30 € et l'Auto à 63,23 € »). Un seul email :
// l'envoi ouvre pour ce compte 48 h de prix rien qu'à lui (FLASH_OFFER,
// compté côté serveur depuis l'envoi, jamais rouvert) :
// - Premium à vie à 30 € (même prix Stripe que les offres 48 h d'octobre) ;
// - Stageio Auto à vie à 63,23 € (prix Stripe créé le 5/11) ;
// - le mensuel au prix de bienvenue (9,99 €).
// Chaque phrase est vraie à l'envoi : ni prix barré ni « réduction » (jamais
// moins cher avant), seulement la vraie fin de l'offre et le prix d'après.
//
// Envoi : 400 emails en tout, en une fois, par le cron /api/cron/offre-48h
// (à 18 h 05 à Paris, ou au passage suivant jusqu'à 21 h 05 si la mise en
// ligne arrive plus tard), avec les garde-fous de /admin/relance.

export const OFFER48_SALVE_TOTAL = 400;
// 17 h UTC = 18 h à Paris (heure d'hiver) ; dernier passage à 20 h 05 UTC.
export const OFFER48_SALVE_START = Date.parse("2026-11-05T17:00:00Z");
export const OFFER48_SALVE_END = Date.parse("2026-11-05T21:00:00Z");

export type Offer48Plan = { kind: "skipped"; reason: "hors_fenetre" | "deja_parti" } | { kind: "run"; size: number };

// sentTotal : emails de cette campagne déjà partis (tous déclencheurs confondus).
export function planOffer48Salve(now: number, sentTotal: number): Offer48Plan {
  if (now < OFFER48_SALVE_START || now >= OFFER48_SALVE_END) return { kind: "skipped", reason: "hors_fenetre" };
  const size = OFFER48_SALVE_TOTAL - Math.max(0, sentTotal);
  if (size <= 0) return { kind: "skipped", reason: "deja_parti" };
  return { kind: "run", size };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nbsp = (s: string) => escapeHtml(s).replace(/ /g, "&nbsp;");

function firstName(fullName: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first && first.length >= 2 && first.length <= 30 ? first.charAt(0).toUpperCase() + first.slice(1) : null;
}

const deadlineFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// « samedi 7 novembre à 18 h 05 » (heure de Paris), à la minute près, sans
// jamais annoncer plus tard que la vraie fin.
export function offer48Deadline(endsAt: number): string {
  const parts = deadlineFormat.formatToParts(new Date(Math.floor(endsAt / 60_000) * 60_000));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} à ${Number(get("hour"))} h ${get("minute")}`;
}

export const OFFER48_UTM = "utm_source=email&utm_medium=campagne&utm_campaign=offre_48h_2026_11";

const PREMIUM_BENEFITS = [
  "Likes et candidatures illimités",
  "Une lettre de motivation pour chaque offre",
  "L'audit de ton CV et le simulateur d'entretien",
];

// now : moment de l'envoi (la fin de l'offre est 48 h plus tard).
export function renderOffer48Email(p: CampaignProfile, now: number = Date.now()): RenderedEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `${name},` : "Salut,";
  const deadline = offer48Deadline(now + FLASH_OFFER.windowMs);
  const premium = FLASH_OFFER.lifetimePrice;
  const auto = FLASH_OFFER.autoLifetimePrice;
  const monthly = PLAN_PRICES.monthly.welcome;
  const goPremium = `${SITE_URL}/premium/go?plan=lifetime&${OFFER48_UTM}`;
  const goAuto = `${SITE_URL}/premium/go?plan=auto_lifetime&${OFFER48_UTM}`;
  const goMonthly = `${SITE_URL}/premium/go?plan=monthly&${OFFER48_UTM}`;
  const unsubscribe = unsubscribeUrlFor(p.id);
  const autoLine = `Tout Premium, et en plus chaque like envoie ta candidature tout seul (ta lettre et ton CV, depuis une adresse à ton nom), jusqu'à ${AUTO_DAILY_LIMIT} par jour.`;
  const after = `Après, ce sera ${PLAN_PRICES.lifetime.regular} pour Premium à vie et ${AUTO_PRICES.lifetime.regular} pour l'Auto à vie.`;
  const subject = `🎁 ${name ? `${name}, ` : ""}48 h rien que pour toi : Premium à vie à ${premium}`;

  const box = (label: string, price: string, lines: string, href: string, cta: string) => `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0"><tr><td bgcolor="#f1f8f4" style="background-color:#f1f8f4;border:1px solid #bfe3cd;border-radius:12px;padding-top:16px;padding-bottom:16px;padding-left:20px;padding-right:20px">
<p style="margin:0;font-size:14px;color:#2f6b49">${escapeHtml(label)}</p>
<p style="margin:2px 0 6px;font-size:34px;line-height:1.1;font-weight:bold;color:#0f7a43">${nbsp(price)}</p>
${lines}
<table cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0"><tr><td bgcolor="#0f9b57" style="background-color:#0f9b57;border-radius:999px"><a href="${href}" style="display:inline-block;padding-top:12px;padding-bottom:12px;padding-left:24px;padding-right:24px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">${escapeHtml(cta)}</a></td></tr></table>
</td></tr></table>`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>Pendant 48 h, jusqu'au <strong>${escapeHtml(deadline).replace(/ (h|à) /g, "&nbsp;$1&nbsp;")}</strong>, tu as deux prix rien que pour toi, en un seul paiement :</p>
${box(
  "Premium à vie",
  premium,
  `<ul style="padding-left:20px;margin:0;font-size:15px">${PREMIUM_BENEFITS.map((b) => `<li style="margin-bottom:4px">${escapeHtml(b)}</li>`).join("")}</ul>`,
  goPremium,
  `Prendre Premium à vie à ${premium}`,
)}
${box(
  "Stageio Auto à vie",
  auto,
  `<p style="margin:0;font-size:15px">${escapeHtml(autoLine)}</p>`,
  goAuto,
  `Prendre l'Auto à vie à ${auto}`,
)}
<p style="font-size:14px;color:#555">${escapeHtml(after)} Tu préfères au mois ? <a href="${goMonthly}" style="color:#0f7a43">${nbsp(monthly)} par mois</a>, sans engagement.</p>
<p>Nathan<br>Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type. <a href="${unsubscribe}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;

  const text = [
    greeting,
    "",
    `Pendant 48 h, jusqu'au ${deadline}, tu as deux prix rien que pour toi, en un seul paiement :`,
    "",
    `Premium à vie : ${premium}`,
    ...PREMIUM_BENEFITS.map((b) => `- ${b}`),
    `Prendre Premium à vie à ${premium} : ${goPremium}`,
    "",
    `Stageio Auto à vie : ${auto}`,
    autoLine,
    `Prendre l'Auto à vie à ${auto} : ${goAuto}`,
    "",
    after,
    `Ou ${monthly} par mois, sans engagement : ${goMonthly}`,
    "",
    "Nathan, Stageio",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribe}`,
  ].join("\n");
  return { subject, html, text };
}
