"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CvUploadPanel({
  userId,
  cvSignedUrl,
}: {
  userId: string;
  cvSignedUrl: string | null;
}) {
  const router = useRouter();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const ext = cvFile.name.split(".").pop();
    const path = `${userId}/cv-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, cvFile, { upsert: true });

    if (uploadError) {
      setSaving(false);
      setError("Le CV n'a pas pu être envoyé : " + uploadError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cv_path: path, cv_uploaded_at: new Date().toISOString() })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setCvFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card elev-sm" style={{ padding: "var(--space-6)" }}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>Ton CV</p>
      {cvSignedUrl && (
        <a href={cvSignedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, display: "block", marginTop: 8 }}>
          Voir mon CV actuel
        </a>
      )}
      <label
        className="mt-4 flex items-center justify-center gap-2 text-center cursor-pointer"
        style={{ border: "2px dashed var(--color-divider)", borderRadius: "var(--radius-lg)", padding: "22px 16px" }}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
        />
        <span style={{ fontSize: 13 }}>{cvFile ? cvFile.name : "Remplacer mon CV"}</span>
      </label>

      {error && <p className="text-sm mt-3" style={{ color: "var(--color-accent-700)" }}>{error}</p>}
      {success && <p className="text-sm mt-3" style={{ color: "var(--color-accent-2-700)" }}>CV mis à jour ✓</p>}

      <button type="submit" disabled={saving || !cvFile} className="btn btn-primary mt-4">
        {saving ? "Envoi en cours..." : "Enregistrer"}
      </button>
    </form>
  );
}
