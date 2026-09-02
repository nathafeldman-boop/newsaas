"use client";

import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { status: "idle" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6">
      <h1 style={{ fontSize: 24, margin: 0, textAlign: "center" }}>Stageio — Admin</h1>
      <p
        style={{
          fontSize: 13,
          marginTop: 6,
          textAlign: "center",
          color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
        }}
      >
        Entre le code d&apos;accès pour continuer.
      </p>
      <form action={formAction} className="mt-6 flex w-full flex-col gap-3">
        <input
          name="code"
          type="password"
          autoFocus
          placeholder="Code d'accès"
          className="input"
          autoComplete="off"
        />
        {state.status === "error" && (
          <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary btn-block">
          {pending ? "Vérification..." : "Entrer"}
        </button>
      </form>
    </div>
  );
}
