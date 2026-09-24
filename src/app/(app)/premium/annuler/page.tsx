import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPortalSessionAction } from "@/app/(app)/premium/actions";
import { submitCancellationFeedbackAction } from "./actions";

const REASONS = [
  "J'ai trouvé mon alternance",
  "Pas assez d'offres intéressantes",
  "Les offres ne correspondent pas à mon profil",
  "Trop cher",
  "Je n'en ai plus besoin actuellement",
  "Autre",
];

// Étape courte avant le vrai portail Stripe (RETENTION_AUDIT.md, section 20)
// -- jamais bloquante : "Passer" ci-dessous mène directement au portail,
// exactement comme le bouton "Gérer mon abonnement" le faisait avant.
export default async function CancelFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center py-10">
      <div className="card elev-sm w-full" style={{ padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Avant de partir…</h1>
        <p style={{ fontSize: 13.5, margin: "6px 0 0", color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
          Une réponse (optionnelle) nous aide à améliorer Stageio. Ça ne retarde pas ton annulation.
        </p>

        <form action={submitCancellationFeedbackAction} className="mt-5 flex flex-col gap-2">
          {REASONS.map((reason) => (
            <label
              key={reason}
              className="card flex-row items-center gap-2.5"
              style={{ padding: "10px 12px", cursor: "pointer", fontSize: 13.5 }}
            >
              <input type="radio" name="reason" value={reason} required />
              {reason}
            </label>
          ))}
          <textarea
            name="detail"
            placeholder="Qu'est-ce qui t'aurait fait rester ? (optionnel)"
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
          <button type="submit" className="btn btn-primary mt-3">
            Continuer vers la résiliation
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
              fontSize: 12.5,
              color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Passer, gérer mon abonnement directement
          </button>
        </form>
      </div>
    </div>
  );
}
