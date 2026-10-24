import Link from "next/link";
import { cookies } from "next/headers";
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
import { isLifetimePromoActive } from "@/lib/pricing/plans";
import { PaywallPledge } from "@/components/premium/PaywallPledge";
import { GuaranteeBadge, PaywallExitGuard } from "@/components/premium/PaywallExitGuard";
import { GuaranteeCard, type GuaranteePhase } from "@/components/premium/GuaranteeCard";
import { getGuaranteeStatus, type GuaranteeStatus } from "@/lib/premium/refundGuarantee";
import { GUARANTEE_COOKIE } from "@/lib/premium/guaranteeTerms";
import { getTrustCount } from "@/lib/premium/trustCount";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Le paiement n'est pas encore configuré, réessaie plus tard.",
  checkout_failed: "Impossible de démarrer le paiement, réessaie.",
  no_subscription: "Aucun abonnement actif à gérer.",
  already_subscribed: "Tu as déjà un abonnement Premium actif — gère-le avec le bouton ci-dessous plutôt que d'en recréer un.",
  upgrade_failed: "Le passage à Stageio Auto n'a pas pu se faire (paiement refusé ou carte à mettre à jour). Rien n'a changé sur ton abonnement.",
};

const BENEFITS = [
  {
    label: "Liker & mettre en favori",
    icon: (
      <path
        d="M6 9a4.5 4.5 0 100 6 6 6 0 004-1.7 6 6 0 004 1.7 4.5 4.5 0 100-6 6 6 0 00-4 1.7A6 6 0 006 9z"
        stroke="var(--color-accent-700)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  {
    label: "Candidatures illimitées",
    icon: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="var(--color-accent-700)" />,
  },
  {
    label: "Lettre de motivation générée par IA",
    icon: (
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
        fill="var(--color-accent-700)"
      />
    ),
  },
  {
    label: "Audit CV sur 100",
    icon: (
      <>
        <path d="M4 15a8 8 0 1116 0" stroke="var(--color-accent-700)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M12 15l4-5" stroke="var(--color-accent-700)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </>
    ),
  },
];

function BenefitIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: "var(--color-accent-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
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
  const paymentIssue =
    !premium &&
    (profile?.subscription_status === "past_due" || profile?.subscription_status === "incomplete");

  // Prix de bienvenue : 10 min à compter du premier affichage de cette page
  // (lu avant d'enregistrer l'affichage en cours).
  const welcome = !premium && !paymentIssue ? await getWelcomeState(user.id) : null;
  const promoActive = !premium && !paymentIssue && isLifetimePromoActive();

  const guarantee = premium && profile ? await loadGuarantee(user.id, profile) : null;

  // Avant le paywall, à chaque arrivée (Nathan, 22/10) : engagement
  // (empreinte), vrai nombre d'inscrits, garantie. Pas après une erreur de
  // paiement ni au retour de Stripe sans payer : le paywall directement.
  // Garantie : badge si elle a déjà été vue.
  const cookieStore = await cookies();
  const showPledge = !premium && !paymentIssue && !error && retour !== "paiement";
  const guaranteeShown = !!cookieStore.get(GUARANTEE_COOKIE);
  const trustCount = showPledge ? await getTrustCount().catch(() => 0) : 0;

  // Mesure seulement (tableau « Chemin de Léo » de l'admin), rien de visible.
  if (!premium && !paymentIssue) {
    const viewerId = user.id;
    after(() => logServerEvent(createAdminClient(), viewerId, "paywall_viewed", { source: source ?? null }));
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center py-6">
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
                <AutoPlanCard context={profile?.subscription_status === "lifetime" ? "upgrade_lifetime" : "upgrade_monthly"} />
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
              userId={user.id}
              trustCount={trustCount}
              welcomeEndsAt={welcome?.endsAt ?? null}
              welcomeActive={welcome?.active ?? false}
              promoActive={promoActive}
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
            <WelcomePriceBanner endsAt={welcome?.endsAt ?? null} initialActive={welcome?.active ?? false} />

            <h1
              className="animate-in"
              style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.01em", margin: "14px 0 0" }}
            >
              Trouve ton alternance plus efficacement.
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

            {/* Grille 2x2 (au lieu d'une liste verticale) -- maquette
                fournie par Nathan. */}
            <div className="animate-in grid grid-cols-2 gap-2.5" style={{ marginTop: 20 }}>
              {BENEFITS.map((b) => (
                <div
                  key={b.label}
                  style={{
                    padding: "13px 12px",
                    borderRadius: 16,
                    border: "1px solid var(--color-divider)",
                    background: "var(--color-surface)",
                  }}
                >
                  <BenefitIcon>{b.icon}</BenefitIcon>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, lineHeight: 1.3 }}>{b.label}</div>
                </div>
              ))}
            </div>

            <GuaranteeBadge initialVisible={guaranteeShown} />

            <PricingSelector
              welcomeEndsAt={welcome?.endsAt ?? null}
              welcomeActive={welcome?.active ?? false}
              promoActive={promoActive}
              lifetimeAvailable={!!process.env.STRIPE_PRICE_ID_LIFETIME}
              autoAvailable={isAutoOfferAvailable(profile)}
              initialOffer={offre === "auto" ? "auto" : "premium"}
              errorMessage={error ? (ERROR_MESSAGES[error] ?? "Une erreur est survenue.") : null}
            />
          </div>
        </>
      )}
      </div>
    </div>
  );
}
