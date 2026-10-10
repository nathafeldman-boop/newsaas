import { getResendClient } from "@/lib/resend/client";
import { INACTIVE_WINBACK_EMAILS } from "@/lib/resend/inactiveWinbackContent";
import { unsubscribeHeaders, unsubscribeUrlFor } from "@/lib/resend/unsubscribe";

// dayIndex : 0-based, doit être < INACTIVE_WINBACK_EMAILS.length (borné côté
// appelant par inactive_campaign_emails_sent, voir cron/inactive-winback).
export async function notifyInactiveWinback(
  email: string,
  fullName: string | null,
  profileId: string,
  dayIndex: number,
) {
  const build = INACTIVE_WINBACK_EMAILS[dayIndex];
  if (!build) {
    throw new Error(`notifyInactiveWinback: dayIndex ${dayIndex} hors limites`);
  }

  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const unsubscribeUrl = unsubscribeUrlFor(profileId);
  const greeting = `Salut${fullName ? ` ${fullName}` : ""}`;
  const { subject, html } = build(greeting, unsubscribeUrl);

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject,
    html,
    headers: unsubscribeHeaders(profileId),
  });
}
