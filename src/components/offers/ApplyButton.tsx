"use client";

import { useState } from "react";
import Link from "next/link";

// La candidature s'ouvre dans un nouvel onglet (site de l'employeur ou
// France Travail) : rien ne s'interpose avant. Quand la personne revient
// sur l'onglet Stageio, un encart lui propose de créer son profil pour les
// offres suivantes.
// `compact` : version en haut de fiche, sous le titre (les descriptions
// France Travail font jusqu'à 4 000 caractères : sur téléphone, le bouton du
// bas est loin).
export function ApplyButton({
  href,
  followUp,
  signupHref,
  compact = false,
}: {
  href: string;
  followUp: string;
  signupHref: string;
  compact?: boolean;
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener nofollow"
        className={compact ? "btn btn-primary" : "btn btn-primary btn-block"}
        style={{ marginTop: compact ? 16 : 24, ...(compact ? { alignSelf: "flex-start" } : {}) }}
        onClick={() => setClicked(true)}
      >
        Postuler à cette offre
      </a>
      {clicked && (
        <div
          className="card mt-3"
          role="status"
          style={{ padding: "var(--space-4)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}
        >
          <p style={{ fontSize: 14, margin: 0 }}>
            <strong>Candidature ouverte dans un nouvel onglet.</strong> {followUp}
          </p>
          <Link href={signupHref} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
            Créer mon profil gratuit
          </Link>
        </div>
      )}
    </>
  );
}
