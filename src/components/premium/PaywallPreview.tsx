"use client";

import { useEffect, useRef, useState } from "react";
import { offerRefundGuaranteeAction } from "@/app/(app)/premium/guarantee-actions";
import { GUARANTEE_COOKIE, setBrowserCookie } from "@/lib/premium/guaranteeTerms";
import { GUARANTEE_EVENT } from "@/components/premium/PaywallExitGuard";
import type { PaywallPreviewData } from "@/lib/premium/paywallPreview";

// Écran d'avant le paywall après un like (21/11, SOP « paywall ») : sa
// sélection est prête, titres lisibles, entreprise et lettre floutées ;
// chaque « débloquer » ouvre le paywall en dessous. Comme l'écran de
// confiance qu'il remplace, il accorde la garantie remboursé (badge sur le
// paywall).
export function PaywallPreview({ data }: { data: PaywallPreviewData }) {
  const [open, setOpen] = useState(true);
  const granted = useRef(false);

  useEffect(() => {
    if (granted.current) return;
    granted.current = true;
    setBrowserCookie(GUARANTEE_COOKIE);
    void offerRefundGuaranteeAction();
    window.dispatchEvent(new Event(GUARANTEE_EVENT));
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;
  const total = `${data.count.toLocaleString("fr-FR")}${data.capped ? "+" : ""}`;
  const plural = data.count > 1;
  const rest = data.count - data.offers.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ta sélection est prête"
      style={{ position: "fixed", inset: 0, zIndex: 80, overflowY: "auto", background: "var(--color-bg)" }}
    >
      <div className="mx-auto flex max-w-md flex-col" style={{ minHeight: "100%" }}>
        <div style={{ background: "linear-gradient(130deg,#0b7a43,#0f9c56,#2fb06a)", color: "#fff", padding: "28px 20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.9 }}>
            Ta sélection est prête
          </div>
          <h1 style={{ fontSize: 27, lineHeight: 1.12, fontWeight: 800, margin: "6px 0 0" }}>
            {total} offre{plural ? "s" : ""} {data.where ? `${data.where} ` : ""}
            {plural ? "t'attendent" : "t'attend"}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.4, opacity: 0.95 }}>{data.noticed}</p>
        </div>

        <div className="flex flex-col gap-2.5" style={{ padding: "16px 16px 0" }}>
          {data.offers.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOpen(false)}
              style={{
                position: "relative",
                textAlign: "left",
                border: "1px solid var(--color-divider)",
                borderRadius: 16,
                padding: "13px 14px",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              <span aria-hidden style={{ position: "absolute", right: 12, top: 12, fontSize: 13 }}>
                🔒
              </span>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--color-accent-700)",
                  background: "var(--color-accent-100)",
                  borderRadius: 999,
                  padding: "3px 9px",
                  marginBottom: 6,
                }}
              >
                {o.contract} · {o.place}
              </span>
              <div style={{ fontWeight: 800, fontSize: 14.5, paddingRight: 22 }}>{o.title}</div>
              <div aria-hidden style={{ filter: "blur(5px)", userSelect: "none", fontSize: 13, marginTop: 4, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                {o.company} · lettre de motivation prête
              </div>
            </button>
          ))}
        </div>
        {rest > 0 && (
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, padding: "10px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            + {rest.toLocaleString("fr-FR")}
            {data.capped ? "+" : ""} autre{rest > 1 ? "s" : ""} offre{rest > 1 ? "s" : ""}
          </div>
        )}
        <div style={{ padding: 16 }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn btn-block"
            style={{
              height: 54,
              border: "none",
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-700))",
              color: "var(--color-bg)",
              fontSize: 16.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Débloquer {plural ? `mes ${total} offres` : "mon offre"}
          </button>
        </div>
      </div>
    </div>
  );
}
