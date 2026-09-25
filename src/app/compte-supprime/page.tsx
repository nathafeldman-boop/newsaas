import Link from "next/link";

export const metadata = {
  title: "Compte supprimé — Stageio",
  robots: { index: false, follow: false },
};

// Atterrissage après deleteAccountAction (voir (app)/profil/delete-account-actions.ts)
// -- doit rester public : à ce stade le compte n'existe plus, donc plus
// aucune session ne peut faire passer le check d'auth du middleware.
export default function CompteSupprimePage() {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>

      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <p style={{ fontSize: 40, margin: 0 }}>✅</p>
        <h1 style={{ fontSize: 24, margin: "14px 0 0" }}>Ton compte a été supprimé</h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            margin: "10px 0 0",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          Ton profil, tes candidatures, ton CV et le reste de tes données ont
          été effacés. Si tu avais un abonnement Premium en cours, il a été
          résilié immédiatement.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
