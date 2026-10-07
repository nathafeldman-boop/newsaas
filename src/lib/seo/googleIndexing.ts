import { createSign } from "node:crypto";

// Google Indexing API : signale à Google une URL nouvelle ou supprimée, qui
// la recrawle en quelques minutes au lieu de quelques jours. Google ne
// l'autorise QUE pour les pages d'offres d'emploi (JobPosting) et de
// livestreams : on n'y envoie que des fiches offres éligibles à Google Jobs
// (voir jobPosting.ts). C'est le levier n°1 du trafic hors marque : d'après
// Search Console, il vient des fiches offres (Google Jobs), qui ne vivent
// que quelques semaines.
//
// Authentification : compte de service Google Cloud, ajouté comme
// PROPRIÉTAIRE de la propriété Search Console, dont la clé JSON est dans
// GOOGLE_INDEXING_SERVICE_ACCOUNT (JSON brut ou encodé en base64). Quota par
// défaut : 200 notifications par jour (augmentable sur demande à Google).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";

type ServiceAccount = { client_email: string; private_key: string };

export function readServiceAccount(raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT): ServiceAccount | null {
  if (!raw?.trim()) return null;
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw.trim(), "base64").toString("utf8");
  const json = JSON.parse(text) as Partial<ServiceAccount>;
  if (!json.client_email || !json.private_key) {
    throw new Error("GOOGLE_INDEXING_SERVICE_ACCOUNT : client_email ou private_key manquant.");
  }
  // Les clés collées dans une variable d'environnement gardent parfois les
  // "\n" échappés.
  return { client_email: json.client_email, private_key: json.private_key.replace(/\\n/g, "\n") };
}

const base64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export function signedJwt(account: ServiceAccount, now = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = base64url(createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.private_key));
  return `${header}.${claims}.${signature}`;
}

async function accessToken(account: ServiceAccount): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signedJwt(account) }),
  });
  if (!response.ok) throw new Error(`Google OAuth HTTP ${response.status} : ${(await response.text()).slice(0, 300)}`);
  return ((await response.json()) as { access_token: string }).access_token;
}

export type IndexingNotification = { url: string; type: "URL_UPDATED" | "URL_DELETED" };
export type IndexingResult = { sent: number; failed: number; quotaReached: boolean; errors: string[] };

// Envoie les notifications dans l'ordre (les plus importantes d'abord),
// 5 à la fois, et s'arrête au premier 429 (quota du jour atteint).
export async function notifyGoogle(account: ServiceAccount, notifications: IndexingNotification[]): Promise<IndexingResult> {
  const token = await accessToken(account);
  const result: IndexingResult = { sent: 0, failed: 0, quotaReached: false, errors: [] };
  let next = 0;
  const lane = async () => {
    while (next < notifications.length && !result.quotaReached) {
      const notification = notifications[next++];
      const response = await fetch(PUBLISH_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
      if (response.ok) {
        result.sent += 1;
      } else if (response.status === 429) {
        result.quotaReached = true;
      } else {
        result.failed += 1;
        if (result.errors.length < 5) result.errors.push(`${response.status} ${notification.url} : ${(await response.text()).slice(0, 200)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, lane));
  return result;
}
