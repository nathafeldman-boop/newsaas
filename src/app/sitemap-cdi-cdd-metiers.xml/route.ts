import { CONTRACT_METIER_INDEXABLE_MIN, contractMetierPath, getContractMetierIndex } from "@/lib/offers/contractMetierSegments";
import { JOB_CONTRACTS } from "@/lib/offers/contractCitySegments";
import { urlsetXml, xmlResponse, type SitemapEntry } from "@/lib/seo/sitemapXml";

export const dynamic = "force-dynamic";

// Pages CDI et CDD par métier, et par métier et ville (25/11) : indexables seulement.
export async function GET() {
  const entries: SitemapEntry[] = [];
  for (const type of JOB_CONTRACTS) {
    const index = await getContractMetierIndex(type);
    for (const s of [...index.metiers, ...index.combos]) {
      if (s.count >= CONTRACT_METIER_INDEXABLE_MIN) entries.push({ path: contractMetierPath(type, s.metier, s.city) });
    }
  }
  return xmlResponse(urlsetXml(entries));
}
