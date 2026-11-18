"use client";

import Link from "next/link";

// Fiche offre (18/11, Nathan : « convertir un maximum ») : 57 % des clics
// Google arrivent sur une fiche, et le gros bouton envoyait directement chez
// France Travail : on perdait le visiteur. Le bouton principal passe
// maintenant par l'inscription (l'offre vue est gardée et sort en premier
// dans le swipe, cookie offre_vue posé par proxy.ts). Le lien vers l'annonce
// d'origine reste juste dessous, en petit : Google Emploi le demande, et
// celui qui veut postuler tout de suite n'est pas bloqué.
// `compact` : version en haut de fiche, sous le titre (les descriptions
// France Travail font jusqu'à 4 000 caractères : sur téléphone, le bouton du
// bas est loin).
export function ApplyButton({
  href,
  signupHref,
  compact = false,
}: {
  href: string;
  followUp?: string;
  signupHref: string;
  compact?: boolean;
}) {
  return (
    <div style={{ marginTop: compact ? 16 : 24, display: "flex", flexDirection: "column", alignItems: compact ? "flex-start" : "stretch", gap: 6 }}>
      <Link href={signupHref} className={compact ? "btn btn-primary" : "btn btn-primary btn-block"} style={{ fontSize: 16, padding: "12px 20px" }}>
        Postuler avec Stageio →
      </Link>
      <span style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 62%, transparent)", textAlign: compact ? "left" : "center" }}>
        Gratuit · on garde cette offre et on te montre celles qui lui ressemblent
      </span>
      <a
        href={href}
        target="_blank"
        rel="noopener nofollow"
        style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", textDecoration: "underline", textAlign: compact ? "left" : "center" }}
      >
        ou postuler directement sur le site de l&apos;annonce
      </a>
    </div>
  );
}
