"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { reportUnavailableOfferAction, type ReportState } from "@/app/(app)/candidature/[offerId]/report-actions";

// Signaler une offre qui ne marche plus (29/10, satisfaction : premier motif
// de plainte dans les résiliations). Vérifiée tout de suite, retirée si c'est
// confirmé.

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ border: "none", background: "transparent", padding: 0, color: "var(--color-accent-700)", fontSize: 13, fontWeight: 600, textDecoration: "underline", cursor: pending ? "wait" : "pointer" }}
    >
      {pending ? "Vérification du lien…" : "Signaler"}
    </button>
  );
}

export function ReportOfferButton({ offerId }: { offerId: string }) {
  const [state, action] = useActionState<ReportState, FormData>(reportUnavailableOfferAction, { status: "idle", message: null });
  if (state.status === "removed" || state.status === "noted") {
    return (
      <div className="card animate-in" role="status" style={{ padding: "12px 14px", marginTop: 12 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{state.message}</p>
        <Link href="/swipe" className="btn btn-primary" style={{ marginTop: 10, padding: "8px 14px", fontSize: 13 }}>
          Voir les offres du jour
        </Link>
      </div>
    );
  }
  return (
    <form action={action} style={{ marginTop: 12, fontSize: 13, color: muted }}>
      <input type="hidden" name="offerId" value={offerId} />
      Le lien ne marche pas ou l&apos;offre n&apos;est plus disponible ? <Submit />
      {state.status === "error" && state.message && <span style={{ display: "block", color: "#b42318", marginTop: 4 }}>{state.message}</span>}
    </form>
  );
}
