// Sixième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_6: InterviewDomain[] = [
  { id: "automobile", label: "Automobile / Mécanique" },
  { id: "notariat", label: "Notariat / Droit immobilier" },
  { id: "hotellerie", label: "Hôtellerie" },
  { id: "audiovisuel", label: "Audiovisuel / Cinéma" },
  { id: "grande_distribution", label: "Grande distribution / Retail" },
];

export const EXTRA_BANK_6: Bank = {
  automobile: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'automobile ?",
        options: [
          "J'aime comprendre comment un véhicule fonctionne et résoudre des pannes concrètes",
          "Parce que c'est un métier qui recrute, sans intérêt particulier pour la mécanique",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que mes parents travaillent dans ce secteur",
          "Parce que je n'aime pas les métiers de bureau, sans autre raison",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la compréhension technique et à la résolution de pannes rassure sur ton engagement réel dans un métier très concret.",
      },
      {
        question: "Qu'est-ce qu'un moteur thermique, en une phrase simple ?",
        options: [
          "Un moteur qui fonctionne uniquement à l'électricité",
          "Un moteur qui transforme l'énergie d'un carburant (essence, diesel) en mouvement par combustion",
          "Un moteur qui chauffe l'habitacle du véhicule",
          "Un moteur qui ne sert qu'à freiner",
          "Un moteur utilisé uniquement sur les poids lourds",
        ],
        correctIndex: 1,
        explanation:
          "Le moteur thermique convertit l'énergie chimique du carburant en énergie mécanique via une combustion interne -- la base à connaître avant tout entretien technique.",
      },
      {
        question: "Que signifie faire une \"vidange\" sur un véhicule ?",
        options: [
          "Remplacer les pneus",
          "Remplacer l'huile moteur usagée par de l'huile neuve",
          "Vider le réservoir de carburant",
          "Nettoyer l'intérieur du véhicule",
          "Recharger la batterie",
        ],
        correctIndex: 1,
        explanation:
          "La vidange consiste à remplacer l'huile moteur, qui se dégrade avec le temps et l'usage -- un entretien de base essentiel à la durée de vie du moteur.",
      },
      {
        question: "Tu constates une pièce défectueuse sur un véhicule qui n'était pas dans la demande initiale du client. Que fais-tu ?",
        options: [
          "Je répare sans rien dire pour ne pas perdre de temps",
          "J'informe le client de la découverte et lui laisse le choix de faire réparer ou non",
          "J'ignore le problème, ce n'est pas ma demande",
          "Je répare et facture sans prévenir",
          "Je dis au client que tout va bien pour le rassurer",
        ],
        correctIndex: 1,
        explanation:
          "La transparence avec le client, même sur un point non demandé initialement, est essentielle à la confiance -- jamais réparer ou facturer sans son accord.",
      },
      {
        question: "Qu'est-ce qu'un \"diagnostic\" en mécanique automobile ?",
        options: [
          "Le prix final de la réparation",
          "L'étape qui consiste à identifier précisément la cause d'une panne avant d'intervenir",
          "Le nettoyage du véhicule",
          "La revente du véhicule",
          "Le remplacement systématique de toutes les pièces",
        ],
        correctIndex: 1,
        explanation:
          "Le diagnostic précède toute réparation : sans identifier la vraie cause, on risque de changer des pièces inutilement sans résoudre le problème.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence principale entre un moteur essence et un moteur diesel ?",
        options: [
          "Aucune différence, ce sont des synonymes",
          "Le diesel s'enflamme par compression, l'essence par une étincelle (bougie d'allumage)",
          "Le diesel ne peut pas être utilisé sur une voiture",
          "L'essence est toujours plus puissante que le diesel",
          "Le diesel ne pollue jamais",
        ],
        correctIndex: 1,
        explanation:
          "Le moteur diesel utilise l'auto-inflammation par forte compression, tandis que le moteur essence a besoin d'une étincelle -- une différence fondamentale de fonctionnement.",
      },
      {
        question: "Un client se plaint d'un bruit inhabituel au freinage. Quelle est ta démarche ?",
        options: [
          "Dire que c'est normal sans vérifier",
          "Écouter précisément le type de bruit, dans quelles conditions il survient, puis inspecter les plaquettes et disques",
          "Remplacer directement tout le système de freinage sans diagnostic",
          "Ignorer la remarque si le véhicule roule encore",
          "Renvoyer le client chez un concurrent",
        ],
        correctIndex: 1,
        explanation:
          "Un bruit au freinage a des causes précises (plaquettes usées, disque voilé...) : un bon diagnostic évite de remplacer des pièces inutilement ou de laisser un risque de sécurité.",
      },
      {
        question: "Qu'est-ce qui différencie un véhicule hybride d'un véhicule 100% électrique ?",
        options: [
          "Aucune différence, ce sont les mêmes véhicules",
          "L'hybride combine un moteur thermique et un moteur électrique, l'électrique n'a qu'un moteur électrique alimenté par batterie",
          "L'électrique a toujours un réservoir d'essence de secours",
          "L'hybride ne peut jamais rouler en mode électrique seul",
          "L'électrique est toujours plus lent que l'hybride",
        ],
        correctIndex: 1,
        explanation:
          "Le véhicule hybride associe les deux motorisations pour optimiser la consommation, tandis que le tout-électrique repose uniquement sur une batterie et un moteur électrique.",
      },
      {
        question: "Pourquoi le contrôle du niveau et de la pression des pneus est-il une vérification de sécurité essentielle ?",
        options: [
          "Ça n'a aucun impact sur la sécurité",
          "Une pression incorrecte affecte l'adhérence, la distance de freinage et l'usure du pneu",
          "Ça ne concerne que le confort de conduite",
          "Ça n'est utile qu'en cas de contrôle technique",
          "Ça ne change rien à la consommation de carburant",
        ],
        correctIndex: 1,
        explanation:
          "Une pression de pneu incorrecte dégrade directement l'adhérence et rallonge la distance de freinage -- un point de sécurité trop souvent négligé par les usagers.",
      },
      {
        question: "Que dois-tu faire si tu n'es pas sûr(e) à 100% de la cause d'une panne avant de commencer une réparation ?",
        options: [
          "Réparer quand même en espérant que ça marche",
          "Poursuivre le diagnostic (tests complémentaires, valise de diagnostic) avant d'intervenir",
          "Facturer le client pour une réparation incertaine",
          "Refuser toute réparation définitivement",
          "Demander au client de deviner la panne à ta place",
        ],
        correctIndex: 1,
        explanation:
          "Intervenir sans certitude sur la cause réelle risque de ne pas résoudre le problème et de faire perdre du temps et de l'argent au client -- mieux vaut approfondir le diagnostic.",
      },
      {
        question: "Pourquoi la traçabilité des pièces remplacées (facture, référence) est-elle importante dans un garage ?",
        options: [
          "Ce n'est qu'une formalité administrative sans utilité réelle",
          "Elle permet de garantir la pièce, de suivre l'historique du véhicule et de répondre en cas de litige ou de rappel constructeur",
          "Elle ne sert qu'à faire payer plus cher le client",
          "Elle est obligatoire uniquement pour les véhicules neufs",
          "Elle n'a aucun lien avec la garantie",
        ],
        correctIndex: 1,
        explanation:
          "La traçabilité protège le client (garantie, rappel constructeur) et le garage (preuve en cas de litige) -- une rigueur administrative qui a une vraie utilité pratique.",
      },
    ],
    difficile: [
      {
        question: "Un véhicule revient plusieurs fois pour la même panne malgré des réparations successives. Quelle est la démarche la plus rigoureuse ?",
        options: [
          "Continuer à remplacer des pièces au hasard jusqu'à ce que ça marche",
          "Reprendre le diagnostic depuis le début en questionnant les hypothèses précédentes, éventuellement avec un collègue ou un outil plus poussé",
          "Dire au client que le véhicule est irréparable",
          "Facturer une nouvelle réparation sans creuser davantage",
          "Ignorer les retours précédents et sous-traiter à un autre garage sans transmission d'information",
        ],
        correctIndex: 1,
        explanation:
          "Une panne récurrente malgré des réparations signale une hypothèse de diagnostic erronée en amont -- il faut la remettre en question plutôt que de continuer à remplacer des pièces au hasard.",
      },
      {
        question: "Pourquoi le respect des normes d'émissions (ex: Crit'Air, normes Euro) est-il devenu un enjeu technique majeur pour les garages ?",
        options: [
          "Ce n'est qu'une contrainte administrative sans impact technique",
          "Cela impose des réglages précis et des vérifications spécifiques (dépollution, EGR, FAP) que le garage doit maîtriser pour rester conforme",
          "Cela ne concerne que les véhicules neufs jamais entretenus en garage",
          "Cela n'a aucun lien avec l'entretien courant",
          "Cela s'applique uniquement aux poids lourds",
        ],
        correctIndex: 1,
        explanation:
          "Les systèmes de dépollution (FAP, EGR...) demandent une expertise technique spécifique pour rester conformes aux normes -- un vrai enjeu de compétence pour un garage moderne.",
      },
      {
        question: "Un client insiste pour qu'on réalise une réparation que tu juges inutile ou dangereuse pour le véhicule. Quelle attitude professionnelle adopter ?",
        options: [
          "Faire ce que demande le client sans discuter, il paie",
          "Expliquer clairement les risques techniques et refuser d'effectuer une réparation dangereuse, en proposant une alternative sûre",
          "Refuser de servir le client sans explication",
          "Faire la réparation en cachant les risques au client",
          "Renvoyer le client sans aucune explication",
        ],
        correctIndex: 1,
        explanation:
          "La responsabilité professionnelle et la sécurité priment sur la simple satisfaction immédiate du client -- il faut expliquer et orienter, jamais exécuter une réparation dangereuse en silence.",
      },
      {
        question: "Pourquoi le couple de serrage (torque) est-il une donnée technique à respecter scrupuleusement, notamment sur les éléments de sécurité ?",
        options: [
          "Le couple de serrage n'a aucune importance réelle",
          "Un serrage trop faible risque un desserrage en roulant, un serrage trop fort peut endommager la pièce ou le filetage -- les deux sont dangereux",
          "Plus on serre fort, plus c'est toujours sûr",
          "Le couple de serrage ne concerne que les pièces esthétiques",
          "Cette donnée n'est utile que pour les compétitions automobiles",
        ],
        correctIndex: 1,
        explanation:
          "Un couple de serrage incorrect (trop faible ou trop fort) peut avoir des conséquences graves sur des éléments de sécurité comme les roues ou les freins -- une rigueur non négociable.",
      },
      {
        question: "Un apprenti commet une erreur de manipulation qui endommage légèrement un véhicule client. Comment gérer la situation en tant que responsable ?",
        options: [
          "Le sanctionner immédiatement sans explication pédagogique",
          "Analyser la cause de l'erreur avec lui, corriger le dommage, informer le client avec transparence, et ajuster l'encadrement pour éviter que ça se reproduise",
          "Cacher l'erreur au client pour éviter les problèmes",
          "Ignorer l'incident s'il n'est pas visible",
          "Facturer la réparation de l'erreur au client sans le prévenir",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur d'apprenti se traite avec pédagogie en interne et transparence totale envers le client -- cacher un dommage expose le garage à un risque de confiance et juridique bien plus grave.",
      },
      {
        question: "Pourquoi l'essor des véhicules électriques change-t-il durablement les compétences attendues dans un garage ?",
        options: [
          "Cela ne change rien, la mécanique reste identique",
          "Cela demande de nouvelles compétences en électricité haute tension, gestion de batterie et habilitations de sécurité spécifiques",
          "Les véhicules électriques ne nécessitent jamais d'entretien",
          "Cela concerne uniquement les constructeurs, jamais les garages indépendants",
          "Cela ne touche que la partie carrosserie",
        ],
        correctIndex: 1,
        explanation:
          "Travailler sur un véhicule électrique implique des risques électriques spécifiques (haute tension) nécessitant des habilitations dédiées -- une vraie évolution du métier à anticiper.",
      },
      {
        question: "Comment un garage peut-il objectivement mesurer sa fiabilité technique dans le temps, au-delà du ressenti des clients ?",
        options: [
          "Il est impossible de mesurer objectivement la fiabilité d'un garage",
          "En suivant des indicateurs comme le taux de retour pour une même panne, le respect des délais annoncés et les résultats de contrôle technique après intervention",
          "Uniquement en comptant le nombre de véhicules traités par jour",
          "En se basant uniquement sur le chiffre d'affaires généré",
          "La fiabilité ne dépend jamais du travail réalisé en atelier",
        ],
        correctIndex: 1,
        explanation:
          "Le taux de retour pour la même panne est un indicateur clé et souvent négligé : il révèle la qualité réelle du diagnostic et de la réparation, au-delà du seul ressenti client.",
      },
    ],
  },

  notariat: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le notariat ?",
        options: [
          "J'aime le cadre juridique rigoureux et le fait de sécuriser des actes importants pour les gens",
          "Parce que ça a l'air un métier tranquille et sans responsabilité",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le seul secteur qui recrutait près de chez moi",
          "Parce que je n'aime pas le contact avec le public",
        ],
        correctIndex: 0,
        explanation:
          "Le notariat implique une vraie responsabilité juridique sur des actes engageants (vente, succession...) : une motivation liée à la rigueur et à la sécurisation juridique est bien plus solide qu'une idée de facilité.",
      },
      {
        question: "Qu'est-ce qu'un notaire, en une phrase simple ?",
        options: [
          "Un avocat spécialisé en droit pénal",
          "Un officier public qui authentifie des actes juridiques (ventes, successions, contrats de mariage...)",
          "Un employé de banque",
          "Un juge de tribunal",
          "Un agent immobilier",
        ],
        correctIndex: 1,
        explanation:
          "Le notaire est un officier public délégué par l'État pour donner à certains actes une force juridique particulière (authenticité, date certaine, force exécutoire).",
      },
      {
        question: "Qu'est-ce qu'un \"acte authentique\" ?",
        options: [
          "Un simple brouillon de contrat",
          "Un document officiel rédigé et validé par un notaire, ayant une force juridique renforcée",
          "Un document rédigé uniquement à la main",
          "Un contrat signé entre deux particuliers sans notaire",
          "Un document dont l'original n'existe pas",
        ],
        correctIndex: 1,
        explanation:
          "L'acte authentique, rédigé par un notaire, a une valeur probante et exécutoire supérieure à un simple contrat sous seing privé -- une notion de base du métier.",
      },
      {
        question: "Un client te pose une question juridique à laquelle tu ne connais pas la réponse. Que fais-tu ?",
        options: [
          "Inventer une réponse pour paraître compétent(e)",
          "Dire honnêtement que tu vas vérifier avec le notaire ou dans la documentation, et revenir vers lui",
          "Changer immédiatement de sujet",
          "Rediriger le client vers un autre office sans explication",
          "Ne pas répondre du tout",
        ],
        correctIndex: 1,
        explanation:
          "En droit, une réponse inventée peut avoir des conséquences graves pour le client -- l'honnêteté et la vérification avant de répondre sont essentielles dans ce métier.",
      },
      {
        question: "Que signifie le mot \"succession\" dans un contexte notarial ?",
        options: [
          "Le renouvellement d'un contrat de travail",
          "La transmission du patrimoine d'une personne décédée à ses héritiers",
          "Une vente immobilière classique",
          "Un contrat de mariage",
          "Un prêt bancaire",
        ],
        correctIndex: 1,
        explanation:
          "La succession organise la transmission des biens d'une personne décédée -- un des domaines d'intervention centraux du notariat.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre un acte authentique et un acte sous seing privé ?",
        options: [
          "Aucune différence juridique",
          "L'acte authentique est rédigé par un officier public (notaire) et a une force probante renforcée, contrairement à l'acte sous seing privé signé entre particuliers",
          "L'acte sous seing privé est toujours plus fiable",
          "L'acte authentique ne concerne que les successions",
          "L'acte sous seing privé n'a jamais de valeur juridique",
        ],
        correctIndex: 1,
        explanation:
          "L'authenticité notariale confère à l'acte une force probante et exécutoire particulière, alors qu'un acte sous seing privé peut plus facilement être contesté en cas de litige.",
      },
      {
        question: "Un client veut signer rapidement un compromis de vente sans attendre certaines vérifications (diagnostics, urbanisme). Que dois-tu lui expliquer ?",
        options: [
          "Que ce n'est pas grave, on peut signer sans vérification",
          "Que ces vérifications protègent les deux parties et qu'un compromis signé trop vite peut créer des risques juridiques importants",
          "Qu'il faut signer immédiatement pour ne pas perdre l'acheteur",
          "Que les diagnostics ne servent à rien en pratique",
          "Qu'il vaut mieux annuler la vente immédiatement",
        ],
        correctIndex: 1,
        explanation:
          "Les vérifications préalables (diagnostics, situation d'urbanisme...) sécurisent la transaction pour l'acheteur comme pour le vendeur -- les précipiter expose à des litiges ultérieurs.",
      },
      {
        question: "Qu'est-ce que le \"délai de rétractation\" dans une vente immobilière ?",
        options: [
          "Le délai pour payer le notaire",
          "La période légale pendant laquelle l'acheteur peut annuler son engagement après la signature du compromis, sans justification ni pénalité",
          "Le délai pour déménager après la vente",
          "Le délai accordé uniquement au vendeur",
          "Un délai qui n'existe pas en droit français",
        ],
        correctIndex: 1,
        explanation:
          "La loi protège l'acheteur non professionnel avec un délai de rétractation de 10 jours après la signature du compromis, sans avoir à se justifier.",
      },
      {
        question: "Pourquoi la vérification de l'état civil et de la capacité juridique des parties est-elle une étape incontournable avant tout acte ?",
        options: [
          "Ce n'est qu'une formalité sans réelle importance",
          "Parce qu'un acte signé par une personne sans capacité juridique valide (mineur non représenté, tutelle non déclarée...) peut être annulé",
          "Elle ne concerne que les actes de succession",
          "Elle n'a aucun impact sur la validité de l'acte",
          "Elle est facultative si les parties se connaissent",
        ],
        correctIndex: 1,
        explanation:
          "Un acte signé par une personne sans la capacité juridique requise peut être frappé de nullité -- cette vérification protège la validité de l'acte dans la durée.",
      },
      {
        question: "Un héritier conteste le partage prévu dans une succession. Quelle est la démarche la plus appropriée pour le notaire ?",
        options: [
          "Imposer sa propre solution sans discussion",
          "Écouter les arguments de chaque partie, rappeler le cadre légal, et rechercher un accord amiable avant d'envisager une voie judiciaire",
          "Ignorer la contestation et signer l'acte quand même",
          "Prendre parti pour l'héritier le plus insistant",
          "Refuser de traiter le dossier définitivement",
        ],
        correctIndex: 1,
        explanation:
          "Le notaire joue souvent un rôle de conciliateur avant tout contentieux : rappeler le droit et chercher un accord amiable évite des procédures longues et coûteuses pour tous.",
      },
      {
        question: "Pourquoi la conservation des minutes (originaux des actes) pendant des décennies est-elle une responsabilité spécifique du notariat ?",
        options: [
          "Ce n'est qu'une contrainte administrative sans réelle utilité",
          "Parce que ces documents peuvent être nécessaires des décennies plus tard (succession, litige de propriété) et doivent rester incontestables",
          "Les minutes ne sont conservées que quelques mois",
          "Cette conservation ne concerne que les actes de vente",
          "N'importe qui peut consulter librement les minutes sans autorisation",
        ],
        correctIndex: 1,
        explanation:
          "Un acte notarié peut être invoqué des décennies après sa signature (succession, bornage...) -- la conservation rigoureuse des minutes garantit qu'une preuve fiable reste disponible dans le temps.",
      },
    ],
    difficile: [
      {
        question: "Un client insiste pour dissimuler une partie du prix de vente réel dans l'acte (dessous-de-table) afin de réduire les frais. Quelle est l'attitude professionnelle attendue ?",
        options: [
          "Accepter discrètement pour satisfaire le client",
          "Refuser fermement : c'est une fraude fiscale qui engage la responsabilité pénale du notaire et invalide en partie l'acte",
          "Accepter uniquement si le montant caché est faible",
          "Laisser les parties s'arranger entre elles sans intervenir",
          "Proposer soi-même cette solution pour fidéliser le client",
        ],
        correctIndex: 1,
        explanation:
          "La dissimulation de prix est une fraude qui engage pénalement toutes les parties, notaire inclus s'il en a connaissance -- un refus ferme et sans exception est la seule réponse professionnelle.",
      },
      {
        question: "Pourquoi la question de la \"clause de réserve d'usufruit\" est-elle particulièrement sensible dans une transmission de patrimoine ?",
        options: [
          "Elle n'a aucun impact réel sur la transmission",
          "Elle permet au donateur de continuer à jouir du bien tout en le transmettant, mais elle doit être rédigée avec précision pour éviter des conflits ultérieurs entre héritiers",
          "Elle concerne uniquement les transmissions d'entreprise",
          "Elle est automatiquement annulée au décès du donateur",
          "Elle empêche toute transmission future du bien",
        ],
        correctIndex: 1,
        explanation:
          "L'usufruit avec réserve permet une transmission anticipée tout en conservant l'usage du bien, mais une rédaction imprécise peut générer des conflits d'interprétation entre héritiers des décennies plus tard.",
      },
      {
        question: "Comment concilier le devoir de conseil du notaire envers toutes les parties dans une vente, alors que ses intérêts (honoraires) peuvent sembler liés à la conclusion de la vente ?",
        options: [
          "Le devoir de conseil n'existe pas réellement dans la pratique",
          "Le notaire, officier public impartial, doit conseiller équitablement acheteur et vendeur même si cela retarde ou remet en cause la vente",
          "Le notaire doit toujours privilégier l'intérêt de celui qui le rémunère le plus",
          "Le devoir de conseil ne s'applique qu'à l'acheteur",
          "Il est normal de minimiser certains risques pour accélérer la signature",
        ],
        correctIndex: 1,
        explanation:
          "Contrairement à un avocat qui défend une partie, le notaire est un officier public impartial : son devoir de conseil s'applique à toutes les parties, même au prix de ralentir une transaction.",
      },
      {
        question: "Un acte de vente comporte une erreur matérielle découverte après signature (surface erronée, par exemple). Quelle est la procédure rigoureuse à suivre ?",
        options: [
          "Ignorer l'erreur si elle semble mineure",
          "Analyser l'impact juridique de l'erreur et procéder si besoin à un acte rectificatif en informant toutes les parties concernées",
          "Modifier discrètement l'acte sans en informer personne",
          "Annuler systématiquement la vente entière",
          "Laisser les parties régler le problème seules entre elles",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur matérielle, même mineure, doit être corrigée par une procédure formelle et transparente (acte rectificatif) -- jamais modifiée en catimini, ce qui remettrait en cause la valeur probante de l'acte.",
      },
      {
        question: "Pourquoi la digitalisation des actes notariés (acte authentique électronique) pose-t-elle des enjeux de sécurité spécifiques ?",
        options: [
          "Elle ne pose aucun enjeu particulier, c'est identique au papier",
          "Elle nécessite de garantir l'identité des signataires, l'intégrité du document et sa conservation sécurisée dans le temps, avec des outils cryptographiques dédiés",
          "Elle supprime totalement le besoin de vérification d'identité",
          "Elle ne concerne que les actes de faible valeur",
          "Elle rend les actes notariés moins fiables juridiquement",
        ],
        correctIndex: 1,
        explanation:
          "L'acte authentique électronique doit offrir les mêmes garanties d'authenticité et de conservation que le papier, ce qui impose des dispositifs de signature électronique et d'archivage sécurisé rigoureux.",
      },
      {
        question: "Un office notarial constate une hausse des tentatives de fraude (usurpation d'identité, faux documents) lors des ventes immobilières. Quelle réponse structurelle est la plus appropriée ?",
        options: [
          "Ignorer le phénomène tant qu'aucune fraude n'a abouti",
          "Renforcer systématiquement les procédures de vérification d'identité et de provenance des fonds, et former les équipes à détecter les signaux d'alerte",
          "Refuser désormais toute nouvelle transaction par principe de précaution",
          "Reporter l'entière responsabilité sur les banques impliquées",
          "Traiter chaque dossier suspect au cas par cas sans procédure formalisée",
        ],
        correctIndex: 1,
        explanation:
          "Face à une fraude en hausse, une réponse structurelle (procédures renforcées, formation) protège durablement l'office plutôt que des réactions ponctuelles au cas par cas.",
      },
      {
        question: "Pourquoi le secret professionnel du notaire peut-il entrer en tension avec certaines obligations de déclaration (ex: lutte anti-blanchiment) ?",
        options: [
          "Ces deux obligations n'existent jamais en même temps",
          "Le notaire doit signaler certaines opérations suspectes (TRACFIN) même si cela semble contredire son devoir de discrétion habituel envers son client",
          "Le secret professionnel prime toujours sur toute autre obligation légale",
          "La lutte anti-blanchiment ne concerne pas le notariat",
          "Le notaire peut choisir librement de signaler ou non selon son jugement personnel",
        ],
        correctIndex: 1,
        explanation:
          "La loi impose au notaire de déclarer certaines opérations suspectes à TRACFIN, une obligation légale qui prime sur le secret professionnel dans ce cadre précis -- un point de tension réel du métier à bien comprendre.",
      },
    ],
  },

  hotellerie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en hôtellerie ?",
        options: [
          "J'aime créer une expérience agréable et prendre soin des clients pendant leur séjour",
          "Parce que ça a l'air un métier facile et sans contraintes horaires",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que je veux juste voyager gratuitement",
          "Parce que c'est le seul secteur qui recrutait",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation centrée sur l'expérience client et le soin apporté à l'accueil montre une vraie compréhension du métier, plus qu'une idée de facilité ou d'avantages personnels.",
      },
      {
        question: "Qu'est-ce que le \"check-in\" dans un hôtel ?",
        options: [
          "Le départ du client",
          "L'arrivée et l'enregistrement du client à son arrivée dans l'établissement",
          "Le paiement final de la facture",
          "Le ménage de la chambre",
          "La réservation en ligne",
        ],
        correctIndex: 1,
        explanation:
          "Le check-in désigne l'accueil et l'enregistrement du client à son arrivée -- un moment clé qui donne le ton de tout le séjour.",
      },
      {
        question: "Un client se présente à la réception alors que sa chambre n'est pas encore prête. Quelle est la meilleure réaction ?",
        options: [
          "Le laisser attendre sans aucune explication",
          "L'informer avec courtoisie du délai, lui proposer de patienter dans un espace confortable ou de déposer ses bagages",
          "Lui dire de revenir plus tard sans autre proposition",
          "Annuler sa réservation",
          "Le faire attendre debout sans aucune information",
        ],
        correctIndex: 1,
        explanation:
          "Une communication claire et une solution concrète (espace d'attente, dépôt de bagages) transforment un imprévu en expérience acceptable, voire positive, pour le client.",
      },
      {
        question: "Qu'est-ce que le \"taux d'occupation\" d'un hôtel ?",
        options: [
          "Le nombre d'employés présents",
          "Le pourcentage de chambres occupées par rapport au nombre total de chambres disponibles",
          "Le prix moyen d'une chambre",
          "Le nombre d'étoiles de l'hôtel",
          "La surface totale de l'établissement",
        ],
        correctIndex: 1,
        explanation:
          "Le taux d'occupation est un indicateur clé de la performance commerciale d'un hôtel, calculé en divisant le nombre de chambres occupées par le nombre total de chambres disponibles.",
      },
      {
        question: "Pourquoi le sourire et l'attitude accueillante sont-ils particulièrement importants en hôtellerie ?",
        options: [
          "Ils n'ont aucun impact réel sur la satisfaction client",
          "Parce qu'ils font partie intégrante de l'expérience vécue par le client, autant que la qualité de la chambre elle-même",
          "Ils ne concernent que le personnel de restauration",
          "Ils ne sont utiles que pour la clientèle internationale",
          "Ils sont secondaires par rapport au prix pratiqué",
        ],
        correctIndex: 1,
        explanation:
          "En hôtellerie, l'expérience humaine (accueil, disponibilité) fait souvent la différence dans la satisfaction et la fidélisation du client, au même titre que les prestations matérielles.",
      },
    ],
    medium: [
      {
        question: "Que signifie le terme \"overbooking\" en hôtellerie ?",
        options: [
          "Le fait de réserver une chambre très à l'avance",
          "Le fait d'accepter plus de réservations que de chambres disponibles, en anticipant certaines annulations",
          "Une chambre trop grande pour le nombre de clients",
          "Un client qui reste plus longtemps que prévu",
          "Une réservation annulée par le client",
        ],
        correctIndex: 1,
        explanation:
          "L'overbooking est une pratique volontaire qui vise à compenser statistiquement les annulations de dernière minute, mais qui comporte un risque de devoir gérer un client sans chambre disponible.",
      },
      {
        question: "Un client mécontent laisse un avis très négatif en ligne après son séjour. Quelle est la réponse la plus professionnelle ?",
        options: [
          "Ignorer l'avis, ça ne sert à rien de répondre",
          "Répondre calmement, reconnaître le problème si justifié, et proposer une solution ou des excuses sincères publiquement",
          "Répondre de façon agressive pour défendre l'hôtel",
          "Supprimer l'avis sans réponse",
          "Accuser le client de mentir publiquement",
        ],
        correctIndex: 1,
        explanation:
          "Une réponse posée et constructive à un avis négatif rassure les futurs clients sur le sérieux de l'établissement -- l'agressivité ou le silence donnent une bien moins bonne image.",
      },
      {
        question: "Pourquoi la coordination entre les différents services (réception, étages, restauration) est-elle cruciale en hôtellerie ?",
        options: [
          "Ce n'est pas vraiment nécessaire, chaque service travaille indépendamment",
          "Parce qu'un défaut de communication entre services (ex: chambre non signalée comme prête) dégrade directement l'expérience client",
          "La coordination ne concerne que les grands hôtels",
          "Elle n'a d'impact que sur les coûts internes",
          "Elle ne concerne que le personnel de direction",
        ],
        correctIndex: 1,
        explanation:
          "L'expérience client dépend d'une chaîne de services coordonnés : un manque de communication entre équipes se traduit immédiatement par un problème visible pour le client.",
      },
      {
        question: "Quelle est la différence entre la démarche \"revenue management\" et une simple fixation de prix fixe ?",
        options: [
          "Aucune différence, ce sont des synonymes",
          "Le revenue management ajuste les prix dynamiquement selon la demande, la saison et le taux d'occupation pour optimiser le chiffre d'affaires",
          "Le revenue management concerne uniquement les hôtels de luxe",
          "Un prix fixe est toujours plus rentable qu'un prix ajusté",
          "Le revenue management ne s'applique qu'à la restauration",
        ],
        correctIndex: 1,
        explanation:
          "Le revenue management consiste à faire varier les prix selon la demande prévisionnelle pour maximiser le revenu par chambre disponible, une pratique centrale dans le pilotage d'un hôtel moderne.",
      },
      {
        question: "Un groupe de clients arrive en avance alors que l'hôtel gère déjà un imprévu (fuite d'eau dans une aile). Comment prioriser ?",
        options: [
          "Ignorer l'incident technique pour se concentrer uniquement sur l'accueil",
          "Gérer l'urgence technique avec l'équipe technique tout en informant honnêtement le groupe du léger délai possible",
          "Annuler l'accueil du groupe sans explication",
          "Faire attendre le groupe sans aucune communication",
          "Reporter la gestion de la fuite d'eau à plus tard sans en informer personne",
        ],
        correctIndex: 1,
        explanation:
          "Gérer un incident technique en parallèle d'un accueil demande de prioriser la sécurité tout en communiquant de façon transparente avec les clients concernés par un éventuel délai.",
      },
      {
        question: "Pourquoi la formation du personnel aux langues étrangères est-elle un enjeu stratégique en hôtellerie ?",
        options: [
          "Ce n'est utile que pour les hôtels situés à l'étranger",
          "Parce qu'une large part de la clientèle peut être internationale, et la barrière de la langue dégrade directement la qualité perçue du service",
          "Cela n'a aucun impact sur la satisfaction client",
          "Seul l'anglais est utile, aucune autre langue n'apporte de valeur",
          "La formation aux langues ne concerne que la direction",
        ],
        correctIndex: 1,
        explanation:
          "Une clientèle internationale bien accueillie dans sa langue, même partiellement, perçoit un service de meilleure qualité -- un vrai levier de différenciation en hôtellerie.",
      },
    ],
    difficile: [
      {
        question: "Un client VIP fidèle demande un traitement de faveur qui déroge aux règles internes de l'établissement (surclassement gratuit répété). Comment gérer la situation durablement ?",
        options: [
          "Accepter systématiquement pour ne jamais le contrarier",
          "Évaluer l'impact sur la rentabilité et l'équité envers les autres clients, et proposer un geste raisonnable et cadré plutôt qu'un précédent systématique",
          "Refuser catégoriquement sans aucune explication",
          "Laisser chaque employé décider au cas par cas sans cohérence",
          "Informer publiquement les autres clients du traitement accordé",
        ],
        correctIndex: 1,
        explanation:
          "Céder systématiquement crée un précédent coûteux et potentiellement inéquitable envers les autres clients -- un geste ponctuel et cadré est plus soutenable qu'un automatisme.",
      },
      {
        question: "Pourquoi un taux d'occupation élevé n'est-il pas toujours synonyme de bonne santé financière pour un hôtel ?",
        options: [
          "C'est toujours synonyme de bonne santé financière, sans exception",
          "Un taux élevé obtenu par des prix cassés peut générer un revenu par chambre disponible (RevPAR) plus faible qu'un taux plus bas à prix optimisé",
          "Le taux d'occupation n'a aucun lien avec la rentabilité",
          "Un taux d'occupation élevé signifie toujours une hausse des prix",
          "La rentabilité ne dépend jamais du taux d'occupation",
        ],
        correctIndex: 1,
        explanation:
          "Remplir l'hôtel à prix cassés peut faire baisser le revenu par chambre disponible (RevPAR) malgré un bon taux d'occupation -- un indicateur à croiser avec le prix moyen, jamais isolé.",
      },
      {
        question: "Comment analyser une baisse progressive des avis clients sur la propreté alors qu'aucun changement de personnel n'a eu lieu ?",
        options: [
          "C'est forcément un hasard sans cause identifiable",
          "Investiguer les procédures de contrôle qualité, la charge de travail par chambre, et l'usure éventuelle du matériel ou mobilier",
          "Ignorer les avis, ils ne reflètent jamais la réalité",
          "Changer immédiatement tout le personnel d'étage",
          "Augmenter les prix pour compenser la perception négative",
        ],
        correctIndex: 1,
        explanation:
          "Une dégradation progressive sans changement de personnel pointe souvent vers un problème de procédure, de charge de travail ou d'usure matérielle -- des causes structurelles à investiguer avant de blâmer les équipes.",
      },
      {
        question: "Un hôtel envisage d'automatiser une partie de l'accueil (bornes de check-in). Quel est le principal risque à anticiper pour l'expérience client ?",
        options: [
          "Aucun risque, l'automatisation est toujours perçue positivement",
          "Une déshumanisation perçue du service pour une partie de la clientèle, notamment sur le haut de gamme où le contact humain fait partie de la valeur perçue",
          "L'automatisation supprime totalement le besoin de personnel",
          "Les bornes de check-in ne posent jamais de problème technique",
          "Cela n'a aucun impact sur le positionnement de l'établissement",
        ],
        correctIndex: 1,
        explanation:
          "Sur certains segments (luxe notamment), le contact humain fait partie intégrante de la valeur perçue -- une automatisation mal dosée peut dégrader l'expérience plutôt que la fluidifier.",
      },
      {
        question: "Pourquoi la gestion de la saisonnalité est-elle un enjeu stratégique majeur pour un hôtel, au-delà de la simple variation de fréquentation ?",
        options: [
          "La saisonnalité n'a aucun impact stratégique réel",
          "Elle implique de piloter les coûts fixes (personnel, énergie) sur toute l'année tout en maximisant le revenu sur les périodes de forte demande",
          "Elle ne concerne que les hôtels en bord de mer",
          "Il suffit de fermer l'établissement en basse saison, sans autre réflexion",
          "Elle n'a aucun lien avec la gestion des ressources humaines",
        ],
        correctIndex: 1,
        explanation:
          "La saisonnalité impose un vrai exercice d'équilibre entre coûts fixes constants et revenus fluctuants -- un pilotage fin (personnel saisonnier, tarification dynamique) est nécessaire pour rester rentable à l'année.",
      },
      {
        question: "Un client affirme avoir subi un préjudice (objet volé dans sa chambre) sans preuve formelle. Comment gérer la situation avec rigueur ?",
        options: [
          "Rembourser systématiquement sans aucune vérification",
          "Recueillir les faits précisément, vérifier les procédures de sécurité et d'accès, et traiter la réclamation selon un cadre défini (assurance, main courante) sans accuser ni nier d'emblée",
          "Nier immédiatement toute responsabilité de l'hôtel",
          "Ignorer la réclamation si elle n'est pas immédiatement prouvée",
          "Accuser publiquement le personnel sans enquête",
        ],
        correctIndex: 1,
        explanation:
          "Une réclamation sans preuve formelle demande une gestion factuelle et cadrée (vérification des accès, déclaration officielle) -- ni le déni immédiat ni l'indemnisation automatique ne sont des réponses rigoureuses.",
      },
      {
        question: "Pourquoi le \"parcours client\" complet (avant, pendant, après le séjour) est-il devenu plus stratégique que la seule qualité de la chambre ?",
        options: [
          "La qualité de la chambre reste le seul facteur qui compte réellement",
          "Parce que la satisfaction et la fidélisation dépendent de chaque point de contact (réservation, accueil, séjour, suivi après-vente), pas uniquement de la prestation matérielle",
          "Le parcours client ne concerne que la phase de réservation",
          "Cette approche n'a aucun impact sur les avis en ligne",
          "Le parcours après-séjour n'a aucune utilité commerciale",
        ],
        correctIndex: 1,
        explanation:
          "Chaque point de contact (avant, pendant, après) façonne la perception globale et la fidélisation -- une chambre irréprochable ne compense pas un parcours de réservation ou un suivi après-vente défaillant.",
      },
    ],
  },

  audiovisuel: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'audiovisuel ?",
        options: [
          "J'aime raconter des histoires en images et participer concrètement à la fabrication d'un contenu",
          "Parce que ça a l'air un métier glamour et facile",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que je veux juste rencontrer des célébrités",
          "Parce que c'est le seul secteur qui recrutait",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la narration et à la fabrication concrète d'un contenu montre une compréhension réaliste du métier, loin de l'image souvent glamourisée du secteur.",
      },
      {
        question: "Que désigne le terme \"montage\" en audiovisuel ?",
        options: [
          "L'écriture du scénario",
          "L'assemblage et l'organisation des rushs (images tournées) pour construire le film ou la vidéo finale",
          "Le tournage des scènes",
          "La diffusion du contenu final",
          "Le casting des acteurs",
        ],
        correctIndex: 1,
        explanation:
          "Le montage est l'étape de post-production où les images tournées (rushs) sont sélectionnées, coupées et assemblées pour construire le récit final.",
      },
      {
        question: "Qu'est-ce qu'un \"rush\" en tournage ?",
        options: [
          "Le scénario final validé",
          "Une prise de vue brute, non encore montée ni retouchée",
          "Le budget total du tournage",
          "La bande-annonce du film",
          "Le nom du réalisateur",
        ],
        correctIndex: 1,
        explanation:
          "Le rush désigne les images brutes filmées, avant tout travail de montage ou de retouche -- la matière première à partir de laquelle le monteur construit le film.",
      },
      {
        question: "Sur un tournage, tu remarques un problème technique (son de mauvaise qualité) après une prise. Que fais-tu ?",
        options: [
          "Ne rien dire pour ne pas ralentir le tournage",
          "Signaler immédiatement le problème à l'équipe technique avant de continuer",
          "Corriger le son toi-même sans en parler à personne",
          "Attendre la fin du tournage pour en parler",
          "Ignorer le problème, ça se réglera au montage",
        ],
        correctIndex: 1,
        explanation:
          "Un problème technique signalé immédiatement peut être corrigé sur le moment (reprise de la prise) -- attendre la post-production pour le découvrir coûte souvent bien plus cher à rattraper.",
      },
      {
        question: "Qu'est-ce qu'un \"storyboard\" ?",
        options: [
          "Le budget prévisionnel d'un tournage",
          "Une représentation visuelle, plan par plan, de ce qui sera filmé avant le tournage",
          "La liste des acteurs engagés",
          "Le planning de diffusion",
          "Le contrat des techniciens",
        ],
        correctIndex: 1,
        explanation:
          "Le storyboard permet de visualiser à l'avance la mise en scène plan par plan, un outil de préparation essentiel avant le tournage pour anticiper les besoins techniques.",
      },
    ],
    medium: [
      {
        question: "Quelle est la différence entre la pré-production et la post-production dans un projet audiovisuel ?",
        options: [
          "Aucune différence, ce sont des synonymes",
          "La pré-production regroupe la préparation avant le tournage (scénario, casting, repérages), la post-production regroupe le travail après le tournage (montage, étalonnage, son)",
          "La post-production concerne uniquement le budget",
          "La pré-production n'existe que pour le cinéma, jamais pour la vidéo web",
          "La post-production précède toujours le tournage",
        ],
        correctIndex: 1,
        explanation:
          "Un projet audiovisuel se structure en trois grandes phases : pré-production (préparation), production (tournage) et post-production (montage, effets, son) -- bien distinguer ces étapes est essentiel.",
      },
      {
        question: "Pourquoi la synchronisation son/image est-elle un point de vigilance technique important ?",
        options: [
          "Elle n'a aucun impact sur la qualité perçue",
          "Un décalage son/image, même léger, est immédiatement perçu par le spectateur et nuit fortement à l'expérience",
          "Elle ne concerne que les films en langue étrangère",
          "Elle se corrige automatiquement à la diffusion",
          "Elle n'est un problème que pour les tournages en extérieur",
        ],
        correctIndex: 1,
        explanation:
          "Le cerveau humain détecte très rapidement un décalage son/image, même de quelques dixièmes de seconde -- un défaut qui casse immédiatement l'immersion, à corriger avec rigueur en montage.",
      },
      {
        question: "Un client (annonceur) demande une modification de dernière minute qui remet en cause le montage final déjà validé. Comment réagir ?",
        options: [
          "Refuser catégoriquement toute modification",
          "Évaluer la faisabilité technique et l'impact sur le délai/budget, puis en discuter clairement avec le client avant d'agir",
          "Faire la modification sans en parler du budget ni du délai supplémentaire",
          "Ignorer la demande si elle arrive trop tard",
          "Accepter automatiquement sans évaluer l'impact",
        ],
        correctIndex: 1,
        explanation:
          "Une modification tardive a souvent un coût réel (temps, budget) qu'il faut clarifier avec le client avant d'agir, plutôt que d'accepter ou refuser sans discussion.",
      },
      {
        question: "Qu'est-ce que l'\"étalonnage\" en post-production vidéo ?",
        options: [
          "Le réglage du volume sonore",
          "Le travail sur les couleurs et la lumière de l'image pour lui donner une cohérence et une ambiance visuelle voulue",
          "Le choix de la musique de fond",
          "Le sous-titrage de la vidéo",
          "La compression du fichier final",
        ],
        correctIndex: 1,
        explanation:
          "L'étalonnage ajuste les couleurs et contrastes de l'image pour créer une cohérence visuelle et une ambiance particulière -- une étape clé de la post-production souvent sous-estimée.",
      },
      {
        question: "Pourquoi les droits d'auteur (musique, images d'archives) sont-ils un point de vigilance majeur en production audiovisuelle ?",
        options: [
          "Ils n'ont aucune conséquence légale réelle",
          "Utiliser un contenu protégé sans autorisation expose à des poursuites et peut bloquer la diffusion du projet fini",
          "Ils ne concernent que les productions internationales",
          "Ils ne s'appliquent jamais aux contenus diffusés sur internet",
          "Il suffit de citer la source pour être en règle",
        ],
        correctIndex: 1,
        explanation:
          "L'utilisation non autorisée de contenus protégés (musique, images) peut entraîner des poursuites et un retrait pur et simple du contenu diffusé -- un point à sécuriser dès la pré-production.",
      },
      {
        question: "Comment gérer une équipe de tournage lorsque la météo remet en cause le planning prévu en extérieur ?",
        options: [
          "Annuler définitivement le tournage",
          "Avoir anticipé un plan B (jours de repli, scènes intérieures alternatives) et communiquer rapidement le changement à toute l'équipe",
          "Tourner quand même en ignorant les conditions de sécurité",
          "Attendre sans rien décider jusqu'au dernier moment",
          "Reporter indéfiniment sans replanifier",
        ],
        correctIndex: 1,
        explanation:
          "Un tournage extérieur bien préparé anticipe les aléas météo avec un plan B concret -- l'absence d'anticipation coûte cher en temps et en budget quand l'imprévu survient.",
      },
    ],
    difficile: [
      {
        question: "Un réalisateur et un producteur sont en désaccord sur la direction artistique d'un projet, avec un budget déjà engagé. Comment arbitrer une telle situation ?",
        options: [
          "Le producteur a toujours raison puisqu'il détient le budget",
          "Recentrer la discussion sur les objectifs initiaux du projet (public visé, message) et trouver un compromis qui respecte à la fois la vision artistique et les contraintes budgétaires",
          "Le réalisateur a toujours raison puisqu'il est responsable de la création",
          "Arrêter le projet dès qu'un désaccord survient",
          "Laisser l'équipe technique trancher à la place des deux responsables",
        ],
        correctIndex: 1,
        explanation:
          "Un désaccord artistique/budgétaire se résout en revenant aux objectifs du projet plutôt qu'à un rapport de force hiérarchique -- vision créative et réalité budgétaire doivent être conciliées, pas opposées.",
      },
      {
        question: "Pourquoi le choix du format de diffusion (cinéma, streaming, réseaux sociaux) influence-t-il des décisions techniques dès le tournage ?",
        options: [
          "Le format de diffusion n'a aucune influence sur le tournage",
          "Il détermine des choix comme le cadrage (vertical/horizontal), la durée des plans, ou la qualité d'image requise, à anticiper avant le tournage",
          "Ces décisions ne se prennent qu'au montage, jamais avant",
          "Seul le budget final dépend du format de diffusion",
          "Le format de diffusion ne concerne que la musique utilisée",
        ],
        correctIndex: 1,
        explanation:
          "Un contenu pensé pour les réseaux sociaux (format vertical, plans courts) diffère fondamentalement d'un contenu cinéma -- ces choix techniques doivent être anticipés dès la pré-production, pas corrigés après coup.",
      },
      {
        question: "Une production dépasse significativement son budget en cours de tournage. Quelle démarche est la plus rigoureuse pour la gestion de production ?",
        options: [
          "Continuer sans rien changer en espérant que ça se régule",
          "Analyser précisément l'origine du dépassement, ajuster le planning ou le scope restant, et en informer immédiatement les parties prenantes concernées",
          "Cacher le dépassement jusqu'à la fin du tournage",
          "Arrêter immédiatement toute la production sans analyse",
          "Reporter le problème sur l'équipe technique sans investiguer",
        ],
        correctIndex: 1,
        explanation:
          "Un dépassement budgétaire doit être diagnostiqué et communiqué rapidement aux parties prenantes pour ajuster la suite du projet -- le cacher ou l'ignorer aggrave systématiquement la situation.",
      },
      {
        question: "Pourquoi la question de la représentation (diversité, stéréotypes) est-elle devenue un enjeu de production à part entière, au-delà de la simple sensibilité éditoriale ?",
        options: [
          "Ce n'est qu'une question de communication sans impact réel sur la production",
          "Parce qu'elle influence le casting, l'écriture des personnages et peut avoir un impact direct sur la réception publique et la réputation du projet",
          "Cette question ne concerne que les productions institutionnelles",
          "Elle n'a aucun lien avec le succès commercial d'un contenu",
          "Elle ne concerne que les longs métrages, jamais les formats courts",
        ],
        correctIndex: 1,
        explanation:
          "Les choix de représentation influencent directement l'écriture, le casting et la réception du public -- un enjeu de production concret, pas seulement une question de sensibilité éditoriale abstraite.",
      },
      {
        question: "Comment analyser objectivement l'échec de diffusion d'un contenu qui avait pourtant une bonne qualité de production ?",
        options: [
          "Une bonne qualité de production garantit toujours le succès",
          "Analyser la stratégie de diffusion, le ciblage d'audience, le moment de sortie et la cohérence avec les attentes du public visé, indépendamment de la qualité technique",
          "L'échec est toujours dû à la qualité artistique du contenu",
          "Il est impossible d'analyser objectivement un échec de diffusion",
          "Le succès ne dépend jamais de la stratégie de diffusion",
        ],
        correctIndex: 1,
        explanation:
          "Qualité de production et succès de diffusion sont deux choses distinctes : un contenu excellent techniquement peut échouer faute d'un bon ciblage, timing ou stratégie de diffusion adaptée.",
      },
      {
        question: "Pourquoi la sécurité sur un plateau de tournage (cascades, matériel électrique, horaires) est-elle une responsabilité juridique et pas seulement organisationnelle ?",
        options: [
          "La sécurité sur un tournage n'est qu'une question d'organisation pratique",
          "Le non-respect des règles de sécurité peut engager la responsabilité pénale des responsables de production en cas d'accident",
          "Cette responsabilité ne concerne que les cascadeurs professionnels",
          "Les règles de sécurité ne s'appliquent qu'aux gros tournages internationaux",
          "La sécurité est uniquement à la charge des assurances, jamais de la production",
        ],
        correctIndex: 1,
        explanation:
          "En cas d'accident sur un plateau, le non-respect des règles de sécurité (temps de travail, matériel, cascades) peut engager pénalement les responsables de production -- une responsabilité juridique réelle, pas qu'organisationnelle.",
      },
      {
        question: "Un partenaire de diffusion demande d'adapter le montage final à ses propres contraintes éditoriales, différentes de l'intention initiale du réalisateur. Comment gérer ce compromis ?",
        options: [
          "Refuser systématiquement toute adaptation, quitte à perdre la diffusion",
          "Clarifier contractuellement en amont les marges de négociation possibles sur le montage, pour éviter un conflit non anticipé à la livraison",
          "Accepter toutes les demandes du diffuseur sans aucune limite",
          "Laisser le réalisateur décider seul sans consulter le diffuseur",
          "Ignorer les demandes du diffuseur si le projet est déjà terminé",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper contractuellement les marges de négociation sur le montage final évite un conflit tardif entre vision artistique et exigences du diffuseur -- une question à traiter en amont, pas au moment de la livraison.",
      },
    ],
  },

  grande_distribution: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la grande distribution ?",
        options: [
          "J'aime comprendre comment un point de vente fonctionne au quotidien et satisfaire les clients",
          "Parce que ça a l'air un métier facile sans réelle responsabilité",
          "Je n'ai pas vraiment réfléchi à la question",
          "Parce que c'est le seul secteur qui recrutait près de chez moi",
          "Parce que je n'aime pas le contact avec le public",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à la compréhension du fonctionnement d'un point de vente et à la satisfaction client montre un vrai intérêt pour le métier, au-delà d'un choix par défaut.",
      },
      {
        question: "Qu'est-ce qu'une \"rupture de stock\" ?",
        options: [
          "Un produit en promotion",
          "L'absence temporaire d'un produit habituellement disponible en rayon",
          "Un produit périmé retiré de la vente",
          "Une erreur de prix en caisse",
          "Un nouveau produit lancé en magasin",
        ],
        correctIndex: 1,
        explanation:
          "Une rupture de stock signifie qu'un produit normalement référencé n'est temporairement plus disponible -- un problème direct pour la satisfaction client et le chiffre d'affaires.",
      },
      {
        question: "Un client cherche un produit introuvable en rayon. Que fais-tu ?",
        options: [
          "Lui dire que tu ne sais pas et l'ignorer",
          "L'accompagner ou vérifier en stock/système si le produit est disponible ailleurs dans le magasin",
          "Lui dire que le produit n'existe plus sans vérifier",
          "L'envoyer voir un autre magasin sans chercher",
          "Ignorer sa demande si tu es occupé",
        ],
        correctIndex: 1,
        explanation:
          "Prendre le temps de vérifier activement (accompagnement, système de stock) plutôt que de répondre au hasard est ce qu'attend un client, et ce que valorise un employeur.",
      },
      {
        question: "Que signifie le \"merchandising\" en magasin ?",
        options: [
          "La gestion de la comptabilité du magasin",
          "L'ensemble des techniques pour présenter les produits de façon attractive et optimiser les ventes",
          "Le recrutement du personnel",
          "La livraison des marchandises",
          "La sécurité du magasin",
        ],
        correctIndex: 1,
        explanation:
          "Le merchandising regroupe les techniques de présentation des produits (agencement, mise en avant) pour maximiser leur visibilité et donc leurs ventes.",
      },
      {
        question: "Pourquoi la propreté et le rangement des rayons sont-ils importants au quotidien ?",
        options: [
          "Ils n'ont aucun impact sur les ventes",
          "Un rayon propre et bien rangé donne une image de qualité et facilite la recherche des produits par le client",
          "Ils ne concernent que l'image de l'enseigne, jamais les ventes",
          "Ce n'est qu'une contrainte administrative sans lien avec le client",
          "Ils ne sont utiles qu'en période de contrôle qualité",
        ],
        correctIndex: 1,
        explanation:
          "Un rayon propre et organisé facilite l'acte d'achat et rassure sur la qualité des produits proposés -- un détail qui a un impact réel sur l'expérience et les ventes.",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce que le \"taux de démarque\" en grande distribution ?",
        options: [
          "Le pourcentage de réduction accordé en promotion",
          "La perte de marchandise due au vol, à la casse ou aux erreurs de gestion, par rapport au stock théorique",
          "Le nombre de clients fidèles",
          "Le taux de satisfaction client",
          "Le pourcentage de produits en rupture de stock",
        ],
        correctIndex: 1,
        explanation:
          "Le taux de démarque mesure l'écart entre le stock théorique et le stock réel (vol, casse, erreurs) -- un indicateur clé de la rentabilité et de la rigueur de gestion d'un magasin.",
      },
      {
        question: "Un fournisseur livre une marchandise en retard, mettant en danger une promotion déjà communiquée aux clients. Que fais-tu ?",
        options: [
          "Ne rien communiquer aux clients et espérer que ça passe inaperçu",
          "Anticiper la communication (affichage, information en caisse) et chercher une solution alternative avec le fournisseur ou un produit de substitution",
          "Annuler définitivement la promotion sans explication",
          "Attendre sans réagir jusqu'à la livraison",
          "Reporter la responsabilité entièrement sur le fournisseur sans agir",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper la communication client et chercher des solutions alternatives limite l'impact d'un retard fournisseur, plutôt que de subir la situation en silence.",
      },
      {
        question: "Pourquoi l'implantation des produits (placement en tête de gondole, hauteur des yeux) influence-t-elle fortement les ventes ?",
        options: [
          "L'emplacement n'a aucune influence réelle sur le comportement d'achat",
          "Les zones les plus visibles et accessibles captent naturellement plus l'attention et favorisent les achats, y compris impulsifs",
          "Seul le prix affiché influence l'achat, jamais l'emplacement",
          "L'implantation ne concerne que les produits de luxe",
          "Elle n'a d'effet que sur les achats déjà prévus par le client",
        ],
        correctIndex: 1,
        explanation:
          "Le comportement d'achat est fortement influencé par la visibilité et l'accessibilité des produits -- un principe central du merchandising, exploité aussi bien pour les achats prévus qu'impulsifs.",
      },
      {
        question: "Que signifie la \"gestion des stocks en flux tendu\" ?",
        options: [
          "Stocker un maximum de marchandise en réserve en permanence",
          "Minimiser les stocks en approvisionnant juste ce qui est nécessaire, au plus près de la demande réelle",
          "Ne jamais réapprovisionner un magasin",
          "Stocker uniquement les produits en promotion",
          "Une méthode réservée uniquement à l'e-commerce",
        ],
        correctIndex: 1,
        explanation:
          "Le flux tendu vise à réduire les coûts de stockage en approvisionnant au plus près du besoin réel, au prix d'un risque de rupture plus élevé si la logistique est mal maîtrisée.",
      },
      {
        question: "Un client conteste un prix affiché en rayon différent du prix scanné en caisse. Quelle est la démarche appropriée ?",
        options: [
          "Refuser catégoriquement toute discussion",
          "Vérifier l'erreur d'étiquetage et, si elle est avérée, appliquer le prix affiché en rayon conformément à la réglementation",
          "Faire payer systématiquement le prix caisse sans vérification",
          "Ignorer la réclamation si le magasin est très fréquenté",
          "Accuser le client d'avoir mal lu l'étiquette sans vérifier",
        ],
        correctIndex: 1,
        explanation:
          "En cas d'erreur d'étiquetage avérée, la réglementation impose généralement d'appliquer le prix affiché en faveur du consommateur -- une vérification rapide évite un conflit inutile.",
      },
      {
        question: "Pourquoi la formation du personnel de caisse à la relation client est-elle stratégique, même sur un poste perçu comme répétitif ?",
        options: [
          "La caisse n'a aucun impact sur l'image du magasin",
          "C'est souvent le dernier point de contact avec le client avant qu'il quitte le magasin, il influence fortement son ressenti global sur sa visite",
          "La relation client ne concerne que les vendeurs en rayon",
          "Ce poste ne nécessite aucune formation particulière",
          "L'expérience en caisse n'a aucun lien avec la fidélisation",
        ],
        correctIndex: 1,
        explanation:
          "Le passage en caisse est souvent le dernier souvenir que garde le client de sa visite -- un moment clé pour la satisfaction globale et la fidélisation, à ne pas négliger malgré son caractère répétitif.",
      },
    ],
    difficile: [
      {
        question: "Un magasin constate une hausse continue de sa démarque inconnue sans cause évidente identifiée. Quelle démarche d'investigation est la plus rigoureuse ?",
        options: [
          "Accuser directement le personnel sans enquête",
          "Croiser les données de plusieurs sources (inventaires, vidéosurveillance, procédures de caisse, zones à risque) pour identifier des schémas récurrents avant toute conclusion",
          "Ignorer le phénomène tant qu'il reste dans la moyenne du secteur",
          "Augmenter les prix pour compenser la perte sans investiguer",
          "Réduire l'effectif du magasin pour limiter les risques",
        ],
        correctIndex: 1,
        explanation:
          "Une démarque inconnue en hausse peut avoir de multiples causes (vol interne/externe, erreurs de process) : une investigation croisée et factuelle est indispensable avant toute accusation ou décision.",
      },
      {
        question: "Pourquoi une stratégie de prix bas agressive peut-elle fragiliser un point de vente à moyen terme, malgré un volume de ventes en hausse ?",
        options: [
          "Une stratégie de prix bas est toujours bénéfique sans exception",
          "Elle peut écraser les marges au point de compromettre la rentabilité globale, surtout si elle attire une clientèle uniquement sensible au prix et peu fidèle",
          "Le volume de ventes ne dépend jamais du niveau de prix",
          "Cette stratégie n'a aucun impact sur la perception de la marque",
          "Elle garantit toujours une fidélisation client à long terme",
        ],
        correctIndex: 1,
        explanation:
          "Un volume de ventes élevé à faible marge peut dégrader la rentabilité globale et attirer une clientèle opportuniste peu fidèle -- un vrai risque stratégique à ne pas confondre avec le succès commercial.",
      },
      {
        question: "Comment concilier l'optimisation des coûts logistiques (flux tendu) avec le risque de rupture de stock sur des produits à forte demande ?",
        options: [
          "Il est impossible de concilier ces deux objectifs",
          "En affinant les prévisions de demande par article et en gardant un stock de sécurité ciblé sur les références les plus sensibles à la rupture",
          "Il faut toujours privilégier le stock maximal, sans considération de coût",
          "Le flux tendu élimine totalement le risque de rupture",
          "La prévision de la demande n'a aucun intérêt en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Un vrai pilotage logistique combine flux tendu global et stock de sécurité ciblé sur les références critiques -- un compromis fin entre coût de stockage et risque de rupture, jamais un choix binaire.",
      },
      {
        question: "Pourquoi le développement du \"click and collect\" pose-t-il des défis organisationnels spécifiques en magasin ?",
        options: [
          "Il ne pose aucun défi particulier par rapport à la vente classique",
          "Il nécessite de réorganiser la préparation de commandes, la gestion des stocks en temps réel et l'espace dédié, sans dégrader l'expérience des clients en magasin",
          "Il supprime totalement le besoin de personnel en magasin",
          "Il ne concerne que les enseignes purement en ligne",
          "Il n'a aucun impact sur la gestion des stocks",
        ],
        correctIndex: 1,
        explanation:
          "Le click and collect impose une double contrainte : préparer des commandes précises en temps réel tout en maintenant la qualité de l'expérience des clients présents physiquement -- un vrai défi d'organisation.",
      },
      {
        question: "Un responsable de magasin doit arbitrer entre respecter strictement les objectifs de vente fixés par le siège et une réalité locale différente (concurrence, pouvoir d'achat). Comment procéder ?",
        options: [
          "Appliquer les objectifs du siège sans jamais les questionner",
          "Faire remonter des données concrètes et argumentées sur la réalité locale, tout en cherchant des leviers d'action adaptés à son contexte",
          "Ignorer les objectifs du siège et fixer ses propres règles",
          "Attendre que le siège se déplace pour constater la réalité locale",
          "Réduire artificiellement la qualité de service pour atteindre les objectifs financiers",
        ],
        correctIndex: 1,
        explanation:
          "Un bon manager de terrain fait remonter des données factuelles pour ajuster la stratégie, plutôt que d'appliquer aveuglément des objectifs déconnectés du contexte local ou de les ignorer unilatéralement.",
      },
      {
        question: "Pourquoi la traçabilité alimentaire (origine, dates, conditions de transport) est-elle une responsabilité juridique majeure en grande distribution ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel enjeu",
          "En cas de problème sanitaire (rappel produit, contamination), l'enseigne doit pouvoir retracer précisément l'origine et le parcours du produit pour protéger les consommateurs",
          "La traçabilité ne concerne que les produits importés",
          "Cette responsabilité incombe uniquement au fournisseur, jamais au distributeur",
          "Elle n'a aucun lien avec la sécurité des consommateurs",
        ],
        correctIndex: 1,
        explanation:
          "En cas de crise sanitaire, la capacité à retracer rapidement l'origine d'un produit peut limiter gravement les conséquences pour les consommateurs -- une responsabilité partagée entre fournisseur et distributeur, pas déléguée entièrement.",
      },
      {
        question: "Comment un distributeur peut-il objectivement mesurer l'impact réel d'une opération de fidélisation client, au-delà du nombre de cartes distribuées ?",
        options: [
          "Le nombre de cartes distribuées suffit à mesurer le succès de l'opération",
          "En suivant l'évolution du panier moyen, de la fréquence de visite et du taux de rétention des clients inscrits sur la durée",
          "Il est impossible de mesurer objectivement l'impact d'un programme de fidélité",
          "Seule la satisfaction déclarée en sondage compte réellement",
          "Le succès se mesure uniquement par le chiffre d'affaires du jour de lancement",
        ],
        correctIndex: 1,
        explanation:
          "Le vrai succès d'un programme de fidélité se mesure dans la durée (panier moyen, fréquence, rétention), pas au nombre de cartes distribuées le jour du lancement -- une nuance essentielle en pilotage commercial.",
      },
    ],
  },
};
