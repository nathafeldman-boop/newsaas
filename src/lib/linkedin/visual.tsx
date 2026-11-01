import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanTitle, displayCompany } from "@/lib/linkedin/compose";
import { segmentLabel } from "@/lib/linkedin/formats";
import type { LinkedinPost } from "@/lib/linkedin/posts";

// Visuel des publications LinkedIn : portrait 1080 x 1350 (4:5, le format
// qui occupe le plus de place dans le fil mobile). Identité des carrousels
// Stageio (tools/carrousel) : blanc, encre #132B33, vert #0F9C56, police du
// site (Plus Jakarta Sans). Pas d'emoji ni de flèche : la police embarquée
// ne les a pas (voir lib/seo/ogImage.tsx). Le contenu vient de l'instantané
// enregistré avec le post : le visuel dit exactement la même chose que le texte.

export const VISUAL_SIZE = { width: 1080, height: 1350 };

const INK = "#132B33";
const MUTED = "#4A5F66";
const GREEN = "#0F9C56";
const GREEN_DARK = "#085A32";
const GREEN_SOFT = "#E8F8EE";
const LINE = "#DCE7EA";

let assets: Promise<{ bold: Buffer; medium: Buffer; logo: string }> | null = null;

function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-800-normal.woff")),
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/logo.png")),
  ]).then(([bold, medium, logo]) => ({ bold, medium, logo: `data:image/png;base64,${logo.toString("base64")}` }));
  return assets;
}

function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const space = slice.lastIndexOf(" ");
  return `${slice.slice(0, space > max * 0.6 ? space : max).trimEnd()}...`;
}

function headline(post: LinkedinPost): { kicker: string; title: string } {
  const n = post.offers_snapshot.length;
  const offres = `${n} alternance${n > 1 ? "s" : ""}`;
  const seg = segmentLabel(post.format, post.segment);
  const date = new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
  switch (post.format) {
    case "jour":
      return { kicker: `Les alternances du jour  -  ${date}`, title: `${offres} ajoutée${n > 1 ? "s" : ""} aujourd'hui` };
    case "secteur":
      return { kicker: `Alternance  -  ${seg ?? ""}`, title: `${offres} à saisir` };
    case "ville":
      return { kicker: `Alternance  -  en ce moment`, title: `${offres} à ${seg ?? ""}` };
    case "hebdo":
      return { kicker: `Récap de la semaine  -  ${date}`, title: `Les ${offres} à ne pas rater` };
  }
}

export async function renderLinkedinVisual(post: LinkedinPost): Promise<ImageResponse> {
  const { bold, medium, logo } = await loadAssets();
  const { kicker, title } = headline(post);
  const offers = post.offers_snapshot.slice(0, 10);
  const dense = offers.length > 5;
  const allVerified = offers.every((o) => o.verdict === "alive");
  // Une ligne par intitulé (coupé au mot) : sur deux lignes, 10 offres ne tiennent pas dans 1 350 px.
  const sz = dense
    ? { title: 25, meta: 20, pad: "9px 18px", gap: 8, dot: 38, dotFont: 19, titleMax: 52, metaMax: 62, top: 26, head: 58 }
    : { title: 36, meta: 26, pad: "20px 24px", gap: 16, dot: 54, dotFont: 26, titleMax: 40, metaMax: 50, top: 44, head: 76 };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF", padding: "64px 64px 56px", fontFamily: "Jakarta", color: INK }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse */}
            <img src={logo} width={60} height={60} alt="" style={{ borderRadius: 16 }} />
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>
              stageio<span style={{ color: GREEN }}>.fr</span>
            </div>
          </div>
          <div style={{ display: "flex", background: GREEN_SOFT, color: GREEN_DARK, fontSize: 24, fontWeight: 800, padding: "10px 20px", borderRadius: 999 }}>
            {allVerified ? "Offres vérifiées" : "Offres en ligne"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: dense ? 34 : 56 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: GREEN, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {cut(kicker, 44)}
          </div>
          <div style={{ display: "flex", fontSize: sz.head, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: 12 }}>
            {cut(title, 40)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: sz.gap, marginTop: sz.top, flex: 1, overflow: "hidden" }}>
          {offers.map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 18, border: `2px solid ${LINE}`, borderRadius: 20, padding: sz.pad }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: sz.dot, height: sz.dot, borderRadius: 999, background: GREEN, color: "#FFFFFF", fontSize: sz.dotFont, fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", fontSize: sz.title, fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden" }}>{cut(cleanTitle(o.title), sz.titleMax)}</div>
                <div style={{ display: "flex", fontSize: sz.meta, fontWeight: 500, color: MUTED, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden" }}>
                  {/* La ville reste entière : c'est l'entreprise qu'on raccourcit si besoin. */}
                  {`${cut(displayCompany(o.company), Math.max(16, sz.metaMax - o.city.length - 3))} · ${o.city}`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>{post.first_comment ? "Liens pour postuler en commentaire" : "Liens pour postuler dans le post"}</div>
            <div style={{ display: "flex", fontSize: 21, fontWeight: 500, color: MUTED, marginTop: 4 }}>Source des annonces : France Travail</div>
          </div>
          <div style={{ display: "flex", background: GREEN, color: "#FFFFFF", fontSize: 28, fontWeight: 800, padding: "16px 28px", borderRadius: 16 }}>
            stageio.fr
          </div>
        </div>
      </div>
    ),
    {
      ...VISUAL_SIZE,
      fonts: [
        { name: "Jakarta", data: bold, weight: 800, style: "normal" },
        { name: "Jakarta", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

export function visualFileName(post: LinkedinPost): string {
  return `stageio-linkedin-${post.utm_campaign}.png`;
}

