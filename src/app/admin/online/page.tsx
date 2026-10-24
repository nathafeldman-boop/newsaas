import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { Avatar, Chip, HBars } from "@/components/admin/cockpit/Visual";
import { nowMs } from "@/lib/admin/cockpit/load";
import { liveVisits } from "@/lib/admin/traffic";
import { sourceInfo } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// « En ligne maintenant » (revu le 25/10, Nathan : « avant je cliquais sur
// les gens en ligne, je voyais leur e-mail, puis leur parcours ») : comptes
// connectés (cliquables, vers leur fiche), visiteurs sans compte, pages
// ouvertes et sources du moment. Rechargée toutes les 20 s.

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
  const [{ data: users, error: usersError }, live] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .gte("last_active_at", new Date(now - 3 * 60_000).toISOString())
      .order("last_active_at", { ascending: false })
      .limit(500),
    liveVisits(now).catch((err) => {
      console.error("AdminOnlinePage: visites en direct", err);
      return null;
    }),
  ]);
  // supabase-js ne lève jamais d'erreur : sans ce log, une requête en échec
  // afficherait « personne en ligne » même si des gens le sont.
  if (usersError) console.error("AdminOnlinePage: users query failed", usersError);

  const online = users ?? [];
  const paying = online.filter((u) => isPremium(u)).length;
  const sources = new Map<string, number>();
  for (const s of live?.sources ?? []) {
    const label = sourceInfo(s.source).label;
    sources.set(label, (sources.get(label) ?? 0) + s.visitors);
  }

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
          hero
          live
          accent="green"
          label="Visiteurs sur le site"
          value={live ? live.visitors : <Insufficient />}
          sub="avec ou sans compte, 5 dernières minutes"
          definition="Navigateurs distincts qui ont ouvert une page dans les 5 dernières minutes, robots exclus."
          source="Supabase, site_visits"
        />
        <Kpi
          live
          accent="blue"
          label="Connectés à leur compte"
          value={online.length}
          sub={`dont ${paying} payant${paying > 1 ? "s" : ""}`}
          definition="Comptes actifs dans l'appli dans les 3 dernières minutes (signal envoyé toutes les 30 s par chaque page ouverte)."
          source="Supabase, profils.last_active_at"
        />
        <Kpi
          accent="pink"
          label="Sans compte"
          value={live ? Math.max(0, live.visitors - online.length) : <Insufficient />}
          sub="visiteurs pas (encore) inscrits ou pas connectés"
          definition="Visiteurs sur le site moins comptes connectés. Approximatif : un compte ouvert sur deux appareils compte deux fois côté visiteurs."
          source="Supabase"
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

      <Section title="Ce qu'ils regardent en ce moment" subtitle="Page actuelle de chaque visiteur (avec ou sans compte) et d'où il est arrivé, sur les 5 dernières minutes.">
        <div className="cockpit-grid-2">
          <Card title="Pages ouvertes">
            {live ? <HBars items={live.pages.map((p) => ({ label: p.path, value: p.visitors }))} color="#2a78d6" empty="Aucune page ouverte" /> : <Insufficient />}
          </Card>
          <Card title="D'où ils viennent">
            {live ? (
              <HBars
                items={[...sources.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value }))}
                color="#e87ba4"
                empty="Aucun visiteur"
              />
            ) : (
              <Insufficient />
            )}
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
