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
  { slug: "securite", label: "sécurité", domain: "dans la sécurité", pattern: /agent de (securite|surete)|surete aeroportuaire|ssiap|securite (incendie|privee|evenementielle)|agent cynophile|videoprotection|videosurveillance|gardiennage/ },
  { slug: "data", label: "data", domain: "en data", pattern: /\bdata\b|donnees|business intelligence|\bbi\b|machine learning|intelligence artificielle|\bia\b|statisticien|statisti/ },
  { slug: "developpeur", label: "développeur", domain: "de développeur", pattern: /developpeu|full.?stack|front.?end|back.?end|devops|programmeu|logiciel|software|integrateur web|\bjava\b|python|\bphp\b/ },
  { slug: "design", label: "design et graphisme", domain: "en design et graphisme", pattern: /graphis|designer|\bux\b|\bui\b|infograph|motion design|direction artistique|webdesign/ },
  { slug: "community-manager", label: "community manager", domain: "de community manager", pattern: /community|social media|reseaux sociaux|content manager|createur de contenu|influence/ },
  { slug: "e-commerce", label: "e-commerce", domain: "en e-commerce", pattern: /e.?commerce|marketplace|webmerch/ },
  { slug: "marketing", label: "marketing", domain: "en marketing", pattern: /market|\bseo\b|\bsea\b|growth|acquisition|\bcrm\b|chef de produit|brand|marque/ },
  { slug: "communication", label: "communication", domain: "en communication", pattern: /communica|relations? presse|evenementiel|journalis|redact|attache de presse|traduct|traducteu|interprete/ },
  { slug: "audiovisuel", label: "audiovisuel", domain: "dans l'audiovisuel", pattern: /audiovisu|video|photograph|cadreu|monteu(r|se) (video|son)|ingenieu(r|se) du son|technicien(ne)? (du )?son|sonoris|regisseu|cinema|tournage|post.?production/ },
  { slug: "culture", label: "culture", domain: "dans la culture", pattern: /\bcultur(e\b|elle)|spectacle|musee|patrimoine|bibliothe|mediathe|\bedition|librair|galerie|artisti/ },
  { slug: "rh", label: "RH", domain: "en RH", pattern: /\brh\b|ressources humaines|recrut|talent|\bpaie\b|charge(e)? de formation|\bhrbp\b|\bgrh\b/ },
  { slug: "controle-de-gestion", label: "contrôle de gestion", domain: "en contrôle de gestion", pattern: /controle(ur|use)? de gestion|controleu(r|se) gestion|fp&a/ },
  { slug: "comptabilite", label: "comptabilité", domain: "en comptabilité", pattern: /compta|expert.?comptable/ },
  { slug: "audit", label: "audit", domain: "en audit", pattern: /\baudit/ },
  { slug: "assurance", label: "assurance", domain: "dans l'assurance", pattern: /assuran|souscripteu|sinistre|actuari/ },
  { slug: "banque", label: "banque", domain: "dans la banque", pattern: /banque|bancaire|conseill(er|ere) (de )?clientele|conseill(er|ere) financi|patrimoin/ },
  { slug: "relation-client", label: "relation client", domain: "en relation client", pattern: /relation client|charge(e)? de clientele|teleconseil|conseill(er|ere) client|service client|customer (success|service|care|experience)|teleact|centre (d.appels?|de contacts?)|televente|hotline/ },
  { slug: "finance", label: "finance", domain: "en finance", pattern: /financ|tresor|fiscal|analyste credit|credit analyst/ },
  { slug: "immobilier", label: "immobilier", domain: "dans l'immobilier", pattern: /immobili|negociat(eur|rice) immo|syndic|gestionnaire locati|property/ },
  { slug: "juridique", label: "juridique", domain: "en droit", pattern: /jurid|juriste|\bdroit\b|avocat|notari|paralegal|compliance|conformite|notaire|clerc/ },
  { slug: "affaires-publiques", label: "affaires publiques", domain: "dans les affaires publiques", pattern: /affaires publiques|politiques? publiques?|parlementaire|relations internationales|collectivit|fonction publique|administration publique|lobby|plaidoyer|\bong\b|humanitaire|cooperation internationale/ },
  { slug: "achats", label: "achats", domain: "dans les achats", pattern: /achat|acheteu|approvisionn|procurement|sourcing|purchas/ },
  { slug: "commerce-international", label: "commerce international", domain: "en commerce international", pattern: /commerce international|\bexport|\bimport(?!an)|international trade|douane|transitaire|agent de transit\b/ },
  { slug: "transport", label: "transport et conduite", domain: "dans le transport", pattern: /chauffeu|conduct(eur|rice) (routier|poids lourds?|de bus|d.autocar|spl|de car|de train|de tramway|de metro|d.engins?)|livreu|agent d.escale|steward|hote(sse)? de l.air|pilote (de ligne(?! de production)|d.avion)|ferroviaire/ },
  { slug: "logistique", label: "logistique", domain: "en logistique", pattern: /logisti|supply|magasini|entrepot|preparat(eur|rice) de commandes|cariste|transport|flux/ },
  { slug: "qualite", label: "qualité", domain: "en qualité", pattern: /qualite|\bqhse\b|\bhse\b|\bqse\b/ },
  { slug: "environnement", label: "environnement et RSE", domain: "dans l'environnement et la RSE", pattern: /environnement(al)?(?! de (qualification|test|developpement|travail|stimulation|simulation|production))|developpement durable|\brse\b|\besg\b|transition (ecologique|energetique)|energies? renouvelable|photovolta|eolien|biodiversit|ecolog|dechet|recyclage|climat(?!is|icien)|bilan carbone|decarbon/ },
  { slug: "chef-de-projet", label: "chef de projet", domain: "de chef de projet", pattern: /chef(fe)? de projet|project manager|\bpmo\b|product owner|product manager|scrum/ },
  { slug: "informatique", label: "informatique", domain: "en informatique", pattern: /reseau|systemes? (et|&) reseaux|admin(istrateur)? sys|technicien (informatique|support|helpdesk)|support (informatique|it|utilisateur)|helpdesk|infrastructure|cloud|informatique/ },
  { slug: "architecture", label: "architecture", domain: "en architecture", pattern: /urbanis|amenagement du territoire|architecte d.interieur|architecture(?! (logicielle|si|des systemes|cloud|data|reseaux?|technique|applicative|d.entreprise|logiciel))|\barchitecte\b(?! (si|logiciel|solutions?|cloud|data|reseaux?|systemes?|it|technique|applicati|infra|securite|fonctionnel|d.entreprise))|amenagement interieur|decorat(eur|rice) d.interieur/ },
  { slug: "plombier", label: "plombier chauffagiste", domain: "de plombier chauffagiste", pattern: /plomb|chauffagist|installat(eur|ion) sanitaire|monteu(r|se) (en installation sanitaire|sanitaire|thermique)/ },
  { slug: "menuiserie", label: "menuisier", domain: "de menuisier", pattern: /menuis|ebenist|charpent|agenceu/ },
  { slug: "artisan-batiment", label: "artisan du bâtiment", domain: "dans l'artisanat du bâtiment", pattern: /\bmacon|carreleu|plaquist|platri|couvreu|peintre (en )?batiment|peintre decorat|solier|facadi|etancheu|zingu|staffeu|tailleur de pierre/ },
  { slug: "paysagiste", label: "paysagiste", domain: "de paysagiste", pattern: /paysag|jardin|espaces? verts|elagu/ },
  { slug: "agriculture", label: "agriculture", domain: "dans l'agriculture", pattern: /agricol|agricult|viticul|vigne|vendang|elevage|eleveu|maraich|horticul|arboricul|palefreni|equin|aquacult/ },
  { slug: "btp", label: "BTP", domain: "dans le BTP", pattern: /conduct(eur|rice) de travaux|chantier|\bbtp\b|genie civil|batiment|metreu|economiste de la construction|geometre|topograph/ },
  { slug: "electricien", label: "électricien", domain: "d'électricien", pattern: /electrici|electrotech/ },
  { slug: "mecanique-auto", label: "mécanique auto", domain: "en mécanique auto", pattern: /automobile|mecanicien auto|carross|vehicule|poids lourd|garage/ },
  { slug: "maintenance", label: "maintenance", domain: "en maintenance", pattern: /maintenan|mecanicien|automatis|frigori|\bcvc\b|plombi|chauffag|climatis|climaticien/ },
  { slug: "production", label: "production industrielle", domain: "en production industrielle", pattern: /production|usine|operat(eur|rice)|conduct(eur|rice) de ligne|industrialisation|fabrication|usinage|soudeu|chaudronn|tourneu|fraiseu|commande numerique|serrurier|metallier|technicien(ne)? (methodes|industrialisation)|plasturg|imprimeu|conditionnement/ },
  { slug: "ingenieur", label: "ingénieur", domain: "d'ingénieur", pattern: /ingenieu|engineer|r&d|recherche et developpement|bureau d.etudes|projeteu|\bcao\b/ },
  { slug: "laboratoire", label: "laboratoire et sciences", domain: "en laboratoire", pattern: /laborato|chimi|biolog|biotech|microbio|biochim|formulation/ },
  { slug: "boucherie", label: "boucher", domain: "en boucherie, charcuterie et poissonnerie", pattern: /boucher|charcut|poissonn|fromag|ecaill/ },
  { slug: "boulangerie-patisserie", label: "boulangerie-pâtisserie", domain: "en boulangerie-pâtisserie", pattern: /boulang|patissi|chocolat/ },
  { slug: "hotellerie-restauration", label: "hôtellerie-restauration", domain: "en hôtellerie-restauration", pattern: /cuisin|commis|serveu|restaura|hotel|receptionniste|barman|barista|traiteur|chef de rang|pizza|crepi|plonge|restauration rapide|fast.?food|brasserie|sommelie|gouvernant|femme de chambre|valet|concierge|room service/ },
  { slug: "coiffure-esthetique", label: "coiffure et esthétique", domain: "en coiffure et esthétique", pattern: /coiff|esthetic|onglerie|maquill|barbier|ongl|\bnail|cosmet|\bspa\b|soins? esthetique|ongul/ },
  { slug: "mode-textile", label: "mode et textile", domain: "dans la mode et le textile", pattern: /coutur|textile|\bmode\b|stylis|modelis|retouch(eur|euse|e)\b(?! photo)|cordonni|maroquin|tailleu(r|se)(?! de pierre)|pret.a.porter|habillement/ },
  { slug: "fleuriste", label: "fleuriste", domain: "de fleuriste", pattern: /fleurist|art floral/ },
  { slug: "animalier", label: "métiers animaliers", domain: "auprès des animaux", pattern: /veterinai|toilett|animal|animaux|soigneu|\basv\b|canin|felin/ },
  { slug: "proprete", label: "propreté", domain: "dans la propreté", pattern: /proprete|nettoyage|agent d.entretien|agent de service|\bmenage|laveu|hygiene des locaux/ },
  { slug: "sante", label: "santé", domain: "dans la santé", pattern: /pharmac|dentaire|medical|infirmi|aide.?soignant|opticien|laborantin|\bsante\b|ambulanci|kine|dieteti|psychomot|orthophon|ergotherap|psycholog|orthopt|radiolog|manipulat(eur|rice) (en )?(electro|radio)|osteo|podolog|audioprothes|preparat(eur|rice) en pharmacie/ },
  { slug: "social", label: "social et éducation", domain: "dans le social et l'éducation", pattern: /educat|animat|petite enfance|puericult|\baesh\b|travail social|accompagnant|auxiliaire de vie|aide a domicile|services? a la personne|insertion|professeu|enseignan|formateu|surveillant|\batsem\b|assistant(e)? maternel|moniteu/ },
  { slug: "vente", label: "vente", domain: "dans la vente", pattern: /vendeu|conseill(er|ere) de vente|conseill(er|ere) vente|magasin|boutique|retail|caissi|employe(e)? (de commerce|polyvalent)|equipier|(hote|hotesse|employe|employee|agent)s? de caisse|libre.?service|rayon|\bdrive\b|employe(e)? commercia|grande distribution|hypermarche|supermarche|merchandis/ },
  { slug: "commercial", label: "commercial", domain: "de commercial", pattern: /commerci|business develop|bizdev|\bsales\b|account (manager|executive)|charge(e)? d.affaires|key account|\bkam\b|administration des ventes|\badv\b|prospect/ },
  { slug: "assistant-administratif", label: "assistant administratif", domain: "d'assistant administratif", pattern: /assistant(e)? (de direction|administrati|de gestion|polyvalent|office)|office manager|secretai|administrati|standardiste|hote(sse)? d.accueil|assistanat|agent d.accueil|charge(e)? d.accueil/ },
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
    .replace(/[’']/g, "'")
    // "assistant(e)", "hôte(sse)", "vendeur(se)" -> "assistante", "hotesse"...
    // (sans toucher à "(H/F)"), pour que les règles reconnaissent le mot.
    .replace(/\(([a-z]{1,4})\)/g, "$1");
}

export function classifyMetier(title: string): Metier | null {
  const normalized = normalizeTitle(title);
  return METIERS.find((metier) => metier.pattern.test(normalized)) ?? null;
}
