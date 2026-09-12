// Banque de questions d'entretien statique, écrite à la main -- volontairement
// SANS dépendance IA (ni Mistral ni Groq) : le simulateur d'entretien ne doit
// jamais tomber en panne à cause d'un quota/modèle tiers, contrairement aux
// lettres de motivation et à l'audit CV. Les niveaux sont différenciés par le
// CONTENU (comportemental/générique en facile, technique pointu et pièges
// plausibles en difficile), pas seulement par le nombre de questions.

export type InterviewLevel = "facile" | "medium" | "difficile";

export type InterviewQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type InterviewDomain = { id: string; label: string };

export type Bank = Record<string, Record<InterviewLevel, InterviewQuestion[]>>;

const CORE_DOMAINS: InterviewDomain[] = [
  { id: "dev", label: "Développement web / informatique" },
  { id: "marketing", label: "Marketing digital" },
  { id: "rh", label: "Ressources humaines" },
  { id: "commerce", label: "Commerce / Vente" },
  { id: "gestion", label: "Gestion de projet / Comptabilité" },
];

export const QUESTION_COUNT_BY_LEVEL: Record<InterviewLevel, number> = {
  facile: 5,
  medium: 6,
  difficile: 7,
};

const CORE_BANK: Bank = {
  dev: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en développement ?",
        options: [
          "Parce que j'aime résoudre des problèmes concrets en construisant quelque chose qui fonctionne",
          "Parce que c'est bien payé",
          "Parce que mes parents me l'ont conseillé",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que je n'avais pas d'autre idée de métier",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation concrète et personnelle rassure le recruteur sur ton engagement réel ; les réponses vagues ou passives inquiètent plus qu'elles ne convainquent.",
      },
      {
        question: "Un recruteur te demande ton plus grand défaut. Quelle réponse est la plus crédible ?",
        options: [
          "Je n'ai aucun défaut",
          "Je suis trop perfectionniste, sans jamais donner d'exemple concret",
          "J'ai du mal à déléguer, mais j'apprends à découper mes tâches et à faire confiance à l'équipe",
          "Je suis nul en tout",
          "Je ne sais pas, je n'y ai jamais pensé",
        ],
        correctIndex: 2,
        explanation:
          "Un vrai défaut assumé, avec une piste d'amélioration concrète, montre de la lucidité. \"Aucun défaut\" ou le perfectionnisme cliché sans preuve sonnent creux.",
      },
      {
        question: "Que signifie \"HTML\" ?",
        options: [
          "HyperText Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlink and Text Marking Language",
          "Hyper Transfer Markup Logic",
        ],
        correctIndex: 0,
        explanation:
          "HTML est le langage de balisage (Markup Language) qui structure le contenu des pages web -- une base à connaître avant tout entretien technique.",
      },
      {
        question: "Que fait une variable en programmation ?",
        options: [
          "Elle affiche une page web",
          "Elle stocke une valeur qu'on peut réutiliser ou modifier",
          "Elle connecte à internet",
          "Elle supprime du code",
          "Elle compile le programme",
        ],
        correctIndex: 1,
        explanation:
          "Une variable est un espace nommé en mémoire pour stocker une donnée -- concept de base de tout langage de programmation.",
      },
      {
        question: "Comment réagis-tu quand un code que tu as écrit ne fonctionne pas comme prévu ?",
        options: [
          "Je recommence tout de zéro immédiatement",
          "Je relis le message d'erreur, isole le problème étape par étape, et cherche si besoin",
          "Je demande à quelqu'un de le faire à ma place",
          "J'abandonne la tâche",
          "Je copie une solution trouvée en ligne sans la comprendre",
        ],
        correctIndex: 1,
        explanation:
          "Une démarche de debug méthodique (comprendre l'erreur, isoler, chercher) est exactement ce qu'un recruteur veut entendre d'un futur développeur.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence principale entre \"let\" et \"const\" en JavaScript ?",
        options: [
          "Aucune différence, ce sont des synonymes",
          "\"let\" permet de réassigner la variable, \"const\" non",
          "\"const\" est plus rapide à l'exécution",
          "\"let\" ne fonctionne que dans les boucles",
          "\"const\" ne peut contenir que des nombres",
        ],
        correctIndex: 1,
        explanation:
          "\"const\" empêche la réassignation de la variable (mais pas la mutation d'un objet/tableau qu'elle référence) ; \"let\" autorise la réassignation.",
      },
      {
        question: "À quoi sert une API REST dans une application web ?",
        options: [
          "À styliser les pages en CSS",
          "À permettre à deux systèmes (ex: frontend et backend) d'échanger des données via des requêtes HTTP standardisées",
          "À compresser les images automatiquement",
          "À sécuriser uniquement les mots de passe",
          "À remplacer une base de données",
        ],
        correctIndex: 1,
        explanation:
          "Une API REST expose des ressources via des routes HTTP (GET, POST...) pour que différentes parties d'un système communiquent de façon standardisée.",
      },
      {
        question: "Que fait une requête SQL \"SELECT * FROM users WHERE age > 18\" ?",
        options: [
          "Elle supprime tous les utilisateurs de plus de 18 ans",
          "Elle crée une nouvelle table \"users\"",
          "Elle récupère toutes les colonnes des utilisateurs dont l'âge est supérieur à 18",
          "Elle met à jour l'âge des utilisateurs",
          "Elle compte le nombre d'utilisateurs",
        ],
        correctIndex: 2,
        explanation:
          "SELECT * récupère toutes les colonnes, FROM users cible la table, WHERE filtre les lignes selon la condition -- ici les utilisateurs majeurs.",
      },
      {
        question: "Comment gères-tu les priorités quand deux bugs urgents arrivent en même temps ?",
        options: [
          "Je traite le premier signalé sans évaluer l'impact",
          "J'évalue l'impact business et technique de chacun, j'en informe mon responsable, puis je priorise",
          "Je les ignore tous les deux jusqu'à la fin de la journée",
          "Je demande à un collègue de tout faire",
          "Je choisis celui qui semble le plus simple à corriger",
        ],
        correctIndex: 1,
        explanation:
          "Prioriser selon l'impact réel, en communiquant plutôt qu'en décidant seul dans le silence, est la réponse attendue en situation d'urgence partagée.",
      },
      {
        question: "Qu'est-ce que le \"responsive design\" ?",
        options: [
          "Un design qui répond automatiquement aux emails",
          "Une mise en page qui s'adapte à différentes tailles d'écran (mobile, tablette, ordinateur)",
          "Un site qui charge très vite",
          "Un design fait uniquement pour les développeurs",
          "Une technique de référencement SEO",
        ],
        correctIndex: 1,
        explanation:
          "Le responsive design garantit une expérience utilisable et lisible quel que soit l'appareil, via des grilles flexibles et des media queries CSS.",
      },
      {
        question: "Qu'est-ce que Git te permet de faire au quotidien ?",
        options: [
          "Héberger un site web",
          "Suivre l'historique des modifications du code et collaborer sans écraser le travail des autres",
          "Compiler automatiquement le code",
          "Créer des designs graphiques",
          "Envoyer des emails automatisés",
        ],
        correctIndex: 1,
        explanation:
          "Git est un système de contrôle de version : il trace chaque modification et permet à plusieurs personnes de travailler sur le même code sans se marcher dessus.",
      },
    ],
    difficile: [
      {
        question: "Que renvoie exactement `typeof null` en JavaScript, et pourquoi est-ce trompeur ?",
        options: [
          "\"null\", car c'est logique",
          "\"undefined\", car null n'a pas de type",
          "\"object\", un bug historique du langage conservé pour la rétrocompatibilité",
          "\"boolean\", car null équivaut à false",
          "Une erreur est levée",
        ],
        correctIndex: 2,
        explanation:
          "C'est un bug connu de la toute première version de JS jamais corrigé (casserait trop de code existant) : `typeof null` renvoie \"object\", pas \"null\".",
      },
      {
        question: "Dans un système avec forte charge, pourquoi préférer un index sur une colonne souvent filtrée en base de données ?",
        options: [
          "Ça ne change rien aux performances",
          "Ça ralentit toujours les lectures",
          "Ça accélère les recherches (WHERE, JOIN) en évitant un parcours complet de la table, au prix d'un coût en écriture/stockage",
          "Ça supprime le besoin de sauvegardes",
          "Ça remplace complètement le besoin d'une base de données",
        ],
        correctIndex: 2,
        explanation:
          "Un index accélère les lectures ciblées mais ralentit légèrement les écritures (l'index doit être mis à jour) -- un vrai compromis à connaître, pas une solution magique.",
      },
      {
        question: "Un test unitaire passe en local mais échoue en intégration continue. Quelle est la démarche la plus rigoureuse ?",
        options: [
          "Supprimer le test pour que la CI passe",
          "Relancer la CI en boucle jusqu'à ce que ça passe par hasard",
          "Vérifier les différences d'environnement (versions, variables d'env, données, fuseau horaire, ordre d'exécution des tests)",
          "Ignorer le problème, ça marche en local donc c'est suffisant",
          "Marquer le test comme \"skip\" définitivement",
        ],
        correctIndex: 2,
        explanation:
          "Un échec local/CI incohérent vient presque toujours d'une différence d'environnement ou d'une dépendance cachée entre tests -- jamais à masquer en supprimant le test.",
      },
      {
        question: "Pourquoi le rendu \"server-side\" (SSR) peut-il améliorer le référencement (SEO) par rapport à une app 100% côté client ?",
        options: [
          "Le SSR n'a aucun lien avec le SEO",
          "Parce que le HTML est déjà généré côté serveur, donc les moteurs de recherche voient le contenu sans exécuter de JavaScript",
          "Parce que le SSR rend le site payant",
          "Parce que le SSR bloque l'indexation",
          "Parce que le SSR supprime le besoin d'un nom de domaine",
        ],
        correctIndex: 1,
        explanation:
          "Certains robots d'indexation exécutent mal ou pas du tout le JavaScript côté client ; le SSR livre directement du HTML déjà rempli, plus fiable à indexer.",
      },
      {
        question: "On te demande de justifier un choix technique face à un collègue senior qui n'est pas d'accord. Quelle attitude est la plus professionnelle ?",
        options: [
          "Céder immédiatement sans discussion pour éviter le conflit",
          "Camper sur sa position sans écouter l'argument",
          "Exposer son raisonnement avec des arguments concrets, écouter le contre-argument, et trancher sur les faits plutôt que sur l'ego",
          "Contourner le collègue et faire à sa façon en cachette",
          "Escalader immédiatement au manager sans en discuter d'abord",
        ],
        correctIndex: 2,
        explanation:
          "Un désaccord technique se résout par les arguments et les faits, pas par la hiérarchie ou l'évitement -- une compétence clé recherchée même en alternance.",
      },
      {
        question: "Qu'est-ce qu'une \"race condition\" ?",
        options: [
          "Une compétition entre développeurs",
          "Un bug qui survient quand le résultat dépend de l'ordre imprévisible d'exécution d'opérations concurrentes",
          "Une erreur de syntaxe classique",
          "Un type de base de données",
          "Une technique d'optimisation volontaire",
        ],
        correctIndex: 1,
        explanation:
          "Une race condition apparaît quand plusieurs opérations accèdent/modifient une même ressource en parallèle, et que le résultat final dépend de qui \"arrive\" en premier -- source de bugs difficiles à reproduire.",
      },
      {
        question: "Pourquoi éviter de stocker un mot de passe en clair, même dans une base de données interne ?",
        options: [
          "Ce n'est pas grave si la base n'est jamais piratée",
          "Parce qu'en cas de fuite (base, backup, logs), tous les mots de passe seraient immédiatement exploitables -- il faut les hacher (ex: bcrypt) pour limiter les dégâts",
          "Parce que ça prend plus de place en clair",
          "Parce que la loi française l'interdit uniquement pour les entreprises cotées en bourse",
          "Ce n'est utile que pour les mots de passe administrateur",
        ],
        correctIndex: 1,
        explanation:
          "Le hachage (avec sel) rend les mots de passe inutilisables même en cas de fuite -- une négligence ici est une faute de sécurité majeure, quelle que soit la taille de l'entreprise.",
      },
    ],
  },
  marketing: {
    facile: [
      {
        question: "Qu'est-ce que le \"marketing digital\" englobe principalement ?",
        options: [
          "Uniquement la publicité à la télévision",
          "L'ensemble des actions marketing menées sur des supports numériques (réseaux sociaux, email, SEO, publicité en ligne...)",
          "Seulement la création de logos",
          "Uniquement la vente en magasin physique",
          "La comptabilité de l'entreprise",
        ],
        correctIndex: 1,
        explanation:
          "Le marketing digital regroupe tous les canaux numériques utilisés pour attirer, convertir et fidéliser des clients.",
      },
      {
        question: "Que signifie l'acronyme \"SEO\" ?",
        options: [
          "Search Engine Optimization (optimisation pour les moteurs de recherche)",
          "Social Engagement Online",
          "Sales and Export Operations",
          "Structured Email Outreach",
          "Site Explorer Online",
        ],
        correctIndex: 0,
        explanation:
          "Le SEO regroupe les techniques pour améliorer le positionnement d'un site dans les résultats de recherche organiques (non payants).",
      },
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en marketing digital ?",
        options: [
          "Parce que j'aime comprendre ce qui capte l'attention et convainc une audience, et je veux apprendre à le mesurer",
          "Parce que ça a l'air facile",
          "Je n'ai pas de raison particulière",
          "Parce que tous mes amis en font",
          "Parce que je veux juste utiliser Instagram au travail",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la compréhension de l'audience et à la mesure des résultats montre une vision réaliste du métier, au-delà des réseaux sociaux perçus comme \"amusants\".",
      },
      {
        question: "Qu'est-ce qu'une \"cible\" en marketing ?",
        options: [
          "Le budget total de la campagne",
          "Le groupe de personnes qu'une action marketing cherche à atteindre et convaincre",
          "Le nom de la marque",
          "Le logo de l'entreprise",
          "Le prix d'un produit",
        ],
        correctIndex: 1,
        explanation:
          "Définir sa cible (âge, besoins, comportements...) est la première étape de toute stratégie marketing efficace.",
      },
      {
        question: "Un post sur les réseaux sociaux a beaucoup de \"likes\" mais aucune vente. Que peux-tu en conclure ?",
        options: [
          "La campagne est un franc succès",
          "L'engagement (likes) ne suffit pas : il faut analyser si le message pousse réellement à l'action (le \"call-to-action\")",
          "Il faut immédiatement doubler le budget",
          "Les likes garantissent toujours des ventes à terme",
          "Le produit ne se vendra jamais",
        ],
        correctIndex: 1,
        explanation:
          "Un bon marketeur distingue les métriques de vanité (likes) des métriques business (conversions/ventes) et sait que les deux ne sont pas automatiquement liées.",
      },
    ],
    medium: [
      {
        question: "Que mesure le \"taux de conversion\" ?",
        options: [
          "Le nombre total de visiteurs d'un site",
          "Le pourcentage de visiteurs qui réalisent l'action souhaitée (achat, inscription...) parmi tous les visiteurs",
          "Le budget dépensé en publicité",
          "Le nombre d'abonnés sur les réseaux sociaux",
          "La durée moyenne de visite",
        ],
        correctIndex: 1,
        explanation:
          "Le taux de conversion = (actions réalisées / visiteurs totaux) × 100 -- un indicateur clé pour juger l'efficacité réelle d'une action marketing.",
      },
      {
        question: "Quelle est la différence entre le SEO et le SEA ?",
        options: [
          "Aucune différence",
          "Le SEO est payant, le SEA est gratuit",
          "Le SEO vise le référencement naturel (gratuit, sur le long terme), le SEA est de la publicité payante sur les moteurs de recherche",
          "Le SEA ne concerne que les réseaux sociaux",
          "Le SEO ne fonctionne que sur mobile",
        ],
        correctIndex: 2,
        explanation:
          "SEO = référencement naturel (contenu, structure du site...), SEA = Search Engine Advertising, les annonces payantes qui apparaissent en tête des résultats.",
      },
      {
        question: "Qu'est-ce qu'une \"persona\" marketing ?",
        options: [
          "Le PDG de l'entreprise",
          "Un profil type semi-fictif représentant un segment de clientèle réel, basé sur des données",
          "Un influenceur payé par la marque",
          "Le nom d'une campagne publicitaire",
          "Un logiciel de design",
        ],
        correctIndex: 1,
        explanation:
          "Un persona aide à orienter les messages et canaux marketing en incarnant les besoins, freins et habitudes d'un segment de client réel.",
      },
      {
        question: "Une campagne email a un très bon taux d'ouverture mais un taux de clic très faible. Où faut-il chercher le problème en priorité ?",
        options: [
          "L'objet de l'email (puisque le taux d'ouverture est bon, il fonctionne déjà)",
          "Le contenu et l'appel à l'action à l'intérieur de l'email",
          "Le nom de l'expéditeur",
          "L'heure d'envoi uniquement",
          "Il n'y a aucun problème à investiguer",
        ],
        correctIndex: 1,
        explanation:
          "Bon taux d'ouverture = l'objet fonctionne. Faible taux de clic = le contenu ou le call-to-action à l'intérieur ne convainc pas assez -- c'est là qu'il faut creuser.",
      },
      {
        question: "Que signifie \"ROI\" en marketing ?",
        options: [
          "Return On Investment (retour sur investissement)",
          "Rate Of Interaction",
          "Reach Of Influence",
          "Rank Of Importance",
          "Registered Online Identity",
        ],
        correctIndex: 0,
        explanation:
          "Le ROI mesure le gain généré par rapport au coût investi -- l'indicateur central pour justifier un budget marketing auprès d'une direction.",
      },
      {
        question: "Pourquoi segmenter sa liste email plutôt que d'envoyer le même message à tout le monde ?",
        options: [
          "Ça ne sert à rien, tout le monde doit recevoir le même message",
          "Parce qu'un message adapté au bon segment (intérêts, comportement, historique d'achat) obtient de meilleurs taux d'engagement et moins de désabonnements",
          "Parce que c'est obligatoire légalement",
          "Parce que ça réduit le nombre total d'emails à écrire",
          "Uniquement pour respecter le RGPD",
        ],
        correctIndex: 1,
        explanation:
          "La segmentation rend le message plus pertinent pour chaque destinataire, ce qui améliore mécaniquement l'engagement et réduit la lassitude/désabonnement.",
      },
    ],
    difficile: [
      {
        question: "Une campagne publicitaire a un excellent CTR (taux de clic) mais un CPA (coût par acquisition) très élevé. Que faut-il en déduire en priorité ?",
        options: [
          "La campagne est très rentable puisque le CTR est bon",
          "Le trafic généré clique mais convertit mal une fois sur le site/la landing page -- le problème est probablement en aval du clic",
          "Il faut augmenter le budget immédiatement sans rien changer",
          "Le CPA élevé est toujours une bonne nouvelle",
          "Il faut arrêter toute publicité définitivement",
        ],
        correctIndex: 1,
        explanation:
          "Un bon CTR avec un mauvais CPA pointe vers un problème de conversion post-clic (landing page, offre, tunnel d'achat), pas vers l'annonce elle-même qui, elle, fonctionne.",
      },
      {
        question: "Dans un test A/B, pourquoi est-il risqué de conclure après seulement 50 visiteurs sur chaque variante ?",
        options: [
          "50 visiteurs est toujours largement suffisant",
          "L'échantillon est probablement trop petit pour une significativité statistique fiable -- le résultat peut être dû au hasard",
          "Il faut toujours tester sur au moins un million de visiteurs",
          "Les tests A/B ne fonctionnent jamais sur un petit site",
          "Le nombre de visiteurs n'a aucune importance en A/B testing",
        ],
        correctIndex: 1,
        explanation:
          "Sans significativité statistique suffisante, une différence observée peut être due au bruit aléatoire plutôt qu'à un effet réel -- une erreur classique en marketing data.",
      },
      {
        question: "Un influenceur avec 500K abonnés génère moins de ventes qu'un micro-influenceur à 10K abonnés sur la même campagne. Quelle explication est la plus plausible ?",
        options: [
          "Le micro-influenceur a probablement une audience plus engagée et plus alignée avec la cible produit",
          "C'est impossible, plus d'abonnés égale toujours plus de ventes",
          "Le gros influenceur a forcément triché",
          "Le produit ne peut pas se vendre du tout",
          "Il faut ignorer ce résultat, ce n'est jamais représentatif",
        ],
        correctIndex: 0,
        explanation:
          "Les micro-influenceurs ont souvent un taux d'engagement et une proximité avec leur audience supérieurs, ce qui peut compenser largement une portée plus faible en volume.",
      },
      {
        question: "Ta direction veut couper le budget SEO car \"ça ne rapporte rien ce mois-ci\". Quel est l'argument le plus solide à apporter ?",
        options: [
          "Accepter sans discuter, la direction a toujours raison",
          "Expliquer que le SEO est un investissement à effet différé (plusieurs mois), et montrer l'évolution du trafic organique sur une période plus longue",
          "Dire que le SEO ne sert jamais à rien de toute façon",
          "Demander d'arrêter aussi la publicité payante en représailles",
          "Ignorer la demande sans répondre",
        ],
        correctIndex: 1,
        explanation:
          "Le SEO a un ROI différé par nature ; argumenter avec des données de tendance sur plusieurs mois, pas juste le mois en cours, est la réponse professionnelle attendue.",
      },
      {
        question: "Pourquoi le \"reciblage\" (retargeting) publicitaire peut-il devenir contre-productif s'il est mal dosé ?",
        options: [
          "Il ne peut jamais être contre-productif",
          "Une exposition trop fréquente aux mêmes publicités peut générer de l'agacement (\"ad fatigue\") et nuire à l'image de marque",
          "Le retargeting est interdit dans tous les pays",
          "Il coûte toujours plus cher que la publicité classique",
          "Il ne fonctionne que sur les réseaux sociaux",
        ],
        correctIndex: 1,
        explanation:
          "Trop de répétition publicitaire lasse et peut même créer un rejet actif de la marque -- il faut plafonner la fréquence d'exposition (frequency capping).",
      },
      {
        question: "Comment justifier objectivement qu'une campagne d'image de marque (branding) a fonctionné, alors qu'elle ne génère aucune vente directe mesurable ?",
        options: [
          "C'est impossible à justifier, il faut toujours viser une vente directe",
          "En mesurant des indicateurs intermédiaires pertinents (notoriété assistée, trafic direct, recherches de marque, sentiment) avant/après la campagne",
          "En attendant simplement que la direction fasse confiance",
          "En comparant uniquement le nombre de likes",
          "Le branding ne peut jamais être mesuré",
        ],
        correctIndex: 1,
        explanation:
          "Le branding se mesure via des proxys (notoriété, recherches de marque, trafic direct) plutôt qu'une vente immédiate -- savoir le formuler évite de sembler ne rien mesurer du tout.",
      },
      {
        question: "Une marque de niche envisage de \"scaler\" (augmenter fortement) son budget publicitaire Facebook Ads. Quel risque principal faut-il anticiper ?",
        options: [
          "Aucun risque, augmenter le budget améliore toujours les résultats proportionnellement",
          "La saturation de l'audience cible et la baisse de performance (CPA qui augmente) à mesure que le budget grossit",
          "Facebook interdira automatiquement le compte",
          "Le produit deviendra automatiquement plus cher à produire",
          "Le scaling n'a aucun effet sur les coûts",
        ],
        correctIndex: 1,
        explanation:
          "Une audience de niche s'épuise vite : au-delà d'un certain budget, on touche des segments moins pertinents et le coût par résultat augmente -- un phénomène de rendements décroissants à anticiper.",
      },
    ],
  },
  rh: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en ressources humaines ?",
        options: [
          "Parce que j'aime le contact humain et accompagner les gens dans leur parcours professionnel",
          "Parce que je ne sais pas quoi faire d'autre",
          "Parce que ça a l'air facile",
          "Parce que je n'aime pas la technique",
          "Je n'ai pas vraiment de raison",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation centrée sur l'accompagnement humain, plutôt qu'un choix par défaut, rassure sur ton engagement dans un métier très relationnel.",
      },
      {
        question: "Que signifie l'acronyme \"RH\" ?",
        options: [
          "Ressources Humaines",
          "Relations Hiérarchiques",
          "Rendement Horaire",
          "Recherche et Habilitation",
          "Règlement Hebdomadaire",
        ],
        correctIndex: 0,
        explanation:
          "Les Ressources Humaines gèrent tout ce qui concerne les collaborateurs : recrutement, paie, formation, droit du travail, climat social.",
      },
      {
        question: "Quelle est la première étape d'un processus de recrutement classique ?",
        options: [
          "Signer le contrat",
          "Définir précisément le besoin et rédiger la fiche de poste",
          "Organiser le pot de bienvenue",
          "Faire l'entretien final",
          "Négocier le salaire",
        ],
        correctIndex: 1,
        explanation:
          "Sans une définition claire du besoin (missions, compétences requises), tout le reste du processus de recrutement part sur des bases fragiles.",
      },
      {
        question: "Que dois-tu faire si un candidat en entretien te pose une question à laquelle tu ne connais pas la réponse ?",
        options: [
          "Inventer une réponse pour ne pas perdre la face",
          "Dire honnêtement que tu vas vérifier et revenir vers lui avec la bonne information",
          "Changer immédiatement de sujet",
          "Terminer l'entretien",
          "Rediriger la question vers le candidat",
        ],
        correctIndex: 1,
        explanation:
          "L'honnêteté et le suivi (\"je me renseigne et je reviens vers vous\") sont bien plus professionnels qu'une réponse inventée qui pourrait induire le candidat en erreur.",
      },
      {
        question: "Qu'est-ce qu'un \"onboarding\" ?",
        options: [
          "La procédure de licenciement",
          "Le processus d'intégration d'un nouveau collaborateur dans l'entreprise",
          "Un logiciel de paie",
          "Un entretien annuel d'évaluation",
          "Une formation obligatoire en fin de contrat",
        ],
        correctIndex: 1,
        explanation:
          "L'onboarding regroupe toutes les actions pour bien accueillir et intégrer un nouvel arrivant, un facteur clé de rétention dès les premiers mois.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre un CDI et un CDD ?",
        options: [
          "Aucune différence légale",
          "Le CDI est à durée indéterminée, le CDD a une durée et un motif de recours limités par la loi",
          "Le CDD est toujours mieux payé",
          "Le CDI ne concerne que les cadres",
          "Le CDD n'a pas de période d'essai",
        ],
        correctIndex: 1,
        explanation:
          "Le CDD doit obligatoirement justifier d'un motif légal (remplacement, surcroît d'activité...) et a une durée maximale encadrée par le Code du travail, contrairement au CDI.",
      },
      {
        question: "Un candidat brille en entretien mais ses anciens employeurs, contactés en référence, sont mitigés. Que fais-tu ?",
        options: [
          "Ignorer complètement les retours de référence",
          "Recroiser les informations : creuser les points mitigés directement avec le candidat avant de décider",
          "Refuser automatiquement le candidat sans lui en parler",
          "Embaucher immédiatement sans vérifier plus loin",
          "Ne jamais prendre de références, ça ne sert à rien",
        ],
        correctIndex: 1,
        explanation:
          "Une prise de référence mitigée mérite d'être creusée avec transparence, pas ignorée ni traitée comme un verdict définitif sans contradictoire.",
      },
      {
        question: "Qu'est-ce que la \"marque employeur\" ?",
        options: [
          "Le logo de l'entreprise",
          "L'image et la réputation qu'une entreprise projette en tant qu'employeur auprès des candidats et salariés",
          "La marque des produits vendus",
          "Un type de contrat de travail",
          "Le nom légal de la société",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne marque employeur facilite le recrutement et la rétention -- elle se construit via les avis, la culture d'entreprise et l'expérience candidat/salarié.",
      },
      {
        question: "Pourquoi le \"turnover\" (taux de rotation du personnel) élevé est-il généralement un signal d'alerte pour les RH ?",
        options: [
          "Ce n'est jamais un problème, plus de mouvement c'est mieux",
          "Il peut révéler des problèmes de management, de rémunération, ou de qualité de vie au travail à investiguer",
          "Il indique toujours que l'entreprise recrute trop bien",
          "Il n'a aucun coût pour l'entreprise",
          "Il ne concerne que les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Un turnover élevé coûte cher (recrutement, formation, perte de savoir) et signale souvent un problème sous-jacent à diagnostiquer plutôt qu'à ignorer.",
      },
      {
        question: "Que dois-tu vérifier en priorité pour garantir la conformité légale d'une offre d'emploi ?",
        options: [
          "Qu'elle ne comporte aucun critère discriminatoire (âge, sexe, origine...) et respecte le droit du travail",
          "Qu'elle soit la plus longue possible",
          "Qu'elle mentionne le salaire du dirigeant",
          "Qu'elle soit publiée uniquement sur un seul site",
          "Qu'elle soit rédigée en anglais uniquement",
        ],
        correctIndex: 0,
        explanation:
          "La non-discrimination à l'embauche est une obligation légale stricte en France -- un point de vigilance systématique pour toute offre d'emploi.",
      },
      {
        question: "Un salarié te fait part d'un conflit avec son manager. Quelle est la posture RH la plus appropriée ?",
        options: [
          "Prendre immédiatement parti pour le salarié",
          "Écouter les deux parties séparément, rester neutre, et chercher une résolution factuelle",
          "Ignorer le conflit, ce n'est pas le rôle des RH",
          "Licencier le manager sans enquête",
          "Dire au salarié de se débrouiller seul",
        ],
        correctIndex: 1,
        explanation:
          "La neutralité et l'écoute des deux parties sont essentielles pour une médiation crédible -- prendre parti immédiatement casserait la confiance de l'un des deux côtés.",
      },
    ],
    difficile: [
      {
        question: "Un manager souhaite écarter un salarié en arrêt maladie répété, sans lien avec une faute. Que dois-tu impérativement rappeler ?",
        options: [
          "C'est possible sans aucune précaution particulière",
          "Le licenciement pour absences répétées liées à la maladie est strictement encadré et risqué juridiquement (discrimination liée à l'état de santé) -- il faut consulter le droit du travail avant toute action",
          "Il suffit d'attendre la fin de la période d'essai",
          "C'est toujours interdit dans tous les cas, sans exception",
          "Ça ne concerne pas les RH",
        ],
        correctIndex: 1,
        explanation:
          "Licencier en lien avec l'état de santé expose à un risque de discrimination -- un cas où le rôle RH est justement de sécuriser juridiquement la décision de l'entreprise.",
      },
      {
        question: "Que signifie le principe \"à travail égal, salaire égal\" en droit du travail français ?",
        options: [
          "Tout le monde doit gagner exactement le même salaire dans l'entreprise",
          "Des salariés placés dans une situation identique (poste, compétences, ancienneté comparable) doivent percevoir une rémunération équivalente, sauf justification objective",
          "Ce principe ne s'applique qu'aux cadres",
          "Ce principe est purement indicatif, sans valeur légale",
          "Il ne concerne que les hommes et les femmes",
        ],
        correctIndex: 1,
        explanation:
          "C'est un principe légal général (pas limité à l'égalité femmes-hommes) : toute différence de traitement doit reposer sur des critères objectifs et vérifiables.",
      },
      {
        question: "Pourquoi un plan de succession est-il stratégique pour une entreprise, au-delà du remplacement d'un poste ?",
        options: [
          "Il ne sert qu'à remplir un document administratif",
          "Il anticipe les départs clés, réduit les risques de perte de compétences critiques, et prépare la relève en interne",
          "Il n'a aucune utilité réelle",
          "Il concerne uniquement le PDG",
          "Il remplace le besoin de recrutement externe",
        ],
        correctIndex: 1,
        explanation:
          "Un plan de succession protège l'entreprise contre la perte soudaine de compétences clés et valorise les talents internes en préparant leur montée en compétence.",
      },
      {
        question: "Un algorithme de tri de CV filtre systématiquement les candidatures avec des trous dans le parcours. Quel risque RH cela pose-t-il ?",
        options: [
          "Aucun risque, c'est purement une question d'efficacité",
          "Un biais discriminatoire indirect (ex: contre les parents ayant pris un congé, les personnes ayant eu un problème de santé) qui peut exposer l'entreprise juridiquement et humainement",
          "Cela garantit toujours les meilleurs profils",
          "Ce n'est un problème que si le candidat s'en plaint publiquement",
          "Les algorithmes ne peuvent jamais être biaisés",
        ],
        correctIndex: 1,
        explanation:
          "Un critère apparemment neutre (trou dans le CV) peut cacher une discrimination indirecte -- un vrai sujet d'actualité en éthique du recrutement algorithmique.",
      },
      {
        question: "Comment concilier confidentialité RH et transparence lors d'une restructuration impliquant des suppressions de postes ?",
        options: [
          "Tout garder secret jusqu'au dernier moment, sans aucune communication",
          "Suivre un cadre légal strict (information-consultation du CSE) tout en communiquant le plus tôt possible dans ce cadre pour limiter l'anxiété et les rumeurs",
          "Communiquer librement tous les détails individuels à toute l'entreprise",
          "Laisser chaque manager décider seul de ce qu'il dit",
          "Ignorer les obligations légales si l'entreprise est petite",
        ],
        correctIndex: 1,
        explanation:
          "Une restructuration implique des obligations légales précises (information du CSE) ; au sein de ce cadre, une communication rapide et cohérente limite les dégâts humains et les rumeurs.",
      },
      {
        question: "Pourquoi le \"biais de confirmation\" est-il particulièrement dangereux en entretien de recrutement ?",
        options: [
          "Il n'a aucun impact réel sur la décision finale",
          "Le recruteur peut inconsciemment chercher des éléments confirmant sa première impression plutôt que d'évaluer objectivement tous les faits",
          "Il ne concerne que les candidats, jamais les recruteurs",
          "C'est un concept purement théorique sans application pratique",
          "Il garantit toujours un recrutement de meilleure qualité",
        ],
        correctIndex: 1,
        explanation:
          "Une première impression (bonne ou mauvaise) peut biaiser toute la suite de l'entretien si le recruteur cherche inconsciemment à la confirmer -- d'où l'intérêt de grilles d'évaluation structurées.",
      },
      {
        question: "Un salarié demande à consulter son dossier personnel RH. Quelle est la règle applicable ?",
        options: [
          "C'est toujours refusé, le dossier appartient uniquement à l'entreprise",
          "Le salarié a un droit d'accès à ses données personnelles (RGPD), l'entreprise doit lui permettre de les consulter",
          "Seul un juge peut autoriser cet accès",
          "Le salarié ne peut consulter son dossier qu'une seule fois dans sa carrière",
          "Cela dépend uniquement du bon vouloir du manager",
        ],
        correctIndex: 1,
        explanation:
          "Le RGPD garantit à toute personne un droit d'accès à ses données personnelles, y compris dans son dossier RH -- un principe à connaître, pas une simple faveur accordée.",
      },
    ],
  },
  commerce: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en commerce/vente ?",
        options: [
          "J'aime comprendre les besoins d'un client et lui proposer une solution adaptée",
          "Parce que parler aux gens est facile pour tout le monde",
          "Je n'ai pas de raison particulière",
          "Parce que c'est le seul métier qui recrutait",
          "Parce que je veux éviter tout travail d'équipe",
        ],
        correctIndex: 0,
        explanation:
          "La vente, ce n'est pas \"parler facilement\" mais comprendre un besoin et y répondre -- une réponse orientée client est ce qu'attend un recruteur commercial.",
      },
      {
        question: "Un client te dit \"c'est trop cher\". Quelle est la meilleure première réaction ?",
        options: [
          "Baisser immédiatement le prix",
          "Comprendre ce qui motive cette objection (comparaison, budget, valeur perçue) avant de répondre",
          "Insister sans écouter davantage",
          "Changer immédiatement de sujet",
          "Mettre fin à l'échange",
        ],
        correctIndex: 1,
        explanation:
          "\"Trop cher\" cache souvent une autre question (valeur, comparaison, budget) : comprendre l'objection avant d'y répondre évite de négocier inutilement ou à côté du vrai frein.",
      },
      {
        question: "Qu'est-ce qu'un \"prospect\" ?",
        options: [
          "Un client qui a déjà acheté plusieurs fois",
          "Une personne ou entreprise susceptible d'être intéressée par le produit/service, mais qui n'a pas encore acheté",
          "Un concurrent direct",
          "Un fournisseur",
          "Un employé du service commercial",
        ],
        correctIndex: 1,
        explanation:
          "Le prospect est un client potentiel identifié -- la distinction avec le \"client\" (qui a déjà acheté) structure tout le vocabulaire commercial.",
      },
      {
        question: "Que dois-tu faire avant un rendez-vous commercial important ?",
        options: [
          "Improviser entièrement sur place",
          "Te renseigner sur le client/l'entreprise et préparer les points clés à aborder",
          "Ne rien préparer, ça enlève la spontanéité",
          "Envoyer le devis avant même de parler au client",
          "Annuler si tu n'es pas sûr de convaincre",
        ],
        correctIndex: 1,
        explanation:
          "Une préparation minimale (contexte du client, besoins probables) démontre le sérieux et augmente fortement les chances de réussite du rendez-vous.",
      },
      {
        question: "Comment réagis-tu face à un refus de vente après beaucoup d'efforts ?",
        options: [
          "J'abandonne complètement la prospection",
          "J'analyse ce qui n'a pas fonctionné pour m'améliorer, sans le prendre personnellement",
          "Je me dispute avec le client",
          "Je ne fais jamais de suivi après un refus",
          "Je considère que la vente est un métier qui ne me convient pas dès le premier échec",
        ],
        correctIndex: 1,
        explanation:
          "Le refus fait partie intégrante du métier de commercial ; savoir en tirer des enseignements sans le vivre comme un échec personnel est une qualité clé recherchée.",
      },
    ],
    medium: [
      {
        question: "Que signifie la méthode \"SPANCO\" (ou équivalent) dans un cycle de vente ?",
        options: [
          "Un logiciel de facturation",
          "Les étapes structurées du cycle de vente, de la Suspicion/Prospection jusqu'à la Conclusion et le suivi (Order/Conclusion)",
          "Un type de contrat commercial",
          "Une méthode de calcul de commission",
          "Un indicateur de satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "SPANCO (Suspect, Prospect, Analyse, Négociation, Conclusion, Ordre/suivi) structure les étapes d'une vente pour ne rien sauter dans le processus.",
      },
      {
        question: "Quelle est la différence entre un besoin exprimé et un besoin réel du client ?",
        options: [
          "Elles sont toujours identiques",
          "Le besoin exprimé est ce que le client dit vouloir, le besoin réel est parfois différent et demande d'être identifié par un questionnement approfondi",
          "Le besoin réel n'existe pas en vente",
          "Seul le besoin exprimé compte pour conclure une vente",
          "Le besoin réel concerne uniquement le prix",
        ],
        correctIndex: 1,
        explanation:
          "Un bon commercial questionne au-delà de la demande initiale pour identifier le vrai besoin sous-jacent, souvent la clé d'une vente pertinente et durable.",
      },
      {
        question: "Un client fidèle menace de partir chez un concurrent moins cher. Que fais-tu en priorité ?",
        options: [
          "Baisser immédiatement ton prix sans discuter",
          "Comprendre ses raisons précises et rappeler la valeur ajoutée réelle de ton offre avant d'envisager toute contrepartie",
          "Le laisser partir sans réagir",
          "L'ignorer, ce n'est pas grave de perdre un client",
          "Le menacer de représailles commerciales",
        ],
        correctIndex: 1,
        explanation:
          "Avant de négocier sur le prix, il faut comprendre le vrai motif et réaffirmer la valeur différenciante -- brader trop vite dévalorise l'offre et n'est pas toujours nécessaire.",
      },
      {
        question: "Qu'est-ce que le \"cross-selling\" (vente croisée) ?",
        options: [
          "Vendre le même produit à deux clients différents",
          "Proposer un produit complémentaire à celui que le client est en train d'acheter",
          "Annuler une vente en cours",
          "Vendre uniquement à l'étranger",
          "Réduire le prix d'un produit",
        ],
        correctIndex: 1,
        explanation:
          "Le cross-selling augmente la valeur du panier en proposant un produit complémentaire pertinent -- une technique courante en vente comme en e-commerce.",
      },
      {
        question: "Pourquoi le suivi après-vente est-il stratégique, même une fois la vente conclue ?",
        options: [
          "Il ne sert à rien une fois le contrat signé",
          "Il fidélise le client, détecte les problèmes tôt, et ouvre la voie à de futures ventes ou recommandations",
          "Il n'a d'intérêt que pour la comptabilité",
          "Il est uniquement obligatoire légalement",
          "Il ralentit inutilement le commercial",
        ],
        correctIndex: 1,
        explanation:
          "Un client bien suivi après l'achat devient souvent un client fidèle, voire un apporteur d'affaires -- le suivi fait partie intégrante de la performance commerciale long terme.",
      },
      {
        question: "Quelle est la meilleure façon de gérer une objection récurrente sur le prix face à plusieurs prospects ?",
        options: [
          "Baisser systématiquement les prix pour tous",
          "Analyser si l'argumentaire de valeur est assez clair en amont de la discussion sur le prix, et l'ajuster si besoin",
          "Ignorer le problème, ça se réglera tout seul",
          "Changer de métier",
          "Ne jamais évoquer le prix avec le client",
        ],
        correctIndex: 1,
        explanation:
          "Une objection prix récurrente est souvent le symptôme d'un argumentaire de valeur insuffisamment clair en amont, plus qu'un vrai problème de tarif.",
      },
    ],
    difficile: [
      {
        question: "Un très gros client représente 40% de ton chiffre d'affaires et négocie une baisse de prix agressive sous peine de partir. Quel est le risque stratégique à long terme si tu acceptes systématiquement ?",
        options: [
          "Aucun risque, garder le client est toujours la priorité absolue",
          "Une dépendance accrue à ce client et une dégradation de ta marge qui peut fragiliser durablement l'entreprise",
          "Le client sera automatiquement plus fidèle pour toujours",
          "Cela n'affecte jamais les autres clients",
          "Il n'y a jamais de bonne raison de refuser une négociation",
        ],
        correctIndex: 1,
        explanation:
          "Céder systématiquement à un client dominant crée une dépendance dangereuse et érode la rentabilité -- un vrai dilemme stratégique à arbitrer, pas une évidence à accepter sans réflexion.",
      },
      {
        question: "Pourquoi un cycle de vente B2B (entreprise à entreprise) est-il généralement plus long et plus complexe qu'un cycle B2C ?",
        options: [
          "Ce n'est pas vrai, les deux sont identiques",
          "Plusieurs décideurs interviennent souvent (acheteur, utilisateur, direction), avec des enjeux financiers et une validation interne plus lourde",
          "Le B2B ne concerne jamais de grosses sommes",
          "Le B2C est toujours plus complexe que le B2B",
          "La durée ne dépend jamais du type de client",
        ],
        correctIndex: 1,
        explanation:
          "En B2B, plusieurs parties prenantes (souvent avec des intérêts différents) doivent valider la décision, ce qui allonge et complexifie mécaniquement le cycle de vente.",
      },
      {
        question: "Comment interpréter un taux de closing (conclusion de vente) qui chute fortement alors que le nombre de rendez-vous reste stable ?",
        options: [
          "C'est toujours dû au hasard, rien à analyser",
          "Il faut investiguer une possible dégradation de la qualification des prospects en amont, ou un changement dans l'argumentaire/l'offre/la concurrence",
          "Il faut immédiatement licencier l'équipe commerciale",
          "Le nombre de rendez-vous est la seule métrique qui compte",
          "Un taux de closing ne peut jamais varier sans raison externe",
        ],
        correctIndex: 1,
        explanation:
          "Un closing en baisse à volume de rendez-vous stable pointe vers un problème de qualité (mauvaise qualification, argumentaire daté, nouvelle concurrence) plutôt que de quantité.",
      },
      {
        question: "Un commercial dépasse ses objectifs en multipliant les promesses non tenables au client (délais, fonctionnalités). Quel est le vrai risque pour l'entreprise ?",
        options: [
          "Aucun, le chiffre d'affaires immédiat est ce qui compte le plus",
          "Une insatisfaction client différée, une perte de confiance et un coût de réparation (support, remboursement, réputation) souvent supérieur au gain initial",
          "Les clients ne remarquent jamais les promesses non tenues",
          "Cela améliore toujours la réputation de l'entreprise à long terme",
          "C'est uniquement un problème pour le service client, pas pour la vente",
        ],
        correctIndex: 1,
        explanation:
          "Une vente obtenue par des promesses intenables déplace le problème en aval (support, remboursements, réputation) -- souvent plus coûteux que la vente initiale ne rapporte.",
      },
      {
        question: "Dans une négociation commerciale complexe, pourquoi est-il risqué de faire une concession sans contrepartie ?",
        options: [
          "Ce n'est jamais risqué, il faut toujours céder pour avancer",
          "Cela peut signaler que la marge de manœuvre est large, et inciter l'autre partie à demander toujours plus sans rien donner en retour",
          "Les concessions n'ont aucun impact sur la suite de la négociation",
          "Une concession sans contrepartie est toujours perçue comme un geste commercial neutre",
          "Cela ne concerne que les négociations à l'international",
        ],
        correctIndex: 1,
        explanation:
          "Toute concession sans contrepartie envoie un signal de faiblesse et peut enclencher une escalade de demandes -- une règle de base en négociation commerciale structurée.",
      },
      {
        question: "Pourquoi la fidélisation client coûte-t-elle généralement moins cher que l'acquisition de nouveaux clients ?",
        options: [
          "Ce n'est pas vrai, les deux coûtent toujours pareil",
          "Un client existant connaît déjà l'offre et la confiance est établie, réduisant les coûts marketing/commerciaux nécessaires par rapport à convaincre un inconnu",
          "La fidélisation ne nécessite jamais aucun investissement",
          "L'acquisition est toujours moins chère que la fidélisation",
          "Le coût ne dépend jamais du type de client",
        ],
        correctIndex: 1,
        explanation:
          "C'est un principe économique bien documenté (souvent cité 5x à 7x moins cher) : la confiance déjà établie avec un client existant réduit fortement le coût de conversion par rapport à un prospect inconnu.",
      },
      {
        question: "Un client historique demande une exception au contrat que tu n'as jamais accordée à personne d'autre. Quel est l'enjeu à long terme le plus important à considérer ?",
        options: [
          "Aucun enjeu, il faut toujours dire oui à un client historique",
          "Le précédent créé : si cela se sait, d'autres clients pourraient légitimement réclamer le même traitement",
          "Cela n'a aucune conséquence sur les autres contrats",
          "Il faut systématiquement refuser toute exception, sans exception",
          "Le contrat écrit n'a de toute façon aucune valeur réelle",
        ],
        correctIndex: 1,
        explanation:
          "Une exception accordée crée un précédent qui peut se propager (par bouche-à-oreille entre clients) et fragiliser la cohérence commerciale globale -- à peser avant de trancher.",
      },
    ],
  },
  gestion: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en gestion de projet ou comptabilité/gestion ?",
        options: [
          "J'aime organiser, structurer, et suivre l'avancement concret des choses",
          "Parce que ça a l'air simple à faire",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le métier le mieux payé",
          "Parce que je n'aime pas le contact avec les autres",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à l'organisation et au suivi concret montre une compréhension réaliste du métier, davantage qu'une réponse par élimination ou opportuniste.",
      },
      {
        question: "Qu'est-ce qu'un \"livrable\" dans un projet ?",
        options: [
          "Le budget total du projet",
          "Un résultat concret et vérifiable produit à une étape du projet",
          "Le nom du chef de projet",
          "La date de fin du projet uniquement",
          "Un logiciel de gestion",
        ],
        correctIndex: 1,
        explanation:
          "Un livrable est ce qui est effectivement produit et remis (document, fonctionnalité, rapport...) -- la base pour vérifier l'avancement réel d'un projet.",
      },
      {
        question: "Que signifie l'acronyme \"KPI\" ?",
        options: [
          "Key Performance Indicator (indicateur clé de performance)",
          "Known Project Issue",
          "Key Personal Information",
          "Knowledge Process Improvement",
          "Key Payment Instruction",
        ],
        correctIndex: 0,
        explanation:
          "Un KPI est une mesure chiffrée qui permet de suivre objectivement si un objectif est atteint -- essentiel pour piloter un projet ou une activité.",
      },
      {
        question: "Qu'est-ce qu'une facture ?",
        options: [
          "Un document informel sans valeur légale",
          "Un document officiel qui atteste d'une vente ou prestation et sert de preuve comptable",
          "Un devis non signé",
          "Un contrat de travail",
          "Un bon de commande interne uniquement",
        ],
        correctIndex: 1,
        explanation:
          "La facture est un document comptable et légal obligatoire qui formalise une transaction -- une notion de base en gestion/comptabilité.",
      },
      {
        question: "Que fais-tu si tu remarques que le planning d'un projet prend du retard ?",
        options: [
          "Rien, ça se règlera tout seul",
          "J'en informe rapidement les personnes concernées et je propose des solutions concrètes",
          "Je cache le retard le plus longtemps possible",
          "J'accuse un collègue publiquement",
          "J'abandonne le projet",
        ],
        correctIndex: 1,
        explanation:
          "Signaler tôt un retard avec des pistes de solution est la réaction professionnelle attendue -- le cacher aggrave toujours la situation à terme.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le \"diagramme de Gantt\" permet de visualiser ?",
        options: [
          "Le budget détaillé d'une entreprise",
          "La planification des tâches d'un projet dans le temps, avec leurs dépendances",
          "L'organigramme hiérarchique",
          "Les résultats financiers annuels",
          "La satisfaction des clients",
        ],
        correctIndex: 1,
        explanation:
          "Le Gantt représente visuellement les tâches d'un projet sur une frise temporelle, avec leurs durées et dépendances -- un outil central en gestion de projet.",
      },
      {
        question: "Quelle est la différence entre le bilan et le compte de résultat en comptabilité ?",
        options: [
          "Ce sont deux noms pour le même document",
          "Le bilan photographie le patrimoine de l'entreprise à un instant T, le compte de résultat mesure la performance (charges/produits) sur une période",
          "Le bilan concerne uniquement les impôts",
          "Le compte de résultat ne concerne que les grandes entreprises",
          "Le bilan est optionnel pour toutes les entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Le bilan = photo du patrimoine (actif/passif) à une date donnée ; le compte de résultat = film de l'activité (produits - charges) sur une période -- deux documents comptables complémentaires.",
      },
      {
        question: "Un projet dépasse son budget initial de 20%. Quelle est la première chose à faire ?",
        options: [
          "Continuer sans rien signaler à personne",
          "Analyser précisément la cause du dépassement et en informer les parties prenantes avec des options correctives",
          "Arrêter immédiatement le projet sans analyse",
          "Réduire la qualité du livrable sans prévenir le client",
          "Payer la différence de sa poche",
        ],
        correctIndex: 1,
        explanation:
          "Un dépassement budgétaire doit être analysé et communiqué avec des solutions, pas caché ni traité par une décision unilatérale qui affecterait la qualité sans validation.",
      },
      {
        question: "Que signifie \"TVA\" et pourquoi une entreprise doit-elle la déclarer ?",
        options: [
          "Taxe sur la Valeur Ajoutée -- un impôt sur la consommation collecté par les entreprises pour le compte de l'État",
          "Taux de Variation Annuel, un indicateur boursier",
          "Une cotisation sociale volontaire",
          "Un type de contrat commercial",
          "Une taxe qui ne concerne que les particuliers",
        ],
        correctIndex: 0,
        explanation:
          "La TVA est collectée par les entreprises sur leurs ventes, puis reversée à l'État après déduction de la TVA payée sur leurs achats -- une déclaration obligatoire et régulière.",
      },
      {
        question: "Pourquoi utiliser une méthode agile (type Scrum) plutôt qu'une gestion de projet en cycle classique (\"cascade\") ?",
        options: [
          "L'agile est toujours plus rapide dans l'absolu",
          "L'agile permet de s'adapter à des besoins qui évoluent, via des cycles courts et des retours fréquents, plutôt qu'une planification figée à l'avance",
          "L'agile élimine complètement le besoin de planification",
          "Le cycle classique est toujours obsolète",
          "L'agile ne convient qu'aux projets informatiques",
        ],
        correctIndex: 1,
        explanation:
          "L'agilité privilégie l'adaptation continue face à un besoin qui évolue, contrairement au cycle en cascade qui fige tout en amont -- chaque approche a son contexte pertinent.",
      },
      {
        question: "Qu'est-ce qu'un \"risque projet\" et pourquoi faut-il l'anticiper dès le début ?",
        options: [
          "Un événement déjà survenu qu'on doit corriger",
          "Un événement incertain qui pourrait impacter le projet -- l'anticiper permet de préparer un plan d'action avant qu'il ne se produise",
          "Un concept théorique sans application réelle",
          "Une dépense budgétaire prévue",
          "Un document administratif obligatoire uniquement pour les gros projets",
        ],
        correctIndex: 1,
        explanation:
          "La gestion des risques identifie en amont ce qui pourrait mal tourner (retard, budget, ressources) pour préparer une réponse plutôt que de subir la crise le moment venu.",
      },
    ],
    difficile: [
      {
        question: "Un projet est \"dans les temps et dans le budget\", mais le client se dit finalement insatisfait du résultat. Que révèle cette situation ?",
        options: [
          "Rien d'anormal, le respect du budget et des délais suffit toujours à définir la réussite",
          "Un problème probable de cadrage initial : le périmètre (scope) validé ne correspondait peut-être pas au vrai besoin du client",
          "Le client a toujours tort dans ce genre de situation",
          "Il faut recommencer tout le projet à zéro sans analyse",
          "Cela ne concerne jamais la gestion de projet",
        ],
        correctIndex: 1,
        explanation:
          "Le \"triangle\" temps/coût/qualité ne suffit pas si le périmètre validé au départ ne reflétait pas le vrai besoin -- un défaut de cadrage initial, pas un problème d'exécution.",
      },
      {
        question: "Pourquoi la comptabilité d'engagement diffère-t-elle de la comptabilité de trésorerie, et pourquoi est-ce important pour piloter une entreprise ?",
        options: [
          "Ce sont deux termes identiques sans différence réelle",
          "L'engagement enregistre une opération dès qu'elle est décidée (facture émise), la trésorerie seulement au moment du flux réel d'argent -- une entreprise peut être rentable sur le papier mais en difficulté de trésorerie",
          "Seule la trésorerie compte, l'engagement est une notion inutile",
          "La comptabilité d'engagement ne concerne que l'État",
          "Cette distinction n'a aucun impact sur la gestion réelle d'une entreprise",
        ],
        correctIndex: 1,
        explanation:
          "Une entreprise peut afficher un bénéfice comptable (engagement) tout en manquant de liquidités (trésorerie) si les clients paient en retard -- un piège classique à bien comprendre.",
      },
      {
        question: "Dans un projet en \"chemin critique\" (méthode PERT/Gantt), pourquoi le retard d'une seule tâche peut-il retarder tout le projet, alors que d'autres tâches ont du retard sans impact ?",
        options: [
          "Le chemin critique regroupe les tâches sans aucune marge (\"marge nulle\") dont le retard se répercute directement sur la date de fin globale, contrairement aux tâches ayant de la marge",
          "Toutes les tâches ont toujours le même impact sur le projet",
          "Le chemin critique n'existe que dans la théorie, jamais en pratique",
          "Seul le budget détermine l'impact d'un retard",
          "Le chemin critique change uniquement en fin de projet",
        ],
        correctIndex: 0,
        explanation:
          "Les tâches du chemin critique n'ont aucune marge de manœuvre : tout retard s'y répercute directement sur la date de fin ; les autres tâches disposent d'une marge qui absorbe un retard limité sans effet global.",
      },
      {
        question: "Un contrôleur de gestion détecte qu'un centre de coût dépasse son budget chaque trimestre, mais le responsable affirme que \"tout est normal\". Quelle démarche est la plus rigoureuse ?",
        options: [
          "Accepter l'explication sans vérification, la parole du responsable suffit",
          "Analyser la récurrence et la structure du dépassement (fixe vs variable, ponctuel vs structurel) pour distinguer un vrai problème budgétaire d'une simple variation acceptable",
          "Couper immédiatement tout le budget du service concerné",
          "Ignorer le sujet tant que l'entreprise reste globalement bénéficiaire",
          "Changer immédiatement de responsable sans enquête",
        ],
        correctIndex: 1,
        explanation:
          "Un contrôle de gestion rigoureux distingue un écart ponctuel justifiable d'un dépassement structurel révélateur d'un vrai problème -- l'affirmation verbale seule ne suffit jamais à trancher.",
      },
      {
        question: "Pourquoi la méthode de gestion \"agile\" peut-elle devenir risquée sur un projet à contrat forfaitaire (prix et périmètre fixés à l'avance) ?",
        options: [
          "L'agile n'a jamais aucun inconvénient, quel que soit le contexte contractuel",
          "L'agile encourage l'évolution du périmètre en cours de route, ce qui peut entrer en tension avec un contrat qui fige d'avance prix et livrables -- source de litiges si mal encadré",
          "L'agile est interdit par la loi sur les contrats forfaitaires",
          "Le forfait élimine automatiquement tout risque projet",
          "Cette question ne concerne que les projets informatiques",
        ],
        correctIndex: 1,
        explanation:
          "L'agilité suppose une flexibilité du périmètre que le forfait contractualise justement à l'avance -- un vrai point de friction à anticiper contractuellement (avenants, enveloppe de flexibilité...).",
      },
      {
        question: "Un projet complexe implique 5 parties prenantes aux priorités contradictoires. Quelle compétence de gestion de projet est la plus déterminante ici ?",
        options: [
          "Ignorer les parties prenantes les moins puissantes",
          "Cartographier les enjeux et priorités de chacune, puis arbitrer et communiquer les compromis de façon transparente",
          "Attendre que les parties prenantes se mettent d'accord seules avant d'agir",
          "Prendre la décision qui arrange uniquement le sponsor principal, sans explication aux autres",
          "Refuser de prendre parti et laisser le projet bloqué indéfiniment",
        ],
        correctIndex: 1,
        explanation:
          "La gestion des parties prenantes (stakeholder management) est une compétence clé : cartographier les intérêts, arbitrer avec méthode, et communiquer les décisions évite les blocages et la frustration.",
      },
      {
        question: "Pourquoi le calcul du seuil de rentabilité (point mort) est-il essentiel avant de lancer une nouvelle activité ?",
        options: [
          "Il n'a d'utilité que pour les grandes entreprises cotées",
          "Il indique le volume de ventes minimum nécessaire pour couvrir l'ensemble des charges fixes et variables, avant de commencer à générer du profit",
          "Il remplace complètement le besoin d'un business plan",
          "Il ne concerne que les entreprises déjà rentables",
          "Il mesure uniquement la satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "Le seuil de rentabilité évite de se lancer à l'aveugle : il chiffre précisément le volume d'activité minimum à atteindre pour ne pas perdre d'argent -- un outil de décision fondamental.",
      },
    ],
  },
};

// Domaines/questions supplémentaires dans un fichier séparé pour garder
// celui-ci lisible -- fusionnés ici, transparent pour le reste de l'app.
import { EXTRA_DOMAINS, EXTRA_BANK } from "./questionBankExtra";

export const INTERVIEW_DOMAINS: InterviewDomain[] = [...CORE_DOMAINS, ...EXTRA_DOMAINS];
const BANK: Bank = { ...CORE_BANK, ...EXTRA_BANK };

export function getInterviewQuestions(domainId: string, level: InterviewLevel): InterviewQuestion[] {
  const domain = BANK[domainId] ?? BANK[INTERVIEW_DOMAINS[0].id];
  const pool = domain[level];
  // Mélange à chaque partie pour éviter de toujours voir les questions dans
  // le même ordre -- le pool fait déjà exactement QUESTION_COUNT_BY_LEVEL,
  // donc pas de sous-ensemble différent, juste un ordre différent.
  return [...pool].sort(() => Math.random() - 0.5);
}
