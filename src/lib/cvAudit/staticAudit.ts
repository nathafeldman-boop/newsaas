import type { CvAudit } from "@/lib/mistral/auditCv";

// Audit CV entièrement statique -- ZÉRO appel IA. Remplace l'ancienne
// version Mistral (src/lib/mistral/auditCv.ts, conservée pour son type
// CvAudit mais plus utilisée) : même contrat de sortie ({score, strengths,
// improvements, missing_sections}), donc aucun changement nécessaire côté
// CvAuditPanel.tsx. Basé sur des heuristiques simples (présence de
// sections-clés, longueur, résultats chiffrés, pertinence au secteur visé)
// plutôt qu'une lecture fine du contenu -- moins subtil qu'une vraie lecture
// par un humain ou une IA, mais toujours disponible, jamais bloqué par un
// quota tiers.

export type CvAuditContext = {
  sectors?: string[];
  targetJobs?: string[];
  educationLevel?: string | null;
  experienceLevel?: string | null;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const SECTION_PATTERNS: { key: string; label: string; pattern: RegExp }[] = [
  { key: "experience", label: "Expériences", pattern: /experience|stage|alternance|emploi|poste occupe/ },
  { key: "formation", label: "Formation", pattern: /formation|diplome|etudes|bac\s?\+|licence|master|bts|but\b/ },
  { key: "competences", label: "Compétences", pattern: /competence|maitrise|outils?\s|logiciels?/ },
  { key: "langues", label: "Langues", pattern: /anglais|langue|toeic|toefl|bilingue|espagnol|allemand/ },
];

function hasEmail(text: string): boolean {
  return /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text);
}

function hasPhone(text: string): boolean {
  return /(0|\+33\s?)[1-9](\s?\d{2}){4}/.test(text);
}

function countQuantifiedResults(text: string): number {
  const matches = text.match(/\d+\s?(%|k€|€|clients?|utilisateurs?|ventes?|projets?|personnes?|heures?)/gi);
  return matches ? matches.length : 0;
}

export function auditCvTextStatic(cvText: string, context?: CvAuditContext): CvAudit {
  const normalized = normalize(cvText);
  const wordCount = cvText.split(/\s+/).filter(Boolean).length;

  let score = 55;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const missingSections: string[] = [];

  for (const { label, pattern } of SECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      score += 8;
      strengths.push(
        pick([
          `Section "${label}" bien identifiable.`,
          `La section "${label}" est présente et repérable.`,
        ]),
      );
    } else {
      score -= 4;
      missingSections.push(label);
      improvements.push(
        pick([
          `Ajoute une section "${label}" clairement identifiable (avec un titre visible).`,
          `Il manque une section "${label}" bien distincte dans ton CV.`,
        ]),
      );
    }
  }

  const contactOk = hasEmail(cvText) || hasPhone(cvText);
  if (contactOk) {
    score += 5;
    strengths.push(pick(["Coordonnées de contact présentes et faciles à trouver.", "On trouve facilement un moyen de te recontacter."]));
  } else {
    score -= 6;
    missingSections.push("Coordonnées");
    improvements.push(
      pick([
        "Ajoute clairement ton email et/ou ton téléphone en haut du CV : sans ça, impossible de te recontacter.",
        "Tes coordonnées (email, téléphone) ne ressortent pas clairement -- mets-les bien en évidence en haut de page.",
      ]),
    );
  }

  const quantified = countQuantifiedResults(cvText);
  if (quantified >= 2) {
    score += 8;
    strengths.push(
      pick([
        "Bons résultats chiffrés dans tes expériences, ça rend ton profil concret.",
        "Tu mets déjà en avant des chiffres concrets, c'est ce que les recruteurs retiennent le plus.",
      ]),
    );
  } else {
    improvements.push(
      pick([
        "Ajoute des résultats chiffrés à tes expériences (ex: \"+20% de trafic\", \"géré une équipe de 5 personnes\") : ça rend chaque ligne concrète et mémorable.",
        "Essaie de quantifier tes expériences (pourcentages, volumes, durées) plutôt que de rester descriptif.",
      ]),
    );
  }

  if (wordCount < 120) {
    score -= 10;
    improvements.push(
      pick([
        "Ton CV semble très court : détaille davantage tes expériences, projets et compétences.",
        "Le contenu extrait est assez léger -- n'hésite pas à en dire plus sur ce que tu as concrètement fait.",
      ]),
    );
  } else if (wordCount > 900) {
    score -= 6;
    improvements.push(
      pick([
        "Ton CV est assez dense : vise plutôt une page bien synthétique, un recruteur y passe quelques secondes.",
        "Essaie de condenser ton CV sur une page : le plus important doit sauter aux yeux immédiatement.",
      ]),
    );
  } else {
    strengths.push(pick(["Longueur adaptée pour être lu rapidement par un recruteur.", "Contenu ni trop court ni trop dense, bon équilibre."]));
  }

  const target = [...(context?.sectors ?? []), ...(context?.targetJobs ?? [])];
  if (target.length > 0) {
    const mentioned = target.some((t) => normalized.includes(normalize(t)));
    if (mentioned) {
      score += 6;
      strengths.push("Ton CV mentionne explicitement ce que tu vises, ça rassure le recruteur sur ta motivation.");
    } else {
      improvements.push(
        `Ton CV ne mentionne pas explicitement ${target[0]} : ajoute des mots-clés qui montrent clairement ta motivation pour ce que tu vises.`,
      );
    }
  }

  if (strengths.length === 0) {
    strengths.push("Ton CV a bien été analysé, mais peu d'éléments forts en ressortent pour l'instant.");
  }

  return {
    score: Math.max(35, Math.min(92, Math.round(score))),
    strengths: strengths.slice(0, 6),
    improvements: improvements.slice(0, 6),
    missing_sections: [...new Set(missingSections)].slice(0, 6),
  };
}
