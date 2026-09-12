// Quatrième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_4: InterviewDomain[] = [
  { id: "cybersecurite", label: "Cybersécurité" },
  { id: "jeu_video", label: "Jeux vidéo / Game design" },
  { id: "pharma_industrie", label: "Industrie pharmaceutique / Biotech" },
  { id: "architecture_urbanisme", label: "Architecture / Urbanisme" },
  { id: "audit_conseil", label: "Audit / Conseil en stratégie" },
];

export const EXTRA_BANK_4: Bank = {
  cybersecurite: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en cybersécurité ?",
        options: [
          "J'aime comprendre comment un système peut être attaqué pour mieux le protéger",
          "Parce que ça a l'air un métier facile derrière un écran",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Comprendre les mécanismes d'attaque pour mieux défendre est au cœur du métier -- une motivation bien plus solide qu'une idée fausse de facilité.",
      },
      {
        question: "Qu'est-ce qu'un mot de passe fort, en une phrase simple ?",
        options: [
          "Un mot de passe facile à retenir comme une date de naissance",
          "Un mot de passe long, complexe et unique pour chaque compte",
          "Un mot de passe que l'on change jamais une fois choisi",
          "Un mot de passe identique partout pour ne pas l'oublier",
          "Un mot de passe court mais avec un symbole",
        ],
        correctIndex: 1,
        explanation:
          "Longueur, complexité et unicité par compte limitent fortement le risque qu'un mot de passe compromis sur un site ouvre l'accès à tous les autres comptes.",
      },
      {
        question: "Un collègue clique sur un lien suspect reçu par email et te le signale immédiatement. Que fais-tu ?",
        options: [
          "Je le félicite d'avoir cliqué pour vérifier",
          "Je le rassure sur sa bonne réaction de signaler, et j'applique la procédure de réponse à incident (isolement, analyse)",
          "Je le blâme publiquement pour son erreur",
          "J'ignore le signalement si rien ne semble s'être passé",
          "Je lui demande de ne rien dire à personne",
        ],
        correctIndex: 1,
        explanation:
          "Un signalement rapide, même après une erreur, doit toujours être valorisé -- c'est ce qui permet de réagir vite avant que l'incident ne s'aggrave.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop méfiant(e) par déformation professionnelle, donc j'apprends à doser mes alertes",
          "Je n'aime pas la veille technique",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier (la méfiance systématique), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi les mises à jour de sécurité sont-elles si importantes à appliquer rapidement ?",
        options: [
          "Ce n'est pas vraiment urgent tant que le système fonctionne",
          "Parce qu'elles corrigent souvent des failles déjà activement exploitées par des attaquants",
          "Les mises à jour ne concernent que le confort d'utilisation",
          "Elles n'ont aucun lien avec la sécurité réelle du système",
          "Elles sont facultatives si un antivirus est installé",
        ],
        correctIndex: 1,
        explanation:
          "De nombreuses mises à jour corrigent des failles déjà connues et parfois activement exploitées : un retard d'application est une fenêtre de risque réelle.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le phishing (hameçonnage) et comment le repérer ?",
        options: [
          "Une technique de piratage physique d'un ordinateur",
          "Une technique visant à tromper une personne pour lui faire divulguer des informations sensibles, souvent via un email ou un site imitant une source légitime",
          "Un virus qui s'installe automatiquement sans action humaine",
          "Une méthode de chiffrement des données",
          "Une technique réservée aux grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Le phishing exploite la confiance humaine (email/site imitant une source légitime) pour obtenir des informations sensibles -- repérable via l'expéditeur, les fautes, l'urgence artificielle et les liens suspects.",
      },
      {
        question: "Pourquoi le principe du \"moindre privilège\" est-il une bonne pratique de sécurité ?",
        options: [
          "Il ralentit inutilement le travail des employés",
          "Il limite les droits d'accès de chaque utilisateur au strict nécessaire, réduisant l'impact si son compte est compromis",
          "Il ne concerne que les administrateurs système",
          "Il consiste à donner un accès total à tout le monde par simplicité",
          "Il n'a aucun lien avec la sécurité des données",
        ],
        correctIndex: 1,
        explanation:
          "Limiter chaque compte au strict nécessaire réduit l'impact potentiel d'une compromission : un attaquant qui prend le contrôle d'un compte à privilèges limités cause moins de dégâts.",
      },
      {
        question: "Comment réagis-tu si tu découvres une faille de sécurité dans un système que tu ne gères pas directement ?",
        options: [
          "J'exploite la faille moi-même pour voir jusqu'où elle va",
          "Je la signale de manière responsable à l'équipe ou au responsable concerné, sans divulgation publique prématurée",
          "Je l'ignore, ce n'est pas mon système",
          "Je la publie immédiatement sur internet pour alerter tout le monde",
          "J'attends qu'un incident survienne pour en parler",
        ],
        correctIndex: 1,
        explanation:
          "La divulgation responsable (signalement discret à l'équipe concernée, sans exploitation ni publication prématurée) est le comportement professionnel et éthique attendu en cybersécurité.",
      },
      {
        question: "Pourquoi la sensibilisation des employés est-elle considérée comme un pilier de la sécurité, au même titre que les outils techniques ?",
        options: [
          "Ce n'est pas vraiment utile si les outils techniques sont performants",
          "Parce que la majorité des incidents de sécurité impliquent une erreur ou une manipulation humaine (clic sur un lien, mot de passe faible)",
          "La sensibilisation ne concerne que les postes informatiques",
          "Elle remplace totalement le besoin d'outils techniques",
          "Elle n'a aucun impact mesurable sur le niveau de risque",
        ],
        correctIndex: 1,
        explanation:
          "Une grande majorité des incidents de sécurité impliquent un facteur humain (clic, mot de passe faible, erreur de configuration) : la sensibilisation est aussi déterminante que les outils techniques.",
      },
      {
        question: "Qu'est-ce que le chiffrement des données et pourquoi est-il essentiel pour des données sensibles en transit ou stockées ?",
        options: [
          "Une simple compression des données pour gagner de l'espace",
          "Une transformation des données rendant leur lecture impossible sans la clé de déchiffrement, protégeant leur confidentialité en cas d'interception ou de vol",
          "Une méthode réservée aux communications militaires",
          "Un processus qui ralentit systématiquement tous les systèmes sans réel bénéfice",
          "Une technique obsolète remplacée par les pare-feux modernes",
        ],
        correctIndex: 1,
        explanation:
          "Le chiffrement rend les données illisibles sans la clé appropriée : même interceptées ou volées, elles restent protégées, un principe de sécurité fondamental pour les données sensibles.",
      },
      {
        question: "Pourquoi les tests d'intrusion (pentests) sont-ils réalisés dans un cadre légal strict, avec autorisation écrite préalable ?",
        options: [
          "Le cadre légal n'est qu'une formalité sans réelle importance",
          "Parce que tenter de compromettre un système sans autorisation explicite constitue une infraction pénale, même dans une intention défensive",
          "Les pentests ne nécessitent jamais d'autorisation en pratique",
          "L'autorisation écrite ne concerne que les tests réalisés par des sociétés étrangères",
          "Le cadre légal ne s'applique qu'aux tests sur des systèmes gouvernementaux",
        ],
        correctIndex: 1,
        explanation:
          "Tenter de compromettre un système sans autorisation explicite est une infraction pénale (notamment en France sous le régime de la loi Godfrain), même avec une intention défensive ou de bonne foi : l'autorisation écrite préalable protège légalement le testeur.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le modèle de sécurité \"Zero Trust\" et en quoi diffère-t-il d'une approche de sécurité périmétrique classique ?",
        options: [
          "Un modèle qui fait confiance par défaut à tout utilisateur interne au réseau",
          "Un modèle qui ne fait confiance à aucun utilisateur ou appareil par défaut, même à l'intérieur du réseau, et vérifie systématiquement chaque accès",
          "Un modèle réservé aux très petites entreprises",
          "Une approche qui a été abandonnée au profit du modèle périmétrique classique",
          "Un modèle qui élimine totalement le besoin d'authentification",
        ],
        correctIndex: 1,
        explanation:
          "Contrairement à l'approche périmétrique classique (qui fait confiance à tout ce qui est \"dans\" le réseau), le Zero Trust vérifie systématiquement chaque accès, indépendamment de sa provenance -- une réponse à la multiplication des accès distants et des menaces internes.",
      },
      {
        question: "Quelle est la différence entre une vulnérabilité, une menace et un risque en analyse de sécurité ?",
        options: [
          "Ce sont trois termes strictement synonymes",
          "La vulnérabilité est une faiblesse exploitable, la menace est l'acteur ou l'événement pouvant l'exploiter, le risque est la combinaison de leur probabilité et de leur impact potentiel",
          "Le risque ne dépend jamais de la vulnérabilité",
          "La menace est toujours interne à l'organisation",
          "Ces notions ne concernent que les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Distinguer vulnérabilité (faiblesse), menace (acteur/événement pouvant l'exploiter) et risque (probabilité × impact) est fondamental pour prioriser les actions de sécurité de façon rigoureuse plutôt qu'intuitive.",
      },
      {
        question: "Qu'est-ce qu'une attaque de type \"zero-day\" et pourquoi est-elle particulièrement difficile à contrer ?",
        options: [
          "Une attaque qui dure exactement zéro jour, donc sans impact réel",
          "Une attaque exploitant une faille inconnue de l'éditeur du logiciel, pour laquelle aucun correctif n'existe encore au moment de l'attaque",
          "Une attaque qui ne peut viser que des systèmes très anciens",
          "Une attaque automatiquement bloquée par tout antivirus à jour",
          "Un terme marketing sans réalité technique",
        ],
        correctIndex: 1,
        explanation:
          "Une faille zero-day est inconnue de l'éditeur (donc sans correctif disponible) au moment où elle est exploitée : les défenses classiques basées sur des signatures connues sont inefficaces, rendant ce type d'attaque particulièrement dangereux.",
      },
      {
        question: "Pourquoi le RGPD impose-t-il une notification de violation de données sous 72 heures à l'autorité de contrôle ?",
        options: [
          "Ce délai n'a aucune valeur contraignante réelle",
          "Pour permettre une réaction rapide limitant l'impact sur les personnes concernées, et garantir la transparence envers l'autorité de régulation",
          "Ce délai ne s'applique qu'aux violations touchant plus d'un million de personnes",
          "La notification sous 72h ne concerne que les entreprises du secteur bancaire",
          "Ce délai a été supprimé lors d'une réforme récente du RGPD",
        ],
        correctIndex: 1,
        explanation:
          "Le délai de 72h impose une réaction rapide pour limiter l'impact d'une violation sur les personnes concernées et garantit la transparence vis-à-vis de l'autorité de contrôle (CNIL en France) -- un manquement expose à des sanctions significatives.",
      },
      {
        question: "Qu'est-ce que la défense en profondeur (defense in depth) en architecture de sécurité ?",
        options: [
          "Une stratégie qui repose sur une seule mesure de sécurité très robuste",
          "Une stratégie qui superpose plusieurs couches de protection indépendantes, pour qu'un attaquant ayant contourné une couche se heurte encore à d'autres défenses",
          "Une stratégie réservée aux infrastructures militaires",
          "Un concept qui a été remplacé entièrement par le Zero Trust",
          "Une approche qui ne concerne que la sécurité physique des locaux",
        ],
        correctIndex: 1,
        explanation:
          "La défense en profondeur superpose plusieurs couches de protection indépendantes (réseau, système, application, humain) : même si une couche est contournée, d'autres défenses restent actives -- un principe de résilience central en sécurité.",
      },
      {
        question: "Pourquoi la gestion des correctifs (patch management) reste-t-elle l'un des défis opérationnels les plus difficiles en cybersécurité d'entreprise ?",
        options: [
          "Ce n'est pas un défi réel, appliquer un correctif est toujours immédiat et sans risque",
          "Parce qu'un correctif peut aussi introduire une régression ou une incompatibilité, obligeant à arbitrer entre rapidité de déploiement et stabilité des systèmes critiques",
          "Le patch management ne concerne que les systèmes obsolètes",
          "Les correctifs de sécurité sont toujours appliqués automatiquement sans intervention humaine",
          "Ce défi ne concerne que les très petites structures sans équipe IT",
        ],
        correctIndex: 1,
        explanation:
          "Un correctif de sécurité peut introduire une régression sur un système critique : les équipes doivent arbitrer entre la rapidité nécessaire pour combler une faille et la prudence nécessaire pour ne pas casser un système en production.",
      },
      {
        question: "Pourquoi l'attribution d'une cyberattaque (identifier son auteur avec certitude) est-elle notoirement difficile, y compris pour des experts ?",
        options: [
          "L'attribution est toujours immédiate et certaine grâce aux adresses IP",
          "Les attaquants sophistiqués masquent délibérément leur origine (rebonds via des serveurs tiers, faux indices techniques), rendant l'attribution certaine rare et souvent basée sur un faisceau d'indices plutôt qu'une preuve unique",
          "L'attribution ne concerne que les attaques étatiques",
          "Elle a été résolue définitivement par les outils d'analyse forensique modernes",
          "Elle n'a aucune importance pratique une fois l'incident résolu techniquement",
        ],
        correctIndex: 1,
        explanation:
          "Les attaquants sophistiqués masquent délibérément leur origine (rebonds, faux indices) : l'attribution repose souvent sur un faisceau d'indices convergents plutôt qu'une preuve unique et certaine, ce qui en fait un exercice notoirement complexe même pour des experts.",
      },
    ],
  },

  jeu_video: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans les jeux vidéo ?",
        options: [
          "J'aime créer des expériences interactives qui font vivre quelque chose au joueur",
          "Parce que je joue beaucoup aux jeux vidéo, sans autre raison",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air un métier facile et amusant en permanence",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Créer une expérience interactive qui fait ressentir quelque chose au joueur est au cœur du game design -- une motivation bien plus professionnelle que le simple fait d'être joueur.",
      },
      {
        question: "Qu'est-ce qu'une \"boucle de gameplay\" (game loop), en une phrase simple ?",
        options: [
          "Un bug qui fait planter le jeu en boucle",
          "L'ensemble des actions répétées que le joueur effectue en continu pendant la partie (ex: explorer, combattre, progresser)",
          "La musique qui joue en boucle pendant le jeu",
          "Le générique de fin qui se répète",
          "Un mode de jeu réservé au multijoueur",
        ],
        correctIndex: 1,
        explanation:
          "La boucle de gameplay désigne le cycle d'actions répétées qui constitue l'expérience centrale du joueur -- un concept de base pour analyser ou concevoir un jeu.",
      },
      {
        question: "Un testeur remonte un bug bloquant juste avant une échéance importante. Que fais-tu ?",
        options: [
          "J'ignore le bug pour respecter le planning coûte que coûte",
          "J'évalue la gravité du bug et communique avec l'équipe pour prioriser sa correction avant la sortie",
          "Je blâme le testeur d'avoir trouvé le bug trop tard",
          "Je repousse le jeu indéfiniment par précaution",
          "Je laisse le bug pour la mise à jour suivante sans évaluation",
        ],
        correctIndex: 1,
        explanation:
          "Évaluer la gravité réelle et communiquer avec l'équipe pour prioriser est essentiel : un bug bloquant en fin de développement doit être traité avec méthode, pas ignoré ni traité dans la panique.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste sur les détails, donc j'apprends à respecter les délais de production",
          "Je n'aime pas travailler en équipe",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier créatif (le perfectionnisme face aux contraintes de production), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi le playtesting (tests utilisateurs) est-il une étape essentielle du développement d'un jeu ?",
        options: [
          "Ce n'est qu'une formalité marketing avant la sortie",
          "Il permet d'observer comment de vrais joueurs réagissent au jeu, révélant des problèmes d'équilibrage ou de compréhension invisibles pour l'équipe qui l'a conçu",
          "Le playtesting ne concerne que les très gros studios",
          "Il remplace totalement le travail de conception initial",
          "Il n'a aucun impact sur la qualité finale du jeu",
        ],
        correctIndex: 1,
        explanation:
          "L'équipe de développement, trop proche de son propre jeu, ne voit plus certains problèmes évidents pour un joueur découvrant le jeu pour la première fois : le playtesting révèle ces angles morts.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu un désaccord créatif avec un autre membre de l'équipe sur une mécanique de jeu ?",
        options: [
          "J'impose ma vision sans discussion",
          "Je propose de tester rapidement un prototype des deux approches pour trancher sur des données concrètes plutôt que sur des opinions",
          "Je cède systématiquement pour éviter le conflit",
          "Je fais les deux mécaniques en même temps sans trancher",
          "Je considère qu'un désaccord créatif ne peut jamais être résolu",
        ],
        correctIndex: 1,
        explanation:
          "Prototyper rapidement pour tester concrètement plutôt que de trancher sur la seule base d'opinions est une pratique clé du game design, qui dépassionne le débat créatif.",
      },
      {
        question: "Pourquoi l'équilibrage (game balance) est-il un exercice technique autant qu'artistique ?",
        options: [
          "L'équilibrage n'a aucune dimension technique, c'est purement une question de goût",
          "Il nécessite d'analyser des données de jeu (statistiques, taux de victoire) tout en préservant une expérience qui reste intéressante et juste à ressentir pour le joueur",
          "L'équilibrage ne concerne que les jeux multijoueurs compétitifs",
          "Il est aujourd'hui entièrement automatisé sans intervention humaine",
          "Il n'a aucun impact sur la rétention des joueurs",
        ],
        correctIndex: 1,
        explanation:
          "L'équilibrage combine analyse de données réelles (statistiques de jeu) et jugement créatif sur ce qui rend l'expérience juste et intéressante à vivre -- un exercice hybride technique et artistique.",
      },
      {
        question: "Comment réagis-tu face à des retours très négatifs de la communauté après la sortie d'une mise à jour ?",
        options: [
          "J'ignore complètement les retours de la communauté",
          "J'analyse les retours pour distinguer les problèmes réels récurrents des réactions isolées, puis je communique un plan d'action clair",
          "Je réponds avec agressivité aux critiques les plus dures",
          "Je retire immédiatement la mise à jour sans analyse",
          "Je considère que les retours négatifs n'ont jamais de valeur",
        ],
        correctIndex: 1,
        explanation:
          "Analyser les retours pour distinguer les problèmes réels et récurrents des réactions isolées, puis communiquer clairement sur les actions prévues, construit la confiance avec la communauté même en période de crise.",
      },
      {
        question: "Pourquoi la contrainte technique (moteur de jeu, plateforme cible) influence-t-elle directement les choix de game design ?",
        options: [
          "Les contraintes techniques n'ont aucun impact sur la conception du jeu",
          "Certaines idées créatives ne sont tout simplement pas réalisables dans les délais ou les capacités techniques disponibles, obligeant à adapter la conception en conséquence",
          "Le game design doit toujours ignorer les contraintes techniques",
          "Les contraintes techniques ne concernent que les studios indépendants",
          "Un bon jeu ne dépend jamais du moteur ou de la plateforme utilisée",
        ],
        correctIndex: 1,
        explanation:
          "Une idée créative doit être réalisable dans les contraintes réelles (moteur, plateforme, délais, budget) : le game design efficace intègre ces contraintes dès la conception plutôt que de les découvrir trop tard.",
      },
      {
        question: "Comment documentes-tu une mécanique de jeu pour qu'elle soit implémentable par l'équipe technique ?",
        options: [
          "Je décris uniquement l'intention générale, sans détail technique",
          "Je rédige un document précis incluant les règles exactes, les cas limites et des exemples concrets de comportement attendu",
          "Je considère que la documentation n'est jamais nécessaire si l'équipe est expérimentée",
          "Je transmets uniquement des schémas sans texte explicatif",
          "La documentation est réservée aux très grosses productions",
        ],
        correctIndex: 1,
        explanation:
          "Un document de conception précis, incluant règles exactes et cas limites, évite les malentendus entre design et implémentation technique -- une compétence de communication clé du game designer.",
      },
      {
        question: "Pourquoi la monétisation (jeu gratuit avec achats intégrés, DLC, abonnement) est-elle devenue un enjeu de game design à part entière ?",
        options: [
          "La monétisation est purement une question commerciale, sans lien avec le design du jeu",
          "Les mécaniques de monétisation doivent être pensées en cohérence avec l'expérience de jeu, sous peine de nuire au plaisir et à la perception d'équité par les joueurs",
          "La monétisation ne concerne que les jeux mobiles",
          "Elle n'a aucun impact sur la fidélisation des joueurs",
          "Elle est toujours identique quel que soit le type de jeu",
        ],
        correctIndex: 1,
        explanation:
          "Une mécanique de monétisation mal intégrée peut nuire au plaisir de jeu et être perçue comme injuste (pay-to-win) : penser la monétisation en cohérence avec le design global est devenu une compétence à part entière.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la \"courbe de difficulté\" (difficulty curve) et pourquoi sa conception est-elle un exercice délicat ?",
        options: [
          "Un graphique purement décoratif sans impact sur le jeu",
          "La progression de la difficulté d'un jeu dans le temps, qui doit maintenir le joueur dans un état de défi stimulant sans jamais le frustrer au point de l'abandon ni l'ennuyer par excès de facilité",
          "Un concept qui ne concerne que les jeux de plateforme",
          "Une courbe fixe, identique pour tous les jeux quel que soit leur genre",
          "Un concept abandonné par le game design moderne",
        ],
        correctIndex: 1,
        explanation:
          "La courbe de difficulté doit maintenir le joueur dans une zone de défi stimulant (proche du concept de \"flow\"), ni trop frustrante ni trop facile -- un équilibre difficile à calibrer sans données de test réelles.",
      },
      {
        question: "Qu'est-ce que le concept de \"flow\" (Csikszentmihalyi) appliqué au game design ?",
        options: [
          "Un terme désignant uniquement la fluidité technique (framerate) d'un jeu",
          "Un état psychologique d'immersion totale atteint quand le défi proposé correspond precisément au niveau de compétence du joueur, ni trop facile ni trop difficile",
          "Un concept qui ne s'applique qu'aux jeux de rythme musical",
          "Une mécanique de scénario linéaire sans embranchement",
          "Un concept invalidé par les études récentes en psychologie du jeu",
        ],
        correctIndex: 1,
        explanation:
          "Le concept de flow décrit un état d'immersion optimale atteint quand le défi correspond au niveau de compétence du joueur : un cadre théorique central pour calibrer la difficulté et l'engagement d'un jeu.",
      },
      {
        question: "Pourquoi les \"dark patterns\" dans la monétisation des jeux free-to-play font-ils l'objet d'un débat éthique et réglementaire croissant ?",
        options: [
          "Ces pratiques n'ont jamais posé de problème identifié",
          "Certaines mécaniques (loot boxes ressemblant à des jeux de hasard, pression psychologique à l'achat) sont accusées d'exploiter des biais cognitifs, en particulier chez les jeunes joueurs, menant à des régulations dans plusieurs pays",
          "Ce débat ne concerne que les jeux destinés aux adultes",
          "Les loot boxes sont interdites universellement dans le monde entier",
          "Ce sujet ne fait l'objet d'aucune attention réglementaire",
        ],
        correctIndex: 1,
        explanation:
          "Des mécaniques comme les loot boxes (proches du jeu de hasard) ou la pression psychologique à l'achat sont critiquées pour exploiter des biais cognitifs, en particulier chez les jeunes : plusieurs pays ont déjà légiféré ou enquêtent sur ces pratiques.",
      },
      {
        question: "Qu'est-ce que le \"live service\" comme modèle de développement, et quels défis organisationnels pose-t-il par rapport à un jeu classique \"boîte fermée\" ?",
        options: [
          "Un modèle identique à un jeu classique, seul le prix change",
          "Un modèle qui exige un contenu et un support continus après la sortie (mises à jour, événements, équilibrage), impliquant une organisation de production permanente plutôt qu'un cycle de développement clos",
          "Un modèle réservé aux jeux mobiles uniquement",
          "Un modèle qui élimine totalement le besoin de playtesting après la sortie",
          "Un modèle qui a démontré son déclin total ces dernières années",
        ],
        correctIndex: 1,
        explanation:
          "Le live service exige un rythme de production continu après la sortie (contenu, événements, équilibrage), transformant l'organisation d'un cycle de développement classique (fin = sortie) en un engagement de production permanent.",
      },
      {
        question: "Pourquoi l'accessibilité (options de difficulté, sous-titres, remapping des touches) est-elle devenue un axe de conception à part entière du game design moderne ?",
        options: [
          "L'accessibilité n'a aucun impact sur le nombre de joueurs potentiels",
          "Elle permet à des joueurs avec des besoins spécifiques (handicap moteur, visuel, auditif) de vivre pleinement l'expérience, élargissant l'audience tout en répondant à un enjeu d'inclusion",
          "Elle concerne uniquement les jeux destinés à un public senior",
          "Elle est systématiquement en contradiction avec la vision artistique du jeu",
          "Elle n'a été adoptée par aucun grand studio à ce jour",
        ],
        correctIndex: 1,
        explanation:
          "Intégrer des options d'accessibilité (difficulté ajustable, sous-titres, remapping) élargit l'audience à des joueurs avec des besoins spécifiques, un enjeu d'inclusion de plus en plus intégré nativement dans la conception plutôt qu'ajouté après coup.",
      },
      {
        question: "Qu'est-ce que le \"scope creep\" en production de jeu vidéo et pourquoi est-il l'une des causes principales de retard ou d'échec de projet ?",
        options: [
          "Un bug technique lié au moteur graphique",
          "L'élargissement progressif et incontrôlé du périmètre du projet (ajout de fonctionnalités non planifiées), qui dépasse les capacités réelles de l'équipe et des délais fixés",
          "Une technique marketing de teasing progressif du contenu",
          "Un terme qui ne s'applique qu'aux très petits studios indépendants",
          "Un phénomène qui n'a aucun impact mesurable sur les délais",
        ],
        correctIndex: 1,
        explanation:
          "Le scope creep désigne l'élargissement progressif et souvent incontrôlé du périmètre d'un projet (nouvelles fonctionnalités ajoutées en cours de route), qui dépasse la capacité réelle de l'équipe -- une cause fréquente de retards et de dépassements de budget dans l'industrie.",
      },
      {
        question: "Pourquoi la propriété intellectuelle (moteur, assets, marque) est-elle un enjeu stratégique central dans l'industrie du jeu vidéo ?",
        options: [
          "La propriété intellectuelle n'a aucun impact économique sur un studio",
          "Elle conditionne la capacité du studio à exploiter durablement une licence (suites, produits dérivés, adaptations), et sa protection insuffisante peut fragiliser tout le modèle économique du studio",
          "Elle ne concerne que les très grands éditeurs internationaux",
          "Un studio indépendant n'a jamais besoin de protéger sa propriété intellectuelle",
          "Elle a perdu toute importance avec l'essor du jeu en tant que service",
        ],
        correctIndex: 1,
        explanation:
          "La propriété intellectuelle (marque, univers, technologie) conditionne la capacité d'un studio à exploiter durablement ses créations (suites, produits dérivés) : une protection insuffisante peut fragiliser tout son modèle économique à long terme, y compris pour les studios indépendants.",
      },
    ],
  },

  pharma_industrie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'industrie pharmaceutique / biotech ?",
        options: [
          "J'aime l'idée de contribuer à des produits qui améliorent la santé des gens",
          "Parce que c'est un secteur qui paie bien, sans autre raison",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour l'impact sur la santé publique est au cœur du secteur -- une motivation bien plus solide qu'une motivation purement financière.",
      },
      {
        question: "Pourquoi la traçabilité est-elle absolument centrale dans la production pharmaceutique ?",
        options: [
          "Ce n'est qu'une contrainte administrative sans réel enjeu",
          "Parce qu'un défaut de qualité non identifié peut avoir des conséquences graves sur la santé des patients, et la traçabilité permet de retrouver et isoler rapidement un lot concerné",
          "La traçabilité ne concerne que les médicaments génériques",
          "Elle n'a aucun lien avec la sécurité des patients",
          "Elle est facultative pour les petites productions",
        ],
        correctIndex: 1,
        explanation:
          "En cas de défaut de qualité, la traçabilité permet d'identifier et de rappeler précisément le ou les lots concernés, limitant l'impact sur la santé des patients -- un enjeu de sécurité sanitaire majeur.",
      },
      {
        question: "Un collègue te propose de sauter une étape de vérification qualité pour gagner du temps sur une échéance. Que fais-tu ?",
        options: [
          "J'accepte pour respecter le délai",
          "Je refuse et explique que les procédures qualité ne sont jamais négociables, quel que soit le délai",
          "Je saute l'étape sans en parler à personne",
          "Je laisse le collègue décider seul",
          "Je considère que ça dépend de l'importance du produit",
        ],
        correctIndex: 1,
        explanation:
          "Dans l'industrie pharmaceutique, les procédures qualité protègent directement la sécurité des patients : elles ne sont jamais négociables, même sous pression de délai.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite, donc j'apprends à toujours respecter scrupuleusement chaque procédure",
          "Je n'aime pas les protocoles stricts",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur procédurale, essentielle dans ce secteur très réglementé, avec une piste d'amélioration concrète, montre une bonne compréhension des enjeux.",
      },
      {
        question: "Qu'est-ce que les Bonnes Pratiques de Fabrication (BPF/GMP), en une phrase simple ?",
        options: [
          "Des recommandations facultatives laissées à l'appréciation de chaque usine",
          "Un ensemble de normes obligatoires garantissant que les médicaments sont produits et contrôlés de façon constante, selon des standards de qualité stricts",
          "Une certification qui ne concerne que l'exportation de médicaments",
          "Un label marketing sans réelle exigence technique",
          "Une norme réservée aux médicaments génériques uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Les BPF (Bonnes Pratiques de Fabrication, GMP en anglais) sont des normes obligatoires qui garantissent une production et un contrôle constants des médicaments selon des standards de qualité stricts, contrôlées par les autorités sanitaires.",
      },
    ],
    medium: [
      {
        question: "Pourquoi les essais cliniques se déroulent-ils en plusieurs phases distinctes avant la mise sur le marché d'un médicament ?",
        options: [
          "Cette organisation en phases n'a qu'une valeur administrative",
          "Chaque phase répond à un objectif précis (sécurité, dosage, efficacité, surveillance à grande échelle), permettant d'évaluer progressivement le rapport bénéfice/risque avant une exposition large de la population",
          "Les phases sont interchangeables et peuvent être menées dans n'importe quel ordre",
          "Une seule phase suffit pour la majorité des médicaments actuels",
          "Les essais cliniques ne concernent que les traitements contre le cancer",
        ],
        correctIndex: 1,
        explanation:
          "Les phases successives (I : sécurité/tolérance, II : dosage/efficacité préliminaire, III : efficacité à grande échelle, IV : surveillance post-commercialisation) permettent d'évaluer progressivement le rapport bénéfice/risque avant d'exposer une large population.",
      },
      {
        question: "Comment réagis-tu face à un écart qualité détecté sur une ligne de production (résultat hors spécification) ?",
        options: [
          "Je continue la production en espérant que ça n'affecte pas le lot final",
          "Je déclare l'écart selon la procédure prévue, isole le lot concerné et déclenche l'investigation nécessaire avant toute libération",
          "Je corrige discrètement sans documenter l'écart",
          "J'ignore l'écart si le volume concerné est faible",
          "Je décide seul de la conformité sans suivre de procédure",
        ],
        correctIndex: 1,
        explanation:
          "Tout écart qualité doit être déclaré, documenté et investigué selon une procédure formalisée avant toute décision de libération du lot -- un principe non négociable dans ce secteur très réglementé.",
      },
      {
        question: "Pourquoi la pharmacovigilance (suivi des effets indésirables après commercialisation) reste-t-elle active bien après la mise sur le marché d'un médicament ?",
        options: [
          "Ce suivi n'a plus d'utilité une fois le médicament autorisé",
          "Parce que certains effets indésirables rares ne se manifestent qu'à grande échelle, une fois le médicament utilisé par une population beaucoup plus large et diverse que lors des essais cliniques",
          "La pharmacovigilance ne concerne que les médicaments génériques",
          "Elle est facultative pour les laboratoires ayant déjà obtenu leur autorisation",
          "Elle ne concerne que les 6 premiers mois après la commercialisation",
        ],
        correctIndex: 1,
        explanation:
          "Certains effets indésirables rares n'apparaissent qu'à grande échelle, une fois le médicament utilisé par une population beaucoup plus large et diverse que lors des essais cliniques limités : la pharmacovigilance permet de détecter ces signaux après commercialisation.",
      },
      {
        question: "Pourquoi la documentation rigoureuse (\"si ce n'est pas écrit, ça n'a pas été fait\") est-elle un principe central de l'industrie pharmaceutique ?",
        options: [
          "Ce n'est qu'une contrainte bureaucratique sans réel enjeu",
          "Parce qu'en cas de contrôle réglementaire ou d'incident, seule une documentation traçable permet de prouver que les procédures ont bien été respectées",
          "La documentation ne concerne que les essais cliniques",
          "Elle n'a aucun lien avec la conformité réglementaire",
          "Ce principe ne s'applique qu'aux laboratoires de recherche, jamais à la production",
        ],
        correctIndex: 1,
        explanation:
          "En cas de contrôle ou d'incident, seule une documentation traçable et complète permet de prouver le respect effectif des procédures : d'où le principe \"si ce n'est pas écrit, ça n'a pas été fait\", central dans ce secteur.",
      },
      {
        question: "Comment expliquerais-tu à un non-spécialiste la différence entre un médicament princeps et un médicament générique ?",
        options: [
          "Le générique est toujours moins efficace que le princeps",
          "Le générique contient le même principe actif que le princeps, avec une efficacité et une sécurité équivalentes démontrées, mais commercialisé après l'expiration du brevet à un prix généralement inférieur",
          "Le princeps et le générique n'ont jamais le même principe actif",
          "Le générique est fabriqué sans aucun contrôle qualité",
          "Cette distinction n'existe que pour certaines classes de médicaments",
        ],
        correctIndex: 1,
        explanation:
          "Un générique contient le même principe actif que le princeps original, avec une bioéquivalence démontrée, mais commercialisé après expiration du brevet -- une distinction souvent mal comprise du grand public, utile à savoir expliquer simplement.",
      },
      {
        question: "Pourquoi la gestion de la chaîne du froid est-elle critique pour certains produits biotechnologiques (vaccins, biothérapies) ?",
        options: [
          "La chaîne du froid n'a d'impact que sur le goût du produit",
          "Une rupture de la chaîne du froid peut dégrader irréversiblement l'efficacité de produits biologiques sensibles à la température, sans que cela soit toujours visible à l'œil nu",
          "Elle ne concerne que les produits destinés à l'export",
          "Elle est identique en exigence à celle des produits alimentaires classiques",
          "Elle ne concerne que le stockage, jamais le transport",
        ],
        correctIndex: 1,
        explanation:
          "Certains produits biotechnologiques (vaccins, anticorps monoclonaux) sont très sensibles à la température : une rupture de la chaîne du froid peut dégrader leur efficacité de façon irréversible et invisible, sans altération visible du produit.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la validation de procédé (process validation) et pourquoi va-t-elle au-delà du simple contrôle qualité en fin de production ?",
        options: [
          "Un contrôle final unique réalisé sur le produit fini avant expédition",
          "Une démarche documentée qui prouve, à travers plusieurs lots, qu'un procédé de fabrication produit de façon constante un résultat conforme aux spécifications prédéfinies",
          "Une étape facultative recommandée mais non obligatoire",
          "Un processus qui ne concerne que les nouveaux médicaments, jamais les produits déjà commercialisés",
          "Une validation qui se fait une seule fois, à vie, sans jamais être renouvelée",
        ],
        correctIndex: 1,
        explanation:
          "La validation de procédé prouve, sur plusieurs lots et de façon documentée, que le procédé de fabrication produit de façon constante et reproductible un résultat conforme -- une démarche continue, bien plus large qu'un simple contrôle qualité final.",
      },
      {
        question: "Quelle est la différence entre une AMM (Autorisation de Mise sur le Marché) nationale, centralisée européenne, et une procédure de reconnaissance mutuelle ?",
        options: [
          "Ce sont trois procédures strictement identiques, seul le nom change",
          "La procédure centralisée délivre une AMM valable dans toute l'UE via l'EMA, la nationale ne concerne qu'un seul pays, et la reconnaissance mutuelle étend une AMM nationale existante à d'autres États membres",
          "La procédure nationale est toujours plus rapide que la procédure centralisée",
          "La reconnaissance mutuelle ne concerne que les médicaments génériques",
          "Ces procédures n'existent qu'en dehors de l'Union européenne",
        ],
        correctIndex: 1,
        explanation:
          "La procédure centralisée (via l'EMA) délivre une autorisation valable dans toute l'UE en une fois, la procédure nationale ne couvre qu'un pays, et la reconnaissance mutuelle étend une AMM nationale existante à d'autres États membres -- trois voies réglementaires aux logiques différentes.",
      },
      {
        question: "Pourquoi le concept de \"Quality by Design\" (QbD) marque-t-il une évolution par rapport à l'approche qualité traditionnelle ?",
        options: [
          "Le QbD consiste uniquement à renforcer les contrôles qualité en fin de production",
          "Le QbD intègre la qualité dès la conception du produit et du procédé (compréhension des paramètres critiques), plutôt que de la vérifier a posteriori par des tests finaux",
          "Le QbD a été abandonné au profit du contrôle qualité traditionnel",
          "Il ne concerne que l'emballage des produits pharmaceutiques",
          "Il élimine totalement le besoin de contrôle qualité en production",
        ],
        correctIndex: 1,
        explanation:
          "Le Quality by Design intègre une compréhension approfondie des paramètres critiques dès la conception du produit et du procédé, réduisant la variabilité en amont plutôt que de simplement détecter les défauts par un contrôle final -- une évolution reconnue par les autorités réglementaires (ICH Q8).",
      },
      {
        question: "Qu'est-ce que la biodisponibilité d'un médicament et pourquoi sa mesure est-elle centrale dans le développement galénique ?",
        options: [
          "Un terme désignant uniquement la durée de conservation du produit",
          "La proportion et la vitesse à laquelle le principe actif atteint la circulation sanguine et devient disponible pour agir sur l'organisme, un facteur clé influencé par la formulation galénique",
          "Un concept qui ne concerne que les médicaments injectables",
          "Une mesure purement réglementaire sans impact sur l'efficacité clinique",
          "Un paramètre identique pour toutes les formes galéniques d'un même principe actif",
        ],
        correctIndex: 1,
        explanation:
          "La biodisponibilité mesure la proportion et la vitesse à laquelle le principe actif devient réellement disponible dans l'organisme : un paramètre directement influencé par la formulation galénique (comprimé, gélule, forme à libération prolongée...), central pour l'efficacité clinique réelle.",
      },
      {
        question: "Pourquoi la propriété intellectuelle (brevets) joue-t-elle un rôle si structurant dans le modèle économique de l'industrie pharmaceutique innovante ?",
        options: [
          "Les brevets n'ont aucun impact sur la rentabilité des laboratoires",
          "Un brevet garantit une exclusivité commerciale temporaire permettant d'amortir les coûts de recherche très élevés avant l'arrivée de génériques concurrents à l'expiration du brevet",
          "Les brevets pharmaceutiques n'ont pas de durée limitée",
          "Le dépôt de brevet ne concerne que les molécules déjà commercialisées",
          "Les brevets pharmaceutiques sont identiques dans tous les pays du monde",
        ],
        correctIndex: 1,
        explanation:
          "Un brevet garantit une exclusivité commerciale temporaire (généralement 20 ans depuis le dépôt), permettant d'amortir les coûts de recherche très élevés (souvent plusieurs centaines de millions d'euros par molécule) avant l'arrivée de génériques à son expiration -- un mécanisme central du modèle économique du secteur.",
      },
      {
        question: "Qu'est-ce que la thérapie génique et pourquoi pose-t-elle des défis réglementaires et de fabrication différents des médicaments chimiques classiques ?",
        options: [
          "Elle est produite et contrôlée exactement de la même façon qu'un médicament chimique classique",
          "Elle repose sur des produits biologiques complexes (souvent personnalisés ou à très petite échelle), posant des défis inédits de fabrication, de traçabilité individuelle et d'évaluation des risques à long terme",
          "La thérapie génique ne nécessite aucune autorisation réglementaire spécifique",
          "Elle est produite uniquement à l'échelle industrielle de masse, comme les médicaments génériques",
          "Ce type de traitement n'existe qu'au stade expérimental, jamais commercialisé",
        ],
        correctIndex: 1,
        explanation:
          "Les thérapies géniques reposent souvent sur des produits biologiques complexes, parfois personnalisés patient par patient, posant des défis inédits de fabrication à petite échelle, de traçabilité individuelle stricte et d'évaluation des risques à long terme, nécessitant des cadres réglementaires spécifiques (thérapies innovantes).",
      },
      {
        question: "Pourquoi la contrefaçon de médicaments représente-t-elle un enjeu de sécurité sanitaire mondial, au-delà de la seule question de propriété intellectuelle ?",
        options: [
          "La contrefaçon de médicaments n'existe pas en pratique, seuls les produits de luxe sont concernés",
          "Un médicament contrefait peut contenir un dosage incorrect, un principe actif absent ou des substances dangereuses, exposant directement les patients à un risque vital, en particulier dans les pays où les circuits de distribution sont moins contrôlés",
          "La contrefaçon ne concerne que les marchés parallèles hors Union européenne",
          "Elle est intégralement éliminée par la sérialisation des boîtes de médicaments",
          "Ce risque ne concerne que les médicaments les plus chers du marché",
        ],
        correctIndex: 1,
        explanation:
          "Un médicament contrefait peut contenir un dosage incorrect, aucun principe actif, ou des substances dangereuses : un risque sanitaire direct et grave pour le patient, particulièrement documenté dans les circuits de distribution moins contrôlés à l'échelle mondiale.",
      },
    ],
  },

  architecture_urbanisme: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en architecture / urbanisme ?",
        options: [
          "J'aime concevoir des espaces qui améliorent la vie des gens qui les habitent",
          "Parce que ça a l'air un métier facile et créatif sans contrainte",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour l'impact concret d'un espace sur la vie de ses usagers est au cœur du métier -- une motivation bien plus solide qu'une idée fausse de facilité.",
      },
      {
        question: "Qu'est-ce qu'un permis de construire, en une phrase simple ?",
        options: [
          "Un simple document facultatif sans réelle valeur juridique",
          "Une autorisation administrative obligatoire avant certains travaux de construction, vérifiant leur conformité aux règles d'urbanisme",
          "Un document délivré uniquement pour les bâtiments publics",
          "Une taxe payée après la fin des travaux",
          "Un document réservé aux constructions de plus de 5 étages",
        ],
        correctIndex: 1,
        explanation:
          "Le permis de construire vérifie la conformité d'un projet aux règles d'urbanisme locales (PLU) avant d'autoriser les travaux -- une étape administrative incontournable pour la plupart des constructions.",
      },
      {
        question: "Un client souhaite une modification qui compromettrait la solidité ou la conformité réglementaire du projet. Que fais-tu ?",
        options: [
          "J'accepte sans discussion pour satisfaire le client",
          "J'explique clairement pourquoi cette modification pose un problème technique ou réglementaire et propose une alternative",
          "Je refuse sans aucune explication",
          "Je fais la modification sans en informer personne",
          "Je change de sujet pour éviter la discussion",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer clairement l'enjeu technique/réglementaire et proposer une alternative montre à la fois expertise et sens du service, plutôt qu'un refus sec ou une concession dangereuse.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop attaché(e) à une idée créative, donc j'apprends à intégrer les contraintes techniques et budgétaires plus tôt",
          "Je n'aime pas dessiner",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier créatif (l'attachement à une idée face aux contraintes réelles), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi la prise en compte du contexte existant (bâti environnant, usages du quartier) est-elle essentielle avant de concevoir un projet ?",
        options: [
          "Ce n'est pas vraiment important, seul le design compte",
          "Parce qu'un projet mal intégré à son environnement peut créer des tensions d'usage ou une rupture visuelle qui nuit à la qualité de vie du quartier",
          "Le contexte existant ne concerne que les zones historiques classées",
          "Ça n'a aucun impact sur l'acceptabilité du projet",
          "Cette analyse est facultative pour les petits projets",
        ],
        correctIndex: 1,
        explanation:
          "Un projet déconnecté de son contexte (bâti, usages, échelle) peut créer des tensions ou une rupture visuelle mal vécue par les riverains : l'analyse contextuelle est une étape fondamentale de la conception.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu un projet dont le budget contraint oblige à revoir certains choix architecturaux ambitieux ?",
        options: [
          "Je refuse tout compromis sur la vision initiale",
          "Je priorise les éléments ayant le plus d'impact sur la qualité d'usage et propose des alternatives plus économiques sur le reste",
          "J'abandonne complètement le projet",
          "Je réduis la qualité de tous les éléments de façon uniforme sans réflexion",
          "Je considère qu'un compromis budgétaire n'est jamais possible",
        ],
        correctIndex: 1,
        explanation:
          "Prioriser les éléments ayant le plus d'impact réel sur l'usage, plutôt qu'une réduction uniforme de la qualité, permet de préserver l'essentiel du projet même sous contrainte budgétaire.",
      },
      {
        question: "Pourquoi le Plan Local d'Urbanisme (PLU) encadre-t-il strictement ce qu'il est possible de construire sur une parcelle donnée ?",
        options: [
          "Le PLU n'a qu'une valeur indicative sans réelle contrainte",
          "Il définit des règles précises (hauteur, emprise au sol, destination des sols) pour organiser un développement cohérent du territoire et éviter les incompatibilités entre usages",
          "Le PLU ne concerne que les grandes métropoles",
          "Il est identique sur l'ensemble du territoire national",
          "Il ne s'applique qu'aux constructions de plus de 3 étages",
        ],
        correctIndex: 1,
        explanation:
          "Le PLU définit des règles précises par zone pour organiser un développement cohérent du territoire (hauteur, emprise, destination) et éviter des incompatibilités d'usage (ex: une usine polluante à côté d'une école).",
      },
      {
        question: "Comment intègres-tu les enjeux environnementaux (matériaux, isolation, énergie) dans un projet, sans négliger l'aspect esthétique et fonctionnel ?",
        options: [
          "L'aspect environnemental et l'esthétique sont toujours en contradiction totale",
          "En cherchant des solutions qui répondent simultanément aux exigences énergétiques et à l'intention architecturale, plutôt que de les traiter comme deux exigences séparées",
          "Je néglige systématiquement l'aspect environnemental au profit de l'esthétique",
          "Je néglige systématiquement l'esthétique au profit de la performance énergétique",
          "Ces enjeux ne concernent que les bâtiments publics",
        ],
        correctIndex: 1,
        explanation:
          "Chercher des solutions qui répondent simultanément aux exigences énergétiques et à l'intention architecturale (plutôt que de les opposer) est une compétence de plus en plus centrale du métier, avec le renforcement des normes environnementales (RE2020).",
      },
      {
        question: "Pourquoi la concertation avec les futurs usagers ou les riverains est-elle de plus en plus intégrée en amont des projets d'urbanisme ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel impact sur le projet",
          "Elle permet d'anticiper les besoins réels et les points de blocage potentiels, réduisant le risque de contestation ou de rejet du projet une fois avancé",
          "La concertation ne concerne que les très grands projets d'infrastructure",
          "Elle remplace totalement l'expertise technique des professionnels",
          "Elle n'a aucun impact sur l'acceptabilité sociale du projet",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper les besoins réels et les points de blocage via la concertation réduit le risque de contestation tardive (recours, mobilisation citoyenne) qui peut retarder ou compromettre un projet déjà avancé.",
      },
      {
        question: "Comment justifierais-tu un choix architectural devant un jury ou un client qui le remet en question ?",
        options: [
          "En affirmant simplement que c'est un choix esthétique personnel",
          "En reliant le choix à des critères concrets (usage, contexte, contrainte technique ou budgétaire, intention du projet)",
          "En refusant de justifier mes choix créatifs",
          "En changeant systématiquement d'avis dès la première objection",
          "En ignorant la question posée",
        ],
        correctIndex: 1,
        explanation:
          "Relier un choix architectural à des critères concrets et objectivables (usage, contexte, contrainte) renforce sa légitimité, bien plus qu'une justification purement subjective.",
      },
      {
        question: "Pourquoi la coordination avec les autres corps de métier (structure, fluides, thermique) doit-elle intervenir dès les premières phases de conception ?",
        options: [
          "Cette coordination peut toujours attendre la phase de chantier sans problème",
          "Des choix architecturaux pris sans tenir compte des contraintes structurelles ou techniques peuvent s'avérer irréalisables ou très coûteux à corriger une fois le projet avancé",
          "La coordination ne concerne que les projets de très grande envergure",
          "Elle n'a aucun impact sur le coût final du projet",
          "Elle est entièrement automatisée par les logiciels de conception modernes",
        ],
        correctIndex: 1,
        explanation:
          "Un choix architectural incompatible avec les contraintes structurelles ou techniques, découvert tardivement, peut nécessiter une reprise coûteuse : la coordination précoce avec les autres corps de métier évite ces mauvaises surprises.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la RE2020 (réglementation environnementale) impose de nouveau par rapport aux réglementations thermiques précédentes ?",
        options: [
          "Elle ne concerne que l'isolation thermique, comme les réglementations précédentes",
          "Elle élargit l'évaluation à l'impact carbone sur l'ensemble du cycle de vie du bâtiment (construction incluse), au-delà de la seule performance énergétique en phase d'usage",
          "Elle a été abandonnée au profit d'un retour à la RT2012",
          "Elle ne s'applique qu'aux bâtiments tertiaires, jamais aux logements",
          "Elle supprime toute obligation de performance énergétique",
        ],
        correctIndex: 1,
        explanation:
          "La RE2020 élargit l'évaluation environnementale à l'ensemble du cycle de vie du bâtiment (matériaux, construction, usage, déconstruction), une approche plus globale que les réglementations thermiques précédentes centrées sur la seule performance en phase d'usage.",
      },
      {
        question: "Quelle est la responsabilité juridique de l'architecte au titre de la garantie décennale, et pourquoi cette responsabilité est-elle particulièrement étendue ?",
        options: [
          "L'architecte n'a aucune responsabilité une fois les travaux achevés",
          "L'architecte peut être tenu responsable pendant 10 ans des désordres compromettant la solidité de l'ouvrage ou le rendant impropre à sa destination, y compris pour des choix de conception",
          "Cette garantie ne concerne que l'entreprise de construction, jamais l'architecte",
          "La responsabilité de l'architecte se limite à la phase de conception, jamais à la réalisation",
          "La garantie décennale ne s'applique qu'aux bâtiments publics",
        ],
        correctIndex: 1,
        explanation:
          "L'architecte, en tant que concepteur souvent impliqué dans le suivi de chantier, peut être tenu responsable pendant 10 ans (garantie décennale) de désordres liés à des choix de conception compromettant la solidité ou l'usage prévu de l'ouvrage.",
      },
      {
        question: "Qu'est-ce que la densification urbaine et pourquoi est-elle devenue un enjeu central face à l'artificialisation des sols ?",
        options: [
          "La densification consiste uniquement à construire des tours toujours plus hautes",
          "Elle vise à optimiser l'usage du foncier déjà urbanisé (construire davantage sur les surfaces existantes) plutôt que d'étendre l'urbanisation sur des espaces naturels ou agricoles, un enjeu renforcé par l'objectif ZAN (zéro artificialisation nette)",
          "La densification urbaine n'a aucun lien avec les objectifs environnementaux",
          "Elle ne concerne que les très grandes métropoles internationales",
          "Elle a été abandonnée par les politiques publiques françaises récentes",
        ],
        correctIndex: 1,
        explanation:
          "La densification vise à optimiser l'usage du foncier déjà urbanisé plutôt que d'artificialiser de nouveaux espaces naturels ou agricoles -- un enjeu renforcé en France par l'objectif réglementaire de zéro artificialisation nette (ZAN).",
      },
      {
        question: "Pourquoi le BIM (Building Information Modeling) transforme-t-il en profondeur la coordination entre les différents intervenants d'un projet de construction ?",
        options: [
          "Le BIM n'est qu'un logiciel de dessin 3D supplémentaire, sans changement de méthode",
          "Il centralise dans une maquette numérique unique et partagée les données de tous les corps de métier, permettant de détecter les conflits techniques avant le chantier plutôt qu'en cours de réalisation",
          "Le BIM ne concerne que la phase de conception, jamais l'exploitation du bâtiment",
          "Il remplace totalement le besoin de coordination humaine entre les métiers",
          "Il est aujourd'hui abandonné au profit de méthodes de conception traditionnelles",
        ],
        correctIndex: 1,
        explanation:
          "Le BIM centralise les données de tous les corps de métier dans une maquette numérique unique et partagée, permettant de détecter les conflits techniques (collision entre réseaux, structure...) avant le chantier plutôt que de les découvrir, coûteusement, en cours de réalisation.",
      },
      {
        question: "Qu'est-ce que le \"droit de préemption urbain\" et quel rôle joue-t-il dans la maîtrise foncière des collectivités ?",
        options: [
          "Un droit qui permet à n'importe quel citoyen d'acheter en priorité un bien mis en vente",
          "Un droit qui permet à une collectivité publique d'acquérir en priorité un bien mis en vente dans une zone définie, pour mener à bien un projet d'aménagement d'intérêt général",
          "Un droit réservé exclusivement à l'État, jamais aux communes",
          "Un dispositif qui a été supprimé du droit de l'urbanisme français",
          "Un droit qui s'applique uniquement aux terrains agricoles",
        ],
        correctIndex: 1,
        explanation:
          "Le droit de préemption urbain permet à une collectivité d'acquérir en priorité un bien mis en vente dans une zone définie, un outil clé de maîtrise foncière pour mener à bien des projets d'aménagement d'intérêt général (logement social, équipements publics...).",
      },
      {
        question: "Pourquoi la notion de \"réversibilité\" des bâtiments (capacité à changer d'usage dans le temps) devient-elle un critère de conception de plus en plus recherché ?",
        options: [
          "Elle n'a aucun intérêt pratique, un bâtiment garde toujours le même usage",
          "Elle permet d'adapter un bâtiment à des besoins futurs différents (bureaux transformés en logements, par exemple) sans démolition-reconstruction complète, un enjeu économique et environnemental face à des usages qui évoluent plus vite que la durée de vie du bâti",
          "La réversibilité ne concerne que les bâtiments industriels",
          "Elle est incompatible avec toute exigence de qualité architecturale",
          "Ce critère a été abandonné par les maîtres d'ouvrage récents",
        ],
        correctIndex: 1,
        explanation:
          "Face à des usages (bureaux, commerces, logements) qui évoluent souvent plus vite que la durée de vie physique d'un bâtiment, concevoir pour la réversibilité (structure adaptable, trames flexibles) évite des démolitions-reconstructions coûteuses en ressources et en carbone.",
      },
      {
        question: "Pourquoi la responsabilité de l'architecte est-elle engagée différemment selon qu'il assure ou non la mission complète (conception ET suivi de chantier) ?",
        options: [
          "La mission réalisée n'a aucune influence sur l'étendue de la responsabilité",
          "Un architecte n'assurant que la conception voit sa responsabilité limitée aux défauts de conception, tandis qu'une mission complète incluant le suivi de chantier élargit sa responsabilité à la bonne exécution des travaux",
          "La responsabilité de l'architecte est toujours totale, quelle que soit la mission contractuelle",
          "Le suivi de chantier n'engage jamais la responsabilité de l'architecte",
          "Cette distinction n'existe pas en droit français de la construction",
        ],
        correctIndex: 1,
        explanation:
          "L'étendue de la mission contractuelle (conception seule, ou conception + suivi de chantier) détermine le périmètre de la responsabilité de l'architecte : une mission complète élargit sa responsabilité à la bonne exécution des travaux, pas seulement aux choix de conception initiaux.",
      },
    ],
  },

  audit_conseil: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en audit / conseil en stratégie ?",
        options: [
          "J'aime résoudre des problématiques variées et complexes pour des organisations différentes",
          "Parce que c'est un secteur qui paie bien, sans autre raison",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le goût de la résolution de problèmes variés pour des contextes différents est au cœur du métier -- une motivation bien plus solide qu'une motivation purement financière.",
      },
      {
        question: "Qu'est-ce qu'un audit, en une phrase simple ?",
        options: [
          "Un contrôle informel sans méthode particulière",
          "Un examen méthodique et indépendant visant à vérifier la conformité ou la fiabilité d'une organisation, d'un processus ou de comptes selon des critères définis",
          "Un simple entretien avec la direction d'une entreprise",
          "Une évaluation réservée uniquement aux grandes entreprises cotées",
          "Un document purement interne sans valeur externe",
        ],
        correctIndex: 1,
        explanation:
          "L'audit est un examen méthodique et indépendant, basé sur des critères définis (normes comptables, procédures...), qui vise à vérifier la conformité ou la fiabilité de ce qui est audité.",
      },
      {
        question: "En mission chez un client, tu identifies un point sensible que le client n'a pas mentionné. Que fais-tu ?",
        options: [
          "Je l'ignore si ce n'est pas dans le périmètre initial de la mission",
          "Je le documente et en informe mon responsable de mission pour décider de la marche à suivre",
          "Je le confronte directement et publiquement devant toute l'équipe du client",
          "Je le garde pour moi sans en parler à personne",
          "Je le corrige moi-même sans en informer personne",
        ],
        correctIndex: 1,
        explanation:
          "Documenter un point sensible et en référer à son responsable de mission avant d'agir est la démarche professionnelle attendue -- plutôt que d'ignorer, d'agir seul ou de confronter sans discernement.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite sur une analyse, donc j'apprends à toujours vérifier mes conclusions avant de les présenter",
          "Je n'aime pas travailler avec des données chiffrées",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur d'analyse, essentielle dans ce métier, avec une piste d'amélioration concrète, montre une bonne compréhension des exigences du poste.",
      },
      {
        question: "Pourquoi l'indépendance est-elle un principe fondamental du métier d'auditeur ?",
        options: [
          "Ce n'est pas vraiment important si l'auditeur est compétent",
          "Parce qu'un auditeur en conflit d'intérêt avec l'entité auditée ne peut pas garantir une évaluation objective et fiable",
          "L'indépendance ne concerne que les très grands cabinets",
          "Elle n'a aucun lien avec la crédibilité du rapport d'audit",
          "Elle est facultative pour les audits internes",
        ],
        correctIndex: 1,
        explanation:
          "Un auditeur en conflit d'intérêt ne peut pas garantir une évaluation objective : l'indépendance est ce qui donne sa crédibilité et sa valeur à un rapport d'audit, quel que soit le niveau de compétence technique.",
      },
    ],
    medium: [
      {
        question: "Comment structures-tu une recommandation stratégique pour qu'elle soit vraiment actionnable par le client ?",
        options: [
          "Je présente uniquement un diagnostic général sans recommandation concrète",
          "Je relie chaque recommandation à des données concrètes du diagnostic, avec des étapes de mise en œuvre réalistes et des indicateurs de suivi",
          "Je propose systématiquement la solution la plus ambitieuse, sans considérer la capacité réelle du client à la mettre en œuvre",
          "Je copie une solution qui a fonctionné pour un autre client sans adaptation",
          "Je laisse le client déterminer seul comment mettre en œuvre mes conclusions",
        ],
        correctIndex: 1,
        explanation:
          "Une recommandation vraiment actionnable relie le diagnostic à des étapes concrètes et réalistes, adaptées à la capacité réelle du client -- pas seulement un constat ou une solution générique copiée d'ailleurs.",
      },
      {
        question: "Pourquoi la collecte de preuves d'audit (evidence) doit-elle être suffisante et appropriée avant de formuler une conclusion ?",
        options: [
          "Une intuition professionnelle suffit toujours à formuler une conclusion fiable",
          "Parce qu'une conclusion d'audit non étayée par des preuves suffisantes et pertinentes n'a pas de valeur probante et expose à un risque de mauvaise conclusion",
          "La collecte de preuves ne concerne que les audits financiers",
          "Elle n'a aucun impact sur la qualité du rapport final",
          "Elle est facultative si le client est réputé fiable",
        ],
        correctIndex: 1,
        explanation:
          "Une conclusion d'audit doit reposer sur des preuves suffisantes et appropriées (documents, entretiens, tests) : sans cette base factuelle solide, la conclusion n'a pas de valeur probante et expose à une erreur d'appréciation.",
      },
      {
        question: "Comment réagis-tu si le client conteste fermement une conclusion de ta mission qu'il juge trop critique ?",
        options: [
          "Je modifie ma conclusion pour satisfaire le client, même sans nouvel élément",
          "Je réexplique la méthodologie et les preuves qui étayent la conclusion, et je réexamine s'il apporte des éléments factuels nouveaux",
          "Je maintiens ma position sans jamais réexaminer les arguments du client",
          "Je change de sujet pour éviter le conflit",
          "Je considère que le client n'a jamais le droit de contester une conclusion",
        ],
        correctIndex: 1,
        explanation:
          "Réexpliquer la méthodologie et rester ouvert à des éléments factuels nouveaux, sans céder par simple confort, préserve à la fois la rigueur professionnelle et la relation avec le client.",
      },
      {
        question: "Pourquoi la compréhension du secteur d'activité du client est-elle essentielle avant de mener une mission de conseil ou d'audit ?",
        options: [
          "Ce n'est pas vraiment nécessaire, une méthodologie générique suffit toujours",
          "Parce qu'une même donnée ou pratique peut avoir un sens très différent selon le secteur, et une recommandation générique mal contextualisée perd toute sa pertinence",
          "La compréhension sectorielle ne concerne que les missions de très long terme",
          "Elle n'a aucun impact sur la crédibilité du consultant auprès du client",
          "Elle est secondaire par rapport à la seule maîtrise des outils d'analyse",
        ],
        correctIndex: 1,
        explanation:
          "Une même pratique ou donnée peut avoir un sens très différent selon le secteur (marges, cycles, réglementation) : sans cette compréhension contextuelle, une recommandation générique perd toute sa pertinence et sa crédibilité.",
      },
      {
        question: "Comment gères-tu une charge de travail très intense sur une mission avec des délais serrés ?",
        options: [
          "Je bâcle certaines analyses pour tenir le délai coûte que coûte",
          "Je priorise les analyses ayant le plus d'impact sur la conclusion finale et communique tout risque de retard le plus tôt possible",
          "Je refuse systématiquement toute mission avec un délai serré",
          "Je ne préviens l'équipe qu'au dernier moment en cas de difficulté",
          "Je délègue sans supervision pour gagner du temps",
        ],
        correctIndex: 1,
        explanation:
          "Prioriser les analyses les plus déterminantes pour la conclusion et communiquer tôt en cas de tension sur le délai protège à la fois la qualité de la mission et la relation avec le client.",
      },
      {
        question: "Pourquoi la confidentialité des informations obtenues en mission est-elle un enjeu particulièrement sensible dans ce métier ?",
        options: [
          "Ce n'est pas plus sensible qu'ailleurs",
          "Parce qu'un consultant ou auditeur a accès à des informations stratégiques et parfois confidentielles de plusieurs clients, potentiellement concurrents entre eux",
          "La confidentialité ne concerne que les très grandes missions",
          "Elle n'a aucun lien avec la confiance des clients envers le cabinet",
          "Uniquement pour respecter le règlement intérieur du cabinet",
        ],
        correctIndex: 1,
        explanation:
          "Un consultant/auditeur accède souvent à des informations stratégiques sensibles de plusieurs clients, parfois concurrents entre eux : la confidentialité protège à la fois le client et la crédibilité du cabinet.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la différence entre un audit légal (commissariat aux comptes) et un audit contractuel, en termes d'objectif et de cadre juridique ?",
        options: [
          "Ce sont deux termes strictement équivalents pour la même mission",
          "L'audit légal est une obligation réglementaire encadrée par la loi (certification des comptes par un commissaire aux comptes indépendant), tandis que l'audit contractuel répond à une demande spécifique du client, sans cadre légal obligatoire",
          "L'audit contractuel a toujours une valeur juridique supérieure à l'audit légal",
          "L'audit légal ne concerne que les entreprises publiques",
          "L'audit contractuel est systématiquement plus exhaustif que l'audit légal",
        ],
        correctIndex: 1,
        explanation:
          "L'audit légal (commissariat aux comptes) répond à une obligation réglementaire encadrée par la loi, avec des normes professionnelles strictes, tandis que l'audit contractuel répond à une demande spécifique du client, avec un périmètre et une méthodologie définis librement par contrat.",
      },
      {
        question: "Qu'est-ce que le \"biais du consultant\" (parfois critiqué dans le métier) et comment un professionnel rigoureux cherche-t-il à le limiter ?",
        options: [
          "Un biais qui n'existe pas réellement dans la pratique du conseil",
          "La tendance à recommander des solutions standardisées ou familières au cabinet plutôt qu'une analyse réellement sur mesure du contexte spécifique du client, limitée par une immersion réelle dans les données et le terrain du client",
          "Un biais qui ne concerne que les consultants juniors",
          "Un biais qui favorise systématiquement les intérêts du client contre ceux du cabinet",
          "Un biais qui a été totalement éliminé par les outils d'analyse de données modernes",
        ],
        correctIndex: 1,
        explanation:
          "Le biais du consultant désigne la tendance à recommander des solutions standardisées plutôt qu'une analyse réellement adaptée au contexte spécifique : limité par une immersion rigoureuse dans les données et le terrain propres à chaque client, plutôt qu'un cadre d'analyse appliqué mécaniquement.",
      },
      {
        question: "Qu'est-ce que le risque d'audit (audit risk) et comment se décompose-t-il en composantes ?",
        options: [
          "Un risque unique et global, sans décomposition possible",
          "Le risque que l'auditeur émette une opinion inappropriée, décomposé généralement en risque inhérent, risque de contrôle interne, et risque de non-détection propre aux procédures d'audit",
          "Un risque qui ne concerne que la fraude comptable intentionnelle",
          "Un risque qui a été supprimé par les normes d'audit internationales récentes",
          "Un risque qui ne s'applique qu'aux très grandes entreprises cotées",
        ],
        correctIndex: 1,
        explanation:
          "Le risque d'audit se décompose classiquement en risque inhérent (propre à l'activité), risque de contrôle interne (défaillance des contrôles du client) et risque de non-détection (propre aux procédures d'audit elles-mêmes) -- une décomposition qui structure la planification de toute mission.",
      },
      {
        question: "Pourquoi la data analytics transforme-t-elle en profondeur les méthodologies d'audit traditionnelles basées sur l'échantillonnage ?",
        options: [
          "Elle n'a aucun impact sur les méthodologies d'audit établies",
          "Elle permet d'analyser l'intégralité d'une population de transactions plutôt qu'un échantillon limité, améliorant la détection d'anomalies tout en posant de nouveaux enjeux de compétences techniques pour les auditeurs",
          "Elle remplace totalement le jugement professionnel de l'auditeur",
          "Elle ne concerne que les très grandes entreprises technologiques",
          "Elle a été interdite par les normes d'audit internationales",
        ],
        correctIndex: 1,
        explanation:
          "Analyser l'intégralité d'une population de transactions (plutôt qu'un échantillon statistique limité) améliore la détection d'anomalies, mais exige de nouvelles compétences techniques (analyse de données) pour les auditeurs, sans pour autant remplacer le jugement professionnel sur l'interprétation des résultats.",
      },
      {
        question: "Qu'est-ce que le concept de \"matérialité\" (materiality) en audit et comment guide-t-il concrètement les travaux réalisés ?",
        options: [
          "Un seuil fixe identique pour toutes les missions, sans adaptation possible",
          "Un seuil, déterminé selon le jugement professionnel et le contexte du client, au-delà duquel une erreur ou une omission est susceptible d'influencer les décisions des utilisateurs des comptes -- ce seuil oriente la priorisation des travaux d'audit",
          "Un concept qui ne concerne que les très grandes entreprises",
          "Un seuil qui ne s'applique qu'aux missions d'audit financier, jamais au conseil",
          "Une notion abandonnée par les normes d'audit internationales récentes",
        ],
        correctIndex: 1,
        explanation:
          "La matérialité définit un seuil, déterminé selon le jugement professionnel, au-delà duquel une erreur ou omission pourrait influencer les décisions des utilisateurs des comptes : ce seuil oriente concrètement la priorisation et la profondeur des travaux d'audit, évitant de disperser l'effort sur des éléments non significatifs.",
      },
      {
        question: "Pourquoi l'indépendance de l'auditeur fait-elle l'objet d'un encadrement réglementaire renforcé concernant les services non-audit fournis au même client (ex: conseil) ?",
        options: [
          "Cet encadrement n'existe pas, un cabinet peut vendre librement tous types de services à un même client audité",
          "Pour éviter qu'un cabinet ne devienne financièrement dépendant d'un client au point que son jugement d'audit soit influencé, un risque documenté historiquement dans plusieurs scandales financiers majeurs",
          "Cet encadrement ne concerne que les cabinets de moins de 10 salariés",
          "Il a été supprimé après la crise financière de 2008",
          "Il ne s'applique qu'aux missions d'audit réalisées hors de l'Union européenne",
        ],
        correctIndex: 1,
        explanation:
          "Plusieurs scandales financiers majeurs (comme Enron/Arthur Andersen) ont révélé le risque qu'un cabinet, financièrement dépendant d'un client via des services de conseil lucratifs, voie son jugement d'audit compromis -- d'où un encadrement réglementaire renforcé limitant le cumul de services non-audit et audit sur un même client.",
      },
      {
        question: "Pourquoi le jugement professionnel de l'auditeur reste-t-il central même à l'ère des outils d'analyse automatisés et des référentiels normatifs détaillés ?",
        options: [
          "Le jugement professionnel n'a plus sa place, tout est aujourd'hui déterminé mécaniquement par les normes",
          "Les normes et outils fournissent un cadre, mais l'interprétation d'une situation ambiguë, l'évaluation d'un risque spécifique ou la formulation d'une conclusion nuancée exigent toujours une appréciation experte et contextualisée",
          "Le jugement professionnel ne concerne que les associés les plus expérimentés du cabinet",
          "Il a été officiellement supprimé des normes d'audit internationales récentes",
          "Il n'intervient que dans les missions ne faisant appel à aucun outil numérique",
        ],
        correctIndex: 1,
        explanation:
          "Les normes et outils d'analyse fournissent un cadre et des données, mais l'interprétation d'une situation ambiguë ou l'évaluation d'un risque spécifique au contexte du client exigent toujours une appréciation experte -- aucun outil ne remplace ce jugement professionnel contextualisé.",
      },
    ],
  },
};
