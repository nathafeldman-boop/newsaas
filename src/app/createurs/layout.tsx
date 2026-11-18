import { currentCreator } from "@/lib/creators/access";
import { CREATOR_ACCENTS } from "@/lib/creators/accents";

// Espace créateurs (18/11) : même thème sombre que l'admin, couleur au choix.
export default async function CreatorsLayout({ children }: { children: React.ReactNode }) {
  const session = await currentCreator();
  const accent = CREATOR_ACCENTS.some((a) => a.id === session?.creator.accent) ? session!.creator.accent : "violet";
  return (
    <div className="admin-dark creator-space" data-accent={accent}>
      {children}
    </div>
  );
}
