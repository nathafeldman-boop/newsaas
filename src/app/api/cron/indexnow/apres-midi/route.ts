import type { NextRequest } from "next/server";
import { handleIndexNowCron } from "@/lib/seo/indexNowCron";

// Envoi de l'après-midi (16 h 40 UTC) : les offres importées par les
// passages de jour de la synchro France Travail (8 h 10 à 15 h 10 UTC)
// partent chez Bing le jour même. 12 h suffisent : l'envoi du matin couvre
// déjà la nuit.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleIndexNowCron(request, 12);
}
