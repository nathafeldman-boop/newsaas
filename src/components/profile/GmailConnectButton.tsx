"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function GmailConnectButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();

    const redirectTo = new URL(
      "/auth/gmail-callback",
      window.location.origin,
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
        scopes: GMAIL_SCOPE,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setLoading(false);
    }
    // en cas de succès, le navigateur est redirigé vers Google — pas de suite ici
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn btn-secondary btn-block"
    >
      {loading ? "Redirection..." : "Connecter Gmail"}
    </button>
  );
}
