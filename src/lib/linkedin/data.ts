import type { SupabaseClient } from "@supabase/supabase-js";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { LINKEDIN_OFFER_COLUMNS, LINKEDIN_SOURCES, REPOST_BLOCK_DAYS, type LinkedinOffer } from "@/lib/linkedin/rules";
import { WINDOW_DAYS } from "@/lib/linkedin/pick";
import type { PostKind, PostTarget, SectorGroup } from "@/lib/linkedin/format";

// Lectures et écritures Supabase des publications LinkedIn. Le client est
// volontairement non typé : la table linkedin_posts est créée à la main
// (comme channel_views), elle n'est pas dans types/database.ts.

type Db = SupabaseClient;
const DAY = 86_400_000;

// Une ligne par instruction, sans guillemets ni valeurs entre apostrophes :
// l'éditeur SQL de Supabase sur téléphone complète les guillemets tout seul
// et un collage incomplet donne « syntax error ».
export const LINKEDIN_POSTS_SQL = `create table if not exists public.linkedin_posts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), kind text not null, label text not null, body text not null, comment text, offer_ids uuid[] not null default array[]::uuid[], published boolean not null default false, published_at timestamptz, linkedin_url text);
alter table public.linkedin_posts enable row level security;`;

export type PostRow = {
  id: string;
  created_at: string;
  kind: PostKind;
  label: string;
  body: string;
  comment: string | null;
  offer_ids: string[];
  published: boolean;
  published_at: string | null;
  linkedin_url: string | null;
};

const isMissingTable = (error: { code?: string }) => error.code === "42P01" || error.code === "PGRST205";

/** Offres candidates : alternances actives de sources publiables, publiées dans la fenêtre du format. */
export async function loadCandidates(db: Db, kind: PostKind, now: number, citySearch?: string | null): Promise<LinkedinOffer[]> {
  let query = db
    .from("offers")
    .select(LINKEDIN_OFFER_COLUMNS)
    .eq("is_active", true)
    .eq("contract_type", "alternance")
    .in("source", [...LINKEDIN_SOURCES])
    .gte("published_at", new Date(now - WINDOW_DAYS[kind] * DAY).toISOString())
    .order("published_at", { ascending: false })
    .limit(kind === "sector" ? 800 : kind === "city" ? 500 : 300);
  // Ville : lettres, espaces et tirets seulement (le libellé vient de la liste TOP_CITIES).
  if (citySearch && /^[\p{L} '-]+$/u.test(citySearch)) query = query.ilike("location", `%${citySearch}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Lecture des offres impossible : ${error.message}`);
  return (data ?? []) as unknown as LinkedinOffer[];
}

export async function fetchOffersByIds(db: Db, ids: string[]): Promise<LinkedinOffer[]> {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (clean.length === 0) return [];
  const { data, error } = await db.from("offers").select(LINKEDIN_OFFER_COLUMNS).in("id", clean);
  if (error) throw new Error(`Lecture des offres impossible : ${error.message}`);
  const byId = new Map((data as unknown as LinkedinOffer[]).map((o) => [o.id, o]));
  return clean.map((id) => byId.get(id)).filter((o): o is LinkedinOffer => Boolean(o));
}

export type History = { rows: PostRow[]; tableMissing: boolean };

export async function loadHistory(db: Db, limit = 40): Promise<History> {
  const { data, error } = await db.from("linkedin_posts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) {
    if (isMissingTable(error)) return { rows: [], tableMissing: true };
    throw new Error(`Lecture de l'historique impossible : ${error.message}`);
  }
  return { rows: (data ?? []) as PostRow[], tableMissing: false };
}

export async function loadPost(db: Db, id: string): Promise<PostRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("linkedin_posts").select("*").eq("id", id).maybeSingle();
  return (data as PostRow | null) ?? null;
}

/**
 * Offres déjà préparées. `blocked` : jamais reproposées (60 jours). Le récap
 * ne se bloque que sur les récaps précédents ; les offres des autres
 * publications y sont reproposées en dernier (`seen`).
 */
export async function loadUsedOfferIds(
  db: Db,
  kind: PostKind,
  now: number,
): Promise<{ blocked: Set<string>; seen: Set<string>; tableMissing: boolean }> {
  const { data, error } = await db
    .from("linkedin_posts")
    .select("kind, offer_ids")
    .gte("created_at", new Date(now - REPOST_BLOCK_DAYS * DAY).toISOString());
  if (error) {
    if (isMissingTable(error)) return { blocked: new Set(), seen: new Set(), tableMissing: true };
    throw new Error(`Lecture de l'historique impossible : ${error.message}`);
  }
  const blocked = new Set<string>();
  const seen = new Set<string>();
  for (const row of (data ?? []) as { kind: PostKind; offer_ids: string[] }[]) {
    const target = kind === "weekly" && row.kind !== "weekly" ? seen : blocked;
    for (const id of row.offer_ids ?? []) target.add(id);
  }
  return { blocked, seen, tableMissing: false };
}

export async function insertPost(db: Db, post: Omit<PostRow, "id" | "created_at" | "published" | "published_at" | "linkedin_url">): Promise<{ id: string } | { error: string; tableMissing: boolean }> {
  const { data, error } = await db.from("linkedin_posts").insert(post).select("id").single();
  if (error || !data) return { error: error?.message ?? "réponse vide", tableMissing: error ? isMissingTable(error) : false };
  return { id: (data as { id: string }).id };
}

export async function setPublished(db: Db, id: string, url: string | null): Promise<string | null> {
  const { error } = await db.from("linkedin_posts").update({ published: true, published_at: new Date().toISOString(), linkedin_url: url }).eq("id", id);
  return error ? error.message : null;
}

export async function deletePost(db: Db, id: string): Promise<string | null> {
  const { error } = await db.from("linkedin_posts").delete().eq("id", id);
  return error ? error.message : null;
}

/**
 * Cible d'une publication par secteur ou par ville : page Stageio vers
 * laquelle renvoie la fin du post (celle qui existe, sinon /alternance) et
 * nombre d'offres d'alternance en ligne (même source que ces pages).
 */
export async function loadTarget(kind: "sector" | "city", sector: SectorGroup | null, city: { slug: string; label: string } | null): Promise<PostTarget | null> {
  let index: Awaited<ReturnType<typeof getProgrammaticIndex>> | null = null;
  try {
    index = await getProgrammaticIndex("alternance");
  } catch (err) {
    console.error("linkedin: index des pages indisponible", err);
  }
  if (kind === "sector" && sector) {
    const exists = index?.metiers[sector.landing];
    const count = index ? sector.metiers.reduce((sum, slug) => sum + (index!.metiers[slug]?.count ?? 0), 0) : null;
    return {
      label: sector.label,
      landingPath: exists || !index ? `/alternance/${sector.landing}` : "/alternance",
      count: count || null,
      hashtags: sector.hashtags,
      key: sector.slug,
    };
  }
  if (kind === "city" && city) {
    const entry = index?.cities[city.slug];
    return {
      label: city.label,
      landingPath: entry || !index ? `/alternance/${city.slug}` : "/alternance",
      count: entry?.count ?? null,
      hashtags: [`#${city.label.toLowerCase().replace(/[^a-zà-ÿ]+/g, "")}`],
      key: city.slug,
    };
  }
  return null;
}
