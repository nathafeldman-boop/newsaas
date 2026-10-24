import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import PostalMime from "postal-mime";
import { createAdminClient } from "@/lib/supabase/admin";
import { inboxDomain } from "@/lib/inbox/address";
import { htmlToText, parseAddress } from "@/lib/inbox/parse";
import { storeInboundEmail } from "@/lib/inbox/receive";

// Réception gratuite de la boîte Stageio (15/10, demande de Nathan : rien de
// payant) : Cloudflare Email Routing reçoit les emails de INBOX_DOMAIN et
// son Email Worker (cloudflare/inbox-worker.js) les relaie ici, bruts et
// signés -- HMAC-SHA256 de « horodatage.corps » avec INBOX_WORKER_SECRET.
// 404 = adresse inconnue : le worker refuse alors le message, l'expéditeur
// reçoit un avis de non-remise.
export const maxDuration = 60;

const MAX_CLOCK_SKEW_MS = 10 * 60_000;

function validSignature(secret: string, timestamp: string, payload: string, signature: string): boolean {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > MAX_CLOCK_SKEW_MS) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const secret = process.env.INBOX_WORKER_SECRET;
  const domain = inboxDomain();
  if (!secret || !domain) {
    console.error("inbox/cloudflare: INBOX_WORKER_SECRET ou INBOX_DOMAIN manquant");
    return NextResponse.json({ error: "Boîte non configurée." }, { status: 503 });
  }

  const payload = await request.text();
  const timestamp = request.headers.get("x-stageio-timestamp") ?? "";
  const signature = request.headers.get("x-stageio-signature") ?? "";
  if (!validSignature(secret, timestamp, payload, signature)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  const body = JSON.parse(payload) as { to?: string; raw?: string; truncated?: boolean };
  const recipient = parseAddress(body.to ?? "").address;
  if (!recipient.endsWith(`@${domain}`)) return NextResponse.json({ error: "Adresse inconnue." }, { status: 404 });

  const email = await PostalMime.parse(Buffer.from(body.raw ?? "", "base64"));
  const headerFrom = email.from && "address" in email.from && email.from.address ? email.from : null;
  // Réponse de l'étudiant (depuis l'appli) : à l'adresse « Reply-To » quand
  // l'expéditeur en donne une (plateformes de recrutement, envois groupés).
  const replyTo = email.replyTo?.find((a) => "address" in a && a.address);
  const replyAddress = (replyTo && "address" in replyTo ? replyTo.address : headerFrom?.address)?.toLowerCase();
  if (!replyAddress) return NextResponse.json({ ignored: "expéditeur illisible" });

  let bodyText = (email.text?.trim() || (email.html ? htmlToText(email.html) : "")).slice(0, 50_000);
  if (body.truncated) bodyText += "\n\n[Message trop lourd : les pièces jointes n'ont pas pu être reçues. Demande-les à l'expéditeur.]";

  try {
    const result = await storeInboundEmail(createAdminClient(), {
      id: email.messageId || `cf-${createHash("sha256").update(payload).digest("hex").slice(0, 32)}`,
      recipient,
      from: { address: replyAddress, name: headerFrom?.name || null },
      subject: email.subject || null,
      bodyText,
    });
    if (result === "unknown_recipient") return NextResponse.json({ error: "Adresse inconnue." }, { status: 404 });
    console.log(`inbox/cloudflare: ${result}`);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("inbox/cloudflare:", err);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
