import { createAdminClient } from "@/lib/supabase/admin";
import { approveAffiliateAction, rejectAffiliateAction, markCommissionsPaidAction } from "./actions";

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}

export default async function AdminAffiliatesPage() {
  const admin = createAdminClient();

  const { data: affiliates, error: affiliatesError } = await admin
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (affiliatesError) console.error("AdminAffiliatesPage: affiliates query failed", affiliatesError);

  const rows = affiliates ?? [];
  const userIds = rows.map((a) => a.user_id);
  const affiliateIds = rows.map((a) => a.id);

  const [{ data: profiles, error: profilesError }, { data: commissions, error: commissionsError }] =
    await Promise.all([
      userIds.length
        ? admin.from("profiles").select("id, email, full_name").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; email: string | null; full_name: string | null }[], error: null }),
      affiliateIds.length
        ? admin
            .from("affiliate_commissions")
            .select("affiliate_id, commission_cents, status")
            .in("affiliate_id", affiliateIds)
            .limit(5000)
        : Promise.resolve({ data: [] as { affiliate_id: string; commission_cents: number; status: string }[], error: null }),
    ]);
  if (profilesError) console.error("AdminAffiliatesPage: profiles query failed", profilesError);
  if (commissionsError) console.error("AdminAffiliatesPage: commissions query failed", commissionsError);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const totalsByAffiliate = new Map<string, { pendingCents: number; paidCents: number }>();
  for (const c of commissions ?? []) {
    const entry = totalsByAffiliate.get(c.affiliate_id) ?? { pendingCents: 0, paidCents: 0 };
    if (c.status === "paid") entry.paidCents += c.commission_cents;
    else entry.pendingCents += c.commission_cents;
    totalsByAffiliate.set(c.affiliate_id, entry);
  }

  const pending = rows.filter((a) => a.status === "pending");
  const approved = rows.filter((a) => a.status === "approved");
  const rejected = rows.filter((a) => a.status === "rejected");

  return (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Programme d&apos;affiliation</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        50% de commission sur les formules hebdo (4,50€) et mensuelle (7,99€), jamais la quotidienne.
      </p>

      <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Candidatures en attente ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Aucune candidature en attente.</p>
      ) : (
        <div className="flex flex-col gap-2.5" style={{ marginBottom: 24 }}>
          {pending.map((a) => {
            const profile = profileById.get(a.user_id);
            return (
              <div key={a.id} className="card" style={{ padding: "var(--space-4)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{profile?.full_name || profile?.email || "—"}</p>
                    <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                      {a.payout_email || profile?.email} · candidaté le {fmt(a.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <form action={approveAffiliateAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                        Approuver
                      </button>
                    </form>
                    <form action={rejectAffiliateAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                        Rejeter
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Affiliés approuvés ({approved.length})</h2>
      {approved.length === 0 ? (
        <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>Aucun affilié approuvé pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5" style={{ marginBottom: 24 }}>
          {approved.map((a) => {
            const profile = profileById.get(a.user_id);
            const totals = totalsByAffiliate.get(a.id) ?? { pendingCents: 0, paidCents: 0 };
            return (
              <div key={a.id} className="card" style={{ padding: "var(--space-4)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{profile?.full_name || profile?.email || "—"}</p>
                    <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                      Code {a.code} · paiement : {a.payout_email || "—"}
                    </p>
                  </div>
                  <span className="tag tag-accent" style={{ flexShrink: 0 }}>Approuvé</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      À payer
                    </p>
                    <p style={{ fontSize: 15, fontFamily: "var(--font-heading)", margin: "2px 0 0", color: totals.pendingCents > 0 ? "var(--color-accent-700)" : "inherit" }}>
                      {(totals.pendingCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Déjà payé
                    </p>
                    <p style={{ fontSize: 15, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {(totals.paidCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                </div>
                {totals.pendingCents > 0 && (
                  <form action={markCommissionsPaidAction} className="mt-3">
                    <input type="hidden" name="affiliateId" value={a.id} />
                    <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                      Marquer {(totals.pendingCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € comme payé
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejected.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Rejetées ({rejected.length})</h2>
          <div className="flex flex-col gap-2.5">
            {rejected.map((a) => {
              const profile = profileById.get(a.user_id);
              return (
                <div key={a.id} className="card" style={{ padding: "var(--space-4)", opacity: 0.6 }}>
                  <p style={{ fontSize: 13, margin: 0 }}>{profile?.full_name || profile?.email || "—"}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
