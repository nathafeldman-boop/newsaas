import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { Avatar, Chip, HBars } from "@/components/admin/cockpit/Visual";
import { nowMs } from "@/lib/admin/cockpit/load";
import { startOfParisDay } from "@/lib/admin/cockpit/format";
import { sourceInfo } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// « En ligne maintenant » (revu le 25/10, Nathan : « avant je cliquais sur
// les gens en ligne, je voyais leur e-mail, puis leur parcours ») : comptes
// connectés (cliquables, vers leur fiche), leur page actuelle et leur source
// d'inscription. Uniquement des inscrits (Nathan, même jour : « les
// visiteurs, ça peut être des robots Google ») : plus de visiteurs anonymes
// ici. Rechargée toutes les 20 s.

function ago(fromMs: number, now: number): string {
  const mins = Math.max(0, Math.round((now - fromMs) / 60000));
  if (mins < 1) return "à l'instant";
  return `il y a ${mins} min`;
}

function since(createdMs: number, now: number): string {
  const days = Math.floor((now - createdMs) / 86_400_000);
  if (days <= 0) return "inscrit aujourd'hui";
  if (days === 1) return "inscrit hier";
  return `inscrit il y a ${days} j`;
}

export default async function AdminOnlinePage() {
  await requireAdminPage();
  const now = nowMs();
  const admin = createAdminClient();
  const todayStart = startOfParisDay(now);
  const [{ data: users, error: usersError }, { count: activeToday }] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .gte("last_active_at", new Date(now - 3 * 60_000).toISOString())
      .order("last_active_at", { ascending: false })
      .limit(500),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active_at", new Date(todayStart).toISOString()),
  ]);
  // supabase-js ne lève jamais d'erreur : sans ce log, une requête en échec
  // afficherait « personne en ligne » même si des gens le sont.
  if (usersError) console.error("AdminOnlinePage: users query failed", usersError);

  const online = users ?? [];
  const paying = online.filter((u) => isPremium(u)).length;
  const newToday = online.filter((u) => Date.parse(u.created_at) >= todayStart).length;
  const tally = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  };
  const pages = tally(online.map((u) => u.last_active_path || "Page inconnue")).slice(0, 10);
  const sources = tally(online.map((u) => (u.utm_source ? sourceInfo(u.utm_source).label : "Direct / inconnu")));

  return (
    <div>
      <AutoRefresh seconds={20} />
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="live-dot" aria-hidden style={{ width: 10, height: 10 }} />
        En ligne maintenant
      </h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Mis à jour toutes les 20 secondes. Clique sur une personne pour voir sa fiche : son parcours, ses swipes, ses candidatures, tout son historique.
      </p>

      <KpiGrid>
        <Kpi
          live
          accent="green"
          label="Inscrits en ligne"
          value={online.length}
          sub="actifs dans les 3 dernières minutes"
          definition="Comptes actifs dans l'appli dans les 3 dernières minutes (signal envoyé toutes les 45 s par chaque page ouverte). Visiteurs sans compte et robots exclus."
          source="Supabase, profils.last_active_at"
        />
        <Kpi
          live
          accent="blue"
          label="Dont payants"
          value={paying}
          sub={online.length > 0 ? `${Math.round((paying / online.length) * 100)} % des connectés` : undefined}
          definition="Comptes connectés avec un Premium ou Stageio Auto actif (abonnement, accès à vie ou offert)."
          source="Supabase, profils"
        />
        <Kpi
          accent="pink"
          label="Dont nouveaux du jour"
          value={newToday}
          sub="inscrits depuis minuit"
          definition="Comptes connectés créés aujourd'hui (heure de Paris)."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="violet"
          label="Inscrits actifs aujourd'hui"
          value={activeToday ?? <Insufficient />}
          sub="ont ouvert l'appli depuis minuit"
          definition="Comptes dont la dernière activité dans l'appli date d'aujourd'hui (heure de Paris), nouveaux inscrits compris."
          source="Supabase, profils.last_active_at"
        />
      </KpiGrid>

      <Section title={`Qui est connecté (${online.length})`}>
        {online.length === 0 ? (
          <Card>
            <Insufficient>Personne de connecté pour l&apos;instant.</Insufficient>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}>
            {online.map((u) => {
              const source = u.utm_source ? sourceInfo(u.utm_source).label : null;
              const lastMs = u.last_active_at ? Date.parse(u.last_active_at) : now;
              return (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="cockpit-card cockpit-person">
                  <Avatar name={u.full_name || u.email || "?"} seed={u.id} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || "Sans nom"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-neutral-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {isAutoTier(u) ? <Chip tone="violet">Auto</Chip> : isPremium(u) ? <Chip tone="good">Premium</Chip> : <Chip>Gratuit</Chip>}
                      {u.last_active_path && <Chip tone="blue">{u.last_active_path}</Chip>}
                      {source && <Chip>{source}</Chip>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11.5, color: "var(--color-neutral-600)", flexShrink: 0 }}>
                    <div>{ago(lastMs, now)}</div>
                    <div>{since(Date.parse(u.created_at), now)}</div>
                    <div style={{ fontWeight: 700, color: "var(--color-accent-700)", marginTop: 4 }}>Fiche →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Ce qu'ils regardent en ce moment" subtitle="Page actuelle de chaque inscrit connecté, et d'où il était venu à son inscription.">
        <div className="cockpit-grid-2">
          <Card title="Pages ouvertes">
            <HBars items={pages} color="#2a78d6" empty="Personne de connecté" />
          </Card>
          <Card title="D'où ils viennent">
            <HBars items={sources} color="#e87ba4" empty="Personne de connecté" />
          </Card>
        </div>
      </Section>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-neutral-500)" }}>
        Voir aussi : <Link href="/admin/trafic">trafic et sources du jour</Link> · <Link href="/admin/inscriptions">inscriptions jour par jour</Link> ·{" "}
        <Link href="/admin/users">tous les utilisateurs</Link>
      </p>
    </div>
  );
}
