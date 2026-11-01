"use client";

import { useState, useTransition } from "react";
import { prepareDraftAction } from "@/app/admin/linkedin/actions";
import { FORMAT_RULES, type LinkedinFormat } from "@/lib/linkedin/formats";
import type { Candidate } from "@/lib/linkedin/select";
import type { LinkedinPost } from "@/lib/linkedin/posts";
import { PostPreview } from "@/components/admin/linkedin/PostPreview";

// Étape 2 et 3 : cocher les offres, préparer le brouillon (revérifié à la
// source), puis aperçu texte + visuel.

function ago(iso: string): string {
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (h < 1) return "à l'instant";
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function LinkedinStudio({
  format,
  segment,
  candidates,
  preselected,
}: {
  format: LinkedinFormat;
  segment: string | null;
  candidates: Candidate[];
  preselected: string[];
}) {
  const max = 10;
  const target = FORMAT_RULES[format].count;
  const [selected, setSelected] = useState<string[]>(preselected);
  const [linksInComment, setLinksInComment] = useState(false);
  const [post, setPost] = useState<LinkedinPost | null>(null);
  const [removed, setRemoved] = useState<{ title: string; reason: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= max ? cur : [...cur, id]));

  const prepare = () =>
    startTransition(async () => {
      setError(null);
      setPost(null);
      // Ordre du post = ordre de la liste (plus récentes / plus complètes d'abord).
      const ordered = candidates.map((c) => c.id).filter((id) => selected.includes(id));
      const res = await prepareDraftAction({ format, segment, offerIds: ordered, linksInComment });
      setRemoved(res.removed ?? []);
      if (res.ok) setPost(res.post);
      else setError(res.error);
    });

  if (candidates.length === 0) {
    return (
      <div className="cockpit-card">
        <p style={{ margin: 0, fontSize: 14 }}>
          Aucune offre publiable pour l&apos;instant avec ces critères (alternance France Travail, entreprise nommée, hors écoles, jamais publiée sur LinkedIn). Essaie un autre secteur ou une autre ville.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="cockpit-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderBottom: "1px solid var(--color-divider)" }}>
          <strong style={{ fontSize: 14 }}>
            {selected.length} offre{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}{" "}
            <span style={{ fontWeight: 500, color: "var(--color-neutral-600)" }}>(conseillé : {target}, max {max})</span>
          </strong>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={linksInComment} onChange={(e) => setLinksInComment(e.target.checked)} />
            Liens dans le 1er commentaire
          </label>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 460, overflow: "auto" }}>
          {candidates.map((c) => {
            const checked = selected.includes(c.id);
            return (
              <li key={c.id} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                <label style={{ display: "flex", gap: 10, padding: "10px 14px", cursor: "pointer", background: checked ? "var(--color-accent-100)" : undefined }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(c.id)} style={{ marginTop: 3 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--color-neutral-700)" }}>
                      {c.company} · {c.city}
                      {c.duration ? ` · ${c.duration}` : ""} · ajoutée {ago(c.created_at)}
                      {c.sector ? ` · ${c.sector}` : ""}
                    </span>
                    {c.inDraft && <span className="cockpit-pill is-warn" style={{ marginTop: 4 }}>déjà dans un brouillon</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" disabled={pending || selected.length === 0} onClick={prepare}>
            {pending ? "Vérification des offres…" : "Préparer la publication"}
          </button>
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>
            Chaque offre est revérifiée chez France Travail avant d&apos;écrire le texte.
          </span>
        </div>
      </div>

      {removed.length > 0 && (
        <div className="cockpit-pill is-warn" style={{ display: "block", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}>
          Retirées automatiquement : {removed.map((r) => `${r.title} (${r.reason})`).join(" ; ")}
        </div>
      )}
      {error && <p style={{ color: "#a12121", fontSize: 14, margin: 0 }}>{error}</p>}
      {post && (
        <div className="cockpit-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Aperçu de la publication</h3>
          <PostPreview post={post} />
        </div>
      )}
    </div>
  );
}
