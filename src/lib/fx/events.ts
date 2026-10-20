// Préférence système « réduire les animations » : l'animation d'écriture de
// la lettre de motivation (CoverLetterPanel) s'affiche alors d'un coup.
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
