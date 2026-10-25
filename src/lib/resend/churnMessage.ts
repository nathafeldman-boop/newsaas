import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";

// Message aux abonnés qui partent (25/10, Nathan : « un vrai message, pas un
// truc préfait » : des compromis, un questionnaire pour savoir pourquoi, les
// nouveautés et ce qui arrive, et leur demander s'ils reviennent le mois
// prochain). Deux cas :
// - « programmé » : résiliation demandée, Premium encore actif jusqu'à
//   l'échéance (envoyé à la résiliation, et depuis l'admin pour ceux d'avant) ;
// - « parti » : abonnement terminé (envoyé depuis l'admin seulement).
// Aucune remise : les prix restent ceux du paywall.

/** Nouveautés réellement en ligne (vérifiées le 25/10). */
export const NEW_FEATURES = [
  "Des offres vraiment dans ton métier, ta ville et ton niveau, les plus récentes d'abord : fini les doublons, les annonces de deux mois et la même agence d'intérim en boucle.",
  "« Pas pour toi ? » : quand tu passes une offre, tu dis pourquoi (trop loin, pas ton métier, pas ton niveau) et ton paquet s'adapte tout de suite.",
  "Le suivi de tes candidatures, avec un rappel quand c'est le moment de relancer.",
  "Un simulateur d'entretien qui corrige tes réponses.",
  "Stageio Auto : on envoie ta candidature à ta place à chaque offre que tu likes.",
];

/** Ce qui arrive : uniquement ce que Nathan a confirmé (vide = section masquée). */
export const UPCOMING_FEATURES: string[] = [];

export type ChurnKind = "programme" | "parti";

export function churnSurveyUrl(profileId: string, kind: ChurnKind, reason?: "trouve"): string {
  return `${SITE_URL}/pourquoi?u=${profileId}&k=${kind}${reason ? `&r=${reason}` : ""}`;
}

const firstName = (fullName: string | null) => fullName?.trim().split(/\s+/)[0] || null;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const link = (href: string, text: string) => `<a href="${href}" style="color:#0c6b3c;font-weight:700">${text}</a>`;
const list = (items: string[]) => `<ul style="padding-left:20px;margin:8px 0 16px">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join("")}</ul>`;

function features(): string {
  return `<p style="margin:16px 0 0"><strong>Ce qu'on vient de changer</strong></p>${list(NEW_FEATURES.map(esc))}${
    UPCOMING_FEATURES.length > 0 ? `<p style="margin:0"><strong>Ce qui arrive</strong></p>${list(UPCOMING_FEATURES.map(esc))}` : ""
  }`;
}

/** Sujet et corps du message (sans l'envoyer : aussi utilisé pour l'aperçu). */
export function buildChurnMessage(p: {
  kind: ChurnKind;
  profileId: string;
  fullName: string | null;
  /** « jeudi 12 novembre » : fin de l'accès (programmé) ou date de fin (parti). */
  dateLabel: string;
  /** « 7,99 €/mois » (programmé seulement). */
  price?: string;
}): { subject: string; html: string } {
  const name = firstName(p.fullName);
  const hello = `<p>Salut${name ? ` ${esc(name)}` : ""},</p>`;
  const survey = churnSurveyUrl(p.profileId, p.kind);
  const sign = `<p>Merci d'avoir essayé Stageio, et bon courage pour ta recherche.<br />Nathan, Stageio</p>`;
  const wrap = (body: string) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#14232b;max-width:560px">${body}${unsubscribeFooterHtml(p.profileId)}</div>`;

  if (p.kind === "programme") {
    const keep = `${SITE_URL}/premium/garder`;
    return {
      subject: `Ton Premium s'arrête le ${p.dateLabel} : je peux te poser une question ?`,
      html: wrap(`${hello}
<p>C'est Nathan, de Stageio. J'ai vu que tu as résilié ton Premium. C'est bien pris en compte : il reste actif jusqu'au <strong>${p.dateLabel}</strong>, puis tu repasses en gratuit, sans rien payer de plus.</p>
<p>Avant que tu partes, j'aimerais vraiment comprendre. Si Stageio ne t'a pas assez aidé, c'est à nous de corriger. Tu peux me dire pourquoi en 30 secondes (3 questions) : ${link(survey, "dire pourquoi j'arrête")}.</p>
<p style="margin:16px 0 0"><strong>Si tu cherches encore ton alternance</strong>, plutôt que de tout couper :</p>
${list([
  `<strong>Garder Premium un mois de plus</strong>, au même prix${p.price ? ` (${p.price})` : ""}, et arrêter quand tu veux : ${link(keep, "je garde mon Premium")}.`,
  `<strong>Passer à l'accès à vie</strong> : un seul paiement, plus jamais d'abonnement, jusqu'à ce que tu signes : ${link(`${SITE_URL}/premium`, "voir l'accès à vie")}.`,
  "<strong>Rester en gratuit</strong> : ton compte reste ouvert et tu peux continuer à recevoir par e-mail les nouvelles offres de ton métier.",
  "<strong>Un souci précis</strong> (offres trop loin, pas ton métier, un bug) ? Réponds simplement à cet e-mail : je regarde ton compte moi-même.",
])}${features()}
<p><strong>Alors, on continue ensemble le mois prochain ?</strong> ${link(keep, "Oui, je garde mon Premium")}</p>
${sign}`),
    };
  }

  return {
    subject: name ? `${name}, ton alternance, tu en es où ?` : "Ton alternance, tu en es où ?",
    html: wrap(`${hello}
<p>C'est Nathan, de Stageio. Ton Premium s'est arrêté le <strong>${p.dateLabel}</strong>.</p>
<p>Si tu as trouvé ton alternance : bravo, vraiment. Dis-le-moi en un clic, ça me fait plaisir : ${link(churnSurveyUrl(p.profileId, p.kind, "trouve"), "c'est bon, j'ai trouvé")}.</p>
<p>Sinon, j'aimerais comprendre ce qui n'a pas marché pour toi. 3 questions, 30 secondes : ${link(survey, "dire pourquoi j'ai arrêté")}.</p>
${features()}
<p style="margin:0"><strong>Tu veux réessayer le mois prochain ?</strong></p>
${list([
  `Reprendre Premium pour un mois, et arrêter quand tu veux : ${link(`${SITE_URL}/premium`, "reprendre Premium")}.`,
  `Ou l'accès à vie : un seul paiement, plus d'abonnement : ${link(`${SITE_URL}/premium`, "voir l'accès à vie")}.`,
  "Ou rester en gratuit : tu continues de recevoir par e-mail les nouvelles offres de ton métier.",
])}
<p>Un souci précis, une offre qui ne te correspondait pas ? Réponds à cet e-mail : je regarde ton compte moi-même.</p>
${sign}`),
  };
}

export async function sendChurnMessage(to: string, message: { subject: string; html: string }, profileId: string): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const { error } = await getResendClient().emails.send({
    from: `Nathan de Stageio <${fromEmail}>`,
    to,
    subject: message.subject,
    html: message.html,
    headers: unsubscribeHeaders(profileId),
  });
  if (error) throw new Error(`sendChurnMessage: ${error.message}`);
}
