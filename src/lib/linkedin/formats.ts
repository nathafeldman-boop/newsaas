// Formats de publication LinkedIn (01/11, Nathan). Une seule source de vérité
// pour l'écran /admin/linkedin, la sélection des offres et les textes.
//
// Fenêtres choisies sur les volumes réels du 01/11 (alternances France
// Travail publiables, hors annonces d'écoles et entreprises non nommées) :
// ~60 nouvelles par jour toutes filières, mais seulement ~9 à 40 par SEMAINE
// dans les secteurs « bureau » (marketing, finance, informatique...). Un post
// secteur ou ville quotidien republierait donc les mêmes offres : ces formats
// regardent 14 jours en arrière et sont pensés pour un rythme hebdomadaire.

export type LinkedinFormat = "jour" | "secteur" | "ville" | "hebdo";

export const FORMAT_LABELS: Record<LinkedinFormat, string> = {
  jour: "Les alternances du jour",
  secteur: "Par secteur",
  ville: "Par ville",
  hebdo: "Récap du vendredi",
};

export const FORMAT_HELP: Record<LinkedinFormat, string> = {
  jour: "Les 5 dernières alternances ajoutées (48 h). Rythme : tous les jours.",
  secteur: "5 alternances d'un secteur, ajoutées ces 14 derniers jours. Rythme : 1 secteur différent par semaine.",
  ville: "5 alternances d'une ville, ajoutées ces 14 derniers jours. Rythme : 1 ville différente par semaine.",
  hebdo: "Les 10 offres les plus complètes de la semaine, 1 par entreprise. Rythme : chaque vendredi.",
};

export type FormatRules = {
  /** Nombre d'offres présélectionnées dans le post. */
  count: number;
  /** Ancienneté maximale (date d'ajout sur Stageio). */
  windowDays: number;
  /** Tri des candidates. */
  order: "recent" | "best";
};

export const FORMAT_RULES: Record<LinkedinFormat, FormatRules> = {
  jour: { count: 5, windowDays: 2, order: "recent" },
  secteur: { count: 5, windowDays: 14, order: "recent" },
  ville: { count: 5, windowDays: 14, order: "recent" },
  hebdo: { count: 10, windowDays: 7, order: "best" },
};

export type SectorGroup = {
  key: string;
  label: string;
  /** Valeurs de offers.sector (voir lib/offers/sectors.ts) regroupées. */
  sectors: string[];
  /** Page métier SEO existante (/alternance/[metier]) vers laquelle renvoyer. */
  hubPath: string;
  hashtag: string;
};

export const SECTOR_GROUPS: SectorGroup[] = [
  {
    key: "marketing",
    label: "Marketing et communication",
    sectors: ["Marketing", "Communication", "Publicité", "E-commerce", "Événementiel"],
    hubPath: "/alternance/marketing",
    hashtag: "#marketing",
  },
  {
    key: "commerce",
    label: "Commerce et business development",
    sectors: ["Vente", "Commerce", "Import-export", "Distribution"],
    hubPath: "/alternance/commercial",
    hashtag: "#commercial",
  },
  {
    key: "rh",
    label: "Ressources humaines",
    sectors: ["RH"],
    hubPath: "/alternance/rh",
    hashtag: "#rh",
  },
  {
    key: "informatique",
    label: "Informatique et développement",
    sectors: ["Informatique", "Data", "Cybersécurité", "Intelligence artificielle", "Réseaux et télécoms"],
    hubPath: "/alternance/informatique",
    hashtag: "#informatique",
  },
  {
    key: "finance",
    label: "Finance et gestion",
    sectors: ["Finance", "Comptabilité", "Banque", "Assurance"],
    hubPath: "/alternance/finance",
    hashtag: "#finance",
  },
  {
    key: "administration",
    label: "Administration",
    sectors: ["Administratif et secrétariat"],
    hubPath: "/alternance/assistant-administratif",
    hashtag: "#administratif",
  },
];

export type CityTarget = {
  /** slugify(normalizeCityKey(location)) des offres de cette ville. */
  key: string;
  label: string;
  /** Page ville SEO existante (/alternance/[ville]). */
  hubPath: string;
};

const city = (key: string, label: string): CityTarget => ({ key, label, hubPath: `/alternance/${key}` });

export const CITY_TARGETS: CityTarget[] = [
  city("paris", "Paris"),
  city("lyon", "Lyon"),
  city("marseille", "Marseille"),
  city("lille", "Lille"),
  city("bordeaux", "Bordeaux"),
  city("toulouse", "Toulouse"),
  city("nantes", "Nantes"),
  city("montpellier", "Montpellier"),
  city("rennes", "Rennes"),
  city("strasbourg", "Strasbourg"),
  city("nice", "Nice"),
];

export function sectorGroup(key: string | null | undefined): SectorGroup | null {
  return SECTOR_GROUPS.find((g) => g.key === key) ?? null;
}

export function cityTarget(key: string | null | undefined): CityTarget | null {
  return CITY_TARGETS.find((c) => c.key === key) ?? null;
}

export function isLinkedinFormat(value: unknown): value is LinkedinFormat {
  return value === "jour" || value === "secteur" || value === "ville" || value === "hebdo";
}

/** Libellé du segment (secteur ou ville) pour l'historique et les textes. */
export function segmentLabel(format: LinkedinFormat, segment: string | null): string | null {
  if (format === "secteur") return sectorGroup(segment)?.label ?? null;
  if (format === "ville") return cityTarget(segment)?.label ?? null;
  return null;
}
