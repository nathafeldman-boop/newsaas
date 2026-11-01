import type { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPost, cityFrom, formatFullDate, sectorGroupFrom, visualRows } from "@/lib/linkedin/format";
import { fetchOffersByIds } from "@/lib/linkedin/data";
import { kindFrom } from "@/lib/linkedin/params";
import { sourceLine } from "@/lib/linkedin/rules";
import { renderLinkedinVisual } from "@/lib/linkedin/visual";

// Visuel d'une publication LinkedIn (image PNG). Les offres sont relues en
// base à partir de leurs identifiants : l'image ne montre jamais autre chose
// que ce que la base contient. Réservé à l'admin (cookie du code d'accès).
// ?dl=1 : téléchargement plutôt qu'affichage.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!(await hasAdminSession())) return new Response("Accès refusé.", { status: 401 });
  const params = request.nextUrl.searchParams;
  const kind = kindFrom(params.get("f"));
  const ids = (params.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 10);
  let offers;
  try {
    offers = await fetchOffersByIds(createAdminClient(), ids);
  } catch (err) {
    console.error("linkedin visuel: offres illisibles", err);
    return new Response("Base indisponible.", { status: 503 });
  }
  if (offers.length === 0) return new Response("Aucune offre.", { status: 404 });

  // Date de la publication (rouverte depuis l'historique : celle de sa préparation).
  const at = Number(params.get("at"));
  const now = Number.isFinite(at) && at > Date.now() - 400 * 86_400_000 && at <= Date.now() ? at : Date.now();
  const sector = sectorGroupFrom(params.get("s"));
  const city = cityFrom(params.get("v"));
  const target =
    kind === "sector" && sector
      ? { label: sector.label, landingPath: "/alternance", key: sector.slug }
      : kind === "city" && city
        ? { label: city.label, landingPath: "/alternance", key: city.slug }
        : null;
  const draft = buildPost({ kind, offers, now, target });

  const image = await renderLinkedinVisual({
    headline: draft.headline,
    subline: draft.subline,
    rows: visualRows(offers),
    dateLabel: `Offres actives au ${formatFullDate(now)}`,
    sources: sourceLine(offers),
  });
  const headers = new Headers({ "Content-Type": "image/png", "Cache-Control": "private, no-store" });
  if (params.get("dl") === "1") {
    const day = new Date(now).toISOString().slice(0, 10);
    headers.set("Content-Disposition", `attachment; filename="stageio-linkedin-${kind}-${day}.png"`);
  }
  return new Response(image.body, { headers });
}
