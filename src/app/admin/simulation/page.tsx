import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { activeSimulation } from "@/lib/simulation/accounts";
import { endSimulationAction, startSimulationAction } from "./actions";

// Simulation du parcours (21/11, Nathan) : la vraie app, dans un cadre de
// téléphone, avec un compte de test neuf, gratuit ou Premium. Mêmes écrans,
// mêmes règles, mêmes offres que pour un vrai inscrit ; rien ne part chez
// les recruteurs, et tout est effacé à la fin (voir lib/simulation/accounts.ts).
export const metadata: Metadata = { title: "Simulation · Admin Stageio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const muted = { color: "var(--color-neutral-600)" } as const;

export default async function SimulationPage({ searchParams }: { searchParams: Promise<{ mode?: string; t?: string; erreur?: string; fin?: string }> }) {
  await requireAdminPage();
  const q = await searchParams;
  const active = await activeSimulation();
  const mode = q.mode === "premium" || q.mode === "gratuit" ? q.mode : null;
  const running = mode && active.includes(mode) ? mode : null;

  const startButton = (kind: "gratuit" | "premium", label: string, primary: boolean) => (
    <form action={startSimulationAction}>
      <input type="hidden" name="kind" value={kind} />
      <button type="submit" className={`btn${primary ? " btn-primary" : ""}`} style={{ fontSize: 14 }}>
        {label}
      </button>
    </form>
  );

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Simulation du parcours</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 0", maxWidth: "75ch", ...muted }}>
        La vraie app, avec un compte de test tout neuf : inscription, onboarding, swipe, paywall, Premium. Mêmes écrans et mêmes offres
        qu&apos;un vrai inscrit. Seules différences : aucune candidature ni relance ne part chez un recruteur, aucun e-mail n&apos;est envoyé
        au compte de test, et « Terminer » efface tout (rien ne reste dans les stats). Le paiement du compte gratuit est le vrai paiement
        Stripe : ne le termine pas.
      </p>

      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 14 }}>
        {startButton("gratuit", running === "gratuit" ? "↺ Recommencer en gratuit" : "▶ Parcours non Premium", running !== "premium")}
        {startButton("premium", running === "premium" ? "↺ Recommencer en Premium" : "▶ Parcours Premium", running === "premium")}
        {active.length > 0 && (
          <form action={endSimulationAction}>
            <button type="submit" className="btn" style={{ fontSize: 14 }}>
              ■ Terminer et tout effacer
            </button>
          </form>
        )}
      </div>
      {q.erreur && <p style={{ color: "var(--bad)", fontSize: 13.5, fontWeight: 700 }}>La simulation n&apos;a pas pu démarrer, réessaie.</p>}
      {q.fin && active.length === 0 && <p style={{ fontSize: 13.5, fontWeight: 700 }}>✅ Simulation terminée, comptes de test effacés.</p>}
      {active.length > 0 && !running && (
        <p style={{ fontSize: 13, fontWeight: 700 }}>Une simulation est encore en cours ({active.join(", ")}) : termine-la pour l&apos;effacer des stats.</p>
      )}

      {running && (
        <div className="flex flex-wrap gap-6" style={{ marginTop: 18, alignItems: "flex-start" }}>
          <div style={{ width: 390, maxWidth: "100%", height: 800, borderRadius: 36, overflow: "hidden", border: "10px solid #111", boxShadow: "0 20px 50px rgba(0,0,0,.25)", background: "#fff" }}>
            <iframe key={q.t} src="/onboarding" title={`Simulation ${running}`} style={{ width: "100%", height: "100%", border: 0 }} />
          </div>
          <div style={{ flex: "1 1 260px", fontSize: 13.5, lineHeight: 1.55 }}>
            <p style={{ margin: 0, fontWeight: 800 }}>{running === "premium" ? "Compte Premium (accès à vie)" : "Compte gratuit"}</p>
            <p style={{ margin: "6px 0 0", ...muted }}>
              {running === "premium"
                ? "Fais l'onboarding, puis swipe : tu vois exactement ce que voit un inscrit qui vient de payer."
                : "Fais l'onboarding, puis swipe et like : tu arrives sur l'aperçu de ta sélection puis le paywall, chrono compris."}
            </p>
            <p style={{ margin: "10px 0 0" }}>
              <a href="/onboarding" target="_blank" rel="noopener">
                Ouvrir en plein écran ↗
              </a>
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 12.5, ...muted }}>
              La session de test remplace ton compte Stageio dans ce navigateur jusqu&apos;à « Terminer ». Ton accès admin n&apos;est pas touché.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
