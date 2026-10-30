// Modèles de CV (30/10) : 6 mises en page × 8 couleurs (le contenu de
// départ par métier est dans cvTemplates.ts). Toutes les mises en page restent
// lisibles par les logiciels de tri des recruteurs (ATS) : une seule
// colonne de lecture, du vrai texte (pas d'image ni d'icône à la place d'un
// mot), des titres de rubrique standard, les coordonnées dans le corps du
// CV. La couleur et les filets ne sont que de la décoration.

export type CvLayout = "classique" | "moderne" | "epure" | "elegant" | "impact" | "bandeau";

export const CV_LAYOUTS: { id: CvLayout; label: string }[] = [
  { id: "classique", label: "Classique" },
  { id: "moderne", label: "Moderne" },
  { id: "epure", label: "Épuré" },
  { id: "elegant", label: "Élégant" },
  { id: "impact", label: "Impact" },
  { id: "bandeau", label: "Bandeau" },
];

// Couleurs lisibles sur blanc et sous du texte blanc (contraste ≥ 4,5).
export const CV_COLORS: { id: string; label: string; hex: string }[] = [
  { id: "vert", label: "Vert", hex: "#0f7a54" },
  { id: "marine", label: "Bleu marine", hex: "#1e3a8a" },
  { id: "bleu", label: "Bleu", hex: "#0369a1" },
  { id: "canard", label: "Bleu canard", hex: "#0f766e" },
  { id: "bordeaux", label: "Bordeaux", hex: "#9f1239" },
  { id: "violet", label: "Violet", hex: "#6d28d9" },
  { id: "terracotta", label: "Terracotta", hex: "#b4400c" },
  { id: "anthracite", label: "Anthracite", hex: "#334155" },
];

export type CvDesign = { layout: CvLayout; color: string };

export const DEFAULT_CV_DESIGN: CvDesign = { layout: "classique", color: CV_COLORS[0].hex };

export const CV_DESIGN_COUNT = CV_LAYOUTS.length * CV_COLORS.length;
