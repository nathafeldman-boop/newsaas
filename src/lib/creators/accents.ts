// Couleurs du dashboard créateurs (18/11), un clic dans l'en-tête. Les
// variables CSS sont dans globals.css (.admin-dark[data-accent=…]).
export const CREATOR_ACCENTS = [
  { id: "violet", label: "Violet", color: "#7a73ff" },
  { id: "vert", label: "Vert", color: "#4ade80" },
  { id: "rose", label: "Rose", color: "#f472b6" },
  { id: "bleu", label: "Bleu", color: "#38bdf8" },
  { id: "orange", label: "Orange", color: "#fb923c" },
] as const;
export type CreatorAccent = (typeof CREATOR_ACCENTS)[number]["id"];
