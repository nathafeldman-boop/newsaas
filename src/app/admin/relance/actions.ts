"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import {
  BATCH_SIZE,
  CAMPAIGN_EVENT,
  CAMPAIGN_TAG,
  MAX_SENT_PER_24H,
  countForProfile,
  loadAudience,
  loadCatalog,
  renderCampaignEmail,
} from "@/lib/campaigns/relanceOffres";
import { unsubscribeHeaders } from "@/lib/resend/unsubscribe";

// Pas de repli sur onboarding@resend.dev comme les autres emails : cette
// adresse de test ne délivre qu'au propriétaire du compte Resend, une
// campagne partie de là échouerait en silence pour tout le monde.
function senderAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL;
  return from ? `Stageio <${from}>` : null;
}

function back(message: string, ok: boolean): never {
  redirect(`/admin/relance?${ok ? "ok" : "erreur"}=${encodeURIComponent(message)}`);
}

export async function sendCampaignTestAction(formData: FormData) {
  await assertAdminSession();
  const to = String(formData.get("to") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) back("Adresse de test invalide.", false);
  const from = senderAddress();
  if (!from) back("RESEND_FROM_EMAIL manquant dans Vercel : rien envoyé.", false);

  const db = createAdminClient();
  const [audience, catalog] = await Promise.all([loadAudience(db), loadCatalog(db)]);
  const sample = audience.eligible[0];
  if (!sample) back("Aucun compte éligible pour construire l'aperçu.", false);

  const email = renderCampaignEmail(sample, countForProfile(catalog, sample), catalog.offers.length);
  const { error } = await getResendClient().emails.send({
    from,
    to,
    subject: `[TEST] ${email.subject}`,
    html: email.html,
    text: email.text,
    tags: [{ name: "campaign", value: `${CAMPAIGN_TAG}_test` }],
  });
  if (error) back(`Resend a refusé le test : ${error.message}`, false);
  back(`Test envoyé à ${to} (rendu du compte éligible le plus récent).`, true);
}

export async function sendCampaignBatchAction() {
  await assertAdminSession();
  const from = senderAddress();
  if (!from) back("RESEND_FROM_EMAIL manquant dans Vercel : rien envoyé.", false);

  const db = createAdminClient();
  const audience = await loadAudience(db);
  const room = MAX_SENT_PER_24H - audience.sentLast24h;
  if (room <= 0) {
    back(`Limite du jour atteinte (${MAX_SENT_PER_24H} en 24 h) : reprends demain.`, false);
  }
  const batch = audience.eligible.slice(0, Math.min(BATCH_SIZE, room));
  if (batch.length === 0) back("Plus personne à relancer : campagne terminée.", true);

  const catalog = await loadCatalog(db);
  const resend = getResendClient();
  let sent = 0;
  const failures: string[] = [];

  // Lots de 100 (maximum de l'API batch de Resend). Clé d'idempotence par
  // lot : un double clic ou une relance dans les 24 h ne renvoie rien.
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const payload = chunk.map((p) => {
      const email = renderCampaignEmail(p, countForProfile(catalog, p), catalog.offers.length);
      return {
        from,
        to: p.email as string,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: unsubscribeHeaders(p.id),
        tags: [{ name: "campaign", value: CAMPAIGN_TAG }],
      };
    });

    const { data, error } = await resend.batch.send(payload, {
      batchValidation: "permissive",
      idempotencyKey: `${CAMPAIGN_TAG}-${chunk[0].id}-${chunk[chunk.length - 1].id}`,
    });
    if (error || !data) {
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }

    // En mode permissif, Resend renvoie les ids des emails acceptés dans
    // l'ordre, et l'index des refusés (adresse invalide…) à part.
    const rejected = new Set((data.errors ?? []).map((e) => e.index));
    const ids = data.data ?? [];
    let next = 0;
    const rows = [];
    for (let j = 0; j < chunk.length; j++) {
      if (rejected.has(j)) continue;
      rows.push({
        user_id: chunk[j].id,
        event_type: CAMPAIGN_EVENT,
        metadata: { email_id: ids[next]?.id ?? null },
      });
      next++;
    }
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.email}: ${e.message}`);

    const { error: insertError } = await db.from("user_events").insert(rows);
    if (insertError) {
      // Emails partis mais non notés : on s'arrête là pour ne jamais les
      // renvoyer au prochain clic sans que Nathan le sache.
      console.error("relance: envoi noté en échec", insertError);
      failures.push(`Envoyés mais non notés (${rows.length}) : ${insertError.message}. Ne relance pas avant vérification.`);
      sent += rows.length;
      break;
    }
    sent += rows.length;
  }

  const left = audience.eligible.length - sent;
  const summary = `${sent} emails envoyés, ${left} restants.`;
  if (failures.length > 0) back(`${summary} Problèmes : ${failures.slice(0, 5).join(" · ")}`, false);
  back(summary, true);
}
