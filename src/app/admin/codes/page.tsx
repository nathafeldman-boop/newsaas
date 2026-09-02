import { createAdminClient } from "@/lib/supabase/admin";
import { createAccessCodeAction, deleteAccessCodeAction } from "./actions";

export default async function AdminCodesPage() {
  const admin = createAdminClient();
  const { data: codes } = await admin
    .from("access_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Codes d&apos;accès Premium</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        Débloque le Premium sans passer par Stripe (tests, cadeaux). N&apos;affecte jamais le revenu suivi.
      </p>

      <form
        action={createAccessCodeAction}
        className="card elev-sm flex flex-wrap items-end gap-3"
        style={{ padding: "var(--space-5)" }}
      >
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label htmlFor="note">Note (optionnel)</label>
          <input id="note" name="note" className="input" placeholder="Ex: testeur beta" />
        </div>
        <div className="field" style={{ width: 100 }}>
          <label htmlFor="maxUses">Utilisations</label>
          <input id="maxUses" name="maxUses" type="number" min={1} defaultValue={1} className="input" />
        </div>
        <button type="submit" className="btn btn-primary">
          Générer un code
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {(codes ?? []).map((c) => (
          <div key={c.id} className="card flex-row items-center justify-between" style={{ padding: "var(--space-4)" }}>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, margin: 0, letterSpacing: "0.04em" }}>
                {c.code}
              </p>
              <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
                {c.note ? `${c.note} · ` : ""}
                {c.use_count}/{c.max_uses} utilisé(s)
              </p>
            </div>
            <form action={deleteAccessCodeAction}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="btn btn-secondary">
                Supprimer
              </button>
            </form>
          </div>
        ))}
        {(!codes || codes.length === 0) && (
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun code créé pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
