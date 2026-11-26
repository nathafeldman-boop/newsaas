import Link from "next/link";
import { CONSENT_AGE, ageOn } from "@/lib/schoolStage/levels";
import { ParentPaysCheck } from "@/components/premium/ParentPaysCheck";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { AutoPlanCard } from "@/components/premium/AutoPlanCard";
import { isAutoOfferAvailable } from "@/lib/subscription/autoAvailability";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import { refreshStaleSubscription } from "@/lib/stripe/refreshStaleSubscription";
import { createPortalSessionAction } from "./actions";
import { PricingSelector } from "@/components/premium/PricingSelector";
import { WelcomePriceBanner } from "@/components/premium/WelcomeCountdown";
import { getWelcomeState } from "@/lib/pricing/welcome";
import { lifetimeOfferFor, priceSheet } from "@/lib/pricing/plans";
import { PaywallPledge } from "@/components/premium/PaywallPledge";
import { PaywallExitGuard } from "@/components/premium/PaywallExitGuard";
import { GuaranteeBlock, PaywallFaq, PaywallReviews } from "@/components/premium/PaywallBlocks";
import { getPublicReviewStats, getPublicTestimonials } from "@/lib/reviews/publicStats";
import { GuaranteeCard, type GuaranteePhase } from "@/components/premium/GuaranteeCard";
import { getGuaranteeStatus, type GuaranteeStatus } from "@/lib/premium/refundGuarantee";
import { getTrustCount } from "@/lib/premium/trustCount";

import { painCopy, primaryContract } from "@/lib/premium/painCopy";
import type { ContractType } from "@/types/database";


const ERROR_MESSAGES: Record<string, string> = {
  parent: "Coche « Oui, c'est un de mes parents qui paie » pour continuer.",
  not_configured: "Le paiement n'est pas encore configuré, réessaie plus tard.",
  checkout_failed: "Impossible de démarrer le paiement, réessaie.",
  no_subscription: "Aucun abonnement actif à gérer.",
  already_subscribed: "Tu as déjà un abonnement Premium actif — gère-le avec le bouton ci-dessous plutôt que d'en recréer un.",
  auto_closed: "Stageio Auto n'est plus proposé. Les formules Premium ci-dessous donnent accès à toutes les offres et aux outils.",
  upgrade_failed: "Le passage à Stageio Auto n'a pas pu se faire (paiement refusé ou carte à mettre à jour). Rien n'a changé sur ton abonnement.",
};

const BENEFITS = [
  { label: "Liker & mettre en favori" },
  { label: "Candidatures illimitées" },
  { label: "Une lettre de motivation par offre, sans IA" },
  { label: "Ton CV à partir de modèles" },
];

// Les 4 avantages en grille 2x2 (maquette de Nathan, 26/09), sous les prix
// depuis le 28/10 (Nathan : « tu les mets en dessous des prix »).
function BenefitsGrid() {
  // Liste cochée « Ce que tu débloques » (26/11, comme le paywall TrendSaaS envoyé par Nathan).
  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Ce que tu débloques</h2>
      <div className="flex flex-col gap-2">
        {BENEFITS.map((b) => (
          <div
            key={b.label}
            className="flex items-center gap-3"
            style={{ padding: "13px 14px", borderRadius: 16, border: "1px solid var(--color-divider)", background: "var(--color-surface)" }}
          >
            <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9.5" />
              <path d="M8 12.3l2.7 2.7L16 9.6" />
            </svg>
            <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Garantie remboursé d'un compte Premium (null si aucune) et où en est sa
// fenêtre de demande. Hors du composant : l'heure courante n'est lue
// qu'ici, jamais pendant le rendu.
async function loadGuarantee(
  userId: string,
  profile: Parameters<typeof getGuaranteeStatus>[1],
): Promise<{ status: GuaranteeStatus; phase: GuaranteePhase } | null> {
  try {
    const status = await getGuaranteeStatus(userId, profile);
    if (!status) return null;
    const now = Date.now();
    const phase: GuaranteePhase = now < status.opensAt.getTime() ? "before" : now <= status.closesAt.getTime() ? "open" : "closed";
    return { status, phase };
  } catch (err) {
    console.error("PremiumPage: guarantee status failed", err, { userId });
    return null;
  }
}

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; source?: string; refund?: string; retour?: string; offre?: string }>;
}) {
  const { error, source, refund, retour, offre } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  // select("*") : premium_tier (formule Auto, SQL du 24/10) n'existe pas
  // forcément encore ; le nommer ferait échouer toute la lecture.
  const { data: rawProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const profile = rawProfile ? await refreshStaleSubscription(rawProfile) : rawProfile;
  const premium = isPremium(profile);
  // Hard paywall + essai gratuit de 3 swipes (26/09, revu le 28/09 -- voir
  // RETENTION_AUDIT.md et FREE_SWIPE_LIMIT dans SwipeDeck.tsx) : SwipeDeck
  // redirige ici avec "?source=" dès qu'un compte gratuit tente une action
  // réservée (like, candidature, ou "pass" une fois l'essai gratuit épuisé),
  // pour afficher un rappel contextuel plutôt qu'un vague "swipes épuisés".
  // "swipe_limit" = essai gratuit de 3 swipes consommé (distinct de
  // swipe_like/swipe_apply, toujours bloqués indépendamment du quota).
  const blockedAction = source === "swipe_like" || source === "swipe_limit" || source === "swipe_apply";
  // Un abonnement dont le renouvellement a échoué (carte à ré-authentifier,
  // refusée, expirée...) passe en "past_due" côté Stripe -- isPremium()
  // l'exclut à raison (accès effectivement coupé), mais avant ce correctif
  // ça renvoyait la personne directement sur la page d'ACQUISITION (choisir
  // une offre, payer), sans un mot sur le fait qu'elle a déjà un abonnement
  // à réparer plutôt qu'à en recréer un. Le seul chemin visible était donc
  // de repasser par un tout nouveau paiement -- risque réel de double
  // abonnement actif si l'ancien finit par se rétablir tout seul (retries
  // automatiques Stripe). Trouvé le 2026-09-25 suite à un pic de
  // renouvellements en échec signalé par Nathan.
  // Moins de 15 ans d'après la date de naissance, quelle que soit la classe
  // (Nathan, 18/11) : une case « c'est un parent qui paie » avant de payer.
  const under15 = !premium && (ageOn(profile?.birth_date) ?? 99) < CONSENT_AGE;
  const paymentIssue =
    !premium &&
    (profile?.subscription_status === "past_due" || profile?.subscription_status === "incomplete");

  // Prix de bienvenue : 10 min à compter du premier affichage de cette page
  // (lu avant d'enregistrer l'affichage en cours).
  // Offre 48 h par email (FLASH_OFFER) : prix de bienvenue et accès à vie à
  // 30 € jusqu'à la fin de l'offre du compte.
  const welcome = !premium && !paymentIssue ? await getWelcomeState(user.id) : null;
  const lifetimeOffer = welcome ? lifetimeOfferFor(welcome.flashEndsAt) : null;
  // Test de prix du 29/10 : une offre ouverte avant garde 7,99 €/mois.
  const prices = priceSheet(welcome?.legacy ?? false);

  const guarantee = premium && profile ? await loadGuarantee(user.id, profile) : null;

  // Avant le paywall, à chaque arrivée (Nathan, 22/10) : vrai nombre
  // d'inscrits, garantie, chrono (l'engagement à l'empreinte est à la fin de
  // l'onboarding depuis le 28/10). Pas après une erreur de
  // paiement ni au retour de Stripe sans payer : le paywall directement.
  // Garantie : badge si elle a déjà été vue.
  const showPledge = !premium && !paymentIssue && !error && retour !== "paiement";
  const trustCount = showPledge ? await getTrustCount().catch(() => 0) : 0;
  // Vrais avis approuvés (26/11, bloc avis du paywall) : rien si aucun.
  const onPaywall = !premium && !paymentIssue;
  const [testimonials, reviewStats] = onPaywall
    ? await Promise.all([getPublicTestimonials(4).catch(() => []), getPublicReviewStats().catch(() => ({ count: 0, average: null }))])
    : [[], { count: 0, average: null }];
  // Peur (Nathan, 25/11 : « accentue la peur des étudiants ») : le délai et
  // ce qu'on perd à attendre, selon le contrat cherché. Faits vrais
  // seulement (lib/premium/painCopy.ts).
  const lookingFor = (profile?.looking_for ?? null) as ContractType[] | null;
  const pain = painCopy(lookingFor);
  const contract = primaryContract(lookingFor);
  const headline =
    contract === "cdi" ? "Trouve ton CDI plus efficacement." : contract === "cdd" ? "Trouve ton CDD plus efficacement." : contract === "alternance" ? "Trouve ton alternance plus efficacement." : "Trouve ton stage plus efficacement.";

  // Mesure seulement (tableau « Chemin de Léo » de l'admin), rien de visible.
  const variant = "mensuel" as const; // test paywall-a-vie-1 terminé le 12/11
  if (!premium && !paymentIssue) {
    const viewerId = user.id;
    after(() =>
      logServerEvent(createAdminClient(), viewerId, "paywall_viewed", { source: source ?? null, variant }),
    );
  }

  const pricing = (
            <PricingSelector
              userId={user.id}
              benefits={<BenefitsGrid />}
              welcomeEndsAt={welcome?.endsAt ?? null}
              welcomeActive={welcome?.active ?? false}
              lifetimeOffer={lifetimeOffer}
              prices={prices}
              lifetimeAvailable
              autoAvailable={isAutoOfferAvailable(profile)}
              initialOffer={offre === "auto" ? "auto" : "premium"}
              errorMessage={error ? (ERROR_MESSAGES[error] ?? "Une erreur est survenue.") : null}
            />
  );

  return (
    // Paywall : plein écran sur ordinateur, sans la barre à gauche (Nathan, 28/10 ; voir globals.css).
    <div className="mx-auto flex max-w-md flex-1 items-center py-6" data-paywall-fullscreen={premium ? undefined : ""}>
      <div
        className="flex w-full flex-col"
        style={{
          padding: "28px 22px",
          background: "linear-gradient(180deg,#f7fbfa 0%,var(--color-bg) 45%,#e2f0ee 100%)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
      {premium ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center animate-in">
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "var(--color-accent-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="var(--color-accent-700)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tu es Premium</h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: "28ch",
              margin: "8px 0 0",
              color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
            }}
          >
            Like, favoris, candidatures illimitées et audit CV sont débloqués.
          </p>
          {guarantee && <GuaranteeCard status={guarantee.status} phase={guarantee.phase} refund={refund ?? null} />}
          {error && ERROR_MESSAGES[error] && (
            <p className="tag tag-accent-2" style={{ marginTop: 16, padding: "10px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
              {ERROR_MESSAGES[error]}
            </p>
          )}
          {isAutoTier(profile) ? (
            <p className="tag tag-accent" style={{ marginTop: 20, padding: "10px 16px", fontSize: 13.5, display: "block", lineHeight: 1.5 }}>
              ✉️ Stageio Auto est actif : tes likes envoient ta candidature ({AUTO_DAILY_LIMIT} par jour).{" "}
              <Link href="/boite" style={{ fontWeight: 700 }}>
                Ma boîte
              </Link>
            </p>
          ) : (
            isAutoOfferAvailable(profile) && (
              <div style={{ width: "100%", maxWidth: 420, textAlign: "left" }}>
                <AutoPlanCard
                  context={profile?.subscription_status === "lifetime" ? "upgrade_lifetime" : "upgrade_monthly"}
                  userId={user.id}
                />
              </div>
            )
          )}
          {/* Gestion et résiliation de l'abonnement : depuis le Profil
              (Nathan, 25/10 : le lien d'ici menait trop vite à la
              résiliation). */}
          {profile?.subscription_status === "lifetime" && (
            <p
              className="tag tag-accent"
              style={{ marginTop: 28, padding: "10px 16px", fontSize: 13.5 }}
            >
              🎉 Accès à vie — paiement unique, rien à gérer ni à renouveler.
            </p>
          )}
        </div>
      ) : paymentIssue ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center animate-in">
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "var(--color-accent-2-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Souci avec ton paiement</h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: "30ch",
              margin: "8px 0 0",
              color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
            }}
          >
            Le renouvellement de ton abonnement Premium n&apos;a pas abouti (carte à
            réautoriser, refusée ou expirée). Ton accès Premium est suspendu en attendant —
            mets à jour ta carte pour le récupérer, sans repayer depuis zéro.
          </p>
          <form action={createPortalSessionAction} className="w-full">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ height: 50, borderRadius: 999, fontSize: 15, fontWeight: 700, marginTop: 24 }}
            >
              Mettre à jour ma carte
            </button>
          </form>
          <p style={{ fontSize: 12.5, margin: "14px 0 0", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            Un souci persiste ? <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>
          </p>
        </div>
      ) : (
        <>
          {showPledge && (
            <PaywallPledge
              trustCount={trustCount}
              welcomeEndsAt={welcome?.endsAt ?? null}
              welcomeActive={welcome?.active ?? false}
              lifetimeOffer={lifetimeOffer}
              prices={prices}
            />
          )}
          <PaywallExitGuard />
          <div className="flex-1">
            {/* Header : marque + badge PREMIUM + fermeture -- maquette
                fournie par Nathan ("Paywall Stageio — 1b", 26/09). Le X
                remplace le lien texte "Continuer à parcourir gratuitement"
                qui vivait en bas de page (retiré, redondant avec ceci). */}
            <div className="flex items-center justify-between animate-in">
              <div className="flex items-center gap-2">
                <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--color-accent)" }} />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Stageio
                </span>
                <span
                  className="tag tag-accent"
                  style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.03em", padding: "3px 9px" }}
                >
                  PREMIUM
                </span>
              </div>
              <Link
                href="/swipe"
                aria-label="Fermer et continuer à parcourir gratuitement"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-surface)",
                  color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            </div>

            {blockedAction && (
              <div
                className="flex items-center gap-2.5 animate-in"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  borderRadius: 14,
                  padding: "11px 14px",
                  marginTop: 16,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: "var(--color-accent-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--color-accent-700)" strokeWidth="2" />
                    <path d="M8 11V7a4 4 0 118 0v4" stroke="var(--color-accent-700)" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>
                  {source === "swipe_apply"
                    ? "Candidater est réservé aux membres Premium."
                    : source === "swipe_limit"
                      ? "Ton essai gratuit de 3 swipes est terminé — passe Premium pour continuer."
                      : "Liker (= mettre en favori) est réservé aux membres Premium."}
                </div>
              </div>
            )}

            {/* Nouveaux tarifs (20/10, décision de Nathan) : le bandeau
                « Offre spéciale rentrée » (tarifs garantis 1 mois puis hausse,
                22/09) laisse la place au prix de bienvenue de 10 minutes. Voir
                lib/pricing/plans.ts : jamais de « −X % » ni de prix barré. */}
            <WelcomePriceBanner endsAt={welcome?.endsAt ?? null} initialActive={welcome?.active ?? false} flash={lifetimeOffer?.kind === "flash"} prices={prices} />

            {/* Garantie 48 h bien visible au-dessus des formules (26/11, façon TrendSaaS). */}
            <GuaranteeBlock />

            <h1
              className="animate-in"
              style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.01em", margin: "14px 0 0" }}
            >
              {headline}
            </h1>
            <p
              className="animate-in"
              style={{
                fontSize: 13.5,
                lineHeight: 1.5,
                maxWidth: "34ch",
                margin: "8px 0 0",
                color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
              }}
            >
              Débloque toutes les opportunités et les outils pour maximiser tes chances.
            </p>

            {/* Le temps presse : faits vrais (règle des 3 mois, places, salaire perdu). */}
            <div
              className="animate-in"
              role="note"
              style={{ marginTop: 14, background: "#fdeee6", border: "1px solid #f6c9b0", borderRadius: 14, padding: "11px 13px" }}
            >
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", color: "#b3261e" }}>⚠️ LE TEMPS PRESSE</p>
              <p style={{ margin: "5px 0 0", fontSize: 13.5, lineHeight: 1.45, fontWeight: 700 }}>{pain.deadline}</p>
              <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.45, color: "#8a3410" }}>{pain.pain}</p>
            </div>

            <h2 id="formules" style={{ fontSize: 19, margin: "20px 0 0" }}>
              Choisis ta formule
            </h2>
            {under15 ? <ParentPaysCheck>{pricing}</ParentPaysCheck> : pricing}

            <PaywallFaq />
            <PaywallReviews reviews={testimonials} average={reviewStats.average} count={reviewStats.count} />
            <h2 style={{ fontSize: 18, margin: "26px 0 0" }}>Reprends là où tu en étais</h2>
            <a href="#formules" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
              Choisir ma formule
            </a>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
