import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { maskEmail } from "@/lib/premium/goOffer";
import { reconcileFromSession } from "@/lib/stripe/reconcileCheckout";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_EMAIL } from "@/lib/site";

// Retour de Stripe après un paiement ouvert depuis un lien d'email sans être
// connecté (6/11, voir /paiement). Même filet de secours que /premium/success
// (l'accès est posé tout de suite si le webhook tarde), puis connexion pour
// en profiter : la page ne connecte personne et ne montre rien du compte
// d'autre que le début de son adresse.
export const metadata: Metadata = {
  title: "Paiement reçu",
  robots: { index: false, follow: false },
};

export default async function PaiementRecuPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const sessionId = session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id) ? session_id : null;
  const afterLogin = sessionId ? `/premium/success?session_id=${sessionId}` : "/swipe";

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (user) redirect(afterLogin);

  const result = sessionId ? await reconcileFromSession(sessionId, null) : null;
  const email = result ? ((await createAdminClient().auth.admin.getUserById(result.userId)).data.user?.email ?? null) : null;
  const account = maskEmail(email);
  const paid = result?.paid ?? false;
  const muted = "color-mix(in srgb, var(--color-text) 64%, transparent)";

  return (
    <div className="flex flex-1 flex-col">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <p style={{ fontSize: 40, margin: 0 }}>{paid ? "🎉" : "⏳"}</p>
        <h1 style={{ fontSize: 24, margin: "14px 0 0" }}>{paid ? "Paiement reçu, ton accès est actif" : "Paiement en cours de validation"}</h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, margin: "10px 0 0", color: muted }}>
          {paid ? "Connecte-toi pour en profiter" : "Ton accès s'ouvre dès que Stripe confirme le paiement. Connecte-toi pour le voir"}
          {account ? <> avec ton compte <strong>{account}</strong>.</> : "."}
        </p>
        <Link href={`/login?next=${encodeURIComponent(afterLogin)}`} className="btn btn-primary" style={{ marginTop: 22 }}>
          Me connecter
        </Link>
        <p style={{ fontSize: 12.5, margin: "16px 0 0", color: muted }}>
          Un souci ? Écris-moi à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, je réponds moi-même. Nathan
        </p>
      </div>
    </div>
  );
}
