import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStaticCoverLetter, type CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import { streamCoverLetterWithAnthropic } from "@/lib/coverLetter/generateWithAnthropic";
import { COVER_LETTER_RESET } from "@/lib/coverLetter/stream";
import { isAnthropicConfigured } from "@/lib/anthropic/client";
import { PROFILE_FOR_AI_COLUMNS } from "@/lib/ai/profileContext";
import { isPremium } from "@/lib/subscription/isPremium";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { isInvalidEnumError } from "@/lib/applications/status";

// Lettre de motivation écrite en direct (16/10, demande de Nathan : plus
// rapide, animation refaite) : la réponse est un flux de texte, les premiers
// mots s'affichent pendant que Claude écrit la suite. Remplace la server
// action generateCoverLetterAction, avec les mêmes règles :
// - candidater est réservé aux Premium (hard paywall du 26/09, miroir du
//   trigger SQL enforce_premium_application) ;
// - la candidature et le like sont enregistrés à l'ouverture de la page,
//   en parallèle de l'écriture (avant : l'un après l'autre, puis Claude) ;
// - repli automatique sur le générateur statique dès que Claude échoue,
//   dépasse son délai ou n'est pas configuré -- jamais un simple appel IA seul
//   en bout de chaîne (pannes Mistral/Gemini de septembre). Si Claude lâche
//   en cours de route, COVER_LETTER_RESET dit au navigateur d'effacer le
//   début et d'afficher la lettre statique à la place.
// Réponses hors flux : 401 (non connecté), 404 (offre), 402 (Premium requis).
export const maxDuration = 60;

type Body = { achievement?: string; whyCompany?: string; attempt?: number };

export async function POST(request: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const body = ((await request.json().catch(() => null)) ?? {}) as Body;
  const extra: CoverLetterExtra | undefined =
    body.achievement?.trim() || body.whyCompany?.trim()
      ? { achievement: body.achievement?.trim().slice(0, 500), whyCompany: body.whyCompany?.trim().slice(0, 500) }
      : undefined;
  const attempt = Number.isInteger(body.attempt) && (body.attempt as number) >= 0 ? (body.attempt as number) : 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "error", message: "Non authentifié." }, { status: 401 });

  const [{ data: offer }, { data: profile }] = await Promise.all([
    supabase
      .from("offers")
      .select("title, company, description, location, requirements, contract_type, sector")
      .eq("id", offerId)
      .single(),
    supabase
      .from("profiles")
      .select(`${PROFILE_FOR_AI_COLUMNS}, subscription_status, current_period_end, cv_text`)
      .eq("id", user.id)
      .single(),
  ]);
  if (!offer) return NextResponse.json({ status: "error", message: "Offre introuvable." }, { status: 404 });
  if (!isPremium(profile)) return NextResponse.json({ status: "premium_required" }, { status: 402 });

  // Candidature + like enregistrés pendant que la lettre s'écrit.
  const bookkeeping = recordApplication(supabase, user.id, offerId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentText = false;
      let letter: string | null = null;
      let source: "anthropic" | "static" = "static";

      if (isAnthropicConfigured()) {
        try {
          letter = await streamCoverLetterWithAnthropic(offer, profile, profile?.cv_text ?? null, extra, (text) => {
            sentText = true;
            controller.enqueue(encoder.encode(text));
          });
          source = "anthropic";
        } catch (err) {
          console.error("cover-letter: Claude a échoué, repli sur le générateur statique", err);
        }
      }
      if (!letter) {
        letter = generateStaticCoverLetter(offer, profile, extra, attempt);
        controller.enqueue(encoder.encode((sentText ? COVER_LETTER_RESET : "") + letter));
      }

      await bookkeeping;
      await logServerEvent(supabase, user.id, "cover_letter_generated", { offerId, source, attempt });
      // Ne touche jamais au statut ici : une candidature déjà en cours
      // d'entretien ne doit pas retomber à "à envoyer" à cause d'une
      // régénération de lettre. Best-effort : la lettre reste affichée et
      // copiable même si la sauvegarde échoue.
      const { error: updateError } = await supabase
        .from("applications")
        .update({ cover_note: letter })
        .eq("user_id", user.id)
        .eq("offer_id", offerId);
      if (updateError) console.error("cover-letter: cover_note update failed", updateError);

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store, no-transform" },
  });
}

async function recordApplication(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, offerId: string) {
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("offer_id", offerId)
    .maybeSingle();

  if (!existing) {
    // « À envoyer » : ouvrir l'offre et écrire la lettre ne veut pas dire
    // avoir postulé. Elle passe « envoyée » quand l'étudiant le confirme
    // (markApplicationSentAction). Base sans le statut du 24/10 : ancienne
    // valeur, pour ne jamais perdre la candidature.
    let { error: insertError } = await supabase
      .from("applications")
      .insert({ user_id: userId, offer_id: offerId, status: "a_preparer" });
    if (isInvalidEnumError(insertError)) {
      ({ error: insertError } = await supabase
        .from("applications")
        .insert({ user_id: userId, offer_id: offerId, status: "envoyee" }));
    }
    if (insertError) {
      // supabase-js ne throw jamais sur une erreur Postgres -- sans ce log,
      // l'utilisateur croirait avoir postulé alors qu'aucune candidature
      // n'existe en base.
      console.error("cover-letter: applications insert failed", insertError, { userId, offerId });
    } else {
      await logServerEvent(supabase, userId, "offer_applied", { offerId });
    }
  }

  const { error: swipeError } = await supabase
    .from("swipes")
    .upsert({ user_id: userId, offer_id: offerId, direction: "like" }, { onConflict: "user_id,offer_id" });
  if (swipeError) console.error("cover-letter: swipes upsert failed", swipeError, { userId, offerId });
}
