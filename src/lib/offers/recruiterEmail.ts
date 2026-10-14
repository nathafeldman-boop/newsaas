// Adresse où envoyer une candidature par email : uniquement une adresse que
// le recruteur a publiée lui-même (champ contact de France Travail, ou
// « envoyez votre CV à … » dans l'annonce). Jamais d'adresse devinée :
// des envois à l'aveugle finiraient en spam et grilleraient la réputation
// des boîtes Gmail des étudiants.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Plateformes et intermédiaires : écrire là ne joint pas le recruteur.
const BLOCKED_DOMAINS = [
  "francetravail.fr",
  "pole-emploi.fr",
  "francetravail.org",
  "adzuna.fr",
  "adzuna.com",
  "indeed.com",
  "indeed.fr",
  "linkedin.com",
  "welcometothejungle.com",
  "hellowork.com",
  "jobteaser.com",
  "monster.fr",
  "apec.fr",
  "stageio.fr",
  "example.com",
];

// Adresses qui ne servent pas à candidater (protection des données,
// automates, standard de facturation…).
const BLOCKED_LOCAL = /^(no-?reply|ne-?pas-?repondre|donotreply|mailer-daemon|postmaster|dpo|rgpd|gdpr|privacy|donnees|cnil|compta|facturation|invoice|abuse|webmaster)\b/i;

// Mots qui signalent l'adresse de candidature quand l'annonce en cite plusieurs.
const PREFERRED_LOCAL = /recrut|rh\b|^rh|drh|job|emploi|career|carriere|candidat|talent|hr\b|^hr|stage|alternance|apprenti/i;

function isUsable(email: string): boolean {
  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain) return false;
  if (BLOCKED_LOCAL.test(local)) return false;
  if (BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return false;
  // Fichiers pris pour des adresses (« logo@2x.png »).
  if (/\.(png|jpe?g|gif|svg|webp|pdf)$/i.test(domain)) return false;
  return true;
}

export function extractRecruiterEmail(text: string | null | undefined): string | null {
  if (!text) return null;
  const found = [...new Set((text.match(EMAIL_RE) ?? []).map((e) => e.replace(/[.,;:]+$/, "").toLowerCase()))].filter(
    isUsable,
  );
  if (found.length === 0) return null;
  return found.find((e) => PREFERRED_LOCAL.test(e.split("@")[0])) ?? found[0];
}

export function recipientForOffer(offer: { contact_email?: string | null; description?: string | null }): string | null {
  return extractRecruiterEmail(offer.contact_email) ?? extractRecruiterEmail(offer.description);
}
