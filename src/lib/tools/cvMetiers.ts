// Contenu de CV propre à chaque métier du site (30/10, Nathan : « des
// templates de CV […] que ça passe le filtre […] les mots-clés […] sans
// IA »). Pour chacun des 60 métiers de la taxonomie (seo/metiers.ts) :
// - skills : compétences et outils écrits comme dans les annonces, ceux que
//   les recruteurs et leurs logiciels de tri cherchent ;
// - qualities : trois qualités attendues dans le métier.
// Le titre et le profil du CV sont écrits à partir de la taxonomie et des
// missions du métier (cvTemplates.ts) : rien n'est inventé sur le parcours
// du candidat, ce qu'on ne sait pas reste entre crochets.

export type CvMetierContent = { skills: string[]; qualities: [string, string, string] };

export const CV_METIERS: Record<string, CvMetierContent> = {
  cybersecurite: {
    skills: ["Sécurité des réseaux", "Analyse de vulnérabilités", "Gestion des incidents", "SIEM", "Pare-feu", "Linux", "Active Directory", "ISO 27001"],
    qualities: ["Rigueur", "Discrétion", "Curiosité technique"],
  },
  securite: {
    skills: ["Contrôle des accès", "Rondes de surveillance", "Sécurité incendie", "Vidéoprotection", "Gestion des conflits", "Premiers secours (SST)", "Rédaction de rapports", "Carte professionnelle CNAPS"],
    qualities: ["Vigilance", "Sang-froid", "Sens du service"],
  },
  data: {
    skills: ["Analyse de données", "SQL", "Python", "Power BI", "Excel avancé", "Visualisation de données", "Statistiques", "Nettoyage de données"],
    qualities: ["Esprit d'analyse", "Rigueur", "Curiosité"],
  },
  developpeur: {
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "HTML / CSS", "SQL", "Git", "API REST"],
    qualities: ["Logique", "Autonomie", "Travail en équipe"],
  },
  design: {
    skills: ["Figma", "Photoshop", "Illustrator", "InDesign", "Identité visuelle", "UX / UI design", "Mise en page", "Typographie"],
    qualities: ["Créativité", "Sens du détail", "Écoute du client"],
  },
  "community-manager": {
    skills: ["Gestion des réseaux sociaux", "Calendrier éditorial", "Création de contenus", "Canva", "Instagram", "TikTok", "LinkedIn", "Statistiques d'audience"],
    qualities: ["Créativité", "Réactivité", "Aisance rédactionnelle"],
  },
  "e-commerce": {
    skills: ["Gestion de boutique en ligne", "Shopify", "Fiches produits", "Emailing", "Référencement (SEO)", "Google Analytics", "Suivi des commandes", "Excel"],
    qualities: ["Organisation", "Sens commercial", "Rigueur"],
  },
  marketing: {
    skills: ["Marketing digital", "Études de marché", "Référencement (SEO)", "Emailing", "Google Analytics", "Gestion de campagnes", "Canva", "Excel"],
    qualities: ["Créativité", "Esprit d'analyse", "Organisation"],
  },
  communication: {
    skills: ["Communication institutionnelle", "Rédaction web", "Relations presse", "Événementiel", "Réseaux sociaux", "Canva", "Suite Adobe", "Plan de communication"],
    qualities: ["Aisance rédactionnelle", "Créativité", "Organisation"],
  },
  audiovisuel: {
    skills: ["Montage vidéo", "Premiere Pro", "After Effects", "Prise de vue", "Prise de son", "Étalonnage", "DaVinci Resolve", "Écriture de scénario"],
    qualities: ["Créativité", "Patience", "Travail en équipe"],
  },
  culture: {
    skills: ["Médiation culturelle", "Accueil des publics", "Billetterie", "Production de spectacles", "Gestion de projet culturel", "Communication", "Recherche de mécénat", "Pack Office"],
    qualities: ["Sens du contact", "Polyvalence", "Organisation"],
  },
  rh: {
    skills: ["Recrutement", "Rédaction d'offres d'emploi", "Administration du personnel", "Préparation de la paie", "Droit du travail", "Onboarding", "SIRH", "Excel"],
    qualities: ["Discrétion", "Écoute", "Rigueur"],
  },
  "controle-de-gestion": {
    skills: ["Contrôle de gestion", "Reporting", "Tableaux de bord", "Budget et prévisions", "Analyse des écarts", "Excel avancé", "Power BI", "SAP"],
    qualities: ["Esprit d'analyse", "Rigueur", "Esprit de synthèse"],
  },
  comptabilite: {
    skills: ["Saisie comptable", "Rapprochements bancaires", "Déclarations de TVA", "Clôtures mensuelles", "Comptabilité fournisseurs", "Sage", "Cegid", "Excel"],
    qualities: ["Rigueur", "Organisation", "Discrétion"],
  },
  audit: {
    skills: ["Audit financier", "Contrôle interne", "Analyse des comptes", "Normes comptables", "Revue des procédures", "Excel avancé", "Rédaction de rapports", "Échantillonnage"],
    qualities: ["Esprit d'analyse", "Rigueur", "Esprit d'équipe"],
  },
  assurance: {
    skills: ["Conseil en assurance", "Gestion de sinistres", "Souscription de contrats", "Relation client", "Analyse des besoins", "Prospection", "Réglementation de l'assurance", "Pack Office"],
    qualities: ["Sens du contact", "Pédagogie", "Rigueur"],
  },
  banque: {
    skills: ["Conseil bancaire", "Accueil clientèle", "Ouverture de comptes", "Crédit à la consommation", "Épargne", "Conformité (LCB-FT)", "Prospection", "Pack Office"],
    qualities: ["Sens commercial", "Discrétion", "Rigueur"],
  },
  "relation-client": {
    skills: ["Communication multicanale", "Traitement des réclamations", "Fidélisation", "Logiciel CRM", "Gestion des appels", "Zendesk", "Satisfaction client", "Pack Office"],
    qualities: ["Écoute", "Patience", "Sens du service"],
  },
  finance: {
    skills: ["Analyse financière", "Modélisation financière", "Trésorerie", "Reporting financier", "Évaluation d'entreprise", "Excel avancé", "VBA", "Bloomberg"],
    qualities: ["Esprit d'analyse", "Rigueur", "Résistance au stress"],
  },
  immobilier: {
    skills: ["Transaction immobilière", "Gestion locative", "Estimation de biens", "Visites", "Prospection", "Rédaction de mandats", "Négociation", "Logiciel de transaction"],
    qualities: ["Sens commercial", "Autonomie", "Sens du contact"],
  },
  juridique: {
    skills: ["Recherche juridique", "Rédaction d'actes", "Veille juridique", "Droit des contrats", "Droit des sociétés", "Secrétariat juridique", "RGPD", "Dalloz / Lexis"],
    qualities: ["Rigueur", "Esprit de synthèse", "Discrétion"],
  },
  "affaires-publiques": {
    skills: ["Veille législative", "Notes de synthèse", "Relations institutionnelles", "Suivi des politiques publiques", "Rédaction", "Cartographie des acteurs", "Organisation d'événements", "Pack Office"],
    qualities: ["Esprit de synthèse", "Aisance rédactionnelle", "Curiosité"],
  },
  achats: {
    skills: ["Sourcing fournisseurs", "Négociation", "Appels d'offres", "Suivi des commandes", "Analyse des coûts", "Gestion des fournisseurs", "SAP", "Excel avancé"],
    qualities: ["Sens de la négociation", "Rigueur", "Organisation"],
  },
  "commerce-international": {
    skills: ["Commerce international", "Prospection à l'export", "Incoterms", "Douane", "Logistique internationale", "Négociation", "Anglais professionnel", "Gestion administrative des ventes"],
    qualities: ["Ouverture d'esprit", "Sens commercial", "Organisation"],
  },
  transport: {
    skills: ["Conduite en sécurité", "Livraison", "Chargement et arrimage", "Respect de la réglementation (temps de conduite)", "Lecture de plans de route", "Documents de transport", "Relation client", "Permis B"],
    qualities: ["Ponctualité", "Vigilance", "Sens des responsabilités"],
  },
  logistique: {
    skills: ["Gestion des stocks", "Préparation de commandes", "Réception de marchandises", "Inventaires", "WMS", "Chariot élévateur (CACES)", "Expédition", "Excel"],
    qualities: ["Organisation", "Rigueur", "Esprit d'équipe"],
  },
  qualite: {
    skills: ["Contrôle qualité", "ISO 9001", "Audits internes", "Analyse des non-conformités", "Amélioration continue", "Rédaction de procédures", "Indicateurs qualité", "Lean"],
    qualities: ["Rigueur", "Esprit d'analyse", "Pédagogie"],
  },
  environnement: {
    skills: ["Bilan carbone", "Démarche RSE", "Gestion des déchets", "Réglementation environnementale", "ISO 14001", "Reporting extra-financier", "Sensibilisation", "Excel"],
    qualities: ["Engagement", "Esprit d'analyse", "Pédagogie"],
  },
  "chef-de-projet": {
    skills: ["Gestion de projet", "Planification", "Suivi budgétaire", "Coordination d'équipe", "Méthodes agiles", "Jira", "Reporting", "Animation de réunions"],
    qualities: ["Organisation", "Leadership", "Communication"],
  },
  informatique: {
    skills: ["Support utilisateurs", "Administration systèmes", "Réseaux TCP/IP", "Windows Server", "Linux", "Active Directory", "Virtualisation", "Ticketing (GLPI)"],
    qualities: ["Pédagogie", "Patience", "Logique"],
  },
  architecture: {
    skills: ["AutoCAD", "Revit", "SketchUp", "ArchiCAD", "Plans et coupes", "Maquettes", "Dossiers de permis de construire", "Suivi de chantier"],
    qualities: ["Créativité", "Précision", "Sens de l'espace"],
  },
  plombier: {
    skills: ["Installation sanitaire", "Chauffage", "Soudure", "Lecture de plans", "Dépannage", "Raccordement", "Normes de sécurité", "Pompes à chaleur"],
    qualities: ["Minutie", "Autonomie", "Sens du service"],
  },
  menuiserie: {
    skills: ["Fabrication de meubles", "Pose de menuiseries", "Lecture de plans", "Machines-outils", "Assemblage", "Finitions", "Prise de cotes", "Normes de sécurité"],
    qualities: ["Précision", "Habileté manuelle", "Patience"],
  },
  "artisan-batiment": {
    skills: ["Maçonnerie", "Plâtrerie", "Peinture", "Carrelage", "Lecture de plans", "Préparation des supports", "Normes de sécurité", "Travail en hauteur"],
    qualities: ["Habileté manuelle", "Endurance", "Travail en équipe"],
  },
  paysagiste: {
    skills: ["Création d'espaces verts", "Entretien des jardins", "Taille", "Engazonnement", "Maçonnerie paysagère", "Arrosage automatique", "Reconnaissance des végétaux", "Conduite d'engins"],
    qualities: ["Endurance", "Sens esthétique", "Autonomie"],
  },
  agriculture: {
    skills: ["Conduite d'engins agricoles", "Travaux des cultures", "Soins aux animaux", "Entretien du matériel", "Agronomie", "Traçabilité", "Agriculture durable", "Permis tracteur"],
    qualities: ["Endurance", "Autonomie", "Polyvalence"],
  },
  btp: {
    skills: ["Suivi de chantier", "Lecture de plans", "Métrés", "Planning de chantier", "Normes de sécurité", "AutoCAD", "Gestion des sous-traitants", "Contrôle des travaux"],
    qualities: ["Organisation", "Rigueur", "Esprit d'équipe"],
  },
  electricien: {
    skills: ["Installation électrique", "Câblage", "Lecture de schémas", "Normes NF C 15-100", "Habilitation électrique", "Tableaux électriques", "Dépannage", "Domotique"],
    qualities: ["Rigueur", "Minutie", "Sens de la sécurité"],
  },
  "mecanique-auto": {
    skills: ["Diagnostic", "Entretien des véhicules", "Freinage", "Distribution", "Électronique automobile", "Valise de diagnostic", "Pneumatiques", "Véhicules électriques et hybrides"],
    qualities: ["Logique", "Minutie", "Sens du service"],
  },
  maintenance: {
    skills: ["Maintenance préventive", "Maintenance corrective", "Électromécanique", "Lecture de schémas", "Diagnostic de pannes", "Habilitation électrique", "GMAO", "Hydraulique et pneumatique"],
    qualities: ["Réactivité", "Logique", "Rigueur"],
  },
  production: {
    skills: ["Conduite de ligne", "Réglage de machines", "Contrôle qualité", "Lean manufacturing", "5S", "Respect des cadences", "Normes de sécurité", "Traçabilité"],
    qualities: ["Rigueur", "Réactivité", "Esprit d'équipe"],
  },
  ingenieur: {
    skills: ["Gestion de projet", "Conception", "Analyse technique", "Amélioration continue", "Cahier des charges", "SolidWorks", "Matlab", "Anglais technique"],
    qualities: ["Esprit d'analyse", "Autonomie", "Esprit d'équipe"],
  },
  laboratoire: {
    skills: ["Techniques de laboratoire", "Préparation d'échantillons", "Analyses physico-chimiques", "Bonnes pratiques de laboratoire (BPL)", "Chromatographie", "Microbiologie", "Cahier de laboratoire", "Excel"],
    qualities: ["Rigueur", "Minutie", "Curiosité scientifique"],
  },
  boucherie: {
    skills: ["Découpe", "Désossage", "Préparation de commandes", "Mise en valeur de la vitrine", "Règles d'hygiène (HACCP)", "Conseil client", "Traçabilité", "Affûtage"],
    qualities: ["Habileté manuelle", "Sens du contact", "Rigueur"],
  },
  "boulangerie-patisserie": {
    skills: ["Fabrication du pain", "Viennoiserie", "Pâtisserie", "Façonnage", "Cuisson", "Règles d'hygiène (HACCP)", "Gestion des stocks", "Vente en boutique"],
    qualities: ["Rigueur", "Créativité", "Endurance"],
  },
  tourisme: {
    skills: ["Accueil touristique", "Conseil en voyage", "Réservations", "Amadeus", "Vente de séjours", "Organisation d'excursions", "Anglais", "Relation client"],
    qualities: ["Sens du contact", "Ouverture d'esprit", "Organisation"],
  },
  "hotellerie-restauration": {
    skills: ["Service en salle", "Accueil des clients", "Préparation en cuisine", "Règles d'hygiène (HACCP)", "Encaissement", "Réception hôtelière", "Mise en place", "Anglais"],
    qualities: ["Sens du service", "Réactivité", "Esprit d'équipe"],
  },
  "coiffure-esthetique": {
    skills: ["Coupe", "Coloration", "Brushing", "Soins du visage", "Épilation", "Manucure", "Conseil client", "Vente de produits"],
    qualities: ["Sens du contact", "Créativité", "Minutie"],
  },
  "mode-textile": {
    skills: ["Stylisme", "Modélisme", "Couture", "Patronage", "Tendances de mode", "Illustrator", "Matières textiles", "Merchandising"],
    qualities: ["Créativité", "Sens du détail", "Curiosité"],
  },
  fleuriste: {
    skills: ["Composition florale", "Réalisation de bouquets", "Entretien des végétaux", "Conseil client", "Décoration événementielle", "Encaissement", "Mise en valeur de la boutique", "Gestion des stocks"],
    qualities: ["Créativité", "Sens du contact", "Habileté manuelle"],
  },
  animalier: {
    skills: ["Soins aux animaux", "Alimentation", "Hygiène des locaux", "Observation du comportement", "Contention", "Accueil des propriétaires", "Assistance vétérinaire", "Toilettage"],
    qualities: ["Patience", "Douceur", "Sens des responsabilités"],
  },
  proprete: {
    skills: ["Nettoyage des locaux", "Bionettoyage", "Utilisation des produits", "Monobrosse", "Gestion des déchets", "Protocoles d'hygiène", "Autocontrôle", "Normes de sécurité"],
    qualities: ["Rigueur", "Autonomie", "Discrétion"],
  },
  "aide-soignant": {
    skills: ["Soins d'hygiène et de confort", "Prise des constantes", "Aide à la mobilité", "Aide aux repas", "Transmissions", "Règles d'hygiène", "Accompagnement des patients", "Gestes d'urgence"],
    qualities: ["Empathie", "Patience", "Esprit d'équipe"],
  },
  "petite-enfance": {
    skills: ["Accueil des enfants", "Soins d'hygiène", "Activités d'éveil", "Repas", "Sécurité des enfants", "Communication avec les parents", "Projet pédagogique", "Observation de l'enfant"],
    qualities: ["Patience", "Bienveillance", "Créativité"],
  },
  "educateur-specialise": {
    skills: ["Accompagnement éducatif", "Projet personnalisé", "Animation d'activités", "Médiation", "Travail en réseau", "Écrits professionnels", "Protection de l'enfance", "Gestion des conflits"],
    qualities: ["Écoute bienveillante", "Patience", "Sens des responsabilités"],
  },
  sante: {
    skills: ["Accueil des patients", "Respect des règles d'hygiène", "Gestion des dossiers patients", "Secrétariat médical", "Préparation des soins", "Confidentialité", "Logiciel médical", "Terminologie médicale"],
    qualities: ["Empathie", "Rigueur", "Discrétion"],
  },
  social: {
    skills: ["Accompagnement social", "Animation de groupes", "Accès aux droits", "Écrits professionnels", "Médiation", "Travail en réseau", "Projet éducatif", "Accueil du public"],
    qualities: ["Écoute", "Patience", "Engagement"],
  },
  vente: {
    skills: ["Conseil client", "Techniques de vente", "Encaissement", "Merchandising", "Mise en rayon", "Gestion des stocks", "Fidélisation", "Objectifs de vente"],
    qualities: ["Sens du contact", "Dynamisme", "Esprit d'équipe"],
  },
  commercial: {
    skills: ["Prospection", "Négociation", "Développement commercial", "Suivi de portefeuille clients", "Logiciel CRM", "Salesforce", "Rédaction de devis", "Objectifs de vente"],
    qualities: ["Persévérance", "Sens de l'écoute", "Dynamisme"],
  },
  "assistant-administratif": {
    skills: ["Gestion administrative", "Accueil téléphonique", "Gestion d'agendas", "Classement et archivage", "Rédaction de courriers", "Facturation", "Word", "Excel"],
    qualities: ["Organisation", "Rigueur", "Discrétion"],
  },
};
