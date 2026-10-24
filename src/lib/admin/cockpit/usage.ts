import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import type { Range } from "@/lib/admin/cockpit/metrics";

// Usage du produit par compte (Supabase), pour le funnel et l'adoption des
// fonctionnalités. Un fait = « a déjà fait X » et sa première date ; jamais
// le contenu (CV, lettre, réponses).

export const FEATURES = [
  { key: "like", label: "Like d'une offre", since: null },
  { key: "application", label: "Candidature enregistrée", since: null },
  { key: "cv", label: "CV importé", since: null },
  { key: "cover_letter_generated", label: "Lettre de motivation générée", since: null },
  { key: "cv_analyzed", label: "Analyse du CV", since: null },
  { key: "cv_offer_fit_analyzed", label: "CV comparé à une offre", since: null },
  { key: "interview_quiz_started", label: "Simulateur d'entretien (quiz commencé)", since: "2026-10-25" },
  { key: "interview_quiz_completed", label: "Simulateur d'entretien (quiz terminé)", since: "2026-10-25" },
  { key: "fresh_inbox_open", label: "Panneau « Nouveautés »", since: "2026-10-24" },
] as const;
export type FeatureKey = (typeof FEATURES)[number]["key"];

const EVENT_FEATURES = ["cover_letter_generated", "cv_analyzed", "cv_offer_fit_analyzed", "interview_quiz_started", "interview_quiz_completed"] as const;

export type UserFacts = {
  id: string;
  signupAt: number;
  onboardedAt: number | null;
  /** Première fois que la fonctionnalité a été utilisée. */
  first: Partial<Record<FeatureKey, number>>;
  /** Jours (Paris) avec une activité enregistrée : connexion ou swipe. */
  activeDays: number;
  secondDayAt: number | null;
  /** Dernière activité enregistrée (connexion, swipe, candidature). */
  lastActivityAt: number;
};

const dayFmt = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const parisDay = (t: number) => dayFmt.format(t);

export async function userFacts(ids: string[]): Promise<Map<string, UserFacts>> {
  const db = createAdminClient();
  const out = new Map<string, UserFacts>();
  const days = new Map<string, Set<string>>();
  const firstOnDay = new Map<string, Map<string, number>>();
  const unique = [...new Set(ids)];
  const lastAt = new Map<string, number>();
  const markDay = (id: string, t: number) => {
    if (t > (lastAt.get(id) ?? 0)) lastAt.set(id, t);
    const d = parisDay(t);
    const set = days.get(id) ?? new Set<string>();
    set.add(d);
    days.set(id, set);
    const m = firstOnDay.get(id) ?? new Map<string, number>();
    if (!m.has(d) || t < m.get(d)!) m.set(d, t);
    firstOnDay.set(id, m);
  };
  const setFirst = (f: UserFacts | undefined, key: FeatureKey, t: number) => {
    if (!f) return;
    if (f.first[key] === undefined || t < f.first[key]!) f.first[key] = t;
  };

  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const [profiles, swipes, apps, events, clicks] = await Promise.all([
      fetchAllRows<{ id: string; created_at: string; onboarding_completed: boolean; onboarding_completed_at: string | null; cv_uploaded_at: string | null }>((from, to) =>
        db.from("profiles").select("id, created_at, onboarding_completed, onboarding_completed_at, cv_uploaded_at").in("id", chunk).range(from, to),
      ),
      fetchAllRows<{ user_id: string; direction: string; created_at: string }>(
        (from, to) => db.from("swipes").select("user_id, direction, created_at").in("user_id", chunk).order("created_at").range(from, to),
        60_000,
        2,
      ),
      fetchAllRows<{ user_id: string; applied_at: string }>((from, to) => db.from("applications").select("user_id, applied_at").in("user_id", chunk).range(from, to)),
      fetchAllRows<{ user_id: string; event_type: string; created_at: string }>(
        (from, to) =>
          db
            .from("user_events")
            .select("user_id, event_type, created_at")
            .in("user_id", chunk)
            .in("event_type", [...EVENT_FEATURES, "login"])
            .range(from, to),
        60_000,
        2,
      ),
      fetchAllRows<{ user_id: string; created_at: string }>((from, to) =>
        db.from("user_events").select("user_id, created_at").in("user_id", chunk).eq("event_type", "button_click").eq("metadata->>button", "fresh_inbox_open").range(from, to),
      ),
    ]);
    for (const p of profiles) {
      const signupAt = Date.parse(p.created_at);
      // Comptes plus anciens que la colonne onboarding_completed_at : terminé, date inconnue.
      const onboardedAt = p.onboarding_completed_at ? Date.parse(p.onboarding_completed_at) : p.onboarding_completed ? signupAt : null;
      const f: UserFacts = { id: p.id, signupAt, onboardedAt, first: {}, activeDays: 0, secondDayAt: null, lastActivityAt: signupAt };
      if (p.cv_uploaded_at) f.first.cv = Date.parse(p.cv_uploaded_at);
      out.set(p.id, f);
      markDay(p.id, f.signupAt);
    }
    for (const s of swipes) {
      const t = Date.parse(s.created_at);
      if (s.direction === "like") setFirst(out.get(s.user_id), "like", t);
      markDay(s.user_id, t);
    }
    for (const a of apps) {
      const t = Date.parse(a.applied_at);
      setFirst(out.get(a.user_id), "application", t);
      markDay(a.user_id, t);
    }
    for (const e of events) {
      const t = Date.parse(e.created_at);
      if (e.event_type === "login") markDay(e.user_id, t);
      else setFirst(out.get(e.user_id), e.event_type as FeatureKey, t);
    }
    for (const c of clicks) setFirst(out.get(c.user_id), "fresh_inbox_open", Date.parse(c.created_at));
  }

  for (const f of out.values()) {
    const set = days.get(f.id) ?? new Set();
    f.activeDays = set.size;
    f.lastActivityAt = Math.max(f.signupAt, lastAt.get(f.id) ?? 0);
    const signupDay = parisDay(f.signupAt);
    const later = [...(firstOnDay.get(f.id) ?? new Map()).entries()].filter(([d]) => d > signupDay).sort((a, b) => a[1] - b[1]);
    f.secondDayAt = later[0]?.[1] ?? null;
  }
  return out;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const min = ms / 60_000;
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = min / 60;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} j`;
}

export type { Range };
