import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// Seules ces routes exigent un compte : un visiteur anonyme y est renvoyé
// vers /login. Tout le reste passe (pages publiques, robots.txt, sitemaps,
// /admin qui gère son propre accès par code -- voir lib/admin/accessCode.ts)
// -- y compris les URLs qui n'existent pas, qui doivent recevoir un vrai 404
// de Next. Avant le 06/10, la logique était inversée (liste blanche des
// pages publiques) : toute URL inconnue ou supprimée répondait par une
// redirection vers /login, que Google traite comme un "soft 404".
// ⚠️ Toute nouvelle page réservée aux membres (dossier src/app/(app)/ ou
// /onboarding) DOIT être ajoutée ici.
const PROTECTED_PATHS = [
  "/dashboard",
  "/swipe",
  "/favoris",
  "/mes-candidatures",
  "/candidature",
  "/cv",
  "/profil",
  "/parrainage",
  "/premium",
  "/affilies",
  "/onboarding",
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
    if (!matchesPath(pathname, PROTECTED_PATHS)) {
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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // Ce middleware tourne sur CHAQUE navigation authentifiée : `profile`
    // vaut `null` aussi bien sur un vrai profil pas encore créé QUE sur un
    // pépin transitoire de requête (DB lente/indisponible un instant), et
    // les deux étaient jusqu'ici indiscernables (erreur jamais loggée). On
    // garde volontairement le fail-open (laisser passer plutôt que
    // rediriger) : un fail-closed sur un blip transitoire renverrait TOUS
    // les utilisateurs connectés vers /onboarding à chaque navigation
    // pendant l'incident -- y compris ceux dont l'onboarding est déjà
    // terminé depuis longtemps -- un rayon d'impact bien pire qu'un onboarding
    // non terminé qui reste temporairement joignable. Le log rend au moins
    // le problème diagnosticable au lieu de disparaître silencieusement.
    if (profileError) {
      console.error("updateSession: profile fetch failed", profileError, { userId: user.id, pathname });
    }

    if (profile && !profile.onboarding_completed) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
