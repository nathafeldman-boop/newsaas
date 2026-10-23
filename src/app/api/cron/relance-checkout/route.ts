import { NextResponse, type NextRequest } from "next/server";
import { sendCheckoutRelance } from "@/lib/campaigns/relanceCheckout";

// Relance ponctuelle des paiements non finalisés (Nathan, 23/10 : « une
// petite salve dans 10-15 minutes »), voir relanceCheckout.ts. vercel.json
// l'appelle chaque jour à la même heure ; elle ne part que le 23/10, et un
// second passage n'enverrait rien (chaque compte est noté à l'envoi).
export const maxDuration = 120;

const SEND_DAY = "2026-10-23";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (new Date().toISOString().slice(0, 10) !== SEND_DAY) return NextResponse.json({ kind: "skipped" });

  const result = await sendCheckoutRelance();
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("relance-checkout: problèmes", result.failures.slice(0, 5));
  }
  console.log("relance-checkout", JSON.stringify({ ...result, failures: undefined }));
  return NextResponse.json(result);
}
