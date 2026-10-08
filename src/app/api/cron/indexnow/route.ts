import type { NextRequest } from "next/server";
import { LOOKBACK_HOURS, handleIndexNowCron } from "@/lib/seo/indexNowCron";

// Envoi du matin (5 h 30 UTC), après les synchros de la nuit.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleIndexNowCron(request, LOOKBACK_HOURS);
}
