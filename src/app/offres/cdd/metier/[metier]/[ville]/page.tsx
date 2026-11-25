import { ContractMetierPage, contractMetierMetadata } from "@/components/offers/ContractMetierPage";
import { parsePageParam } from "@/lib/seo/pagination";

// /offres/cdd/metier/[metier]/[ville] (25/11) : « CDD de vendeur à Lyon ».
type Props = { params: Promise<{ metier: string; ville: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ metier, ville }, { page }] = await Promise.all([params, searchParams]);
  return contractMetierMetadata("cdd", metier, ville, parsePageParam(page));
}

export default async function Page({ params, searchParams }: Props) {
  const [{ metier, ville }, { page }] = await Promise.all([params, searchParams]);
  return <ContractMetierPage type="cdd" metier={metier} city={ville} page={parsePageParam(page)} />;
}
