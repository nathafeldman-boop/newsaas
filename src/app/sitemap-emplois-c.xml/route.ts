import { seoEmploisSitemapResponse } from "@/lib/seo/seoEmploisSitemap";

export const dynamic = "force-dynamic";

export function GET() {
  return seoEmploisSitemapResponse("c");
}
