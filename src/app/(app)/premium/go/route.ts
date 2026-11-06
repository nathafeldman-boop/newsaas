import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { startCheckout } from "@/lib/stripe/startCheckout";
import { verifyGoParams } from "@/lib/premium/goLink";
import { GO_CHOICE, isGoCheckoutPlan } from "@/lib/premium/goOffer";

// Lien des emails de la série Premium (24/10, Nathan : « direct au paiement,
// mais l'email doit être un deuxième paywall ») : /premium/go?plan=lifetime
// ou ?plan=monthly mène droit à la page de paiement Stripe, au prix affiché
// dans l'email (prix de bienvenue, repartis de zéro depuis l'email).
//
// Pas connecté (6/11) : si le lien est signé (lib/premium/goLink.ts), la page
// publique /paiement montre la formule et son prix, et un bouton ouvre le
// paiement Stripe du compte, sans connexion. Le bouton, et pas l'arrivée sur
// la page : les robots qui ouvrent les liens des emails (antispam) ne créent
// ainsi ni paiement, ni relance, ni début du délai de l'offre. Lien sans
// signature, ou expiré : connexion puis retour ici, comme avant.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const plan = params.get("plan");
  // auto_lifetime : Stageio Auto à vie (salve du 5/11, offre 48 h).
  // choix (6/11) : pas de formule, le compte choisit (paywall, ou /paiement
  // avec le mensuel et l'accès à vie sans connexion).
  const choice = plan === GO_CHOICE;
  if (!choice && !isGoCheckoutPlan(plan)) {
    return NextResponse.redirect(new URL("/premium", request.url), 303);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (verifyGoParams({ u: params.get("u"), e: params.get("e"), s: params.get("s") })) {
      // Sans les utm : le clic est déjà compté sur ce lien.
      const page = new URL("/paiement", request.url);
      for (const key of choice ? ["u", "e", "s"] : ["plan", "u", "e", "s"]) page.searchParams.set(key, params.get(key)!);
      return NextResponse.redirect(page, 303);
    }
    const back = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(back)}`, request.url), 303);
  }

  if (choice) return NextResponse.redirect(new URL("/premium", request.url), 303);
  if (!isGoCheckoutPlan(plan)) return NextResponse.redirect(new URL("/premium", request.url), 303);

  // Le prix est calculé avant d'enregistrer ce passage, comme sur /premium :
  // le premier passage après l'email ouvre les 10 minutes du prix de bienvenue.
  const result = await startCheckout({ id: user.id, email: user.email ?? null }, plan);
  after(() => logServerEvent(createAdminClient(), user.id, "paywall_viewed", { source: "email_go", plan }));
  if ("error" in result) {
    return NextResponse.redirect(new URL(`/premium?error=${result.error}`, request.url), 303);
  }
  return NextResponse.redirect(result.url, 303);
}
