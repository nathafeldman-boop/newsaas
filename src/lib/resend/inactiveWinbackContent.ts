import { SITE_URL } from "@/lib/site";

export type WinbackEmail = { subject: string; html: string };

function footer(unsubscribeUrl: string): string {
  return `<p style="font-size:12px;color:#888;margin-top:24px">
Tu reçois cet email car tu as un compte Stageio.
<a href="${unsubscribeUrl}">Se désabonner</a> de ces relances et des alertes nouvelles offres.
</p>`;
}

// Série de 7 emails, un par jour (voir cron/inactive-winback) : jamais de
// répétition, la relance s'arrête d'elle-même une fois le tableau épuisé
// (inactive_campaign_emails_sent atteint 7). Progression volontaire :
// valeur/fonctionnalités d'abord (jours 1-5), Premium seulement en fin de
// série (jour 6), dernier message qui referme proprement (jour 7) plutôt
// que de continuer à écrire indéfiniment à quelqu'un qui ne revient pas.
export const INACTIVE_WINBACK_EMAILS: ((greeting: string, unsubscribeUrl: string) => WinbackEmail)[] = [
  (greeting, unsubscribeUrl) => ({
    subject: "De nouvelles offres t'attendent sur Stageio",
    html: `<p>${greeting},</p>
<p>Ça fait un moment qu'on ne t'a pas vu·e -- plein de nouvelles offres d'alternance et de stage sont arrivées depuis ton dernier passage. Ça prend 30 secondes d'aller y jeter un œil.</p>
<p><a href="${SITE_URL}/swipe">Voir les nouvelles offres</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "Swipe, like, candidate -- ça prend 2 minutes",
    html: `<p>${greeting},</p>
<p>Le principe de Stageio en une phrase : tu swipes les offres qui te correspondent, tu likes celles qui t'intéressent, et on s'occupe de te préparer une candidature. Pas besoin de repartir de zéro à chaque fois.</p>
<p><a href="${SITE_URL}/swipe">Reprendre où tu t'es arrêté·e</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "Ta lettre de motivation, écrite en 10 secondes",
    html: `<p>${greeting},</p>
<p>Dès que tu likes une offre, Stageio te génère une lettre de motivation sur mesure -- basée sur ton profil et l'offre en question. Tu n'as plus qu'à relire et envoyer.</p>
<p><a href="${SITE_URL}/swipe">Essayer sur une offre</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "On a ajouté des milliers d'offres, dans plus de villes",
    html: `<p>${greeting},</p>
<p>Le catalogue d'offres a beaucoup grossi ces derniers jours, avec plus de villes couvertes (Paris, Lyon, Marseille, Toulouse, Bordeaux, Lille, Nantes, Strasbourg, Nice, Rennes, Montpellier, Grenoble, Perpignan...). De bonnes chances qu'il y ait maintenant quelque chose pour toi.</p>
<p><a href="${SITE_URL}/swipe">Voir le catalogue</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "Ton CV mérite d'être audité (gratuit)",
    html: `<p>${greeting},</p>
<p>Si ton CV est déjà en ligne sur Stageio, tu peux le faire auditer -- une note sur 100 et des conseils concrets pour l'améliorer, générés en quelques secondes.</p>
<p><a href="${SITE_URL}/cv">Auditer mon CV</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "Premium : candidatures illimitées, à partir de 39,99€ à vie",
    html: `<p>${greeting},</p>
<p>Un point rapide sur Premium, au cas où : like et candidatures illimités, lettres de motivation IA, audit CV -- 7,99€/mois sans engagement, ou 39,99€ en un seul paiement pour un accès à vie (sans jamais rien repayer).</p>
<p><a href="${SITE_URL}/premium">Voir les formules</a></p>
${footer(unsubscribeUrl)}`,
  }),
  (greeting, unsubscribeUrl) => ({
    subject: "Dernière relance -- on te laisse tranquille après ça",
    html: `<p>${greeting},</p>
<p>Dernier message de notre part pour l'instant. Si Stageio ne te correspond plus, pas de souci -- ton compte reste disponible si tu changes d'avis, et tu peux le supprimer à tout moment depuis ton profil.</p>
<p>Si tu veux juste jeter un dernier œil :</p>
<p><a href="${SITE_URL}/swipe">Voir les offres</a></p>
${footer(unsubscribeUrl)}`,
  }),
];
