import type { createAdminClient } from "@/lib/supabase/admin";
import { domainOf } from "@/lib/inbox/parse";
import { classifyEmailReply } from "@/lib/google/classifyEmailReplyWithAnthropic";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { classifyReplyByRules } from "@/lib/inbox/replyRules";
import { notifyInboxMessage } from "@/lib/resend/notifyInboxMessage";
import { notifyInterviewReply } from "@/lib/resend/notifyInterviewReply";
import type { ApplicationStatus } from "@/types/database";

// Rangement d'un email reçu sur une adresse de la boîte Stageio, quel que
// soit le service qui l'a reçu (Cloudflare Email Routing, gratuit, ou Resend
// Inbound) : on le range chez l'étudiant à qui appartient l'adresse, on le
// rattache à la candidature (même domaine que l'adresse à laquelle il a
// postulé), on met à jour son statut quand la réponse est claire (entretien,
// refus), et on le prévient par email.

export type InboundEmail = {
  // Identifiant unique du message chez le service de réception : un même
  // email reçu deux fois n'est rangé qu'une fois.
  id: string;
  recipient: string;
  from: { address: string; name: string | null };
  subject: string | null;
  bodyText: string;
};

export type StoreResult = "stored" | "duplicate" | "unknown_recipient";

function sentimentToStatus(sentiment: "positive" | "negative" | "neutral" | null): ApplicationStatus | null {
  if (sentiment === "positive") return "entretien";
  if (sentiment === "negative") return "refusee";
  return null;
}

export async function storeInboundEmail(admin: ReturnType<typeof createAdminClient>, email: InboundEmail): Promise<StoreResult> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("inbox_address", email.recipient)
    .maybeSingle();
  if (!profile) return "unknown_recipient";

  // Candidature à laquelle répond ce message : dernière candidature envoyée
  // depuis la boîte à une adresse du même domaine que l'expéditeur.
  const { data: lastSent } = await admin
    .from("inbox_messages")
    .select("offer_id, to_address")
    .eq("user_id", profile.id)
    .eq("direction", "out")
    .ilike("to_address", `%@${domainOf(email.from.address)}`)
    .order("created_at", { ascending: false })
    .limit(1);
  const offerId = lastSent?.[0]?.offer_id ?? null;

  const { data: inserted, error: insertError } = await admin
    .from("inbox_messages")
    .insert({
      user_id: profile.id,
      direction: "in",
      resend_email_id: `${email.id}:${email.recipient}`,
      from_address: email.from.address,
      from_name: email.from.name,
      to_address: email.recipient,
      subject: email.subject,
      body_text: email.bodyText || null,
      offer_id: offerId,
    })
    .select("id")
    .single();
  if (insertError) {
    // Déjà rangé (le service renvoie parfois le même message) : rien à refaire.
    if (/duplicate|unique/i.test(insertError.message)) return "duplicate";
    throw new Error(`inbox: enregistrement impossible (${insertError.message})`);
  }

  // Statut de la candidature d'après la réponse (entretien, refus).
  let interview: { company: string; title: string | null } | null = null;
  if (offerId) {
    try {
      const { data: offer } = await admin.from("offers").select("company, title").eq("id", offerId).maybeSingle();
      const reply = {
        from: email.from.name ? `${email.from.name} <${email.from.address}>` : email.from.address,
        subject: email.subject,
        snippet: email.bodyText.slice(0, 1500),
      };
      const companies = offer?.company ? [offer.company] : [];
      // Sans IA (coupée par défaut) ou si elle échoue : classement par règles.
      const verdict = isAnthropicConfigured()
        ? await classifyEmailReply(reply, companies).catch(() => classifyReplyByRules(reply, companies))
        : classifyReplyByRules(reply, companies);
      const status = verdict.is_recruiting_reply ? sentimentToStatus(verdict.sentiment) : null;
      // Jamais par-dessus une réponse déjà tranchée (acceptée, refusée,
      // clôturée) : même garde-fou que la synchro Gmail.
      if (status) {
        await admin
          .from("applications")
          .update({ status })
          .eq("user_id", profile.id)
          .eq("offer_id", offerId)
          .not("status", "in", "(acceptee,refusee,cloturee)");
        if (status === "entretien" && offer?.company) interview = { company: offer.company, title: offer.title ?? null };
      }
    } catch (err) {
      console.error("inbox: classement de la réponse impossible", err);
    }
  }

  // Invitation à un entretien (28/10) : un email qui le dit et mène à la
  // préparation, à la place du simple « nouveau message ».
  if (profile.email && interview) {
    try {
      await notifyInterviewReply({
        to: profile.email,
        firstName: profile.full_name?.split(" ")[0] ?? null,
        company: interview.company,
        offerTitle: interview.title,
        messageId: inserted.id,
      });
      return "stored";
    } catch (err) {
      console.error("inbox: notification d'entretien impossible", err);
    }
  }

  if (profile.email) {
    try {
      await notifyInboxMessage(
        profile.email,
        profile.full_name?.split(" ")[0] ?? null,
        email.from.name ?? email.from.address,
        email.subject,
        inserted.id,
      );
    } catch (err) {
      console.error("inbox: notification impossible", err);
    }
  }
  return "stored";
}
