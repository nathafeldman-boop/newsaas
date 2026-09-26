"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { redeemAccessCodeAction, type RedeemCodeState } from "@/app/(app)/premium/access-code-actions";

const initialState: RedeemCodeState = { status: "idle" };

export function AccessCodeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(redeemAccessCodeAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  // Rendu inline (pas de wrapper block/centré) : ce bouton fermé vit dans la
  // même ligne que "Paiement sécurisé · Résiliable à tout moment" (voir
  // PricingSelector.tsx) -- c'est à l'appelant de gérer l'espacement/mise en
  // page autour, ce composant ne doit imposer ni margin ni centrage qui
  // casserait cet alignement en ligne.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--color-accent-700)",
          cursor: "pointer",
        }}
      >
        J&apos;ai un code
      </button>
    );
  }

  return (
    <div className="mt-3" style={{ width: "100%" }}>
      <form action={formAction} className="flex items-center gap-2">
        <input name="code" placeholder="Code d'accès" className="input" autoFocus />
        <button type="submit" disabled={pending} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
          {pending ? "..." : "Valider"}
        </button>
      </form>
      {state.status !== "idle" && (
        <p style={{ fontSize: 12, marginTop: 8 }}>{state.message}</p>
      )}
    </div>
  );
}
