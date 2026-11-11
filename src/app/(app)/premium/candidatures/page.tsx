import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { AUTO_DAILY_LIMIT } from "@/lib/pricing/plans";
import { CREDIT_PACKS, PACE_UNLOCK, euros, isPaceFree } from "@/lib/pricing/creditPacks";
import { UPSELL_PAGE } from "@/lib/stripe/startUpsellCheckout";
import { buyUpsellAction } from "./actions";

export const metadata = { title: "Candidatures en plus · Stageio" };

// Page de vente de l'upsell (11/11, Nathan) : packs de candidatures
// automatiques et levée de la pause de 4 h. Ouverte par le « + » du
// compteur en haut à droite et par les messages de limite du deck.

function paceFreeNow(until: string | null | undefined): boolean {
  return isPaceFree(until, Date.now());
}

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

export default async function CandidaturesEnPlusPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; retour?: string }>;
}) {
  const { ok, error, retour } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${UPSELL_PAGE}`);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!isPremium(profile)) redirect("/premium");

  const auto = isAutoTier(profile);
  const credits = Math.max(0, profile?.auto_credits ?? 0);
  const paceFree = paceFreeNow(profile?.auto_pace_free_until);

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 620 }}>
      <p style={{ color: "var(--color-accent-600)", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>CANDIDATURES EN PLUS</p>
      <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.15, margin: "6px 0 10px" }}>Envoie plus de candidatures, sans attendre demain.</h1>
      <p style={{ color: muted, marginBottom: 18 }}>
        {auto
          ? `Ta formule Auto envoie jusqu'à ${AUTO_DAILY_LIMIT} candidatures par jour. Les candidatures en plus partent dès que la limite du jour est atteinte. Elles n'expirent pas.`
          : "Avec des candidatures en plus, chaque like envoie ta candidature tout seul, comme avec la formule Auto. Elles n'expirent pas."}
      </p>

      {ok && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: "var(--color-accent-600)" }}>
          <strong>Paiement reçu, merci !</strong> Tes candidatures sont ajoutées dans quelques secondes. <Link href="/swipe">Retour aux offres</Link>
        </div>
      )}
      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          Le paiement n’a pas pu s’ouvrir. Réessaie dans un instant.
        </div>
      )}
      {retour && !ok && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          Paiement annulé, rien n’a été débité.
        </div>
      )}

      <div className="card" style={{ padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: muted }}>Candidatures achetées disponibles</span>
        <strong style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{credits.toLocaleString("fr-FR")}</strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
        {CREDIT_PACKS.map((pack) => (
          <form key={pack.id} action={buyUpsellAction} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, position: "relative", borderColor: pack.badge ? "var(--color-accent-600)" : undefined }}>
            <input type="hidden" name="kind" value="auto_credits" />
            <input type="hidden" name="pack" value={pack.id} />
            {pack.badge && (
              <span style={{ position: "absolute", top: -10, right: 12, background: "var(--color-accent-600)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>{pack.badge}</span>
            )}
            <span style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>+{pack.credits.toLocaleString("fr-FR")}</span>
            <span style={{ color: muted, fontSize: 14 }}>candidatures automatiques</span>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }}>
              {euros(pack.cents)}
            </button>
          </form>
        ))}
      </div>

      {(auto || credits > 0) && (
        <form action={buyUpsellAction} className="card" style={{ padding: 16, marginTop: 18 }}>
          <input type="hidden" name="kind" value="pace_unlock" />
          <strong style={{ fontSize: 17 }}>Plus de pause de 4 h</strong>
          <p style={{ color: muted, fontSize: 14, margin: "4px 0 10px" }}>
            {paceFree
              ? `Pause levée jusqu'au ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(Date.parse(profile?.auto_pace_free_until ?? ""))}. Tu peux la prolonger de ${PACE_UNLOCK.hours} h.`
              : `Après 25 envois en 4 h, l'envoi automatique fait une pause. Lève-la pendant ${PACE_UNLOCK.hours} h et continue à ton rythme.`}
          </p>
          <button type="submit" className="btn btn-secondary">
            Lever la pause · {euros(PACE_UNLOCK.cents)}
          </button>
        </form>
      )}

      <p style={{ color: muted, fontSize: 13, marginTop: 18 }}>Paiement unique par carte, sans abonnement. Les candidatures partent depuis ta boîte Stageio, avec ton CV.</p>
    </div>
  );
}
