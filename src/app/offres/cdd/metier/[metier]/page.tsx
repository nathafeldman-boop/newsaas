import { ContractMetierPage, contractMetierMetadata } from "@/components/offers/ContractMetierPage";
import { parsePageParam } from "@/lib/seo/pagination";

// /offres/cdd/metier/[metier] (25/11) : toutes les offres du métier en CDD.
type Props = { params: Promise<{ metier: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ metier }, { page }] = await Promise.all([params, searchParams]);
  return contractMetierMetadata("cdd", metier, null, parsePageParam(page));
}

export default async function Page({ params, searchParams }: Props) {
  const [{ metier }, { page }] = await Promise.all([params, searchParams]);
  return <ContractMetierPage type="cdd" metier={metier} city={null} page={parsePageParam(page)} />;
}
