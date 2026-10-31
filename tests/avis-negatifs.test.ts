// Avis négatifs (31/10) : annonces d'écoles hors du deck des abonnés, ville du profil mieux lue,
// pas d'outre-mer pour la métropole, le bon métier avant les autres.
// Lancer : npx tsx --tsconfig tsconfig.json tests/avis-negatifs.test.ts
import assert from "node:assert/strict";
import { isSchoolAd, isSchoolOrJobBoard, SCHOOL_AD_COLUMN_SQL } from "../src/lib/seo/schools";
import { overseasMismatch, parseProfileLocation } from "../src/lib/matching/profileLocation";
import { fitsSubscriber, subscriberOrder } from "../src/lib/matching/deck";
import { geoMatch } from "../src/lib/matching/score";
import { isOverseasDepartement } from "../src/lib/seo/departements";

// 1. Annonces d'écoles.
const school = (company: string, description = "", requirements: string | null = null) => isSchoolAd({ company, description, requirements });
// Les plus gros annonceurs que l'ancien filtre laissait passer.
for (const name of ["Walter Learning", "YouSchool", "TKL FORMA", "DGBOOST", "ALL TECHNICS COMMUNICATION", "Icademie", "SKILLIE", "Iriig"]) {
  assert.equal(school(name, "Poste de vendeur"), true, name);
}
assert.equal(isSchoolOrJobBoard("Walter Learning"), false, "le deck gratuit garde l'ancien filtre");
// L'annonce parle comme une école.
assert.equal(school("ACTUAL TALENT", "Une formation en alternance qui recrute !"), true);
assert.equal(school("AEROKONSULT", "Recrute des candidats souhaitant intégrer notre formation en alternance"), true);
assert.equal(school("Boutique X", "Nous recrutons pour l'une de nos entreprises partenaires un vendeur"), true);
assert.equal(school("ECOFAC EVOLUTION", "Pour l'un de nos +500 magasins partenaires"), true);
assert.equal(school("Entreprise non communiquée", "Dans le cadre du développement du marché, un de nos partenaires recherche à recruter un diagnostiqueur"), true);
assert.equal(school("PRO-FYL", "Seuls les candidats inscrits dans notre école pourront voir leur candidature étudiée"), true);
// Annonceur masqué : indices plus larges.
assert.equal(school("Entreprise non communiquée", "Notre centre de formation vous accompagne"), true);
assert.equal(school("Entreprise non communiquée", "Formation 100% financée, rémunérée"), true);
assert.equal(school("Entreprise non communiquée", "Boulangerie familiale, vous préparerez le pain"), false);
// Vrais employeurs.
assert.equal(school("Buffalo Grill", "grâce à notre école interne et nos outils"), false);
assert.equal(school("Natures et Découvertes", "grâce à notre école de formation interne."), false);
assert.equal(school("Carrefour", "en alternance avec notre centre de formation partenaire"), false);
assert.equal(school("ENEDIS", "cette formation est faite pour vous"), false);
assert.equal(school("Thales", "Rejoignez nos équipes. Formation 100 % financée"), false);
assert.equal(school("Institut Pasteur", "Notre institut recrute"), false);
assert.equal(school("Agence X", "auprès de nos clients partenaires"), false);
// GEIQ et groupements d'employeurs : jamais écartés, même avec « emploi » ou « partenaires ».
assert.equal(school("G.E.I.Q. SERVICE EMPLOI PAYSAGE", "nos entreprises partenaires"), false);
assert.equal(school("GROUPEMENT D'EMPLOYEURS ALSACE LORRAINE", "nos entreprises partenaires"), false);
assert.equal(school("GEIQ BTP", "rejoignez notre formation"), false);
// Les prérequis comptent aussi.
assert.equal(school("Mairie", "Poste d'agent", "Être inscrit dans notre école"), true);

// SQL de la colonne : une ligne, \m et \M (pas de \b, qui veut dire « retour arrière » en SQL).
assert.equal(SCHOOL_AD_COLUMN_SQL.includes("\n"), false);
assert.equal(/\\b/.test(SCHOOL_AD_COLUMN_SQL), false);
assert.equal((SCHOOL_AD_COLUMN_SQL.match(/\\m/g) ?? []).length, 2);
assert.equal((SCHOOL_AD_COLUMN_SQL.match(/\\M/g) ?? []).length, 3);
assert.match(SCHOOL_AD_COLUMN_SQL, /^alter table public\.offers add column if not exists is_school_ad boolean generated always as \(.*\) stored;$/);
assert.match(SCHOOL_AD_COLUMN_SQL, /\(ecole\|cfa\)\\M\(\?! \(de formation \)\?interne\)/);

// 2. Ville du profil.
const dep = (city: string) => parseProfileLocation(city);
assert.deepEqual(dep("Lyon"), { departement: "69", regionWide: false });
assert.deepEqual(dep("Alpes-Maritimes (06)"), { departement: "06", regionWide: false });
assert.deepEqual(dep("Seine-Saint-Denis (93)"), { departement: "93", regionWide: false });
assert.deepEqual(dep("Toul 54200"), { departement: "54", regionWide: false });
assert.deepEqual(dep("Evreux 27000"), { departement: "27", regionWide: false });
assert.deepEqual(dep("91000"), { departement: "91", regionWide: false });
assert.deepEqual(dep("93200"), { departement: "93", regionWide: false });
assert.deepEqual(dep("97300 Cayenne"), { departement: "973", regionWide: false });
assert.deepEqual(dep("20000 Ajaccio"), { departement: "2A", regionWide: false });
assert.deepEqual(dep("92"), { departement: "92", regionWide: false });
assert.deepEqual(dep("Ain 01"), { departement: "01", regionWide: false });
assert.deepEqual(dep("Charente-Maritime (17)niort"), { departement: "17", regionWide: false });
assert.deepEqual(dep("Île-de-France"), { departement: "75", regionWide: true });
assert.deepEqual(dep("ile de france"), { departement: "75", regionWide: true });
assert.deepEqual(dep("Paris île de France").departement, "75");
assert.equal(dep("Hauts de France").regionWide, true);
assert.deepEqual(dep("Tunis"), { departement: null, regionWide: false });
assert.deepEqual(dep(""), { departement: null, regionWide: false });

// Département résolu par l'appelant : l'offre du même département devient proche.
const melun = { city: "Melun", mobility: "Sur place uniquement", departement: "77" };
assert.equal(geoMatch(melun, { location: "77 - FONTAINEBLEAU", remote_policy: null }).points, 8);
assert.equal(geoMatch({ city: "Melun", mobility: "Sur place uniquement" }, { location: "77 - FONTAINEBLEAU", remote_policy: null }).points, -30);
assert.equal(geoMatch(melun, { location: "77 - MELUN", remote_policy: null }).points, 14);
assert.equal(geoMatch(melun, { location: "13 - MARSEILLE", remote_policy: null }).points, -30);
// Région saisie : toute la région est proche.
const idf = { city: "Île-de-France", mobility: "Mobile dans la région", departement: "75" };
assert.ok(geoMatch(idf, { location: "91 - EVRY", remote_policy: null }).points >= 0);
assert.ok(geoMatch(idf, { location: "69 - LYON", remote_policy: null }).points < 0);

// 3. Outre-mer.
assert.equal(isOverseasDepartement("974"), true);
assert.equal(isOverseasDepartement("976"), true);
assert.equal(isOverseasDepartement("75"), false);
assert.equal(overseasMismatch("69", "974 - SAINT-DENIS"), true);
assert.equal(overseasMismatch("69", "973 - CAYENNE"), true);
assert.equal(overseasMismatch("69", "69 - LYON"), false);
assert.equal(overseasMismatch("974", "974 - SAINT-PIERRE"), false);
assert.equal(overseasMismatch("974", "75 - PARIS"), false, "un abonné de la Réunion garde sa mobilité");
assert.equal(overseasMismatch(null, "974 - SAINT-DENIS"), false, "département inconnu : on ne sait pas");

// 4. Deck d'un abonné.
const labTech = { hasTargetJobs: true, sectors: ["Chimie"] };
assert.equal(fitsSubscriber({ sector: "Restauration" }, { targetJob: false, near: false }, labTech), false, "cuisinier à Antibes");
assert.equal(fitsSubscriber({ sector: "Restauration" }, { targetJob: false, near: true }, labTech), false, "autre secteur, même proche");
assert.equal(fitsSubscriber({ sector: "Chimie" }, { targetJob: false, near: true }, labTech), true, "son secteur, près de chez lui");
assert.equal(fitsSubscriber({ sector: "Chimie" }, { targetJob: false, near: false }, labTech), false, "autre métier loin");
assert.equal(fitsSubscriber({ sector: "Santé" }, { targetJob: true, near: false }, labTech), true, "son métier, même loin");
assert.equal(fitsSubscriber({ sector: "Chimie" }, { targetJob: false, near: false }, { hasTargetJobs: false, sectors: ["Chimie"] }), true);
assert.equal(fitsSubscriber({ sector: "BTP" }, { targetJob: false, near: true }, { hasTargetJobs: false, sectors: ["Chimie"] }), false);
assert.equal(fitsSubscriber({ sector: null }, { targetJob: false, near: false }, { hasTargetJobs: false, sectors: [] }), true);

type O = { id: string; tj: boolean; near: boolean };
const ranked: O[] = [
  { id: "autre-proche-1", tj: false, near: true },
  { id: "metier-loin-1", tj: true, near: false },
  { id: "metier-proche-1", tj: true, near: true },
  { id: "autre-proche-2", tj: false, near: true },
  { id: "metier-loin-2", tj: true, near: false },
  { id: "metier-proche-2", tj: true, near: true },
];
assert.deepEqual(
  subscriberOrder(ranked, (o) => ({ targetJob: o.tj, near: o.near })).map((o) => o.id),
  ["metier-proche-1", "metier-proche-2", "metier-loin-1", "metier-loin-2", "autre-proche-1", "autre-proche-2"],
);

console.log("avis-negatifs : OK");
