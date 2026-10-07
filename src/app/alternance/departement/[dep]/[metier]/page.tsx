import { DepartementPage, departementMetadata } from "@/components/seo/DepartementPage";

// /alternance/departement/[dep]/[metier] : un métier dans un département.
type Props = { params: Promise<{ dep: string; metier: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ dep, metier }, { page }] = await Promise.all([params, searchParams]);
  return departementMetadata({ type: "alternance", dep, metier, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ dep, metier }, { page }] = await Promise.all([params, searchParams]);
  return <DepartementPage type="alternance" dep={dep} metier={metier} pageParam={page} />;
}
