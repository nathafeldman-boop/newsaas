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
    tags: ["Bac+3", "12 mois", "Remote hybride"],
  },
  {
    id: "demo-2",
    company: "Vertigo Studio",
    contractType: "Stage",
    title: "Développeur·se front-end",
    location: "Lyon",
    tags: ["Bac+4", "6 mois", "1 200€/mois"],
  },
  {
    id: "demo-3",
    company: "Nordika",
    contractType: "Alternance",
    title: "Assistant·e chef de projet",
    location: "Nantes",
    tags: ["Bac+2", "24 mois", "Sur site"],
  },
  {
    id: "demo-4",
    company: "Filao Conseil",
    contractType: "Stage",
    title: "Analyste data junior",
    location: "Bordeaux",
    tags: ["Bac+5", "4 mois", "Télétravail"],
  },
] as const;

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
        style={{ padding: 0, background: "var(--color-surface)" }}
      >
        {isTop && (
          <>
            <motion.span
              style={{
                opacity: likeOpacity,
                position: "absolute",
                left: 20,
                top: 20,
                zIndex: 10,
                transform: "rotate(-12deg)",
                border: "4px solid var(--color-accent-2)",
                color: "var(--color-accent-2)",
                borderRadius: 8,
                padding: "3px 10px",
                fontSize: 17,
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
                right: 20,
                top: 20,
                zIndex: 10,
                transform: "rotate(12deg)",
                border: "4px solid var(--color-neutral-500)",
                color: "var(--color-neutral-600)",
                borderRadius: 8,
                padding: "3px 10px",
                fontSize: 17,
                fontFamily: "var(--font-heading)",
                pointerEvents: "none",
              }}
            >
              PASS
            </motion.span>
          </>
        )}
        <div className="flex h-full flex-col">
          <div style={{ padding: "24px 24px 0" }} className="flex flex-col">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--color-accent-100)",
                  color: "var(--color-accent-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-heading)",
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {offer.company.charAt(0)}
              </div>
              <span className="tag tag-accent ml-auto" style={{ whiteSpace: "nowrap" }}>
                {offer.contractType}
              </span>
            </div>
            <h3 style={{ fontSize: 22, lineHeight: 1.2, margin: "16px 0 0" }}>{offer.title}</h3>
            <p
              style={{
                fontSize: 14,
                color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                margin: "4px 0 0",
              }}
            >
              {offer.company} · {offer.location}
            </p>
          </div>
          <div style={{ padding: "18px 24px 24px", marginTop: "auto" }} className="flex flex-wrap gap-2">
            {offer.tags.map((tag) => (
              <span key={tag} className="tag tag-neutral" style={{ whiteSpace: "nowrap" }}>
                {tag}
              </span>
            ))}
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
      <div className="relative h-[340px] w-full max-w-[300px]">
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
