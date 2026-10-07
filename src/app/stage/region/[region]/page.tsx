import { RegionPage, regionMetadata } from "@/components/seo/DepartementPage";

// /stage/region/[region] : toutes les offres de la région ("stage bretagne").
type Props = { params: Promise<{ region: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ region }, { page }] = await Promise.all([params, searchParams]);
  return regionMetadata({ type: "stage", region, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ region }, { page }] = await Promise.all([params, searchParams]);
  return <RegionPage type="stage" region={region} pageParam={page} />;
}
