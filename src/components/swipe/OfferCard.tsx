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

// Petit message d'incitation, calé sur le score de matching -- l'objectif
// est qu'une carte à très haut score se ressente comme "évidemment je veux
// postuler", pas juste comme une offre parmi d'autres. Plusieurs variantes
// par palier (même logique que les lettres de motivation, voir
// src/lib/coverLetter/staticGenerator.ts) pour éviter de revoir le même
// texte à chaque carte à score équivalent. Le ton descend volontairement
// en intensité avec le score -- très enthousiaste en haut, simple constat
// factuel dès 60 -- mais reste toujours silencieux sous 60 : un score
// faible ne doit jamais recevoir de message, qu'il soit hyped ou
// décourageant, pour ne pas entamer la confiance dans le score affiché
// ailleurs sur la carte.
function seededHashForHype(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const HYPE_MESSAGES: { min: number; variants: string[] }[] = [
  {
    min: 92,
    variants: [
      "🔥 Pépite pour ton profil — fonce !",
      "🔥 Rarissime : un match à ce niveau-là, ne le laisse pas filer",
      "🏆 Le meilleur match de ton deck en ce moment",
      "🔥 Ton profil colle presque parfaitement à cette offre",
      "⚡ Un match aussi fort, ça se joue à quelques clics",
      "🔥 Ce genre d'offre, tu la retrouveras rarement aussi bien alignée",
    ],
  },
  {
    min: 82,
    variants: [
      "✨ Un des meilleurs matchs de ton deck",
      "✨ Ton profil correspond vraiment bien ici",
      "✨ Une des offres les plus alignées avec ton parcours",
      "💫 Ce match sort clairement du lot",
      "✨ Ça vaut clairement plus qu'un simple coup d'œil",
      "💫 Un très bon niveau de compatibilité sur cette offre",
    ],
  },
  {
    min: 72,
    variants: [
      "👍 Bon match, ça vaut le coup d'œil",
      "👍 Une offre solide par rapport à ton profil",
      "👍 De bonnes chances que ça matche des deux côtés",
      "👍 Un profil qui colle plutôt bien à cette offre",
      "👍 Ça mérite clairement d'être regardé de plus près",
      "👍 Un match au-dessus de la moyenne de ton deck",
    ],
  },
  {
    min: 60,
    variants: [
      "Un match correct pour ton profil",
      "Une offre qui reste dans tes critères",
      "Compatibilité correcte, à voir selon tes envies",
      "Ça peut valoir le coup selon ce que tu recherches",
      "Un match dans la moyenne, à toi de juger",
      "Une offre raisonnablement alignée avec ton profil",
    ],
  },
];

function matchHypeMessage(score: number | undefined, seedKey: string): string | null {
  if (score === undefined) return null;
  const tier = HYPE_MESSAGES.find((t) => score >= t.min);
  if (!tier) return null;
  const hash = seededHashForHype(`${seedKey}::${tier.min}`);
  return tier.variants[hash % tier.variants.length];
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
  score,
}: {
  offer: Offer;
  reasons?: string[];
  score?: number;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const typeLabel = offer.contract_type === "alternance" ? "Alternance" : "Stage";
  const tags = [offer.sector, offer.remote_policy].filter(
    (t): t is string => Boolean(t),
  );
  const hypeMessage = matchHypeMessage(score, offer.id);

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

      {hypeMessage && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--color-accent-700)",
            background: "var(--color-accent-100)",
            display: "inline-block",
            padding: "5px 10px",
            borderRadius: 999,
          }}
        >
          {hypeMessage}
        </p>
      )}

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
