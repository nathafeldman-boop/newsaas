import { NextResponse, type NextRequest } from "next/server";
import { sendDailyCheckoutRelance } from "@/lib/campaigns/relanceCheckoutDaily";

// Paiements Stripe non finalisés, relancés chaque matin (Nathan, 25/10 :
// « comme un panier abandonné »), voir relanceCheckoutDaily.ts. Avant : une
// relance ponctuelle le 23/10 seulement (relanceCheckout.ts).
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await sendDailyCheckoutRelance();
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("relance-checkout: problèmes", result.failures.slice(0, 5));
  }
  console.log("relance-checkout", JSON.stringify(result.kind === "sent" ? { ...result, failures: result.failures.length } : result));
  return NextResponse.json(result);
}
