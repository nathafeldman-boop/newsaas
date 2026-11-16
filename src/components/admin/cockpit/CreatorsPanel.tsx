import { addCreatorVideosAction, removeCreatorVideoAction } from "@/app/admin/creators-actions";
import type { CreatorVideo } from "@/types/database";

const muted = "var(--color-neutral-600)";

const NOTICES: Record<string, string> = {
  invalide: "Aucun lien TikTok reconnu. Colle des liens du type tiktok.com/@compte/video/123… ou vm.tiktok.com/…",
  erreur: "Enregistrement impossible, réessaie.",
  table: "Les tables creator_videos n'existent pas encore en base (migration 20261116000000_creator_videos.sql).",
};

function ago(iso: string | null, now: number): string {
  if (!iso) return "—";
  const min = Math.round((now - Date.parse(iso)) / 60_000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}

// Bas de la vue d'ensemble : coller les liens TikTok des créateurs, et la
// liste des vidéos suivies avec leurs vues (relevées toutes les 3 h).
export function CreatorsPanel({
  videos,
  gained,
  now,
  notice,
  added,
  rejected,
  missingTable,
}: {
  videos: CreatorVideo[];
  gained: Map<string, number>;
  now: number;
  notice?: string;
  added?: number;
  rejected?: number;
  missingTable: boolean;
}) {
  return (
    <section id="createurs" style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Vidéos des créateurs</h2>
      <p style={{ fontSize: 12.5, color: muted, margin: "4px 0 12px", maxWidth: "75ch" }}>
        Colle les liens TikTok (un par ligne). Les vues sont relevées tout de suite, puis toutes les 3 h pendant 60 jours. Une vidéo
        pas encore relevée affiche « en attente ».
      </p>

      {notice === "ok" && (
        <p className="cockpit-pill" style={{ fontSize: 13, padding: "6px 12px", borderRadius: 10, display: "inline-block", margin: "0 0 10px" }}>
          {added ?? 0} vidéo{(added ?? 0) > 1 ? "s" : ""} ajoutée{(added ?? 0) > 1 ? "s" : ""}
          {rejected ? ` · ${rejected} lien${rejected > 1 ? "s" : ""} ignoré${rejected > 1 ? "s" : ""} (pas TikTok)` : ""}
        </p>
      )}
      {notice && notice !== "ok" && (
        <p className="cockpit-pill is-bad" style={{ fontSize: 13, padding: "6px 12px", borderRadius: 10, display: "inline-block", margin: "0 0 10px" }}>
          {NOTICES[notice] ?? "Une erreur est survenue."}
        </p>
      )}

      {missingTable ? (
        <p style={{ fontSize: 13 }}>{NOTICES.table}</p>
      ) : (
        <form action={addCreatorVideosAction} className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
          <textarea
            name="links"
            required
            rows={3}
            className="input"
            placeholder={"https://www.tiktok.com/@compte/video/7300000000000000000\nhttps://vm.tiktok.com/ZMxxxxxx/"}
            style={{ width: "100%", fontFamily: "inherit", fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input name="creator" className="input" placeholder="Créateur (facultatif, sinon le @ du lien)" style={{ minWidth: 260, fontSize: 13 }} />
            <button type="submit" className="btn btn-primary">
              Ajouter et relever les vues
            </button>
          </div>
        </form>
      )}

      {videos.length > 0 && (
        <div className="card" style={{ marginTop: 12, padding: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", color: muted }}>
                {["Créateur", "Vidéo", "Vues", "Sur la période", "Relevé", "Ajoutée", ""].map((h) => (
                  <th key={h} style={{ padding: "4px 12px 4px 0", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "6px 12px 6px 0", fontWeight: 700 }}>{v.creator ? `@${v.creator}` : "—"}</td>
                  <td style={{ padding: "6px 12px 6px 0" }}>
                    <a href={v.url} target="_blank" rel="noreferrer">
                      {v.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 48)}
                    </a>
                  </td>
                  <td style={{ padding: "6px 12px 6px 0", fontWeight: 800 }}>
                    {v.views === null ? <span style={{ color: muted, fontWeight: 400 }}>en attente</span> : v.views.toLocaleString("fr-FR")}
                  </td>
                  <td style={{ padding: "6px 12px 6px 0" }}>{(gained.get(v.id) ?? 0).toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "6px 12px 6px 0", color: v.last_error ? "#e5484d" : muted }} title={v.last_error ?? undefined}>
                    {v.last_error ? `échec (${v.last_error.slice(0, 40)})` : ago(v.checked_at, now)}
                  </td>
                  <td style={{ padding: "6px 12px 6px 0", color: muted }}>{ago(v.added_at, now)}</td>
                  <td style={{ padding: "6px 0" }}>
                    <form action={removeCreatorVideoAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <button type="submit" className="btn" style={{ fontSize: 12, padding: "2px 8px" }} aria-label="Retirer la vidéo">
                        Retirer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
