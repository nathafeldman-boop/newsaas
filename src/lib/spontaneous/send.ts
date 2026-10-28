import type { createAdminClient } from "@/lib/supabase/admin";
import { LbaError, MAX_CV_BYTES, lbaApiKey, sendLbaApplication } from "@/lib/laBonneAlternance/client";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import { getOrCreateInboxAddress, inboxDomain } from "@/lib/inbox/address";
import { LBA_LABEL } from "@/lib/applications/autoSend";
import { spontaneousLetter } from "@/lib/spontaneous/letter";
import { SPONTANEOUS_EVENT, type SpontaneousTarget } from "@/lib/spontaneous/targets";
import type { Profile } from "@/types/database";

// Envoi d'une candidature spontanée par La bonne alternance (le service
// public la transmet par email à l'entreprise, avec le CV et la lettre) :
// depuis le bouton de /spontanees ou tout seul pour Stageio Auto. La
// réponse de l'entreprise arrive dans la boîte Stageio de l'étudiant (sinon
// sur son email), comme pour les offres La bonne alternance.

type Admin = ReturnType<typeof createAdminClient>;

export type SpontaneousMissing = "no_cv" | "no_phone" | "no_name";
export type SpontaneousSendResult =
  | { status: "sent"; company: string }
  | { status: "missing"; missing: SpontaneousMissing }
  | { status: "cv_too_big" | "busy" | "off" | "error"; company?: string };

type SendProfile = Pick<Profile, "id" | "full_name" | "phone" | "cv_path" | "email" | "target_jobs" | "formation" | "education_level" | "skills" | "availability_date" | "city" | "gender">;

/** Ce qui manque pour envoyer une candidature par La bonne alternance (vide = prêt). */
export function missingForLba(profile: Pick<Profile, "full_name" | "phone" | "cv_path">): SpontaneousMissing[] {
  const missing: SpontaneousMissing[] = [];
  if (!profile.cv_path) missing.push("no_cv");
  if (!normalizePhone(profile.phone)) missing.push("no_phone");
  if (!splitFullName(profile.full_name)) missing.push("no_name");
  return missing;
}

function cvContentType(path: string): string {
  return /\.docx$/i.test(path) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
}

export async function sendSpontaneous(admin: Admin, profile: SendProfile, target: SpontaneousTarget, via: "manual" | "auto"): Promise<SpontaneousSendResult> {
  if (!lbaApiKey()) return { status: "off" };
  const missing = missingForLba(profile);
  if (missing.length > 0) return { status: "missing", missing: missing[0] };
  const names = splitFullName(profile.full_name)!;
  const phone = normalizePhone(profile.phone)!;
  const cvPath = profile.cv_path!;

  const replyAddress = (inboxDomain() && (await getOrCreateInboxAddress(admin, profile.id, profile.full_name))) || profile.email;
  if (!replyAddress) return { status: "error", company: target.company };

  const { data: cv, error: cvError } = await admin.storage.from("cvs").download(cvPath);
  if (cvError || !cv) {
    console.error("spontanees: CV introuvable", cvError, { userId: profile.id });
    return { status: "missing", missing: "no_cv" };
  }
  if (cv.size > MAX_CV_BYTES) return { status: "cv_too_big", company: target.company };

  const letter = spontaneousLetter(profile, target.company, target.activity);
  const fullName = `${names.first} ${names.last}`;
  try {
    await sendLbaApplication({
      applicant_first_name: names.first,
      applicant_last_name: names.last,
      applicant_email: replyAddress,
      applicant_phone: phone,
      applicant_attachment_name: `CV ${fullName.replace(/[^\p{L}\p{N} -]/gu, "")}.${/\.docx$/i.test(cvPath) ? "docx" : "pdf"}`,
      applicant_attachment_content: `data:${cvContentType(cvPath)};base64,${Buffer.from(await cv.arrayBuffer()).toString("base64")}`,
      applicant_message: letter,
      recipient_id: target.recipientId,
    });
  } catch (err) {
    if (err instanceof LbaError && err.status === 429) return { status: "busy", company: target.company };
    console.error("spontanees: La bonne alternance a refusé la candidature", err instanceof Error ? err.message : err, { userId: profile.id });
    return { status: "error", company: target.company };
  }

  const { error: eventError } = await admin.from("user_events").insert({
    user_id: profile.id,
    event_type: SPONTANEOUS_EVENT,
    metadata: { recipientId: target.recipientId, company: target.company, activity: target.activity, city: target.city, via },
  });
  if (eventError) console.error("spontanees: envoi non noté", eventError.message, { userId: profile.id });
  // Copie dans la boîte (onglet « envoyés »), comme les autres candidatures.
  const { error: copyError } = await admin.from("inbox_messages").insert({
    user_id: profile.id,
    direction: "out",
    from_address: replyAddress,
    from_name: fullName,
    to_address: LBA_LABEL,
    subject: `Candidature spontanée : ${target.company}`,
    body_text: letter,
    offer_id: null,
    read_at: new Date().toISOString(),
  });
  if (copyError) console.error("spontanees: copie dans la boîte impossible", copyError.message);
  return { status: "sent", company: target.company };
}
