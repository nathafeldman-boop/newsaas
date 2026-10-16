// Effets visuels de l'appli (16/10, demande de Nathan : « ultra visuel, des
// animations à chaque clic, pour TikTok ») : événements partagés entre les
// composants qui déclenchent un effet et ceux qui l'affichent.

// Like : l'offre part en favori. Le cœur s'envole de `x, y` (coordonnées
// écran) vers l'onglet Favoris ; à l'arrivée, FAVORITE_LANDED fait
// rebondir la pastille.
export const FAVORITE_ADDED = "stageio:favorite-added";
export const FAVORITE_LANDED = "stageio:favorite-landed";
export type FavoriteAddedDetail = { x: number; y: number };

export function emitFavoriteAdded(origin: FavoriteAddedDetail) {
  window.dispatchEvent(new CustomEvent<FavoriteAddedDetail>(FAVORITE_ADDED, { detail: origin }));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Notification animée (voir ToastHost) : glisse du haut, icône qui pop,
// barre de temps, étincelles quand c'est une bonne nouvelle.
export const TOAST = "stageio:toast";
export type ToastInput = {
  title: string;
  text?: string;
  tone?: "success" | "info" | "error";
  icon?: string;
};

export function showToast(toast: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>(TOAST, { detail: toast }));
}
