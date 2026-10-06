import { ProgrammaticPage, programmaticMetadata } from "@/components/seo/ProgrammaticPage";

// /stage/[metier] (France entière) ou /stage/[ville] (tous métiers) -- les
// slugs métier sont une liste fermée (lib/seo/metiers.ts), tout le reste
// est cherché parmi les villes.
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  return programmaticMetadata({ type: "stage", slug, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  return <ProgrammaticPage type="stage" slug={slug} pageParam={page} />;
}
