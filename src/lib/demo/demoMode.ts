"use client";

import { createContext, useContext } from "react";
import type { Offer } from "@/types/database";

// Mode démo (16/11) : parcours utilisateur rejouable depuis l'admin pour
// filmer des TikTok (onboarding → swipe → candidature) sans créer de compte.
// Tant qu'il est actif, le client Supabase du navigateur n'écrit RIEN :
// insert/update/upsert/delete/rpc/upload répondent « ok » sans appeler la
// base (voir lib/supabase/client.ts). Les lectures restent réelles (vraies
// offres, vrais chiffres).
let demoActive = false;

export function setDemoMode(on: boolean) {
  demoActive = on;
}

export function isDemoMode() {
  return demoActive;
}

export type DemoHooks = {
  /** Fin de l'onboarding : passer au swipe au lieu d'aller sur /swipe. */
  onFinishOnboarding: () => void;
  /** Like ou « Postuler » : écran de candidature de démo, rien n'est envoyé. */
  onApply: (offer: Offer) => void;
};

export const DemoContext = createContext<DemoHooks | null>(null);

export function useDemo() {
  return useContext(DemoContext);
}
