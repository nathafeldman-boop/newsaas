"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div className="card" style={{ fontSize: 14 }}>
          <p style={{ fontFamily: "var(--font-heading)", margin: 0 }}>Vérifie ta boîte mail 📬</p>
          <p style={{ margin: "4px 0 0", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
            On a envoyé un code à 6 chiffres à <b>{email}</b>.
          </p>
        </div>

        <div className="field">
          <label htmlFor="code">Code de vérification</label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="input"
            style={{ textAlign: "center", fontSize: 18, letterSpacing: "0.5em" }}
          />
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>{error}</p>}
        {resent && <p className="text-sm" style={{ color: "var(--color-accent-2-700)" }}>Nouveau code envoyé.</p>}

        <button type="submit" disabled={verifying || code.length !== 6} className="btn btn-primary btn-block">
          {verifying ? "Vérification..." : "Valider le code"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="btn btn-ghost"
          style={{ width: "100%" }}
        >
          {resending ? "Envoi..." : "Renvoyer le code"}
        </button>
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

        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
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
