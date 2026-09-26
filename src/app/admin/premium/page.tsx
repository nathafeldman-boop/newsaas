import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fixMissingLtvAction,
  reconcileAllInvoicesAction,
  reconcileAllSubscriptionsAction,
  sendIncompletePaymentReminderAction,
} from "@/app/admin/users/actions";

const STATUS_LABEL: Record<string, string> = {
  active: "Actif (mensuel)",
  trialing: "Essai",
  lifetime: "À vie",
  past_due: "Renouvellement en échec",
  incomplete: "Paiement jamais finalisé",
};

function fmt(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
}

// "Temps d'utilisation" : on n'a pas de tracking de durée de session, donc on
// reconstruit le signal le plus honnête possible à partir de ce qu'on a déjà
// (ancienneté du compte, dernière activité via last_active_at, nombre de
// connexions via user_events) plutôt que d'inventer une métrique.
export default async function AdminPremiumPage({
  searchParams,
}: {
  searchParams: Promise<{
    reconcile_checked?: string;
    reconcile_recovered?: string;
    reconcile_failed?: string;
    reconcile_error?: string;
    subreconcile_checked?: string;
    subreconcile_resynced?: string;
    subreconcile_failed?: string;
    subreconcile_error?: string;
  }>;
}) {
  const {
    reconcile_checked: reconcileChecked,
    reconcile_recovered: reconcileRecovered,
    reconcile_failed: reconcileFailed,
    reconcile_error: reconcileError,
    subreconcile_checked: subreconcileChecked,
    subreconcile_resynced: subreconcileResynced,
    subreconcile_failed: subreconcileFailed,
    subreconcile_error: subreconcileError,
  } = await searchParams;
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, subscription_status, premium_activated_at, total_paid_cents, created_at, last_active_at",
    )
    .in("subscription_status", ["active", "trialing", "lifetime"])
    .order("premium_activated_at", { ascending: false, nullsFirst: false });

  const rows = profiles ?? [];

  // Visibilité directe sur les comptes dont le paiement est en souci
  // (renouvellement en échec = "past_due", ou jamais finalisé au premier
  // paiement = "incomplete") -- inexistante avant ce correctif : cette page
  // ne listait QUE les abonnés actifs/essai, aucun moyen de voir d'un coup
  // d'œil combien de comptes sont concernés ni lesquels. Ajouté suite au
  // pic de renouvellements en échec signalé par Nathan le 2026-09-25.
  const { data: paymentIssueProfiles } = await admin
    .from("profiles")
    .select("id, full_name, email, subscription_status, current_period_end, incomplete_payment_reminder_sent_at")
    .in("subscription_status", ["past_due", "incomplete"])
    .order("current_period_end", { ascending: false, nullsFirst: false });

  const paymentIssueRows = paymentIssueProfiles ?? [];

  const sessionCounts = await Promise.all(
    rows.map((p) =>
      admin
        .from("user_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.id)
        .eq("event_type", "login"),
    ),
  );

  return (
    <div>
      <div className="flex items-center justify-between" style={{ margin: "0 0 6px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Premium payant</h1>
        <Link href="/admin/annulations" style={{ fontSize: 12.5 }}>
          Voir les annulations →
        </Link>
      </div>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "0 0 20px" }}>
        {rows.length} abonné(s) payant(s) (mensuel, essai ou à vie, hors codes offerts).
      </p>

      {paymentIssueRows.length > 0 && (
        <div className="card" style={{ padding: "var(--space-4)", marginBottom: 20, border: "1.5px solid var(--color-accent-2)" }}>
          <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>
            ⚠️ {paymentIssueRows.length} compte(s) avec un souci de paiement
          </p>
          <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "4px 0 0" }}>
            Renouvellement en échec ou jamais finalisé (carte à réautoriser, refusée, expirée...).
            Chacun reçoit un email automatique (une seule fois tant que le souci n&apos;est pas résolu) l&apos;invitant
            à mettre à jour sa carte depuis /premium.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {paymentIssueRows.map((p) => (
              <Link
                key={p.id}
                href={`/admin/users/${p.id}`}
                className="flex items-center justify-between gap-3 no-underline"
                style={{
                  color: "inherit",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--color-neutral-100)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 13.5 }}>{p.full_name || p.email}</p>
                  <p style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                    {p.email} · échéance {fmt(p.current_period_end)}
                    {p.incomplete_payment_reminder_sent_at ? " · relancé par email" : " · pas encore relancé"}
                  </p>
                </div>
                <span className="tag tag-neutral" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                  {STATUS_LABEL[p.subscription_status ?? ""] ?? p.subscription_status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reconcileError !== undefined && (
        <div
          className="card"
          style={{ padding: "var(--space-4)", marginBottom: 12, background: "var(--color-accent-100)" }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            La reconciliation a échoué avant de démarrer (voir les logs).
          </p>
        </div>
      )}

      {reconcileChecked !== undefined && (
        <div
          className="card"
          style={{
            padding: "var(--space-4)",
            marginBottom: 12,
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            {reconcileChecked} facture(s) Stripe vérifiée(s), {((Number(reconcileRecovered) || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € récupéré(s)
            {Number(reconcileFailed) > 0 ? ` — ${reconcileFailed} client(s) Stripe en échec (voir logs)` : ""}.
          </p>
        </div>
      )}

      <form
        action={reconcileAllInvoicesAction}
        className="card"
        style={{ padding: "var(--space-4)", marginBottom: 12, gap: 10 }}
      >
        <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>Réconcilier le LTV avec Stripe</p>
        <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
          Relit l&apos;historique réel des factures payées sur Stripe pour chaque client connu et
          crédite tout ce qui manque encore en base (voir la migration 20260913000000 pour la cause
          du trou historique). Sans risque à relancer : une facture déjà correctement créditée n&apos;est
          jamais comptée deux fois.
        </p>
        <button type="submit" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
          Lancer la réconciliation
        </button>
      </form>

      {subreconcileError !== undefined && (
        <div
          className="card"
          style={{ padding: "var(--space-4)", marginBottom: 12, background: "var(--color-accent-100)" }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            La reconciliation des abonnements a échoué avant de démarrer (voir les logs).
          </p>
        </div>
      )}

      {subreconcileChecked !== undefined && (
        <div
          className="card"
          style={{
            padding: "var(--space-4)",
            marginBottom: 12,
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            {subreconcileChecked} client(s) Stripe vérifié(s), {subreconcileResynced} resynchronisé(s)
            avec succès
            {Number(subreconcileFailed) > 0 ? ` — ${subreconcileFailed} client(s) Stripe en échec (voir logs)` : ""}.
          </p>
        </div>
      )}

      <form
        action={reconcileAllSubscriptionsAction}
        className="card"
        style={{ padding: "var(--space-4)", marginBottom: 12, gap: 10 }}
      >
        <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>Réconcilier le statut d&apos;abonnement avec Stripe</p>
        <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
          customer.subscription.updated peut arriver avant checkout.session.completed (ordre non
          garanti par Stripe) et se perdre en silence si le profil n&apos;a pas encore son
          stripe_customer_id -- corrigé pour tout nouvel événement, mais des clients déjà touchés
          avant ce correctif restent avec un statut périmé (payant compté &quot;gratuit&quot;, ou
          l&apos;inverse). Relit le dernier abonnement Stripe connu de chaque client et le réapplique.
          Sans risque à relancer.
        </p>
        <button type="submit" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
          Lancer la réconciliation
        </button>
      </form>

      <form
        action={sendIncompletePaymentReminderAction}
        className="card"
        style={{ padding: "var(--space-4)", marginBottom: 20, gap: 10 }}
      >
        <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>Relancer un paiement incomplet</p>
        <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
          Pour un cas vu directement dans le dashboard Stripe (statut &quot;Incomplet&quot;) : envoie le mail de
          relance tout de suite, sans attendre un nouvel événement Stripe. Sans effet si déjà envoyé à ce
          compte.
        </p>
        <div className="flex gap-2" style={{ marginTop: 4 }}>
          <input
            type="email"
            name="email"
            required
            placeholder="email@exemple.com"
            className="input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
            Envoyer la relance
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2.5">
        {rows.map((p, i) => {
          const memberDays = daysSince(p.created_at);
          const premiumDays = daysSince(p.premium_activated_at);
          const sessions = sessionCounts[i].count ?? 0;
          const ltvMissing = (p.total_paid_cents ?? 0) === 0;
          return (
            <div key={p.id} className="card" style={{ padding: "var(--space-4)" }}>
              <Link href={`/admin/users/${p.id}`} className="no-underline" style={{ color: "inherit" }}>
                <div className="flex items-center justify-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{p.full_name || p.email}</p>
                    <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: "2px 0 0" }}>
                      {p.email}
                    </p>
                  </div>
                  <span className="tag tag-accent" style={{ flexShrink: 0 }}>
                    {STATUS_LABEL[p.subscription_status ?? ""] ?? p.subscription_status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Payant depuis
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {p.premium_activated_at ? fmt(p.premium_activated_at) : "—"}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Membre depuis
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {memberDays === null ? "—" : `${memberDays} j (payant : ${premiumDays ?? "—"} j)`}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Dernière activité
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0" }}>
                      {fmt(p.last_active_at)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "color-mix(in srgb, var(--color-text) 60%, transparent)", margin: 0 }}>
                      Sessions · LTV
                    </p>
                    <p style={{ fontSize: 13, fontFamily: "var(--font-heading)", margin: "2px 0 0", color: ltvMissing ? "var(--color-accent-700)" : "inherit" }}>
                      {sessions} · {((p.total_paid_cents ?? 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                </div>
              </Link>

              {ltvMissing && (
                <form action={fixMissingLtvAction} className="mt-3">
                  <input type="hidden" name="userId" value={p.id} />
                  <input
                    type="hidden"
                    name="amountCents"
                    value={p.subscription_status === "lifetime" ? 7000 : 799}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    LTV à 0€ malgré paiement → Corriger ({p.subscription_status === "lifetime" ? "70" : "7,99"}€)
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun abonné payant pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
