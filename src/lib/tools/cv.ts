// Générateur de CV (outil gratuit, sans compte) : les données restent dans le
// navigateur, le PDF sort de l'impression du navigateur (« Enregistrer au
// format PDF »). Partagé entre le formulaire (client) et les exemples
// rendus côté serveur.

export type CvContract = "alternance" | "stage";

export type CvEntry = { dates: string; title: string; place: string; details: string };

export type CvInput = {
  contract: CvContract;
  firstName: string;
  lastName: string;
  // "Alternance en BTS MCO – vendeuse conseil – rentrée septembre 2027"
  headline: string;
  city: string;
  phone: string;
  email: string;
  link: string;
  summary: string;
  // Alternance : rythme et date ; stage : dates et durée.
  availability: string;
  education: CvEntry[];
  experience: CvEntry[];
  skills: string;
  languages: string;
  interests: string;
};

export const MAX_CV_ENTRIES = 4;

export const EMPTY_ENTRY: CvEntry = { dates: "", title: "", place: "", details: "" };

export const EMPTY_CV_INPUT: CvInput = {
  contract: "alternance",
  firstName: "",
  lastName: "",
  headline: "",
  city: "",
  phone: "",
  email: "",
  link: "",
  summary: "",
  availability: "",
  education: [{ ...EMPTY_ENTRY }],
  experience: [{ ...EMPTY_ENTRY }],
  skills: "",
  languages: "",
  interests: "",
};

// Une ligne par point (les tirets ou puces tapés en début de ligne sont
// retirés), une virgule ou un point-virgule entre deux compétences.
export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*–]\s*/, "").trim())
    .filter(Boolean);
}

export function splitList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isEmptyEntry(entry: CvEntry): boolean {
  return !entry.dates.trim() && !entry.title.trim() && !entry.place.trim() && !entry.details.trim();
}
