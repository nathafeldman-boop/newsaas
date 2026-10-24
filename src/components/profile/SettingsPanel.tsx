"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SettingsPanel({
  userId,
  initialNotifyNewOffers,
  initialFrequency,
}: {
  userId: string;
  initialNotifyNewOffers: boolean;
  /** null : réglage pas encore disponible en base (SQL du 24/10 non lancé). */
  initialFrequency: "daily" | "weekly" | null;
}) {
  const [notify, setNotify] = useState(initialNotifyNewOffers);
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState(initialFrequency);
  const [frequencyError, setFrequencyError] = useState<string | null>(null);

  // Fréquence des alertes (24/10) : un réglage intermédiaire entre « tout »
  // et « rien », pour qu'un étudiant qui trouve les e-mails trop fréquents
  // ne coupe pas toutes les alertes.
  async function changeFrequency(next: "daily" | "weekly") {
    if (!frequency || next === frequency) return;
    const previous = frequency;
    setFrequency(next);
    setFrequencyError(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ offer_alert_frequency: next }).eq("id", userId);
    if (error) {
      setFrequency(previous);
      setFrequencyError("Pas enregistré, réessaie dans un instant.");
    }
  }

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

      {notify && frequency && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>Fréquence</span>
          <div className="seg" role="group" aria-label="Fréquence des alertes">
            {(["daily", "weekly"] as const).map((f) => (
              <button key={f} type="button" onClick={() => void changeFrequency(f)} className={`seg-opt${frequency === f ? " is-active" : ""}`} aria-pressed={frequency === f}>
                {f === "daily" ? "Chaque jour" : "Une fois par semaine"}
              </button>
            ))}
          </div>
          {frequencyError && <span style={{ fontSize: 12, color: "var(--color-accent-700)" }}>{frequencyError}</span>}
        </div>
      )}

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
