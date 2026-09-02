import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshGmailAccessToken, listRecentMessages } from "@/lib/google/gmailClient";
import { classifyEmailReply } from "@/lib/mistral/classifyEmailReply";
import type { ApplicationStatus } from "@/types/database";

// Sync périodique (voir vercel.json) : pour chaque boîte Gmail connectée,
// va chercher les emails récents, les fait classer par Mistral (réponse
// recruteur ? positive/négative/neutre ? quelle candidature ?), et met à
// jour applications.status en conséquence. Ne descend jamais un statut
// terminal (acceptee/refusee) — un email ambigu ultérieur ne doit pas
// écraser un verdict déjà clair.

export const maxDuration = 60;

const LOOKBACK_DAYS_DEFAULT = 14;
const MAX_MESSAGES_PER_SYNC = 20;

function sentimentToStatus(
  sentiment: "positive" | "negative" | "neutral",
): ApplicationStatus | null {
  if (sentiment === "positive") return "entretien";
  if (sentiment === "negative") return "refusee";
  return null; // neutre : pas de changement de statut
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data: connections, error: connError } = await admin
    .from("email_connections")
    .select("*")
    .eq("provider", "gmail");

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 });
  }

  const summary: {
    user_id: string;
    fetched: number;
    classified: number;
    matched: number;
    error?: string;
  }[] = [];

  for (const conn of connections ?? []) {
    try {
      const accessToken = await refreshGmailAccessToken(conn.refresh_token);

      const afterDate = conn.last_synced_at
        ? new Date(conn.last_synced_at)
        : new Date(Date.now() - LOOKBACK_DAYS_DEFAULT * 86_400_000);

      const messages = await listRecentMessages(
        accessToken,
        afterDate,
        MAX_MESSAGES_PER_SYNC,
      );

      const { data: applications } = await admin
        .from("applications")
        .select("id, status, offer_id")
        .eq("user_id", conn.user_id);

      const offerIds = (applications ?? []).map((a) => a.offer_id);
      const { data: offers } = offerIds.length
        ? await admin.from("offers").select("id, company").in("id", offerIds)
        : { data: [] as { id: string; company: string }[] };

      const companyByOfferId = new Map(
        (offers ?? []).map((o) => [o.id, o.company]),
      );
      const companies = Array.from(companyByOfferId.values());

      let classified = 0;
      let matched = 0;

      for (const message of messages) {
        // Dédup : un message déjà traité (peu importe le résultat) n'est
        // jamais reclassé.
        const { data: existing } = await admin
          .from("email_replies")
          .select("id")
          .eq("user_id", conn.user_id)
          .eq("provider_message_id", message.id)
          .maybeSingle();
        if (existing) continue;

        if (companies.length === 0) continue;

        let result;
        try {
          result = await classifyEmailReply(
            { from: message.from, subject: message.subject, snippet: message.snippet },
            companies,
          );
          classified++;
        } catch {
          continue; // une classification ratée ne doit pas casser le sync
        }

        if (!result.is_recruiting_reply || !result.sentiment) continue;

        const matchedApp = result.matched_company
          ? (applications ?? []).find(
              (a) =>
                companyByOfferId
                  .get(a.offer_id)
                  ?.toLowerCase() === result.matched_company?.toLowerCase(),
            )
          : null;

        await admin.from("email_replies").insert({
          user_id: conn.user_id,
          application_id: matchedApp?.id ?? null,
          provider_message_id: message.id,
          from_address: message.from,
          subject: message.subject,
          snippet: message.snippet,
          sentiment: result.sentiment,
          received_at: message.date ? new Date(message.date).toISOString() : null,
        });

        if (matchedApp) {
          matched++;
          const isTerminal =
            matchedApp.status === "acceptee" || matchedApp.status === "refusee";
          const newStatus = sentimentToStatus(result.sentiment);
          if (!isTerminal && newStatus) {
            await admin
              .from("applications")
              .update({ status: newStatus })
              .eq("id", matchedApp.id);
          }
        }
      }

      await admin
        .from("email_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", conn.id);

      summary.push({
        user_id: conn.user_id,
        fetched: messages.length,
        classified,
        matched,
      });
    } catch (err) {
      summary.push({
        user_id: conn.user_id,
        fetched: 0,
        classified: 0,
        matched: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ connections: connections?.length ?? 0, summary });
}
