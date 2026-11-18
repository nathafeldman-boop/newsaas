import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteLink } from "@/lib/creators/access";
import { RPM_EUR, earningsEur, rpmOf } from "@/lib/creators/earnings";
import { reviewCreatorVideoAction } from "@/app/admin/creators-actions";
import type { Creator, CreatorVideo } from "@/types/database";

// Créateurs (18/11) : lien d'invitation à donner, vidéos à valider (face ou
// faceless : la 1re puis une sur cinq), et liste des créateurs avec leurs
// gains estimés.
export const dynamic = "force-dynamic";

const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const muted = { color: "var(--color-neutral-600)" } as const;

export default async function AdminCreatorsPage() {
  const admin = createAdminClient();
  const [{ data: creators, error }, { data: videos }] = await Promise.all([
    admin.from("creators").select("*").order("created_at", { ascending: false }).limit(500),
    admin.from("creator_videos").select("*").not("creator_id", "is", null).order("added_at", { ascending: false }).limit(5000),
  ]);
  const list: Creator[] = creators ?? [];
  const vids: CreatorVideo[] = videos ?? [];
  const pending = vids.filter((v) => v.review_status === "pending");
  const byCreator = new Map<string, CreatorVideo[]>();
  for (const v of vids) byCreator.set(v.creator_id!, [...(byCreator.get(v.creator_id!) ?? []), v]);
  const name = new Map(list.map((c) => [c.id, c.name]));
  const link = inviteLink();
  const toEv = (v: CreatorVideo) => ({ kind: v.kind ?? null, declared_face: v.declared_face ?? null, approved_face: v.approved_face ?? null });

  return (
    <div style={{ maxWidth: 1100 }}>
      <Link href="/admin#createurs" style={{ fontSize: 13 }}>
        ← Vue d&apos;ensemble
      </Link>
      <h1 style={{ fontSize: 24, margin: "8px 0 0" }}>Créateurs</h1>
      {error && <p style={{ color: "var(--bad)" }}>Table creators absente (migration 20261119000001_creator_portal.sql) : {error.message}</p>}

      <div className="cockpit-card" style={{ padding: 16, marginTop: 14 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>🔗 Lien d&apos;inscription à envoyer aux créateurs</p>
        <code style={{ display: "block", fontSize: 13, marginTop: 6, wordBreak: "break-all" }}>{link ?? "Clé serveur absente"}</code>
        <p style={{ margin: "6px 0 0", fontSize: 12.5, ...muted }}>
          Le même lien pour tous. Tarifs pour 1 000 vues : carrousel {eur(RPM_EUR.carousel)}, vidéo faceless {eur(RPM_EUR.faceless)}, vidéo face {eur(RPM_EUR.face)}.
        </p>
      </div>

      <section id="a-valider" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>À valider : face ou faceless ({pending.length})</h2>
        <p style={{ fontSize: 12.5, margin: "4px 0 10px", ...muted }}>La 1re vidéo de chaque créateur, puis une sur cinq. Ouvre la vidéo et choisis le bon type.</p>
        {pending.length === 0 && <p style={{ fontSize: 13.5, ...muted }}>Rien à valider.</p>}
        {pending.map((v) => (
          <div key={v.id} className="cockpit-card" style={{ padding: 12, marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {name.get(v.creator_id!) ?? "?"} · vidéo n° {v.video_seq}
              </p>
              <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, wordBreak: "break-all" }}>
                {v.url}
              </a>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, ...muted }}>
                Déclarée : <b>{v.declared_face === "face" ? "face" : "faceless"}</b> · {(v.views ?? 0).toLocaleString("fr-FR")} vues
              </p>
            </div>
            {(["face", "faceless"] as const).map((f) => (
              <form key={f} action={reviewCreatorVideoAction}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="face" value={f} />
                <button type="submit" className={`btn${v.declared_face === f ? " btn-primary" : ""}`} style={{ fontSize: 13 }}>
                  {f === "face" ? "🙂 C'est face" : "🙈 C'est faceless"}
                </button>
              </form>
            ))}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Créateurs inscrits ({list.length})</h2>
        <div className="cockpit-card" style={{ padding: 14, overflowX: "auto" }}>
          <table className="cockpit-table" style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", ...muted }}>
                {["Nom", "Téléphone", "TikTok", "Vidéos", "Vues", "Gains estimés", "Inscrit", "Vu"].map((h) => (
                  <th key={h} style={{ padding: "4px 12px 4px 0", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const mine = byCreator.get(c.id) ?? [];
                const views = mine.reduce((s, v) => s + (v.views ?? 0), 0);
                const gains = mine.reduce((s, v) => s + earningsEur(v.views ?? 0, rpmOf(toEv(v))), 0);
                return (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "6px 12px 6px 0", fontWeight: 700 }}>{c.name}</td>
                    <td style={{ padding: "6px 12px 6px 0" }}>
                      <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a>
                    </td>
                    <td style={{ padding: "6px 12px 6px 0" }}>{c.tiktok_handle ? `@${c.tiktok_handle}` : "—"}</td>
                    <td style={{ padding: "6px 12px 6px 0" }}>{mine.length}</td>
                    <td style={{ padding: "6px 12px 6px 0" }}>{views.toLocaleString("fr-FR")}</td>
                    <td style={{ padding: "6px 12px 6px 0", fontWeight: 700 }}>{eur(gains)}</td>
                    <td style={{ padding: "6px 12px 6px 0", ...muted }}>{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding: "6px 0", ...muted }}>{c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
