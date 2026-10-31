// Voix de chaque métier pour les lettres sur mesure (31/10, Nathan : « la
// lettre […] était ultra générique […] régénère des templates ultra bien
// adaptés »). Pour chacun des 60 métiers du site :
// - hooks : deux accroches concrètes, à la première personne, en plus de
//   `motive` (metierPacks.ts) : trois débuts de lettre différents par métier ;
// - early : ce qu'un débutant prend en main dès les premières semaines ;
// - proof : ce que l'étudiant doit raconter (entre crochets dans la lettre),
//   avec des exemples propres au métier ;
// - closing : une proposition concrète pour la suite, propre au métier.
// Écriture neutre (aucun accord au masculin ou au féminin), rien
// d'affirmé sur le parcours de l'étudiant : `hooks`, `early` et `closing`
// parlent d'envie et de métier, jamais d'expériences passées.

export type MetierVoice = {
  hooks: [string, string];
  early: string;
  proof: string;
  closing: string;
};

const v = (hooks: [string, string], early: string, proof: string, closing: string): MetierVoice => ({ hooks, early, proof, closing });

export const DEFAULT_VOICE: MetierVoice = v(
  [
    "J'apprends beaucoup mieux en faisant qu'en écoutant, et c'est ce que je viens chercher chez vous.",
    "Je cherche une équipe qui me confie de vraies tâches dès le départ, pour apprendre le métier en le pratiquant.",
  ],
  "prendre en charge les tâches que vous me confierez, poser les bonnes questions et monter en autonomie semaine après semaine",
  "une expérience où tu as appris vite ou pris une responsabilité : un job, un stage, un projet de cours, du bénévolat, un sport en club…",
  "Je peux vous rencontrer quand cela vous arrange, en visio ou sur place.",
);

export const METIER_VOICES: Record<string, MetierVoice> = {
  cybersecurite: v(
    [
      "Ce qui me plaît en cybersécurité, c'est d'avoir un coup d'avance : comprendre une attaque avant qu'elle ne fasse des dégâts.",
      "Une seule faille peut arrêter toute une entreprise ; c'est pour éviter ça que je veux faire ce métier.",
    ],
    "surveiller les alertes, documenter les incidents et participer aux contrôles d'accès et aux mises à jour de sécurité",
    "un challenge ou un projet de sécurité : CTF, Root-Me, TryHackMe, un réseau ou un serveur que tu as configuré, un projet de cours",
    "Je peux vous montrer, lors d'un échange, comment j'aborde l'analyse d'une alerte.",
  ),
  securite: v(
    [
      "Je veux un métier où l'on compte sur moi pour que tout se passe bien, pour le public comme pour l'équipe.",
      "Garder son calme quand la situation se tend, c'est ce qui m'attire dans les métiers de la sécurité.",
    ],
    "assurer les rondes, contrôler les accès et rédiger les rapports de main courante",
    "une situation où tu as gardé ton calme ou fait respecter une règle : encadrement d'un événement, sport, job d'accueil, bénévolat, formation SST",
    "Je peux venir sur site pour un entretien, au créneau qui vous convient.",
  ),
  data: v(
    [
      "J'aime le moment où un tableau de chiffres sans intérêt devient une réponse claire à une vraie question.",
      "Je préfère décider avec des données qu'avec des impressions, et je veux en faire mon métier.",
    ],
    "nettoyer et préparer les données, construire des tableaux de bord et répondre aux demandes d'analyse de l'équipe",
    "un projet d'analyse : un notebook Python, un tableau de bord Power BI, une étude de cours, un jeu de données que tu as exploré",
    "Je peux vous présenter ma façon de travailler sur des données lors d'un entretien.",
  ),
  developpeur: v(
    [
      "Ce qui me plaît dans le développement, c'est de transformer un besoin concret en fonctionnalité que de vraies personnes utilisent.",
      "Je veux apprendre à coder proprement, dans une vraie équipe, avec des revues de code et de vrais utilisateurs.",
    ],
    "corriger des bugs, écrire des tests et prendre en charge de petites fonctionnalités, avec des revues de code de l'équipe",
    "un projet que tu as codé : site, application, bot, projet de cours ou personnel, avec le lien GitHub si tu en as un",
    "Je peux vous montrer ma façon de coder lors d'un entretien technique.",
  ),
  design: v(
    [
      "Je pense qu'un bon visuel se juge à une seule chose : est-ce qu'il fait passer le message du premier coup ?",
      "Ce que j'aime dans le design, c'est partir d'un besoin flou et arriver à une image ou un écran qui paraît évident.",
    ],
    "décliner des visuels existants, préparer des maquettes et adapter des supports aux différents formats",
    "un projet visuel : affiche, identité, maquette d'application, refonte d'un site, avec le lien de ton portfolio",
    "Je peux vous présenter mon travail et mes choix graphiques lors d'un entretien.",
  ),
  "community-manager": v(
    [
      "J'aime analyser pourquoi une publication marche et pas une autre, et je veux en faire mon métier.",
      "Ce qui me plaît, c'est de faire vivre une marque au quotidien et de discuter vraiment avec sa communauté.",
    ],
    "préparer le calendrier éditorial, créer des visuels et des vidéos courtes, répondre aux commentaires et suivre les statistiques",
    "un compte que tu as animé (association, club, projet perso, page d'un commerce) : ce que tu y publiais et les résultats obtenus",
    "Je peux vous proposer quelques idées de contenus pour vos réseaux lors d'un entretien.",
  ),
  "e-commerce": v(
    [
      "Ce qui me plaît dans le e-commerce, c'est qu'on voit tout de suite si un changement sur le site fait vendre plus ou moins.",
      "J'aime l'idée qu'une boutique en ligne se travaille comme un vrai magasin : vitrine, rayons, conseil, service après-vente.",
    ],
    "mettre en ligne les produits, rédiger les fiches, suivre les commandes et préparer les opérations commerciales",
    "un projet en ligne : une boutique Shopify ou Vinted, un site d'association, une vente que tu as organisée, une étude de cours",
    "Je peux vous partager lors d'un entretien les pistes que je vois pour votre boutique en ligne.",
  ),
  marketing: v(
    [
      "Ce qui m'intéresse dans le marketing, c'est de comprendre pourquoi les gens choisissent un produit plutôt qu'un autre.",
      "J'aime le côté concret du marketing : on lance une action, on mesure, on ajuste.",
    ],
    "préparer des campagnes, suivre les indicateurs, réaliser des études de marché et aider à la création des contenus",
    "un projet marketing : étude de marché de cours, campagne pour une association, lancement d'un compte, enquête que tu as menée",
    "Je peux vous rencontrer pour parler de vos prochaines campagnes.",
  ),
  communication: v(
    [
      "Je crois qu'un message bien construit change la façon dont on perçoit une entreprise, et c'est ce travail qui m'attire.",
      "Ce qui me plaît en communication, c'est de passer d'un sujet compliqué à un message que tout le monde comprend.",
    ],
    "rédiger des contenus, préparer des supports, aider à l'organisation d'événements et tenir à jour le site et les réseaux",
    "un projet de communication : journal d'école, événement, affiche, vidéo, réseaux d'une association, ce que tu as écrit ou créé",
    "Je peux vous rencontrer pour échanger sur vos projets de communication.",
  ),
  audiovisuel: v(
    [
      "Ce qui m'attire dans l'audiovisuel, c'est de raconter une histoire en images, avec les exigences d'une vraie production.",
      "Ce qui me plaît dans l'audiovisuel, c'est qu'une bonne image et un bon son se remarquent à peine, alors qu'un mauvais se voit tout de suite.",
    ],
    "préparer le matériel, assister sur les tournages, dérusher et monter des premières versions",
    "une vidéo que tu as réalisée : court-métrage, clip, vidéo d'association, contenu pour les réseaux, avec un lien si possible",
    "Je peux vous rencontrer pour parler de vos prochains tournages.",
  ),
  culture: v(
    [
      "Je veux faire partie de ceux qui font venir le public, et pas seulement de ceux qui y assistent.",
      "Ce qui m'attire dans la culture, c'est de rendre accessible une œuvre ou un lieu à des gens qui n'y seraient pas venus seuls.",
    ],
    "accueillir les publics, gérer la billetterie, aider à l'organisation des événements et à leur communication",
    "un engagement culturel : bénévolat dans un festival, association, médiathèque, visite que tu as animée, projet artistique",
    "Je peux passer découvrir votre lieu et vous rencontrer au moment qui vous arrange.",
  ),
  rh: v(
    [
      "Ce qui m'attire dans les RH, c'est que chaque décision concerne directement des personnes et leur quotidien au travail.",
      "Un bon recrutement change tout pour une équipe ; c'est ce travail-là que je veux apprendre.",
    ],
    "rédiger et diffuser les offres, trier les candidatures, préparer les dossiers d'arrivée et suivre l'administration du personnel",
    "une expérience où tu as accompagné ou organisé des personnes : délégué de classe, association, tutorat, job d'été en équipe",
    "Je peux vous rencontrer pour échanger sur vos besoins en recrutement et en administration du personnel.",
  ),
  "controle-de-gestion": v(
    [
      "J'aime comprendre ce qui se cache derrière un chiffre et pourquoi il s'écarte de ce qui était prévu.",
      "Ce qui me plaît dans le contrôle de gestion, c'est d'aider les équipes à décider avec des chiffres fiables.",
    ],
    "mettre à jour les tableaux de bord, préparer les reportings mensuels et analyser les écarts entre budget et réalisé",
    "un projet chiffré : un fichier Excel que tu as construit, une étude de coûts, un budget d'association, un cas de cours",
    "Je peux vous rencontrer pour échanger sur vos tableaux de bord et vos reportings.",
  ),
  comptabilite: v(
    [
      "J'aime quand les comptes tombent juste, et je sais que ce métier demande autant de rigueur que de méthode.",
      "Ce qui me plaît en comptabilité, c'est que chaque écriture raconte une partie de la vie de l'entreprise.",
    ],
    "saisir les pièces, préparer les rapprochements bancaires, suivre les factures fournisseurs et aider aux déclarations",
    "une expérience de rigueur avec des chiffres : trésorerie d'association, caisse, gestion d'un budget, logiciel comptable vu en cours",
    "Je peux vous rencontrer au cabinet ou en visio, au moment qui vous convient.",
  ),
  audit: v(
    [
      "Ce qui m'attire dans l'audit, c'est de découvrir une nouvelle entreprise à chaque mission et de comprendre comment elle fonctionne vraiment.",
      "Vérifier, questionner, comprendre : c'est la partie du métier qui me plaît le plus.",
    ],
    "préparer les dossiers, réaliser des tests sur les comptes, analyser des procédures et rédiger les premières synthèses",
    "un travail d'analyse : un cas d'audit en cours, un mémoire, un contrôle que tu as mené, une étude que tu as synthétisée",
    "Je peux vous rencontrer pour échanger sur vos missions et sur la manière dont vous intégrez vos alternants.",
  ),
  assurance: v(
    [
      "Les gens prennent une assurance pour être tranquilles ; je veux être la personne qui leur explique clairement ce qu'ils signent.",
      "Ce qui me plaît dans l'assurance, c'est d'être là pour les clients au moment où ils en ont le plus besoin, lors d'un sinistre.",
    ],
    "accueillir et renseigner les clients, préparer les devis, suivre les dossiers de sinistres et relancer les échéances",
    "une expérience où tu as conseillé ou rassuré quelqu'un : accueil, job d'été, service client, association, explication d'un dossier",
    "Je peux passer à l'agence pour vous rencontrer, au moment qui vous arrange.",
  ),
  banque: v(
    [
      "Ce qui m'attire dans la banque, c'est d'accompagner les clients dans des projets qui comptent pour eux : un premier appartement, une voiture, des économies.",
      "J'aime l'idée d'un métier où la confiance se construit rendez-vous après rendez-vous.",
    ],
    "accueillir les clients, traiter les opérations courantes, préparer les rendez-vous des conseillers et ouvrir des comptes",
    "une expérience en contact avec des clients ou de l'argent : caisse, accueil, job d'été, trésorerie d'association",
    "Je peux passer à l'agence pour vous rencontrer, au créneau qui vous convient.",
  ),
  "relation-client": v(
    [
      "J'aime transformer un client mécontent en client satisfait ; c'est souvent là que se joue sa fidélité.",
      "Ce qui me plaît dans la relation client, c'est de trouver une solution concrète à chaque appel ou chaque message.",
    ],
    "répondre aux appels, aux e-mails et aux messages, traiter les réclamations et suivre les dossiers jusqu'à leur résolution",
    "une expérience où tu as aidé ou calmé quelqu'un : job d'accueil, caisse, service client, association, baby-sitting",
    "Je peux vous rencontrer, ou commencer par un échange téléphonique, comme vous préférez.",
  ),
  finance: v(
    [
      "Ce qui m'attire en finance, c'est de comprendre comment une entreprise crée de la valeur, chiffres à l'appui.",
      "J'aime les métiers où une analyse précise peut changer une décision importante.",
    ],
    "préparer des analyses financières, mettre à jour les modèles, suivre la trésorerie et participer aux reportings",
    "un projet d'analyse financière : étude d'entreprise en cours, modèle Excel, concours de finance, gestion d'un portefeuille fictif",
    "Je peux vous rencontrer pour échanger sur vos analyses et sur ce que vous attendez de votre alternant.",
  ),
  immobilier: v(
    [
      "Ce qui me plaît dans l'immobilier, c'est d'accompagner quelqu'un dans un des choix les plus importants de sa vie.",
      "J'aime les métiers où l'on est sur le terrain, en rendez-vous, et pas toute la journée derrière un bureau.",
    ],
    "organiser et assurer des visites, prospecter des biens, mettre en ligne les annonces et suivre les dossiers clients",
    "une expérience commerciale ou de terrain : job de vente, prospection, accueil, association, recherche de logement que tu as menée",
    "Je peux passer à l'agence pour vous rencontrer, au moment qui vous arrange.",
  ),
  juridique: v(
    [
      "Ce qui m'attire dans le droit, c'est qu'une règle bien comprise peut protéger quelqu'un très concrètement.",
      "J'aime le travail précis du juriste : chercher la bonne source, la lire attentivement et en tirer une réponse claire.",
    ],
    "réaliser des recherches juridiques, préparer des projets d'actes et de contrats, assurer une veille et suivre les dossiers",
    "un travail juridique : cas pratique, mémoire, concours d'éloquence, clinique juridique, stage en cabinet ou en juridiction",
    "Je peux vous rencontrer pour échanger sur vos dossiers et sur ce que vous attendez de votre alternant.",
  ),
  "affaires-publiques": v(
    [
      "Je m'intéresse de près à la vie publique, et je veux comprendre de l'intérieur comment une décision se construit.",
      "Ce qui m'attire dans les affaires publiques, c'est de traduire un sujet complexe en note claire pour ceux qui décident.",
    ],
    "assurer la veille législative, rédiger des notes de synthèse, cartographier les acteurs et préparer des rendez-vous",
    "un travail de synthèse ou d'engagement : note, mémoire, simulation parlementaire, association, engagement local",
    "Je peux vous rencontrer pour échanger sur les sujets que vous suivez.",
  ),
  achats: v(
    [
      "J'aime négocier et comparer, et je sais qu'un bon acheteur fait gagner de l'argent à toute l'entreprise.",
      "Ce qui me plaît dans les achats, c'est de trouver le bon fournisseur, au bon prix, au bon moment.",
    ],
    "rechercher et comparer des fournisseurs, préparer des appels d'offres, suivre les commandes et analyser les coûts",
    "une expérience de négociation ou de comparaison : achat pour une association, organisation d'un événement, étude de coûts en cours",
    "Je peux vous rencontrer pour échanger sur vos achats et vos fournisseurs.",
  ),
  "commerce-international": v(
    [
      "Ce qui m'attire dans le commerce international, c'est de vendre au-delà des frontières en tenant compte des habitudes de chaque pays.",
      "J'aime parler d'autres langues et travailler avec des interlocuteurs du monde entier.",
    ],
    "suivre les commandes à l'export, préparer les documents de douane et de transport, et contacter des clients étrangers",
    "une expérience internationale : séjour ou stage à l'étranger, langue pratiquée, projet export en cours, échange avec des clients étrangers",
    "Je peux vous rencontrer en visio ou sur place, au moment qui vous arrange.",
  ),
  transport: v(
    [
      "J'aime être sur la route et savoir que des gens ou des marchandises comptent sur moi pour arriver à l'heure.",
      "Ce qui me plaît dans ce métier, c'est l'autonomie, avec de vraies responsabilités dès qu'on prend le volant.",
    ],
    "préparer les tournées, charger et vérifier les marchandises, livrer les clients et remplir les documents de transport",
    "une expérience de conduite ou de livraison : permis obtenu, job de livreur, déménagement, mission où il fallait être ponctuel",
    "Je peux venir au dépôt pour vous rencontrer, au moment qui vous arrange.",
  ),
  logistique: v(
    [
      "Ce qui me plaît en logistique, c'est qu'une commande bien préparée, au bon endroit et à l'heure, ne doit rien au hasard.",
      "J'aime les métiers concrets où l'organisation se voit tout de suite dans le résultat.",
    ],
    "réceptionner les marchandises, préparer les commandes, gérer les stocks et participer aux inventaires",
    "une expérience d'organisation ou de manutention : job d'été en entrepôt, inventaire, préparation de commandes, organisation d'un événement",
    "Je peux venir sur site pour un entretien, au créneau qui vous convient.",
  ),
  qualite: v(
    [
      "Je suis du genre à remarquer le petit détail qui cloche, et c'est exactement ce que demande un métier de la qualité.",
      "Ce qui me plaît dans la qualité, c'est d'améliorer la façon de travailler de toute une équipe, pas à pas.",
    ],
    "réaliser des contrôles, analyser les non-conformités, mettre à jour les procédures et suivre les indicateurs qualité",
    "une expérience de rigueur : contrôle en job d'été, projet d'amélioration en cours, audit simulé, procédure que tu as rédigée",
    "Je peux vous rencontrer pour échanger sur votre démarche qualité.",
  ),
  environnement: v(
    [
      "Je veux un métier où réduire l'impact d'une entreprise se mesure en chiffres, pas seulement en intentions.",
      "Ce qui m'attire dans la RSE, c'est de transformer de bonnes idées en actions concrètes qu'on peut suivre dans le temps.",
    ],
    "collecter les données pour le bilan carbone, suivre les indicateurs, préparer des actions de sensibilisation et le reporting",
    "un engagement ou un projet environnemental : association, projet de cours, bilan carbone, tri ou réduction des déchets que tu as organisé",
    "Je peux vous rencontrer pour échanger sur vos projets environnementaux.",
  ),
  "chef-de-projet": v(
    [
      "J'aime faire avancer un projet de l'idée jusqu'à la livraison, en gardant tout le monde dans la même direction.",
      "Ce qui me plaît dans la gestion de projet, c'est d'organiser le travail de plusieurs personnes pour arriver au résultat ensemble.",
    ],
    "suivre le planning et le budget, préparer et animer des réunions, faire le lien entre les équipes et mettre à jour le reporting",
    "un projet que tu as mené : événement, projet de groupe en cours, association, projet perso, avec ton rôle exact et le résultat",
    "Je peux vous rencontrer pour échanger sur vos projets en cours.",
  ),
  informatique: v(
    [
      "J'aime chercher d'où vient une panne, que ce soit sur un poste, un réseau ou un serveur.",
      "Ce qui me plaît dans l'informatique, c'est de faire en sorte que tout fonctionne pour que les autres puissent travailler.",
    ],
    "assurer le support aux utilisateurs, installer et configurer les postes, gérer les comptes et suivre les tickets",
    "une expérience technique : PC monté, réseau ou serveur installé, dépannage, homelab, projet de cours en système ou réseau",
    "Je peux vous rencontrer, et même résoudre un petit cas pratique pendant l'entretien.",
  ),
  architecture: v(
    [
      "Ce qui m'attire dans l'architecture, c'est de dessiner des lieux où les gens vont vraiment vivre ou travailler.",
      "J'aime le passage du croquis au plan précis, puis du plan au chantier.",
    ],
    "réaliser des plans et des maquettes, préparer des dossiers de permis et suivre l'avancement de projets",
    "un projet d'architecture : plan, maquette, rendu 3D, projet d'atelier, avec le lien de ton portfolio",
    "Je peux vous présenter mon travail lors d'un entretien.",
  ),
  plombier: v(
    [
      "J'aime les métiers où l'on voit le résultat de son travail à la fin de la journée, et où l'on rend service directement aux gens.",
      "Ce qui me plaît en plomberie et chauffage, c'est de trouver la panne et de repartir en laissant une installation qui marche.",
    ],
    "préparer le matériel, assister sur les installations et les dépannages, et apprendre les raccordements et la soudure",
    "une expérience manuelle : bricolage, travaux à la maison, job d'été sur un chantier, stage en atelier",
    "Je peux venir à l'atelier ou sur un chantier pour vous rencontrer, quand vous le souhaitez.",
  ),
  menuiserie: v(
    [
      "J'aime travailler le bois et voir une pièce prendre forme entre mes mains.",
      "Ce qui me plaît en menuiserie, c'est la précision : un millimètre de trop et rien ne s'assemble.",
    ],
    "préparer les pièces, utiliser les machines sous la conduite de l'équipe, assembler et poser des menuiseries",
    "une expérience manuelle : meuble ou objet en bois que tu as fabriqué, bricolage, stage en atelier, travaux à la maison",
    "Je peux passer à l'atelier pour vous rencontrer, au moment qui vous arrange.",
  ),
  "artisan-batiment": v(
    [
      "J'aime les métiers du bâtiment parce qu'on peut montrer du doigt ce qu'on a construit.",
      "Travailler de mes mains, en équipe, sur un chantier qui avance chaque jour, c'est ce que je recherche.",
    ],
    "préparer les supports et le matériel, assister l'équipe sur le chantier et réaliser des finitions",
    "une expérience manuelle : travaux de rénovation, bricolage, job d'été sur un chantier, stage, chantier participatif",
    "Je peux venir sur un chantier ou à l'entreprise pour vous rencontrer, quand vous le souhaitez.",
  ),
  paysagiste: v(
    [
      "J'aime travailler dehors et transformer un terrain en jardin qui donne envie d'y passer du temps.",
      "Ce qui me plaît dans le paysage, c'est de travailler avec le vivant, au rythme des saisons.",
    ],
    "entretenir les espaces verts, tailler, planter et participer à la création de jardins",
    "une expérience en extérieur : jardin familial, job d'été en espaces verts, potager, bénévolat nature, travail manuel",
    "Je peux venir sur un chantier pour vous rencontrer, au moment qui vous arrange.",
  ),
  agriculture: v(
    [
      "J'aime le travail en extérieur et l'idée de produire quelque chose d'utile à tout le monde.",
      "Ce qui me plaît dans l'agriculture, c'est la variété : les animaux, les cultures, les machines, les saisons.",
    ],
    "participer aux travaux des cultures et aux soins des animaux, entretenir le matériel et conduire les engins",
    "une expérience agricole ou en extérieur : ferme familiale, vendanges, saisonnier, stage, travail avec des animaux",
    "Je peux venir sur l'exploitation pour vous rencontrer, quand cela vous arrange.",
  ),
  btp: v(
    [
      "Ce qui m'attire dans le BTP, c'est de voir un projet passer du plan à un bâtiment bien réel.",
      "J'aime les métiers de terrain, où l'organisation d'un chantier se joue chaque matin.",
    ],
    "suivre l'avancement des travaux, préparer les métrés et les plannings, et faire le lien avec les équipes et les sous-traitants",
    "une expérience de chantier ou de projet technique : stage, job d'été dans le bâtiment, projet de cours, plans que tu as réalisés",
    "Je peux venir sur un chantier pour vous rencontrer, au moment qui vous arrange.",
  ),
  electricien: v(
    [
      "J'aime comprendre comment une installation fonctionne, du tableau jusqu'à la prise.",
      "Ce qui me plaît dans l'électricité, c'est que le travail doit être à la fois propre et parfaitement sûr.",
    ],
    "préparer le matériel, tirer des câbles, poser des équipements et apprendre le raccordement des tableaux",
    "une expérience technique ou manuelle : montage, bricolage électrique encadré, stage, travaux, habilitation déjà passée",
    "Je peux venir sur un chantier ou à l'entreprise pour vous rencontrer, quand vous le souhaitez.",
  ),
  "mecanique-auto": v(
    [
      "Les voitures m'intéressent, et j'aime comprendre d'où vient un bruit ou une panne.",
      "Ce qui me plaît dans la mécanique, c'est qu'un bon diagnostic fait gagner du temps à tout le monde.",
    ],
    "réaliser les entretiens courants, changer les pièces d'usure et participer aux diagnostics avec la valise",
    "une expérience en mécanique : entretien de ta voiture ou de ton scooter, stage en garage, aide à un proche mécanicien",
    "Je peux passer au garage pour vous rencontrer, au moment qui vous arrange.",
  ),
  maintenance: v(
    [
      "Quand une machine s'arrête, j'ai envie de comprendre pourquoi, et c'est ce que je veux faire de mes journées.",
      "Ce qui me plaît en maintenance, c'est d'éviter les pannes avant qu'elles n'arrivent, autant que de les réparer.",
    ],
    "réaliser la maintenance préventive, assister aux dépannages, remplir les interventions dans la GMAO et apprendre les schémas",
    "une expérience technique : réparation d'un appareil, projet en électrotechnique, stage en atelier, bricolage mécanique",
    "Je peux venir sur site pour vous rencontrer et découvrir vos installations.",
  ),
  production: v(
    [
      "J'aime les environnements où l'on produit quelque chose de concret, avec des objectifs clairs chaque jour.",
      "Ce qui me plaît en production, c'est d'améliorer une ligne petit à petit pour qu'elle tourne mieux.",
    ],
    "conduire une ligne sous la responsabilité de l'équipe, réaliser les contrôles et participer aux réglages",
    "une expérience en production ou en équipe : job d'été en usine, intérim, stage, projet technique de cours",
    "Je peux venir sur site pour vous rencontrer, au créneau qui vous convient.",
  ),
  ingenieur: v(
    [
      "Ce qui m'attire dans l'ingénierie, c'est de partir d'un problème concret et d'arriver à une solution qui fonctionne vraiment.",
      "J'aime les projets techniques où il faut à la fois calculer, tester et convaincre.",
    ],
    "participer aux études techniques, réaliser des calculs et des essais, rédiger des documents et suivre un projet",
    "un projet technique : projet d'école, conception, prototype, simulation, stage, avec ton rôle et le résultat",
    "Je peux vous rencontrer pour échanger sur vos projets techniques.",
  ),
  laboratoire: v(
    [
      "J'aime le travail précis du laboratoire, où un protocole bien suivi donne un résultat fiable.",
      "Ce qui me plaît en laboratoire, c'est de contribuer à des analyses dont d'autres vont se servir pour décider.",
    ],
    "préparer les échantillons et les solutions, réaliser des analyses selon les protocoles et tenir le cahier de laboratoire",
    "une expérience de laboratoire : TP marquants, techniques maîtrisées, stage, projet de recherche, protocole que tu as suivi",
    "Je peux vous rencontrer pour échanger sur vos analyses et vos protocoles.",
  ),
  boucherie: v(
    [
      "J'aime les métiers de bouche, où le savoir-faire se voit en vitrine et se goûte à table.",
      "Ce qui me plaît en boucherie, c'est le geste précis et le conseil au client qui prépare son repas.",
    ],
    "préparer la vitrine, apprendre la découpe et le désossage, préparer les commandes et servir les clients",
    "une expérience en cuisine, en commerce ou manuelle : job d'été, stage, cuisine à la maison, service en restauration",
    "Je peux passer à la boutique pour vous rencontrer, au moment qui vous arrange.",
  ),
  "boulangerie-patisserie": v(
    [
      "J'aime l'idée d'un métier où l'on commence tôt pour que les clients trouvent tout prêt à l'ouverture.",
      "Ce qui me plaît en boulangerie-pâtisserie, c'est la précision des recettes et le plaisir des clients en vitrine.",
    ],
    "peser et préparer les pâtes, façonner, surveiller les cuissons et aider à la vente en boutique",
    "une expérience en cuisine ou en vente : pâtisseries faites maison, job d'été, stage, aide en boutique",
    "Je peux passer à la boutique pour vous rencontrer, et même faire un essai si vous le souhaitez.",
  ),
  tourisme: v(
    [
      "J'aime faire découvrir un lieu et voir les gens repartir avec un bon souvenir.",
      "Ce qui me plaît dans le tourisme, c'est le contact avec des visiteurs du monde entier.",
    ],
    "accueillir et renseigner les visiteurs, gérer les réservations et préparer des séjours ou des excursions",
    "une expérience d'accueil ou de voyage : job saisonnier, accueil, séjour à l'étranger, langue pratiquée, organisation d'un voyage",
    "Je peux vous rencontrer sur place ou en visio, au moment qui vous arrange.",
  ),
  "hotellerie-restauration": v(
    [
      "J'aime le rythme d'un service, quand toute l'équipe avance ensemble pour que chaque client passe un bon moment.",
      "Ce qui me plaît dans l'hôtellerie-restauration, c'est que l'accueil fait autant que l'assiette.",
    ],
    "assurer la mise en place, servir en salle ou aider en cuisine, accueillir les clients et encaisser",
    "une expérience en service ou en équipe : job d'été en restauration, extra, saison, cuisine à la maison, événement d'association",
    "Je peux passer à l'établissement pour vous rencontrer, et faire un essai sur un service si vous le souhaitez.",
  ),
  "coiffure-esthetique": v(
    [
      "J'aime voir un client repartir plus en confiance qu'à son arrivée.",
      "Ce qui me plaît dans ce métier, c'est le mélange entre la technique, le conseil et le contact.",
    ],
    "accueillir les clients, réaliser les shampoings et les soins, assister les coiffeurs ou les esthéticiennes et conseiller les produits",
    "une expérience liée au métier : coiffures ou soins réalisés pour ton entourage, formation, stage, réseau où tu montres ton travail",
    "Je peux passer au salon pour vous rencontrer, et faire un essai si vous le souhaitez.",
  ),
  "mode-textile": v(
    [
      "Ce qui m'attire dans la mode, c'est de passer d'un croquis à un vêtement que quelqu'un a envie de porter.",
      "J'aime le travail des matières et la précision d'un vêtement bien fini.",
    ],
    "préparer les patronages, réaliser des prototypes, suivre la fabrication et aider à la présentation des collections",
    "un projet de mode : vêtement cousu, croquis, collection d'école, customisation, avec le lien de ton book",
    "Je peux vous présenter mon travail lors d'un entretien.",
  ),
  fleuriste: v(
    [
      "J'aime l'idée qu'un bouquet accompagne les moments importants de la vie des gens.",
      "Ce qui me plaît dans ce métier, c'est le mélange entre création, conseil et contact avec les clients.",
    ],
    "entretenir les fleurs et les plantes, réaliser des bouquets, conseiller les clients et préparer les commandes",
    "une expérience créative ou en boutique : compositions faites maison, job de vente, stage, décoration d'un événement",
    "Je peux passer à la boutique pour vous rencontrer, au moment qui vous arrange.",
  ),
  animalier: v(
    [
      "Je veux faire de mon attachement aux animaux un métier, avec la rigueur qu'il demande.",
      "Ce qui me plaît dans ce métier, c'est de prendre soin d'animaux qui ne peuvent pas dire ce dont ils ont besoin.",
    ],
    "nourrir les animaux, entretenir les espaces, observer leur comportement et assister lors des soins",
    "une expérience avec des animaux : animaux à la maison, bénévolat en refuge, garde d'animaux, stage, centre équestre",
    "Je peux venir sur place pour vous rencontrer, au moment qui vous arrange.",
  ),
  proprete: v(
    [
      "Un lieu propre, on ne le remarque pas ; un lieu mal entretenu, tout le monde le voit. J'aime ce travail souvent invisible mais essentiel.",
      "Ce qui me plaît dans ce métier, c'est l'autonomie et la satisfaction d'un travail bien fait.",
    ],
    "réaliser l'entretien des locaux selon les protocoles, utiliser le matériel et gérer les produits",
    "une expérience de travail sérieux et autonome : job d'été, ménage, entretien, missions où il fallait respecter des consignes",
    "Je peux venir vous rencontrer sur site, au moment qui vous arrange.",
  ),
  "aide-soignant": v(
    [
      "Je veux un métier où l'on aide vraiment les gens, au quotidien, dans les gestes qui comptent pour eux.",
      "Ce qui m'attire dans le soin, c'est la relation avec les patients autant que la technique.",
    ],
    "aider aux soins d'hygiène et de confort, prendre les constantes, accompagner les patients et participer aux transmissions",
    "une expérience d'aide aux autres : proche dont tu t'es occupé, bénévolat, stage en établissement, babysitting, service civique",
    "Je peux venir dans votre établissement pour vous rencontrer, au créneau qui vous convient.",
  ),
  "petite-enfance": v(
    [
      "J'aime voir un enfant découvrir quelque chose de nouveau, et je veux l'accompagner dans ces moments-là.",
      "Ce qui me plaît dans la petite enfance, c'est de créer un cadre où chaque enfant se sent en sécurité.",
    ],
    "accueillir les enfants et les parents, participer aux repas, aux soins et aux activités d'éveil",
    "une expérience avec des enfants : baby-sitting, centre de loisirs, BAFA, frères et sœurs, stage en crèche ou à l'école",
    "Je peux venir dans votre structure pour vous rencontrer, au moment qui vous arrange.",
  ),
  "educateur-specialise": v(
    [
      "Je veux accompagner des personnes qui en ont besoin, sur la durée, et les aider à gagner en autonomie.",
      "Ce qui m'attire dans l'éducation spécialisée, c'est de construire une relation de confiance avec chaque personne accompagnée.",
    ],
    "participer à l'accompagnement au quotidien, animer des activités, contribuer aux projets personnalisés et aux écrits professionnels",
    "une expérience d'accompagnement : bénévolat, animation, BAFA, service civique, stage en structure, aide à un proche",
    "Je peux venir dans votre structure pour vous rencontrer, au moment qui vous arrange.",
  ),
  sante: v(
    [
      "Je veux travailler dans la santé parce que chaque journée y est utile à quelqu'un.",
      "Ce qui me plaît dans ce domaine, c'est l'exigence : chaque geste et chaque information comptent.",
    ],
    "accueillir les patients, gérer les dossiers et les rendez-vous, et préparer le matériel dans le respect des règles d'hygiène",
    "une expérience d'accueil ou d'aide : accueil du public, bénévolat, stage en santé, proche accompagné, secourisme",
    "Je peux venir dans votre établissement pour vous rencontrer, au créneau qui vous convient.",
  ),
  social: v(
    [
      "Je veux un métier où l'on aide des personnes à faire valoir leurs droits et à trouver des solutions concrètes.",
      "Ce qui m'attire dans le social, c'est l'écoute et le travail avec tout un réseau de partenaires.",
    ],
    "accueillir le public, participer à l'accompagnement, animer des actions collectives et aider aux démarches",
    "une expérience d'engagement : bénévolat, association, service civique, animation, aide aux devoirs, accompagnement d'un proche",
    "Je peux venir dans votre structure pour vous rencontrer, au moment qui vous arrange.",
  ),
  vente: v(
    [
      "Ce que j'aime dans la vente, c'est le moment où un client hésite et repart avec ce qu'il cherchait vraiment.",
      "Je préfère être debout, face aux clients, que derrière un écran : la vente me permet de l'être tous les jours.",
    ],
    "accueillir les clients, tenir la caisse, participer à la mise en rayon et à la vitrine",
    "une expérience face à des clients ou du public : job d'été, caisse, baby-sitting, événement d'association, vente de quelque chose que tu as fait",
    "Je peux passer au magasin pour vous rencontrer, au moment qui vous arrange.",
  ),
  commercial: v(
    [
      "J'aime convaincre, et je sais qu'en commerce, un rendez-vous bien préparé vaut mieux que dix appels au hasard.",
      "Ce qui me plaît dans le métier de commercial, c'est d'avoir des objectifs clairs et de voir directement le résultat de mon travail.",
    ],
    "prospecter par téléphone et sur le terrain, préparer les rendez-vous, rédiger les devis et suivre les clients dans le CRM",
    "une expérience où tu as convaincu quelqu'un ou vendu : job de vente, collecte de fonds, prospection pour une association, concours de pitch",
    "Je peux vous rencontrer, ou commencer par un appel si vous préférez juger ma façon de présenter.",
  ),
  "assistant-administratif": v(
    [
      "J'aime que tout soit en ordre : un dossier complet, un agenda à jour, une réponse envoyée à temps.",
      "Ce qui me plaît dans ce métier, c'est d'être la personne sur qui l'équipe peut compter pour que tout fonctionne.",
    ],
    "accueillir et orienter les appels, gérer les agendas, rédiger les courriers, classer les documents et suivre la facturation",
    "une expérience d'organisation : secrétariat d'association, job d'accueil, gestion de documents, organisation d'un événement",
    "Je peux vous rencontrer, au moment qui vous arrange, en visio ou sur place.",
  ),
};
