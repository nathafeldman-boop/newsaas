import { ContractMetierPage, contractMetierMetadata } from "@/components/offers/ContractMetierPage";
import { parsePageParam } from "@/lib/seo/pagination";

// /offres/cdi/metier/[metier]/[ville] (25/11) : « CDI de vendeur à Lyon ».
type Props = { params: Promise<{ metier: string; ville: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ metier, ville }, { page }] = await Promise.all([params, searchParams]);
  return contractMetierMetadata("cdi", metier, ville, parsePageParam(page));
}

export default async function Page({ params, searchParams }: Props) {
  const [{ metier, ville }, { page }] = await Promise.all([params, searchParams]);
  return <ContractMetierPage type="cdi" metier={metier} city={ville} page={parsePageParam(page)} />;
}
