import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Présence « en ligne » pour l'admin (16/10, Nathan : un nouvel inscrit
// n'apparaissait en ligne qu'au bout de 3 à 5 min). (app)/layout.tsx ne
// note la présence qu'au chargement complet d'une page de l'appli -- rien
// pendant l'onboarding, ni pendant la navigation interne. PresencePing
// appelle cette route à l'arrivée, à chaque changement de page et toutes
// les 45 s tant que l'onglet est visible.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 204 });

  const body = (await request.json().catch(() => null)) as { path?: string } | null;
  const path = typeof body?.path === "string" ? body.path.slice(0, 200) : null;
  const now = new Date().toISOString();

  // Deux mises à jour séparées, comme dans (app)/layout.tsx : la présence ne
  // doit jamais dépendre de la colonne annexe last_active_path.
  const { error } = await supabase.from("profiles").update({ last_active_at: now }).eq("id", user.id);
  if (error) console.error("presence: last_active_at update failed", error);
  if (path) {
    const { error: pathError } = await supabase.from("profiles").update({ last_active_path: path }).eq("id", user.id);
    if (pathError) console.error("presence: last_active_path update failed", pathError);
  }
  return new NextResponse(null, { status: 204 });
}
