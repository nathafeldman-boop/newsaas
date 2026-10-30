import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { profilesByIds, type CockpitProfile } from "@/lib/admin/cockpit/db";
import { date, dateTime, euros, int } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import {
  SOURCE_LABELS,
  WITHDRAWAL_DAYS,
  buildRefundRequests,
  customerLinks,
  mentionsRefund,
  pendingPeople,
  stripeRefundComments,
  type RawRefundRequest,
} from "@/lib/admin/refunds";
import { GUARANTEE_REQUESTED_EVENT } from "@/lib/premium/guaranteeTerms";
import { REFUND_ACK_EVENT, REFUND_FOLLOW_UP_DAYS, followUpAt } from "@/lib/refunds/process";
import { createAdminClient } from "@/lib/supabase/admin";

// Remboursements (30/10, Nathan : « crée un onglet remboursement ») : toutes
// les demandes que l'app peut lire, celles à traiter d'abord, et les
// remboursements déjà faits dans Stripe. Voir lib/admin/refunds.ts.
export const maxDuration = 60;

const DAY = 86_400_000;
const muted = { color: "var(--color-neutral-600)" } as const;
const stripeCustomerUrl = (customer: string) => `https://dashboard.stripe.com/customers/${customer}`;

type CancellationRow = { user_id: string; reason: string; detail: string | null; created_at: string };
type EventRow = { user_id: string; created_at: string; metadata: Record<string, unknown> | null };

export default async function RemboursementsPage() {
  await requireAdminPage();
  const now = nowMs();
  const db = createAdminClient();
  const [{ snap, error }, cancellations, guarantee, acks] = await Promise.all([
    loadSnapshot(),
    db
      .from("subscription_cancellations")
      .select("user_id, reason, detail, created_at")
      .gte("created_at", new Date(now - 180 * DAY).toISOString())
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data, error: e }) => (e ? null : ((data ?? []) as CancellationRow[]))),
    db
      .from("user_events")
      .select("user_id, created_at, metadata")
      .eq("event_type", GUARANTEE_REQUESTED_EVENT)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error: e }) => (e ? null : ((data ?? []) as EventRow[]))),
    db
      .from("user_events")
      .select("user_id, created_at, metadata")
      .eq("event_type", REFUND_ACK_EVENT)
      .gte("created_at", new Date(now - 180 * DAY).toISOString())
      .limit(2000)
      .then(({ data, error: e }) => (e ? null : ((data ?? []) as EventRow[]))),
  ]);

  if (!snap) {
    return (
      <div>
        <h1 style={{ fontSize: 24, margin: 0 }}>Remboursements</h1>
        <Card>
          <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}).</p>
        </Card>
      </div>
    );
  }

  const raw: RawRefundRequest[] = [
    ...stripeRefundComments(snap),
    ...(cancellations ?? [])
      .filter((c) => mentionsRefund(`${c.reason} ${c.detail ?? ""}`))
      .map((c) => ({ source: "questionnaire" as const, at: Date.parse(c.created_at), userId: c.user_id, customer: null, text: c.detail ? `${c.reason} : ${c.detail}` : c.reason })),
    ...(guarantee ?? []).map((e) => ({
      source: "garantie" as const,
      at: Date.parse(e.created_at),
      userId: e.user_id,
      customer: null,
      text: `Garantie « aucun entretien en 2 mois » (${String(e.metadata?.plan ?? "formule inconnue")}, ${int(Number(e.metadata?.likes ?? 0))} likes)`,
    })),
  ];
  const requests = buildRefundRequests(raw, snap);
  // Accusé « on traite ta demande » envoyé pour cette demande (lib/refunds/process).
  const ackAt = (userId: string | null, at: number) =>
    userId
      ? ((acks ?? [])
          .filter((a) => a.user_id === userId && Date.parse(a.created_at) >= at - DAY)
          .map((a) => Date.parse(a.created_at))
          .sort((a, b) => a - b)[0] ?? null)
      : null;
  const pending = pendingPeople(requests);

  const since90 = now - 90 * DAY;
  const refunds = snap.refunds.filter((r) => r.created >= since90).sort((a, b) => b.created - a.created);
  const disputes = snap.disputes.filter((d) => d.created >= since90);
  const { byCustomer } = customerLinks(snap);
  const profiles = await profilesByIds([
    ...requests.map((r) => r.userId).filter((id): id is string => !!id),
    ...refunds.map((r) => byCustomer.get(r.customer)).filter((id): id is string => !!id),
  ]).catch(() => new Map<string, CockpitProfile>());
  const emailOf = (userId: string | null) => (userId ? (profiles.get(userId)?.email ?? null) : null);

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: 0 }}>Remboursements</h1>
      <p style={{ fontSize: 13.5, margin: "6px 0 0", maxWidth: "80ch", ...muted }}>
        Toutes les demandes de remboursement que l&apos;app peut lire : commentaire laissé en résiliant dans Stripe, questionnaire de départ et
        formulaire de la garantie. Le remboursement se fait à la main dans Stripe (fiche du client › paiement › Rembourser) ; la demande passe
        alors toute seule en « remboursé ». Les e-mails envoyés à contact@stageio.fr n&apos;apparaissent pas ici : regarde ta boîte.
        Procédure : dès la demande, l&apos;e-mail « on traite ta demande, on te répond au plus vite » part tout seul (résiliation Stripe et
        questionnaire) ; {REFUND_FOLLOW_UP_DAYS} jours après, sans remboursement, un mois offert (abonnement prolongé dans Stripe, sans
        prélèvement) et l&apos;e-mail qui l&apos;annonce. Accès à vie : à décider.
      </p>

      <div style={{ marginTop: 16 }}>
        <KpiGrid>
          <Kpi
            hero
            accent="pink"
            label="À traiter"
            value={int(pending.total)}
            sub={pending.total === 0 ? "Aucune demande en attente" : "personne(s) sans remboursement fait depuis leur demande"}
            goodWhen="down"
            definition="Personnes qui ont demandé un remboursement (Stripe, questionnaire ou garantie) et pour qui aucun remboursement Stripe n'a été fait depuis. Une réponse par e-mail ne change pas ce compteur : seul un remboursement le fait."
            source="Stripe + Supabase"
          />
          <Kpi
            accent="amber"
            label={`Demandées dans les ${WITHDRAWAL_DAYS} jours`}
            value={int(pending.withinWithdrawal)}
            sub="parmi celles à traiter"
            definition={`Demandes faites moins de ${WITHDRAWAL_DAYS} jours après le premier paiement : le délai de rétractation du Code de la consommation. Les CGV disent que l'étudiant y renonce en payant, mais le paiement ne lui fait pas cocher de case de renonciation : en cas de contestation, un refus est plus fragile.`}
            source="Stripe, premier paiement du client"
          />
          <Kpi
            accent="green"
            label="Remboursé (90 j)"
            value={euros(refunds.reduce((s, r) => s + r.amount, 0))}
            sub={`${int(refunds.length)} remboursement(s)`}
            definition="Remboursements faits dans Stripe ces 90 derniers jours, tous motifs confondus. Déjà déduits du revenu dans Revenus et Objectifs."
            source="Stripe, refunds"
          />
          <Kpi
            accent="violet"
            label="Litiges (90 j)"
            value={int(disputes.length)}
            sub="contestations auprès de la banque"
            goodWhen="down"
            definition="Paiements contestés par le client auprès de sa banque (chargeback). Chaque litige coûte des frais Stripe en plus du montant, même gagné."
            source="Stripe, disputes"
          />
        </KpiGrid>
      </div>

      <Section title="Demandes" subtitle={`${int(requests.length)} demande(s) : celles à traiter d'abord, puis les plus récentes.`}>
        {requests.length === 0 ? (
          <Card>
            <p style={{ margin: 0, fontSize: 13.5 }}>Aucune demande de remboursement pour l&apos;instant.</p>
          </Card>
        ) : (
          <div className="cockpit-card" style={{ overflowX: "auto" }}>
            <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th style={{ textAlign: "left" }}>Client</th>
                  <th style={{ textAlign: "left" }}>Ce qu&apos;il dit</th>
                  <th style={{ textAlign: "left" }}>Payé</th>
                  <th style={{ textAlign: "left" }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const email = emailOf(r.userId);
                  return (
                    <tr key={`${r.source}-${r.userId ?? r.customer}-${r.at}`} style={{ verticalAlign: "top" }}>
                      <td style={{ textAlign: "left" }}>
                        {dateTime(r.at)}
                        <div style={{ fontSize: 12, ...muted }}>{SOURCE_LABELS[r.source]}</div>
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {r.userId ? <Link href={`/admin/users/${r.userId}`}>{email ?? "Fiche"}</Link> : (email ?? r.customer ?? "—")}
                        <div style={{ fontSize: 12 }}>
                          {r.customer && (
                            <a href={stripeCustomerUrl(r.customer)} target="_blank" rel="noreferrer">
                              Ouvrir dans Stripe
                            </a>
                          )}
                          {email && (
                            <>
                              {r.customer && " · "}
                              <a href={`mailto:${email}?subject=${encodeURIComponent("Ta demande de remboursement Stageio")}`}>Répondre</a>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "left", whiteSpace: "normal", minWidth: 220, maxWidth: 420 }}>{r.text ?? "—"}</td>
                      <td style={{ textAlign: "left" }}>
                        {r.paidCents > 0 ? euros(r.paidCents, { decimals: true }) : "—"}
                        {r.daysAfterFirstPayment !== null && (
                          <div style={{ fontSize: 12, ...muted }}>
                            demande {r.daysAfterFirstPayment === 0 ? "le jour du paiement" : `${r.daysAfterFirstPayment} j après le paiement`}
                          </div>
                        )}
                        {r.withinWithdrawal && r.refundedCents === 0 && <span className="cockpit-pill">moins de {WITHDRAWAL_DAYS} j</span>}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {r.refundedCents > 0 ? `✅ ${euros(r.refundedCents, { decimals: true })} le ${date(r.refundedAt)}` : "⏳ À traiter"}
                        {r.refundedCents === 0 &&
                          (() => {
                            const ack = ackAt(r.userId, r.at);
                            if (ack === null) return <div style={{ fontSize: 12, ...muted }}>Pas d&apos;accusé envoyé</div>;
                            const due = followUpAt(ack);
                            return (
                              <>
                                <div style={{ fontSize: 12, ...muted }}>Accusé envoyé le {date(ack)}</div>
                                <div style={{ fontSize: 12, ...muted }}>Mois offert prévu le {date(due)}</div>
                                {now >= due && <span className="cockpit-pill">réponse à faire</span>}
                              </>
                            );
                          })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Remboursements faits (90 j)" subtitle="Tous les remboursements Stripe, demandés ici ou ailleurs.">
        {refunds.length === 0 ? (
          <Card>
            <p style={{ margin: 0, fontSize: 13.5 }}>Aucun remboursement ces 90 derniers jours.</p>
          </Card>
        ) : (
          <div className="cockpit-card" style={{ overflowX: "auto" }}>
            <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th style={{ textAlign: "left" }}>Client</th>
                  <th>Montant</th>
                  <th>Stripe</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => {
                  const userId = byCustomer.get(r.customer) ?? null;
                  const email = emailOf(userId);
                  return (
                    <tr key={r.id}>
                      <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>{dateTime(r.created)}</td>
                      <td style={{ textAlign: "left" }}>{userId ? <Link href={`/admin/users/${userId}`}>{email ?? "Fiche"}</Link> : r.customer}</td>
                      <td>{euros(r.amount, { decimals: true })}</td>
                      <td>
                        <a href={stripeCustomerUrl(r.customer)} target="_blank" rel="noreferrer">
                          Ouvrir
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
