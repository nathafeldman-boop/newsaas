"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getFreshnessLabel } from "@/lib/offers/freshness";
import { offerSalary } from "@/lib/salary/estimate";
import type { Offer } from "@/types/database";

function formatStartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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
// flouté" décrit. Un petit 🔒 à côté du libellé dit que c'est verrouillé.
// `note` : précision en tout petit sous la valeur (ex. « (estimation) »).
export function InfoCell({
  icon,
  label,
  value,
  blurred = false,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  blurred?: boolean;
  note?: string;
}) {
  return (
    <div style={{ minWidth: 0, background: "var(--color-bg)", borderRadius: 14, padding: "10px 10px 9px" }}>
      <span aria-hidden style={{ fontSize: 15, display: "flex", color: "var(--color-accent-700)" }}>
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
        {blurred && <span aria-label="verrouillé"> 🔒</span>}
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
      {note && <p style={{ margin: "1px 0 0", fontSize: 9, lineHeight: 1.2, color: mutedText }}>{note}</p>}
    </div>
  );
}

// Teaser hard paywall (26/09, voir RETENTION_AUDIT.md) : un compte gratuit
// voit les cartes ("ils peuvent voir les cartes avec toutes les offres qui
// sont mises") mais seuls le titre et le salaire restent lisibles -- tout le
// reste (entreprise, ville, tags, score, raisons, description) est flouté.
// Spec confirmée par Nathan : "Titre + salaire visibles, le reste flouté".
// 16/10 (Nathan) : salaire jamais flouté, estimé quand l'annonce n'en donne
// pas, et un petit cadenas / CTA « Débloquer » sur les zones floutées.
const teaserBlur = { filter: "blur(6px)", userSelect: "none" as const };

const UNLOCK_HREF = "/premium?source=card_unlock";

// Petit CTA posé au centre d'une zone floutée. stopPropagation : un tap
// dessus ouvre le paywall sans démarrer de drag sur la carte.
function UnlockPill({ label }: { label: string }) {
  return (
    <Link
      href={UNLOCK_HREF}
      onPointerDown={(e) => e.stopPropagation()}
      data-fx-burst
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
        fontSize: 11.5,
        fontWeight: 800,
        color: "#fff",
        background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
        borderRadius: 999,
        padding: "5px 11px",
        boxShadow: "0 6px 16px color-mix(in srgb, var(--color-accent) 35%, transparent)",
        textDecoration: "none",
      }}
    >
      🔒 {label}
    </Link>
  );
}

export function OfferCardContent({
  offer,
  reasons,
  isPremium = true,
}: {
  offer: Offer;
  reasons?: string[];
  isPremium?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const locked = !isPremium;
  const typeLabel = offer.contract_type === "alternance" ? "Alternance" : "Stage";
  const tags = [offer.sector, offer.remote_policy].filter(
    (t): t is string => Boolean(t),
  );
  const salary = offerSalary(offer);
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
            <Icon name="pin" size={13} strokeWidth={2.1} /> {offer.location}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto" style={{ padding: "16px 20px 18px" }}>
        <div className="flex flex-wrap gap-1.5" style={locked ? teaserBlur : undefined}>
          <span className="tag tag-accent">{typeLabel}</span>
          {freshnessLabel && (
            <span className="tag tag-accent-2" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="sparkles" size={12} /> {freshnessLabel}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag} className="tag tag-neutral">
              {tag}
            </span>
          ))}
        </div>

        <h2 style={{ margin: "12px 0 0", fontSize: 20, fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.02em" }}>
          {offer.title}
        </h2>


        <div className="grid grid-cols-3 gap-2" style={{ marginTop: 14 }}>
          <InfoCell icon={<Icon name="calendar" size={16} />} label="Début" value={offer.start_date ? formatStartDate(offer.start_date) : "Flexible"} blurred={locked} />
          <InfoCell icon={<Icon name="clock" size={16} />} label="Durée" value={offer.duration ?? "Non précisé"} blurred={locked} />
          <InfoCell
            icon={<Icon name="euro" size={16} />}
            label="Salaire"
            value={salary.value}
            note={salary.estimated ? "/mois (estimation)" : undefined}
          />
        </div>

        {reasons && reasons.length > 0 && (
          <div style={{ marginTop: 16, position: "relative" }}>
            {locked && <UnlockPill label="Débloquer l'analyse complète" />}
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, ...(locked ? teaserBlur : {}) }}>
              <Icon name="sparkles" size={14} style={{ color: "var(--color-accent-700)" }} /> Pourquoi cette offre pour toi
            </p>
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
            <Link
              href={UNLOCK_HREF}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                marginTop: 6,
                display: "inline-block",
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--color-accent-700)",
                textDecoration: "none",
              }}
            >
              🔒 Débloquer l&apos;offre complète →
            </Link>
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
