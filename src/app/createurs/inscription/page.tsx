import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentCreator } from "@/lib/creators/access";
import { signupCreatorAction } from "../actions";

export const metadata: Metadata = { title: "Espace créateurs Stageio", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  nom: "Indique ton prénom et ton nom.",
  tel: "Indique un numéro de téléphone valide (06 12 34 56 78).",
  base: "L'inscription n'a pas marché, réessaie.",
};

// Inscription des créateurs (18/11, ouverte à tous le 19/11 : le lien
// d'invitation bloquait les créateurs) : nom et téléphone (pour savoir qui est qui et les joindre si besoin).
export default async function CreatorSignupPage({ searchParams }: { searchParams: Promise<{ i?: string; erreur?: string }> }) {
  const { i, erreur } = await searchParams;
  if (await currentCreator()) redirect("/createurs");
  const field = { width: "100%", marginTop: 6, fontWeight: 400 } as const;
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <div className="cockpit-card cockpit-hero w-full" style={{ padding: 28 }}>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 700 }}>Espace créateurs</p>
        <h1 style={{ fontSize: 28, margin: "8px 0 0", lineHeight: 1.15 }}>Suis tes vues et ce que tu gagnes avec Stageio</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "10px 0 0", color: "var(--color-neutral-600)" }}>
          Colle le lien de chaque TikTok que tu postes : on relève tes vues toutes les 30 minutes et tu vois tes gains en direct.
        </p>
        {erreur && ERRORS[erreur] && <p style={{ fontSize: 13.5, color: "var(--bad)", margin: "14px 0 0" }}>{ERRORS[erreur]}</p>}
        {(
          <form action={signupCreatorAction} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="i" value={i ?? ""} />
            <label style={{ fontSize: 14, fontWeight: 700 }}>
              Prénom et nom
              <input name="name" required autoComplete="name" className="input" style={field} />
            </label>
            <label style={{ fontSize: 14, fontWeight: 700 }}>
              Téléphone
              <input name="phone" required type="tel" autoComplete="tel" placeholder="06 12 34 56 78" className="input" style={field} />
              <span style={{ display: "block", fontWeight: 400, fontSize: 12.5, marginTop: 4, color: "var(--color-neutral-600)" }}>
                Seulement pour te joindre s&apos;il y a un souci avec une vidéo ou un paiement.
              </span>
            </label>
            <label style={{ fontSize: 14, fontWeight: 700 }}>
              Ton compte TikTok <span style={{ fontWeight: 400, color: "var(--color-neutral-600)" }}>(facultatif)</span>
              <input name="tiktok" placeholder="@toncompte" className="input" style={field} />
            </label>
            <button type="submit" className="btn btn-primary mt-2">
              Créer mon espace
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
