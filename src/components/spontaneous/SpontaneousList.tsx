"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { InfoSheet, type ApplicantField, type AutoApplySetup } from "@/components/swipe/ApplyOnLike";
import type { SpontaneousTarget } from "@/lib/spontaneous/targets";

// Liste de /spontanees : un bouton par entreprise, la candidature part par
// La bonne alternance (api/applications/spontaneous). Ce qu'il manque (CV,
// téléphone, nom complet) est demandé une fois, dans la même fenêtre qu'au
// like.

type RowState = "idle" | "sending" | "sent" | "already" | "failed" | "limit";

const muted = { color: "color-mix(in srgb, var(--color-text) 62%, transparent)" } as const;
const BUSY_RETRIES = 3;
const BUSY_DELAY_MS = 15_000;

async function post(recipientId: string): Promise<{ status: string; missing?: string }> {
  try {
    const res = await fetch("/api/applications/spontaneous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId }),
    });
    return (await res.json()) as { status: string; missing?: string };
  } catch {
    return { status: "error" };
  }
}

const FIELD_OF_MISSING: Record<string, ApplicantField> = { no_cv: "cv", no_phone: "phone", no_name: "name" };

export function SpontaneousList({
  userId,
  targets,
  totalFound,
  alreadyContacted,
  sentToday,
  dailyLimit,
  setup,
}: {
  userId: string;
  targets: SpontaneousTarget[];
  totalFound: number;
  alreadyContacted: number;
  sentToday: number;
  dailyLimit: number;
  setup: AutoApplySetup;
}) {
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [count, setCount] = useState(sentToday);
  const [known, setKnown] = useState(() => {
    const set = new Set<ApplicantField>();
    if (setup.hasCv) set.add("cv");
    if (setup.hasPhone) set.add("phone");
    if (setup.hasFullName) set.add("name");
    return set;
  });
  const [prompt, setPrompt] = useState<{ offer: { id: string; company: string }; fields: ApplicantField[] } | null>(null);

  const set = (id: string, state: RowState) => setStates((prev) => ({ ...prev, [id]: state }));

  async function send(target: SpontaneousTarget, attempt = 0): Promise<void> {
    set(target.recipientId, "sending");
    const result = await post(target.recipientId);
    if (result.status === "sent") {
      set(target.recipientId, "sent");
      setCount((n) => n + 1);
      return;
    }
    if (result.status === "busy" && attempt < BUSY_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, BUSY_DELAY_MS));
      return send(target, attempt + 1);
    }
    if (result.status === "missing" && result.missing && FIELD_OF_MISSING[result.missing]) {
      set(target.recipientId, "idle");
      setPrompt({ offer: { id: target.recipientId, company: target.company }, fields: [FIELD_OF_MISSING[result.missing]] });
      return;
    }
    set(target.recipientId, result.status === "already_sent" ? "already" : result.status === "daily_limit" ? "limit" : "failed");
  }

  function start(target: SpontaneousTarget) {
    const missing = (["cv", "phone", "name"] as const).filter((f) => !known.has(f));
    if (missing.length > 0) {
      setPrompt({ offer: { id: target.recipientId, company: target.company }, fields: [...missing] });
      return;
    }
    void send(target);
  }

  const limitReached = count >= dailyLimit;
  const sentNow = Object.values(states).filter((s) => s === "sent" || s === "already").length;

  return (
    <>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { value: targets.length - sentNow, label: "à contacter" },
          { value: alreadyContacted + sentNow, label: "déjà contactées" },
          { value: `${count}/${dailyLimit}`, label: "aujourd'hui" },
        ].map((k) => (
          <div key={k.label} className="card elev-sm" style={{ padding: "12px 14px" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{k.value}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", margin: "2px 0 0", ...muted }}>{k.label}</p>
          </div>
        ))}
      </div>

      {targets.length === 0 ? (
        <div className="card elev-sm mt-5" style={{ padding: "var(--space-6)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            {totalFound > 0
              ? "Tu as déjà contacté toutes les entreprises de ta zone pour ce métier. La liste se met à jour chaque jour."
              : "Aucune entreprise trouvée pour ton métier dans ta zone pour le moment. Ajoute un 2e métier visé dans ton profil pour élargir la recherche."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-2.5" style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
          {targets.map((t, i) => {
            const state = states[t.recipientId] ?? "idle";
            const done = state === "sent" || state === "already";
            return (
              <motion.li
                key={t.recipientId}
                className="card elev-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: done ? 0.7 : 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03 }}
                style={{ padding: "14px 16px", flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, overflowWrap: "anywhere" }}>{t.company}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.4, ...muted }}>
                    {[t.activity, t.city, t.size ? `${t.size} salariés` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {done ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent-700)", whiteSpace: "nowrap" }}>✓ {state === "sent" ? "Envoyée" : "Déjà envoyée"}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={state === "sending" || limitReached}
                    onClick={() => start(t)}
                    style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}
                  >
                    {state === "sending" ? "Envoi…" : state === "failed" ? "Réessayer" : "Postuler"}
                  </button>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}

      {limitReached && (
        <p style={{ fontSize: 13, margin: "14px 0 0", ...muted }}>
          {dailyLimit} candidatures spontanées envoyées aujourd&apos;hui : la suite demain, pour que chaque entreprise reçoive une candidature soignée.
        </p>
      )}

      <InfoSheet
        prompt={prompt}
        userId={userId}
        onDone={(saved) => {
          const offer = prompt?.offer;
          setPrompt(null);
          if (saved.length === 0) return;
          setKnown((prev) => new Set([...prev, ...saved]));
          const target = offer ? targets.find((t) => t.recipientId === offer.id) : undefined;
          if (target) void send(target);
        }}
      />
    </>
  );
}
