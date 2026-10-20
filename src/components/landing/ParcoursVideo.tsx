"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Vidéo du parcours (14/10, demande de Nathan) : vrai tournage de l'appli --
// SwipeDeck, LikeChoiceSheet et CoverLetterPanel rendus avec une vraie offre
// Stageio (Groupe Restalliance, Lyon), image par image. Les étapes à côté
// s'allument en même temps que la vidéo ; un clic sur une étape y saute.
const VIDEO_DURATION = 12.23;
const STEPS = [
  {
    at: 0,
    n: "01",
    label: "Swipe",
    title: "Swipe les offres faites pour toi",
    text: "Ton métier, ta ville, ton niveau : chaque offre affiche son % de compatibilité et pourquoi elle te correspond.",
    premium: false,
  },
  {
    at: 2.3,
    n: "02",
    label: "Like",
    title: "Un like lance ta candidature",
    text: "Tu choisis : postuler tout de suite, ou garder l'offre en favori pour plus tard.",
    premium: true,
  },
  {
    at: 5.47,
    n: "03",
    label: "Lettre",
    title: "Ta lettre est déjà écrite",
    text: "Une lettre pour cette offre, à partir de ton profil. « Postuler sur le site » la copie et ouvre l'offre.",
    premium: true,
  },
] as const;

function stepAt(time: number): number {
  let index = 0;
  STEPS.forEach((step, i) => {
    if (time >= step.at) index = i;
  });
  return index;
}

function stepProgress(time: number, i: number): number {
  const start = STEPS[i].at;
  const end = i + 1 < STEPS.length ? STEPS[i + 1].at : VIDEO_DURATION;
  return Math.max(0, Math.min(1, (time - start) / (end - start)));
}

const muted = "color-mix(in srgb, var(--color-text) 68%, transparent)";

function PremiumTag() {
  return (
    <span className="tag tag-accent" style={{ marginLeft: 6, fontSize: 11, verticalAlign: "1px" }}>
      Premium
    </span>
  );
}

export function ParcoursVideo() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [time, setTime] = useState(0);

  // Ne télécharge la vidéo qu'à l'approche de la section, et ne la joue que
  // lorsqu'elle est à l'écran.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // WebM (VP9) quand le navigateur sait le lire, sinon MP4 (H.264,
          // pour Safari) : même vidéo, même poids.
          const canWebm = !!videoRef.current?.canPlayType('video/webm; codecs="vp9"');
          setSrc(canWebm ? "/app/parcours.webm" : "/app/parcours.mp4");
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    near.observe(el);
    return () => near.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video || !load || reduce) return;
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    visible.observe(el);
    return () => visible.disconnect();
  }, [load, reduce]);

  // Progression fluide des barres d'étape, seulement pendant la lecture.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !load) return;
    let raf = 0;
    const tick = () => {
      setTime(video.currentTime);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    if (!video.paused) start();
    return () => {
      stop();
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
    };
  }, [load]);

  const active = stepAt(time);

  function jumpTo(i: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = STEPS[i].at + 0.01;
    setTime(video.currentTime);
    void video.play().catch(() => {});
  }

  return (
    <div ref={wrapRef} className="mt-9 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-14">
      {/* Mobile : barres façon story + étape en cours au-dessus du téléphone. */}
      <div className="md:hidden">
        <div className="flex gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step.n}
              type="button"
              onClick={() => jumpTo(i)}
              className="flex-1 text-left"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label={`Étape ${step.n} : ${step.title}`}
            >
              <span
                className="block overflow-hidden"
                style={{ height: 4, borderRadius: 99, background: "color-mix(in srgb, var(--color-text) 12%, transparent)" }}
              >
                <span
                  className="block h-full"
                  style={{
                    width: `${(i < active ? 1 : i === active ? stepProgress(time, i) : 0) * 100}%`,
                    background: "var(--color-accent)",
                    borderRadius: 99,
                  }}
                />
              </span>
              <span
                className="mt-2 block"
                style={{ fontSize: 12.5, fontWeight: 800, color: i === active ? "var(--color-accent-700)" : muted }}
              >
                {step.n} · {step.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ minHeight: 104, marginTop: 14 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{STEPS[active].title}</p>
              <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.55, color: muted }}>
                {STEPS[active].text}
                {STEPS[active].premium && <PremiumTag />}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Ordinateur : les trois étapes, celle en cours mise en avant. */}
      <ol className="m-0 hidden list-none flex-col gap-3 p-0 md:flex" style={{ maxWidth: 480 }}>
        {STEPS.map((step, i) => {
          const on = i === active;
          return (
            <li key={step.n}>
              <button
                type="button"
                onClick={() => jumpTo(i)}
                className="w-full text-left"
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 22,
                  padding: "18px 22px",
                  background: on ? "var(--color-surface)" : "transparent",
                  boxShadow: on ? "0 12px 30px color-mix(in srgb, var(--color-text) 10%, transparent)" : "none",
                  transition: "background .3s, box-shadow .3s",
                  color: "inherit",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span style={{ fontSize: 13, fontWeight: 800, color: on ? "var(--color-accent)" : muted }}>{step.n}</span>
                  <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", opacity: on ? 1 : 0.55 }}>{step.title}</span>
                </span>
                <span
                  className="block"
                  style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.6, color: muted, opacity: on ? 1 : 0.7 }}
                >
                  {step.text}
                  {step.premium && <PremiumTag />}
                </span>
                <span
                  className="mt-3 block overflow-hidden"
                  style={{ height: 3, borderRadius: 99, background: on ? "color-mix(in srgb, var(--color-text) 10%, transparent)" : "transparent" }}
                >
                  <span
                    className="block h-full"
                    style={{ width: `${on ? stepProgress(time, i) * 100 : 0}%`, background: "var(--color-accent)", borderRadius: 99 }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-center">
        <div
          style={{
            width: "min(78vw, 300px)",
            padding: 9,
            borderRadius: 46,
            background: "var(--color-neutral-900)",
            boxShadow: "0 30px 60px color-mix(in srgb, var(--color-text) 22%, transparent)",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            poster="/app/parcours-poster.jpg"
            muted
            loop
            playsInline
            preload="none"
            controls={!!reduce}
            aria-label="Démo de Stageio : on swipe une offre d'alternance de chargé commercial à Lyon, on la like, on choisit de postuler, et la lettre de motivation s'écrit pour cette offre."
            style={{
              display: "block",
              width: "100%",
              aspectRatio: "780 / 1688",
              borderRadius: 37,
              background: "var(--color-bg)",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </div>
  );
}
