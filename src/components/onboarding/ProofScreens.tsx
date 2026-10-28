"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";

// Écrans de preuve de l'onboarding (28/10, Nathan : « sur les 10 écrans, il
// nous faut de la proof : un après le 3e, un après le 5e, un après le 9e »).
// Uniquement du vrai : le comparatif décrit comment on cherche (pas de
// pourcentages de réussite inventés : la jauge compte ce qui est fait pour
// toi, sur 4 critères écrits à l'écran), les avis sont de vrais avis
// approuvés, la démo est la vraie vidéo de l'appli.

export type ProofData = {
  testimonials: { quote: string; author: string; rating: number }[];
  reviewStats: { count: number; average: number | null };
  /** Inscrits des 7 derniers jours. */
  weeklySignups: number | null;
  activeOffers: number | null;
};

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";
const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

function Glow() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 24%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent-2) 20%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, color: "var(--color-accent-700)" }}
    >
      {children}
    </motion.p>
  );
}

function Count({ target, durationMs = 1300 }: { target: number; durationMs?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return <>{fmt(value)}</>;
}

function NextButton({ onClick, children = "Continuer" }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="btn btn-primary btn-block"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      whileTap={{ scale: 0.97 }}
      style={{ position: "relative", marginTop: 18 }}
    >
      {children}
    </motion.button>
  );
}

// --- 1. Chercher seul, ou avec Stageio ? (jauge) ---------------------------
// Score = ce qui est fait pour toi, sur 4 critères affichés sous la jauge.
// Sites d'emploi : offres réunies et suggestions pour ton profil, oui ;
// lettre prête pour chaque offre et suivi de toutes tes candidatures au même
// endroit, non.

const CRITERIA = ["Offres réunies", "Triées pour ton profil", "Lettre prête pour chaque offre", "Suivi au même endroit"] as const;

const APPROACHES = [
  { icon: "🚪", label: "Porte-à-porte", done: [false, false, false, false], color: "#e5484d" },
  { icon: "💻", label: "Sites d'emploi", done: [true, true, false, false], color: "#f5a623" },
  { icon: "⚡", label: "Stageio", done: [true, true, true, true], color: "#0f9c56" },
] as const;

const GAUGE_R = 120;
const GAUGE_LEN = Math.PI * GAUGE_R;

function arcPoint(ratio: number, r = GAUGE_R) {
  const angle = Math.PI * (1 - ratio);
  return { x: 150 + r * Math.cos(angle), y: 150 - r * Math.sin(angle) };
}

export function ProofCompare({ onNext }: { onNext: () => void }) {
  // 0 : porte-à-porte, 1 : sites d'emploi, 2 : Stageio (l'aiguille s'arrête là).
  const [stage, setStage] = useState(-1);
  useEffect(() => {
    const timers = [400, 1700, 3000].map((ms, i) => window.setTimeout(() => setStage(i), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const current = stage >= 0 ? APPROACHES[stage] : null;
  const score = current ? current.done.filter(Boolean).length : 0;
  const ratio = score / 4;
  const final = stage === 2;
  // Aiguille : angle animé à ressort (qui dépasse un peu, puis se pose),
  // tourné autour du centre de la jauge.
  const [angle, setAngle] = useState(-90);
  const angleRef = useRef(-90);
  useEffect(() => {
    const controls = animate(angleRef.current, -90 + ratio * 180, {
      type: "spring",
      stiffness: 70,
      damping: 9,
      onUpdate: (a) => {
        angleRef.current = a;
        setAngle(a);
      },
    });
    return () => controls.stop();
  }, [ratio]);

  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col justify-center" style={{ position: "relative" }}>
      <div style={{ position: "relative", textAlign: "center" }}>
        <Kicker>Pourquoi Stageio</Kicker>
        <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.18, margin: "6px 0 0" }}>Chercher seul, ou avec Stageio ?</h1>
        <p style={{ fontSize: 14, margin: "6px 0 0", color: muted }}>Ce qui est fait pour toi, sur 4.</p>
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "16px auto 0" }}>
        <svg viewBox="0 0 300 170" width="100%" role="img" aria-label="Porte-à-porte 0 sur 4, sites d'emploi 2 sur 4, Stageio 4 sur 4">
          <defs>
            <linearGradient id="proof-gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e5484d" />
              <stop offset="50%" stopColor="#f5a623" />
              <stop offset="100%" stopColor="#0f9c56" />
            </linearGradient>
          </defs>
          <path d={`M ${150 - GAUGE_R} 150 A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${150 + GAUGE_R} 150`} stroke="var(--color-surface)" strokeWidth="22" fill="none" strokeLinecap="round" />
          <motion.path
            d={`M ${150 - GAUGE_R} 150 A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${150 + GAUGE_R} 150`}
            stroke="url(#proof-gauge)"
            strokeWidth="22"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={GAUGE_LEN}
            initial={{ strokeDashoffset: GAUGE_LEN }}
            animate={{ strokeDashoffset: GAUGE_LEN * (1 - Math.max(ratio, 0.001)) }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const a = arcPoint(t, GAUGE_R + 20);
            return (
              <text key={t} x={a.x} y={a.y + 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-neutral-500)">
                {t * 4}
              </text>
            );
          })}
          <g transform={`rotate(${angle} 150 150)`}>
            <path d="M 146 150 L 150 52 L 154 150 Z" fill="var(--color-text)" />
          </g>
          <circle cx="150" cy="150" r="13" fill="var(--color-text)" />
          <circle cx="150" cy="150" r="5" fill="var(--color-bg)" />
        </svg>
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.label}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: final ? 1.08 : 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              style={{ textAlign: "center", marginTop: -6 }}
            >
              <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 40, fontWeight: 800, lineHeight: 1, color: current.color }}>
                {score}/4
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800 }}>
                {current.icon} {current.label}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {final && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0.5, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ position: "absolute", left: "50%", top: "52%", width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: "50%", border: "3px solid #0f9c56", pointerEvents: "none" }}
          />
        )}
      </div>

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 14 }}>
        {APPROACHES.map((a, i) => {
          const on = stage >= i;
          const highlight = i === 2 && final;
          return (
            <motion.div
              key={a.label}
              animate={{ opacity: on ? 1 : 0.35, y: on ? 0 : 6, scale: highlight ? 1.04 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{
                padding: "9px 6px 10px",
                borderRadius: 14,
                textAlign: "center",
                background: highlight ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-700))" : "var(--color-surface)",
                color: highlight ? "var(--color-bg)" : "var(--color-text)",
                boxShadow: highlight ? "0 12px 26px color-mix(in srgb, var(--color-accent) 32%, transparent)" : "none",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800 }}>
                {a.icon} {a.label}
              </div>
              <div aria-hidden style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
                {a.done.map((d, k) => (
                  <motion.span
                    key={k}
                    initial={false}
                    animate={{ scale: on && d ? [1, 1.4, 1] : 1 }}
                    transition={{ delay: k * 0.08 }}
                    style={{ width: 9, height: 9, borderRadius: "50%", background: d ? (highlight ? "var(--color-bg)" : a.color) : "color-mix(in srgb, var(--color-text) 15%, transparent)" }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: final ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: "relative", listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px 10px" }}
      >
        {CRITERIA.map((c) => (
          <li key={c} className="flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 700 }}>
            <span aria-hidden style={{ color: "var(--color-accent-700)" }}>
              ✓
            </span>
            {c}
          </li>
        ))}
      </motion.ul>
      </div>

      <NextButton onClick={onNext} />
    </div>
  );
}

// --- 2. Ils cherchent avec Stageio (vrais avis) ----------------------------

export function ProofReviews({ data, onNext }: { data: ProofData; onNext: () => void }) {
  const { testimonials, reviewStats, weeklySignups } = data;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (testimonials.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 4200);
    return () => clearInterval(timer);
  }, [testimonials.length]);
  const current = testimonials[index];

  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ position: "relative" }}>
        <Kicker>Ils l&apos;utilisent</Kicker>
        <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.18, margin: "6px 0 0" }}>Ce qu&apos;en disent les étudiants</h1>

        {reviewStats.count >= 3 && reviewStats.average !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 380, damping: 20 }}
            className="flex items-center gap-2"
            style={{ marginTop: 14, padding: "7px 14px", borderRadius: 999, background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontWeight: 800, fontSize: 14 }}
          >
            <span aria-hidden style={{ color: "#f5a623", letterSpacing: 1 }}>
              ★★★★★
            </span>
            {reviewStats.average.toLocaleString("fr-FR")}/5 · {fmt(reviewStats.count)} avis
          </motion.div>
        )}

        {current ? (
          <div style={{ position: "relative", width: "100%", minHeight: 210, marginTop: 18 }}>
            <AnimatePresence mode="wait">
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 18, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -18, rotate: 1.5 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="card"
                style={{ margin: 0, padding: "18px 18px 16px", textAlign: "left", boxShadow: "0 18px 40px rgba(19,43,51,.12)" }}
              >
                <div aria-hidden style={{ color: "#f5a623", fontSize: 16, letterSpacing: 2 }}>
                  {"★".repeat(Math.round(current.rating))}
                </div>
                <blockquote style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, fontWeight: 600 }}>
                  « {current.quote.length > 260 ? `${current.quote.slice(0, 257)}…` : current.quote} »
                </blockquote>
                <figcaption className="flex items-center gap-2" style={{ marginTop: 12, fontSize: 13, fontWeight: 800 }}>
                  <span
                    aria-hidden
                    className="flex items-center justify-center"
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))", color: "var(--color-bg)", fontSize: 13 }}
                  >
                    {current.author.slice(0, 1).toUpperCase()}
                  </span>
                  {current.author}
                  <span style={{ fontWeight: 600, color: muted }}>· avis laissé sur Stageio</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            {testimonials.length > 1 && (
              <div className="flex justify-center gap-1.5" style={{ marginTop: 12 }} aria-hidden>
                {testimonials.map((_, i) => (
                  <span key={i} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 999, background: i === index ? "var(--color-accent)" : "var(--color-divider)", transition: "width 0.3s ease" }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          weeklySignups !== null &&
          weeklySignups > 0 && (
            <div style={{ marginTop: 22 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 52, fontWeight: 800, margin: 0, color: "var(--color-accent-700)" }}>
                +<Count target={weeklySignups} />
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 0" }}>étudiants ont rejoint Stageio cette semaine</p>
            </div>
          )
        )}

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: 15, fontWeight: 800, margin: "18px 0 0", padding: "8px 16px", borderRadius: 999, background: "var(--color-surface)" }}
        >
          ✨ À ton tour
        </motion.p>
      </div>
      <NextButton onClick={onNext} />
    </div>
  );
}

// --- 3. Voilà comment tu vas postuler (vraie vidéo de l'appli) -----------
// La vidéo du parcours de la page d'accueil (vraie offre, vrai paquet, rendu
// image par image), avec les 3 étapes qui s'allument en même temps.

const DEMO_STEPS = [
  { at: 0, title: "Swipe les offres faites pour toi" },
  { at: 2.3, title: "Un like lance ta candidature" },
  { at: 5.47, title: "Ta lettre est déjà écrite" },
] as const;
const DEMO_DURATION = 12.23;

export function ProofDemo({ data, onNext }: { data: ProofData; onNext: () => void }) {
  const [time, setTime] = useState(0);
  // WebM (VP9) quand le navigateur sait le lire, sinon MP4 (Safari) : même
  // choix que la vidéo du parcours sur la page d'accueil.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    const canWebm = !!videoRef.current?.canPlayType('video/webm; codecs="vp9"');
    setSrc(canWebm ? "/app/parcours.webm" : "/app/parcours.mp4");
  }, []);
  useEffect(() => {
    if (src) void videoRef.current?.play().catch(() => {});
  }, [src]);
  const active = DEMO_STEPS.reduce((acc, s, i) => (time >= s.at ? i : acc), 0);
  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col justify-center" style={{ position: "relative" }}>
      <div style={{ position: "relative", textAlign: "center" }}>
        <Kicker>En vrai, dans l&apos;appli</Kicker>
        <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.18, margin: "6px 0 0" }}>Voilà comment tu vas postuler</h1>
      </div>

      <div className="flex items-center gap-4" style={{ position: "relative", marginTop: 16 }}>
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          style={{ flexShrink: 0, width: "46%", maxWidth: 210, padding: 6, borderRadius: 28, background: "#0e1a1f", boxShadow: "0 24px 50px rgba(19,43,51,.28)" }}
        >
          <video
            ref={videoRef}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/app/parcours-poster.jpg"
            aria-label="Démo : swipe d'une offre, like, lettre de motivation prête"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            style={{ display: "block", width: "100%", aspectRatio: "780 / 1688", borderRadius: 23, background: "#eaf5f8", objectFit: "cover" }}
          />
        </motion.div>

        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
          {DEMO_STEPS.map((step, i) => {
            const end = DEMO_STEPS[i + 1]?.at ?? DEMO_DURATION;
            const progress = i < active ? 1 : i === active ? Math.min(1, Math.max(0, (time - step.at) / (end - step.at))) : 0;
            return (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, scale: i === active ? 1.03 : 1 }}
                transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 300, damping: 24 }}
                style={{
                  padding: "10px 11px",
                  borderRadius: 14,
                  background: i === active ? "var(--color-bg)" : "var(--color-surface)",
                  border: i === active ? "1.5px solid var(--color-accent)" : "1.5px solid transparent",
                  boxShadow: i === active ? "0 10px 24px rgba(19,43,51,.10)" : "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, fontSize: 12, fontWeight: 800, background: i <= active ? "var(--color-accent)" : "var(--color-divider)", color: "var(--color-bg)" }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>{step.title}</span>
                </div>
                <div aria-hidden style={{ height: 3, borderRadius: 999, background: "var(--color-divider)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress * 100}%`, background: "var(--color-accent)", borderRadius: 999, transition: "width 0.25s linear" }} />
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {data.activeOffers !== null && data.activeOffers > 0 && (
        <p style={{ position: "relative", fontSize: 13, textAlign: "center", margin: "14px 0 0", color: muted }}>
          Parmi {fmt(data.activeOffers)} offres d&apos;alternance et de stage en ce moment.
        </p>
      )}
      </div>
      <NextButton onClick={onNext} />
    </div>
  );
}

// --- Après le contrat signé --------------------------------------------------

export function PledgeDone({ contractLabel, onNext }: { contractLabel: string; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ position: "relative" }}>
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="flex items-center justify-center"
          style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))", color: "var(--color-bg)", boxShadow: "0 18px 40px color-mix(in srgb, var(--color-accent) 35%, transparent)" }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        {["🎯", "🚀", "✨"].map((e, i) => (
          <motion.span
            key={e}
            aria-hidden
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 1, 0], y: -90 - i * 14, x: (i - 1) * 70 }}
            transition={{ delay: 0.25 + i * 0.12, duration: 1.6 }}
            style={{ position: "absolute", top: "38%", fontSize: 26 }}
          >
            {e}
          </motion.span>
        ))}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: "22px 0 0" }}>
          C&apos;est signé.
          <br />
          On y va, ensemble.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ fontSize: 15, lineHeight: 1.5, margin: "10px 0 0", maxWidth: "32ch", color: muted }}>
          Tes offres sont prêtes. Like celles qui te plaisent : c&apos;est le premier pas vers {contractLabel}.
        </motion.p>
      </div>
      <NextButton onClick={onNext}>Voir mes offres</NextButton>
    </div>
  );
}
