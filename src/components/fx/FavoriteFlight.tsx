"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FAVORITE_ADDED, FAVORITE_LANDED, prefersReducedMotion, type FavoriteAddedDetail } from "@/lib/fx/events";

// Like : un cœur jaillit de la carte dans une gerbe d'étincelles, file en
// arc jusqu'à l'onglet Favoris (barre du bas sur mobile, menu du haut sur
// ordinateur) avec deux échos derrière lui, puis la pastille rebondit
// (FAVORITE_LANDED, voir FavoritesTab).

type Point = { x: number; y: number };
type Flight = { id: number; from: Point; to: Point };

const HEART_PATH = "M12 21s-7.5-4.6-7.5-10.4A4.4 4.4 0 0 1 12 7.7a4.4 4.4 0 0 1 7.5 2.9C19.5 16.4 12 21 12 21Z";
const FLIGHT_SECONDS = 0.85;
const SPARKS = 12;

// Onglet Favoris visible à l'écran (l'autre menu est masqué selon la taille).
function visibleTarget(): Point | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-fav-target]")) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return null;
}

export function Heart({ size, glow }: { size: number; glow?: boolean }) {
  const gradientId = `fav${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ee08f" />
          <stop offset="55%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent-2)" />
        </linearGradient>
      </defs>
      <path
        d={HEART_PATH}
        fill={`url(#${gradientId})`}
        stroke="#fff"
        strokeWidth={1.4}
        style={glow ? { filter: "drop-shadow(0 0 10px color-mix(in srgb, var(--color-accent) 70%, transparent))" } : undefined}
      />
    </svg>
  );
}

function FlightView({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const { from, to } = flight;
  const peak = { x: (from.x + to.x) / 2 + (to.x < from.x ? -40 : 40), y: Math.min(from.y, to.y) - 150 };
  const path = { x: [from.x, peak.x, to.x], y: [from.y, peak.y, to.y] };

  return (
    <>
      {/* Gerbe d'étincelles au départ */}
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + 0.3;
        const distance = 80 + (i % 3) * 28;
        const isHeart = i % 3 === 0;
        return (
          <motion.span
            key={`spark-${i}`}
            initial={{ x: from.x, y: from.y, scale: 0.3, opacity: 1 }}
            animate={{
              x: from.x + Math.cos(angle) * distance,
              y: from.y + Math.sin(angle) * distance + 18,
              scale: isHeart ? [0.3, 1.3, 0.8] : [0.3, 1.2, 0.6],
              rotate: isHeart ? [0, (i % 2 ? 1 : -1) * 35] : 0,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], times: [0, 0.55, 1] }}
            style={{ position: "fixed", left: isHeart ? -9 : -5, top: isHeart ? -9 : -5 }}
          >
            {isHeart ? (
              <Heart size={18} />
            ) : (
              <span
                style={{
                  display: "block",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: i % 2 ? "#3ee08f" : "#ffd84d",
                  boxShadow: i % 2 ? "0 0 10px #3ee08f" : "0 0 10px #ffd84d",
                }}
              />
            )}
          </motion.span>
        );
      })}

      {/* Échos qui suivent le cœur principal */}
      {[0.09, 0.05].map((delay, i) => (
        <motion.span
          key={`echo-${i}`}
          initial={{ x: from.x, y: from.y, scale: 0.3, opacity: 0 }}
          animate={{ ...path, scale: [0.4, 1.1 - i * 0.2, 0.3], opacity: [0, 0.45 - i * 0.15, 0] }}
          transition={{ duration: FLIGHT_SECONDS, delay, ease: "easeInOut", times: [0, 0.45, 1] }}
          style={{ position: "fixed", left: -18, top: -18 }}
        >
          <Heart size={36} />
        </motion.span>
      ))}

      {/* Cœur principal */}
      <motion.span
        initial={{ x: from.x, y: from.y, scale: 0.2, rotate: 0, opacity: 0 }}
        animate={{ ...path, scale: [0.3, 2, 0.5], rotate: [0, -14, 12], opacity: [1, 1, 1] }}
        transition={{ duration: FLIGHT_SECONDS, ease: "easeInOut", times: [0, 0.45, 1] }}
        onAnimationComplete={onDone}
        style={{ position: "fixed", left: -22, top: -22 }}
      >
        <Heart size={44} glow />
      </motion.span>
    </>
  );
}

export function FavoriteFlight() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    let nextId = 0;
    function onAdded(event: Event) {
      const from = (event as CustomEvent<FavoriteAddedDetail>).detail;
      const to = visibleTarget();
      if (!to || prefersReducedMotion()) {
        window.dispatchEvent(new Event(FAVORITE_LANDED));
        return;
      }
      nextId += 1;
      const id = nextId;
      setFlights((prev) => [...prev, { id, from, to }]);
    }
    window.addEventListener(FAVORITE_ADDED, onAdded);
    return () => window.removeEventListener(FAVORITE_ADDED, onAdded);
  }, []);

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 130 }}>
      <AnimatePresence>
        {flights.map((flight) => (
          <FlightView
            key={flight.id}
            flight={flight}
            onDone={() => {
              window.dispatchEvent(new Event(FAVORITE_LANDED));
              setFlights((prev) => prev.filter((f) => f.id !== flight.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
