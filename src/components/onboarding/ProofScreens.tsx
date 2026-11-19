"use client";

import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  /** Offres actives par type de contrat (P1). */
  offersByContract?: Partial<Record<string, number>> | null;
  /** Comptes Stageio au total (P3). */
  totalUsers?: number | null;
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

// Graphique en barres (19/11, Nathan : « fais plutôt un graphique ») : une
// barre par façon de chercher, hauteur = critères faits pour toi sur 4, puis
// le détail critère par critère.
const CHART_H = 150;

export function ProofCompare({ onNext }: { onNext: () => void }) {
  // Les barres montent l'une après l'autre ; la dernière (Stageio) ressort.
  const [stage, setStage] = useState(-1);
  useEffect(() => {
    const timers = [350, 1050, 1750].map((ms, i) => window.setTimeout(() => setStage(i), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const final = stage === 2;

  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col justify-center" style={{ position: "relative" }}>
        <div style={{ position: "relative", textAlign: "center" }}>
          <Kicker>Pourquoi Stageio</Kicker>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.18, margin: "6px 0 0" }}>Chercher seul, ou avec Stageio ?</h1>
          <p style={{ fontSize: 14, margin: "6px 0 0", color: muted }}>Ce qui est fait pour toi, sur 4 critères.</p>
        </div>

        <div
          role="img"
          aria-label="Porte-à-porte 0 sur 4, sites d'emploi 2 sur 4, Stageio 4 sur 4"
          style={{ position: "relative", margin: "22px auto 0", width: "100%", maxWidth: 340, height: CHART_H + 60, display: "grid", gridTemplateColumns: "22px repeat(3, minmax(0, 1fr))", columnGap: 10 }}
        >
          {/* Axe : 0 à 4, lignes de repère discrètes. */}
          {[0, 1, 2, 3, 4].map((v) => (
            <div key={v} aria-hidden style={{ position: "absolute", left: 26, right: 0, bottom: 34 + (v / 4) * CHART_H, borderTop: `1px ${v === 0 ? "solid" : "dashed"} color-mix(in srgb, var(--color-text) ${v === 0 ? 30 : 12}%, transparent)` }}>
              <span style={{ position: "absolute", left: -24, top: -8, fontSize: 11, fontWeight: 700, color: "var(--color-neutral-500)" }}>{v}</span>
            </div>
          ))}
          <div />
          {APPROACHES.map((ap, i) => {
            const score = ap.done.filter(Boolean).length;
            const on = stage >= i;
            const star = i === 2;
            return (
              <div key={ap.label} className="flex flex-col items-center justify-end" style={{ position: "relative", height: CHART_H + 60 }}>
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6 }}
                  transition={{ delay: on ? 0.35 : 0 }}
                  style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: star ? 22 : 16, color: ap.color, marginBottom: 4 }}
                >
                  {score}/4
                </motion.span>
                <motion.div
                  initial={{ height: 4 }}
                  animate={{ height: on ? Math.max(4, (score / 4) * CHART_H) : 4 }}
                  transition={{ type: "spring", stiffness: 110, damping: 18 }}
                  style={{
                    width: "70%",
                    flexShrink: 0,
                    borderRadius: "10px 10px 4px 4px",
                    background: star ? "linear-gradient(180deg, var(--color-accent), var(--color-accent-700))" : ap.color,
                    opacity: star ? 1 : 0.85,
                    boxShadow: star && final ? "0 12px 26px color-mix(in srgb, var(--color-accent) 35%, transparent)" : "none",
                  }}
                />
                <div style={{ height: 34, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 5, fontSize: 11.5, fontWeight: 800, textAlign: "center", lineHeight: 1.15 }}>
                  {ap.icon} {ap.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Détail : quels critères chaque façon de chercher fait pour toi. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: final ? 1 : 0, y: final ? 0 : 8 }}
          transition={{ duration: 0.4 }}
          className="card"
          style={{ position: "relative", margin: "16px auto 0", width: "100%", maxWidth: 360, padding: "10px 12px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, 40px)", alignItems: "center", rowGap: 6, fontSize: 12.5 }}>
            <span />
            {APPROACHES.map((ap) => (
              <span key={ap.label} aria-label={ap.label} style={{ textAlign: "center", fontSize: 15 }}>
                {ap.icon}
              </span>
            ))}
            {CRITERIA.map((c, k) => (
              <Fragment key={c}>
                <span style={{ fontWeight: 700 }}>{c}</span>
                {APPROACHES.map((ap) => (
                  <span key={ap.label} style={{ textAlign: "center", fontWeight: 800, color: ap.done[k] ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 30%, transparent)" }}>
                    {ap.done[k] ? "✓" : "✕"}
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
        </motion.div>
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
            {reviewStats.average.toLocaleString("fr-FR")}/5 · note globale
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
  { at: 1.7, title: "Un like lance ta candidature" },
  { at: 3.4, title: "Ta lettre est déjà écrite" },
] as const;
// Mini-film animé en HTML (19/11, Nathan : « une VSL animée de 5 secondes »),
// en boucle : la carte d'offre part à droite (like), la candidature part,
// la lettre s'écrit. Exemple d'illustration, pas une vraie offre.
const DEMO_DURATION = 5;

function DemoFilm({ time }: { time: number }) {
  const swipe = Math.min(1, Math.max(0, (time - 1.05) / 0.5)); // 0 → 1 : la carte part
  const sent = time >= 1.7 && time < 3.4;
  const letter = time >= 3.4;
  const typed = Math.min(1, Math.max(0, (time - 3.6) / 1.1));
  const lines = [0.92, 0.8, 0.88, 0.6];
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "780 / 1688", borderRadius: 23, background: "#eaf5f8", overflow: "hidden", fontFamily: "var(--font-heading)" }}>
      <div style={{ padding: "12px 10px 0", fontSize: 9, fontWeight: 800, color: "#0f2e1d" }}>
        <span style={{ color: "#13a05b" }}>●</span> Stageio
        <div style={{ fontSize: 10.5, marginTop: 4, whiteSpace: "nowrap" }}>Tes offres du jour</div>
      </div>
      {/* Carte d'offre (exemple) */}
      {!letter && (
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: 50,
            borderRadius: 14,
            background: "#fff",
            boxShadow: "0 8px 20px rgba(19,43,51,.14)",
            overflow: "hidden",
            transform: `translateX(${swipe * 140}%) rotate(${swipe * 18}deg)`,
            opacity: 1 - swipe * 0.9,
            transition: "transform 60ms linear",
          }}
        >
          <div style={{ background: "#13a05b", color: "#fff", padding: "8px 9px", fontSize: 9, fontWeight: 800, display: "flex", justifyContent: "space-between" }}>
            <span>Exemple d&apos;offre</span>
            <span>94 %</span>
          </div>
          <div style={{ padding: "9px 9px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f2e1d", lineHeight: 1.2 }}>Vendeur·se en CDI</div>
            <div style={{ fontSize: 9, color: "#4b6658", marginTop: 3 }}>📍 Lyon · Débutant accepté</div>
            <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
              {["CDI", "Temps plein", "Débutant"].map((x) => (
                <span key={x} style={{ fontSize: 8, fontWeight: 800, background: "#e3f5ea", color: "#0b6b3c", borderRadius: 6, padding: "2px 5px" }}>{x}</span>
              ))}
            </div>
            {[0.95, 0.85, 0.7].map((w, i) => (
              <div key={i} style={{ height: 5, width: `${w * 100}%`, background: "#e8efec", borderRadius: 3, marginTop: 6 }} />
            ))}
          </div>
          {time > 0.7 && (
            <div style={{ position: "absolute", top: 62, right: 8, transform: "rotate(12deg)", background: "#fff", border: "2.5px solid #13a05b", color: "#13a05b", borderRadius: 7, padding: "1px 7px", fontSize: 13, fontWeight: 900, opacity: Math.min(1, (time - 0.7) / 0.3) }}>
              LIKE ❤️
            </div>
          )}
        </div>
      )}
      {/* Boutons du swipe */}
      {!letter && (
        <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 3px 8px rgba(0,0,0,.08)" }}>✕</span>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#13a05b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transform: `scale(${time > 0.85 && time < 1.25 ? 1.25 : 1})`, transition: "transform 120ms" }}>♥</span>
        </div>
      )}
      {/* Candidature partie */}
      {sent && (
        <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} style={{ position: "absolute", left: 10, right: 10, top: "34%", textAlign: "center" }}>
          <div style={{ width: 54, height: 54, margin: "0 auto", borderRadius: "50%", background: "#13a05b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>✓</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f2e1d", marginTop: 9 }}>Candidature lancée</div>
          <div style={{ fontSize: 9.5, color: "#4b6658", marginTop: 3 }}>Vendeur·se en CDI · Lyon</div>
        </motion.div>
      )}
      {/* La lettre s'écrit */}
      {letter && (
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} style={{ position: "absolute", left: 8, right: 8, top: 52, bottom: 14, background: "#fff", borderRadius: 12, padding: "10px 9px", boxShadow: "0 8px 20px rgba(19,43,51,.14)" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#0b6b3c", background: "#e3f5ea", borderRadius: 6, padding: "2px 6px", display: "inline-block" }}>✨ Lettre prête</div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#0f2e1d", marginTop: 8 }}>Madame, Monsieur,</div>
          {lines.map((w, i) => {
            const fill = Math.min(1, Math.max(0, typed * lines.length - i));
            return <div key={i} style={{ height: 5, width: `${w * fill * 100}%`, background: "#cfe3d7", borderRadius: 3, marginTop: 7 }} />;
          })}
          {typed >= 1 && <div style={{ fontSize: 9, color: "#4b6658", marginTop: 9 }}>Envoyée avec ton CV ✓</div>}
        </motion.div>
      )}
    </div>
  );
}

export function ProofDemo({ data, onNext }: { data: ProofData; onNext: () => void }) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setTime(((now - start) / 1000) % DEMO_DURATION);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
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
          <div role="img" aria-label="Démo : like d'une offre, candidature lancée, lettre de motivation prête">
            <DemoFilm time={time} />
          </div>
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
          Parmi {fmt(data.activeOffers)} offres en ligne en ce moment.
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

// --- P1. Offres en ligne (19/11, test A/B) ----------------------------------
// Vrai nombre d'offres actives pour les contrats choisis (tous contrats si
// rien n'est encore choisi), lu en base au chargement de la page.

const P1_LABEL: Record<string, string> = { cdi: "CDI", cdd: "CDD", alternance: "alternances", stage: "stages", stage_scolaire: "stages de collège et lycée" };

export function ProofOffers({ data, lookingFor, onNext }: { data: ProofData; lookingFor: string[]; onNext: () => void }) {
  const by = data.offersByContract ?? {};
  const chosen = lookingFor.filter((c) => (by[c] ?? 0) > 0);
  const parts = (chosen.length > 0 ? chosen : ["cdi", "cdd"]).filter((c) => (by[c] ?? 0) > 0);
  const total = parts.reduce((s, c) => s + (by[c] ?? 0), 0) || data.activeOffers || 0;
  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ position: "relative" }}>
        <Kicker>En ligne aujourd&apos;hui</Kicker>
        {total > 0 && (
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 56, fontWeight: 800, margin: "10px 0 0", color: "var(--color-accent-700)", letterSpacing: "-0.02em" }}>
            <Count target={total} />
          </p>
        )}
        <p style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.3, maxWidth: "26ch" }}>
          {parts.length > 0 ? `${parts.map((c) => P1_LABEL[c] ?? c).join(" et ")} en ligne sur Stageio` : "offres en ligne sur Stageio"}
        </p>
        {parts.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: 14 }}>
            {parts.map((c) => (
              <span key={c} style={{ padding: "6px 12px", borderRadius: 999, background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontWeight: 800, fontSize: 13 }}>
                {fmt(by[c] ?? 0)} {P1_LABEL[c] ?? c}
              </span>
            ))}
          </div>
        )}
        <p style={{ fontSize: 14, margin: "16px 0 0", color: muted, maxWidth: "30ch", lineHeight: 1.45 }}>
          Mises à jour chaque jour.
        </p>
      </div>
      <NextButton onClick={onNext} />
    </div>
  );
}

// --- P3. Communauté (19/11, Nathan : « dis qu'on accompagne plus de X
// personnes à trouver leur emploi partout en France ») ---------------------
// X = vrai nombre de comptes, lu en base, arrondi à la centaine inférieure.

export function ProofWeek({ data, onNext }: { data: ProofData; onNext: () => void }) {
  const users = data.totalUsers ?? 0;
  const shown = users >= 200 ? Math.floor(users / 100) * 100 : users;
  return (
    <div className="flex flex-1 flex-col px-1" style={{ position: "relative", overflow: "hidden" }}>
      <Glow />
      <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ position: "relative" }}>
        <Kicker>Tu n&apos;es pas seul·e</Kicker>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} aria-hidden style={{ fontSize: 54, marginTop: 10 }}>
          🇫🇷
        </motion.div>
        {shown > 0 ? (
          <>
            <p style={{ fontSize: 18, fontWeight: 800, margin: "10px 0 0" }}>Stageio accompagne plus de</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 58, fontWeight: 800, margin: "2px 0 0", color: "var(--color-accent-700)", lineHeight: 1.05 }}>
              <Count target={shown} />
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.3, maxWidth: "26ch" }}>personnes à trouver leur emploi, partout en France</p>
          </>
        ) : (
          <p style={{ fontSize: 18, fontWeight: 800, margin: "14px 0 0", lineHeight: 1.35, maxWidth: "26ch" }}>Stageio accompagne des personnes partout en France à trouver leur emploi.</p>
        )}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ fontSize: 15, fontWeight: 800, margin: "20px 0 0", padding: "8px 16px", borderRadius: 999, background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}
        >
          ✨ Et maintenant, toi
        </motion.p>
      </div>
      <NextButton onClick={onNext} />
    </div>
  );
}
