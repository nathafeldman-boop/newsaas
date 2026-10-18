import { getResendClient } from "@/lib/resend/client";
import { SITE_URL } from "@/lib/site";
import { unsubscribeFooterHtml, unsubscribeHeaders } from "@/lib/resend/unsubscribe";

// Relance pour un compte qui a cliqué sur un plan Premium (un client Stripe
// a été créé, voir getOrCreateStripeCustomer dans premium/actions.ts) mais
// n'a jamais terminé le paiement -- la session Stripe elle-même expire
// après 24h, donc on renvoie vers /premium pour recommencer plutôt que vers
// un lien de paiement qui ne marcherait plus. Jamais de remise/promo
// inventée ici : pas demandé, décision tarifaire qui revient à Nathan.
export async function notifyCheckoutAbandoned(email: string, fullName: string | null, profileId: string) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: email,
    subject: "Tu n'as pas terminé ton passage Premium sur Stageio",
    html: `<p>Salut${fullName ? ` ${fullName}` : ""},</p>
<p>Tu as commencé à passer Premium sur Stageio mais le paiement n'a pas abouti -- ça arrive, rien n'a été débité.</p>
<p>Premium débloque : liker/mettre en favori, candidater sans limite, une lettre de motivation générée par IA pour chaque offre, et un audit de ton CV noté sur 100.</p>
<p><a href="${SITE_URL}/premium">Terminer mon passage Premium</a></p>
${unsubscribeFooterHtml(profileId)}`,
    headers: unsubscribeHeaders(profileId),
  });
}

// Relance automatique 10 min après l'ouverture du paiement Stripe sans achat
// (17/10, Nathan : « que pour ceux qui sont arrivés sur le checkout »,
// SOP 12 « mail de récupération à J+10 minutes »). Programmée chez Resend au
// moment où la session Stripe est créée, annulée par le webhook si le
// paiement aboutit avant (cancelCheckoutReminders). Pointe vers la MÊME
// session Stripe (valable 24 h) : un clic et il reprend où il s'était
// arrêté. Sans remise : Nathan ne touche pas aux prix.
export const CHECKOUT_REMINDER_DELAY_MS = 10 * 60 * 1000;

export async function scheduleCheckoutReminder(params: {
  email: string;
  fullName: string | null;
  profileId: string;
  checkoutUrl: string;
  lifetime: boolean;
}): Promise<string | null> {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const firstName = params.fullName?.trim().split(/\s+/)[0] || null;
  const plan = params.lifetime ? "l'accès à vie (39,99 €, une seule fois)" : "Premium (7,99 €/mois, sans engagement)";

  const { data, error } = await resend.emails.send({
    from: `Stageio <${fromEmail}>`,
    to: params.email,
    subject: "Tu y étais presque 👀",
    scheduledAt: new Date(Date.now() + CHECKOUT_REMINDER_DELAY_MS).toISOString(),
    html: `<p>Salut${firstName ? ` ${firstName}` : ""},</p>
<p>Tu étais à deux doigts de débloquer ${plan}. Le paiement n'a pas été finalisé : rien n'a été débité.</p>
<p>Ce qui t'attend :</p>
<ul>
<li>Toutes les offres en clair : entreprise, analyse, description</li>
<li>Ta lettre de motivation sur mesure en quelques secondes, pour chaque offre</li>
<li>Likes, favoris et candidatures illimités</li>
</ul>
<p><a href="${params.checkoutUrl}"><strong>Reprendre là où je me suis arrêté →</strong></a></p>
<p style="color:#666;font-size:13px">Le lien reste valable 24 h. Après, tu peux repasser par <a href="${SITE_URL}/premium">stageio.fr/premium</a>.</p>
${unsubscribeFooterHtml(params.profileId)}`,
    headers: unsubscribeHeaders(params.profileId),
  });
  if (error) {
    console.error("scheduleCheckoutReminder failed", error);
    return null;
  }
  return data?.id ?? null;
}

export async function cancelCheckoutReminders(emailIds: string[]): Promise<void> {
  if (emailIds.length === 0) return;
  const resend = getResendClient();
  // Déjà parti ou déjà annulé : Resend refuse, sans conséquence.
  await Promise.all(emailIds.map((id) => resend.emails.cancel(id).catch(() => null)));
}
