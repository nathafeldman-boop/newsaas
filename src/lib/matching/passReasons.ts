import type { ContractType } from "@/types/database";

// « Pas pour moi parce que… » (25/10) : après avoir passé une offre,
// l'étudiant peut dire pourquoi d'un geste. Les cartes du même genre
// quittent tout de suite le paquet, et les paquets suivants en tiennent
// compte (pénalités ci-dessous). Avant, un « passer » ne disait rien : on ne
// savait pas si l'offre était trop loin, du mauvais métier ou du mauvais
// niveau.

export const PASS_REASONS = {
  loin: { label: "Trop loin", icon: "📍" },
  metier: { label: "Pas mon métier", icon: "🧭" },
  niveau: { label: "Pas mon niveau", icon: "🎓" },
  contrat: { label: "Mauvais contrat", icon: "📄" },
} as const;
export type PassReason = keyof typeof PASS_REASONS;

/** Début de la fenêtre des raisons prises en compte (30 jours). */
export function passReasonsSinceIso(now: number = Date.now()): string {
  return new Date(now - 30 * 86_400_000).toISOString();
}

export function isPassReason(value: unknown): value is PassReason {
  return typeof value === "string" && value in PASS_REASONS;
}

/** Ce qu'on retient d'une offre passée avec une raison (métadonnées de l'événement pass_reason). */
export type PassReasonEvent = {
  reason: PassReason;
  metier?: string | null;
  contract?: ContractType | null;
  formations?: string[];
  /** L'offre passée « trop loin » était pourtant dans son département. */
  near?: boolean;
  /** L'offre passée « pas mon métier » était du métier qu'il vise. */
  targetJob?: boolean;
};

/**
 * Ce que le serveur sait d'une offre pour appliquer les raisons (calculé à
 * l'affichage du paquet) : `local` = sa ville ou son agglomération, `near` =
 * jusqu'à son département (ou télétravail), `targetJob` = métier visé.
 */
export type OfferTags = { near: boolean; local: boolean; targetJob: boolean; metier: string | null; formations: string[]; contract: ContractType };

export type PassLearning = { penalty: (tags: OfferTags, jobMatch: boolean) => number; count: number };

/**
 * Pénalités tirées des raisons données récemment :
 * - « Trop loin » : les offres hors de son département reculent (-12, -25
 *   dès la 2e fois) ; dit sur une offre de son département, celles hors de
 *   sa ville reculent aussi (-12) ;
 * - « Pas mon métier » : le métier de l'offre passée recule (-20), sauf si
 *   c'est le métier qu'il vise ;
 * - « Pas mon niveau » : les offres du même diplôme reculent (-15) ;
 * - « Mauvais contrat » : ce type de contrat recule (-25).
 */
export function learnFromPassReasons(events: PassReasonEvent[]): PassLearning {
  const far = events.filter((e) => e.reason === "loin").length;
  // « Trop loin » sur une offre de son département : il veut sa ville.
  const cityOnly = events.some((e) => e.reason === "loin" && e.near);
  const metiers = new Set(events.filter((e) => e.reason === "metier" && e.metier && !e.targetJob).map((e) => e.metier!));
  const formations = new Set(events.filter((e) => e.reason === "niveau").flatMap((e) => e.formations ?? []));
  const contracts = new Set(events.filter((e) => e.reason === "contrat" && e.contract).map((e) => e.contract!));
  return {
    count: events.length,
    penalty(tags, jobMatch) {
      let p = 0;
      if (far > 0 && !tags.near) p -= far >= 2 ? 25 : 12;
      if (cityOnly && tags.near && !tags.local) p -= 12;
      if (tags.metier && metiers.has(tags.metier) && !jobMatch) p -= 20;
      if (tags.formations.some((f) => formations.has(f))) p -= 15;
      if (contracts.has(tags.contract)) p -= 25;
      return p;
    },
  };
}

/**
 * Cartes restantes à retirer tout de suite après une raison (dans la session
 * en cours) : même genre que l'offre passée. Jamais tout le paquet : s'il ne
 * restait rien, on ne retire rien.
 */
export function cardsToDrop<T extends { id: string }>(remaining: T[], passed: OfferTags, reason: PassReason, tagsOf: (o: T) => OfferTags | undefined): Set<string> {
  const drop = new Set<string>();
  for (const o of remaining) {
    const t = tagsOf(o);
    if (!t) continue;
    // Trop loin alors qu'elle était dans son département : seulement sa ville.
    if (reason === "loin" && (passed.near ? !t.local : !t.near)) drop.add(o.id);
    // Son propre métier visé : on note, sans vider le paquet de ce métier.
    if (reason === "metier" && passed.metier && !passed.targetJob && t.metier === passed.metier) drop.add(o.id);
    if (reason === "niveau" && passed.formations.length > 0 && t.formations.some((f) => passed.formations.includes(f))) drop.add(o.id);
    if (reason === "contrat" && t.contract === passed.contract) drop.add(o.id);
  }
  return drop.size >= remaining.length ? new Set() : drop;
}
