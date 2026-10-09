import { UrgentOffersPage, urgentOffersMetadata } from "@/components/seo/UrgentOffersPage";

// Voir components/seo/UrgentOffersPage.tsx.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return urgentOffersMetadata("stage");
}

export default async function Page() {
  return <UrgentOffersPage type="stage" />;
}
