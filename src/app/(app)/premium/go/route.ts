import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { startCheckout } from "@/lib/stripe/startCheckout";

// Lien des emails de la série Premium (24/10, Nathan : « direct au paiement,
// mais l'email doit être un deuxième paywall ») : /premium/go?plan=lifetime
// ou ?plan=monthly mène droit à la page de paiement Stripe, au prix affiché
// dans l'email (prix de bienvenue, repartis de zéro depuis l'email). Pas
// connecté : connexion puis retour ici. Rien ne se passe sans session, donc
// les robots qui ouvrent les liens des emails (antispam) ne créent ni
// paiement ni délai de bienvenue.
export async function GET(request: NextRequest) {
  const plan = request.nextUrl.searchParams.get("plan");
  if (plan !== "monthly" && plan !== "lifetime") {
    return NextResponse.redirect(new URL("/premium", request.url), 303);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(back)}`, request.url), 303);
  }

  // Le prix est calculé avant d'enregistrer ce passage, comme sur /premium :
  // le premier passage après l'email ouvre les 10 minutes du prix de bienvenue.
  const result = await startCheckout({ id: user.id, email: user.email ?? null }, plan);
  after(() => logServerEvent(createAdminClient(), user.id, "paywall_viewed", { source: "email_go", plan }));
  if ("error" in result) {
    return NextResponse.redirect(new URL(`/premium?error=${result.error}`, request.url), 303);
  }
  return NextResponse.redirect(result.url, 303);
}
