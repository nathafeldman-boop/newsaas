import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { createCheckoutSessionAction, createPortalSessionAction } from "./actions";
import { AccessCodeForm } from "@/components/premium/AccessCodeForm";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Le paiement n'est pas encore configuré, réessaie plus tard.",
  checkout_failed: "Impossible de démarrer le paiement, réessaie.",
  no_subscription: "Aucun abonnement actif à gérer.",
};

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();

  const premium = isPremium(profile);

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center justify-center px-5 py-10 sm:px-9">
      <div
        className="w-full"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          padding: "40px 28px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <span className="tag" style={{ background: "var(--color-bg)", color: "var(--color-accent-700)" }}>
          🔓 Premium
        </span>

        {premium ? (
          <>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: "18px 0 0" }}>
              Tu es déjà Premium ✅
            </h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: "10px 0 0" }}>
              Passe illimité, candidatures illimitées, audit CV inclus.
            </p>
            <form action={createPortalSessionAction}>
              <button
                type="submit"
                className="btn"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  marginTop: 22,
                  background: "var(--color-bg)",
                  color: "var(--color-accent-700)",
                  borderRadius: 999,
                  padding: 12,
                  fontFamily: "var(--font-heading)",
                  fontSize: 15,
                }}
              >
                Gérer mon abonnement
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 30, margin: "18px 0 0", lineHeight: 1.15 }}>
              Trouve ton stage 3x plus vite
            </h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: "10px 0 0" }}>
              Passe illimité, candidatures illimitées, audit CV inclus.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 26 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 44 }}>7,99€</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>/mois</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
              <p style={{ fontSize: 13, margin: 0 }}>✓ Swipes illimités</p>
              <p style={{ fontSize: 13, margin: 0 }}>✓ Candidature 1-clic</p>
              <p style={{ fontSize: 13, margin: 0 }}>✓ Audit CV sur 100</p>
            </div>

            {error && (
              <p style={{ fontSize: 12, marginTop: 16, background: "rgba(0,0,0,0.15)", padding: 10, borderRadius: 8 }}>
                {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
              </p>
            )}

            <form action={createCheckoutSessionAction}>
              <button
                type="submit"
                className="btn"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  marginTop: 22,
                  background: "var(--color-bg)",
                  color: "var(--color-accent-700)",
                  borderRadius: 999,
                  padding: 12,
                  fontFamily: "var(--font-heading)",
                  fontSize: 15,
                }}
              >
                Votre avenir vaut bien 7,99€
              </button>
            </form>
            <Link
              href="/swipe"
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 12,
                marginTop: 14,
                color: "color-mix(in srgb, var(--color-bg) 80%, transparent)",
              }}
            >
              Continuer avec l&apos;offre gratuite
            </Link>
            <AccessCodeForm />
          </>
        )}
      </div>
    </div>
  );
}
