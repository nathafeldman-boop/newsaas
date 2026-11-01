import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_QUALITY_FOR_FEED } from "@/lib/offers/quality";
import { normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { cityTarget, FORMAT_RULES, sectorGroup, type LinkedinFormat } from "@/lib/linkedin/formats";

// Choix des offres à mettre en avant sur LinkedIn. Règles, toutes
// cumulatives, pour que chaque ligne publiée soit vraie et vérifiable :
// - offre active, de type alternance ;
// - source France Travail uniquement : les conditions de l'API Adzuna
//   imposent la mention « Adzuna » (lien) sur chaque annonce affichée et une
//   licence pour un usage commercial -- pas tenable dans un post LinkedIn ;
// - pas une annonce d'école déguisée (offers.is_school_ad) : 52 % des
//   alternances actives au 01/11 ;
// - entreprise nommée (France Travail écrit « Entreprise non communiquée »
//   pour ~30 % des offres restantes) : sans nom, le lecteur ne peut rien
//   vérifier et le post perd sa crédibilité ; ni lycée, CFA ou école ;
// - intitulé cohérent : pas de « STAGE - ... » classé alternance ;
// - qualité minimale du flux (quality_score, même seuil que /swipe) ;
// - jamais une offre déjà présente dans un post marqué « publié » ;
// - une seule offre par entreprise dans un même post.
// Les offres sont revérifiées à la source juste avant la préparation du
// brouillon (voir prepare.ts).

export type Candidate = {
  id: string;
  title: string;
  company: string;
  location: string;
  city: string;
  cityKey: string;
  sector: string | null;
  duration: string | null;
  salary: string | null;
  start_date: string | null;
  quality_score: number | null;
  created_at: string;
  /** Déjà dans un brouillon non publié (pas bloquant). */
  inDraft: boolean;
};

// Entreprise non nommée : libellés de remplacement vus chez France Travail
// (« Entreprise non communiquée », « On ne recrute pas » au 01/11).
const UNNAMED_COMPANY = /non communiqu|confidenti|anonyme|non renseign|ne recrute pas|^\s*$/i;

// Employeur qui ressemble à un organisme de formation (lycée, CFA, école) :
// probable annonce d'école passée entre les mailles de is_school_ad -- on
// ne la met pas en avant sur LinkedIn.
const SCHOOL_LIKE_COMPANY = /enseignemen|lycee|lycée|\bcfa\b|ecole|école|campus|academy|academie|académie|institut de formation|organisme de formation|\bformation\b/i;

/**
 * Intitulé qui annonce un stage alors que l'offre est classée alternance
 * (« STAGE - Assistant chef de projet », « Assistant marketing - Stage ») :
 * publier « Alternance » à côté serait faux. Gardé s'il parle aussi
 * d'alternance ou d'apprentissage.
 */
export function titleContradictsAlternance(title: string): boolean {
  return /\bstages?\b/i.test(title) && !/alternan|apprenti|contrat pro|professionnalisation/i.test(title);
}

/** L'offre peut-elle figurer dans un post (hors filtres SQL) ? */
export function isPublishable(r: { title: string; company: string | null }): boolean {
  const company = r.company ?? "";
  return !UNNAMED_COMPANY.test(company) && !SCHOOL_LIKE_COMPANY.test(company) && !titleContradictsAlternance(r.title);
}

const COLUMNS = "id, title, company, location, sector, duration, salary, start_date, quality_score, created_at";

type Row = Omit<Candidate, "city" | "cityKey" | "inDraft">;

/** Offres déjà utilisées : publiées (exclues) et en brouillon (signalées). */
async function usedOfferIds(): Promise<{ published: Set<string>; drafted: Set<string> }> {
  const since = new Date(Date.now() - 180 * 86_400_000).toISOString();
  const { data, error } = await createAdminClient()
    .from("linkedin_posts")
    .select("offer_ids, status")
    .gte("created_at", since)
    .in("status", ["publie", "brouillon"]);
  if (error) throw new Error(`linkedin_posts : ${error.message}`);
  const published = new Set<string>();
  const drafted = new Set<string>();
  for (const row of (data ?? []) as { offer_ids: string[]; status: string }[]) {
    for (const id of row.offer_ids ?? []) (row.status === "publie" ? published : drafted).add(id);
  }
  return { published, drafted };
}

/** Score « offre complète » du récap hebdo : qualité stockée + infos concrètes pour le lecteur. */
export function completenessScore(o: Pick<Candidate, "quality_score" | "duration" | "salary" | "start_date">): number {
  return (o.quality_score ?? 0) + (o.salary ? 10 : 0) + (o.duration ? 6 : 0) + (o.start_date ? 6 : 0);
}

/**
 * Garde une offre par entreprise (et, pour le récap hebdo, au plus 3 par
 * ville pour ne pas faire un post 100 % parisien), dans l'ordre reçu.
 */
export function diversify(rows: Candidate[], opts: { maxPerCity?: number } = {}): Candidate[] {
  const companies = new Set<string>();
  const perCity = new Map<string, number>();
  const out: Candidate[] = [];
  for (const r of rows) {
    const companyKey = slugify(r.company);
    if (companies.has(companyKey)) continue;
    if (opts.maxPerCity) {
      const n = perCity.get(r.cityKey) ?? 0;
      if (n >= opts.maxPerCity) continue;
      perCity.set(r.cityKey, n + 1);
    }
    companies.add(companyKey);
    out.push(r);
  }
  return out;
}

export type CandidateResult = {
  candidates: Candidate[];
  /** Ids présélectionnés (les N premiers). */
  preselected: string[];
  excludedPublished: number;
};

const MAX_CANDIDATES = 30;

export async function fetchCandidates(format: LinkedinFormat, segmentKey: string | null): Promise<CandidateResult> {
  const rules = FORMAT_RULES[format];
  const since = new Date(Date.now() - rules.windowDays * 86_400_000).toISOString();
  const sector = format === "secteur" ? sectorGroup(segmentKey) : null;
  const cityT = format === "ville" ? cityTarget(segmentKey) : null;
  if (format === "secteur" && !sector) throw new Error("Secteur inconnu.");
  if (format === "ville" && !cityT) throw new Error("Ville inconnue.");

  let query = createAdminClient()
    .from("offers")
    .select(COLUMNS)
    .eq("is_active", true)
    .eq("contract_type", "alternance")
    .eq("source", "france_travail")
    .or("is_school_ad.is.null,is_school_ad.eq.false")
    .gte("created_at", since)
    .gte("quality_score", MIN_QUALITY_FOR_FEED)
    .not("company", "ilike", "%non communiqu%");
  if (sector) query = query.in("sector", sector.sectors);
  // Filtre grossier en SQL (« %lyon% »), affiné ci-dessous avec la même
  // normalisation que les pages ville du site (écarte « Cormeilles-en-Parisis »).
  if (cityT) query = query.ilike("location", `%${cityT.label}%`);

  const [{ data, error }, used] = await Promise.all([
    query.order("created_at", { ascending: false }).order("id").limit(600),
    usedOfferIds(),
  ]);
  if (error) throw new Error(`offers : ${error.message}`);

  let excludedPublished = 0;
  let rows: Candidate[] = [];
  for (const r of (data ?? []) as Row[]) {
    if (!isPublishable(r)) continue;
    if (used.published.has(r.id)) {
      excludedPublished++;
      continue;
    }
    const cityName = normalizeCityKey(r.location);
    const cityKey = slugify(cityName);
    if (cityT && cityKey !== cityT.key) continue;
    rows.push({ ...r, city: titleCase(cityName) || r.location, cityKey, inDraft: used.drafted.has(r.id) });
  }

  if (rules.order === "best") {
    rows = [...rows].sort((a, b) => completenessScore(b) - completenessScore(a) || b.created_at.localeCompare(a.created_at));
  }
  // Brouillons en fin de liste : ils restent choisissables mais pas présélectionnés en premier.
  rows = [...rows.filter((r) => !r.inDraft), ...rows.filter((r) => r.inDraft)];
  const diverse = diversify(rows, { maxPerCity: format === "hebdo" || format === "jour" ? 2 : undefined }).slice(0, MAX_CANDIDATES);

  return {
    candidates: diverse,
    preselected: diverse.filter((c) => !c.inDraft).slice(0, rules.count).map((c) => c.id),
    excludedPublished,
  };
}
