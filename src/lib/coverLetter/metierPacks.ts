// Contenu propre à chaque métier du site (30/10, Nathan : « 100 templates
// de lettres de motivation […] pour chaque secteur, pour chaque métier […]
// sans IA »). 60 métiers × 2 styles de lettre (metierLetter.ts) = 120
// modèles. Pour chaque métier :
// - missions : ce qu'on y fait, à l'infinitif (« je veux apprendre à … ») ;
// - skills : les mots-clés que les recruteurs et leurs logiciels de tri
//   cherchent dans une candidature (compétences « en … ») ;
// - motive : pourquoi on choisit ce métier, vrai pour qui le vise, sans
//   rien inventer sur le parcours du candidat (le concret reste à compléter
//   entre crochets) ;
// - keywords : variantes repérées dans l'annonce pour dire au recruteur
//   « vous le demandez, je l'ai » (mot entier, sans accents ni majuscules).
// Écriture neutre : aucun accord au masculin ou au féminin.

export type MetierPack = {
  missions: string;
  skills: [string, string, string];
  motive: string;
  keywords: string[];
};

export const METIER_PACKS: Record<string, MetierPack> = {
  cybersecurite: {
    missions: "surveiller les systèmes, analyser les alertes de sécurité et participer aux audits et aux plans de remédiation",
    skills: ["sécurité des réseaux", "analyse de vulnérabilités", "gestion des incidents"],
    motive: "Protéger les données d'une organisation est un enjeu qui me passionne, et je veux le traiter sur des cas réels, pas seulement en cours.",
    keywords: ["soc", "siem", "pentest", "iso 27001", "firewall", "vulnerabilites", "linux", "active directory", "rgpd"],
  },
  securite: {
    missions: "assurer la sûreté des personnes et des biens, contrôler les accès et intervenir avec calme en cas d'incident",
    skills: ["prévention des risques", "contrôle d'accès", "gestion des situations sensibles"],
    motive: "J'aime les missions où la vigilance et le sang-froid font la différence pour la sécurité de tous.",
    keywords: ["ssiap", "cqp aps", "videosurveillance", "rondes", "incendie", "premiers secours", "sst"],
  },
  data: {
    missions: "collecter, nettoyer et analyser des données pour en tirer des indicateurs utiles aux décisions",
    skills: ["analyse de données", "SQL", "visualisation de données"],
    motive: "Transformer des chiffres bruts en décisions concrètes est ce qui me motive le plus dans la data.",
    keywords: ["python", "sql", "power bi", "tableau", "excel", "machine learning", "statistiques", "etl", "dashboard", "looker"],
  },
  developpeur: {
    missions: "concevoir, coder et tester des fonctionnalités, puis les maintenir au sein d'une équipe de développement",
    skills: ["développement web", "Git", "qualité de code"],
    motive: "Voir une fonctionnalité utilisée par de vrais utilisateurs, c'est ce qui me donne envie de progresser chaque jour.",
    keywords: ["javascript", "typescript", "react", "node", "java", "python", "php", "symfony", "angular", "api", "git", "sql", "agile", "scrum"],
  },
  design: {
    missions: "imaginer des visuels, des maquettes et des identités graphiques qui servent un message ou un produit",
    skills: ["conception graphique", "Suite Adobe", "UX/UI design"],
    motive: "J'aime trouver la forme juste qui rend un message clair et donne envie, et la confronter aux retours d'un vrai client.",
    keywords: ["figma", "photoshop", "illustrator", "indesign", "ux", "ui", "maquettes", "charte graphique", "motion design"],
  },
  "community-manager": {
    missions: "animer les réseaux sociaux de la marque, créer des contenus, répondre à la communauté et suivre les performances",
    skills: ["gestion des réseaux sociaux", "création de contenu", "suivi des statistiques"],
    motive: "Les réseaux sociaux font partie de mon quotidien, et je veux apprendre à les utiliser de façon professionnelle, avec une vraie stratégie.",
    keywords: ["instagram", "tiktok", "linkedin", "facebook", "canva", "planning editorial", "engagement", "influence", "meta business"],
  },
  "e-commerce": {
    missions: "gérer un site marchand, mettre en ligne les produits, animer les ventes et suivre les indicateurs de conversion",
    skills: ["gestion de site e-commerce", "marketing digital", "analyse des ventes en ligne"],
    motive: "Le commerce en ligne évolue très vite, et j'aime l'idée de mesurer chaque jour l'effet concret de mes actions sur les ventes.",
    keywords: ["shopify", "prestashop", "woocommerce", "seo", "sea", "google analytics", "marketplace", "taux de conversion", "fiches produits"],
  },
  marketing: {
    missions: "analyser le marché, préparer et suivre des campagnes et participer au lancement de produits ou d'offres",
    skills: ["marketing opérationnel", "études de marché", "gestion de campagnes"],
    motive: "Comprendre ce qui donne envie à un client et le traduire en actions concrètes est ce qui m'attire dans le marketing.",
    keywords: ["marketing digital", "crm", "emailing", "seo", "google analytics", "veille concurrentielle", "brief", "kpi", "salons"],
  },
  communication: {
    missions: "rédiger des contenus, organiser des événements et faire vivre l'image de l'entreprise auprès de ses publics",
    skills: ["rédaction", "communication institutionnelle", "organisation d'événements"],
    motive: "J'aime écrire, organiser et voir un message bien porté toucher les bonnes personnes.",
    keywords: ["relations presse", "communique de presse", "evenementiel", "canva", "reseaux sociaux", "site web", "newsletter", "charte graphique"],
  },
  audiovisuel: {
    missions: "participer à la préparation, au tournage et au montage de contenus vidéo, de l'idée à la diffusion",
    skills: ["tournage", "montage vidéo", "post-production"],
    motive: "Raconter une histoire en images me passionne, et je veux apprendre les exigences d'une vraie production.",
    keywords: ["premiere pro", "after effects", "davinci", "final cut", "cadrage", "son", "etalonnage", "motion design"],
  },
  culture: {
    missions: "contribuer à la programmation, à la médiation et à l'organisation d'événements culturels, au contact du public",
    skills: ["médiation culturelle", "gestion de projets culturels", "accueil des publics"],
    motive: "Rendre la culture accessible au plus grand nombre est un projet qui a du sens pour moi.",
    keywords: ["mediation", "billetterie", "programmation", "exposition", "spectacle", "patrimoine", "subventions"],
  },
  rh: {
    missions: "participer au recrutement, à l'intégration des nouveaux arrivants, à l'administration du personnel et à la formation",
    skills: ["recrutement", "administration du personnel", "gestion de la formation"],
    motive: "L'humain est au cœur de la réussite d'une entreprise, et j'aime l'idée d'accompagner les salariés à chaque étape.",
    keywords: ["sourcing", "entretiens", "onboarding", "paie", "sirh", "droit du travail", "gpec", "marque employeur", "dpae"],
  },
  "controle-de-gestion": {
    missions: "suivre les budgets, analyser les écarts et construire les tableaux de bord qui aident à piloter l'activité",
    skills: ["contrôle de gestion", "analyse financière", "reporting"],
    motive: "J'aime comprendre ce que racontent les chiffres d'une entreprise et aider à prendre les bonnes décisions.",
    keywords: ["budget", "tableaux de bord", "excel", "kpi", "previsions", "couts", "reporting", "erp", "sap"],
  },
  comptabilite: {
    missions: "saisir et contrôler les opérations comptables, préparer les déclarations et participer aux clôtures",
    skills: ["comptabilité générale", "rapprochements bancaires", "déclarations fiscales"],
    motive: "La rigueur et la fiabilité des comptes sont des qualités que je veux mettre au service d'une entreprise ou d'un cabinet.",
    keywords: ["saisie", "tva", "bilan", "cloture", "sage", "cegid", "excel", "fournisseurs", "clients", "paie", "lettrage"],
  },
  audit: {
    missions: "participer aux missions d'audit, analyser les comptes et les procédures et formuler des recommandations",
    skills: ["audit financier", "analyse des risques", "contrôle interne"],
    motive: "L'audit offre une vision transversale des entreprises, idéale pour apprendre vite et sur des cas variés.",
    keywords: ["commissariat aux comptes", "controle interne", "revue", "procedures", "excel", "normes", "ifrs"],
  },
  assurance: {
    missions: "conseiller les clients, étudier leurs besoins, proposer des contrats adaptés et suivre les dossiers et sinistres",
    skills: ["conseil client", "gestion de contrats", "gestion des sinistres"],
    motive: "Accompagner des clients dans des moments importants de leur vie donne du sens à ce métier.",
    keywords: ["iard", "prevoyance", "sinistres", "souscription", "portefeuille", "conseil", "assurance vie"],
  },
  banque: {
    missions: "accueillir et conseiller les clients, analyser leurs besoins et leur proposer des solutions bancaires adaptées",
    skills: ["conseil bancaire", "relation client", "analyse des besoins"],
    motive: "Le conseil financier demande de l'écoute et de la confiance, deux choses que j'ai envie de développer auprès de clients.",
    keywords: ["conseiller clientele", "credit", "epargne", "portefeuille", "amf", "prospection", "conformite"],
  },
  "relation-client": {
    missions: "répondre aux demandes des clients, résoudre leurs problèmes et assurer un suivi de qualité par téléphone, mail ou chat",
    skills: ["relation client", "gestion des réclamations", "communication multicanale"],
    motive: "Trouver une solution à un client mécontent et le voir repartir satisfait est quelque chose qui me motive vraiment.",
    keywords: ["service client", "crm", "appels", "reclamations", "satisfaction", "teleconseil", "zendesk", "salesforce"],
  },
  finance: {
    missions: "analyser des données financières, préparer des reportings et participer au suivi de la trésorerie et des investissements",
    skills: ["analyse financière", "modélisation", "suivi de trésorerie"],
    motive: "La finance m'attire pour sa rigueur et pour son impact direct sur les choix stratégiques d'une entreprise.",
    keywords: ["excel", "tresorerie", "reporting", "modelisation", "consolidation", "fp&a", "bloomberg", "vba"],
  },
  immobilier: {
    missions: "accompagner les clients dans leurs projets, organiser les visites, préparer les dossiers et suivre les transactions",
    skills: ["négociation immobilière", "relation client", "gestion de dossiers"],
    motive: "Aider quelqu'un à trouver son logement est un projet concret et humain qui me donne envie de m'investir.",
    keywords: ["transaction", "gestion locative", "syndic", "visites", "estimation", "mandats", "prospection", "baux"],
  },
  juridique: {
    missions: "réaliser des recherches juridiques, rédiger des actes et des notes et suivre les dossiers avec rigueur",
    skills: ["recherche juridique", "rédaction d'actes", "veille juridique"],
    motive: "J'aime la précision du droit et la façon dont il protège concrètement les personnes et les entreprises.",
    keywords: ["contrats", "droit des affaires", "droit social", "contentieux", "conformite", "rgpd", "veille", "notariat"],
  },
  "affaires-publiques": {
    missions: "suivre l'actualité publique et réglementaire, préparer des notes et participer aux échanges avec les institutions",
    skills: ["veille institutionnelle", "rédaction de notes", "analyse des politiques publiques"],
    motive: "Comprendre comment se prennent les décisions publiques et y contribuer est ce qui m'attire dans ce domaine.",
    keywords: ["veille", "lobbying", "parlement", "collectivites", "notes", "reglementation", "plaidoyer"],
  },
  achats: {
    missions: "rechercher des fournisseurs, comparer les offres, négocier et suivre les commandes",
    skills: ["négociation fournisseurs", "sourcing", "suivi des commandes"],
    motive: "La négociation et l'optimisation des coûts sont des défis concrets qui me motivent.",
    keywords: ["approvisionnement", "fournisseurs", "appels d'offres", "erp", "sap", "excel", "negociation", "supply chain"],
  },
  "commerce-international": {
    missions: "développer les ventes à l'export, suivre les commandes et la logistique internationale et échanger avec des clients étrangers",
    skills: ["commerce international", "anglais professionnel", "suivi export"],
    motive: "Travailler avec d'autres pays et d'autres cultures est exactement l'environnement dans lequel je veux évoluer.",
    keywords: ["export", "import", "incoterms", "anglais", "douane", "prospection", "adv", "espagnol", "allemand"],
  },
  transport: {
    missions: "assurer des livraisons et des transports en toute sécurité, dans le respect des délais et de la réglementation",
    skills: ["conduite en sécurité", "respect des délais", "relation client"],
    motive: "J'aime les métiers où l'on est responsable de bout en bout de sa mission et où la ponctualité compte.",
    keywords: ["permis b", "permis c", "fimo", "livraison", "chauffeur", "tournees", "caces", "messagerie"],
  },
  logistique: {
    missions: "réceptionner, stocker et préparer les commandes, gérer les flux et participer à l'organisation de l'entrepôt",
    skills: ["gestion des stocks", "préparation de commandes", "organisation des flux"],
    motive: "J'aime les métiers concrets où l'organisation et l'efficacité se voient tout de suite sur le terrain.",
    keywords: ["entrepot", "caces", "wms", "inventaire", "reception", "expedition", "supply chain", "approvisionnement", "transport"],
  },
  qualite: {
    missions: "contrôler la conformité des produits et des process, suivre les indicateurs et participer à l'amélioration continue",
    skills: ["contrôle qualité", "amélioration continue", "suivi des non-conformités"],
    motive: "La qualité, c'est l'exigence qui fait la confiance d'un client, et c'est un état d'esprit que je partage.",
    keywords: ["iso 9001", "audit", "non-conformites", "5s", "lean", "haccp", "indicateurs", "procedures", "amdec"],
  },
  environnement: {
    missions: "mesurer l'impact environnemental de l'activité, suivre les indicateurs RSE et participer aux plans d'action",
    skills: ["démarche RSE", "bilan carbone", "gestion de projets environnementaux"],
    motive: "Contribuer à réduire l'impact environnemental d'une entreprise est un engagement qui compte pour moi.",
    keywords: ["rse", "bilan carbone", "developpement durable", "iso 14001", "dechets", "energie", "reporting extra-financier"],
  },
  "chef-de-projet": {
    missions: "planifier, coordonner les équipes et suivre l'avancement, les délais et le budget des projets",
    skills: ["gestion de projet", "planification", "coordination d'équipes"],
    motive: "Faire avancer un projet de l'idée à la livraison, en coordonnant plusieurs personnes, est ce que je veux apprendre à faire.",
    keywords: ["planning", "agile", "scrum", "jira", "budget", "reporting", "cahier des charges", "pilotage", "ms project"],
  },
  informatique: {
    missions: "installer et maintenir les postes, les réseaux et les serveurs et accompagner les utilisateurs au quotidien",
    skills: ["support utilisateurs", "administration systèmes et réseaux", "résolution d'incidents"],
    motive: "Résoudre un problème technique et permettre à chacun de travailler sereinement est ce qui me plaît dans l'informatique.",
    keywords: ["windows", "linux", "reseaux", "active directory", "office 365", "helpdesk", "tickets", "virtualisation", "cloud"],
  },
  architecture: {
    missions: "participer à la conception des projets, produire des plans et des maquettes et suivre les dossiers jusqu'au chantier",
    skills: ["conception architecturale", "dessin technique", "maquettage 3D"],
    motive: "Voir un projet passer du dessin à un bâtiment réel est ce qui me passionne dans l'architecture.",
    keywords: ["autocad", "revit", "sketchup", "archicad", "permis de construire", "plans", "bim", "maquettes"],
  },
  plombier: {
    missions: "installer, entretenir et dépanner les réseaux de plomberie et les équipements de chauffage",
    skills: ["installation sanitaire", "chauffage", "dépannage"],
    motive: "J'aime les métiers manuels qui rendent un vrai service aux gens, avec un résultat visible à chaque intervention.",
    keywords: ["sanitaire", "chaudiere", "cvc", "soudure", "depannage", "pompe a chaleur", "climatisation", "cap"],
  },
  menuiserie: {
    missions: "fabriquer, ajuster et poser des ouvrages en bois, de l'atelier au chantier",
    skills: ["travail du bois", "lecture de plans", "pose sur chantier"],
    motive: "Travailler le bois et voir une pièce prendre forme entre mes mains est ce qui m'attire dans la menuiserie.",
    keywords: ["agencement", "pose", "atelier", "machines", "ebenisterie", "plans", "cap"],
  },
  "artisan-batiment": {
    missions: "réaliser des travaux de construction, de rénovation ou de finition dans le respect des règles de l'art et de la sécurité",
    skills: ["travaux de second œuvre", "lecture de plans", "sécurité sur chantier"],
    motive: "J'aime les métiers concrets du bâtiment, où l'on voit à la fin de la journée le travail accompli.",
    keywords: ["maconnerie", "peinture", "platrerie", "carrelage", "renovation", "chantier", "couverture", "cap"],
  },
  paysagiste: {
    missions: "créer et entretenir des jardins et des espaces verts, de la plantation à la taille et à l'aménagement",
    skills: ["aménagement paysager", "entretien des espaces verts", "connaissance des végétaux"],
    motive: "Travailler en extérieur et embellir des lieux de vie avec le végétal est ce qui me motive dans ce métier.",
    keywords: ["espaces verts", "taille", "tonte", "plantation", "amenagement", "elagage", "arrosage", "cappa"],
  },
  agriculture: {
    missions: "participer aux travaux de l'exploitation, au soin des cultures ou des animaux et à l'entretien du matériel",
    skills: ["travaux agricoles", "conduite d'engins", "suivi des cultures"],
    motive: "Le travail de la terre et le lien direct avec ce que l'on produit sont ce qui me donne envie de m'engager dans l'agriculture.",
    keywords: ["exploitation", "elevage", "cultures", "tracteur", "recolte", "viticulture", "maraichage"],
  },
  btp: {
    missions: "participer au suivi des chantiers, à la préparation des travaux, aux métrés et au respect des délais et de la sécurité",
    skills: ["suivi de chantier", "lecture de plans", "métrés et chiffrage"],
    motive: "Le BTP m'attire pour ses projets concrets et ambitieux, où chaque étape compte.",
    keywords: ["chantier", "conducteur de travaux", "autocad", "metres", "devis", "securite", "gros oeuvre", "vrd", "bim"],
  },
  electricien: {
    missions: "installer, raccorder et dépanner les installations électriques dans le respect des normes de sécurité",
    skills: ["installations électriques", "lecture de schémas", "respect des normes"],
    motive: "L'électricité demande de la précision et de la rigueur, et j'aime les métiers techniques où la sécurité n'est pas négociable.",
    keywords: ["habilitation electrique", "courant fort", "courant faible", "tableaux", "cablage", "domotique", "nf c 15-100", "cap"],
  },
  "mecanique-auto": {
    missions: "entretenir, diagnostiquer et réparer les véhicules, de la révision aux réparations plus techniques",
    skills: ["diagnostic", "entretien de véhicules", "réparation mécanique"],
    motive: "Comprendre une panne et remettre un véhicule en état de rouler est un défi qui me passionne.",
    keywords: ["vidange", "freinage", "diagnostic", "valise", "electronique", "pneumatiques", "carrosserie", "cap"],
  },
  maintenance: {
    missions: "réaliser la maintenance préventive et curative des équipements et participer à leur amélioration",
    skills: ["maintenance industrielle", "diagnostic de pannes", "électromécanique"],
    motive: "Faire tourner une installation et réparer vite quand elle s'arrête est un métier concret et utile qui me plaît.",
    keywords: ["maintenance preventive", "curative", "electrotechnique", "automatisme", "hydraulique", "pneumatique", "gmao", "habilitation"],
  },
  production: {
    missions: "conduire des machines ou des lignes de production, contrôler la qualité et respecter les cadences et la sécurité",
    skills: ["conduite de ligne", "contrôle qualité", "respect des consignes de sécurité"],
    motive: "J'aime voir un produit sortir de la ligne et savoir que j'ai contribué à sa fabrication.",
    keywords: ["ligne", "machines", "cadence", "lean", "5s", "reglages", "conditionnement", "fabrication"],
  },
  ingenieur: {
    missions: "participer aux études techniques, concevoir des solutions et mener des projets avec les équipes de terrain",
    skills: ["gestion de projets techniques", "analyse et résolution de problèmes", "conception"],
    motive: "Résoudre des problèmes techniques complexes au service d'un projet concret est ce qui me motive.",
    keywords: ["conception", "cao", "solidworks", "catia", "matlab", "python", "etudes", "methodes", "amelioration continue"],
  },
  laboratoire: {
    missions: "réaliser des analyses et des expériences, suivre les protocoles et consigner les résultats avec rigueur",
    skills: ["techniques de laboratoire", "respect des protocoles", "analyse de résultats"],
    motive: "La démarche scientifique et la précision des manipulations sont ce qui m'attire dans le travail de laboratoire.",
    keywords: ["analyses", "protocoles", "bpl", "chromatographie", "microbiologie", "biologie", "chimie", "echantillons"],
  },
  boucherie: {
    missions: "préparer, découper et mettre en valeur les produits, conseiller les clients et respecter l'hygiène",
    skills: ["découpe et préparation", "règles d'hygiène", "conseil client"],
    motive: "J'aime les métiers de bouche, le travail du produit et le contact avec une clientèle fidèle.",
    keywords: ["decoupe", "haccp", "vitrine", "charcuterie", "poissonnerie", "conseil", "cap"],
  },
  "boulangerie-patisserie": {
    missions: "préparer et cuire pains, viennoiseries et pâtisseries en respectant les recettes, l'hygiène et les horaires",
    skills: ["fabrication de pains et viennoiseries", "pâtisserie", "règles d'hygiène"],
    motive: "Faire de bons produits et voir les clients revenir pour ce qu'on a préparé est ce qui me donne envie d'apprendre ce métier.",
    keywords: ["viennoiserie", "patisserie", "panification", "fournil", "haccp", "cap", "tour"],
  },
  tourisme: {
    missions: "accueillir et conseiller les voyageurs, organiser des séjours et assurer le suivi des réservations",
    skills: ["conseil en voyages", "accueil", "gestion des réservations"],
    motive: "Faire découvrir des destinations et contribuer à des voyages réussis est ce qui m'attire dans le tourisme.",
    keywords: ["reservations", "accueil", "anglais", "billetterie", "amadeus", "office de tourisme", "sejours", "evenements"],
  },
  "hotellerie-restauration": {
    missions: "accueillir et servir les clients, participer à la préparation et assurer un service de qualité",
    skills: ["service en salle", "accueil client", "travail en équipe"],
    motive: "J'aime le rythme du service et la satisfaction de clients qui repartent contents.",
    keywords: ["service", "cuisine", "reception", "bar", "haccp", "anglais", "room service", "brigade"],
  },
  "coiffure-esthetique": {
    missions: "accueillir les clients, réaliser des soins ou des prestations de coiffure et les conseiller sur les produits",
    skills: ["techniques de coiffure ou de soins", "conseil client", "hygiène"],
    motive: "Prendre soin des autres et les voir repartir avec le sourire est ce qui me motive dans ce métier.",
    keywords: ["coupe", "coloration", "soins", "onglerie", "maquillage", "conseil", "vente de produits", "cap"],
  },
  "mode-textile": {
    missions: "participer à la conception, au suivi de production ou à la vente de collections",
    skills: ["connaissance des matières", "suivi de collections", "sens du style"],
    motive: "La mode m'attire pour sa créativité et pour tout le travail concret qu'il y a derrière une collection.",
    keywords: ["collection", "stylisme", "modelisme", "patronage", "textile", "visual merchandising", "retail"],
  },
  fleuriste: {
    missions: "composer des bouquets et des compositions, conseiller les clients et entretenir les végétaux",
    skills: ["composition florale", "conseil client", "entretien des végétaux"],
    motive: "Créer des compositions pour les moments importants de la vie des clients donne du sens à ce métier.",
    keywords: ["bouquets", "compositions", "evenements", "mariages", "vegetaux", "cap"],
  },
  animalier: {
    missions: "prendre soin des animaux, assurer leur alimentation, leur hygiène et leur bien-être et conseiller leurs propriétaires",
    skills: ["soins aux animaux", "hygiène", "conseil aux propriétaires"],
    motive: "Le bien-être animal est quelque chose qui compte pour moi, et je veux en faire mon métier.",
    keywords: ["soins", "toilettage", "clinique veterinaire", "animalerie", "elevage", "asv"],
  },
  proprete: {
    missions: "assurer le nettoyage et l'entretien des locaux selon les protocoles et les règles d'hygiène",
    skills: ["techniques de nettoyage", "respect des protocoles d'hygiène", "autonomie"],
    motive: "Un lieu propre et accueillant change le quotidien de ceux qui y vivent ou y travaillent, et j'aime ce côté concret et utile.",
    keywords: ["nettoyage", "hygiene", "protocoles", "autolaveuse", "entretien", "bionettoyage"],
  },
  "aide-soignant": {
    missions: "accompagner les patients dans les gestes du quotidien, assurer leur confort et participer aux soins avec l'équipe",
    skills: ["soins d'hygiène et de confort", "écoute des patients", "travail en équipe soignante"],
    motive: "Être là pour les patients et contribuer à leur confort au quotidien, c'est ce qui me motive dans ce métier.",
    keywords: ["soins", "patients", "ehpad", "hopital", "hygiene", "transmissions", "deas"],
  },
  "petite-enfance": {
    missions: "accueillir les enfants, veiller à leur sécurité et à leur bien-être et proposer des activités adaptées à leur âge",
    skills: ["accompagnement de l'enfant", "animation d'activités", "relation avec les familles"],
    motive: "Accompagner les enfants dans leurs premières années et les voir grandir est un projet qui me tient à cœur.",
    keywords: ["creche", "eveil", "cap aepe", "accompagnant educatif", "hygiene", "familles", "activites"],
  },
  "educateur-specialise": {
    missions: "accompagner des personnes en difficulté dans leur projet de vie et construire avec elles un suivi adapté",
    skills: ["accompagnement éducatif", "écoute bienveillante", "travail en équipe pluridisciplinaire"],
    motive: "Aider des personnes à retrouver de l'autonomie et confiance en elles est ce qui donne du sens à mon engagement.",
    keywords: ["accompagnement", "projet personnalise", "handicap", "protection de l'enfance", "insertion", "deees"],
  },
  sante: {
    missions: "participer à la prise en charge des patients, aux soins ou au suivi administratif et médical selon le poste",
    skills: ["prise en charge des patients", "respect des règles d'hygiène", "travail en équipe"],
    motive: "Travailler au service de la santé des autres est ce qui me donne envie de m'investir chaque jour.",
    keywords: ["patients", "soins", "pharmacie", "secretariat medical", "hopital", "clinique", "hygiene"],
  },
  social: {
    missions: "accompagner des publics variés, les orienter vers les bons dispositifs et animer des actions collectives",
    skills: ["accompagnement social", "écoute", "animation d'actions collectives"],
    motive: "Être utile aux autres au quotidien est ce qui donne du sens au travail pour moi.",
    keywords: ["accompagnement", "insertion", "animation", "jeunesse", "familles", "mediation", "bafa"],
  },
  vente: {
    missions: "accueillir et conseiller les clients, mettre en valeur les produits et contribuer aux objectifs de vente du magasin",
    skills: ["relation client", "techniques de vente", "merchandising"],
    motive: "J'aime le contact avec les clients et voir concrètement le résultat de mon travail en fin de journée.",
    keywords: ["conseil", "encaissement", "mise en rayon", "merchandising", "objectifs", "fidelisation", "caisse", "stock", "vitrine"],
  },
  commercial: {
    missions: "prospecter de nouveaux clients, comprendre leurs besoins, présenter des offres et suivre un portefeuille",
    skills: ["prospection commerciale", "négociation", "suivi de portefeuille clients"],
    motive: "Convaincre, négocier et construire une relation de confiance avec des clients sont des défis qui me motivent.",
    keywords: ["prospection", "b2b", "b2c", "crm", "salesforce", "negociation", "portefeuille", "rendez-vous", "objectifs", "business developer"],
  },
  "assistant-administratif": {
    missions: "gérer l'accueil, le courrier, les plannings et les dossiers administratifs et assister l'équipe au quotidien",
    skills: ["gestion administrative", "organisation", "outils bureautiques"],
    motive: "J'aime être le point d'appui d'une équipe et que tout soit bien organisé pour que chacun puisse avancer.",
    keywords: ["accueil", "courrier", "planning", "word", "excel", "facturation", "classement", "secretariat", "agenda"],
  },
};
