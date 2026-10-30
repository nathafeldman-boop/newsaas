import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows, POSTGREST_MAX_ROWS } from "@/lib/supabase/public";
import { channelLabel } from "@/lib/admin/channels";

// Lectures Supabase de la page Canaux : inscrits de la période, canal de
// chaque compte (réponse « Tu nous as connus comment ? », sinon utm_source)
// et vues saisies par jour. Les paiements viennent de Stripe (cockpit).

// Une ligne par instruction : un collage incomplet (ligne « primary key »
// perdue) donnait « syntax error at or near ")" ».
export const CHANNEL_VIEWS_SQL = `create table if not exists public.channel_views (day date not null, channel text not null, views integer not null check (views >= 0), created_at timestamptz not null default now(), primary key (day, channel));
alter table public.channel_views enable row level security;`;

export type ChannelInputs = {
  signups: { userId: string; at: number }[];
  channels: [string, string][];
  views: { day: string; channel: string; views: number }[];
  /** Table des vues absente : afficher le SQL à coller dans Supabase. */
  viewsTableMissing: boolean;
};

export const parisDay = (t: number) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

async function load(startIso: string, endIso: string, payerIds: string[]): Promise<ChannelInputs> {
  const db = createAdminClient();
  const signupRows = await fetchAllRows<{ id: string; created_at: string; utm_source: string | null }>((from, to) =>
    db.from("profiles").select("id, created_at, utm_source").gte("created_at", startIso).lt("created_at", endIso).order("created_at").range(from, to),
  );
  const utmByUser = new Map(signupRows.map((p) => [p.id, p.utm_source]));
  const missing = [...new Set(payerIds)].filter((id) => !utmByUser.has(id));
  for (let i = 0; i < missing.length; i += 200) {
    const { data, error } = await db.from("profiles").select("id, utm_source").in("id", missing.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const p of data ?? []) utmByUser.set(p.id, p.utm_source);
  }

  // Dernière réponse de chaque compte, lue par lots d'ids (index user_id + event_type).
  const ids = [...utmByUser.keys()];
  const heard = new Map<string, { source: string; format: string | null; at: string }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await db
      .from("user_events")
      .select("user_id, metadata, created_at")
      .eq("event_type", "heard_from")
      .in("user_id", ids.slice(i, i + 200))
      .limit(POSTGREST_MAX_ROWS);
    if (error) throw new Error(error.message);
    for (const e of data ?? []) {
      const meta = e.metadata as { source?: unknown; format?: unknown } | null;
      if (typeof meta?.source !== "string") continue;
      const prev = heard.get(e.user_id);
      if (!prev || e.created_at > prev.at) heard.set(e.user_id, { source: meta.source, format: typeof meta.format === "string" ? meta.format : null, at: e.created_at });
    }
  }

  const { data: viewRows, error: viewsError } = await db
    .from("channel_views")
    .select("day, channel, views")
    .gte("day", parisDay(Date.parse(startIso)))
    .lte("day", parisDay(Date.parse(endIso) - 1))
    .limit(5_000);
  const viewsTableMissing = !!viewsError && (viewsError.code === "42P01" || viewsError.code === "PGRST205");
  if (viewsError && !viewsTableMissing) throw new Error(viewsError.message);

  return {
    signups: signupRows.map((p) => ({ userId: p.id, at: Date.parse(p.created_at) })),
    channels: ids.map((id) => [id, channelLabel(heard.get(id), utmByUser.get(id))]),
    views: (viewRows ?? []).map((v) => ({ day: v.day, channel: v.channel, views: Number(v.views) })),
    viewsTableMissing,
  };
}

// 10 min de cache ; jeté par la saisie des vues (tag).
export const CHANNELS_TAG = "admin-channels";
export const loadChannelInputs = unstable_cache(load, ["admin-channels-v1"], { revalidate: 600, tags: [CHANNELS_TAG] });
