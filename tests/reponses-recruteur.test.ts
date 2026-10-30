// Réponses de recruteurs classées sans IA (30/10) : entretien, refus, ou rien.
// Lancer : npx tsx --tsconfig tsconfig.json tests/reponses-recruteur.test.ts
import assert from "node:assert/strict";
import { classifyReplyByRules } from "../src/lib/inbox/replyRules";

const from = "Recrutement Boulangerie Martin <rh@boulangerie-martin.fr>";
const cases: [string, string, "positive" | "negative" | "neutral" | null][] = [
  ["Votre candidature", "Bonjour Léa, votre profil nous intéresse. Nous souhaiterions vous rencontrer pour un entretien. Seriez-vous disponible mardi à 14h ?", "positive"],
  ["Re: Candidature vendeur", "Bonjour, pourriez-vous nous indiquer vos disponibilités pour un échange téléphonique cette semaine ?", "positive"],
  ["Convocation", "Nous avons le plaisir de vous convier à un entretien le 4 novembre.", "positive"],
  ["Candidature", "Votre candidature a été retenue pour la prochaine étape : un test technique en ligne.", "positive"],
  ["Réponse à votre candidature", "Nous avons le regret de vous informer que votre candidature n'a pas été retenue.", "negative"],
  ["Suite à notre entretien", "Suite à notre entretien de mardi, nous ne pouvons malheureusement pas donner une suite favorable à votre candidature.", "negative"],
  ["Candidature", "Le poste a déjà été pourvu. Nous gardons votre CV.", "negative"],
  ["Candidature", "Après étude, nous avons retenu un autre candidat dont le profil correspond davantage.", "negative"],
  ["Candidature", "Votre profil ne correspond pas à nos besoins actuels.", "negative"],
  ["Accusé de réception", "Nous avons bien reçu votre candidature et nous reviendrons vers vous rapidement.", "neutral"],
  ["Message automatique", "Malheureusement, cette adresse n'est pas surveillée. Merci de ne pas répondre.", null],
  ["Nos nouveautés", "Découvrez nos offres de la semaine et nos promotions en magasin.", null],
];
for (const [subject, body, expected] of cases) {
  const r = classifyReplyByRules({ from, subject, snippet: body }, ["Boulangerie Martin"]);
  assert.equal(r.sentiment, expected, body);
  assert.equal(r.is_recruiting_reply, expected !== null, body);
}

// Boîte Gmail : rien sans entreprise reconnue.
const unknown = classifyReplyByRules(
  { from: "Jobs <noreply@exemple.com>", subject: "Votre candidature", snippet: "Nous avons le regret de vous informer que votre candidature n'a pas été retenue." },
  ["Boulangerie Martin"],
  { requireCompany: true },
);
assert.equal(unknown.is_recruiting_reply, false);
const known = classifyReplyByRules(
  { from, subject: "Votre candidature", snippet: "Nous souhaiterions vous rencontrer pour un entretien." },
  ["Boulangerie Martin SAS"],
  { requireCompany: true },
);
assert.equal(known.matched_company, "Boulangerie Martin SAS");
assert.equal(known.sentiment, "positive");

console.log(`OK (${cases.length + 2} réponses)`);
