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

const BENEFITS = [
  {
    label: "Swipes illimités",
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

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; limite?: string }>;
}) {
  const { error, limite } = await searchParams;
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
  const quotaReached = limite === "1";

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
            Swipes illimités, candidatures illimitées et audit CV sont débloqués.
          </p>
          <form action={createPortalSessionAction} className="w-full" style={{ maxWidth: 300 }}>
            <button
              type="submit"
              className="btn btn-block"
              style={{
                height: 50,
                borderRadius: 999,
                border: "1.5px solid var(--color-accent)",
                background: "transparent",
                color: "var(--color-accent-700)",
                fontSize: 15,
                fontWeight: 700,
                marginTop: 28,
              }}
            >
              Gérer mon abonnement
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1">
            {quotaReached && (
              <div
                className="flex items-start gap-2.5 animate-in"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 18,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "var(--color-accent-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--color-accent-700)" strokeWidth="2" />
                    <path d="M8 11V7a4 4 0 118 0v4" stroke="var(--color-accent-700)" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 600 }}>Tu as utilisé tes swipes gratuits cette semaine.</div>
                  <div style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 2 }}>
                    Premium te permet de continuer immédiatement.
                  </div>
                </div>
              </div>
            )}

            <span
              className="tag animate-in"
              style={{
                background: "var(--color-accent-100)",
                color: "var(--color-accent-800)",
                fontWeight: 700,
                letterSpacing: "0.02em",
                gap: 6,
              }}
            >
              ✨ STAGEIO PREMIUM
            </span>

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

            <div className="animate-in flex flex-col" style={{ marginTop: 20 }}>
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3" style={{ padding: "8px 0" }}>
                  <BenefitIcon>{b.icon}</BenefitIcon>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.label}</div>
                </div>
              ))}
            </div>

            <div
              className="animate-in"
              style={{
                position: "relative",
                marginTop: 22,
                background: "var(--color-surface)",
                borderRadius: 20,
                border: "1.5px solid var(--color-accent-300)",
                boxShadow: "0 0 0 4px var(--color-accent-100), var(--shadow-md)",
                padding: 20,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -11,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px color-mix(in srgb, var(--color-accent) 40%, transparent)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--color-accent-700)", textTransform: "uppercase" }}>
                Premium
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.02em" }}>7,99 €</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                  / mois
                </span>
              </div>
              <div style={{ fontSize: 12, marginTop: 4, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                Résiliable à tout moment.
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 20 }}>
            {error && (
              <p
                style={{
                  fontSize: 12,
                  marginBottom: 12,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
              </p>
            )}

            <form action={createCheckoutSessionAction}>
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
              className="flex items-center justify-center gap-2"
              style={{ marginTop: 10, fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
            >
              <span>🔒 Paiement sécurisé</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>Résiliable à tout moment</span>
            </div>

            <AccessCodeForm />

            <p
              style={{
                fontSize: 10.5,
                textAlign: "center",
                lineHeight: 1.4,
                margin: "12px 0 0",
                color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
              }}
            >
              En t&apos;abonnant, tu acceptes les{" "}
              <Link href="/legal/cgv" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
                CGV
              </Link>
              .
            </p>

            {!quotaReached && (
              <Link
                href="/swipe"
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: 11.5,
                  marginTop: 10,
                  color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
                }}
              >
                Continuer avec l&apos;offre gratuite
              </Link>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
