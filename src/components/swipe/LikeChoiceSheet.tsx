"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Offer } from "@/types/database";
import type { LikeAction } from "@/lib/swipe/likePreference";

// Demandé une seule fois, au premier like d'un compte Premium : que doit
// faire un like ? (voir lib/swipe/likePreference.ts)
export function LikeChoiceSheet({
  offer,
  onChoose,
}: {
  offer: Offer | null;
  onChoose: (action: LikeAction, remember: boolean) => void;
}) {
  const [remember, setRemember] = useState(true);

  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          key="like-choice"
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 60, background: "rgba(10, 20, 18, 0.45)", padding: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onChoose("favori", false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="like-choice-title"
            className="card elev-lg w-full max-w-sm"
            style={{ padding: "22px 20px" }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="like-choice-title" style={{ fontFamily: "var(--font-heading)", fontSize: 19, margin: 0 }}>
              Tu likes « {offer.title} »
            </p>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}>
              On postule tout de suite ? Tu connectes ton Gmail une fois, et quand l&apos;entreprise a publié un
              email, ta candidature part toute seule depuis ta boîte : lettre écrite pour l&apos;offre et CV, sans
              relecture. Sinon, ta lettre est prête et il te reste à toucher « Postuler sur le site ».
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn btn-primary btn-block" onClick={() => onChoose("candidature", remember)}>
                Postuler directement
              </button>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => onChoose("favori", remember)}>
                Juste mettre en favori
              </button>
            </div>
            <label className="mt-4 flex items-center gap-2" style={{ fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Faire pareil à chaque like (modifiable dans ton profil)
            </label>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
