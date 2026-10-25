"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { logButtonClick } from "@/lib/analytics/logButtonClick";
import { AUTO_DAILY_LIMIT, AUTO_PRICES } from "@/lib/pricing/plans";

// « ? » en haut à droite de l'encadré Stageio Auto (25/10, demande de
// Nathan : « une FAQ animée avec une VSL pour expliquer l'offre à 17,99 et
// 80 € ») : vidéo de 22 s (vraie capture du paquet d'offres, rendue image
// par image comme la vidéo du parcours) puis les questions qu'on se pose
// avant de payer. Réponses fidèles au code d'envoi (api/applications/
// auto-send) : rien n'est promis que l'envoi ne fasse pas.

const muted = "color-mix(in srgb, var(--color-text) 66%, transparent)";

// Premium contre Stageio Auto, avec croix et coches (Nathan, 25/10 : « mets
// ce qu'il y a de plus en prenant l'offre à 17,99 », « avec des croix et des
// coches »). Fidèle au code : envoi au like (api/applications/auto-send),
// boîte réservée à Auto (boite/page.tsx), candidature notée « envoyée » avec
// relance à 7 jours (FOLLOW_UP_DAYS) ; le reste est commun aux deux.
export const AUTO_COMPARISON = [
  { label: "Ta candidature part à chaque like : lettre et CV", premium: false },
  { label: `Jusqu'à ${AUTO_DAILY_LIMIT} candidatures envoyées par jour`, premium: false },
  { label: "Une adresse de candidature à ton nom", premium: false },
  { label: "Ta boîte Stageio : les réponses des recruteurs dans l'appli", premium: false },
  { label: "Chaque envoi noté dans ton suivi, relance prévue à 7 jours", premium: false },
  { label: "Likes, lettres de motivation, audit CV, simulateur d'entretien", premium: true },
] as const;

function Mark({ ok, size, delay }: { ok: boolean; size: number; delay: number }) {
  return (
    <motion.span
      role="img"
      aria-label={ok ? "Inclus" : "Non inclus"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 520, damping: 22 }}
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        fontSize: size * 0.62,
        fontWeight: 800,
        lineHeight: 1,
        background: ok ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 10%, transparent)",
        color: ok ? "var(--color-bg)" : "color-mix(in srgb, var(--color-text) 45%, transparent)",
      }}
    >
      {ok ? "✓" : "✕"}
    </motion.span>
  );
}

export function AutoComparison({ compact = false }: { compact?: boolean }) {
  const mark = compact ? 18 : 20;
  const col = compact ? 50 : 58;
  const head = { fontSize: compact ? 11 : 11.5, fontWeight: 800, textAlign: "center", padding: "0 0 6px" } as const;
  return (
    <table style={{ width: "100%", marginTop: compact ? 12 : 0, borderCollapse: "collapse", tableLayout: "fixed" }}>
      <thead>
        <tr>
          <th style={{ ...head, textAlign: "left", color: "var(--color-accent-700)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Ce qui change</th>
          <th style={{ ...head, width: col, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Premium</th>
          <th style={{ ...head, width: col, color: "var(--color-accent-700)" }}>Auto</th>
        </tr>
      </thead>
      <tbody>
        {AUTO_COMPARISON.map((row, i) => (
          <motion.tr
            key={row.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 + i * 0.07, type: "spring", stiffness: 420, damping: 30 }}
            style={{ borderTop: "1px solid var(--color-divider)" }}
          >
            <td style={{ padding: compact ? "6px 6px 6px 0" : "8px 8px 8px 0", fontSize: compact ? 12.5 : 13.5, lineHeight: 1.35, fontWeight: 600 }}>{row.label}</td>
            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
              <Mark ok={row.premium} size={mark} delay={0.2 + i * 0.07} />
            </td>
            <td style={{ textAlign: "center", verticalAlign: "middle", background: "color-mix(in srgb, var(--color-accent) 9%, transparent)" }}>
              <Mark ok size={mark} delay={0.28 + i * 0.07} />
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

const FAQ = [
  {
    q: "Comment ça marche ?",
    a: "Tu swipes comme d'habitude. Quand tu likes une offre, ta candidature part au recruteur : ta lettre de motivation et ton CV, depuis une adresse à ton nom. Tu continues à swiper pendant ce temps.",
  },
  {
    q: "Quelle lettre est envoyée ?",
    a: "Celle que tu as préparée pour cette offre si tu en as écrit une ; sinon une lettre faite pour l'offre à partir de ton profil. Elle est gardée dans ton suivi de candidatures.",
  },
  {
    q: "À qui part ma candidature ?",
    a: "À l'adresse publiée par le recruteur, ou par La bonne alternance (le service public de l'alternance). Si l'annonce ne permet ni l'un ni l'autre, le like reste un favori et tu postules toi-même.",
  },
  {
    q: `Combien de candidatures par jour ?`,
    a: `Jusqu'à ${AUTO_DAILY_LIMIT} par jour. Au-delà, tes likes deviennent des favoris jusqu'au lendemain.`,
  },
  {
    q: "Où arrivent les réponses ?",
    a: "Les recruteurs répondent à ton adresse de candidature (ton nom @candidat.stageio.fr) et tu lis leurs réponses dans ta boîte Stageio.",
  },
  {
    q: "Qu'est-ce qu'il me faut ?",
    a: "Un CV dans ton profil (PDF ou Word) et ton numéro de téléphone : La bonne alternance le demande pour transmettre ta candidature.",
  },
  {
    q: "Et par rapport à Premium ?",
    a: "Tout Premium est inclus : likes, lettres, simulateur d'entretien, suivi. Avec Premium, tu postules toi-même ; avec Auto, le like envoie la candidature.",
  },
  {
    q: `${AUTO_PRICES.monthly}/mois ou ${AUTO_PRICES.lifetime} à vie ?`,
    a: `Mensuel : ${AUTO_PRICES.monthly} par mois, sans engagement, résiliable à tout moment depuis ta page Premium. À vie : ${AUTO_PRICES.lifetime} en une seule fois, moins de 5 mois de mensuel, et plus rien à payer ensuite.`,
  },
] as const;

function FaqItem({ q, a, index, open, onToggle }: { q: string; a: string; index: number; open: boolean; onToggle: () => void }) {
  const id = `auto-faq-${index}`;
  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05, type: "spring", stiffness: 420, damping: 32 }}
      style={{ borderTop: index === 0 ? "none" : "1px solid var(--color-divider)" }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3"
        style={{ padding: "13px 2px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--color-text)", fontSize: 14.5, fontWeight: 700 }}
      >
        {q}
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 45 : 0, backgroundColor: open ? "var(--color-accent)" : "var(--color-surface)", color: open ? "var(--color-bg)" : "var(--color-accent-700)" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="flex items-center justify-center"
          style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, fontSize: 17, fontWeight: 700, border: "1.5px solid var(--color-accent)" }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ margin: 0, padding: "0 2px 14px", fontSize: 13.5, lineHeight: 1.55, color: muted }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function AutoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "min(100%, calc(50vh * 0.8))", margin: "0 auto" }}>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/app/auto-vsl-poster.jpg"
        aria-label={`Vidéo : avec Stageio Auto, chaque like envoie ta candidature, jusqu'à ${AUTO_DAILY_LIMIT} par jour, ${AUTO_PRICES.monthly} par mois ou ${AUTO_PRICES.lifetime} à vie`}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress(v.currentTime / v.duration);
        }}
        style={{ display: "block", width: "100%", aspectRatio: "4 / 5", borderRadius: 18, background: "#0f9c56", objectFit: "cover" }}
      >
        <source src="/app/auto-vsl.webm" type='video/webm; codecs="vp9"' />
        <source src="/app/auto-vsl.mp4" type="video/mp4" />
      </video>
      <div aria-hidden style={{ position: "absolute", left: 14, right: 14, bottom: 10, height: 4, borderRadius: 999, background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "#fff", borderRadius: 999, transition: "width 0.25s linear" }} />
      </div>
    </div>
  );
}

export function AutoHelpButton({
  userId,
  source,
  ctaLabel,
  onChoose,
}: {
  userId?: string;
  // Emplacement du « ? » (paywall ou page Premium), pour l'admin.
  source: string;
  ctaLabel: string;
  // Sur le paywall : coche Stageio Auto. Sinon le bouton ferme la fenêtre.
  onChoose?: () => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Fenêtre rendue dans <body> (l'encadré est dans un bloc animé, qui
  // piégerait un position: fixed), seulement côté navigateur.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Le « ? » est dans le <label> de l'offre : ne pas cocher la ligne.
  const openDialog = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    if (userId) void logButtonClick(userId, "auto_vsl_open", { source });
  };

  const choose = () => {
    onChoose?.();
    setOpen(false);
    if (userId) void logButtonClick(userId, "auto_vsl_choose", { source });
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Comment marche Stageio Auto ? Voir la vidéo"
        aria-haspopup="dialog"
        onClick={openDialog}
        whileTap={{ scale: 0.88 }}
        animate={reduce ? undefined : { boxShadow: ["0 0 0 0 rgba(15,156,86,.45)", "0 0 0 8px rgba(15,156,86,0)"] }}
        transition={reduce ? undefined : { duration: 1.6, repeat: 3, repeatDelay: 1.2 }}
        className="flex items-center justify-center"
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "1.5px solid var(--color-accent)",
          background: "var(--color-bg)",
          color: "var(--color-accent-700)",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ?
      </motion.button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="auto-explainer"
                className="fixed inset-0 flex items-end justify-center sm:items-center"
                style={{ zIndex: 70, background: "rgba(10, 20, 18, 0.55)", padding: 12 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="auto-explainer-title"
                  className="card elev-lg w-full"
                  style={{ maxWidth: 440, maxHeight: "calc(100dvh - 24px)", overflowY: "auto", padding: 0, overscrollBehavior: "contain" }}
                  initial={{ y: 60, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 60, opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3" style={{ padding: "16px 16px 12px" }}>
                    <div>
                      <p id="auto-explainer-title" style={{ fontFamily: "var(--font-heading)", fontSize: 19, fontWeight: 800, margin: 0 }}>
                        Stageio Auto en 20 secondes
                      </p>
                      <p style={{ fontSize: 12.5, margin: "2px 0 0", color: muted }}>
                        {AUTO_PRICES.monthly}/mois ou {AUTO_PRICES.lifetime} à vie
                      </p>
                    </div>
                    <button
                      ref={closeRef}
                      type="button"
                      aria-label="Fermer"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center"
                      style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "var(--color-surface)", color: "var(--color-text)", fontSize: 18, cursor: "pointer", flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ padding: "0 16px" }}>
                    <AutoVideo />
                  </div>

                  <div style={{ margin: "14px 16px 0", padding: "12px 14px", borderRadius: 16, background: "var(--color-surface)", border: "1.5px solid var(--color-accent)" }}>
                    <AutoComparison />
                  </div>

                  <div style={{ padding: "14px 16px 0" }}>
                    <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 2px", color: "var(--color-accent-700)" }}>
                      Questions fréquentes
                    </p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {FAQ.map((item, i) => (
                        <FaqItem key={item.q} q={item.q} a={item.a} index={i} open={openItem === i} onToggle={() => setOpenItem(openItem === i ? null : i)} />
                      ))}
                    </ul>
                  </div>

                  <div style={{ position: "sticky", bottom: 0, padding: "12px 16px 16px", background: "linear-gradient(to bottom, transparent, var(--color-bg) 30%)" }}>
                    <motion.button
                      type="button"
                      onClick={choose}
                      whileTap={{ scale: 0.97 }}
                      className="btn btn-block"
                      style={{
                        height: 50,
                        border: "none",
                        borderRadius: 999,
                        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-700))",
                        color: "var(--color-bg)",
                        fontSize: 15,
                        fontWeight: 700,
                        boxShadow: "0 10px 22px color-mix(in srgb, var(--color-accent) 35%, transparent)",
                      }}
                    >
                      {ctaLabel}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
