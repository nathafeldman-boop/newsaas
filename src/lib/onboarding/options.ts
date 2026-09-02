// Options proposées sous forme de tuiles/chips dans l'onboarding — objectif :
// aucune saisie obligatoire. Chaque liste garde un échappatoire "+ Autre"
// pour les cas non couverts, géré par ChipMultiSelectWithCustom.

export const SECTORS = [
  "Informatique",
  "Marketing",
  "Vente",
  "Design",
  "Data",
  "Produit",
  "RH",
  "Finance",
  "BTP",
  "Communication",
  "Santé",
  "Autre",
];

export const SKILLS = [
  "JavaScript",
  "Python",
  "SQL",
  "React",
  "Excel avancé",
  "PowerPoint",
  "Photoshop",
  "Figma",
  "Canva",
  "SEO",
  "Google Ads",
  "Réseaux sociaux",
  "Rédaction",
  "Prospection",
  "Négociation",
  "Relation client",
  "CRM (Salesforce/HubSpot)",
  "Comptabilité",
  "Gestion budgétaire",
  "Gestion de projet",
  "Analyse de données",
  "Anglais courant",
  "Communication",
  "Organisation",
  "Travail d'équipe",
  "Créativité",
  "Autonomie",
  "Leadership",
];

export const TARGET_JOBS = [
  "Développeur web",
  "Data analyst",
  "Chef de projet",
  "Chargé de marketing digital",
  "Community manager",
  "UX/UI designer",
  "Commercial",
  "Assistant RH",
  "Chargé de communication",
  "Assistant comptable",
  "Growth hacker",
  "Technicien support",
  "Vendeur",
  "Assistant administratif",
  "Ingénieur DevOps",
];

export const TOP_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Bordeaux",
  "Lille",
  "Nantes",
  "Strasbourg",
  "Nice",
  "Rennes",
  "Montpellier",
  "Grenoble",
];

export const MOBILITY_OPTIONS = [
  { value: "Sur place uniquement", icon: "📍" },
  { value: "Mobile dans la région", icon: "🚗" },
  { value: "Mobile en France", icon: "🇫🇷" },
  { value: "Full remote", icon: "🏠" },
];

export const EDUCATION_LEVELS = ["Bac", "Bac+2", "Bac+3", "Bac+4", "Bac+5", "Bac+6 et plus"];

export const EXPERIENCE_LEVELS = [
  { value: "Aucune expérience", icon: "🌱" },
  { value: "Stage(s) réalisé(s)", icon: "🎓" },
  { value: "1-2 ans", icon: "💼" },
  { value: "3-5 ans", icon: "📈" },
  { value: "5 ans et plus", icon: "🏆" },
];

export type AvailabilityOption = { label: string; icon: string; daysFromNow: number | null };

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  { label: "Dès que possible", icon: "⚡", daysFromNow: 0 },
  { label: "Dans 1 mois", icon: "📅", daysFromNow: 30 },
  { label: "Dans 3 mois", icon: "🗓️", daysFromNow: 90 },
  { label: "Je ne sais pas encore", icon: "🤔", daysFromNow: null },
];
