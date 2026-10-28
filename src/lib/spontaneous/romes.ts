import { targetMetiersOf } from "@/lib/matching/score";
import type { Profile } from "@/types/database";

// Codes ROME (référentiel des métiers de France Travail) de chaque métier de
// la taxonomie (lib/seo/metiers.ts), pour demander à La bonne alternance les
// entreprises qui recrutent des alternants dans ce domaine (28/10,
// candidatures spontanées). Les spécialités prennent ceux de leur famille.
// 3 codes au plus par métier : les plus proches de ce qu'un alternant y fait.
export const METIER_ROMES: Record<string, string[]> = {
  cybersecurite: ["M1802", "M1801", "M1810"],
  securite: ["K2503"],
  data: ["M1805", "M1403", "M1806"],
  developpeur: ["M1805", "M1806"],
  design: ["E1205", "E1104"],
  "ux-ui-designer": ["E1205", "M1805"],
  "community-manager": ["E1101", "E1103"],
  "e-commerce": ["M1705", "E1101", "D1402"],
  marketing: ["M1705", "M1707", "E1401"],
  communication: ["E1103", "E1101", "E1107"],
  evenementiel: ["E1107", "E1103"],
  audiovisuel: ["L1505", "L1508", "E1205"],
  culture: ["K1602", "K1601", "L1302"],
  rh: ["M1501", "M1502", "M1503"],
  "gestionnaire-de-paie": ["M1501", "M1203"],
  "charge-de-recrutement": ["M1502", "M1501"],
  "controle-de-gestion": ["M1204", "M1203"],
  comptabilite: ["M1203", "M1202", "M1206"],
  audit: ["M1202", "M1204"],
  assurance: ["C1102", "C1110", "C1107"],
  banque: ["C1206", "C1201", "C1203"],
  "relation-client": ["D1408", "M1601", "C1203"],
  finance: ["M1201", "C1206", "M1204"],
  immobilier: ["C1504", "C1502", "C1501"],
  juridique: ["K1903", "K1902"],
  "affaires-publiques": ["K1404", "K1401"],
  achats: ["M1101"],
  "commerce-international": ["D1402", "N1202", "M1101"],
  transport: ["N1201", "N4105", "N4101"],
  logistique: ["N1103", "N1301", "N1303"],
  "supply-chain": ["N1301", "N1103"],
  qualite: ["H1502", "H1506"],
  environnement: ["H1302", "K2306", "A1204"],
  "chef-de-projet": ["M1806", "M1705"],
  informatique: ["I1401", "M1801", "M1810"],
  architecture: ["F1101", "F1104"],
  plombier: ["F1603"],
  menuiserie: ["H2206", "F1607"],
  "artisan-batiment": ["F1703", "F1606", "F1602"],
  paysagiste: ["A1203"],
  agriculture: ["A1414", "A1416", "A1405"],
  btp: ["F1202", "F1106", "F1104"],
  "conducteur-de-travaux": ["F1202", "F1201"],
  electricien: ["F1602", "I1309"],
  "mecanique-auto": ["I1604", "I1606"],
  maintenance: ["I1304", "I1309", "I1310"],
  production: ["H2502", "H2102", "H1404"],
  ingenieur: ["H1206", "H2502", "H1502"],
  laboratoire: ["H1210", "J1302"],
  boucherie: ["D1101"],
  "boulangerie-patisserie": ["D1102", "D1104"],
  tourisme: ["G1303", "G1201", "G1101"],
  "hotellerie-restauration": ["G1803", "G1602", "G1703"],
  cuisinier: ["G1602", "G1601"],
  "coiffure-esthetique": ["D1202", "D1208"],
  coiffure: ["D1202"],
  esthetique: ["D1208"],
  "mode-textile": ["B1805", "D1214"],
  fleuriste: ["D1209"],
  animalier: ["A1501", "A1503"],
  "auxiliaire-veterinaire": ["A1501"],
  proprete: ["K2204"],
  "aide-soignant": ["J1501"],
  "petite-enfance": ["K1303", "J1304"],
  "educateur-specialise": ["K1207"],
  sante: ["J1307", "J1501", "J1506"],
  "preparateur-pharmacie": ["J1307"],
  "assistant-dentaire": ["J1303"],
  "secretaire-medical": ["M1609"],
  social: ["K1201", "K1207", "K1302"],
  vente: ["D1214", "D1106", "D1403"],
  commercial: ["D1402", "D1403", "D1407"],
  "business-developer": ["D1402", "D1407"],
  "assistant-administratif": ["M1602", "M1607", "M1604"],
  "assistant-de-direction": ["M1604", "M1607"],
};

/** Codes ROME du métier visé (6 au plus, dans l'ordre des métiers saisis) ; vide si aucun métier reconnu. */
export function romesForProfile(profile: Pick<Profile, "target_jobs">): string[] {
  const codes: string[] = [];
  // Spécialités d'abord (« gestionnaire de paie » avant « RH ») : plus précises.
  const metiers = [...targetMetiersOf(profile.target_jobs ?? [])].sort((a, b) => Number(!!b.family) - Number(!!a.family));
  for (const metier of metiers) {
    for (const code of METIER_ROMES[metier.slug] ?? (metier.family ? METIER_ROMES[metier.family] : undefined) ?? []) {
      if (!codes.includes(code)) codes.push(code);
    }
  }
  return codes.slice(0, 6);
}
