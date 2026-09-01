import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyReferrerOfNewSignup } from "@/lib/resend/notifyReferrer";

// Appelé côté client juste après une inscription avec session immédiate
// (email confirmation désactivée). Le cas "confirmation par email" est géré
// directement dans /auth/callback, côté serveur.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    await notifyReferrerOfNewSignup(user.id);
  } catch {
    // best-effort : un email de parrainage raté ne doit pas casser l'inscription
  }

  return NextResponse.json({ ok: true });
}
