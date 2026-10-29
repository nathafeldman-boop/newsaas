import type { LinkVerdict } from "@/lib/offers/linkCheck";

// Offre signalée « plus disponible » par un étudiant (29/10). Retirée de
// Stageio pour tout le monde quand la source le confirme, ou quand d'autres
// étudiants l'ont déjà signalée (un doute seul ne retire rien).
export const OFFER_REPORT_EVENT = "offer_reported_unavailable";
export const REPORT_WINDOW_MS = 14 * 86_400_000;

export function shouldRemoveOffer(verdict: LinkVerdict, otherReporters: number): boolean {
  if (verdict === "dead") return true;
  if (verdict === "alive") return otherReporters >= 2;
  return otherReporters >= 1;
}
