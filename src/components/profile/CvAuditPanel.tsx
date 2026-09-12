"use client";

import Link from "next/link";
import { useActionState } from "react";
import { auditCvAction, type CvAuditState } from "@/app/(app)/profil/cv-audit-actions";

const initialState: CvAuditState = { status: "idle" };

export function CvAuditPanel({ hasCv, isPremium }: { hasCv: boolean; isPremium: boolean }) {
  const [state, formAction, pending] = useActionState(
    auditCvAction,
    initialState,
  );

  const score = state.status === "success" ? state.score : null;

  return (
    <div
      className="card elev-sm"
      style={{ marginTop: 28, background: "var(--color-accent-2-100)" }}
    >
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0, color: "var(--color-accent-2-800)" }}>
        Améliore ton CV
      </p>
      <p style={{ fontSize: 13, color: "var(--color-accent-2-800)", opacity: 0.85, margin: "6px 0 0" }}>
        Mistral analyse ton CV et te donne une note sur 100, avec des pistes
        concrètes pour convaincre plus de recruteurs.
      </p>

      {!hasCv ? (
        <p style={{ fontSize: 13, color: "var(--color-accent-2-800)", opacity: 0.7, marginTop: 16 }}>
          Ajoute d&apos;abord ton CV ci-dessus pour pouvoir l&apos;analyser.
        </p>
      ) : score !== null ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              borderRadius: "50%",
              flexShrink: 0,
              background: `conic-gradient(var(--color-accent-2) 0% ${score}%, var(--color-accent-2-200) ${score}% 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "var(--color-accent-2-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-heading)",
                fontSize: 15,
                color: "var(--color-accent-2-800)",
              }}
            >
              {score}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: "var(--color-accent-2-800)", margin: 0 }}>
              Score sur 100
              {state.status === "success" && state.missing_sections.length > 0
                ? ` · manque : ${state.missing_sections.slice(0, 2).join(", ")}`
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      {state.status === "success" && (
        <div className="flex flex-col gap-4" style={{ marginTop: 16 }}>
          {state.strengths.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent-2-800)", margin: 0 }}>
                ✅ Points forts
              </p>
              <ul style={{ marginTop: 4, fontSize: 13, color: "var(--color-accent-2-800)", opacity: 0.85 }}>
                {state.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {state.improvements.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent-2-800)", margin: 0 }}>
                🔧 À améliorer
              </p>
              <ul style={{ marginTop: 4, fontSize: 13, color: "var(--color-accent-2-800)", opacity: 0.85 }}>
                {state.improvements.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.status === "error" && (
        <p style={{ fontSize: 13, color: "var(--color-accent-700)", marginTop: 12 }}>{state.message}</p>
      )}

      {hasCv && !isPremium && (
        <Link
          href="/premium"
          className="btn btn-primary"
          style={{ marginTop: 14, background: "var(--color-accent-2)", whiteSpace: "nowrap" }}
        >
          🔓 Débloquer avec Premium (7,99€/mois)
        </Link>
      )}

      {hasCv && isPremium && (
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{ marginTop: 14, background: "var(--color-accent-2)", whiteSpace: "nowrap" }}
          >
            {pending ? "Analyse en cours..." : score !== null ? "Relancer l'analyse" : "Lancer l'analyse complète"}
          </button>
        </form>
      )}
    </div>
  );
}
