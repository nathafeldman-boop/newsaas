import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { recipientForOffer } from "@/lib/offers/recruiterEmail";
import { refreshGmailAccess, sendGmailMessage } from "@/lib/google/gmailClient";
import { GMAIL_SCOPE } from "@/lib/google/gmailOAuth";
import { buildApplicationEmail } from "@/lib/google/buildApplicationEmail";
import { generateCoverLetterAction } from "@/app/(app)/candidature/[offerId]/actions";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import type { AutoSendResult } from "@/lib/applications/autoSend";

// Like = candidature envoyée (14/10, demande de Nathan) : quand l'entreprise
// a publié un email et que l'étudiant a connecté son Gmail, la lettre
// écrite pour l'offre part depuis SA boîte, avec son CV en pièce jointe.
// Sinon (« manual »), l'appli ouvre la page de candidature comme avant.
// Route plutôt que server action : les server actions d'un même onglet
// passent l'une après l'autre, et un envoi (lettre + Gmail) prend 10 à 30 s
// -- l'étudiant doit pouvoir continuer à swiper pendant ce temps.
// check=true : vérifications seules (rapide), sans rien envoyer.
export const maxDuration = 60;

const EVENT = "application_emailed";

function json(result: AutoSendResult, status = 200) {
  // Une ligne par issue (visible dans les journaux Vercel) : sans elle, un
  // like qui ne part pas ne laisse aucune trace de la raison.
  console.log(`auto-send: ${result.status}${result.status === "manual" ? ` (${result.reason})` : ""}`);
  return NextResponse.json(result, { status });
}

function cvContentType(path: string): string {
  return /\.docx$/i.test(path)
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "application/pdf";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { offerId?: string; check?: boolean } | null;
  const offerId = body?.offerId;
  if (!offerId) return json({ status: "error" }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ status: "error" }, 401);

  const admin = createAdminClient();
  const [{ data: offer }, { data: profile }, { data: connection }, { data: alreadySent }] = await Promise.all([
    supabase.from("offers").select("*").eq("id", offerId).maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, cv_path, subscription_status, current_period_end")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("email_connections")
      .select("email_address, refresh_token")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle(),
    admin
      .from("user_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", EVENT)
      .contains("metadata", { offerId })
      .limit(1),
  ]);

  if (!offer) return json({ status: "manual", reason: "not_found" });
  const company = offer.company;
  if (!isPremium(profile)) return json({ status: "manual", reason: "premium_required", company });

  const to = recipientForOffer(offer);
  if (!to) return json({ status: "manual", reason: "no_email", company });
  if (!connection?.refresh_token) return json({ status: "manual", reason: "no_gmail", company });
  if (!profile?.cv_path) return json({ status: "manual", reason: "no_cv", company });
  if ((alreadySent ?? []).length > 0) return json({ status: "manual", reason: "already_sent", company });

  let accessToken: string;
  try {
    const access = await refreshGmailAccess(connection.refresh_token);
    if (!access.scopes.includes(GMAIL_SCOPE)) return json({ status: "manual", reason: "gmail_reconnect", company });
    accessToken = access.accessToken;
  } catch (err) {
    // Accès retiré par l'étudiant, ou connexion expirée (appli Google pas
    // encore validée : 7 jours) -- il faut reconnecter Gmail.
    console.error("auto-send: jeton Gmail refusé", err);
    return json({ status: "manual", reason: "gmail_reconnect", company });
  }

  if (body?.check) return json({ status: "ready", company, to });

  const letterResult = await generateCoverLetterAction(offerId);
  if (letterResult.status === "premium_required") return json({ status: "manual", reason: "premium_required", company });
  if (letterResult.status !== "success") return json({ status: "error", company });

  const { data: cvFile, error: cvError } = await admin.storage.from("cvs").download(profile.cv_path);
  if (cvError || !cvFile) {
    console.error("auto-send: CV introuvable", cvError, { userId: user.id });
    return json({ status: "manual", reason: "no_cv", company });
  }
  const extension = /\.docx$/i.test(profile.cv_path) ? "docx" : "pdf";
  const name = profile.full_name?.trim() || null;

  const mime = buildApplicationEmail({
    fromName: name,
    fromEmail: connection.email_address,
    to,
    subject: `Candidature : ${offer.title}`,
    body: letterResult.letter,
    attachment: {
      filename: name ? `CV ${name}.${extension}` : `CV.${extension}`,
      contentType: cvContentType(profile.cv_path),
      data: Buffer.from(await cvFile.arrayBuffer()),
    },
  });

  try {
    await sendGmailMessage(accessToken, mime);
  } catch (err) {
    console.error("auto-send: envoi Gmail en échec", err, { offerId });
    return json({ status: "error", company });
  }

  await logServerEvent(supabase, user.id, EVENT, { offerId, toDomain: to.split("@")[1] });

  const { count } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", EVENT)
    .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString());

  return json({ status: "sent", company, to, from: connection.email_address, sentLast24h: count ?? 1 });
}
