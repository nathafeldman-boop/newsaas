"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (rating === 0 || saving) return;
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

      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
            }}
            placeholder="Un commentaire (optionnel)"
            rows={2}
            className="input mt-3"
            style={{ width: "100%", resize: "vertical" }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="btn btn-secondary mt-3"
          >
            {saving ? "Envoi..." : saved ? "Merci !" : initialReview ? "Modifier mon avis" : "Envoyer mon avis"}
          </button>
        </>
      )}
    </div>
  );
}
