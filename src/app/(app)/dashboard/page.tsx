import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizResult } from "@/lib/interview/session";
import { isPremium } from "@/lib/subscription/isPremium";
import { refreshStaleSubscription } from "@/lib/stripe/refreshStaleSubscription";
import { InterviewSimulator } from "@/components/dashboard/InterviewSimulator";
import { CvQuickSend } from "@/components/dashboard/CvQuickSend";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { computeMatchScore } from "@/lib/matching/score";
import { fetchActiveOffers } from "@/lib/offers/fetchActiveOffers";
import { knownProfileSectors } from "@/lib/offers/sectors";
import { buildActionPlan } from "@/lib/dashboard/actionPlan";
import { isFollowUpDue, isSentStatus, requestNow } from "@/lib/applications/status";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import { ownOffersByIds } from "@/lib/applications/ownOffers";
import { SPONTANEOUS_EVENT } from "@/lib/spontaneous/targets";
import { computeResults } from "@/lib/subscribers/results";
import { SearchCompletedToggle } from "@/components/profile/SearchCompletedToggle";
import { interviewDomainFor } from "@/lib/interview/domainForJob";
import { PREMIUM_PRICE_LINE } from "@/lib/pricing/plans";
import { SatisfactionCard } from "@/components/dashboard/SatisfactionCard";
import { ShareWin } from "@/components/referral/ShareWin";
import { contractOf, referralUrl, shareMessage, SIGNED_VIA_STAGEIO } from "@/lib/referrals/share";
import { WEEKLY_TARGET, weeklyFocus } from "@/lib/subscribers/weeklyPlan";
import { SATISFACTION_DISMISS_EVENT, SATISFACTION_EVENT, surveyMomentFor } from "@/lib/satisfaction/survey";

const DATE_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
const mutedText = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;
const kpiLabel = { fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", margin: "4px 0 0", ...mutedText } as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ prep?: string }> }) {
  const { prep } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = rawProfile ? await refreshStaleSubscription(rawProfile) : rawProfile;

  const premium = isPremium(profile);

  // Tab entièrement réservée aux Premium (pas de version "aperçu" comme sur
  // /cv) : pas de sens à montrer un tracker de candidatures ou un CV à
  // envoyer à quelqu'un qui n'a pas encore de compte payant actif.
  if (!premium) {
    return (
      <div className="mx-auto w-full max-w-[520px] text-center" style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 40, margin: 0 }}>🎯</p>
        <h1 style={{ fontSize: 24, margin: "12px 0 0" }}>Dashboard Premium</h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            margin: "10px auto 0",
            maxWidth: "36ch",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          Simulateur d&apos;entretien à choix multiples (3 niveaux), suivi de tes candidatures,
          et envoi rapide de ton CV. Réservé aux membres Premium.
        </p>
        <PremiumCtaLink
          userId={user.id}
          source="dashboard_gate"
          className="btn btn-primary mt-5"
          style={{ whiteSpace: "nowrap" }}
        >
          🔓 Débloquer avec Premium ({PREMIUM_PRICE_LINE})
        </PremiumCtaLink>
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: applications }, cvSignedUrlResult, { data: likedSwipes }, todayOffers, quizEvents, { data: spontaneous }, { data: inbound }, { data: satisfactionEvents }] =
    await Promise.all([
      supabase.from("applications").select("*").eq("user_id", user.id),
      profile?.cv_path
        ? supabase.storage.from("cvs").createSignedUrl(profile.cv_path, 60 * 60)
        : Promise.resolve({ data: null }),
      supabase.from("swipes").select("offer_id").eq("user_id", user.id).eq("direction", "like"),
      (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return fetchActiveOffers(supabase, {
          sectors: profile ? knownProfileSectors(profile.sectors) : [],
          publishedAfter: todayStart.toISOString(),
          employersOnly: premium,
          limit: 300,
        });
      })(),
      // Progression du simulateur : parties terminées, lues en service_role
      // (pas de lecture côté étudiant sur user_events), sur son seul compte.
      premium
        ? createAdminClient()
            .from("user_events")
            .select("metadata, created_at")
            .eq("user_id", user.id)
            .eq("event_type", "interview_quiz_completed")
            .order("created_at", { ascending: true })
            .limit(500)
            .then(({ data }) => data ?? [])
        : Promise.resolve([]),
      // Candidatures spontanées envoyées et réponses arrivées dans la boîte
      // Stageio (lues en service_role, sur son seul compte).
      admin.from("user_events").select("created_at").eq("user_id", user.id).eq("event_type", SPONTANEOUS_EVENT).limit(2000),
      admin.from("inbox_messages").select("created_at").eq("user_id", user.id).eq("direction", "in").limit(2000),
      // Question de satisfaction (29/10) : réponses et « Plus tard » déjà donnés.
      admin
        .from("user_events")
        .select("event_type, created_at")
        .eq("user_id", user.id)
        .in("event_type", [SATISFACTION_EVENT, SATISFACTION_DISMISS_EVENT])
        .order("created_at", { ascending: true })
        .limit(100),
    ]);
  const pastResults: QuizResult[] = [];
  for (const e of quizEvents as { metadata: Record<string, unknown> | null; created_at: string }[]) {
    const m = e.metadata ?? {};
    if (m.mode === "review" || typeof m.domain !== "string" || typeof m.score !== "number") continue;
    if (m.level !== "facile" && m.level !== "medium" && m.level !== "difficile") continue;
    pastResults.push({ domain: m.domain, level: m.level, score: m.score, at: e.created_at });
  }

  // « À envoyer » (lettre prête, pas encore partie) n'est pas compté comme
  // une candidature envoyée (24/10).
  const counts = { sent: 0, positive: 0, negative: 0 };
  for (const app of applications ?? []) {
    if (!isSentStatus(app.status)) continue;
    if (app.status === "entretien" || app.status === "acceptee") counts.positive++;
    else if (app.status === "refusee") counts.negative++;
    else counts.sent++;
  }
  const totalApplications = counts.sent + counts.positive + counts.negative;

  // Plan d'action (RETENTION_AUDIT.md) : calculé ici, purement à partir de
  // vraies données -- jamais de compteur générique/factice.
  const appliedOfferIds = new Set((applications ?? []).filter((a) => a.status !== "a_preparer").map((a) => a.offer_id));
  const likedOfferIds = new Set((likedSwipes ?? []).map((s) => s.offer_id));
  const offersToApplyCount = [...likedOfferIds].filter((id) => !appliedOfferIds.has(id)).length;

  // Même seuil que le digest email de nouvelles offres (notify-new-offers) :
  // n'annonce que ce qui vaudrait aussi sa place dans un feed pertinent.
  const MIN_SCORE_FOR_PLAN = 58;
  const newMatchingOffersCount = profile
    ? (todayOffers ?? []).filter((o) => computeMatchScore(profile, o) >= MIN_SCORE_FOR_PLAN).length
    : 0;

  // Relances dues : date choisie par l'étudiant, sinon 7 jours après
  // l'envoi (src/lib/applications/status.ts).
  const now = requestNow();
  const staleApplicationsCount = (applications ?? []).filter((a) => isFollowUpDue(a, now)).length;
  const interviewsCount = (applications ?? []).filter((a) => a.status === "entretien").length;

  const actionPlan = buildActionPlan({ newMatchingOffersCount, offersToApplyCount, staleApplicationsCount, interviewsCount });

  // Résultats et étapes suivantes (28/10, aide après le paiement).
  const results = computeResults({
    applications: applications ?? [],
    spontaneousAt: (spontaneous ?? []).map((e) => e.created_at),
    inboundAt: (inbound ?? []).map((m) => m.created_at),
    now,
  });
  const interviewApps = (applications ?? []).filter((a) => a.status === "entretien");
  const interviewOffers = interviewApps.length > 0 ? await ownOffersByIds(interviewApps.map((a) => a.offer_id)).catch(() => []) : [];
  const auto = isAutoTier(profile);
  const checklist = [
    { done: !!profile?.cv_path, label: "Ajouter ton CV", hint: "Il part avec chaque candidature.", href: "/cv" },
    { done: (profile?.target_jobs ?? []).length > 0, label: "Indiquer le métier que tu vises", hint: "Pour les offres et les entreprises qu'on te propose.", href: "/profil" },
    { done: !!profile?.city, label: "Indiquer ta ville", hint: "Pour les entreprises proches de chez toi.", href: "/profil" },
    { done: !!normalizePhone(profile?.phone) && !!splitFullName(profile?.full_name), label: "Ton nom complet et ton téléphone", hint: "Exigés pour postuler via La bonne alternance : le recruteur doit pouvoir te rappeler.", href: "/profil" },
  ];
  const checklistLeft = checklist.filter((c) => !c.done);

  const satisfactionMoment = surveyMomentFor({
    paidAt: profile?.premium_activated_at ? Date.parse(profile.premium_activated_at) : null,
    votes: (satisfactionEvents ?? []).filter((e) => e.event_type === SATISFACTION_EVENT).map((e) => ({ at: Date.parse(e.created_at) })),
    dismissedAt: Math.max(0, ...(satisfactionEvents ?? []).filter((e) => e.event_type === SATISFACTION_DISMISS_EVENT).map((e) => Date.parse(e.created_at))) || null,
    now,
  });

  // « Ta semaine » (29/10) : objectif de candidatures et la priorité du moment.
  const focus = weeklyFocus({
    results,
    hasCv: !!profile?.cv_path,
    daysSincePaid: profile?.premium_activated_at ? (now - Date.parse(profile.premium_activated_at)) / 86_400_000 : 0,
    auto,
  });
  const weekShare = Math.min(1, results.sentWeek / WEEKLY_TARGET);
  // Bouche-à-oreille (29/10) : au moment d'une victoire, recommander Stageio à un pote.
  const contract = contractOf(profile?.looking_for);
  const myLink = profile?.referral_code ? referralUrl(profile.referral_code) : null;
  const signed = profile?.search_completed_reason === SIGNED_VIA_STAGEIO;
  const winKind = signed || results.accepted > 0 ? "signe" : results.interviews > 0 ? "entretien" : null;

  const defaultJobHint = prep?.trim().slice(0, 120) || profile?.target_jobs?.[0] || profile?.sectors?.[0] || "";
  const cvSignedUrl = cvSignedUrlResult.data?.signedUrl ?? null;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
        Prépare tes entretiens et suis tes candidatures, au même endroit.
      </p>

      {satisfactionMoment && <SatisfactionCard moment={satisfactionMoment} />}

      {checklistLeft.length > 0 && (
        <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🚀 Prêt à postuler</p>
          <p style={{ fontSize: 13, margin: "4px 0 0", ...mutedText }}>
            {checklist.length - checklistLeft.length}/{checklist.length} fait. Complète le reste : tes candidatures partent ensuite en un clic.
          </p>
          <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
            {checklist.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="flex items-start gap-2.5 no-underline"
                style={{ color: "inherit", opacity: c.done ? 0.55 : 1, pointerEvents: c.done ? "none" : undefined }}
              >
                <span aria-hidden style={{ fontSize: 15, lineHeight: 1.4 }}>{c.done ? "✅" : "⬜"}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                  <strong style={{ textDecoration: c.done ? "line-through" : undefined }}>{c.label}</strong>
                  {!c.done && <span style={mutedText}> · {c.hint}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>📈 Tes résultats</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{results.sentTotal}</p>
            <p style={kpiLabel}>Candidatures</p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{results.sentWeek}</p>
            <p style={kpiLabel}>Cette semaine</p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0, color: "var(--color-accent-700)" }}>{results.replies}</p>
            <p style={kpiLabel}>Réponses</p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0, color: "var(--color-accent-2-700)" }}>{results.interviews + results.accepted}</p>
            <p style={kpiLabel}>Entretiens</p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 12.5, fontWeight: 700 }}>
            <span>Objectif de la semaine : {WEEKLY_TARGET} candidatures</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: weekShare >= 1 ? "var(--color-accent-700)" : undefined }}>
              {Math.min(results.sentWeek, 99)}/{WEEKLY_TARGET}
              {weekShare >= 1 ? " ✓" : ""}
            </span>
          </div>
          <div style={{ height: 8, marginTop: 6, borderRadius: 999, background: "var(--color-divider)", overflow: "hidden" }}>
            <div className="animate-in" style={{ width: `${Math.max(weekShare * 100, 3)}%`, height: "100%", borderRadius: 999, background: "var(--color-accent)", transition: "width .6s ease" }} />
          </div>
        </div>
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "color-mix(in srgb, var(--color-accent) 7%, var(--color-surface))" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Ta priorité cette semaine</p>
          <p style={{ margin: "3px 0 0", fontSize: 14.5, fontWeight: 700 }}>{focus.title}</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.5, ...mutedText }}>{focus.text}</p>
          <Link href={focus.path} className="btn btn-primary" style={{ marginTop: 10, padding: "7px 13px", fontSize: 12.5 }}>
            {focus.cta}
          </Link>
        </div>
        {results.firstReplyAt && (
          <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "10px 0 0", ...mutedText }}>
            Première réponse reçue le {DATE_FR.format(new Date(results.firstReplyAt))}. Chaque lundi matin, ton point de la semaine arrive par email.
          </p>
        )}
      </div>

      {interviewApps.length > 0 && (
        <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)", background: "color-mix(in srgb, var(--color-accent-2) 8%, var(--color-surface))" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🎤 Entretien{interviewApps.length > 1 ? "s" : ""} en vue</p>
          <div className="flex flex-col gap-2.5" style={{ marginTop: 12 }}>
            {interviewApps.map((a) => {
              const offer = interviewOffers.find((o) => o.id === a.offer_id);
              const label = offer ? `${offer.title} · ${offer.company}` : "Candidature";
              return (
                <div key={a.id} className="flex items-center justify-between gap-3">
                  <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0 }}>{label}</span>
                  <Link
                    href={`/dashboard?prep=${encodeURIComponent(offer?.title ?? defaultJobHint)}#simulateur`}
                    className="btn btn-primary"
                    style={{ padding: "7px 12px", fontSize: 12.5, whiteSpace: "nowrap" }}
                  >
                    Me préparer
                  </Link>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "12px 0 0", ...mutedText }}>
            Confirme vite le créneau, regarde le site de l&apos;entreprise, entraîne-toi avec le simulateur et prépare 2 questions (missions, rythme école-entreprise, tuteur).
          </p>
        </div>
      )}

      {results.accepted > 0 && (
        <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🎉 Réponse positive : les prochaines étapes</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 0" }}>
            1. Confirme ton accord par écrit à l&apos;entreprise.
            <br />
            2. Préviens ton école ou ton CFA : le contrat (CERFA) se remplit avec l&apos;entreprise, puis part à son OPCO.
            <br />
            3. Note ta date de début et le nom de ton tuteur.
          </p>
        </div>
      )}

      {winKind && myLink && !signed && (
        <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>💚 Un pote cherche encore ?</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 0", ...mutedText }}>
            {winKind === "signe" ? "Bravo pour ta réponse positive !" : "Bravo pour ton entretien !"} Si un ami galère à trouver son {contract}, envoie-lui ce message : il arrive sur Stageio avec ton lien.
          </p>
          <ShareWin kind={winKind} message={shareMessage(winKind, myLink, contract)} />
        </div>
      )}

      <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🏢 Candidatures spontanées</p>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 0" }}>
          Beaucoup de contrats se signent sans annonce. Des entreprises près de chez toi recrutent des alternants dans ton métier : envoie-leur ta
          candidature en un clic.
          {auto ? " Avec Stageio Auto, on en contacte jusqu'à 20 par jour pour toi, automatiquement." : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3" style={{ marginTop: 12 }}>
          <Link href="/spontanees" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
            Voir les entreprises
          </Link>
          {results.spontaneousTotal > 0 && (
            <span style={{ fontSize: 12.5, ...mutedText }}>
              {results.spontaneousTotal} déjà contactée{results.spontaneousTotal > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {actionPlan.length > 0 && (
        <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>🎯 Aujourd&apos;hui</p>
          <div className="flex flex-col gap-2.5" style={{ marginTop: 12 }}>
            {actionPlan.map((item) => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span aria-hidden style={{ fontSize: 15, lineHeight: 1.4 }}>
                  {item.icon}
                </span>
                <p style={{ fontSize: 13.5, lineHeight: 1.4, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2" style={{ marginTop: 14 }}>
            <Link href="/swipe" className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
              Voir les offres
            </Link>
            <Link href="/favoris" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
              Mes favoris
            </Link>
            {staleApplicationsCount > 0 && (
              <Link href="/mes-candidatures" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 12.5 }}>
                Relancer
              </Link>
            )}
          </div>
        </div>
      )}

      <div id="simulateur" className="mt-6" style={{ scrollMarginTop: 80 }}>
        <InterviewSimulator
          key={defaultJobHint}
          userId={user.id}
          isPremium={premium}
          defaultJobHint={defaultJobHint}
          defaultDomainId={interviewDomainFor(defaultJobHint)}
          pastResults={pastResults}
        />
      </div>

      <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>
          📋 Suivi de tes candidatures
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0 }}>{totalApplications}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Envoyées
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0, color: "var(--color-accent-2-700)" }}>
              {counts.positive}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Réponses +
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: 0, color: "var(--color-accent-700)" }}>
              {counts.negative}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
              Réponses -
            </p>
          </div>
        </div>
        {totalApplications > 0 && (
          <div className="flex" style={{ gap: 3, height: 6, marginTop: 12, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ flex: counts.sent, background: "var(--color-accent)" }} />
            <div style={{ flex: counts.positive, background: "var(--color-accent-2)" }} />
            <div style={{ flex: counts.negative, background: "var(--color-neutral-400)" }} />
          </div>
        )}
        <Link href="/mes-candidatures" style={{ fontSize: 12.5, display: "inline-block", marginTop: 14, color: "var(--color-accent-700)" }}>
          Voir le détail →
        </Link>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>Envoyer mon CV</p>
          <CvQuickSend cvSignedUrl={cvSignedUrl} />
        </div>
      </div>

      <div className="mt-5">
        <SearchCompletedToggle
          completedAt={profile?.search_completed_at ?? null}
          completedReason={profile?.search_completed_reason ?? null}
          shareText={myLink ? shareMessage("signe", myLink, contract) : null}
        />
      </div>

      {/* Aide (29/10) : un souci se règle par un humain, pas par une résiliation. */}
      <div className="card elev-sm mt-5" style={{ padding: "16px 18px" }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Un souci, une question ?</p>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "color-mix(in srgb, var(--color-text) 64%, transparent)" }}>
          Une offre qui ne marche pas, une candidature qui ne part pas, un doute sur ton abonnement : écris-moi, je réponds moi-même.
        </p>
        <a
          href={`mailto:contact@stageio.fr?subject=${encodeURIComponent("Stageio : besoin d'aide")}&body=${encodeURIComponent(`Bonjour Nathan,\n\n\n\n(Mon compte : ${user.email ?? user.id})`)}`}
          className="btn btn-secondary"
          style={{ marginTop: 10, padding: "8px 14px", fontSize: 13 }}
        >
          ✉️ Écrire à Nathan
        </a>
      </div>

    </div>
  );
}
