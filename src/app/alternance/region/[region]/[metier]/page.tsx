import { RegionPage, regionMetadata } from "@/components/seo/DepartementPage";

// /alternance/region/[region]/[metier] : un métier dans une région.
type Props = { params: Promise<{ region: string; metier: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ region, metier }, { page }] = await Promise.all([params, searchParams]);
  return regionMetadata({ type: "alternance", region, metier, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ region, metier }, { page }] = await Promise.all([params, searchParams]);
  return <RegionPage type="alternance" region={region} metier={metier} pageParam={page} />;
}
