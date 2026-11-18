import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import type { Creator } from "@/types/database";

// Accès à l'espace créateurs (18/11). Pas de compte Stageio : un lien
// d'invitation (le même pour tous, signé par le serveur) ouvre l'inscription
// (nom, téléphone) ; le créateur reçoit alors un jeton d'accès gardé dans un
// cookie, et un lien perso pour revenir depuis un autre téléphone. En base,
// seule l'empreinte du jeton est gardée.

export const CREATOR_COOKIE = "stageio_creator";
export const CREATOR_COOKIE_MAX_AGE = 365 * 86_400;

function secret(): string | null {
  const s = process.env.PAYMENT_LINK_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return s ? s : null;
}

export function inviteCode(): string | null {
  const key = secret();
  return key ? createHmac("sha256", key).update("stageio-creator-invite-v1").digest("base64url").slice(0, 24) : null;
}

export function inviteLink(): string | null {
  const code = inviteCode();
  return code ? `${SITE_URL}/createurs/inscription?i=${code}` : null;
}

export function isValidInvite(code: string | null | undefined): boolean {
  const expected = inviteCode();
  if (!expected || !code) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newAccessToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function personalLink(token: string): string {
  return `${SITE_URL}/createurs/acces?t=${encodeURIComponent(token)}`;
}

export async function creatorFromToken(token: string | null | undefined): Promise<Creator | null> {
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data, error } = await createAdminClient().from("creators").select("*").eq("access_token_hash", hashToken(token)).maybeSingle();
  if (error) console.error("créateurs : lecture du compte impossible", error.message);
  return data ?? null;
}

/** Créateur de la session (cookie), ou null. */
export async function currentCreator(): Promise<{ creator: Creator; token: string } | null> {
  const token = (await cookies()).get(CREATOR_COOKIE)?.value ?? null;
  const creator = await creatorFromToken(token);
  return creator && token ? { creator, token } : null;
}

export async function setCreatorCookie(token: string) {
  (await cookies()).set(CREATOR_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/createurs", maxAge: CREATOR_COOKIE_MAX_AGE });
}
