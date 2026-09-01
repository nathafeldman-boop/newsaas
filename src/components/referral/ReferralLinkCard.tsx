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
    <div className="rounded-2xl border border-border bg-brand/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
        Ton code
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-wide">{code}</p>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <span className="flex-1 truncate text-sm text-foreground/70">
          {referralLink}
        </span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
