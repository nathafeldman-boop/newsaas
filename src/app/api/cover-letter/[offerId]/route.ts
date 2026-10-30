import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStaticCoverLetter, type CoverLetterExtra } from "@/lib/coverLetter/staticGenerator";
import { generateMetierLetter, type MetierLetterStyle } from "@/lib/coverLetter/metierLetter";
import { PROFILE_FOR_AI_COLUMNS } from "@/lib/ai/profileContext";
import { isPremium } from "@/lib/subscription/isPremium";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { isInvalidEnumError } from "@/lib/applications/status";

// Lettre de motivation (16/10, animation refaite ; sans IA depuis le 30/10,
// Nathan : « 100 templates […] sans IA ») : modèle du métier de l'offre
// (lib/coverLetter/metierLetter), sinon générateur par famille de secteurs.
// La réponse reste un flux de texte que l'écran écrit à la volée.
// - candidater est réservé aux Premium (hard paywall du 26/09, miroir du
//   trigger SQL enforce_premium_application) ;
// - la candidature et le like sont enregistrés à l'ouverture de la page,
//   en parallèle de l'écriture.
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
      // Sans IA (30/10, Nathan) : le modèle du métier de l'offre, style
      // « classique » puis « directe » à chaque « Régénérer », puis le
      // générateur par famille de secteurs (aussi quand le métier n'a pas de
      // modèle). L'écran l'écrit à la volée, comme avant.
      const styles: (MetierLetterStyle | null)[] = ["classique", "directe", null];
      const style = styles[attempt % styles.length];
      const metierLetter = style ? generateMetierLetter(offer, profile, style, extra) : null;
      const letter = metierLetter ?? generateStaticCoverLetter(offer, profile, extra, attempt);
      const source = metierLetter ? `metier_${style}` : "static";
      controller.enqueue(encoder.encode(letter));

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
