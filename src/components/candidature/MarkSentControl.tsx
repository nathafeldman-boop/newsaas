"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { markApplicationSentAction } from "@/app/(app)/mes-candidatures/actions";

// « J'ai envoyé ma candidature » (24/10) : ouvrir une offre et écrire la
// lettre ne veut pas dire avoir postulé. L'étudiant confirme ici, la
// candidature passe « envoyée » et une relance est proposée 7 jours après.
const shortDate = (t: string) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function MarkSentControl({ offerId, initialSentAt, emphasize }: { offerId: string; initialSentAt: string | null; emphasize: boolean }) {
  const [sentAt, setSentAt] = useState(initialSentAt);
  const [followUpAt, setFollowUpAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sentAt) {
    return (
      <div className="tag tag-accent-2" style={{ padding: "10px 14px", fontSize: 13, display: "block", lineHeight: 1.5 }}>
        ✓ Candidature envoyée le {shortDate(sentAt)}
        {followUpAt && <> · relance proposée le {shortDate(followUpAt)}</>}.{" "}
        <Link href="/mes-candidatures" style={{ fontWeight: 600 }}>
          Suivre mes candidatures
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await markApplicationSentAction(offerId);
            if (result.ok) {
              setSentAt(result.sentAt ?? new Date().toISOString());
              setFollowUpAt(result.followUpAt ?? null);
            } else {
              setError(result.error);
            }
          });
        }}
        className={emphasize ? "btn btn-primary btn-block" : "btn btn-secondary btn-block"}
      >
        {pending ? "Enregistrement…" : "✓ J'ai envoyé ma candidature"}
      </button>
      <p style={{ fontSize: 11, textAlign: "center", margin: 0, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
        Elle passe en « Envoyée » dans ton suivi, avec un rappel pour relancer dans 7 jours.
      </p>
      {error && (
        <p role="alert" style={{ fontSize: 12, textAlign: "center", margin: 0, color: "var(--color-accent-700)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
