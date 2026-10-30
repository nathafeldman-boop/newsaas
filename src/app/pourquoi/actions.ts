"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { onRefundAnswer } from "@/lib/refunds/process";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Réponse au questionnaire de départ (lien des e-mails, sans connexion,
// comme le lien de désinscription). Rangée avec les motifs déjà donnés avant
// le portail Stripe (subscription_cancellations), lus par « Motifs
// d'annulation » dans l'admin.
export async function submitChurnSurveyAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("u") ?? "");
  const kind = String(formData.get("k") ?? "") === "parti" ? "parti" : "programme";
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 120);
  const stay = String(formData.get("stay") ?? "").trim().slice(0, 1000);
  const comeBack = formData.getAll("comeback").map(String).slice(0, 8);
  const comeBackOther = String(formData.get("comeback_other") ?? "").trim().slice(0, 500);
  if (!UUID.test(userId) || !reason) redirect(`/pourquoi?u=${encodeURIComponent(userId)}&k=${kind}&erreur=1`);

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) redirect("/pourquoi?erreur=1");

  const detail = [
    stay && `Ce qui l'aurait fait rester : ${stay}`,
    (comeBack.length > 0 || comeBackOther) && `Reviendrait si : ${[...comeBack, comeBackOther].filter(Boolean).join(", ")}`,
    `Questionnaire de départ (${kind === "parti" ? "abonnement terminé" : "résiliation programmée"})`,
  ]
    .filter(Boolean)
    .join(" · ");
  const { error } = await db.from("subscription_cancellations").insert({ user_id: userId, reason, detail });
  if (error) {
    console.error("submitChurnSurveyAction: insert failed", error, { userId });
    redirect(`/pourquoi?u=${userId}&k=${kind}&erreur=1`);
  }
  await db.from("user_events").insert({ user_id: userId, event_type: "churn_survey", metadata: { reason, kind, comeBack } });
  // Demande de remboursement (30/10) : accusé de réception, voir lib/refunds/process.
  await onRefundAnswer(db, userId, `${reason} ${stay} ${comeBackOther}`);
  redirect(`/pourquoi?merci=1&k=${kind}${/trouvé/i.test(reason) ? "&r=trouve" : ""}`);
}
