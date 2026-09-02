import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback dédié à la connexion Gmail (distinct de /auth/callback utilisé
// pour l'inscription/connexion) : capture provider_token/provider_refresh_token
// renvoyés par Supabase juste après l'échange OAuth — Supabase ne les
// conserve pas au-delà de cette réponse, donc c'est le seul moment où on
// peut les récupérer pour les stocker nous-mêmes.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/profil?gmail=error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/profil?gmail=error`);
  }

  const refreshToken = data.session.provider_refresh_token;
  if (!refreshToken) {
    // Pas de refresh_token renvoyé (arrive si l'utilisateur avait déjà
    // consenti sans access_type=offline auparavant) : rien à stocker.
    return NextResponse.redirect(`${origin}/profil?gmail=no_refresh_token`);
  }

  const { error: upsertError } = await supabase
    .from("email_connections")
    .upsert(
      {
        user_id: data.user.id,
        provider: "gmail",
        email_address: data.user.email ?? "",
        refresh_token: refreshToken,
        last_synced_at: null,
      },
      { onConflict: "user_id,provider" },
    );

  if (upsertError) {
    return NextResponse.redirect(`${origin}/profil?gmail=error`);
  }

  return NextResponse.redirect(`${origin}/profil?gmail=connected`);
}
