import { SchoolCityPageView, schoolCityMetadata } from "@/components/schoolStage/SchoolCityPage";

// /stage-de-premiere/[ville] (25/11) : offres et entreprises de la ville, relues une fois par jour.
export const revalidate = 86400;

type Props = { params: Promise<{ ville: string }> };

export async function generateMetadata({ params }: Props) {
  const { ville } = await params;
  return schoolCityMetadata("premiere", ville);
}

export default async function Page({ params }: Props) {
  const { ville } = await params;
  return <SchoolCityPageView level="premiere" slug={ville} />;
}
