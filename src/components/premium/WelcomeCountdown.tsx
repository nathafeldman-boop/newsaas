"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LIFETIME_PROMO, PLAN_PRICES, WELCOME_WINDOW_MS } from "@/lib/pricing/plans";

// Compte à rebours du prix de bienvenue (voir lib/pricing/plans.ts). La
// fin est fixée côté serveur : recharger la page ne rajoute pas de temps.
// Avant le montage, pas de secondes affichées (même rendu serveur/client).
export function useWelcomeCountdown(endsAt: number | null, initialActive: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt]);

  if (!endsAt) return { active: false, remaining: null as string | null, msLeft: null as number | null };
  if (now === null) return { active: initialActive, remaining: null as string | null, msLeft: null as number | null };
  const ms = endsAt - now;
  if (ms <= 0) return { active: false, remaining: null as string | null, msLeft: null as number | null };
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { active: true, remaining: `${minutes}:${String(seconds).padStart(2, "0")}`, msLeft: ms };
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Chiffre du chrono dans sa tuile : glisse à chaque changement.
function DigitTile({ char, size }: { char: string; size: "lg" | "sm" }) {
  const lg = size === "lg";
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: lg ? 46 : 34,
        height: lg ? 60 : 48,
        borderRadius: lg ? 12 : 10,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "inset 0 -10px 18px rgba(0,0,0,0.12)",
      }}
    >
      <motion.span
        key={char}
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ fontFamily: "var(--font-heading)", fontSize: lg ? 38 : 28, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
      >
        {char}
      </motion.span>
      <span aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,0.12)" }} />
    </span>
  );
}

// Carte du chrono : tuiles de chiffres, barre qui se vide, reflet ; rouge
// et pulsation quand il reste peu de temps.
function TimerCard({
  urgent,
  title,
  groups,
  size,
  progress,
  label,
  footer,
}: {
  urgent: boolean;
  title: string;
  groups: string[];
  size: "lg" | "sm";
  progress: number;
  label: string;
  footer: string;
}) {
  return (
    <motion.div
      className="animate-in"
      role="timer"
      aria-live="off"
      aria-label={label}
      animate={urgent ? { scale: [1, 1.015, 1] } : { scale: 1 }}
      transition={urgent ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        color: "#fff",
        borderRadius: 22,
        padding: "14px 16px 15px",
        marginBottom: 16,
        background: urgent
          ? "linear-gradient(135deg, #8f1d21, #e5484d)"
          : "linear-gradient(135deg, var(--color-accent-900), var(--color-accent-700) 55%, var(--color-accent))",
        boxShadow: `0 14px 32px color-mix(in srgb, ${urgent ? "#e5484d" : "var(--color-accent)"} 38%, transparent)`,
      }}
    >
      <motion.span
        aria-hidden
        initial={{ x: "-120%" }}
        animate={{ x: "320%" }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "35%",
          background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.16), transparent)",
          pointerEvents: "none",
        }}
      />
      <p style={{ position: "relative", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        <motion.span
          aria-hidden
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", background: urgent ? "#fff" : "var(--color-accent-300)" }}
        />
        {title}
      </p>
      <div aria-hidden style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: size === "lg" ? 6 : 4, marginTop: 10 }}>
        {groups.map((group, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ fontFamily: "var(--font-heading)", fontSize: size === "lg" ? 34 : 26, fontWeight: 800, margin: "0 2px" }}
              >
                :
              </motion.span>
            )}
            {group.split("").map((char, j) => (
              <DigitTile key={j} char={char} size={size} />
            ))}
          </Fragment>
        ))}
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.2)", margin: "12px 6px 0", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            borderRadius: 999,
            background: urgent ? "#fff" : "linear-gradient(90deg, var(--color-accent-300), #fff)",
            transition: "width 1s linear",
          }}
        />
      </div>
      <p style={{ position: "relative", margin: "10px 0 0", fontSize: 13, fontWeight: 600, lineHeight: 1.4, opacity: 0.95 }}>{footer}</p>
    </motion.div>
  );
}

// Gros chrono en haut du paywall (20/10, Nathan : « nettement plus gros,
// beaucoup plus visible » ; 22/10 : 10 min et plus stylé). Prix de
// bienvenue en cours : son chrono (rouge dans les 2 dernières minutes).
// Sinon, pendant l'offre 48 h sur l'accès à vie : le chrono de l'offre.
export function WelcomePriceBanner({
  endsAt,
  initialActive,
  promoActive = false,
}: {
  endsAt: number | null;
  initialActive: boolean;
  promoActive?: boolean;
}) {
  const welcome = useWelcomeCountdown(endsAt, initialActive);
  const promo = useWelcomeCountdown(LIFETIME_PROMO.endsAt, promoActive);

  if (welcome.active) {
    const ms = welcome.msLeft;
    const [mm, ss] = ms === null ? ["––", "––"] : [pad2(Math.floor(ms / 60_000)), pad2(Math.floor((ms % 60_000) / 1000))];
    const urgent = ms !== null && ms < 2 * 60_000;
    return (
      <TimerCard
        urgent={urgent}
        title={urgent ? "⚡ Dernières minutes" : "🎁 Ton prix de bienvenue expire dans"}
        groups={[mm, ss]}
        size="lg"
        progress={ms === null ? 1 : ms / WELCOME_WINDOW_MS}
        label={`Prix de bienvenue : encore ${mm} min ${ss} s`}
        footer={
          promo.active
            ? `Ensuite : ${PLAN_PRICES.monthly.regular}/mois · à vie : ${LIFETIME_PROMO.price} jusqu'au ${LIFETIME_PROMO.endsLabel}`
            : `Ensuite : ${PLAN_PRICES.monthly.regular}/mois · ${PLAN_PRICES.lifetime.regular} à vie`
        }
      />
    );
  }

  if (promo.active) {
    const ms = promo.msLeft;
    const groups =
      ms === null
        ? ["––", "––", "––"]
        : [pad2(Math.floor(ms / 3_600_000)), pad2(Math.floor((ms % 3_600_000) / 60_000)), pad2(Math.floor((ms % 60_000) / 1000))];
    return (
      <TimerCard
        urgent={ms !== null && ms < 3_600_000}
        title={`🔥 Accès à vie à ${LIFETIME_PROMO.price} · fin dans`}
        groups={groups}
        size="sm"
        progress={ms === null ? 1 : ms / (LIFETIME_PROMO.endsAt - LIFETIME_PROMO.startsAt)}
        label={`Offre accès à vie à ${LIFETIME_PROMO.price} : encore ${groups[0]} h ${groups[1]} min`}
        footer={`Offre 48 h, jusqu'au ${LIFETIME_PROMO.endsLabel} · ensuite ${PLAN_PRICES.lifetime.regular}`}
      />
    );
  }

  return null;
}
