import { NextResponse, type NextRequest } from "next/server";
import { getResendClient } from "@/lib/resend/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { inboxDomain } from "@/lib/inbox/address";
import { htmlToText, parseAddress } from "@/lib/inbox/parse";
import { storeInboundEmail } from "@/lib/inbox/receive";

// Réception de la boîte mail Stageio par Resend Inbound (15/10) : Resend
// appelle cette route à chaque email reçu sur INBOX_DOMAIN (événement
// email.received, signé). Le rangement est partagé avec la réception
// gratuite par Cloudflare (voir api/inbox/cloudflare et lib/inbox/receive.ts).
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  const domain = inboxDomain();
  if (!secret || !domain) {
    console.error("inbox/webhook: RESEND_INBOUND_WEBHOOK_SECRET ou INBOX_DOMAIN manquant");
    return NextResponse.json({ error: "Boîte non configurée." }, { status: 503 });
  }

  const payload = await request.text();
  const resend = getResendClient();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  if (event.type !== "email.received") return NextResponse.json({ ignored: event.type });

  const recipients = [
    ...new Set([...event.data.to, ...event.data.received_for].map((a) => parseAddress(a).address)),
  ].filter((a) => a.endsWith(`@${domain}`));
  if (recipients.length === 0) return NextResponse.json({ ignored: "destinataire hors boîte" });

  const { data: email, error: emailError } = await resend.emails.receiving.get(event.data.email_id);
  if (emailError || !email) {
    console.error("inbox/webhook: lecture de l'email impossible", emailError);
    // 500 : Resend renverra l'événement plus tard.
    return NextResponse.json({ error: "Email illisible." }, { status: 500 });
  }

  const sender = parseAddress(email.from);
  const bodyText = (email.text?.trim() || (email.html ? htmlToText(email.html) : "")).slice(0, 50_000);
  const admin = createAdminClient();
  let stored = 0;

  for (const recipient of recipients) {
    try {
      const result = await storeInboundEmail(admin, {
        id: email.id,
        recipient,
        from: sender,
        subject: email.subject || null,
        bodyText,
      });
      if (result === "stored") stored += 1;
    } catch (err) {
      console.error("inbox/webhook:", err);
      // 500 : Resend renverra l'événement plus tard.
      return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    }
  }

  console.log(`inbox/webhook: ${stored} message(s) rangé(s)`);
  return NextResponse.json({ stored });
}
