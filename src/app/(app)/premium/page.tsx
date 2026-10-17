import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { refreshStaleSubscription } from "@/lib/stripe/refreshStaleSubscription";
import { createPortalSessionAction } from "./actions";
import { PricingSelector } from "@/components/premium/PricingSelector";
import { PaywallPitch } from "@/components/premium/PaywallPitch";
import { fetchActiveOfferCount } from "@/lib/offers/fetchPublicOffers";
import { getPaidReviewAverage } from "@/lib/reviews/publicStats";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Le paiement n'est pas encore configuré, réessaie plus tard.",
  checkout_failed: "Impossible de démarrer le paiement, réessaie.",
  no_subscription: "Aucun abonnement actif à gérer.",
  already_subscribed: "Tu as déjà un abonnement Premium actif — gère-le avec le bouton ci-dessous plutôt que d'en recréer un.",
};

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; source?: string }>;
}) {
  const { error, source } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end, stripe_subscription_id")
    .eq("id", user.id)
    .single();

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

  // Argumentaire du paywall : vrais chiffres (offres actives, avis
  // approuvés), lus seulement quand la page de vente s'affiche. Une erreur
  // n'empêche jamais d'afficher la page : le bloc concerné disparaît.
  const showPitch = !premium && !paymentIssue;
  // Chemin de Léo (SOP 26), étape 4 : « 90 % doivent VOIR le paywall » --
  // noté après la réponse, sans ralentir l'affichage. Client admin : une
  // page ne peut plus lire les cookies une fois la réponse partie.
  if (showPitch && user) {
    const viewerId = user.id;
    after(() => logServerEvent(createAdminClient(), viewerId, "paywall_viewed", { source: source ?? null }));
  }
  const [activeOffers, reviews] = showPitch
    ? await Promise.all([
        fetchActiveOfferCount("all").catch((err) => {
          console.error("premium: offer count failed", err);
          return null;
        }),
        getPaidReviewAverage().catch((err) => {
          console.error("premium: review stats failed", err);
          return null;
        }),
      ])
    : [null, null];

  return (
    <div className="pw-shell mx-auto flex max-w-md flex-1 items-center py-6">
      <div
        className="pw-panel flex w-full flex-col"
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
          {profile?.subscription_status === "lifetime" ? (
            <p
              className="tag tag-accent"
              style={{ marginTop: 28, padding: "10px 16px", fontSize: 13.5 }}
            >
              🎉 Accès à vie — paiement unique, rien à gérer ni à renouveler.
            </p>
          ) : (
            // Reste cliquable et visible (jamais caché) mais volontairement
            // discret -- avant ce changement, "Gérer mon abonnement" (qui
            // mène à l'écran de résiliation) était le seul CTA de la page,
            // stylé comme un bouton principal plein-largeur. Nathan (29/09) :
            // l'app ne doit pas pousser vers la résiliation dès qu'on arrive
            // ici, sans pour autant la dissimuler.
            <Link
              href="/premium/annuler"
              style={{
                marginTop: 28,
                fontSize: 13,
                fontWeight: 600,
                color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Gérer mon abonnement
            </Link>
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
                  className="fx-shake"
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

            {/* Bandeau temporaire (rentrée) : une hausse de prix est
                confirmée à venir (confirmé par Nathan le 20/09), ceci
                annonce honnêtement que le tarif actuel ne tient qu'un temps
                limité -- jamais de faux prix barré ("avant/après" jamais
                réellement pratiqué), ce qui serait interdit (arrêté du 11
                mars 2015 sur les annonces de réduction de prix).
                CONSIGNE EXPLICITE (22/09) : garder ce bandeau tel quel
                pendant 1 à 2 mois, y compris si d'autres changements
                touchent le paywall entre-temps (ex: retrait de la formule
                quotidienne ci-dessous) -- ne pas le retirer ni le modifier
                sans demande explicite de Nathan. */}
            <div
              className="animate-in flex items-center gap-2"
              style={{
                background: "var(--color-accent-2-100)",
                border: "1px solid var(--color-accent-2-300)",
                borderRadius: 12,
                padding: "9px 12px",
                marginBottom: 14,
              }}
            >
              <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
                🎒
              </span>
              <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--color-accent-2-800)" }}>
                <strong>Offre spéciale rentrée</strong> — tarifs actuels garantis encore 1 mois,
                augmentation prévue ensuite.
              </div>
            </div>

            <PricingSelector
              lifetimeAvailable={!!process.env.STRIPE_PRICE_ID_LIFETIME}
              errorMessage={error ? (ERROR_MESSAGES[error] ?? "Une erreur est survenue.") : null}
            >
              <PaywallPitch activeOffers={activeOffers} rating={reviews} />
            </PricingSelector>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
