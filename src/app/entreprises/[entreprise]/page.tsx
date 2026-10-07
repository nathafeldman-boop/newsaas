import { permanentRedirect } from "next/navigation";
import { CompanyPage, companyMetadata } from "@/components/seo/CompanyPage";
import { getCompanyIndex } from "@/lib/seo/companyIndex";

// "alternance decathlon", "stage edf" : une page par entreprise qui a au
// moins 3 offres actives (indexée à partir de 10), alternance et stage confondus.
type Props = { params: Promise<{ entreprise: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ entreprise }, { page }] = await Promise.all([params, searchParams]);
  return companyMetadata(entreprise, page);
}

export default async function Page({ params, searchParams }: Props) {
  const [{ entreprise }, { page }] = await Promise.all([params, searchParams]);
  // Variante fusionnée ("adecco-france") : 308 vers la page de l'entreprise.
  const target = (await getCompanyIndex()).aliases[entreprise];
  if (target) permanentRedirect(`/entreprises/${target}`);
  return <CompanyPage slug={entreprise} pageParam={page} />;
}
