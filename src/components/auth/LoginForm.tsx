"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/swipe";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      void supabase.from("user_events").insert({ user_id: user.id, event_type: "login" });
    }

    // Navigation complète (pas router.push) : juste après signInWithPassword,
    // le cache client du routeur peut encore contenir la réponse "non
    // connecté" de /swipe visitée avant login, et la resservir malgré
    // router.refresh() -- symptôme observé : il fallait se connecter deux
    // fois. Un rechargement complet repart avec les cookies de session à
    // jour, sans passer par ce cache.
    window.location.href = next;
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton next={next} />

      <div className="flex items-center gap-3 text-xs" style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
        <div className="h-px flex-1" style={{ background: "var(--color-divider)" }} />
        ou
        <div className="h-px flex-1" style={{ background: "var(--color-divider)" }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="text-sm" style={{ color: "var(--color-accent-700)" }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p
          className="text-center text-sm"
          style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}
        >
          Pas encore de compte ?{" "}
          <Link href="/inscription">Inscris-toi</Link>
        </p>
      </form>
    </div>
  );
}
