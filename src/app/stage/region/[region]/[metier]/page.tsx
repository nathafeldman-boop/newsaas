import { RegionPage, regionMetadata } from "@/components/seo/DepartementPage";

// /stage/region/[region]/[metier] : un métier dans une région.
type Props = { params: Promise<{ region: string; metier: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ region, metier }, { page }] = await Promise.all([params, searchParams]);
  return regionMetadata({ type: "stage", region, metier, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ region, metier }, { page }] = await Promise.all([params, searchParams]);
  return <RegionPage type="stage" region={region} metier={metier} pageParam={page} />;
}
