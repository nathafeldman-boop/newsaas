"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AUTO_DAILY_LIMIT, AUTO_PRICES } from "@/lib/pricing/plans";
import type { Offer } from "@/types/database";

// Au like d'un compte Premium sans la formule Auto (24/10, demande de
// Nathan) : « avec Auto, ce like aurait envoyé ta candidature ». Une fois
// par jour au plus ; le like est enregistré en favori dans tous les cas.
export function AutoUpsellSheet({ offer, onClose, onDiscover }: { offer: Offer | null; onClose: () => void; onDiscover: () => void }) {
  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          key="auto-upsell"
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 60, background: "rgba(10, 20, 18, 0.45)", padding: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auto-upsell-title"
            className="card elev-lg w-full max-w-sm"
            style={{ padding: "22px 20px" }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="auto-upsell-title" style={{ fontFamily: "var(--font-heading)", fontSize: 19, margin: 0 }}>
              « {offer.title} » est dans tes favoris
            </p>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}>
              Avec Stageio Auto, ce like aurait envoyé ta candidature tout seul : ta lettre et ton CV, jusqu&apos;à{" "}
              {AUTO_DAILY_LIMIT} candidatures par jour, et une boîte mail pour suivre les réponses. {AUTO_PRICES.monthly.regular}/mois ou{" "}
              {AUTO_PRICES.lifetime.regular} à vie.
            </p>
            <p style={{ fontSize: 12, margin: "8px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              Envoi automatique quand le recruteur a laissé une adresse ou passe par La bonne alternance ; sinon, le like
              reste un favori.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href="/premium?offre=auto#auto" className="btn btn-primary btn-block" onClick={onDiscover}>
                Découvrir Stageio Auto
              </Link>
              <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
                Continuer à swiper
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
