import type { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/resend/client";
import { campaignSender } from "@/lib/campaigns/sendBatch";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import type { Profile } from "@/types/database";

// Accueil juste après le paiement (29/10, Nathan : « fait tout ce qui peut
// augmenter la satisfaction client des premiums »). Les résiliations
// arrivent surtout tout de suite : 18 des 117 abonnements mensuels à 7,99 €
// résiliés en moins d'un jour, 31 en moins d'une semaine, motif « pas assez
// utilisé » en tête des motifs donnés (Stripe, 29/10). Un email personnel de
// Nathan, 3 étapes concrètes le jour même, ce qui se passe ensuite, et à qui
// répondre. Une fois par compte et par formule (Premium, Auto) ; envoyé par
// le webhook Stripe, rattrapé par le passage horaire des abonnés si le
// webhook n'est pas arrivé.

type Admin = ReturnType<typeof createAdminClient>;

export const WELCOME_EVENT = "premium_welcome_sent";
/** Rattrapage : comptes passés Premium depuis moins de 48 h, et après la mise en ligne. */
export const WELCOME_START = Date.parse("2026-10-29T16:00:00Z");
const CATCH_UP_MS = 48 * 3_600_000;

export type WelcomeTier = "premium" | "auto";

type WelcomeProfile = Pick<Profile, "id" | "full_name" | "looking_for" | "notify_new_offers" | "subscription_status">;

export function renderWelcomeEmail(profile: WelcomeProfile, tier: WelcomeTier) {
  const first = profile.full_name?.trim().split(/\s+/)[0] ?? null;
  const hello = first ? `Salut ${escapeHtml(first)},` : "Salut,";
  const goal = profile.looking_for.length === 0 || profile.looking_for.includes("alternance") ? "ton alternance" : "ton stage";
  const utm = "utm_source=email&utm_medium=abonnes&utm_campaign=bienvenue";
  const link = (path: string) => `${SITE_URL}${path}${path.includes("?") ? "&" : "?"}${utm}`;
  const product = tier === "auto" ? "Stageio Auto" : "Premium";
  const lifetime = profile.subscription_status === "lifetime";

  const steps: { title: string; text: string; cta: string; path: string }[] =
    tier === "auto"
      ? [
          { title: "Ton CV et ton téléphone", text: "ils partent avec chaque candidature : vérifie qu'ils sont à jour.", cta: "Mon CV", path: "/cv" },
          { title: "Tes premiers likes", text: `chaque like envoie ta candidature, lettre et CV, jusqu'à ${AUTO_DAILY_LIMIT} par jour.`, cta: "Swiper", path: "/swipe" },
          { title: "Ta boîte Stageio", text: "les réponses des recruteurs y arrivent. Jette un œil chaque jour.", cta: "Ma boîte", path: "/boite" },
        ]
      : [
          { title: "Ton CV vérifié", text: "ajoute-le et lance l'audit : il te dit quoi corriger avant d'envoyer.", cta: "Mon CV", path: "/cv" },
          { title: "Tes 3 premières candidatures", text: "dans «\u00a0Prêt à postuler\u00a0», la lettre de motivation est déjà écrite pour chaque offre. Tu relis, tu envoies.", cta: "Prêt à postuler", path: "/dashboard" },
          {
            title: "Tes alertes",
            text:
              profile.notify_new_offers === false
                ? "active-les : une offre qui te correspond vraiment, tu la reçois dans l'heure (en journée), avant les autres."
                : "une offre qui te correspond vraiment, tu la reçois dans l'heure (en journée), avant les autres. Elles sont activées : garde-les.",
            cta: "Mon profil",
            path: "/profil",
          },
        ];
  const next = [
    tier === "auto" ? "7 jours sans réponse après une candidature\u00a0: on relance pour toi." : "7 jours sans réponse après une candidature\u00a0: on te le rappelle.",
    "Une offre ne fonctionne plus ? Signale-la depuis ta candidature : on la vérifie et on la retire.",
    "Les entreprises qui recrutent près de chez toi, même sans annonce : onglet «\u00a0Candidatures spontanées\u00a0».",
  ];
  const billing = lifetime
    ? "Accès à vie : paiement unique, aucun prélèvement à venir."
    : "Ton abonnement est sans engagement : tu le gères ou le résilies quand tu veux depuis ton Profil («\u00a0Gérer ou résilier mon abonnement\u00a0»).";

  const subject = `${first ? `${first}, b` : "B"}ienvenue dans ${product} : tes 3 premières étapes`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:520px">
<p>${hello}</p>
<p>Merci pour ta confiance ! Je suis Nathan, le fondateur de Stageio. Ton accès ${product} est actif.</p>
<p>Pour que ta recherche avance vite, fais ces 3 étapes aujourd'hui. Ça prend 10 minutes&nbsp;:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${steps
    .map(
      (s, i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;vertical-align:top;width:34px"><span style="display:inline-block;width:26px;height:26px;border-radius:13px;background:#0c7a44;color:#fff;font-weight:bold;text-align:center;line-height:26px">${i + 1}</span></td><td style="padding:10px 0;border-bottom:1px solid #eee"><strong>${s.title}</strong>&nbsp;: ${escapeHtml(s.text)}<br><a href="${link(s.path)}" style="color:#0c7a44;font-weight:bold;text-decoration:none">${s.cta} →</a></td></tr>`,
    )
    .join("")}</table>
<p style="margin:18px 0 6px"><strong>Ensuite, on s'occupe du reste&nbsp;:</strong></p>
<ul style="margin:0;padding-left:20px">${next.map((n) => `<li style="margin:0 0 4px">${escapeHtml(n)}</li>`).join("")}</ul>
<p style="font-weight:bold;margin:16px 0">🎯 Notre objectif : ${goal} en 2 mois maximum.</p>
<p>Un souci, une question ? Réponds à cet email : je lis tout et je réponds moi-même.</p>
<p>Nathan, fondateur de Stageio</p>
<p style="font-size:12px;color:#888;margin-top:24px">${escapeHtml(billing)}</p>
</div>`;
  const text = [
    first ? `Salut ${first},` : "Salut,",
    "",
    `Merci pour ta confiance ! Je suis Nathan, le fondateur de Stageio. Ton accès ${product} est actif.`,
    "",
    "Pour que ta recherche avance vite, fais ces 3 étapes aujourd'hui. Ça prend 10 minutes :",
    ...steps.map((s, i) => `${i + 1}. ${s.title} : ${s.text} ${link(s.path)}`),
    "",
    "Ensuite, on s'occupe du reste :",
    ...next.map((n) => `- ${n}`),
    "",
    `Notre objectif : ${goal} en 2 mois maximum.`,
    "",
    "Un souci, une question ? Réponds à cet email : je lis tout et je réponds moi-même.",
    "Nathan, fondateur de Stageio",
    "",
    billing,
  ].join("\n");
  return { subject, html, text };
}

/** Une fois par compte et par formule. Ne lève jamais : renvoie l'erreur. */
export async function sendWelcomeOnce(
  admin: Admin,
  profile: WelcomeProfile & Pick<Profile, "email">,
  tier: WelcomeTier,
): Promise<{ sent: boolean; error: string | null }> {
  try {
    const from = campaignSender();
    if (!from || !profile.email) return { sent: false, error: from ? null : "RESEND_FROM_EMAIL manquant" };
    const { data: already, error: readError } = await admin
      .from("user_events")
      .select("id")
      .eq("user_id", profile.id)
      .eq("event_type", WELCOME_EVENT)
      .contains("metadata", { tier })
      .limit(1);
    if (readError) return { sent: false, error: readError.message };
    if (already?.length) return { sent: false, error: null };
    const { error } = await getResendClient().emails.send(
      { from, to: profile.email, replyTo: CONTACT_EMAIL, ...renderWelcomeEmail(profile, tier), tags: [{ name: "campaign", value: "premium_welcome" }] },
      // Webhook livré deux fois en même temps, ou rattrapage pendant qu'il passe : un seul envoi.
      { idempotencyKey: `premium-welcome-${profile.id}-${tier}` },
    );
    if (error) return { sent: false, error: error.message };
    await admin.from("user_events").insert({ user_id: profile.id, event_type: WELCOME_EVENT, metadata: { tier } });
    return { sent: true, error: null };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Comptes à rattraper : passés Premium depuis moins de 48 h (et après WELCOME_START). */
export function welcomeCatchUpDue(profile: Pick<Profile, "premium_activated_at">, now: number): boolean {
  const at = profile.premium_activated_at ? Date.parse(profile.premium_activated_at) : NaN;
  return Number.isFinite(at) && at >= WELCOME_START && now - at < CATCH_UP_MS && now - at > 10 * 60_000;
}

export async function runWelcomeCatchUp(admin: Admin, subscribers: Profile[], tierOf: (p: Profile) => WelcomeTier, deadline: number, now: number) {
  const summary = { due: 0, sent: 0, failures: [] as string[] };
  for (const p of subscribers.filter((s) => welcomeCatchUpDue(s, now))) {
    if (Date.now() > deadline) break;
    summary.due++;
    const r = await sendWelcomeOnce(admin, p, tierOf(p));
    if (r.sent) summary.sent++;
    if (r.error) summary.failures.push(`${p.id} : ${r.error}`);
  }
  return summary;
}
