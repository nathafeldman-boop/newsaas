// Cinquième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_5: InterviewDomain[] = [
  { id: "fonction_publique", label: "Fonction publique / Service public" },
  { id: "viticulture_oenologie", label: "Viticulture / Œnologie / Sommellerie" },
  { id: "esthetique_bien_etre", label: "Beauté / Esthétique / Spa / Bien-être" },
  { id: "aerien_aeroportuaire", label: "Aérien / Aéroportuaire" },
  { id: "metiers_bouche", label: "Boulangerie / Pâtisserie / Métiers de bouche" },
];

export const EXTRA_BANK_5: Bank = {
  fonction_publique: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la fonction publique ?",
        options: [
          "J'aime l'idée de servir l'intérêt général et contribuer à un service utile à tous",
          "Parce que c'est un métier avec beaucoup de vacances, sans autre raison",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La notion de service public et d'intérêt général est au cœur de la fonction publique -- une motivation bien plus solide qu'une motivation liée aux avantages annexes.",
      },
      {
        question: "Qu'est-ce que le principe de neutralité dans la fonction publique, en une phrase simple ?",
        options: [
          "L'obligation de ne jamais donner son avis, même en privé",
          "L'obligation pour l'agent public de traiter chaque usager de façon égale, sans discrimination ni opinion personnelle affichée dans l'exercice de ses fonctions",
          "Un principe réservé aux plus hauts fonctionnaires",
          "L'interdiction de voter aux élections",
          "Une règle qui ne concerne que les enseignants",
        ],
        correctIndex: 1,
        explanation:
          "La neutralité impose à l'agent public de traiter chaque usager de façon égale dans l'exercice de ses fonctions, sans y mêler ses opinions personnelles -- un principe fondamental du service public.",
      },
      {
        question: "Un usager se montre agressif au guichet car il ne comprend pas une procédure. Que fais-tu ?",
        options: [
          "Je hausse le ton pour me faire respecter",
          "Je reste calme, reformule la procédure clairement et l'oriente si besoin vers le bon service",
          "Je le renvoie sans explication",
          "J'ignore sa demande jusqu'à ce qu'il se calme seul",
          "Je le laisse à un collègue sans lui parler",
        ],
        correctIndex: 1,
        explanation:
          "Rester calme et reformuler clairement, plutôt que de répondre à l'agressivité par l'agressivité, est la posture professionnelle attendue face à un usager en difficulté de compréhension.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce type de poste ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite, donc j'apprends à toujours respecter scrupuleusement les procédures administratives",
          "Je n'aime pas le contact avec le public",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur procédurale, essentielle dans l'administration, avec une piste d'amélioration concrète, montre une bonne compréhension des exigences du poste.",
      },
      {
        question: "Pourquoi l'égalité de traitement des usagers est-elle un principe fondamental du service public ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce que chaque usager doit avoir accès au même service, dans les mêmes conditions, indépendamment de son origine, statut social ou toute autre caractéristique personnelle",
          "L'égalité de traitement ne concerne que les services de santé publique",
          "Elle n'a aucun lien avec la confiance des citoyens envers l'administration",
          "Elle est facultative pour les petites collectivités",
        ],
        correctIndex: 1,
        explanation:
          "L'égalité de traitement garantit à chaque usager un accès identique au service public, quelles que soient ses caractéristiques personnelles -- un pilier de la confiance des citoyens envers l'administration.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu une situation où une demande d'usager est légitime mais ne rentre dans aucune procédure existante ?",
        options: [
          "Je refuse systématiquement toute demande hors procédure",
          "J'en réfère à ma hiérarchie pour trouver une solution adaptée, sans agir seul en dehors du cadre",
          "Je décide seul de créer une exception sans en informer personne",
          "J'ignore la demande si elle est compliquée à traiter",
          "Je considère qu'aucune demande hors procédure ne peut jamais être traitée",
        ],
        correctIndex: 1,
        explanation:
          "Référer à sa hiérarchie une situation atypique, plutôt que de décider seul ou de refuser sèchement, respecte le cadre collectif de décision propre à l'administration.",
      },
      {
        question: "Pourquoi le principe de continuité du service public impose-t-il des contraintes spécifiques (ex: service minimum en cas de grève) ?",
        options: [
          "Ce principe n'a aucune valeur juridique réelle",
          "Parce que certains services publics (santé, sécurité, transport) sont essentiels au fonctionnement de la société et ne peuvent être interrompus sans préjudice grave pour les usagers",
          "La continuité du service public ne concerne que les administrations centrales",
          "Elle interdit purement et simplement le droit de grève des agents publics",
          "Elle ne s'applique qu'en période de crise sanitaire",
        ],
        correctIndex: 1,
        explanation:
          "Certains services publics sont essentiels au fonctionnement de la société : le principe de continuité impose des aménagements (service minimum) pour concilier droit de grève des agents et besoin impératif des usagers.",
      },
      {
        question: "Comment réagis-tu si tu constates qu'un collègue ne respecte pas le principe de confidentialité sur un dossier administratif ?",
        options: [
          "Je l'ignore, ce n'est pas mon problème",
          "Je lui rappelle discrètement les règles et, si besoin, j'en informe la hiérarchie",
          "Je divulgue moi-même l'information pour \"égaliser\" la situation",
          "Je le dénonce publiquement devant les usagers",
          "Je fais pareil pour ne pas être le seul à respecter la règle",
        ],
        correctIndex: 1,
        explanation:
          "Rappeler discrètement les règles et, si nécessaire, en informer la hiérarchie protège la confidentialité des usagers sans escalade inutile ni complicité par imitation.",
      },
      {
        question: "Pourquoi la motivation des décisions administratives (expliquer par écrit les raisons d'un refus) est-elle une obligation légale importante ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel enjeu",
          "Elle permet à l'usager de comprendre et, le cas échéant, de contester une décision qui lui est défavorable, un droit essentiel dans les relations entre l'administration et les citoyens",
          "La motivation des décisions ne concerne que les décisions favorables",
          "Elle n'a aucun lien avec la transparence de l'action publique",
          "Elle est facultative pour les décisions à faible enjeu financier",
        ],
        correctIndex: 1,
        explanation:
          "L'obligation de motiver une décision défavorable permet à l'usager de comprendre les raisons et, le cas échéant, d'exercer un recours -- un droit essentiel encadré par le droit administratif français.",
      },
      {
        question: "Comment concilies-tu l'application stricte d'un règlement avec une situation humaine particulièrement difficile ?",
        options: [
          "Je fais toujours une exception dès qu'une situation semble difficile",
          "J'applique le règlement tout en cherchant, dans le cadre existant, la solution la plus adaptée à la situation, et je remonte les cas limites à ma hiérarchie",
          "J'ignore systématiquement le contexte humain de la situation",
          "Je décide seul de ne pas appliquer le règlement si je le juge injuste",
          "Je considère qu'un règlement ne doit jamais souffrir d'aucune souplesse",
        ],
        correctIndex: 1,
        explanation:
          "Chercher, dans le cadre légal existant, la réponse la plus adaptée à une situation humaine difficile, tout en remontant les cas limites, concilie rigueur administrative et sens du service public.",
      },
      {
        question: "Pourquoi la formation continue est-elle importante pour un agent public, notamment face aux évolutions réglementaires fréquentes ?",
        options: [
          "La réglementation administrative évolue rarement, la formation initiale suffit",
          "Les textes réglementaires évoluent régulièrement, et un agent mal informé risque d'appliquer une règle obsolète, au détriment de l'usager",
          "La formation continue ne concerne que les cadres de l'administration",
          "Elle est facultative une fois le concours obtenu",
          "Elle n'a aucun impact sur la qualité du service rendu",
        ],
        correctIndex: 1,
        explanation:
          "Les textes réglementaires évoluent régulièrement : un agent qui ne se forme pas en continu risque d'appliquer une règle obsolète, avec un impact direct et négatif sur l'usager.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la différence entre la légalité et l'opportunité d'une décision administrative, et pourquoi cette distinction structure-t-elle le contrôle du juge administratif ?",
        options: [
          "Ce sont deux notions strictement identiques en droit administratif",
          "La légalité vérifie la conformité de la décision au droit, l'opportunité relève du jugement de l'administration sur ce qui est souhaitable -- le juge administratif contrôle en principe la légalité, pas l'opportunité, sauf exceptions précises",
          "Le juge administratif contrôle systématiquement l'opportunité de toute décision",
          "L'opportunité d'une décision n'a aucun lien avec le pouvoir discrétionnaire de l'administration",
          "Cette distinction ne concerne que les décisions budgétaires",
        ],
        correctIndex: 1,
        explanation:
          "Le juge administratif contrôle en principe la légalité d'une décision (conformité au droit), pas son opportunité (le jugement de l'administration sur ce qui est souhaitable) -- une distinction fondamentale qui structure les limites du contrôle juridictionnel de l'action administrative.",
      },
      {
        question: "Qu'est-ce que le principe de laïcité impose concrètement à un agent public dans l'exercice de ses fonctions ?",
        options: [
          "Il interdit à l'agent d'avoir des convictions religieuses personnelles",
          "Il impose à l'agent public une stricte neutralité religieuse dans l'exercice de ses fonctions (pas de prosélytisme, pas de signe religieux ostensible selon le cadre), garantissant l'égalité de traitement de tous les usagers",
          "Il ne s'applique qu'aux enseignants de l'Éducation nationale",
          "Il autorise l'agent à refuser de servir un usager selon ses convictions personnelles",
          "Il a été supprimé par une réforme récente du statut de la fonction publique",
        ],
        correctIndex: 1,
        explanation:
          "Le principe de laïcité impose à l'agent public une neutralité religieuse stricte dans l'exercice de ses fonctions, garantissant que le service est rendu de façon égale à tous les usagers, indépendamment de leurs convictions -- une obligation propre à l'agent, non à l'usager du service.",
      },
      {
        question: "Qu'est-ce que le \"devoir de réserve\" d'un agent public et en quoi diffère-t-il de l'obligation de neutralité ?",
        options: [
          "Ce sont deux termes strictement synonymes en droit de la fonction publique",
          "Le devoir de réserve limite la liberté d'expression de l'agent, y compris en dehors du service, pour ne pas porter atteinte à la dignité de ses fonctions, tandis que la neutralité concerne strictement l'exercice de ses missions",
          "Le devoir de réserve ne s'applique qu'aux militaires",
          "Il autorise l'agent à s'exprimer librement sur tout sujet politique sans aucune limite",
          "Il a été aboli par la jurisprudence administrative récente",
        ],
        correctIndex: 1,
        explanation:
          "Le devoir de réserve limite la liberté d'expression de l'agent même hors service (ex: propos publics discréditant l'institution), tandis que l'obligation de neutralité concerne spécifiquement l'exercice de ses missions -- deux obligations complémentaires mais distinctes.",
      },
      {
        question: "Pourquoi le principe d'égal accès aux emplois publics (article 6 de la Déclaration des droits de l'homme) structure-t-il le système des concours ?",
        options: [
          "Ce principe n'a qu'une valeur symbolique sans traduction concrète",
          "Il impose que l'accès aux emplois publics se fasse selon le seul critère du mérite et de la capacité, ce qui justifie le recours généralisé aux concours comme mode de recrutement objectif",
          "Il autorise la nomination directe sans concours pour tous les emplois publics",
          "Il ne s'applique qu'aux emplois de direction de la fonction publique",
          "Il a été remplacé par un recrutement uniquement sur CV depuis 2020",
        ],
        correctIndex: 1,
        explanation:
          "Le principe d'égal accès aux emplois publics, fondé sur le mérite et la capacité, justifie le recours généralisé au concours comme mode de sélection objectif et impartial, plutôt qu'une nomination discrétionnaire.",
      },
      {
        question: "Qu'est-ce que la responsabilité disciplinaire d'un agent public et comment se distingue-t-elle de sa responsabilité pénale ou civile ?",
        options: [
          "Ce sont trois formes de responsabilité strictement identiques et cumulables sans distinction",
          "La responsabilité disciplinaire sanctionne un manquement aux obligations professionnelles au sein de l'administration (avertissement, sanction), indépendamment d'éventuelles poursuites pénales ou civiles pour les mêmes faits",
          "La responsabilité disciplinaire remplace systématiquement la responsabilité pénale",
          "Un agent sanctionné disciplinairement ne peut jamais être poursuivi pénalement pour les mêmes faits",
          "Cette distinction n'existe que dans la fonction publique hospitalière",
        ],
        correctIndex: 1,
        explanation:
          "La responsabilité disciplinaire sanctionne un manquement professionnel en interne (via une échelle de sanctions propre au statut), indépendamment d'éventuelles poursuites pénales ou civiles pour les mêmes faits -- les deux régimes peuvent se cumuler.",
      },
      {
        question: "Pourquoi le statut général de la fonction publique distingue-t-il fonctionnaires titulaires et agents contractuels, et quelles conséquences pratiques cela a-t-il ?",
        options: [
          "Cette distinction n'a aucune conséquence pratique, les deux statuts sont identiques",
          "Le titulaire bénéficie d'une garantie de l'emploi et d'un déroulement de carrière statutaire, tandis que le contractuel est recruté sur une base contractuelle, avec des règles de rémunération, de renouvellement et de protection différentes",
          "Les agents contractuels ont toujours plus de garanties que les titulaires",
          "Seuls les contractuels peuvent exercer des missions de service public",
          "Cette distinction a été supprimée par la loi de transformation de la fonction publique de 2019",
        ],
        correctIndex: 1,
        explanation:
          "Le statut de titulaire garantit l'emploi et un déroulement de carrière encadré statutairement, tandis que le contractuel relève d'un régime plus proche du droit du travail (contrat à durée déterminée ou indéterminée) -- une distinction structurante malgré l'ouverture croissante du recrutement contractuel.",
      },
      {
        question: "Qu'est-ce que le principe de mutabilité (ou adaptabilité) du service public et pourquoi entre-t-il parfois en tension avec les droits acquis des usagers ou des agents ?",
        options: [
          "Ce principe interdit toute évolution du fonctionnement d'un service public une fois établi",
          "Il permet à l'administration d'adapter l'organisation d'un service public à l'évolution de l'intérêt général, ce qui peut modifier des conditions de fonctionnement dont usagers ou agents s'étaient habitués, sans que cela constitue un droit acquis intangible",
          "Il ne s'applique qu'aux services publics industriels et commerciaux",
          "Il garantit à chaque usager que le service ne changera jamais de modalités",
          "Il a été strictement limité aux seules réformes votées par référendum",
        ],
        correctIndex: 1,
        explanation:
          "Le principe de mutabilité permet à l'administration de faire évoluer un service public selon l'intérêt général, sans que les usagers ou agents puissent invoquer un \"droit acquis\" au maintien des modalités antérieures -- une tension classique entre continuité du service et adaptation nécessaire.",
      },
    ],
  },

  viticulture_oenologie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en viticulture / œnologie ?",
        options: [
          "J'aime le lien entre le travail de la terre et un savoir-faire qui se transforme en produit fini",
          "Parce que ça a l'air un métier facile qui consiste juste à goûter du vin",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le lien entre le travail agricole et un savoir-faire de transformation est au cœur du métier -- une motivation bien plus solide qu'une idée réductrice sur la dégustation.",
      },
      {
        question: "Qu'est-ce que les vendanges, en une phrase simple ?",
        options: [
          "La taille de la vigne en hiver",
          "La récolte des raisins, une période clé qui détermine en grande partie la qualité du millésime",
          "L'étiquetage final des bouteilles",
          "Le traitement phytosanitaire de la vigne",
          "La mise en bouteille du vin",
        ],
        correctIndex: 1,
        explanation:
          "Les vendanges (récolte des raisins) sont un moment clé du calendrier viticole, dont le timing influence directement la qualité et le style du vin obtenu.",
      },
      {
        question: "Un client dans une dégustation te pose une question technique à laquelle tu ne connais pas la réponse. Que fais-tu ?",
        options: [
          "J'invente une réponse pour ne pas paraître incompétent",
          "Je reconnais honnêtement ne pas savoir et propose de me renseigner pour lui répondre ensuite",
          "Je change de sujet sans répondre",
          "Je réponds de façon vague en espérant que ça passe",
          "Je renvoie la question à un collègue sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Reconnaître honnêtement une limite de connaissance, plutôt que d'inventer une réponse, préserve la crédibilité -- surtout dans un domaine où les clients avertis peuvent facilement détecter une erreur.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste sur les détails, donc j'apprends à accepter la part de variabilité naturelle du métier",
          "Je n'aime pas le travail en extérieur",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier (le perfectionnisme face à la variabilité naturelle du vivant), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi les conditions climatiques ont-elles un impact si direct sur le travail du vigneron ?",
        options: [
          "Ce n'est pas vraiment un facteur important dans ce métier",
          "Parce que la vigne est une plante très sensible aux variations climatiques (gel, sécheresse, grêle), ce qui influence directement le rendement et la qualité du raisin",
          "Le climat ne concerne que les très grandes exploitations",
          "Ça n'a aucun lien avec le goût final du vin",
          "Les conditions climatiques n'affectent que l'aspect visuel des vignes",
        ],
        correctIndex: 1,
        explanation:
          "La vigne est très sensible aux aléas climatiques (gel, grêle, sécheresse), qui influencent directement le rendement et la qualité du raisin récolté, donc du vin obtenu.",
      },
    ],
    medium: [
      {
        question: "Comment expliquerais-tu à un client la notion de terroir, au-delà du simple emplacement géographique ?",
        options: [
          "Le terroir désigne uniquement le nom de la région sur l'étiquette",
          "Le terroir combine le sol, le climat, l'exposition et le savoir-faire humain, qui ensemble façonnent le caractère unique d'un vin",
          "Le terroir n'a aucune influence réelle sur le goût du vin",
          "Le terroir est un terme purement marketing sans réalité concrète",
          "Le terroir ne concerne que les vins français",
        ],
        correctIndex: 1,
        explanation:
          "Le terroir combine des facteurs naturels (sol, climat, exposition) et humains (savoir-faire) qui façonnent ensemble le caractère unique d'un vin -- bien plus qu'une simple indication géographique.",
      },
      {
        question: "Pourquoi la fermentation malolactique est-elle une étape importante dans l'élaboration de certains vins ?",
        options: [
          "Elle n'a aucun impact sur le goût final du vin",
          "Elle transforme l'acide malique (plus acide) en acide lactique (plus doux), assouplissant le vin et modifiant son profil aromatique",
          "Elle ne concerne que les vins blancs",
          "Elle est obligatoire pour tous les types de vin sans exception",
          "Elle sert uniquement à stabiliser la couleur du vin",
        ],
        correctIndex: 1,
        explanation:
          "La fermentation malolactique transforme l'acide malique en acide lactique, plus doux, ce qui assouplit le vin et enrichit son profil aromatique -- une étape technique choisie selon le style de vin recherché.",
      },
      {
        question: "Comment réagis-tu face à une récolte fortement impactée par un aléa climatique, réduisant significativement le volume disponible ?",
        options: [
          "Je maintiens tous les engagements commerciaux au même volume, quitte à décevoir sur la qualité",
          "J'informe rapidement et honnêtement les partenaires commerciaux de l'impact réel, en priorisant la qualité sur le volume",
          "Je cache la situation le plus longtemps possible",
          "J'abandonne complètement la commercialisation de ce millésime",
          "Je considère qu'un aléa climatique n'a jamais à être communiqué aux clients",
        ],
        correctIndex: 1,
        explanation:
          "Informer rapidement et honnêtement les partenaires d'un impact climatique, en priorisant la qualité, préserve la confiance à long terme -- bien plus qu'un maintien artificiel des engagements au détriment de la qualité.",
      },
      {
        question: "Pourquoi la certification bio ou biodynamique implique-t-elle des contraintes techniques particulières pour le viticulteur ?",
        options: [
          "Ces certifications n'imposent aucune contrainte technique réelle",
          "Elles interdisent certains traitements phytosanitaires de synthèse, obligeant à des pratiques alternatives (traitements naturels, travail du sol) souvent plus exigeantes en main d'œuvre et en anticipation",
          "Elles ne concernent que la mise en bouteille",
          "Elles garantissent automatiquement une meilleure qualité gustative",
          "Elles sont identiques à une certification qualité classique",
        ],
        correctIndex: 1,
        explanation:
          "L'interdiction de certains traitements de synthèse impose des pratiques alternatives souvent plus exigeantes en anticipation et en main d'œuvre (traitements naturels, travail du sol), un vrai changement de méthode de production.",
      },
      {
        question: "Comment argumenterais-tu un prix plus élevé pour un vin de qualité face à un client qui compare avec une bouteille d'entrée de gamme ?",
        options: [
          "Je baisse systématiquement le prix pour rester compétitif",
          "J'explique concrètement ce qui justifie l'écart (rendement plus faible, vieillissement, savoir-faire, terroir spécifique)",
          "Je refuse de discuter du prix",
          "Je dénigre la bouteille d'entrée de gamme sans argumenter sur le produit proposé",
          "Je considère que la comparaison n'a pas lieu d'être et j'évite le sujet",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer concrètement ce qui justifie l'écart de prix (rendement, élevage, savoir-faire) valorise le produit sans dénigrer la concurrence ni brader sa propre offre.",
      },
      {
        question: "Pourquoi la traçabilité (parcelle, date de récolte, lot de mise en bouteille) est-elle importante dans la filière viticole ?",
        options: [
          "Ce n'est qu'une contrainte administrative sans réel intérêt",
          "Elle permet d'identifier précisément l'origine d'un problème qualité et de garantir l'authenticité d'une appellation, un enjeu de confiance et de protection contre la fraude",
          "La traçabilité ne concerne que l'exportation",
          "Elle n'a aucun lien avec la protection des appellations d'origine",
          "Elle est facultative pour les petits domaines",
        ],
        correctIndex: 1,
        explanation:
          "La traçabilité permet d'identifier rapidement l'origine d'un problème qualité et de garantir l'authenticité d'une appellation, un enjeu de confiance client et de protection contre la fraude (usurpation d'appellation).",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce qu'une Appellation d'Origine Contrôlée (AOC/AOP) garantit juridiquement, au-delà d'une simple indication géographique ?",
        options: [
          "Elle garantit uniquement que le raisin provient de la région mentionnée, sans autre exigence",
          "Elle encadre un cahier des charges précis (cépages autorisés, rendements maximaux, pratiques culturales et œnologiques), contrôlé par un organisme certificateur, garantissant un lien entre le terroir et des caractéristiques spécifiques du produit",
          "Elle est attribuée automatiquement à tout vin produit dans une région viticole reconnue",
          "Elle ne concerne que les vins destinés à l'exportation",
          "Elle a été remplacée intégralement par les IGP depuis la réforme européenne de 2009",
        ],
        correctIndex: 1,
        explanation:
          "L'AOC/AOP encadre un cahier des charges précis (cépages, rendements, pratiques), contrôlé par un organisme certificateur, garantissant un lien fort entre le terroir et les caractéristiques spécifiques du produit -- bien plus qu'une simple mention géographique.",
      },
      {
        question: "Pourquoi le changement climatique constitue-t-il un défi structurel majeur pour la viticulture, au-delà des aléas climatiques ponctuels ?",
        options: [
          "Le changement climatique n'a aucun impact mesurable sur la viticulture",
          "Il modifie durablement les conditions de maturation du raisin (dates de vendanges avancées, degré d'alcool en hausse), remettant en question l'adéquation entre certains cépages historiques et leur terroir d'origine",
          "Il ne concerne que les vignobles situés en zone tropicale",
          "Il a été totalement compensé par les progrès techniques de la filière",
          "Ses effets ne se feront sentir qu'à très long terme, sans impact actuel observable",
        ],
        correctIndex: 1,
        explanation:
          "Le réchauffement modifie durablement les conditions de maturation (vendanges plus précoces, degré d'alcool en hausse), poussant certains vignobles à repenser leurs cépages ou pratiques culturales pour préserver l'identité de leurs vins.",
      },
      {
        question: "Qu'est-ce que la biodynamie et en quoi ses principes vont-ils au-delà de l'agriculture biologique classique ?",
        options: [
          "La biodynamie est un synonyme strict de l'agriculture biologique, sans différence de pratique",
          "Elle intègre, en plus des principes de l'agriculture biologique, des pratiques spécifiques (préparations à base de plantes, calendrier lunaire) issues de l'anthroposophie, considérant le domaine comme un organisme vivant global",
          "La biodynamie interdit totalement l'usage de tout traitement, même naturel",
          "Elle ne concerne que la vinification, jamais la culture de la vigne",
          "Elle a été scientifiquement validée dans tous ses principes par la recherche agronomique",
        ],
        correctIndex: 1,
        explanation:
          "La biodynamie intègre, en plus des principes bio, des pratiques spécifiques issues de l'anthroposophie (préparations, calendrier lunaire), considérant le domaine comme un organisme vivant global -- une approche qui reste débattue scientifiquement sur certains de ses fondements, sans remettre en cause son cadre bio de base.",
      },
      {
        question: "Pourquoi l'élevage en fût de chêne influence-t-il le profil aromatique d'un vin au-delà du simple contact avec le bois ?",
        options: [
          "Le fût de chêne n'a aucun impact aromatique, seul le raisin compte",
          "Il apporte des composés aromatiques (vanille, épices, notes toastées selon la chauffe) tout en permettant une micro-oxygénation lente qui assouplit les tanins et stabilise la couleur",
          "L'élevage en fût ne concerne que les vins blancs",
          "Il remplace totalement le rôle de la fermentation alcoolique",
          "Son effet est strictement identique quel que soit le type de chêne utilisé",
        ],
        correctIndex: 1,
        explanation:
          "Le fût de chêne apporte des composés aromatiques spécifiques (selon l'origine du bois et sa chauffe) tout en permettant une micro-oxygénation lente qui assouplit les tanins et stabilise la couleur -- un double effet chimique et aromatique bien au-delà d'un simple contenant.",
      },
      {
        question: "Qu'est-ce que la sélection massale par rapport à la sélection clonale en matière de plantation de vigne, et pourquoi ce choix fait-il débat parmi les viticulteurs ?",
        options: [
          "Ce sont deux méthodes identiques de multiplication de la vigne",
          "La sélection clonale reproduit un plant unique jugé optimal pour sa régularité, tandis que la sélection massale conserve une diversité génétique de plants issus du même vignoble, potentiellement plus résiliente mais moins homogène",
          "La sélection massale est une pratique récente, née dans les années 2010",
          "La sélection clonale garantit toujours une meilleure qualité gustative que la sélection massale",
          "Ce choix n'a aucun impact sur la résilience de la vigne face aux maladies ou au climat",
        ],
        correctIndex: 1,
        explanation:
          "La sélection clonale privilégie la régularité en reproduisant un plant jugé optimal, tandis que la sélection massale conserve une diversité génétique potentiellement plus résiliente face aux aléas climatiques et sanitaires, mais moins homogène en pratique -- un débat vivant dans la filière, notamment face au changement climatique.",
      },
      {
        question: "Pourquoi la gestion du rendement (quantité de raisin produite par hectare) est-elle un arbitrage stratégique central en viticulture de qualité ?",
        options: [
          "Le rendement n'a aucun lien avec la qualité du vin obtenu",
          "Un rendement trop élevé dilue généralement la concentration aromatique et la qualité du raisin, tandis qu'un rendement maîtrisé (souvent plafonné par les cahiers des charges d'appellation) favorise la concentration, au prix d'une production réduite",
          "Il suffit toujours de maximiser le rendement pour maximiser la rentabilité",
          "Le rendement est fixé une fois pour toutes et ne varie jamais d'une année sur l'autre",
          "Cet arbitrage ne concerne que les vins d'entrée de gamme",
        ],
        correctIndex: 1,
        explanation:
          "Un rendement trop élevé dilue généralement la concentration et la qualité du raisin ; les cahiers des charges d'appellation plafonnent souvent le rendement pour cette raison -- un arbitrage stratégique entre volume produit et qualité recherchée.",
      },
      {
        question: "Qu'est-ce que le \"millésime\" révèle sur la philosophie de la viticulture de qualité, par contraste avec une production industrielle standardisée ?",
        options: [
          "Le millésime n'est qu'une simple indication de date sans réelle signification qualitative",
          "Il assume et valorise la variabilité naturelle d'une année à l'autre (climat, maturité), contrairement à une production standardisée qui chercherait à gommer ces variations pour un goût identique chaque année",
          "Un bon vin doit toujours avoir exactement le même goût, quel que soit le millésime",
          "Le millésime ne concerne que les vins destinés à la garde de très longue durée",
          "Il a perdu toute pertinence avec les techniques œnologiques modernes de standardisation",
        ],
        correctIndex: 1,
        explanation:
          "La notion de millésime assume et valorise la variabilité naturelle d'une année à l'autre, à l'opposé d'une logique de standardisation industrielle qui chercherait à uniformiser le goût -- une philosophie qui valorise l'expression du terroir et du climat de chaque année.",
      },
    ],
  },

  esthetique_bien_etre: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en esthétique / bien-être ?",
        options: [
          "J'aime prendre soin des gens et les aider à se sentir mieux dans leur corps",
          "Parce que ça a l'air un métier facile et détendu toute la journée",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le soin apporté au bien-être physique et à la confiance en soi du client est au cœur du métier -- une motivation bien plus solide qu'une idée fausse de facilité.",
      },
      {
        question: "Pourquoi l'hygiène est-elle une priorité absolue dans un institut de beauté ou un spa ?",
        options: [
          "C'est surtout une question d'image de l'établissement",
          "Parce que le contact direct avec la peau et parfois des muqueuses expose à un vrai risque de transmission d'infections si l'hygiène n'est pas rigoureuse",
          "Ce n'est important qu'en cas de contrôle sanitaire",
          "L'hygiène ne concerne que les soins du visage",
          "Ça ne concerne que les instituts haut de gamme",
        ],
        correctIndex: 1,
        explanation:
          "Le contact direct avec la peau expose à un risque réel de transmission d'infections en cas d'hygiène insuffisante : la désinfection du matériel et des surfaces est un enjeu de sécurité sanitaire, pas seulement d'image.",
      },
      {
        question: "Un client exprime une insatisfaction sur le résultat d'un soin. Que fais-tu ?",
        options: [
          "Je me justifie en expliquant que le client attend trop",
          "J'écoute sa remarque, propose une solution adaptée (ajustement, geste commercial) et note le retour pour progresser",
          "J'ignore la remarque si le soin a été fait correctement selon moi",
          "Je le blâme d'avoir mal suivi les conseils post-soin",
          "Je refuse toute discussion sur le résultat",
        ],
        correctIndex: 1,
        explanation:
          "Écouter la remarque et proposer une solution concrète transforme une insatisfaction en opportunité de fidélisation, plutôt qu'un motif de conflit.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste sur le détail, donc j'apprends à respecter le temps prévu pour chaque soin",
          "Je n'aime pas le contact physique avec les clients",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier (le perfectionnisme face à des contraintes de temps), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi le questionnement préalable du client (allergies, contre-indications) est-il indispensable avant un soin ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel enjeu",
          "Parce que certains produits ou techniques peuvent provoquer une réaction indésirable ou être contre-indiqués selon l'état de santé du client",
          "Le questionnement préalable ne concerne que les soins du corps",
          "Ça n'a aucun lien avec la sécurité du client",
          "Il est facultatif pour les clients réguliers",
        ],
        correctIndex: 1,
        explanation:
          "Certains produits ou techniques peuvent provoquer une réaction indésirable ou être contre-indiqués selon l'état de santé du client (allergie, grossesse, pathologie) : le questionnement préalable est une étape de sécurité, pas une simple formalité.",
      },
    ],
    medium: [
      {
        question: "Comment personnalises-tu un soin selon le type de peau ou les besoins spécifiques d'un client ?",
        options: [
          "J'applique toujours exactement le même protocole, quel que soit le client",
          "J'analyse le type de peau et les besoins exprimés avant d'adapter les produits et la technique utilisés",
          "Je laisse le client choisir seul les produits sans conseil",
          "La personnalisation n'a pas vraiment d'importance dans ce métier",
          "Je me base uniquement sur l'âge du client pour adapter le soin",
        ],
        correctIndex: 1,
        explanation:
          "Analyser le type de peau et les besoins réels avant d'adapter produits et technique est une compétence professionnelle centrale, bien au-delà d'un protocole uniforme.",
      },
      {
        question: "Pourquoi le conseil en vente de produits (à utiliser à la maison) doit-il rester honnête et adapté, plutôt que systématique ?",
        options: [
          "Il faut toujours vendre le maximum de produits possible, quel que soit le besoin réel",
          "Un conseil honnête et adapté aux besoins réels du client construit la confiance à long terme, contrairement à une vente systématique perçue comme insistante",
          "Le conseil produit n'a aucun impact sur la fidélisation du client",
          "Il vaut mieux ne jamais recommander de produit pour éviter tout reproche",
          "Le conseil produit ne concerne que les instituts haut de gamme",
        ],
        correctIndex: 1,
        explanation:
          "Un conseil honnête et réellement adapté aux besoins du client construit une relation de confiance durable, contrairement à une vente systématique qui peut être perçue comme intéressée et nuire à la fidélisation.",
      },
      {
        question: "Comment réagis-tu si un client demande une prestation qui n'est pas adaptée à son état de peau ou de santé ?",
        options: [
          "J'accepte sans discussion pour ne pas perdre la vente",
          "J'explique clairement le risque ou l'inadéquation et propose une alternative plus adaptée",
          "Je refuse sans aucune explication",
          "Je fais la prestation en cachant mes réserves",
          "Je laisse le client décider seul sans aucune information",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer clairement le risque et proposer une alternative montre à la fois expertise et sens de la responsabilité, plutôt qu'une exécution silencieuse d'une demande inadaptée.",
      },
      {
        question: "Pourquoi la veille sur les nouvelles techniques et tendances est-elle importante dans ce secteur en constante évolution ?",
        options: [
          "Ce n'est pas vraiment nécessaire, les techniques de base suffisent toujours",
          "Parce que de nouvelles techniques, produits et tendances apparaissent régulièrement, et rester à jour permet de proposer une offre pertinente et de se différencier",
          "La veille ne concerne que les responsables d'institut",
          "Elle n'a aucun impact sur la satisfaction client",
          "Elle est facultative si l'institut a une clientèle fidèle",
        ],
        correctIndex: 1,
        explanation:
          "Ce secteur évolue rapidement (nouvelles techniques, produits, tendances) : rester à jour permet de proposer une offre pertinente et de se différencier dans un marché concurrentiel.",
      },
      {
        question: "Comment gères-tu un planning chargé avec des rendez-vous qui prennent du retard ?",
        options: [
          "Je bâcle les soins suivants pour rattraper le retard",
          "J'informe les clients concernés du retard dès que possible et j'ajuste la durée des soins suivants sans sacrifier la qualité essentielle",
          "J'annule sans prévenir les derniers rendez-vous de la journée",
          "Je ne préviens personne et laisse les clients attendre sans explication",
          "Je considère que le retard n'a jamais à être communiqué",
        ],
        correctIndex: 1,
        explanation:
          "Informer rapidement les clients d'un retard et ajuster sans sacrifier l'essentiel du soin préserve la qualité de service, même sous pression de planning.",
      },
      {
        question: "Pourquoi la formation continue est-elle particulièrement importante face à l'évolution des réglementations sur les produits cosmétiques ?",
        options: [
          "La réglementation sur les cosmétiques évolue rarement",
          "Certains ingrédients ou pratiques peuvent être interdits ou encadrés différemment avec le temps, et une méconnaissance expose à un risque pour le client et une non-conformité professionnelle",
          "La formation continue ne concerne que les gérants d'institut",
          "Elle n'a aucun lien avec la sécurité des soins prodigués",
          "Elle est facultative pour les professionnels expérimentés",
        ],
        correctIndex: 1,
        explanation:
          "La réglementation sur les produits cosmétiques évolue (ingrédients interdits, nouvelles normes) : une méconnaissance expose à un risque pour le client et à une non-conformité professionnelle, d'où l'importance de la formation continue.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la limite légale entre un soin esthétique et un acte médical réservé aux professionnels de santé (ex: injections, actes invasifs) ?",
        options: [
          "Il n'existe aucune limite légale, un esthéticien peut pratiquer n'importe quel acte avec une formation suffisante",
          "Certains actes (injections, épilation définitive par certaines techniques, actes touchant à l'intégrité de la peau au-delà de la superficie) sont réservés par la loi à des professionnels de santé, sous peine d'exercice illégal de la médecine",
          "Cette limite ne concerne que les actes chirurgicaux lourds",
          "Un esthéticien peut pratiquer tout acte non chirurgical sans restriction légale",
          "Cette réglementation a été supprimée en France depuis 2015",
        ],
        correctIndex: 1,
        explanation:
          "Certains actes (injections, certaines techniques d'épilation définitive, actes touchant à l'intégrité de la peau au-delà de la superficie) sont réservés par la loi à des professionnels de santé -- les pratiquer sans qualification expose à des poursuites pour exercice illégal de la médecine.",
      },
      {
        question: "Pourquoi la réglementation européenne sur les produits cosmétiques (règlement CE 1223/2009) impose-t-elle un dossier d'information produit (DIP) pour chaque produit commercialisé ?",
        options: [
          "Cette obligation n'existe pas en pratique",
          "Elle garantit la traçabilité de la composition et de l'évaluation de sécurité de chaque produit, permettant de réagir rapidement en cas de problème (effet indésirable, rappel)",
          "Le DIP ne concerne que les produits importés hors Union européenne",
          "Il remplace totalement le besoin d'évaluation de sécurité par un toxicologue",
          "Il est facultatif pour les petites marques artisanales",
        ],
        correctIndex: 1,
        explanation:
          "Le dossier d'information produit garantit la traçabilité de la composition et de l'évaluation de sécurité (réalisée par un évaluateur qualifié) de chaque produit cosmétique commercialisé dans l'UE, permettant une réaction rapide en cas de problème identifié.",
      },
      {
        question: "Qu'est-ce que le principe de précaution appliqué aux nouveaux ingrédients cosmétiques, et pourquoi certains ingrédients autorisés hier sont-ils réévalués aujourd'hui ?",
        options: [
          "Un ingrédient une fois autorisé ne peut plus jamais être réévalué",
          "L'évaluation scientifique évolue avec de nouvelles données (études toxicologiques, effets à long terme), pouvant conduire à restreindre ou interdire un ingrédient auparavant jugé sûr",
          "Le principe de précaution ne s'applique qu'aux médicaments, jamais aux cosmétiques",
          "Les ingrédients cosmétiques ne font l'objet d'aucune réévaluation après leur mise sur le marché",
          "Ce principe interdit l'usage de tout ingrédient nouveau depuis 2020",
        ],
        correctIndex: 1,
        explanation:
          "L'évaluation scientifique évolue avec de nouvelles données disponibles : un ingrédient jugé sûr à un moment donné peut être réévalué et restreint si de nouvelles études soulèvent un doute -- un processus continu de vigilance sanitaire.",
      },
      {
        question: "Pourquoi la formation à l'anatomie et à la physiologie de la peau est-elle indispensable au-delà de la simple maîtrise des gestes techniques ?",
        options: [
          "Cette formation n'a qu'un intérêt théorique sans application pratique",
          "Comprendre les mécanismes biologiques de la peau permet d'adapter un soin de façon pertinente selon son état réel, et de repérer une anomalie nécessitant une orientation vers un professionnel de santé",
          "L'anatomie de la peau ne concerne que les dermatologues",
          "Elle remplace totalement le besoin de pratique technique",
          "Elle n'a aucun lien avec la sécurité des soins prodigués",
        ],
        correctIndex: 1,
        explanation:
          "Comprendre les mécanismes biologiques de la peau permet d'adapter un soin à son état réel et de repérer une anomalie (lésion suspecte, infection) nécessitant une orientation vers un professionnel de santé -- une compétence de discernement au-delà du seul geste technique.",
      },
      {
        question: "Qu'est-ce que le \"greenwashing\" appliqué à la cosmétique, et comment un professionnel peut-il évaluer objectivement une allégation \"naturelle\" ou \"bio\" ?",
        options: [
          "Toute mention \"naturel\" ou \"bio\" sur un produit cosmétique est nécessairement vérifiée et garantie par la loi",
          "Certaines allégations marketing exagèrent ou détournent la naturalité réelle d'un produit ; seules des certifications reconnues (labels bio encadrés) offrent une garantie vérifiable, contrairement à une simple mention non certifiée",
          "Le greenwashing ne concerne pas le secteur cosmétique",
          "Un produit contenant au moins un ingrédient naturel peut légalement se prétendre \"100% naturel\" sans autre exigence",
          "Cette question n'a aucune pertinence pour un professionnel de l'esthétique",
        ],
        correctIndex: 1,
        explanation:
          "Certaines allégations marketing (\"naturel\", \"bio\") ne sont pas systématiquement encadrées légalement : seules des certifications reconnues et vérifiables offrent une garantie réelle, un discernement utile pour conseiller honnêtement les clients.",
      },
      {
        question: "Pourquoi la traçabilité des lots de produits utilisés en institut est-elle importante en cas de réaction indésirable signalée par un client ?",
        options: [
          "Cette traçabilité n'a aucune utilité pratique une fois le soin terminé",
          "Elle permet d'identifier précisément le produit et le lot en cause, de vérifier s'il existe un signalement similaire ailleurs, et de déclencher si besoin une procédure de cosmétovigilance",
          "La traçabilité ne concerne que les produits vendus à emporter",
          "Elle est facultative si l'institut travaille avec une seule marque",
          "Elle ne sert qu'à la comptabilité de l'institut",
        ],
        correctIndex: 1,
        explanation:
          "En cas de réaction indésirable, la traçabilité du lot permet d'identifier précisément le produit en cause, de croiser avec d'autres signalements éventuels, et de déclencher si besoin une procédure de cosmétovigilance auprès des autorités sanitaires.",
      },
      {
        question: "Qu'est-ce que le consentement éclairé appliqué à un soin esthétique invasif ou à risque, et pourquoi sa formalisation protège-t-elle à la fois le client et le professionnel ?",
        options: [
          "Le consentement oral suffit toujours, aucune formalisation n'est utile",
          "Il implique d'informer clairement le client des risques, résultats attendus et alternatives avant le soin, et sa formalisation (fiche signée) constitue une preuve en cas de litige ultérieur sur l'information donnée",
          "Le consentement éclairé ne concerne que les actes médicaux, jamais l'esthétique",
          "Il élimine totalement la responsabilité du professionnel en cas de complication",
          "Il n'est exigé que pour les clients mineurs",
        ],
        correctIndex: 1,
        explanation:
          "Informer clairement des risques et alternatives avant un soin à risque, et formaliser ce consentement par écrit, protège le client (information réelle) et le professionnel (preuve en cas de litige sur l'information donnée) -- une pratique de plus en plus recommandée pour les soins les plus engageants.",
      },
    ],
  },

  aerien_aeroportuaire: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le secteur aérien / aéroportuaire ?",
        options: [
          "J'aime l'idée de travailler dans un environnement international, rigoureux et dynamique",
          "Parce que je veux juste voyager gratuitement",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour un environnement international et rigoureux est une motivation authentique, bien plus solide qu'une motivation centrée sur un avantage personnel.",
      },
      {
        question: "Pourquoi la ponctualité est-elle absolument critique dans ce secteur ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce qu'un retard peut avoir un effet en cascade sur toute une chaîne d'opérations (correspondances, rotation des avions, autres passagers)",
          "La ponctualité ne concerne que les pilotes",
          "Ça n'a aucun lien avec la satisfaction des passagers",
          "Uniquement pour respecter le règlement intérieur",
        ],
        correctIndex: 1,
        explanation:
          "Un retard dans ce secteur se répercute souvent en cascade sur toute une chaîne d'opérations (correspondances, rotation des avions) : la ponctualité est un enjeu opérationnel majeur, pas une simple question de discipline.",
      },
      {
        question: "Un passager se montre très anxieux avant l'embarquement. Quelle est la meilleure réaction ?",
        options: [
          "L'ignorer si ce n'est pas directement ton rôle",
          "Rester calme, rassurant et répondre clairement à ses questions pour l'aider à se sentir en sécurité",
          "Le presser pour qu'il embarque plus vite",
          "Le rabrouer s'il pose beaucoup de questions",
          "Le laisser à un collègue sans lui parler",
        ],
        correctIndex: 1,
        explanation:
          "Rester calme et rassurant face à l'anxiété d'un passager, en répondant clairement à ses questions, fait partie du rôle d'accompagnement attendu dans ce secteur en contact avec le public.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être stressé(e) sous forte pression, donc j'apprends à rester méthodique même en situation tendue",
          "Je n'aime pas les horaires décalés",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié à la gestion du stress sous pression, essentielle dans ce secteur, avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi le respect strict des procédures de sécurité est-il non négociable dans le secteur aérien ?",
        options: [
          "Ce n'est pas plus strict que dans d'autres secteurs",
          "Parce qu'un manquement, même mineur en apparence, peut avoir des conséquences graves sur la sécurité des passagers et de l'appareil",
          "Les procédures de sécurité ne concernent que le personnel navigant",
          "Ça n'a aucun lien avec la fiabilité globale du transport aérien",
          "Elles sont facultatives en dehors des heures de pointe",
        ],
        correctIndex: 1,
        explanation:
          "Dans l'aérien, un manquement même mineur en apparence à une procédure de sécurité peut avoir des conséquences graves : la rigueur procédurale est non négociable, quel que soit le poste occupé.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu une situation de forte affluence avec plusieurs vols retardés simultanément ?",
        options: [
          "Je panique et néglige la communication avec les passagers",
          "Je priorise les informations essentielles à communiquer et reste organisé(e) malgré la pression, en coordination avec l'équipe",
          "Je bâcle les procédures pour aller plus vite",
          "J'ignore les passagers les plus insistants",
          "Je considère qu'il n'y a rien à faire dans ce genre de situation",
        ],
        correctIndex: 1,
        explanation:
          "Prioriser la communication essentielle et rester organisé en coordination avec l'équipe, plutôt que de céder à la panique ou de bâcler les procédures, est la compétence clé en situation de forte pression opérationnelle.",
      },
      {
        question: "Pourquoi la communication claire et sans ambiguïté est-elle particulièrement critique dans les métiers aéroportuaires/aériens ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce qu'un malentendu de communication (consignes, informations passagers, coordination entre équipes) peut avoir des conséquences opérationnelles ou sécuritaires importantes",
          "La communication ne concerne que les annonces au micro",
          "Elle n'a aucun lien avec la sécurité des opérations",
          "Elle est secondaire par rapport à la rapidité d'exécution",
        ],
        correctIndex: 1,
        explanation:
          "Un malentendu de communication dans ce secteur (consignes de sécurité, coordination entre équipes) peut avoir des conséquences opérationnelles ou sécuritaires importantes : la clarté prime toujours sur la rapidité.",
      },
      {
        question: "Comment réagis-tu face à un passager mécontent qui devient agressif verbalement suite à une annulation de vol ?",
        options: [
          "Je réponds sur le même ton pour me faire respecter",
          "Je reste calme, j'écoute sa frustration et l'oriente vers les solutions concrètes disponibles (réacheminement, indemnisation)",
          "Je l'ignore complètement",
          "Je le fais évacuer immédiatement sans discussion",
          "Je cède à toutes ses demandes pour éviter le conflit",
        ],
        correctIndex: 1,
        explanation:
          "Rester calme et orienter vers des solutions concrètes désamorce la tension bien plus efficacement qu'une réponse sur le même registre émotionnel ou une gestion évasive.",
      },
      {
        question: "Pourquoi la coordination entre les différents corps de métier (piste, escale, navigants, contrôle) est-elle un défi opérationnel majeur ?",
        options: [
          "Cette coordination n'a pas vraiment d'importance, chacun travaille de façon indépendante",
          "Chaque étape (embarquement, chargement, ravitaillement, contrôle) dépend du bon déroulement des précédentes dans un temps très contraint, rendant la synchronisation entre équipes essentielle",
          "La coordination ne concerne que les vols long-courriers",
          "Elle n'a aucun impact sur la ponctualité globale",
          "Elle est entièrement automatisée sans besoin d'intervention humaine",
        ],
        correctIndex: 1,
        explanation:
          "Les étapes d'une escale (embarquement, chargement, ravitaillement, contrôle) s'enchaînent dans un temps très contraint : une mauvaise synchronisation entre équipes peut retarder tout le processus, d'où l'importance de la coordination.",
      },
      {
        question: "Comment t'adaptes-tu à la diversité culturelle et linguistique des passagers dans ce secteur international ?",
        options: [
          "Je considère que tous les passagers doivent s'adapter à une seule façon de communiquer",
          "Je reste attentif(ve) aux différences culturelles et j'utilise un langage simple et universel, avec le support de l'anglais si besoin",
          "Je néglige totalement les différences culturelles",
          "Je refuse d'interagir avec les passagers ne parlant pas ma langue",
          "L'adaptation culturelle n'a aucune importance dans ce métier",
        ],
        correctIndex: 1,
        explanation:
          "Rester attentif aux différences culturelles et utiliser un langage simple et universel (souvent l'anglais) est une compétence clé dans un secteur par nature international, au contact de passagers très divers.",
      },
      {
        question: "Pourquoi la gestion du décalage horaire et des rythmes de travail atypiques nécessite-t-elle une vraie discipline personnelle ?",
        options: [
          "Ce n'est pas vraiment un enjeu dans ce secteur",
          "Parce que des horaires décalés et irréguliers peuvent affecter la vigilance et la santé si l'hygiène de vie (sommeil, récupération) n'est pas gérée avec rigueur",
          "Le décalage horaire ne concerne que le personnel navigant long-courrier",
          "Il n'a aucun impact sur la sécurité ou la qualité du travail",
          "Il se résout automatiquement après quelques mois d'expérience",
        ],
        correctIndex: 1,
        explanation:
          "Des horaires décalés et irréguliers peuvent affecter la vigilance si l'hygiène de vie n'est pas gérée avec rigueur : une discipline personnelle réelle (sommeil, récupération) est nécessaire pour maintenir sécurité et performance.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le règlement européen CE 261/2004 encadre concrètement pour les passagers aériens ?",
        options: [
          "Il ne concerne que la sécurité technique des appareils",
          "Il définit les droits des passagers en cas de refus d'embarquement, annulation ou retard important de vol, incluant des indemnisations forfaitaires selon la distance et le délai",
          "Il ne s'applique qu'aux vols intérieurs français",
          "Il a été abrogé et remplacé par une réglementation purement nationale",
          "Il ne concerne que les compagnies low-cost",
        ],
        correctIndex: 1,
        explanation:
          "Le règlement CE 261/2004 définit les droits des passagers (information, prise en charge, indemnisation forfaitaire selon la distance et le retard) en cas de refus d'embarquement, annulation ou retard important -- un texte de référence à connaître pour tout poste en contact avec les passagers.",
      },
      {
        question: "Qu'est-ce que le \"slot\" aéroportuaire (créneau horaire) et pourquoi sa gestion est-elle si stratégique pour les compagnies et aéroports ?",
        options: [
          "Un simple horaire indicatif sans réelle contrainte",
          "Un droit d'atterrissage ou de décollage attribué à un horaire précis sur un aéroport donné, une ressource rare et réglementée dont la gestion conditionne directement la capacité opérationnelle d'une compagnie sur cet aéroport",
          "Un terme qui ne concerne que les aéroports militaires",
          "Une notion abandonnée avec la digitalisation du contrôle aérien",
          "Un droit qui peut être utilisé librement sans aucune contrainte de créneau précis",
        ],
        correctIndex: 1,
        explanation:
          "Le slot est un droit précis d'atterrissage/décollage à un horaire donné sur un aéroport souvent saturé : une ressource rare et réglementée (règles \"use it or lose it\") dont l'attribution conditionne directement la capacité opérationnelle d'une compagnie.",
      },
      {
        question: "Pourquoi la \"culture juste\" (just culture) en sécurité aérienne encourage-t-elle le signalement des erreurs plutôt que leur dissimulation ?",
        options: [
          "Cette approche n'existe pas dans l'aérien, toute erreur est systématiquement sanctionnée",
          "Elle distingue l'erreur humaine involontaire (à analyser pour améliorer le système) de la faute délibérée (sanctionnable), encourageant le signalement volontaire des incidents pour identifier des risques systémiques avant qu'un accident grave ne survienne",
          "Elle vise uniquement à protéger les compagnies aériennes de toute responsabilité juridique",
          "Elle a été abandonnée après plusieurs accidents aériens majeurs",
          "Elle ne concerne que les pilotes, jamais le personnel au sol",
        ],
        correctIndex: 1,
        explanation:
          "La culture juste distingue l'erreur humaine involontaire (analysée pour améliorer le système) de la faute délibérée (sanctionnable), encourageant le signalement volontaire des incidents -- un principe reconnu comme central dans la prévention des accidents aériens graves.",
      },
      {
        question: "Qu'est-ce que le concept de \"redondance\" en sécurité aéronautique et pourquoi structure-t-il la conception des systèmes critiques ?",
        options: [
          "Un principe qui consiste à éviter toute duplication de système pour limiter les coûts",
          "Un principe de conception qui duplique les systèmes critiques (moteurs, instruments, systèmes de secours) pour qu'une défaillance isolée ne compromette jamais la sécurité globale du vol",
          "Un concept qui ne concerne que les procédures administratives au sol",
          "Une pratique abandonnée au profit de systèmes uniques plus fiables",
          "Un principe qui ne s'applique qu'aux très gros porteurs long-courriers",
        ],
        correctIndex: 1,
        explanation:
          "La redondance duplique volontairement les systèmes critiques (moteurs, instruments, systèmes de secours) pour qu'une défaillance isolée d'un composant ne compromette jamais la sécurité globale du vol -- un principe fondamental de la conception aéronautique.",
      },
      {
        question: "Pourquoi la certification et l'agrément des personnels aéroportuaires (badge, habilitations sûreté) impliquent-ils un processus de contrôle particulièrement strict ?",
        options: [
          "Ce processus est purement administratif, sans réel enjeu de sécurité",
          "L'accès aux zones sensibles d'un aéroport (zones réservées, pistes) présente un enjeu de sûreté majeur, nécessitant une vérification approfondie des antécédents avant toute habilitation",
          "Ce contrôle ne concerne que le personnel navigant",
          "Il a été supprimé après la simplification des procédures de sûreté aéroportuaire",
          "Il est identique au contrôle d'accès de n'importe quel bâtiment d'entreprise",
        ],
        correctIndex: 1,
        explanation:
          "L'accès aux zones sensibles d'un aéroport présente un enjeu de sûreté majeur (prévention du terrorisme, de la fraude, du vol) : une vérification approfondie des antécédents est requise avant toute habilitation, un processus bien plus strict qu'un contrôle d'accès classique.",
      },
      {
        question: "Qu'est-ce que le facteur humain (human factors) et pourquoi est-il considéré comme une cause majeure d'incidents dans l'aviation, malgré la fiabilité technique croissante des appareils ?",
        options: [
          "Le facteur humain n'a plus aucun impact avec les avions modernes très automatisés",
          "Les études d'accidentologie montrent que la majorité des incidents impliquent une part de facteur humain (fatigue, communication, prise de décision sous pression), ce qui justifie une formation continue centrée sur ces compétences non techniques",
          "Le facteur humain ne concerne que les pilotes, jamais le personnel au sol",
          "Il a été éliminé par l'automatisation complète des procédures critiques",
          "Ce concept ne s'applique qu'aux petites compagnies aériennes régionales",
        ],
        correctIndex: 1,
        explanation:
          "Les études d'accidentologie montrent qu'une majorité d'incidents impliquent une part de facteur humain (fatigue, communication, décision sous pression), même sur des appareils techniquement très fiables -- d'où l'importance croissante des formations aux compétences non techniques (CRM) dans tout le secteur.",
      },
      {
        question: "Pourquoi la gestion de crise (incident technique, situation sanitaire, menace sûreté) dans un aéroport nécessite-t-elle des plans coordonnés entre de multiples acteurs institutionnels ?",
        options: [
          "Un aéroport peut gérer seul toute situation de crise, sans coordination externe",
          "Un aéroport implique de multiples acteurs (compagnies, douanes, police, services de secours, autorités sanitaires) dont la réponse coordonnée est indispensable pour une gestion efficace d'une crise complexe",
          "Cette coordination ne concerne que les très grands aéroports internationaux",
          "Les plans de gestion de crise sont identiques quel que soit le type d'incident",
          "Cette coordination institutionnelle a été supprimée au profit d'une gestion centralisée unique",
        ],
        correctIndex: 1,
        explanation:
          "Un aéroport rassemble de multiples acteurs institutionnels (compagnies, douanes, police, secours, autorités sanitaires) : une gestion de crise efficace nécessite des plans coordonnés et des exercices réguliers entre ces différents acteurs, chacun ayant des prérogatives distinctes.",
      },
    ],
  },

  metiers_bouche: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en boulangerie / pâtisserie / métiers de bouche ?",
        options: [
          "J'aime créer quelque chose de concret qui apporte du plaisir aux gens au quotidien",
          "Parce que ça a l'air un métier facile qui consiste juste à décorer des gâteaux",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le plaisir de créer un produit concret et apprécié au quotidien est au cœur du métier -- une motivation bien plus solide qu'une idée réductrice sur la décoration.",
      },
      {
        question: "Pourquoi le respect strict des horaires de production est-il essentiel dans ce métier ?",
        options: [
          "Ce n'est pas vraiment important tant que le produit est bon",
          "Parce que la fabrication (fermentation, cuisson) suit des temps précis, et un décalage peut compromettre la qualité du produit fini et l'heure d'ouverture",
          "Les horaires ne concernent que les grandes boulangeries industrielles",
          "Ça n'a aucun lien avec la satisfaction client",
          "Uniquement pour respecter une habitude du métier",
        ],
        correctIndex: 1,
        explanation:
          "Les temps de fermentation et de cuisson sont précis et peu flexibles : un décalage peut compromettre la qualité du produit et retarder l'ouverture, avec un impact direct sur les clients matinaux.",
      },
      {
        question: "Un client se plaint qu'un produit acheté la veille n'était pas frais. Que fais-tu ?",
        options: [
          "Je conteste systématiquement sa remarque",
          "Je m'excuse, propose un geste commercial et vérifie la gestion des stocks pour éviter que ça se reproduise",
          "J'ignore la remarque si le produit semblait correct au moment de la vente",
          "Je blâme le client d'avoir mal conservé le produit",
          "Je refuse tout geste commercial",
        ],
        correctIndex: 1,
        explanation:
          "S'excuser, proposer un geste commercial et vérifier la gestion des stocks transforme un incident en opportunité de fidélisation, plutôt qu'en conflit.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste sur la présentation, donc j'apprends à respecter les cadences de production",
          "Je n'aime pas me lever tôt",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce métier (le perfectionnisme face aux contraintes de cadence), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi l'hygiène est-elle une priorité absolue en boulangerie-pâtisserie ?",
        options: [
          "C'est surtout pour l'image de la boutique",
          "Parce qu'un manquement d'hygiène peut provoquer une intoxication alimentaire, un risque direct pour la santé des clients",
          "L'hygiène ne concerne que les produits à base de crème",
          "Ce n'est important qu'en cas de contrôle sanitaire",
          "Ça ne concerne que les grandes enseignes",
        ],
        correctIndex: 1,
        explanation:
          "Un manquement d'hygiène peut provoquer une intoxication alimentaire, un risque de santé publique réel : ce n'est jamais une simple question d'image.",
      },
    ],
    medium: [
      {
        question: "Pourquoi la maîtrise des temps de fermentation est-elle une compétence technique clé en boulangerie ?",
        options: [
          "La fermentation n'a aucun impact sur le goût ou la texture du pain",
          "Elle influence directement le développement des arômes, la texture de la mie et la conservation du pain, et dépend de facteurs variables (température, hygrométrie)",
          "Elle est identique quelle que soit la température ambiante",
          "Elle ne concerne que les pains spéciaux, jamais la baguette classique",
          "Elle peut être totalement standardisée sans ajustement",
        ],
        correctIndex: 1,
        explanation:
          "La fermentation influence directement arômes, texture et conservation du pain, et dépend de facteurs variables (température, hygrométrie) qu'un bon boulanger doit savoir ajuster au jour le jour.",
      },
      {
        question: "Comment gères-tu la gestion des invendus en fin de journée, entre limitation du gaspillage et qualité offerte au client ?",
        options: [
          "Je vends systématiquement tous les invendus au prix normal le lendemain",
          "J'anticipe au mieux la production selon la demande habituelle, et propose une réduction ou une seconde vie (offre solidaire, tarif réduit) pour les invendus du jour plutôt que de les jeter",
          "Je jette systématiquement tous les invendus sans chercher de solution",
          "Je considère que la gestion des invendus n'a pas vraiment d'importance",
          "Je surproduis systématiquement pour ne jamais être en rupture, sans me soucier du gaspillage",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper la production selon la demande réelle et donner une seconde vie aux invendus (réduction, dons) limite le gaspillage tout en respectant la fraîcheur attendue par les clients.",
      },
      {
        question: "Pourquoi la sélection des matières premières (farine, beurre, chocolat) a-t-elle un impact déterminant sur le résultat final ?",
        options: [
          "La qualité de la matière première n'a qu'un impact marginal sur le résultat",
          "Chaque matière première a des propriétés spécifiques (taux de protéines de la farine, qualité du beurre) qui influencent directement texture, goût et tenue du produit fini",
          "Il suffit toujours de choisir la matière première la moins chère pour un bon résultat",
          "Cette sélection ne concerne que la pâtisserie de très haut niveau",
          "Le choix des matières premières est imposé par la réglementation, sans marge de choix",
        ],
        correctIndex: 1,
        explanation:
          "Chaque matière première a des propriétés techniques précises (ex: taux de protéines de la farine pour la force du réseau de gluten) qui influencent directement le résultat final : un choix qui n'est jamais anodin.",
      },
      {
        question: "Comment réagis-tu si une fournée entière ne correspond pas aux standards de qualité habituels ?",
        options: [
          "Je la vends quand même pour ne pas perdre la production",
          "J'évalue l'écart réel de qualité et décide en conséquence (vente à prix réduit avec information transparente, ou retrait si le défaut est important)",
          "Je jette systématiquement toute la fournée sans évaluation",
          "Je vends la fournée sans en informer les clients",
          "Je considère qu'un écart de qualité n'a jamais à être pris en compte",
        ],
        correctIndex: 1,
        explanation:
          "Évaluer honnêtement l'écart de qualité avant de décider (vente transparente à prix réduit, ou retrait si nécessaire) protège à la fois la satisfaction client et la réputation de l'établissement.",
      },
      {
        question: "Pourquoi la diversification de l'offre (pains spéciaux, produits sans gluten, viennoiseries revisitées) est-elle devenue importante face à la concurrence ?",
        options: [
          "Ce n'est pas vraiment nécessaire, l'offre traditionnelle suffit toujours",
          "Elle permet de répondre à des attentes clients plus variées (régimes spécifiques, nouvelles tendances) et de se différencier dans un marché très concurrentiel",
          "La diversification ne concerne que les grandes chaînes",
          "Elle n'a aucun impact sur la fidélisation de la clientèle",
          "Elle remplace totalement le besoin de maîtriser les produits traditionnels",
        ],
        correctIndex: 1,
        explanation:
          "Répondre à des attentes clients plus variées (régimes spécifiques, nouvelles tendances) permet de se différencier dans un marché concurrentiel, sans pour autant remplacer la maîtrise des produits traditionnels qui reste la base du métier.",
      },
      {
        question: "Pourquoi la relation avec les fournisseurs (agriculteurs, minotiers, affineurs) peut-elle devenir un argument de différenciation commerciale ?",
        options: [
          "La relation fournisseur n'a aucun impact sur la perception du client final",
          "Une traçabilité et une relation directe avec des producteurs identifiés valorisent le produit auprès de clients de plus en plus attentifs à l'origine et à la qualité des ingrédients",
          "Cette relation ne concerne que les très grandes enseignes avec un service achats dédié",
          "Elle n'a aucun lien avec le prix de vente final au client",
          "Elle est identique quel que soit le type de produit vendu",
        ],
        correctIndex: 1,
        explanation:
          "Une traçabilité claire et une relation directe avec des producteurs identifiés valorisent le produit auprès de clients de plus en plus attentifs à l'origine et à la qualité, un vrai levier de différenciation commerciale.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la certification \"Artisan Boulanger\" garantit légalement en France, et pourquoi cette réglementation existe-t-elle ?",
        options: [
          "Ce titre est purement décoratif, sans encadrement légal réel",
          "En France, l'appellation \"boulangerie\"/\"artisan boulanger\" est encadrée légalement, imposant notamment que le pain soit pétri, façonné et cuit sur place, protégeant le consommateur d'une confusion avec du pain industriel simplement terminé sur site",
          "Cette appellation ne concerne que les boulangeries labellisées bio",
          "Elle garantit uniquement l'origine française de la farine utilisée",
          "Elle a été supprimée par la réglementation européenne sur la libre concurrence",
        ],
        correctIndex: 1,
        explanation:
          "En France, l'appellation \"boulangerie\" (décret de 1998) impose que le pain soit pétri, façonné et cuit sur le lieu de vente, une protection légale du consommateur contre la confusion avec du pain industriel simplement terminé sur place (\"cuisson sur place\").",
      },
      {
        question: "Pourquoi la maîtrise de la réaction de Maillard est-elle centrale pour comprendre la coloration et les arômes développés à la cuisson ?",
        options: [
          "La réaction de Maillard ne concerne que la caramélisation du sucre pur",
          "C'est une réaction chimique entre acides aminés et sucres réducteurs sous l'effet de la chaleur, responsable de la coloration dorée et d'une grande partie des arômes complexes développés à la cuisson du pain et des pâtisseries",
          "Cette réaction n'a aucun lien avec la température de cuisson",
          "Elle ne s'applique qu'aux produits contenant de la viande",
          "Elle a été récemment invalidée par la recherche en science des aliments",
        ],
        correctIndex: 1,
        explanation:
          "La réaction de Maillard, une réaction chimique entre acides aminés et sucres sous l'effet de la chaleur, est responsable de la coloration dorée et d'une grande partie des arômes complexes développés à la cuisson -- une base scientifique utile pour ajuster précisément un temps ou une température de cuisson.",
      },
      {
        question: "Qu'est-ce que la traçabilité des allergènes majeurs impose légalement à un artisan des métiers de bouche ?",
        options: [
          "Aucune obligation légale ne concerne les artisans, seulement l'industrie agroalimentaire",
          "La réglementation impose d'informer le consommateur sur la présence des allergènes majeurs (gluten, œufs, fruits à coque, etc.) dans chaque produit vendu, y compris en vente directe non préemballée",
          "Cette obligation ne concerne que les produits vendus en supermarché",
          "Elle ne s'applique qu'aux produits contenant plus de 5% d'un allergène",
          "Elle est facultative si le produit est fabriqué de façon artisanale",
        ],
        correctIndex: 1,
        explanation:
          "La réglementation (notamment le règlement INCO au niveau européen) impose d'informer le consommateur sur la présence des allergènes majeurs, y compris pour les produits non préemballés vendus en direct par un artisan -- une obligation qui protège des consommateurs pouvant avoir des réactions graves.",
      },
      {
        question: "Pourquoi le taux d'hydratation d'une pâte à pain est-il un paramètre technique déterminant, et pourquoi son ajustement demande-t-il de l'expérience ?",
        options: [
          "Le taux d'hydratation n'a qu'un impact marginal sur le résultat final",
          "Il influence directement la structure de la mie, la conservation et la difficulté de façonnage, et son ajustement optimal dépend de la farine utilisée, de la température et de l'hygrométrie ambiante, des facteurs qui varient au quotidien",
          "Il est identique pour tous les types de pain, sans variation possible",
          "Il ne concerne que les pains dits \"de tradition\"",
          "Il peut être calculé une fois pour toutes sans jamais être réajusté",
        ],
        correctIndex: 1,
        explanation:
          "Le taux d'hydratation influence directement la structure de la mie, la conservation et la difficulté de façonnage ; son ajustement optimal varie selon la farine, la température et l'hygrométrie ambiante -- d'où l'expérience nécessaire pour l'adapter au jour le jour plutôt que d'appliquer une formule fixe.",
      },
      {
        question: "Qu'est-ce que le levain naturel, et en quoi sa gestion diffère-t-elle fondamentalement de celle de la levure boulangère industrielle ?",
        options: [
          "Le levain naturel et la levure industrielle sont deux noms différents pour le même produit",
          "Le levain est une culture vivante de bactéries et levures sauvages, nécessitant un entretien quotidien (rafraîchi régulièrement) et donnant des résultats plus variables mais des arômes plus complexes que la levure industrielle standardisée",
          "Le levain naturel donne toujours un résultat plus rapide que la levure industrielle",
          "La gestion du levain ne demande aucun entretien particulier une fois créé",
          "Le levain naturel a été interdit dans la boulangerie professionnelle française",
        ],
        correctIndex: 1,
        explanation:
          "Le levain est une culture vivante de bactéries et levures sauvages nécessitant un entretien quotidien rigoureux (rafraîchi), avec des résultats plus variables mais des arômes plus complexes que la levure industrielle standardisée -- une gestion exigeante qui distingue nettement les deux approches.",
      },
      {
        question: "Pourquoi la chaîne du froid est-elle un point critique de sécurité alimentaire particulièrement sensible pour les produits pâtissiers à base de crème ou de produits laitiers ?",
        options: [
          "La chaîne du froid n'a d'impact que sur la texture, jamais sur la sécurité sanitaire",
          "Une rupture de la chaîne du froid favorise la prolifération bactérienne dans des produits à base de crème ou d'œufs, particulièrement propices au développement de pathogènes comme la salmonelle",
          "Elle ne concerne que les produits vendus en grande surface",
          "Elle est identique en exigence à celle du pain, qui ne contient pas de produits sensibles",
          "Ce risque a été éliminé par les conservateurs alimentaires modernes",
        ],
        correctIndex: 1,
        explanation:
          "Les produits à base de crème, d'œufs ou de produits laitiers sont particulièrement propices au développement de pathogènes (comme la salmonelle) en cas de rupture de la chaîne du froid -- un point de vigilance sanitaire majeur pour la pâtisserie.",
      },
      {
        question: "Qu'est-ce que la conduite de fermentation contrôlée (pointage/apprêt en chambre de pousse programmable) apporte à l'organisation d'une production en boulangerie, au-delà du confort ?",
        options: [
          "Elle n'apporte qu'un gain de confort, sans réel bénéfice organisationnel",
          "Elle permet de décaler et maîtriser précisément le moment où la pâte arrive à maturité, offrant une flexibilité d'organisation du travail (horaires, gestion d'équipe) tout en garantissant une régularité de qualité",
          "Elle remplace totalement le savoir-faire du boulanger sur l'appréciation de la pâte",
          "Elle ne concerne que les très grandes boulangeries industrielles",
          "Elle a été interdite en boulangerie artisanale traditionnelle",
        ],
        correctIndex: 1,
        explanation:
          "Contrôler précisément la fermentation (via une chambre de pousse programmable) permet de décaler le moment de maturité de la pâte selon l'organisation souhaitée (horaires d'équipe), tout en garantissant une régularité de qualité -- un outil qui complète, sans le remplacer, le savoir-faire du boulanger sur l'appréciation sensorielle de la pâte.",
      },
    ],
  },
};
