import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ingestOffer } from "@/lib/mistral/ingestOffer";

// Endpoint pour brancher un script externe / cron d'ingestion Mistral.
// Protégé par un secret partagé (jamais exposé côté client).
//
// Une offre :
//   curl -X POST https://.../api/offers/ingest \
//     -H "Authorization: Bearer $INGEST_API_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"sourceUrl":"https://..."}'
//
// En lot (autant d'URLs que voulu, traitées séquentiellement) :
//   curl -X POST https://.../api/offers/ingest \
//     -H "Authorization: Bearer $INGEST_API_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"sourceUrls":["https://...","https://..."]}'

const bodySchema = z.object({
  sourceUrl: z.string().url().optional(),
  sourceUrls: z.array(z.string().url()).optional(),
  rawText: z.string().optional(),
  contractTypeHint: z.enum(["alternance", "stage"]).optional(),
});

export async function POST(request: NextRequest) {
  const secret = process.env.INGEST_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INGEST_API_SECRET non configuré côté serveur." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sourceUrl, sourceUrls, rawText, contractTypeHint } = parsed.data;

  if (!sourceUrl && !sourceUrls?.length && !rawText) {
    return NextResponse.json(
      { error: "Fournis sourceUrl, sourceUrls ou rawText." },
      { status: 400 },
    );
  }

  if (sourceUrls && sourceUrls.length > 0) {
    const results: { url: string; ok: boolean; title?: string; error?: string }[] = [];
    for (const url of sourceUrls) {
      try {
        const { offer } = await ingestOffer({ sourceUrl: url, contractTypeHint });
        results.push({ url, ok: true, title: offer.title });
      } catch (err) {
        results.push({
          url,
          ok: false,
          error: err instanceof Error ? err.message : "Erreur inconnue.",
        });
      }
    }
    return NextResponse.json({ results });
  }

  try {
    const { offer } = await ingestOffer({ sourceUrl, rawText, contractTypeHint });
    return NextResponse.json({ offer });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 },
    );
  }
}
