"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const canSubmit = fullName.trim().length > 0 && email.includes("@") && password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referred_by_code: referredByCode ?? undefined,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      if (referredByCode) {
        void fetch("/api/referrals/notify", { method: "POST", keepalive: true });
      }
      // Navigation complète, pas router.push : voir LoginForm pour le
      // symptôme (cache client resservant l'état "non connecté").
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/onboarding";
      return;
    }

    setAwaitingCode(true);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    setVerifying(false);

    if (error) {
      setError(
        error.message.toLowerCase().includes("expired") ||
          error.message.toLowerCase().includes("invalid")
          ? "Code invalide ou expiré. Redemande-en un ci-dessous."
          : error.message,
      );
      return;
    }

    if (data.session) {
      if (referredByCode) {
        void fetch("/api/referrals/notify", { method: "POST", keepalive: true });
      }
      // Navigation complète, pas router.push : voir LoginForm pour le
      // symptôme (cache client resservant l'état "non connecté").
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/onboarding";
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);

    if (error) {
      setError(error.message);
      return;
    }
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  if (awaitingCode) {
    const canVerify = code.length === 6;
    return (
      <form onSubmit={handleVerify} className="flex flex-col">
        <div
          className="flex flex-col items-center text-center"
          style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "32px 24px", boxShadow: "var(--shadow-lg)" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
            style={{ fontSize: 40, marginBottom: 14 }}
          >
            📬
          </motion.div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Vérifie ta boîte mail</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "8px 0 26px", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
            On a envoyé un code à 6 chiffres à
            <br />
            <strong style={{ color: "var(--color-text)" }}>{email}</strong>
          </p>

          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="input"
            style={{ textAlign: "center", fontSize: 30, fontWeight: 800, letterSpacing: "0.4em", padding: "14px 0 14px 16px", marginBottom: 20 }}
          />

          {error && (
            <p className="text-sm" style={{ color: "var(--color-accent-700)", marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || !canVerify}
            className="btn btn-block"
            style={{
              height: 50,
              border: "none",
              background: canVerify ? "var(--color-accent)" : "var(--color-text)",
              color: "var(--color-bg)",
              opacity: canVerify ? 1 : 0.35,
              fontWeight: 700,
            }}
          >
            {verifying ? "Vérification..." : "Valider le code"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", marginTop: 16, fontSize: 13.5, fontWeight: 700, color: "var(--color-accent-700)", cursor: "pointer" }}
          >
            {resending ? "Envoi..." : resent ? "Nouveau code envoyé ✓" : "Renvoyer le code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton referredByCode={referredByCode} />

      <div className="flex items-center gap-3 text-xs" style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
        <div className="h-px flex-1" style={{ background: "var(--color-divider)" }} />
        ou
        <div className="h-px flex-1" style={{ background: "var(--color-divider)" }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {referredByCode && (
          <p className="tag tag-accent" style={{ padding: "7px 12px", fontSize: 12 }}>
            Tu as été invité·e avec le code <b>&nbsp;{referredByCode}</b> 🎉
          </p>
        )}

        <div className="field">
          <label htmlFor="fullName">Prénom et nom</label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <p style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", margin: "5px 0 0" }}>
            8 caractères minimum.
          </p>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn btn-block"
          style={{
            border: "none",
            background: canSubmit ? "var(--color-accent)" : "var(--color-text)",
            color: "var(--color-bg)",
            opacity: canSubmit ? 1 : 0.35,
            fontWeight: 700,
          }}
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <p
          className="text-center"
          style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", margin: "-6px 0 0" }}
        >
          En créant un compte, tu acceptes les{" "}
          <Link href="/legal/cgu">CGU</Link> et la{" "}
          <Link href="/legal/confidentialite">politique de confidentialité</Link>.
        </p>

        <p
          className="text-center text-sm"
          style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}
        >
          Déjà inscrit·e ? <Link href="/login">Connecte-toi</Link>
        </p>
      </form>
    </div>
  );
}
