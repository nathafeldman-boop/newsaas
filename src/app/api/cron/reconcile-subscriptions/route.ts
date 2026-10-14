import { NextResponse, type NextRequest } from "next/server";
import { reconcileAllSubscriptions } from "@/lib/stripe/reconcileSubscriptions";

// Cron quotidien (voir vercel.json, demande de Nathan du 14/10 : ne plus
// avoir à cliquer sur « Lancer la réconciliation » dans /admin/premium).
// Chaque compte lié à Stripe reprend le vrai statut de son abonnement :
// annulé ou impayé = plus de Premium ; accès à vie et codes offerts
// intacts. Vercel Cron envoie "Authorization: Bearer $CRON_SECRET".
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const result = await reconcileAllSubscriptions("cron/reconcile-subscriptions");
  if (!result.ok) return NextResponse.json({ error: "Lecture des profils en échec." }, { status: 500 });
  return NextResponse.json(result);
}
