"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { offerRefundGuaranteeAction } from "@/app/(app)/premium/guarantee-actions";
import { GUARANTEE_COOKIE, setBrowserCookie } from "@/lib/premium/guaranteeTerms";
import { GUARANTEE_EVENT } from "@/components/premium/PaywallExitGuard";
import { GuaranteeHero } from "@/components/premium/GuaranteeHero";
import { useWelcomeCountdown } from "@/components/premium/WelcomeCountdown";
import { LIFETIME_PROMO, PLAN_PRICES } from "@/lib/pricing/plans";

// Avant le paywall (Nathan, 20/10) : l'étudiant « signe » son engagement en
// maintenant son doigt sur une empreinte, puis voit combien de personnes
// nous ont fait confiance (vrai chiffre), puis arrive sur le paywall. Geste
// symbolique : aucune donnée biométrique n'est lue, et c'est écrit à l'écran.
// 3e écran (21/10) : la garantie remboursé, accordée à qui la voit (CGV
// « Garantie »), conditions renvoyées aux CGV.
// À chaque arrivée sur le paywall (Nathan, 22/10), plus seulement la 1re fois.
// 4e écran (23/10) : le chrono du prix de bienvenue expliqué avec les vrais
// prix (maintenant / après), seulement tant que ce prix est encore ouvert.
const HOLD_MS = 1600;
const RING_RADIUS = 58;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

type Phase = "pledge" | "signed" | "trust" | "guarantee" | "countdown" | "done";

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

function FingerprintIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
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
  userId,
  trustCount,
  welcomeEndsAt = null,
  welcomeActive = false,
  promoActive = false,
}: {
  userId: string;
  trustCount: number;
  welcomeEndsAt?: number | null;
  welcomeActive?: boolean;
  promoActive?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("pledge");
  const welcome = useWelcomeCountdown(welcomeEndsAt, welcomeActive);
  const lifetimeNow = promoActive ? LIFETIME_PROMO.price : PLAN_PRICES.lifetime.welcome;
  const [progress, setProgress] = useState(0);
  const holdStart = useRef<number | null>(null);
  const frame = useRef(0);
  const showTrust = trustCount >= 100;
  const trustTarget = trustFloor(trustCount);

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
  function showGuarantee() {
    setBrowserCookie(GUARANTEE_COOKIE);
    void offerRefundGuaranteeAction();
    window.dispatchEvent(new Event(GUARANTEE_EVENT));
    setPhase("guarantee");
  }

  useEffect(() => {
    if (phase === "signed") {
      const timer = setTimeout(() => (showTrust ? setPhase("trust") : showGuarantee()), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === "trust") {
      const timer = setTimeout(showGuarantee, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase, showTrust]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function complete() {
    holdStart.current = null;
    setProgress(1);
    navigator.vibrate?.(60);
    void createClient()
      .from("user_events")
      .insert({ user_id: userId, event_type: "pledge_signed", metadata: null })
      .then(({ error }) => {
        if (error) console.error("pledge_signed event failed", error);
      });
    setPhase("signed");
  }

  function startHold() {
    if (phase !== "pledge" || holdStart.current !== null) return;
    navigator.vibrate?.(15);
    holdStart.current = performance.now();
    const tick = (now: number) => {
      if (holdStart.current === null) return;
      const p = Math.min(1, (now - holdStart.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) complete();
      else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    if (holdStart.current === null) return;
    holdStart.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  }

  const signed = phase !== "pledge";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="pledge"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          role="dialog"
          aria-modal="true"
          aria-label="Ton engagement"
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
                <button type="button" className="btn btn-primary" onClick={showGuarantee} style={{ marginTop: 28, height: 50, borderRadius: 999, padding: "0 28px", fontWeight: 700 }}>
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
                  ⏳ Ton prix de bienvenue
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: "8px 0 0" }}>
                  Il te reste{" "}
                  <span style={{ color: "var(--color-accent-700)", fontVariantNumeric: "tabular-nums" }}>{welcome.remaining ?? "10:00"}</span>
                </h1>
                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                  pour payer le prix de bienvenue. Après, c&apos;est <strong style={{ color: "#c2262b" }}>au moins 60 % plus cher</strong>.
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
                  Le chrono a démarré à ta première visite de cette page et ne repart pas à zéro : ce prix n&apos;est proposé qu&apos;une fois.
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
            ) : (
              <motion.div
                key="pledge"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex w-full flex-col items-center text-center"
                style={{ maxWidth: 400, margin: "auto" }}
              >
                <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>Ton engagement 🤝</h1>
                <div
                  className="card"
                  style={{ marginTop: 18, padding: "18px 18px", textAlign: "left", fontSize: 14.5, lineHeight: 1.55, display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Stageio s&apos;engage</strong> à tout faire pour que tu décroches ton alternance : de
                    nouvelles offres chaque jour, une lettre de motivation pour chaque candidature, ton CV passé au crible.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Toi, tu t&apos;engages à ne pas lâcher</strong> : continuer à postuler, même après un refus.
                    C&apos;est comme ça que tu vas y arriver.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Maintiens appuyé pour signer ton engagement"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    startHold();
                  }}
                  onPointerUp={cancelHold}
                  onPointerCancel={cancelHold}
                  onLostPointerCapture={cancelHold}
                  onKeyDown={(e) => {
                    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                      e.preventDefault();
                      startHold();
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === " " || e.key === "Enter") cancelHold();
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={signed}
                  style={{
                    position: "relative",
                    marginTop: 30,
                    width: 136,
                    height: 136,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: signed ? "default" : "pointer",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                >
                  <svg width="136" height="136" viewBox="0 0 136 136" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
                    <circle cx="68" cy="68" r={RING_RADIUS} stroke="var(--color-divider)" strokeWidth="6" fill="none" />
                    <circle
                      cx="68"
                      cy="68"
                      r={RING_RADIUS}
                      stroke="var(--color-accent)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={RING_LENGTH}
                      strokeDashoffset={RING_LENGTH * (1 - progress)}
                      style={{ transition: progress === 0 ? "stroke-dashoffset 0.25s ease" : "none" }}
                    />
                  </svg>
                  <motion.span
                    animate={signed ? { scale: [1, 1.15, 1] } : { scale: 1 - progress * 0.06 }}
                    transition={signed ? { duration: 0.45 } : { duration: 0 }}
                    style={{
                      position: "absolute",
                      inset: 14,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: signed
                        ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))"
                        : `color-mix(in srgb, var(--color-accent) ${Math.round(10 + progress * 35)}%, var(--color-surface))`,
                      color: signed ? "var(--color-bg)" : "var(--color-accent-700)",
                      boxShadow: "0 10px 28px color-mix(in srgb, var(--color-accent) 30%, transparent)",
                    }}
                  >
                    {signed ? (
                      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <FingerprintIcon size={58} />
                    )}
                  </motion.span>
                </button>

                <p style={{ fontSize: 15, fontWeight: 700, margin: "18px 0 0", minHeight: 22 }}>
                  {signed ? "C'est signé ✍️" : progress > 0 ? "Garde ton doigt dessus…" : "Maintiens ton doigt sur l'empreinte pour signer"}
                </p>
                <p style={{ fontSize: 11.5, margin: "10px 0 0", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                  Engagement symbolique : il ne te fait rien payer et aucune empreinte n&apos;est enregistrée.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
