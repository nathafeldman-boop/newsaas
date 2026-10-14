import { SITE_URL } from "@/lib/site";

// Partagé par api/gmail/connect et api/gmail/callback (un fichier route.ts
// ne peut exporter que ses méthodes HTTP et sa configuration).
export const GMAIL_STATE_COOKIE = "gmail_oauth_state";
// Envoi seulement (14/10) : un like envoie la candidature depuis le Gmail de
// l'étudiant. gmail.send est une autorisation « sensible » (validation Google
// gratuite) ; la lecture (gmail.readonly) est « restreinte » et imposerait un
// audit de sécurité payant chaque année -- on ne la demande plus.
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";
// Anciennes connexions (avant le 14/10) : seule cette autorisation permet le
// suivi des réponses (cron sync-gmail-replies).
export const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const gmailRedirectUri = () => `${SITE_URL}/api/gmail/callback`;

// Page où revenir après Google (?next=…) : chemin interne uniquement, jamais
// une autre adresse (sinon n'importe quel lien pourrait renvoyer ailleurs).
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next.length <= 300 ? next : null;
}

// Ajoute ?gmail=<statut> à la page de retour.
export function withGmailStatus(path: string, status: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}gmail=${encodeURIComponent(status)}`;
}
