"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export function RegisterForm() {
  const router = useRouter();
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
      router.push("/onboarding");
      router.refresh();
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
      router.push("/onboarding");
      router.refresh();
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
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-medium">Vérifie ta boîte mail 📬</p>
          <p className="mt-1 text-foreground/70">
            On a envoyé un code à 6 chiffres à <b>{email}</b>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="code">
            Code de vérification
          </label>
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
            className="w-full rounded-lg border border-border px-3 py-2 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {resent && <p className="text-sm text-green-600">Nouveau code envoyé.</p>}

        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="w-full rounded-full bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {verifying ? "Vérification..." : "Valider le code"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full text-center text-sm text-foreground/60 hover:text-foreground disabled:opacity-60"
        >
          {resending ? "Envoi..." : "Renvoyer le code"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton referredByCode={referredByCode} />

      <div className="flex items-center gap-3 text-xs text-foreground/40">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {referredByCode && (
          <p className="rounded-lg bg-brand/10 px-3 py-2 text-xs text-brand-dark">
            Tu as été invité·e avec le code <b>{referredByCode}</b> 🎉
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="fullName">
            Prénom et nom
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="mt-1 text-xs text-foreground/50">8 caractères minimum.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-foreground/60">
          Déjà inscrit·e ?{" "}
          <Link href="/login" className="text-brand font-medium">
            Connecte-toi
          </Link>
        </p>
      </form>
    </div>
  );
}
