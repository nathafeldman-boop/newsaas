// Ville de la page d'où vient l'inscription (voir intent.ts), gardée dans le
// navigateur jusqu'à l'onboarding : l'inscription par e-mail ou Google passe
// par d'autres pages entre les deux. Navigateur différent (lien de
// confirmation ouvert ailleurs) : pas de pré-remplissage, rien de cassé.
const KEY = "stageio_signup_city";

export function rememberSignupCity(city: string) {
  try {
    localStorage.setItem(KEY, city);
  } catch {
    // Stockage indisponible (navigation privée stricte) : sans effet.
  }
}

export function readSignupCity(): string | null {
  try {
    const city = localStorage.getItem(KEY);
    return city && city.length <= 40 ? city : null;
  } catch {
    return null;
  }
}

export function forgetSignupCity() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // idem
  }
}
