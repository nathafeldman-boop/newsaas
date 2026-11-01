import { hasAdminSession } from "@/lib/admin/accessCode";
import { getPost } from "@/lib/linkedin/posts";
import { renderLinkedinVisual, visualFileName } from "@/lib/linkedin/visual";

// Visuel PNG d'une publication LinkedIn (réservé à l'admin).
// ?download=1 -> téléchargement direct avec un nom de fichier lisible.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return new Response("Accès refusé.", { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Introuvable.", { status: 404 });
  const post = await getPost(id);
  if (!post) return new Response("Introuvable.", { status: 404 });

  const image = await renderLinkedinVisual(post);
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "private, no-store");
  if (new URL(request.url).searchParams.get("download")) {
    headers.set("Content-Disposition", `attachment; filename="${visualFileName(post)}"`);
  }
  return new Response(image.body, { status: 200, headers });
}
