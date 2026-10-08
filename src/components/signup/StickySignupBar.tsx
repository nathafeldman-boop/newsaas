import { StickySignupBarClient } from "@/components/signup/StickySignupBarClient";
import { resolveSignupIntent, signupBarText } from "@/lib/signup/intent";

// Pages publiques (pages métier / ville, fiches offres, guides, entreprises) :
// sur téléphone, le seul bouton d'inscription visible en continu était
// « S'inscrire » dans l'en-tête, sans lien avec ce que la personne regarde.
// Cette barre reprend le contexte du lien d'inscription de la page
// (« Les nouvelles offres d'alternance de commercial à Lyon… »).
export function StickySignupBar({ href }: { href: string }) {
  const params = new URL(href, "https://www.stageio.fr").searchParams;
  const intent = resolveSignupIntent({
    type: params.get("type") ?? undefined,
    metier: params.get("metier") ?? undefined,
    ville: params.get("ville") ?? undefined,
  });
  return <StickySignupBarClient href={href} text={signupBarText(intent)} />;
}
