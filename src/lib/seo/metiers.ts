// Taxonomie "métier" des pages programmatiques (/alternance/[metier],
// /stage/[metier]/[ville]...). Les "secteurs" de classifyContract.ts
// décrivent l'entreprise ; un étudiant, lui, cherche un MÉTIER
// ("alternance commercial lyon", "stage rh paris"). Classement par
// expressions sur le titre normalisé (minuscules, sans accents), dans
// l'ordre : la 1re règle qui matche gagne -- les métiers spécifiques
// (cybersécurité, contrôle de gestion, e-commerce...) passent donc avant les
// génériques (informatique, finance, commercial, ingénieur). Une offre
// qu'aucune règle ne reconnaît n'a pas de page métier, mais reste listée
// sur sa page ville.

export type Metier = {
  slug: string;
  // Forme utilisée dans les titres : "Alternance {label} à Lyon".
  label: string;
  // Complément après "offres d'alternance" / "offres de stage" :
  // "de développeur", "dans la banque", "en marketing".
  domain: string;
  pattern: RegExp;
};

export const METIERS: Metier[] = [
  { slug: "cybersecurite", label: "cybersécurité", domain: "en cybersécurité", pattern: /cyber|securite (informatique|des systemes|si\b)|pentest|\bsoc\b/ },
  { slug: "data", label: "data", domain: "en data", pattern: /\bdata\b|donnees|business intelligence|\bbi\b|machine learning|intelligence artificielle|\bia\b|statisticien/ },
  { slug: "developpeur", label: "développeur", domain: "de développeur", pattern: /developpeu|full.?stack|front.?end|back.?end|devops|programmeu|logiciel|software|integrateur web|\bjava\b|python|\bphp\b/ },
  { slug: "design", label: "design et graphisme", domain: "en design et graphisme", pattern: /graphis|designer|\bux\b|\bui\b|infograph|motion design|direction artistique|webdesign/ },
  { slug: "community-manager", label: "community manager", domain: "de community manager", pattern: /community|social media|reseaux sociaux|content manager|createur de contenu|influence/ },
  { slug: "e-commerce", label: "e-commerce", domain: "en e-commerce", pattern: /e.?commerce|marketplace|webmerch/ },
  { slug: "marketing", label: "marketing", domain: "en marketing", pattern: /market|\bseo\b|\bsea\b|growth|acquisition|\bcrm\b|chef de produit|brand|marque/ },
  { slug: "communication", label: "communication", domain: "en communication", pattern: /communica|relations? presse|evenementiel|journalis|redact|attache de presse/ },
  { slug: "rh", label: "RH", domain: "en RH", pattern: /\brh\b|ressources humaines|recrut|talent|\bpaie\b|charge(e)? de formation|\bhrbp\b|\bgrh\b/ },
  { slug: "controle-de-gestion", label: "contrôle de gestion", domain: "en contrôle de gestion", pattern: /controle(ur|use)? de gestion|controleu(r|se) gestion|fp&a/ },
  { slug: "comptabilite", label: "comptabilité", domain: "en comptabilité", pattern: /compta|expert.?comptable/ },
  { slug: "audit", label: "audit", domain: "en audit", pattern: /\baudit/ },
  { slug: "assurance", label: "assurance", domain: "dans l'assurance", pattern: /assuran|souscripteu|sinistre|actuari/ },
  { slug: "banque", label: "banque", domain: "dans la banque", pattern: /banque|bancaire|conseill(er|ere) (de )?clientele|conseill(er|ere) financi|patrimoin/ },
  { slug: "finance", label: "finance", domain: "en finance", pattern: /financ|tresor|fiscal|analyste credit|credit analyst/ },
  { slug: "immobilier", label: "immobilier", domain: "dans l'immobilier", pattern: /immobili|negociat(eur|rice) immo|syndic|gestionnaire locati|property/ },
  { slug: "juridique", label: "juridique", domain: "en droit", pattern: /jurid|juriste|\bdroit\b|avocat|notari|paralegal|compliance|conformite/ },
  { slug: "achats", label: "achats", domain: "dans les achats", pattern: /achat|acheteu|approvisionn|procurement|sourcing|purchas/ },
  { slug: "logistique", label: "logistique", domain: "en logistique", pattern: /logisti|supply|magasini|entrepot|preparat(eur|rice) de commandes|cariste|transport|flux/ },
  { slug: "qualite", label: "qualité", domain: "en qualité", pattern: /qualite|\bqhse\b|\bhse\b|\bqse\b/ },
  { slug: "chef-de-projet", label: "chef de projet", domain: "de chef de projet", pattern: /chef(fe)? de projet|project manager|\bpmo\b|product owner|product manager|scrum/ },
  { slug: "informatique", label: "informatique", domain: "en informatique", pattern: /reseau|systemes? (et|&) reseaux|admin(istrateur)? sys|technicien (informatique|support|helpdesk)|support (informatique|it|utilisateur)|helpdesk|infrastructure|cloud|informatique/ },
  { slug: "btp", label: "BTP", domain: "dans le BTP", pattern: /conduct(eur|rice) de travaux|chantier|\bbtp\b|genie civil|batiment|metreu|economiste de la construction|geometre|topograph/ },
  { slug: "electricien", label: "électricien", domain: "d'électricien", pattern: /electrici|electrotech/ },
  { slug: "mecanique-auto", label: "mécanique auto", domain: "en mécanique auto", pattern: /automobile|mecanicien auto|carross|vehicule|poids lourd|garage/ },
  { slug: "maintenance", label: "maintenance", domain: "en maintenance", pattern: /maintenan|mecanicien|automatis|frigori|\bcvc\b|plombi|chauffag/ },
  { slug: "production", label: "production industrielle", domain: "en production industrielle", pattern: /production|usine|operat(eur|rice)|conduct(eur|rice) de ligne|industrialisation|fabrication|usinage|soudeu|chaudronn/ },
  { slug: "ingenieur", label: "ingénieur", domain: "d'ingénieur", pattern: /ingenieu|engineer|r&d|recherche et developpement|bureau d.etudes|projeteu|\bcao\b/ },
  { slug: "boulangerie-patisserie", label: "boulangerie-pâtisserie", domain: "en boulangerie-pâtisserie", pattern: /boulang|patissi|chocolat/ },
  { slug: "hotellerie-restauration", label: "hôtellerie-restauration", domain: "en hôtellerie-restauration", pattern: /cuisin|commis|serveu|restaura|hotel|receptionniste|barman|barista|traiteur|chef de rang/ },
  { slug: "coiffure-esthetique", label: "coiffure et esthétique", domain: "en coiffure et esthétique", pattern: /coiff|esthetic|onglerie|maquill|barbier/ },
  { slug: "sante", label: "santé", domain: "dans la santé", pattern: /pharmac|dentaire|medical|infirmi|aide.?soignant|opticien|laborantin|\bsante\b/ },
  { slug: "social", label: "social et éducation", domain: "dans le social et l'éducation", pattern: /educat|animat|petite enfance|puericult|\baesh\b|travail social|accompagnant/ },
  { slug: "vente", label: "vente", domain: "dans la vente", pattern: /vendeu|conseill(er|ere) de vente|conseill(er|ere) vente|magasin|boutique|retail|caissi|employe(e)? (de commerce|polyvalent)|equipier/ },
  { slug: "commercial", label: "commercial", domain: "de commercial", pattern: /commerci|business develop|bizdev|\bsales\b|account (manager|executive)|charge(e)? d.affaires|key account|\bkam\b|administration des ventes|\badv\b|prospect/ },
  { slug: "assistant-administratif", label: "assistant administratif", domain: "d'assistant administratif", pattern: /assistant(e)? (de direction|administrati|de gestion|polyvalent|office)|office manager|secretai|administrati|standardiste|hote(sse)? d.accueil/ },
];

const METIER_BY_SLUG = new Map(METIERS.map((metier) => [metier.slug, metier]));

export function getMetier(slug: string): Metier | undefined {
  return METIER_BY_SLUG.get(slug);
}

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'");
}

export function classifyMetier(title: string): Metier | null {
  const normalized = normalizeTitle(title);
  return METIERS.find((metier) => metier.pattern.test(normalized)) ?? null;
}
