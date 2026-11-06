import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

// Lien de paiement des emails sans connexion (Nathan, 6/11 : « fais les 3 »).
// Le 5/11, les 4 clics sur l'email de l'offre à 30 € sont tous tombés sur la
// page de connexion (personne n'était connecté sur son téléphone) et aucun
// n'est allé plus loin. Le lien porte donc le compte, une date de fin et une
// signature : /premium/go ouvre directement le paiement Stripe de ce compte,
// au prix qui est le sien, sans demander de se connecter.
//
// Ce que le lien permet, et rien d'autre : ouvrir une page de paiement Stripe
// pour ce compte. Il ne connecte personne et ne montre aucune donnée du
// compte. Signé avec une clé du serveur (PAYMENT_LINK_SECRET, sinon la clé
// service de Supabase) ; sans clé, le lien reste celui d'avant (connexion).

export type GoPlan = "monthly" | "lifetime" | "auto_monthly" | "auto_lifetime";

/** Durée de validité d'un lien de paiement d'email. */
export const GO_LINK_TTL_MS = 14 * 86_400_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string | null {
  const s = process.env.PAYMENT_LINK_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return s ? s : null;
}

function sign(key: string, userId: string, expires: number): string {
  return createHmac("sha256", key).update(`stageio-go:${userId.toLowerCase()}:${expires}`).digest("base64url").slice(0, 32);
}

/** Paramètres signés à ajouter au lien (vide sans clé serveur). */
export function goSignature(userId: string, now: number = Date.now(), ttlMs: number = GO_LINK_TTL_MS): string {
  const key = secret();
  if (!key || !UUID_RE.test(userId)) return "";
  const expires = Math.floor((now + ttlMs) / 1000);
  return `u=${userId.toLowerCase()}&e=${expires}&s=${sign(key, userId, expires)}`;
}

/** Lien de paiement d'un email : formule, suivi (utm…) puis signature. */
export function goLink(userId: string, plan: GoPlan, query: string, now: number = Date.now()): string {
  const signature = goSignature(userId, now);
  return `${SITE_URL}/premium/go?plan=${plan}&${query}${signature ? `&${signature}` : ""}`;
}

/** Compte du lien si la signature est bonne et pas expirée, sinon null. */
export function verifyGoParams(params: { u?: string | null; e?: string | null; s?: string | null }, now: number = Date.now()): string | null {
  const key = secret();
  const { u, e, s } = params;
  if (!key || !u || !e || !s || !UUID_RE.test(u) || !/^\d{9,11}$/.test(e)) return null;
  const expires = Number(e);
  if (expires * 1000 < now) return null;
  const expected = Buffer.from(sign(key, u, expires));
  const given = Buffer.from(s);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return u.toLowerCase();
}
