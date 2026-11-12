import { ContractCityPage, contractCityMetadata } from "@/components/offers/ContractCityPage";
import { parsePageParam } from "@/lib/seo/pagination";

// /offres/cdi/[ville] : « CDI débutant à Lyon » (voir ContractCityPage).
type Props = { params: Promise<{ ville: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ ville }, { page }] = await Promise.all([params, searchParams]);
  return contractCityMetadata("cdi", ville, parsePageParam(page));
}

export default async function Page({ params, searchParams }: Props) {
  const [{ ville }, { page }] = await Promise.all([params, searchParams]);
  return <ContractCityPage type="cdi" slug={ville} page={parsePageParam(page)} />;
}
