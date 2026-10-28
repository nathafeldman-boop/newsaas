import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { parisMidnightIso } from "@/lib/applications/autoSend";
import { APPLY_CALLS_PER_MINUTE } from "@/lib/laBonneAlternance/client";
import { AUTO_SPONTANEOUS_PER_DAY, contactedBy, loadTargets } from "@/lib/spontaneous/targets";
import { missingForLba, sendSpontaneous } from "@/lib/spontaneous/send";
import type { Profile } from "@/types/database";

// Stageio Auto (28/10, Nathan : « avec celle à 18 euros, tout est en
// auto ») : chaque jour, jusqu'à 20 entreprises de la liste des candidatures
// spontanées reçoivent la candidature de l'abonné, sans qu'il fasse rien.
// Appelé à chaque passage horaire du cron des abonnés (9 h à 19 h) : une
// part du quota du jour par abonné, les moins servis d'abord. La bonne
// alternance accepte 10 envois par minute pour tout Stageio (likes compris) :
// 6 par minute au plus ici.

type Admin = ReturnType<typeof createAdminClient>;

const SEND_INTERVAL_MS = Math.ceil(60_000 / Math.min(6, APPLY_CALLS_PER_MINUTE));
const PER_RUN = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAutoSpontaneous(admin: Admin, deadline: number, now: number = Date.now()) {
  const midnight = parisMidnightIso(now);
  // Abonnés Auto encore en recherche, prêts à envoyer (CV, téléphone, nom).
  const profiles = (
    await fetchAllRowsByIdCursor<Profile>((afterId, limit) => {
      let q = admin.from("profiles").select("*").in("premium_tier", ["auto", "auto_lifetime"]).is("search_completed_at", null);
      if (afterId) q = q.gt("id", afterId);
      return q.order("id").limit(limit) as unknown as PromiseLike<{ data: Profile[] | null; error: { message: string } | null }>;
    })
  ).filter((p) => isAutoTier(p) && missingForLba(p).length === 0);

  const queue: { profile: Profile; sentToday: number; contacted: Set<string> }[] = [];
  for (const profile of profiles) {
    const contacted = await contactedBy(admin, profile.id, midnight);
    if (contacted.auto < AUTO_SPONTANEOUS_PER_DAY) queue.push({ profile, sentToday: contacted.auto, contacted: contacted.ids });
  }
  queue.sort((a, b) => a.sentToday - b.sentToday);

  const summary = { autoProfiles: profiles.length, queued: queue.length, sent: 0, skipped: 0, failures: 0, busy: 0 };
  for (const { profile, sentToday, contacted } of queue) {
    if (Date.now() > deadline) break;
    const targets = await loadTargets(profile);
    if (targets.status !== "ok") {
      summary.skipped++;
      continue;
    }
    const next = targets.targets.filter((t) => !contacted.has(t.recipientId)).slice(0, Math.min(PER_RUN, AUTO_SPONTANEOUS_PER_DAY - sentToday));
    for (const target of next) {
      if (Date.now() > deadline) break;
      const sendStarted = Date.now();
      const result = await sendSpontaneous(admin, profile, target, "auto");
      if (result.status === "sent") summary.sent++;
      else if (result.status === "busy") summary.busy++;
      else summary.failures++;
      if (result.status === "missing" || result.status === "cv_too_big" || result.status === "off") break;
      await sleep(Math.max(0, SEND_INTERVAL_MS - (Date.now() - sendStarted)));
    }
  }
  return summary;
}
