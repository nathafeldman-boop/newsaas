import Link from "next/link";

export default function PremiumSuccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-9">
      <p className="text-4xl">🎉</p>
      <h1 style={{ fontSize: 24, margin: "16px 0 0" }}>Bienvenue dans Premium</h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        Ton abonnement est en cours d&apos;activation (quelques secondes). Swipes
        illimités et audit CV sont débloqués.
      </p>
      <Link href="/swipe" className="btn btn-primary">
        Retourner au swipe
      </Link>
    </div>
  );
}
