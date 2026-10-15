"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readLikeAction, saveLikeAction, type LikeAction } from "@/lib/swipe/likePreference";

export function SettingsPanel({
  userId,
  initialNotifyNewOffers,
}: {
  userId: string;
  initialNotifyNewOffers: boolean;
}) {
  const [notify, setNotify] = useState(initialNotifyNewOffers);
  const [saving, setSaving] = useState(false);
  // Réglage du navigateur (voir lib/swipe/likePreference.ts), lu après le
  // montage : localStorage n'existe pas au rendu serveur.
  const [likeAction, setLikeAction] = useState<LikeAction | "">("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikeAction(readLikeAction() ?? "");
  }, []);

  async function toggle() {
    const next = !notify;
    setNotify(next);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ notify_new_offers: next })
      .eq("id", userId);
    setSaving(false);
    if (error) setNotify(!next);
  }

  return (
    <div className="card mt-5" style={{ padding: "var(--space-4) var(--space-5)" }}>
      <h2 style={{ fontSize: 15, fontFamily: "var(--font-heading)", margin: 0 }}>Réglages</h2>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p style={{ fontSize: 14, margin: 0 }}>Alertes nouvelles offres</p>
          <p style={{ fontSize: 12, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
            Être prévenu·e par email quand une offre colle à ta recherche.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          onClick={toggle}
          disabled={saving}
          style={{
            flexShrink: 0,
            width: 42,
            height: 24,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            padding: 3,
            background: notify ? "var(--color-accent)" : "var(--color-neutral-300)",
            transition: "background 0.15s ease",
          }}
        >
          <span
            style={{
              display: "block",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transform: notify ? "translateX(18px)" : "translateX(0)",
              transition: "transform 0.15s ease",
            }}
          />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4" style={{ paddingTop: 14, borderTop: "1px solid var(--color-divider)" }}>
        <div>
          <label htmlFor="like-action" style={{ fontSize: 14, margin: 0, display: "block" }}>
            Quand je like une offre
          </label>
          <p style={{ fontSize: 12, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
            Premium : postuler tout de suite (envoi depuis ton adresse Stageio quand l&apos;entreprise a
            publié un email), ou garder l&apos;offre en favori.
          </p>
        </div>
        <select
          id="like-action"
          className="input"
          style={{ width: "auto", flexShrink: 0 }}
          value={likeAction}
          onChange={(e) => {
            const next = e.target.value as LikeAction;
            setLikeAction(next);
            saveLikeAction(next);
          }}
        >
          <option value="" disabled>
            Me demander
          </option>
          <option value="candidature">Postuler directement</option>
          <option value="favori">Mettre en favori</option>
        </select>
      </div>

      <a
        href="mailto:contact@stageio.fr?subject=Aide%20Stageio"
        className="flex items-center justify-between no-underline"
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--color-divider)",
          color: "inherit",
        }}
      >
        <div>
          <p style={{ fontSize: 14, margin: 0 }}>Un problème ? Aide &amp; support</p>
          <p style={{ fontSize: 12, margin: "2px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
            Bug, abonnement, remboursement...
          </p>
        </div>
        <span>→</span>
      </a>
    </div>
  );
}
