import { type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { logVisit } from "@/lib/analytics/logVisit";
import { logAffiliateClick } from "@/lib/affiliates/logAffiliateClick";

const VISITOR_COOKIE = "sid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

const AFFILIATE_COOKIE = "aff_code";
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours -- fenêtre d'attribution

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

  // Clic sur un lien d'affiliation (?aff=CODE) -- avant même l'inscription,
  // donc capturé ici plutôt que côté formulaire : fonctionne même si la
  // personne quitte sans jamais s'inscrire, ce qui est justement ce qu'un
  // affilié veut pouvoir mesurer (clics vs inscriptions réelles).
  const affCode = request.nextUrl.searchParams.get("aff");
  if (affCode) {
    event.waitUntil(
      logAffiliateClick(visitorId, affCode, request.headers.get("user-agent")),
    );
    // Le lien affilié pointe sur la home (pas directement /inscription), pour
    // que le trafic froid voie l'argumentaire avant de se retrouver sur un
    // formulaire -- ce cookie fait persister le code jusqu'à l'inscription,
    // quel que soit le chemin de clic emprunté ensuite sur la landing page.
    response.cookies.set(AFFILIATE_COOKIE, affCode, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
