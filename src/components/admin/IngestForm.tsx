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
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="sourceUrl">
          URL de l&apos;offre
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <p className="text-center text-xs text-foreground/40">— ou —</p>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="rawText">
          Texte brut de l&apos;offre (copié-collé)
        </label>
        <textarea
          id="rawText"
          name="rawText"
          rows={8}
          placeholder="Colle ici le contenu de l'annonce si l'URL n'est pas accessible..."
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="contractTypeHint">
          Indice type de contrat (optionnel)
        </label>
        <select
          id="contractTypeHint"
          name="contractTypeHint"
          className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Laisser Mistral déterminer</option>
          <option value="alternance">Alternance</option>
          <option value="stage">Stage</option>
        </select>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm text-green-600">
          Offre ajoutée : {state.offerTitle}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Analyse par Mistral..." : "Analyser et ajouter l'offre"}
      </button>
    </form>
  );
}
