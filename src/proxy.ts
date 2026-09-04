import { type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { logVisit } from "@/lib/analytics/logVisit";

const VISITOR_COOKIE = "sid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await updateSession(request);

  // Id visiteur anonyme stable (cookie) : sert uniquement à compter des
  // visiteurs distincts pour le dashboard admin (voir logVisit) -- posé ici
  // même sur une réponse de redirection, sinon un visiteur jamais connecté
  // qui atterrit sur une page protégée et se fait rediriger vers /login ne
  // recevrait jamais son cookie.
  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // waitUntil (proxy tourne sur le runtime Node.js depuis Next 16) : la
  // navigation réelle ne doit jamais attendre ce log analytics, ni échouer
  // à cause de lui.
  event.waitUntil(
    logVisit(visitorId, request.nextUrl.pathname, request.headers.get("user-agent")),
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
