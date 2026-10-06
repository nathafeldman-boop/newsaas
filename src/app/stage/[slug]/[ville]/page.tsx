import { ProgrammaticPage, programmaticMetadata } from "@/components/seo/ProgrammaticPage";

// /stage/[metier]/[ville] : le cœur de la longue traîne ("stage commercial lyon").
type Props = { params: Promise<{ slug: string; ville: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug, ville }, { page }] = await Promise.all([params, searchParams]);
  return programmaticMetadata({ type: "stage", slug, ville, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ slug, ville }, { page }] = await Promise.all([params, searchParams]);
  return <ProgrammaticPage type="stage" slug={slug} ville={ville} pageParam={page} />;
}
