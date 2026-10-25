import { normalizeTitle } from "@/lib/seo/metiers";
import { departementFromLocation } from "@/lib/seo/departements";
import { targetMetiersOf } from "@/lib/matching/score";

// Composition du paquet de cartes (25/10, Nathan : « personne ne like, les
// offres ne sont pas assez pertinentes ») : une fois les offres notées et
// triées, on retire les doublons, on garde le bon métier quand il y en a
// assez, et on évite qu'une seule entreprise remplisse le paquet. Pur et
// testable : aucune lecture en base ici.

type DeckOffer = { id: string; title: string; company: string; location: string };

const key = (o: DeckOffer) =>
  [
    normalizeTitle(o.title)
      .replace(/\((h\/f|f\/h)\)|\b(h\/f|f\/h)\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim(),
    o.company.trim().toLowerCase(),
    departementFromLocation(o.location) ?? o.location.trim().toLowerCase(),
  ].join("|");

/** Même intitulé, même entreprise, même département : une seule carte (la mieux classée). */
export function dedupeOffers<T extends DeckOffer>(ranked: T[]): T[] {
  const seen = new Set<string>();
  return ranked.filter((o) => {
    const k = key(o);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Métier visé : quand au moins `min` offres du bon métier sont disponibles,
 * le paquet ne montre qu'elles -- mieux vaut 20 cartes du bon métier que 30
 * dont 10 « Employé libre-service » pour quelqu'un qui cherche du commercial.
 * Sinon (trop peu d'offres de son métier), l'ordre reste celui du score.
 */
export function preferTargetJobs<T>(ranked: T[], isMatch: (o: T) => boolean, min = 12): T[] {
  const matches = ranked.filter(isMatch);
  return matches.length >= min ? matches : ranked;
}

/**
 * Au plus `maxPerCompany` cartes d'une même entreprise dans les `size`
 * premières (une agence d'intérim ou une enseigne qui publie 40 annonces ne
 * doit pas remplir le paquet). Les cartes mises de côté reviennent ensuite,
 * dans le même ordre, pour compléter si besoin.
 */
export function diversifyByCompany<T extends DeckOffer>(ranked: T[], size: number, maxPerCompany = 2): T[] {
  const counts = new Map<string, number>();
  const picked: T[] = [];
  const later: T[] = [];
  for (const o of ranked) {
    const company = o.company.trim().toLowerCase();
    const n = counts.get(company) ?? 0;
    // « Entreprise non communiquée » : ce n'est pas une seule entreprise.
    if (picked.length < size && (n < maxPerCompany || /non communiqu/.test(company))) {
      picked.push(o);
      counts.set(company, n + 1);
    } else {
      later.push(o);
    }
  }
  return [...picked, ...later];
}

// Seul le « e » devient un joker (é, è, ê : l'accent de loin le plus
// fréquent dans les intitulés). Remplacer toutes les voyelles empêchait
// l'index trigramme de servir (plus trois lettres de suite) : la base
// relisait toutes les offres à chaque paquet (25/10, Disk IO).
const ACCENTABLE = /e/g;

/**
 * Motifs ILIKE pour aller chercher en base les offres du métier visé (titre),
 * tirés de la liste des métiers du site : « Commercial » -> « %comm_rci% »…
 * Le « e » devient « _ » (un caractère quelconque) pour trouver aussi
 * « Développeur » quand le motif est « developpeu ». Au plus `max` motifs.
 */
export function targetJobTitlePatterns(targetJobs: string[], max = 8): string[] {
  const out = new Set<string>();
  const add = (fragment: string) => {
    const clean = fragment.trim();
    if (clean.length >= 6 && /^[a-z ]+$/.test(clean)) out.add(clean.replace(ACCENTABLE, "_"));
  };
  for (const metier of targetMetiersOf(targetJobs)) {
    // Alternatives « simples » du motif (sans syntaxe d'expression régulière).
    for (const alt of metier.pattern.source.split("|")) add(alt.replace(/\\b/g, ""));
  }
  // Métier tapé librement et inconnu de la liste : ses mots les plus longs.
  if (out.size === 0) {
    for (const job of targetJobs) {
      for (const word of normalizeTitle(job).split(/[^a-z]+/)) if (word.length >= 6) add(word.slice(0, 9));
    }
  }
  return [...out].slice(0, max);
}
