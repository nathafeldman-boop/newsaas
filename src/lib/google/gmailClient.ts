// Client Gmail minimal en fetch() direct (pas de dépendance googleapis).
// Le refresh_token est obtenu une fois par /api/gmail/connect puis
// /api/gmail/callback, et stocké ; ce module l'échange ensuite contre un
// access_token à chaque usage.

interface GmailMessageMetadata {
  id: string;
  snippet: string;
  from: string | null;
  subject: string | null;
  date: string | null;
}

export async function refreshGmailAccessToken(refreshToken: string): Promise<string> {
  return (await refreshGmailAccess(refreshToken)).accessToken;
}

// Comme refreshGmailAccessToken, avec en plus les autorisations réellement
// accordées (Google les renvoie à chaque échange) : une connexion faite
// avant le 14/10 ne peut que lire, une connexion récente ne peut qu'envoyer.
export async function refreshGmailAccess(
  refreshToken: string,
): Promise<{ accessToken: string; scopes: string[] }> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET manquants côté serveur.",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Échec du refresh du token Gmail (HTTP ${res.status}) : ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token: string; scope?: string };
  return { accessToken: json.access_token, scopes: (json.scope ?? "").split(" ").filter(Boolean) };
}

/**
 * Envoie un email déjà composé (RFC 2822, voir buildApplicationEmail) depuis
 * la boîte de l'utilisateur. Point d'envoi « upload » : accepte un message
 * brut avec pièce jointe jusqu'à 35 Mo, sans encodage base64url du tout.
 */
export async function sendGmailMessage(accessToken: string, mime: string): Promise<{ id: string }> {
  const res = await fetch("https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "message/rfc822" },
    body: mime,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Échec de l'envoi Gmail (HTTP ${res.status}) : ${body.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string };
}

/**
 * Liste les IDs de messages reçus depuis `afterDate`, puis récupère les
 * métadonnées (From/Subject/Date + snippet) de chacun — jamais le corps
 * complet, inutile pour la classification de sentiment et évite le
 * décodage MIME.
 */
export async function listRecentMessages(
  accessToken: string,
  afterDate: Date,
  maxResults = 20,
): Promise<GmailMessageMetadata[]> {
  const dateStr = `${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`;
  const query = `after:${dateStr} category:primary`;

  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", String(maxResults));

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    const body = await listRes.text().catch(() => "");
    throw new Error(`Échec de la liste Gmail (HTTP ${listRes.status}) : ${body.slice(0, 300)}`);
  }
  const listJson = (await listRes.json()) as {
    messages?: { id: string }[];
  };
  const ids = (listJson.messages ?? []).map((m) => m.id);

  const messages: GmailMessageMetadata[] = [];
  for (const id of ids) {
    const msgUrl = new URL(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
    );
    msgUrl.searchParams.set("format", "metadata");
    msgUrl.searchParams.append("metadataHeaders", "From");
    msgUrl.searchParams.append("metadataHeaders", "Subject");
    msgUrl.searchParams.append("metadataHeaders", "Date");

    const msgRes = await fetch(msgUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!msgRes.ok) continue; // un message inaccessible ne doit pas casser le sync entier

    const msgJson = (await msgRes.json()) as {
      id: string;
      snippet?: string;
      payload?: { headers?: { name: string; value: string }[] };
    };
    const headers = msgJson.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;

    messages.push({
      id: msgJson.id,
      snippet: msgJson.snippet ?? "",
      from: getHeader("From"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
    });
  }

  return messages;
}
