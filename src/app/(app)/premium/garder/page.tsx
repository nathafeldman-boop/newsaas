import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { endDateLabel, findScheduledEnd, priceLabel } from "@/lib/stripe/keepPremium";
import { keepPremiumAction } from "./actions";

// « Garder mon Premium » (25/10) : lien de l'e-mail envoyé aux abonnés qui
// ont résilié. Montre la date de fin et ce qui s'arrête, et annule la
// résiliation en un clic (même prix, même échéance).

const LOST = ["Liker et mettre en favori", "Candidatures illimitées", "Lettres de motivation générées", "Audit de ton CV sur 100"];

const muted = "color-mix(in srgb, var(--color-text) 65%, transparent)";

export default async function KeepPremiumPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { ok, erreur } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium/garder");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const end = await findScheduledEnd(profile?.stripe_customer_id ?? null, user.id).catch((err) => {
    console.error("premium/garder: lecture Stripe en échec", err, { userId: user.id });
    return undefined;
  });

  // Rien de programmé et pas Premium : la page des offres.
  if (end === null && !ok && !(profile && isPremium(profile))) redirect("/premium");

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center py-10">
      <div className="card elev-sm w-full" style={{ padding: "var(--space-6)" }}>
        {erreur || end === undefined ? (
          <>
            <h1 style={{ fontSize: 20, margin: 0 }}>Petit souci</h1>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: muted }}>
              On n&apos;a pas pu mettre à jour ton abonnement. Réessaie dans une minute, ou réponds à notre e-mail : on s&apos;en occupe.
            </p>
            <Link href="/premium/garder" className="btn btn-primary mt-5" style={{ width: "100%" }}>
              Réessayer
            </Link>
          </>
        ) : end ? (
          <>
            <h1 style={{ fontSize: 20, margin: 0 }}>Ton Premium s&apos;arrête le {endDateLabel(end.endsAt)}</h1>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: muted }}>Tu as résilié : jusque-là tout reste ouvert. Ensuite, tu repasses en gratuit et ceci s&apos;arrête :</p>
            <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {LOST.map((l) => (
                <li key={l} style={{ fontSize: 14, display: "flex", gap: 8 }}>
                  <span aria-hidden style={{ color: "#b42318" }}>✕</span>
                  {l}
                </li>
              ))}
            </ul>
            <form action={keepPremiumAction} className="mt-5">
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Garder mon Premium
              </button>
            </form>
            <p style={{ fontSize: 12.5, margin: "10px 0 0", color: muted, textAlign: "center" }}>
              Même prix ({priceLabel(end)}), rien à payer aujourd&apos;hui : le prochain paiement tombe le {endDateLabel(end.endsAt)}. Tu pourras toujours résilier depuis ton profil.
            </p>
            <Link href="/swipe" style={{ display: "block", marginTop: 14, fontSize: 12.5, color: muted, textAlign: "center" }}>
              Non merci, je garde ma résiliation
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, margin: 0 }}>{ok ? "C'est gardé ✓" : "Ton Premium est actif"}</h1>
            <p style={{ fontSize: 14, margin: "8px 0 0", color: muted }}>
              {ok
                ? "Ta résiliation est annulée : ton abonnement continue au même prix, rien d'autre à faire."
                : "Aucune résiliation n'est programmée sur ton abonnement : rien à faire."}
            </p>
            <Link href="/swipe" className="btn btn-primary mt-5" style={{ width: "100%" }}>
              Voir mes offres
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
