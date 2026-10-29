import { SITE_URL } from "@/lib/site";

// Bouche-à-oreille (29/10, Nathan : « je veux instaurer le bouche à
// oreille […] qu'on ramène des gens sans rien faire »). Au moment où ça
// marche (entretien décroché, contrat signé), l'abonné recommande Stageio
// à un ami avec son lien de parrainage : message prêt, en un geste. Le lien
// porte utm_source=parrainage pour mesurer ce canal dans Trafic et sources.

export const SIGNED_VIA_STAGEIO = "Alternance trouvée via Stageio";
export const WIN_SHARE_EVENT = "win_shared";

export type WinKind = "entretien" | "signe";

export function referralUrl(code: string): string {
  return `${SITE_URL}/inscription?ref=${encodeURIComponent(code)}&utm_source=parrainage`;
}

/** Message prêt à envoyer à un ami (WhatsApp, Snap, SMS…). */
export function shareMessage(kind: WinKind, url: string, contract: "alternance" | "stage" = "alternance"): string {
  const what = contract === "stage" ? "mon stage" : "mon alternance";
  return kind === "signe"
    ? `J'ai trouvé ${what} grâce à Stageio 🎉 Si tu cherches encore, essaie, ça m'a vraiment aidé : ${url}`
    : `Je viens de décrocher un entretien pour ${what} grâce à Stageio 🙌 Si tu cherches aussi, essaie : ${url}`;
}

export function contractOf(lookingFor: string[] | null | undefined): "alternance" | "stage" {
  const list = lookingFor ?? [];
  return list.length > 0 && !list.includes("alternance") ? "stage" : "alternance";
}

/** Prénom affiché sur l'invitation (jamais le nom de famille). */
export function inviterFirstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0] ?? "";
  return first.length >= 2 && first.length <= 30 ? first.charAt(0).toUpperCase() + first.slice(1) : null;
}
