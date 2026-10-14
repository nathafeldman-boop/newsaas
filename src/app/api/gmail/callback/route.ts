import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { GMAIL_SCOPE, GMAIL_STATE_COOKIE, gmailRedirectUri, safeNextPath, withGmailStatus } from "@/lib/google/gmailOAuth";

// Retour sur la page d'où la connexion a été demandée (voir ?next= dans
// api/gmail/connect), sinon le profil.
function back(returnPath: string, status: string): NextResponse {
  const response = NextResponse.redirect(`${SITE_URL}${withGmailStatus(returnPath, status)}`);
  response.cookies.set(GMAIL_STATE_COOKIE, "", { path: "/api/gmail", maxAge: 0 });
  return response;
}

function emailFromIdToken(idToken: string | undefined): string | null {
  const payload = idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const [savedState, savedUserId, savedNext] = (request.cookies.get(GMAIL_STATE_COOKIE)?.value ?? "").split(".");
  const returnPath =
    safeNextPath(savedNext ? Buffer.from(savedNext, "base64url").toString("utf8") : null) ?? "/profil";
  // Refus sur l'écran de Google, ou appli bloquée tant que Google ne l'a pas
  // validée pour l'accès Gmail (« Accès bloqué ») : error=access_denied.
  const googleError = params.get("error");
  if (googleError) {
    console.error("gmail/callback: Google a refusé", googleError);
    return back(returnPath, googleError === "access_denied" ? "refused" : "error");
  }

  const code = params.get("code");
  if (!code || !savedState || params.get("state") !== savedState) return back(returnPath, "error");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== savedUserId) return back(returnPath, "error");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return back(returnPath, "config");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    console.error("gmail/callback: échange du code refusé", tokenResponse.status, (await tokenResponse.text()).slice(0, 300));
    return back(returnPath, "error");
  }
  const tokens = (await tokenResponse.json()) as { refresh_token?: string; id_token?: string; scope?: string };

  // Case « Gmail » décochée sur l'écran de Google : connecté, mais sans accès.
  if (!tokens.scope?.split(" ").includes(GMAIL_SCOPE)) return back(returnPath, "scope");
  if (!tokens.refresh_token) return back(returnPath, "no_refresh_token");

  const { error: upsertError } = await supabase.from("email_connections").upsert(
    {
      user_id: user.id,
      provider: "gmail",
      email_address: emailFromIdToken(tokens.id_token) ?? user.email ?? "",
      refresh_token: tokens.refresh_token,
      last_synced_at: null,
    },
    { onConflict: "user_id,provider" },
  );
  if (upsertError) {
    console.error("gmail/callback: enregistrement en échec", upsertError);
    return back(returnPath, "error");
  }
  return back(returnPath, "connected");
}
