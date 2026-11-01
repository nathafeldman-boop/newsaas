// Publications LinkedIn (1/11) : ce qui peut être publié, exactitude des textes, choix des offres.
// Lancer : npx tsx --tsconfig tsconfig.json tests/linkedin.test.ts
import assert from "node:assert/strict";
import { METIERS } from "../src/lib/seo/metiers";
import { LINKEDIN_SOURCES, MANUAL_MAX_AGE_MS, MAX_UNSEEN_MS, skipReason, sourceLine, type LinkedinOffer } from "../src/lib/linkedin/rules";
import {
  LINKEDIN_CITIES,
  POST_SIZE,
  SECTOR_GROUPS,
  buildPost,
  cityOf,
  citySlugOf,
  cleanCompany,
  cleanTitle,
  durationOf,
  offerInSector,
  prettyCaps,
  visualRows,
} from "../src/lib/linkedin/format";
import { pickDiverse, rankCandidates, WINDOW_DAYS } from "../src/lib/linkedin/pick";
import { idsFrom, kindFrom } from "../src/lib/linkedin/params";
import { LINKEDIN_POSTS_SQL } from "../src/lib/linkedin/data";

const NOW = Date.parse("2026-11-06T09:30:00Z"); // vendredi
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
let n = 0;
const offer = (over: Partial<LinkedinOffer> = {}): LinkedinOffer => {
  n++;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: `Assistant marketing ${n} (H/F)`,
    company: `Entreprise ${n}`,
    location: "69 - LYON 03",
    contract_type: "alternance",
    sector: "Marketing",
    duration: null,
    start_date: null,
    source: "france_travail",
    external_id: `FT${n}`,
    apply_url: "https://candidat.francetravail.fr/offres/recherche/detail/FT",
    published_at: new Date(NOW - 5 * HOUR).toISOString(),
    last_seen_at: new Date(NOW - 3 * HOUR).toISOString(),
    quality_score: 70,
    content_fingerprint: `fp${n}`,
    is_active: true,
    description: "Rejoignez notre équipe marketing.",
    requirements: null,
    ...over,
  };
};

// 1. Ce qui peut être publié.
assert.equal(skipReason(offer(), NOW), null);
assert.equal(skipReason(offer({ is_active: false }), NOW), "inactive");
assert.equal(skipReason(offer({ contract_type: "stage" }), NOW), "pas_alternance");
assert.equal(skipReason(offer({ source: "adzuna" }), NOW), "source", "Adzuna : label obligatoire, licence commerciale, rien sur les réseaux : jamais publiée");
assert.equal(skipReason(offer({ source: "demo" }), NOW), "source");
assert.deepEqual([...LINKEDIN_SOURCES].sort(), ["france_travail", "la_bonne_alternance", "manuel", "mistral_ingest"]);
assert.equal(skipReason(offer({ company: "Entreprise non communiquée" }), NOW), "entreprise_masquee");
assert.equal(skipReason(offer({ company: "" }), NOW), "entreprise_masquee");
assert.equal(skipReason(offer({ title: "ab" }), NOW), "titre");
assert.equal(skipReason(offer({ company: "Walter Learning" }), NOW), "annonce_ecole");
assert.equal(skipReason(offer({ description: "Une formation en alternance qui recrute !", company: "ACTUAL TALENT" }), NOW), "annonce_ecole");
assert.equal(skipReason(offer({ last_seen_at: new Date(NOW - MAX_UNSEEN_MS - HOUR).toISOString() }), NOW), "non_revue", "offre synchronisée non revue depuis 48 h");
assert.equal(skipReason(offer({ last_seen_at: new Date(NOW - MAX_UNSEEN_MS + HOUR).toISOString() }), NOW), null);
assert.equal(skipReason(offer({ source: "manuel", last_seen_at: new Date(NOW - 90 * DAY).toISOString(), published_at: new Date(NOW - 5 * DAY).toISOString() }), NOW), null, "ajoutée à la main : pas de synchro, on regarde son âge");
assert.equal(skipReason(offer({ source: "manuel", published_at: new Date(NOW - MANUAL_MAX_AGE_MS - DAY).toISOString() }), NOW), "trop_ancienne");
assert.equal(skipReason(offer({ quality_score: 10 }), NOW), "qualite");

// 2. Mise en forme des faits.
assert.equal(prettyCaps("ASSISTANT MARKETING DIGITAL"), "Assistant marketing digital");
assert.equal(prettyCaps("CHARGÉ DE MISSION RH"), "Chargé de mission RH");
assert.equal(prettyCaps("SNCF RESEAU"), "SNCF reseau", "intitulé : majuscule au premier mot");
assert.equal(prettyCaps("SNCF RESEAU", true), "SNCF Reseau", "entreprise : majuscule à chaque mot");
assert.equal(prettyCaps("Assistant marketing"), "Assistant marketing", "un titre déjà en minuscules n'est pas touché");
assert.equal(cleanTitle("Assistant marketing (H/F)"), "Assistant marketing");
assert.equal(cleanTitle("VENDEUR EN MAGASIN H/F"), "Vendeur en magasin");
assert.equal(cleanTitle("Développeur web - F/H"), "Développeur web -", "seul le (H/F) final est retiré");
assert.equal(cleanCompany("BUFFALO GRILL"), "Buffalo Grill");
assert.equal(cityOf({ location: "75 - PARIS 08", title: "x" }), "Paris");
assert.equal(cityOf({ location: "69 - LYON 03", title: "x" }), "Lyon");
assert.equal(cityOf({ location: "Haute-Loire, Auvergne-Rhône-Alpes", title: "x" }), null, "un département n'est pas une ville");
assert.equal(citySlugOf({ location: "13 - MARSEILLE 02", title: "x" }), "marseille");
assert.equal(durationOf({ duration: "12 mois" }), "12 mois");
assert.equal(durationOf({ duration: "Contrat de 12 mois renouvelable" }), null, "jamais une durée mal écrite");
assert.equal(durationOf({ duration: null }), null);

// 3. Secteurs : chaque métier cité existe, et l'offre est classée par son intitulé.
const slugs = new Set(METIERS.map((m) => m.slug));
for (const group of SECTOR_GROUPS) {
  assert.ok(slugs.has(group.landing), `page métier ${group.landing}`);
  for (const metier of group.metiers) assert.ok(slugs.has(metier), `${group.slug} : métier ${metier}`);
}
assert.equal(SECTOR_GROUPS.length, 6);
const bySlug = (slug: string) => SECTOR_GROUPS.find((g) => g.slug === slug)!;
assert.equal(offerInSector({ title: "Alternance Community Manager" }, bySlug("marketing-communication")), true);
assert.equal(offerInSector({ title: "Assistant RH en alternance" }, bySlug("rh")), true);
assert.equal(offerInSector({ title: "Développeur web en alternance" }, bySlug("informatique")), true);
assert.equal(offerInSector({ title: "Assistant comptable" }, bySlug("finance")), true);
assert.equal(offerInSector({ title: "Assistant comptable" }, bySlug("rh")), false);
assert.equal(LINKEDIN_CITIES.some((c) => c.slug === "paris") && LINKEDIN_CITIES.some((c) => c.slug === "lyon"), true);

// 4. Choix : fenêtre, historique, doublons, une offre par entreprise.
const none = new Set<string>();
const fresh = offer({ title: "Assistant marketing A", company: "Alpha" });
const older = offer({ title: "Assistant marketing B", company: "Beta", published_at: new Date(NOW - 3 * DAY).toISOString() });
const tooOld = offer({ title: "Assistant marketing C", company: "Gamma", published_at: new Date(NOW - (WINDOW_DAYS.daily + 1) * DAY).toISOString() });
const used = offer({ title: "Assistant marketing D", company: "Delta" });
const dup1 = offer({ title: "Assistant marketing E", company: "Epsilon", content_fingerprint: "same" });
const dup2 = offer({ title: "Assistant marketing E", company: "Epsilon", content_fingerprint: "same", source: "la_bonne_alternance" });
const adzuna = offer({ title: "Assistant marketing F", company: "Zeta", source: "adzuna" });
const ranked = rankCandidates([older, fresh, tooOld, used, dup1, dup2, adzuna, fresh], { kind: "daily", now: NOW, blocked: new Set([used.id]) });
assert.deepEqual(ranked.eligible.map((o) => o.id), [fresh.id, dup1.id, older.id]);
assert.equal(ranked.eligible.some((o) => o.id === used.id), false, "offre déjà préparée : jamais reproposée");
assert.equal(ranked.eligible.some((o) => o.id === tooOld.id), false);
assert.equal(ranked.eligible.some((o) => o.id === adzuna.id), false);
assert.equal(ranked.eligible.filter((o) => o.content_fingerprint === "same").length, 1, "même annonce de deux sources : une seule");
assert.equal(ranked.eligible.filter((o) => o.id === fresh.id).length, 1, "offre lue deux fois : une seule");
assert.equal(ranked.eligible[ranked.eligible.length - 1].id, older.id, "les plus récentes d'abord");
assert.equal(ranked.rejected.deja_preparee, 1);
assert.equal(ranked.rejected.source, 1);

const sameCompany = [offer({ company: "Alpha" }), offer({ company: "ALPHA" }), offer({ company: "Beta" })];
assert.deepEqual(pickDiverse(sameCompany, 3).map((o) => o.company), ["Alpha", "Beta"], "une offre par entreprise");
const paris = [offer({ location: "75 - PARIS 01" }), offer({ location: "75 - PARIS 02" }), offer({ location: "75 - PARIS 03" }), offer({ location: "69 - LYON 01" })];
assert.equal(pickDiverse(paris, 4, 2).length, 3, "au plus 2 par ville si demandé");

// Récap : les mieux renseignées d'abord ; les offres déjà mises en avant ailleurs, en dernier.
const rich = offer({ quality_score: 95 });
const poor = offer({ quality_score: 40, published_at: new Date(NOW - HOUR).toISOString() });
const richSeen = offer({ quality_score: 99 });
const weekly = rankCandidates([poor, rich, richSeen], { kind: "weekly", now: NOW, blocked: none, seen: new Set([richSeen.id]) });
assert.deepEqual(weekly.eligible.map((o) => o.id), [rich.id, poor.id, richSeen.id]);

// Secteur et ville : seulement les offres de la cible.
const mkt = offer({ title: "Alternance Community Manager", company: "A1" });
const rh = offer({ title: "Assistant RH", company: "B1" });
const sector = rankCandidates([mkt, rh], { kind: "sector", now: NOW, blocked: none, sector: bySlug("marketing-communication") });
assert.deepEqual(sector.eligible.map((o) => o.id), [mkt.id]);
const lyon = offer({ company: "L1", location: "69 - LYON 03" });
const nantes = offer({ company: "N1", location: "44 - NANTES" });
const cityRank = rankCandidates([lyon, nantes], { kind: "city", now: NOW, blocked: none, citySlug: "lyon" });
assert.deepEqual(cityRank.eligible.map((o) => o.id), [lyon.id]);

// 5. Textes : chaque fait vient de la base, rien d'inventé, liens suivis.
const picks = [
  offer({ title: "ASSISTANT MARKETING (H/F)", company: "BUFFALO GRILL", location: "75 - PARIS 08", duration: "12 mois" }),
  offer({ title: "Community manager", company: "Natures et Découvertes", location: "69 - LYON 03", source: "la_bonne_alternance" }),
  offer({ title: "Chargé de communication", company: "Mairie de Rennes", location: "35 - RENNES", source: "manuel" }),
];
const daily = buildPost({ kind: "daily", offers: picks, now: NOW });
assert.equal(daily.offerIds.length, 3);
assert.ok(daily.text.includes("1. Assistant marketing\n🏢 Buffalo Grill · 📍 Paris · Alternance 12 mois"));
assert.ok(daily.text.includes("2. Community manager\n🏢 Natures et Découvertes · 📍 Lyon · Alternance\n"));
for (const p of picks) {
  assert.ok(daily.text.includes(`https://www.stageio.fr/offres/`) && daily.text.includes(p.id), "lien direct vers la fiche");
}
assert.ok(daily.text.includes("utm_source=linkedin&utm_campaign=daily-20261106"), "lien suivi dans /admin/trafic");
assert.ok(daily.text.includes("Sources des offres : France Travail, La bonne alternance, sites carrières des entreprises."));
assert.ok(daily.text.includes("en ligne au 6 novembre"), "date de mise à jour citée");
assert.ok(daily.text.includes("https://www.stageio.fr/alternance?utm_source=linkedin"), "lien vers la page alternance");
assert.equal(daily.comment, null);
assert.ok(!/undefined|null|NaN|\{\{/.test(daily.text), "aucun reste de gabarit");
assert.ok(daily.text.length < 3000);
assert.ok(!daily.text.includes(picks[0].description), "jamais la description de l'offre");

// Liens en commentaire : le post n'en contient plus, le commentaire les porte tous.
const withComment = buildPost({ kind: "daily", offers: picks, now: NOW, linksInComment: true });
assert.ok(!withComment.text.includes("https://"), "aucun lien dans le post");
assert.ok(withComment.text.includes("premier commentaire"));
assert.ok(withComment.comment && picks.every((p) => withComment.comment!.includes(p.id)));

// Le titre du jour change d'un jour à l'autre, jamais le contenu.
const hooks = new Set([0, 1, 2].map((d) => buildPost({ kind: "daily", offers: picks, now: NOW + d * DAY }).text.split("\n")[0]));
assert.ok(hooks.size >= 2, "accroches variées");

// Secteur et ville.
const secPost = buildPost({
  kind: "sector",
  offers: picks,
  now: NOW,
  target: { label: "marketing et communication", landingPath: "/alternance/marketing", count: 412, hashtags: ["#marketing"], key: "marketing-communication" },
});
assert.ok(secPost.text.includes("412 offres d'alternance en marketing et communication"));
assert.ok(secPost.text.includes("https://www.stageio.fr/alternance/marketing?utm_source=linkedin"));
assert.ok(secPost.text.includes("#marketing"));
assert.equal(secPost.label, "Marketing et communication");
const noCount = buildPost({ kind: "sector", offers: picks, now: NOW, target: { label: "rh", landingPath: "/alternance/rh", count: null, key: "rh" } });
assert.ok(!/null|undefined/.test(noCount.text) && !noCount.text.includes("offres d'alternance en rh sont en ligne"), "pas de chiffre inventé");
const cityPost = buildPost({ kind: "city", offers: picks, now: NOW, target: { label: "Lyon", landingPath: "/alternance/lyon", count: 120, key: "lyon" } });
assert.ok(cityPost.text.includes("120 offres d'alternance à Lyon"));
assert.ok(buildPost({ kind: "city", offers: picks, now: NOW, target: { label: "Le Havre", landingPath: "/alternance/le-havre", key: "le-havre" } }).text.includes("au Havre"));
const weeklyPost = buildPost({ kind: "weekly", offers: picks, now: NOW });
assert.ok(weeklyPost.text.includes("les mieux renseignées"), "critère honnête : fiches complètes");
assert.equal(POST_SIZE.weekly, 10);
assert.equal(POST_SIZE.daily, 5);

// Source citée seulement pour les offres présentes.
assert.equal(sourceLine([{ source: "france_travail" }]), "France Travail");
assert.equal(sourceLine([{ source: "france_travail" }, { source: "france_travail" }]), "France Travail");

// Visuel : titres raccourcis, rien d'autre que les faits.
const rows = visualRows([offer({ title: "A".repeat(120), company: "B".repeat(80) })]);
assert.ok(rows[0].title.length <= 56 && rows[0].company.length <= 36);

// Paramètres d'URL.
assert.equal(kindFrom("weekly"), "weekly");
assert.equal(kindFrom("n'importe quoi"), "daily");
assert.deepEqual(idsFrom(["00000000-0000-4000-8000-000000000001,pas-un-id", "00000000-0000-4000-8000-000000000002"]), [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
]);

// SQL de l'historique : deux instructions, aucun guillemet (collage sur téléphone).
assert.equal(LINKEDIN_POSTS_SQL.split("\n").length, 2);
assert.ok(!LINKEDIN_POSTS_SQL.includes("'") && !LINKEDIN_POSTS_SQL.includes('"'));
assert.match(LINKEDIN_POSTS_SQL, /^create table if not exists public\.linkedin_posts \(.*\);\nalter table public\.linkedin_posts enable row level security;$/);

console.log("linkedin : OK");
