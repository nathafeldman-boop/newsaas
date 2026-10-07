import { DepartementPage, departementMetadata } from "@/components/seo/DepartementPage";

// /alternance/departement/[dep] : toutes les offres du département ("alternance hauts-de-seine").
type Props = { params: Promise<{ dep: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ dep }, { page }] = await Promise.all([params, searchParams]);
  return departementMetadata({ type: "alternance", dep, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ dep }, { page }] = await Promise.all([params, searchParams]);
  return <DepartementPage type="alternance" dep={dep} pageParam={page} />;
}
