import { NextResponse, type NextRequest } from "next/server";
import { refreshCreatorVideos } from "@/lib/creators/store";

// Relevé des vues des TikTok des créateurs, toutes les 30 min (vercel.json,
// Nathan 18/11 : espace créateurs).
// Vercel Cron envoie "Authorization: Bearer $CRON_SECRET".
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const result = await refreshCreatorVideos();
    console.log(`tiktok-views: ${result.checked} vidéo(s) relevée(s), ${result.failed} en échec`);
    return NextResponse.json(result);
  } catch (err) {
    console.error("tiktok-views cron failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
