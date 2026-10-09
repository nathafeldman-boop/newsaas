import { StagePeriodPage, stagePeriodMetadata } from "@/components/seo/StagePeriodPage";
import { parsePageParam } from "@/lib/seo/pagination";

// Voir components/seo/StagePeriodPage.tsx. Données en cache 1 h.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  return stagePeriodMetadata("fin-d-etudes", parsePageParam((await searchParams).page));
}

export default async function Page({ searchParams }: Props) {
  return <StagePeriodPage slug="fin-d-etudes" page={parsePageParam((await searchParams).page)} />;
}
