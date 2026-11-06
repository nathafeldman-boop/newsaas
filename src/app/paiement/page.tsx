import Link from "next/link";
import type { Metadata } from "next";
import { verifyGoParams } from "@/lib/premium/goLink";
import { GO_CHOICE, GO_CHOICE_PLANS, goPlanOffer, isGoCheckoutPlan, maskEmail, type GoCheckoutPlan, type GoPlanOffer } from "@/lib/premium/goOffer";
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

type Signed = { u?: string; e?: string; s?: string };

// Une formule : prix, délai de l'offre, avantages et bouton « Payer ».
function OfferCard({ plan, offer, signed, highlight }: { plan: GoCheckoutPlan; offer: GoPlanOffer; signed: Signed; highlight: boolean }) {
  const { minutesLeft } = offer;
  return (
    <div
      style={{
        padding: "22px 20px",
        background: highlight ? "linear-gradient(180deg,#f7fbfa 0%,var(--color-bg) 45%,#e2f0ee 100%)" : "var(--color-bg)",
        border: highlight ? "2px solid var(--color-accent)" : "1px solid color-mix(in srgb, var(--color-text) 14%, transparent)",
        borderRadius: "var(--radius-lg)",
        boxShadow: highlight ? "var(--shadow-lg)" : "none",
      }}
    >
      {offer.badge && (
        <p className="tag tag-accent" style={{ margin: "0 auto", display: "table", padding: "5px 12px", fontSize: 12.5, fontWeight: 700 }}>
          {offer.badge}
        </p>
      )}
      <h2 style={{ fontSize: 22, margin: "10px 0 0", textAlign: "center" }}>{offer.title}</h2>
      <p style={{ margin: "8px 0 0", textAlign: "center" }}>
        <span style={{ fontSize: 38, fontWeight: 800 }}>{offer.price}</span>
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
      <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 7 }}>
        {offer.benefits.map((b) => (
          <li key={b} style={{ fontSize: 14.5, display: "flex", gap: 8 }}>
            <span aria-hidden style={{ color: "var(--color-accent)", fontWeight: 800 }}>
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>
      <form action={payFromEmailLinkAction} style={{ marginTop: 18 }}>
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="u" value={signed.u} />
        <input type="hidden" name="e" value={signed.e} />
        <input type="hidden" name="s" value={signed.s} />
        <button type="submit" className={highlight ? "btn btn-primary" : "btn btn-secondary"} style={{ width: "100%", fontSize: 16, padding: "14px 18px" }}>
          Payer {offer.price} avec Stripe
        </button>
      </form>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "10px 0 0", textAlign: "center", color: muted }}>{offer.note}</p>
    </div>
  );
}

export default async function PaiementPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { plan, u, e, s, error, retour } = await searchParams;
  const userId = verifyGoParams({ u, e, s });
  // Sans formule (lien « choix » des emails nouvelles offres) : le mensuel et l'accès à vie.
  const plans: readonly GoCheckoutPlan[] | null = isGoCheckoutPlan(plan) ? [plan] : !plan || plan === GO_CHOICE ? GO_CHOICE_PLANS : null;
  if (!userId || !plans) {
    return <LoginInstead title="Ce lien de paiement a expiré" text="Connecte-toi pour voir les offres Premium de ton compte." next="/premium" />;
  }

  const { profile, email } = await loadAccount(userId);
  if (!profile) {
    return <LoginInstead title="Compte introuvable" text="Connecte-toi pour voir les offres Premium." next="/premium" />;
  }
  const auto = plans.includes("auto_lifetime");
  if (auto ? isAutoTier(profile) : isPremium(profile)) {
    return <LoginInstead title={auto ? "Tu as déjà Stageio Auto" : "Tu as déjà Premium"} text="Connecte-toi pour en profiter." next="/swipe" />;
  }
  if (auto && !isAutoOfferAvailable(profile)) {
    return <LoginInstead title="Offre indisponible" text={ERRORS.not_configured} next="/premium" />;
  }

  // Compte déjà Premium qui prend l'Auto : prix normal, comme au paywall.
  const welcome = isPremium(profile) ? null : await getWelcomeState(userId);
  const offers = plans.map((p) => ({ plan: p, offer: goPlanOffer(p, welcome) }));
  const account = maskEmail(email);
  const signed = { u, e, s };

  return (
    <Shell>
      {retour && !error && (
        <p style={{ fontSize: 13.5, margin: "0 0 14px", color: muted, textAlign: "center" }}>Ton offre t&apos;attend encore ici.</p>
      )}
      {offers.length > 1 && (
        <h1 style={{ fontSize: 24, margin: "0 0 16px", textAlign: "center" }}>Débloque Stageio Premium</h1>
      )}
      {error && (
        <p className="tag tag-accent-2" style={{ margin: "0 0 14px", padding: "10px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
          {ERRORS[error] ?? ERRORS.checkout_failed}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {offers.map(({ plan: p, offer }, i) => (
          <OfferCard key={p} plan={p} offer={offer} signed={signed} highlight={i === 0} />
        ))}
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "14px 0 0", textAlign: "center", color: muted }}>
        🔒 Paiement sécurisé par Stripe.{account ? ` Pour le compte ${account}.` : ""}
      </p>
      <p style={{ fontSize: 12.5, margin: "8px 0 0", textAlign: "center" }}>
        <Link href="/login?next=/premium" style={{ color: muted }}>
          Pas ton compte ? Connecte-toi
        </Link>
      </p>
    </Shell>
  );
}
