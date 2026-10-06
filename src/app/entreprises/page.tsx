import { CompaniesHub, companiesHubMetadata } from "@/components/seo/CompanyPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return companiesHubMetadata();
}

export default function Page() {
  return <CompaniesHub />;
}
