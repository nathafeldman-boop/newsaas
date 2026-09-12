// Domaines supplémentaires pour la banque de questions d'entretien --
// fusionnés dans questionBank.ts. Même format et même exigence de qualité
// que le noyau (dev, marketing, RH, commerce, gestion) : contenu écrit à la
// main, aucune dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS: InterviewDomain[] = [
  { id: "communication", label: "Communication d'entreprise / Relations presse" },
  { id: "design", label: "Design / UX-UI" },
  { id: "data", label: "Data / Analytics" },
  { id: "support", label: "Support client / Service client" },
  { id: "logistique", label: "Logistique / Supply chain" },
  { id: "juridique", label: "Juridique" },
  { id: "finance", label: "Finance / Banque" },
  { id: "immobilier", label: "Immobilier" },
  { id: "tourisme", label: "Tourisme / Hôtellerie / Événementiel" },
  { id: "ingenierie", label: "Ingénierie / Production industrielle" },
];

export const EXTRA_BANK: Bank = {
  communication: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en communication ?",
        options: [
          "J'aime trouver la bonne façon de faire passer un message à une audience donnée",
          "Parce que j'aime parler en public sans autre raison",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile",
          "Parce que je veux juste gérer des réseaux sociaux personnels",
        ],
        correctIndex: 0,
        explanation:
          "La communication, c'est adapter un message à une cible et un objectif précis -- une réponse centrée sur cette adaptation rassure plus qu'une réponse centrée sur soi.",
      },
      {
        question: "Qu'est-ce qu'un \"communiqué de presse\" ?",
        options: [
          "Une publicité payante",
          "Un document officiel envoyé aux médias pour annoncer une information de l'entreprise",
          "Un post Instagram",
          "Un contrat commercial",
          "Un rapport financier interne",
        ],
        correctIndex: 1,
        explanation:
          "Le communiqué de presse est l'outil de base des relations presse pour transmettre une information de façon structurée aux journalistes.",
      },
      {
        question: "Que signifie \"identité de marque\" ?",
        options: [
          "Le numéro SIRET de l'entreprise",
          "L'ensemble des éléments (visuels, ton, valeurs) qui rendent une marque reconnaissable et cohérente",
          "Le chiffre d'affaires de l'entreprise",
          "Le nom du PDG",
          "Le logiciel de comptabilité utilisé",
        ],
        correctIndex: 1,
        explanation:
          "L'identité de marque regroupe tout ce qui permet à une audience de reconnaître et différencier une marque des autres.",
      },
      {
        question: "Que dois-tu faire avant d'écrire un message pour une audience ?",
        options: [
          "Écrire directement sans réfléchir",
          "Identifier clairement la cible et l'objectif du message",
          "Copier un message d'une autre entreprise",
          "Choisir uniquement la couleur du visuel",
          "Ignorer le canal de diffusion",
        ],
        correctIndex: 1,
        explanation:
          "Un message efficace part toujours d'une cible et d'un objectif clairs -- sans ça, même un texte bien écrit rate son but.",
      },
      {
        question: "Comment réagis-tu si un commentaire négatif apparaît sur la page réseau social de l'entreprise ?",
        options: [
          "Le supprimer immédiatement sans réponse",
          "Répondre calmement et factuellement, en proposant si besoin un échange en privé",
          "Répondre avec agressivité",
          "L'ignorer complètement",
          "Bloquer la personne immédiatement",
        ],
        correctIndex: 1,
        explanation:
          "Une réponse posée et factuelle protège l'image de marque bien mieux que la suppression ou l'agressivité, qui peuvent envenimer la situation publiquement.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre communication interne et communication externe ?",
        options: [
          "Il n'y a aucune différence",
          "La communication interne s'adresse aux collaborateurs, l'externe au public/clients/médias",
          "L'interne concerne uniquement les salaires",
          "L'externe ne concerne que la publicité payante",
          "L'interne n'existe que dans les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "La communication interne vise à informer et fédérer les équipes, l'externe à construire l'image de l'entreprise auprès de ses publics extérieurs.",
      },
      {
        question: "Qu'est-ce qu'un \"plan de communication\" ?",
        options: [
          "Une simple liste de contacts presse",
          "Un document qui définit objectifs, cibles, messages, canaux et calendrier d'une stratégie de communication",
          "Un logiciel de messagerie",
          "Un contrat avec une agence",
          "Le budget publicitaire uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le plan de communication structure toute l'action à venir pour qu'elle serve un objectif clair, plutôt que d'enchaîner des actions isolées sans cohérence.",
      },
      {
        question: "Une communication de crise doit avant tout être :",
        options: [
          "Rapide, honnête et cohérente sur tous les canaux",
          "La plus longue possible pour tout expliquer en détail",
          "Retardée le plus possible pour gagner du temps",
          "Confiée uniquement aux réseaux sociaux",
          "Silencieuse jusqu'à ce que le problème se résolve seul",
        ],
        correctIndex: 0,
        explanation:
          "En crise, le silence ou l'incohérence entre canaux aggravent la situation ; rapidité, honnêteté et cohérence limitent les dégâts sur la confiance.",
      },
      {
        question: "Qu'est-ce que le \"storytelling\" en communication ?",
        options: [
          "Écrire uniquement des contes pour enfants",
          "Construire un message autour d'un récit qui donne du sens et de l'émotion à une information ou une marque",
          "Copier l'histoire d'une entreprise concurrente",
          "Un format réservé à la vidéo uniquement",
          "Une technique de comptabilité créative",
        ],
        correctIndex: 1,
        explanation:
          "Le storytelling rend un message plus mémorable et engageant en le structurant comme un récit, plutôt qu'une simple liste de faits.",
      },
      {
        question: "Pourquoi mesurer la \"retombée presse\" (media coverage) d'une campagne ?",
        options: [
          "Ça ne sert à rien une fois l'article publié",
          "Pour évaluer la portée, la tonalité et l'impact réel de la couverture médiatique obtenue",
          "Uniquement pour remplir un rapport administratif",
          "Pour payer les journalistes en fonction du nombre d'articles",
          "Pour choisir la couleur du logo",
        ],
        correctIndex: 1,
        explanation:
          "Mesurer les retombées presse (nombre d'articles, portée, tonalité positive/négative) permet de juger l'efficacité réelle d'une opération de relations presse.",
      },
      {
        question: "Un journaliste te pose une question sur un sujet sensible que tu ne peux pas commenter. Que dis-tu ?",
        options: [
          "Rien, tu raccroches sans explication",
          "Tu expliques poliment que tu ne peux pas commenter ce point pour l'instant, et proposes de revenir vers lui dès que possible",
          "Tu inventes une réponse rassurante",
          "Tu accuses le journaliste de mauvaise foi",
          "Tu donnes une information confidentielle pour éviter le silence",
        ],
        correctIndex: 1,
        explanation:
          "Face à la presse, l'honnêteté sur ce qu'on ne peut pas dire (avec une ouverture pour revenir vers eux) est bien plus professionnelle qu'un silence brutal ou une invention.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une communication trop \"corporate\" (institutionnelle et impersonnelle) peut-elle nuire à l'engagement sur les réseaux sociaux ?",
        options: [
          "Ce n'est jamais un problème, le ton institutionnel est toujours préféré",
          "Elle peut sembler distante et peu authentique, ce qui réduit l'identification et l'engagement d'une audience qui cherche du naturel",
          "Elle garantit toujours plus de portée",
          "Elle est obligatoire légalement sur tous les réseaux",
          "Le ton n'a aucun impact sur l'engagement",
        ],
        correctIndex: 1,
        explanation:
          "Les audiences des réseaux sociaux valorisent souvent l'authenticité et la proximité ; un ton trop institutionnel peut créer une distance qui nuit à l'engagement.",
      },
      {
        question: "En pleine crise médiatique, la direction veut absolument éviter de reconnaître une erreur. Quel est le risque de communication à long terme ?",
        options: [
          "Aucun risque, nier fonctionne toujours",
          "Une perte de crédibilité durable si les faits sortent malgré tout, la transparence gérée étant souvent moins coûteuse que le déni",
          "Le silence renforce toujours la confiance",
          "La presse abandonne toujours après un déni ferme",
          "Ce choix n'affecte jamais l'image de marque",
        ],
        correctIndex: 1,
        explanation:
          "Un déni qui s'effondre face aux faits est souvent plus destructeur pour la confiance qu'une reconnaissance maîtrisée et rapide de l'erreur.",
      },
      {
        question: "Pourquoi le \"bad buzz\" peut-il parfois se retourner en opportunité si la réponse de l'entreprise est bien gérée ?",
        options: [
          "Ce n'est jamais possible, un bad buzz est toujours définitivement négatif",
          "Une réponse habile, transparente et avec un peu d'autodérision peut transformer une critique en preuve de sérieux et d'écoute",
          "Il suffit d'ignorer complètement le sujet",
          "Il faut toujours supprimer tous les commentaires",
          "Le bad buzz n'a jamais d'impact sur la réputation",
        ],
        correctIndex: 1,
        explanation:
          "Certaines marques ont retourné des bad buzz en gagnant en sympathie grâce à une réponse intelligente et transparente -- mais ça demande une vraie maîtrise, pas de l'improvisation.",
      },
      {
        question: "Quelle est la principale limite des \"retombées médiatiques\" comme unique indicateur de succès d'une stratégie de communication ?",
        options: [
          "Il n'y a aucune limite, c'est le seul indicateur qui compte",
          "Elles mesurent la visibilité, mais pas nécessairement l'impact réel sur la perception ou le comportement de l'audience",
          "Elles sont toujours fausses",
          "Elles ne concernent que les entreprises cotées en bourse",
          "Elles remplacent totalement les études d'opinion",
        ],
        correctIndex: 1,
        explanation:
          "Beaucoup d'articles ne garantit pas un changement de perception ou de comportement -- un point de vigilance pour ne pas confondre bruit médiatique et impact réel.",
      },
      {
        question: "Pourquoi la cohérence entre communication interne et externe est-elle stratégique lors d'une annonce sensible (ex: restructuration) ?",
        options: [
          "Ce n'est pas important, les deux publics sont totalement indépendants",
          "Si les salariés apprennent une information par la presse avant d'en être informés en interne, cela mine la confiance et peut alimenter des fuites/rumeurs incontrôlées",
          "La communication interne n'a jamais besoin d'être synchronisée avec l'externe",
          "Seule la presse doit être informée en priorité",
          "Cela ne concerne que les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Informer les salariés avant (ou en même temps que) la presse évite un sentiment de trahison qui peut se retourner contre l'entreprise, notamment via les réseaux sociaux.",
      },
      {
        question: "Comment évaluer si une campagne de contenu (articles, vidéos) a réellement renforcé la crédibilité d'une marque, au-delà des vues ?",
        options: [
          "Uniquement en comptant les vues et les likes",
          "En croisant des indicateurs qualitatifs (mentions positives, citations en tant qu'expert, sollicitations médias) avec les indicateurs quantitatifs",
          "Il est impossible de mesurer la crédibilité",
          "En se fiant uniquement à l'avis du dirigeant",
          "En comparant uniquement au budget dépensé",
        ],
        correctIndex: 1,
        explanation:
          "La crédibilité se mesure aussi par des signaux qualitatifs (être cité comme référence, sollicité par les médias) qui vont au-delà des simples métriques de vues.",
      },
      {
        question: "Une agence de com propose un message volontairement polémique pour \"faire du bruit\". Quel risque stratégique dois-tu évaluer avant de valider ?",
        options: [
          "Aucun risque, toute polémique est bonne à prendre",
          "Le risque d'associer durablement la marque à une controverse qui dépasse le message initial et échappe à tout contrôle",
          "Le risque ne concerne que le budget de la campagne",
          "La polémique garantit toujours des ventes",
          "Ce choix n'a aucun impact sur les partenaires ou investisseurs",
        ],
        correctIndex: 1,
        explanation:
          "Un message polémique peut générer de la visibilité, mais aussi échapper totalement au contrôle de la marque et l'associer durablement à une image négative -- un vrai arbitrage risque/bénéfice à faire, pas une évidence.",
      },
    ],
  },

  design: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en design UX/UI ?",
        options: [
          "J'aime résoudre des problèmes d'usage réels pour rendre une interface plus simple et agréable",
          "Parce que j'aime juste dessiner sans autre objectif",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile avec les bons outils",
          "Parce que je veux éviter tout travail d'équipe",
        ],
        correctIndex: 0,
        explanation:
          "Le design UX/UI part d'un problème d'usage réel à résoudre pour l'utilisateur, pas seulement d'une envie esthétique -- une réponse orientée utilisateur rassure le recruteur.",
      },
      {
        question: "Que signifie \"UX\" ?",
        options: [
          "User Experience (expérience utilisateur)",
          "Universal Xtension",
          "User Export",
          "Unique Xperiment",
          "Ultra eXtreme",
        ],
        correctIndex: 0,
        explanation:
          "L'UX désigne l'expérience globale vécue par un utilisateur en interagissant avec un produit -- au-delà du simple aspect visuel.",
      },
      {
        question: "Quelle est la différence entre UX et UI ?",
        options: [
          "Il n'y a aucune différence",
          "L'UX concerne l'expérience globale et l'utilité, l'UI concerne l'apparence visuelle et l'interface concrète",
          "L'UI concerne uniquement le code",
          "L'UX ne concerne que les applications mobiles",
          "L'UI est toujours plus importante que l'UX",
        ],
        correctIndex: 1,
        explanation:
          "L'UX (comment ça fonctionne pour l'utilisateur) et l'UI (à quoi ça ressemble concrètement) sont complémentaires mais distincts.",
      },
      {
        question: "Qu'est-ce qu'un \"wireframe\" ?",
        options: [
          "Le code final d'un site",
          "Une maquette simplifiée, sans détails visuels, qui montre la structure et l'organisation d'une interface",
          "Un logo",
          "Une base de données",
          "Une vidéo promotionnelle",
        ],
        correctIndex: 1,
        explanation:
          "Le wireframe permet de valider la structure d'une interface avant d'investir du temps dans le détail visuel -- une étape clé du processus de design.",
      },
      {
        question: "Pourquoi tester une interface avec de vrais utilisateurs avant de la lancer ?",
        options: [
          "Ce n'est jamais utile, l'avis du designer suffit toujours",
          "Pour identifier les points de confusion ou de blocage réels, souvent invisibles pour celui qui a conçu l'interface",
          "Uniquement pour respecter une obligation légale",
          "Pour retarder le lancement sans raison",
          "Les tests utilisateurs ne concernent que les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Le concepteur d'une interface est souvent trop familier avec elle pour repérer ses propres points de confusion -- les tests utilisateurs révèlent des problèmes réels invisibles en interne.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce qu'un \"persona utilisateur\" en design ?",
        options: [
          "Le nom du designer du projet",
          "Un profil type représentant un segment réel d'utilisateurs, basé sur des données et des recherches",
          "Une police de caractères",
          "Un logiciel de prototypage",
          "Un type de bouton d'interface",
        ],
        correctIndex: 1,
        explanation:
          "Le persona aide l'équipe à concevoir en gardant à l'esprit les besoins et comportements réels d'un type d'utilisateur, plutôt que de deviner au hasard.",
      },
      {
        question: "Pourquoi la cohérence visuelle (design system) est-elle importante sur un produit numérique ?",
        options: [
          "Elle n'a aucun impact réel",
          "Elle facilite la compréhension et la confiance de l'utilisateur, et accélère le travail de l'équipe de design/dev",
          "Elle sert uniquement à impressionner les investisseurs",
          "Elle ralentit toujours le développement",
          "Elle ne concerne que les grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Un design system (composants réutilisables, règles cohérentes) accélère la production et rend l'expérience prévisible et rassurante pour l'utilisateur.",
      },
      {
        question: "Qu'est-ce que l'\"accessibilité\" en design d'interface ?",
        options: [
          "Le prix d'accès au produit",
          "La capacité d'une interface à être utilisable par tous, y compris les personnes en situation de handicap",
          "La rapidité de chargement d'une page",
          "Un type de police de caractères",
          "Une fonctionnalité réservée aux abonnés premium",
        ],
        correctIndex: 1,
        explanation:
          "L'accessibilité garantit qu'une interface reste utilisable par le plus grand nombre (contraste, taille de texte, navigation clavier...) -- un enjeu à la fois éthique et souvent légal.",
      },
      {
        question: "Un utilisateur abandonne un formulaire à la dernière étape sur plusieurs sessions de test. Quelle hypothèse creuser en premier ?",
        options: [
          "L'utilisateur n'aime simplement pas le produit en général",
          "Un frein spécifique à cette dernière étape (champ confus, erreur non expliquée, information demandée en trop)",
          "Rien à analyser, c'est normal statistiquement",
          "Le problème vient toujours de l'ordinateur de l'utilisateur",
          "Il faut immédiatement refaire toute l'interface de zéro",
        ],
        correctIndex: 1,
        explanation:
          "Un abandon localisé à une étape précise pointe vers un problème concret à cet endroit précis, pas vers un rejet général du produit -- il faut creuser localement avant de tout refaire.",
      },
      {
        question: "Pourquoi le \"contraste\" des couleurs est-il un critère important en design d'interface ?",
        options: [
          "Il n'a qu'un rôle esthétique sans autre enjeu",
          "Un bon contraste garantit la lisibilité du texte, y compris pour les personnes malvoyantes",
          "Il sert uniquement à respecter la charte graphique",
          "Le contraste ne concerne que les designs sombres",
          "Il n'a aucun lien avec l'accessibilité",
        ],
        correctIndex: 1,
        explanation:
          "Un contraste insuffisant rend un texte difficile à lire pour tout le monde, et particulièrement problématique pour les personnes ayant une déficience visuelle -- un critère d'accessibilité mesurable (ratio WCAG).",
      },
      {
        question: "Qu'est-ce qu'un \"prototype\" en design, et à quoi sert-il avant le développement ?",
        options: [
          "La version finale du produit déjà codée",
          "Une simulation interactive de l'interface qui permet de tester le parcours utilisateur avant tout développement",
          "Un simple document texte décrivant les fonctionnalités",
          "Un contrat entre designer et développeur",
          "Un outil de facturation",
        ],
        correctIndex: 1,
        explanation:
          "Le prototype permet de valider un parcours utilisateur et de détecter des problèmes tôt, avant d'investir du temps de développement coûteux à corriger après coup.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi un design \"esthétiquement impressionnant\" peut-il parfois nuire à la conversion d'un produit ?",
        options: [
          "Ce n'est jamais le cas, l'esthétique garantit toujours de meilleurs résultats",
          "Si l'esthétique prime sur la clarté du parcours (hiérarchie visuelle brouillée, appel à l'action noyé), l'utilisateur peut se perdre malgré un rendu séduisant",
          "L'esthétique n'a jamais d'impact sur le comportement utilisateur",
          "Un bon design ne peut jamais nuire à un produit",
          "La conversion ne dépend que du prix du produit",
        ],
        correctIndex: 1,
        explanation:
          "Un design trop chargé visuellement peut diluer la hiérarchie de l'information et noyer l'action principale -- \"beau\" et \"efficace\" ne sont pas toujours alignés sans discipline.",
      },
      {
        question: "Dans un test A/B sur deux versions d'une interface, pourquoi est-il risqué de ne mesurer que le taux de clic sur un bouton ?",
        options: [
          "Le taux de clic est toujours l'unique métrique pertinente",
          "Un clic plus élevé peut cacher une confusion (l'utilisateur clique par erreur) plutôt qu'une réelle amélioration de l'expérience -- il faut croiser avec la conversion finale et la satisfaction",
          "Le taux de clic ne peut jamais être trompeur",
          "Il faut toujours ignorer le taux de clic complètement",
          "Cette question ne concerne que les designers juniors",
        ],
        correctIndex: 1,
        explanation:
          "Un taux de clic élevé n'est pas toujours un signal positif : il peut révéler une confusion (bouton mal identifié, clic accidentel) plutôt qu'un vrai succès -- il faut croiser plusieurs métriques.",
      },
      {
        question: "Pourquoi la charge cognitive est-elle un concept clé en design d'interface complexe (ex: tableau de bord professionnel) ?",
        options: [
          "Ce concept ne s'applique qu'aux jeux vidéo",
          "Trop d'informations ou d'options simultanées augmentent l'effort mental nécessaire, ce qui ralentit et fatigue l'utilisateur, même si toutes les infos sont \"utiles\"",
          "La charge cognitive n'a aucun impact sur l'utilisation réelle",
          "Plus une interface montre d'informations, mieux c'est toujours",
          "Ce concept ne concerne que les utilisateurs débutants",
        ],
        correctIndex: 1,
        explanation:
          "Réduire la charge cognitive (prioriser, regrouper, cacher le secondaire) améliore l'efficacité réelle, même quand chaque information prise isolément semble utile.",
      },
      {
        question: "Comment concilier les retours contradictoires de deux groupes d'utilisateurs testés sur la même fonctionnalité ?",
        options: [
          "Ignorer un des deux groupes au hasard",
          "Analyser si les groupes ont des besoins ou contextes d'usage réellement différents, et envisager une solution adaptative plutôt qu'un compromis dilué",
          "Toujours suivre l'avis du groupe le plus nombreux sans autre analyse",
          "Refaire le test indéfiniment jusqu'à obtenir un consensus",
          "Laisser le designer trancher selon son goût personnel",
        ],
        correctIndex: 1,
        explanation:
          "Des retours contradictoires cachent souvent des besoins différents selon le contexte d'usage -- une solution adaptative peut mieux répondre que de chercher un compromis moyen qui ne satisfait personne.",
      },
      {
        question: "Pourquoi un design system rigide peut-il devenir un frein plutôt qu'un atout à long terme ?",
        options: [
          "Un design system n'a jamais d'inconvénient",
          "S'il n'évolue pas avec les nouveaux besoins produit, il peut forcer des solutions inadaptées juste pour rester cohérent avec l'existant",
          "Il faut toujours en changer chaque mois",
          "Un design system ne concerne que les grandes entreprises",
          "Il élimine complètement le besoin de tests utilisateurs",
        ],
        correctIndex: 1,
        explanation:
          "Un design system doit évoluer avec les besoins produits ; appliqué de façon trop rigide, il peut forcer des compromis d'usabilité au nom de la seule cohérence visuelle.",
      },
      {
        question: "Pourquoi le \"dark pattern\" (interface trompeuse qui pousse à une action non voulue) pose-t-il un risque à long terme pour une entreprise, même s'il augmente les conversions à court terme ?",
        options: [
          "Il n'y a aucun risque tant que ça marche",
          "Il érode la confiance des utilisateurs, expose à des risques réglementaires croissants, et nuit à la réputation une fois détecté et dénoncé publiquement",
          "Les dark patterns sont toujours légaux et sans conséquence",
          "Ce concept ne concerne que les jeux vidéo",
          "Un dark pattern améliore toujours la fidélisation à long terme",
        ],
        correctIndex: 1,
        explanation:
          "Les dark patterns génèrent parfois un gain immédiat mais détruisent la confiance sur le long terme, et sont de plus en plus surveillés/sanctionnés réglementairement (ex: RGPD, DSA) -- un vrai risque business, pas juste éthique.",
      },
      {
        question: "Comment un designer doit-il arbitrer entre les demandes du produit (business), les contraintes techniques (dev), et les besoins utilisateurs quand les trois sont en tension ?",
        options: [
          "Toujours privilégier la demande business sans discussion",
          "Faciliter un dialogue structuré entre les trois parties, en s'appuyant sur des données utilisateurs concrètes pour objectiver l'arbitrage plutôt que sur des opinions",
          "Toujours céder aux contraintes techniques sans négocier",
          "Ignorer systématiquement les besoins utilisateurs au profit de la rapidité",
          "Laisser chaque partie faire sa version séparément",
        ],
        correctIndex: 1,
        explanation:
          "Le rôle du designer est souvent de médiatiser ces tensions en s'appuyant sur des données utilisateur concrètes plutôt que sur des opinions, pour un arbitrage objectivé et non purement hiérarchique.",
      },
    ],
  },

  data: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en data / analytics ?",
        options: [
          "J'aime comprendre ce que les chiffres racontent vraiment pour aider à décider",
          "Parce que je trouve les tableurs jolis",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile avec les bons outils",
          "Parce que je veux éviter tout contact avec d'autres services",
        ],
        correctIndex: 0,
        explanation:
          "La data sert avant tout à éclairer une décision -- une réponse orientée sur l'utilité concrète des données rassure plus qu'un intérêt purement technique isolé.",
      },
      {
        question: "Qu'est-ce qu'une \"donnée\" en informatique ?",
        options: [
          "Un logiciel",
          "Une information brute qui peut être mesurée, stockée et analysée",
          "Un type de graphique uniquement",
          "Un langage de programmation",
          "Un réseau social",
        ],
        correctIndex: 1,
        explanation:
          "Une donnée est une information brute (un chiffre, un texte, une date...) qui devient exploitable une fois collectée, structurée et analysée.",
      },
      {
        question: "Qu'est-ce qu'une \"moyenne\" en statistiques de base ?",
        options: [
          "La valeur qui apparaît le plus souvent",
          "La somme des valeurs divisée par leur nombre",
          "La plus grande valeur d'un ensemble",
          "La plus petite valeur d'un ensemble",
          "Le nombre total de valeurs",
        ],
        correctIndex: 1,
        explanation:
          "La moyenne se calcule en additionnant toutes les valeurs puis en divisant par leur nombre -- un indicateur de base, mais sensible aux valeurs extrêmes.",
      },
      {
        question: "Que fait un tableau croisé dynamique (Excel/Google Sheets) ?",
        options: [
          "Il supprime des données automatiquement",
          "Il résume et réorganise de grandes quantités de données pour en faire ressortir des tendances",
          "Il envoie des emails automatiquement",
          "Il crée un site web",
          "Il compresse un fichier",
        ],
        correctIndex: 1,
        explanation:
          "Le tableau croisé dynamique permet de synthétiser rapidement de gros volumes de données selon différents axes d'analyse, sans formule complexe.",
      },
      {
        question: "Pourquoi vérifier la qualité d'un jeu de données avant de l'analyser ?",
        options: [
          "Ce n'est jamais nécessaire, les données sont toujours propres",
          "Des données incomplètes, dupliquées ou erronées peuvent fausser complètement les conclusions de l'analyse",
          "Uniquement pour respecter une formalité administrative",
          "La qualité des données n'a aucun impact sur les résultats",
          "Cette vérification ne concerne que les très gros volumes de données",
        ],
        correctIndex: 1,
        explanation:
          "\"Garbage in, garbage out\" : une analyse sur des données de mauvaise qualité produit des conclusions non fiables, quelle que soit la sophistication de la méthode utilisée ensuite.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre corrélation et causalité ?",
        options: [
          "Ce sont des synonymes",
          "Une corrélation montre que deux variables évoluent ensemble, sans prouver que l'une cause l'autre",
          "La causalité est toujours plus facile à observer que la corrélation",
          "La corrélation prouve toujours une causalité",
          "Ces deux notions ne s'appliquent qu'en médecine",
        ],
        correctIndex: 1,
        explanation:
          "Deux variables corrélées peuvent être liées par une troisième cause commune, ou par pur hasard -- confondre corrélation et causalité est une des erreurs d'analyse les plus fréquentes.",
      },
      {
        question: "Qu'est-ce qu'une requête SQL simple type \"GROUP BY\" permet de faire ?",
        options: [
          "Supprimer des lignes d'une table",
          "Regrouper des lignes partageant une valeur commune pour appliquer un calcul (somme, moyenne, compte) par groupe",
          "Créer une nouvelle base de données",
          "Trier alphabétiquement une colonne uniquement",
          "Chiffrer les données",
        ],
        correctIndex: 1,
        explanation:
          "GROUP BY permet d'agréger des données par catégorie (ex: ventes par région) plutôt que de tout traiter ligne par ligne.",
      },
      {
        question: "Pourquoi la taille de l'échantillon est-elle importante dans une analyse statistique ?",
        options: [
          "Elle n'a aucune importance, un petit échantillon suffit toujours",
          "Un échantillon trop petit peut donner des résultats non représentatifs, dus au hasard plutôt qu'à un vrai effet",
          "Plus l'échantillon est petit, plus le résultat est fiable",
          "La taille de l'échantillon ne concerne que les sondages politiques",
          "Elle n'affecte que la vitesse de calcul",
        ],
        correctIndex: 1,
        explanation:
          "Un échantillon trop restreint augmente le risque que les résultats observés soient dus au hasard plutôt qu'à un effet réel et généralisable.",
      },
      {
        question: "Qu'est-ce qu'un \"outlier\" (valeur aberrante) dans un jeu de données ?",
        options: [
          "La valeur la plus fréquente",
          "Une valeur qui s'écarte fortement des autres et peut fausser une analyse si elle n'est pas traitée avec attention",
          "Une donnée manquante",
          "La moyenne d'un ensemble de valeurs",
          "Un type de graphique",
        ],
        correctIndex: 1,
        explanation:
          "Un outlier peut révéler une erreur de saisie ou un cas réel exceptionnel -- il faut l'identifier et décider consciemment de le garder, corriger ou exclure, pas l'ignorer par défaut.",
      },
      {
        question: "Pourquoi visualiser une donnée (graphique) plutôt que de simplement lire un tableau de chiffres ?",
        options: [
          "Ce n'est jamais utile, les chiffres bruts suffisent toujours",
          "Une visualisation bien choisie permet de repérer des tendances, écarts ou anomalies beaucoup plus vite que dans un tableau brut",
          "Un graphique cache toujours l'information réelle",
          "Les graphiques ne servent qu'à décorer un rapport",
          "Il n'y a aucune différence en pratique",
        ],
        correctIndex: 1,
        explanation:
          "L'œil humain repère des tendances, ruptures ou anomalies bien plus vite sur une visualisation adaptée que dans une masse de chiffres bruts.",
      },
      {
        question: "Que signifie \"biais de sélection\" dans une analyse de données ?",
        options: [
          "Un bug informatique classique",
          "Une distorsion des résultats due au fait que l'échantillon analysé n'est pas représentatif de la population réelle",
          "Un type de graphique en secteurs",
          "Une erreur de calcul de moyenne",
          "Un problème qui ne concerne que les très grandes bases de données",
        ],
        correctIndex: 1,
        explanation:
          "Si l'échantillon analysé (ex: uniquement des clients satisfaits ayant répondu à un sondage) n'est pas représentatif, les conclusions tirées peuvent être trompeuses malgré une méthode de calcul correcte.",
      },
    ],
    difficile: [
      {
        question: "Un modèle prédictif a une excellente précision sur les données d'entraînement mais de mauvais résultats sur de nouvelles données. Que suspecter en priorité ?",
        options: [
          "Le modèle est parfait, le problème vient forcément des nouvelles données",
          "Un \"overfitting\" (surapprentissage) : le modèle a appris les particularités des données d'entraînement plutôt qu'une tendance généralisable",
          "Il faut simplement relancer l'entraînement à l'identique",
          "Ce phénomène est impossible en pratique",
          "Le problème vient toujours d'un bug informatique",
        ],
        correctIndex: 1,
        explanation:
          "L'overfitting est un classique en machine learning : le modèle colle trop aux données d'entraînement (bruit compris) et généralise mal sur des données jamais vues.",
      },
      {
        question: "Pourquoi le \"paradoxe de Simpson\" est-il un piège dangereux en analyse de données agrégées ?",
        options: [
          "Ce concept n'a aucune application réelle",
          "Une tendance peut apparaître dans plusieurs groupes de données, puis s'inverser ou disparaître une fois les groupes combinés -- une agrégation trop rapide peut donc induire en erreur",
          "Il ne concerne que les très petits échantillons",
          "Il garantit toujours que l'agrégation est plus fiable que le détail",
          "Ce paradoxe ne s'applique qu'aux données financières",
        ],
        correctIndex: 1,
        explanation:
          "Le paradoxe de Simpson montre qu'une conclusion tirée sur des données agrégées peut être fausse ou inversée par rapport à ce qu'on observe en regardant les sous-groupes séparément -- une vraie source d'erreurs d'analyse.",
      },
      {
        question: "Un tableau de bord montre une baisse de 30% d'un KPI du jour au lendemain. Quelle est la démarche la plus rigoureuse avant d'alerter la direction ?",
        options: [
          "Alerter immédiatement sans aucune vérification",
          "Vérifier d'abord s'il s'agit d'un problème de collecte/tracking (bug, changement de définition, panne) avant de conclure à un vrai effet business",
          "Ignorer complètement la variation, ça n'a jamais d'importance",
          "Supprimer la donnée du tableau de bord",
          "Modifier la donnée pour qu'elle paraisse normale",
        ],
        correctIndex: 1,
        explanation:
          "Une variation brutale d'un KPI est très souvent due à un problème de collecte de données (bug de tracking, changement de définition) plutôt qu'à un vrai effet business -- à vérifier avant toute alerte.",
      },
      {
        question: "Pourquoi la \"significativité statistique\" d'un résultat ne garantit-elle pas automatiquement sa \"significativité pratique\" (business) ?",
        options: [
          "Ces deux notions sont toujours identiques",
          "Un résultat peut être statistiquement significatif (peu probable dû au hasard) tout en représentant un effet si minime qu'il n'a aucun intérêt opérationnel réel",
          "La significativité statistique n'existe pas en pratique",
          "Seule la significativité business compte, jamais la statistique",
          "Un grand échantillon rend toujours un résultat business pertinent",
        ],
        correctIndex: 1,
        explanation:
          "Avec un très grand échantillon, même un effet minuscule peut devenir statistiquement significatif sans pour autant justifier une action business -- une distinction clé à savoir communiquer.",
      },
      {
        question: "Pourquoi un algorithme de scoring entraîné sur des données historiques biaisées peut-il perpétuer voire amplifier une discrimination, même sans intention ?",
        options: [
          "Un algorithme ne peut jamais être biaisé, ce sont des chiffres neutres",
          "S'il apprend des patterns historiques discriminatoires (ex: refus de crédit corrélés à un quartier), il les reproduira automatiquement dans ses futures décisions",
          "Ce risque ne concerne que les algorithmes très récents",
          "Les biais dans les données n'affectent jamais les prédictions finales",
          "Ce problème ne se pose que pour des jeux de données très petits",
        ],
        correctIndex: 1,
        explanation:
          "Un modèle entraîné sur des données historiques reflétant des biais sociétaux (même sans variable explicitement discriminatoire) peut reproduire et amplifier ces biais -- un enjeu éthique et réglementaire central en data science.",
      },
      {
        question: "Dans un A/B test avec plusieurs métriques suivies simultanément, pourquoi risque-t-on de trouver un résultat \"significatif\" purement par hasard ?",
        options: [
          "C'est impossible si le test est bien conçu au départ",
          "Le fait de tester beaucoup de métriques en parallèle augmente mécaniquement la probabilité qu'au moins l'une d'elles paraisse significative par pur hasard (problème des comparaisons multiples)",
          "Ce risque ne concerne que les très petits tests",
          "Plus on teste de métriques, plus chaque résultat est automatiquement fiable",
          "Ce problème n'existe qu'en théorie, jamais en pratique",
        ],
        correctIndex: 1,
        explanation:
          "C'est le problème des comparaisons multiples : tester 20 métriques à la fois augmente fortement la chance qu'une d'elles ressorte \"significative\" par simple hasard -- une correction statistique est nécessaire pour l'éviter.",
      },
      {
        question: "Pourquoi documenter précisément la méthodologie d'une analyse (sources, filtres, hypothèses) est-il aussi important que le résultat final ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel intérêt",
          "Sans cette documentation, personne ne peut vérifier, reproduire ou challenger le résultat -- un enjeu de fiabilité et de confiance dans la décision business qui en découle",
          "La documentation ralentit inutilement le travail",
          "Seul le résultat final compte, jamais la méthode utilisée pour y arriver",
          "Cette rigueur ne concerne que les publications scientifiques",
        ],
        correctIndex: 1,
        explanation:
          "Une analyse non documentée ne peut être ni vérifiée, ni reproduite, ni challengée -- un vrai risque quand une décision business importante repose dessus.",
      },
    ],
  },

  support: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en support/service client ?",
        options: [
          "J'aime résoudre les problèmes des gens et les aider concrètement",
          "Parce que je n'ai pas trouvé mieux",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air simple : répondre au téléphone",
          "Parce que je veux éviter tout contact avec des clients mécontents",
        ],
        correctIndex: 0,
        explanation:
          "Le support client demande une vraie envie d'aider et de résoudre des problèmes, souvent sous tension -- une motivation orientée aide/résolution est ce qu'on attend.",
      },
      {
        question: "Un client t'écrit très énervé. Quelle est la première chose à faire ?",
        options: [
          "Répondre sur le même ton énervé",
          "L'écouter/le lire attentivement et reconnaître sa frustration avant de proposer une solution",
          "Ignorer le message",
          "Transférer le message sans réponse",
          "Fermer le ticket immédiatement",
        ],
        correctIndex: 1,
        explanation:
          "Reconnaître la frustration du client avant de résoudre le problème l'apaise et montre que tu prends sa situation au sérieux -- une base du service client.",
      },
      {
        question: "Qu'est-ce qu'un \"ticket\" en support client ?",
        options: [
          "Un billet de transport",
          "Une demande ou un problème client enregistré et suivi jusqu'à sa résolution",
          "Une facture",
          "Un code de réduction",
          "Un type de contrat",
        ],
        correctIndex: 1,
        explanation:
          "Le ticket permet de tracer chaque demande client de sa création à sa résolution, pour ne rien perdre et pouvoir mesurer la qualité du support.",
      },
      {
        question: "Pourquoi est-il important de répondre rapidement à une demande client ?",
        options: [
          "Ce n'est jamais important, le client attendra",
          "Un délai de réponse rapide améliore fortement la satisfaction et la confiance du client",
          "Uniquement pour respecter un chiffre imposé sans lien avec le client",
          "La rapidité n'a aucun effet sur la satisfaction",
          "Seuls les gros clients méritent une réponse rapide",
        ],
        correctIndex: 1,
        explanation:
          "Le temps de réponse est l'un des facteurs les plus déterminants de la satisfaction client dans le support -- une attente trop longue frustre même pour un problème mineur.",
      },
      {
        question: "Que fais-tu si tu ne sais pas résoudre le problème d'un client ?",
        options: [
          "Tu inventes une solution au hasard",
          "Tu es honnête, tu escalades vers un collègue ou un service compétent, et tu tiens le client informé",
          "Tu ignores le client",
          "Tu fermes le ticket sans réponse",
          "Tu dis au client que ce n'est pas ton problème",
        ],
        correctIndex: 1,
        explanation:
          "Escalader avec transparence, en gardant le client informé, est bien plus professionnel qu'une réponse inventée qui pourrait aggraver la situation.",
      },
    ],
    medium: [
      {
        question: "Que mesure le \"CSAT\" (Customer Satisfaction Score) ?",
        options: [
          "Le chiffre d'affaires généré par le support",
          "Le niveau de satisfaction du client après une interaction avec le support",
          "Le nombre de tickets ouverts",
          "Le salaire des agents support",
          "Le temps de trajet moyen d'un livreur",
        ],
        correctIndex: 1,
        explanation:
          "Le CSAT est généralement recueilli via une question simple juste après une interaction (\"Êtes-vous satisfait de cette réponse ?\") pour évaluer la qualité perçue du support.",
      },
      {
        question: "Pourquoi une base de connaissances (FAQ, articles d'aide) est-elle utile pour un service support ?",
        options: [
          "Elle ne sert à rien si le support téléphonique existe déjà",
          "Elle permet aux clients de résoudre eux-mêmes des problèmes simples, réduisant la charge sur les agents et accélérant la résolution",
          "Elle remplace complètement le besoin d'agents support",
          "Elle n'a d'intérêt que pour les grandes entreprises",
          "Elle sert uniquement au référencement du site",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne base de connaissances réduit le volume de tickets simples et répétitifs, libérant du temps pour les cas plus complexes qui nécessitent vraiment un agent.",
      },
      {
        question: "Un même problème technique génère de nombreux tickets similaires en une journée. Quelle est la meilleure réaction ?",
        options: [
          "Répondre à chaque ticket individuellement sans rien signaler",
          "Alerter l'équipe technique du problème sous-jacent et informer les clients concernés de façon proactive",
          "Fermer tous les tickets sans réponse",
          "Ignorer la répétition, ce n'est jamais lié",
          "Dire à chaque client que c'est un cas isolé",
        ],
        correctIndex: 1,
        explanation:
          "Une multiplication de tickets similaires signale souvent un problème technique plus large à remonter et communiquer proactivement, plutôt que de traiter chaque cas isolément.",
      },
      {
        question: "Que signifie \"first contact resolution\" (résolution au premier contact) ?",
        options: [
          "Le nombre de nouveaux clients acquis",
          "Le pourcentage de demandes résolues dès le premier échange, sans besoin de recontacter le client",
          "Le temps total passé au téléphone",
          "Le nombre de tickets fermés sans réponse",
          "Le taux de satisfaction des agents",
        ],
        correctIndex: 1,
        explanation:
          "Résoudre au premier contact évite les allers-retours frustrants pour le client -- un indicateur clé de l'efficacité réelle d'un support.",
      },
      {
        question: "Pourquoi personnaliser sa réponse plutôt que d'envoyer un message-type générique ?",
        options: [
          "Ce n'est jamais nécessaire, un message générique suffit toujours",
          "Une réponse personnalisée montre que le client a été réellement écouté, ce qui améliore la satisfaction même si le fond de la réponse est similaire",
          "La personnalisation ralentit toujours inutilement le traitement",
          "Les clients préfèrent toujours les réponses génériques",
          "Cela ne concerne que les clients premium",
        ],
        correctIndex: 1,
        explanation:
          "Un message perçu comme copié-collé peut donner l'impression que le client n'a pas été vraiment écouté, même si la solution proposée est correcte.",
      },
      {
        question: "Comment gérer un client qui demande un remboursement en dehors de la politique officielle de l'entreprise ?",
        options: [
          "Refuser sèchement sans explication",
          "Expliquer clairement la politique, chercher une alternative raisonnable si possible, et escalader si la situation le justifie",
          "Accepter systématiquement pour éviter tout conflit",
          "Ignorer la demande",
          "Accuser le client de mauvaise foi",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer la règle avec respect, chercher une solution alternative, et savoir escalader les cas légitimes est plus professionnel qu'un refus sec ou une acceptation systématique qui fragilise la politique de l'entreprise.",
      },
    ],
    difficile: [
      {
        question: "Un client répète la même demande sur plusieurs canaux (email, téléphone, réseaux sociaux) sans obtenir de réponse cohérente. Quel est le vrai problème organisationnel à corriger ?",
        options: [
          "Le client exagère, ce n'est jamais un vrai problème",
          "Un manque de vue unifiée du client à travers les canaux (silos), qui doit être résolu par un historique centralisé des interactions",
          "Il faut simplement ignorer les canaux secondaires comme les réseaux sociaux",
          "Le problème vient toujours uniquement du client",
          "Chaque canal doit rester géré de façon totalement indépendante",
        ],
        correctIndex: 1,
        explanation:
          "Des réponses incohérentes entre canaux révèlent un défaut d'historique client centralisé -- un vrai enjeu d'organisation (CRM/outils partagés), pas juste un problème de politesse individuelle.",
      },
      {
        question: "Pourquoi un excellent CSAT peut-il coexister avec un taux de \"churn\" (attrition client) élevé ?",
        options: [
          "C'est impossible, les deux indicateurs sont toujours alignés",
          "Le CSAT mesure la satisfaction ponctuelle d'une interaction, pas nécessairement la satisfaction globale du produit ou la fidélité à long terme du client",
          "Le churn ne dépend jamais de la qualité du support",
          "Un bon CSAT garantit toujours la fidélité du client",
          "Cette situation ne se produit jamais en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Un client peut être très satisfait d'une interaction ponctuelle de support tout en restant globalement insatisfait du produit et finir par partir -- deux métriques complémentaires, pas interchangeables.",
      },
      {
        question: "Comment prioriser objectivement les tickets quand une équipe support fait face à un afflux massif de demandes après un incident majeur ?",
        options: [
          "Traiter dans l'ordre d'arrivée strict, sans distinction",
          "Prioriser selon la criticité business et l'impact client (ex: perte de données, blocage total), en communiquant de façon proactive et groupée sur l'incident",
          "Fermer tous les tickets automatiquement en attendant que ça se calme",
          "Répondre uniquement aux clients qui menacent de partir",
          "Ignorer l'incident tant qu'il n'est pas résolu techniquement",
        ],
        correctIndex: 1,
        explanation:
          "En cas d'incident massif, une priorisation par impact réel (pas par ordre d'arrivée) et une communication proactive groupée réduisent la charge de tickets individuels et rassurent plus efficacement.",
      },
      {
        question: "Pourquoi automatiser trop agressivement le support (chatbots partout, sans échappatoire humaine) peut-il détruire de la valeur, même si ça réduit les coûts à court terme ?",
        options: [
          "L'automatisation ne comporte jamais de risque",
          "Pour des cas complexes ou émotionnellement sensibles, l'absence de recours humain peut frustrer fortement le client et nuire à la rétention, au-delà de l'économie réalisée",
          "Les clients préfèrent toujours parler à un robot",
          "Ce risque ne concerne que les très petites entreprises",
          "L'automatisation garantit toujours une meilleure satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "L'automatisation est efficace pour les demandes simples et répétitives, mais bloquer tout accès humain sur des cas complexes ou sensibles peut coûter plus cher en rétention que ce qu'elle économise en coûts de support.",
      },
      {
        question: "Un client \"VIP\" à fort chiffre d'affaires demande un traitement de faveur qui viole une règle de sécurité (ex: contourner une vérification d'identité). Quelle est la bonne posture ?",
        options: [
          "Accepter systématiquement, le chiffre d'affaires prime toujours",
          "Refuser poliment en expliquant la raison (protection du client lui-même et de l'entreprise), et proposer une alternative conforme aux règles",
          "Refuser sans aucune explication",
          "Escalader la décision uniquement s'il menace de partir",
          "Ignorer la demande sans réponse",
        ],
        correctIndex: 1,
        explanation:
          "Une règle de sécurité protège aussi le client lui-même ; céder sous pression commerciale crée un précédent risqué -- expliquer et proposer une alternative conforme est la posture professionnelle.",
      },
      {
        question: "Pourquoi le \"support proactif\" (contacter le client avant qu'il ne signale un problème) peut-il transformer la relation client, au-delà de la simple résolution de ticket ?",
        options: [
          "Il n'a aucun effet différent du support réactif classique",
          "Il montre que l'entreprise surveille activement la qualité de service et se soucie du client avant même qu'il ne se plaigne, renforçant fortement la confiance",
          "Le support proactif coûte toujours plus cher sans aucun bénéfice",
          "Les clients trouvent toujours ça intrusif",
          "Cette approche ne fonctionne que pour les produits gratuits",
        ],
        correctIndex: 1,
        explanation:
          "Être contacté avant même de s'être plaint d'un problème renforce fortement la perception de fiabilité et d'attention de l'entreprise -- un levier de fidélisation puissant, au-delà de la simple résolution technique.",
      },
      {
        question: "Comment un service support doit-il faire remonter un problème produit récurrent à l'équipe technique/produit de façon efficace ?",
        options: [
          "En transmettant chaque plainte individuelle sans synthèse ni priorisation",
          "En agrégeant les signaux (fréquence, impact, tendance) pour présenter un dossier structuré et priorisable plutôt que des anecdotes isolées",
          "En ne remontant jamais rien, ce n'est pas le rôle du support",
          "En attendant que le problème disparaisse de lui-même",
          "En demandant aux clients de contacter directement l'équipe technique",
        ],
        correctIndex: 1,
        explanation:
          "Une remontée structurée et quantifiée (fréquence, impact business) a beaucoup plus de poids et de chances d'être traitée qu'une accumulation de plaintes isolées non priorisées.",
      },
    ],
  },

  logistique: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en logistique / supply chain ?",
        options: [
          "J'aime organiser des flux complexes pour que tout arrive au bon endroit, au bon moment",
          "Parce que je n'aime pas le contact avec les gens",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air simple à gérer",
          "Parce que je veux juste conduire des camions",
        ],
        correctIndex: 0,
        explanation:
          "La logistique est avant tout une question d'organisation de flux complexes -- une motivation centrée sur cette organisation montre une bonne compréhension du métier.",
      },
      {
        question: "Qu'est-ce que la \"supply chain\" (chaîne d'approvisionnement) ?",
        options: [
          "Uniquement le transport de marchandises",
          "L'ensemble des étapes, de la matière première jusqu'au produit livré au client final",
          "Un logiciel de comptabilité",
          "Le service commercial d'une entreprise",
          "Un type de contrat de travail",
        ],
        correctIndex: 1,
        explanation:
          "La supply chain englobe toutes les étapes (approvisionnement, production, stockage, transport, livraison) qui mènent un produit du fournisseur au client final.",
      },
      {
        question: "Qu'est-ce qu'un \"stock\" en logistique ?",
        options: [
          "Le chiffre d'affaires de l'entreprise",
          "L'ensemble des marchandises disponibles en entrepôt à un instant donné",
          "Un contrat avec un fournisseur",
          "Un type de véhicule de transport",
          "Le nombre de salariés d'un entrepôt",
        ],
        correctIndex: 1,
        explanation:
          "Le stock représente les marchandises physiquement disponibles -- sa bonne gestion évite à la fois la rupture et le surstockage coûteux.",
      },
      {
        question: "Pourquoi une rupture de stock est-elle problématique ?",
        options: [
          "Ce n'est jamais un problème réel",
          "Elle empêche de vendre ou de livrer, ce qui peut faire perdre des clients et du chiffre d'affaires",
          "Elle permet toujours d'économiser de l'argent",
          "Elle n'a d'impact que sur le service comptabilité",
          "Elle améliore toujours la satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "Une rupture de stock bloque directement les ventes et peut pousser un client à se tourner vers un concurrent -- un enjeu direct de chiffre d'affaires et de fidélité.",
      },
      {
        question: "Que fais-tu si tu constates une erreur dans une commande à préparer ?",
        options: [
          "Tu l'expédies quand même sans rien dire",
          "Tu la corriges ou tu la signales immédiatement avant l'expédition",
          "Tu ignores l'erreur, ce n'est pas grave",
          "Tu attends que le client se plaigne",
          "Tu annules toutes les commandes de la journée",
        ],
        correctIndex: 1,
        explanation:
          "Corriger ou signaler une erreur avant expédition évite un retour client coûteux et une mauvaise expérience -- la vigilance est une qualité clé en préparation logistique.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que la méthode \"FIFO\" (First In, First Out) en gestion de stock ?",
        options: [
          "Vendre en priorité les produits les plus récemment arrivés",
          "Faire sortir en priorité les produits arrivés en premier en stock, pour limiter la péremption/obsolescence",
          "Un logiciel de gestion des transports",
          "Une méthode de facturation",
          "Un type de contrat fournisseur",
        ],
        correctIndex: 1,
        explanation:
          "FIFO évite que des produits arrivés depuis longtemps restent bloqués en stock (risque de péremption ou d'obsolescence) au profit d'arrivages plus récents.",
      },
      {
        question: "Que mesure le \"taux de service\" en logistique ?",
        options: [
          "Le nombre d'employés dans l'entrepôt",
          "Le pourcentage de commandes livrées complètes et dans les délais promis",
          "Le chiffre d'affaires généré par le transport",
          "La satisfaction des fournisseurs uniquement",
          "Le coût total de la logistique",
        ],
        correctIndex: 1,
        explanation:
          "Le taux de service reflète la fiabilité de la chaîne logistique du point de vue du client : commande complète, dans les délais annoncés.",
      },
      {
        question: "Pourquoi un stock de sécurité (stock tampon) est-il utile ?",
        options: [
          "Il ne sert à rien et coûte toujours de l'argent inutilement",
          "Il permet d'absorber les variations imprévues de la demande ou des délais de livraison fournisseur sans rompre de stock",
          "Il remplace complètement le besoin de prévision de la demande",
          "Il concerne uniquement les produits de luxe",
          "Il élimine tout risque de rupture, quelle que soit la situation",
        ],
        correctIndex: 1,
        explanation:
          "Le stock de sécurité absorbe les aléas (retard fournisseur, pic de demande imprévu) sans empêcher totalement le risque de rupture dans des cas extrêmes.",
      },
      {
        question: "Pourquoi optimiser le remplissage des camions/conteneurs est-il un enjeu stratégique en transport ?",
        options: [
          "Ce n'est jamais un enjeu réel",
          "Un meilleur remplissage réduit le coût par unité transportée et l'impact environnemental du transport",
          "Le remplissage n'a aucun lien avec les coûts logistiques",
          "Il ne concerne que le transport international",
          "Cela ne concerne que les très grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Un camion à moitié vide coûte presque aussi cher qu'un camion plein -- optimiser le taux de remplissage réduit le coût logistique unitaire et l'empreinte carbone du transport.",
      },
      {
        question: "Qu'est-ce que le \"dernier kilomètre\" en logistique e-commerce ?",
        options: [
          "Le trajet entre deux entrepôts",
          "La dernière étape de livraison, du dépôt/point relais jusqu'au client final",
          "Le premier trajet depuis l'usine",
          "Un type de conditionnement",
          "Le trajet retour d'un produit défectueux",
        ],
        correctIndex: 1,
        explanation:
          "Le dernier kilomètre est souvent l'étape la plus coûteuse et complexe de la chaîne logistique, malgré une distance courte -- un enjeu majeur en e-commerce.",
      },
      {
        question: "Pourquoi la coordination entre le service achats et la logistique est-elle importante ?",
        options: [
          "Ces deux services n'ont aucun lien entre eux",
          "Une commande fournisseur mal anticipée peut créer une rupture ou un surstock, directement lié aux décisions d'achat",
          "La logistique n'a jamais besoin d'informations du service achats",
          "Cette coordination ne concerne que les produits alimentaires",
          "Le service achats gère toujours seul les stocks",
        ],
        correctIndex: 1,
        explanation:
          "Le volume et le timing des achats déterminent directement les niveaux de stock -- un manque de coordination entre achats et logistique cause fréquemment ruptures ou surstocks.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une stratégie de stock \"zéro stock\" (flux tendu) peut-elle devenir un risque majeur en cas de choc externe (ex: crise sanitaire, blocage portuaire) ?",
        options: [
          "Le flux tendu n'a jamais aucun inconvénient",
          "Sans stock tampon, la moindre perturbation d'approvisionnement bloque immédiatement toute la chaîne, sans marge d'absorption",
          "Le flux tendu élimine tout risque de rupture",
          "Ce risque ne concerne que les petites entreprises",
          "Le flux tendu augmente toujours les coûts sans aucun avantage",
        ],
        correctIndex: 1,
        explanation:
          "Le flux tendu optimise les coûts en temps normal mais supprime la marge d'absorption face à un choc externe -- un vrai arbitrage résilience/coût à faire consciemment, pas une évidence.",
      },
      {
        question: "Pourquoi la centralisation extrême des entrepôts (un seul très grand centre) peut-elle nuire à la rapidité de livraison malgré des économies d'échelle ?",
        options: [
          "La centralisation n'a jamais d'inconvénient",
          "Elle augmente les distances moyennes de livraison au client final, un compromis entre coût de stockage et rapidité de livraison",
          "Elle garantit toujours une livraison plus rapide",
          "La distance n'a aucun impact sur les délais de livraison",
          "Ce choix ne concerne que le e-commerce international",
        ],
        correctIndex: 1,
        explanation:
          "Un entrepôt unique réduit les coûts de stockage mais éloigne mécaniquement le stock de certains clients -- un vrai compromis entre coût et rapidité, pas une solution universellement meilleure.",
      },
      {
        question: "Un fournisseur clé annonce un retard de plusieurs semaines. Quelle démarche est la plus rigoureuse pour limiter l'impact ?",
        options: [
          "Attendre passivement sans rien faire d'autre",
          "Évaluer l'impact réel sur les stocks et les engagements clients, activer des fournisseurs alternatifs si possible, et communiquer proactivement en interne/externe",
          "Annuler immédiatement toutes les commandes clients concernées sans analyse",
          "Cacher l'information aux clients le plus longtemps possible",
          "Changer définitivement de fournisseur sans évaluer les alternatives",
        ],
        correctIndex: 1,
        explanation:
          "Une gestion de crise fournisseur rigoureuse évalue l'impact réel, active des plans B (fournisseurs alternatifs, priorisation des clients) et communique de façon transparente plutôt que de subir passivement.",
      },
      {
        question: "Pourquoi le \"effet coup de fouet\" (bullwhip effect) amplifie-t-il les variations de la demande le long de la chaîne d'approvisionnement ?",
        options: [
          "Ce phénomène n'existe pas en pratique",
          "De petites variations de la demande finale sont amplifiées à chaque étape de la chaîne (distributeur, grossiste, fabricant) par des décisions de commande en cascade mal coordonnées",
          "Il ne concerne que les produits alimentaires périssables",
          "Il diminue toujours à mesure qu'on remonte la chaîne",
          "Il n'a aucun lien avec la gestion des stocks",
        ],
        correctIndex: 1,
        explanation:
          "Chaque maillon de la chaîne réagit aux variations en ajustant ses commandes avec une marge de sécurité, ce qui amplifie l'écart initial à mesure qu'on remonte vers les fournisseurs -- un phénomène classique de supply chain management.",
      },
      {
        question: "Pourquoi la traçabilité complète d'un produit (de la matière première à la livraison) devient-elle un enjeu stratégique croissant ?",
        options: [
          "Elle n'a aucun intérêt réel pour l'entreprise",
          "Elle répond à des exigences réglementaires croissantes, permet de réagir vite en cas de rappel produit, et devient un argument de confiance pour le client",
          "Elle ne concerne que les produits de luxe",
          "La traçabilité ralentit toujours inutilement la chaîne logistique",
          "Ce sujet ne concerne que les très grandes entreprises internationales",
        ],
        correctIndex: 1,
        explanation:
          "La traçabilité facilite la gestion de crise (rappel produit ciblé plutôt que massif), répond à des obligations réglementaires croissantes (agroalimentaire, textile...) et devient un vrai argument de transparence commerciale.",
      },
      {
        question: "Comment arbitrer entre un fournisseur moins cher mais plus éloigné (délais et risques de transport plus longs) et un fournisseur local plus cher ?",
        options: [
          "Toujours choisir le moins cher, sans autre analyse",
          "Comparer le coût total réel (prix + transport + risque de rupture + stock de sécurité nécessaire), pas seulement le prix d'achat unitaire",
          "Toujours choisir le plus local, sans analyse de coût",
          "Le prix d'achat est le seul critère pertinent à considérer",
          "Cet arbitrage ne concerne jamais la gestion des risques",
        ],
        correctIndex: 1,
        explanation:
          "Le \"coût total de possession\" (total cost of ownership) inclut le transport, le risque de rupture et le stock de sécurité nécessaire -- un fournisseur moins cher à l'achat peut coûter plus cher au global.",
      },
      {
        question: "Pourquoi la digitalisation (ERP, suivi temps réel) transforme-t-elle profondément la prise de décision logistique par rapport à une gestion manuelle ?",
        options: [
          "Elle n'apporte aucun changement réel à la prise de décision",
          "Elle permet une visibilité en temps réel sur les stocks et flux, rendant possible des ajustements rapides plutôt que des décisions basées sur des données obsolètes",
          "Elle remplace totalement le besoin de jugement humain",
          "Elle ne concerne que le secteur du e-commerce",
          "Elle complexifie toujours inutilement la prise de décision",
        ],
        correctIndex: 1,
        explanation:
          "La visibilité temps réel permet de détecter et corriger un problème (retard, rupture imminente) bien avant qu'il ne devienne critique, contrairement à une gestion basée sur des rapports périodiques et décalés dans le temps.",
      },
    ],
  },

  juridique: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en juridique ?",
        options: [
          "J'aime comprendre les règles précisément pour sécuriser des décisions concrètes",
          "Parce que je regarde beaucoup de séries d'avocats",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile",
          "Parce que je veux éviter tout travail écrit",
        ],
        correctIndex: 0,
        explanation:
          "Le juridique en entreprise sert à sécuriser des décisions concrètes -- une motivation liée à la rigueur et à l'application pratique des règles est ce qu'on attend.",
      },
      {
        question: "Qu'est-ce qu'un \"contrat\" ?",
        options: [
          "Un simple accord oral sans valeur",
          "Un accord entre deux ou plusieurs parties créant des obligations juridiques réciproques",
          "Une facture",
          "Un document interne sans valeur légale",
          "Un type de courrier administratif",
        ],
        correctIndex: 1,
        explanation:
          "Un contrat engage juridiquement les parties qui le signent -- la base de toute relation commerciale ou de travail encadrée.",
      },
      {
        question: "Que signifie \"RGPD\" ?",
        options: [
          "Règlement Général de Protection des Données",
          "Régime Général dePrestations Diverses",
          "Registre Global des Prix Décidés",
          "Réglementation Générale des Produits Distribués",
          "Régime Global de Paiement Différé",
        ],
        correctIndex: 0,
        explanation:
          "Le RGPD encadre la collecte et le traitement des données personnelles au sein de l'Union européenne -- un texte incontournable dès qu'une entreprise traite des données de particuliers.",
      },
      {
        question: "Que dois-tu faire si tu n'es pas sûr de la validité juridique d'un document ?",
        options: [
          "Le signer quand même sans vérification",
          "Vérifier avec un supérieur ou une source fiable avant toute décision",
          "L'ignorer complètement",
          "Improviser une réponse",
          "Le modifier sans en informer personne",
        ],
        correctIndex: 1,
        explanation:
          "En droit, l'approximation peut avoir des conséquences sérieuses -- vérifier avant d'agir est le réflexe professionnel de base.",
      },
      {
        question: "Qu'est-ce que la \"confidentialité\" dans un contexte professionnel juridique ?",
        options: [
          "Le droit de partager toute information à qui le demande",
          "L'obligation de ne pas divulguer des informations sensibles à des personnes non autorisées",
          "Un type de contrat commercial",
          "Une simple recommandation sans conséquence",
          "Une règle qui ne concerne que les avocats",
        ],
        correctIndex: 1,
        explanation:
          "La confidentialité protège les informations sensibles (clients, contrats, stratégie) -- une obligation centrale dans tout service juridique ou en contact avec des données sensibles.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre une obligation \"de moyens\" et \"de résultat\" dans un contrat ?",
        options: [
          "Ce sont des synonymes",
          "L'obligation de moyens engage à mettre en œuvre tous les efforts raisonnables, l'obligation de résultat engage à atteindre un résultat précis",
          "L'obligation de résultat n'existe pas en droit français",
          "L'obligation de moyens concerne uniquement les contrats de travail",
          "Ces notions ne s'appliquent qu'aux contrats internationaux",
        ],
        correctIndex: 1,
        explanation:
          "Un médecin a une obligation de moyens (soigner du mieux possible), un vendeur a une obligation de résultat (livrer le produit) -- la distinction change ce qui doit être prouvé en cas de litige.",
      },
      {
        question: "Pourquoi une clause de non-concurrence dans un contrat de travail doit-elle être limitée dans le temps et l'espace ?",
        options: [
          "Ce n'est jamais nécessaire, elle peut être illimitée",
          "Pour être valable juridiquement, elle doit être proportionnée (durée, zone géographique, contrepartie financière) pour ne pas empêcher indéfiniment le salarié de travailler",
          "Cette clause ne concerne que les dirigeants d'entreprise",
          "Une clause de non-concurrence n'a jamais de valeur légale",
          "Elle ne nécessite jamais de contrepartie financière",
        ],
        correctIndex: 1,
        explanation:
          "Une clause de non-concurrence disproportionnée (trop longue, trop large, sans contrepartie) risque d'être annulée par un juge -- l'équilibre entre protection de l'entreprise et liberté du salarié est encadré par la loi.",
      },
      {
        question: "Qu'est-ce qu'une \"mise en demeure\" ?",
        options: [
          "Un simple email informel",
          "Un courrier officiel sommant une partie de respecter ses obligations sous peine de poursuites",
          "Un contrat de vente",
          "Une facture impayée",
          "Un avertissement oral sans valeur",
        ],
        correctIndex: 1,
        explanation:
          "La mise en demeure est souvent une étape formelle obligatoire avant d'engager une action en justice pour non-respect d'une obligation contractuelle.",
      },
      {
        question: "Pourquoi vérifier les conditions générales de vente (CGV) avant de signer un contrat avec un nouveau fournisseur ?",
        options: [
          "Ce n'est jamais nécessaire, elles sont toujours identiques d'un fournisseur à l'autre",
          "Elles définissent des obligations importantes (délais, garanties, pénalités) qui engagent l'entreprise si elles sont acceptées sans lecture",
          "Les CGV n'ont aucune valeur juridique",
          "Elles ne concernent que les ventes aux particuliers",
          "Elles sont automatiquement invalidées si non lues",
        ],
        correctIndex: 1,
        explanation:
          "Accepter des CGV sans les lire peut engager l'entreprise sur des clauses défavorables (pénalités, responsabilité, durée d'engagement) -- une vérification systématique s'impose.",
      },
      {
        question: "Qu'est-ce que la \"force majeure\" en droit des contrats ?",
        options: [
          "Une clause qui n'a jamais d'effet réel",
          "Un événement imprévisible, irrésistible et extérieur qui peut exonérer une partie de ses obligations contractuelles",
          "Un type de garantie commerciale",
          "Une obligation de paiement immédiat",
          "Un document administratif obligatoire",
        ],
        correctIndex: 1,
        explanation:
          "La force majeure (catastrophe naturelle, guerre...) peut suspendre ou annuler une obligation contractuelle si les trois critères (imprévisible, irrésistible, extérieur) sont réunis.",
      },
      {
        question: "Pourquoi archiver soigneusement les versions successives d'un contrat et de ses avenants ?",
        options: [
          "Ce n'est jamais utile une fois le contrat signé",
          "En cas de litige, seule la version exacte en vigueur au moment des faits fait foi -- un archivage rigoureux évite toute ambiguïté",
          "L'archivage ne concerne que les très gros contrats",
          "Une seule version suffit toujours, peu importe les modifications ultérieures",
          "Les avenants n'ont jamais de valeur légale",
        ],
        correctIndex: 1,
        explanation:
          "En cas de désaccord, il faut pouvoir prouver précisément quelle version du contrat (avec quels avenants) s'appliquait à la date des faits litigieux.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une clause abusive dans un contrat peut-elle être invalidée même si les deux parties l'ont signée en toute connaissance de cause ?",
        options: [
          "Ce n'est jamais possible, une signature vaut acceptation définitive et incontestable",
          "Le droit protège la partie la plus faible (souvent le consommateur ou une petite entreprise) contre des clauses créant un déséquilibre significatif, indépendamment du consentement formel",
          "Seul un contrat non signé peut être contesté",
          "Les clauses abusives ne concernent que les contrats internationaux",
          "Une clause signée ne peut jamais être remise en cause, quel que soit son contenu",
        ],
        correctIndex: 1,
        explanation:
          "Le droit de la consommation et le droit commercial protègent contre les déséquilibres significatifs même en présence d'une signature, notamment face à une partie en position de force (ex: gros fournisseur face à petit client).",
      },
      {
        question: "Pourquoi la qualification exacte d'une relation de travail (salariat déguisé vs prestation indépendante) est-elle un enjeu juridique majeur pour une entreprise ?",
        options: [
          "Cette qualification n'a aucune conséquence pratique",
          "Une requalification en salariat par un juge peut entraîner rappels de cotisations sociales, indemnités, et sanctions -- même si le contrat initial était présenté comme une prestation indépendante",
          "Seul le nom donné au contrat compte, jamais la réalité de la relation de travail",
          "Ce risque ne concerne que les grandes entreprises",
          "La requalification ne peut jamais être rétroactive",
        ],
        correctIndex: 1,
        explanation:
          "Les juges regardent la réalité de la relation (subordination, horaires imposés...) au-delà du nom donné au contrat -- un \"freelance\" trop dépendant peut être requalifié en salarié, avec des conséquences financières lourdes rétroactives.",
      },
      {
        question: "Pourquoi une entreprise doit-elle documenter précisément le fondement légal (\"base légale\") de chaque traitement de données personnelles au sens du RGPD ?",
        options: [
          "Ce n'est qu'une formalité sans réelle utilité",
          "Sans base légale claire et documentée (consentement, intérêt légitime, obligation légale...), un traitement de données peut être jugé illicite, exposant à des sanctions importantes",
          "Le RGPD ne s'applique qu'aux entreprises basées en France",
          "Une seule base légale suffit pour tous les traitements de l'entreprise",
          "Cette documentation ne concerne que les données de santé",
        ],
        correctIndex: 1,
        explanation:
          "Le RGPD exige une base légale identifiée et justifiable pour chaque traitement -- son absence expose à des sanctions de la CNIL, indépendamment même de toute fuite de données.",
      },
      {
        question: "Pourquoi la propriété intellectuelle d'un développement réalisé par un stagiaire/alternant peut-elle poser un problème juridique si le contrat ne le précise pas ?",
        options: [
          "Il n'y a jamais d'ambiguïté, tout appartient automatiquement à l'entreprise dans tous les cas",
          "Sans clause de cession de droits explicite, la titularité de certains droits (notamment pour une œuvre originale) peut rester contestable et créer un litige ultérieur",
          "La propriété intellectuelle ne concerne jamais les stagiaires",
          "Un stagiaire ne peut jamais créer une œuvre protégeable",
          "Cette question ne se pose que pour les inventions brevetables",
        ],
        correctIndex: 1,
        explanation:
          "Contrairement à une idée reçue, la titularité des droits d'auteur n'est pas automatique pour l'employeur dans tous les cas -- une clause de cession explicite dans le contrat sécurise la situation.",
      },
      {
        question: "Pourquoi le principe de \"responsabilité limitée\" d'une société (SARL, SAS) peut-il être remis en cause dans certains cas graves (\"levée du voile social\") ?",
        options: [
          "Ce principe ne peut jamais être remis en cause, quelles que soient les circonstances",
          "En cas de faute de gestion grave ou de confusion des patrimoines, un dirigeant peut voir sa responsabilité personnelle engagée malgré la structure de la société",
          "La responsabilité limitée ne concerne que les très grandes entreprises",
          "Ce risque ne concerne jamais les dirigeants de PME",
          "Seule une faillite frauduleuse peut lever ce principe, jamais une simple négligence grave",
        ],
        correctIndex: 1,
        explanation:
          "La responsabilité limitée protège en principe le patrimoine personnel du dirigeant, mais des fautes de gestion graves (confusion des patrimoines, fraude) peuvent justifier une action en responsabilité personnelle malgré la structure sociétaire.",
      },
      {
        question: "Pourquoi un accord signé sous la contrainte économique manifeste (ex: fournisseur en situation de dépendance totale) peut-il être remis en cause juridiquement ?",
        options: [
          "Une signature vaut toujours acceptation libre et incontestable",
          "Le droit sanctionne l'abus de dépendance économique lorsqu'une partie impose des conditions déséquilibrées à une autre qui n'a pas de réelle alternative",
          "Ce risque ne concerne que les contrats entre particuliers",
          "L'abus de dépendance économique n'existe pas en droit français",
          "Seule la contrainte physique peut invalider un contrat",
        ],
        correctIndex: 1,
        explanation:
          "Le droit de la concurrence et le droit commercial sanctionnent l'abus de dépendance économique, distinct du simple rapport de force commercial normal -- une notion clé en droit des affaires.",
      },
      {
        question: "Pourquoi anticiper les implications juridiques d'une expansion à l'international (droit du travail local, fiscalité, protection des données) dès la phase de projet, et non après le lancement ?",
        options: [
          "Ce n'est jamais nécessaire, le droit français s'applique partout où l'entreprise opère",
          "Chaque juridiction a ses propres règles ; les découvrir après coup peut entraîner des sanctions, des contrats invalides ou des surcoûts importants difficiles à corriger a posteriori",
          "Les questions juridiques internationales ne concernent que les multinationales",
          "Un seul cadre juridique suffit toujours, quel que soit le pays visé",
          "L'anticipation juridique ralentit toujours inutilement un projet international",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper les spécificités juridiques locales (droit du travail, fiscalité, protection des données) évite des corrections coûteuses et des risques de sanctions une fois le projet déjà lancé sur le terrain.",
      },
    ],
  },

  finance: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en finance / banque ?",
        options: [
          "J'aime comprendre comment l'argent circule et comment analyser des chiffres pour décider",
          "Parce que c'est le métier le mieux payé",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile avec une calculatrice",
          "Parce que je veux éviter tout contact avec des clients",
        ],
        correctIndex: 0,
        explanation:
          "La finance sert à analyser et faire circuler l'argent pour éclairer des décisions -- une motivation liée à cette analyse est ce qu'attend un recruteur, pas l'attrait du salaire seul.",
      },
      {
        question: "Qu'est-ce qu'un \"budget\" ?",
        options: [
          "Un document juridique obligatoire",
          "Une prévision chiffrée des recettes et dépenses sur une période donnée",
          "Un type de compte bancaire",
          "Un contrat de prêt",
          "Un logiciel de facturation",
        ],
        correctIndex: 1,
        explanation:
          "Le budget permet d'anticiper et de piloter les finances sur une période, en comparant ensuite le réalisé aux prévisions.",
      },
      {
        question: "Que signifie \"intérêt\" dans un prêt bancaire ?",
        options: [
          "Le montant emprunté",
          "Le coût payé par l'emprunteur pour avoir accès à cet argent, en plus du remboursement du capital",
          "Une pénalité de retard uniquement",
          "Le nom de la banque prêteuse",
          "Un type d'assurance obligatoire",
        ],
        correctIndex: 1,
        explanation:
          "L'intérêt rémunère le prêteur pour le risque pris et l'usage de son argent -- un concept de base de toute opération de crédit.",
      },
      {
        question: "Qu'est-ce qu'une action en bourse ?",
        options: [
          "Une dette de l'entreprise",
          "Une part de propriété d'une entreprise, donnant droit à une part des bénéfices et parfois de vote",
          "Un type de compte épargne",
          "Un contrat d'assurance",
          "Un prêt bancaire",
        ],
        correctIndex: 1,
        explanation:
          "Détenir une action, c'est posséder une fraction de l'entreprise -- distinct d'une obligation, qui est une dette que l'entreprise doit rembourser.",
      },
      {
        question: "Pourquoi vérifier deux fois un calcul financier avant de le transmettre ?",
        options: [
          "Ce n'est jamais nécessaire, une seule vérification suffit toujours",
          "Une erreur de calcul en finance peut avoir des conséquences importantes sur une décision ou un engagement financier",
          "La vérification ralentit toujours inutilement le travail",
          "Les erreurs de calcul n'ont jamais d'impact réel",
          "Seuls les gros montants nécessitent une vérification",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur en finance peut engager des sommes importantes ou fausser une décision stratégique -- la rigueur et la double vérification sont des réflexes essentiels du métier.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre une charge fixe et une charge variable ?",
        options: [
          "Il n'y a aucune différence",
          "La charge fixe ne dépend pas du volume d'activité (loyer), la charge variable évolue avec lui (matières premières)",
          "La charge variable est toujours plus élevée que la fixe",
          "La charge fixe ne concerne que les salaires",
          "Ces notions ne s'appliquent qu'aux grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Distinguer charges fixes et variables est essentiel pour calculer un seuil de rentabilité et comprendre comment les coûts évoluent avec l'activité.",
      },
      {
        question: "Qu'est-ce que la \"trésorerie\" d'une entreprise ?",
        options: [
          "Le bénéfice comptable annuel",
          "L'argent réellement disponible immédiatement pour faire face aux dépenses courantes",
          "La valeur totale des actifs de l'entreprise",
          "Le montant des impôts dus",
          "Le capital social de l'entreprise",
        ],
        correctIndex: 1,
        explanation:
          "Une entreprise peut être rentable sur le papier mais manquer de trésorerie si ses clients paient en retard -- une distinction cruciale entre rentabilité et liquidité.",
      },
      {
        question: "Pourquoi diversifier un portefeuille d'investissement plutôt que tout miser sur un seul actif ?",
        options: [
          "Ce n'est jamais utile, mieux vaut tout miser sur le meilleur actif identifié",
          "Pour réduire le risque global : si un actif perd de la valeur, les autres peuvent compenser",
          "La diversification garantit toujours un gain supérieur",
          "Elle ne concerne que les très gros investisseurs",
          "Elle élimine complètement tout risque de perte",
        ],
        correctIndex: 1,
        explanation:
          "La diversification réduit le risque en évitant de dépendre de la performance d'un seul actif -- elle ne garantit pas le gain, mais limite l'ampleur des pertes possibles.",
      },
      {
        question: "Qu'est-ce qu'un \"taux d'endettement\" permet d'évaluer ?",
        options: [
          "Le chiffre d'affaires d'une entreprise",
          "La part des dettes par rapport aux ressources propres ou aux revenus, un indicateur de risque financier",
          "Le nombre d'employés",
          "La satisfaction des clients",
          "Le montant des impôts payés",
        ],
        correctIndex: 1,
        explanation:
          "Un taux d'endettement élevé signale un risque financier accru, notamment en cas de baisse d'activité ou de hausse des taux d'intérêt.",
      },
      {
        question: "Pourquoi les banques exigent-elles des garanties (caution, hypothèque) pour certains prêts ?",
        options: [
          "Pour compliquer inutilement la vie de l'emprunteur",
          "Pour se protéger en cas de défaut de paiement de l'emprunteur",
          "Les garanties n'ont aucun lien avec le risque de crédit",
          "Uniquement pour les très petits montants",
          "C'est une simple formalité sans réelle utilité",
        ],
        correctIndex: 1,
        explanation:
          "Une garantie permet à la banque de récupérer une partie de son argent si l'emprunteur ne peut plus rembourser -- un mécanisme central de gestion du risque de crédit.",
      },
      {
        question: "Qu'est-ce que l'inflation, et pourquoi affecte-t-elle le pouvoir d'achat ?",
        options: [
          "Une baisse générale des prix qui augmente le pouvoir d'achat",
          "Une hausse générale des prix qui réduit la quantité de biens qu'on peut acheter avec une même somme d'argent",
          "Un impôt supplémentaire prélevé par l'État",
          "Un indicateur qui ne concerne que la bourse",
          "Une mesure du chômage",
        ],
        correctIndex: 1,
        explanation:
          "L'inflation érode la valeur réelle de l'argent : avec la même somme, on peut acheter moins de biens et services qu'auparavant.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une entreprise rentable peut-elle malgré tout faire faillite (\"faillite par la trésorerie\") ?",
        options: [
          "C'est impossible, la rentabilité garantit toujours la survie de l'entreprise",
          "Si les délais de paiement clients sont trop longs par rapport aux délais fournisseurs, l'entreprise peut manquer de liquidités pour honorer ses dettes à court terme malgré un bénéfice comptable",
          "La faillite ne dépend jamais de la trésorerie",
          "Ce risque ne concerne que les entreprises déficitaires",
          "La rentabilité et la trésorerie sont toujours strictement identiques",
        ],
        correctIndex: 1,
        explanation:
          "Un décalage entre encaissements clients et décaissements fournisseurs peut asphyxier une entreprise pourtant rentable sur le papier -- un des pièges financiers les plus fréquents pour les PME en croissance rapide.",
      },
      {
        question: "Pourquoi le \"levier financier\" (endettement pour investir) peut-il être à la fois un accélérateur de rentabilité et un facteur de risque accru ?",
        options: [
          "Le levier financier n'a aucun impact sur le risque de l'entreprise",
          "Il amplifie les gains si l'investissement est rentable, mais amplifie tout autant les pertes si l'investissement échoue ou si les taux d'intérêt augmentent",
          "Il élimine tout risque financier",
          "Il ne concerne que les investissements immobiliers",
          "Un endettement élevé est toujours sans conséquence si l'entreprise est rentable",
        ],
        correctIndex: 1,
        explanation:
          "L'effet de levier fonctionne dans les deux sens : il démultiplie la rentabilité des capitaux propres en cas de succès, mais démultiplie aussi les pertes en cas d'échec -- un arbitrage risque/rendement central en finance.",
      },
      {
        question: "Pourquoi la valeur actualisée nette (VAN) est-elle préférée à une simple comparaison de flux de trésorerie bruts pour évaluer un investissement sur plusieurs années ?",
        options: [
          "Elle n'apporte aucune information supplémentaire",
          "Elle tient compte du fait qu'un euro reçu aujourd'hui vaut plus qu'un euro reçu dans plusieurs années (valeur temps de l'argent)",
          "La VAN ignore complètement le temps",
          "Elle ne concerne que les investissements publics",
          "Un flux brut futur a toujours la même valeur qu'un flux présent",
        ],
        correctIndex: 1,
        explanation:
          "La VAN actualise les flux futurs pour refléter la valeur temps de l'argent (inflation, coût d'opportunité) -- comparer des flux bruts sans actualisation fausserait la comparaison entre projets sur des durées différentes.",
      },
      {
        question: "Pourquoi un audit financier indépendant est-il important même pour une entreprise en bonne santé apparente ?",
        options: [
          "Ce n'est qu'une formalité coûteuse et inutile",
          "Il permet de détecter des erreurs, fraudes ou pratiques comptables risquées invisibles en interne, et renforce la confiance des investisseurs/partenaires",
          "L'audit ne concerne que les entreprises en difficulté",
          "Un audit garantit toujours qu'aucune fraude n'existe",
          "Il n'a aucune utilité si les comptes sont déjà tenus par un comptable interne",
        ],
        correctIndex: 1,
        explanation:
          "Un regard extérieur indépendant peut détecter des anomalies invisibles en interne (biais, pression hiérarchique) et rassure les tiers (banques, investisseurs) sur la fiabilité des comptes.",
      },
      {
        question: "Pourquoi la notation de crédit (rating) d'une entreprise peut-elle avoir un impact en cascade sur ses coûts de financement futurs ?",
        options: [
          "Le rating n'a aucun lien avec le coût du financement",
          "Une dégradation du rating augmente la prime de risque exigée par les prêteurs, renchérissant tous les futurs emprunts, ce qui peut à son tour fragiliser davantage la santé financière",
          "Un bon rating garantit toujours un financement gratuit",
          "Le rating ne concerne que les États, jamais les entreprises",
          "Cet impact ne se produit que sur le très court terme",
        ],
        correctIndex: 1,
        explanation:
          "Une dégradation de la notation augmente le coût de la dette future, ce qui peut créer un cercle vicieux fragilisant encore plus la situation financière de l'entreprise -- un effet systémique à bien comprendre.",
      },
      {
        question: "Pourquoi la couverture de change (hedging) est-elle cruciale pour une entreprise qui facture en devise étrangère ?",
        options: [
          "Elle n'a aucune utilité si l'entreprise est rentable",
          "Sans couverture, une variation défavorable du taux de change entre la facturation et l'encaissement peut effacer partiellement ou totalement la marge prévue sur une vente",
          "Le risque de change ne concerne que les très grandes multinationales",
          "La couverture de change garantit toujours un gain supplémentaire",
          "Ce risque ne concerne que les investissements financiers, jamais les ventes commerciales",
        ],
        correctIndex: 1,
        explanation:
          "Une entreprise qui facture en devise étrangère est exposée au risque de change entre la date de facturation et celle de l'encaissement -- une couverture (contrat à terme, option) protège la marge prévue initialement.",
      },
      {
        question: "Pourquoi le contrôle de gestion doit-il distinguer un écart de volume d'un écart de prix dans l'analyse d'une variation de marge ?",
        options: [
          "Cette distinction n'a aucune utilité pratique",
          "Les deux écarts appellent des actions correctives totalement différentes (commerciales pour le volume, tarifaires/coûts pour le prix) -- les confondre mène à de mauvaises décisions",
          "Seul l'écart de prix compte réellement en pratique",
          "Le volume et le prix ont toujours le même impact sur la marge",
          "Cette analyse ne concerne que les entreprises industrielles",
        ],
        correctIndex: 1,
        explanation:
          "Une baisse de marge due à un effet volume (moins de ventes) appelle une réponse commerciale, tandis qu'un effet prix (marge unitaire réduite) appelle une réponse sur les coûts ou la politique tarifaire -- une analyse fine évite de se tromper de levier d'action.",
      },
    ],
  },

  immobilier: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'immobilier ?",
        options: [
          "J'aime accompagner des personnes dans un projet de vie important et concret",
          "Parce que je pense que c'est un métier facile et rapide",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air simple : montrer des appartements",
          "Parce que je veux éviter tout contact avec des clients",
        ],
        correctIndex: 0,
        explanation:
          "L'immobilier implique d'accompagner un projet souvent très important pour le client (achat, location) -- une motivation centrée sur cet accompagnement rassure plus qu'une vision superficielle du métier.",
      },
      {
        question: "Qu'est-ce qu'un \"mandat de vente\" ?",
        options: [
          "Un contrat de location",
          "Un document par lequel un propriétaire autorise une agence à vendre son bien",
          "Un acte de propriété définitif",
          "Un prêt bancaire",
          "Une facture d'agence",
        ],
        correctIndex: 1,
        explanation:
          "Le mandat de vente formalise la mission confiée à l'agence par le propriétaire, avec ses conditions (durée, exclusivité, commission).",
      },
      {
        question: "Que signifie \"exclusivité\" dans un mandat immobilier ?",
        options: [
          "Le bien ne peut être vendu qu'à un seul acheteur potentiel",
          "Une seule agence est autorisée à commercialiser le bien pendant la durée du mandat",
          "Le prix du bien ne peut jamais changer",
          "L'agence garantit une vente sous 24h",
          "Le propriétaire ne peut jamais visiter son propre bien",
        ],
        correctIndex: 1,
        explanation:
          "L'exclusivité engage le propriétaire à ne passer que par une seule agence, en échange généralement d'un accompagnement plus poussé sur la vente.",
      },
      {
        question: "Pourquoi une visite bien préparée est-elle importante pour un bien immobilier ?",
        options: [
          "Ce n'est jamais utile, l'acheteur décide uniquement sur le prix",
          "Elle met en valeur le bien et aide le client à se projeter concrètement",
          "La préparation n'a aucun effet sur la décision d'achat",
          "Il vaut mieux ne rien préparer pour rester spontané",
          "Cela ne concerne que les biens de luxe",
        ],
        correctIndex: 1,
        explanation:
          "Une visite bien préparée (rangement, mise en valeur, informations clés) aide le client à se projeter et augmente les chances de conclure la vente ou la location.",
      },
      {
        question: "Que dois-tu faire si un client te pose une question technique sur un bien à laquelle tu n'as pas la réponse ?",
        options: [
          "Inventer une réponse pour paraître compétent",
          "Dire honnêtement que tu vas te renseigner et revenir vers lui rapidement",
          "Changer de sujet immédiatement",
          "Ignorer la question",
          "Rediriger la question sans réponse claire",
        ],
        correctIndex: 1,
        explanation:
          "L'honnêteté et le suivi rassurent bien plus le client qu'une réponse inventée qui pourrait s'avérer fausse et nuire à la confiance.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le \"diagnostic de performance énergétique\" (DPE) ?",
        options: [
          "Un document facultatif sans réelle utilité",
          "Une évaluation obligatoire de la consommation énergétique d'un bien, à fournir lors d'une vente ou location",
          "Un contrat d'assurance habitation",
          "Un prêt immobilier spécifique",
          "Un type de taxe foncière",
        ],
        correctIndex: 1,
        explanation:
          "Le DPE est obligatoire en France pour informer acheteurs/locataires de la performance énergétique du logement -- il peut même influencer le prix ou la possibilité de louer un bien.",
      },
      {
        question: "Pourquoi la localisation reste-t-elle l'un des critères les plus déterminants du prix d'un bien immobilier ?",
        options: [
          "Ce n'est jamais un critère important",
          "Elle influence fortement l'accès aux transports, écoles, commerces et l'attractivité générale, des facteurs difficiles à modifier après achat",
          "Seule la surface du bien compte réellement",
          "La localisation n'a d'impact que pour les biens de luxe",
          "Le prix ne dépend que de l'état du bien",
        ],
        correctIndex: 1,
        explanation:
          "Contrairement à l'état d'un bien (rénovable), la localisation est un facteur fixe qui influence durablement la valeur et l'attractivité -- d'où son poids central dans l'estimation.",
      },
      {
        question: "Qu'est-ce qu'un \"compromis de vente\" ?",
        options: [
          "Un simple accord oral sans valeur",
          "Un avant-contrat engageant vendeur et acheteur avant la signature de l'acte définitif chez le notaire",
          "L'acte final de propriété",
          "Un type de prêt bancaire",
          "Une simple offre d'achat non engageante",
        ],
        correctIndex: 1,
        explanation:
          "Le compromis de vente engage juridiquement les deux parties (sous conditions suspensives, comme l'obtention d'un prêt) avant l'acte authentique final chez le notaire.",
      },
      {
        question: "Pourquoi une estimation de prix trop élevée peut-elle finalement nuire à la vente d'un bien ?",
        options: [
          "Ce n'est jamais un problème, plus le prix est haut, mieux c'est toujours",
          "Un bien surestimé reste plus longtemps sur le marché, ce qui peut le \"griller\" aux yeux des acheteurs qui le voient stagner",
          "Le prix n'a aucun impact sur la durée de vente",
          "Les acheteurs ne consultent jamais l'historique d'une annonce",
          "Une estimation élevée garantit toujours une meilleure négociation finale",
        ],
        correctIndex: 1,
        explanation:
          "Un bien qui stagne sur le marché à cause d'un prix trop élevé peut donner l'impression qu'il a un défaut caché, rendant la vente encore plus difficile même après une baisse de prix ultérieure.",
      },
      {
        question: "Que signifie une \"condition suspensive d'obtention de prêt\" dans un compromis de vente ?",
        options: [
          "L'acheteur doit payer comptant obligatoirement",
          "La vente est annulée sans pénalité si l'acheteur n'obtient pas son financement bancaire dans les délais prévus",
          "Le vendeur peut annuler la vente à tout moment sans justification",
          "Cette clause n'a aucune valeur juridique",
          "Elle ne concerne que les biens neufs",
        ],
        correctIndex: 1,
        explanation:
          "Cette clause protège l'acheteur : si sa demande de prêt est refusée dans les conditions prévues, il peut se rétracter sans perdre son dépôt de garantie.",
      },
      {
        question: "Pourquoi un agent immobilier doit-il vérifier la solvabilité d'un locataire avant validation d'un dossier de location ?",
        options: [
          "Ce n'est jamais nécessaire, la confiance suffit toujours",
          "Pour limiter le risque d'impayés de loyer pour le propriétaire, en vérifiant des critères objectifs (revenus, garanties)",
          "Cette vérification est interdite par la loi",
          "Elle ne concerne que les logements de luxe",
          "Le propriétaire n'a jamais de recours en cas d'impayé",
        ],
        correctIndex: 1,
        explanation:
          "Vérifier la solvabilité (revenus, garant) protège le propriétaire contre le risque d'impayés, tout en respectant un cadre légal précis sur les documents pouvant être demandés.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une forte hausse des taux d'intérêt peut-elle faire baisser les prix de l'immobilier, même sans changement de l'offre et la demande de logements eux-mêmes ?",
        options: [
          "Les taux d'intérêt n'ont aucun lien avec les prix immobiliers",
          "Une hausse des taux réduit la capacité d'emprunt des acheteurs à mensualité égale, ce qui réduit mécaniquement leur budget d'achat maximal et pèse sur les prix",
          "Les prix immobiliers ne dépendent que du nombre de biens disponibles",
          "Une hausse des taux fait toujours monter les prix immobiliers",
          "Ce phénomène ne concerne que les investisseurs professionnels",
        ],
        correctIndex: 1,
        explanation:
          "À mensualité de remboursement égale, une hausse des taux réduit le montant empruntable -- ce qui comprime mécaniquement la capacité d'achat du marché et pèse sur les prix, indépendamment de l'offre de logements.",
      },
      {
        question: "Pourquoi la gestion d'une copropriété peut-elle devenir juridiquement complexe en cas de désaccord entre copropriétaires sur des travaux importants ?",
        options: [
          "La copropriété n'a jamais de règles particulières, chacun décide pour son propre lot",
          "Les décisions collectives (travaux, budget) suivent des règles de majorité précises en assemblée générale, et un copropriétaire peut contester une décision devant un juge s'il l'estime irrégulière",
          "Un seul copropriétaire peut toujours imposer sa décision à tous les autres",
          "Les travaux ne nécessitent jamais de vote en assemblée générale",
          "Ce sujet ne concerne que les très grandes copropriétés",
        ],
        correctIndex: 1,
        explanation:
          "La loi encadre précisément les majorités requises selon le type de décision (travaux d'entretien vs. amélioration) -- un désaccord peut aboutir à une contestation judiciaire de la décision d'assemblée générale.",
      },
      {
        question: "Pourquoi un investisseur locatif doit-il analyser la \"rentabilité nette\" d'un bien plutôt que sa seule \"rentabilité brute\" affichée ?",
        options: [
          "Ces deux notions sont toujours identiques",
          "La rentabilité brute ignore les charges, impôts, vacance locative et frais de gestion, qui peuvent réduire fortement le rendement réel de l'investissement",
          "Seule la rentabilité brute est utilisée par les professionnels",
          "La rentabilité nette est toujours supérieure à la brute",
          "Ces calculs ne concernent que l'immobilier commercial",
        ],
        correctIndex: 1,
        explanation:
          "Une rentabilité brute affichée attractive peut cacher une rentabilité nette bien plus faible une fois déduits charges, taxe foncière, gestion et périodes de vacance locative -- un piège fréquent pour les investisseurs novices.",
      },
      {
        question: "Pourquoi la clause de \"garantie des vices cachés\" reste-t-elle pertinente même après signature d'un acte de vente immobilier ?",
        options: [
          "Elle n'a plus aucun effet une fois l'acte signé",
          "Elle permet à l'acheteur d'engager la responsabilité du vendeur pour un défaut grave, non visible et non signalé, découvert après la vente",
          "Elle ne concerne que la vente de biens neufs",
          "Elle protège uniquement le vendeur contre l'acheteur",
          "Cette garantie n'existe qu'à l'oral, jamais dans l'acte notarié",
        ],
        correctIndex: 1,
        explanation:
          "La garantie des vices cachés permet à l'acheteur de se retourner contre le vendeur pour un défaut grave et caché découvert après la vente, sous certaines conditions et délais -- un mécanisme de protection post-vente important à connaître.",
      },
      {
        question: "Pourquoi la fiscalité (plus-value, régime LMNP, etc.) peut-elle changer radicalement la rentabilité réelle d'un projet immobilier identique selon le montage choisi ?",
        options: [
          "La fiscalité n'a aucun impact sur la rentabilité d'un investissement immobilier",
          "Des régimes fiscaux différents (location nue vs meublée, société civile...) entraînent des niveaux d'imposition très différents sur les mêmes revenus locatifs ou plus-values, changeant fortement le rendement net final",
          "Tous les montages immobiliers sont fiscalement équivalents",
          "Seul le prix d'achat détermine la rentabilité finale",
          "La fiscalité immobilière est identique pour tous les investisseurs sans exception",
        ],
        correctIndex: 1,
        explanation:
          "Le choix du statut fiscal (LMNP, société civile, location nue...) peut faire varier fortement l'imposition des revenus locatifs et de la plus-value à la revente -- un montage mal choisi peut réduire significativement la rentabilité réelle d'un projet.",
      },
      {
        question: "Pourquoi un promoteur immobilier doit-il intégrer le risque de recours de tiers (permis de construire contesté) dans son plan de financement dès le départ ?",
        options: [
          "Ce risque n'existe jamais en pratique",
          "Un recours peut geler un projet pendant plusieurs mois voire années, générant des coûts financiers (intérêts, retards de livraison) qui doivent être anticipés dans le montage financier initial",
          "Un permis de construire ne peut jamais être contesté une fois accordé",
          "Ce risque ne concerne que les très gros projets urbains",
          "Le recours de tiers n'a aucun impact financier sur le projet",
        ],
        correctIndex: 1,
        explanation:
          "Un recours contentieux contre un permis de construire peut bloquer un chantier pendant une durée longue et imprévisible -- un promoteur sérieux intègre ce risque juridique dans son calcul financier prévisionnel dès l'origine.",
      },
      {
        question: "Pourquoi la mixité sociale imposée par la loi (quota de logements sociaux) peut-elle créer une tension entre obligation légale et stratégie commerciale d'un promoteur ?",
        options: [
          "Il n'y a jamais de tension, les deux objectifs sont toujours parfaitement alignés",
          "Le quota légal peut réduire la part de logements vendus au prix du marché libre, impactant l'équilibre financier global du projet initialement prévu",
          "Les quotas de logements sociaux n'existent pas en droit français",
          "Cette obligation ne concerne que les logements sociaux gérés par l'État directement",
          "Le promoteur peut toujours choisir librement de ne pas respecter ce quota",
        ],
        correctIndex: 1,
        explanation:
          "Les obligations de mixité sociale (loi SRU notamment) peuvent réduire la part de logements vendus au prix libre du marché, un paramètre à intégrer dès le montage financier du projet plutôt qu'à découvrir après coup.",
      },
    ],
  },

  tourisme: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le tourisme / l'hôtellerie / l'événementiel ?",
        options: [
          "J'aime créer de bonnes expériences et m'occuper des détails qui font la différence",
          "Parce que je veux voyager gratuitement",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile et amusant",
          "Parce que je n'aime pas travailler le week-end",
        ],
        correctIndex: 0,
        explanation:
          "Le tourisme/événementiel repose sur l'attention aux détails et la qualité de l'expérience client -- une motivation centrée là-dessus est bien plus solide qu'une image idéalisée du métier.",
      },
      {
        question: "Qu'est-ce qu'un \"cahier des charges\" pour un événement ?",
        options: [
          "Une simple liste de courses",
          "Un document qui décrit précisément les besoins, contraintes et objectifs d'un événement",
          "Une facture finale",
          "Un contrat de travail",
          "Un plan de salle uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le cahier des charges cadre tout le projet événementiel (budget, lieu, date, prestataires, objectifs) pour éviter les malentendus en cours de route.",
      },
      {
        question: "Que dois-tu faire si un client se plaint d'un service pendant son séjour ?",
        options: [
          "L'ignorer jusqu'à son départ",
          "L'écouter, t'excuser si nécessaire, et proposer une solution concrète rapidement",
          "Lui dire que ce n'est pas ton problème",
          "Répondre avec agacement",
          "Attendre qu'il écrive un avis négatif avant de réagir",
        ],
        correctIndex: 1,
        explanation:
          "Réagir vite et avec une solution concrète peut transformer une expérience négative en bon souvenir -- un réflexe clé de l'accueil et de l'hôtellerie.",
      },
      {
        question: "Qu'est-ce qu'un \"taux d'occupation\" dans l'hôtellerie ?",
        options: [
          "Le nombre d'employés d'un hôtel",
          "Le pourcentage de chambres occupées par rapport au nombre total de chambres disponibles",
          "Le prix moyen d'une chambre",
          "Le nombre d'étoiles de l'hôtel",
          "La surface totale de l'établissement",
        ],
        correctIndex: 1,
        explanation:
          "Le taux d'occupation est un indicateur clé de performance d'un hôtel, souvent croisé avec le prix moyen pour évaluer la rentabilité réelle.",
      },
      {
        question: "Pourquoi le sourire et l'attitude positive sont-ils importants dans l'accueil touristique/événementiel ?",
        options: [
          "Ce n'est jamais réellement important pour le client",
          "Ils créent une première impression positive qui influence toute la perception de l'expérience",
          "Le sourire n'a aucun lien avec la satisfaction client",
          "Cela ne concerne que les postes de direction",
          "Un accueil neutre est toujours préférable",
        ],
        correctIndex: 1,
        explanation:
          "La première impression influence fortement la perception globale d'un séjour ou d'un événement -- l'accueil est souvent le premier contact réel avec le client.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le \"yield management\" (gestion des prix dynamique) dans l'hôtellerie ?",
        options: [
          "Une méthode de recrutement",
          "Une stratégie qui ajuste les prix en fonction de la demande, de la saison et du taux de remplissage pour maximiser le revenu",
          "Un logiciel de réservation uniquement",
          "Une technique de nettoyage des chambres",
          "Un type de contrat fournisseur",
        ],
        correctIndex: 1,
        explanation:
          "Le yield management ajuste dynamiquement les tarifs (comme dans le transport aérien) pour optimiser le revenu global selon la demande anticipée.",
      },
      {
        question: "Pourquoi la gestion des imprévus est-elle une compétence centrale en organisation d'événements ?",
        options: [
          "Les imprévus n'arrivent presque jamais en pratique",
          "Un événement implique de nombreux paramètres externes (météo, prestataires, transport) qui peuvent changer à tout moment, nécessitant réactivité et plans B",
          "Il suffit toujours de suivre le planning initial sans jamais s'adapter",
          "Cette compétence ne concerne que les très gros événements",
          "Les imprévus n'ont jamais d'impact sur la satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "Un événement dépend de nombreux facteurs externes -- savoir anticiper des plans B et réagir vite face à un imprévu est une compétence clé du métier.",
      },
      {
        question: "Qu'est-ce que la \"e-réputation\" pour un établissement touristique ?",
        options: [
          "Le nombre d'employés ayant un compte professionnel en ligne",
          "L'image et la perception de l'établissement telles qu'elles apparaissent dans les avis et commentaires en ligne",
          "Le chiffre d'affaires en ligne uniquement",
          "Un logiciel de réservation",
          "Le classement officiel par étoiles",
        ],
        correctIndex: 1,
        explanation:
          "Les avis en ligne (Google, TripAdvisor, Booking...) influencent fortement la décision des futurs clients -- gérer sa e-réputation est devenu un enjeu central du secteur.",
      },
      {
        question: "Pourquoi la saisonnalité est-elle un enjeu stratégique majeur dans le tourisme ?",
        options: [
          "Elle n'a aucun impact réel sur l'activité",
          "Une forte variation de la demande selon les saisons impose d'adapter les effectifs, les prix et l'offre pour rester rentable toute l'année",
          "La saisonnalité ne concerne que les destinations à la montagne",
          "Il suffit de garder la même offre et les mêmes prix toute l'année",
          "Ce phénomène a disparu avec le tourisme moderne",
        ],
        correctIndex: 1,
        explanation:
          "Gérer la saisonnalité (offres hors saison, adaptation des effectifs, diversification de clientèle) est un enjeu économique central pour beaucoup d'acteurs du tourisme.",
      },
      {
        question: "Qu'est-ce qu'un \"rétroplanning\" pour l'organisation d'un événement ?",
        options: [
          "Le bilan financier après l'événement",
          "Un planning organisé à rebours depuis la date de l'événement, listant toutes les tâches et leurs échéances",
          "La liste des invités",
          "Un contrat avec le lieu de l'événement",
          "Un plan de communication uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le rétroplanning permet de ne rien oublier en remontant depuis le jour J vers aujourd'hui, avec des échéances claires pour chaque tâche.",
      },
      {
        question: "Pourquoi personnaliser l'expérience client (recommandations, attentions particulières) fidélise-t-il davantage dans l'hôtellerie/tourisme ?",
        options: [
          "La personnalisation n'a aucun effet sur la fidélisation",
          "Elle crée un sentiment d'être reconnu et valorisé en tant qu'individu, ce qui renforce l'attachement à l'établissement au-delà du simple service standard",
          "Elle est toujours perçue comme intrusive par les clients",
          "Elle ne concerne que les hôtels de luxe",
          "Elle coûte toujours plus cher sans aucun bénéfice mesurable",
        ],
        correctIndex: 1,
        explanation:
          "Un client qui se sent reconnu individuellement développe un attachement émotionnel à l'établissement, un facteur de fidélisation plus fort qu'un service standardisé, même impeccable.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi une stratégie de prix uniquement basée sur le \"moins cher que la concurrence\" est-elle risquée à long terme dans l'hôtellerie ?",
        options: [
          "Ce n'est jamais risqué, le prix le plus bas gagne toujours",
          "Elle peut enclencher une guerre des prix qui érode la rentabilité de tout le marché local, sans construire de différenciation ou de fidélité durable",
          "Le prix n'a aucune influence sur la décision de réservation",
          "Cette stratégie garantit toujours un taux d'occupation maximal",
          "Ce risque ne concerne que les hôtels indépendants",
        ],
        correctIndex: 1,
        explanation:
          "Une course au prix le plus bas peut détruire la rentabilité de tout un marché sans construire d'avantage durable -- une différenciation par la qualité ou l'expérience est souvent plus soutenable.",
      },
      {
        question: "Pourquoi la dépendance excessive à une seule plateforme de réservation (OTA) peut-elle fragiliser un établissement indépendant ?",
        options: [
          "Il n'y a aucun risque à dépendre d'une seule plateforme",
          "Les commissions élevées réduisent la marge, et l'établissement perd en partie le contrôle de sa relation directe avec le client et de sa politique tarifaire",
          "Les plateformes de réservation ne prennent jamais de commission",
          "Cette dépendance renforce toujours la rentabilité de l'hôtel",
          "Ce risque ne concerne que les grands groupes hôteliers",
        ],
        correctIndex: 1,
        explanation:
          "Une dépendance forte à une OTA (commission de 15-20%+) réduit la marge et la maîtrise de la relation client -- diversifier les canaux de réservation (site propre, direct) est une vraie priorité stratégique.",
      },
      {
        question: "Pourquoi un événement doit-il prévoir un plan de gestion de crise (météo extrême, incident sécurité) même pour une manifestation en apparence simple ?",
        options: [
          "Ce n'est jamais nécessaire pour un petit événement",
          "L'absence de plan de crise peut transformer un incident gérable en catastrophe organisationnelle et engager la responsabilité juridique des organisateurs",
          "Un plan de crise garantit qu'aucun incident ne se produira jamais",
          "Cette anticipation ne concerne que les événements internationaux",
          "La gestion de crise n'a aucun lien avec la responsabilité légale des organisateurs",
        ],
        correctIndex: 1,
        explanation:
          "Même un événement simple peut engager la responsabilité civile et parfois pénale des organisateurs en cas d'incident non anticipé -- un plan de gestion de crise minimal est une nécessité, pas une option.",
      },
      {
        question: "Pourquoi le tourisme durable devient-il un enjeu stratégique et pas seulement un argument marketing pour les destinations ?",
        options: [
          "Il ne s'agit que d'un effet de mode sans réel impact économique",
          "Un afflux touristique non maîtrisé peut dégrader durablement les ressources locales (nature, patrimoine, qualité de vie des habitants), menaçant l'attractivité même de la destination à long terme",
          "Le tourisme n'a jamais d'impact environnemental réel",
          "Cette question ne concerne que les très petites destinations",
          "Le tourisme durable réduit toujours la rentabilité sans aucune contrepartie",
        ],
        correctIndex: 1,
        explanation:
          "Le \"surtourisme\" peut dégrader durablement l'attrait même d'une destination (nature, patrimoine, qualité de vie locale) -- un enjeu de pérennité économique, pas seulement environnemental ou d'image.",
      },
      {
        question: "Pourquoi un hôtel doit-il analyser le \"RevPAR\" (revenu par chambre disponible) plutôt que le seul taux d'occupation pour juger de sa performance ?",
        options: [
          "Le taux d'occupation seul suffit toujours à juger la performance",
          "Un taux d'occupation élevé à prix très bradé peut masquer une performance financière réelle médiocre -- le RevPAR combine occupation ET prix moyen pour une vision plus juste",
          "Le RevPAR ne concerne que les très grands groupes hôteliers",
          "Ces deux indicateurs mesurent toujours exactement la même chose",
          "Le prix moyen n'a aucun impact sur la rentabilité globale",
        ],
        correctIndex: 1,
        explanation:
          "Un taux d'occupation de 100% à prix cassé peut générer moins de revenu qu'un taux de 70% à prix optimal -- le RevPAR (occupation × prix moyen) donne une image plus fidèle de la performance réelle.",
      },
      {
        question: "Pourquoi la formation du personnel de première ligne (réception, service) est-elle un investissement stratégique plutôt qu'un simple coût dans l'hôtellerie ?",
        options: [
          "La formation n'a aucun impact mesurable sur la satisfaction client",
          "Le personnel de première ligne façonne directement l'expérience perçue par le client -- son incompétence ou son manque d'autonomie peut détruire en quelques minutes une expérience par ailleurs bien conçue",
          "Cette question ne concerne que les postes de direction",
          "Un client ne remarque jamais la qualité du personnel d'accueil",
          "La formation du personnel ne concerne que les grands groupes internationaux",
        ],
        correctIndex: 1,
        explanation:
          "Le personnel de contact direct est souvent le facteur décisif de la perception globale d'un séjour, positif ou négatif -- sous-investir dans sa formation revient à fragiliser toute l'expérience client construite en amont.",
      },
      {
        question: "Pourquoi la digitalisation du parcours client (réservation en ligne, chatbot, self check-in) doit-elle être pensée en complément, et non en remplacement total, de l'accueil humain dans l'hôtellerie haut de gamme ?",
        options: [
          "La digitalisation totale est toujours préférable, sans exception",
          "Dans un positionnement haut de gamme, l'attente client porte souvent sur une relation humaine personnalisée -- une digitalisation mal dosée peut nuire à la valeur perçue du service",
          "L'accueil humain n'a plus aucune valeur ajoutée aujourd'hui",
          "Cette question ne concerne que l'hôtellerie économique",
          "Le positionnement de l'établissement n'a aucun lien avec le choix technologique",
        ],
        correctIndex: 1,
        explanation:
          "Le bon niveau de digitalisation dépend du positionnement : ce qui optimise l'efficacité en hôtellerie économique peut appauvrir l'expérience perçue en haut de gamme, où la relation humaine fait justement partie de la valeur vendue.",
      },
    ],
  },

  ingenierie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en ingénierie / production industrielle ?",
        options: [
          "J'aime comprendre comment les choses sont fabriquées et résoudre des problèmes techniques concrets",
          "Parce que je n'aime pas le travail en équipe",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air facile avec les bonnes machines",
          "Parce que je veux éviter tout contact avec un client",
        ],
        correctIndex: 0,
        explanation:
          "L'ingénierie industrielle repose sur la résolution concrète de problèmes techniques -- une motivation liée à cette dimension pratique rassure plus qu'une réponse vague.",
      },
      {
        question: "Qu'est-ce qu'une \"norme de sécurité\" en usine ?",
        options: [
          "Une simple recommandation facultative",
          "Une règle obligatoire visant à protéger la sécurité des personnes et des équipements",
          "Un type de contrat fournisseur",
          "Un logiciel de gestion de production",
          "Une procédure comptable",
        ],
        correctIndex: 1,
        explanation:
          "Les normes de sécurité en milieu industriel sont contraignantes et essentielles pour protéger les salariés -- leur non-respect peut avoir des conséquences graves.",
      },
      {
        question: "Que fait un \"cahier des charges technique\" ?",
        options: [
          "Il liste uniquement le budget du projet",
          "Il décrit précisément les spécifications et contraintes techniques attendues d'un produit ou d'un système",
          "Il concerne uniquement le marketing du produit",
          "Il remplace le besoin de plans techniques",
          "Il ne concerne que les très gros projets",
        ],
        correctIndex: 1,
        explanation:
          "Le cahier des charges technique cadre précisément ce qui doit être conçu/fabriqué, évitant les malentendus entre équipes ou avec un client.",
      },
      {
        question: "Que dois-tu faire si tu observes un dysfonctionnement sur une machine en production ?",
        options: [
          "L'ignorer et continuer normalement",
          "Le signaler immédiatement selon la procédure prévue, avant qu'il ne s'aggrave",
          "Réparer toi-même sans en informer personne",
          "Attendre la fin de la journée pour le signaler",
          "Continuer à utiliser la machine sans vérification",
        ],
        correctIndex: 1,
        explanation:
          "Signaler rapidement un dysfonctionnement selon la procédure évite d'aggraver un problème technique ou de sécurité -- un réflexe essentiel en environnement industriel.",
      },
      {
        question: "Qu'est-ce que la \"maintenance préventive\" ?",
        options: [
          "Réparer une machine uniquement après une panne",
          "Entretenir régulièrement un équipement pour éviter les pannes avant qu'elles ne surviennent",
          "Un type d'assurance industrielle",
          "Remplacer systématiquement toutes les machines chaque année",
          "Une formation obligatoire du personnel",
        ],
        correctIndex: 1,
        explanation:
          "La maintenance préventive anticipe l'usure pour éviter les pannes coûteuses et les arrêts de production imprévus, contrairement à la maintenance corrective qui intervient après coup.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le \"lean manufacturing\" ?",
        options: [
          "Une méthode qui vise à maximiser la production sans se soucier des coûts",
          "Une approche visant à éliminer les gaspillages (temps, stock, mouvements inutiles) pour améliorer l'efficacité globale",
          "Un logiciel de comptabilité industrielle",
          "Une norme de sécurité obligatoire",
          "Une méthode réservée à l'industrie automobile uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Le lean manufacturing, popularisé par Toyota, cherche à éliminer systématiquement les gaspillages à chaque étape de la production pour gagner en efficacité et en qualité.",
      },
      {
        question: "Pourquoi le contrôle qualité est-il réalisé à plusieurs étapes de la production, et pas seulement à la fin ?",
        options: [
          "Un seul contrôle final est toujours suffisant",
          "Détecter un défaut tôt évite de continuer à produire (et gaspiller des ressources) sur une base déjà défectueuse",
          "Le contrôle qualité en cours de production n'a aucune utilité",
          "Cette pratique ne concerne que les produits de très haute technologie",
          "Le contrôle qualité ralentit toujours inutilement la production",
        ],
        correctIndex: 1,
        explanation:
          "Détecter un défaut le plus tôt possible dans le processus évite de continuer à investir des ressources (temps, matière) sur une production déjà compromise -- un principe clé du contrôle qualité industriel.",
      },
      {
        question: "Qu'est-ce que le \"taux de rendement synthétique\" (TRS) mesure-t-il en production ?",
        options: [
          "Le salaire moyen des opérateurs",
          "L'efficacité globale d'une ligne de production, combinant disponibilité, performance et qualité",
          "Le chiffre d'affaires de l'usine",
          "Le nombre total d'employés",
          "La satisfaction des clients finaux",
        ],
        correctIndex: 1,
        explanation:
          "Le TRS combine trois facteurs (temps de disponibilité de la machine, vitesse réelle vs théorique, taux de pièces conformes) pour donner une vision globale de l'efficacité de production.",
      },
      {
        question: "Pourquoi la traçabilité des pièces est-elle importante dans une chaîne de production complexe (ex: automobile, aéronautique) ?",
        options: [
          "Elle n'a aucune utilité réelle",
          "En cas de défaut détecté après coup, elle permet d'identifier précisément quels produits sont concernés, sans devoir rappeler toute la production",
          "Elle ne concerne que les produits alimentaires",
          "La traçabilité ralentit toujours inutilement la production sans bénéfice",
          "Elle ne sert qu'à des fins de facturation",
        ],
        correctIndex: 1,
        explanation:
          "En cas de défaut, la traçabilité permet un rappel ciblé plutôt qu'un rappel massif et coûteux -- un enjeu majeur dans les secteurs à forte exigence de sécurité (automobile, aéronautique, médical).",
      },
      {
        question: "Pourquoi la standardisation des procédures de travail améliore-t-elle à la fois la qualité et la sécurité en production ?",
        options: [
          "La standardisation n'a aucun lien avec la qualité ou la sécurité",
          "Elle réduit la variabilité des pratiques individuelles, limitant les erreurs et incidents liés à des méthodes de travail improvisées ou incohérentes",
          "Elle ralentit toujours inutilement la production",
          "Elle ne concerne que les tâches les plus simples",
          "Elle élimine complètement tout besoin de formation",
        ],
        correctIndex: 1,
        explanation:
          "Des procédures standardisées réduisent les écarts de pratique entre opérateurs, limitant les erreurs et incidents liés à l'improvisation -- un principe central de la qualité industrielle.",
      },
      {
        question: "Qu'est-ce que l'\"industrie 4.0\" désigne concrètement ?",
        options: [
          "Le quatrième site de production d'une entreprise",
          "L'intégration des technologies numériques (capteurs connectés, données en temps réel, automatisation avancée) dans les processus industriels",
          "Une norme de sécurité incendie",
          "Un type de contrat de travail industriel",
          "Une certification qualité obligatoire",
        ],
        correctIndex: 1,
        explanation:
          "L'industrie 4.0 désigne la transformation numérique de l'industrie : capteurs connectés, données temps réel, automatisation intelligente pour optimiser la production.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi l'automatisation excessive d'une ligne de production peut-elle réduire sa flexibilité face à des variations de la demande ?",
        options: [
          "L'automatisation n'a jamais d'impact sur la flexibilité",
          "Des équipements très spécialisés et automatisés peuvent être coûteux et lents à reconfigurer pour un changement de produit ou de volume, contrairement à des postes plus flexibles",
          "Plus une ligne est automatisée, plus elle est toujours flexible",
          "Ce compromis ne concerne que les très petites usines",
          "La flexibilité de production n'a aucun lien avec le niveau d'automatisation",
        ],
        correctIndex: 1,
        explanation:
          "Une automatisation très poussée optimise souvent un seul type de production, au prix d'une reconfiguration coûteuse et lente en cas de changement -- un vrai compromis entre efficacité et flexibilité à arbitrer.",
      },
      {
        question: "Pourquoi la méthode \"Six Sigma\" cherche-t-elle à réduire la variabilité d'un processus, et pas seulement son taux moyen de défauts ?",
        options: [
          "La variabilité n'a aucun impact sur la qualité perçue",
          "Un processus avec une moyenne correcte mais une forte variabilité peut quand même produire des défauts significatifs de façon imprévisible -- la maîtrise de la variabilité est clé pour la fiabilité",
          "Seule la moyenne compte réellement en pratique",
          "Six Sigma ne concerne que l'industrie pharmaceutique",
          "Réduire la variabilité augmente toujours les coûts sans bénéfice",
        ],
        correctIndex: 1,
        explanation:
          "Un processus peut avoir une bonne moyenne tout en produisant des défauts imprévisibles à cause d'une forte variabilité -- Six Sigma vise à réduire cette dispersion pour une qualité prévisible et fiable.",
      },
      {
        question: "Pourquoi un défaut de conception détecté tardivement (en production, voire chez le client) coûte-t-il exponentiellement plus cher à corriger qu'un défaut détecté en phase de conception ?",
        options: [
          "Le coût de correction est toujours identique quelle que soit l'étape",
          "Plus un défaut est détecté tard, plus il implique de reprises, de rappels et de conséquences en cascade sur des étapes déjà validées, alors qu'en conception il ne coûte qu'une modification de plan",
          "Un défaut détecté tard est toujours moins grave",
          "Ce phénomène ne concerne que l'industrie automobile",
          "Le coût de correction ne dépend jamais du moment de la détection",
        ],
        correctIndex: 1,
        explanation:
          "C'est la \"règle du 1-10-100\" bien connue en gestion de la qualité : un défaut coûte environ 10 fois plus cher à corriger en production qu'en conception, et 100 fois plus une fois chez le client -- d'où l'importance de la détection précoce.",
      },
      {
        question: "Pourquoi la sous-traitance d'un composant critique à un fournisseur unique peut-elle exposer une chaîne de production à un risque stratégique majeur ?",
        options: [
          "Il n'y a jamais de risque à dépendre d'un seul fournisseur",
          "En cas de défaillance de ce fournisseur (faillite, incident, rupture géopolitique), toute la production peut s'arrêter faute d'alternative rapide",
          "Ce risque ne concerne que les très petites entreprises",
          "Un fournisseur unique garantit toujours une meilleure qualité",
          "La diversification des fournisseurs n'a jamais d'intérêt stratégique",
        ],
        correctIndex: 1,
        explanation:
          "Une dépendance à un fournisseur unique pour un composant critique expose à un risque de rupture totale de production en cas de défaillance -- un arbitrage coût/résilience à évaluer consciemment dans la stratégie industrielle.",
      },
      {
        question: "Pourquoi l'intégration de capteurs IoT en maintenance prédictive change-t-elle fondamentalement l'approche par rapport à la maintenance préventive classique ?",
        options: [
          "Il n'y a aucune différence entre les deux approches",
          "La maintenance prédictive se base sur l'état réel de l'équipement en temps réel plutôt que sur un calendrier fixe, permettant d'intervenir précisément avant la panne sans maintenance inutile prématurée",
          "La maintenance prédictive élimine complètement le besoin d'intervention humaine",
          "Cette technologie ne concerne que l'aéronautique",
          "La maintenance préventive classique est toujours plus efficace",
        ],
        correctIndex: 1,
        explanation:
          "La maintenance préventive classique intervient sur un calendrier fixe (parfois trop tôt, parfois trop tard), tandis que la maintenance prédictive s'appuie sur l'état réel de l'équipement pour intervenir au moment optimal -- un vrai changement de paradigme industriel.",
      },
      {
        question: "Pourquoi la conformité réglementaire (normes environnementales, sécurité) d'un site industriel doit-elle être anticipée dès la conception, et pas gérée après coup ?",
        options: [
          "Les normes réglementaires n'évoluent jamais dans l'industrie",
          "Adapter une installation existante pour se conformer à une nouvelle norme est généralement beaucoup plus coûteux et complexe que de l'intégrer dès la conception initiale",
          "La conformité réglementaire n'a aucun coût réel pour l'entreprise",
          "Cette anticipation ne concerne que les très grandes usines",
          "Il est toujours plus simple de corriger après coup qu'en amont",
        ],
        correctIndex: 1,
        explanation:
          "Modifier une installation existante pour se conformer à une nouvelle réglementation coûte généralement bien plus cher (arrêt de production, reconstruction partielle) que d'anticiper ces contraintes dès la phase de conception.",
      },
      {
        question: "Pourquoi l'amélioration continue (kaizen) repose-t-elle sur l'implication des opérateurs de terrain, et pas uniquement sur les ingénieurs méthodes ?",
        options: [
          "Les opérateurs de terrain n'ont jamais d'expertise utile à apporter",
          "Les opérateurs, au contact quotidien du processus réel, identifient souvent des inefficacités ou dangers invisibles depuis un bureau d'études, une source d'amélioration précieuse et continue",
          "Seuls les ingénieurs méthodes ont la légitimité de proposer des améliorations",
          "Le kaizen ne concerne que les décisions de très haut niveau",
          "L'implication des opérateurs ralentit toujours le processus d'amélioration",
        ],
        correctIndex: 1,
        explanation:
          "Les opérateurs de terrain, confrontés quotidiennement à la réalité du processus, repèrent souvent des inefficacités invisibles depuis un bureau d'études -- le kaizen valorise justement cette expertise de terrain comme moteur d'amélioration continue.",
      },
    ],
  },
};
