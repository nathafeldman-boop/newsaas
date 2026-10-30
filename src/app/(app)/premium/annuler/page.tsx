import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPortalSessionAction } from "@/app/(app)/premium/actions";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { requestNow } from "@/lib/applications/status";
import { submitCancellationFeedbackAction } from "./actions";

const REASONS = [
  "J'ai trouvé mon alternance",
  "Les offres sont trop loin de chez moi",
  "Les offres ne correspondent pas à ce que je cherche",
  "Pas assez d'offres intéressantes",
  "Trop cher",
  "Je n'en ai plus besoin actuellement",
  "Autre",
];

// Ce qui change en ce moment, à garder vrai : chaque ligne correspond à
// quelque chose qui est en ligne.
const CHANGES = [
  "Les offres déjà pourvues sont retirées chaque nuit.",
  "Peu d'offres près de chez toi ? Celles de ta région sont ajoutées.",
  "Ton deck met en avant les offres proches de chez toi et du métier que tu vises.",
];

const muted = "color-mix(in srgb, var(--color-text) 65%, transparent)";

// Étape avant le vrai portail Stripe (RETENTION_AUDIT.md, section 20 ;
// refaite le 30/10, Nathan : « une grosse image […] on est vraiment déçus
// […] on bosse jour et nuit pour que les offres soient plus pertinentes […]
// attendre une semaine ou deux […] dans tous les cas elle garde son accès
// jusqu'à la fin du mois payé, qu'elle en profite à fond »). Jamais
// bloquante : pas d'étape en plus (résiliation en 3 clics, art. L215-1-1),
// l'avis est facultatif et « Résilier directement » mène au portail.
export default async function CancelFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const product = profile && isAutoTier(profile) ? "Stageio Auto" : "Premium";
  const end = profile?.current_period_end ? new Date(profile.current_period_end) : null;
  const endLabel =
    end && Number.isFinite(end.getTime()) && end.getTime() > requestNow()
      ? end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })
      : null;

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col gap-4 py-8">
      <div className="card elev-sm animate-in w-full overflow-hidden" style={{ padding: 0 }}>
        <div
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            padding: "34px 0 26px",
            background: "linear-gradient(160deg, var(--color-accent) 0%, #0b6b3c 100%)",
          }}
        >
          <div className="cancel-heart" style={{ fontSize: 84, lineHeight: 1 }}>
            💔
          </div>
        </div>
        <div style={{ padding: "20px 22px 24px" }}>
          <h1 style={{ fontSize: 22, margin: 0, lineHeight: 1.25 }}>On est vraiment déçus de te voir partir</h1>
          <p style={{ fontSize: 14.5, margin: "8px 0 0", color: muted, lineHeight: 1.5 }}>
            On espérait t&apos;accompagner jusqu&apos;à ta signature. Avant de résilier, laisse-nous te dire où on en est.
          </p>

          <p style={{ fontSize: 14, fontWeight: 800, margin: "18px 0 8px" }}>On bosse jour et nuit pour que tes offres soient plus pertinentes :</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {CHANGES.map((c) => (
              <li key={c} style={{ fontSize: 13.5, lineHeight: 1.45, display: "flex", gap: 8 }}>
                <span aria-hidden>✅</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 14, background: "var(--color-accent-100)", border: "1.5px solid var(--color-accent)" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Donne-nous une ou deux semaines</p>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.45 }}>
              Si tu peux, garde ton abonnement encore un peu : tu verras la différence dans tes offres.
            </p>
            <Link href="/swipe" className="btn btn-primary btn-block" style={{ marginTop: 10, textDecoration: "none" }}>
              Je reste et je profite de mes offres
            </Link>
          </div>

          <p style={{ fontSize: 13.5, margin: "16px 0 0", lineHeight: 1.5 }}>
            <strong>Si tu résilies quand même :</strong> ton accès {product} reste ouvert{" "}
            {endLabel ? `jusqu'au ${endLabel}` : "jusqu'à la fin de la période déjà payée"}, et plus rien n&apos;est prélevé ensuite. Profites-en à
            fond jusque-là.
          </p>
        </div>
      </div>

      <div className="card elev-sm w-full" style={{ padding: "20px 22px" }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Ton avis nous aide à nous améliorer</h2>
        <p style={{ fontSize: 13, margin: "4px 0 0", color: muted }}>Facultatif : ça ne retarde pas ta résiliation.</p>
        <form action={submitCancellationFeedbackAction} className="mt-4 flex flex-col gap-2">
          {REASONS.map((reason) => (
            <label key={reason} className="card flex-row items-center gap-2.5" style={{ padding: "10px 12px", cursor: "pointer", fontSize: 13.5 }}>
              <input type="radio" name="reason" value={reason} required />
              {reason}
            </label>
          ))}
          <textarea
            name="detail"
            placeholder="Qu'est-ce qu'on doit améliorer en priorité ? (optionnel)"
            rows={3}
            className="mt-2"
            style={{
              width: "100%",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-divider)",
              padding: "10px 12px",
              fontSize: 13.5,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <button type="submit" className="btn btn-secondary mt-3">
            Envoyer mon avis et continuer la résiliation
          </button>
        </form>
        <form action={createPortalSessionAction} className="mt-2">
          <button
            type="submit"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: "8px 0",
              fontSize: 13,
              color: muted,
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            Résilier directement, sans donner d&apos;avis
          </button>
        </form>
      </div>
    </div>
  );
}
