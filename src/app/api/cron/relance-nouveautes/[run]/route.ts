import { NextResponse, type NextRequest } from "next/server";
import { CAMPAIGNS } from "@/lib/campaigns/relanceOffres";
import { sendCampaignCopy, sendNextCampaignBatch } from "@/lib/campaigns/sendBatch";

// Campagne « nouveautés » envoyée toute seule (23/10, Nathan : « relance
// toi-même », « à partir de 8 h, 200-300 emails par heure », forfait Resend
// payant). vercel.json : un passage par heure de 8 h à 20 h (heure d'été),
// chacun envoie le lot suivant (250 le matin, 400 à partir de 13 h : Nathan,
// 23/10) avec les garde-fous de /admin/relance
// (jamais deux fois le même compte, plafond par 24 h, payants, désabonnés et
// actifs récents exclus) ; ne fait rien quand il ne reste personne.
// Le passage « copie » du 23/10 (7 h 35) envoie seulement une copie de
// contrôle à Nathan avant le premier lot.
export const maxDuration = 300;

const MORNING_BATCH = 250;
const AFTERNOON_BATCH = 400;
// Passages « hNN » à l'heure NN UTC : 11 h UTC = 13 h à Paris (heure d'été).
const AFTERNOON_FROM_UTC_HOUR = 11;
const COPY_DAY = "2026-10-23";
const COPY_TO = "nathafeldman0@gmail.com";

export async function GET(request: NextRequest, { params }: { params: Promise<{ run: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const { run } = await params;
  if (run === "copie") {
    if (new Date().toISOString().slice(0, 10) !== COPY_DAY) return NextResponse.json({ kind: "skipped" });
    const copy = await sendCampaignCopy(CAMPAIGNS.nouveautes, COPY_TO);
    if (!copy.ok) console.error("relance-nouveautes: copie de contrôle en échec", copy.reason);
    return NextResponse.json({ kind: "copy", ...copy });
  }

  const hour = Number(run.replace(/^h/, ""));
  const batchSize = Number.isFinite(hour) && hour >= AFTERNOON_FROM_UTC_HOUR ? AFTERNOON_BATCH : MORNING_BATCH;
  const result = await sendNextCampaignBatch(CAMPAIGNS.nouveautes, batchSize);
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("relance-nouveautes: problèmes", result.failures.slice(0, 5));
  }
  console.log("relance-nouveautes", run, JSON.stringify({ ...result, failures: undefined }));
  return NextResponse.json(result);
}
