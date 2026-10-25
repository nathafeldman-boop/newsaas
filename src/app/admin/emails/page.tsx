import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { int, parsePeriod, pct, periodRanges, type PeriodDays } from "@/lib/admin/cockpit/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { WINBACK_EVENT } from "@/lib/churn/outreach";
import { KEEP_PREMIUM_EVENT } from "@/lib/stripe/keepPremium";
import { loadSnapshot } from "@/lib/admin/cockpit/load";
import { ATTRIBUTION_WINDOW_MS, attributeEmailRevenue, type EmailSend, type FirstPayment } from "@/lib/admin/emailRevenue";
import { DAY_MS, dayKey, daysBetween } from "@/lib/admin/trafficStats";
import { euros, startOfParisDay } from "@/lib/admin/cockpit/format";
import { CHECKOUT_RELANCE_EVENT } from "@/lib/campaigns/relanceCheckout";
import { CAMPAIGN_EVENT, NEWS_CAMPAIGN_EVENT } from "@/lib/campaigns/relanceOffres";
import { GUARANTEE_REMINDED_EVENT } from "@/lib/premium/guaranteeTerms";
import { ALERT_SENT_EVENT } from "@/lib/alerts/offerAlert";

// E-mails et relances : ce que Stageio envoie, à qui, et ce qui revient.
// Envois : registre user_events (campagnes) et dates de dernier envoi des
// profils (relances automatiques). Clics : visites arrivées avec
// utm_source=email. Délivrabilité : événements du webhook Resend, s'il est
// configuré (la clé d'API est en envoi seul et ne peut pas les relire).
export const maxDuration = 60;

const CAMPAIGNS = [
  { event: SALES_SERIES_EVENT, label: "Série Premium (le même e-mail chaque jour depuis le 26/10, 5 au plus)" },
  { event: CHECKOUT_DAILY_EVENT, label: "Panier abandonné (chaque matin, depuis le 26/10)" },
  { event: KEEP_PREMIUM_EVENT, label: "Message de départ : résiliation programmée" },
  { event: WINBACK_EVENT, label: "Message de départ : abonnés partis" },
  { event: CAMPAIGN_EVENT, label: "Relance « offres qui t'attendent »" },
  { event: NEWS_CAMPAIGN_EVENT, label: "Relance « nouveautés »" },
  { event: CHECKOUT_RELANCE_EVENT, label: "Relance paiement non finalisé (23/10)" },
  { event: GUARANTEE_REMINDED_EVENT, label: "Rappel de garantie remboursement" },
  { event: ALERT_SENT_EVENT, label: "Alertes nouvelles offres (notées depuis le 24/10)" },
];

const REMINDERS = [
  { column: "last_offer_alert_sent_at", label: "Alertes nouvelles offres : comptes passés en revue (avec ou sans e-mail)" },
  { column: "no_swipe_reminder_sent_at", label: "Rappel « tu n'as pas encore swipé »" },
  { column: "swipe_relance_sent_at", label: "Relance après swipes" },
  { column: "checkout_abandoned_reminder_sent_at", label: "« Tu y étais presque » (paiement abandonné)" },
  { column: "incomplete_payment_reminder_sent_at", label: "Paiement incomplet / impayé" },
] as const;

const DELIVERY = [
  { event: "email_bounced", label: "Rebonds" },
  { event: "email_complained", label: "Plaintes (spam)" },
  { event: "email_delivery_delayed", label: "Livraisons retardées" },
  { event: "email_failed", label: "Échecs d'envoi" },
];

const loadEmailStats = unstable_cache(
  async (days: PeriodDays) => {
    const db = createAdminClient();
    const { current } = periodRanges(days, Date.now());
    const startIso = new Date(current.start).toISOString();
    const endIso = new Date(current.end).toISOString();

    const campaigns = await Promise.all(
      CAMPAIGNS.map(async (c) => {
        const [{ count: total }, rows] = await Promise.all([
          db.from("user_events").select("id", { count: "exact", head: true }).eq("event_type", c.event),
          fetchAllRows<{ user_id: string }>((from, to) =>
            db.from("user_events").select("user_id").eq("event_type", c.event).gte("created_at", startIso).lt("created_at", endIso).range(from, to),
          ),
        ]);
        return { ...c, total: total ?? 0, inPeriod: rows.length, recipients: new Set(rows.map((r) => r.user_id)).size };
      }),
    );

    const reminders = await Promise.all(
      REMINDERS.map(async (r) => {
        const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).gte(r.column, startIso).lt(r.column, endIso);
        return { ...r, count: count ?? 0 };
      }),
    );

    const visits = await fetchAllRows<{ visitor_id: string; utm_medium: string | null; utm_campaign: string | null }>((from, to) =>
      db.from("site_visits").select("visitor_id, utm_medium, utm_campaign").eq("utm_source", "email").gte("created_at", startIso).lt("created_at", endIso).range(from, to),
    );
    const byCampaign = new Map<string, Set<string>>();
    for (const v of visits) {
      const key = `${v.utm_medium ?? "—"} · ${v.utm_campaign ?? "—"}`;
      const set = byCampaign.get(key) ?? new Set<string>();
      set.add(v.visitor_id);
      byCampaign.set(key, set);
    }
    const clicks = [...byCampaign.entries()].map(([key, set]) => ({ key, visitors: set.size })).sort((a, b) => b.visitors - a.visitors);

    const delivery = await Promise.all(
      DELIVERY.map(async (d) => {
        const { count } = await db.from("user_events").select("id", { count: "exact", head: true }).eq("event_type", d.event).gte("created_at", startIso).lt("created_at", endIso);
        return { ...d, count: count ?? 0 };
      }),
    );
    const { count: deliveryEver } = await db.from("user_events").select("id", { count: "exact", head: true }).in("event_type", DELIVERY.map((d) => d.event));
    const { count: optedOut } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("notify_new_offers", false);
    const { count: accounts } = await db.from("profiles").select("id", { count: "exact", head: true });

    return {
      computedAt: Date.now(),
      campaigns,
      reminders,
      clicks,
      clickVisitors: new Set(visits.map((v) => v.visitor_id)).size,
      delivery,
      webhookConfigured: (deliveryEver ?? 0) > 0,
      optedOut: optedOut ?? 0,
      accounts: accounts ?? 0,
    };
  },
  ["cockpit-email-stats-v2"],
  { revalidate: 900 },
);

// Ce que rapporte chaque e-mail : premiers paiements (Stripe) rattachés au
// dernier e-mail reçu dans les 48 h (voir lib/admin/emailRevenue.ts).
const REVENUE_SOURCES = [
  { key: "serie", label: "Série Premium", events: [SALES_SERIES_EVENT] },
  { key: "panier", label: "Panier abandonné", events: [CHECKOUT_DAILY_EVENT, CHECKOUT_RELANCE_EVENT] },
  { key: "depart", label: "Message de départ", events: [KEEP_PREMIUM_EVENT, WINBACK_EVENT] },
  { key: "campagnes", label: "Autres campagnes", events: [CAMPAIGN_EVENT, NEWS_CAMPAIGN_EVENT] },
];
const REVENUE_DAYS = 14;

const loadEmailRevenue = unstable_cache(
  async () => {
    const now = Date.now();
    const since = startOfParisDay(now) - (REVENUE_DAYS - 1) * DAY_MS;
    const db = createAdminClient();
    const sourceOf = new Map(REVENUE_SOURCES.flatMap((s) => s.events.map((e) => [e, s.key] as const)));
    const [rows, kept, surveys, { snap }] = await Promise.all([
      fetchAllRows<{ user_id: string; event_type: string; created_at: string; metadata: { skipped?: boolean } | null }>((from, to) =>
        db
          .from("user_events")
          .select("user_id, event_type, created_at, metadata")
          .in("event_type", [...sourceOf.keys()])
          .gte("created_at", new Date(since).toISOString())
          .order("created_at")
          .range(from, to),
      ),
      db.from("user_events").select("id", { count: "exact", head: true }).eq("event_type", "subscription_kept").gte("created_at", new Date(since).toISOString()),
      db.from("user_events").select("id", { count: "exact", head: true }).eq("event_type", "churn_survey").gte("created_at", new Date(since).toISOString()),
      loadSnapshot(),
    ]);
    // Comptes notés sans envoi (exclus du message de départ) : pas des e-mails.
    const sends: EmailSend[] = rows.filter((r) => !r.metadata?.skipped).map((r) => ({ userId: r.user_id, at: Date.parse(r.created_at), source: sourceOf.get(r.event_type)! }));
    const payments: FirstPayment[] = [];
    if (snap) {
      const subUser = new Map(snap.subs.map((s) => [s.id, s.userId]));
      for (const i of snap.invoices) {
        const userId = i.subscription ? subUser.get(i.subscription) : null;
        if (userId && i.billingReason === "subscription_create" && i.status === "paid" && i.amountPaid > 0) payments.push({ userId, at: i.paidAt ?? i.created, cents: i.amountPaid });
      }
      for (const o of snap.oneTime) payments.push({ userId: o.userId, at: o.created, cents: o.amountCents });
    }
    const days = daysBetween(since, now).map((d) => d.key);
    return {
      computedAt: now,
      stripeOk: !!snap,
      days: attributeEmailRevenue(sends, payments, REVENUE_SOURCES.map((s) => s.key), days).reverse(),
      kept: kept.count ?? 0,
      surveys: surveys.count ?? 0,
    };
  },
  ["cockpit-email-revenue-v1"],
  { revalidate: 600 },
);

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireAdminPage();
  const { p } = await searchParams;
  const period = parsePeriod(p);
  const stats = await loadEmailStats(period).catch((err) => {
    console.error("cockpit: stats e-mails en échec", err);
    return null;
  });
  if (!stats) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture de la base impossible pour l&apos;instant.</p>
      </Card>
    );
  }
  const sentInPeriod = stats.campaigns.reduce((s, c) => s + c.inPeriod, 0);
  const revenue = await loadEmailRevenue().catch((err) => (console.error("cockpit: revenus des e-mails en échec", err), null));
  const revenueTotal = (key?: string) =>
    (revenue?.days ?? []).reduce((sum, d) => sum + Object.entries(d.bySource).reduce((s, [k, v]) => s + (key && k !== key ? 0 : v.cents), 0), 0);
  const today = dayKey(Date.now());

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>E-mails et relances</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Envoyés avec Resend depuis stageio@stageio.fr. Ce qui est compté ici, et ce qui ne l&apos;est pas, est indiqué sous chaque bloc.
      </p>
      <PeriodBar path="/admin/emails" period={period} computedAt={stats.computedAt} />

      <Section
        title="Ce que rapporte chaque e-mail"
        subtitle={`${REVENUE_DAYS} derniers jours, le plus récent en haut. Chaque premier paiement (abonnement ou accès à vie, d'après Stripe) est rattaché au dernier e-mail reçu par la même personne dans les ${ATTRIBUTION_WINDOW_MS / 3_600_000} h avant, et compté au jour de cet e-mail.`}
      >
        {!revenue ? (
          <Card>
            <p style={{ margin: 0, fontSize: 13 }}>Calcul impossible pour l&apos;instant.</p>
          </Card>
        ) : (
          <>
            <KpiGrid>
              <Kpi accent="green" label="Rapporté par les e-mails" value={euros(revenueTotal())} sub={`${REVENUE_DAYS} jours, premiers paiements`} definition="Somme des premiers paiements rattachés à un e-mail reçu dans les 48 h avant le paiement. Le reste des paiements (sans e-mail juste avant) n'est pas compté ici." source="Stripe + Supabase, user_events" />
              <Kpi accent="blue" label="Série Premium" value={euros(revenueTotal("serie"))} definition="Part rattachée à la série Premium (même e-mail chaque jour)." source="Stripe + Supabase" />
              <Kpi accent="pink" label="Panier abandonné" value={euros(revenueTotal("panier"))} definition="Part rattachée aux relances de paiement non finalisé." source="Stripe + Supabase" />
              <Kpi accent="violet" label="Premium gardés" value={int(revenue.kept)} sub={`${int(revenue.surveys)} réponse(s) au questionnaire`} definition="Abonnés qui ont annulé leur résiliation avec « Garder mon Premium » (lien du message de départ), et réponses au questionnaire « pourquoi j'arrête »." source="Supabase, user_events" />
            </KpiGrid>
            {!revenue.stripeOk && <p style={{ fontSize: 12.5, color: "#b42318", margin: "8px 0 0" }}>Lecture Stripe impossible : paiements non comptés.</p>}
            <div className="cockpit-card cockpit-scroll" style={{ marginTop: 12, padding: 0 }}>
              <table className="cockpit-table">
                <thead>
                  <tr>
                    <th>Jour de l&apos;e-mail</th>
                    {REVENUE_SOURCES.map((s) => (
                      <th key={s.key}>{s.label}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.days.map((d) => {
                    const total = Object.values(d.bySource).reduce((s, v) => s + v.cents, 0);
                    return (
                      <tr key={d.day}>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                          {d.day.slice(8, 10)}/{d.day.slice(5, 7)}
                          {d.day === today ? " (en cours)" : ""}
                        </td>
                        {REVENUE_SOURCES.map((s) => {
                          const v = d.bySource[s.key];
                          return (
                            <td key={s.key} style={{ whiteSpace: "nowrap" }}>
                              {v.sent === 0 && v.payers === 0 ? (
                                "—"
                              ) : (
                                <>
                                  {int(v.sent)} envoyé{v.sent > 1 ? "s" : ""} · <strong>{int(v.payers)} payant{v.payers > 1 ? "s" : ""}</strong>
                                  {v.cents > 0 ? ` · ${euros(v.cents)}` : ""}
                                </>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700 }}>{total > 0 ? euros(total) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      <Section title="Vue d'ensemble">
        <KpiGrid>
          <Kpi
            label="E-mails de campagne envoyés"
            value={int(sentInPeriod)}
            definition="Envois notés dans le registre des campagnes (user_events) pendant la période. Les relances automatiques sont comptées à part, plus bas."
            source="Supabase, user_events"
          />
          <Kpi
            label="Visiteurs venus d'un e-mail"
            value={int(stats.clickVisitors)}
            definition="Visiteurs distincts arrivés sur le site avec utm_source=email pendant la période. Un clic sans visite enregistrée (bloqueur, appli mail qui ouvre ailleurs) n'est pas compté : chiffre plancher."
            source="Supabase, site_visits"
          />
          <Kpi
            label="Désinscrits des e-mails"
            value={int(stats.optedOut)}
            sub={`${pct(stats.accounts ? stats.optedOut / stats.accounts : null)} des comptes`}
            definition="Comptes qui ne reçoivent plus les e-mails de relance et d'alerte (lien de désinscription, réglage du profil, ou plainte / rebond définitif via le webhook Resend). Total à ce jour."
            source="Supabase, profiles.notify_new_offers"
          />
        </KpiGrid>
      </Section>

      <Section title="Campagnes" subtitle="Chaque envoi est noté avant d'être confié à Resend, et retiré si Resend le refuse : pas de double envoi.">
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Envoyés (période)</th>
                <th>Destinataires (période)</th>
                <th>Envoyés au total</th>
              </tr>
            </thead>
            <tbody>
              {stats.campaigns.map((c) => (
                <tr key={c.event}>
                  <td>{c.label}</td>
                  <td>{int(c.inPeriod)}</td>
                  <td>{int(c.recipients)}</td>
                  <td>{int(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 8 }}>
          Détail de la série Premium (clics et paiements par e-mail) : <Link href="/admin/relance">E-mails et relances (pilotage des envois)</Link>.
        </p>
      </Section>

      <Section title="Relances automatiques" subtitle="Seule la date du dernier envoi est gardée sur le profil : ce sont des comptes ayant reçu au moins une relance dont la dernière tombe dans la période, pas un nombre d'e-mails.">
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <tbody>
              {stats.reminders.map((r) => (
                <tr key={r.column}>
                  <td>{r.label}</td>
                  <td>{int(r.count)} compte(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Retours par campagne (clics)" subtitle="Visiteurs distincts arrivés depuis un lien d'e-mail, par utm_medium · utm_campaign.">
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0, maxHeight: 360, overflowY: "auto" }}>
          <table className="cockpit-table">
            <tbody>
              {stats.clicks.map((c) => (
                <tr key={c.key}>
                  <td>{c.key}</td>
                  <td>{int(c.visitors)} visiteur(s)</td>
                </tr>
              ))}
              {stats.clicks.length === 0 && (
                <tr>
                  <td>Aucune visite venue d&apos;un e-mail sur la période.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Délivrabilité">
        {stats.webhookConfigured ? (
          <KpiGrid>
            {stats.delivery.map((d) => (
              <Kpi key={d.event} label={d.label} value={int(d.count)} definition="Événements reçus du webhook Resend pendant la période, pour des comptes Stageio." source="Resend (webhook) → user_events" />
            ))}
          </KpiGrid>
        ) : (
          <Card>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
              Non mesuré dans l&apos;appli pour l&apos;instant : la clé Resend de Stageio ne fait qu&apos;envoyer, elle ne peut pas relire les rebonds et les plaintes.
              Pour les suivre ici : dans Resend, Webhooks, créer un webhook vers <code>https://www.stageio.fr/api/resend/webhook</code> avec les événements{" "}
              <code>email.bounced</code>, <code>email.complained</code>, <code>email.delivery_delayed</code> et <code>email.failed</code>, puis coller son
              secret de signature dans Vercel sous <code>RESEND_WEBHOOK_SECRET</code> et redéployer. Les plaintes et rebonds définitifs couperont alors
              automatiquement les relances du compte concerné.
            </p>
          </Card>
        )}
      </Section>
    </div>
  );
}
