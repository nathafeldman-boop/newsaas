"use client";

import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { MatchRing, InfoCell } from "@/components/swipe/OfferCard";

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 500;

type DemoDirection = "like" | "pass";

// Offres fictives, uniquement pour la démo publique de la LP : la vraie
// pile vient toujours de la base une fois connecté (cf. /swipe). On évite
// ainsi de montrer de vraies offres à des visiteurs non connectés.
const DEMO_OFFERS = [
  {
    id: "demo-1",
    company: "Lumea",
    contractType: "Alternance",
    title: "Chargé·e de marketing digital",
    location: "Paris",
    matchScore: 91,
    salary: "1 100€/mois",
    duration: "12 mois",
    start: "Sept. 2026",
    publishedLabel: "Publiée il y a 2 jours",
    reasons: ["Secteur Marketing recherché", "À Paris, comme toi"],
  },
  {
    id: "demo-2",
    company: "Vertigo Studio",
    contractType: "Stage",
    title: "Développeur·se front-end",
    location: "Lyon",
    matchScore: 87,
    salary: "1 200€/mois",
    duration: "6 mois",
    start: "Flexible",
    publishedLabel: "Publiée aujourd'hui",
    reasons: ["Secteur Informatique recherché", "Compétence en commun : React"],
  },
  {
    id: "demo-3",
    company: "Nordika",
    contractType: "Alternance",
    title: "Assistant·e chef de projet",
    location: "Nantes",
    matchScore: 78,
    salary: "Non précisé",
    duration: "24 mois",
    start: "Flexible",
    publishedLabel: "Publiée il y a 5 jours",
    reasons: ["C'est une alternance", "Niveau Bac+3 demandé"],
  },
  {
    id: "demo-4",
    company: "Filao Conseil",
    contractType: "Stage",
    title: "Analyste data junior",
    location: "Bordeaux",
    matchScore: 84,
    salary: "1 000€/mois",
    duration: "4 mois",
    start: "Flexible",
    publishedLabel: "Publiée il y a 1 jour",
    reasons: ["Secteur Data recherché", "Télétravail possible"],
  },
] as const;

function demoInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface DemoCardHandle {
  swipeOut: (direction: DemoDirection) => void;
}

const DemoCard = forwardRef<
  DemoCardHandle,
  {
    offer: (typeof DEMO_OFFERS)[number];
    isTop: boolean;
    onExited: () => void;
  }
>(function DemoCard({ offer, isTop, onExited }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-16, 16]);
  const likeOpacity = useTransform(x, [15, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -15], [1, 0]);

  function swipeOut(direction: DemoDirection) {
    void animate(x, direction === "like" ? EXIT_DISTANCE : -EXIT_DISTANCE, {
      duration: 0.28,
      ease: "easeIn",
      onComplete: onExited,
    });
  }

  useImperativeHandle(ref, () => ({ swipeOut }));

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          swipeOut("like");
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          swipeOut("pass");
        } else {
          void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }
      }}
    >
      <div
        className="card elev-lg relative h-full w-full overflow-hidden"
        style={{ padding: 0, background: "var(--color-neutral-100)" }}
      >
        {isTop && (
          <>
            <motion.span
              style={{
                opacity: likeOpacity,
                position: "absolute",
                left: 18,
                top: 74,
                zIndex: 10,
                transform: "rotate(-12deg)",
                border: "3px solid var(--color-accent)",
                color: "var(--color-accent)",
                background: "var(--color-accent-100)",
                borderRadius: 9,
                padding: "1px 10px",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              LIKE
            </motion.span>
            <motion.span
              style={{
                opacity: passOpacity,
                position: "absolute",
                right: 18,
                top: 74,
                zIndex: 10,
                transform: "rotate(12deg)",
                border: "3px solid var(--color-neutral-500)",
                color: "var(--color-neutral-600)",
                background: "var(--color-neutral-100)",
                borderRadius: 9,
                padding: "1px 10px",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              PASS
            </motion.span>
          </>
        )}
        <div className="flex h-full flex-col overflow-hidden">
          <div
            style={{
              position: "relative",
              flexShrink: 0,
              overflow: "hidden",
              padding: "16px 16px 15px 18px",
              background: "linear-gradient(125deg, var(--color-accent), var(--color-accent-2))",
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -36,
                top: -54,
                width: 160,
                height: 160,
                borderRadius: "50%",
                border: "1px solid rgba(242,248,249,.18)",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: 8,
                top: -18,
                width: 108,
                height: 108,
                borderRadius: "50%",
                border: "1px solid rgba(242,248,249,.14)",
              }}
            />
            <div
              aria-hidden
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                flexShrink: 0,
                background: "var(--color-bg)",
                color: "var(--color-accent-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
                fontFamily: "var(--font-heading)",
              }}
            >
              {demoInitials(offer.company)}
            </div>
            <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {offer.company}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(242,248,249,.88)" }}>📍 {offer.location}</p>
            </div>
            <MatchRing score={offer.matchScore} />
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto" style={{ padding: "13px 16px 15px" }}>
            <div className="flex flex-wrap gap-1.5">
              <span className="tag tag-accent" style={{ fontSize: 10.5 }}>
                {offer.contractType}
              </span>
              <span className="tag tag-accent-2" style={{ fontSize: 10.5 }}>
                ✨ {offer.publishedLabel}
              </span>
            </div>
            <h3
              style={{
                margin: "9px 0 0",
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
              }}
            >
              {offer.title}
            </h3>

            <div className="grid grid-cols-3 gap-1.5" style={{ marginTop: 12 }}>
              <InfoCell icon="🗓" label="Début" value={offer.start} />
              <InfoCell icon="⏱" label="Durée" value={offer.duration} />
              <InfoCell icon="💰" label="Salaire" value={offer.salary} />
            </div>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
              }}
            >
              Pourquoi toi
            </p>
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
              {offer.reasons.map((reason) => (
                <li key={reason} style={{ fontSize: 12, display: "flex", gap: 5 }}>
                  <span aria-hidden style={{ color: "var(--color-accent-700)", fontWeight: 700 }}>✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export function SwipeDemo() {
  const [round, setRound] = useState(0);
  const [stack, setStack] = useState(DEMO_OFFERS.map((o) => o.id));
  const topCardRef = useRef<DemoCardHandle>(null);
  const total = DEMO_OFFERS.length;
  const done = stack.length === 0;

  const visible = stack
    .map((id) => DEMO_OFFERS.find((o) => o.id === id)!)
    .slice(0, 2);

  function handleIntent(direction: DemoDirection) {
    if (stack.length === 0) return;
    setRound((n) => n + 1);
    topCardRef.current?.swipeOut(direction);
  }

  function handleExited(offerId: string) {
    setStack((prev) => prev.filter((id) => id !== offerId));
  }

  function replay() {
    setRound(0);
    setStack(DEMO_OFFERS.map((o) => o.id));
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[420px] w-full max-w-[300px]">
        <AnimatePresence>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card elev-lg flex h-full w-full flex-col items-center justify-center text-center"
              style={{ padding: "32px 24px" }}
            >
              <span style={{ fontSize: 36 }}>🎉</span>
              <h3 style={{ fontSize: 19, margin: "14px 0 0" }}>Démo terminée !</h3>
              <p
                style={{
                  fontSize: 13.5,
                  margin: "8px 0 0",
                  color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                }}
              >
                Tu as pris le coup de main. Sur la vraie appli, chaque offre
                est triée selon ton profil.
              </p>
              <Link href="/inscription" className="btn btn-primary mt-5" style={{ whiteSpace: "nowrap" }}>
                Créer mon compte
              </Link>
              <button
                type="button"
                onClick={replay}
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
                  textDecoration: "underline",
                }}
              >
                Rejouer la démo
              </button>
            </motion.div>
          ) : (
            visible
              .slice()
              .reverse()
              .map((offer, i) => {
                const indexFromTop = visible.length - 1 - i;
                const isTop = indexFromTop === 0;
                return (
                  <motion.div
                    key={offer.id}
                    className="absolute inset-0"
                    style={{ zIndex: 10 - indexFromTop }}
                    animate={{ scale: 1 - indexFromTop * 0.04, y: indexFromTop * 10 }}
                  >
                    <DemoCard
                      ref={isTop ? topCardRef : undefined}
                      offer={offer}
                      isTop={isTop}
                      onExited={() => handleExited(offer.id)}
                    />
                  </motion.div>
                );
              })
          )}
        </AnimatePresence>
      </div>

      {!done && (
        <>
          <div className="mt-6 flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleIntent("pass")}
              aria-label="Passer"
              className="btn btn-icon btn-secondary"
              style={{ width: 48, height: 48, borderRadius: "50%", fontSize: 18 }}
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => handleIntent("like")}
              aria-label="Aimer"
              className="btn btn-icon"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                fontSize: 22,
                background: "var(--color-accent)",
                color: "var(--color-bg)",
              }}
            >
              ♥
            </button>
          </div>
          <p
            style={{
              marginTop: 14,
              fontSize: 12,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            Essaie, là, tout de suite · offre {Math.min(round + 1, total)}/{total}
          </p>
        </>
      )}
    </div>
  );
}
