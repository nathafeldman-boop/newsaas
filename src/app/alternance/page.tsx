import { ProgrammaticHub, hubMetadata } from "@/components/seo/ProgrammaticPage";

// Hub de maillage : tous les métiers et villes qui ont une page. Rendu à la
// demande (l'index sous-jacent est en cache 1 h) plutôt qu'au build, pour
// qu'un build ne dépende jamais de la disponibilité de Supabase.
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return hubMetadata("alternance");
}

export default function Page() {
  return <ProgrammaticHub type="alternance" />;
}
