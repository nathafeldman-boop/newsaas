import { citySlugOf, offerInSector, type PostKind, type SectorGroup } from "@/lib/linkedin/format";
import { skipReason, type LinkedinOffer, type SkipReason } from "@/lib/linkedin/rules";

// Choix des offres à publier : lecture seule, aucune dépendance base. La base
// ne fait que fournir des candidates (data.ts) ; tout ce qui décide est ici,
// donc testé sans rien connecter.

const DAY = 86_400_000;

/** Âge maximal d'une offre publiée, par format (la plus récente d'abord, donc la fenêtre ne sert qu'à borner). */
export const WINDOW_DAYS: Record<PostKind, number> = { daily: 7, sector: 21, city: 21, weekly: 7 };

export type PickOptions = {
  kind: PostKind;
  now: number;
  /** Offres déjà préparées récemment : jamais reproposées. */
  blocked: Set<string>;
  /** Récap seulement : offres déjà mises en avant dans une autre publication, reproposées en dernier. */
  seen?: Set<string>;
  sector?: SectorGroup | null;
  /** Slug de la ville (« lyon »). */
  citySlug?: string | null;
};

export type Rejection = SkipReason | "deja_preparee" | "hors_cible" | "trop_ancienne_fenetre" | "doublon";

export type Ranked = {
  /** Candidates dans l'ordre de publication, sans doublon d'offre. */
  eligible: LinkedinOffer[];
  /** Combien d'offres lues ont été écartées, et pourquoi. */
  rejected: Partial<Record<Rejection, number>>;
};

export function rankCandidates(candidates: LinkedinOffer[], { kind, now, blocked, seen, sector, citySlug }: PickOptions): Ranked {
  const rejected: Partial<Record<Rejection, number>> = {};
  const reject = (reason: Rejection) => {
    rejected[reason] = (rejected[reason] ?? 0) + 1;
  };
  const oldest = now - WINDOW_DAYS[kind] * DAY;
  const fingerprints = new Set<string>();
  const ids = new Set<string>();
  const eligible: LinkedinOffer[] = [];

  for (const offer of candidates) {
    if (ids.has(offer.id)) continue;
    ids.add(offer.id);
    const reason = skipReason(offer, now);
    if (reason) {
      reject(reason);
      continue;
    }
    if (Date.parse(offer.published_at) < oldest) {
      reject("trop_ancienne_fenetre");
      continue;
    }
    if (blocked.has(offer.id)) {
      reject("deja_preparee");
      continue;
    }
    if (kind === "sector" && sector && !offerInSector(offer, sector)) {
      reject("hors_cible");
      continue;
    }
    if (kind === "city" && citySlug && citySlugOf(offer) !== citySlug) {
      reject("hors_cible");
      continue;
    }
    // Même annonce reprise par deux sources : une seule.
    if (offer.content_fingerprint) {
      if (fingerprints.has(offer.content_fingerprint)) {
        reject("doublon");
        continue;
      }
      fingerprints.add(offer.content_fingerprint);
    }
    eligible.push(offer);
  }

  const byDate = (a: LinkedinOffer, b: LinkedinOffer) => Date.parse(b.published_at) - Date.parse(a.published_at);
  const byQuality = (a: LinkedinOffer, b: LinkedinOffer) => (b.quality_score ?? 0) - (a.quality_score ?? 0);
  // Le récap met en avant les fiches les mieux renseignées ; les autres formats, les plus récentes.
  eligible.sort(kind === "weekly" ? (a, b) => byQuality(a, b) || byDate(a, b) : (a, b) => byDate(a, b) || byQuality(a, b));
  if (seen && seen.size > 0) {
    const fresh = eligible.filter((o) => !seen.has(o.id));
    const already = eligible.filter((o) => seen.has(o.id));
    return { eligible: [...fresh, ...already], rejected };
  }
  return { eligible, rejected };
}

const companyKey = (o: Pick<LinkedinOffer, "company">) => o.company.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Au plus une offre par entreprise (et `maxPerCity` par ville), dans l'ordre reçu. */
export function pickDiverse(ranked: LinkedinOffer[], count: number, maxPerCity = Infinity): LinkedinOffer[] {
  const companies = new Set<string>();
  const perCity = new Map<string, number>();
  const picked: LinkedinOffer[] = [];
  for (const offer of ranked) {
    if (picked.length >= count) break;
    const company = companyKey(offer);
    if (companies.has(company)) continue;
    const city = citySlugOf(offer) ?? "";
    if (city && (perCity.get(city) ?? 0) >= maxPerCity) continue;
    companies.add(company);
    if (city) perCity.set(city, (perCity.get(city) ?? 0) + 1);
    picked.push(offer);
  }
  return picked;
}
