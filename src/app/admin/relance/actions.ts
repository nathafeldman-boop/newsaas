"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { MAX_SENT_PER_24H, campaignFrom, type CampaignId } from "@/lib/campaigns/relanceOffres";
import { sendCampaignCopy, sendNextCampaignBatch } from "@/lib/campaigns/sendBatch";

function back(message: string, ok: boolean, campaign: CampaignId): never {
  redirect(`/admin/relance?c=${campaign}&${ok ? "ok" : "erreur"}=${encodeURIComponent(message)}`);
}

export async function sendCampaignTestAction(formData: FormData) {
  await assertAdminSession();
  const campaign = campaignFrom(formData.get("c"));
  const to = String(formData.get("to") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) back("Adresse de test invalide.", false, campaign.id);
  const result = await sendCampaignCopy(campaign, to);
  if (!result.ok) back(result.reason, false, campaign.id);
  back(
    campaign.id === "nouveautes"
      ? `4 tests envoyés à ${to}, un par version (rendu du compte éligible le plus récent).`
      : `Test envoyé à ${to} (rendu du compte éligible le plus récent).`,
    true,
    campaign.id,
  );
}

export async function sendCampaignBatchAction(formData: FormData) {
  await assertAdminSession();
  const campaign = campaignFrom(formData.get("c"));
  const result = await sendNextCampaignBatch(campaign);
  if (result.kind === "no_sender") back("RESEND_FROM_EMAIL manquant dans Vercel : rien envoyé.", false, campaign.id);
  if (result.kind === "limit") {
    back(`Limite du jour atteinte (${MAX_SENT_PER_24H} en 24 h) : reprends demain.`, false, campaign.id);
  }
  if (result.kind === "done") back("Plus personne à relancer : campagne terminée.", true, campaign.id);
  const summary = `${result.sent} emails envoyés, ${result.left} restants.`;
  if (result.failures.length > 0) {
    back(`${summary} Problèmes : ${result.failures.slice(0, 5).join(" · ")}`, false, campaign.id);
  }
  back(summary, true, campaign.id);
}
