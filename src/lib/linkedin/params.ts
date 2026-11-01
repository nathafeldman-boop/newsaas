import type { PostKind } from "@/lib/linkedin/format";

// Lecture des paramètres d'URL de /admin/linkedin : un paramètre inconnu
// retombe sur la valeur par défaut, jamais d'erreur.
export function kindFrom(value: unknown): PostKind {
  return value === "sector" || value === "city" || value === "weekly" ? value : "daily";
}

/** `ids=a&ids=b` ou `ids=a,b` -> liste d'identifiants d'offres (au plus 12). */
export function idsFrom(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return raw
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim())
    .filter((v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
    .slice(0, 12);
}
