"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createCheckoutSessionAction } from "@/app/(app)/premium/actions";
import { AccessCodeForm } from "@/components/premium/AccessCodeForm";
import { AutoComparison, AutoHelpButton } from "@/components/premium/AutoExplainer";
import { useWelcomeCountdown } from "@/components/premium/WelcomeCountdown";
import { AUTO_DAILY_LIMIT, AUTO_PRICES, PLAN_PRICES, type LifetimeOffer } from "@/lib/pricing/plans";

type Plan = "monthly" | "lifetime";

// Bouton de paiement (28/10) : la page Stripe met une ou deux secondes à
// s'ouvrir après le clic ; sans retour visible, on reclique ou on part.
// Pendant l'envoi : « Ouverture du paiement sécurisé… », bouton bloqué.
function CheckoutButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn btn-block"
      style={{
        height: 52,
        border: "none",
        borderRadius: 999,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-700))",
        color: "var(--color-bg)",
        fontSize: 15.5,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: "0 10px 22px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        opacity: pending ? 0.85 : 1,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span aria-hidden className="fx-spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", display: "inline-block", animationDuration: "0.8s" }} />
          Ouverture du paiement sécurisé…
        </span>
      ) : (
        label
      )}
    </button>
  );
}


function PlanRow({
  selected,
  onSelect,
  label,
  sublabel,
  price,
  priceSuffix,
  afterPrice,
  strikePrice,
  badge,
  help,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sublabel: string;
  price: string;
  priceSuffix?: string;
  // Prix de bienvenue en cours : le prix qui s'appliquera ensuite, en petit
  // (jamais barré ni en « −X % », voir lib/pricing/plans.ts).
  afterPrice?: string;
  // Promo : ancien prix barré (le plus bas des 30 derniers jours, voir
  // LIFETIME_PROMO dans lib/pricing/plans.ts).
  strikePrice?: string;
  badge?: string;
  // « ? » en haut à droite de l'encadré (Stageio Auto : vidéo + FAQ).
  help?: ReactNode;
  // Sous la ligne, dans le même encadré (Stageio Auto : ce qu'elle ajoute).
  children?: ReactNode;
}) {
  return (
    <label
      style={{
        position: "relative",
        display: "block",
        cursor: "pointer",
        padding: "14px 16px",
        borderRadius: 16,
        border: selected ? "2px solid var(--color-accent)" : "1.5px solid var(--color-divider)",
        background: "var(--color-surface)",
      }}
    >
      <input
        type="radio"
        name="plan-choice"
        checked={selected}
        onChange={onSelect}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              flexShrink: 0,
              border: selected ? "6px solid var(--color-accent)" : "1.5px solid var(--color-divider)",
              background: "var(--color-bg)",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div className="flex flex-wrap items-center gap-2" style={{ fontSize: 14.5, fontWeight: 700 }}>
              {label}
              {badge && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--color-accent)",
                    color: "var(--color-bg)",
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, marginTop: 1, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              {sublabel}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {strikePrice && (
            <s
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                marginRight: 6,
                color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
              }}
            >
              {strikePrice}
            </s>
          )}
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em" }}>{price}</span>
          {priceSuffix && (
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              {" "}
              {priceSuffix}
            </span>
          )}
          {afterPrice && (
            <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2, color: "var(--color-accent-700)", whiteSpace: "nowrap" }}>
              ensuite {afterPrice}
            </div>
          )}
        </div>
      </div>
      {children}
      {help && <span style={{ position: "absolute", top: -13, right: 12 }}>{help}</span>}
    </label>
  );
}

// Avec Stageio Auto (24/10, demande de Nathan) : en haut, « Mensuel » /
// « À vie » ; en dessous, Premium puis Stageio Auto de la durée choisie, et
// un seul bouton qui soumet l'offre cochée, son prix écrit dessus.
type Offer = "premium" | "auto";

const CHECKOUT_PLAN: Record<Plan, Record<Offer, string>> = {
  monthly: { premium: "monthly", auto: "auto_monthly" },
  lifetime: { premium: "lifetime", auto: "auto_lifetime" },
};

function OfferTabs({
  userId,
  benefits,
  lifetimeAvailable,
  autoAvailable = false,
  initialOffer = "premium",
  errorMessage,
  welcomeEndsAt = null,
  welcomeActive = false,
  lifetimeOffer = null,
}: {
  userId?: string;
  // Avantages Premium, affichés sous les prix (Nathan, 28/10).
  benefits?: ReactNode;
  lifetimeAvailable: boolean;
  // Stageio Auto proposée seulement si elle peut servir (isAutoOfferAvailable).
  autoAvailable?: boolean;
  // Arrivée depuis « Découvrir Stageio Auto » (?offre=auto) : Auto cochée.
  initialOffer?: Offer;
  errorMessage: string | null;
  // Prix de bienvenue (voir lib/pricing/plans.ts) : fin fixée côté serveur.
  welcomeEndsAt?: number | null;
  welcomeActive?: boolean;
  // Prix spécial de l'accès à vie (offre 48 h du compte, ou promo) : lu côté serveur.
  lifetimeOffer?: LifetimeOffer | null;
}) {
  const { active: welcome, remaining } = useWelcomeCountdown(welcomeEndsAt, welcomeActive);
  const { active: offerPeriod } = useWelcomeCountdown(lifetimeOffer?.endsAt ?? null, lifetimeOffer !== null);
  const tier = welcome ? "welcome" : "regular";
  // 30 € tant que le chrono de bienvenue tourne (39,99 € barré pendant la promo du 23-25/10 seulement).
  const promo = offerPeriod && welcome ? lifetimeOffer : null;
  const flash = promo?.kind === "flash";
  const lifetimePrice = promo ? promo.price : PLAN_PRICES.lifetime[tier];
  const monthlyPrice = PLAN_PRICES.monthly[tier];
  // Mensuel affiché d'abord (Nathan, 24/10) ; « À vie » s'il n'y a que ça.
  const hasLifetime = lifetimeAvailable || autoAvailable;
  const [plan, setPlan] = useState<Plan>("monthly");
  const [offer, setOffer] = useState<Offer>(autoAvailable ? initialOffer : "premium");
  // Premium à vie absent (prix Stripe non configuré) : seule Auto reste.
  const chosen: Offer = plan === "lifetime" && !lifetimeAvailable ? "auto" : !autoAvailable ? "premium" : offer;
  const auto = chosen === "auto";

  const autoHelp = (
    <AutoHelpButton
      userId={userId}
      source="paywall"
      ctaLabel={plan === "lifetime" ? `Choisir Stageio Auto à vie · ${AUTO_PRICES.lifetime}` : `Choisir Stageio Auto · ${AUTO_PRICES.monthly}/mois`}
      onChoose={() => setOffer("auto")}
    />
  );

  const ctaLabel = auto
    ? plan === "lifetime"
      ? `Stageio Auto à vie · ${AUTO_PRICES.lifetime}`
      : `Activer Stageio Auto · ${AUTO_PRICES.monthly}/mois`
    : plan === "lifetime"
      ? `Débloquer à vie · ${lifetimePrice}`
      : `Débloquer Premium · ${monthlyPrice}/mois`;

  return (
    <div id="auto" className="animate-in" style={{ marginTop: 18, scrollMarginTop: 80 }}>
      {hasLifetime && (
        <div
          role="tablist"
          aria-label="Durée"
          className="grid grid-cols-2"
          style={{ padding: 4, borderRadius: 999, background: "var(--color-surface)", border: "1.5px solid var(--color-divider)", marginBottom: 12 }}
        >
          {(["monthly", "lifetime"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={plan === p}
              onClick={() => setPlan(p)}
              style={{
                height: 38,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                background: plan === p ? "var(--color-accent)" : "transparent",
                color: plan === p ? "var(--color-bg)" : "var(--color-text)",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
            >
              {p === "monthly" ? "Mensuel" : "À vie"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {plan === "monthly" ? (
          <>
            <PlanRow
              selected={!auto}
              onSelect={() => setOffer("premium")}
              label="Premium"
              sublabel="Résiliable à tout moment"
              price={monthlyPrice}
              afterPrice={welcome ? `${PLAN_PRICES.monthly.regular}/mois` : undefined}
              priceSuffix="/mois"
            />
            {autoAvailable && (
              <PlanRow
                selected={auto}
                onSelect={() => setOffer("auto")}
                label="Stageio Auto"
                sublabel="Ta candidature part à chaque like"
                price={AUTO_PRICES.monthly}
                priceSuffix="/mois"
                badge="Nouveau"
                help={autoHelp}
              >
                <AutoComparison compact />
              </PlanRow>
            )}
          </>
        ) : (
          <>
            {lifetimeAvailable && (
              <PlanRow
                selected={!auto}
                onSelect={() => setOffer("premium")}
                label="Premium à vie"
                sublabel="Paiement unique"
                price={lifetimePrice}
                strikePrice={promo?.strike ?? undefined}
                afterPrice={welcome ? PLAN_PRICES.lifetime.regular : undefined}
                badge={promo ? promo.badge : "Le prix de 5 mois"}
              />
            )}
            {autoAvailable && (
              <PlanRow
                selected={auto}
                onSelect={() => setOffer("auto")}
                label="Stageio Auto à vie"
                sublabel="Paiement unique · candidature à chaque like"
                price={AUTO_PRICES.lifetime}
                badge="Nouveau"
                help={autoHelp}
              >
                <AutoComparison compact />
              </PlanRow>
            )}
          </>
        )}
      </div>

      {benefits}

      {auto && (
        <p style={{ fontSize: 12, lineHeight: 1.5, margin: "10px 2px 0", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
          Envoi automatique quand le recruteur a laissé une adresse ou passe par La bonne alternance ; sinon, le like reste un favori. Au-delà
          de {AUTO_DAILY_LIMIT} par jour, les likes redeviennent des favoris jusqu&apos;au lendemain.
        </p>
      )}

      {errorMessage && (
        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {errorMessage}
        </p>
      )}

      {welcome && !auto && (
        <p style={{ margin: "14px 0 0", fontSize: 14, fontWeight: 700, textAlign: "center", color: "var(--color-accent-700)" }}>
          {flash ? "🎁 Ton offre 48 h encore" : "🎁 Prix de bienvenue encore"}{" "}
          <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{remaining ?? "––:––"}</span>
          <br />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            ensuite {plan === "lifetime" ? PLAN_PRICES.lifetime.regular : `${PLAN_PRICES.monthly.regular}/mois`}
          </span>
        </p>
      )}

      <form action={createCheckoutSessionAction} style={{ marginTop: 14 }}>
        <input type="hidden" name="plan" value={CHECKOUT_PLAN[plan][chosen]} />
        <CheckoutButton label={ctaLabel} />
      </form>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        style={{ marginTop: 10, fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
      >
        <span>🔒 Paiement sécurisé</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{plan === "lifetime" ? "Paiement unique" : "Résiliable à tout moment"}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <AccessCodeForm />
      </div>

      <p
        style={{
          fontSize: 10.5,
          textAlign: "center",
          lineHeight: 1.4,
          margin: "12px 0 0",
          color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
        }}
      >
        En continuant, tu acceptes les{" "}
        <Link href="/legal/cgv" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
          CGV
        </Link>
        .
      </p>
    </div>
  );
}

// Sélecteur unique (radio Mensuel / Accès à vie) + un seul bouton "Débloquer
// Premium" qui soumet le plan choisi -- remplace les deux cartes avec chacune
// leur propre bouton (une par plan) : design fourni par Nathan (maquette
// "Paywall Stageio — 1b", 26/09). Nécessite un état côté client pour savoir
// quel plan est sélectionné au moment de soumettre, d'où ce composant "use
// client" plutôt qu'un simple form server-only comme le reste de la page.
function ClassicPricing({
  benefits,
  lifetimeAvailable,
  errorMessage,
  welcomeEndsAt = null,
  welcomeActive = false,
  lifetimeOffer = null,
}: {
  benefits?: ReactNode;
  lifetimeAvailable: boolean;
  errorMessage: string | null;
  // Prix de bienvenue (voir lib/pricing/plans.ts) : fin fixée côté serveur.
  welcomeEndsAt?: number | null;
  welcomeActive?: boolean;
  // Prix spécial de l'accès à vie (offre 48 h du compte, ou promo) : lu côté serveur.
  lifetimeOffer?: LifetimeOffer | null;
}) {
  const { active: welcome, remaining } = useWelcomeCountdown(welcomeEndsAt, welcomeActive);
  const { active: offerPeriod } = useWelcomeCountdown(lifetimeOffer?.endsAt ?? null, lifetimeOffer !== null);
  const tier = welcome ? "welcome" : "regular";
  // 30 € tant que le chrono de bienvenue tourne (39,99 € barré pendant la promo du 23-25/10 seulement).
  const promo = offerPeriod && welcome ? lifetimeOffer : null;
  const flash = promo?.kind === "flash";
  const lifetimePrice = promo ? promo.price : PLAN_PRICES.lifetime[tier];
  const monthlyPrice = PLAN_PRICES.monthly[tier];
  // Accès à vie affiché en premier et présélectionné (demande de Nathan,
  // 14/10) ; le prix du plan choisi est écrit sur le bouton pour qu'il n'y
  // ait aucune surprise au paiement.
  const [plan, setPlan] = useState<Plan>(lifetimeAvailable ? "lifetime" : "monthly");

  return (
    <div className="animate-in" style={{ marginTop: 18 }}>
      <div className="flex flex-col gap-2.5">
        {lifetimeAvailable && (
          <PlanRow
            selected={plan === "lifetime"}
            onSelect={() => setPlan("lifetime")}
            label="Accès à vie"
            sublabel="Paiement unique, jamais de renouvellement"
            price={lifetimePrice}
            strikePrice={promo?.strike ?? undefined}
            afterPrice={welcome ? PLAN_PRICES.lifetime.regular : undefined}
            badge={promo ? promo.badge : "Le prix de 5 mois"}
          />
        )}
        <PlanRow
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
          label="Mensuel"
          sublabel="Résiliable à tout moment"
          price={monthlyPrice}
          afterPrice={welcome ? `${PLAN_PRICES.monthly.regular}/mois` : undefined}
          priceSuffix="/mois"
        />
      </div>

      {benefits}

      {errorMessage && (
        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            background: "var(--color-surface)",
            border: "1px solid var(--color-divider)",
            padding: 10,
            borderRadius: 8,
          }}
        >
          {errorMessage}
        </p>
      )}

      {welcome && (
        <p style={{ margin: "14px 0 0", fontSize: 14, fontWeight: 700, textAlign: "center", color: "var(--color-accent-700)" }}>
          {flash ? "🎁 Ton offre 48 h encore" : "🎁 Prix de bienvenue encore"}{" "}
          <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{remaining ?? "––:––"}</span>
          <br />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            ensuite {plan === "lifetime" ? PLAN_PRICES.lifetime.regular : `${PLAN_PRICES.monthly.regular}/mois`}
          </span>
        </p>
      )}

      <form action={createCheckoutSessionAction} style={{ marginTop: 14 }}>
        <input type="hidden" name="plan" value={plan} />
        <CheckoutButton label={plan === "lifetime" ? `Débloquer à vie · ${lifetimePrice}` : `Débloquer Premium · ${monthlyPrice}/mois`} />
      </form>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        style={{ marginTop: 10, fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
      >
        <span>🔒 Paiement sécurisé</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{plan === "lifetime" ? "Paiement unique" : "Résiliable à tout moment"}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <AccessCodeForm />
      </div>

      <p
        style={{
          fontSize: 10.5,
          textAlign: "center",
          lineHeight: 1.4,
          margin: "12px 0 0",
          color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
        }}
      >
        En continuant, tu acceptes les{" "}
        <Link href="/legal/cgv" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
          CGV
        </Link>
        .
      </p>
    </div>
  );
}

type SelectorProps = {
  userId?: string;
  benefits?: ReactNode;
  lifetimeAvailable: boolean;
  // Stageio Auto proposée seulement si elle peut servir (isAutoOfferAvailable).
  autoAvailable?: boolean;
  // Arrivée depuis « Découvrir Stageio Auto » (?offre=auto) : Auto cochée.
  initialOffer?: "premium" | "auto";
  errorMessage: string | null;
  welcomeEndsAt?: number | null;
  welcomeActive?: boolean;
  lifetimeOffer?: LifetimeOffer | null;
};

// Paywall : onglets Mensuel / À vie avec Stageio Auto quand elle est en
// vente ; sinon le sélecteur d'avant, inchangé (Nathan, 25/10 : « s'il n'y
// a pas l'offre à 17,99 € et celle à 80 €, remets le paywall comme avant »).
export function PricingSelector({ autoAvailable = false, initialOffer, ...props }: SelectorProps) {
  return autoAvailable ? <OfferTabs {...props} autoAvailable initialOffer={initialOffer} /> : <ClassicPricing {...props} />;
}
