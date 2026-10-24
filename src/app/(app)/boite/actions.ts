"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateInboxAddress } from "@/lib/inbox/address";
import { getResendClient } from "@/lib/resend/client";
import { studentSender } from "@/lib/inbox/sender";

// Répondre à un recruteur depuis la boîte Stageio : part au nom de
// l'étudiant, la suite de l'échange revient dans la boîte (Reply-To).
export async function replyInboxMessageAction(messageId: string, formData: FormData) {
  const text = String(formData.get("reply") ?? "").trim();
  if (!text) redirect(`/boite/${messageId}?envoi=vide`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/boite");

  const { data: message } = await supabase
    .from("inbox_messages")
    .select("id, direction, from_address, to_address, subject, offer_id")
    .eq("id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!message || message.direction !== "in") redirect("/boite");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const fromAddress = await getOrCreateInboxAddress(admin, user.id, profile?.full_name ?? null);
  if (!fromAddress) redirect(`/boite/${messageId}?envoi=erreur`);

  const name = profile?.full_name?.trim() || null;
  const subject = message.subject?.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject ?? ""}`.trim();
  const { error } = await getResendClient().emails.send({
    ...studentSender(name, fromAddress),
    to: message.from_address,
    subject,
    text,
  });
  if (error) {
    console.error("boite: réponse non envoyée", error);
    redirect(`/boite/${messageId}?envoi=erreur`);
  }

  await admin.from("inbox_messages").insert({
    user_id: user.id,
    direction: "out",
    from_address: fromAddress,
    from_name: name,
    to_address: message.from_address,
    subject,
    body_text: text,
    offer_id: message.offer_id,
    read_at: new Date().toISOString(),
  });
  redirect(`/boite/${messageId}?envoi=ok`);
}
