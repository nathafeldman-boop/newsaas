import { SITE_URL } from "@/lib/site";
import { PLAN_PRICES, WELCOME_WINDOW_MS } from "@/lib/pricing/plans";
import { unsubscribeUrlFor } from "@/lib/resend/unsubscribe";
import type { CampaignProfile, RenderedEmail } from "@/lib/campaigns/relanceOffres";

// « Dernier appel » (31/10, Nathan : « une campagne d'email […] à tout le
// monde […] on va encore augmenter les prix […] c'est le dernier moment »).
// Un seul email, un seul message : l'accès à vie en un seul paiement.
// Chaque phrase est vraie à l'envoi :
// - le prix de bienvenue (PLAN_PRICES) dure 10 minutes à partir de
//   l'ouverture de la page Premium (délai rouvert pour chaque destinataire
//   d'une campagne, voir pricing/welcome.ts), puis le prix normal ;
// - la hausse des prix est la décision de Nathan : aucune date inventée ;
// - pas de garantie « remboursé » : l'accès à vie n'est plus remboursable
//   depuis le 31/10 (voir premium/guaranteeTerms.ts) ;
// - ni compte à rebours ni nombre de places : seulement le vrai délai.

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function firstName(fullName: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first && first.length >= 2 && first.length <= 30 ? first.charAt(0).toUpperCase() + first.slice(1) : null;
}

export const LAST_CALL_UTM = "utm_source=email&utm_medium=campagne&utm_campaign=dernier_appel_2026_10";

export function renderLastCallEmail(p: CampaignProfile): RenderedEmail {
  const name = firstName(p.full_name);
  const greeting = name ? `${name},` : "Salut,";
  const lifetime = PLAN_PRICES.lifetime.welcome;
  const regular = PLAN_PRICES.lifetime.regular;
  const minutes = Math.round(WELCOME_WINDOW_MS / 60_000);
  const go = `${SITE_URL}/premium/go?plan=lifetime&${LAST_CALL_UTM}`;
  const monthly = `${SITE_URL}/premium/go?plan=monthly&${LAST_CALL_UTM}`;
  const unsubscribe = unsubscribeUrlFor(p.id);
  const subject = `Dernier appel : l'accès à vie à ${lifetime}, avant la hausse des prix`;
  const benefits = [
    "Likes et candidatures illimités",
    "Une lettre de motivation pour chaque offre",
    "L'audit de ton CV et le simulateur d'entretien",
    "Un seul paiement : jamais de renouvellement",
  ];
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${escapeHtml(greeting)}</p>
<p>On va encore <strong>augmenter les prix de Stageio</strong>. Avant, une dernière chance de prendre l'accès Premium <strong>à vie</strong>, en un seul paiement.</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0"><tr><td bgcolor="#f1f8f4" style="background-color:#f1f8f4;border:1px solid #bfe3cd;border-radius:12px;padding-top:18px;padding-bottom:18px;padding-left:20px;padding-right:20px">
<p style="margin:0;font-size:14px;color:#2f6b49">Accès à vie, un seul paiement</p>
<p style="margin:2px 0 4px;font-size:38px;line-height:1.1;font-weight:bold;color:#0f7a43">${escapeHtml(lifetime)}</p>
<p style="margin:0;font-size:14px;color:#555">Prix de bienvenue pendant ${minutes} minutes à partir du moment où tu ouvres la page, ensuite ${escapeHtml(regular)}.</p>
</td></tr></table>
<ul style="padding-left:20px;margin-top:0">
${benefits.map((b) => `<li style="margin-bottom:6px">${escapeHtml(b)}</li>`).join("\n")}
</ul>
<table cellpadding="0" cellspacing="0" border="0" style="margin:22px 0"><tr><td bgcolor="#0f9b57" style="background-color:#0f9b57;border-radius:999px"><a href="${go}" style="display:inline-block;padding-top:14px;padding-bottom:14px;padding-left:28px;padding-right:28px;font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none">Prendre l'accès à vie à ${escapeHtml(lifetime)}</a></td></tr></table>
<p style="font-size:14px;color:#555">Tu préfères y aller doucement ? Il y a aussi <a href="${monthly}" style="color:#0f7a43">${escapeHtml(PLAN_PRICES.monthly.welcome)} par mois</a>, sans engagement.</p>
<p>Nathan<br>Stageio</p>
<p style="font-size:12px;color:#888;margin-top:28px">Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type. <a href="${unsubscribe}" style="color:#888">Ne plus recevoir d'emails de Stageio</a>.</p>
</div>`;
  const text = [
    greeting,
    "",
    "On va encore augmenter les prix de Stageio. Avant, une dernière chance de prendre l'accès Premium à vie, en un seul paiement.",
    "",
    `Accès à vie, un seul paiement : ${lifetime}`,
    `Prix de bienvenue pendant ${minutes} minutes à partir du moment où tu ouvres la page, ensuite ${regular}.`,
    "",
    ...benefits.map((b) => `- ${b}`),
    "",
    `Prendre l'accès à vie à ${lifetime} : ${go}`,
    `Ou ${PLAN_PRICES.monthly.welcome} par mois, sans engagement : ${monthly}`,
    "",
    "Nathan, Stageio",
    "",
    "Tu reçois cet email parce que tu as un compte sur stageio.fr. Un seul email de ce type.",
    `Ne plus recevoir d'emails de Stageio : ${unsubscribe}`,
  ].join("\n");
  return { subject, html, text };
}
