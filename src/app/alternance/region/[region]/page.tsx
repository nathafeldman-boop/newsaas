import { RegionPage, regionMetadata } from "@/components/seo/DepartementPage";

// /alternance/region/[region] : toutes les offres de la région ("alternance bretagne").
type Props = { params: Promise<{ region: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ region }, { page }] = await Promise.all([params, searchParams]);
  return regionMetadata({ type: "alternance", region, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ region }, { page }] = await Promise.all([params, searchParams]);
  return <RegionPage type="alternance" region={region} pageParam={page} />;
}
