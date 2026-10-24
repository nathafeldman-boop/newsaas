// Coordonnées du candidat au format attendu par La bonne alternance (voir
// client.ts). Fichier à part, sans rien de serveur : aussi utilisé par la
// fenêtre qui les demande au moment du like.

// Numéro au format international (+33…), seul format sûr pour l'API qui
// n'accepte que des numéros européens, mobiles ou fixes. null si inutilisable.
export function normalizePhone(raw: string | null | undefined): string | null {
  const compact = (raw ?? "").replace(/[\s.\-()]/g, "");
  if (/^0[1-9]\d{8}$/.test(compact)) return `+33${compact.slice(1)}`;
  if (/^0033[1-9]\d{8}$/.test(compact)) return `+${compact.slice(2)}`;
  if (/^\+33[1-9]\d{8}$/.test(compact)) return compact;
  // Autres pays européens : +XX suivi de 6 à 12 chiffres.
  if (/^\+[1-9]\d{7,13}$/.test(compact)) return compact;
  return null;
}

// « Inès Martin-Dupont » → prénom « Inès », nom « Martin-Dupont » ; null si
// le nom complet ne contient pas les deux (l'API exige les deux).
export function splitFullName(fullName: string | null | undefined): { first: string; last: string } | null {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { first: parts[0].slice(0, 50), last: parts.slice(1).join(" ").slice(0, 50) };
}
