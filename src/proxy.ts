import { type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { logVisit } from "@/lib/analytics/logVisit";
import { logAffiliateClick } from "@/lib/affiliates/logAffiliateClick";

const VISITOR_COOKIE = "sid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

const AFFILIATE_COOKIE = "aff_code";
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours -- fenêtre d'attribution

const UTM_SOURCE_COOKIE = "utm_source";
const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // même fenêtre d'attribution que aff_code

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

  // UTM (?utm_source=tiktok&utm_medium=...&utm_campaign=...) : posé par les
  // pubs, jamais par nos propres liens internes -- seul le premier
  // atterrissage les porte dans l'URL, donc on les persiste en cookie (même
  // fenêtre que aff_code) pour qu'ils survivent jusqu'à l'inscription même
  // si la personne navigue plusieurs pages avant de créer un compte. Sans
  // ça, aucun moyen de savoir combien des visites d'une campagne donnée se
  // convertissent réellement (voir Nathan, 27/09 : 106 clics TikTok
  // rapportés vs 6 inscriptions, sans donnée pour départager clics
  // non-qualifiés / abandon avant inscription / bug technique).
  const utmSource = request.nextUrl.searchParams.get("utm_source");
  const utmMedium = request.nextUrl.searchParams.get("utm_medium");
  const utmCampaign = request.nextUrl.searchParams.get("utm_campaign");
  if (utmSource) {
    response.cookies.set(UTM_SOURCE_COOKIE, utmSource, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // waitUntil (proxy tourne sur le runtime Node.js depuis Next 16) : la
  // navigation réelle ne doit jamais attendre ce log analytics, ni échouer
  // à cause de lui.
  event.waitUntil(
    logVisit(visitorId, request.nextUrl.pathname, request.headers.get("user-agent"), {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
    }),
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
