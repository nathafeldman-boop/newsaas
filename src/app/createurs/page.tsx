import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentCreator, personalLink } from "@/lib/creators/access";
import { loadRpmDefaults, ratesFor } from "@/lib/creators/rates";
import { dailySeries, earningsEur, faceOf, gainedByVideo, periodStarts, periodTotals, rpmOf, type EarningVideo } from "@/lib/creators/earnings";
import { Kpi } from "@/components/admin/cockpit/Kpi";
import { LineChart } from "@/components/admin/cockpit/LineChart";
import { AccentPicker } from "@/components/creators/AccentPicker";
import { addCreatorVideoAction, declareFaceAction, removeCreatorVideoAction } from "./actions";
import type { CreatorVideo } from "@/types/database";
import { requestNow } from "@/lib/applications/status";

// Dashboard d'un créateur (18/11, Nathan) : ses vidéos, ses vues relevées
// toutes les 30 min, ses gains (semaine, mois, année, total), sa courbe, le
// classement de ses vidéos et celles à refaire.

export const metadata: Metadata = { title: "Mon espace créateur · Stageio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n: number) => n.toLocaleString("fr-FR");
const muted = { color: "var(--color-neutral-600)" } as const;

function ago(iso: string | null, now: number): string {
  if (!iso) return "pas encore relevée";
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}

function kindLabel(v: CreatorVideo): string {
  if (v.kind === "carousel") return "📸 Carrousel";
  if (v.kind === "video") {
    const f = faceOf({ declared_face: v.declared_face ?? null, approved_face: v.approved_face ?? null });
    return f === "face" ? "🎥 Vidéo face" : f === "faceless" ? "🎥 Vidéo faceless" : "🎥 Vidéo";
  }
  return "⏳ En cours d'analyse";
}

const ADD_NOTICE: Record<string, string> = {
  invalide: "Aucun lien TikTok reconnu. Copie le lien depuis TikTok (Partager → Copier le lien).",
  erreur: "L'ajout n'a pas marché, réessaie.",
};

export default async function CreatorDashboard({ searchParams }: { searchParams: Promise<{ ajout?: string; n?: string; deja?: string; bienvenue?: string; lien?: string }> }) {
  const q = await searchParams;
  const session = await currentCreator();
  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-5">
        <div className="cockpit-card w-full" style={{ padding: 28 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Espace créateurs Stageio</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "10px 0 0", ...muted }}>
            {q.lien === "invalide" ? "Ce lien perso n'est plus valide." : "Crée ton espace en 30 secondes (nom et téléphone), ou ouvre ton lien perso si tu en as déjà un."}
          </p>
          <a href="/createurs/inscription" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Créer mon espace créateur
          </a>
        </div>
      </div>
    );
  }
  const { creator, token } = session;
  const admin = createAdminClient();
  const now = requestNow();
  admin.from("creators").update({ last_seen_at: new Date(now).toISOString() }).eq("id", creator.id).then(() => undefined, () => undefined);

  const { data: rows } = await admin.from("creator_videos").select("*").eq("creator_id", creator.id).order("added_at", { ascending: false }).limit(500);
  const videos: CreatorVideo[] = rows ?? [];
  const ids = videos.map((v) => v.id);
  const { data: snaps } = ids.length
    ? await admin.from("creator_video_views").select("video_id, checked_at, views").in("video_id", ids).order("checked_at", { ascending: false }).limit(20_000)
    : { data: [] };
  const snapshots = snaps ?? [];
  const ev: EarningVideo[] = videos.map((v) => ({ id: v.id, kind: v.kind ?? null, declared_face: v.declared_face ?? null, approved_face: v.approved_face ?? null, views: v.views }));

  // Son tarif : celui réglé par Stageio (à part ou par défaut, voir /admin/createurs).
  const rates = ratesFor(creator, await loadRpmDefaults());
  const starts = periodStarts(now);
  const week = periodTotals(ev, snapshots, { start: starts.week, end: now }, rates);
  const month = periodTotals(ev, snapshots, { start: starts.month, end: now }, rates);
  const year = periodTotals(ev, snapshots, { start: starts.year, end: now }, rates);
  const totalViews = ev.reduce((s, v) => s + (v.views ?? 0), 0);
  const totalEur = ev.reduce((s, v) => s + earningsEur(v.views ?? 0, rpmOf(v, rates)), 0);
  const series = dailySeries(ev, snapshots, 30, now, rates);

  const byEarnings = [...videos]
    .map((v) => ({ v, eur: earningsEur(v.views ?? 0, rpmOf(ev.find((e) => e.id === v.id)!, rates)) }))
    .filter((x) => (x.v.views ?? 0) > 0)
    .sort((a, b) => b.eur - a.eur);
  const lastWeek = gainedByVideo(snapshots, { start: now - 7 * 86_400_000, end: now });
  const hot = [...videos]
    .map((v) => ({ v, gained: lastWeek.get(v.id) ?? 0 }))
    .filter((x) => x.gained > 0)
    .sort((a, b) => b.gained * rpmOf(ev.find((e) => e.id === b.v.id)!, rates) - a.gained * rpmOf(ev.find((e) => e.id === a.v.id)!, rates))
    .slice(0, 3);
  const toDeclare = videos.filter((v) => v.kind === "video" && !v.declared_face);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8">
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-700)", fontWeight: 700 }}>Espace créateur · Stageio</p>
          <h1 style={{ fontSize: 28, margin: "4px 0 0" }}>Salut {creator.name.split(" ")[0]} 👋</h1>
        </div>
        <AccentPicker initial={creator.accent} />
      </header>

      {q.bienvenue && (
        <div className="cockpit-card mt-5" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>🎉 Ton espace est prêt</p>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, ...muted }}>
            Garde ce lien perso pour revenir depuis un autre téléphone (ne le partage pas) : <br />
            <code style={{ fontSize: 12.5, wordBreak: "break-all" }}>{personalLink(token)}</code>
          </p>
        </div>
      )}

      <div className="cockpit-card cockpit-hero mt-5" style={{ padding: 18 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>📌 À chaque TikTok que tu postes, colle son lien ici</p>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, ...muted }}>
          On relève tes vues toutes les 30 minutes. Pour 1 000 vues : carrousel {eur(rates.carousel)}, vidéo faceless {eur(rates.faceless)}, vidéo face {eur(rates.face)}.
        </p>
        <form action={addCreatorVideoAction} className="mt-3" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input name="links" required className="input" placeholder="https://www.tiktok.com/@toncompte/video/…" style={{ flex: "1 1 320px", fontSize: 14 }} />
          <button type="submit" className="btn btn-primary">
            Ajouter ma vidéo
          </button>
        </form>
        {q.ajout === "ok" && (
          <p className="cockpit-pill is-good" style={{ display: "inline-block", fontSize: 13, padding: "5px 12px", borderRadius: 10, margin: "10px 0 0" }}>
            {Number(q.n ?? 0) > 0 ? `✅ Vidéo ajoutée, vues relevées.` : "Cette vidéo était déjà suivie."}
          </p>
        )}
        {q.ajout && q.ajout !== "ok" && (
          <p className="cockpit-pill is-bad" style={{ display: "inline-block", fontSize: 13, padding: "5px 12px", borderRadius: 10, margin: "10px 0 0" }}>
            {ADD_NOTICE[q.ajout] ?? ADD_NOTICE.erreur}
          </p>
        )}
      </div>

      {toDeclare.length > 0 && (
        <div className="cockpit-card mt-4" style={{ padding: 18, borderColor: "var(--color-accent-200)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>👀 Dis-nous si on voit ton visage</p>
          <p style={{ margin: "4px 0 8px", fontSize: 13, ...muted }}>Face : {eur(rates.face)} pour 1 000 vues. Faceless : {eur(rates.faceless)}. Stageio vérifie de temps en temps.</p>
          {toDeclare.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 0", borderTop: "1px solid var(--color-divider)" }}>
              <a href={v.url} target="_blank" rel="noreferrer" style={{ flex: "1 1 240px", fontSize: 13.5, wordBreak: "break-all" }}>
                {v.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 60)}
              </a>
              {(["face", "faceless"] as const).map((f) => (
                <form key={f} action={declareFaceAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="face" value={f} />
                  <button type="submit" className="btn" style={{ fontSize: 13 }}>
                    {f === "face" ? "🙂 Face" : "🙈 Faceless"}
                  </button>
                </form>
              ))}
            </div>
          ))}
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <div className="creator-kpis">
          <Kpi hero label="Gagné au total" value={eur(totalEur)} sub={`${num(totalViews)} vues`} definition="Vues actuelles de chaque vidéo × son tarif pour 1 000 vues." source="Vues lues sur TikTok toutes les 30 min" />
          <Kpi label="Cette semaine" value={eur(week.eur)} sub={`${num(week.views)} vues`} definition="Vues gagnées depuis lundi × tarif de chaque vidéo." source="Relevés TikTok" />
          <Kpi label="Ce mois-ci" value={eur(month.eur)} sub={`${num(month.views)} vues`} definition="Vues gagnées depuis le 1er du mois × tarif de chaque vidéo." source="Relevés TikTok" />
          <Kpi label="Cette année" value={eur(year.eur)} sub={`${num(year.views)} vues`} definition="Vues gagnées depuis le 1er janvier × tarif de chaque vidéo." source="Relevés TikTok" />
          <Kpi label="Vidéos suivies" value={videos.length} definition="Liens TikTok que tu as ajoutés." source="Ton espace" />
        </div>
      </section>

      <section style={{ marginTop: 24 }} className="grid gap-4 lg:grid-cols-2">
        <div className="cockpit-card" style={{ padding: 18 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>💶 Gains par jour, 30 derniers jours</p>
          <LineChart times={series.times} series={[{ name: "Gains", color: "var(--chart-1, #7a73ff)", values: series.eur }]} unit="eur" caption="Euros gagnés chaque jour" />
        </div>
        <div className="cockpit-card" style={{ padding: 18 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>👁️ Vues par jour, 30 derniers jours</p>
          <LineChart times={series.times} series={[{ name: "Vues", color: "var(--chart-2, #2ecc71)", values: series.views }]} unit="count" caption="Vues gagnées chaque jour" />
        </div>
      </section>

      <section style={{ marginTop: 24 }} className="grid gap-4 lg:grid-cols-2">
        <div className="cockpit-card" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>🏆 Tes vidéos qui rapportent le plus</p>
          <p style={{ margin: "2px 0 10px", fontSize: 12.5, ...muted }}>Classement depuis le début.</p>
          {byEarnings.length === 0 && <p style={{ fontSize: 13.5, ...muted }}>Ajoute ta première vidéo pour voir le classement.</p>}
          {byEarnings.slice(0, 10).map(({ v, eur: e }, i) => (
            <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="creator-rank" style={{ color: "inherit", textDecoration: "none" }}>
              <span style={{ width: 28, fontWeight: 800, fontSize: 16, color: i < 3 ? "var(--color-accent-700)" : "var(--color-neutral-500)" }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.url.replace(/^https:\/\/(www\.)?tiktok\.com\//, "")}</span>
                <span style={{ fontSize: 12, ...muted }}>
                  {kindLabel(v)} · {num(v.views ?? 0)} vues
                </span>
              </span>
              <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{eur(e)}</span>
            </a>
          ))}
        </div>
        <div className="cockpit-card cockpit-hero" style={{ padding: 18 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>🔁 À refaire cette semaine</p>
          <p style={{ margin: "2px 0 10px", fontSize: 12.5, ...muted }}>Tes vidéos qui ont rapporté le plus ces 7 derniers jours : reprends le même format, la même accroche.</p>
          {hot.length === 0 && <p style={{ fontSize: 13.5, ...muted }}>Pas encore assez de relevés cette semaine.</p>}
          {hot.map(({ v, gained }) => (
            <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="creator-rank" style={{ color: "inherit", textDecoration: "none" }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.url.replace(/^https:\/\/(www\.)?tiktok\.com\//, "")}</span>
                <span style={{ fontSize: 12, ...muted }}>
                  {kindLabel(v)} · +{num(gained)} vues en 7 jours
                </span>
              </span>
              <span style={{ fontWeight: 800 }}>{eur(earningsEur(gained, rpmOf(ev.find((x) => x.id === v.id)!, rates)))}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="videos" style={{ marginTop: 24 }}>
        <div className="cockpit-card" style={{ padding: 18, overflowX: "auto" }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700 }}>🎬 Toutes tes vidéos</p>
          {videos.length === 0 ? (
            <p style={{ fontSize: 13.5, ...muted }}>Aucune vidéo pour l&apos;instant.</p>
          ) : (
            <table className="cockpit-table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ textAlign: "left", ...muted }}>
                  {["Vidéo", "Type", "Vues", "Tarif / 1 000", "Gagné", "Vérification", "Relevé", ""].map((h) => (
                    <th key={h} style={{ padding: "6px 12px 6px 0", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => {
                  const e = ev.find((x) => x.id === v.id)!;
                  return (
                    <tr key={v.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        <a href={v.url} target="_blank" rel="noreferrer">
                          {v.url.replace(/^https:\/\/(www\.)?tiktok\.com\//, "").slice(0, 42)}
                        </a>
                      </td>
                      <td style={{ padding: "8px 12px 8px 0" }}>{kindLabel(v)}</td>
                      <td style={{ padding: "8px 12px 8px 0", fontWeight: 700 }}>{v.views === null ? "…" : num(v.views)}</td>
                      <td style={{ padding: "8px 12px 8px 0" }}>{eur(rpmOf(e, rates))}</td>
                      <td style={{ padding: "8px 12px 8px 0", fontWeight: 700 }}>{eur(earningsEur(v.views ?? 0, rpmOf(e, rates)))}</td>
                      <td style={{ padding: "8px 12px 8px 0" }}>
                        {v.review_status === "pending" ? (
                          <span className="cockpit-pill is-warn" style={{ padding: "2px 8px", borderRadius: 8 }}>En attente Stageio</span>
                        ) : v.review_status === "approved" ? (
                          <span className="cockpit-pill is-good" style={{ padding: "2px 8px", borderRadius: 8 }}>Validée</span>
                        ) : v.review_status === "corrected" ? (
                          <span className="cockpit-pill" style={{ padding: "2px 8px", borderRadius: 8 }}>Corrigée par Stageio</span>
                        ) : (
                          <span style={muted}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px 8px 0", color: v.last_error ? "var(--bad)" : "var(--color-neutral-600)" }} title={v.last_error ?? undefined}>
                        {v.last_error ? "échec du relevé" : ago(v.checked_at, now)}
                      </td>
                      <td style={{ padding: "8px 0" }}>
                        {(v.review_status === "none" || v.review_status === "pending" || !v.review_status) && (
                          <form action={removeCreatorVideoAction}>
                            <input type="hidden" name="id" value={v.id} />
                            <button type="submit" className="btn" style={{ fontSize: 12, padding: "2px 8px" }}>
                              Retirer
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <p style={{ fontSize: 12, margin: "20px 0 0", ...muted }}>
        Gains estimés d&apos;après les vues publiques de TikTok et les tarifs ci-dessus. Le montant versé est confirmé par Stageio. Les vidéos face/faceless
        sont vérifiées par Stageio (la 1re, puis une sur cinq).
      </p>
    </div>
  );
}
