// Ce que fait un like pour un compte Stageio Auto (24/10, reprise du réglage
// du 14/10) : envoyer la candidature tout de suite, ou juste mettre l'offre
// en favori. Choisi au premier like, modifiable dans Profil.
// Gardé dans le navigateur : un réglage d'interface, pas une donnée de
// compte (pas de migration pour ça).
export type LikeAction = "candidature" | "favori";

const KEY = "stageio_like_action";

export function readLikeAction(): LikeAction | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "candidature" || value === "favori" ? value : null;
  } catch {
    return null;
  }
}

export function saveLikeAction(action: LikeAction) {
  try {
    localStorage.setItem(KEY, action);
  } catch {
    // Stockage indisponible (navigation privée stricte) : on redemandera.
  }
}

// Proposition de l'offre Auto au like d'un compte Premium classique : une
// fois par jour au plus.
const UPSELL_KEY = "stageio_auto_upsell_day";

export function shouldShowAutoUpsell(today: string): boolean {
  try {
    return localStorage.getItem(UPSELL_KEY) !== today;
  } catch {
    return false;
  }
}

export function markAutoUpsellShown(today: string) {
  try {
    localStorage.setItem(UPSELL_KEY, today);
  } catch {
    // Stockage indisponible : la proposition ne revient pas plus souvent pour autant.
  }
}
