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
  // Paragraphe propre au diplôme (pages formation), faits stables uniquement.
  about?: string;
  // Règle testée sur l'intitulé sans accents mais avec ses majuscules :
  // "CAP" (le diplôme) et pas "Cap sur l'avenir".
  caseSensitive?: boolean;
};

export const METIERS: Metier[] = [
  { slug: "cybersecurite", label: "cybersécurité", domain: "en cybersécurité", pattern: /cyber|securite (informatique|des systemes|si\b)|pentest|\bsoc\b/ },
  { slug: "securite", label: "sécurité", domain: "dans la sécurité", pattern: /agent de (securite|surete)|surete aeroportuaire|ssiap|securite (incendie|privee|evenementielle)|agent cynophile|videoprotection|videosurveillance|gardiennage/ },
  { slug: "data", label: "data", domain: "en data", pattern: /\bdata\b|donnees|business intelligence|\bbi\b|machine learning|intelligence artificielle|\bia\b|statisticien|statisti/ },
  { slug: "developpeur", label: "développeur", domain: "de développeur", pattern: /developpeu|full.?stack|front.?end|back.?end|devops|programmeu|logiciel|software|integrateur web|\bjava\b|python|\bphp\b/ },
  { slug: "design", label: "design et graphisme", domain: "en design et graphisme", pattern: /graphis|designer|\bux\b|\bui\b|infograph|motion design|direction artistique|webdesign/ },
  { slug: "community-manager", label: "community manager", domain: "de community manager", pattern: /community|social media|reseaux sociaux|content manager|createur de contenu|influence/ },
  { slug: "e-commerce", label: "e-commerce", domain: "en e-commerce", pattern: /e.?commerce|marketplace|webmerch/ },
  { slug: "marketing", label: "marketing", domain: "en marketing", pattern: /market|\bseo\b|\bsea\b|growth|acquisition|\bcrm\b|chef de produit|brand|marque|traff?ic manager/ },
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
  { slug: "logistique", label: "logistique", domain: "en logistique", pattern: /logisti|supply|magasini|entrepot|preparat(eur|rice) de commandes|cariste|transport|flux|\bfacteur\b|\bfactrice\b|distribution (du |de )?courrier/ },
  { slug: "qualite", label: "qualité", domain: "en qualité", pattern: /qualite|\bqhse\b|\bhse\b|\bqse\b/ },
  { slug: "environnement", label: "environnement et RSE", domain: "dans l'environnement et la RSE", pattern: /environnement(al)?(?! de (qualification|test|developpement|travail|stimulation|simulation|production))|developpement durable|\brse\b|\besg\b|transition (ecologique|energetique)|energies? renouvelable|photovolta|eolien|biodiversit|ecolog|dechet|recyclage|climat(?!is|icien)|bilan carbone|decarbon/ },
  { slug: "chef-de-projet", label: "chef de projet", domain: "de chef de projet", pattern: /chef(fe)? de projet|project manager|\bpmo\b|product owner|product manager|scrum/ },
  { slug: "informatique", label: "informatique", domain: "en informatique", pattern: /reseau|systemes? (et|&) reseaux|admin(istrateur)? sys|technicien (informatique|support|helpdesk)|support (informatique|it|utilisateur)|helpdesk|infrastructure|cloud|informatique/ },
  { slug: "architecture", label: "architecture", domain: "en architecture", pattern: /urbanis|amenagement du territoire|architecte d.interieur|architecture(?! (logicielle|si|des systemes|cloud|data|reseaux?|technique|applicative|d.entreprise|logiciel))|\barchitecte\b(?! (si|logiciel|solutions?|cloud|data|reseaux?|systemes?|it|technique|applicati|infra|securite|fonctionnel|d.entreprise))|amenagement interieur|decorat(eur|rice) d.interieur/ },
  { slug: "plombier", label: "plombier chauffagiste", domain: "de plombier chauffagiste", pattern: /plomb|chauffagist|installat(eur|ion) sanitaire|monteu(r|se) (en installation sanitaire|sanitaire|thermique)/ },
  { slug: "menuiserie", label: "menuisier", domain: "de menuisier", pattern: /menuis|ebenist|charpent|agenceu/ },
  { slug: "artisan-batiment", label: "artisan du bâtiment", domain: "dans l'artisanat du bâtiment", pattern: /\bmacon|carreleu|plaquist|platri|couvreu|peintre (en )?batiment|peintre decorat|solier|facadi|etancheu|zingu|staffeu|tailleur de pierre/ },
  { slug: "paysagiste", label: "paysagiste", domain: "de paysagiste", pattern: /paysag|jardin|espaces? verts|elagu/ },
  { slug: "agriculture", label: "agriculture", domain: "dans l'agriculture", pattern: /agricol|agricult|viticul|vigne|vendang|elevage|eleveu|maraich|horticul|arboricul|palefreni|equin|aquacult|viticole/ },
  { slug: "btp", label: "BTP", domain: "dans le BTP", pattern: /conduct(eur|rice) de travaux|chantier|\bbtp\b|genie civil|batiment|metreu|economiste de la construction|geometre|topograph|coffreu|bancheu|canalisat|terrassi/ },
  { slug: "electricien", label: "électricien", domain: "d'électricien", pattern: /electrici|electrotech/ },
  { slug: "mecanique-auto", label: "mécanique auto", domain: "en mécanique auto", pattern: /automobile|mecanicien auto|carross|vehicule|poids lourd|garage/ },
  { slug: "maintenance", label: "maintenance", domain: "en maintenance", pattern: /maintenan|mecanicien|automatis|frigori|\bcvc\b|plombi|chauffag|climatis|climaticien/ },
  { slug: "production", label: "production industrielle", domain: "en production industrielle", pattern: /production|usine|operat(eur|rice)|conduct(eur|rice) de ligne|industrialisation|fabrication|usinage|soudeu|chaudronn|tourneu|fraiseu|commande numerique|serrurier|metallier|technicien(ne)? (methodes|industrialisation)|plasturg|imprimeu|conditionnement/ },
  { slug: "ingenieur", label: "ingénieur", domain: "d'ingénieur", pattern: /ingenieu|engineer|r&d|recherche et developpement|bureau d.etudes|projeteu|\bcao\b/ },
  { slug: "laboratoire", label: "laboratoire et sciences", domain: "en laboratoire", pattern: /laborato|chimi|biolog|biotech|microbio|biochim|formulation/ },
  { slug: "boucherie", label: "boucher", domain: "en boucherie, charcuterie et poissonnerie", pattern: /boucher|charcut|poissonn|fromag|ecaill/ },
  { slug: "boulangerie-patisserie", label: "boulangerie-pâtisserie", domain: "en boulangerie-pâtisserie", pattern: /boulang|patissi|chocolat/ },
  { slug: "tourisme", label: "tourisme", domain: "dans le tourisme", pattern: /touris|agen(t|ce) de voyages?|conseill(er|ere) (en |de )?voyages?|forfaitiste|billetterie|receptif|office de tourisme|animat(eur|rice) (de )?(club|camping|village)/ },
  { slug: "hotellerie-restauration", label: "hôtellerie-restauration", domain: "en hôtellerie-restauration", pattern: /cuisin|commis|serveu|restaura|hotel|receptionniste|barman|barista|traiteur|chef de rang|pizza|crepi|plonge|restauration rapide|fast.?food|brasserie|sommelie|gouvernant|femme de chambre|valet|concierge|room service|employee? d.etage/ },
  { slug: "coiffure-esthetique", label: "coiffure et esthétique", domain: "en coiffure et esthétique", pattern: /coiff|esthetic|onglerie|maquill|barbier|ongl|\bnail|cosmet|\bspa\b|soins? esthetique|ongul/ },
  { slug: "mode-textile", label: "mode et textile", domain: "dans la mode et le textile", pattern: /coutur|textile|\bmode\b|stylis|modelis|retouch(eur|euse|e)\b(?! photo)|cordonni|maroquin|tailleu(r|se)(?! de pierre)|pret.a.porter|habillement/ },
  { slug: "fleuriste", label: "fleuriste", domain: "de fleuriste", pattern: /fleurist|art floral/ },
  { slug: "animalier", label: "métiers animaliers", domain: "auprès des animaux", pattern: /veterinai|toilett|animal|animaux|soigneu|\basv\b|canin|felin/ },
  { slug: "proprete", label: "propreté", domain: "dans la propreté", pattern: /proprete|nettoyage|agent d.entretien|agent de service|\bmenage|laveu|hygiene des locaux/ },
  // Avant "santé" et "social" (le premier qui correspond gagne) : métiers
  // recherchés en tant que tels ("alternance aide soignante", "cap aepe
  // alternance", "éducateur spécialisé apprentissage" dans Search Console).
  { slug: "aide-soignant", label: "aide-soignant", domain: "d'aide-soignant", pattern: /aide.?soignant/ },
  { slug: "petite-enfance", label: "petite enfance", domain: "dans la petite enfance", pattern: /petite enfance|puericult|\baepe\b|\bcreche|micro.?creche|educat(eur|rice)s? de jeunes enfants|\beje\b/ },
  { slug: "educateur-specialise", label: "éducateur spécialisé", domain: "d'éducateur spécialisé", pattern: /educat(eur|rice)s? specialise|moniteur.?educat/ },
  { slug: "sante", label: "santé", domain: "dans la santé", pattern: /pharmac|dentaire|medical|infirmi|aide.?soignant|opticien|laborantin|\bsante\b|ambulanci|kine|dieteti|psychomot|orthophon|ergotherap|psycholog|orthopt|radiolog|manipulat(eur|rice) (en )?(electro|radio)|osteo|podolog|audioprothes|preparat(eur|rice) en pharmacie|sterilisation/ },
  { slug: "social", label: "social et éducation", domain: "dans le social et l'éducation", pattern: /educat|animat|petite enfance|puericult|\baesh\b|travail social|accompagnant|auxiliaire de vie|aide a domicile|services? a la personne|insertion|professeu|enseignan|formateu|surveillant|\batsem\b|assistant(e)? maternel|moniteu|assistante? de vie|\badvf\b|accompagnat(eur|rice)s? (de |des )?personnes?/ },
  { slug: "vente", label: "vente", domain: "dans la vente", pattern: /vendeu|conseill(er|ere) de vente|conseill(er|ere) vente|magasin|boutique|retail|caissi|employe(e)? (de commerce|polyvalent)|equipier|(hote|hotesse|employe|employee|agent)s? de caisse|libre.?service|rayon|\bdrive\b|employe(e)? commercia|grande distribution|hypermarche|supermarche|merchandis|assistante? manager|manager (de |d.)?(rayon|magasin|boutique|unite marchande)|unite marchande/ },
  { slug: "commercial", label: "commercial", domain: "de commercial", pattern: /commerci|business develop|bizdev|\bsales\b|account (manager|executive)|charge(e)? d.affaires|key account|\bkam\b|administration des ventes|\badv\b|prospect/ },
  { slug: "assistant-administratif", label: "assistant administratif", domain: "d'assistant administratif", pattern: /assistant(e)? (de direction|administrati|de gestion|polyvalent|office)|office manager|secretai|administrati|standardiste|hote(sse)? d.accueil|assistanat|agent d.accueil|charge(e)? d.accueil|assistante? d.agence/ },
];

// Diplômes cités dans l'intitulé des offres ("Apprenti vendeur - BTS MCO") :
// pages /alternance/bts-mco, /alternance/bts-mco/paris... Contrairement aux
// métiers, une offre peut en avoir plusieurs ("BTS" + "BTS MCO"). Classement
// sur le seul intitulé : la description complète coûterait trop cher à
// relire à chaque calcul de l'index.
export const FORMATIONS: Metier[] = [
  {
    slug: "bts",
    label: "BTS",
    domain: "en BTS",
    pattern: /\bbts\b/,
    about: "Le BTS (brevet de technicien supérieur) se prépare en 2 ans après le bac et donne un diplôme de niveau bac+2. C'est l'un des diplômes les plus préparés en alternance, dans presque tous les secteurs.",
  },
  {
    slug: "bts-mco",
    label: "BTS MCO",
    domain: "en BTS MCO",
    pattern: /\bmco\b|management commercial operationnel/,
    about: "Le BTS MCO (Management Commercial Opérationnel) forme en 2 ans à la gestion d'un point de vente : vente, relation client, animation commerciale et management d'équipe. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-ndrc",
    label: "BTS NDRC",
    domain: "en BTS NDRC",
    pattern: /\bndrc\b|negociation (et )?digitalisation/,
    about: "Le BTS NDRC (Négociation et Digitalisation de la Relation Client) forme en 2 ans à la prospection, à la négociation et à la vente, en face à face comme à distance. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-gpme",
    label: "BTS GPME",
    domain: "en BTS GPME",
    pattern: /\bgpme\b|gestion de la pme/,
    about: "Le BTS GPME (Gestion de la PME) forme en 2 ans à la gestion administrative d'une petite entreprise : relations clients et fournisseurs, organisation, suivi des ressources humaines. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-sam",
    label: "BTS SAM",
    domain: "en BTS SAM",
    pattern: /\bbts sam\b|support a l.action manageriale/,
    about: "Le BTS SAM (Support à l'Action Managériale) forme en 2 ans à l'assistanat de managers : organisation, gestion de projets, communication. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-cg",
    label: "BTS CG",
    domain: "en BTS CG",
    pattern: /\bbts cg\b|bts compta|comptabilite et gestion/,
    about: "Le BTS CG (Comptabilité et Gestion) forme en 2 ans à la comptabilité, la fiscalité, la paie et l'analyse de gestion. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-sio",
    label: "BTS SIO",
    domain: "en BTS SIO",
    pattern: /\bsio\b|services informatiques aux organisations|\bsisr\b|\bslam\b/,
    about: "Le BTS SIO (Services Informatiques aux Organisations) se prépare en 2 ans, avec l'option SISR (systèmes et réseaux) ou SLAM (développement). Diplôme de niveau bac+2.",
  },
  {
    slug: "but",
    label: "BUT",
    domain: "en BUT",
    pattern: /\bbut (tc|gea|info|informatique|mmi|gmp|qlio|geii|rt|gaco|cj|techniques|carrieres)|bachelor universitaire de technologie/,
    about: "Le BUT (bachelor universitaire de technologie) se prépare en 3 ans en IUT et donne un diplôme national de niveau bac+3. Beaucoup d'IUT proposent les 2e et 3e années en alternance.",
  },
  {
    slug: "licence-pro",
    label: "licence pro",
    domain: "en licence pro",
    pattern: /licence pro/,
    about: "La licence professionnelle se prépare en 1 an après un bac+2 et donne un diplôme national de niveau bac+3, très souvent en alternance.",
  },
  {
    slug: "bachelor",
    label: "bachelor",
    domain: "en bachelor",
    pattern: /\bbachelor\b(?! universitaire)/,
    about: "Le bachelor est un diplôme d'école de niveau bac+3, souvent préparé en alternance en 1 an après un bac+2. Avant de t'inscrire, vérifie que le titre est enregistré au RNCP.",
  },
  {
    slug: "master",
    label: "master",
    domain: "en master",
    pattern: /\bmaster\b|mastere|\bmsc\b|\bmba\b/,
    about: "Master, mastère ou MSc : formations de niveau bac+5, souvent en alternance sur les 2 dernières années. Le master est un diplôme national ; mastère et MSc sont des diplômes d'école, à vérifier au RNCP.",
  },
  {
    slug: "bts-electrotechnique",
    label: "BTS Électrotechnique",
    domain: "en BTS Électrotechnique",
    pattern: /\bbts\b.{0,20}electrotech/,
    about: "Le BTS Électrotechnique forme en 2 ans aux installations électriques du bâtiment, de l'industrie et de l'énergie : étude, installation, mise en service et maintenance. Diplôme de niveau bac+2, très demandé en alternance.",
  },
  {
    slug: "bac-pro-mspc",
    label: "bac pro MSPC",
    domain: "en bac pro MSPC",
    pattern: /\bmspc\b|maintenance des systemes de production connectes/,
    about: "Le bac pro MSPC (Maintenance des Systèmes de Production Connectés) forme à la maintenance des équipements industriels : diagnostic des pannes, réparation, amélioration des machines. Diplôme de niveau 4, souvent préparé en apprentissage.",
  },
  {
    slug: "bts-ci",
    label: "BTS Commerce International",
    domain: "en BTS Commerce International",
    pattern: /\bbts (ci|commerce international)\b/,
    about: "Le BTS Commerce International forme en 2 ans à la prospection de marchés étrangers, aux relations avec les clients et fournisseurs internationaux et aux opérations d'import-export. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-communication",
    label: "BTS Communication",
    domain: "en BTS Communication",
    pattern: /\bbts com(munication)?\b/,
    about: "Le BTS Communication forme en 2 ans à la conception et au suivi d'actions de communication : événements, contenus, réseaux sociaux, relation avec les prestataires. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-tourisme",
    label: "BTS Tourisme",
    domain: "en BTS Tourisme",
    pattern: /\bbts tourisme\b/,
    about: "Le BTS Tourisme forme en 2 ans au conseil et à la vente de voyages et à l'accueil touristique. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-banque",
    label: "BTS Banque",
    domain: "en BTS Banque",
    pattern: /\bbts banque\b/,
    about: "Le BTS Banque forme en 2 ans au métier de conseiller de clientèle : accueil, vente de produits bancaires et d'assurance, suivi d'un portefeuille de clients. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-assurance",
    label: "BTS Assurance",
    domain: "en BTS Assurance",
    pattern: /\bbts assurance\b/,
    about: "Le BTS Assurance forme en 2 ans aux métiers de l'assurance : conseil, vente de contrats, gestion des sinistres. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-pi",
    label: "BTS Professions Immobilières",
    domain: "en BTS Professions Immobilières",
    pattern: /\bbts (pi|professions immobilieres)\b/,
    about: "Le BTS Professions Immobilières forme en 2 ans à la transaction (vente, location) et à la gestion immobilière (gérance, copropriété). Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-sp3s",
    label: "BTS SP3S",
    domain: "en BTS SP3S",
    pattern: /\bsp3s\b|services et prestations des secteurs sanitaire/,
    about: "Le BTS SP3S (Services et Prestations des Secteurs Sanitaire et Social) forme en 2 ans aux métiers administratifs du sanitaire et du social : accueil et accompagnement des publics, gestion des dossiers, coordination. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-mos",
    label: "BTS MOS",
    domain: "en BTS MOS",
    pattern: /\bbts mos\b|management operationnel de la securite/,
    about: "Le BTS MOS (Management Opérationnel de la Sécurité) forme en 2 ans à l'encadrement d'équipes de sécurité privée et à la gestion des risques. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-ms",
    label: "BTS Maintenance des Systèmes",
    domain: "en BTS Maintenance des Systèmes",
    pattern: /\bbts ms\b|bts maintenance des systemes/,
    about: "Le BTS Maintenance des Systèmes forme en 2 ans à la maintenance d'équipements industriels, énergétiques ou de production. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-crsa",
    label: "BTS CRSA",
    domain: "en BTS CRSA",
    pattern: /\bcrsa\b/,
    about: "Le BTS CRSA (Conception et Réalisation de Systèmes Automatiques) forme en 2 ans à la conception et à la mise en service de machines automatisées. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-mhr",
    label: "BTS MHR",
    domain: "en BTS MHR",
    pattern: /\bbts mhr\b|management en hotellerie/,
    about: "Le BTS MHR (Management en Hôtellerie-Restauration) forme en 2 ans au management d'un restaurant, d'un hôtel ou d'un service d'hébergement. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-gtla",
    label: "BTS GTLA",
    domain: "en BTS GTLA",
    pattern: /\bgtla\b|gestion des transports et logistique/,
    about: "Le BTS GTLA (Gestion des Transports et Logistique Associée) forme en 2 ans à l'organisation des transports de marchandises et des opérations logistiques. Diplôme de niveau bac+2.",
  },
  {
    slug: "bts-opticien",
    label: "BTS Opticien-Lunetier",
    domain: "en BTS Opticien-Lunetier",
    pattern: /\bbts (ol|opticien)/,
    about: "Le BTS Opticien-Lunetier forme en 2 ans au métier d'opticien : examen de vue, conseil, montage et vente d'équipements optiques. Diplôme de niveau bac+2.",
  },
  {
    slug: "cap-aepe",
    label: "CAP AEPE",
    domain: "en CAP AEPE",
    pattern: /\baepe\b|accompagnant educatif petite enfance/,
    about: "Le CAP AEPE (Accompagnant Éducatif Petite Enfance) prépare à travailler auprès des jeunes enfants : crèche, école maternelle, garde à domicile. Diplôme de niveau 3, souvent préparé en apprentissage.",
  },
  {
    slug: "dcg",
    label: "DCG",
    domain: "en DCG",
    pattern: /\bdcg\b/,
    about: "Le DCG (Diplôme de Comptabilité et de Gestion) se prépare en 3 ans après le bac et donne un diplôme d'État de niveau bac+3, première étape vers l'expertise comptable. Souvent préparé en alternance.",
  },
  {
    slug: "deaes",
    label: "DEAES",
    domain: "en DEAES",
    pattern: /\bdeaes\b|accompagnant educatif et social/,
    about: "Le DEAES (Diplôme d'État d'Accompagnant Éducatif et Social) prépare à accompagner au quotidien des personnes âgées, en situation de handicap ou en difficulté. Diplôme de niveau 3.",
  },
  {
    slug: "cap",
    label: "CAP",
    domain: "en CAP",
    pattern: /\bCAP\b/,
    caseSensitive: true,
    about: "Le CAP (certificat d'aptitude professionnelle) est un diplôme de niveau 3, souvent préparé en apprentissage, pour apprendre un métier manuel ou de service : cuisine, coiffure, boulangerie, bâtiment, vente...",
  },
  {
    slug: "bac-pro",
    label: "bac pro",
    domain: "en bac pro",
    pattern: /bac pro/,
    about: "Le bac professionnel (niveau 4) se prépare en apprentissage dans de nombreux métiers techniques, commerciaux et de service.",
  },
  {
    slug: "titre-pro",
    label: "titre pro",
    domain: "en titre pro",
    pattern: /titre pro/,
    about: "Le titre professionnel est une certification du ministère du Travail, enregistrée au RNCP, souvent préparée en contrat de professionnalisation.",
  },
];

export function classifyFormations(title: string): Metier[] {
  const normalized = normalizeTitle(title);
  const withCase = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FORMATIONS.filter((formation) => formation.pattern.test(formation.caseSensitive ? withCase : normalized));
}

const METIER_BY_SLUG = new Map([...METIERS, ...FORMATIONS].map((metier) => [metier.slug, metier]));

export function isFormation(slug: string): boolean {
  return FORMATIONS.some((formation) => formation.slug === slug);
}

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
