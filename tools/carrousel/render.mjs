// Usine à carrousels Stageio : un fichier JSON (voir carrousels/) -> une
// image PNG 1080 x 1350 par slide, au style « fiches » (gros titres en
// capitales, identité Stageio vert et blanc). Lancement :
//   node tools/carrousel/render.mjs tools/carrousel/carrousels/<slug>.json [dossier-de-sortie]
// Icônes : Lucide (licence ISC), récupérées sur unpkg et gardées en cache.
// Photos : URL d'une photo libre de droits (Unsplash) ou chemin local.
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    // Environnement Claude Code (playwright installé globalement).
    return (await import("/opt/node22/lib/node_modules/playwright/index.mjs")).chromium;
  }
}

const W = 1080;
const H = 1350;
// Identité Stageio (src/app/globals.css) : vert et blanc.
const C = {
  paper: "#FFFFFF",
  ink: "#132B33",
  muted: "#4A5F66",
  green: "#0F9C56",
  greenDark: "#085A32",
  mint: "#C9F0D7",
  mintStrong: "#97E0B3",
  glow: "#5CC98A",
  icon: "#0C7A44",
};

// Le navigateur de rendu n'a pas forcément accès au réseau : police et
// photos sont téléchargées ici (Node) puis intégrées en data URI.
async function cached(name, url, headers = {}) {
  const cacheDir = path.join(here, ".cache", "assets");
  const file = path.join(cacheDir, name);
  try {
    await access(file);
    return await readFile(file);
  } catch {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Téléchargement impossible (${res.status}) : ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, buf);
    return buf;
  }
}

async function fontFaceCss() {
  const ua = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" };
  const css = (await cached("montserrat.css", "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap", ua)).toString();
  // Seulement les sous-ensembles latins (français), en base64.
  const blocks = css.split("@font-face").filter((b) => b.includes("U+0000-00FF"));
  const out = [];
  for (const b of blocks) {
    const url = b.match(/url\((https:[^)]+)\)/)?.[1];
    const weight = b.match(/font-weight:\s*(\d+)/)?.[1];
    if (!url || !weight) continue;
    const data = (await cached(`montserrat-${weight}.woff2`, url)).toString("base64");
    out.push(`@font-face{font-family:'Montserrat';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`);
  }
  return out.join("\n");
}

async function photoDataUri(src) {
  if (!src) return "";
  if (src.startsWith("data:")) return src;
  const buf = src.startsWith("http")
    ? await cached(`photo-${Buffer.from(src).toString("base64url").slice(-60)}.jpg`, src)
    : await readFile(src);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function icon(name) {
  const cacheDir = path.join(here, ".cache", "icons");
  const file = path.join(cacheDir, `${name}.svg`);
  try {
    await access(file);
    return await readFile(file, "utf8");
  } catch {
    const res = await fetch(`https://unpkg.com/lucide-static@0.454.0/icons/${name}.svg`);
    if (!res.ok) throw new Error(`Icône Lucide introuvable : ${name}`);
    const svg = await res.text();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, svg);
    return svg;
  }
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==mot== -> surligné vert ; **mot** -> gras.
function rich(s) {
  return esc(s)
    .replace(/==(.+?)==/g, '<span class="hl">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; }
body { font-family: 'Montserrat', sans-serif; color: ${C.ink}; overflow: hidden; }
.slide { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; }
.paper {
  background-color: ${C.paper};
  background-image:
    radial-gradient(circle at 100% 0%, rgba(15,156,86,.10), transparent 38%),
    radial-gradient(circle at 0% 100%, rgba(15,156,86,.08), transparent 42%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.chip { display: inline-block; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1; border-radius: 22px; padding: 22px 30px 18px; }
.chip.dark { background: ${C.greenDark}; color: #fff; }
.chip.green { background: ${C.green}; color: #fff; }
.hl { background: linear-gradient(180deg, transparent 12%, ${C.mint} 12%, ${C.mint} 92%, transparent 92%); padding: 0 6px; border-radius: 6px; }
.brand { display: flex; align-items: center; gap: 12px; font-weight: 800; letter-spacing: -0.02em; }
.brand .dot { width: 18px; height: 18px; border-radius: 50%; background: ${C.green}; box-shadow: 0 0 0 5px rgba(15,156,86,.25); }
.tab { position: absolute; right: -10px; bottom: -10px; width: 210px; height: 120px; background: ${C.green}; color: #fff; border-top-left-radius: 120px 110px; display: flex; align-items: center; justify-content: flex-end; padding-right: 50px; }
.tab svg { width: 64px; height: 64px; stroke-width: 2.6; }
.circle { flex-shrink: 0; width: 92px; height: 92px; border-radius: 50%; background: ${C.green}; color: #fff; display: flex; align-items: center; justify-content: center; }
.circle svg { width: 52px; height: 52px; stroke-width: 2.6; }
`;

async function coverSlide(s) {
  const arrow = await icon("arrow-right");
  const lines = (s.title || []).map((l) => `<div class="line">${esc(l)}</div>`).join("");
  const photo = await photoDataUri(s.photo);
  return `
  <div class="slide cover">
    <div class="photo" style="background-image:url('${photo}'); background-position:${s.photoPosition || "center"}"></div>
    <div class="shade"></div>
    <div class="brand cover-brand"><span class="dot"></span>stageio.fr</div>
    <div class="cover-text">
      ${lines}
      ${s.highlight ? `<div class="chip green cover-hl">${esc(s.highlight)}</div>` : ""}
      <div class="glow">${arrow}</div>
    </div>
  </div>
  <style>
    .cover { background: #03160D; }
    .cover .photo { position: absolute; inset: 0; background-size: cover; filter: brightness(.62) contrast(1.05) saturate(.75); }
    .cover .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(3,22,13,.55) 0%, rgba(3,22,13,0) 28%, rgba(3,22,13,.2) 50%, rgba(3,22,13,.9) 78%, #03160D 100%); }
    .cover-brand { position: absolute; top: 64px; left: 64px; color: #fff; font-size: 46px; }
    .cover-text { position: absolute; left: 60px; right: 60px; bottom: 140px; }
    .cover-text .line { color: #fff; font-weight: 900; font-size: ${s.titleSize || 88}px; line-height: 1.02; text-transform: uppercase; letter-spacing: -0.02em; text-shadow: 0 4px 30px rgba(0,0,0,.5); }
    .cover-hl { margin-top: 18px; font-size: ${s.highlightSize || 92}px; padding: 18px 26px 12px; border-radius: 26px; white-space: nowrap; }
    .glow { margin: 56px auto 0; width: 150px; color: ${C.glow}; filter: drop-shadow(0 0 22px rgba(92,201,138,.85)); }
    .glow svg { width: 150px; height: 90px; stroke-width: 3; }
  </style>`;
}

async function tipSlide(s) {
  const arrow = await icon("arrow-right");
  const items = await Promise.all(
    (s.items || []).map(async (it) => `<div class="item"><div class="ico">${await icon(it.icon)}</div><div class="lbl">${rich(it.label)}</div></div>`),
  );
  const [t1, t2] = s.title;
  return `
  <div class="slide paper tip">
    <div class="titles">
      <div class="chip dark t1">${esc(t1)}</div><br/>
      ${t2 ? `<div class="chip green t2">${esc(t2)}</div>` : ""}
    </div>
    <div class="point"><div class="circle">${arrow}</div><p>${rich(s.text)}</p></div>
    ${s.objectif ? `<div class="obj"><span>${esc(s.objectif)}</span></div>` : ""}
    ${items.length ? `<div class="items n${items.length}">${items.join("")}</div>` : ""}
    ${s.note ? `<p class="note">${rich(s.note)}</p>` : ""}
    <div class="brand foot"><span class="dot"></span>stageio.fr</div>
    <div class="tab">${arrow}</div>
  </div>
  <style>
    .tip { padding: 92px 64px 0; }
    .titles .chip { font-size: ${s.titleSize || 96}px; }
    .titles .t2 { margin-top: -8px; }
    .point { display: flex; align-items: center; gap: 34px; margin: 84px 0 0 ${s.pointIndent ?? 40}px; }
    .point p { font-size: 50px; font-weight: 700; line-height: 1.28; letter-spacing: -0.01em; }
    .obj { text-align: center; margin-top: 90px; }
    .obj span { display: inline-block; font-weight: 900; font-size: 78px; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1; padding: 0 22px; background: linear-gradient(180deg, transparent 52%, ${C.mintStrong} 52%, ${C.mintStrong} 96%, transparent 96%); border-radius: 12px; }
    .items { display: flex; justify-content: space-around; margin-top: 64px; }
    .item { width: 300px; text-align: center; }
    .items.n1 .item { width: 700px; }
    .ico svg { width: 132px; height: 132px; stroke-width: 1.9; color: ${C.icon}; }
    .lbl { font-size: 42px; font-weight: 500; line-height: 1.2; margin-top: 18px; }
    .note { position: absolute; left: 64px; right: 260px; bottom: 120px; font-size: 26px; font-weight: 500; color: ${C.muted}; line-height: 1.35; }
    .foot { position: absolute; left: 64px; bottom: 48px; font-size: 32px; color: ${C.ink}; }
    .foot .dot { width: 14px; height: 14px; }
  </style>`;
}

async function ctaSlide(s) {
  const search = await icon("search");
  const arrow = await icon("arrow-right");
  const check = await icon("check");
  const bullets = (s.bullets || []).map((b) => `<li><span class="ok">${check}</span>${rich(b)}</li>`).join("");
  const [t1, t2] = s.title;
  return `
  <div class="slide paper cta">
    <div class="titles">
      <div class="chip dark t1">${esc(t1)}</div><br/>
      ${t2 ? `<div class="chip green t2">${esc(t2)}</div>` : ""}
    </div>
    <p class="lead">${rich(s.lead || "Tape-le directement sur Google :")}</p>
    <div class="searchbar"><span class="mag">${search}</span><span class="url">stageio.fr</span></div>
    <ul>${bullets}</ul>
    <div class="brand foot"><span class="dot"></span>stageio.fr</div>
    <div class="tab">${arrow}</div>
  </div>
  <style>
    .cta { padding: 92px 64px 0; }
    .cta .titles .chip { font-size: ${s.titleSize || 92}px; }
    .cta .titles .t2 { margin-top: -8px; }
    .lead { margin-top: 76px; font-size: 44px; font-weight: 700; }
    .searchbar { margin-top: 28px; display: flex; align-items: center; gap: 26px; background: #fff; border-radius: 999px; padding: 34px 46px; box-shadow: 0 14px 40px rgba(15,156,86,.18); border: 4px solid ${C.green}; }
    .mag svg { width: 60px; height: 60px; stroke-width: 2.6; color: ${C.green}; }
    .url { font-size: 76px; font-weight: 900; letter-spacing: -0.02em; color: ${C.greenDark}; }
    ul { list-style: none; margin-top: 70px; display: flex; flex-direction: column; gap: 30px; }
    li { display: flex; align-items: center; gap: 24px; font-size: 42px; font-weight: 600; line-height: 1.25; }
    .ok { flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; background: ${C.green}; color: #fff; display: flex; align-items: center; justify-content: center; }
    .ok svg { width: 38px; height: 38px; stroke-width: 3; }
    .foot { position: absolute; left: 64px; bottom: 48px; font-size: 32px; }
    .foot .dot { width: 14px; height: 14px; }
  </style>`;
}

const BUILDERS = { cover: coverSlide, tip: tipSlide, cta: ctaSlide };

async function main() {
  const [specPath, outArg] = process.argv.slice(2);
  if (!specPath) throw new Error("Usage : node tools/carrousel/render.mjs <spec.json> [dossier-de-sortie]");
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const outDir = outArg || path.join(here, "out", spec.slug);
  await mkdir(outDir, { recursive: true });
  const chromium = await loadChromium();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const fonts = await fontFaceCss();
  const files = [];
  for (const [i, s] of spec.slides.entries()) {
    const build = BUILDERS[s.type];
    if (!build) throw new Error(`Type de slide inconnu : ${s.type}`);
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${fonts}${BASE_CSS}</style></head><body>${await build(s)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${String(i + 1).padStart(2, "0")}-${s.type}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  await browser.close();
  console.log(files.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
