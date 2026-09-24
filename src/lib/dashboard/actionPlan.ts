// Construit les lignes du "Plan d'action" affiché en haut du dashboard
// (RETENTION_AUDIT.md, section "plan d'action Premium") -- purement basé sur
// des comptages réels calculés par la page (jamais de statistique inventée,
// voir la contrainte explicite de l'audit). Une ligne n'apparaît que si son
// compteur est > 0 : jamais de ligne vide ou générique ("Continue comme
// ça !") qui n'apporterait aucune information.
export type ActionPlanItem = { icon: string; text: string };

export function buildActionPlan(params: {
  newMatchingOffersCount: number;
  offersToApplyCount: number;
  staleApplicationsCount: number;
}): ActionPlanItem[] {
  const items: ActionPlanItem[] = [];

  if (params.newMatchingOffersCount > 0) {
    const n = params.newMatchingOffersCount;
    items.push({
      icon: "✨",
      text: `${n} nouvelle${n > 1 ? "s" : ""} offre${n > 1 ? "s" : ""} correspondant à ton profil aujourd'hui.`,
    });
  }

  if (params.offersToApplyCount > 0) {
    const n = params.offersToApplyCount;
    items.push({
      icon: "📝",
      text: `${n} offre${n > 1 ? "s" : ""} sauvegardée${n > 1 ? "s" : ""} sans candidature envoyée pour l'instant.`,
    });
  }

  if (params.staleApplicationsCount > 0) {
    const n = params.staleApplicationsCount;
    items.push({
      icon: "⏰",
      text: `${n} candidature${n > 1 ? "s" : ""} sans nouvelle depuis plus d'une semaine -- relance ou mets le statut à jour.`,
    });
  }

  return items;
}
