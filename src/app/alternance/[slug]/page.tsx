import { ProgrammaticPage, programmaticMetadata } from "@/components/seo/ProgrammaticPage";

// /alternance/[metier] (France entière) ou /alternance/[ville] (tous métiers) -- les
// slugs métier sont une liste fermée (lib/seo/metiers.ts), tout le reste
// est cherché parmi les villes.
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  return programmaticMetadata({ type: "alternance", slug, pageParam: page });
}

export default async function Page({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  return <ProgrammaticPage type="alternance" slug={slug} pageParam={page} />;
}
