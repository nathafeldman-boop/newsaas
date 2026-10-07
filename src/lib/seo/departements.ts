import { normalizeCityKey, slugify } from "@/lib/offers/segments";

// Pages /alternance/departement/[dep] et /stage/departement/[dep] : beaucoup
// d'offres sont dans des communes qui n'atteignent jamais seules le seuil
// d'une page ville, mais qui comptent une fois regroupées par département
// ("alternance hauts-de-seine", "stage 92").

export type Departement = {
  code: string;
  name: string;
  // Préposition + nom : "dans les Hauts-de-Seine", "en Gironde", "à Paris".
  phrase: string;
  region: string;
};

const IDF = "Île-de-France";
const ARA = "Auvergne-Rhône-Alpes";
const HDF = "Hauts-de-France";
const PACA = "Provence-Alpes-Côte d'Azur";
const OCC = "Occitanie";
const NAQ = "Nouvelle-Aquitaine";
const GE = "Grand Est";
const BFC = "Bourgogne-Franche-Comté";
const CVL = "Centre-Val de Loire";
const PDL = "Pays de la Loire";
const BRE = "Bretagne";
const NOR = "Normandie";
const COR = "Corse";

const RAW: [string, string, string, string][] = [
  ["01", "Ain", "dans l'Ain", ARA],
  ["02", "Aisne", "dans l'Aisne", HDF],
  ["03", "Allier", "dans l'Allier", ARA],
  ["04", "Alpes-de-Haute-Provence", "dans les Alpes-de-Haute-Provence", PACA],
  ["05", "Hautes-Alpes", "dans les Hautes-Alpes", PACA],
  ["06", "Alpes-Maritimes", "dans les Alpes-Maritimes", PACA],
  ["07", "Ardèche", "en Ardèche", ARA],
  ["08", "Ardennes", "dans les Ardennes", GE],
  ["09", "Ariège", "en Ariège", OCC],
  ["10", "Aube", "dans l'Aube", GE],
  ["11", "Aude", "dans l'Aude", OCC],
  ["12", "Aveyron", "dans l'Aveyron", OCC],
  ["13", "Bouches-du-Rhône", "dans les Bouches-du-Rhône", PACA],
  ["14", "Calvados", "dans le Calvados", NOR],
  ["15", "Cantal", "dans le Cantal", ARA],
  ["16", "Charente", "en Charente", NAQ],
  ["17", "Charente-Maritime", "en Charente-Maritime", NAQ],
  ["18", "Cher", "dans le Cher", CVL],
  ["19", "Corrèze", "en Corrèze", NAQ],
  ["2A", "Corse-du-Sud", "en Corse-du-Sud", COR],
  ["2B", "Haute-Corse", "en Haute-Corse", COR],
  ["21", "Côte-d'Or", "en Côte-d'Or", BFC],
  ["22", "Côtes-d'Armor", "dans les Côtes-d'Armor", BRE],
  ["23", "Creuse", "dans la Creuse", NAQ],
  ["24", "Dordogne", "en Dordogne", NAQ],
  ["25", "Doubs", "dans le Doubs", BFC],
  ["26", "Drôme", "dans la Drôme", ARA],
  ["27", "Eure", "dans l'Eure", NOR],
  ["28", "Eure-et-Loir", "en Eure-et-Loir", CVL],
  ["29", "Finistère", "dans le Finistère", BRE],
  ["30", "Gard", "dans le Gard", OCC],
  ["31", "Haute-Garonne", "en Haute-Garonne", OCC],
  ["32", "Gers", "dans le Gers", OCC],
  ["33", "Gironde", "en Gironde", NAQ],
  ["34", "Hérault", "dans l'Hérault", OCC],
  ["35", "Ille-et-Vilaine", "en Ille-et-Vilaine", BRE],
  ["36", "Indre", "dans l'Indre", CVL],
  ["37", "Indre-et-Loire", "en Indre-et-Loire", CVL],
  ["38", "Isère", "en Isère", ARA],
  ["39", "Jura", "dans le Jura", BFC],
  ["40", "Landes", "dans les Landes", NAQ],
  ["41", "Loir-et-Cher", "dans le Loir-et-Cher", CVL],
  ["42", "Loire", "dans la Loire", ARA],
  ["43", "Haute-Loire", "en Haute-Loire", ARA],
  ["44", "Loire-Atlantique", "en Loire-Atlantique", PDL],
  ["45", "Loiret", "dans le Loiret", CVL],
  ["46", "Lot", "dans le Lot", OCC],
  ["47", "Lot-et-Garonne", "dans le Lot-et-Garonne", NAQ],
  ["48", "Lozère", "en Lozère", OCC],
  ["49", "Maine-et-Loire", "en Maine-et-Loire", PDL],
  ["50", "Manche", "dans la Manche", NOR],
  ["51", "Marne", "dans la Marne", GE],
  ["52", "Haute-Marne", "en Haute-Marne", GE],
  ["53", "Mayenne", "en Mayenne", PDL],
  ["54", "Meurthe-et-Moselle", "en Meurthe-et-Moselle", GE],
  ["55", "Meuse", "dans la Meuse", GE],
  ["56", "Morbihan", "dans le Morbihan", BRE],
  ["57", "Moselle", "en Moselle", GE],
  ["58", "Nièvre", "dans la Nièvre", BFC],
  ["59", "Nord", "dans le Nord", HDF],
  ["60", "Oise", "dans l'Oise", HDF],
  ["61", "Orne", "dans l'Orne", NOR],
  ["62", "Pas-de-Calais", "dans le Pas-de-Calais", HDF],
  ["63", "Puy-de-Dôme", "dans le Puy-de-Dôme", ARA],
  ["64", "Pyrénées-Atlantiques", "dans les Pyrénées-Atlantiques", NAQ],
  ["65", "Hautes-Pyrénées", "dans les Hautes-Pyrénées", OCC],
  ["66", "Pyrénées-Orientales", "dans les Pyrénées-Orientales", OCC],
  ["67", "Bas-Rhin", "dans le Bas-Rhin", GE],
  ["68", "Haut-Rhin", "dans le Haut-Rhin", GE],
  ["69", "Rhône", "dans le Rhône", ARA],
  ["70", "Haute-Saône", "en Haute-Saône", BFC],
  ["71", "Saône-et-Loire", "en Saône-et-Loire", BFC],
  ["72", "Sarthe", "dans la Sarthe", PDL],
  ["73", "Savoie", "en Savoie", ARA],
  ["74", "Haute-Savoie", "en Haute-Savoie", ARA],
  ["75", "Paris", "à Paris", IDF],
  ["76", "Seine-Maritime", "en Seine-Maritime", NOR],
  ["77", "Seine-et-Marne", "en Seine-et-Marne", IDF],
  ["78", "Yvelines", "dans les Yvelines", IDF],
  ["79", "Deux-Sèvres", "dans les Deux-Sèvres", NAQ],
  ["80", "Somme", "dans la Somme", HDF],
  ["81", "Tarn", "dans le Tarn", OCC],
  ["82", "Tarn-et-Garonne", "dans le Tarn-et-Garonne", OCC],
  ["83", "Var", "dans le Var", PACA],
  ["84", "Vaucluse", "dans le Vaucluse", PACA],
  ["85", "Vendée", "en Vendée", PDL],
  ["86", "Vienne", "dans la Vienne", NAQ],
  ["87", "Haute-Vienne", "en Haute-Vienne", NAQ],
  ["88", "Vosges", "dans les Vosges", GE],
  ["89", "Yonne", "dans l'Yonne", BFC],
  ["90", "Territoire de Belfort", "dans le Territoire de Belfort", BFC],
  ["91", "Essonne", "en Essonne", IDF],
  ["92", "Hauts-de-Seine", "dans les Hauts-de-Seine", IDF],
  ["93", "Seine-Saint-Denis", "en Seine-Saint-Denis", IDF],
  ["94", "Val-de-Marne", "dans le Val-de-Marne", IDF],
  ["95", "Val-d'Oise", "dans le Val-d'Oise", IDF],
  ["971", "Guadeloupe", "en Guadeloupe", "Guadeloupe"],
  ["972", "Martinique", "en Martinique", "Martinique"],
  ["973", "Guyane", "en Guyane", "Guyane"],
  ["974", "La Réunion", "à La Réunion", "La Réunion"],
  ["976", "Mayotte", "à Mayotte", "Mayotte"],
];

export const DEPARTEMENTS: (Departement & { slug: string })[] = RAW.map(([code, name, phrase, region]) => ({
  code,
  name,
  phrase,
  region,
  slug: slugify(name),
}));

const BY_CODE = new Map(DEPARTEMENTS.map((d) => [d.code, d]));
const BY_SLUG = new Map(DEPARTEMENTS.map((d) => [d.slug, d]));
// Libellés Adzuna qui ne correspondent pas exactement au nom officiel.
const ALIASES: Record<string, string> = { reunion: "974", "ile-de-la-reunion": "974", "territoire-de-belfort": "90", belfort: "90" };

export function getDepartement(code: string): (Departement & { slug: string }) | undefined {
  return BY_CODE.get(code);
}

export function getDepartementBySlug(slug: string): (Departement & { slug: string }) | undefined {
  return BY_SLUG.get(slug);
}

function codeForName(text: string): string | null {
  const slug = slugify(text);
  return BY_SLUG.get(slug)?.code ?? ALIASES[slug] ?? null;
}

// Département des grandes villes du catalogue, pour les offres Adzuna qui ne
// donnent que la ville ("Villeurbanne, Lyon", "La Défense, Courbevoie").
const CITY_DEPARTEMENT: Record<string, string> = {
  paris: "75", "la-defense": "92", courbevoie: "92", puteaux: "92", nanterre: "92", "boulogne-billancourt": "92",
  "issy-les-moulineaux": "92", "levallois-perret": "92", "neuilly-sur-seine": "92", clichy: "92", colombes: "92",
  "rueil-malmaison": "92", "le-plessis-robinson": "92", chaville: "92", "saint-ouen": "93", "saint-denis": "93",
  montreuil: "93", "noisy-le-grand": "93", bobigny: "93", pantin: "93", vincennes: "94", "ivry-sur-seine": "94",
  "vitry-sur-seine": "94", creteil: "94", "fontenay-sous-bois": "94", versailles: "78", "velizy-villacoublay": "78",
  guyancourt: "78", "le-chesnay-rocquencourt": "78", "saint-cyr-l-ecole": "78", massy: "91", evry: "91",
  cergy: "95", argenteuil: "95", roissy: "95", lyon: "69", villeurbanne: "69", venissieux: "69", "saint-priest": "69",
  "decines-charpieu": "69", "marcy-l-etoile": "69", marseille: "13", "aix-en-provence": "13", aubagne: "13",
  allauch: "13", "la-ciotat": "13", toulon: "83", avignon: "84", nice: "06", cannes: "06", antibes: "06",
  "sophia-antipolis": "06", montpellier: "34", beziers: "34", sete: "34", nimes: "30", perpignan: "66",
  narbonne: "11", toulouse: "31", blagnac: "31", balma: "31", "l-union": "31", montauban: "82", pau: "64",
  bayonne: "64", bordeaux: "33", merignac: "33", talence: "33", pessac: "33", "la-rochelle": "17", poitiers: "86",
  niort: "79", limoges: "87", angouleme: "16", nantes: "44", "saint-nazaire": "44", "saint-herblain": "44",
  orvault: "44", reze: "44", "pont-rousseau": "44", angers: "49", cholet: "49", "le-mans": "72",
  "la-roche-sur-yon": "85", laval: "53", rennes: "35", "saint-malo": "35", betton: "35", "cesson-sevigne": "35",
  "le-rheu": "35", brest: "29", quimper: "29", lorient: "56", vannes: "56", "saint-brieuc": "22", caen: "14",
  rouen: "76", "le-havre": "76", lille: "59", roubaix: "59", tourcoing: "59", "villeneuve-d-ascq": "59",
  "la-madeleine": "59", valenciennes: "59", dunkerque: "59", douai: "59", calais: "62", arras: "62", lens: "62",
  amiens: "80", beauvais: "60", compiegne: "60", reims: "51", troyes: "10", metz: "57", nancy: "54",
  strasbourg: "67", "schweighouse-sur-moder": "67", colmar: "68", mulhouse: "68", besancon: "25", dijon: "21",
  "chalon-sur-saone": "71", "le-creusot": "71", macon: "71", auxerre: "89", orleans: "45", tours: "37",
  blois: "41", bourges: "18", chartres: "28", "clermont-ferrand": "63", chamalieres: "63", royat: "63",
  aubiere: "63", "saint-etienne": "42", roanne: "42", grenoble: "38", fontaine: "38", eybens: "38", biviers: "38",
  rives: "38", chambery: "73", annecy: "74", annemasse: "74", valence: "26", ajaccio: "2A", bastia: "2B",
};

// Code département d'un libellé de lieu brut, ou null si on ne sait pas
// (région seule, commune inconnue). Dans l'ordre :
// 1. France Travail : "92 - BOULOGNE BILLANCOURT" -> 92 ;
// 2. Adzuna "Ville, Département" ou "Département, Région" : on lit les
//    morceaux en partant de la fin ("Vienne, Isère" -> Isère, pas Vienne) ;
// 3. la commune, d'après ce que France Travail nous a appris (`learned`)
//    ou la table des grandes villes.
export function departementFromLocation(location: string, learned?: Map<string, string | null>): string | null {
  const prefix = location.match(/^\s*(\d{2,3}|2[ab])\s*-/i);
  if (prefix) {
    const code = prefix[1].toUpperCase();
    return BY_CODE.has(code) ? code : null;
  }
  const parts = location
    .split(/[,–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of [...parts].reverse()) {
    const code = codeForName(part);
    if (code) return code;
  }
  const city = slugify(normalizeCityKey(location));
  if (!city) return null;
  return learned?.get(city) ?? CITY_DEPARTEMENT[city] ?? null;
}

// Apprend "commune -> département" à partir des libellés France Travail
// ("44 - REZE"), pour classer les offres Adzuna de la même commune. Une
// commune vue dans deux départements (Saint-Denis 93 / 974) devient
// ambiguë : null, et on se rabat sur la table des grandes villes.
export function learnCityDepartements(locations: Iterable<string>): Map<string, string | null> {
  const learned = new Map<string, string | null>();
  for (const location of locations) {
    const prefix = location.match(/^\s*(\d{2,3}|2[ab])\s*-/i);
    if (!prefix) continue;
    const code = prefix[1].toUpperCase();
    if (!BY_CODE.has(code)) continue;
    const city = slugify(normalizeCityKey(location));
    if (!city) continue;
    const known = learned.get(city);
    if (known === undefined) learned.set(city, code);
    else if (known !== code) learned.set(city, null);
  }
  return learned;
}

// Régions (métropole). Les régions d'outre-mer n'ont qu'un département :
// leur page dupliquerait celle du département, on ne les crée pas.
export type Region = { name: string; slug: string; phrase: string };

const REGION_PHRASES: Record<string, string> = {
  [IDF]: "en Île-de-France",
  [ARA]: "en Auvergne-Rhône-Alpes",
  [HDF]: "dans les Hauts-de-France",
  [PACA]: "en Provence-Alpes-Côte d'Azur",
  [OCC]: "en Occitanie",
  [NAQ]: "en Nouvelle-Aquitaine",
  [GE]: "dans le Grand Est",
  [BFC]: "en Bourgogne-Franche-Comté",
  [CVL]: "en Centre-Val de Loire",
  [PDL]: "dans les Pays de la Loire",
  [BRE]: "en Bretagne",
  [NOR]: "en Normandie",
  [COR]: "en Corse",
};

export const REGIONS: Region[] = Object.entries(REGION_PHRASES).map(([name, phrase]) => ({ name, slug: slugify(name), phrase }));
const REGION_BY_NAME = new Map(REGIONS.map((r) => [r.name, r]));
const REGION_BY_SLUG = new Map(REGIONS.map((r) => [r.slug, r]));

export function getRegionBySlug(slug: string): Region | undefined {
  return REGION_BY_SLUG.get(slug);
}

// Région (métropole) d'un code département, ou undefined (outre-mer).
export function regionOfDepartement(code: string): Region | undefined {
  const departement = BY_CODE.get(code);
  return departement ? REGION_BY_NAME.get(departement.region) : undefined;
}

