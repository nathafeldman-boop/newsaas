import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { contractOf, referralUrl, shareMessage } from "@/lib/referrals/share";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import type { Profile } from "@/types/database";

// « Trouvée via Stageio » (29/10) : félicitations de Nathan, les prochaines
// étapes du contrat, et la recommandation à un ami avec le lien de
// parrainage (bouche-à-oreille). Une fois par compte.

type Admin = ReturnType<typeof createAdminClient>;

export const SIGNED_CONGRATS_EVENT = "signed_congrats_sent";

type SignedProfile = Pick<Profile, "id" | "full_name" | "looking_for" | "referral_code" | "subscription_status">;

export function renderSignedEmail(profile: SignedProfile) {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const contract = contractOf(profile.looking_for);
  const what = contract === "stage" ? "ton stage" : "ton alternance";
  const link = referralUrl(profile.referral_code);
  const message = shareMessage("signe", link, contract);
  const steps =
    contract === "stage"
      ? ["Confirme ton accord par écrit à l'entreprise.", "Fais signer ta convention de stage par l'école et l'entreprise.", "Note ta date de début et le nom de ton tuteur."]
      : [
          "Confirme ton accord par écrit à l'entreprise.",
          "Préviens ton école ou ton CFA : le contrat (CERFA) se remplit avec l'entreprise, puis part à son OPCO.",
          "Note ta date de début et le nom de ton tuteur.",
        ];
  const billing =
    profile.subscription_status === "active" || profile.subscription_status === "trialing"
      ? "Ton abonnement continue tant que tu ne le résilies pas : quand tu n'en as plus besoin, c'est 2 clics depuis ton Profil."
      : null;
  const subject = `${first ? `Bravo ${first}` : "Bravo"} ! 🎉 ${what.charAt(0).toUpperCase()}${what.slice(1)} est trouvé${contract === "stage" ? "" : "e"}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${first ? `Salut ${escapeHtml(first)},` : "Salut,"}</p>
<p>Félicitations ! C'est Nathan, le fondateur de Stageio : savoir que tu as trouvé ${what} avec nous, c'est la meilleure nouvelle de ma journée.</p>
<p style="margin:16px 0 4px"><strong>Les prochaines étapes :</strong></p>
<ol style="margin:0;padding-left:20px">${steps.map((s) => `<li style="margin:0 0 4px">${escapeHtml(s)}</li>`).join("")}</ol>
<p style="margin:18px 0 4px"><strong>Un pote cherche encore ?</strong> Envoie-lui ce message, il arrive sur Stageio avec ton invitation :</p>
<p style="margin:0;padding:12px 14px;border-radius:12px;background:#f2faf5;border:1px dashed #9fd8b8">${escapeHtml(message)}</p>
<p style="margin:12px 0 0"><a href="https://wa.me/?text=${encodeURIComponent(message)}" style="display:inline-block;background:#0c7a44;color:#fff;padding:11px 18px;border-radius:12px;text-decoration:none;font-weight:bold">L'envoyer sur WhatsApp →</a></p>
<p style="margin-top:18px">Et si tu as 30 secondes, ton avis aide d'autres étudiants à se lancer : <a href="${SITE_URL}/profil" style="color:#0c7a44">laisser un avis</a>.</p>
<p>Bonne route, et bravo encore.<br>Nathan, fondateur de Stageio</p>
${billing ? `<p style="font-size:12px;color:#888;margin-top:24px">${escapeHtml(billing)}</p>` : ""}
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    `Félicitations ! Savoir que tu as trouvé ${what} avec Stageio, c'est la meilleure nouvelle de ma journée.`,
    "",
    "Les prochaines étapes :",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "Un pote cherche encore ? Envoie-lui ce message :",
    message,
    "",
    `Ton avis aide d'autres étudiants : ${SITE_URL}/profil`,
    "",
    "Nathan, fondateur de Stageio",
    ...(billing ? ["", billing] : []),
  ].join("\n");
  return { subject, html, text };
}

/** Une fois par compte. Ne lève jamais : renvoie l'erreur. */
export async function sendSignedCongratsOnce(admin: Admin, userId: string): Promise<{ sent: boolean; error: string | null }> {
  try {
    const from = campaignSender();
    if (!from) return { sent: false, error: "RESEND_FROM_EMAIL manquant" };
    const [{ data: profile, error: readError }, { data: already }] = await Promise.all([
      admin.from("profiles").select("id, email, full_name, looking_for, referral_code, subscription_status").eq("id", userId).maybeSingle(),
      admin.from("user_events").select("id").eq("user_id", userId).eq("event_type", SIGNED_CONGRATS_EVENT).limit(1),
    ]);
    if (readError) return { sent: false, error: readError.message };
    if (!profile?.email || !profile.referral_code || already?.length) return { sent: false, error: null };
    const { error } = await getResendClient().emails.send(
      { from, to: profile.email, replyTo: CONTACT_EMAIL, ...renderSignedEmail(profile), tags: [{ name: "campaign", value: "signed_congrats" }] },
      { idempotencyKey: `signed-congrats-${userId}` },
    );
    if (error) return { sent: false, error: error.message };
    await admin.from("user_events").insert({ user_id: userId, event_type: SIGNED_CONGRATS_EVENT });
    return { sent: true, error: null };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
