// Vues des TikTok des créateurs (16/11/2026) : Nathan colle les liens dans la
// vue d'ensemble admin, le cron /api/cron/tiktok-views relève les vues toutes
// les 3 h, et la vue d'ensemble en tire les vues gagnées sur la période et un
// RPM (revenu ÷ milliers de vues). Pas d'API TikTok : la page publique de la
// vidéo contient ses statistiques ("playCount") dans le JSON embarqué.

const TIKTOK_HOST_RE = /^(?:www\.|m\.|vm\.|vt\.)?tiktok\.com$/i;

export type ParsedTikTokUrl = { url: string; creator: string | null };

/** Lien TikTok nettoyé (sans paramètres de suivi), ou null si ce n'en est pas un. */
export function parseTikTokUrl(raw: string): ParsedTikTokUrl | null {
  const text = raw.trim();
  if (!text) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!TIKTOK_HOST_RE.test(u.hostname)) return null;
  const path = u.pathname.replace(/\/+$/, "");
  // Lien complet : /@compte/video/123… (ou /photo/ pour un carrousel).
  const full = path.match(/^\/@([^/]+)\/(video|photo)\/(\d{8,})$/);
  if (full) return { url: `https://www.tiktok.com/@${full[1]}/${full[2]}/${full[3]}`, creator: full[1].toLowerCase() };
  // Lien court partagé depuis l'appli (vm.tiktok.com/XXXX, tiktok.com/t/XXXX) : suivi au relevé.
  if (/^(vm|vt)\./i.test(u.hostname) && /^\/[A-Za-z0-9]+$/.test(path)) return { url: `https://${u.hostname.toLowerCase()}${path}`, creator: null };
  if (/^\/t\/[A-Za-z0-9]+$/.test(path)) return { url: `https://www.tiktok.com${path}`, creator: null };
  return null;
}

/** Liens d'un champ libre (un par ligne, ou séparés par des espaces/virgules). */
export function parseTikTokList(raw: string): { valid: ParsedTikTokUrl[]; invalid: string[] } {
  const valid: ParsedTikTokUrl[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const token of raw.split(/[\s,;]+/)) {
    if (!token) continue;
    const parsed = parseTikTokUrl(token);
    if (!parsed) invalid.push(token);
    else if (!seen.has(parsed.url)) {
      seen.add(parsed.url);
      valid.push(parsed);
    }
  }
  return { valid, invalid };
}

/** Nombre de vues lu dans le HTML de la page vidéo, ou null s'il n'y figure pas. */
export function extractPlayCount(html: string): number | null {
  // "playCount":12345 (stats) ou "playCount":"12345" (statsV2) : on prend le
  // plus grand, les deux décrivent la même vidéo (statsV2 est parfois plus frais).
  const values = [...html.matchAll(/"playCount":"?(\d+)"?/g)].map((m) => Number(m[1])).filter(Number.isFinite);
  return values.length > 0 ? Math.max(...values) : null;
}

/** Compte TikTok lu dans l'URL finale (après redirection d'un lien court). */
export function creatorFromUrl(url: string): string | null {
  const m = url.match(/tiktok\.com\/@([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Carrousel (photos) ou vidéo, lu dans la page : TikTok y met « imagePost » pour un carrousel, même avec une URL en /video/. */
export function detectKind(html: string, url: string): "carousel" | "video" {
  return /"imagePost":\{"images":\[/.test(html) || /\/photo\/\d/.test(url) ? "carousel" : "video";
}

export type FetchedViews = { views: number; finalUrl: string; kind: "carousel" | "video" } | { error: string };

export async function fetchTikTokViews(url: string, timeoutMs = 12_000): Promise<FetchedViews> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9", Accept: "text/html" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();
    const views = extractPlayCount(html);
    if (views === null) return { error: "vues introuvables dans la page (vidéo supprimée, privée ou page bloquée)" };
    return { views, finalUrl: res.url || url, kind: detectKind(html, res.url || url) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export type ViewSnapshot = { video_id: string; checked_at: string; views: number };

/** Vues d'une vidéo à l'instant t : dernier relevé à t ou avant, 0 s'il n'y en a pas encore. */
function viewsAt(sorted: ViewSnapshot[], t: number): number {
  let v = 0;
  for (const s of sorted) {
    if (Date.parse(s.checked_at) > t) break;
    v = s.views;
  }
  return v;
}

/**
 * Vues gagnées par l'ensemble des vidéos entre start et end (ms). Une vidéo
 * relevée pour la première fois pendant la période compte toutes ses vues :
 * elles ont été faites avant son premier relevé, pas avant la période.
 */
export function viewsGainedIn(snapshots: ViewSnapshot[], range: { start: number; end: number }): number {
  const byVideo = new Map<string, ViewSnapshot[]>();
  for (const s of snapshots) {
    const list = byVideo.get(s.video_id) ?? [];
    list.push(s);
    byVideo.set(s.video_id, list);
  }
  let total = 0;
  for (const list of byVideo.values()) {
    list.sort((a, b) => Date.parse(a.checked_at) - Date.parse(b.checked_at));
    total += Math.max(0, viewsAt(list, range.end) - viewsAt(list, range.start));
  }
  return total;
}

/** RPM en euros : revenu ÷ (vues ÷ 1000). null sans vues. */
export function rpmEuros(revenueCents: number, views: number): number | null {
  return views > 0 ? revenueCents / 100 / (views / 1000) : null;
}
