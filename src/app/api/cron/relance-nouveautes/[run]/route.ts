import { NextResponse, type NextRequest } from "next/server";
import { CAMPAIGNS, NEWS_TEST_END, NEWS_TEST_START } from "@/lib/campaigns/relanceOffres";
import { sendCampaignCopy, sendNextCampaignBatch } from "@/lib/campaigns/sendBatch";

// Campagne « nouveautés » envoyée toute seule (23/10, Nathan : « relance
// toi-même »). vercel.json : un passage par heure ; chacun envoie le lot
// suivant avec les garde-fous de /admin/relance (jamais deux fois le même
// compte, plafond par 24 h, payants, désabonnés et actifs récents exclus).
// 1re vague le 23/10 (250 puis 400 par heure) : tout le monde l'a reçue.
// Le cron ne repart que pour le test des 4 versions (Nathan, 23/10 : « 400 à
// 500 emails par jour, pendant une semaine ») : du lundi 26/10 au dimanche
// 1/11, 50 emails par passage de 9 h à 18 h (heure de Paris), donc 500 par
// jour au plus, moins s'il reste moins de comptes à prévenir.
// Le passage « copie » du 26/10 (6 h 35) envoie à Nathan une copie de
// chaque version avant le premier lot.
export const maxDuration = 300;

const RUN_BATCH = 50;
// Passages « hNN » à l'heure NN UTC (Paris = UTC+1 à partir du 25/10).
const FIRST_UTC_HOUR = 8;
const LAST_UTC_HOUR = 17;
const COPY_DAY = "2026-10-26";
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
  const now = Date.now();
  if (now < NEWS_TEST_START || now > NEWS_TEST_END || !(hour >= FIRST_UTC_HOUR && hour <= LAST_UTC_HOUR)) {
    return NextResponse.json({ kind: "skipped" });
  }
  const result = await sendNextCampaignBatch(CAMPAIGNS.nouveautes, RUN_BATCH);
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("relance-nouveautes: problèmes", result.failures.slice(0, 5));
  }
  console.log("relance-nouveautes", run, JSON.stringify({ ...result, failures: undefined }));
  return NextResponse.json(result);
}
