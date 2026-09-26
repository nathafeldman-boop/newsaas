"use client";

import { useState } from "react";
import { getFreshnessLabel } from "@/lib/offers/freshness";
import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// Toujours utilisé par la démo publique de la landing (SwipeDemo.tsx), qui a
// ses propres offres fictives et son propre balisage de carte -- gardé
// exporté même si OfferCardContent ci-dessous ne l'utilise plus directement
// (InfoCell plus bas, elle, est réutilisée telle quelle par les deux).
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

// `blurred` (défaut false, sans impact sur la démo publique SwipeDemo.tsx qui
// ne le passe jamais) : teaser hard paywall (voir OfferCardContent) -- flou
// CSS pur, la valeur réelle reste dans le DOM (pas remplacée par un
// placeholder), exactement ce que "voilà tout ce qui est alléchant, le reste
// flouté" décrit.
export function InfoCell({
  icon,
  label,
  value,
  blurred = false,
}: {
  icon: string;
  label: string;
  value: string;
  blurred?: boolean;
}) {
  return (
    <div style={{ minWidth: 0, background: "var(--color-bg)", borderRadius: 14, padding: "10px 10px 9px" }}>
      <span aria-hidden style={{ fontSize: 15 }}>
        {icon}
      </span>
      <p
        style={{
          margin: "5px 0 0",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: mutedText,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 12.5,
          fontWeight: 700,
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...(blurred ? { filter: "blur(5px)", userSelect: "none" as const } : {}),
        }}
      >
        {value}
      </p>
    </div>
  );
}

// Teaser hard paywall (26/09, voir RETENTION_AUDIT.md) : un compte gratuit
// voit les cartes ("ils peuvent voir les cartes avec toutes les offres qui
// sont mises") mais seuls le titre et le salaire restent lisibles -- tout le
// reste (entreprise, ville, tags, score, raisons, description) est flouté.
// Spec confirmée par Nathan : "Titre + salaire visibles, le reste flouté".
const teaserBlur = { filter: "blur(6px)", userSelect: "none" as const };

export function OfferCardContent({
  offer,
  reasons,
  score,
  isPremium = true,
}: {
  offer: Offer;
  reasons?: string[];
  score?: number;
  isPremium?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const locked = !isPremium;
  const typeLabel = offer.contract_type === "alternance" ? "Alternance" : "Stage";
  const tags = [offer.sector, offer.remote_policy].filter(
    (t): t is string => Boolean(t),
  );
  const hypeMessage = matchHypeMessage(score, offer.id);
  const freshnessLabel = getFreshnessLabel(offer.published_at);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
          padding: "18px 18px 17px 20px",
          background: "linear-gradient(125deg, var(--color-accent), var(--color-accent-2))",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -40,
            top: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "1px solid rgba(242,248,249,.18)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: 10,
            top: -20,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "1px solid rgba(242,248,249,.14)",
          }}
        />
        {locked && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#fff",
              background: "rgba(20,30,28,.32)",
              borderRadius: 999,
              padding: "4px 9px",
            }}
          >
            🔒 Premium
          </span>
        )}
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            flexShrink: 0,
            background: "var(--color-bg)",
            color: "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 15,
            fontFamily: "var(--font-heading)",
            ...(locked ? teaserBlur : {}),
          }}
        >
          {companyInitials(offer.company)}
        </div>
        <div style={{ minWidth: 0, flex: 1, paddingTop: locked ? 16 : 2 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...(locked ? teaserBlur : {}),
            }}
          >
            {offer.company}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "rgba(242,248,249,.88)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              ...(locked ? teaserBlur : {}),
            }}
          >
            📍 {offer.location}
          </p>
        </div>
        {typeof score === "number" && (
          <div style={locked ? teaserBlur : undefined}>
            <MatchRing score={score} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto" style={{ padding: "16px 20px 18px" }}>
        <div className="flex flex-wrap gap-1.5" style={locked ? teaserBlur : undefined}>
          <span className="tag tag-accent">{typeLabel}</span>
          {freshnessLabel && <span className="tag tag-accent-2">✨ {freshnessLabel}</span>}
          {tags.map((tag) => (
            <span key={tag} className="tag tag-neutral">
              {tag}
            </span>
          ))}
        </div>

        <h2 style={{ margin: "12px 0 0", fontSize: 20, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.02em" }}>
          {offer.title}
        </h2>

        {hypeMessage && (
          <p
            style={{
              margin: "8px 0 0",
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--color-accent-700)",
              ...(locked ? teaserBlur : {}),
            }}
          >
            ✨ {hypeMessage}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2" style={{ marginTop: 14 }}>
          <InfoCell icon="🗓" label="Début" value={offer.start_date ? formatStartDate(offer.start_date) : "Flexible"} blurred={locked} />
          <InfoCell icon="⏱" label="Durée" value={offer.duration ?? "Non précisé"} blurred={locked} />
          <InfoCell icon="💰" label="Salaire" value={offer.salary ?? "Non précisé"} />
        </div>

        {reasons && reasons.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, ...(locked ? teaserBlur : {}) }}>✨ Pourquoi cette offre pour toi</p>
            <div className="flex flex-col gap-1.5" style={{ marginTop: 8, ...(locked ? teaserBlur : {}) }}>
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
              ...(locked ? teaserBlur : {}),
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
          {locked ? (
            <span
              style={{
                marginTop: 6,
                display: "inline-block",
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--color-accent-700)",
              }}
            >
              🔒 Description complète avec Premium
            </span>
          ) : (
            !detailsOpen && (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
