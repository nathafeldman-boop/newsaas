import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachReferralIfNeeded } from "@/lib/referrals/attachReferral";
import { attachAffiliateIfNeeded } from "@/lib/affiliates/attachAffiliate";
import { notifyReferrerOfNewSignup } from "@/lib/resend/notifyReferrer";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";

// Échange le code renvoyé par le lien de confirmation email / le retour
// OAuth (Google) contre une session, puis redirige vers `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ref = searchParams.get("ref");
  const aff = searchParams.get("aff");
  // Un endpoint GET public reste appelable directement avec n'importe quel
  // `next` forgé, indépendamment de ce que LoginForm/GoogleButton envoient
  // normalement -- ne jamais faire confiance à la seule validation côté
  // appelant. safeRedirectPath rejette aussi une valeur malformée qui
  // ferait planter NextResponse.redirect (ex: on a vu une valeur non
  // relative faire échouer la construction de l'URL de redirection).
  const next = safeRedirectPath(searchParams.get("next"), "/onboarding");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        try {
          if (ref) {
            await attachReferralIfNeeded(data.user.id, ref);
          }
          if (aff) {
            await attachAffiliateIfNeeded(data.user.id, aff);
          }
          await notifyReferrerOfNewSignup(data.user.id);
        } catch {
          // best-effort : un souci de parrainage/affiliation/email ne doit pas casser la connexion
        }
        // supabase-js ne throw jamais sur une erreur Postgres -- ce try/catch
        // n'attrape donc rien de ce genre ; on vérifie le résultat directement
        // à la place (toujours best-effort : jamais bloquant pour la connexion).
        const { error: loginEventError } = await supabase
          .from("user_events")
          .insert({ user_id: data.user.id, event_type: "login" });
        if (loginEventError) {
          console.error("auth/callback: login event insert failed", loginEventError, { userId: data.user.id });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
