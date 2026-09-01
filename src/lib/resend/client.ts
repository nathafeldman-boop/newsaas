import { Resend } from "resend";

let cached: Resend | null = null;

export function getResendClient() {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant côté serveur.");
  }

  cached = new Resend(apiKey);
  return cached;
}
