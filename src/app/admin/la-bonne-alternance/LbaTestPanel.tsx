"use client";

import { useActionState } from "react";
import { testLbaSandboxAction, type LbaTestResult } from "@/app/admin/la-bonne-alternance/actions";

// Test avec la clé sandbox : rien n'arrive chez de vrais recruteurs.
export function LbaTestPanel({ sandboxKeySet }: { sandboxKeySet: boolean }) {
  const [result, action, pending] = useActionState<LbaTestResult | null, FormData>(testLbaSandboxAction, null);

  return (
    <div className="card" style={{ padding: 18 }}>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0 }}>Tester avec la clé sandbox</p>
      <p style={{ fontSize: 13, margin: "6px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
        Recherche d&apos;offres puis candidature test, dans l&apos;environnement de test de La bonne alternance : rien
        n&apos;arrive chez de vrais recruteurs, rien n&apos;est enregistré chez Stageio.
        {!sandboxKeySet && " Clé LBA_SANDBOX_KEY pas encore ajoutée dans Vercel."}
      </p>

      <form action={action} className="mt-4 flex flex-col gap-3">
        <div className="field">
          <label htmlFor="departement">Département</label>
          <input id="departement" name="departement" defaultValue="75" className="input" />
        </div>
        <label className="flex items-center gap-2" style={{ fontSize: 14 }}>
          <input type="checkbox" name="send" defaultChecked /> Envoyer aussi une candidature test
        </label>
        <div className="field">
          <label htmlFor="email">Ton email (candidat de test)</label>
          <input id="email" name="email" type="email" className="input" />
        </div>
        <div className="field">
          <label htmlFor="phone">Ton téléphone (candidat de test)</label>
          <input id="phone" name="phone" type="tel" placeholder="06 12 34 56 78" className="input" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending || !sandboxKeySet}>
          {pending ? "Test en cours…" : "Lancer le test"}
        </button>
      </form>

      {result && (
        <div className="mt-5 flex flex-col gap-2">
          {result.steps.map((step) => (
            <div
              key={step.label}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${step.ok ? "var(--color-accent-600)" : "var(--color-neutral-400)"}`,
                fontSize: 13,
              }}
            >
              <strong>
                {step.ok ? "✅" : "❌"} {step.label}
              </strong>
              <p style={{ margin: "4px 0 0", wordBreak: "break-word" }}>{step.detail}</p>
            </div>
          ))}
          {result.samples.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
              {result.samples.map((s) => (
                <li key={s.recipient}>
                  {s.title} — {s.company} ({s.location})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
