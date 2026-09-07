"use client";

import { useState } from "react";
import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// Toujours utilisés par la démo publique de la landing (SwipeDemo.tsx), qui
// a ses propres offres fictives et son propre balisage de carte -- gardés
// exportés même si OfferCardContent ci-dessous ne les utilise plus.
export function MatchRing({ score }: { score: number }) {
  const size = 46;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-heading)",
          fontSize: 12,
          color: "#fff",
        }}
      >
        {score}%
      </span>
    </div>
  );
}

export function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-md)",
        padding: "8px 9px",
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "var(--color-accent-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 9.5,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 11.5,
            lineHeight: 1.25,
            fontFamily: "var(--font-heading)",
            margin: "1px 0 0",
            overflowWrap: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function companyInitials(company: string): string {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const mutedText = "color-mix(in srgb, var(--color-text) 60%, transparent)";

function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 11, color: mutedText }}>
        {icon} {label}
      </p>
      <p
        style={{
          margin: "3px 0 0",
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.25,
          overflowWrap: "break-word",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function OfferCardContent({
  offer,
  reasons,
}: {
  offer: Offer;
  reasons?: string[];
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const typeLabel = offer.contract_type === "alternance" ? "Alternance" : "Stage";
  const tags = [offer.sector, offer.remote_policy].filter(
    (t): t is string => Boolean(t),
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ padding: "20px 20px 18px" }}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5" style={{ minWidth: 0 }}>
          <div
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              flexShrink: 0,
              background: "var(--color-accent-100)",
              color: "var(--color-accent-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "var(--font-heading)",
            }}
          >
            {companyInitials(offer.company)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {offer.company}
            </p>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: mutedText }}>{offer.location}</p>
          </div>
        </div>
      </div>

      <h2 style={{ margin: "16px 0 0", fontSize: 20, fontWeight: 700, lineHeight: 1.28, letterSpacing: "-0.01em" }}>
        {offer.title}
      </h2>
      <p style={{ margin: "5px 0 0", fontSize: 13.5, fontWeight: 500, color: mutedText }}>
        {typeLabel} • {offer.location}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 12 }}>
          {tags.map((tag) => (
            <span key={tag} className="tag tag-neutral">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: "var(--color-divider)", margin: "16px 0" }} />

      <div className="grid grid-cols-3 gap-2">
        <InfoCell icon="🗓" label="Début" value={offer.start_date ? formatStartDate(offer.start_date) : "Flexible"} />
        <InfoCell icon="⏱" label="Durée" value={offer.duration ?? "Non précisé"} />
        <InfoCell icon="💰" label="Salaire" value={offer.salary ?? "Non précisé"} />
      </div>

      {reasons && reasons.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700 }}>✨ Pourquoi cette offre pour toi</p>
          <div className="flex flex-col gap-1.5" style={{ marginTop: 8 }}>
            {reasons.map((reason) => (
              <p
                key={reason}
                style={{ margin: 0, fontSize: 13, display: "flex", gap: 6, alignItems: "flex-start", color: "color-mix(in srgb, var(--color-text) 82%, transparent)" }}
              >
                <span aria-hidden style={{ color: "var(--color-accent-700)", fontWeight: 700, flexShrink: 0 }}>
                  ✓
                </span>
                {reason}
              </p>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, paddingBottom: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.55,
            color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
            ...(detailsOpen
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }),
          }}
        >
          {offer.description}
        </p>
        {!detailsOpen && (
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            style={{
              marginTop: 6,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--color-accent)",
              cursor: "pointer",
            }}
          >
            Voir les détails →
          </button>
        )}
      </div>
    </div>
  );
}
