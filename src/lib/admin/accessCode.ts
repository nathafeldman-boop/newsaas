import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Dashboard admin protégé par un simple code d'accès partagé (pas de compte
// Supabase à créer/connecter pour l'utiliser) : un cookie httpOnly porte un
// jeton dérivé du code par HMAC, jamais le code en clair, recalculé et
// comparé côté serveur à chaque requête — pas de table de sessions à gérer.
export const ADMIN_COOKIE_NAME = "stageio_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function getSecret(): string {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code) {
    throw new Error("ADMIN_ACCESS_CODE manquant côté serveur.");
  }
  return code;
}

function sessionToken(): string {
  return createHmac("sha256", getSecret()).update("stageio-admin-session").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminAccessCode(submitted: string): boolean {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code || !submitted) return false;
  return timingSafeStringEqual(submitted, code);
}

export async function setAdminSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!value) return false;
  try {
    return timingSafeStringEqual(value, sessionToken());
  } catch {
    return false;
  }
}

// Pour les Server Actions admin : lève une erreur si pas de session admin valide.
export async function assertAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    throw new Error("Accès refusé.");
  }
}
