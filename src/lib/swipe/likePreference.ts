// Ce que fait un like pour un compte Premium (14/10, demande de Nathan) :
// lancer tout de suite la candidature (lettre générée et copiée, candidature
// enregistrée, il ne reste qu'à toucher « Postuler sur le site ») ou juste
// mettre l'offre en favori. Choisi au premier like, modifiable dans Profil.
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
