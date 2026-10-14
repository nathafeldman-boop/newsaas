"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PublicTestimonial } from "@/lib/reviews/publicStats";

// Vrais avis approuvés uniquement (voir getPublicTestimonials) : les cartes
// arrivent en se posant de biais, flottent doucement, et les étoiles
// s'allument une à une. Tout est coupé si le visiteur a demandé moins
// d'animations à son système.
export function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const reduce = useReducedMotion();

  return (
    <div className="mt-9 grid gap-7" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
      {testimonials.map((t, i) => {
        const dark = i % 3 === 1;
        const tilt = i % 2 === 0 ? -1.5 : 1.5;
        const enterDelay = i * 0.14;
        return (
          <motion.div
            key={`${t.author}-${i}`}
            initial={reduce ? false : { opacity: 0, y: 70, rotate: tilt * 5, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 110, damping: 14, delay: enterDelay }}
            whileHover={reduce ? undefined : { rotate: 0, y: -6, scale: 1.02 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            <motion.figure
              className="m-0"
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 4.6 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: 1 + i * 0.5 }}
              style={{
                position: "relative",
                background: dark ? "var(--color-neutral-900)" : "var(--color-accent-2-100)",
                color: dark ? "var(--color-bg)" : "var(--color-accent-2-900)",
                borderRadius: i % 2 === 0 ? "28px 28px 28px 8px" : "28px 28px 8px 28px",
                padding: "26px 24px 22px",
                boxShadow: "0 16px 34px color-mix(in srgb, var(--color-text) 14%, transparent)",
                overflow: "hidden",
              }}
            >
              <motion.span
                aria-hidden
                initial={reduce ? false : { opacity: 0, scale: 0.4, rotate: -20 }}
                whileInView={{ opacity: dark ? 0.14 : 0.16, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 140, damping: 12, delay: enterDelay + 0.25 }}
                style={{
                  position: "absolute",
                  right: 18,
                  top: -26,
                  fontSize: 130,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: dark ? "var(--color-accent-300)" : "var(--color-accent-2)",
                  pointerEvents: "none",
                }}
              >
                “
              </motion.span>

              <div className="flex gap-1" aria-label={`${t.rating} sur 5`} role="img" style={{ position: "relative" }}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <motion.svg
                    key={s}
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    aria-hidden
                    initial={reduce ? false : { scale: 0, rotate: -45 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 260, damping: 13, delay: enterDelay + 0.35 + s * 0.08 }}
                    style={{ display: "inline-block" }}
                  >
                    <path
                      d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2-4.6-4.4 6.3-.9z"
                      fill={s < t.rating ? (dark ? "var(--color-accent-300)" : "var(--color-accent)") : "none"}
                      stroke={dark ? "var(--color-accent-300)" : "var(--color-accent)"}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ))}
              </div>

              <blockquote
                style={{
                  position: "relative",
                  margin: "14px 0 0",
                  fontSize: 18.5,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  letterSpacing: "-0.015em",
                }}
              >
                « {t.quote} »
              </blockquote>
              <figcaption className="flex items-center gap-2.5 mt-5" style={{ position: "relative" }}>
                <span
                  aria-hidden
                  className="flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: dark ? "var(--color-accent-300)" : "var(--color-accent-2)",
                    color: dark ? "var(--color-neutral-900)" : "var(--color-bg)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {t.author.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.35, color: dark ? "var(--color-neutral-300)" : "var(--color-accent-2-700)" }}>
                  {t.author}
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        );
      })}
    </div>
  );
}
