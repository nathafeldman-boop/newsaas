"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { offerRefundGuaranteeAction } from "@/app/(app)/premium/guarantee-actions";
import { GUARANTEE_COOKIE, setBrowserCookie } from "@/lib/premium/guaranteeTerms";
import { GUARANTEE_EVENT } from "@/components/premium/PaywallExitGuard";
import { GuaranteeHero } from "@/components/premium/GuaranteeHero";
import { useWelcomeCountdown } from "@/components/premium/WelcomeCountdown";
import { PLAN_PRICES, type LifetimeOffer } from "@/lib/pricing/plans";

// Avant le paywall, à chaque arrivée (Nathan, 22/10) : combien de
// personnes nous ont fait confiance (vrai chiffre), la garantie remboursé
// (accordée à qui la voit, CGV « Garantie »), puis le chrono du prix de
// bienvenue expliqué avec les vrais prix, tant que ce prix est ouvert.
// L'engagement signé à l'empreinte est passé à la fin de l'onboarding le
// 28/10 (Nathan), voir components/pledge/PledgeSign.tsx.
type Phase = "trust" | "guarantee" | "countdown" | "done";

// « 7,99 € » -> 7.99
function euros(price: string): number {
  return Number(price.replace(/[^0-9,]/g, "").replace(",", "."));
}

function increase(from: string, to: string): string {
  return `+${Math.round((euros(to) / euros(from) - 1) * 100)} %`;
}

// « Plus de 3 200 » : arrondi vers le bas, pour que « plus de » reste vrai.
function trustFloor(count: number): number {
  const step = count >= 1000 ? 100 : 10;
  return Math.floor(count / step) * step;
}

function CountUp({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1200);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{value.toLocaleString("fr-FR")}</>;
}

export function PaywallPledge({
  trustCount,
  welcomeEndsAt = null,
  welcomeActive = false,
  lifetimeOffer = null,
}: {
  trustCount: number;
  welcomeEndsAt?: number | null;
  welcomeActive?: boolean;
  // Prix spécial de l'accès à vie (offre 48 h du compte, ou promo) : lu côté serveur.
  lifetimeOffer?: LifetimeOffer | null;
}) {
  const showTrust = trustCount >= 100;
  const trustTarget = trustFloor(trustCount);
  const [phase, setPhase] = useState<Phase>(showTrust ? "trust" : "guarantee");
  const welcome = useWelcomeCountdown(welcomeEndsAt, welcomeActive);
  const lifetimeNow = lifetimeOffer ? lifetimeOffer.price : PLAN_PRICES.lifetime.welcome;
  const flash = lifetimeOffer?.kind === "flash";

  // Bloque le défilement du paywall en dessous tant que l'écran est affiché.
  useEffect(() => {
    if (phase === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  // Afficher la garantie, c'est l'accorder : même événement que le message
  // de sortie du paywall, et badge « garantie activée » sur le paywall.
  const granted = useRef(false);
  useEffect(() => {
    if (phase !== "guarantee" || granted.current) return;
    granted.current = true;
    setBrowserCookie(GUARANTEE_COOKIE);
    void offerRefundGuaranteeAction();
    window.dispatchEvent(new Event(GUARANTEE_EVENT));
  }, [phase]);

  useEffect(() => {
    if (phase !== "trust") return;
    const timer = setTimeout(() => setPhase("guarantee"), 3200);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="pledge"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          role="dialog"
          aria-modal="true"
          aria-label="Avant ton offre"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            overflowY: "auto",
            background: "linear-gradient(180deg,#f7fbfa 0%,var(--color-bg) 45%,#e2f0ee 100%)",
            display: "flex",
            padding: "24px 16px",
          }}
        >
          <AnimatePresence mode="wait">
            {phase === "trust" ? (
              <motion.div
                key="trust"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex w-full flex-col items-center text-center"
                style={{ maxWidth: 380, margin: "auto" }}
              >
                <div aria-hidden style={{ fontSize: 44 }}>🤝</div>
                <p style={{ fontSize: 15, fontWeight: 600, margin: "14px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
                  Plus de
                </p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 56, fontWeight: 800, lineHeight: 1.05, margin: "2px 0 0", color: "var(--color-accent-700)", fontVariantNumeric: "tabular-nums" }}>
                  <CountUp target={trustTarget} />
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, margin: "8px 0 0" }}>
                  étudiants comme toi
                </p>
                <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                  accompagnés par Stageio pour trouver leur alternance ou leur stage.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setPhase("guarantee")} style={{ marginTop: 28, height: 50, borderRadius: 999, padding: "0 28px", fontWeight: 700 }}>
                  Continuer →
                </button>
              </motion.div>
            ) : phase === "countdown" ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex w-full flex-col items-center text-center"
                style={{ maxWidth: 400, margin: "auto" }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, color: "var(--color-accent-700)" }}>
                  {flash ? "⏳ Ton offre 48 h, rien que pour toi" : "⏳ Ton prix de bienvenue"}
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: "8px 0 0" }}>
                  Il te reste{" "}
                  <span style={{ color: "var(--color-accent-700)", fontVariantNumeric: "tabular-nums" }}>{welcome.remaining ?? (flash ? "––:––:––" : "10:00")}</span>
                </h1>
                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                  {flash ? "pour profiter de ton offre" : "pour payer le prix de bienvenue"}. Après, c&apos;est <strong style={{ color: "#c2262b" }}>au moins 60 % plus cher</strong>.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginTop: 20 }}>
                  <div
                    style={{
                      borderRadius: 20,
                      padding: "16px 12px",
                      background: "linear-gradient(140deg, var(--color-accent), var(--color-accent-2))",
                      color: "var(--color-bg)",
                      boxShadow: "0 14px 30px color-mix(in srgb, var(--color-accent) 32%, transparent)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Maintenant</p>
                    <p style={{ margin: "10px 0 0", fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
                      {PLAN_PRICES.monthly.welcome}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700 }}>par mois</p>
                    <div style={{ height: 1, margin: "12px 6px", background: "color-mix(in srgb, var(--color-bg) 35%, transparent)" }} />
                    <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{lifetimeNow}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700 }}>à vie</p>
                  </div>
                  <div
                    style={{
                      borderRadius: 20,
                      padding: "16px 12px",
                      background: "var(--color-surface)",
                      border: "1.5px solid color-mix(in srgb, #e5484d 45%, transparent)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#c2262b" }}>
                      Ensuite
                    </p>
                    <p style={{ margin: "10px 0 0", fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
                      {PLAN_PRICES.monthly.regular}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      par mois · <span style={{ color: "#c2262b" }}>{increase(PLAN_PRICES.monthly.welcome, PLAN_PRICES.monthly.regular)}</span>
                    </p>
                    <div style={{ height: 1, margin: "12px 6px", background: "var(--color-divider)" }} />
                    <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{PLAN_PRICES.lifetime.regular}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 700, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                      à vie · <span style={{ color: "#c2262b" }}>{increase(lifetimeNow, PLAN_PRICES.lifetime.regular)}</span>
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: "16px 0 0", color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
                  Le chrono ne repart pas à zéro : quand il est fini, {flash ? "l'offre disparaît" : "le prix de bienvenue disparaît"}.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setPhase("done")} style={{ marginTop: 20, height: 50, borderRadius: 999, padding: "0 28px", fontWeight: 700 }}>
                  J&apos;en profite →
                </button>
              </motion.div>
            ) : phase === "guarantee" ? (
              <motion.div
                key="guarantee"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex w-full flex-col items-center text-center"
                style={{ maxWidth: 400, margin: "auto" }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, color: "var(--color-accent-700)" }}>
                  Notre garantie
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: "8px 0 0" }}>
                  Des résultats,
                  <br />
                  ou on te rembourse.
                </h1>
                <GuaranteeHero />
                <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "18px 0 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                  On met tout en œuvre pour que tu décroches ton alternance. Et si ça ne donne rien, tu ne perds pas ton argent.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setPhase(welcome.active ? "countdown" : "done")} style={{ marginTop: 22, height: 50, borderRadius: 999, padding: "0 28px", fontWeight: 700 }}>
                  {welcome.active ? "Continuer →" : "Voir mon offre →"}
                </button>
                <p style={{ fontSize: 12, margin: "12px 0 0", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                  Sous conditions.{" "}
                  <a href="/legal/cgv#garantie" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>
                    Voir les conditions générales
                  </a>
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
