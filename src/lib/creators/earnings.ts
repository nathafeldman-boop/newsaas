import type { ViewSnapshot } from "@/lib/creators/tiktokViews";

// Gains des créateurs (18/11, Nathan) : RPM en euros pour 1 000 vues.
// Carrousel 0,50 € ; vidéo faceless 1 € ; vidéo face 1,50 €. Pour une vidéo,
// le type validé par Stageio l'emporte sur celui déclaré ; sans déclaration,
// on compte faceless (le plus bas) en attendant.

export type VideoKind = "carousel" | "video";
export type FaceKind = "face" | "faceless";

export const RPM_EUR = { carousel: 0.5, faceless: 1, face: 1.5 } as const;

export type EarningVideo = {
  id: string;
  kind: VideoKind | null;
  declared_face: FaceKind | null;
  approved_face: FaceKind | null;
  views: number | null;
};

export function faceOf(v: Pick<EarningVideo, "declared_face" | "approved_face">): FaceKind | null {
  return v.approved_face ?? v.declared_face ?? null;
}

/** RPM de la vidéo (€ pour 1 000 vues). Type inconnu (pas encore relevé) : tarif carrousel, le plus bas. */
export function rpmOf(v: Pick<EarningVideo, "kind" | "declared_face" | "approved_face">): number {
  if (v.kind !== "video") return RPM_EUR.carousel;
  return faceOf(v) === "face" ? RPM_EUR.face : RPM_EUR.faceless;
}

export function earningsEur(views: number, rpm: number): number {
  return (Math.max(0, views) / 1000) * rpm;
}

/** Vidéos (pas les carrousels) à faire valider : la 1re, puis la 5e, la 10e, la 15e… */
export function needsReview(videoSeq: number): boolean {
  return videoSeq === 1 || (videoSeq > 0 && videoSeq % 5 === 0);
}

function sortedByVideo(snapshots: ViewSnapshot[]): Map<string, ViewSnapshot[]> {
  const byVideo = new Map<string, ViewSnapshot[]>();
  for (const s of snapshots) {
    const list = byVideo.get(s.video_id) ?? [];
    list.push(s);
    byVideo.set(s.video_id, list);
  }
  for (const list of byVideo.values()) list.sort((a, b) => Date.parse(a.checked_at) - Date.parse(b.checked_at));
  return byVideo;
}

function viewsAt(list: ViewSnapshot[], t: number): number {
  let v = 0;
  for (const s of list) {
    if (Date.parse(s.checked_at) > t) break;
    v = s.views;
  }
  return v;
}

/** Vues gagnées par vidéo entre start et end (ms). */
export function gainedByVideo(snapshots: ViewSnapshot[], range: { start: number; end: number }): Map<string, number> {
  const out = new Map<string, number>();
  for (const [id, list] of sortedByVideo(snapshots)) out.set(id, Math.max(0, viewsAt(list, range.end) - viewsAt(list, range.start)));
  return out;
}

export type PeriodTotals = { views: number; eur: number };

/** Vues et gains sur une période, chaque vidéo à son RPM. */
export function periodTotals(videos: EarningVideo[], snapshots: ViewSnapshot[], range: { start: number; end: number }): PeriodTotals {
  const gained = gainedByVideo(snapshots, range);
  let views = 0;
  let eur = 0;
  for (const v of videos) {
    const g = gained.get(v.id) ?? 0;
    views += g;
    eur += earningsEur(g, rpmOf(v));
  }
  return { views, eur };
}

/** Courbe jour par jour (vues et euros gagnés chaque jour), `days` derniers jours jusqu'à `now`. */
export function dailySeries(videos: EarningVideo[], snapshots: ViewSnapshot[], days: number, now: number): { times: number[]; views: number[]; eur: number[] } {
  const DAY = 86_400_000;
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const times: number[] = [];
  const views: number[] = [];
  const eur: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const stop = end.getTime() - i * DAY;
    const t = periodTotals(videos, snapshots, { start: stop - DAY, end: stop });
    times.push(stop - DAY);
    views.push(t.views);
    eur.push(Math.round(t.eur * 100) / 100);
  }
  return { times, views, eur };
}

/** Début de la semaine (lundi), du mois et de l'année, heure locale du serveur. */
export function periodStarts(now: number): { week: number; month: number; year: number } {
  const d = new Date(now);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const week = new Date(day);
  week.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return { week: week.getTime(), month: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), year: new Date(d.getFullYear(), 0, 1).getTime() };
}
