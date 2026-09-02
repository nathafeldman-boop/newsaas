"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { redeemAccessCodeAction, type RedeemCodeState } from "@/app/(app)/premium/access-code-actions";

const initialState: RedeemCodeState = { status: "idle" };

export function AccessCodeForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(redeemAccessCodeAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <div className="mt-4">
      <form action={formAction} className="flex items-center gap-2">
        <input
          name="code"
          placeholder="Code d'accès"
          className="input"
          style={{ background: "rgba(255,255,255,0.15)", color: "inherit" }}
        />
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
