// Libellé de fraîcheur affiché sur la carte (section 5 de l'audit) --
// calculé à la volée depuis published_at, jamais stocké : pas besoin d'un
// état NEW/FRESH/AGING persistant en base, published_at suffit et ne peut
// jamais se dé-synchroniser. Volontairement silencieux au-delà de 7 jours :
// une offre de 3 semaines qui matche bien reste montrée (le tri par score +
// le filtre quality_score s'en chargent), elle n'a juste pas besoin d'un
// badge "fraîcheur" qui deviendrait trompeur ou inutile passé ce délai.
export function getFreshnessLabel(publishedAt: string): string | null {
  const days = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  if (days <= 1) return "Nouvelle offre";
  if (days <= 7) return `Publiée il y a ${days} jours`;
  return null;
}
