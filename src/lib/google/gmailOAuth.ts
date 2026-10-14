import { SITE_URL } from "@/lib/site";

// Partagé par api/gmail/connect et api/gmail/callback (un fichier route.ts
// ne peut exporter que ses méthodes HTTP et sa configuration).
export const GMAIL_STATE_COOKIE = "gmail_oauth_state";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const gmailRedirectUri = () => `${SITE_URL}/api/gmail/callback`;
