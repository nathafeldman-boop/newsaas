import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOfferLink, isCheckableUrl, type LinkVerdict } from "@/lib/offers/linkCheck";

// Bouton « Postuler sur le site » (26/11, Nathan : « je n'arrive pas à
// postuler, il n'y a que des erreurs 404 », le problème le plus fréquent).
// Le lien de la source est vérifié au moment du clic : s'il est mort (404,
// 410, « offre expirée », ou France Travail qui dit qu'elle n'existe plus),
// l'offre est retirée et l'étudiant revient sur sa candidature avec le
// message « offre retirée » au lieu d'une page d'erreur. Un doute (site lent
// ou bloqué) ne bloque jamais : on ouvre le lien.

const CHECK_MS = 5000;

export async function GET(request: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const back = new URL(`/candidature/${encodeURIComponent(offerId)}`, request.url);
  if (!/^[0-9a-f-]{36}$/i.test(offerId)) return NextResponse.redirect(back);

  const admin = createAdminClient();
  const { data: offer } = await admin.from("offers").select("id, source, external_id, apply_url, is_active").eq("id", offerId).maybeSingle();
  if (!offer || !isCheckableUrl(offer.apply_url)) return NextResponse.redirect(back);

  const verdict: LinkVerdict = await Promise.race([
    checkOfferLink(offer).catch((): LinkVerdict => "unknown"),
    new Promise<LinkVerdict>((resolve) => setTimeout(() => resolve("unknown"), CHECK_MS)),
  ]);

  if (verdict === "dead") {
    after(async () => {
      const { error } = await admin.from("offers").update({ is_active: false }).eq("id", offer.id);
      console.log("go: lien mort, offre retirée", JSON.stringify({ offerId: offer.id, source: offer.source, error: error?.message ?? null }));
    });
    back.searchParams.set("retiree", "1");
    return NextResponse.redirect(back);
  }
  return NextResponse.redirect(offer.apply_url);
}
