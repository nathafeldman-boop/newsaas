import { DepartementPage, departementMetadata } from "@/components/seo/DepartementPage";

// /stage/departement/[dep] : toutes les offres du département ("stage hauts-de-seine").
type Props = { params: Promise<{ dep: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ dep }, { page }] = await Promise.all([params, searchParams]);
  return departementMetadata({ type: "stage", dep, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ dep }, { page }] = await Promise.all([params, searchParams]);
  return <DepartementPage type="stage" dep={dep} pageParam={page} />;
}
