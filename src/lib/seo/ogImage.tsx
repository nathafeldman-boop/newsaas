import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Aperçu affiché quand un lien Stageio est partagé (WhatsApp, LinkedIn,
// Snapchat, iMessage...) : le titre de la page et ses vrais chiffres plutôt
// que le visuel générique du site. Un aperçu concret donne envie de cliquer,
// et c'est le canal de partage (ShareButtons) qui en profite le plus.
// Polices : Plus Jakarta Sans (police du site, licence OFL), sous-ensemble
// latin -- couvre les accents français, le €, les guillemets et l'espace
// fine insécable de toLocaleString("fr-FR"), mais pas les flèches ni les
// emojis : ne pas en mettre dans les textes passés ici.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const NAVY = "#1b3a8c";
const BLUE = "#3b82f6";
const GREEN = "#0f9c56";
const MUTED = "#5b6676";

export type OgCard = {
  kicker: string;
  title: string;
  stats?: string[];
  footer?: string;
};

let assets: Promise<{ bold: Buffer; medium: Buffer; logo: string }> | null = null;

function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-800-normal.woff")),
    readFile(join(process.cwd(), "src/assets/fonts/plus-jakarta-sans-latin-500-normal.woff")),
    readFile(join(process.cwd(), "public/logo.png")),
  ]).then(([bold, medium, logo]) => ({
    bold,
    medium,
    logo: `data:image/png;base64,${logo.toString("base64")}`,
  }));
  return assets;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : max).trimEnd()}...`;
}

function titleSize(title: string): number {
  if (title.length <= 34) return 76;
  if (title.length <= 60) return 64;
  return 52;
}

export async function renderOgCard({ kicker, title, stats = [], footer }: OgCard): Promise<ImageResponse> {
  const { bold, medium, logo } = await loadAssets();
  const shownTitle = truncate(title, 105);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f4ee",
          padding: "52px 64px",
          fontFamily: "Jakarta",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* logo.png a un fond blanc : on l'assume en icône d'app plutôt qu'un carré blanc qui flotte. */}
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "2px solid #e6dfd2",
              borderRadius: 20,
              padding: 4,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- rendu par ImageResponse, pas par le navigateur */}
            <img src={logo} width={64} height={64} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: NAVY, letterSpacing: "-0.02em" }}>
            stageio<span style={{ color: BLUE }}>.fr</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#dcf3e6",
                color: "#0b7a43",
                fontSize: 26,
                fontWeight: 800,
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              {truncate(kicker, 48)}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: titleSize(shownTitle),
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
            }}
          >
            {shownTitle}
          </div>
          {stats.length > 0 && (
            <div style={{ display: "flex", gap: 14 }}>
              {stats.slice(0, 3).map((stat) => (
                <div
                  key={stat}
                  style={{
                    display: "flex",
                    background: "#ffffff",
                    border: "2px solid #e6dfd2",
                    borderRadius: 16,
                    padding: "10px 20px",
                    fontSize: 28,
                    fontWeight: 500,
                    color: NAVY,
                  }}
                >
                  {truncate(stat, 34)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 500, color: MUTED }}>
            {footer ?? "Swipe les offres, postule en un geste"}
          </div>
          <div
            style={{
              display: "flex",
              background: GREEN,
              color: "#ffffff",
              fontSize: 27,
              fontWeight: 800,
              padding: "12px 26px",
              borderRadius: 14,
            }}
          >
            Inscription gratuite
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Jakarta", data: bold, weight: 800, style: "normal" },
        { name: "Jakarta", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

export function formatCount(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString("fr-FR")} ${n > 1 ? plural : singular}`;
}
