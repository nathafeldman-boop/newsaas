import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { GMAIL_SCOPE, GMAIL_STATE_COOKIE, gmailRedirectUri } from "@/lib/google/gmailOAuth";

// Connexion Gmail par notre propre autorisation Google (14/10), à la place de
// supabase.auth.signInWithOAuth : celle-ci CONNECTAIT l'utilisateur avec son
// compte Google, donc une boîte Gmail différente de l'email du compte Stageio
// ouvrait un autre compte (ou échouait), et l'erreur de Google n'était jamais
// montrée. Ici le compte Stageio ne change pas : on demande seulement à
// Google un accès en lecture à Gmail pour ce compte.

export async function GET(request: NextRequest) {
  // Le cookie de vérification doit être posé sur le domaine où Google
  // renverra la personne (SITE_URL) : on y repasse d'abord si besoin.
  const canonical = new URL(SITE_URL);
  if (request.nextUrl.host !== canonical.host) {
    return NextResponse.redirect(`${SITE_URL}/api/gmail/connect`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${SITE_URL}/login?next=/profil`);

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.error("gmail/connect: GOOGLE_OAUTH_CLIENT_ID ou GOOGLE_OAUTH_CLIENT_SECRET manquant");
    return NextResponse.redirect(`${SITE_URL}/profil?gmail=config`);
  }

  const state = randomBytes(24).toString("base64url");
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", clientId);
  google.searchParams.set("redirect_uri", gmailRedirectUri());
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", `openid email ${GMAIL_SCOPE}`);
  google.searchParams.set("access_type", "offline");
  google.searchParams.set("prompt", "consent");
  google.searchParams.set("state", state);
  if (user.email) google.searchParams.set("login_hint", user.email);

  const response = NextResponse.redirect(google.toString());
  response.cookies.set(GMAIL_STATE_COOKIE, `${state}.${user.id}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/gmail",
    maxAge: 600,
  });
  return response;
}
