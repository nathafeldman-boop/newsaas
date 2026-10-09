import { OfferPeriodPage, offerPeriodMetadata } from "@/components/seo/OfferPeriodPage";
import { parsePageParam } from "@/lib/seo/pagination";

// Voir components/seo/OfferPeriodPage.tsx. Données en cache 1 h.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  return offerPeriodMetadata("stage/janvier-2027", parsePageParam((await searchParams).page));
}

export default async function Page({ searchParams }: Props) {
  return <OfferPeriodPage periodKey="stage/janvier-2027" page={parsePageParam((await searchParams).page)} />;
}
