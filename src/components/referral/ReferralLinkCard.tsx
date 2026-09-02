"use client";

import { useState } from "react";

export function ReferralLinkCard({
  referralLink,
  code,
}: {
  referralLink: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="card elev-sm" style={{ background: "var(--color-accent-100)", padding: "var(--space-6)" }}>
      <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-accent-700)", margin: 0 }}>
        Ton code
      </p>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: "4px 0 0" }}>{code}</p>

      <div className="input flex items-center gap-2" style={{ marginTop: 16, background: "var(--color-bg)" }}>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {referralLink}
        </span>
        <button
          type="button"
          onClick={copy}
          className="btn btn-primary"
          style={{ padding: "5px 14px", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
