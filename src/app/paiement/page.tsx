import Link from "next/link";
import type { Metadata } from "next";
import { verifyGoParams } from "@/lib/premium/goLink";
import { goPlanOffer, isGoCheckoutPlan, maskEmail, type GoCheckoutPlan } from "@/lib/premium/goOffer";
import { getWelcomeState } from "@/lib/pricing/welcome";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { isAutoOfferAvailable } from "@/lib/subscription/autoAvailability";
import { payFromEmailLinkAction } from "./actions";

// Lien de paiement d'un email ouvert sans être connecté (6/11, voir
// /premium/go et lib/premium/goLink.ts) : la formule, son prix, et un bouton
// vers le paiement Stripe du compte. Rien n'est enregistré à l'affichage
// (robots antispam) : seul le bouton ouvre le paiement et le délai de l'offre.
export const metadata: Metadata = {
  title: "Ton paiement Stageio",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  already_subscribed: "Ce compte a déjà Premium. Connecte-toi pour en profiter.",
  login_required: "Pour cette formule, connecte-toi d'abord.",
  not_configured: "Cette formule n'est pas disponible pour le moment.",
  checkout_failed: "Le paiement n'a pas pu s'ouvrir, réessaie.",
  upgrade_failed: "Le paiement n'a pas pu s'ouvrir, réessaie.",
};

type Search = { plan?: string; u?: string; e?: string; s?: string; error?: string; retour?: string };

const muted = "color-mix(in srgb, var(--color-text) 64%, transparent)";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">{children}</div>
    </div>
  );
}

function LoginInstead({ title, text, next }: { title: string; text: string; next: string }) {
  return (
    <Shell>
      <div className="text-center">
        <h1 style={{ fontSize: 22, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: "10px 0 0", color: muted }}>{text}</p>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn btn-primary" style={{ marginTop: 20 }}>
          Me connecter
        </Link>
      </div>
    </Shell>
  );
}

async function loadAccount(userId: string) {
  const admin = createAdminClient();
  const [{ data: profile }, { data: auth }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);
  return { profile, email: auth?.user?.email ?? null };
}

export default async function PaiementPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { plan, u, e, s, error, retour } = await searchParams;
  const userId = verifyGoParams({ u, e, s });
  if (!userId || !isGoCheckoutPlan(plan)) {
    return <LoginInstead title="Ce lien de paiement a expiré" text="Connecte-toi pour voir les offres Premium de ton compte." next="/premium" />;
  }

  const { profile, email } = await loadAccount(userId);
  if (!profile) {
    return <LoginInstead title="Compte introuvable" text="Connecte-toi pour voir les offres Premium." next="/premium" />;
  }
  const auto = plan === "auto_lifetime";
  if (auto ? isAutoTier(profile) : isPremium(profile)) {
    return <LoginInstead title={auto ? "Tu as déjà Stageio Auto" : "Tu as déjà Premium"} text="Connecte-toi pour en profiter." next="/swipe" />;
  }
  if (auto && !isAutoOfferAvailable(profile)) {
    return <LoginInstead title="Offre indisponible" text={ERRORS.not_configured} next="/premium" />;
  }

  // Compte déjà Premium qui prend l'Auto : prix normal, comme au paywall.
  const welcome = isPremium(profile) ? null : await getWelcomeState(userId);
  const offer = goPlanOffer(plan as GoCheckoutPlan, welcome);
  const { minutesLeft } = offer;
  const account = maskEmail(email);

  return (
    <Shell>
      <div
        style={{
          padding: "26px 22px",
          background: "linear-gradient(180deg,#f7fbfa 0%,var(--color-bg) 45%,#e2f0ee 100%)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {retour && !error && (
          <p style={{ fontSize: 13.5, margin: "0 0 14px", color: muted, textAlign: "center" }}>Ton offre t&apos;attend encore ici.</p>
        )}
        {offer.badge && (
          <p className="tag tag-accent" style={{ margin: "0 auto", display: "table", padding: "5px 12px", fontSize: 12.5, fontWeight: 700 }}>
            {offer.badge}
          </p>
        )}
        <h1 style={{ fontSize: 24, margin: "12px 0 0", textAlign: "center" }}>{offer.title}</h1>
        <p style={{ margin: "10px 0 0", textAlign: "center" }}>
          <span style={{ fontSize: 40, fontWeight: 800 }}>{offer.price}</span>
          {offer.perMonth && <span style={{ fontSize: 15, color: muted }}> / mois</span>}
        </p>
        {minutesLeft !== null && (
          <p style={{ fontSize: 13.5, margin: "6px 0 0", textAlign: "center", fontWeight: 600, color: "var(--color-accent-700)" }}>
            ⏳ Ce prix tient encore {minutesLeft} minute{minutesLeft > 1 ? "s" : ""}
            {offer.regular && (
              <span style={{ fontWeight: 400, color: muted }}>
                {" "}
                · ensuite {offer.regular}
                {offer.perMonth ? " / mois" : ""}
              </span>
            )}
          </p>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {offer.benefits.map((b) => (
            <li key={b} style={{ fontSize: 14.5, display: "flex", gap: 8 }}>
              <span aria-hidden style={{ color: "var(--color-accent)", fontWeight: 800 }}>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        {error && (
          <p className="tag tag-accent-2" style={{ marginTop: 16, padding: "10px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
            {ERRORS[error] ?? ERRORS.checkout_failed}
          </p>
        )}
        <form action={payFromEmailLinkAction} style={{ marginTop: 20 }}>
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="u" value={u} />
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="s" value={s} />
          <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: 16, padding: "14px 18px" }}>
            Payer {offer.price} avec Stripe
          </button>
        </form>
        <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "12px 0 0", textAlign: "center", color: muted }}>
          🔒 Paiement sécurisé. {offer.note}
          {account ? ` Pour le compte ${account}.` : ""}
        </p>
        <p style={{ fontSize: 12.5, margin: "10px 0 0", textAlign: "center" }}>
          <Link href="/login?next=/premium" style={{ color: muted }}>
            Pas ton compte ? Connecte-toi
          </Link>
        </p>
      </div>
    </Shell>
  );
}
