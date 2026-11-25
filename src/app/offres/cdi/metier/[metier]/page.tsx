import { ContractMetierPage, contractMetierMetadata } from "@/components/offers/ContractMetierPage";
import { parsePageParam } from "@/lib/seo/pagination";

// /offres/cdi/metier/[metier] (25/11) : toutes les offres du métier en CDI.
type Props = { params: Promise<{ metier: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ metier }, { page }] = await Promise.all([params, searchParams]);
  return contractMetierMetadata("cdi", metier, null, parsePageParam(page));
}

export default async function Page({ params, searchParams }: Props) {
  const [{ metier }, { page }] = await Promise.all([params, searchParams]);
  return <ContractMetierPage type="cdi" metier={metier} city={null} page={parsePageParam(page)} />;
}
