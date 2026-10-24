import Link from "next/link";
import { Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { int, startOfParisDay } from "@/lib/admin/cockpit/format";
import { onlineNow, signupsByDay, visitorsBySource } from "@/lib/admin/traffic";
import { DAY_MS, SIGNUPS_SINCE, dayKey, mergeBySource } from "@/lib/admin/trafficStats";

// Bandeau « Aujourd'hui, en direct » en tête de la vue d'ensemble (24/10) :
// les quatre chiffres que Nathan regarde en premier, détaillés sur
// « Trafic et sources » et « Inscriptions jour par jour ».
export async function TodayLive({ now }: { now: number }) {
  const todayStart = startOfParisDay(now);
  const today = dayKey(now);
  const yesterday = dayKey(todayStart - DAY_MS / 2);
  const [bySource, online, signupDays] = await Promise.all([
    visitorsBySource(new Date(todayStart).toISOString(), new Date(todayStart + DAY_MS).toISOString()).catch(() => null),
    onlineNow(now).catch(() => null),
    signupsByDay(new Date(SIGNUPS_SINCE).toISOString()).catch(() => null),
  ]);
  const rows = mergeBySource(bySource?.rows ?? null, signupDays ?? [], null, new Set([today]));
  const visitors = rows.reduce((s, r) => s + r.visitors, 0);
  const email = rows.filter((r) => r.group === "E-mails Stageio").reduce((s, r) => s + r.visitors, 0);
  const signupsToday = signupDays?.find((d) => d.day === today)?.signups ?? 0;
  const signupsYesterday = signupDays?.find((d) => d.day === yesterday)?.signups ?? 0;
  const top = rows.filter((r) => r.visitors > 0).slice(0, 5);

  return (
    <Section
      title="Aujourd'hui, en direct"
      actions={
        <span style={{ fontSize: 12.5 }}>
          <Link href="/admin/trafic">Trafic et sources →</Link> · <Link href="/admin/inscriptions">Inscriptions jour par jour →</Link>
        </span>
      }
    >
      <KpiGrid>
        <Kpi
          label="Visiteurs aujourd'hui"
          value={bySource ? int(visitors) : <Insufficient />}
          sub={top.length > 0 ? top.map((r) => `${r.label} ${int(r.visitors)}`).join(" · ") : undefined}
          definition="Personnes distinctes (un navigateur = une personne) qui ont ouvert une page depuis minuit, avec leur première source du jour. Robots exclus. À 5 minutes près."
          source="Supabase, site_visits"
        />
        <Kpi
          label="En ligne maintenant"
          value={online ? int(online.visitors) : <Insufficient />}
          sub={online ? `dont ${int(online.loggedIn)} connecté${online.loggedIn > 1 ? "s" : ""}` : undefined}
          definition="Visiteurs qui ont ouvert une page dans les 5 dernières minutes ; « connectés » : comptes actifs dans l'appli dans les 3 dernières minutes."
          source="Supabase, site_visits et profils.last_active_at"
        />
        <Kpi
          label="Inscrits aujourd'hui"
          value={signupDays ? int(signupsToday) : <Insufficient />}
          sub={signupDays ? `hier : ${int(signupsYesterday)}` : undefined}
          definition="Comptes créés depuis minuit (heure de Paris). Hier : journée complète, à comparer en fin de soirée."
          source="Supabase, profils.created_at"
        />
        <Kpi
          label="Venus d'un e-mail"
          value={bySource ? int(email) : <Insufficient />}
          definition="Visiteurs du jour arrivés par un lien d'un e-mail Stageio (série, alertes, relances : utm_source=email)."
          source="Supabase, site_visits"
        />
      </KpiGrid>
    </Section>
  );
}
