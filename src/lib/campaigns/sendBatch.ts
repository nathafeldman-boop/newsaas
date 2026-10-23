import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { unsubscribeHeaders } from "@/lib/resend/unsubscribe";
import {
  BATCH_SIZE,
  MAX_SENT_PER_24H,
  NEWS_VARIANTS,
  audienceTime,
  loadAudience,
  loadCatalog,
  renderForCampaign,
  type CampaignDef,
  type NewsVariant,
} from "@/lib/campaigns/relanceOffres";
import { allocateVariants, loadVariantCounts } from "@/lib/campaigns/newsTest";

// Envoi du lot suivant d'une campagne de relance : depuis /admin/relance
// (bouton) ou tout seul (cron relance-nouveautes, 23/10, demande de
// Nathan : « relance toi-même »). Mêmes garde-fous dans les deux cas.

// Pas de repli sur onboarding@resend.dev comme les autres emails : cette
// adresse de test ne délivre qu'au propriétaire du compte Resend, une
// campagne partie de là échouerait en silence pour tout le monde.
export function campaignSender(): string | null {
  const from = process.env.RESEND_FROM_EMAIL;
  return from ? `Stageio <${from}>` : null;
}

export type BatchResult =
  | { kind: "no_sender" }
  | { kind: "limit" }
  | { kind: "done" }
  | { kind: "sent"; sent: number; left: number; failures: string[] };

export async function sendNextCampaignBatch(campaign: CampaignDef, batchSize = BATCH_SIZE): Promise<BatchResult> {
  const from = campaignSender();
  if (!from) return { kind: "no_sender" };

  const db = createAdminClient();
  const audience = await loadAudience(db, campaign, audienceTime(campaign));
  const room = MAX_SENT_PER_24H - audience.sentLast24h;
  if (room <= 0) return { kind: "limit" };
  const batch = audience.eligible.slice(0, Math.min(batchSize, room));
  if (batch.length === 0) return { kind: "done" };

  // Relance « nouveautés » : chaque compte reçoit une des versions testées
  // (newsTest.ts), notée avec l'envoi pour compter les résultats par version.
  const isNews = campaign.id === "nouveautes";
  const [catalog, variantCounts] = await Promise.all([loadCatalog(db), isNews ? loadVariantCounts(db) : null]);
  const variantOf = new Map<string, NewsVariant>();
  if (variantCounts) {
    allocateVariants(variantCounts, batch.length).forEach((v, i) => variantOf.set(batch[i].id, v));
  }
  const resend = getResendClient();
  let sent = 0;
  const failures: string[] = [];

  // Lots de 100 (maximum de l'API batch de Resend). Chaque compte est noté
  // AVANT l'envoi, puis dé-noté si Resend refuse : en cas de panne au mauvais
  // moment, quelqu'un peut rater l'email, mais personne ne le reçoit deux
  // fois (le cron repasse toutes les heures, sans personne pour surveiller).
  // Clé d'idempotence par lot : un double envoi dans les 24 h ne part pas.
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const { data: reserved, error: reserveError } = await db
      .from("user_events")
      .insert(
        chunk.map((p) => {
          const variant = variantOf.get(p.id);
          return { user_id: p.id, event_type: campaign.event, metadata: variant ? { variant } : {} };
        }),
      )
      .select("id, user_id");
    if (reserveError || !reserved) {
      failures.push(`Base indisponible, rien envoyé : ${reserveError?.message ?? "réponse vide"}`);
      break;
    }
    const reservedIdByUser = new Map(reserved.map((r) => [r.user_id, r.id]));
    const release = async (userIds: string[]) => {
      const ids = userIds.map((u) => reservedIdByUser.get(u)).filter((id): id is string => Boolean(id));
      if (ids.length === 0) return;
      const { error: deleteError } = await db.from("user_events").delete().in("id", ids);
      if (deleteError) console.error("relance: dé-notage en échec (ces comptes ne seront pas relancés)", deleteError);
    };

    const payload = chunk.map((p) => {
      const variant = variantOf.get(p.id);
      const email = renderForCampaign(campaign, p, catalog, variant);
      return {
        from,
        to: p.email as string,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: unsubscribeHeaders(p.id),
        tags: [{ name: "campaign", value: campaign.tag }, ...(variant ? [{ name: "variant", value: variant }] : [])],
      };
    });

    const { data, error } = await resend.batch.send(payload, {
      batchValidation: "permissive",
      idempotencyKey: `${campaign.tag}-${chunk[0].id}-${chunk[chunk.length - 1].id}`,
    });
    if (error || !data) {
      await release(chunk.map((p) => p.id));
      failures.push(error?.message ?? "réponse vide de Resend");
      break;
    }

    // En mode permissif, Resend renvoie à part l'index des refusés (adresse
    // invalide…) : ceux-là sont dé-notés.
    const rejected = (data.errors ?? []).map((e) => chunk[e.index]).filter(Boolean);
    await release(rejected.map((p) => p.id));
    for (const e of data.errors ?? []) failures.push(`${chunk[e.index]?.email}: ${e.message}`);
    sent += chunk.length - rejected.length;
  }

  return { kind: "sent", sent, left: audience.eligible.length - sent, failures };
}

// Copie de test : l'email tel que le recevra le compte éligible le plus
// récent (vrais chiffres), envoyé à une adresse de contrôle, sans rien noter.
// Relance « nouveautés » : une copie de chaque version testée.
export async function sendCampaignCopy(
  campaign: CampaignDef,
  to: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const from = campaignSender();
  if (!from) return { ok: false, reason: "RESEND_FROM_EMAIL manquant dans Vercel : rien envoyé." };
  const db = createAdminClient();
  const isNews = campaign.id === "nouveautes";
  const [audience, catalog] = await Promise.all([
    loadAudience(db, campaign, audienceTime(campaign)),
    loadCatalog(db),
  ]);
  const sample = audience.eligible[0];
  if (!sample) return { ok: false, reason: "Aucun compte éligible pour construire l'aperçu." };
  const variants: (NewsVariant | undefined)[] = isNews ? [...NEWS_VARIANTS] : [undefined];
  for (const variant of variants) {
    const email = renderForCampaign(campaign, sample, catalog, variant);
    const { error } = await getResendClient().emails.send({
      from,
      to,
      subject: `[TEST${variant ? ` ${variant.toUpperCase()}` : ""}] ${email.subject}`,
      html: email.html,
      text: email.text,
      tags: [{ name: "campaign", value: `${campaign.tag}_test` }],
    });
    if (error) return { ok: false, reason: `Resend a refusé le test : ${error.message}` };
  }
  return { ok: true };
}
