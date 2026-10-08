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
  { slug: "cybersecurite", label: "cybersécurité", domain: "en cybersécurité", pattern: /cyber|securite (informatique|des systemes|si\b)|pentest|\bsoc\b/, about: "En cybersécurité, alternants et stagiaires surveillent les systèmes (analyste SOC), testent les failles, gèrent les accès et la conformité. Diplômes souvent préparés : BTS SIO option SISR, BUT Réseaux et télécommunications parcours cybersécurité, titre professionnel d'administrateur d'infrastructures sécurisées, master ou école d'ingénieurs en cybersécurité." },
  { slug: "securite", label: "sécurité", domain: "dans la sécurité", pattern: /agent de (securite|surete)|surete aeroportuaire|ssiap|securite (incendie|privee|evenementielle)|agent cynophile|videoprotection|videosurveillance|gardiennage/, about: "En sécurité, les alternants travaillent comme agent de prévention et de sécurité ou agent de sûreté, sur des sites, des événements ou en magasin. Une carte professionnelle délivrée par le CNAPS est obligatoire pour exercer. Diplômes souvent préparés : CQP Agent de prévention et de sécurité, bac pro Métiers de la sécurité, BTS Management opérationnel de la sécurité." },
  { slug: "data", label: "data", domain: "en data", pattern: /\bdata\b|donnees|business intelligence|\bbi\b|machine learning|intelligence artificielle|\bia\b|statisticien|statisti/, about: "En data, alternants et stagiaires préparent et analysent les données (data analyst), construisent des modèles (data scientist) ou des flux de données (data engineer). Diplômes souvent préparés : BUT Science des données, master ou école d'ingénieurs spécialisés en données, statistiques ou informatique." },
  { slug: "developpeur", label: "développeur", domain: "de développeur", pattern: /developpeu|full.?stack|front.?end|back.?end|devops|programmeu|logiciel|software|integrateur web|\bjava\b|python|\bphp\b/, about: "Un développeur en alternance ou en stage conçoit et maintient des sites, des applications ou des API au sein d'une équipe technique. Diplômes souvent préparés : BTS SIO option SLAM, BUT Informatique, titres professionnels de développeur web et web mobile ou de concepteur développeur d'applications, master ou école d'ingénieurs." },
  { slug: "design", label: "design et graphisme", domain: "en design et graphisme", pattern: /graphis|designer|\bux\b|\bui\b|infograph|motion design|direction artistique|webdesign/, about: "En design et graphisme, alternants et stagiaires créent des supports visuels, des identités de marque, des interfaces web ou mobiles (UX/UI) en agence ou en entreprise. Diplômes souvent préparés : DN MADE (diplôme national des métiers d'art et du design), BUT MMI, écoles de design et de graphisme." },
  { slug: "community-manager", label: "community manager", domain: "de community manager", pattern: /community|social media|reseaux sociaux|content manager|createur de contenu|influence/, about: "Un community manager en alternance ou en stage anime les réseaux sociaux d'une marque : calendrier éditorial, création de contenus, réponses à la communauté, suivi des statistiques. Diplômes souvent préparés : BUT MMI ou Information-Communication, BTS Communication, bachelor communication digitale." },
  { slug: "e-commerce", label: "e-commerce", domain: "en e-commerce", pattern: /e.?commerce|marketplace|webmerch/, about: "En e-commerce, les missions portent sur la boutique en ligne : mise en ligne des produits, animation commerciale, emailing, suivi des ventes et des commandes. Diplômes souvent préparés : BTS NDRC, BUT Techniques de commercialisation ou MMI, bachelor e-commerce ou marketing digital." },
  { slug: "marketing", label: "marketing", domain: "en marketing", pattern: /market|\bseo\b|\bsea\b|growth|acquisition|\bcrm\b|chef de produit|brand|marque|traff?ic manager/, about: "En marketing, les missions vont du marketing digital (réseaux sociaux, emailing, référencement, publicité en ligne) à l'assistanat de chef de produit et aux études de marché. Diplômes souvent préparés : BUT Techniques de commercialisation ou MMI, bachelor marketing digital, master marketing." },
  { slug: "communication", label: "communication", domain: "en communication", pattern: /communica|relations? presse|evenementiel|journalis|redact|attache de presse|traduct|traducteu|interprete/, about: "En communication, les missions confiées aux alternants et aux stagiaires vont de la création de contenus et de la gestion des réseaux sociaux à l'événementiel et aux relations presse. Diplômes souvent préparés : BTS Communication, BUT Information-Communication ou MMI, licence pro, bachelor ou master en communication." },
  { slug: "audiovisuel", label: "audiovisuel", domain: "dans l'audiovisuel", pattern: /audiovisu|video|photograph|cadreu|monteu(r|se) (video|son)|ingenieu(r|se) du son|technicien(ne)? (du )?son|sonoris|regisseu|cinema|tournage|post.?production/, about: "Dans l'audiovisuel, alternants et stagiaires assistent la réalisation, le montage, la prise de vue ou le son, en société de production, en chaîne ou en agence. Diplômes souvent préparés : BTS Métiers de l'audiovisuel, BUT MMI, écoles de cinéma et d'audiovisuel." },
  { slug: "culture", label: "culture", domain: "dans la culture", pattern: /\bcultur(e\b|elle)|spectacle|musee|patrimoine|bibliothe|mediathe|\bedition|librair|galerie|artisti/, about: "Dans la culture, les missions vont de la médiation et de l'accueil des publics à la billetterie, à la production de spectacles et à la communication d'un lieu culturel (musée, théâtre, festival). Diplômes souvent préparés : licence pro et master des métiers de la culture et de la médiation." },
  { slug: "rh", label: "RH", domain: "en RH", pattern: /\brh\b|ressources humaines|recrut|talent|\bpaie\b|charge(e)? de formation|\bhrbp\b|\bgrh\b/, about: "Les postes RH ouverts aux alternants et aux stagiaires vont de l'assistant RH (administration du personnel, paie, recrutement) au chargé de recrutement ou de formation. Ils se préparent souvent en BTS SAM ou GPME, en licence pro ou en bachelor RH, en master RH, ou avec le titre professionnel de gestionnaire de paie." },
  { slug: "controle-de-gestion", label: "contrôle de gestion", domain: "en contrôle de gestion", pattern: /controle(ur|use)? de gestion|controleu(r|se) gestion|fp&a/, about: "En contrôle de gestion, un alternant ou un stagiaire suit les budgets, les tableaux de bord et les coûts, et prépare les analyses pour la direction. Diplômes souvent préparés : DCG, master Comptabilité-contrôle-audit (CCA), master contrôle de gestion ou école de commerce." },
  { slug: "comptabilite", label: "comptabilité", domain: "en comptabilité", pattern: /compta|expert.?comptable/, about: "En comptabilité, un alternant ou un stagiaire tient la comptabilité courante (saisie, rapprochements, factures), prépare les déclarations et participe aux clôtures, en entreprise ou en cabinet d'expertise comptable. Diplômes souvent préparés : BTS CG, DCG (bac+3), DSCG (bac+5), licence pro ou titres professionnels du secteur." },
  { slug: "audit", label: "audit", domain: "en audit", pattern: /\baudit/, about: "En audit, un alternant ou un stagiaire travaille en cabinet sur les comptes des clients (audit financier) ou en entreprise sur ses procédures (audit interne), souvent avec des pics d'activité de janvier à avril. Diplômes souvent préparés : DCG, master Comptabilité-contrôle-audit (CCA), DSCG, école de commerce." },
  { slug: "assurance", label: "assurance", domain: "dans l'assurance", pattern: /assuran|souscripteu|sinistre|actuari/, about: "Dans l'assurance, les postes ouverts en alternance sont surtout chargé de clientèle, conseiller en agence et gestionnaire de sinistres ou de contrats. Diplômes souvent préparés : BTS Assurance, licence pro ou master banque-assurance." },
  { slug: "banque", label: "banque", domain: "dans la banque", pattern: /banque|bancaire|conseill(er|ere) (de )?clientele|conseill(er|ere) financi|patrimoin/, about: "Dans la banque, les alternants et les stagiaires occupent surtout des postes de chargé d'accueil puis de conseiller de clientèle (particuliers ou professionnels) en agence. Diplômes souvent préparés : BTS Banque, licence pro banque-assurance, bachelor ou master en banque et finance." },
  { slug: "relation-client", label: "relation client", domain: "en relation client", pattern: /relation client|charge(e)? de clientele|teleconseil|conseill(er|ere) client|service client|customer (success|service|care|experience)|teleact|centre (d.appels?|de contacts?)|televente|hotline/, about: "En relation client, un alternant conseille les clients par téléphone, par chat ou par mail, traite leurs demandes et leurs réclamations, parfois en vendant aussi. Diplômes souvent préparés : titre professionnel de conseiller relation client à distance, BTS NDRC." },
  { slug: "finance", label: "finance", domain: "en finance", pattern: /financ|tresor|fiscal|analyste credit|credit analyst/, about: "En finance, alternants et stagiaires travaillent en trésorerie, en analyse financière, en audit ou en banque d'investissement, surtout au niveau master. Diplômes souvent préparés : licence et master de finance, école de commerce, DCG puis DSCG pour la filière expertise." },
  { slug: "immobilier", label: "immobilier", domain: "dans l'immobilier", pattern: /immobili|negociat(eur|rice) immo|syndic|gestionnaire locati|property/, about: "Dans l'immobilier, alternants et stagiaires travaillent comme négociateur, gestionnaire locatif ou assistant de copropriété, en agence ou chez un administrateur de biens. Diplômes souvent préparés : BTS Professions immobilières, licence pro ou master immobilier. Attention : une annonce de « conseiller immobilier indépendant » propose en général un statut d'agent commercial, pas un contrat d'alternance." },
  { slug: "juridique", label: "juridique", domain: "en droit", pattern: /jurid|juriste|\bdroit\b|avocat|notari|paralegal|compliance|conformite|notaire|clerc/, about: "Dans le juridique, les missions vont de l'assistanat juridique (contrats, secrétariat juridique, recherches) au poste de juriste junior en entreprise, en cabinet ou en étude notariale. Diplômes souvent préparés : BTS Collaborateur juriste notarial, BUT Carrières juridiques, licence ou master en droit." },
  { slug: "affaires-publiques", label: "affaires publiques", domain: "dans les affaires publiques", pattern: /affaires publiques|politiques? publiques?|parlementaire|relations internationales|collectivit|fonction publique|administration publique|lobby|plaidoyer|\bong\b|humanitaire|cooperation internationale/, about: "Dans les affaires publiques, les alternants assistent des chargés de mission en collectivité, en administration, en association ou dans les relations institutionnelles d'une entreprise. Les employeurs publics recrutent aussi des apprentis : le détail est dans notre guide sur l'alternance dans la fonction publique." },
  { slug: "achats", label: "achats", domain: "dans les achats", pattern: /achat|acheteu|approvisionn|procurement|sourcing|purchas/, about: "Aux achats, un alternant ou un stagiaire assiste les acheteurs : consultation des fournisseurs, comparaison des offres, suivi des commandes et des stocks (approvisionnement). Diplômes souvent préparés : BUT Techniques de commercialisation ou GEA, licence pro, bachelor ou master achats et supply chain." },
  { slug: "commerce-international", label: "commerce international", domain: "en commerce international", pattern: /commerce international|\bexport|\bimport(?!an)|international trade|douane|transitaire|agent de transit\b/, about: "En commerce international, les missions portent sur l'import-export : suivi des commandes et des transports, documents douaniers, relation avec les clients et fournisseurs étrangers, souvent en anglais. Diplômes souvent préparés : BTS Commerce international, BUT Techniques de commercialisation, master commerce international." },
  { slug: "transport", label: "transport et conduite", domain: "dans le transport", pattern: /chauffeu|conduct(eur|rice) (routier|poids lourds?|de bus|d.autocar|spl|de car|de train|de tramway|de metro|d.engins?)|livreu|agent d.escale|steward|hote(sse)? de l.air|pilote (de ligne(?! de production)|d.avion)|ferroviaire/, about: "Dans le transport et la conduite, l'alternance permet de passer ses permis poids lourd ou transport en commun tout en étant payé : conducteur routier, chauffeur de bus ou de car, livreur. Diplômes souvent préparés : titres professionnels de conducteur du transport routier de marchandises ou de conducteur de transport en commun sur route, BTS GTLA pour l'exploitation." },
  { slug: "logistique", label: "logistique", domain: "en logistique", pattern: /logisti|supply|magasini|entrepot|preparat(eur|rice) de commandes|cariste|transport|flux|\bfacteur\b|\bfactrice\b|distribution (du |de )?courrier/, about: "En logistique, les postes vont de magasinier et préparateur de commandes à gestionnaire de stocks, approvisionneur ou assistant supply chain. Diplômes souvent préparés : titres professionnels du secteur (agent magasinier, technicien en logistique d'entreposage), BTS GTLA, BUT QLIO, licence pro ou master supply chain." },
  { slug: "qualite", label: "qualité", domain: "en qualité", pattern: /qualite|\bqhse\b|\bhse\b|\bqse\b/, about: "En qualité, un alternant ou un stagiaire suit les procédures, mène des audits internes, traite les non-conformités et prépare les certifications (ISO), souvent avec un volet hygiène, sécurité et environnement (QHSE). Diplômes souvent préparés : BUT QLIO ou Hygiène, sécurité, environnement, licence pro, master qualité." },
  { slug: "environnement", label: "environnement et RSE", domain: "dans l'environnement et la RSE", pattern: /environnement(al)?(?! de (qualification|test|developpement|travail|stimulation|simulation|production))|developpement durable|\brse\b|\besg\b|transition (ecologique|energetique)|energies? renouvelable|photovolta|eolien|biodiversit|ecolog|dechet|recyclage|climat(?!is|icien)|bilan carbone|decarbon/, about: "Dans l'environnement, les postes vont du technicien de l'eau, des déchets ou de l'énergie au chargé de mission environnement ou RSE en entreprise ou en collectivité. Diplômes souvent préparés : BTS Métiers de l'eau, BTS Gestion et protection de la nature, BUT Hygiène, sécurité, environnement, master environnement." },
  { slug: "chef-de-projet", label: "chef de projet", domain: "de chef de projet", pattern: /chef(fe)? de projet|project manager|\bpmo\b|product owner|product manager|scrum/, about: "Un assistant chef de projet en alternance ou en stage suit le planning, le budget et la coordination d'un projet (digital, industriel, événementiel), entre l'équipe et le client. Ces postes sont surtout ouverts au niveau bac+3 à bac+5 : bachelor, master ou école d'ingénieurs ou de commerce." },
  { slug: "informatique", label: "informatique", domain: "en informatique", pattern: /reseau|systemes? (et|&) reseaux|admin(istrateur)? sys|technicien (informatique|support|helpdesk)|support (informatique|it|utilisateur)|helpdesk|infrastructure|cloud|informatique/, about: "En informatique (hors développement), les missions vont du support aux utilisateurs à l'administration de systèmes, de réseaux et du cloud. Diplômes souvent préparés : BTS SIO option SISR, BUT Informatique ou Réseaux et télécommunications, titre professionnel de technicien supérieur systèmes et réseaux, licence pro ou master." },
  { slug: "architecture", label: "architecture", domain: "en architecture", pattern: /urbanis|amenagement du territoire|architecte d.interieur|architecture(?! (logicielle|si|des systemes|cloud|data|reseaux?|technique|applicative|d.entreprise|logiciel))|\barchitecte\b(?! (si|logiciel|solutions?|cloud|data|reseaux?|systemes?|it|technique|applicati|infra|securite|fonctionnel|d.entreprise))|amenagement interieur|decorat(eur|rice) d.interieur/, about: "En architecture et en conception du bâtiment, alternants et stagiaires dessinent des plans, montent des maquettes numériques (BIM) et préparent les dossiers, en agence ou en bureau d'études. Diplômes souvent préparés : BTS Bâtiment ou Études et économie de la construction, licence pro BIM, écoles d'architecture pour les stages." },
  { slug: "plombier", label: "plombier chauffagiste", domain: "de plombier chauffagiste", pattern: /plomb|chauffagist|installat(eur|ion) sanitaire|monteu(r|se) (en installation sanitaire|sanitaire|thermique)/, about: "Un apprenti plombier installe et répare les réseaux d'eau, les sanitaires et souvent le chauffage, chez des particuliers ou sur des chantiers. Diplômes souvent préparés : CAP Monteur en installations sanitaires ou thermiques, brevet professionnel du génie climatique et sanitaire, bac pro Installateur en chauffage, climatisation et énergies renouvelables." },
  { slug: "menuiserie", label: "menuisier", domain: "de menuisier", pattern: /menuis|ebenist|charpent|agenceu/, about: "En menuiserie, l'apprenti fabrique en atelier ou pose sur chantier des fenêtres, portes, escaliers, meubles et agencements. Diplômes souvent préparés : CAP Menuisier fabricant ou Menuisier installateur, brevet professionnel Menuisier, bac pro Technicien menuisier agenceur." },
  { slug: "artisan-batiment", label: "artisan du bâtiment", domain: "dans l'artisanat du bâtiment", pattern: /\bmacon|carreleu|plaquist|platri|couvreu|peintre (en )?batiment|peintre decorat|solier|facadi|etancheu|zingu|staffeu|tailleur de pierre/, about: "Les métiers artisanaux du bâtiment (maçon, peintre, plaquiste, carreleur, couvreur) s'apprennent surtout en apprentissage, aux côtés d'un artisan. Diplômes souvent préparés : CAP du métier (Maçon, Peintre applicateur de revêtements, Plâtrier-plaquiste, Carreleur mosaïste, Couvreur), puis brevet professionnel." },
  { slug: "paysagiste", label: "paysagiste", domain: "de paysagiste", pattern: /paysag|jardin|espaces? verts|elagu/, about: "Un apprenti paysagiste crée et entretient des jardins et des espaces verts : plantations, tonte, taille, petite maçonnerie paysagère. Diplômes souvent préparés : CAPa Jardinier paysagiste, bac pro Aménagements paysagers, BTSA Aménagements paysagers." },
  { slug: "agriculture", label: "agriculture", domain: "dans l'agriculture", pattern: /agricol|agricult|viticul|vigne|vendang|elevage|eleveu|maraich|horticul|arboricul|palefreni|equin|aquacult|viticole/, about: "En agriculture, les apprentis travaillent sur une exploitation (élevage, grandes cultures, maraîchage, vigne) ou dans une entreprise du secteur. Diplômes souvent préparés : CAPa Métiers de l'agriculture, bac pro Conduite et gestion de l'entreprise agricole (CGEA), BTSA ACSE ou Viticulture-œnologie." },
  { slug: "btp", label: "BTP", domain: "dans le BTP", pattern: /conduct(eur|rice) de travaux|chantier|\bbtp\b|genie civil|batiment|metreu|economiste de la construction|geometre|topograph|coffreu|bancheu|canalisat|terrassi/, about: "Dans le BTP, les alternants vont des métiers de chantier (maçon, coffreur, canalisateur) aux postes de technicien et d'assistant conducteur de travaux. Diplômes souvent préparés : CAP et bac pro du bâtiment et des travaux publics, BTS Bâtiment ou Travaux publics, BUT Génie civil - construction durable, licence pro ou école d'ingénieurs." },
  { slug: "electricien", label: "électricien", domain: "d'électricien", pattern: /electrici|electrotech/, about: "Un électricien en alternance installe et raccorde des réseaux électriques dans des logements, des bâtiments tertiaires ou des sites industriels, aux côtés d'un ouvrier qualifié. Diplômes souvent préparés : CAP Électricien, bac pro MELEC (métiers de l'électricité et de ses environnements connectés), BTS Électrotechnique." },
  { slug: "mecanique-auto", label: "mécanique auto", domain: "en mécanique auto", pattern: /automobile|mecanicien auto|carross|vehicule|poids lourd|garage/, about: "En mécanique automobile, l'apprenti entretient et répare des véhicules en garage, en concession ou en centre auto : vidanges, freins, diagnostic électronique. Diplômes souvent préparés : CAP, bac pro et BTS Maintenance des véhicules." },
  { slug: "maintenance", label: "maintenance", domain: "en maintenance", pattern: /maintenan|mecanicien|automatis|frigori|\bcvc\b|plombi|chauffag|climatis|climaticien/, about: "En maintenance, un alternant dépanne, entretient et améliore des équipements industriels, des bâtiments ou des réseaux, souvent en horaires d'équipe. Diplômes souvent préparés : bac pro MSPC (maintenance des systèmes de production connectés), BTS Maintenance des systèmes, BTS Électrotechnique, BUT Génie industriel et maintenance." },
  { slug: "production", label: "production industrielle", domain: "en production industrielle", pattern: /production|usine|operat(eur|rice)|conduct(eur|rice) de ligne|industrialisation|fabrication|usinage|soudeu|chaudronn|tourneu|fraiseu|commande numerique|serrurier|metallier|technicien(ne)? (methodes|industrialisation)|plasturg|imprimeu|conditionnement/, about: "En production industrielle, les postes vont d'opérateur et de conducteur de ligne à technicien méthodes ou qualité, dans l'agroalimentaire, l'automobile, l'aéronautique ou la chimie. Diplômes souvent préparés : bac pro Pilote de ligne de production, BTS CRSA ou Pilotage de procédés, BUT Génie mécanique et productique, école d'ingénieurs." },
  { slug: "ingenieur", label: "ingénieur", domain: "d'ingénieur", pattern: /ingenieu|engineer|r&d|recherche et developpement|bureau d.etudes|projeteu|\bcao\b/, about: "Beaucoup d'écoles d'ingénieurs proposent un cursus en apprentissage : 3 ans après un bac+2, avec le même diplôme d'ingénieur qu'en formation classique et un salaire pendant toute la formation. Les stages d'ingénieur, eux, se font surtout en 2e et 3e année d'école." },
  { slug: "laboratoire", label: "laboratoire et sciences", domain: "en laboratoire", pattern: /laborato|chimi|biolog|biotech|microbio|biochim|formulation/, about: "En laboratoire, un technicien en alternance ou en stage réalise des analyses, des contrôles qualité ou des essais de recherche, dans la santé, l'agroalimentaire, la chimie ou la cosmétique. Diplômes souvent préparés : BTS Bioanalyses et contrôles, BTS Métiers de la chimie, BUT Génie biologique ou Chimie." },
  { slug: "boucherie", label: "boucher", domain: "en boucherie, charcuterie et poissonnerie", pattern: /boucher|charcut|poissonn|fromag|ecaill/, about: "En boucherie, l'apprenti découpe, prépare et vend les viandes, en boucherie artisanale ou au rayon d'une grande surface, où les débouchés sont nombreux. Diplômes souvent préparés : CAP Boucher, brevet professionnel Boucher, CAP Charcutier-traiteur." },
  { slug: "boulangerie-patisserie", label: "boulangerie-pâtisserie", domain: "en boulangerie-pâtisserie", pattern: /boulang|patissi|chocolat/, about: "En boulangerie-pâtisserie, l'apprentissage est la voie classique : l'apprenti fabrique le pain, les viennoiseries ou les pâtisseries aux côtés d'un artisan, avec des horaires qui commencent tôt. Diplômes souvent préparés : CAP Boulanger, CAP Pâtissier, puis brevet professionnel Boulanger ou brevet technique des métiers Pâtissier." },
  { slug: "tourisme", label: "tourisme", domain: "dans le tourisme", pattern: /touris|agen(t|ce) de voyages?|conseill(er|ere) (en |de )?voyages?|forfaitiste|billetterie|receptif|office de tourisme|animat(eur|rice) (de )?(club|camping|village)/, about: "Dans le tourisme, les postes vont de conseiller voyage en agence à agent d'accueil en office de tourisme, en camping ou en hôtel, souvent avec l'anglais au quotidien. Diplômes souvent préparés : BTS Tourisme, licence pro ou bachelor tourisme." },
  { slug: "hotellerie-restauration", label: "hôtellerie-restauration", domain: "en hôtellerie-restauration", pattern: /cuisin|commis|serveu|restaura|hotel|receptionniste|barman|barista|traiteur|chef de rang|pizza|crepi|plonge|restauration rapide|fast.?food|brasserie|sommelie|gouvernant|femme de chambre|valet|concierge|room service|employee? d.etage/, about: "En hôtellerie-restauration, apprentis et stagiaires travaillent en cuisine (commis), en salle (serveur, chef de rang) ou à la réception. Diplômes souvent préparés : CAP Cuisine ou Commercialisation et services en HCR, bac pro, brevet professionnel, BTS Management en hôtellerie-restauration." },
  { slug: "coiffure-esthetique", label: "coiffure et esthétique", domain: "en coiffure et esthétique", pattern: /coiff|esthetic|onglerie|maquill|barbier|ongl|\bnail|cosmet|\bspa\b|soins? esthetique|ongul/, about: "En coiffure et en esthétique, l'apprentissage se fait en salon ou en institut, avec très vite de vrais clients. Diplômes souvent préparés : CAP Métiers de la coiffure puis brevet professionnel Coiffure, CAP Esthétique cosmétique parfumerie, BP Esthétique, BTS Métiers de l'esthétique-cosmétique-parfumerie." },
  { slug: "mode-textile", label: "mode et textile", domain: "dans la mode et le textile", pattern: /coutur|textile|\bmode\b|stylis|modelis|retouch(eur|euse|e)\b(?! photo)|cordonni|maroquin|tailleu(r|se)(?! de pierre)|pret.a.porter|habillement/, about: "Dans la mode et le textile, les missions vont de la couture et de la retouche à la vente en boutique et à l'assistanat de chef de produit ou de styliste. Diplômes souvent préparés : CAP Métiers de la mode, bac pro Métiers de la couture et de la confection, BTS Métiers de la mode, DN MADE mode." },
  { slug: "fleuriste", label: "fleuriste", domain: "de fleuriste", pattern: /fleurist|art floral/, about: "Un apprenti fleuriste prépare les compositions et les bouquets, conseille les clients et entretient les fleurs en boutique, avec des pics à la Saint-Valentin, à la fête des mères et à la Toussaint. Diplômes souvent préparés : CAP Fleuriste, brevet professionnel Fleuriste, brevet technique des métiers Fleuriste." },
  { slug: "animalier", label: "métiers animaliers", domain: "auprès des animaux", pattern: /veterinai|toilett|animal|animaux|soigneu|\basv\b|canin|felin/, about: "Dans les métiers animaliers, les alternants travaillent comme auxiliaire en clinique vétérinaire, vendeur en animalerie, toiletteur ou soigneur. Diplômes et titres souvent préparés : titre d'auxiliaire spécialisé vétérinaire (ASV), bac pro Technicien conseil vente en animalerie, CAPa Palefrenier soigneur pour les chevaux." },
  { slug: "proprete", label: "propreté", domain: "dans la propreté", pattern: /proprete|nettoyage|agent d.entretien|agent de service|\bmenage|laveu|hygiene des locaux/, about: "Dans la propreté, les alternants entretiennent des bureaux, des locaux, des hôpitaux ou des sites industriels, avec des machines et des protocoles d'hygiène précis, et évoluent vers des postes de chef d'équipe. Diplômes souvent préparés : CAP Agent de propreté et d'hygiène, bac pro Hygiène, propreté, stérilisation." },
  // Avant "santé" et "social" (le premier qui correspond gagne) : métiers
  // recherchés en tant que tels ("alternance aide soignante", "cap aepe
  // alternance", "éducateur spécialisé apprentissage" dans Search Console).
  { slug: "aide-soignant", label: "aide-soignant", domain: "d'aide-soignant", pattern: /aide.?soignant/, about: "Le diplôme d'État d'aide-soignant (DEAS) se prépare aussi en apprentissage : l'apprenti est salarié d'un hôpital, d'une clinique ou d'un EHPAD et alterne avec l'institut de formation. Le détail des étapes et des aides est dans notre guide dédié." },
  { slug: "petite-enfance", label: "petite enfance", domain: "dans la petite enfance", pattern: /petite enfance|puericult|\baepe\b|\bcreche|micro.?creche|educat(eur|rice)s? de jeunes enfants|\beje\b/, about: "En petite enfance, alternants et stagiaires travaillent en crèche, en micro-crèche, en centre de loisirs ou à l'école maternelle, auprès d'enfants de moins de 6 ans. Diplômes souvent préparés : CAP Accompagnant éducatif petite enfance (AEPE), diplôme d'État d'auxiliaire de puériculture, diplôme d'État d'éducateur de jeunes enfants." },
  { slug: "educateur-specialise", label: "éducateur spécialisé", domain: "d'éducateur spécialisé", pattern: /educat(eur|rice)s? specialise|moniteur.?educat/, about: "Le diplôme d'État d'éducateur spécialisé (DEES, niveau bac+3) se prépare en 3 ans, aussi en apprentissage, dans un établissement ou un service social ou médico-social. Le détail est dans notre guide dédié." },
  { slug: "sante", label: "santé", domain: "dans la santé", pattern: /pharmac|dentaire|medical|infirmi|aide.?soignant|opticien|laborantin|\bsante\b|ambulanci|kine|dieteti|psychomot|orthophon|ergotherap|psycholog|orthopt|radiolog|manipulat(eur|rice) (en )?(electro|radio)|osteo|podolog|audioprothes|preparat(eur|rice) en pharmacie|sterilisation/, about: "Dans la santé, les postes ouverts en alternance vont de l'aide-soignant et de l'auxiliaire de puériculture au préparateur en pharmacie, à l'opticien et au secrétaire médical. Diplômes souvent préparés : DEAS, DEAP, DEUST de préparateur en pharmacie, BTS Opticien-lunetier, titre professionnel de secrétaire assistant médico-administratif." },
  { slug: "social", label: "social et éducation", domain: "dans le social et l'éducation", pattern: /educat|animat|petite enfance|puericult|\baesh\b|travail social|accompagnant|auxiliaire de vie|aide a domicile|services? a la personne|insertion|professeu|enseignan|formateu|surveillant|\batsem\b|assistant(e)? maternel|moniteu|assistante? de vie|\badvf\b|accompagnat(eur|rice)s? (de |des )?personnes?/, about: "Dans le social et l'éducation, alternants et stagiaires accompagnent des personnes âgées, en situation de handicap ou en difficulté, à domicile ou en établissement, ou encadrent des enfants et des jeunes. Diplômes souvent préparés : titre professionnel d'assistant de vie aux familles (ADVF), DEAES, diplôme d'État de moniteur-éducateur ou d'éducateur spécialisé, BTS SP3S." },
  { slug: "vente", label: "vente", domain: "dans la vente", pattern: /vendeu|conseill(er|ere) de vente|conseill(er|ere) vente|magasin|boutique|retail|caissi|employe(e)? (de commerce|polyvalent)|equipier|(hote|hotesse|employe|employee|agent)s? de caisse|libre.?service|rayon|\bdrive\b|employe(e)? commercia|grande distribution|hypermarche|supermarche|merchandis|assistante? manager|manager (de |d.)?(rayon|magasin|boutique|unite marchande)|unite marchande/, about: "Dans la vente, un alternant ou un stagiaire conseille les clients en magasin, encaisse, met en rayon et participe à l'animation du point de vente, avec souvent des responsabilités d'adjoint au bout d'un an ou deux. Diplômes souvent préparés : CAP ou bac pro des métiers du commerce, BTS MCO, bachelor responsable de distribution." },
  { slug: "commercial", label: "commercial", domain: "de commercial", pattern: /commerci|business develop|bizdev|\bsales\b|account (manager|executive)|charge(e)? d.affaires|key account|\bkam\b|administration des ventes|\badv\b|prospect/, about: "Un commercial en alternance ou en stage prospecte de nouveaux clients, suit un portefeuille et négocie les ventes, en face à face ou à distance (business developer, chargé d'affaires, technico-commercial). Diplômes souvent préparés : BTS NDRC ou CCST, BUT Techniques de commercialisation, bachelor ou master commerce." },
  { slug: "assistant-administratif", label: "assistant administratif", domain: "d'assistant administratif", pattern: /assistant(e)? (de direction|administrati|de gestion|polyvalent|office)|office manager|secretai|administrati|standardiste|hote(sse)? d.accueil|assistanat|agent d.accueil|charge(e)? d.accueil|assistante? d.agence/, about: "Un assistant administratif en alternance ou en stage gère l'accueil, le courrier, les plannings, la saisie et le suivi des dossiers, souvent dans une PME où il touche à tout. Diplômes souvent préparés : bac pro AGOrA, BTS SAM ou GPME, titre professionnel de secrétaire assistant ou d'assistant de direction." },
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
    slug: "advf",
    label: "titre pro ADVF",
    domain: "en titre pro ADVF",
    pattern: /\badvf\b|assistante? de vie aux familles/,
    about: "Le titre professionnel ADVF (assistant de vie aux familles) est une certification de niveau 3 (niveau CAP) du ministère du Travail. Il forme à l'accompagnement à domicile des personnes âgées ou handicapées et à la garde d'enfants, et se prépare souvent en alternance.",
  },
  {
    slug: "bp",
    label: "BP",
    domain: "en BP",
    pattern: /\bbp\b|brevet professionnel/,
    about: "Le BP (brevet professionnel) est un diplôme de niveau 4 (niveau bac) qui se prépare en 2 ans en alternance, en général après un CAP, dans les métiers de l'artisanat et des services : coiffure, boulangerie, boucherie, esthétique, fleuriste...",
  },
  {
    slug: "cqp",
    label: "CQP",
    domain: "en CQP",
    pattern: /\bcqp\b|certificat de qualification professionnelle/,
    about: "Le CQP (certificat de qualification professionnelle) est créé par une branche professionnelle pour attester d'un savoir-faire précis. Il se prépare le plus souvent en contrat de professionnalisation.",
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
