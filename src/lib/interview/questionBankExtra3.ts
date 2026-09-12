// Troisième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_3: InterviewDomain[] = [
  { id: "assurance", label: "Assurance / Actuariat" },
  { id: "import_export", label: "Commerce international / Import-Export" },
  { id: "petite_enfance", label: "Petite enfance / Auxiliaire de puériculture" },
  { id: "securite_defense", label: "Sécurité / Défense / Police-Pompiers" },
  { id: "artisanat", label: "Artisanat / Métiers d'art" },
  { id: "environnement", label: "Environnement / Développement durable / RSE" },
  { id: "traduction_langues", label: "Traduction / Interprétariat / Langues" },
  { id: "documentation", label: "Bibliothèque / Documentation / Archives" },
  { id: "recherche_scientifique", label: "Recherche scientifique / Laboratoire" },
  { id: "diplomatie", label: "Affaires publiques / Diplomatie / International" },
];

export const EXTRA_BANK_3: Bank = {
  assurance: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'assurance ?",
        options: [
          "J'aime l'idée d'aider concrètement des gens à se protéger contre les imprévus",
          "Parce que ça a l'air un secteur facile et sans risque",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La dimension protection/accompagnement du client est le cœur du métier : une motivation centrée là-dessus est plus solide qu'une motivation liée à une image de facilité.",
      },
      {
        question: "Qu'est-ce qu'une prime d'assurance, en une phrase simple ?",
        options: [
          "Une récompense donnée aux bons conducteurs uniquement",
          "La somme versée par l'assuré en échange de la couverture d'un risque",
          "Le montant remboursé après un sinistre",
          "Une taxe prélevée par l'État sur les contrats",
          "Un bonus offert à la souscription",
        ],
        correctIndex: 1,
        explanation:
          "La prime est le prix payé par l'assuré pour transférer un risque à l'assureur -- une notion de base à maîtriser avant tout entretien dans le secteur.",
      },
      {
        question: "Un client appelle furieux après un refus de remboursement. Quelle est la meilleure réaction ?",
        options: [
          "Raccrocher pour éviter le conflit",
          "Écouter sa frustration, réexpliquer clairement les raisons du refus et l'orienter vers un recours possible si applicable",
          "Lui dire que c'est le règlement, point final",
          "Promettre un remboursement immédiat pour le calmer",
          "Transférer l'appel sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Écouter puis expliquer clairement avec pédagogie, en indiquant les voies de recours existantes, désamorce la tension sans jamais promettre quelque chose qu'on ne peut pas garantir.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop empathique avec le client, donc j'apprends à rester factuel tout en restant à l'écoute",
          "Je n'aime pas les chiffres",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié à l'équilibre empathie/rigueur, avec une piste d'amélioration concrète, montre une bonne compréhension des exigences du métier.",
      },
      {
        question: "Pourquoi la confidentialité des données clients est-elle particulièrement sensible dans l'assurance ?",
        options: [
          "Ce n'est pas plus sensible qu'ailleurs",
          "Parce que les dossiers contiennent des informations personnelles et parfois médicales très sensibles",
          "Uniquement pour respecter une norme esthétique",
          "La confidentialité ne concerne que les gros contrats",
          "Ça n'a aucun lien avec la confiance du client",
        ],
        correctIndex: 1,
        explanation:
          "Les dossiers d'assurance contiennent souvent des informations personnelles et médicales sensibles : leur protection est un enjeu de confiance client autant que légal (RGPD).",
      },
    ],
    medium: [
      {
        question: "Qu'est-ce qu'une franchise dans un contrat d'assurance ?",
        options: [
          "Le nom commercial de l'agence",
          "La part du sinistre qui reste à la charge de l'assuré, non remboursée par l'assureur",
          "Une réduction offerte à la signature",
          "Le délai avant que le contrat prenne effet",
          "Un type de contrat réservé aux professionnels",
        ],
        correctIndex: 1,
        explanation:
          "La franchise est la part du sinistre qui reste à la charge de l'assuré : une notion clé pour expliquer clairement un remboursement partiel à un client.",
      },
      {
        question: "Comment expliquerais-tu à un client la différence entre assurance \"tous risques\" et \"au tiers\" ?",
        options: [
          "Il n'y a aucune différence réelle, juste un nom marketing",
          "Le tiers couvre les dommages causés à autrui, le tous risques couvre en plus les dommages à son propre véhicule",
          "Le tous risques est toujours moins cher",
          "Le tiers couvre tout, le tous risques rien du tout",
          "Cette distinction ne concerne que l'assurance habitation",
        ],
        correctIndex: 1,
        explanation:
          "L'assurance au tiers couvre les dommages causés à autrui (responsabilité civile), le tous risques ajoute la couverture des dommages à son propre bien -- une distinction essentielle à savoir expliquer simplement.",
      },
      {
        question: "Un client sous-estime volontairement la valeur d'un bien à assurer pour payer moins cher. Quel est le risque ?",
        options: [
          "Aucun risque, c'est une pratique courante et sans conséquence",
          "En cas de sinistre, l'indemnisation peut être réduite proportionnellement (règle proportionnelle) voire refusée en cas de mauvaise foi avérée",
          "L'assureur augmente automatiquement la prime l'année suivante",
          "Le contrat est annulé immédiatement sans préavis",
          "Ça n'a aucun impact sur l'indemnisation future",
        ],
        correctIndex: 1,
        explanation:
          "Une sous-déclaration expose l'assuré à une réduction proportionnelle de l'indemnisation, voire à un refus en cas de mauvaise foi -- un point important à savoir expliquer en prévention.",
      },
      {
        question: "Pourquoi la gestion des délais de réponse est-elle cruciale dans le traitement d'un sinistre ?",
        options: [
          "Ce n'est pas vraiment important tant que le dossier finit par être traité",
          "Un client en sinistre est souvent en situation de stress ou d'urgence (dégât des eaux, accident) : un délai trop long dégrade fortement la confiance",
          "Les délais n'ont aucun encadrement légal",
          "Seuls les gros sinistres ont des délais à respecter",
          "La rapidité n'a aucun lien avec la satisfaction client",
        ],
        correctIndex: 1,
        explanation:
          "Un sinistre est souvent vécu dans l'urgence ou le stress par le client : la réactivité du traitement est un facteur clé de satisfaction et de fidélisation.",
      },
      {
        question: "Comment réagir face à un dossier de sinistre qui semble suspect (indices de fraude) ?",
        options: [
          "Rembourser quand même pour ne pas perdre le client",
          "Signaler le dossier selon la procédure de détection de fraude interne, sans accuser directement le client",
          "Ignorer les indices si le montant est faible",
          "Accuser directement le client de fraude au téléphone",
          "Refuser tout remboursement sans justification",
        ],
        correctIndex: 1,
        explanation:
          "Un dossier suspect doit suivre la procédure interne de détection de fraude, avec une investigation factuelle -- jamais une accusation directe non étayée, ni un remboursement automatique par confort.",
      },
      {
        question: "Pourquoi la pédagogie est-elle une compétence clé dans la vente de produits d'assurance ?",
        options: [
          "Ce n'est pas vraiment utile, le client lit toujours les conditions générales",
          "Parce que les contrats sont souvent complexes et le client doit comprendre précisément ce qu'il achète pour éviter les malentendus au moment d'un sinistre",
          "Uniquement pour respecter une obligation administrative",
          "La pédagogie ne concerne que les contrats les plus chers",
          "Ça n'a aucun impact sur la satisfaction future du client",
        ],
        correctIndex: 1,
        explanation:
          "Un client qui comprend mal son contrat découvre souvent les limites de sa couverture au pire moment (lors d'un sinistre) : la pédagogie à la vente prévient l'insatisfaction et les litiges.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le principe indemnitaire en assurance de dommages ?",
        options: [
          "Le client peut toujours réclamer plus que la valeur réelle de son bien",
          "L'indemnisation ne doit jamais dépasser le préjudice réellement subi, pour éviter que l'assurance ne devienne une source d'enrichissement",
          "Un principe qui ne s'applique qu'à l'assurance vie",
          "Le montant de l'indemnisation est toujours fixe, quel que soit le sinistre",
          "Ce principe a été supprimé par la réglementation récente",
        ],
        correctIndex: 1,
        explanation:
          "Le principe indemnitaire garantit que l'assuré est remis dans la situation antérieure au sinistre, sans enrichissement -- un principe fondamental du droit des assurances de dommages.",
      },
      {
        question: "Quelle est la différence entre un contrat en \"valeur à neuf\" et un contrat avec \"vétusté déduite\" ?",
        options: [
          "Ce sont deux noms différents pour le même type de contrat",
          "La valeur à neuf indemnise sans tenir compte de l'usure du bien, la vétusté déduite retire un pourcentage lié à son âge/usure",
          "La vétusté déduite indemnise toujours plus que la valeur à neuf",
          "Ces notions ne concernent que l'assurance automobile",
          "La valeur à neuf ne s'applique qu'aux biens immobiliers",
        ],
        correctIndex: 1,
        explanation:
          "Un contrat en valeur à neuf remplace le bien sans décote liée à l'âge, tandis qu'un contrat avec vétusté déduite applique un coefficient de dépréciation -- une distinction majeure sur le montant réel perçu.",
      },
      {
        question: "Qu'est-ce que la déchéance de garantie et dans quel cas s'applique-t-elle ?",
        options: [
          "Une simple réduction de prime en cas de bon comportement",
          "La perte du droit à indemnisation pour un sinistre précis, en cas de manquement grave de l'assuré à ses obligations contractuelles (ex: fausse déclaration après sinistre)",
          "L'annulation automatique du contrat après un an sans sinistre",
          "Un avantage accordé aux clients fidèles",
          "Une déchéance qui ne concerne que les sociétés, jamais les particuliers",
        ],
        correctIndex: 1,
        explanation:
          "La déchéance de garantie prive l'assuré d'indemnisation pour un sinistre précis en cas de manquement grave (ex: fausse déclaration après sinistre) -- à distinguer de la nullité du contrat, plus large.",
      },
      {
        question: "Pourquoi la mutualisation des risques est-elle le principe fondateur du modèle assurantiel ?",
        options: [
          "Elle n'a qu'un intérêt marketing",
          "Elle permet de répartir le coût des sinistres rares mais coûteux sur l'ensemble des assurés, rendant la couverture individuelle abordable",
          "Elle garantit que chaque assuré paie exactement le coût de ses propres sinistres",
          "Elle ne concerne que la réassurance",
          "Elle a été abandonnée au profit d'une tarification 100% individualisée",
        ],
        correctIndex: 1,
        explanation:
          "La mutualisation répartit le coût des sinistres sur l'ensemble des assurés d'un même groupe de risque, rendant supportable individuellement un risque rare mais potentiellement très coûteux.",
      },
      {
        question: "Qu'est-ce que la réassurance et pourquoi les assureurs y ont-ils recours ?",
        options: [
          "Une seconde assurance que le client souscrit en plus de la première",
          "Un mécanisme par lequel l'assureur transfère une partie de ses risques à un autre acteur (réassureur), pour limiter son exposition aux sinistres exceptionnels",
          "Une obligation légale qui ne concerne que les mutuelles",
          "Un produit vendu directement aux particuliers",
          "Une pratique interdite en France depuis 2015",
        ],
        correctIndex: 1,
        explanation:
          "La réassurance permet à un assureur de transférer une partie de ses risques (notamment les plus catastrophiques) à un réassureur, sécurisant sa propre solvabilité face à des sinistres exceptionnels.",
      },
      {
        question: "Pourquoi le devoir de conseil de l'assureur est-il une obligation légale renforcée, et pas une simple bonne pratique commerciale ?",
        options: [
          "Ce n'est qu'une pratique commerciale facultative sans base légale",
          "Parce que la loi impose à l'assureur/distributeur de proposer un contrat adapté aux besoins réels du client, sous peine d'engager sa responsabilité en cas de mauvais conseil",
          "Le devoir de conseil ne concerne que les contrats collectifs",
          "Il a été supprimé avec la directive européenne DDA",
          "Il ne s'applique qu'aux contrats vendus en agence physique",
        ],
        correctIndex: 1,
        explanation:
          "Le devoir de conseil (renforcé par la directive européenne sur la distribution d'assurances, DDA) engage la responsabilité de l'assureur/distributeur si le contrat proposé n'est manifestement pas adapté aux besoins exprimés par le client.",
      },
      {
        question: "Qu'est-ce que le \"bonus-malus\" en assurance auto et comment reflète-t-il la notion de risque individualisé ?",
        options: [
          "Un tarif fixe identique pour tous les conducteurs",
          "Un coefficient qui ajuste la prime à la hausse (malus) ou à la baisse (bonus) selon l'historique de sinistralité responsable du conducteur",
          "Une remise commerciale sans lien avec le comportement au volant",
          "Un système réservé aux conducteurs professionnels",
          "Un dispositif purement facultatif que l'assureur peut ignorer",
        ],
        correctIndex: 1,
        explanation:
          "Le bonus-malus ajuste la prime selon l'historique de sinistralité responsable du conducteur : un mécanisme encadré réglementairement qui individualise concrètement le tarif au comportement réel.",
      },
    ],
  },

  import_export: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en commerce international / import-export ?",
        options: [
          "J'aime l'idée de connecter des marchés et des cultures différentes",
          "Parce que ça a l'air un métier qui voyage tout le temps sans contrainte",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour la dimension internationale et interculturelle du métier est une motivation authentique et bien identifiée dans ce secteur.",
      },
      {
        question: "Qu'est-ce qu'un incoterm, en une phrase simple ?",
        options: [
          "Un impôt douanier fixe appliqué à toutes les marchandises",
          "Une règle internationale qui définit les responsabilités et les coûts entre vendeur et acheteur dans un transport international",
          "Un type de contrat réservé aux grandes entreprises",
          "Une taxe sur les devises étrangères",
          "Un document réservé au transport maritime uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Les incoterms (ex: FOB, CIF) définissent clairement qui supporte quels coûts et risques à chaque étape du transport international -- une notion de base incontournable du métier.",
      },
      {
        question: "Un client étranger ne répond pas à un email important depuis plusieurs jours. Que fais-tu ?",
        options: [
          "J'abandonne le dossier sans relancer",
          "Je relance poliment en tenant compte des éventuels décalages horaires ou usages culturels différents",
          "Je lui envoie un email agacé",
          "J'attends indéfiniment sans rien faire",
          "Je considère que le client n'est plus intéressé",
        ],
        correctIndex: 1,
        explanation:
          "Une relance polie qui tient compte des décalages horaires et des usages professionnels différents selon les pays est une compétence clé du commerce international.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite sur des dossiers complexes, donc j'apprends à vérifier chaque document avant l'envoi",
          "Je n'aime pas les langues étrangères",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur documentaire, essentielle dans ce métier où une erreur peut bloquer une marchandise en douane, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi la maîtrise de l'anglais (voire d'une autre langue) est-elle quasiment indispensable dans ce métier ?",
        options: [
          "Ce n'est pas vraiment nécessaire si on reste en Europe",
          "Parce que les échanges avec clients, fournisseurs et transporteurs étrangers se font très majoritairement en anglais, langue commune du commerce international",
          "Uniquement pour lire les contrats une fois signés",
          "La langue n'a aucun impact sur la qualité des échanges commerciaux",
          "Ça ne concerne que les postes de direction",
        ],
        correctIndex: 1,
        explanation:
          "L'anglais est la langue de travail quasi universelle du commerce international : sans elle, la communication avec la majorité des partenaires étrangers devient très difficile au quotidien.",
      },
    ],
    medium: [
      {
        question: "Un conteneur est bloqué en douane pour un document manquant. Que fais-tu en priorité ?",
        options: [
          "Attendre que la douane résolve le problème seule",
          "Identifier précisément le document manquant et le faire parvenir au plus vite, en informant le client du retard",
          "Annuler l'expédition sans chercher de solution",
          "Envoyer un nouveau conteneur sans régler le premier blocage",
          "Ignorer le blocage si le client n'a encore rien remarqué",
        ],
        correctIndex: 1,
        explanation:
          "Identifier rapidement le document manquant et communiquer avec transparence au client sur le retard limite l'impact commercial d'un blocage douanier, plutôt que de laisser la situation traîner.",
      },
      {
        question: "Pourquoi la lettre de crédit (crédit documentaire) est-elle utilisée dans les transactions internationales ?",
        options: [
          "C'est une simple formalité sans réel intérêt",
          "Elle sécurise la transaction en garantissant le paiement au vendeur sous réserve de la présentation de documents conformes, réduisant le risque de non-paiement ou de non-livraison",
          "Elle remplace totalement le contrat commercial",
          "Elle ne concerne que les très petites transactions",
          "Elle est obligatoire pour tous les échanges internationaux sans exception",
        ],
        correctIndex: 1,
        explanation:
          "La lettre de crédit sécurise la transaction pour les deux parties : le vendeur est payé si les documents sont conformes, l'acheteur ne paie que si la marchandise a bien été expédiée dans les conditions prévues.",
      },
      {
        question: "Comment gères-tu une différence culturelle qui complique une négociation avec un partenaire étranger ?",
        options: [
          "J'impose ma façon de négocier sans adaptation",
          "Je me renseigne sur les usages du pays concerné et j'adapte mon approche (rythme, formalisme, façon de dire non) sans renoncer à mes objectifs",
          "J'évite complètement de négocier avec ce partenaire",
          "Je considère que les différences culturelles n'ont aucun impact réel",
          "Je laisse un collègue gérer sans jamais apprendre",
        ],
        correctIndex: 1,
        explanation:
          "S'informer sur les usages culturels et adapter son approche (sans renoncer à ses objectifs) est une compétence clé en négociation internationale, bien plus efficace qu'une approche uniforme.",
      },
      {
        question: "Pourquoi le choix du mode de transport (maritime, aérien, routier) dépend-il d'un arbitrage coût/délai/nature de la marchandise ?",
        options: [
          "Le choix du transport n'a aucun impact réel sur le coût final",
          "Le maritime est généralement moins cher mais plus lent, l'aérien plus rapide mais plus coûteux -- le bon choix dépend de l'urgence, du volume et de la valeur de la marchandise",
          "Il faut toujours choisir le transport aérien, quel que soit le produit",
          "Le mode de transport est imposé par la douane, sans marge de choix",
          "Le transport routier est toujours le moins cher pour l'international",
        ],
        correctIndex: 1,
        explanation:
          "Le choix du mode de transport résulte d'un arbitrage entre coût, délai et nature de la marchandise (fragilité, valeur, urgence) -- une décision stratégique à chaque expédition.",
      },
      {
        question: "Un fournisseur étranger livre une marchandise non conforme à la commande. Quelle est la démarche appropriée ?",
        options: [
          "Accepter la marchandise sans réclamation pour ne pas compliquer la relation",
          "Documenter précisément la non-conformité (photos, rapport) et engager une réclamation formelle selon les termes du contrat",
          "Refuser tout paiement sans explication au fournisseur",
          "Revendre la marchandise non conforme sans en informer le fournisseur",
          "Rompre immédiatement toute relation commerciale sans discussion",
        ],
        correctIndex: 1,
        explanation:
          "Documenter précisément la non-conformité et suivre la procédure de réclamation prévue au contrat protège les intérêts de l'entreprise tout en gardant la relation commerciale sur une base factuelle.",
      },
      {
        question: "Pourquoi le suivi des taux de change est-il important dans une activité d'import-export ?",
        options: [
          "Les taux de change n'ont aucun impact sur la rentabilité d'une opération",
          "Une variation de change entre la signature du contrat et le paiement effectif peut réduire voire annuler la marge prévue sur une transaction",
          "Le taux de change ne concerne que les investisseurs financiers",
          "Il suffit de facturer systématiquement en euros pour éliminer tout risque de change",
          "Le suivi des taux de change est une tâche réservée uniquement aux banques",
        ],
        correctIndex: 1,
        explanation:
          "Une transaction facturée en devise étrangère expose à un risque de change entre la signature et le paiement : une variation défavorable peut réduire, voire annuler, la marge prévue sur l'opération.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la différence entre les incoterms FOB et CIF, et pourquoi cette distinction est-elle cruciale pour le calcul du prix ?",
        options: [
          "Ce sont deux noms différents pour exactement la même répartition de coûts",
          "FOB (Free On Board) transfère les risques dès le chargement sur le navire, le vendeur ne payant pas le transport principal ; CIF (Cost, Insurance, Freight) inclut en plus le coût du transport et de l'assurance jusqu'au port de destination",
          "CIF ne concerne que le transport aérien",
          "FOB inclut systématiquement l'assurance de la marchandise",
          "Ces incoterms ne s'appliquent qu'aux transactions intra-européennes",
        ],
        correctIndex: 1,
        explanation:
          "FOB transfère les risques au chargement, le vendeur ne payant que jusqu'à ce point ; CIF ajoute la prise en charge du transport et de l'assurance jusqu'au port de destination -- une différence qui change directement la structure du prix négocié.",
      },
      {
        question: "Qu'est-ce que le régime douanier de \"perfectionnement actif\" ?",
        options: [
          "Un régime qui interdit toute transformation de marchandises importées",
          "Un régime permettant d'importer temporairement des marchandises pour les transformer avant réexportation, avec suspension des droits de douane sur la partie réexportée",
          "Une taxe supplémentaire appliquée aux produits transformés",
          "Un régime réservé exclusivement aux produits alimentaires",
          "Un dispositif qui a été supprimé par l'Union européenne",
        ],
        correctIndex: 1,
        explanation:
          "Le perfectionnement actif permet d'importer temporairement des matières premières pour les transformer avant réexportation, avec suspension des droits de douane sur la part réexportée -- un dispositif stratégique pour l'industrie exportatrice.",
      },
      {
        question: "Pourquoi la classification tarifaire (code SH/nomenclature douanière) d'un produit est-elle si sensible ?",
        options: [
          "Elle n'a qu'un rôle statistique sans impact financier",
          "Elle détermine directement le taux de droits de douane applicable et les réglementations spécifiques (normes, licences) -- une erreur peut entraîner un redressement douanier",
          "Elle est identique pour tous les produits d'un même secteur",
          "Elle ne concerne que les produits de luxe",
          "Le code SH est choisi librement par l'exportateur sans contrôle",
        ],
        correctIndex: 1,
        explanation:
          "Le code de classification tarifaire détermine le taux de droits de douane et les réglementations applicables (normes, licences, quotas) : une erreur de classification, volontaire ou non, expose à un redressement douanier a posteriori.",
      },
      {
        question: "Qu'est-ce que le risque de contrepartie dans une transaction internationale, et comment le crédit documentaire y répond-il ?",
        options: [
          "Un risque qui ne concerne que les grandes multinationales",
          "Le risque que l'une des parties (souvent l'acheteur) ne respecte pas ses engagements (paiement) une fois la marchandise expédiée ; le crédit documentaire fait porter cette garantie sur une banque plutôt que sur la seule confiance entre partenaires",
          "Un risque purement théorique, jamais observé en pratique",
          "Un risque qui disparaît automatiquement avec un contrat écrit",
          "Un concept qui ne s'applique qu'aux transactions en devises exotiques",
        ],
        correctIndex: 1,
        explanation:
          "Le risque de contrepartie est le risque de défaillance d'un partenaire commercial (souvent le non-paiement de l'acheteur) ; le crédit documentaire transfère la garantie de paiement à une banque, réduisant fortement ce risque pour l'exportateur.",
      },
      {
        question: "Pourquoi une entreprise exportatrice doit-elle se préoccuper des accords de libre-échange et des règles d'origine ?",
        options: [
          "Ces règles n'ont aucun impact tant que le produit est de bonne qualité",
          "Les règles d'origine déterminent si un produit peut bénéficier de droits de douane préférentiels dans le cadre d'un accord commercial, ce qui peut représenter un avantage compétitif significatif",
          "Les accords de libre-échange ne concernent que les matières premières",
          "Les règles d'origine ne s'appliquent qu'aux produits manufacturés en Chine",
          "Un produit est toujours taxé au même taux, quel que soit son origine",
        ],
        correctIndex: 1,
        explanation:
          "Les règles d'origine déterminent l'éligibilité d'un produit à des droits de douane préférentiels dans le cadre d'accords de libre-échange : un mauvais respect de ces règles peut faire perdre un avantage tarifaire important, voire entraîner des sanctions.",
      },
      {
        question: "Qu'est-ce que le risque politique en commerce international et comment une entreprise peut-elle s'en prémunir ?",
        options: [
          "Un risque qui ne concerne que les investissements directs à l'étranger",
          "Le risque qu'une décision étatique (embargo, sanction, nationalisation, instabilité) affecte une transaction ou un investissement ; il peut être en partie couvert par des assurances spécialisées (type Coface)",
          "Un risque totalement imprévisible et donc jamais assurable",
          "Un risque qui ne concerne que les pays en guerre",
          "Un risque identique quel que soit le pays partenaire",
        ],
        correctIndex: 1,
        explanation:
          "Le risque politique (embargo, sanction, instabilité, nationalisation) peut affecter une transaction internationale ; des organismes spécialisés (comme la Coface en France) proposent des assurances pour s'en prémunir partiellement.",
      },
      {
        question: "Pourquoi la conformité aux sanctions internationales (listes d'embargo) est-elle un enjeu juridique majeur pour une entreprise exportatrice ?",
        options: [
          "Ces listes n'ont qu'une valeur indicative sans conséquence légale",
          "Exporter vers une entité ou un pays sous sanction internationale, même par erreur, expose l'entreprise à de lourdes sanctions pénales et financières",
          "Les sanctions internationales ne concernent que les armes",
          "Seules les grandes entreprises sont concernées par ces obligations",
          "Il suffit de vérifier la nationalité du client, jamais l'entité précise",
        ],
        correctIndex: 1,
        explanation:
          "Exporter vers une entité ou un pays sous sanction internationale, même involontairement, expose l'entreprise à de lourdes sanctions pénales et financières : la vérification de conformité (screening) est un contrôle incontournable avant toute transaction sensible.",
      },
    ],
  },

  petite_enfance: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la petite enfance ?",
        options: [
          "J'aime accompagner le développement et l'éveil des tout-petits au quotidien",
          "Parce que je pense que s'occuper d'enfants est facile",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour le développement et l'éveil de l'enfant est au cœur du métier : une motivation centrée là-dessus est bien plus solide qu'une idée de facilité.",
      },
      {
        question: "Un enfant pleure sans raison apparente à son arrivée à la crèche. Que fais-tu ?",
        options: [
          "Je l'ignore, ça passera tout seul",
          "Je le rassure calmement, propose une activité douce et reste disponible le temps qu'il se sente en confiance",
          "Je le gronde pour qu'il arrête",
          "Je préviens les parents de venir le rechercher immédiatement",
          "Je le laisse seul dans un coin",
        ],
        correctIndex: 1,
        explanation:
          "Rassurer calmement et rester disponible est la réponse adaptée face à l'angoisse de séparation, très fréquente chez le jeune enfant en collectivité.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux manquer de patience face à la répétition, donc je travaille sur des techniques de gestion de groupe",
          "Je n'aime pas vraiment les enfants",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié à un vrai enjeu du métier (patience face à la répétition), avec une piste d'amélioration, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi les règles d'hygiène strictes sont-elles indispensables en crèche ?",
        options: [
          "C'est surtout pour l'image de l'établissement",
          "Parce que les jeunes enfants ont un système immunitaire encore fragile et la vie en collectivité favorise la transmission des infections",
          "Ce n'est important qu'en cas de contrôle",
          "Les règles d'hygiène ne concernent que le personnel de cuisine",
          "Ça n'a aucun lien avec la santé des enfants",
        ],
        correctIndex: 1,
        explanation:
          "Le système immunitaire encore immature du jeune enfant et la vie en collectivité rendent les règles d'hygiène (lavage des mains, désinfection) essentielles pour limiter la transmission d'infections.",
      },
      {
        question: "Qu'est-ce que la \"motricité libre\", une notion souvent citée en petite enfance ?",
        options: [
          "Laisser l'enfant faire absolument tout ce qu'il veut sans aucune limite",
          "Laisser l'enfant explorer les mouvements à son rythme, sans le placer dans des postures qu'il n'a pas encore acquises seul",
          "Un programme d'exercices sportifs imposés dès le plus jeune âge",
          "Un concept qui ne s'applique qu'aux enfants de plus de 3 ans",
          "Une méthode réservée aux structures spécialisées en handicap",
        ],
        correctIndex: 1,
        explanation:
          "La motricité libre consiste à laisser l'enfant explorer les mouvements à son propre rythme, sans le placer artificiellement dans une posture qu'il n'a pas encore acquise seul (ex: position assise avant qu'il ne s'y mette lui-même).",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu un conflit entre deux jeunes enfants pour un jouet ?",
        options: [
          "Je donne systématiquement le jouet au premier qui l'a réclamé",
          "J'interviens pour nommer la situation, proposer une solution (chacun son tour, un autre jouet) et accompagner verbalement les émotions de chacun",
          "Je laisse les enfants régler ça seuls, même en cas de pleurs",
          "Je gronde les deux enfants sans explication",
          "Je retire tous les jouets du groupe en punition",
        ],
        correctIndex: 1,
        explanation:
          "Nommer la situation, accompagner les émotions et proposer une solution concrète (chacun son tour) est l'approche pédagogique adaptée pour un conflit entre jeunes enfants encore peu autonomes verbalement.",
      },
      {
        question: "Pourquoi la observation individuelle de chaque enfant est-elle une compétence professionnelle importante ?",
        options: [
          "Ce n'est pas vraiment utile, tous les enfants du même âge se développent pareil",
          "Elle permet de repérer les besoins spécifiques, le rythme de développement propre à chaque enfant, et d'adapter l'accompagnement en conséquence",
          "L'observation ne sert qu'à remplir des documents administratifs",
          "Elle ne concerne que les enfants en difficulté",
          "Elle n'a aucun lien avec la qualité de l'accompagnement",
        ],
        correctIndex: 1,
        explanation:
          "Chaque enfant se développe à son propre rythme : l'observation individuelle permet d'adapter l'accompagnement à ses besoins réels plutôt que d'appliquer une approche uniforme par tranche d'âge.",
      },
      {
        question: "Un parent te reproche une décision prise pendant la journée (ex: sieste écourtée). Comment réagis-tu ?",
        options: [
          "Je me justifie fermement sans écouter son point de vue",
          "J'écoute sa préoccupation, j'explique calmement le contexte et j'ajuste si besoin en concertation avec l'équipe",
          "Je l'ignore complètement",
          "Je rejette la responsabilité sur un collègue",
          "Je cède immédiatement à toutes ses demandes sans réflexion",
        ],
        correctIndex: 1,
        explanation:
          "Écouter la préoccupation du parent et expliquer calmement le contexte, en restant ouvert à un ajustement raisonnable, construit une relation de confiance essentielle dans l'accompagnement de l'enfant.",
      },
      {
        question: "Pourquoi la cohérence des repères (rituels, horaires) est-elle particulièrement importante pour un jeune enfant ?",
        options: [
          "Ce n'est pas vraiment important si l'ambiance est agréable",
          "Parce qu'elle sécurise l'enfant en lui donnant des repères stables dans un environnement qu'il ne maîtrise pas encore",
          "Uniquement pour faciliter l'organisation de l'équipe",
          "Les rituels n'ont aucun effet sur le comportement de l'enfant",
          "La cohérence ne concerne que les enfants de plus de 2 ans",
        ],
        correctIndex: 1,
        explanation:
          "Des repères stables (rituels, horaires) sécurisent l'enfant dans un environnement qu'il ne maîtrise pas encore, réduisant l'anxiété et favorisant un climat propice à son développement.",
      },
      {
        question: "Comment adaptes-tu ton langage et ton approche selon l'âge des enfants accueillis ?",
        options: [
          "Je parle exactement de la même façon à tous les âges",
          "J'adapte le vocabulaire, le ton et les activités selon le stade de développement (nourrisson, enfant qui marche, enfant qui parle)",
          "Je considère que l'adaptation n'est pas nécessaire avant 3 ans",
          "Seul le volume de la voix doit changer selon l'âge",
          "L'adaptation au langage ne concerne que les professionnels diplômés",
        ],
        correctIndex: 1,
        explanation:
          "Adapter le vocabulaire, le ton et les activités au stade de développement de chaque enfant est une compétence professionnelle centrale, très différente entre un nourrisson et un enfant qui commence à parler.",
      },
      {
        question: "Pourquoi le travail en équipe pluridisciplinaire (auxiliaire, éducateur, puéricultrice, médecin) est-il central en crèche ?",
        options: [
          "Ce n'est qu'une contrainte organisationnelle sans réel bénéfice",
          "Chaque professionnel apporte un regard complémentaire pour une prise en charge globale et cohérente de l'enfant",
          "Uniquement pour se répartir les tâches ingrates",
          "La pluridisciplinarité ne concerne que les enfants en difficulté",
          "Ça n'a pas d'impact sur la qualité de l'accueil",
        ],
        correctIndex: 1,
        explanation:
          "Auxiliaire, éducateur, puéricultrice, médecin : chacun apporte une expertise complémentaire indispensable pour une prise en charge globale et cohérente du développement de l'enfant.",
      },
    ],
    difficile: [
      {
        question: "Que dit le cadre légal sur l'obligation de signalement en cas de suspicion de maltraitance sur un enfant accueilli ?",
        options: [
          "Le signalement est facultatif et laissé à l'appréciation de chacun",
          "Tout professionnel de la petite enfance a une obligation de signalement en cas de suspicion, même sans preuve formelle, selon la procédure interne puis, si besoin, aux autorités compétentes (CRIP, procureur)",
          "Seul le directeur de l'établissement peut légalement signaler une suspicion",
          "Le signalement n'est obligatoire qu'en cas de preuve irréfutable",
          "Cette obligation ne concerne que les enfants de plus de 6 ans",
        ],
        correctIndex: 1,
        explanation:
          "Tout professionnel de la petite enfance a une obligation de signalement dès la suspicion (pas besoin de preuve formelle), suivant la procédure interne puis, si nécessaire, les autorités compétentes (CRIP, procureur) -- le doute suffit à déclencher l'alerte.",
      },
      {
        question: "Qu'est-ce que la théorie de l'attachement (Bowlby) et pourquoi est-elle centrale en petite enfance ?",
        options: [
          "Une théorie qui n'a aucune application pratique en crèche",
          "Elle décrit le besoin fondamental du jeune enfant de créer un lien sécurisant avec un adulte référent, condition essentielle à son développement émotionnel et social",
          "Une théorie qui concerne uniquement la relation entre frères et sœurs",
          "Elle recommande de changer fréquemment de référent pour éviter toute dépendance affective",
          "Elle a été scientifiquement invalidée depuis",
        ],
        correctIndex: 1,
        explanation:
          "La théorie de l'attachement de Bowlby décrit le besoin fondamental du jeune enfant de créer un lien sécurisant avec un adulte référent -- un fondement théorique qui justifie l'importance de la référence stable en collectivité (référent au sein de l'équipe).",
      },
      {
        question: "Pourquoi la période des 1000 premiers jours est-elle considérée comme particulièrement déterminante pour le développement de l'enfant ?",
        options: [
          "Cette notion n'a aucune base scientifique reconnue",
          "Elle correspond à une période de développement cérébral et affectif particulièrement intense, où les interactions avec l'environnement ont un impact durable",
          "Elle ne concerne que le développement physique, jamais l'affectif",
          "Elle s'arrête à la naissance de l'enfant",
          "Elle ne concerne que les enfants nés prématurément",
        ],
        correctIndex: 1,
        explanation:
          "Les 1000 premiers jours (de la grossesse aux 2 ans de l'enfant) correspondent à une période de développement cérébral et affectif particulièrement intense, où la qualité des interactions a un impact reconnu et durable.",
      },
      {
        question: "Comment analyser une régression comportementale soudaine chez un enfant (ex: retour à des comportements plus jeunes) ?",
        options: [
          "La considérer systématiquement comme un caprice à ignorer",
          "Chercher une cause possible (changement dans l'environnement familial, arrivée d'un frère/sœur, mal-être) plutôt que de la sanctionner directement",
          "Punir immédiatement le comportement régressif",
          "Considérer que c'est toujours un problème médical nécessitant un médecin en urgence",
          "L'ignorer complètement, ça passera tout seul sans qu'il faille chercher de cause",
        ],
        correctIndex: 1,
        explanation:
          "Une régression comportementale a souvent une cause identifiable (changement familial, stress, mal-être) : chercher cette cause avec l'équipe et les parents permet une réponse adaptée, bien plus utile qu'une sanction.",
      },
      {
        question: "Pourquoi la notion de \"juste distance professionnelle\" est-elle particulièrement délicate en petite enfance, où le contact physique est nécessaire ?",
        options: [
          "Elle n'a aucune pertinence puisque le contact physique est systématiquement nécessaire",
          "Il faut concilier la proximité physique et affective indispensable aux soins du jeune enfant avec un cadre professionnel qui évite toute confusion de rôle ou dépendance affective excessive",
          "La distance professionnelle signifie éviter tout contact physique avec l'enfant",
          "Cette notion ne concerne que les professionnels en contact avec des adolescents",
          "Elle n'a aucun lien avec la prévention de l'épuisement professionnel",
        ],
        correctIndex: 1,
        explanation:
          "La petite enfance nécessite un contact physique et affectif réel pour les soins et le réconfort, tout en maintenant un cadre professionnel qui prévient la confusion de rôle et protège à la fois l'enfant et le professionnel de l'épuisement.",
      },
      {
        question: "Que recommande le référentiel national de l'accueil du jeune enfant à propos de l'exposition aux écrans en crèche ?",
        options: [
          "Les écrans sont encouragés dès le plus jeune âge pour stimuler l'éveil",
          "L'exposition aux écrans est déconseillée avant 3 ans, les activités sensorielles et relationnelles directes étant privilégiées pour le développement",
          "Il n'existe aucune recommandation officielle sur ce sujet",
          "Les écrans sont utilisés systématiquement comme outil pédagogique en crèche",
          "La recommandation ne concerne que les écrans de smartphone, pas la télévision",
        ],
        correctIndex: 1,
        explanation:
          "Les recommandations (dont celles de Santé publique France et du référentiel de l'accueil du jeune enfant) déconseillent l'exposition aux écrans avant 3 ans, privilégiant les activités sensorielles et les interactions humaines directes pour le développement.",
      },
      {
        question: "Pourquoi le taux d'encadrement réglementaire (nombre d'enfants par professionnel) est-il fixé par décret et strictement contrôlé en crèche ?",
        options: [
          "Ce taux est une simple recommandation facultative laissée à l'appréciation de chaque structure",
          "Il garantit une capacité réelle de surveillance et de réponse individualisée aux besoins de chaque enfant, un facteur direct de sécurité et de qualité d'accueil",
          "Il ne concerne que les structures privées, jamais les crèches publiques",
          "Il est identique quel que soit l'âge des enfants accueillis",
          "Il a été supprimé au profit d'une gestion libre par chaque établissement",
        ],
        correctIndex: 1,
        explanation:
          "Le taux d'encadrement (fixé réglementairement, par exemple via le code de la santé publique) garantit une capacité réelle de surveillance et de réponse individualisée : un facteur direct de sécurité, strictement contrôlé lors des inspections de la PMI.",
      },
    ],
  },

  securite_defense: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la sécurité/défense ?",
        options: [
          "J'aime l'idée de protéger des personnes et des biens concrètement",
          "Parce que ça a l'air un métier facile",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La motivation liée à la protection concrète des personnes/biens est au cœur de ces métiers, bien plus solide qu'une idée de facilité.",
      },
      {
        question: "Pourquoi la ponctualité et la discipline sont-elles particulièrement strictes dans ce secteur ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce qu'un manquement peut avoir des conséquences directes sur la sécurité de personnes ou de sites sensibles",
          "Uniquement pour respecter une tradition",
          "La discipline ne concerne que les gradés",
          "Ça n'a aucun lien avec l'efficacité opérationnelle",
        ],
        correctIndex: 1,
        explanation:
          "Dans un contexte de sécurité, un manquement à la discipline ou à la ponctualité peut avoir des conséquences directes et graves sur la protection de personnes ou de sites sensibles.",
      },
      {
        question: "Un individu se comporte de façon suspecte près d'un site que tu surveilles. Quelle est la première bonne réaction ?",
        options: [
          "L'ignorer si rien de grave ne semble se passer",
          "Observer discrètement, rester vigilant et suivre la procédure de signalement prévue",
          "L'interpeller physiquement sans en référer à personne",
          "Quitter son poste pour le suivre",
          "Le confronter verbalement de façon agressive",
        ],
        correctIndex: 1,
        explanation:
          "Observer, rester vigilant et suivre la procédure de signalement prévue (plutôt qu'agir seul de façon impulsive) est le réflexe professionnel attendu face à un comportement suspect.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir agir trop vite, donc j'apprends à toujours suivre la procédure avant d'intervenir seul",
          "Je n'aime pas les responsabilités",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur procédurale, essentielle dans ce type de métier, avec une piste d'amélioration concrète, montre une bonne compréhension des enjeux.",
      },
      {
        question: "Pourquoi le travail en équipe et la communication radio sont-ils essentiels dans ces métiers ?",
        options: [
          "Ce n'est qu'une habitude sans réel intérêt",
          "Parce qu'une information mal transmise ou tardive peut compromettre la sécurité de toute une équipe ou d'une opération",
          "Uniquement pour respecter le règlement intérieur",
          "La communication ne concerne que les postes d'encadrement",
          "Ça n'a aucun impact sur l'efficacité opérationnelle",
        ],
        correctIndex: 1,
        explanation:
          "Une information mal transmise ou tardive peut compromettre la sécurité collective : la communication précise et rapide est un pilier opérationnel de ces métiers.",
      },
    ],
    medium: [
      {
        question: "Comment réagis-tu si tu constates qu'un collègue ne respecte pas une consigne de sécurité ?",
        options: [
          "Je l'ignore pour ne pas créer de tension",
          "Je le signale selon la procédure hiérarchique, la sécurité collective primant sur les relations personnelles",
          "Je règle le problème moi-même en le sanctionnant directement",
          "Je fais pareil pour ne pas être le seul à respecter la règle",
          "J'en parle uniquement à d'autres collègues sans jamais remonter l'info",
        ],
        correctIndex: 1,
        explanation:
          "Un manquement à une consigne de sécurité doit être signalé selon la voie hiérarchique prévue : la sécurité collective prime toujours sur l'évitement d'une tension personnelle.",
      },
      {
        question: "Pourquoi le principe de \"légitime défense\" est-il strictement encadré par la loi dans ces métiers ?",
        options: [
          "Il ne l'est pas, chacun peut agir comme il le juge nécessaire",
          "Parce que l'usage de la force doit rester proportionné et nécessaire face à une menace réelle et immédiate, sous peine d'engager la responsabilité pénale de l'agent",
          "La légitime défense ne concerne que les forces de police",
          "Elle autorise n'importe quelle réaction, même disproportionnée",
          "Ce principe a été supprimé du droit français",
        ],
        correctIndex: 1,
        explanation:
          "L'usage de la force en légitime défense doit rester proportionné et nécessaire face à une menace réelle et immédiate : un cadre légal strict qui protège à la fois les tiers et l'agent lui-même en cas de contestation.",
      },
      {
        question: "Comment gères-tu la pression psychologique d'une situation à risque récurrente dans ton métier ?",
        options: [
          "Je considère que ça ne doit jamais m'affecter du tout",
          "Je m'appuie sur la préparation, les procédures et le soutien de l'équipe, et j'en parle si besoin via les dispositifs prévus (débriefing, soutien psychologique)",
          "Je garde tout pour moi sans jamais en parler",
          "Je change de métier dès la première situation stressante",
          "Je considère que la pression n'a aucun impact sur la performance",
        ],
        correctIndex: 1,
        explanation:
          "S'appuyer sur la préparation, les procédures, le collectif et les dispositifs de soutien prévus est la réponse adaptée à la pression psychologique inhérente à ces métiers, plutôt que de la nier ou de l'isoler.",
      },
      {
        question: "Pourquoi la rédaction précise d'un rapport après incident est-elle une compétence professionnelle importante ?",
        options: [
          "Ce n'est qu'une formalité administrative sans réel enjeu",
          "Un rapport précis et factuel est essentiel pour la suite de la procédure (juridique, hiérarchique) et pour tirer des enseignements de l'incident",
          "Le rapport n'a d'utilité que pour la hiérarchie, jamais pour l'agent lui-même",
          "La rédaction de rapport ne concerne que les incidents graves",
          "Un rapport approximatif suffit tant que l'incident est terminé",
        ],
        correctIndex: 1,
        explanation:
          "Un rapport factuel et précis protège juridiquement l'agent, informe correctement la suite de la procédure, et permet de tirer des enseignements utiles pour éviter la reproduction de l'incident.",
      },
      {
        question: "Comment priorises-tu tes actions face à plusieurs alertes simultanées sur un site que tu surveilles ?",
        options: [
          "Je traite les alertes dans l'ordre où elles apparaissent, sans distinction",
          "Je priorise selon la gravité et l'urgence potentielle de chaque alerte (danger humain avant tout le reste)",
          "Je choisis l'alerte la plus simple à traiter en premier",
          "J'attends les instructions sans évaluer moi-même la situation",
          "Je traite uniquement l'alerte la plus proche de moi physiquement",
        ],
        correctIndex: 1,
        explanation:
          "Face à plusieurs alertes simultanées, prioriser selon la gravité et le risque humain potentiel (avant les biens matériels) est le principe de base de la gestion d'incidents en sécurité.",
      },
      {
        question: "Pourquoi la formation continue (gestes et techniques professionnelles, évolution réglementaire) est-elle particulièrement importante dans ces métiers ?",
        options: [
          "La réglementation et les techniques évoluent peu, la formation initiale suffit généralement",
          "Les techniques d'intervention, le cadre légal et les risques évoluent régulièrement : une formation obsolète peut mettre en danger l'agent et les personnes qu'il protège",
          "La formation continue ne concerne que les cadres",
          "Elle est facultative une fois le diplôme obtenu",
          "Elle n'a aucun impact sur la qualité des interventions",
        ],
        correctIndex: 1,
        explanation:
          "Les techniques d'intervention et le cadre légal évoluent régulièrement : une formation obsolète expose l'agent lui-même et les personnes protégées à des risques évitables, d'où l'importance de la formation continue.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la différence juridique entre légitime défense et état de nécessité ?",
        options: [
          "Ce sont deux termes strictement équivalents en droit français",
          "La légitime défense répond à une agression injuste et actuelle, l'état de nécessité justifie une action pour éviter un danger réel sans qu'il y ait nécessairement une agression (ex: forcer une porte pour sauver une personne)",
          "L'état de nécessité ne concerne que les incendies",
          "La légitime défense s'applique uniquement aux professionnels de la sécurité",
          "L'état de nécessité n'existe pas en droit pénal français",
        ],
        correctIndex: 1,
        explanation:
          "La légitime défense répond à une agression injuste et actuelle envers soi ou autrui ; l'état de nécessité justifie une action pour éviter un danger réel même sans agression (ex: forcer un accès pour porter secours) -- deux causes d'exonération de responsabilité pénale distinctes.",
      },
      {
        question: "Pourquoi le principe de \"gradation de la force\" (continuum de la force) structure-t-il la doctrine d'intervention dans ces métiers ?",
        options: [
          "Il n'existe aucune doctrine officielle sur ce sujet",
          "Il impose d'utiliser le niveau de force minimal nécessaire pour maîtriser une situation, en l'augmentant progressivement uniquement si la menace l'exige, plutôt qu'une réponse maximale d'emblée",
          "Il impose au contraire d'utiliser systématiquement le niveau de force maximal disponible dès le début",
          "Ce principe ne concerne que les forces armées, jamais la sécurité privée",
          "Il a été abandonné au profit d'une réponse unique et standardisée",
        ],
        correctIndex: 1,
        explanation:
          "Le continuum de la force impose d'utiliser le niveau minimal nécessaire pour maîtriser une situation, en l'augmentant progressivement seulement si la menace évolue -- un principe central de proportionnalité qui protège juridiquement l'agent et limite les risques.",
      },
      {
        question: "Qu'est-ce que le secret professionnel appliqué aux métiers de la sécurité, et où trouve-t-il ses limites ?",
        options: [
          "Il est absolu et ne souffre aucune exception",
          "Il protège les informations recueillies dans le cadre du service, mais trouve sa limite face à une obligation légale de signalement (ex: infraction grave, danger pour autrui)",
          "Il ne concerne que les agents de la fonction publique",
          "Il n'existe pas dans ce secteur",
          "Il ne s'applique qu'aux informations écrites, jamais orales",
        ],
        correctIndex: 1,
        explanation:
          "Le secret professionnel protège les informations recueillies dans le cadre du service, mais cède face à certaines obligations légales (signalement d'infraction grave, danger imminent pour autrui) -- un équilibre encadré par la loi, pas une règle absolue.",
      },
      {
        question: "Pourquoi la traçabilité et l'horodatage précis des interventions sont-ils un enjeu juridique majeur en cas de contentieux ?",
        options: [
          "Ils n'ont qu'un intérêt statistique interne",
          "En cas de contestation ou de procédure judiciaire, une trace précise et horodatée constitue une preuve déterminante du déroulement réel des faits",
          "La traçabilité ne concerne que les interventions ayant fait usage de la force",
          "Elle n'a aucune valeur devant un tribunal",
          "Elle est facultative si l'agent est certain d'avoir bien agi",
        ],
        correctIndex: 1,
        explanation:
          "En cas de contestation ou de procédure judiciaire, une traçabilité précise et horodatée (rapport, main courante, vidéo si applicable) constitue une preuve déterminante pour établir objectivement le déroulement des faits.",
      },
      {
        question: "Qu'est-ce que le stress post-traumatique et pourquoi les métiers de la sécurité/défense y sont-ils particulièrement exposés ?",
        options: [
          "Un trouble qui ne concerne que les militaires en opération de guerre",
          "Un trouble psychologique pouvant survenir après l'exposition répétée ou ponctuelle à des événements violents ou dangereux, nécessitant un suivi et un soutien adaptés",
          "Un trouble qui disparaît toujours spontanément sans accompagnement",
          "Un phénomène purement individuel, sans lien avec l'exposition professionnelle",
          "Un trouble qui ne peut être prévenu par aucun dispositif institutionnel",
        ],
        correctIndex: 1,
        explanation:
          "L'exposition répétée ou ponctuelle à des événements violents ou dangereux expose ces métiers à un risque accru de stress post-traumatique, d'où l'importance des dispositifs de soutien psychologique et de débriefing après incident.",
      },
      {
        question: "Pourquoi la distinction entre sécurité privée et prérogatives de puissance publique est-elle juridiquement stricte en France ?",
        options: [
          "Il n'existe aucune distinction légale entre les deux",
          "Un agent de sécurité privée n'a pas les mêmes pouvoirs qu'un officier de police (interpellation, contrôle d'identité) : dépasser ce cadre expose à des poursuites pour exercice illégal de prérogatives publiques",
          "Les deux ont exactement les mêmes pouvoirs légaux",
          "Cette distinction ne concerne que les sociétés de sécurité internationales",
          "Un agent de sécurité privée peut demander une pièce d'identité dans les mêmes conditions qu'un policier",
        ],
        correctIndex: 1,
        explanation:
          "Un agent de sécurité privée dispose de pouvoirs bien plus limités qu'un officier de police (pas de pouvoir de contrôle d'identité ou d'interpellation au sens judiciaire) : dépasser ce cadre légal expose à des poursuites pénales pour exercice illégal de prérogatives publiques.",
      },
      {
        question: "Pourquoi la formation aux premiers secours (PSC1, SST) est-elle considérée comme un socle minimal dans les métiers de la sécurité, au-delà de la seule intervention face à une menace ?",
        options: [
          "Les premiers secours ne concernent que le personnel médical, jamais les agents de sécurité",
          "Un agent de sécurité est souvent le premier témoin d'un accident ou d'un malaise sur son site : savoir agir immédiatement (alerte, gestes qui sauvent) peut être déterminant avant l'arrivée des secours",
          "Cette formation est purement facultative et sans lien avec le cœur de métier",
          "Elle ne concerne que les sites industriels à risque",
          "Elle remplace totalement l'intervention des services de secours professionnels",
        ],
        correctIndex: 1,
        explanation:
          "Un agent de sécurité est souvent le premier témoin d'un accident sur site : la formation aux gestes de premiers secours (PSC1, SST) peut faire une différence déterminante dans les minutes précédant l'arrivée des services de secours professionnels.",
      },
    ],
  },

  artisanat: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'artisanat / les métiers d'art ?",
        options: [
          "J'aime créer quelque chose de mes mains, du début à la fin",
          "Parce que ça a l'air un métier facile",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le goût de la création manuelle et de la maîtrise d'un savoir-faire de bout en bout est une motivation authentique et bien identifiée dans l'artisanat.",
      },
      {
        question: "Pourquoi la patience est-elle une qualité essentielle dans les métiers d'art ?",
        options: [
          "Ce n'est pas vraiment nécessaire avec les bons outils",
          "Parce que la maîtrise d'un savoir-faire artisanal demande du temps, de la répétition et une exigence de précision constante",
          "Uniquement pour les débutants",
          "La patience n'a aucun lien avec la qualité du résultat final",
          "Ça ne concerne que les métiers du luxe",
        ],
        correctIndex: 1,
        explanation:
          "La maîtrise d'un geste artisanal précis s'acquiert par la répétition et l'exigence sur le temps long : la patience est directement liée à la qualité du résultat final.",
      },
      {
        question: "Un client demande une modification qui compromettrait la qualité technique d'une pièce. Que fais-tu ?",
        options: [
          "J'accepte sans discussion pour ne pas perdre le client",
          "J'explique clairement pourquoi cette modification pose un problème technique et propose une alternative si possible",
          "Je refuse sans aucune explication",
          "Je fais la modification sans en parler, en espérant que ça passe",
          "Je change de sujet pour éviter la discussion",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer clairement l'enjeu technique et proposer une alternative montre à la fois expertise et sens du service, plutôt qu'un refus sec ou une concession qui compromet la qualité.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste, donc j'apprends à savoir quand une pièce est suffisamment aboutie pour être livrée",
          "Je n'aime pas travailler de mes mains",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans les métiers d'art (le perfectionnisme), avec une piste d'amélioration concrète, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi la transmission du savoir-faire (compagnonnage, apprentissage) est-elle centrale dans l'artisanat ?",
        options: [
          "Ce n'est qu'une tradition sans réelle utilité aujourd'hui",
          "Parce que de nombreux gestes et techniques artisanaux s'apprennent essentiellement par la pratique encadrée, difficilement transmissibles autrement",
          "La transmission ne concerne que les très vieux métiers en voie de disparition",
          "Elle n'a aucun impact sur la qualité du travail final",
          "Elle est aujourd'hui totalement remplacée par des formations en ligne",
        ],
        correctIndex: 1,
        explanation:
          "De nombreux gestes artisanaux s'apprennent essentiellement par la pratique encadrée auprès d'un professionnel expérimenté, une transmission difficilement remplaçable par un support théorique seul.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu une commande avec un délai serré tout en maintenant l'exigence de qualité artisanale ?",
        options: [
          "Je bâcle certaines étapes pour tenir le délai coûte que coûte",
          "J'évalue honnêtement si le délai est tenable avec la qualité attendue, et je communique tout écart possible au client le plus tôt possible",
          "Je refuse systématiquement toute commande avec un délai serré",
          "Je ne préviens le client qu'au dernier moment en cas de retard",
          "Je sous-traite sans en informer le client",
        ],
        correctIndex: 1,
        explanation:
          "Évaluer honnêtement la faisabilité et communiquer tôt en cas de tension sur le délai protège à la fois la qualité artisanale et la relation de confiance avec le client.",
      },
      {
        question: "Pourquoi le choix des matériaux est-il une décision technique autant qu'esthétique dans l'artisanat ?",
        options: [
          "Le choix des matériaux n'a qu'un impact esthétique, jamais technique",
          "Chaque matériau a des propriétés spécifiques (résistance, entretien, comportement dans le temps) qui doivent être adaptées à l'usage final de la pièce",
          "Il suffit de choisir le matériau le plus esthétique, sans autre considération",
          "Le choix du matériau est imposé par la réglementation dans tous les cas",
          "Cette décision ne concerne que les pièces de très haute gamme",
        ],
        correctIndex: 1,
        explanation:
          "Chaque matériau a des propriétés techniques propres (résistance, vieillissement, entretien) qui doivent être adaptées à l'usage réel de la pièce, pas seulement à son rendu esthétique immédiat.",
      },
      {
        question: "Comment réagis-tu face à une erreur découverte en cours de réalisation d'une pièce complexe ?",
        options: [
          "Je continue en espérant que ça ne se voie pas",
          "J'évalue l'impact réel de l'erreur et je corrige ou reprends l'étape concernée plutôt que de livrer une pièce compromise",
          "Je livre la pièce telle quelle sans en informer le client",
          "J'abandonne complètement la pièce sans chercher de solution",
          "Je blâme les outils utilisés sans analyser ma propre technique",
        ],
        correctIndex: 1,
        explanation:
          "Évaluer honnêtement l'impact d'une erreur et reprendre l'étape concernée si nécessaire, plutôt que de livrer une pièce compromise, est la marque du sérieux professionnel dans l'artisanat.",
      },
      {
        question: "Pourquoi la connaissance de l'histoire et des techniques traditionnelles de son métier reste-t-elle utile, même avec des outils modernes ?",
        options: [
          "Elle n'a aucune utilité pratique aujourd'hui",
          "Elle donne une compréhension profonde des gestes et des choix techniques, souvent transposable même avec des outils modernes",
          "Elle ne sert qu'à des fins culturelles, sans lien avec la pratique",
          "Les techniques traditionnelles sont systématiquement dépassées par les méthodes modernes",
          "Cette connaissance ne concerne que les artisans en fin de carrière",
        ],
        correctIndex: 1,
        explanation:
          "La compréhension des techniques traditionnelles donne une base solide sur le pourquoi des gestes, souvent transposable et enrichissante même en utilisant des outils modernes.",
      },
      {
        question: "Comment valorises-tu ton travail artisanal face à un client qui compare ton prix à un produit industriel équivalent en apparence ?",
        options: [
          "Je baisse systématiquement mon prix pour rester compétitif face à l'industriel",
          "J'explique concrètement la différence (temps de fabrication, matériaux, unicité, durabilité) qui justifie l'écart de prix",
          "Je refuse de discuter du prix",
          "Je dénigre le produit industriel sans argumenter sur mon propre travail",
          "Je considère que la comparaison n'a pas lieu d'être et j'évite le sujet",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer concrètement ce qui justifie l'écart de prix (temps, matériaux, unicité, durabilité) permet de valoriser le travail artisanal sans dénigrer la concurrence ni brader son propre travail.",
      },
      {
        question: "Pourquoi la diversification (vente directe, réseaux sociaux, ateliers) est-elle devenue importante pour de nombreux artisans aujourd'hui ?",
        options: [
          "Ce n'est pas nécessaire si le savoir-faire est excellent",
          "Parce qu'un excellent savoir-faire ne suffit pas toujours à assurer la visibilité et la viabilité économique de l'activité, la mise en valeur et la vente comptant aussi",
          "La diversification ne concerne que les grandes entreprises artisanales",
          "Elle remplace totalement le besoin de maîtrise technique",
          "Elle n'a aucun impact sur la pérennité d'une activité artisanale",
        ],
        correctIndex: 1,
        explanation:
          "Un excellent savoir-faire ne garantit pas seul la visibilité ou la viabilité économique : la capacité à se faire connaître et à vendre (réseaux sociaux, vente directe, ateliers) est devenue une compétence complémentaire importante.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce qu'un label ou une appellation protégée (ex: Entreprise du Patrimoine Vivant) apporte concrètement à un artisan ?",
        options: [
          "Un simple logo sans impact commercial réel",
          "Une reconnaissance officielle de l'excellence du savoir-faire, souvent valorisée commercialement et parfois accompagnée d'avantages fiscaux ou de soutien institutionnel",
          "Une obligation légale pour exercer le métier",
          "Un label réservé exclusivement aux entreprises de plus de 50 salariés",
          "Un dispositif qui n'existe qu'à l'étranger, jamais en France",
        ],
        correctIndex: 1,
        explanation:
          "Un label comme Entreprise du Patrimoine Vivant reconnaît officiellement l'excellence d'un savoir-faire, souvent valorisé commercialement auprès d'une clientèle exigeante, et peut s'accompagner de soutiens institutionnels.",
      },
      {
        question: "Pourquoi la propriété intellectuelle (dessins et modèles) est-elle un enjeu pour un artisan créateur ?",
        options: [
          "Elle ne concerne que les grandes marques industrielles",
          "Elle protège juridiquement une création originale contre la copie, un enjeu réel pour un artisan dont la valeur repose largement sur son style propre",
          "Un artisan ne peut jamais déposer de dessin ou modèle",
          "La propriété intellectuelle n'a aucun coût ni démarche associée",
          "Elle protège uniquement les créations numériques",
        ],
        correctIndex: 1,
        explanation:
          "Le dépôt de dessins et modèles protège juridiquement une création originale contre la copie -- un enjeu réel pour un artisan créateur dont la valeur commerciale repose largement sur un style ou une esthétique propre.",
      },
      {
        question: "Qu'est-ce que le coût de revient d'une pièce artisanale et pourquoi son calcul précis est-il souvent négligé, au détriment de la rentabilité ?",
        options: [
          "Le coût de revient n'inclut que le prix des matières premières",
          "Il doit intégrer matières premières, temps de main d'œuvre réel (souvent sous-évalué), outillage et charges fixes -- une sous-évaluation du temps de travail est une erreur fréquente qui érode la rentabilité",
          "Il est toujours calculé automatiquement par les logiciels de comptabilité",
          "Ce calcul n'a d'intérêt que pour les grandes structures artisanales",
          "Le coût de revient est identique quel que soit le type de pièce réalisée",
        ],
        correctIndex: 1,
        explanation:
          "Le coût de revient doit intégrer le temps de main d'œuvre réel, souvent sous-évalué par les artisans passionnés par leur geste technique -- une erreur de calcul fréquente qui érode silencieusement la rentabilité de l'activité.",
      },
      {
        question: "Pourquoi la traçabilité des matériaux (origine, conformité aux normes) devient-elle un enjeu croissant même pour de petites structures artisanales ?",
        options: [
          "Elle ne concerne que les grandes entreprises industrielles",
          "Les exigences réglementaires (sécurité, environnement) et les attentes des clients en matière de transparence s'appliquent de plus en plus, quelle que soit la taille de la structure",
          "La traçabilité n'a aucun impact commercial",
          "Elle est facultative tant que le produit final est de bonne qualité visuelle",
          "Cet enjeu ne concerne que les matériaux importés",
        ],
        correctIndex: 1,
        explanation:
          "Les exigences réglementaires (sécurité, environnement) et les attentes croissantes des clients en matière de transparence sur l'origine des matériaux concernent désormais les artisans, pas seulement l'industrie.",
      },
      {
        question: "Qu'est-ce que la reconversion ou la modernisation d'un métier d'art (nouveaux outils, nouveaux usages) implique-t-elle en termes d'équilibre avec la tradition ?",
        options: [
          "Il faut choisir entre tradition pure et modernité totale, sans possibilité d'équilibre",
          "Intégrer des outils ou usages modernes (numérique, nouveaux matériaux) sans dénaturer le savoir-faire fondamental qui fait la valeur et l'identité du métier",
          "La modernisation d'un métier d'art est toujours néfaste pour sa valeur",
          "Seuls les métiers d'art en déclin ont intérêt à se moderniser",
          "La tradition et la modernité n'ont jamais de lien dans les métiers d'art",
        ],
        correctIndex: 1,
        explanation:
          "L'enjeu est d'intégrer des outils ou usages modernes sans dénaturer le savoir-faire fondamental qui fait la valeur et l'identité du métier -- un équilibre délicat mais pas contradictoire en soi.",
      },
      {
        question: "Pourquoi la question de la relève et de la transmission d'entreprise est-elle particulièrement critique dans certains métiers d'art rares ?",
        options: [
          "Ce n'est pas un enjeu réel, il y a toujours suffisamment de candidats",
          "Quand un savoir-faire rare repose sur très peu de praticiens, l'absence de transmission organisée avant leur départ à la retraite peut faire disparaître définitivement la compétence",
          "La transmission ne concerne que les grandes maisons de luxe",
          "Ce problème ne touche que les métiers déjà officiellement classés en voie de disparition",
          "La modernisation des outils rend la transmission humaine inutile",
        ],
        correctIndex: 1,
        explanation:
          "Quand un savoir-faire rare repose sur très peu de praticiens, l'absence de transmission organisée avant leur départ peut faire disparaître définitivement une compétence -- un enjeu patrimonial réel identifié pour plusieurs métiers d'art en France.",
      },
      {
        question: "Pourquoi le statut juridique et social d'un artisan indépendant (auto-entrepreneur, artisan immatriculé au répertoire des métiers) a-t-il un impact direct sur la viabilité économique de son activité ?",
        options: [
          "Le statut juridique n'a aucun impact réel, seul le talent compte",
          "Chaque statut implique des règles différentes de charges sociales, de plafonds de chiffre d'affaires et de couverture sociale, qui doivent être choisies en cohérence avec la réalité économique du projet",
          "Tous les statuts offrent exactement la même protection sociale",
          "Le choix du statut est purement administratif, sans conséquence financière",
          "Seules les grandes entreprises artisanales doivent se soucier de leur statut juridique",
        ],
        correctIndex: 1,
        explanation:
          "Le choix du statut (auto-entrepreneur, artisan immatriculé, société) implique des règles très différentes de charges sociales, de plafonds et de couverture sociale : un mauvais choix peut fragiliser durablement la viabilité économique d'une activité artisanale.",
      },
    ],
  },

  environnement: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'environnement / le développement durable ?",
        options: [
          "Je veux contribuer concrètement à des solutions ayant un impact positif réel",
          "Parce que c'est un secteur à la mode en ce moment",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à un impact concret et mesurable est plus solide et crédible qu'une motivation liée à une simple tendance du moment.",
      },
      {
        question: "Qu'est-ce que la RSE (Responsabilité Sociétale des Entreprises), en une phrase simple ?",
        options: [
          "Une taxe environnementale obligatoire pour toutes les entreprises",
          "La prise en compte volontaire par une entreprise des enjeux sociaux et environnementaux dans ses activités et sa stratégie",
          "Un label réservé aux associations à but non lucratif",
          "Un poste réservé uniquement aux grandes entreprises du CAC 40",
          "Une réglementation qui ne concerne que le secteur industriel",
        ],
        correctIndex: 1,
        explanation:
          "La RSE désigne la prise en compte volontaire des enjeux sociaux et environnementaux dans la stratégie et les activités d'une entreprise, au-delà des seules obligations légales.",
      },
      {
        question: "Un collègue minimise l'impact environnemental d'un projet sur lequel tu travailles. Que fais-tu ?",
        options: [
          "Je laisse passer sans rien dire pour éviter le conflit",
          "J'expose factuellement les impacts identifiés et propose des pistes d'amélioration concrètes",
          "Je dénonce publiquement le collègue sans discussion préalable",
          "J'abandonne le projet",
          "Je considère que ce n'est pas mon rôle d'en parler",
        ],
        correctIndex: 1,
        explanation:
          "Exposer factuellement les impacts et proposer des solutions concrètes est plus constructif et professionnel qu'un silence complice ou une confrontation publique.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop idéaliste sur le rythme du changement, donc j'apprends à proposer des solutions réalistes étape par étape",
          "Je n'aime pas les enjeux environnementaux",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et courant dans ce secteur (l'idéalisme face au rythme réel du changement), avec une piste d'amélioration concrète, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi la donnée chiffrée (bilan carbone, indicateurs) est-elle essentielle dans les démarches environnementales en entreprise ?",
        options: [
          "Ce n'est qu'un exercice de communication sans réel intérêt",
          "Parce qu'elle permet de mesurer objectivement les progrès réalisés et de prioriser les actions ayant le plus d'impact réel",
          "Les chiffres n'ont aucun lien avec l'efficacité des actions environnementales",
          "Uniquement pour respecter une obligation administrative",
          "Cette donnée ne concerne que les très grandes entreprises",
        ],
        correctIndex: 1,
        explanation:
          "Mesurer objectivement (bilan carbone, indicateurs) permet de prioriser les actions ayant le plus d'impact réel plutôt que de se contenter d'une communication sans effet mesurable.",
      },
    ],
    medium: [
      {
        question: "Comment convaincre une direction réticente d'investir dans une démarche environnementale coûteuse à court terme ?",
        options: [
          "En insistant uniquement sur l'urgence climatique, sans lien avec les enjeux business",
          "En construisant un argumentaire chiffré reliant la démarche à des bénéfices concrets pour l'entreprise (image, conformité réglementaire, économies à moyen terme)",
          "En imposant la décision sans consultation",
          "En attendant que la réglementation impose la démarche",
          "En considérant que ce n'est pas possible de convaincre une direction réticente",
        ],
        correctIndex: 1,
        explanation:
          "Un argumentaire chiffré reliant la démarche environnementale à des bénéfices concrets (image, conformité, économies) convainc davantage qu'un discours uniquement moral, aussi légitime soit-il.",
      },
      {
        question: "Qu'est-ce que le \"greenwashing\" et pourquoi est-il un risque à éviter absolument pour une entreprise ?",
        options: [
          "Une pratique légale et sans risque de communication environnementale",
          "Le fait de communiquer sur un engagement environnemental disproportionné par rapport aux actions réelles, exposant à un risque réputationnel et parfois juridique",
          "Un terme technique désignant les énergies renouvelables",
          "Une pratique encouragée par les autorités de régulation",
          "Un concept qui ne concerne que les grandes multinationales",
        ],
        correctIndex: 1,
        explanation:
          "Le greenwashing (communication disproportionnée par rapport aux actions réelles) expose l'entreprise à un risque réputationnel fort et, de plus en plus, à des sanctions juridiques (loi anti-greenwashing, réglementations sur les allégations environnementales).",
      },
      {
        question: "Pourquoi l'analyse du cycle de vie (ACV) est-elle plus fiable qu'une évaluation limitée à la seule phase d'usage d'un produit ?",
        options: [
          "Elle ne prend en compte que le coût financier du produit",
          "Elle évalue l'impact environnemental sur l'ensemble du cycle (fabrication, transport, usage, fin de vie), évitant les conclusions trompeuses basées sur une seule étape",
          "L'ACV ne s'applique qu'aux produits alimentaires",
          "Elle est identique pour tous les produits, sans variation",
          "Elle ne concerne que les aspects sociaux d'un produit",
        ],
        correctIndex: 1,
        explanation:
          "Se limiter à la phase d'usage peut être trompeur : l'ACV intègre fabrication, transport, usage et fin de vie pour une évaluation environnementale réellement complète et comparable entre produits.",
      },
      {
        question: "Comment gères-tu un projet environnemental qui entre en tension avec un objectif économique de court terme ?",
        options: [
          "Je sacrifie systématiquement l'objectif environnemental",
          "Je cherche un compromis ou un phasage qui respecte les deux contraintes, en documentant clairement les arbitrages",
          "Je sacrifie systématiquement l'objectif économique sans discussion",
          "J'ignore la tension en espérant qu'elle se résolve seule",
          "Je considère qu'un compromis n'est jamais possible dans ce genre de situation",
        ],
        correctIndex: 1,
        explanation:
          "Chercher un compromis ou un phasage documenté, plutôt que de sacrifier systématiquement l'un des deux objectifs, est la compétence clé pour faire avancer des projets environnementaux dans un contexte économique réel.",
      },
      {
        question: "Pourquoi la réglementation environnementale (ex: CSRD, taxonomie européenne) évolue-t-elle rapidement, et quel impact pour les entreprises ?",
        options: [
          "Elle n'évolue quasiment jamais, le cadre est stable depuis des décennies",
          "Face à l'urgence climatique et aux attentes sociétales, le cadre réglementaire se renforce et impose de plus en plus d'obligations de reporting et de transparence aux entreprises",
          "La réglementation ne concerne que les entreprises du secteur énergétique",
          "Ces évolutions n'ont aucun impact opérationnel réel sur les entreprises",
          "Le cadre réglementaire européen n'a aucune influence sur les entreprises françaises",
        ],
        correctIndex: 1,
        explanation:
          "Le cadre réglementaire environnemental (CSRD, taxonomie européenne...) se renforce rapidement, imposant des obligations croissantes de reporting extra-financier -- une veille réglementaire active est devenue indispensable dans ce métier.",
      },
      {
        question: "Pourquoi la sensibilisation des équipes internes est-elle aussi importante que les mesures techniques dans une démarche environnementale d'entreprise ?",
        options: [
          "Ce n'est pas vraiment utile si les mesures techniques sont bien conçues",
          "Parce que sans adhésion et compréhension des équipes, même les meilleures mesures techniques risquent d'être mal appliquées ou abandonnées avec le temps",
          "La sensibilisation ne concerne que les équipes dirigeantes",
          "Elle n'a aucun impact sur la réussite d'un projet environnemental",
          "Elle remplace totalement le besoin de mesures techniques concrètes",
        ],
        correctIndex: 1,
        explanation:
          "Sans adhésion et compréhension des équipes, même les meilleures mesures techniques risquent d'être mal appliquées ou abandonnées : la sensibilisation humaine est un facteur de réussite aussi important que la technique.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la CSRD (Corporate Sustainability Reporting Directive) impose concrètement aux entreprises concernées ?",
        options: [
          "Une simple recommandation facultative de communication environnementale",
          "Une obligation de publier un reporting extra-financier détaillé et audité, structuré selon des normes européennes précises (ESRS), couvrant enjeux environnementaux, sociaux et de gouvernance",
          "Une taxe carbone applicable à toutes les entreprises européennes",
          "Une directive qui ne concerne que les entreprises du secteur financier",
          "Un dispositif volontaire sans contrôle ni sanction possible",
        ],
        correctIndex: 1,
        explanation:
          "La CSRD impose aux entreprises concernées un reporting extra-financier détaillé, audité et structuré selon les normes européennes ESRS, bien plus contraignant que les anciennes obligations de reporting RSE volontaire.",
      },
      {
        question: "Qu'est-ce que les \"scopes\" 1, 2 et 3 dans un bilan carbone, et pourquoi le scope 3 est-il souvent le plus difficile à maîtriser ?",
        options: [
          "Ce sont trois méthodes de calcul concurrentes et incompatibles entre elles",
          "Le scope 1 couvre les émissions directes, le scope 2 les émissions liées à l'énergie achetée, et le scope 3 l'ensemble de la chaîne de valeur (fournisseurs, usage produit) -- souvent la part la plus importante mais la plus difficile à mesurer précisément",
          "Le scope 3 ne concerne que les émissions liées aux déplacements du personnel",
          "Seul le scope 1 est obligatoire à déclarer en France",
          "Les scopes ne s'appliquent qu'aux entreprises industrielles",
        ],
        correctIndex: 1,
        explanation:
          "Le scope 3 (chaîne de valeur amont et aval : fournisseurs, transport, usage du produit) représente souvent la majorité des émissions d'une entreprise, mais reste le plus difficile à mesurer précisément par manque de données fiables sur toute la chaîne.",
      },
      {
        question: "Pourquoi l'écoconception est-elle considérée comme plus efficace qu'une correction environnementale a posteriori ?",
        options: [
          "Elle n'a aucun avantage réel par rapport à une correction ultérieure",
          "Intégrer les critères environnementaux dès la conception d'un produit permet d'agir sur des leviers structurels (matériaux, durabilité, fin de vie) impossibles à corriger efficacement une fois le produit conçu",
          "L'écoconception ne concerne que l'emballage des produits",
          "Elle est toujours plus coûteuse et moins efficace qu'une correction a posteriori",
          "Ce principe ne s'applique qu'aux produits électroniques",
        ],
        correctIndex: 1,
        explanation:
          "Agir dès la conception (matériaux, durabilité, réparabilité, fin de vie) permet des gains structurels souvent impossibles à obtenir par une correction a posteriori, une fois les choix de conception figés.",
      },
      {
        question: "Qu'est-ce que la taxonomie verte européenne et quel problème vise-t-elle à résoudre ?",
        options: [
          "Une liste de sanctions applicables aux entreprises polluantes",
          "Une classification commune définissant quelles activités économiques peuvent être considérées comme \"durables\", pour lutter contre le greenwashing dans la finance verte",
          "Un impôt européen sur les activités polluantes",
          "Une norme technique de fabrication des panneaux solaires",
          "Un dispositif qui ne concerne que les investissements publics",
        ],
        correctIndex: 1,
        explanation:
          "La taxonomie verte européenne définit un référentiel commun pour qualifier une activité économique de \"durable\", visant à réduire le greenwashing dans les produits financiers présentés comme verts.",
      },
      {
        question: "Pourquoi la notion de \"double matérialité\" structure-t-elle désormais les reportings de durabilité (CSRD) ?",
        options: [
          "Elle n'a qu'une valeur théorique sans application concrète",
          "Elle impose d'évaluer à la fois l'impact de l'entreprise sur l'environnement/la société ET l'impact des enjeux environnementaux/sociaux sur la performance financière de l'entreprise",
          "Elle ne concerne que l'impact financier, jamais l'impact environnemental",
          "Elle ne s'applique qu'aux entreprises cotées en bourse",
          "Elle remplace totalement le calcul du bilan carbone",
        ],
        correctIndex: 1,
        explanation:
          "La double matérialité impose d'évaluer simultanément l'impact de l'entreprise sur son environnement (matérialité d'impact) et l'impact des enjeux de durabilité sur sa performance financière (matérialité financière) -- un changement structurant des nouveaux reportings CSRD.",
      },
      {
        question: "Pourquoi la compensation carbone est-elle un outil controversé, et dans quelles conditions peut-elle rester crédible ?",
        options: [
          "Elle n'est jamais controversée, c'est un outil universellement reconnu comme fiable",
          "Elle est critiquée quand elle sert à éviter une vraie réduction des émissions à la source ; elle reste plus crédible en complément (pas en substitut) d'une trajectoire de réduction réelle, avec des projets vérifiés et additionnels",
          "La compensation carbone est interdite dans l'Union européenne",
          "Elle ne concerne que les émissions du secteur aérien",
          "Elle a exactement le même effet climatique qu'une réduction réelle des émissions",
        ],
        correctIndex: 1,
        explanation:
          "La compensation carbone est critiquée quand elle sert d'alibi pour éviter une vraie réduction des émissions ; elle garde une crédibilité réelle uniquement en complément d'une trajectoire de réduction sérieuse, avec des projets de compensation vérifiés et réellement additionnels.",
      },
      {
        question: "Pourquoi la notion de \"limites planétaires\" élargit-elle le débat environnemental au-delà du seul climat ?",
        options: [
          "Le climat est la seule limite planétaire scientifiquement reconnue",
          "Le concept identifie plusieurs frontières critiques (biodiversité, cycle de l'azote, eau douce, acidification des océans...) dont certaines sont déjà dépassées, montrant que l'urgence environnementale ne se limite pas au seul réchauffement climatique",
          "Les limites planétaires ne concernent que les pays en développement",
          "Ce concept a été scientifiquement invalidé depuis sa publication",
          "Il ne s'applique qu'à l'échelle locale, jamais globale",
        ],
        correctIndex: 1,
        explanation:
          "Le concept des limites planétaires identifie plusieurs frontières critiques (biodiversité, cycle de l'azote, eau douce, acidification des océans, climat...) dont certaines sont déjà considérées comme dépassées -- élargissant l'urgence environnementale au-delà du seul enjeu climatique.",
      },
    ],
  },

  traduction_langues: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en traduction / interprétariat ?",
        options: [
          "J'aime le défi de transmettre fidèlement un sens d'une langue à une autre",
          "Parce que je parle plusieurs langues sans autre raison particulière",
          "Je n'ai pas de raison précise",
          "Parce que ça a l'air un métier facile",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La traduction n'est pas qu'une compétence linguistique mais un vrai travail de transmission fidèle de sens : une motivation centrée là-dessus est plus solide qu'une simple maîtrise des langues.",
      },
      {
        question: "Quelle est la différence entre traduction et interprétariat ?",
        options: [
          "Ce sont deux mots pour désigner exactement la même activité",
          "La traduction porte sur l'écrit, l'interprétariat sur l'oral en temps réel",
          "L'interprétariat concerne uniquement les langues rares",
          "La traduction ne concerne que les documents juridiques",
          "L'interprétariat est toujours fait par ordinateur aujourd'hui",
        ],
        correctIndex: 1,
        explanation:
          "La traduction transpose un texte écrit d'une langue à l'autre, l'interprétariat restitue un discours oral en temps réel (ou quasi) : deux métiers aux compétences et contraintes différentes.",
      },
      {
        question: "Tu ne connais pas la traduction exacte d'un terme technique très spécifique. Que fais-tu ?",
        options: [
          "J'invente une traduction approximative sans vérifier",
          "Je recherche le terme dans des sources fiables (glossaires spécialisés, documentation du domaine) avant de trancher",
          "Je laisse le terme en langue source sans explication",
          "Je saute le mot dans la traduction finale",
          "Je choisis la première traduction automatique venue sans vérification",
        ],
        correctIndex: 1,
        explanation:
          "Rechercher un terme technique dans des sources spécialisées fiables plutôt que d'improviser est un réflexe professionnel essentiel, surtout sur des domaines pointus (médical, juridique, technique).",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir traduire trop littéralement, donc j'apprends à privilégier le sens naturel dans la langue cible",
          "Je n'aime pas les langues étrangères",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et fréquent chez les débutants en traduction (la littéralité excessive), avec une piste d'amélioration concrète, montre une bonne compréhension du métier.",
      },
      {
        question: "Pourquoi la maîtrise parfaite de sa langue maternelle est-elle aussi importante que celle des langues étrangères en traduction ?",
        options: [
          "Ce n'est pas vraiment important si on maîtrise bien la langue source",
          "Parce que le texte final doit se lire naturellement dans la langue cible, ce qui exige une excellente maîtrise stylistique de cette langue",
          "La langue maternelle n'a aucun impact sur la qualité de la traduction",
          "Cette exigence ne concerne que la traduction littéraire",
          "Il suffit d'un correcteur automatique pour compenser ce manque",
        ],
        correctIndex: 1,
        explanation:
          "Un texte traduit doit se lire naturellement dans la langue cible : une excellente maîtrise stylistique de sa langue maternelle est aussi essentielle que la compréhension de la langue source.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu un texte contenant un jeu de mots intraduisible littéralement ?",
        options: [
          "Je le traduis littéralement même si le sens humoristique se perd",
          "Je cherche une équivalence qui préserve l'effet recherché (humour, ton) plutôt qu'une traduction mot à mot",
          "Je supprime purement et simplement le passage",
          "Je laisse une note en bas de page sans proposer de solution dans le texte",
          "Je considère que les jeux de mots ne doivent jamais être traduits",
        ],
        correctIndex: 1,
        explanation:
          "Chercher une équivalence qui préserve l'effet recherché (plutôt qu'une traduction littérale qui perdrait tout son sens) est une compétence clé de la traduction créative.",
      },
      {
        question: "Pourquoi la connaissance du contexte culturel est-elle aussi importante que la connaissance de la langue elle-même ?",
        options: [
          "Le contexte culturel n'a aucun impact sur la qualité d'une traduction",
          "Parce qu'une traduction juste linguistiquement peut être culturellement inadaptée ou incompréhensible pour le public cible",
          "Cette connaissance ne concerne que la traduction littéraire",
          "Il suffit de connaître le vocabulaire pour bien traduire",
          "Le contexte culturel ne concerne que les langues très éloignées du français",
        ],
        correctIndex: 1,
        explanation:
          "Une traduction linguistiquement correcte mais culturellement mal adaptée peut être incompréhensible ou même offensante pour le public cible : le contexte culturel est indissociable d'une bonne traduction.",
      },
      {
        question: "Comment procèdes-tu face à un document technique très spécialisé dont tu ne maîtrises pas encore parfaitement le domaine ?",
        options: [
          "Je refuse systématiquement toute mission technique",
          "Je me documente sur le domaine (glossaires, documentation de référence) avant et pendant la traduction, et je vérifie mes choix terminologiques",
          "Je traduis sans recherche supplémentaire, au feeling",
          "Je délègue systématiquement à un collègue sans jamais monter en compétence",
          "Je considère que la spécialisation n'a pas d'importance en traduction",
        ],
        correctIndex: 1,
        explanation:
          "Se documenter sérieusement sur un domaine technique avant et pendant la traduction, en vérifiant la terminologie, est indispensable pour garantir la fiabilité d'une traduction spécialisée.",
      },
      {
        question: "Pourquoi la relecture par une seconde personne (ou soi-même à froid) est-elle une étape essentielle du processus de traduction ?",
        options: [
          "Ce n'est qu'une étape facultative si le traducteur est expérimenté",
          "Elle permet de repérer des erreurs, des lourdeurs stylistiques ou des incohérences qu'on ne voit plus après avoir travaillé longtemps sur le même texte",
          "La relecture n'a d'utilité que pour les textes très longs",
          "Elle ne concerne que la traduction juridique",
          "Un correcteur automatique remplace totalement cette étape",
        ],
        correctIndex: 1,
        explanation:
          "Après un travail prolongé sur un même texte, on perd en recul critique : une relecture (par soi-même à froid ou par un tiers) permet de repérer des erreurs ou lourdeurs devenues invisibles au traducteur.",
      },
      {
        question: "Comment réagis-tu si un client conteste ton choix de traduction pour un terme précis, avec un argument que tu juges infondé ?",
        options: [
          "J'accepte systématiquement sa version sans discussion, même si elle est incorrecte",
          "J'explique mon choix avec des arguments concrets (sources, usage courant) tout en restant ouvert à un compromis raisonnable",
          "Je refuse catégoriquement toute discussion sur mes choix de traduction",
          "Je change de terme sans lui expliquer pourquoi",
          "Je considère que le client n'a jamais le droit de remettre en question une traduction",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer son choix avec des arguments concrets, tout en restant ouvert à un compromis raisonnable, montre à la fois expertise et professionnalisme dans la relation client.",
      },
      {
        question: "Pourquoi l'essor de la traduction automatique (IA) change-t-il le métier sans pour autant le rendre obsolète ?",
        options: [
          "La traduction automatique remplace totalement le besoin de traducteurs humains",
          "Elle est utile pour des textes simples ou comme premier jet, mais reste limitée sur les nuances, le contexte culturel et les enjeux de qualité élevés, où l'expertise humaine reste déterminante",
          "La traduction automatique n'a aucun impact sur le métier",
          "Elle ne concerne que les langues rares",
          "Elle est interdite d'usage professionnel dans le secteur",
        ],
        correctIndex: 1,
        explanation:
          "La traduction automatique est utile pour des textes simples ou comme point de départ, mais reste limitée sur les nuances, le contexte culturel et les exigences de qualité élevée -- le métier évolue (post-édition, spécialisation) plutôt que de disparaître.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la \"fidélité\" en traduction, et pourquoi ne se résume-t-elle pas à une traduction mot à mot ?",
        options: [
          "La fidélité signifie toujours traduire chaque mot littéralement, sans exception",
          "Elle désigne la restitution fidèle du sens, du ton et de l'effet du texte source, ce qui exige parfois de s'éloigner de la structure littérale pour un rendu naturel et équivalent dans la langue cible",
          "La fidélité ne concerne que la traduction juridique",
          "Elle n'a aucune importance face à la fluidité du texte final",
          "C'est un concept obsolète abandonné par la traductologie moderne",
        ],
        correctIndex: 1,
        explanation:
          "La fidélité en traduction porte sur le sens, le ton et l'effet du texte, pas sur une correspondance mot à mot : un concept central de la traductologie qui justifie les choix d'adaptation nécessaires à une traduction de qualité.",
      },
      {
        question: "Pourquoi la traduction assermentée a-t-elle une valeur juridique différente d'une traduction classique ?",
        options: [
          "Il n'y a aucune différence juridique entre les deux",
          "Une traduction assermentée est réalisée par un traducteur agréé par une Cour d'appel, qui certifie sa conformité au document original -- une condition souvent exigée pour des démarches officielles (actes d'état civil, diplômes, contrats)",
          "La traduction assermentée est réservée uniquement aux documents en anglais",
          "Elle est plus rapide mais moins fiable qu'une traduction classique",
          "Elle ne concerne que les traductions littéraires publiées",
        ],
        correctIndex: 1,
        explanation:
          "Un traducteur assermenté est agréé par une Cour d'appel et engage sa responsabilité en certifiant la conformité de sa traduction à l'original -- une exigence légale pour de nombreuses démarches administratives officielles.",
      },
      {
        question: "Qu'est-ce que la \"localisation\" en traduction, et en quoi va-t-elle au-delà d'une simple traduction linguistique ?",
        options: [
          "Un synonyme strict de traduction, sans différence de méthode",
          "Elle adapte un contenu (logiciel, site web, jeu vidéo) aux spécificités culturelles, techniques et légales du marché cible, au-delà de la seule langue (formats de date, devises, références culturelles)",
          "La localisation ne concerne que la traduction de jeux vidéo",
          "Elle consiste uniquement à changer la langue de l'interface utilisateur",
          "Elle est toujours moins exigeante qu'une traduction classique",
        ],
        correctIndex: 1,
        explanation:
          "La localisation adapte un contenu aux spécificités culturelles, techniques et légales d'un marché (formats, références culturelles, conformité locale), une démarche plus large que la seule traduction linguistique.",
      },
      {
        question: "En interprétariat de conférence, quelle est la différence entre interprétation simultanée et consécutive, et quelles compétences distinctes exigent-elles ?",
        options: [
          "Ce sont deux termes équivalents pour la même pratique",
          "La simultanée restitue le discours en temps quasi réel (souvent en cabine), exigeant une charge cognitive extrême ; la consécutive restitue par segments après la prise de parole, exigeant une excellente mémorisation et prise de notes structurée",
          "La consécutive est toujours plus rapide que la simultanée",
          "La simultanée ne s'utilise que pour les langues des signes",
          "Ces deux techniques exigent exactement les mêmes compétences",
        ],
        correctIndex: 1,
        explanation:
          "La simultanée impose une charge cognitive extrême (écouter, traduire et parler en même temps, souvent en cabine), la consécutive exige une mémorisation et une prise de notes très structurées pour restituer fidèlement de longs segments après coup.",
      },
      {
        question: "Pourquoi la théorie du \"skopos\" en traductologie remet-elle en question l'idée d'une traduction unique et objectivement \"correcte\" ?",
        options: [
          "Elle affirme au contraire qu'il existe toujours une seule bonne traduction possible",
          "Elle soutient que la traduction doit être évaluée selon sa finalité (le public, l'usage prévu) plutôt que selon une fidélité abstraite au texte source, ce qui justifie des choix différents selon le contexte",
          "Le skopos ne concerne que la traduction publicitaire",
          "Cette théorie a été largement invalidée par la pratique professionnelle",
          "Elle ne s'applique qu'aux langues européennes",
        ],
        correctIndex: 1,
        explanation:
          "La théorie du skopos évalue une traduction selon sa finalité (le public visé, l'usage prévu) plutôt que selon une fidélité abstraite au texte source -- justifiant que deux traductions différentes d'un même texte puissent être également \"correctes\" selon leur contexte d'usage.",
      },
      {
        question: "Pourquoi la post-édition de traduction automatique (post-editing) est-elle devenue une compétence professionnelle à part entière ?",
        options: [
          "Elle ne demande aucune compétence particulière, juste une relecture rapide",
          "Elle exige de savoir identifier rapidement les erreurs typiques des moteurs de traduction automatique (contresens, incohérences terminologiques) et de corriger efficacement sans repartir de zéro, un exercice différent de la traduction classique",
          "La post-édition remplace totalement le besoin de traducteurs qualifiés",
          "Elle ne concerne que les textes littéraires",
          "Elle est interdite dans les processus de traduction professionnelle certifiés",
        ],
        correctIndex: 1,
        explanation:
          "La post-édition exige de repérer efficacement les erreurs typiques de la traduction automatique (contresens, incohérences) et de corriger sans repartir de zéro -- une compétence distincte de la traduction classique, de plus en plus demandée dans l'industrie.",
      },
      {
        question: "Pourquoi la traduction juridique exige-t-elle une double compétence, linguistique ET juridique, plutôt qu'une simple maîtrise des langues ?",
        options: [
          "La compétence juridique n'a aucune utilité si la traduction est linguistiquement correcte",
          "Les systèmes juridiques diffèrent d'un pays à l'autre (notions, institutions, procédures) : une traduction purement littérale d'un terme juridique peut induire une erreur de sens grave sur sa portée réelle",
          "La traduction juridique se limite à remplacer les termes techniques par un glossaire fixe",
          "Cette exigence ne concerne que les contrats internationaux les plus complexes",
          "Un traducteur juridique n'a jamais besoin de comprendre le système juridique source",
        ],
        correctIndex: 1,
        explanation:
          "Les systèmes juridiques diffèrent structurellement d'un pays à l'autre : une traduction purement littérale d'un terme juridique, sans compréhension de son sens réel dans le système source, peut créer une erreur de portée grave dans un contrat ou un jugement traduit.",
      },
    ],
  },

  documentation: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en bibliothèque / documentation / archives ?",
        options: [
          "J'aime organiser l'information pour la rendre accessible à d'autres",
          "Parce que ça a l'air un métier calme et sans contact avec le public",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le goût d'organiser et de rendre accessible l'information est au cœur de ces métiers -- une motivation bien plus juste qu'une idée fausse d'isolement du public.",
      },
      {
        question: "Un usager cherche une information mais ne sait pas formuler précisément sa demande. Que fais-tu ?",
        options: [
          "Je lui dis que je ne peux rien faire sans une demande précise",
          "Je pose des questions pour reformuler et cerner son vrai besoin avant de l'orienter",
          "Je lui donne un document au hasard",
          "Je l'ignore s'il n'insiste pas",
          "Je lui dis de chercher seul dans le catalogue",
        ],
        correctIndex: 1,
        explanation:
          "L'entretien de référence -- clarifier le vrai besoin par des questions -- est une compétence centrale du métier, plutôt que d'attendre une demande déjà parfaitement formulée.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être trop perfectionniste sur le classement, donc j'apprends à prioriser selon l'usage réel",
          "Je n'aime pas la lecture",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié à l'exigence de classement/organisation, avec une piste d'amélioration concrète, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi le classement rigoureux des documents est-il essentiel dans ces métiers ?",
        options: [
          "Ce n'est qu'une question d'esthétique",
          "Parce qu'un document mal classé devient quasiment introuvable, rendant l'information inaccessible même si elle existe",
          "Le classement ne concerne que les très grandes collections",
          "Ça n'a aucun impact sur le service rendu aux usagers",
          "Uniquement pour respecter une norme administrative",
        ],
        correctIndex: 1,
        explanation:
          "Un document mal classé devient pratiquement introuvable : le classement rigoureux conditionne directement l'accessibilité réelle de l'information, la mission centrale du métier.",
      },
      {
        question: "Qu'est-ce qu'une notice bibliographique, en une phrase simple ?",
        options: [
          "Un résumé critique du contenu d'un livre",
          "Une description structurée d'un document (auteur, titre, date, éditeur...) permettant de l'identifier et de le retrouver",
          "Une biographie de l'auteur du document",
          "Un document réservé aux archives historiques",
          "Une autorisation d'emprunt délivrée à l'usager",
        ],
        correctIndex: 1,
        explanation:
          "La notice bibliographique décrit un document de façon structurée et normalisée (auteur, titre, date...) pour permettre son identification précise et sa recherche dans un catalogue.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu la conservation d'un document ancien et fragile tout en le rendant accessible aux usagers ?",
        options: [
          "Je le rends disponible sans précaution particulière, l'accès prime toujours",
          "J'évalue s'il existe une version numérisée ou une reproduction consultable, en réservant l'original aux cas où c'est vraiment nécessaire",
          "Je refuse systématiquement toute consultation de documents anciens",
          "Je détruis les documents trop fragiles pour éviter le problème",
          "Je laisse chaque usager décider seul de la manière de manipuler le document",
        ],
        correctIndex: 1,
        explanation:
          "Privilégier une version numérisée ou une reproduction pour la consultation courante, en réservant l'original aux besoins réels, concilie conservation patrimoniale et accès à l'information.",
      },
      {
        question: "Pourquoi l'indexation par mots-clés est-elle une compétence technique importante, au-delà du simple classement physique ?",
        options: [
          "Elle n'a aucune utilité si le classement physique est déjà bien fait",
          "Une bonne indexation permet de retrouver un document par le sens de son contenu, pas seulement par son emplacement physique ou son titre exact",
          "L'indexation ne concerne que les documents numériques",
          "Elle est entièrement automatisée aujourd'hui, sans intervention humaine",
          "Elle ne sert qu'à des fins statistiques internes",
        ],
        correctIndex: 1,
        explanation:
          "L'indexation par mots-clés permet de retrouver un document par son contenu réel, même si l'usager ne connaît ni le titre exact ni l'emplacement -- une compétence complémentaire indispensable au classement physique.",
      },
      {
        question: "Comment réagis-tu face à une demande d'usager portant sur une information manifestement erronée ou une désinformation ?",
        options: [
          "Je fournis l'information demandée sans aucun commentaire",
          "J'oriente vers des sources fiables et vérifiées, en expliquant si besoin pourquoi certaines sources posent problème",
          "Je refuse de répondre à la demande",
          "Je fais la morale à l'usager sur ses sources",
          "Je considère que ce n'est pas le rôle du métier d'orienter vers des sources fiables",
        ],
        correctIndex: 1,
        explanation:
          "Orienter vers des sources fiables et vérifiées, avec pédagogie si besoin, fait partie du rôle d'accompagnement à l'information -- un enjeu d'éducation aux médias de plus en plus central dans ces métiers.",
      },
      {
        question: "Pourquoi la veille documentaire est-elle une activité à part entière dans ces métiers ?",
        options: [
          "Ce n'est qu'une tâche secondaire sans réel intérêt",
          "Elle permet d'anticiper et de collecter en continu les nouvelles ressources pertinentes pour les usagers, plutôt que d'attendre une demande explicite",
          "La veille ne concerne que les centres de documentation spécialisés",
          "Elle est totalement remplacée par les moteurs de recherche grand public",
          "Elle n'a aucun impact sur la qualité du service rendu",
        ],
        correctIndex: 1,
        explanation:
          "La veille documentaire anticipe les besoins en collectant en continu des ressources pertinentes, plutôt que de réagir uniquement aux demandes explicites -- une dimension proactive essentielle du métier.",
      },
      {
        question: "Comment concilies-tu accessibilité maximale de l'information et respect du droit d'auteur sur les documents que tu gères ?",
        options: [
          "Je considère que le droit d'auteur n'a pas sa place dans une logique d'accès à l'information",
          "Je m'assure que la diffusion ou la reproduction respecte le cadre légal (exceptions pédagogiques, domaine public, autorisations) avant de rendre un document largement accessible",
          "Je diffuse systématiquement tous les documents sans vérification",
          "Je refuse toute diffusion par précaution, même quand c'est légalement possible",
          "Le droit d'auteur ne concerne que les documents très récents",
        ],
        correctIndex: 1,
        explanation:
          "Vérifier le cadre légal (exceptions pédagogiques, domaine public, autorisations) avant toute diffusion large protège l'institution tout en maximisant l'accès légal à l'information.",
      },
      {
        question: "Pourquoi la médiation numérique (réseaux sociaux, ateliers, ressources en ligne) est-elle devenue une compétence attendue dans ces métiers ?",
        options: [
          "Ce n'est pas vraiment utile, le public vient toujours physiquement",
          "Parce que les usages de recherche d'information évoluent, et toucher le public là où il se trouve (numérique) élargit et diversifie l'accès aux ressources",
          "La médiation numérique remplace totalement le contact humain",
          "Elle ne concerne que les grandes bibliothèques nationales",
          "Elle n'a aucun impact sur la fréquentation ou l'usage des ressources",
        ],
        correctIndex: 1,
        explanation:
          "Les usages de recherche d'information évoluent vers le numérique : développer une présence et une médiation numérique élargit l'accès aux ressources au-delà du seul public qui se déplace physiquement.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le \"catalogage FRBR/RDA\" et pourquoi ces normes structurent-elles le travail des bibliothécaires-documentalistes ?",
        options: [
          "Ce sont des outils informatiques propriétaires sans standardisation",
          "Ce sont des modèles conceptuels et normes internationales de catalogage qui structurent la description des documents pour permettre leur interopérabilité entre catalogues et institutions",
          "Ils ne concernent que les documents numériques",
          "Ils ont été abandonnés au profit d'un catalogage libre sans norme",
          "Ils ne s'appliquent qu'aux bibliothèques universitaires",
        ],
        correctIndex: 1,
        explanation:
          "FRBR (modèle conceptuel) et RDA (norme de catalogage) structurent la description des documents pour garantir leur interopérabilité entre différents catalogues et institutions à l'échelle internationale.",
      },
      {
        question: "Pourquoi la préservation numérique pose-t-elle des défis techniques différents de la conservation d'un document papier ?",
        options: [
          "Un document numérique se conserve indéfiniment sans aucune intervention",
          "Elle nécessite d'anticiper l'obsolescence des formats de fichiers et des supports de stockage, avec des migrations régulières pour garantir la lisibilité à long terme",
          "La préservation numérique ne concerne que les très grandes institutions",
          "Elle est identique à la conservation papier, seul le support change",
          "Ce défi a été définitivement résolu par le cloud computing",
        ],
        correctIndex: 1,
        explanation:
          "Un document numérique dépend de formats de fichiers et de supports de stockage qui deviennent obsolètes : la préservation numérique exige des stratégies de migration régulière, un défi structurellement différent de la conservation papier.",
      },
      {
        question: "Quelle est la valeur juridique et patrimoniale du dépôt légal en France ?",
        options: [
          "Une simple formalité administrative sans réel enjeu patrimonial",
          "Une obligation légale de remettre un exemplaire de toute publication à des institutions désignées (BnF notamment), garantissant la conservation du patrimoine documentaire national et permettant des usages juridiques (preuve de publication, droit d'auteur)",
          "Un dispositif réservé exclusivement aux ouvrages numériques",
          "Une obligation qui ne concerne que les éditeurs étrangers",
          "Un dispositif facultatif laissé à la discrétion de l'éditeur",
        ],
        correctIndex: 1,
        explanation:
          "Le dépôt légal est une obligation légale garantissant la conservation du patrimoine documentaire national et pouvant servir de preuve juridique (date de publication, droit d'auteur) -- un enjeu à la fois patrimonial et juridique.",
      },
      {
        question: "Pourquoi les architectures de métadonnées (Dublin Core, schémas XML) sont-elles cruciales pour l'interopérabilité des systèmes documentaires ?",
        options: [
          "Elles n'ont qu'un intérêt esthétique dans la présentation des catalogues",
          "Elles définissent un vocabulaire commun et structuré permettant à différents systèmes d'échanger et de comprendre les mêmes informations sur un document, indépendamment du logiciel utilisé",
          "Elles ne concernent que les très grandes bases de données internationales",
          "Elles remplacent totalement le besoin d'un catalogueur humain",
          "Ces standards sont devenus obsolètes avec l'intelligence artificielle",
        ],
        correctIndex: 1,
        explanation:
          "Des standards de métadonnées comme Dublin Core définissent un vocabulaire commun structuré, permettant à des systèmes documentaires différents d'échanger et de comprendre les mêmes informations sur un document -- une base technique de l'interopérabilité.",
      },
      {
        question: "Qu'est-ce que le \"web sémantique\" et les données liées (linked data) appliqués aux catalogues de bibliothèques ?",
        options: [
          "Un simple moteur de recherche plus rapide sans changement de structure",
          "Une approche qui relie les données bibliographiques à d'autres jeux de données sur le web (autorités, encyclopédies) via des identifiants uniques, enrichissant la recherche au-delà du seul catalogue local",
          "Un concept réservé exclusivement aux bibliothèques numériques pures",
          "Un dispositif qui remplace totalement les notices bibliographiques classiques",
          "Une technologie déjà abandonnée par les grandes institutions documentaires",
        ],
        correctIndex: 1,
        explanation:
          "Les données liées relient les informations bibliographiques à d'autres ressources du web via des identifiants uniques (autorités, référentiels externes), enrichissant considérablement les possibilités de recherche au-delà du seul catalogue local.",
      },
      {
        question: "Pourquoi l'accompagnement à l'esprit critique face à l'information (littératie informationnelle) est-il devenu un enjeu central de ces métiers à l'ère du numérique ?",
        options: [
          "Ce n'est pas un enjeu nouveau, la profanation n'a pas changé depuis toujours",
          "Face à la multiplication et à la viralité de la désinformation en ligne, accompagner les usagers dans l'évaluation critique des sources est devenu une mission aussi importante que l'accès à l'information elle-même",
          "Cet enjeu ne concerne que les bibliothèques universitaires",
          "La littératie informationnelle ne concerne que les enfants",
          "Elle a totalement disparu avec l'essor des moteurs de recherche fiables",
        ],
        correctIndex: 1,
        explanation:
          "Face à la multiplication de la désinformation en ligne, accompagner les usagers dans l'évaluation critique des sources (littératie informationnelle) est devenu une mission à part entière, aussi centrale que le simple accès à l'information.",
      },
      {
        question: "Pourquoi le records management (gestion des archives courantes et intermédiaires en entreprise) est-il un enjeu juridique autant qu'organisationnel ?",
        options: [
          "Ce n'est qu'une question de rangement sans réel enjeu",
          "Certains documents doivent être conservés pendant des durées légales précises (comptables, sociaux, contractuels) : une mauvaise gestion expose l'entreprise à des risques juridiques en cas de contrôle ou de litige",
          "Le records management ne concerne que les archives historiques, jamais les documents courants",
          "Il a été rendu inutile par la dématérialisation complète des documents",
          "Il ne concerne que les très grandes entreprises cotées en bourse",
        ],
        correctIndex: 1,
        explanation:
          "Certains documents d'entreprise doivent être conservés pendant des durées légales précises (comptables, sociaux, contractuels) : une gestion défaillante des archives courantes expose l'entreprise à un risque juridique réel en cas de contrôle ou de litige.",
      },
    ],
  },

  recherche_scientifique: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la recherche scientifique ?",
        options: [
          "J'aime comprendre en profondeur comment les choses fonctionnent et repousser les limites du savoir",
          "Parce que ça a l'air un métier tranquille et sans pression",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La curiosité intellectuelle et le goût de comprendre en profondeur sont au cœur de la recherche -- une motivation bien plus solide qu'une idée fausse de tranquillité.",
      },
      {
        question: "Qu'est-ce qu'une hypothèse scientifique, en une phrase simple ?",
        options: [
          "Une vérité déjà démontrée et acceptée par tous",
          "Une proposition provisoire à tester par l'expérimentation ou l'observation",
          "Une opinion personnelle du chercheur sans besoin de vérification",
          "Un résultat final d'une étude",
          "Une loi physique universellement reconnue",
        ],
        correctIndex: 1,
        explanation:
          "L'hypothèse est une proposition provisoire, formulée pour être testée : elle guide la démarche expérimentale mais n'a de valeur qu'une fois confrontée aux faits.",
      },
      {
        question: "Une expérience donne un résultat inattendu, différent de ce que tu espérais. Que fais-tu ?",
        options: [
          "Je modifie les données pour qu'elles correspondent à mon hypothèse",
          "J'analyse honnêtement le résultat, cherche une explication possible et vérifie ma méthode avant de tirer des conclusions",
          "J'ignore ce résultat et je continue comme si de rien n'était",
          "J'abandonne immédiatement le projet",
          "Je publie le résultat sans aucune vérification supplémentaire",
        ],
        correctIndex: 1,
        explanation:
          "Analyser honnêtement un résultat inattendu, sans jamais altérer les données, est un principe fondamental de l'intégrité scientifique -- un résultat surprenant peut être une découverte ou une erreur de méthode, les deux méritent d'être vérifiées.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite vers une conclusion, donc j'apprends à toujours vérifier rigoureusement avant de conclure",
          "Je n'aime pas la rigueur méthodologique",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur méthodologique, essentielle en recherche, avec une piste d'amélioration concrète, montre une bonne compréhension des exigences du métier.",
      },
      {
        question: "Pourquoi la reproductibilité d'une expérience est-elle un critère essentiel en science ?",
        options: [
          "Ce n'est pas vraiment important si le résultat semble correct",
          "Parce qu'un résultat qui ne peut être reproduit par d'autres chercheurs dans les mêmes conditions n'est pas considéré comme scientifiquement fiable",
          "La reproductibilité ne concerne que certaines disciplines très spécifiques",
          "Elle n'a aucun lien avec la validité d'une découverte",
          "Elle ne concerne que les expériences les plus coûteuses",
        ],
        correctIndex: 1,
        explanation:
          "Un résultat qui ne peut être reproduit dans les mêmes conditions par d'autres chercheurs n'est pas considéré comme scientifiquement établi : la reproductibilité est un pilier de la méthode scientifique.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu une expérience qui ne donne aucun résultat significatif après plusieurs tentatives ?",
        options: [
          "Je force les données pour obtenir un résultat présentable",
          "Je documente rigoureusement l'absence de résultat significatif et réexamine la méthode ou l'hypothèse de départ",
          "J'abandonne le projet sans analyse",
          "Je publie quand même un résultat positif inventé",
          "Je considère qu'un résultat négatif n'a aucune valeur scientifique",
        ],
        correctIndex: 1,
        explanation:
          "Documenter rigoureusement l'absence de résultat significatif (plutôt que de forcer les données) et réexaminer la méthode est le comportement scientifique honnête -- un résultat négatif a aussi une valeur informative.",
      },
      {
        question: "Pourquoi la revue par les pairs (peer review) est-elle un mécanisme central de la publication scientifique ?",
        options: [
          "C'est une simple formalité administrative sans réel contrôle qualité",
          "Elle soumet un travail de recherche à l'examen critique d'autres experts du domaine avant publication, un filtre de qualité et de fiabilité",
          "Elle ne concerne que les très grandes revues internationales",
          "Elle garantit à 100% qu'aucune erreur ne subsiste dans l'article publié",
          "Elle a été largement abandonnée au profit de la publication directe en ligne",
        ],
        correctIndex: 1,
        explanation:
          "La revue par les pairs soumet un travail à l'examen critique d'experts indépendants du domaine avant publication : un filtre de qualité essentiel, même s'il n'élimine pas toute erreur possible.",
      },
      {
        question: "Comment réagis-tu si tu suspectes une erreur méthodologique dans les travaux d'un collègue chercheur ?",
        options: [
          "Je l'ignore pour éviter tout conflit",
          "J'en discute directement et factuellement avec le collègue concerné, en m'appuyant sur des éléments précis",
          "Je dénonce publiquement l'erreur sans en avoir discuté au préalable",
          "Je modifie moi-même ses données sans le prévenir",
          "Je considère que ce n'est jamais mon rôle de signaler ce genre de problème",
        ],
        correctIndex: 1,
        explanation:
          "Discuter directement et factuellement avec le collègue concerné, en s'appuyant sur des éléments précis, est l'approche constructive attendue avant toute escalade -- l'intégrité scientifique collective en dépend.",
      },
      {
        question: "Pourquoi la gestion rigoureuse des données brutes (traçabilité, sauvegarde) est-elle une obligation méthodologique en recherche ?",
        options: [
          "Ce n'est qu'une contrainte administrative sans réel enjeu scientifique",
          "Elle permet de vérifier, réanalyser ou justifier des résultats en cas de contestation ou de nouvelle question de recherche, et protège contre la fraude scientifique",
          "La traçabilité des données ne concerne que les études cliniques",
          "Elle n'a aucun lien avec la crédibilité d'une publication",
          "Elle est facultative si le chercheur est reconnu et expérimenté",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne traçabilité des données permet de vérifier ou réanalyser des résultats en cas de contestation, et constitue une protection essentielle contre la fraude scientifique et les erreurs non détectées.",
      },
      {
        question: "Comment présentes-tu des résultats scientifiques complexes à un public non spécialiste (vulgarisation) ?",
        options: [
          "En utilisant exactement le même vocabulaire technique que pour un article scientifique",
          "En simplifiant le vocabulaire et en utilisant des analogies concrètes, sans dénaturer le sens réel des résultats",
          "En refusant systématiquement de vulgariser, ce n'est pas le rôle du chercheur",
          "En exagérant les résultats pour les rendre plus impressionnants",
          "La vulgarisation n'a aucune utilité pour la recherche",
        ],
        correctIndex: 1,
        explanation:
          "Simplifier le vocabulaire avec des analogies concrètes, sans dénaturer le sens réel des résultats, est une compétence de plus en plus valorisée -- la vulgarisation renforce aussi la confiance du public envers la science.",
      },
      {
        question: "Pourquoi le financement de la recherche (appels à projets, subventions) influence-t-il parfois le choix des sujets étudiés ?",
        options: [
          "Le financement n'a jamais d'influence sur les choix de recherche",
          "Les priorités des financeurs (institutions publiques, industriels) orientent souvent les sujets pouvant obtenir des fonds, ce qui pose la question de l'indépendance de certains axes de recherche",
          "Le financement ne concerne que la recherche appliquée, jamais la recherche fondamentale",
          "Chaque chercheur choisit librement son sujet sans aucune contrainte de financement",
          "Cet enjeu ne concerne que les très grands laboratoires internationaux",
        ],
        correctIndex: 1,
        explanation:
          "Les priorités des organismes financeurs orientent souvent les sujets de recherche pouvant obtenir des financements, un enjeu réel qui interroge l'indépendance de certains axes de recherche moins immédiatement rentables ou prioritaires.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le \"p-hacking\" et pourquoi est-il considéré comme une pratique scientifique problématique ?",
        options: [
          "Une technique légitime pour améliorer la précision statistique d'une étude",
          "Le fait de manipuler l'analyse statistique (choix des tests, des variables) jusqu'à obtenir un résultat statistiquement significatif, ce qui biaise la fiabilité des conclusions",
          "Un terme désignant le piratage informatique de bases de données scientifiques",
          "Une méthode utilisée uniquement en sciences humaines",
          "Une pratique interdite mais impossible à détecter en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Le p-hacking consiste à manipuler l'analyse statistique jusqu'à obtenir un résultat significatif, ce qui biaise fortement la fiabilité des conclusions -- une pratique de plus en plus scrutée dans le débat sur la crise de la reproductibilité en science.",
      },
      {
        question: "Qu'est-ce que la \"crise de la reproductibilité\" en science, mise en lumière dans plusieurs disciplines ces dernières années ?",
        options: [
          "Un problème purement technique lié à des équipements de laboratoire obsolètes",
          "Le constat qu'une proportion significative d'études publiées ne parviennent pas à être reproduites par d'autres équipes dans les mêmes conditions, questionnant la fiabilité de certains résultats publiés",
          "Un phénomène qui ne concerne que la physique théorique",
          "Un problème définitivement résolu par la revue par les pairs",
          "Un concept qui ne s'applique qu'aux études non publiées",
        ],
        correctIndex: 1,
        explanation:
          "La crise de la reproductibilité désigne le constat, documenté dans plusieurs disciplines (psychologie, biomédecine...), qu'une proportion significative d'études publiées ne sont pas reproduites avec succès -- un enjeu majeur de la méthodologie scientifique contemporaine.",
      },
      {
        question: "Pourquoi la distinction entre corrélation et causalité est-elle un piège méthodologique fréquent, même pour des chercheurs expérimentés ?",
        options: [
          "Il n'existe aucun piège réel, une corrélation forte implique toujours une causalité",
          "Deux variables peuvent être statistiquement liées sans qu'il existe de lien de cause à effet direct entre elles (facteur confondant, coïncidence) -- une confusion fréquente qui peut mener à des conclusions erronées",
          "La causalité est toujours plus facile à établir que la corrélation",
          "Cette distinction ne concerne que les sciences sociales",
          "Elle a été résolue définitivement par les méthodes statistiques modernes",
        ],
        correctIndex: 1,
        explanation:
          "Une corrélation statistique entre deux variables peut résulter d'un facteur confondant ou d'une coïncidence, sans lien de causalité réel -- une confusion classique qui peut mener à des conclusions scientifiquement erronées si elle n'est pas rigoureusement écartée.",
      },
      {
        question: "Qu'est-ce que l'éthique de la recherche impliquant des sujets humains (comités d'éthique, consentement éclairé) vise-t-elle à garantir ?",
        options: [
          "Une simple formalité administrative sans réel impact sur le déroulement de l'étude",
          "Que les participants soient informés des risques et bénéfices, consentent librement, et que leur bien-être soit protégé tout au long de la recherche, en encadrant les risques d'abus historiquement documentés",
          "L'éthique de la recherche ne concerne que les essais cliniques pharmaceutiques",
          "Elle n'a aucun lien avec la validité scientifique des résultats",
          "Elle est identique dans tous les pays du monde",
        ],
        correctIndex: 1,
        explanation:
          "L'encadrement éthique (comités d'éthique, consentement éclairé) protège les participants d'une recherche contre les risques d'abus, documentés historiquement dans plusieurs disciplines -- une exigence désormais incontournable, au-delà de la seule validité scientifique.",
      },
      {
        question: "Pourquoi le biais de publication (publication bias) déforme-t-il la vision d'ensemble d'un champ de recherche ?",
        options: [
          "Ce biais n'existe pas, toutes les études sont publiées de la même manière",
          "Les études aux résultats positifs ou spectaculaires sont plus souvent publiées que les études aux résultats négatifs ou nuls, donnant une image déformée et trop optimiste de l'état réel des connaissances",
          "Le biais de publication ne concerne que les revues de faible qualité",
          "Il a été éliminé grâce aux registres d'essais cliniques obligatoires",
          "Il ne concerne que les recherches financées par l'industrie privée",
        ],
        correctIndex: 1,
        explanation:
          "Les études aux résultats positifs ou spectaculaires sont historiquement plus souvent publiées que les résultats négatifs, créant une image déformée et trop optimiste de l'état réel des connaissances dans un domaine -- un biais que les registres d'essais et la publication de résultats négatifs cherchent à corriger.",
      },
      {
        question: "Qu'est-ce que la science ouverte (open science) et quels problèmes cherche-t-elle à résoudre ?",
        options: [
          "Un mouvement qui consiste uniquement à publier gratuitement des articles scientifiques",
          "Un mouvement plus large visant à rendre accessibles données, méthodes et résultats de recherche (pas seulement l'article final), pour améliorer la transparence, la reproductibilité et la réutilisation des travaux scientifiques",
          "Une pratique réservée aux chercheurs en début de carrière",
          "Un concept qui s'oppose à la revue par les pairs",
          "Un mouvement qui ne concerne que les sciences informatiques",
        ],
        correctIndex: 1,
        explanation:
          "La science ouverte vise à rendre accessibles non seulement l'article final, mais aussi les données et méthodes de recherche, pour améliorer la transparence, permettre la vérification et faciliter la réutilisation des travaux par d'autres chercheurs.",
      },
      {
        question: "Pourquoi le facteur d'impact d'une revue scientifique est-il un indicateur à interpréter avec prudence, malgré son usage répandu dans l'évaluation de la recherche ?",
        options: [
          "Le facteur d'impact mesure directement et parfaitement la qualité scientifique de chaque article publié",
          "C'est une moyenne de citations au niveau de la revue, pas de l'article individuel : un article précis peut être excellent dans une revue à faible facteur d'impact, ou médiocre dans une revue prestigieuse",
          "Cet indicateur n'a aucune utilité et devrait être totalement abandonné",
          "Il ne concerne que les revues de sciences humaines",
          "Un facteur d'impact élevé garantit l'absence totale d'erreurs dans la revue",
        ],
        correctIndex: 1,
        explanation:
          "Le facteur d'impact est une moyenne de citations calculée au niveau de la revue, pas de l'article individuel : il ne garantit ni la qualité ni la fiabilité d'un article précis, d'où les critiques sur son usage comme seul critère d'évaluation de la recherche.",
      },
    ],
  },

  diplomatie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans les affaires publiques / la diplomatie / l'international ?",
        options: [
          "J'aime comprendre les enjeux entre acteurs différents et construire des ponts entre eux",
          "Parce que ça a l'air un métier prestigieux sans plus de réflexion",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour la compréhension des enjeux entre acteurs différents et la construction de relations est au cœur du métier -- une motivation bien plus solide qu'une idée de prestige.",
      },
      {
        question: "Qu'est-ce qu'un accord bilatéral, en une phrase simple ?",
        options: [
          "Un accord signé par plus de dix pays en même temps",
          "Un accord conclu entre deux parties (souvent deux États)",
          "Un accord réservé aux organisations internationales uniquement",
          "Un simple échange d'informations sans engagement",
          "Un traité qui ne concerne que le commerce",
        ],
        correctIndex: 1,
        explanation:
          "Un accord bilatéral engage précisément deux parties, contrairement à un accord multilatéral qui implique plusieurs acteurs -- une distinction de base à connaître pour ce type de poste.",
      },
      {
        question: "Tu dois rédiger une note de synthèse sur un sujet complexe pour un décideur pressé. Que privilégies-tu ?",
        options: [
          "Un document exhaustif de plusieurs dizaines de pages sans hiérarchisation",
          "Une synthèse claire et hiérarchisée, avec les points essentiels et les enjeux mis en avant en priorité",
          "Un simple résumé copié-collé de plusieurs sources sans analyse",
          "Une note rédigée uniquement à l'oral, sans support écrit",
          "Un document qui évite volontairement de trancher entre les options possibles",
        ],
        correctIndex: 1,
        explanation:
          "Une synthèse claire et hiérarchisée, qui va à l'essentiel pour un décideur au temps limité, est une compétence rédactionnelle centrale dans ces métiers.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux avoir un avis tranché rapidement, donc j'apprends à toujours considérer plusieurs points de vue avant de conclure",
          "Je n'aime pas les enjeux internationaux",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la nuance nécessaire dans l'analyse des enjeux internationaux, avec une piste d'amélioration concrète, montre une bonne compréhension du métier.",
      },
      {
        question: "Pourquoi la discrétion est-elle une qualité particulièrement attendue dans ces métiers ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce que de nombreuses discussions et négociations impliquent des informations sensibles qui ne doivent pas être divulguées prématurément",
          "La discrétion ne concerne que les postes les plus élevés",
          "Ça n'a aucun lien avec la confiance entre partenaires",
          "Uniquement pour respecter le protocole",
        ],
        correctIndex: 1,
        explanation:
          "Les négociations et échanges diplomatiques impliquent souvent des informations sensibles : la discrétion protège la confiance entre les parties et la crédibilité de l'institution représentée.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu une négociation où les deux parties ont des intérêts fortement divergents ?",
        options: [
          "J'impose ma position sans chercher de terrain d'entente",
          "Je cherche à identifier les intérêts communs sous-jacents et propose des compromis progressifs, sans céder sur les points non négociables",
          "Je cède immédiatement sur tout pour éviter le conflit",
          "Je refuse toute négociation si un désaccord apparaît",
          "Je considère qu'un compromis n'est jamais possible dans ce genre de situation",
        ],
        correctIndex: 1,
        explanation:
          "Identifier les intérêts communs sous-jacents (au-delà des positions affichées) et proposer des compromis progressifs est une compétence centrale de la négociation diplomatique et internationale.",
      },
      {
        question: "Pourquoi la compréhension fine du contexte culturel et politique d'un pays partenaire est-elle essentielle avant toute négociation ?",
        options: [
          "Ce n'est pas vraiment utile si les objectifs sont clairs",
          "Parce qu'une mauvaise lecture du contexte peut mener à des maladresses diplomatiques ou à des malentendus qui compromettent la relation",
          "Le contexte culturel n'a aucun impact sur les négociations formelles",
          "Cette compréhension ne concerne que les très hauts diplomates",
          "Elle est identique quel que soit le pays concerné",
        ],
        correctIndex: 1,
        explanation:
          "Une mauvaise lecture du contexte culturel et politique local peut provoquer des maladresses ou malentendus qui compromettent durablement une relation -- une préparation en amont est indispensable.",
      },
      {
        question: "Comment réagis-tu si une prise de position officielle que tu dois défendre ne correspond pas à ton opinion personnelle ?",
        options: [
          "Je refuse de défendre une position que je désapprouve",
          "Je fais mon travail de représentation avec professionnalisme, en distinguant clairement mon rôle institutionnel de mes opinions personnelles",
          "J'exprime publiquement mon désaccord pendant la mission officielle",
          "Je sabote discrètement la position que je dois défendre",
          "Je considère que cette situation ne se présente jamais en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Distinguer clairement son rôle institutionnel de ses opinions personnelles, tout en faisant son travail de représentation avec professionnalisme, est une exigence fondamentale de ces métiers.",
      },
      {
        question: "Pourquoi la veille géopolitique continue est-elle une activité centrale, même en dehors des périodes de crise ?",
        options: [
          "Elle n'a d'utilité qu'en période de crise ouverte",
          "Parce qu'anticiper les évolutions politiques, économiques et sociales permet de mieux préparer les positions et réactions futures, plutôt que de subir les événements",
          "La veille géopolitique ne concerne que les très grandes puissances",
          "Elle est aujourd'hui totalement automatisée sans analyse humaine",
          "Elle n'a aucun impact sur la qualité des décisions prises",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper les évolutions politiques, économiques et sociales par une veille continue permet de préparer des positions réfléchies, plutôt que de réagir dans l'urgence face à des événements non anticipés.",
      },
      {
        question: "Comment construis-tu une argumentation convaincante pour défendre une position devant un public international aux sensibilités variées ?",
        options: [
          "En utilisant systématiquement le même discours quel que soit l'auditoire",
          "En adaptant la formulation et les exemples utilisés selon les sensibilités culturelles et politiques du public, sans changer le fond de la position défendue",
          "En évitant tout sujet potentiellement sensible pour ne froisser personne",
          "En imposant fermement sa position sans tenir compte de l'auditoire",
          "En considérant que l'adaptation au public n'a aucune importance réelle",
        ],
        correctIndex: 1,
        explanation:
          "Adapter la formulation et les exemples selon les sensibilités du public, sans dénaturer le fond de la position défendue, est une compétence rhétorique essentielle en contexte diplomatique international.",
      },
      {
        question: "Pourquoi la maîtrise du protocole (préséances, usages formels) reste-t-elle importante dans les relations institutionnelles internationales ?",
        options: [
          "Le protocole n'a plus aucune importance à l'ère moderne",
          "Parce qu'un manquement au protocole peut être perçu comme un manque de respect ou une maladresse diplomatique, même non intentionnelle",
          "Le protocole ne concerne que les cérémonies officielles les plus rares",
          "Il n'a aucun lien avec la qualité des relations entre institutions",
          "Il a été entièrement remplacé par des usages informels",
        ],
        correctIndex: 1,
        explanation:
          "Un manquement au protocole, même involontaire, peut être perçu comme un manque de respect dans certains contextes : sa maîtrise reste un signal de sérieux et de considération envers les interlocuteurs.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la différence entre soft power et hard power dans l'analyse des relations internationales ?",
        options: [
          "Ce sont deux termes équivalents pour désigner la puissance militaire",
          "Le hard power repose sur la coercition (militaire, économique), le soft power sur l'attractivité et l'influence culturelle, diplomatique ou idéologique, sans contrainte directe",
          "Le soft power ne concerne que les questions commerciales",
          "Le hard power a totalement disparu des relations internationales modernes",
          "Ces concepts ne s'appliquent qu'aux très grandes puissances",
        ],
        correctIndex: 1,
        explanation:
          "Le hard power repose sur la coercition (force militaire, sanctions économiques), le soft power sur la capacité d'un acteur à influencer par son attractivité culturelle, diplomatique ou idéologique -- une distinction centrale en analyse des relations internationales (Joseph Nye).",
      },
      {
        question: "Qu'est-ce que l'immunité diplomatique et quelles sont ses limites juridiques ?",
        options: [
          "Une protection absolue et sans aucune limite pour tout diplomate en poste",
          "Un régime protégeant les diplomates de poursuites judiciaires dans l'État accréditaire pour l'exercice de leurs fonctions, mais qui peut être levée par l'État d'origine en cas d'abus grave",
          "Un dispositif qui ne s'applique qu'aux ambassadeurs, jamais au personnel diplomatique",
          "Une immunité qui protège uniquement contre les infractions financières",
          "Un régime aboli par la Convention de Vienne de 1961",
        ],
        correctIndex: 1,
        explanation:
          "L'immunité diplomatique, encadrée par la Convention de Vienne de 1961, protège les diplomates de poursuites dans l'État accréditaire pour l'exercice de leurs fonctions, mais peut être levée par l'État d'origine en cas d'abus grave -- ce n'est pas une impunité absolue et permanente.",
      },
      {
        question: "Pourquoi la distinction entre organisation intergouvernementale et organisation non gouvernementale (ONG) est-elle importante pour comprendre les acteurs des relations internationales ?",
        options: [
          "Il n'existe aucune différence de statut ou de pouvoir entre les deux",
          "Une organisation intergouvernementale est créée par des États et dispose d'une légitimité et de pouvoirs différents (traités, décisions contraignantes parfois) qu'une ONG, généralement issue de la société civile sans pouvoir contraignant direct",
          "Les ONG ont systématiquement plus de pouvoir juridique que les organisations intergouvernementales",
          "Cette distinction ne concerne que le financement des deux types de structures",
          "Les organisations intergouvernementales n'existent qu'au niveau régional, jamais mondial",
        ],
        correctIndex: 1,
        explanation:
          "Une organisation intergouvernementale (ONU, UE...) est créée par des États et peut disposer de pouvoirs contraignants selon les traités fondateurs, tandis qu'une ONG, issue de la société civile, agit généralement par plaidoyer et influence, sans pouvoir contraignant direct.",
      },
      {
        question: "Qu'est-ce que le principe de non-ingérence en droit international, et quelles tensions contemporaines le remettent en question ?",
        options: [
          "Un principe qui n'a jamais posé de difficulté d'application",
          "Un principe selon lequel un État ne doit pas s'immiscer dans les affaires intérieures d'un autre, aujourd'hui mis en tension par des notions comme la responsabilité de protéger (R2P) en cas de crimes de masse",
          "Un principe qui autorise systématiquement l'intervention militaire humanitaire",
          "Un principe qui ne concerne que les relations économiques entre États",
          "Un principe qui a été formellement abrogé par les Nations Unies",
        ],
        correctIndex: 1,
        explanation:
          "Le principe de non-ingérence, pilier historique du droit international, est mis en tension par des doctrines plus récentes comme la responsabilité de protéger (R2P), qui envisage une intervention internationale en cas de crimes de masse -- un débat toujours vif en relations internationales.",
      },
      {
        question: "Pourquoi la diplomatie multilatérale (au sein d'organisations comme l'ONU) présente-t-elle des défis de coordination différents de la diplomatie bilatérale ?",
        options: [
          "Il n'existe aucune différence structurelle entre les deux formes de diplomatie",
          "Elle implique de construire des consensus ou des majorités entre de nombreux acteurs aux intérêts divergents, avec des mécanismes de vote et de blocage (droit de veto notamment) qui compliquent la prise de décision",
          "La diplomatie multilatérale est toujours plus rapide que la diplomatie bilatérale",
          "Elle ne concerne que les questions économiques et commerciales",
          "Le droit de veto ne s'applique à aucune organisation internationale actuelle",
        ],
        correctIndex: 1,
        explanation:
          "La diplomatie multilatérale exige de construire des consensus ou majorités entre de nombreux acteurs aux intérêts divergents, avec des mécanismes complexes (vote, droit de veto au Conseil de sécurité de l'ONU) qui peuvent ralentir ou bloquer la prise de décision, contrairement à une négociation bilatérale directe.",
      },
      {
        question: "Qu'est-ce que la diplomatie économique et comment s'articule-t-elle avec les intérêts commerciaux nationaux ?",
        options: [
          "Un concept qui ne concerne que les accords commerciaux internationaux formels",
          "L'ensemble des actions diplomatiques visant à soutenir les intérêts économiques et commerciaux d'un pays à l'étranger, en articulant relations politiques et objectifs économiques",
          "Une pratique interdite par le droit international",
          "Un domaine totalement séparé et sans lien avec la diplomatie politique classique",
          "Elle ne concerne que les très grandes entreprises multinationales",
        ],
        correctIndex: 1,
        explanation:
          "La diplomatie économique articule relations politiques et objectifs économiques (soutien aux entreprises nationales à l'export, négociations commerciales, attractivité des investissements) -- un pan de plus en plus central de l'action diplomatique contemporaine.",
      },
      {
        question: "Pourquoi la paradiplomatie (action internationale de collectivités locales, régions) complique-t-elle la lecture classique des relations internationales centrées sur les États ?",
        options: [
          "La paradiplomatie n'existe pas, seuls les États ont une action internationale",
          "Des collectivités locales ou régionales mènent aujourd'hui leurs propres actions de coopération ou de représentation à l'international, aux côtés de la diplomatie officielle de l'État central",
          "Elle remplace totalement la diplomatie d'État",
          "Elle ne concerne que les très grandes métropoles mondiales",
          "Elle est strictement interdite par le droit international",
        ],
        correctIndex: 1,
        explanation:
          "La paradiplomatie désigne l'action internationale de collectivités locales ou régionales (coopération décentralisée, représentation économique) qui se déploie aux côtés de la diplomatie officielle de l'État central, complexifiant la lecture classique des relations internationales centrée uniquement sur les États.",
      },
    ],
  },
};
