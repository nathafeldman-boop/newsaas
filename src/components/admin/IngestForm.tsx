"use client";

import { useActionState } from "react";
import { ingestOfferAction, type IngestState } from "@/app/(app)/admin/offres/actions";

const initialState: IngestState = { status: "idle" };

export function IngestForm() {
  const [state, formAction, pending] = useActionState(
    ingestOfferAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="sourceUrl">URL de l&apos;offre</label>
        <input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://..." className="input" />
      </div>

      <p className="text-center text-xs" style={{ color: "color-mix(in srgb, var(--color-text) 40%, transparent)" }}>
        — ou —
      </p>

      <div className="field">
        <label htmlFor="rawText">Texte brut de l&apos;offre (copié-collé)</label>
        <textarea
          id="rawText"
          name="rawText"
          rows={8}
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

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? "Analyse par Mistral..." : "Analyser et ajouter l'offre"}
      </button>
    </form>
  );
}
