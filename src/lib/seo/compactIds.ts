// Les index mis en cache (programmatique, entreprises) gardent les ids des
// offres de chaque page. Une même offre apparaît dans 5 à 8 segments
// (métier, ville, métier × ville, département, région...) : stocker l'UUID
// (36 caractères) à chaque fois ferait dépasser la limite de 2 Mo du cache
// de Next dès quelques milliers d'offres de plus, et chaque page relirait
// alors tout le catalogue. On stocke donc chaque UUID une seule fois dans
// `idTable` et les segments ne gardent que sa position.

//
// Dans `idTable`, un UUID tient en 22 caractères (ses 16 octets en base64url)
// au lieu de 36 : l'index grossit avec le catalogue (synchro France Travail
// par département), chaque octet compte. Un id qui n'est pas un UUID est
// gardé tel quel, préfixé de "~".

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function packId(id: string): string {
  if (!UUID.test(id)) return `~${id}`;
  return Buffer.from(id.replace(/-/g, ""), "hex").toString("base64url");
}

export function unpackId(packed: string): string {
  if (packed.startsWith("~")) return packed.slice(1);
  const hex = Buffer.from(packed, "base64url").toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function unpackIdTable(table: string[]): string[] {
  return table.map(unpackId);
}

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
          table.push(packId(id));
          positions.set(id, position);
        }
        return position;
      }),
  };
}

export type Compacted<T extends { ids: string[] }> = Omit<T, "ids"> & { ids: number[] };

// `maxIds` : ids gardés par segment (les plus récents d'abord), voir
// fitCacheBudget.
export function compactGroup<T extends { ids: string[] }>(
  group: Record<string, T>,
  encoder: IdEncoder,
  maxIds = Infinity,
): Record<string, Compacted<T>> {
  const out: Record<string, Compacted<T>> = {};
  for (const [key, entry] of Object.entries(group)) out[key] = { ...entry, ids: encoder.encode(entry.ids.slice(0, maxIds)) };
  return out;
}

// `ids` : la table déjà décodée (unpackIdTable), une fois pour tous les groupes.
export function expandGroup<T extends { ids: string[] }>(group: Record<string, Compacted<T>>, ids: string[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, entry] of Object.entries(group)) out[key] = { ...entry, ids: entry.ids.map((i) => ids[i]) } as unknown as T;
  return out;
}

// Au-delà de 2 Mo, le cache de données refuse l'entrée et chaque page
// recalculerait l'index (scan complet du catalogue à chaque vue). Si le
// catalogue grossit trop, on liste moins d'offres par page (les plus
// récentes) plutôt que de perdre le cache. Les compteurs ne changent pas.
export const CACHE_BUDGET_KB = 1800;
const ID_CAPS = [Infinity, 120, 72, 48, 24];

export function fitCacheBudget<T>(build: (maxIds: number) => T, label: string): T {
  for (const cap of ID_CAPS) {
    const compact = build(cap);
    const kb = serializedKb(compact);
    if (kb <= CACHE_BUDGET_KB || cap === ID_CAPS[ID_CAPS.length - 1]) {
      const capped = cap === Infinity ? "" : `, plafonné à ${cap} offres par page`;
      console.log(`${label}, ${kb} Ko${capped}`);
      if (kb > CACHE_BUDGET_KB) console.error(`${label} : ${kb} Ko, au-delà du budget de cache (${CACHE_BUDGET_KB} Ko)`);
      return compact;
    }
  }
  throw new Error("unreachable");
}

// Taille sérialisée en Ko, loguée à chaque recalcul pour surveiller la
// limite de 2 Mo dans les logs Vercel.
export function serializedKb(value: unknown): number {
  return Math.round(JSON.stringify(value).length / 1024);
}
