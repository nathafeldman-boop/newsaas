import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { computeMatchScore } from "@/lib/matching/score";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { knownProfileSectors } from "@/lib/offers/sectors";
import {
  ALERT_SENT_EVENT,
  ALERT_TAG,
  DEFAULT_DAILY_CAP,
  MAX_OFFERS_PER_EMAIL,
  alertFrequency,
  isDue,
  renderOfferAlert,
  windowStart,
  type AlertFrequency,
} from "@/lib/alerts/offerAlert";
import { isPremium } from "@/lib/subscription/isPremium";
import { SPONTANEOUS_EVENT } from "@/lib/spontaneous/targets";
import type { AlertRecap } from "@/lib/alerts/offerAlert";
import type { Profile } from "@/types/database";

// Cron quotidien (voir vercel.json) : alerte e-mail « nouvelles offres qui
// te correspondent » pour les comptes qui l'ont laissée activée
// (notify_new_offers, réglage du profil ; fréquence quotidienne ou
// hebdomadaire depuis le 24/10).
//
// Refait le 24/10 : l'ancienne version traitait les comptes un par un
// (4 requêtes chacun, dans l'ordre des id) et s'arrêtait au bout des 60 s
// (« Task timed out », journal Vercel du 24/10) : toujours les mêmes
// premiers comptes servis, les autres jamais. Elle filtrait aussi sur la
// date de publication chez la source : une offre arrivée chez Stageio avec
// quelques heures de retard n'était jamais annoncée.
// Maintenant : les comptes servis depuis le plus longtemps passent d'abord,
// 6 en parallèle, dans un budget de temps ; les offres sont prises sur leur
// date d'arrivée chez Stageio ; envoi par lots de 100 (clé d'idempotence) ;
// chaque envoi noté (offer_alert_sent) et plafonné par 24 h
// (OFFER_ALERTS_DAILY_CAP, 300 par défaut) pour ne jamais faire grimper le
// volume sans décision. Un passage relancé le même matin ne renvoie rien
// (compte déjà traité depuis moins de 20 h).

export const maxDuration = 60;

const MIN_SCORE = 58;
const TIME_BUDGET_MS = 40_000;
const PROFILE_PAGE = 600;
const CONCURRENCY = 6;

type Candidate = { profile: Profile; frequency: AlertFrequency };
type Prepared = {
  profile: Profile;
  frequency: AlertFrequency;
  matches: { offer: Awaited<ReturnType<typeof fetchActiveOffers>>[number]; score: number }[];
  recap?: AlertRecap;
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const from = campaignSender();
  if (!from) return NextResponse.json({ error: "RESEND_FROM_EMAIL manquant : aucune alerte envoyée." }, { status: 500 });

  const started = Date.now();
  const now = started;
  const nowIso = new Date(now).toISOString();
  const admin = createAdminClient();
  const cap = Number(process.env.OFFER_ALERTS_DAILY_CAP) > 0 ? Number(process.env.OFFER_ALERTS_DAILY_CAP) : DEFAULT_DAILY_CAP;

  const { count: sentLast24h, error: countError } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", ALERT_SENT_EVENT)
    .gte("created_at", new Date(now - 86_400_000).toISOString());
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  let room = cap - (sentLast24h ?? 0);
  if (room <= 0) {
    console.log("notify-new-offers", JSON.stringify({ capped: true, cap, sentLast24h }));
    return NextResponse.json({ capped: true, cap, sentLast24h });
  }

  // Comptes dus d'abord (jamais traités, puis les plus anciens). Le filtre
  // des 20 h est fait en base ; la fréquence hebdomadaire ici, page par
  // page, pour qu'une longue liste d'abonnés hebdomadaires pas encore dus
  // ne cache pas les quotidiens.
  const queue: Candidate[] = [];
  const due20h = new Date(now - 20 * 3600_000).toISOString();
  for (let page = 0; page < 5 && queue.length < room && Date.now() - started < 10_000; page++) {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("*")
      .eq("notify_new_offers", true)
      .eq("onboarding_completed", true)
      .is("search_completed_at", null)
      .not("email", "is", null)
      .or(`last_offer_alert_sent_at.is.null,last_offer_alert_sent_at.lt.${due20h}`)
      .order("last_offer_alert_sent_at", { ascending: true, nullsFirst: true })
      .order("id")
      .range(page * PROFILE_PAGE, (page + 1) * PROFILE_PAGE - 1);
    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
    for (const p of (profiles ?? []) as Profile[]) {
      const frequency = alertFrequency((p as Profile & { offer_alert_frequency?: string }).offer_alert_frequency);
      if (isDue(p.last_offer_alert_sent_at, frequency, now)) queue.push({ profile: p, frequency });
    }
    if ((profiles ?? []).length < PROFILE_PAGE) break;
  }

  const resend = getResendClient();
  let checked = 0;
  let emailed = 0;
  let noMatch = 0;
  const failures: string[] = [];
  const dayKey = nowIso.slice(0, 10);

  // Un compte : ses offres arrivées depuis son dernier passage, moins celles
  // déjà swipées, notées comme dans le deck.
  const prepare = async ({ profile, frequency }: Candidate): Promise<Prepared> => {
    const offers = await fetchActiveOffers(admin, {
      createdAfter: windowStart(profile.last_offer_alert_sent_at, now),
      sectors: knownProfileSectors(profile.sectors ?? []),
      limit: 150,
    });
    if (offers.length === 0) return { profile, frequency, matches: [] };
    const scored = offers
      .map((offer) => ({ offer, score: computeMatchScore(profile, offer) }))
      .filter((m) => m.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_OFFERS_PER_EMAIL * 4);
    if (scored.length === 0) return { profile, frequency, matches: [] };
    const { data: swiped } = await admin
      .from("swipes")
      .select("offer_id")
      .eq("user_id", profile.id)
      .in(
        "offer_id",
        scored.map((m) => m.offer.id),
      );
    const seen = new Set((swiped ?? []).map((s) => s.offer_id));
    const matches = scored.filter((m) => !seen.has(m.offer.id)).slice(0, MAX_OFFERS_PER_EMAIL);
    // Abonnés (28/10) : leurs résultats des dernières 24 h en tête de l'email.
    if (matches.length === 0 || !isPremium(profile)) return { profile, frequency, matches };
    const since = new Date(now - 86_400_000).toISOString();
    const [sentApps, spontaneous, replies] = await Promise.all([
      admin.from("applications").select("id", { count: "exact", head: true }).eq("user_id", profile.id).gte("sent_at", since),
      admin.from("user_events").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("event_type", SPONTANEOUS_EVENT).gte("created_at", since),
      admin.from("inbox_messages").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("direction", "in").gte("created_at", since),
    ]);
    return { profile, frequency, matches, recap: { sent: (sentApps.count ?? 0) + (spontaneous.count ?? 0), replies: replies.count ?? 0 } };
  };

  // Curseur : le compte est traité (même sans offre), il ne repasse pas avant sa prochaine échéance.
  const markProcessed = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await admin.from("profiles").update({ last_offer_alert_sent_at: nowIso }).in("id", ids);
    if (error) console.error("notify-new-offers: curseur non avancé", error.message, { count: ids.length });
  };

  const sendChunk = async (chunk: Prepared[]) => {
    // Noté AVANT l'envoi, dé-noté si Resend refuse : jamais deux fois le même e-mail.
    const { data: reserved, error: reserveError } = await admin
      .from("user_events")
      .insert(chunk.map((c) => ({ user_id: c.profile.id, event_type: ALERT_SENT_EVENT, metadata: { v: 1, offers: c.matches.length, frequency: c.frequency } })))
      .select("id, user_id");
    if (reserveError || !reserved) {
      failures.push(`base indisponible, lot non envoyé : ${reserveError?.message ?? "réponse vide"}`);
      return 0;
    }
    const reservedId = new Map(reserved.map((r) => [r.user_id, r.id]));
    const release = async (userIds: string[]) => {
      const ids = userIds.map((u) => reservedId.get(u)).filter((id): id is string => Boolean(id));
      if (ids.length) await admin.from("user_events").delete().in("id", ids);
    };
    const { data, error } = await resend.batch.send(
      chunk.map((c) => ({
        from,
        to: c.profile.email as string,
        ...renderOfferAlert({ profileId: c.profile.id, firstName: c.profile.full_name, matches: c.matches, frequency: c.frequency, recap: c.recap }),
        headers: unsubscribeHeaders(c.profile.id),
        tags: [{ name: "campaign", value: ALERT_TAG }],
      })),
      { batchValidation: "permissive", idempotencyKey: `${ALERT_TAG}-${dayKey}-${chunk[0].profile.id}-${chunk[chunk.length - 1].profile.id}` },
    );
    if (error || !data) {
      await release(chunk.map((c) => c.profile.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      return 0;
    }
    const rejected = (data.errors ?? []).map((e) => chunk[e.index]).filter(Boolean);
    await release(rejected.map((c) => c.profile.id));
    for (const e of data.errors ?? []) failures.push(`envoi refusé : ${e.message}`);
    return chunk.length - rejected.length;
  };

  const ready: Prepared[] = [];
  const flush = async () => {
    while (ready.length > 0) {
      const chunk = ready.splice(0, 100);
      emailed += await sendChunk(chunk);
    }
  };

  let i = 0;
  while (i < queue.length && room > 0 && Date.now() - started < TIME_BUDGET_MS) {
    const slice = queue.slice(i, i + Math.min(CONCURRENCY, room));
    i += slice.length;
    const results = await Promise.allSettled(slice.map(prepare));
    const processed: string[] = [];
    results.forEach((r, k) => {
      if (r.status === "rejected") {
        failures.push(`compte ${slice[k].profile.id} : ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
        return;
      }
      if (r.value.matches.length === 0) {
        noMatch++;
        processed.push(r.value.profile.id);
      } else if (room > 0) {
        ready.push(r.value);
        room--;
        processed.push(r.value.profile.id);
      }
      // Plafond atteint : compte non marqué, il passera en tête la prochaine fois.
    });
    checked += processed.length;
    await markProcessed(processed);
    if (ready.length >= 100) await flush();
  }
  await flush();

  const summary = {
    due: queue.length,
    checked,
    emailed,
    noMatch,
    left: queue.length - i,
    capped: room <= 0,
    cap,
    sentLast24h: (sentLast24h ?? 0) + emailed,
    ms: Date.now() - started,
    failures: failures.slice(0, 5),
  };
  console.log("notify-new-offers", JSON.stringify(summary));
  return NextResponse.json(summary);
}
