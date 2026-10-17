"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { createCheckoutSessionAction } from "@/app/(app)/premium/actions";
import { AccessCodeForm } from "@/components/premium/AccessCodeForm";

type Plan = "monthly" | "lifetime";

// Paywall en 2 cartes côte à côte (16/10, maquette de référence envoyée par
// Nathan) : en haut de chaque carte le nom, le prix et le bouton ; en
// dessous, en petit, tout ce que l'offre apporte (✓ / ✗) ; sous les cartes,
// paiement sécurisé, CGV et code d'accès. Mensuel en premier et mis en avant
// (16/10 : l'accès à vie en premier ne convertissait pas mieux).
const BENEFITS = [
  "Toutes les offres en clair : entreprise, analyse, description",
  "Like, favoris et candidatures illimités",
  "Ta lettre de motivation en quelques secondes",
  "Ton CV noté sur 100, avec les corrections",
  "Simulateur d'entretien à 3 niveaux",
  "Toutes tes candidatures suivies",
];

type PlanInfo = {
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  billing: string;
  cta: string;
  ribbon?: string;
  // Économie réelle, calculée face à notre propre mensuel (jamais un faux
  // prix barré « avant/après » : interdit, voir premium/page.tsx).
  saving?: string;
  extra?: string;
};

const MONTHLY_PRICE = 7.99;
const LIFETIME_PRICE = 39.99;
const LIFETIME_SAVING = Math.round((1 - LIFETIME_PRICE / (MONTHLY_PRICE * 12)) * 100);

const PLANS: Record<Plan, PlanInfo> = {
  lifetime: {
    name: "Accès à vie",
    tagline: "Payé une fois, à toi pour toujours",
    price: "39,99 €",
    priceSuffix: "une fois",
    billing: "Paiement unique, aucun renouvellement",
    cta: "Débloquer à vie",
    ribbon: "Le prix de 5 mois",
    saving: `−${LIFETIME_SAVING} % vs 1 an en mensuel`,
    extra: "Premium à vie, pour tes prochains stages et alternances",
  },
  monthly: {
    name: "Mensuel",
    tagline: "Pour un sprint de candidatures",
    price: "7,99 €",
    priceSuffix: "/mois",
    billing: "Facturé chaque mois, sans engagement",
    cta: "Débloquer",
  },
};

const muted = "color-mix(in srgb, var(--color-text) 55%, transparent)";

function Check() {
  return (
    <span
      aria-hidden
      style={{
        width: 15,
        height: 15,
        marginTop: 1,
        borderRadius: 999,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8.5,
        fontWeight: 900,
        color: "#fff",
        background: "linear-gradient(135deg, #3ee08f, var(--color-accent))",
      }}
    >
      ✓
    </span>
  );
}

// Bouton d'achat : une seule ligne, reflet qui balaie, flèche qui avance et,
// sur l'offre mise en avant, une petite secousse régulière qui attire le doigt.
function CtaButton({ label, featured }: { label: string; featured: boolean }) {
  const still = useReducedMotion();
  return (
    <motion.button
      type="submit"
      className={featured ? "pw-cta btn btn-block fx-shine lp-pulse" : "pw-cta btn btn-block fx-shine"}
      data-fx-burst
      animate={featured && !still ? { scale: [1, 1.06, 0.98, 1.02, 1] } : undefined}
      transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
      whileTap={{ scale: 0.94 }}
      style={{
        marginTop: 12,
        height: 46,
        gap: 5,
        padding: "0 6px",
        whiteSpace: "nowrap",
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        ...(featured
          ? {
              border: "none",
              color: "#fff",
              background: "linear-gradient(135deg, #3ee08f, var(--color-accent) 50%, var(--color-accent-700))",
              boxShadow: "0 10px 22px color-mix(in srgb, var(--color-accent) 40%, transparent)",
            }
          : {
              border: "1.5px solid var(--color-accent)",
              color: "var(--color-accent-700)",
              background: "var(--color-neutral-100)",
            }),
      }}
    >
      {label}
      <motion.span
        aria-hidden
        animate={still ? undefined : { x: [0, 4, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "inline-block" }}
      >
        →
      </motion.span>
    </motion.button>
  );
}

function PlanCard({ plan, featured, index }: { plan: Plan; featured: boolean; index: number }) {
  const info = PLANS[plan];
  const items = info.extra ? [...BENEFITS, info.extra] : BENEFITS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.08 * index }}
      style={{
        position: "relative",
        display: "flex",
        borderRadius: 22,
        padding: featured ? 2 : 1,
        background: featured
          ? "linear-gradient(160deg, #3ee08f, var(--color-accent) 45%, var(--color-accent-2))"
          : "var(--color-divider)",
        boxShadow: featured ? "0 16px 34px color-mix(in srgb, var(--color-accent) 26%, transparent)" : "none",
      }}
    >
      {info.ribbon && (
        <span
          style={{
            position: "absolute",
            top: -11,
            left: "50%",
            zIndex: 1,
            transform: "translateX(-50%) rotate(-3deg)",
            whiteSpace: "nowrap",
            fontSize: 10.5,
            fontWeight: 800,
            color: "#fff",
            borderRadius: 999,
            padding: "4px 10px",
            background: "linear-gradient(90deg, var(--color-accent-2), var(--color-accent))",
            boxShadow: "0 6px 14px color-mix(in srgb, var(--color-accent-2) 35%, transparent)",
          }}
        >
          {info.ribbon}
        </span>
      )}
      <form
        action={createCheckoutSessionAction}
        className="pw-card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: featured ? 20 : 21,
          background: "var(--color-neutral-100)",
          padding: "20px 10px 14px",
        }}
      >
        <input type="hidden" name="plan" value={plan} />
        <p className="pw-plan" style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
          {info.name}
        </p>
        <p className="pw-sub" style={{ margin: "2px 0 0", fontSize: 11, lineHeight: 1.3, color: muted, minHeight: 29 }}>{info.tagline}</p>
        <p style={{ margin: "10px 0 0", display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
          <span className="pw-price" style={{ fontFamily: "var(--font-heading)", fontSize: 27, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {info.price}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: muted }}>{info.priceSuffix}</span>
        </p>
        {info.saving && (
          <span
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              fontSize: 10.5,
              fontWeight: 800,
              color: "var(--color-accent-700)",
              background: "var(--color-accent-100)",
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            {info.saving}
          </span>
        )}
        <CtaButton label={info.cta} featured={featured} />
        <p className="pw-sub" style={{ margin: "8px 0 0", fontSize: 10, textAlign: "center", color: muted }}>{info.billing}</p>
        <div aria-hidden style={{ height: 1, background: "var(--color-divider)", margin: "12px 0 11px" }} />
        <ul className="pw-benefits" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map((item) => (
            <li key={item} className="flex items-start gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3 }}>
              <Check />
              {item}
            </li>
          ))}
        </ul>
      </form>
    </motion.div>
  );
}

export function PricingSelector({
  lifetimeAvailable,
  errorMessage,
  children,
}: {
  lifetimeAvailable: boolean;
  errorMessage: string | null;
  children?: React.ReactNode;
}) {
  const plans: Plan[] = lifetimeAvailable ? ["monthly", "lifetime"] : ["monthly"];

  return (
    <div>
      {children}
      <div
        className="pw-grid grid gap-2.5"
        style={{ marginTop: 24, gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
      >
        {plans.map((plan, i) => (
          <PlanCard key={plan} plan={plan} featured={plan === "monthly"} index={i} />
        ))}
      </div>

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

      <p className="pw-sub" style={{ fontSize: 11, textAlign: "center", lineHeight: 1.5, margin: "16px 0 0", color: muted }}>
        🔒 Paiement sécurisé par Stripe · En continuant, tu acceptes les{" "}
        <Link href="/legal/cgv" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
          CGV
        </Link>
      </p>
      <div className="flex justify-center" style={{ marginTop: 6, fontSize: 11.5, color: muted }}>
        <AccessCodeForm />
      </div>
    </div>
  );
}
