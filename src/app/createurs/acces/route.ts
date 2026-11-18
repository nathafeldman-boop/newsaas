import { NextResponse, type NextRequest } from "next/server";
import { creatorFromToken, setCreatorCookie } from "@/lib/creators/access";

// Lien perso d'un créateur (18/11) : ouvre son espace sur un autre téléphone
// (le jeton passe dans le cookie, puis on retire le lien de la barre).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const creator = await creatorFromToken(token);
  if (!creator || !token) return NextResponse.redirect(new URL("/createurs?lien=invalide", request.url));
  await setCreatorCookie(token);
  return NextResponse.redirect(new URL("/createurs", request.url));
}
