"use client";

import { useState, useTransition } from "react";
import { setPostStatusAction } from "@/app/admin/linkedin/actions";
import type { LinkedinPost, PostStatus } from "@/lib/linkedin/posts";

// Aperçu d'une publication : texte tel qu'il apparaîtra sur LinkedIn,
// visuel, et les gestes du quotidien (copier, télécharger, marquer publié).

const STATUS_LABEL: Record<PostStatus, { label: string; tone: string }> = {
  brouillon: { label: "Brouillon", tone: "is-warn" },
  publie: { label: "Publié", tone: "is-good" },
  abandonne: { label: "Abandonné", tone: "" },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary"
      style={{ padding: "8px 14px", fontSize: 13 }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Navigateur sans presse-papiers (http, vieux Safari) : sélection manuelle.
          window.prompt("Copie le texte :", text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? "Copié ✓" : label}
    </button>
  );
}

export function PostPreview({ post, compact = false }: { post: LinkedinPost; compact?: boolean }) {
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const visualUrl = `/admin/linkedin/visuel/${post.id}`;
  const unverified = post.offers_snapshot.filter((o) => o.verdict !== "alive");

  const changeStatus = (next: PostStatus) =>
    startTransition(async () => {
      setError(null);
      const res = await setPostStatusAction(post.id, next);
      if (res.ok) setStatus(next);
      else setError(res.error ?? "Erreur");
    });

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "start" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <span className={`cockpit-pill ${STATUS_LABEL[status].tone}`}>{STATUS_LABEL[status].label}</span>
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>
            {post.body.length} / 3 000 caractères · campagne <code>{post.utm_campaign}</code>
          </span>
        </div>
        {unverified.length > 0 && (
          <p className="cockpit-pill is-warn" style={{ display: "block", borderRadius: 10, padding: "6px 10px", fontSize: 12.5, margin: "0 0 8px" }}>
            France Travail n&apos;a pas confirmé {unverified.length === 1 ? "1 offre" : `${unverified.length} offres`} ({unverified.map((o) => o.title).join(", ")}). Ouvre le lien avant de publier.
          </p>
        )}
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "var(--font-body)",
            fontSize: 13.5,
            lineHeight: 1.5,
            background: "#fff",
            color: "#1d1d1d",
            border: "1px solid var(--color-divider)",
            borderRadius: 12,
            padding: 14,
            margin: 0,
            maxHeight: compact ? 260 : 520,
            overflow: "auto",
          }}
        >
          {post.body}
        </pre>
        {post.first_comment && (
          <>
            <p style={{ fontSize: 12.5, fontWeight: 700, margin: "12px 0 6px" }}>Premier commentaire</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-body)", fontSize: 13, background: "#fff", color: "#1d1d1d", border: "1px solid var(--color-divider)", borderRadius: 12, padding: 12, margin: 0 }}>
              {post.first_comment}
            </pre>
          </>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <CopyButton text={post.body} label="Copier le texte" />
          {post.first_comment && <CopyButton text={post.first_comment} label="Copier le commentaire" />}
          <a className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }} href={`${visualUrl}?download=1`} download={`stageio-linkedin-${post.utm_campaign}.png`}>
            Télécharger le visuel
          </a>
          {status !== "publie" && (
            <button type="button" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }} disabled={pending} onClick={() => changeStatus("publie")}>
              J&apos;ai publié ✓
            </button>
          )}
          {status === "brouillon" && (
            <button type="button" className="btn btn-ghost" style={{ padding: "8px 10px", fontSize: 13 }} disabled={pending} onClick={() => changeStatus("abandonne")}>
              Abandonner
            </button>
          )}
          {status !== "brouillon" && (
            <button type="button" className="btn btn-ghost" style={{ padding: "8px 10px", fontSize: 13 }} disabled={pending} onClick={() => changeStatus("brouillon")}>
              Repasser en brouillon
            </button>
          )}
        </div>
        {error && <p style={{ color: "#a12121", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
      </div>
      {!compact && (
        <div style={{ minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- image générée à la volée, réservée à l'admin */}
          <img src={visualUrl} alt="Visuel LinkedIn" width={1080} height={1350} style={{ width: "100%", maxWidth: 420, height: "auto", borderRadius: 12, border: "1px solid var(--color-divider)", display: "block" }} />
        </div>
      )}
    </div>
  );
}
