"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Google refuse activement l'OAuth depuis les navigateurs "in-app" des
// réseaux sociaux (erreur "disallowed_useragent" côté Google, pas côté
// nous) -- TikTok, Instagram, Facebook, Messenger, Line, WeChat, Snapchat
// ouvrent tous les liens externes dans leur propre WebView plutôt que le
// navigateur du téléphone. Identifié le 27/09 comme cause probable de la
// chute clics pub -> inscriptions (Nathan : 106 clics TikTok, 6 inscrits) :
// quelqu'un qui clique "Continuer avec Google" depuis l'appli TikTok tombe
// sur un échec silencieux-ish (le bouton se réinitialise avec une erreur que
// beaucoup n'auront pas la patience de lire) plutôt que de simplement se
// rabattre sur le formulaire email, qui lui fonctionne dans n'importe quel
// WebView.
const IN_APP_BROWSER_PATTERN =
  /TikTok|BytedanceWebview|musical_ly|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat/i;

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return IN_APP_BROWSER_PATTERN.test(navigator.userAgent);
}

export function GoogleButton({
  referredByCode,
  affiliateCode,
  next = "/onboarding",
}: {
  referredByCode?: string | null;
  affiliateCode?: string | null;
  next?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Faux par défaut puis corrigé après montage (useEffect, jamais pendant le
  // rendu) : `navigator` n'existe pas côté serveur, donc évaluer ceci
  // pendant le rendu produirait un mismatch d'hydratation. Un utilisateur
  // hors WebView voit le bouton normal pendant une fraction de seconde puis
  // rien ne change ; un utilisateur en WebView le voit disparaître presque
  // immédiatement, avant d'avoir eu la chance de cliquer.
  const [blockedInAppBrowser, setBlockedInAppBrowser] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isInAppBrowser()) setBlockedInAppBrowser(true);
  }, []);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    if (referredByCode) {
      redirectTo.searchParams.set("ref", referredByCode);
    }
    if (affiliateCode) {
      redirectTo.searchParams.set("aff", affiliateCode);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });

    // En cas de succès, le navigateur est redirigé vers Google -- rien à
    // faire ici. En cas d'échec, le bouton se réinitialisait silencieusement
    // sans aucun message : depuis l'extérieur, ça ressemblait à "le bouton
    // ne fait rien", alors qu'une vraie erreur (provider Google pas activé
    // côté Supabase, requête réseau qui échoue...) était juste avalée.
    if (error) {
      setLoading(false);
      setError(error.message);
    }
  }

  if (blockedInAppBrowser) {
    return (
      <p
        className="text-sm"
        style={{
          margin: 0,
          padding: "10px 14px",
          borderRadius: "var(--radius-md, 8px)",
          background: "color-mix(in srgb, var(--color-text) 6%, transparent)",
          color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
        }}
      >
        La connexion Google ne fonctionne pas dans le navigateur intégré de cette appli (TikTok, Instagram...).
        Utilise le formulaire ci-dessous, ou ouvre ce lien dans Safari/Chrome.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn btn-secondary btn-block"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        Continuer avec Google
      </button>
      {error && (
        <p className="text-sm" style={{ color: "var(--color-accent-700)", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
