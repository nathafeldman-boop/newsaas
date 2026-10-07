// Les index mis en cache (programmatique, entreprises) gardent les ids des
// offres de chaque page. Une même offre apparaît dans 5 à 8 segments
// (métier, ville, métier × ville, département, région...) : stocker l'UUID
// (36 caractères) à chaque fois ferait dépasser la limite de 2 Mo du cache
// de Next dès quelques milliers d'offres de plus, et chaque page relirait
// alors tout le catalogue. On stocke donc chaque UUID une seule fois dans
// `idTable` et les segments ne gardent que sa position.

export type IdEncoder = { table: string[]; encode: (ids: string[]) => number[] };

export function idEncoder(): IdEncoder {
  const table: string[] = [];
  const positions = new Map<string, number>();
  return {
    table,
    encode: (ids) =>
      ids.map((id) => {
        let position = positions.get(id);
        if (position === undefined) {
          position = table.length;
          table.push(id);
          positions.set(id, position);
        }
        return position;
      }),
  };
}

export type Compacted<T extends { ids: string[] }> = Omit<T, "ids"> & { ids: number[] };

export function compactGroup<T extends { ids: string[] }>(group: Record<string, T>, encoder: IdEncoder): Record<string, Compacted<T>> {
  const out: Record<string, Compacted<T>> = {};
  for (const [key, entry] of Object.entries(group)) out[key] = { ...entry, ids: encoder.encode(entry.ids) };
  return out;
}

export function expandGroup<T extends { ids: string[] }>(group: Record<string, Compacted<T>>, table: string[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, entry] of Object.entries(group)) out[key] = { ...entry, ids: entry.ids.map((i) => table[i]) } as unknown as T;
  return out;
}

// Taille sérialisée en Ko, loguée à chaque recalcul pour surveiller la
// limite de 2 Mo dans les logs Vercel.
export function serializedKb(value: unknown): number {
  return Math.round(JSON.stringify(value).length / 1024);
}
