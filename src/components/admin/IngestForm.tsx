"use client";

import { useActionState } from "react";
import { ingestOfferAction, type IngestState } from "@/app/admin/offres/actions";

const initialState: IngestState = { status: "idle" };

export function IngestForm() {
  const [state, formAction, pending] = useActionState(
    ingestOfferAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="sourceUrl">URL(s) de l&apos;offre — une par ligne</label>
        <textarea
          id="sourceUrl"
          name="sourceUrl"
          rows={4}
          placeholder={"https://...\nhttps://...\nhttps://..."}
          className="input"
        />
        <p style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", marginTop: 5 }}>
          Colle-en autant que tu veux : elles sont traitées une par une, sans
          limite. Les doublons (même URL déjà importée) sont automatiquement
          ignorés.
        </p>
      </div>

      <p className="text-center text-xs" style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
        — ou, pour une offre unique sans URL —
      </p>

      <div className="field">
        <label htmlFor="rawText">Texte brut de l&apos;offre (copié-collé)</label>
        <textarea
          id="rawText"
          name="rawText"
          rows={6}
          placeholder="Colle ici le contenu de l'annonce si l'URL n'est pas accessible..."
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="contractTypeHint">Indice type de contrat (optionnel)</label>
        <select id="contractTypeHint" name="contractTypeHint" className="input">
          <option value="">Laisser Mistral déterminer</option>
          <option value="alternance">Alternance</option>
          <option value="stage">Stage</option>
        </select>
      </div>

      {state.status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm" style={{ color: "var(--color-accent-2-700)" }}>Offre ajoutée : {state.offerTitle}</p>
      )}
      {state.status === "bulk_done" && state.results && (
        <div className="card" style={{ fontSize: 13 }}>
          <p style={{ fontFamily: "var(--font-heading)", margin: 0 }}>
            {state.results.filter((r) => r.ok).length} / {state.results.length} offres importées
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {state.results.map((r, i) => (
              <li key={i} style={{ color: r.ok ? "var(--color-accent-2-700)" : "var(--color-accent-700)" }}>
                {r.ok ? "✓" : "✕"} {r.ok ? r.title : `${r.url} — ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Analyse par Mistral..." : "Analyser et ajouter"}
      </button>
    </form>
  );
}
