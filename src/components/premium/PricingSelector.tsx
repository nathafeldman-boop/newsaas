"use client";

import { useState } from "react";
import Link from "next/link";
import { createCheckoutSessionAction } from "@/app/(app)/premium/actions";
import { AccessCodeForm } from "@/components/premium/AccessCodeForm";

type Plan = "monthly" | "lifetime";

function PlanRow({
  selected,
  onSelect,
  label,
  sublabel,
  price,
  priceSuffix,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sublabel: string;
  price: string;
  priceSuffix?: string;
}) {
  return (
    <label
      className="flex items-center justify-between gap-3"
      style={{
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
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 12, marginTop: 1, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            {sublabel}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em" }}>{price}</span>
        {priceSuffix && (
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            {" "}
            {priceSuffix}
          </span>
        )}
      </div>
    </label>
  );
}

// Sélecteur unique (radio Mensuel / Accès à vie) + un seul bouton "Débloquer
// Premium" qui soumet le plan choisi -- remplace les deux cartes avec chacune
// leur propre bouton (une par plan) : design fourni par Nathan (maquette
// "Paywall Stageio — 1b", 26/09). Nécessite un état côté client pour savoir
// quel plan est sélectionné au moment de soumettre, d'où ce composant "use
// client" plutôt qu'un simple form server-only comme le reste de la page.
export function PricingSelector({
  lifetimeAvailable,
  errorMessage,
}: {
  lifetimeAvailable: boolean;
  errorMessage: string | null;
}) {
  const [plan, setPlan] = useState<Plan>("monthly");

  return (
    <div className="animate-in" style={{ marginTop: 18 }}>
      <div className="flex flex-col gap-2.5">
        <PlanRow
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
          label="Mensuel"
          sublabel="Résiliable à tout moment"
          price="7,99 €"
          priceSuffix="/mois"
        />
        {lifetimeAvailable && (
          <PlanRow
            selected={plan === "lifetime"}
            onSelect={() => setPlan("lifetime")}
            label="Accès à vie"
            sublabel="Paiement unique, jamais de renouvellement"
            price="70 €"
          />
        )}
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

      <form action={createCheckoutSessionAction} style={{ marginTop: 14 }}>
        <input type="hidden" name="plan" value={plan} />
        <button
          type="submit"
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
          }}
        >
          Débloquer Premium
        </button>
      </form>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        style={{ marginTop: 10, fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
      >
        <span>🔒 Paiement sécurisé</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Résiliable à tout moment</span>
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
