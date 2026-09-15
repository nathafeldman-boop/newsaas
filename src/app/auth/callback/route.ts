import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachReferralIfNeeded } from "@/lib/referrals/attachReferral";
import { notifyReferrerOfNewSignup } from "@/lib/resend/notifyReferrer";

// Échange le code renvoyé par le lien de confirmation email / le retour
// OAuth (Google) contre une session, puis redirige vers `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ref = searchParams.get("ref");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        try {
          if (ref) {
            await attachReferralIfNeeded(data.user.id, ref);
          }
          await notifyReferrerOfNewSignup(data.user.id);
        } catch {
          // best-effort : un souci de parrainage/email ne doit pas casser la connexion
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
