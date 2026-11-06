import { AUTO_DAILY_LIMIT, AUTO_PRICES, EMAIL_OFFER, FLASH_OFFER, PLAN_PRICES } from "@/lib/pricing/plans";
import { unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import { goLink } from "@/lib/premium/goLink";
import type { CampaignProfile, RenderedEmail } from "@/lib/campaigns/relanceOffres";

// Salve « offre de l'email » (Nathan, 5/11 : « une autre salve de 400 emails
// avec l'accès à vie à 30 € et l'Auto à 63,23 € […] dès qu'ils reçoivent
// l'email, ils ont 20 minutes pour faire leur choix […] le truc le plus
// marketing possible, genre un paywall avec ce qu'il y a de nouveau sur
// l'application »). Un seul email, présenté comme un paywall :
// - Premium à vie à 30 € (même prix Stripe que les offres 48 h d'octobre) ;
// - Stageio Auto à vie à 63,23 € (prix Stripe créé le 5/11) ;
// - le mensuel au prix de bienvenue (9,99 €) ;
// - le prix est bloqué 20 minutes à partir du clic (EMAIL_OFFER, compté
//   côté serveur, une seule fois), le lien marche 48 h.
// Chaque phrase est vraie à l'envoi : ni prix barré ni « −10 € » (30 € était
// déjà le prix le plus bas de l'accès à vie sur les 30 derniers jours), la
// hausse à 50 € est la décision de Nathan, sans date inventée ; les
// nouveautés sont celles en ligne (série Premium, 29/10 ; modèles de CV, 30/10).
//
// Envoi : 400 emails en tout, en une fois, par le cron /api/cron/offre-48h
// (toutes les 5 minutes le 5/11 de 17 h 50 à 21 h 55 à Paris, jamais à
// l'heure pile où partent les salves horaires : le premier passage après la
// mise en ligne envoie tout), garde-fous de /admin/relance.

export const OFFER48_SALVE_TOTAL = 400;
// « Fais-le pour maintenant » : dès la mise en ligne (16 h 50 UTC = 17 h 50
// à Paris) ; dernier passage à 20 h 55 UTC.
export const OFFER48_SALVE_START = Date.parse("2026-11-05T16:50:00Z");
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
// Espaces insécables : « 30 € », « 18 h 05 » jamais coupés en fin de ligne.
const keep = (s: string) => escapeHtml(s).replace(/ (€|h|à) /g, "&nbsp;$1&nbsp;").replace(/ €/g, "&nbsp;€");

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

// Nouveautés réellement en ligne.
export const OFFER48_NEWS: { icon: string; title: string; text: string }[] = [
  { icon: "🤖", title: "Stageio Auto", text: `chaque like envoie ta candidature, lettre et CV, jusqu'à ${AUTO_DAILY_LIMIT} par jour.` },
  { icon: "🏢", title: "Candidatures spontanées", text: "les entreprises qui recrutent près de chez toi, même sans annonce publiée." },
  { icon: "🔁", title: "Relances", text: "7 jours sans réponse ? On relance pour toi, ou on te le rappelle." },
  { icon: "⚡", title: "Alertes dans l'heure", text: "une nouvelle offre faite pour toi, avant les autres." },
  { icon: "🎤", title: "Simulateur d'entretien", text: "les questions de ton métier, et tes réponses corrigées." },
  { icon: "📄", title: "Modèles de CV", text: "6 mises en page, 8 couleurs, prêts pour ton métier." },
];

const PREMIUM_BENEFITS = ["Likes et candidatures illimités", "Une lettre de motivation pour chaque offre", "L'audit de ton CV et le simulateur d'entretien"];

const minutes = Math.round(EMAIL_OFFER.windowMs / 60_000);

// now : moment de l'envoi (le lien marche 48 h, le prix tient 20 minutes après le clic).
export function renderOffer48Email(p: CampaignProfile, now: number = Date.now()): RenderedEmail {
  const name = firstName(p.full_name);
  const linkEnd = offer48Deadline(now + EMAIL_OFFER.linkMs);
  const premium = FLASH_OFFER.lifetimePrice;
  const auto = FLASH_OFFER.autoLifetimePrice;
  const monthly = PLAN_PRICES.monthly.welcome;
  // Liens signés : le paiement s'ouvre sans se connecter (voir lib/premium/goLink.ts).
  const goPremium = goLink(p.id, "lifetime", OFFER48_UTM, now);
  const goAuto = goLink(p.id, "auto_lifetime", OFFER48_UTM, now);
  const goMonthly = goLink(p.id, "monthly", OFFER48_UTM, now);
  const unsubscribe = unsubscribeUrlFor(p.id);
  const subject = `⏳ ${name ? `${name}, ` : ""}Stageio à vie à ${premium}, réservé à cet email`;
  const preheader = `Ton prix est bloqué ${minutes} minutes dès que tu cliques. Bientôt, l'accès à vie passe à 50 €.`;
  const intro = `${name ? `${name}, l` : "L"}'accès à vie de Stageio va bientôt passer à 50 €. Avant ça, cet email te le donne à ${premium}, rien qu'à toi.`;
  const timer = `Dès que tu cliques, ton prix est bloqué ${minutes} minutes. Le lien marche jusqu'au ${linkEnd}.`;
  const after = `Après tes ${minutes} minutes : ${PLAN_PRICES.lifetime.regular} pour Premium à vie, ${AUTO_PRICES.lifetime.regular} pour l'Auto à vie.`;
  const autoLine = `Tout Premium, et en plus chaque like envoie ta candidature tout seul, depuis une adresse à ton nom, jusqu'à ${AUTO_DAILY_LIMIT} par jour.`;

  const button = (href: string, label: string, light = false) => `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 0"><tr><td align="center" bgcolor="${light ? "#ffffff" : "#0f9b57"}" style="background-color:${light ? "#ffffff" : "#0f9b57"};border-radius:999px;${light ? "border:2px solid #0f9b57;" : ""}"><a href="${href}" style="display:block;padding-top:15px;padding-bottom:15px;padding-left:18px;padding-right:18px;font-size:17px;font-weight:bold;color:${light ? "#0f7a43" : "#ffffff"};text-decoration:none">${label}</a></td></tr></table>`;

  const html = `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#eef6f1" style="background-color:#eef6f1"><tr><td align="center" style="padding:20px 10px">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<tr><td bgcolor="#0b5a36" style="background-color:#0b5a36;background-image:linear-gradient(135deg,#0b5a36,#12a05c);border-radius:20px 20px 0 0;padding:26px 22px 24px;text-align:center">
<p style="margin:0;display:inline-block;font-size:12px;font-weight:bold;letter-spacing:1.5px;color:#0b5a36;background-color:#c9f2d9;border-radius:999px;padding:6px 14px">🔒 RÉSERVÉ À CET EMAIL</p>
<p style="margin:16px 0 0;font-size:15px;color:#c9f2d9;font-weight:bold">Stageio Premium à vie</p>
<p style="margin:2px 0 0;font-size:56px;line-height:1.05;font-weight:bold;color:#ffffff">${keep(premium)}</p>
<p style="margin:6px 0 0;font-size:15px;color:#e6f7ed">Un seul paiement. Premium pour toujours.</p>
<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:bold;color:#0b5a36">⏱️ ${minutes} minutes dès que tu cliques</td></tr></table>
</td></tr>
<tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 20px 20px;padding:22px 22px 26px">
<p style="margin:0;font-size:16px;line-height:1.55">${keep(intro)}</p>
${button(goPremium, `Débloquer Stageio à vie · ${keep(premium)}`)}
<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:#555;text-align:center">${keep(timer)}</p>

<p style="margin:26px 0 10px;font-size:13px;font-weight:bold;letter-spacing:1.2px;color:#0f7a43">✨ NOUVEAU SUR STAGEIO</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%">
${OFFER48_NEWS.map((n) => `<tr><td width="34" valign="top" style="font-size:20px;padding:6px 0">${n.icon}</td><td style="font-size:15px;line-height:1.45;padding:6px 0"><strong>${escapeHtml(n.title)}</strong> : ${escapeHtml(n.text)}</td></tr>`).join("\n")}
</table>

<p style="margin:26px 0 10px;font-size:13px;font-weight:bold;letter-spacing:1.2px;color:#0f7a43">CHOISIS TA FORMULE</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px"><tr><td bgcolor="#f1f8f4" style="background-color:#f1f8f4;border:2px solid #0f9b57;border-radius:16px;padding:16px 18px">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:1px;color:#0f7a43">PREMIUM À VIE</p>
<p style="margin:4px 0 6px;font-size:34px;line-height:1.1;font-weight:bold;color:#0f7a43">${keep(premium)}</p>
${PREMIUM_BENEFITS.map((b) => `<p style="margin:0 0 4px;font-size:15px">✅ ${escapeHtml(b)}</p>`).join("\n")}
${button(goPremium, `Prendre Premium à vie · ${keep(premium)}`)}
</td></tr></table>
<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1.5px solid #bfe3cd;border-radius:16px;padding:16px 18px">
<p style="margin:0;font-size:12px;font-weight:bold;letter-spacing:1px;color:#0f7a43">STAGEIO AUTO À VIE</p>
<p style="margin:4px 0 6px;font-size:34px;line-height:1.1;font-weight:bold;color:#0f7a43">${keep(auto)}</p>
<p style="margin:0;font-size:15px;line-height:1.5">🤖 ${escapeHtml(autoLine)}</p>
${button(goAuto, `Prendre l'Auto à vie · ${keep(auto)}`, true)}
</td></tr></table>

<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#555;text-align:center">🔒 Paiement sécurisé par Stripe · ⚡ Accès immédiat · ♾️ Jamais de renouvellement</p>
<p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:#555">${keep(after)} Tu préfères au mois ? <a href="${goMonthly}" style="color:#0f7a43;font-weight:bold">${keep(monthly)} par mois</a>, sans engagement.</p>
<p style="margin:20px 0 0;font-size:16px">Nathan<br>Stageio</p>
<p style="margin:14px 0 0;font-size:14px;color:#555">P.S. Ce prix est réservé à cet email : tu ne le trouveras pas sur le site.</p>
</td></tr>
<tr><td style="padding:16px 10px 0;text-align:center;font-size:12px;line-height:1.5;color:#888">Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type. <a href="${unsubscribe}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</td></tr>
</table>
</td></tr></table>`;

  const text = [
    `RÉSERVÉ À CET EMAIL : Stageio Premium à vie à ${premium}`,
    "",
    intro,
    timer,
    "",
    `Débloquer Stageio à vie à ${premium} : ${goPremium}`,
    "",
    "Nouveau sur Stageio :",
    ...OFFER48_NEWS.map((n) => `- ${n.title} : ${n.text}`),
    "",
    `Premium à vie : ${premium}`,
    ...PREMIUM_BENEFITS.map((b) => `- ${b}`),
    `→ ${goPremium}`,
    "",
    `Stageio Auto à vie : ${auto}`,
    autoLine,
    `→ ${goAuto}`,
    "",
    "Paiement sécurisé par Stripe. Accès immédiat. Jamais de renouvellement.",
    after,
    `Ou ${monthly} par mois, sans engagement : ${goMonthly}`,
    "",
    "Nathan, Stageio",
    "",
    "P.S. Ce prix est réservé à cet email : tu ne le trouveras pas sur le site.",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribe}`,
  ].join("\n");
  return { subject, html, text };
}
