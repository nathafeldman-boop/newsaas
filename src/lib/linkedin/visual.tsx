import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { VisualRow } from "@/lib/linkedin/format";

// Visuel des publications LinkedIn : image portrait 1080 x 1350 (le format qui
// prend le plus de place dans le fil sur téléphone), aux couleurs de Stageio
// (vert et blanc, comme l'usine à carrousels) et à la police du site.
// Même moteur que les aperçus de partage (lib/seo/ogImage.tsx) : pas de
// grille CSS, pas d'emojis ni de flèches (police latine seulement).

export const VISUAL_SIZE = { width: 1080, height: 1350 };

const INK = "#132b33";
const MUTED = "#4a5f66";
const GREEN = "#0f9c56";
const GREEN_DARK = "#085a32";
const MINT = "#e8f8ee";
const MINT_STRONG = "#c9f0d7";

export type VisualInput = {
  headline: string;
  subline: string;
  rows: VisualRow[];
  /** « Offres actives au 1 novembre 2026 » : date de la publication. */
  dateLabel: string;
  /** « France Travail, La bonne alternance » */
  sources: string;
};

let assets: Promise<{ bold: Buffer; medium: Buffer; logo: string }> | null = null;

function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-800-normal.woff")),
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/logo.png")),
  ]).then(([bold, medium, logo]) => ({ bold, medium, logo: `data:image/png;base64,${logo.toString("base64")}` }));
  return assets;
}

const headlineSize = (headline: string) => (headline.length <= 22 ? 84 : headline.length <= 34 ? 70 : 58);

export async function renderLinkedinVisual({ headline, subline, rows, dateLabel, sources }: VisualInput): Promise<ImageResponse> {
  const { bold, medium, logo } = await loadAssets();
  const compact = rows.length > 6;
  const rowHeight = compact ? 74 : 142;
  const titleSize = compact ? 27 : 34;
  const metaSize = compact ? 21 : 28;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: MINT,
          padding: "56px 60px 52px",
          fontFamily: "Jakarta",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", background: "#ffffff", border: `2px solid ${MINT_STRONG}`, borderRadius: 18, padding: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse, pas par le navigateur */}
                <img src={logo} width={58} height={58} alt="" />
              </div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>
                stageio<span style={{ color: GREEN }}>.fr</span>
              </div>
            </div>
            <div style={{ display: "flex", background: "#ffffff", color: GREEN_DARK, fontSize: 24, fontWeight: 800, padding: "10px 22px", borderRadius: 999, border: `2px solid ${MINT_STRONG}` }}>
              {subline}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: headlineSize(headline), fontWeight: 800, color: INK, lineHeight: 1.04, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
            {headline}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 16 }}>
            {rows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  height: rowHeight,
                  background: "#ffffff",
                  border: `2px solid ${MINT_STRONG}`,
                  borderRadius: 22,
                  padding: compact ? "0 22px" : "0 28px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: compact ? 42 : 56,
                    height: compact ? 42 : 56,
                    borderRadius: 999,
                    background: GREEN,
                    color: "#ffffff",
                    fontSize: compact ? 22 : 30,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: compact ? 1 : 4, flexGrow: 1, maxWidth: compact ? 860 : 800, overflow: "hidden" }}>
                  <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, color: INK, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
                    {compact ? (row.title.length > 52 ? `${row.title.slice(0, 51).trimEnd()}…` : row.title) : row.title}
                  </div>
                  <div style={{ display: "flex", fontSize: metaSize, fontWeight: 500, color: MUTED }}>
                    {[row.company, row.city].filter(Boolean).join("  ·  ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", background: GREEN, color: "#ffffff", fontSize: 32, fontWeight: 800, padding: "16px 34px", borderRadius: 18 }}>
              Postule sur stageio.fr
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: MUTED }}>{dateLabel}</div>
          </div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 500, color: MUTED }}>Sources des offres : {sources}</div>
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
