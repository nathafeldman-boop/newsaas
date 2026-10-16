"use client";

import { motion } from "framer-motion";
import { Heart } from "@/components/fx/FavoriteFlight";

// Gerbe d'étincelles qui part du centre de son conteneur (position
// relative) : points lumineux, petits cœurs et étoiles. Se joue une fois au
// montage -- changer la `key` pour la rejouer.

const COLORS = ["#3ee08f", "#ffd84d", "var(--color-accent)", "#7fe3ff", "#ff8fb1"];

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path d="M12 2l2.6 6.9L22 12l-7.4 3.1L12 22l-2.6-6.9L2 12l7.4-3.1L12 2Z" fill={color} />
    </svg>
  );
}

export function SparkleBurst({ count = 18, spread = 140 }: { count?: number; spread?: number }) {
  return (
    <span aria-hidden style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, pointerEvents: "none", zIndex: 5 }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
        const distance = spread * (0.55 + ((i * 37) % 45) / 100);
        const kind = i % 4;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance * 0.75 + 20,
              scale: [0.2, 1.25, 0.7],
              opacity: [1, 1, 0],
              rotate: kind === 2 ? 180 : 0,
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], times: [0, 0.5, 1], delay: (i % 3) * 0.03 }}
            style={{ position: "absolute", left: -7, top: -7 }}
          >
            {kind === 0 ? (
              <Heart size={14} />
            ) : kind === 2 ? (
              <Star size={14} color={color} />
            ) : (
              <span
                style={{
                  display: "block",
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
              />
            )}
          </motion.span>
        );
      })}
    </span>
  );
}
