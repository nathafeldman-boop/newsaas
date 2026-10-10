import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

// Lien de désabonnement un clic, présent dans tout email marketing (campagne
// de relance des inactifs -- voir cron/inactive-winback) : pas
// d'authentification requise, sinon quelqu'un qui n'est plus connecté (ou
// plus du tout, cas typique d'un inactif) ne pourrait jamais s'en servir.
// "u" est l'id du profil (UUID v4, non devinable) -- pas de token séparé à
// générer/stocker pour un usage aussi ponctuel. Réutilise notify_new_offers
// (déjà le seul réglage "on m'envoie des emails" existant, visible dans
// /profil) plutôt que d'ajouter un readonly flag marketing séparé -- se
// désabonner d'ici coupe aussi les alertes nouvelles offres, ce qui est le
// comportement attendu pour quelqu'un qui ne veut plus être sollicité.
async function unsubscribe(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ notify_new_offers: false })
    .eq("id", userId);
  if (error) {
    console.error("unsubscribe: update failed", error, { userId });
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  const ok = await unsubscribe(request.nextUrl.searchParams.get("u"));
  return NextResponse.redirect(`${SITE_URL}/desabonnement?ok=${ok ? 1 : 0}`);
}

// Désabonnement en un clic depuis la messagerie (en-têtes List-Unsubscribe
// et List-Unsubscribe-Post, RFC 8058) : Gmail, Yahoo ou Outlook envoient un
// POST sur la même URL, sans suivre de redirection.
export async function POST(request: NextRequest) {
  const ok = await unsubscribe(request.nextUrl.searchParams.get("u"));
  return new NextResponse(null, { status: ok ? 200 : 400 });
}
