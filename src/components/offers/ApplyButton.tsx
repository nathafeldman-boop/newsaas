"use client";

import { useState } from "react";
import Link from "next/link";

// La candidature s'ouvre dans un nouvel onglet (site de l'employeur ou
// France Travail) : rien ne s'interpose avant. Quand la personne revient
// sur l'onglet Stageio, un encart lui propose de créer son profil pour les
// offres suivantes.
export function ApplyButton({ href, followUp, signupHref }: { href: string; followUp: string; signupHref: string }) {
  const [clicked, setClicked] = useState(false);
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener nofollow"
        className="btn btn-primary btn-block"
        style={{ marginTop: 24 }}
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
