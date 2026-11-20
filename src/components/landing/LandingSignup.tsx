"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Inscription dès la page d'accueil (20/11, checklist « landing qui convertit ») :
// « Continuer avec Google » en premier. Dans les navigateurs des applis
// (TikTok, Instagram…), Google refuse la connexion : on montre alors un seul
// gros bouton vers l'inscription par e-mail, qui marche partout.
const IN_APP = /TikTok|BytedanceWebview|musical_ly|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat/i;

const white: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  background: "#fff",
  color: "#0d1b14",
  fontWeight: 800,
  fontSize: 16,
  borderRadius: 14,
  padding: "15px 18px",
  border: 0,
  boxShadow: "0 8px 22px rgba(0,0,0,.15)",
  cursor: "pointer",
  textDecoration: "none",
};

export function LandingSignup({ onDark = true }: { onDark?: boolean }) {
  const [inApp, setInApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (IN_APP.test(navigator.userAgent)) setInApp(true);
  }, []);

  async function google() {
    setLoading(true);
    setError(null);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/onboarding");
    const { error: err } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo.toString() } });
    if (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  const linkColor = onDark ? "#fff" : "var(--color-text)";

  if (inApp) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
        <Link href="/inscription" style={white}>
          Créer mon compte
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
      <button type="button" onClick={google} disabled={loading} style={white}>
        <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        {loading ? "Un instant…" : "Continuer avec Google"}
      </button>
      <Link href="/inscription" style={{ textAlign: "center", color: linkColor, fontWeight: 700, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 3, opacity: 0.9 }}>
        ou avec ton e-mail
      </Link>
      {error && <p style={{ margin: 0, fontSize: 13, color: linkColor }}>{error}</p>}
    </div>
  );
}
