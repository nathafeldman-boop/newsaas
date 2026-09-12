"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// En dessous de ce seuil, on demande une raison précise plutôt qu'un simple
// commentaire libre optionnel : ça évite les avis du style "Nul" ou une
// insulte sans aucune info exploitable pour corriger le vrai problème.
const LOW_RATING_THRESHOLD = 3;
const MIN_LOW_RATING_COMMENT_LENGTH = 8;

const LOW_RATING_REASONS = [
  "Pas assez d'offres pertinentes",
  "Bug ou erreur technique",
  "Prix de l'abonnement",
  "Algorithme de matching",
  "Génération de lettre/CV en échec",
  "Autre",
];

export function ReviewPanel({
  userId,
  initialReview,
}: {
  userId: string;
  initialReview: { rating: number; comment: string | null } | null;
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [reason, setReason] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isLowRating = rating > 0 && rating <= LOW_RATING_THRESHOLD;
  const commentTooShort = isLowRating && comment.trim().length < MIN_LOW_RATING_COMMENT_LENGTH;

  async function submit() {
    if (rating === 0 || saving || commentTooShort) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").upsert(
      { user_id: userId, rating, comment: comment.trim() || null, status: "pending" },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (!error) setSaved(true);
  }

  function selectReason(r: string) {
    setReason(r);
    setSaved(false);
    if (!comment.trim()) setComment(`${r} : `);
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="card mt-5" style={{ padding: "var(--space-4) var(--space-5)" }}>
      <h2 style={{ fontSize: 15, fontFamily: "var(--font-heading)", margin: 0 }}>
        Ton avis compte
      </h2>
      <p style={{ fontSize: 12, margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
        Aide d&apos;autres alternants à découvrir Stageio.
      </p>

      <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Note sur 5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            onClick={() => {
              setRating(star);
              setSaved(false);
            }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              fontSize: 26,
              lineHeight: 1,
              padding: 2,
              color: star <= displayRating ? "var(--color-accent)" : "var(--color-neutral-300)",
            }}
          >
            ★
          </button>
        ))}
      </div>

      {isLowRating && (
        <div className="mt-3">
          <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0 }}>
            Qu&apos;est-ce qui ne va pas ? Dis-nous-en un peu plus pour qu&apos;on puisse corriger le vrai problème.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LOW_RATING_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => selectReason(r)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: `1.5px solid ${reason === r ? "var(--color-accent)" : "var(--color-divider)"}`,
                  background: reason === r ? "var(--color-accent-100)" : "var(--color-surface)",
                  fontSize: 11.5,
                  cursor: "pointer",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
            }}
            placeholder={isLowRating ? "Explique-nous ce qui s'est passé (obligatoire)" : "Un commentaire (optionnel)"}
            rows={2}
            className="input mt-3"
            style={{ width: "100%", resize: "vertical" }}
          />
          {commentTooShort && (
            <p style={{ fontSize: 11.5, color: "var(--color-accent-700)", margin: "4px 0 0" }}>
              Ajoute quelques mots sur ce qui t&apos;a déçu -- on veut vraiment comprendre et corriger.
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={saving || commentTooShort}
            className="btn btn-secondary mt-3"
          >
            {saving ? "Envoi..." : saved ? "Merci !" : initialReview ? "Modifier mon avis" : "Envoyer mon avis"}
          </button>
        </>
      )}
    </div>
  );
}
