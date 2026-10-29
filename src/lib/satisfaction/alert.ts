import { getResendClient } from "@/lib/resend/client";
import { escapeHtml } from "@/lib/alerts/offerAlert";
import { SITE_URL } from "@/lib/site";
import { SCORE_LABELS } from "@/lib/satisfaction/survey";

// Client mécontent (note 1 ou 2 à la question de satisfaction) : email aux
// admins (ADMIN_EMAILS) pour lui répondre soi-même, vite. Répondre à un
// client mécontent change souvent son avis ; ne rien faire le fait partir.
export async function alertUnhappyCustomer(p: { userId: string; email: string | null; name: string | null; score: number; comment: string | null; moment: string }) {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (admins.length === 0) return;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const who = p.name ? `${escapeHtml(p.name)} (${escapeHtml(p.email ?? "sans email")})` : escapeHtml(p.email ?? "un abonné");
  await getResendClient().emails.send({
    from: `Stageio <${fromEmail}>`,
    to: admins,
    ...(p.email ? { replyTo: p.email } : {}),
    subject: `😟 Abonné mécontent : ${p.score}/5 (${SCORE_LABELS[p.score] ?? ""})`,
    html: `<p>${who} a répondu <strong>${p.score}/5</strong> à « Stageio t'aide dans ta recherche ? » (${escapeHtml(p.moment)}).</p>
${p.comment ? `<blockquote style="border-left:3px solid #ccc;margin:0;padding:6px 12px">${escapeHtml(p.comment).replace(/\n/g, "<br>")}</blockquote>` : "<p>(Pas de commentaire.)</p>"}
<p>Réponds directement à cet email : la réponse part à l'abonné. Sa fiche : <a href="${SITE_URL}/admin/users/${p.userId}">${SITE_URL}/admin/users/${p.userId}</a></p>`,
  });
}
