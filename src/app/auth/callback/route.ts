import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyReferrerOfNewSignup } from "@/lib/resend/notifyReferrer";

// Échange le code renvoyé par le lien de confirmation email / lien magique
// contre une session, puis redirige vers `next` (par défaut l'onboarding).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        try {
          await notifyReferrerOfNewSignup(data.user.id);
        } catch {
          // best-effort : un email de parrainage raté ne doit pas casser la connexion
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
