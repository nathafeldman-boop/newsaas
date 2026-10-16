"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { SparkleBurst } from "@/components/fx/SparkleBurst";
import { WELCOME_COOKIE } from "@/lib/fx/welcome";
import { prefersReducedMotion } from "@/lib/fx/events";

// Écran de bienvenue juste après la connexion (16/10, demande de Nathan :
// une animation « à chaque connexion ») : le logo jaillit dans une onde et
// une gerbe d'étincelles, « Salut Inès 👋 » s'écrit, puis tout s'efface
// tout seul (ou au toucher). Déclenché par le cookie posé au moment de la
// connexion (LoginForm, auth/callback), lu une seule fois.

function readAndClearCookie(): boolean {
  const present = document.cookie.split("; ").some((c) => c === `${WELCOME_COOKIE}=1`);
  if (present) document.cookie = `${WELCOME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  return present;
}

const SHOW_MS = 2100;

export function WelcomeSplash({ firstName }: { firstName: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readAndClearCookie() || prefersReducedMotion()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    const timer = setTimeout(() => setOpen(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, []);

  const greeting = firstName ? `Salut ${firstName} 👋` : "Content de te revoir 👋";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome"
          role="status"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--color-accent) 30%, var(--color-bg)) 0%, var(--color-bg) 62%)",
            cursor: "pointer",
          }}
        >
          <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Ondes */}
            {[0, 0.18, 0.36].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                initial={{ scale: 0.4, opacity: 0.7 }}
                animate={{ scale: 3.2, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.15 + delay, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: 90,
                  height: 90,
                  borderRadius: 30,
                  border: "2px solid var(--color-accent)",
                }}
              />
            ))}
            <SparkleBurst count={22} spread={170} />
            <motion.span
              aria-hidden
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.25, 0.95, 1], rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 30,
                overflow: "hidden",
                display: "flex",
                background: "#fff",
                boxShadow: "0 18px 40px color-mix(in srgb, var(--color-accent) 40%, transparent)",
              }}
            >
              <Image src="/logo.png" alt="" width={96} height={96} priority />
            </motion.span>
          </div>

          <motion.p
            initial={{ y: 18, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.35 }}
            style={{ margin: "34px 0 0", fontFamily: "var(--font-heading)", fontSize: 28, letterSpacing: "-0.02em" }}
          >
            {greeting}
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{ margin: "8px 0 0", fontSize: 14.5, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}
          >
            Tes offres du jour t&apos;attendent.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
