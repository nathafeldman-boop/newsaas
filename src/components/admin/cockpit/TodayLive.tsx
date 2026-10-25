import Link from "next/link";
import { Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { int, pct, startOfParisDay } from "@/lib/admin/cockpit/format";
import { onlineNow, signupsByDay } from "@/lib/admin/traffic";
import { DAY_MS, SIGNUPS_SINCE, dayKey, mergeBySource } from "@/lib/admin/trafficStats";

// Bandeau « Aujourd'hui, en direct » en tête de la vue d'ensemble (24/10) :
// les quatre chiffres que Nathan regarde en premier, détaillés sur
// « Trafic et sources » et « Inscriptions jour par jour ». Depuis le 25/10,
// uniquement des inscrits (Nathan : « les visiteurs, ça peut être des robots
// Google ») : actifs du jour, en ligne, nouveaux comptes.
export async function TodayLive({ now }: { now: number }) {
  const todayStart = startOfParisDay(now);
  const today = dayKey(now);
  const yesterday = dayKey(todayStart - DAY_MS / 2);
  const [online, signupDays] = await Promise.all([
    onlineNow(now, todayStart).catch(() => null),
    signupsByDay(new Date(SIGNUPS_SINCE).toISOString()).catch(() => null),
  ]);
  const rows = mergeBySource(null, signupDays ?? [], null, new Set([today]));
  const signupsToday = signupDays?.find((d) => d.day === today)?.signups ?? 0;
  const onboardedToday = signupDays?.find((d) => d.day === today)?.onboarded ?? 0;
  const signupsYesterday = signupDays?.find((d) => d.day === yesterday)?.signups ?? 0;
  const top = rows
    .filter((r) => r.signups > 0)
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 4);

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
          accent="green"
          href="/admin/online"
          cta="Voir qui"
          label="Inscrits actifs aujourd'hui"
          value={online ? online.activeToday : <Insufficient />}
          sub={signupDays ? `dont ${int(signupsToday)} nouveau${signupsToday > 1 ? "x" : ""}` : undefined}
          definition="Comptes qui ont ouvert l'appli depuis minuit (heure de Paris), nouveaux inscrits compris. Visiteurs sans compte et robots exclus."
          source="Supabase, profils.last_active_at"
        />
        <Kpi
          live
          accent="blue"
          href="/admin/online"
          cta="Voir qui"
          label="Inscrits en ligne"
          value={online ? online.accounts : <Insufficient />}
          sub="actifs dans les 3 dernières minutes"
          definition="Comptes actifs dans l'appli dans les 3 dernières minutes (signal envoyé toutes les 45 s par chaque page ouverte). Visiteurs sans compte et robots exclus."
          source="Supabase, profils.last_active_at"
        />
        <Kpi
          accent="pink"
          href={`/admin/inscriptions/${today}`}
          cta="Voir les inscrits"
          label="Inscrits aujourd'hui"
          value={signupDays ? signupsToday : <Insufficient />}
          sub={signupDays ? (top.length > 0 ? top.map((r) => `${r.label} ${int(r.signups)}`).join(" · ") : `hier : ${int(signupsYesterday)}`) : undefined}
          definition="Comptes créés depuis minuit (heure de Paris), par source d'inscription. Hier : journée complète, à comparer en fin de soirée."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="violet"
          href={`/admin/inscriptions/${today}`}
          cta="Leur parcours"
          label="Onboarding terminé aujourd'hui"
          value={signupDays ? onboardedToday : <Insufficient />}
          sub={signupDays && signupsToday > 0 ? `${pct(onboardedToday / signupsToday, 0)} des inscrits du jour` : undefined}
          definition="Inscrits du jour qui ont fini le questionnaire de départ (étape juste avant le paywall)."
          source="Supabase, profils.onboarding_completed"
        />
      </KpiGrid>
    </Section>
  );
}
