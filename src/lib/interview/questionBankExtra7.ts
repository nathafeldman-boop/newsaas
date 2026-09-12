// Septième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_7: InterviewDomain[] = [
  { id: "banque", label: "Banque" },
  { id: "e_commerce", label: "E-commerce" },
  { id: "paramedical", label: "Paramédical (kiné, nutrition, optique...)" },
  { id: "securite_civile", label: "Sécurité civile / Pompiers / Police" },
  { id: "intelligence_artificielle", label: "Intelligence artificielle / Data science" },
];

export const EXTRA_BANK_7: Bank = {
  banque: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la banque ?",
        options: [
          "J'aime comprendre les enjeux financiers et accompagner les clients dans leurs projets",
          "Parce que ça a l'air un métier facile derrière un guichet",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le seul secteur qui recrutait",
          "Parce que je veux juste gagner beaucoup d'argent rapidement",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la compréhension financière et à l'accompagnement client montre un vrai intérêt pour le métier, plus qu'une idée reçue de facilité ou d'appât du gain.",
      },
      {
        question: "Qu'est-ce qu'un \"compte courant\" ?",
        options: [
          "Un compte réservé uniquement aux entreprises",
          "Un compte bancaire utilisé pour les opérations quotidiennes (virements, paiements, retraits)",
          "Un compte qui rapporte automatiquement des intérêts élevés",
          "Un compte bloqué pendant plusieurs années",
          "Un compte réservé à l'épargne uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le compte courant sert aux opérations bancaires du quotidien, contrairement à un compte d'épargne destiné à faire fructifier de l'argent sur la durée.",
      },
      {
        question: "Un client se présente pour ouvrir un compte sans tous les documents requis. Que fais-tu ?",
        options: [
          "Ouvrir le compte quand même pour ne pas le décevoir",
          "Lui expliquer précisément les documents manquants et l'inviter à revenir une fois le dossier complet",
          "Refuser sans explication",
          "Ouvrir le compte et lui demander les documents plus tard",
          "L'envoyer dans une autre agence sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Les documents d'identité et justificatifs sont obligatoires (réglementation anti-blanchiment) : expliquer clairement ce qui manque, plutôt que de contourner la règle, est la seule réponse professionnelle.",
      },
      {
        question: "Qu'est-ce qu'un \"crédit\" en une phrase simple ?",
        options: [
          "Un dépôt d'argent sur un compte",
          "Une somme d'argent prêtée par la banque, à rembourser avec des intérêts",
          "Un moyen de paiement sans contact",
          "Un compte d'épargne à taux fixe",
          "Un virement entre deux comptes personnels",
        ],
        correctIndex: 1,
        explanation:
          "Le crédit est un prêt accordé par la banque, remboursé progressivement avec des intérêts qui rémunèrent le risque pris par la banque.",
      },
      {
        question: "Pourquoi la discrétion sur les informations bancaires des clients est-elle essentielle ?",
        options: [
          "Ce n'est qu'une formalité sans réelle importance",
          "Les informations financières sont des données sensibles protégées par le secret bancaire et la réglementation sur les données personnelles",
          "Elle ne concerne que les très gros comptes",
          "Elle n'a aucun lien avec la confiance du client",
          "Elle n'est utile qu'en cas de contrôle interne",
        ],
        correctIndex: 1,
        explanation:
          "Le secret bancaire et le RGPD protègent des données particulièrement sensibles -- un manquement à la discrétion professionnelle est une faute grave dans ce métier.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre un taux d'intérêt fixe et un taux variable sur un crédit ?",
        options: [
          "Aucune différence réelle",
          "Le taux fixe reste identique sur toute la durée du prêt, le taux variable évolue selon les indices du marché",
          "Le taux variable est toujours plus avantageux",
          "Le taux fixe ne concerne que les crédits à la consommation",
          "Le taux variable ne s'applique jamais aux prêts immobiliers",
        ],
        correctIndex: 1,
        explanation:
          "Le taux fixe sécurise les mensualités sur toute la durée, tandis que le taux variable comporte un risque (ou une opportunité) lié à l'évolution des taux du marché.",
      },
      {
        question: "Un client souhaite un crédit dont le montant semble disproportionné par rapport à ses revenus. Quelle est la démarche appropriée ?",
        options: [
          "Accorder le crédit immédiatement pour satisfaire le client",
          "Analyser objectivement sa capacité de remboursement (taux d'endettement, reste à vivre) avant toute décision",
          "Refuser sans aucune analyse",
          "Laisser le client décider seul du montant sans vérification",
          "Accorder un montant au hasard, plus faible",
        ],
        correctIndex: 1,
        explanation:
          "L'octroi d'un crédit doit reposer sur une analyse objective de la capacité de remboursement -- une obligation à la fois réglementaire et de protection du client contre le surendettement.",
      },
      {
        question: "Qu'est-ce que le \"taux d'endettement\" d'un emprunteur ?",
        options: [
          "Le montant total de son épargne",
          "La part de ses revenus consacrée au remboursement de ses crédits",
          "Le taux d'intérêt appliqué à son prêt",
          "Le montant de ses impôts annuels",
          "Le nombre de comptes bancaires qu'il possède",
        ],
        correctIndex: 1,
        explanation:
          "Le taux d'endettement (généralement plafonné autour de 35%) mesure la part des revenus absorbée par les remboursements de crédit -- un indicateur clé du risque de surendettement.",
      },
      {
        question: "Pourquoi la vérification d'identité renforcée (KYC) est-elle obligatoire à l'ouverture d'un compte ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel enjeu",
          "Elle permet de lutter contre le blanchiment d'argent et le financement du terrorisme, une obligation légale stricte pour les banques",
          "Elle ne concerne que les clients étrangers",
          "Elle sert uniquement à des fins commerciales",
          "Elle n'est obligatoire que pour les comptes professionnels",
        ],
        correctIndex: 1,
        explanation:
          "Le KYC (\"Know Your Customer\") est une obligation légale de vigilance qui vise à prévenir le blanchiment d'argent -- un point de conformité non négociable pour toute banque.",
      },
      {
        question: "Un client fidèle demande un découvert exceptionnel au-delà de son autorisation habituelle. Comment procéder ?",
        options: [
          "Accorder automatiquement sans vérification puisqu'il est fidèle",
          "Analyser sa situation actuelle (mouvements récents, historique) avant de statuer, en expliquant la décision quel qu'en soit le sens",
          "Refuser systématiquement sans explication",
          "Ignorer la demande jusqu'à ce que le client insiste",
          "Accorder le double du montant demandé pour le fidéliser",
        ],
        correctIndex: 1,
        explanation:
          "Même pour un client fidèle, une exception au découvert autorisé doit s'appuyer sur une analyse actuelle de sa situation, avec une explication claire de la décision prise.",
      },
      {
        question: "Pourquoi la diversification des produits proposés à un client (épargne, assurance, crédit) doit-elle toujours rester centrée sur son intérêt ?",
        options: [
          "Elle ne doit servir que les objectifs commerciaux de la banque",
          "Un produit mal adapté au profil ou aux besoins réels du client peut lui nuire financièrement et engager la responsabilité du conseiller",
          "La diversification n'a aucun impact sur la relation client",
          "Il faut toujours proposer le produit le plus rentable pour la banque, indépendamment du client",
          "Le conseiller n'a aucune responsabilité sur les produits vendus",
        ],
        correctIndex: 1,
        explanation:
          "Le devoir de conseil impose de proposer des produits adaptés au profil et aux besoins réels du client -- vendre un produit inadapté juste pour des objectifs commerciaux expose à un vrai risque de réputation et juridique.",
      },
    ],
    difficile: [
      {
        question: "Un client insiste pour effectuer un virement international vers un compte qui te semble suspect (montant inhabituel, pays à risque). Quelle est la procédure rigoureuse à suivre ?",
        options: [
          "Exécuter le virement immédiatement, le client est libre de ses opérations",
          "Appliquer les procédures de vigilance renforcée (déclaration de soupçon si nécessaire, TRACFIN) avant toute exécution",
          "Refuser catégoriquement sans jamais exécuter aucun virement international",
          "Demander l'avis d'un collègue informel sans suivre de procédure",
          "Exécuter le virement mais avec un léger retard",
        ],
        correctIndex: 1,
        explanation:
          "Une opération suspecte doit déclencher les procédures de vigilance renforcée prévues par la réglementation anti-blanchiment, jusqu'à la déclaration de soupçon si nécessaire -- pas une décision individuelle informelle.",
      },
      {
        question: "Pourquoi la crise financière de 2008 a-t-elle durablement renforcé la réglementation bancaire (ratios de fonds propres, stress tests) ?",
        options: [
          "Cette crise n'a eu aucun impact sur la réglementation",
          "Elle a révélé les risques d'un système bancaire sous-capitalisé face à des pertes massives, d'où un renforcement des exigences de solidité financière",
          "La réglementation a été allégée après cette crise pour relancer l'économie",
          "Cette réglementation ne concerne que les banques américaines",
          "Les stress tests ne servent qu'à des fins de communication",
        ],
        correctIndex: 1,
        explanation:
          "La crise de 2008 a montré la fragilité de banques insuffisamment capitalisées face aux pertes -- d'où des exigences renforcées (Bâle III notamment) pour s'assurer que les banques peuvent absorber des chocs futurs.",
      },
      {
        question: "Comment concilier objectifs commerciaux individuels (vente de produits) et devoir de conseil envers le client, quand les deux semblent en tension ?",
        options: [
          "Le devoir de conseil n'existe pas réellement en pratique",
          "Prioriser systématiquement l'intérêt du client, même si cela signifie ne pas atteindre un objectif commercial ponctuel -- la confiance à long terme prime",
          "Prioriser toujours l'objectif commercial, le client s'adaptera",
          "Vendre le produit le plus rentable pour la banque, peu importe l'adéquation",
          "Laisser le client décider seul sans aucun conseil pour éviter toute responsabilité",
        ],
        correctIndex: 1,
        explanation:
          "Le devoir de conseil prime légalement et éthiquement sur un objectif commercial ponctuel -- une vente inadaptée peut coûter bien plus cher en confiance et en responsabilité qu'elle ne rapporte à court terme.",
      },
      {
        question: "Un dossier de crédit immobilier révèle des revenus en forte hausse récente mais sans historique suffisant pour le confirmer. Comment évaluer le risque avec rigueur ?",
        options: [
          "Accepter la hausse de revenus sans vérification supplémentaire",
          "Analyser la nature et la pérennité de cette hausse (CDI confirmé, promotion durable, activité ponctuelle) avant de l'intégrer dans le calcul de capacité d'emprunt",
          "Refuser systématiquement tout dossier avec un changement récent de revenus",
          "Ignorer les revenus récents et se baser uniquement sur les revenus antérieurs, plus faibles",
          "Accorder le crédit maximal possible sans distinction",
        ],
        correctIndex: 1,
        explanation:
          "Une hausse de revenus récente doit être questionnée sur sa pérennité avant d'être intégrée au calcul -- une prudence qui protège autant l'emprunteur d'un surendettement que la banque d'un risque de défaut.",
      },
      {
        question: "Pourquoi la digitalisation bancaire (banques en ligne, néobanques) pose-t-elle un défi stratégique aux banques traditionnelles, au-delà de la simple concurrence tarifaire ?",
        options: [
          "Elle n'a aucun impact stratégique réel",
          "Elle transforme les attentes des clients (instantanéité, simplicité) et oblige à repenser le rôle du conseil humain dans la relation bancaire",
          "Les banques traditionnelles n'ont aucune réponse possible face à ce phénomène",
          "Cette digitalisation ne concerne que les jeunes clients",
          "Elle ne touche que les services les moins rentables",
        ],
        correctIndex: 1,
        explanation:
          "Au-delà des tarifs, la digitalisation change fondamentalement les attentes clients -- les banques traditionnelles doivent repositionner leur valeur ajoutée sur le conseil humain et l'accompagnement, pas seulement sur la disponibilité de services numériques.",
      },
      {
        question: "Comment un conseiller doit-il gérer un client en difficulté financière croissante qui continue pourtant de solliciter de nouveaux crédits ?",
        options: [
          "Accorder systématiquement les crédits demandés, le client est libre de ses choix",
          "Alerter le client sur les risques de surendettement, explorer des solutions alternatives (rééchelonnement, accompagnement budgétaire) plutôt que d'accumuler de nouveaux crédits",
          "Refuser tout contact avec ce client à l'avenir",
          "Accorder les crédits sans en discuter, ce n'est pas le rôle du conseiller",
          "Reporter la responsabilité entièrement sur le client sans aucune alerte",
        ],
        correctIndex: 1,
        explanation:
          "Face à un risque de surendettement croissant, le rôle du conseiller est d'alerter et d'accompagner vers des solutions adaptées, pas d'accumuler mécaniquement de nouveaux crédits qui aggraveraient la situation.",
      },
      {
        question: "Pourquoi la gestion des taux de change dans les opérations internationales représente-t-elle un risque spécifique à maîtriser pour un conseiller en entreprise ?",
        options: [
          "Le taux de change n'a aucun impact réel sur les opérations bancaires",
          "Une fluctuation de change peut modifier significativement la valeur réelle d'une transaction entre le moment de l'engagement et celui du règlement, un risque à anticiper avec des outils de couverture adaptés",
          "Ce risque ne concerne que les particuliers voyageant à l'étranger",
          "Les taux de change sont toujours fixés par une seule banque centrale mondiale",
          "Ce risque a disparu depuis l'introduction de l'euro",
        ],
        correctIndex: 1,
        explanation:
          "Une entreprise engagée dans une transaction en devise étrangère s'expose à un risque de change réel entre l'engagement et le règlement -- des outils de couverture (change à terme, options) permettent de le maîtriser, une compétence clé en banque d'entreprise.",
      },
    ],
  },

  e_commerce: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'e-commerce ?",
        options: [
          "J'aime comprendre le parcours d'achat en ligne et optimiser l'expérience client sur un site",
          "Parce que ça a l'air un métier facile fait uniquement d'écrans",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que je veux juste faire du shopping gratuitement",
          "Parce que c'est le seul secteur qui recrutait",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation centrée sur le parcours d'achat et l'expérience utilisateur montre une compréhension réaliste du métier, au-delà de l'image simpliste d'un site qui \"tourne tout seul\".",
      },
      {
        question: "Qu'est-ce qu'un \"panier abandonné\" en e-commerce ?",
        options: [
          "Un produit retourné après achat",
          "Un panier rempli par un client qui quitte le site sans finaliser sa commande",
          "Un produit en rupture de stock",
          "Un panier utilisé pour une commande en magasin physique",
          "Une commande annulée par le vendeur",
        ],
        correctIndex: 1,
        explanation:
          "Le panier abandonné désigne une commande initiée mais jamais finalisée -- un indicateur clé à surveiller et à réduire pour améliorer les ventes.",
      },
      {
        question: "Un client se plaint qu'un colis n'est jamais arrivé. Que fais-tu en priorité ?",
        options: [
          "Lui dire que ce n'est pas de la responsabilité du site",
          "Vérifier le suivi de livraison et proposer une solution rapide (renvoi ou remboursement) selon le résultat",
          "Ignorer sa réclamation si elle arrive après quelques jours",
          "Lui demander de contacter directement le transporteur sans autre aide",
          "Fermer son compte client sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Une vérification rapide du suivi puis une solution concrète (renvoi, remboursement) est la réponse attendue par un client dans cette situation -- le renvoyer vers un tiers sans accompagnement dégrade la confiance.",
      },
      {
        question: "Que signifie le sigle \"UX\" appliqué à un site e-commerce ?",
        options: [
          "User Exchange, un système de paiement",
          "User Experience, l'expérience vécue par l'utilisateur sur le site",
          "Universal Export, une méthode logistique",
          "Unified Xtranet, un outil interne",
          "User Extension, un module de site",
        ],
        correctIndex: 1,
        explanation:
          "L'UX (expérience utilisateur) englobe la facilité de navigation, la clarté du tunnel d'achat et le plaisir général d'utilisation du site -- un facteur clé de conversion en e-commerce.",
      },
      {
        question: "Pourquoi les fiches produits (photos, descriptions) doivent-elles être particulièrement soignées en e-commerce ?",
        options: [
          "Elles n'ont aucun impact sur les ventes",
          "Elles remplacent l'expérience physique du produit (le toucher, l'essayer) et rassurent le client avant l'achat",
          "Elles ne servent qu'au référencement, jamais à la conversion",
          "Elles sont secondaires par rapport au prix affiché",
          "Elles ne concernent que les produits chers",
        ],
        correctIndex: 1,
        explanation:
          "En l'absence de contact physique avec le produit, une fiche produit soignée (photos, description précise) compense ce manque et rassure le client dans sa décision d'achat.",
      },
    ],
    medium: [
      {
        question: "Que mesure le \"taux de conversion\" d'un site e-commerce ?",
        options: [
          "Le nombre total de visiteurs du site",
          "Le pourcentage de visiteurs qui finalisent un achat parmi l'ensemble des visiteurs",
          "Le montant moyen dépensé par commande",
          "Le nombre de produits référencés sur le site",
          "Le temps moyen passé sur le site",
        ],
        correctIndex: 1,
        explanation:
          "Le taux de conversion mesure la part de visiteurs qui achètent réellement -- un indicateur central pour évaluer l'efficacité globale d'un site e-commerce.",
      },
      {
        question: "Pourquoi le temps de chargement d'un site e-commerce a-t-il un impact direct sur les ventes ?",
        options: [
          "Il n'a aucun impact réel sur le comportement des visiteurs",
          "Un site lent augmente le taux d'abandon avant même que le visiteur ait vu les produits, chaque seconde supplémentaire réduisant la conversion",
          "Le temps de chargement ne concerne que le référencement SEO",
          "Il n'affecte que les visiteurs sur mobile",
          "Les visiteurs attendent toujours patiemment, sans effet sur les ventes",
        ],
        correctIndex: 1,
        explanation:
          "De nombreuses études montrent qu'un site lent augmente significativement le taux d'abandon -- la performance technique est un vrai levier commercial, pas seulement un enjeu technique.",
      },
      {
        question: "Un client se plaint d'un prix différent entre le site mobile et le site desktop pour le même produit. Comment analyser ce problème ?",
        options: [
          "C'est normal, chaque support peut avoir un prix différent sans raison",
          "Il faut identifier s'il s'agit d'un bug de synchronisation ou d'une erreur de configuration, et corriger rapidement l'incohérence",
          "Ignorer la remarque, ce n'est pas un problème important",
          "Supprimer le site mobile pour éviter le problème",
          "Facturer systématiquement le prix le plus élevé des deux",
        ],
        correctIndex: 1,
        explanation:
          "Une incohérence de prix entre supports est presque toujours un bug technique à corriger rapidement -- elle nuit à la confiance et peut poser un problème légal d'affichage de prix.",
      },
      {
        question: "Qu'est-ce que le \"cross-canal\" (ou omnicanal) en e-commerce ?",
        options: [
          "La vente exclusivement en ligne, sans aucun magasin physique",
          "Une stratégie qui unifie l'expérience client entre le site en ligne et les points de vente physiques (ex: retrait en magasin d'une commande en ligne)",
          "Un type de paiement en plusieurs fois",
          "Un logiciel de gestion des stocks uniquement en ligne",
          "Une technique de référencement naturel",
        ],
        correctIndex: 1,
        explanation:
          "L'omnicanal vise une expérience cohérente et fluide entre les canaux (site, appli, magasin), par exemple via le click and collect -- une attente de plus en plus forte des clients.",
      },
      {
        question: "Pourquoi les avis clients affichés sur les fiches produits sont-ils un levier de conversion important ?",
        options: [
          "Ils n'ont aucun impact sur la décision d'achat",
          "Ils rassurent les acheteurs potentiels en s'appuyant sur l'expérience d'autres clients, un facteur de confiance déterminant en ligne",
          "Ils ne servent qu'à des fins de communication interne",
          "Ils ne concernent que les produits les moins chers",
          "Ils remplacent totalement la description produit",
        ],
        correctIndex: 1,
        explanation:
          "En l'absence de contact humain, les avis d'autres clients jouent un rôle de preuve sociale déterminant dans la décision d'achat en ligne.",
      },
      {
        question: "Un pic de trafic important (soldes, promotion) fait planter temporairement le site. Quelle est la priorité immédiate ?",
        options: [
          "Ignorer le problème, ça se résoudra tout seul",
          "Alerter l'équipe technique en urgence pour rétablir le service, tout en communiquant honnêtement avec les clients impactés",
          "Supprimer la promotion en cours sans explication",
          "Accuser les clients d'avoir généré trop de trafic",
          "Attendre la fin de la promotion pour agir",
        ],
        correctIndex: 1,
        explanation:
          "Un incident technique en période de forte activité commerciale nécessite une réaction rapide (résolution technique) et une communication transparente pour limiter la perte de confiance des clients impactés.",
      },
    ],
    difficile: [
      {
        question: "Un site e-commerce a un excellent trafic mais un taux de conversion très faible comparé à la moyenne du secteur. Où faut-il investiguer en priorité ?",
        options: [
          "Le trafic est le seul indicateur qui compte, il faut juste en générer davantage",
          "Le tunnel d'achat (étapes de paiement, frais de livraison affichés tardivement, formulaires trop longs) est souvent la cause principale d'un écart de conversion à trafic constant",
          "Il faut arrêter toute acquisition de trafic si la conversion est faible",
          "Le problème vient toujours du prix des produits, jamais du tunnel d'achat",
          "Un faible taux de conversion n'a jamais de cause identifiable",
        ],
        correctIndex: 1,
        explanation:
          "Un bon trafic avec une faible conversion pointe le plus souvent vers des frictions dans le tunnel d'achat -- une analyse fine (heatmaps, taux d'abandon par étape) permet d'isoler la cause réelle plutôt que de blâmer le prix par défaut.",
      },
      {
        question: "Pourquoi la personnalisation des recommandations produits (basée sur l'historique de navigation) pose-t-elle un équilibre délicat entre performance commerciale et respect de la vie privée ?",
        options: [
          "Il n'y a aucun équilibre à trouver, la personnalisation est toujours positive sans limite",
          "Une personnalisation trop poussée peut être perçue comme intrusive par le client et poser des questions de conformité RGPD sur l'usage des données",
          "Le RGPD ne s'applique jamais à la personnalisation e-commerce",
          "La personnalisation n'a aucun impact sur la perception du client",
          "Il faut toujours privilégier la performance commerciale, quelle que soit la perception client",
        ],
        correctIndex: 1,
        explanation:
          "Une recommandation trop précise peut mettre mal à l'aise le client sur l'usage fait de ses données -- un équilibre à trouver entre efficacité commerciale, transparence et conformité RGPD.",
      },
      {
        question: "Comment analyser objectivement une hausse du taux de retour produits après le lancement d'une nouvelle collection ?",
        options: [
          "Les retours sont toujours dus à un manque de qualité produit, sans autre explication possible",
          "Croiser les données (fiches produits, tailles/guide des tailles, avis clients, motifs de retour déclarés) pour identifier si le problème vient du produit, de sa présentation en ligne, ou d'attentes mal calibrées",
          "Ignorer la hausse tant que les ventes globales restent bonnes",
          "Supprimer la politique de retour pour limiter le phénomène",
          "Le taux de retour ne dépend jamais de la présentation en ligne du produit",
        ],
        correctIndex: 1,
        explanation:
          "Une hausse des retours a des causes multiples possibles (produit, présentation en ligne, attentes créées par le marketing) -- une analyse croisée des données est nécessaire avant de conclure, plutôt que de blâmer uniquement le produit.",
      },
      {
        question: "Pourquoi une stratégie de prix dynamique (ajustement automatique selon la demande et la concurrence) comporte-t-elle un risque de réputation, au-delà de son intérêt commercial ?",
        options: [
          "Elle ne comporte aucun risque, seulement des avantages",
          "Des clients peuvent constater des écarts de prix pour un même produit à quelques heures d'intervalle et percevoir cela comme déloyal, nuisant à la confiance envers la marque",
          "Le prix dynamique est toujours totalement invisible pour les clients",
          "Cette stratégie ne concerne que les compagnies aériennes",
          "Elle n'a aucun impact sur la perception de transparence du site",
        ],
        correctIndex: 1,
        explanation:
          "Un prix qui varie fortement et rapidement pour le même produit peut être perçu comme une pratique déloyale par les clients qui le remarquent -- un vrai risque de réputation à peser face au gain de marge espéré.",
      },
      {
        question: "Un site e-commerce international doit adapter son offre à des marchés très différents (paiement, livraison, culture d'achat). Quel est le principal piège à éviter ?",
        options: [
          "Il n'y a aucun piège, le même site fonctionne identiquement partout",
          "Répliquer telle quelle une stratégie qui fonctionne sur un marché sans l'adapter aux habitudes locales (moyens de paiement préférés, attentes de livraison, sensibilité au prix)",
          "Adapter systématiquement les prix est toujours suffisant pour réussir à l'international",
          "La langue est le seul élément à localiser, le reste peut rester identique",
          "L'international ne nécessite jamais d'adaptation logistique",
        ],
        correctIndex: 1,
        explanation:
          "Une expansion internationale réussie demande une vraie adaptation locale (paiement, livraison, attentes culturelles), pas seulement une traduction -- copier une stratégie sans adaptation est une des causes les plus fréquentes d'échec à l'international.",
      },
      {
        question: "Pourquoi la gestion des stocks entre plusieurs canaux de vente (site propre, marketplaces, magasin) est-elle un défi technique et organisationnel majeur ?",
        options: [
          "Ce n'est pas un vrai défi, les stocks se gèrent identiquement partout",
          "Un défaut de synchronisation peut entraîner une survente (produit vendu deux fois) ou une sous-exploitation du stock disponible, avec un impact direct sur la satisfaction client",
          "Les marketplaces gèrent automatiquement tous les problèmes de stock",
          "Ce défi ne concerne que les très grandes entreprises",
          "La synchronisation des stocks n'a aucun lien avec la satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "Une désynchronisation entre canaux peut provoquer une survente très mal vécue par le client (commande annulée après paiement) -- un vrai enjeu technique et organisationnel à maîtriser en multi-canal.",
      },
      {
        question: "Comment mesurer objectivement le retour sur investissement (ROI) d'une campagne d'acquisition client en e-commerce, au-delà du seul coût par clic ?",
        options: [
          "Le coût par clic suffit à lui seul à mesurer la rentabilité d'une campagne",
          "En suivant la valeur vie client (customer lifetime value) générée par les clients acquis, pas seulement le coût immédiat d'acquisition",
          "Il est impossible de mesurer objectivement le ROI d'une campagne d'acquisition",
          "Seul le nombre de clics généré compte réellement",
          "Le ROI ne dépend jamais du comportement du client après son premier achat",
        ],
        correctIndex: 1,
        explanation:
          "Une acquisition peut sembler chère à court terme mais rentable si elle génère des clients fidèles à forte valeur sur la durée (LTV) -- un vrai raisonnement de rentabilité doit dépasser le seul coût d'acquisition immédiat.",
      },
    ],
  },

  paramedical: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le paramédical ?",
        options: [
          "J'aime accompagner concrètement les gens dans l'amélioration de leur santé au quotidien",
          "Parce que ça a l'air un métier facile et peu exigeant",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le seul secteur qui recrutait",
          "Parce que je n'aime pas le contact humain",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à l'accompagnement concret de la santé des patients montre une vraie compréhension du métier, loin d'une idée de facilité inadaptée à ce secteur exigeant.",
      },
      {
        question: "Qu'est-ce qu'un bilan initial chez un professionnel paramédical (kiné, nutritionniste...) ?",
        options: [
          "Le paiement de la première séance",
          "L'évaluation de la situation du patient avant de définir un plan de prise en charge adapté",
          "Un simple rendez-vous administratif",
          "La dernière séance du suivi",
          "Un document envoyé uniquement à l'assurance",
        ],
        correctIndex: 1,
        explanation:
          "Le bilan initial permet de comprendre la situation spécifique du patient avant toute prise en charge -- une étape indispensable pour adapter les soins ou conseils à chaque cas.",
      },
      {
        question: "Un patient ne respecte pas les recommandations données (exercices, alimentation). Quelle est la meilleure attitude ?",
        options: [
          "Le culpabiliser fortement pour le faire réagir",
          "Comprendre les freins rencontrés et adapter les recommandations pour qu'elles soient plus réalistes à suivre",
          "Arrêter immédiatement le suivi",
          "Ignorer le problème et continuer comme si de rien n'était",
          "Le gronder comme un enfant",
        ],
        correctIndex: 1,
        explanation:
          "Comprendre les freins réels (temps, motivation, compréhension) et adapter les recommandations en conséquence est bien plus efficace que la culpabilisation, qui décourage souvent davantage le patient.",
      },
      {
        question: "Qu'est-ce que le secret professionnel dans un métier paramédical ?",
        options: [
          "Une règle facultative selon les professionnels",
          "L'obligation de ne pas divulguer les informations de santé des patients sans leur consentement",
          "Le droit de partager les informations avec la famille sans limite",
          "Une règle qui ne s'applique qu'aux médecins",
          "L'obligation de cacher les informations même au patient lui-même",
        ],
        correctIndex: 1,
        explanation:
          "Le secret professionnel protège la confidentialité des informations de santé -- une obligation stricte, y compris pour les professions paramédicales, avec des exceptions légales très encadrées.",
      },
      {
        question: "Pourquoi l'écoute active du patient est-elle une compétence essentielle dans le paramédical ?",
        options: [
          "Elle n'a aucun impact réel sur la qualité du suivi",
          "Elle permet de bien comprendre les symptômes, les habitudes et les attentes du patient pour adapter la prise en charge",
          "Elle ne concerne que les patients les plus âgés",
          "Elle est secondaire par rapport aux compétences techniques",
          "Elle n'est utile qu'au premier rendez-vous",
        ],
        correctIndex: 1,
        explanation:
          "Une écoute attentive permet de recueillir des informations essentielles à une prise en charge pertinente -- une compétence humaine aussi importante que les compétences techniques dans ce métier.",
      },
    ],
    medium: [
      {
        question: "Pourquoi un professionnel paramédical doit-il rester dans les limites de son champ de compétence légal ?",
        options: [
          "Cette limite n'existe pas réellement en pratique",
          "Dépasser son champ de compétence (ex: poser un diagnostic médical réservé aux médecins) engage sa responsabilité et peut mettre en danger le patient",
          "Cette règle ne s'applique qu'aux professions les moins qualifiées",
          "Le champ de compétence n'a aucun lien avec la sécurité du patient",
          "Il est toujours préférable d'aider au maximum, même hors de ses compétences",
        ],
        correctIndex: 1,
        explanation:
          "Chaque profession paramédicale a un champ de compétence légal précis : le dépasser (par exemple en posant un diagnostic) engage la responsabilité du professionnel et peut nuire au patient par une prise en charge inadaptée.",
      },
      {
        question: "Un patient présente des signes qui te semblent inquiétants mais hors de ton champ de compétence. Que fais-tu ?",
        options: [
          "Ignorer les signes s'ils ne concernent pas directement ta spécialité",
          "Orienter le patient vers le professionnel de santé compétent (médecin) sans tarder, en expliquant pourquoi",
          "Tenter de diagnostiquer toi-même le problème",
          "Attendre la prochaine séance pour en reparler",
          "Dire au patient de chercher lui-même une solution",
        ],
        correctIndex: 1,
        explanation:
          "Face à un signe inquiétant hors de son champ de compétence, orienter rapidement vers le bon professionnel est la réponse responsable -- ni l'ignorer, ni tenter de diagnostiquer soi-même une pathologie qui n'est pas de son ressort.",
      },
      {
        question: "Pourquoi la coordination avec d'autres professionnels de santé (médecin traitant, autres spécialistes) est-elle importante dans le suivi d'un patient ?",
        options: [
          "Elle n'a aucun intérêt, chaque professionnel travaille de façon isolée",
          "Elle permet une prise en charge cohérente et évite les contradictions ou redondances entre les différents suivis du patient",
          "Elle ne concerne que les cas les plus graves",
          "Elle ralentit inutilement la prise en charge",
          "Elle n'est utile que pour des raisons administratives",
        ],
        correctIndex: 1,
        explanation:
          "Un patient suivi par plusieurs professionnels bénéficie d'une prise en charge bien plus cohérente quand ces derniers communiquent -- un manque de coordination peut créer des recommandations contradictoires.",
      },
      {
        question: "Qu'est-ce que le consentement éclairé du patient avant un soin ou un programme de suivi ?",
        options: [
          "Une simple signature administrative sans réelle explication",
          "L'accord du patient donné après avoir reçu une explication claire des soins proposés, de leurs bénéfices et de leurs limites",
          "Un document que seul le médecin doit faire signer",
          "Une formalité facultative selon le professionnel",
          "Un accord qui ne peut jamais être retiré une fois donné",
        ],
        correctIndex: 1,
        explanation:
          "Le consentement éclairé implique une explication réelle et compréhensible pour le patient, pas une simple formalité -- un principe éthique et légal fondamental dans les professions de santé.",
      },
      {
        question: "Un patient stagne dans sa progression malgré un suivi rigoureux. Comment réagir professionnellement ?",
        options: [
          "Continuer exactement le même programme sans se remettre en question",
          "Réévaluer objectivement la situation, ajuster le plan de prise en charge, et si besoin solliciter un avis complémentaire",
          "Dire au patient que c'est entièrement de sa faute",
          "Arrêter le suivi sans explication",
          "Ignorer la stagnation tant que le patient ne se plaint pas",
        ],
        correctIndex: 1,
        explanation:
          "Une stagnation malgré un suivi rigoureux doit conduire à réévaluer l'approche plutôt qu'à continuer identique ou à en rejeter la responsabilité uniquement sur le patient.",
      },
      {
        question: "Pourquoi l'actualisation régulière des connaissances (formation continue) est-elle particulièrement importante dans les métiers paramédicaux ?",
        options: [
          "Les connaissances en santé n'évoluent jamais une fois acquises",
          "Les recommandations et techniques évoluent avec la recherche scientifique, et un professionnel doit actualiser sa pratique pour rester pertinent et sûr",
          "La formation continue n'est qu'une contrainte administrative sans réel intérêt",
          "Elle ne concerne que les professionnels en début de carrière",
          "Elle est facultative une fois le diplôme obtenu",
        ],
        correctIndex: 1,
        explanation:
          "Les pratiques de santé évoluent avec la recherche : un professionnel qui n'actualise pas ses connaissances risque d'appliquer des méthodes dépassées, voire inadaptées, à ses patients.",
      },
    ],
    difficile: [
      {
        question: "Un patient mineur demande une prise en charge sans en informer ses parents, sur un sujet sensible. Comment concilier confidentialité et cadre légal ?",
        options: [
          "Informer systématiquement les parents dans tous les cas, sans exception",
          "Connaître précisément le cadre légal applicable (certains soins peuvent être dispensés sans accord parental selon l'âge et la situation) et l'expliquer clairement au mineur",
          "Refuser toute prise en charge d'un mineur sans ses parents, dans tous les cas",
          "Ignorer la demande du mineur et ne rien faire",
          "Décider au cas par cas selon son ressenti personnel, sans se référer au cadre légal",
        ],
        correctIndex: 1,
        explanation:
          "Le cadre légal prévoit des exceptions précises à l'autorisation parentale selon le type de soin et l'âge du mineur -- connaître ce cadre est essentiel pour concilier protection du mineur et respect de sa confidentialité.",
      },
      {
        question: "Pourquoi l'approche interdisciplinaire (kiné, nutritionniste, psychologue...) est-elle de plus en plus valorisée dans la prise en charge de pathologies chroniques ?",
        options: [
          "Elle n'apporte aucune valeur ajoutée par rapport à un suivi isolé",
          "Une pathologie chronique a souvent des dimensions physiques, nutritionnelles et psychologiques imbriquées, qu'une approche isolée ne peut pas traiter efficacement dans leur ensemble",
          "Cette approche ne concerne que les pathologies les plus rares",
          "Elle complique inutilement le parcours du patient sans bénéfice réel",
          "L'interdisciplinarité n'a aucun lien avec l'efficacité du traitement",
        ],
        correctIndex: 1,
        explanation:
          "Les pathologies chroniques touchent souvent plusieurs dimensions de la vie du patient -- une approche interdisciplinaire coordonnée traite ces dimensions ensemble, avec une efficacité souvent supérieure à des suivis isolés et non coordonnés.",
      },
      {
        question: "Comment gérer une situation où un patient conteste ouvertement la pertinence des recommandations professionnelles, en s'appuyant sur des informations trouvées en ligne ?",
        options: [
          "Rejeter immédiatement toute discussion sur le sujet",
          "Prendre le temps d'expliquer le raisonnement professionnel avec pédagogie, en distinguant les sources fiables des informations non vérifiées, sans dévaloriser le patient",
          "Accepter systématiquement les informations du patient sans discussion",
          "Mettre fin au suivi si le patient conteste les recommandations",
          "Ignorer complètement la question posée par le patient",
        ],
        correctIndex: 1,
        explanation:
          "Face à une désinformation potentielle, la pédagogie et l'explication du raisonnement scientifique, sans dévaloriser le patient, permettent de restaurer la confiance sans rejeter brutalement son questionnement.",
      },
      {
        question: "Pourquoi l'observance thérapeutique (le fait de suivre réellement les recommandations) est-elle un enjeu à la fois individuel et de santé publique ?",
        options: [
          "Elle ne concerne que la responsabilité individuelle du patient, sans enjeu collectif",
          "Une mauvaise observance dégrade les résultats individuels mais aussi les coûts globaux du système de santé (complications évitables, ré-hospitalisations)",
          "L'observance thérapeutique n'a aucun impact mesurable",
          "Ce sujet ne concerne que les traitements médicamenteux, jamais le paramédical",
          "L'observance dépend uniquement de la volonté du patient, jamais de la qualité de l'accompagnement",
        ],
        correctIndex: 1,
        explanation:
          "Une mauvaise observance a un coût individuel (moins bons résultats) et collectif (charge accrue sur le système de santé) -- améliorer l'accompagnement et la pédagogie du professionnel a un impact réel sur ce phénomène.",
      },
      {
        question: "Comment un professionnel paramédical doit-il réagir en cas de doute sur une possible situation de maltraitance chez un patient (enfant ou personne vulnérable) ?",
        options: [
          "Ne rien faire tant qu'il n'a pas de preuve formelle et irréfutable",
          "Suivre les procédures légales de signalement prévues (cellule de recueil des informations préoccupantes, procureur si urgence), sans attendre une certitude absolue",
          "Confronter directement la famille suspectée sans passer par les autorités compétentes",
          "Ignorer le sujet, ce n'est pas de son ressort professionnel",
          "En parler uniquement à des collègues de façon informelle sans suivre de procédure",
        ],
        correctIndex: 1,
        explanation:
          "La loi encourage le signalement dès un doute sérieux et raisonnable, sans exiger de preuve formelle -- le professionnel doit connaître et suivre les procédures officielles de signalement, sans agir seul ni rester silencieux.",
      },
      {
        question: "Pourquoi la question du \"juste soin\" (ni excès ni insuffisance de prise en charge) est-elle un enjeu éthique et économique complexe en santé ?",
        options: [
          "Il n'y a aucun enjeu réel, plus de soins est toujours préférable",
          "Un excès de soins peut exposer inutilement le patient à des risques et gonfler les coûts, tandis qu'une insuffisance peut aggraver son état -- un équilibre à évaluer au cas par cas",
          "Cette question ne concerne que les médecins, jamais le paramédical",
          "Le juste soin se définit uniquement par le prix le plus bas possible",
          "Cet équilibre n'a aucun impact sur la qualité de vie du patient",
        ],
        correctIndex: 1,
        explanation:
          "Trop de soins comme trop peu peuvent nuire au patient et au système de santé -- une évaluation individualisée et réfléchie du juste besoin est un vrai enjeu éthique, pas une simple question de quantité de soins prodigués.",
      },
      {
        question: "Comment un professionnel doit-il gérer l'épuisement émotionnel (burn-out) lié à l'accompagnement répété de patients en souffrance ?",
        options: [
          "Ignorer ses propres limites, le patient doit toujours passer avant tout",
          "Reconnaître les signes d'épuisement, mettre en place une supervision ou un soutien professionnel, et ajuster sa charge si nécessaire pour continuer à exercer avec qualité",
          "Changer immédiatement de métier dès les premiers signes de fatigue",
          "Cacher systématiquement ses difficultés à ses collègues et à sa hiérarchie",
          "Considérer que l'épuisement professionnel n'existe pas dans ce métier",
        ],
        correctIndex: 1,
        explanation:
          "Un professionnel épuisé prend soin moins bien de ses patients -- reconnaître les signes d'épuisement et chercher du soutien (supervision, ajustement de charge) protège autant le professionnel que la qualité de l'accompagnement offert.",
      },
    ],
  },

  securite_civile: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la sécurité civile (pompiers, police, secours) ?",
        options: [
          "J'ai envie de protéger les autres et d'intervenir concrètement en situation d'urgence",
          "Parce que ça a l'air un métier facile et sans danger",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le seul secteur qui recrutait",
          "Parce que je veux juste porter un uniforme",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la protection des autres et à l'intervention en situation d'urgence montre une vraie compréhension des enjeux du métier, loin d'une image superficielle ou d'un métier sans risque.",
      },
      {
        question: "Que signifie le sigle \"SAMU\" ?",
        options: [
          "Service d'Aide Médicale Urgente",
          "Système d'Alerte Municipale d'Urgence",
          "Sécurité et Assistance Multi-Usagers",
          "Service Administratif Municipal Unifié",
          "Structure d'Accueil Médical Universel",
        ],
        correctIndex: 0,
        explanation:
          "Le SAMU coordonne la réponse médicale d'urgence, notamment via la régulation des appels au 15 et l'envoi de moyens adaptés à la gravité de la situation.",
      },
      {
        question: "Sur une intervention, tu constates un danger que tu n'avais pas anticipé. Que fais-tu ?",
        options: [
          "Continuer comme prévu sans en tenir compte",
          "Réévaluer immédiatement la situation et adapter l'intervention en sécurité, en informant l'équipe",
          "Ignorer le danger s'il ne te concerne pas directement",
          "Arrêter totalement l'intervention sans en informer personne",
          "Improviser seul sans consulter l'équipe",
        ],
        correctIndex: 1,
        explanation:
          "La sécurité de l'équipe et des victimes prime : réévaluer et communiquer immédiatement un danger nouveau est un réflexe indispensable, jamais une improvisation isolée ou un déni du risque.",
      },
      {
        question: "Qu'est-ce que le \"tri\" (triage) en situation d'urgence avec plusieurs victimes ?",
        options: [
          "Le classement administratif des rapports d'intervention",
          "L'évaluation rapide de la gravité de chaque victime pour prioriser les soins et l'évacuation",
          "Le tri du matériel après l'intervention",
          "La répartition des tâches entre collègues",
          "Le choix de l'hôpital de destination uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le triage permet de prioriser les soins selon l'urgence vitale de chaque victime, une méthode essentielle en cas d'afflux massif de blessés.",
      },
      {
        question: "Pourquoi le travail en équipe est-il absolument central dans les métiers de la sécurité civile ?",
        options: [
          "Il n'a aucune importance réelle sur le terrain",
          "La sécurité de chacun et l'efficacité de l'intervention dépendent directement de la coordination et de la confiance entre coéquipiers",
          "Le travail en équipe ne concerne que les tâches administratives",
          "Chaque intervenant agit toujours seul sur le terrain",
          "Il n'est utile qu'en cas de très grosse intervention",
        ],
        correctIndex: 1,
        explanation:
          "Une intervention de sécurité civile repose sur une coordination rigoureuse entre coéquipiers -- la sécurité de tous, secouristes comme victimes, en dépend directement.",
      },
    ],
    medium: [
      {
        question: "Que signifie la notion de \"chaîne de survie\" en secourisme ?",
        options: [
          "La liste des numéros d'urgence à connaître",
          "L'enchaînement d'actions (alerte, gestes de premiers secours, arrivée des secours spécialisés, soins hospitaliers) qui conditionne les chances de survie d'une victime",
          "Le matériel médical transporté dans une ambulance",
          "L'organisation hiérarchique d'une caserne",
          "Un protocole réservé uniquement aux arrêts cardiaques",
        ],
        correctIndex: 1,
        explanation:
          "La chaîne de survie décrit l'ensemble des maillons successifs (alerte rapide, premiers gestes, secours spécialisés, prise en charge hospitalière) dont la rapidité et la qualité influencent directement le pronostic de la victime.",
      },
      {
        question: "Sur une intervention, une victime refuse d'être prise en charge malgré un état préoccupant. Comment réagir ?",
        options: [
          "Partir immédiatement puisque la victime refuse",
          "Expliquer clairement les risques encourus, tenter de convaincre avec pédagogie, et suivre le protocole prévu pour ce type de situation (refus de soins)",
          "Forcer la prise en charge sans discussion",
          "Ignorer la situation et attendre qu'elle empire",
          "Laisser un collègue moins expérimenté décider seul",
        ],
        correctIndex: 1,
        explanation:
          "Un refus de soins doit être pris au sérieux mais explicité avec pédagogie sur les risques, tout en suivant un protocole précis (souvent une trace écrite ou un avis médical) -- ni l'abandon immédiat, ni la contrainte physique ne sont des réponses adaptées.",
      },
      {
        question: "Pourquoi le débriefing après une intervention difficile est-il important pour une équipe de secours ?",
        options: [
          "Il n'a aucune utilité une fois l'intervention terminée",
          "Il permet d'analyser ce qui a bien ou moins bien fonctionné, et de soutenir psychologiquement les intervenants exposés à une situation difficile",
          "Il ne sert qu'à remplir des documents administratifs",
          "Il ne concerne que les interventions ayant échoué",
          "Il doit toujours être évité pour ne pas raviver le stress",
        ],
        correctIndex: 1,
        explanation:
          "Le débriefing sert à la fois à l'amélioration opérationnelle (ce qui a fonctionné ou non) et au soutien psychologique des équipes confrontées à des situations parfois traumatisantes.",
      },
      {
        question: "Qu'est-ce que le principe de \"légitime défense\" pour un agent de sécurité ou de police ?",
        options: [
          "Le droit d'utiliser la force dans n'importe quelle situation de désaccord",
          "Le droit d'utiliser une force strictement proportionnée et nécessaire pour répondre à une agression réelle et immédiate",
          "Un droit qui ne s'applique jamais aux forces de l'ordre",
          "Le droit d'agir sans aucune limite en cas de doute",
          "Une notion purement théorique sans application pratique",
        ],
        correctIndex: 1,
        explanation:
          "La légitime défense encadre strictement l'usage de la force : elle doit être nécessaire, immédiate et proportionnée à la menace réelle -- un cadre légal précis, pas une liberté d'action totale.",
      },
      {
        question: "Pourquoi la gestion du stress est-elle une compétence entraînée spécifiquement dans les métiers de sécurité civile ?",
        options: [
          "Le stress n'a aucun impact sur la qualité d'une intervention",
          "Un stress mal maîtrisé peut altérer le jugement et les gestes techniques, dans des situations où chaque décision compte",
          "Cette compétence ne concerne que les nouvelles recrues",
          "Le stress est identique pour tout le monde et ne peut pas être entraîné",
          "La gestion du stress ne concerne que la vie personnelle, jamais le travail",
        ],
        correctIndex: 1,
        explanation:
          "Un stress non maîtrisé peut dégrader le jugement et la précision des gestes techniques -- c'est pourquoi les entraînements incluent spécifiquement des mises en situation stressantes pour préparer les intervenants.",
      },
      {
        question: "Un témoin fournit des informations contradictoires lors d'une intervention. Comment traiter cette situation avec rigueur ?",
        options: [
          "Ignorer systématiquement tout témoignage en cas de contradiction",
          "Recueillir chaque version factuellement, sans jugement immédiat, et croiser avec d'autres éléments disponibles avant toute conclusion",
          "Croire automatiquement le premier témoin qui s'est exprimé",
          "Confronter publiquement les témoins entre eux sur le terrain",
          "Arrêter immédiatement l'intervention tant que la contradiction n'est pas résolue",
        ],
        correctIndex: 1,
        explanation:
          "Des témoignages contradictoires sont fréquents et ne doivent pas être jugés à chaud : les recueillir factuellement et les croiser avec d'autres éléments permet une évaluation plus fiable de la situation.",
      },
    ],
    difficile: [
      {
        question: "Sur une intervention avec plusieurs victimes et des moyens limités, comment justifier une décision de priorisation qui laisse une victime grave en attente ?",
        options: [
          "Cette décision ne peut jamais être justifiée, il faut toujours traiter en premier la victime la plus grave rencontrée",
          "En appliquant rigoureusement les critères de triage (chances de survie réelles avec les moyens disponibles), documentés et objectivés plutôt que basés sur l'émotion du moment",
          "En laissant chaque intervenant décider selon son ressenti personnel sans méthode commune",
          "En traitant systématiquement les victimes dans l'ordre d'arrivée sur les lieux",
          "Cette question ne se pose jamais en situation réelle",
        ],
        correctIndex: 1,
        explanation:
          "Le triage en situation de moyens limités repose sur des critères objectifs de chances de survie réelles, pas sur l'ordre d'arrivée ou l'émotion -- une méthode difficile mais nécessaire pour maximiser le nombre de vies sauvées globalement.",
      },
      {
        question: "Pourquoi l'usage de la force par les forces de l'ordre fait-il l'objet d'un encadrement de plus en plus strict et documenté (caméras-piétons, rapports détaillés) ?",
        options: [
          "Cet encadrement n'a aucune utilité pratique",
          "Il vise à garantir la proportionnalité de l'usage de la force, protéger à la fois les citoyens et les agents, et permettre un contrôle a posteriori en cas de contestation",
          "Il sert uniquement à limiter le travail des forces de l'ordre sans autre objectif",
          "Cet encadrement ne concerne que les pays étrangers",
          "Il n'a aucun lien avec la confiance des citoyens envers les institutions",
        ],
        correctIndex: 1,
        explanation:
          "Documenter l'usage de la force protège à la fois les citoyens (contrôle de la proportionnalité) et les agents eux-mêmes (preuve en cas de contestation) -- un encadrement qui renforce la légitimité de l'action plutôt qu'il ne la limite arbitrairement.",
      },
      {
        question: "Comment un chef d'équipe doit-il gérer une intervention où un coéquipier commet une erreur qui aurait pu avoir des conséquences graves ?",
        options: [
          "Ignorer l'erreur si elle n'a finalement causé aucun dommage",
          "Analyser objectivement la cause de l'erreur (fatigue, formation, procédure mal comprise) en débriefing, sans humiliation, pour éviter qu'elle se reproduise",
          "Sanctionner immédiatement et publiquement le coéquipier sans analyse",
          "Ne jamais aborder le sujet pour préserver la cohésion d'équipe",
          "Reporter systématiquement la faute sur le chef d'équipe précédent",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur, même sans conséquence grave, mérite une analyse rigoureuse et pédagogique en équipe -- l'ignorer ou humilier publiquement le coéquipier compromettent tous deux la sécurité future des interventions.",
      },
      {
        question: "Pourquoi la santé mentale des intervenants de sécurité civile (exposition répétée à des situations traumatisantes) est-elle devenue un enjeu institutionnel majeur ?",
        options: [
          "Ce n'est qu'une question individuelle sans enjeu collectif pour l'institution",
          "Une exposition répétée sans accompagnement adapté peut mener à un stress post-traumatique affectant la qualité des interventions futures et la rétention des effectifs",
          "Les intervenants professionnels ne sont jamais affectés par le stress des interventions",
          "Cet enjeu ne concerne que les interventions les plus rares et exceptionnelles",
          "La santé mentale n'a aucun lien avec la performance opérationnelle",
        ],
        correctIndex: 1,
        explanation:
          "Un stress traumatique cumulé et non traité dégrade à la fois la santé des intervenants et la qualité opérationnelle des équipes -- d'où le développement de dispositifs de soutien psychologique structurés dans ces institutions.",
      },
      {
        question: "Comment concilier rapidité d'intervention et respect des procédures légales (ex: cadre d'intervention, réquisitions) dans une situation d'urgence extrême ?",
        options: [
          "Ignorer systématiquement les procédures légales en cas d'urgence",
          "Connaître suffisamment le cadre légal pour agir vite dans les situations qui l'autorisent explicitement (état de nécessité, péril imminent), sans que la rapidité ne devienne un prétexte à l'illégalité",
          "Toujours attendre une validation formelle avant d'agir, même en cas de danger immédiat",
          "Le cadre légal n'a aucune place dans une situation d'urgence réelle",
          "Cette tension n'existe jamais en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Le droit prévoit des cadres précis (état de nécessité, péril imminent) qui autorisent une action rapide sans attente formelle -- connaître ces cadres permet d'agir vite légalement, sans que l'urgence ne devienne un prétexte à s'affranchir de tout contrôle.",
      },
      {
        question: "Pourquoi la coordination inter-services (pompiers, police, SAMU) lors d'un événement de grande ampleur est-elle un défi organisationnel majeur ?",
        options: [
          "Chaque service peut agir de façon totalement indépendante sans coordination nécessaire",
          "Des chaînes de commandement, des cultures professionnelles et des priorités différentes doivent être synchronisées rapidement sous forte pression, avec un risque réel de confusion si la coordination est mal préparée",
          "La coordination inter-services n'a jamais posé de problème réel",
          "Ce défi ne concerne que les catastrophes naturelles",
          "Un seul service suffit toujours à gérer un événement de grande ampleur",
        ],
        correctIndex: 1,
        explanation:
          "Chaque service a sa propre culture, hiérarchie et priorité opérationnelle -- les synchroniser sous pression est un vrai défi que seuls des exercices inter-services réguliers et un poste de commandement unifié permettent de bien gérer.",
      },
      {
        question: "Comment analyser objectivement un échec d'intervention (ex: décès malgré une prise en charge conforme aux protocoles) sans tomber dans une recherche de coupable systématique ?",
        options: [
          "Il faut toujours identifier un responsable individuel à sanctionner",
          "Analyser le déroulé complet de façon factuelle (retour d'expérience) pour distinguer ce qui relevait d'une erreur évitable de ce qui relevait de l'issue tragique malgré une prise en charge correcte",
          "Ne jamais analyser un échec pour préserver le moral des équipes",
          "Un décès signifie automatiquement une erreur de prise en charge",
          "Cette analyse n'a aucune utilité pour les interventions futures",
        ],
        correctIndex: 1,
        explanation:
          "Un retour d'expérience factuel et sans recherche systématique de coupable permet de distinguer une vraie erreur évitable d'une issue tragique malgré une prise en charge conforme -- une distinction essentielle pour apprendre sans détruire la confiance des équipes.",
      },
    ],
  },

  intelligence_artificielle: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en intelligence artificielle / data science ?",
        options: [
          "J'aime comprendre comment on extrait des informations utiles à partir de données pour résoudre des problèmes concrets",
          "Parce que ça a l'air un domaine à la mode et facile à apprendre",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que je pense que l'IA va tout remplacer et je veux \"être du bon côté\"",
          "Parce que c'est le seul domaine qui recrutait",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation centrée sur la résolution de problèmes concrets à partir de données montre une compréhension réaliste du métier, plus solide qu'une mode ou une idée de facilité.",
      },
      {
        question: "Qu'est-ce qu'un \"jeu de données\" (dataset) en une phrase simple ?",
        options: [
          "Un logiciel de visualisation",
          "Un ensemble structuré de données utilisé pour entraîner ou tester un modèle",
          "Un type de base de données réservé aux jeux vidéo",
          "Un algorithme de tri",
          "Une interface utilisateur",
        ],
        correctIndex: 1,
        explanation:
          "Un dataset est la matière première de tout projet de data science ou de machine learning -- sans données de qualité, aucun modèle ne peut fonctionner correctement.",
      },
      {
        question: "Qu'est-ce que le \"machine learning\" (apprentissage automatique) ?",
        options: [
          "Un programme informatique classique écrit ligne par ligne pour chaque cas",
          "Une approche où un modèle apprend des motifs à partir de données, plutôt que d'être programmé explicitement pour chaque règle",
          "Un type de matériel informatique spécialisé",
          "Une technique de stockage de données",
          "Un langage de programmation",
        ],
        correctIndex: 1,
        explanation:
          "Le machine learning permet à un modèle de généraliser des motifs à partir d'exemples de données, plutôt que de suivre des règles écrites manuellement pour chaque cas.",
      },
      {
        question: "Tu obtiens un résultat étrange sur une analyse de données. Que fais-tu en premier ?",
        options: [
          "Publier le résultat tel quel sans vérification",
          "Vérifier la qualité et la cohérence des données sources avant de tirer une conclusion",
          "Supposer que le résultat est forcément correct",
          "Ignorer le résultat sans chercher à comprendre",
          "Modifier le résultat pour qu'il paraisse plus cohérent",
        ],
        correctIndex: 1,
        explanation:
          "Un résultat surprenant vient très souvent d'un problème dans les données (erreurs, valeurs manquantes, biais) plutôt que d'une découverte réelle -- vérifier la donnée avant de conclure est un réflexe indispensable.",
      },
      {
        question: "Que signifie l'acronyme \"IA\" ?",
        options: [
          "Information Automatique",
          "Intelligence Artificielle",
          "Interface Analytique",
          "Ingénierie Applicative",
          "Interaction Autonome",
        ],
        correctIndex: 1,
        explanation:
          "L'intelligence artificielle regroupe les techniques qui permettent à des systèmes informatiques de réaliser des tâches associées habituellement à l'intelligence humaine (reconnaissance, prédiction, génération...).",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre l'apprentissage supervisé et non supervisé en machine learning ?",
        options: [
          "Aucune différence réelle",
          "L'apprentissage supervisé utilise des données déjà étiquetées (avec la bonne réponse connue), le non supervisé cherche des structures dans des données non étiquetées",
          "Le non supervisé nécessite toujours plus de données que le supervisé",
          "L'apprentissage supervisé ne fonctionne que pour la reconnaissance d'images",
          "Le non supervisé est toujours plus précis que le supervisé",
        ],
        correctIndex: 1,
        explanation:
          "En apprentissage supervisé, le modèle apprend à partir d'exemples avec la réponse correcte connue (ex: emails classés spam/non-spam) ; en non supervisé, il découvre des structures sans étiquettes fournies (ex: regroupement de clients similaires).",
      },
      {
        question: "Qu'est-ce que le \"surapprentissage\" (overfitting) d'un modèle ?",
        options: [
          "Un modèle qui apprend trop lentement",
          "Un modèle qui apprend si précisément les données d'entraînement qu'il généralise mal à de nouvelles données",
          "Un modèle qui nécessite trop de mémoire informatique",
          "Un modèle qui ne peut jamais être corrigé",
          "Un modèle qui fonctionne uniquement sur des images",
        ],
        correctIndex: 1,
        explanation:
          "Un modèle en surapprentissage \"mémorise\" les données d'entraînement plutôt que d'apprendre des motifs généralisables -- il performe très bien à l'entraînement mais mal sur des données nouvelles, un piège classique à surveiller.",
      },
      {
        question: "Pourquoi la qualité et la représentativité des données d'entraînement sont-elles déterminantes pour la fiabilité d'un modèle ?",
        options: [
          "Elles n'ont aucun impact, seul l'algorithme compte",
          "Un modèle entraîné sur des données biaisées ou incomplètes reproduira ces biais dans ses prédictions, quelle que soit la sophistication de l'algorithme utilisé",
          "La qualité des données ne concerne que les très gros projets",
          "Un algorithme performant peut toujours corriger des données de mauvaise qualité",
          "Les données d'entraînement n'ont d'impact qu'au tout début du projet",
        ],
        correctIndex: 1,
        explanation:
          "Le principe \"garbage in, garbage out\" s'applique pleinement en IA : un modèle ne peut pas produire de résultats fiables ou justes si les données sur lesquelles il apprend sont biaisées ou de mauvaise qualité, quel que soit l'algorithme.",
      },
      {
        question: "Qu'est-ce qu'une \"métrique d'évaluation\" (comme la précision ou le rappel) sert à mesurer ?",
        options: [
          "La vitesse d'exécution du code uniquement",
          "La performance réelle d'un modèle sur une tâche donnée, selon des critères adaptés au problème à résoudre",
          "Le nombre de lignes de code du modèle",
          "Le coût financier du projet",
          "La taille du jeu de données utilisé",
        ],
        correctIndex: 1,
        explanation:
          "Choisir la bonne métrique (précision, rappel, F1-score...) selon le contexte du problème est essentiel : une métrique mal choisie peut donner une fausse impression de bonne performance du modèle.",
      },
      {
        question: "Un modèle de recommandation performe très bien en test mais génère des plaintes en production. Quelle piste investiguer en priorité ?",
        options: [
          "Le modèle est forcément mal codé, il faut tout refaire",
          "Un écart entre les données de test et les données réelles en production (distribution différente, nouveaux cas non vus à l'entraînement)",
          "Ignorer les plaintes, le test a validé le modèle",
          "Changer immédiatement d'algorithme sans investiguer la cause",
          "Ce problème ne peut jamais arriver si le modèle a été bien testé",
        ],
        correctIndex: 1,
        explanation:
          "Un écart entre les données utilisées en test et la réalité de production (\"data drift\") est une cause très fréquente de dégradation des performances observées -- une piste à investiguer avant de remettre en cause tout le modèle.",
      },
      {
        question: "Pourquoi l'explicabilité d'un modèle (comprendre pourquoi il prend telle décision) est-elle de plus en plus demandée, notamment dans des secteurs sensibles (santé, crédit) ?",
        options: [
          "L'explicabilité n'a aucune utilité pratique",
          "Elle permet de vérifier que la décision repose sur des critères pertinents et non discriminatoires, et de justifier la décision auprès des personnes concernées",
          "Elle ne concerne que les chercheurs en IA, jamais les utilisateurs finaux",
          "Un modèle performant n'a jamais besoin d'être expliqué",
          "L'explicabilité ralentit toujours les performances du modèle sans aucun bénéfice",
        ],
        correctIndex: 1,
        explanation:
          "Dans des domaines à fort impact (refus de crédit, diagnostic médical), comprendre le raisonnement d'un modèle permet de vérifier son équité et de le justifier auprès des personnes concernées -- un enjeu réglementaire et éthique croissant.",
      },
    ],
    difficile: [
      {
        question: "Un modèle de recrutement automatisé reproduit un biais historique de discrimination présent dans les données passées de l'entreprise. Quelle est la responsabilité du data scientist dans cette situation ?",
        options: [
          "Aucune responsabilité, le modèle ne fait que refléter les données historiques telles quelles",
          "Identifier et documenter le biais dès la phase d'analyse des données, alerter les parties prenantes, et proposer des mesures de correction avant tout déploiement",
          "Cacher le biais pour ne pas retarder le déploiement du projet",
          "Le biais est acceptable tant que le modèle reste globalement performant",
          "Cette responsabilité incombe uniquement aux équipes RH, jamais aux data scientists",
        ],
        correctIndex: 1,
        explanation:
          "Un modèle entraîné sur des données historiques biaisées reproduira et amplifiera ce biais -- le data scientist a la responsabilité technique et éthique de le détecter et de le signaler avant tout déploiement, pas de le dissimuler pour tenir un planning.",
      },
      {
        question: "Pourquoi le choix entre un modèle simple et interprétable et un modèle complexe plus performant (mais opaque) est-il un vrai arbitrage stratégique, pas seulement technique ?",
        options: [
          "Il faut toujours choisir le modèle le plus performant, sans autre considération",
          "Selon le contexte (enjeu réglementaire, besoin de confiance des utilisateurs, criticité des décisions), la capacité à expliquer une décision peut primer sur un léger gain de performance brute",
          "L'interprétabilité n'a jamais d'importance en pratique",
          "Un modèle complexe est toujours plus fiable qu'un modèle simple",
          "Ce choix ne dépend jamais du secteur d'application",
        ],
        correctIndex: 1,
        explanation:
          "Dans des contextes réglementés ou à fort enjeu de confiance, un modèle plus simple mais explicable peut être préférable à un modèle plus performant mais impossible à justifier -- un arbitrage business et éthique, pas uniquement une question de performance technique.",
      },
      {
        question: "Comment un data scientist doit-il réagir face à une direction qui souhaite déployer un modèle en production malgré des performances jugées insuffisantes lors des tests ?",
        options: [
          "Déployer sans discuter, la décision business prime toujours",
          "Présenter clairement les limites et les risques concrets identifiés lors des tests, en s'appuyant sur des données factuelles, avant que la décision finale ne soit prise en connaissance de cause",
          "Refuser de participer au projet sans explication",
          "Modifier discrètement les résultats des tests pour qu'ils semblent meilleurs",
          "Ignorer le sujet et laisser la responsabilité entièrement à la direction",
        ],
        correctIndex: 1,
        explanation:
          "Le rôle professionnel du data scientist est d'informer clairement des risques factuels avant une décision de déploiement -- falsifier des résultats est une faute grave, mais se taire face à un risque identifié l'est tout autant.",
      },
      {
        question: "Pourquoi la maintenance d'un modèle en production (monitoring, réentraînement périodique) est-elle aussi importante que sa conception initiale ?",
        options: [
          "Un modèle bien conçu reste performant indéfiniment sans aucune maintenance",
          "Le monde réel évolue (comportements, contexte économique, nouveaux cas) et un modèle non réentraîné voit ses performances se dégrader progressivement, un phénomène appelé dérive de modèle",
          "La maintenance ne concerne que les bugs informatiques classiques, jamais la performance du modèle",
          "Un modèle en production n'a jamais besoin d'être réévalué",
          "Ce sujet ne concerne que les très grandes entreprises technologiques",
        ],
        correctIndex: 1,
        explanation:
          "Le monde réel change en permanence, et un modèle figé finit par ne plus refléter la réalité actuelle (dérive de modèle) -- un monitoring continu et un réentraînement périodique sont indispensables pour maintenir sa pertinence dans le temps.",
      },
      {
        question: "Comment évaluer objectivement si un projet d'IA apporte une vraie valeur ajoutée par rapport à une solution plus simple (règles métier classiques, statistiques basiques) ?",
        options: [
          "L'IA est toujours supérieure à une solution simple par principe",
          "En comparant concrètement les performances, les coûts de mise en œuvre et de maintenance, et la complexité ajoutée, plutôt que de choisir l'IA par défaut ou par effet de mode",
          "Il est impossible de comparer objectivement ces deux approches",
          "Une solution simple ne peut jamais être aussi efficace qu'un modèle d'IA",
          "Le choix ne doit dépendre que de la popularité de la technologie utilisée",
        ],
        correctIndex: 1,
        explanation:
          "Un projet d'IA complexe n'est pas toujours justifié : comparer objectivement performance, coût et complexité face à une solution plus simple évite de sur-ingénierer un problème qui n'en avait pas besoin.",
      },
      {
        question: "Pourquoi la question de la propriété et de la confidentialité des données utilisées pour entraîner un modèle est-elle devenue un enjeu juridique majeur ?",
        options: [
          "Cette question n'a aucune importance tant que le modèle fonctionne bien",
          "Utiliser des données sans droit approprié (consentement, licence) peut exposer l'entreprise à des poursuites et remettre en cause l'usage même du modèle entraîné",
          "Les données utilisées pour l'entraînement n'appartiennent jamais à personne",
          "Ce sujet ne concerne que les modèles utilisant des données médicales",
          "La confidentialité des données n'a aucun lien avec la réglementation en vigueur",
        ],
        correctIndex: 1,
        explanation:
          "L'utilisation de données sans droit approprié (données personnelles sans consentement, contenus protégés par le droit d'auteur) expose à des risques juridiques réels -- un sujet à sécuriser dès la conception du projet, pas après son déploiement.",
      },
      {
        question: "Comment un data scientist peut-il limiter le risque qu'un modèle performant en interne échoue une fois confronté à des utilisateurs réels très divers ?",
        options: [
          "Ce risque n'existe pas si le modèle a de bonnes métriques en test",
          "En testant le modèle sur des populations et des cas d'usage aussi représentatifs que possible de la diversité réelle des utilisateurs finaux, au-delà du seul jeu de test initial",
          "En se basant uniquement sur les retours des premiers utilisateurs les plus enthousiastes",
          "En ignorant la diversité des utilisateurs, un bon modèle fonctionne pour tout le monde",
          "En limitant le déploiement aux utilisateurs qui ressemblent le plus aux données d'entraînement, sans jamais élargir",
        ],
        correctIndex: 1,
        explanation:
          "Un modèle testé sur un échantillon peu représentatif de la diversité réelle des utilisateurs peut échouer largement une fois déployé -- élargir les tests à des cas et profils variés en amont limite ce risque avant le déploiement à grande échelle.",
      },
    ],
  },
};
