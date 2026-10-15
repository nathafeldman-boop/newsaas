import { NextResponse, type NextRequest } from "next/server";
import { getResendClient } from "@/lib/resend/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { inboxDomain } from "@/lib/inbox/address";
import { domainOf, htmlToText, parseAddress } from "@/lib/inbox/parse";
import { classifyEmailReply } from "@/lib/google/classifyEmailReplyWithAnthropic";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { notifyInboxMessage } from "@/lib/resend/notifyInboxMessage";
import type { ApplicationStatus } from "@/types/database";

// Réception de la boîte mail Stageio (15/10) : Resend Inbound appelle cette
// route à chaque email reçu sur INBOX_DOMAIN (événement email.received,
// signé). On range le message chez l'étudiant à qui appartient l'adresse,
// on le rattache à la candidature (même domaine que l'adresse à laquelle il
// a postulé), on met à jour son statut quand la réponse est claire
// (entretien, refus), et on le prévient par email.
export const maxDuration = 60;

function sentimentToStatus(sentiment: "positive" | "negative" | "neutral" | null): ApplicationStatus | null {
  if (sentiment === "positive") return "entretien";
  if (sentiment === "negative") return "refusee";
  return null;
}

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
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("inbox_address", recipient)
      .maybeSingle();
    if (!profile) continue;

    // Candidature à laquelle répond ce message : dernière candidature envoyée
    // depuis la boîte à une adresse du même domaine que l'expéditeur.
    const { data: lastSent } = await admin
      .from("inbox_messages")
      .select("offer_id, to_address")
      .eq("user_id", profile.id)
      .eq("direction", "out")
      .ilike("to_address", `%@${domainOf(sender.address)}`)
      .order("created_at", { ascending: false })
      .limit(1);
    const offerId = lastSent?.[0]?.offer_id ?? null;

    const { data: inserted, error: insertError } = await admin
      .from("inbox_messages")
      .insert({
        user_id: profile.id,
        direction: "in",
        resend_email_id: `${email.id}:${recipient}`,
        from_address: sender.address,
        from_name: sender.name,
        to_address: recipient,
        subject: email.subject || null,
        body_text: bodyText || null,
        offer_id: offerId,
      })
      .select("id")
      .single();
    if (insertError) {
      // Déjà rangé (Resend renvoie parfois le même événement) : rien à refaire.
      if (/duplicate|unique/i.test(insertError.message)) continue;
      console.error("inbox/webhook: enregistrement impossible", insertError);
      return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    }
    stored += 1;

    // Statut de la candidature d'après la réponse (entretien, refus).
    if (offerId && isAnthropicConfigured()) {
      try {
        const { data: offer } = await admin.from("offers").select("company").eq("id", offerId).maybeSingle();
        const verdict = await classifyEmailReply(
          { from: email.from, subject: email.subject, snippet: bodyText.slice(0, 1500) },
          offer?.company ? [offer.company] : [],
        );
        const status = verdict.is_recruiting_reply ? sentimentToStatus(verdict.sentiment) : null;
        if (status) {
          await admin.from("applications").update({ status }).eq("user_id", profile.id).eq("offer_id", offerId);
        }
      } catch (err) {
        console.error("inbox/webhook: classement de la réponse impossible", err);
      }
    }

    if (profile.email) {
      try {
        await notifyInboxMessage(
          profile.email,
          profile.full_name?.split(" ")[0] ?? null,
          sender.name ?? sender.address,
          email.subject || null,
          inserted.id,
        );
      } catch (err) {
        console.error("inbox/webhook: notification impossible", err);
      }
    }
  }

  console.log(`inbox/webhook: ${stored} message(s) rangé(s)`);
  return NextResponse.json({ stored });
}
