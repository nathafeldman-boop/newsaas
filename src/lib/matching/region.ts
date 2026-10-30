import { DEPARTEMENTS, departementFromLocation, regionOfDepartement } from "@/lib/seo/departements";

// Peu d'offres dans le département (30/10, commentaires de résiliation :
// « il n'y a pas assez d'offres dans les Vosges », « pas d'offre pour
// moi ») : le deck d'un abonné ajoute les offres des autres départements de
// sa région, classées avant celles de l'autre bout de la France (−30 de
// distance ramené à −12). Fonctions pures.

/** En dessous de ce nombre d'offres dans sa ville et son département, on élargit à la région. */
export const SPARSE_LOCAL_POOL = 40;
export const REGION_BONUS = 18;

/** Libellés « 54 - » des autres départements de la région (métropole seulement). */
export function regionDepartementLabels(dep: string | null): string[] {
  if (!dep) return [];
  const region = regionOfDepartement(dep);
  if (!region) return [];
  return DEPARTEMENTS.filter((d) => d.code !== dep && regionOfDepartement(d.code)?.name === region.name).map((d) => `${d.code} -`);
}

/** Nom de la région (métropole) du département, ou null. */
export function regionName(dep: string | null): string | null {
  return dep ? (regionOfDepartement(dep)?.name ?? null) : null;
}

/** Nom de la région si l'offre est dans un autre département de la même région, sinon null. */
export function sameRegionElsewhere(dep: string | null, offerLocation: string): string | null {
  if (!dep) return null;
  const region = regionOfDepartement(dep);
  const offerDep = departementFromLocation(offerLocation);
  if (!region || !offerDep || offerDep === dep) return null;
  return regionOfDepartement(offerDep)?.name === region.name ? region.name : null;
}
