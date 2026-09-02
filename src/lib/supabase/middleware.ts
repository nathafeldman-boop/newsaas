import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// /offres (+ /offres/[slug]) est le seul contenu app censé être indexable
// sans compte (voir robots.ts / sitemap.ts) ; robots.txt et sitemap.xml
// doivent eux-mêmes rester atteignables par un crawler non connecté, sinon
// Google ne peut même pas découvrir qu'ils existent. /admin gère son propre
// accès par code (voir lib/admin/accessCode.ts) et ne doit jamais dépendre
// d'une session Supabase.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/inscription",
  "/auth",
  "/legal",
  "/offres",
  "/robots.txt",
  "/sitemap.xml",
  "/admin",
];
const ONBOARDING_EXEMPT_PATHS = ["/onboarding", "/auth", "/admin"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  // Propagée aux Server Components via `headers()` : le layout partagé de
  // (app) en a besoin pour savoir sur quelle page il tourne (évite une
  // boucle de redirection paywall sur /premium lui-même).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const requestInit = { request: { headers: requestHeaders } };

  let supabaseResponse = NextResponse.next(requestInit);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next(requestInit);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (matchesPath(pathname, PUBLIC_PATHS)) {
      return supabaseResponse;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Utilisateur connecté mais onboarding pas terminé -> on le redirige, sauf
  // sur les pages déjà exemptées (onboarding lui-même, callbacks auth).
  if (!matchesPath(pathname, ONBOARDING_EXEMPT_PATHS)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
