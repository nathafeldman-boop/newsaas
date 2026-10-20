"use server";

import { redirect } from "next/navigation";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { getGuaranteeStatus, type GuaranteeStatus } from "@/lib/premium/refundGuarantee";
import {
  GUARANTEE_MIN_LIKES,
  GUARANTEE_OFFERED_EVENT,
  GUARANTEE_REFUND_DAYS,
  GUARANTEE_REQUESTED_EVENT,
  formatParis,
} from "@/lib/premium/guaranteeTerms";
import { getResendClient } from "@/lib/resend/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SUPPORT_EMAIL = "contact@stageio.fr";

// Message affiché en quittant le paywall : c'est cet événement (une seule
// fois par compte) qui ouvre le droit à la garantie sur un achat ultérieur.
export async function offerRefundGuaranteeAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_type", GUARANTEE_OFFERED_EVENT)
    .limit(1);
  if (data?.length) return;
  await logServerEvent(admin, user.id, GUARANTEE_OFFERED_EVENT);
}

// Demande de remboursement : conditions revérifiées ici (jamais sur la
// seule foi de l'écran). Nathan reçoit la demande par email et rembourse à
// la main dans Stripe ; l'étudiant reçoit une copie.
export async function requestRefundAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");
  if (formData.get("no_interview") !== "on") redirect("/premium?refund=confirm_required");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, subscription_status, premium_activated_at, total_paid_cents, stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/premium?refund=error");

  let status: GuaranteeStatus | null;
  try {
    status = await getGuaranteeStatus(user.id, profile);
  } catch (err) {
    console.error("requestRefundAction: guarantee status failed", err, { userId: user.id });
    redirect("/premium?refund=error");
  }
  if (!status) redirect("/premium?refund=unavailable");
  if (status.requestedAt) redirect("/premium?refund=requested");
  const now = Date.now();
  if (now < status.opensAt.getTime() || now > status.closesAt.getTime()) redirect("/premium?refund=outside_window");
  if (status.likes < GUARANTEE_MIN_LIKES) redirect("/premium?refund=not_enough_likes");

  const plan = profile.subscription_status === "lifetime" ? "accès à vie" : "mensuel";
  await logServerEvent(admin, user.id, GUARANTEE_REQUESTED_EVENT, {
    plan,
    likes: status.likes,
    premium_activated_at: profile.premium_activated_at,
    total_paid_cents: profile.total_paid_cents,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const paid = `${((profile.total_paid_cents ?? 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `Stageio <${fromEmail}>`,
      to: SUPPORT_EMAIL,
      subject: `Garantie : demande de remboursement de ${profile.email ?? user.id}`,
      html: `<p>Demande de remboursement (garantie « pas d'entretien en 3 mois ») le ${formatParis(new Date(now))}.</p>
<ul>
<li>Compte : ${profile.full_name ?? "—"} — ${profile.email ?? "—"} (id ${user.id})</li>
<li>Formule : ${plan}, Premium depuis le ${formatParis(new Date(profile.premium_activated_at!))}</li>
<li>Payé au total : ${paid}</li>
<li>Offres likées pendant les 3 mois : ${status.likes}</li>
<li>Client Stripe : ${profile.stripe_customer_id ?? "—"}</li>
<li>Aucun entretien : certifié sur l'honneur</li>
</ul>
<p>À rembourser dans Stripe sous ${GUARANTEE_REFUND_DAYS} jours (et résilier l'abonnement s'il est mensuel).</p>`,
    });
    if (profile.email) {
      await resend.emails.send({
        from: `Stageio <${fromEmail}>`,
        to: profile.email,
        subject: "On a bien reçu ta demande de remboursement",
        html: `<p>Salut${profile.full_name ? ` ${profile.full_name}` : ""},</p>
<p>On a bien reçu ta demande de remboursement au titre de la garantie Stageio. On te rembourse sous ${GUARANTEE_REFUND_DAYS} jours sur la carte utilisée pour payer (${paid}).</p>
<p>Courage pour la suite, ne lâche rien. Une question : ${SUPPORT_EMAIL}</p>`,
      });
    }
  } catch (err) {
    console.error("requestRefundAction: email failed", err, { userId: user.id });
  }
  redirect("/premium?refund=requested");
}
