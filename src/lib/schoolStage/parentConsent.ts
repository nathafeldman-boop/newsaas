import { createHmac, timingSafeEqual } from "node:crypto";
import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";
import { SCHOOL_STAGES } from "@/lib/schoolStage/levels";
import type { SchoolStageLevel } from "@/types/database";

// Accord parental (18/11) : sous 15 ans, Stageio ne montre rien à l'élève
// tant qu'un parent n'a pas cliqué sur le lien reçu par e-mail. Le lien porte
// le compte, l'e-mail du parent et une date de fin, signés avec une clé du
// serveur. Il ne connecte personne et ne montre que le prénom de l'élève et
// ce que Stageio fera.

export const CONSENT_LINK_TTL_MS = 30 * 86_400_000;
/** Délai minimum entre deux envois du lien au parent. */
export const CONSENT_RESEND_MS = 10 * 60_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function secret(): string | null {
  const s = process.env.PAYMENT_LINK_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return s ? s : null;
}

function sign(key: string, userId: string, parentEmail: string, expires: number): string {
  return createHmac("sha256", key)
    .update(`stageio-parent:${userId.toLowerCase()}:${parentEmail.trim().toLowerCase()}:${expires}`)
    .digest("base64url")
    .slice(0, 32);
}

export function consentLink(userId: string, parentEmail: string, now: number = Date.now()): string | null {
  const key = secret();
  if (!key || !UUID_RE.test(userId)) return null;
  const expires = Math.floor((now + CONSENT_LINK_TTL_MS) / 1000);
  return `${SITE_URL}/accord-parental?u=${userId.toLowerCase()}&e=${expires}&s=${sign(key, userId, parentEmail, expires)}`;
}

/** Vrai si le lien a été signé pour ce compte et cet e-mail de parent, et n'a pas expiré. */
export function verifyConsentParams(
  params: { u?: string | null; e?: string | null; s?: string | null },
  parentEmail: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const key = secret();
  const { u, e, s } = params;
  if (!key || !u || !e || !s || !parentEmail || !UUID_RE.test(u) || !/^\d{9,11}$/.test(e)) return false;
  const expires = Number(e);
  if (expires * 1000 < now) return false;
  const expected = Buffer.from(sign(key, u, parentEmail, expires));
  const given = Buffer.from(s);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendParentConsentEmail(input: { userId: string; parentEmail: string; firstName: string | null; level: SchoolStageLevel }): Promise<boolean> {
  const link = consentLink(input.userId, input.parentEmail);
  if (!link) return false;
  const who = input.firstName?.trim() ? escapeHtml(input.firstName.trim()) : "Votre enfant";
  const what = SCHOOL_STAGES[input.level].label.toLowerCase();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const { error } = await getResendClient().emails.send({
    from: `Stageio <${fromEmail}>`,
    to: input.parentEmail.trim(),
    subject: `${input.firstName?.trim() || "Votre enfant"} a besoin de votre accord pour chercher son ${what}`,
    html: `<p>Bonjour,</p>
<p>${who} vient de créer un compte sur Stageio pour trouver son ${escapeHtml(what)}. Comme il ou elle a moins de 15 ans, nous avons besoin de l'accord d'un parent avant de continuer.</p>
<p>Ce que fait Stageio : il affiche les entreprises proches de chez vous dans le secteur choisi et rédige une lettre de demande de stage. Votre enfant l'envoie ou la dépose lui-même : Stageio ne contacte aucune entreprise à sa place. C'est gratuit.</p>
<p>Données gardées : prénom et nom, date de naissance, ville, niveau et secteurs choisis, et votre adresse e-mail.</p>
<p><a href="${link}" style="display:inline-block;background:#12a05c;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Je donne mon accord</a></p>
<p>Si vous n'êtes pas au courant ou si vous refusez, ignorez simplement cet e-mail : le compte reste bloqué. Pour le faire supprimer, répondez à cet e-mail.</p>
<p>L'équipe Stageio</p>`,
  });
  if (error) {
    console.error("accord parental : e-mail non envoyé", error.message);
    return false;
  }
  return true;
}
