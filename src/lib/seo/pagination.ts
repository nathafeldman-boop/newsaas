// Pagination des listes publiques (/offres, /offres/stage, pages ville et
// secteur). Chaque page ?page=N est une page à part entière pour Google :
// canonical vers ELLE-MÊME (jamais vers la page 1, sinon Google ignore les
// offres listées au-delà de la page 1) et titre distinct, sinon 120 pages
// "Offres de stage | Stageio" identiques remontent en titres dupliqués
// dans Search Console.

export function parsePageParam(raw: string | undefined): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function pagedPath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function pagedTitle(title: string, page: number): string {
  return page > 1 ? `${title} – page ${page}` : title;
}

// Fenêtre de liens : 1 … 4 5 [6] 7 8 … 120 plutôt que 120 liens sur chaque
// page (dilution des liens internes et HTML inutilement lourd).
export function pageWindow(page: number, totalPages: number, radius = 2): (number | "…")[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}
