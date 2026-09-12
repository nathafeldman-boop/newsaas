// Deuxième vague de domaines supplémentaires pour la banque de questions
// d'entretien -- fusionnés dans questionBank.ts. Même format et même
// exigence de qualité que le noyau : contenu écrit à la main, aucune
// dépendance IA.

import type { InterviewDomain, Bank } from "./questionBank";

export const EXTRA_DOMAINS_2: InterviewDomain[] = [
  { id: "sante", label: "Santé / Social / Para-médical" },
  { id: "education", label: "Éducation / Formation / Animation" },
  { id: "restauration", label: "Restauration / Cuisine" },
  { id: "batiment", label: "Bâtiment / BTP / Construction" },
  { id: "agroalimentaire", label: "Agroalimentaire / Agriculture" },
  { id: "transport", label: "Transport / Automobile / Mécanique" },
  { id: "energie", label: "Énergie / Environnement" },
  { id: "mode", label: "Mode / Luxe / Beauté" },
  { id: "culture", label: "Culture / Audiovisuel / Médias" },
  { id: "sport", label: "Sport / Animation / Loisirs" },
];

export const EXTRA_BANK_2: Bank = {
  sante: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le secteur santé/social ?",
        options: [
          "Parce que j'ai envie d'aider des personnes concrètement, au quotidien",
          "Parce qu'il y a toujours du travail dans ce secteur",
          "Je n'ai pas vraiment de raison précise",
          "Parce qu'un proche me l'a conseillé sans plus",
          "Parce que je ne savais pas quoi faire d'autre",
        ],
        correctIndex: 0,
        explanation:
          "Le secteur santé/social demande une motivation humaine et durable : une réponse centrée sur l'utilité concrète auprès des personnes rassure bien plus qu'une réponse opportuniste.",
      },
      {
        question: "Un usager/patient te parle de façon agressive. Quelle est la meilleure première réaction ?",
        options: [
          "Répondre sur le même ton pour se faire respecter",
          "Rester calme, écouter ce qui motive cette réaction avant de répondre",
          "Ignorer complètement la personne",
          "Quitter immédiatement la pièce sans explication",
          "Le signaler à un collègue sans jamais lui parler",
        ],
        correctIndex: 1,
        explanation:
          "L'agressivité cache souvent une détresse, une douleur ou une incompréhension : garder son calme et chercher la cause évite d'aggraver la situation.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce type de métier ?",
        options: [
          "Je n'ai aucun défaut",
          "J'ai tendance à trop m'investir émotionnellement, donc j'apprends à poser des limites saines",
          "Je suis souvent en retard",
          "Je n'aime pas vraiment le contact humain",
          "Je ne sais pas, je n'y ai jamais réfléchi",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut crédible et lié à un vrai enjeu du métier (charge émotionnelle) montre une bonne conscience de soi, surtout accompagné d'une piste d'amélioration concrète.",
      },
      {
        question: "Pourquoi la ponctualité est-elle particulièrement importante dans ce secteur ?",
        options: [
          "Ce n'est pas plus important qu'ailleurs",
          "Parce que les plannings de soins/accompagnement impactent directement le bien-être des personnes prises en charge",
          "Uniquement pour éviter une sanction du responsable",
          "Parce que les patients ne remarquent jamais les retards",
          "Ça n'a aucun lien avec la qualité de la prise en charge",
        ],
        correctIndex: 1,
        explanation:
          "Un retard dans ce secteur peut retarder un soin, un repas ou une prise de médicament : la ponctualité est directement liée à la qualité de l'accompagnement.",
      },
      {
        question: "Qu'est-ce que la bientraitance ?",
        options: [
          "Faire plaisir à la personne en toutes circonstances, même contre son intérêt",
          "Une posture professionnelle qui respecte la dignité, les choix et le rythme de la personne accompagnée",
          "Un protocole administratif sans lien avec la relation humaine",
          "Un concept réservé aux enfants",
          "Le simple fait de ne pas maltraiter, sans démarche active",
        ],
        correctIndex: 1,
        explanation:
          "La bientraitance est une démarche active de respect de la personne (dignité, choix, rythme), pas seulement l'absence de maltraitance.",
      },
    ],
    medium: [
      {
        question: "Tu dois t'occuper de plusieurs résidents/patients en même temps avec un temps limité. Que fais-tu ?",
        options: [
          "Je fais tout à la fois, quitte à bâcler chaque tâche",
          "Je priorise selon l'urgence et la sécurité, en informant si un délai est nécessaire",
          "Je m'occupe uniquement de la première personne croisée",
          "Je demande à un résident d'attendre indéfiniment sans explication",
          "Je préviens que je ne pourrai rien faire aujourd'hui",
        ],
        correctIndex: 1,
        explanation:
          "La priorisation par urgence/sécurité, avec une communication transparente sur les délais, est la base de la gestion de charge dans le soin et l'accompagnement.",
      },
      {
        question: "Que signifie le secret professionnel dans ce secteur ?",
        options: [
          "Il n'existe pas dans le social/médico-social",
          "Ne jamais parler du travail, même entre collègues",
          "Ne pas divulguer d'informations sur une personne accompagnée à des tiers non autorisés, sauf cadre légal précis",
          "Ne rien noter dans le dossier de la personne",
          "Un engagement facultatif selon l'envie du professionnel",
        ],
        correctIndex: 2,
        explanation:
          "Le secret professionnel protège les informations personnelles des usagers ; il peut être partagé dans un cadre légal précis (équipe pluridisciplinaire, signalement) mais jamais divulgué librement.",
      },
      {
        question: "Comment gères-tu la charge émotionnelle d'un accompagnement difficile (fin de vie, situation de détresse) ?",
        options: [
          "Je coupe toute émotion pour ne jamais être affecté",
          "J'en parle en équipe, je prends du recul et j'utilise les temps d'analyse de pratique si disponibles",
          "Je rentre chez moi sans en parler à personne",
          "Je change immédiatement de métier",
          "Je considère que ça ne doit jamais m'affecter du tout",
        ],
        correctIndex: 1,
        explanation:
          "Le travail d'équipe, la parole et les dispositifs d'analyse de pratique sont les outils reconnus pour tenir la charge émotionnelle sans s'épuiser ni se couper de l'empathie.",
      },
      {
        question: "Une famille te pose des questions médicales précises sur un proche hors de ton rôle. Que fais-tu ?",
        options: [
          "Je réponds avec ce que je sais, même approximatif",
          "J'oriente vers le professionnel habilité (médecin, infirmier) plutôt que de répondre à sa place",
          "Je refuse de leur parler du tout",
          "Je leur donne mon avis personnel comme s'il faisait autorité",
          "Je change de sujet sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Rester dans son champ de compétence et orienter vers le bon interlocuteur évite les erreurs d'information et respecte le cadre professionnel.",
      },
      {
        question: "Pourquoi le travail en équipe pluridisciplinaire est-il central dans ce secteur ?",
        options: [
          "Ce n'est qu'une contrainte administrative",
          "Chaque métier apporte un regard complémentaire pour une prise en charge globale de la personne",
          "Uniquement pour se répartir les tâches ingrates",
          "Parce que la loi l'impose sans réel bénéfice",
          "Ça n'a pas d'impact sur la qualité de l'accompagnement",
        ],
        correctIndex: 1,
        explanation:
          "Médecin, infirmier, aide-soignant, éducateur, psychologue : chacun apporte une expertise différente, indispensable pour une vision complète de la situation d'une personne.",
      },
      {
        question: "Quelle est la différence entre bienveillance et paternalisme ?",
        options: [
          "Il n'y a aucune différence",
          "La bienveillance respecte les choix de la personne, le paternalisme décide à sa place \"pour son bien\"",
          "Le paternalisme est toujours préférable en cas d'urgence",
          "La bienveillance ne concerne que les enfants",
          "Le paternalisme est un synonyme plus formel de bienveillance",
        ],
        correctIndex: 1,
        explanation:
          "La bienveillance authentique laisse la personne actrice de ses choix, même imparfaits ; le paternalisme impose une décision au nom d'un bien supposé, ce qui nie son autonomie.",
      },
    ],
    difficile: [
      {
        question: "Que dit la loi sur le secret professionnel partagé entre professionnels d'une même équipe ?",
        options: [
          "Il est totalement interdit, même en équipe",
          "Les informations utiles à la prise en charge peuvent être partagées entre professionnels concernés, dans l'intérêt de la personne, sans devenir publiques",
          "Tout doit systématiquement être partagé avec la famille",
          "Seul le directeur d'établissement peut partager une information",
          "Le secret professionnel ne s'applique qu'aux médecins",
        ],
        correctIndex: 1,
        explanation:
          "Le secret professionnel partagé (encadré notamment par la loi du 2 janvier 2002 et le Code de l'action sociale) autorise la circulation d'informations utiles entre professionnels concernés, dans l'intérêt de la personne accompagnée, sans en faire une information publique.",
      },
      {
        question: "Tu suspectes une situation de maltraitance sur une personne vulnérable. Quelle est la bonne conduite ?",
        options: [
          "Ne rien dire pour ne pas causer de problèmes",
          "En parler d'abord uniquement à la personne concernée sans jamais remonter l'information",
          "Signaler la situation selon la procédure interne (hiérarchie, cellule de signalement) ou aux autorités compétentes si nécessaire",
          "Attendre d'avoir une preuve irréfutable avant d'agir",
          "Réagir uniquement si la personne le demande explicitement",
        ],
        correctIndex: 2,
        explanation:
          "Face à une suspicion de maltraitance sur personne vulnérable, le signalement (interne puis, si besoin, externe) est une obligation professionnelle, même sans preuve formelle -- le doute suffit à déclencher l'alerte.",
      },
      {
        question: "Qu'est-ce que le consentement éclairé d'un patient/usager ?",
        options: [
          "L'accord donné automatiquement dès l'admission dans l'établissement",
          "L'accord donné par la famille à la place du patient",
          "L'accord donné par la personne après avoir reçu une information claire, loyale et adaptée sur sa situation et les options possibles",
          "Un document signé une seule fois, valable pour toujours sans réactualisation",
          "Une formalité sans impact réel sur la prise en charge",
        ],
        correctIndex: 2,
        explanation:
          "Le consentement éclairé exige une information claire et compréhensible avant chaque décision importante : c'est un droit fondamental du patient/usager, pas une simple formalité administrative.",
      },
      {
        question: "Pourquoi le respect de la distance professionnelle est-il essentiel dans l'accompagnement ?",
        options: [
          "Elle empêche toute forme d'empathie, ce qui est souhaitable",
          "Elle protège à la fois le professionnel (risque de burn-out) et la personne accompagnée (dépendance affective, confusion des rôles)",
          "Elle n'a aucune utilité réelle",
          "Elle ne concerne que les stagiaires débutants",
          "Elle doit être totale, sans aucune proximité humaine",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne distance professionnelle protège les deux parties : elle prévient l'épuisement émotionnel du professionnel et évite une confusion des rôles préjudiciable à la personne accompagnée.",
      },
      {
        question: "En cas d'urgences multiples simultanées avec des moyens limités, quel principe guide la priorisation ?",
        options: [
          "Le premier arrivé est toujours traité en premier, sans exception",
          "On traite en priorité les situations qui engagent le pronostic vital ou la sécurité immédiate",
          "On traite en priorité la personne la plus âgée",
          "On tire au sort",
          "On attend l'arrivée du responsable avant d'agir",
        ],
        correctIndex: 1,
        explanation:
          "Le principe de priorisation (proche du tri/triage) consiste à traiter en premier les situations qui menacent le pronostic vital ou la sécurité immédiate, indépendamment de l'ordre d'arrivée.",
      },
      {
        question: "Pourquoi les gestes barrières et le protocole d'hygiène sont-ils particulièrement stricts dans ce secteur ?",
        options: [
          "Par excès de précaution sans réelle justification",
          "Parce que les publics accompagnés sont souvent plus vulnérables aux infections, avec un risque de transmission élevé en collectivité",
          "Uniquement pour respecter une norme esthétique",
          "Ça ne concerne que le personnel médical, pas les autres métiers",
          "C'est une contrainte purement administrative sans lien avec la santé",
        ],
        correctIndex: 1,
        explanation:
          "Les publics fragiles (personnes âgées, malades, jeunes enfants) sont plus vulnérables aux infections, et la vie en collectivité augmente le risque de transmission : d'où la rigueur des protocoles d'hygiène.",
      },
      {
        question: "Que garantit la charte des droits et libertés de la personne accueillie (loi du 2 janvier 2002) ?",
        options: [
          "Rien de concret, c'est un texte symbolique",
          "Des droits comme le respect de la dignité, le droit à l'information, à la participation et au consentement de la personne accompagnée",
          "Uniquement des obligations pour la personne accompagnée",
          "Elle ne s'applique qu'aux établissements privés",
          "Elle remplace le rôle du personnel soignant",
        ],
        correctIndex: 1,
        explanation:
          "Cette loi structurante du secteur social et médico-social garantit des droits concrets (dignité, information, participation, consentement) qui doivent guider toute pratique professionnelle.",
      },
    ],
  },

  education: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'éducation/formation ?",
        options: [
          "J'aime transmettre et voir progresser les personnes que j'accompagne",
          "Parce que les vacances scolaires m'intéressent avant tout",
          "Je n'ai pas de raison particulière",
          "Parce que c'est un métier facile",
          "Parce que je n'ai pas trouvé d'autre voie",
        ],
        correctIndex: 0,
        explanation:
          "La transmission et la progression des apprenants sont le cœur du métier : une motivation centrée là-dessus est bien plus solide qu'une motivation liée aux avantages annexes.",
      },
      {
        question: "Un enfant/apprenant ne comprend pas une consigne malgré plusieurs explications. Que fais-tu ?",
        options: [
          "Je passe à autre chose sans insister",
          "Je reformule autrement, avec un exemple concret ou un support différent",
          "Je le gronde pour ne pas avoir compris",
          "Je lui donne directement la réponse sans explication",
          "Je le compare à un autre élève qui a compris",
        ],
        correctIndex: 1,
        explanation:
          "Reformuler et varier les supports (exemple concret, image, manipulation) est une compétence pédagogique clé face à une incompréhension.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux manquer de patience face à la répétition, donc je travaille sur des techniques de gestion du temps et de la classe",
          "Je n'aime pas vraiment être avec des enfants/jeunes",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réel et courant du métier (la patience face à la répétition), accompagné d'une vraie démarche d'amélioration, montre du recul professionnel.",
      },
      {
        question: "Pourquoi la cohérence des règles est-elle importante avec un groupe d'enfants/jeunes ?",
        options: [
          "Ce n'est pas vraiment important",
          "Parce qu'elle donne un cadre rassurant et évite les injustices perçues, qui nourrissent les conflits",
          "Uniquement pour faciliter le travail de l'adulte",
          "Les règles doivent changer chaque jour pour rester intéressantes",
          "Ça n'a aucun effet sur le comportement du groupe",
        ],
        correctIndex: 1,
        explanation:
          "Un cadre cohérent et prévisible rassure les enfants/jeunes et limite les sentiments d'injustice, souvent à l'origine des tensions dans un groupe.",
      },
      {
        question: "Qu'est-ce que la différenciation pédagogique, en une phrase simple ?",
        options: [
          "Donner exactement le même exercice à tout le monde",
          "Adapter les méthodes ou supports selon les besoins et le niveau de chaque apprenant",
          "Séparer physiquement les bons et les mauvais élèves",
          "Un concept réservé à l'enseignement supérieur",
          "Noter différemment selon la popularité de l'élève",
        ],
        correctIndex: 1,
        explanation:
          "La différenciation pédagogique consiste à adapter la méthode (rythme, support, niveau de difficulté) pour que chaque apprenant progresse selon ses besoins, pas à traiter tout le monde de façon strictement identique.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu un groupe avec des niveaux très hétérogènes ?",
        options: [
          "Je m'adresse uniquement aux meilleurs élèves",
          "Je différencie les activités (niveaux d'exercices, groupes de besoin, tutorat entre pairs)",
          "Je fais l'impasse sur les élèves en difficulté",
          "Je ralentis systématiquement tout le groupe au rythme du plus lent",
          "Je considère que l'hétérogénéité n'est jamais gérable",
        ],
        correctIndex: 1,
        explanation:
          "Différencier (exercices à plusieurs niveaux, groupes de besoin, entraide entre pairs) permet de faire progresser un groupe hétérogène sans sacrifier ni les plus avancés ni ceux en difficulté.",
      },
      {
        question: "Un parent conteste ouvertement une décision pédagogique devant l'enfant. Comment réagis-tu ?",
        options: [
          "Je débats immédiatement et fermement devant l'enfant",
          "Je reste posé, propose d'en discuter calmement à un autre moment sans l'enfant, et j'explique ensuite ma démarche",
          "Je cède immédiatement à la demande du parent",
          "J'ignore complètement le parent",
          "Je critique le parent devant l'enfant",
        ],
        correctIndex: 1,
        explanation:
          "Déplacer la discussion hors de la présence de l'enfant protège sa relation avec l'adulte référent et permet un échange plus constructif avec le parent.",
      },
      {
        question: "Pourquoi varier les modalités pédagogiques (oral, écrit, manipulation, numérique) est-il utile ?",
        options: [
          "Ce n'est qu'un effet de mode sans intérêt réel",
          "Parce que les apprenants n'ont pas tous le même mode d'apprentissage privilégié, et la variété maintient l'engagement",
          "Uniquement pour occuper le temps de la séance",
          "Il vaut mieux garder toujours la même méthode pour ne pas perturber",
          "Ça ne concerne que les très jeunes enfants",
        ],
        correctIndex: 1,
        explanation:
          "Varier les modalités touche des profils d'apprentissage différents et maintient l'attention, en évitant la lassitude d'une méthode unique répétée en permanence.",
      },
      {
        question: "Comment évalues-tu si un objectif pédagogique a été atteint ?",
        options: [
          "En me fiant uniquement à mon impression générale",
          "En définissant un critère observable et mesurable avant la séance, puis en le vérifiant concrètement",
          "En demandant simplement à l'apprenant s'il a compris",
          "L'évaluation n'est pas vraiment nécessaire",
          "En comparant uniquement à la moyenne du groupe",
        ],
        correctIndex: 1,
        explanation:
          "Un objectif pédagogique doit être défini de façon observable en amont pour permettre une évaluation fiable, plutôt qu'une impression subjective ou une simple auto-déclaration.",
      },
      {
        question: "Un élève perturbe régulièrement le groupe. Quelle est l'approche la plus efficace à long terme ?",
        options: [
          "L'exclure systématiquement sans chercher la cause",
          "Comprendre la cause du comportement (ennui, difficulté, besoin d'attention) et adapter la réponse en conséquence",
          "L'ignorer complètement en espérant que ça passe",
          "Le punir uniformément comme les autres sans distinction",
          "En parler uniquement à la fin de l'année",
        ],
        correctIndex: 1,
        explanation:
          "Un comportement perturbateur a presque toujours une cause (ennui, difficulté non identifiée, besoin d'attention) : comprendre cette cause permet une réponse plus efficace qu'une sanction systématique.",
      },
      {
        question: "Pourquoi la préparation en amont d'une séance est-elle indispensable, même avec de l'expérience ?",
        options: [
          "Elle ne l'est pas si on est à l'aise à l'oral",
          "Parce qu'elle structure les objectifs, anticipe les difficultés possibles et sécurise le déroulé face aux imprévus",
          "Uniquement pour remplir une obligation administrative",
          "Elle n'a d'intérêt que pour les débutants",
          "Elle empêche toute adaptation en temps réel",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne préparation clarifie les objectifs et anticipe les points de blocage possibles, ce qui laisse justement plus de liberté pour s'adapter en temps réel si besoin.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la \"zone proximale de développement\" (Vygotski) appliquée en pédagogie ?",
        options: [
          "Le niveau que l'apprenant maîtrise déjà seul, sans aide",
          "L'écart entre ce que l'apprenant peut faire seul et ce qu'il peut faire avec l'aide d'un adulte ou d'un pair plus avancé",
          "Un synonyme de niveau scolaire officiel",
          "La zone géographique où se situe l'établissement",
          "Un concept sans application pratique en classe",
        ],
        correctIndex: 1,
        explanation:
          "La zone proximale de développement désigne l'écart entre ce que l'apprenant réussit seul et ce qu'il réussit avec un étayage (adulte, pair) : c'est là que l'apprentissage est le plus efficace.",
      },
      {
        question: "Un élève montre des signes répétés qui font suspecter une situation de danger (maltraitance, négligence). Quelle est la conduite adaptée ?",
        options: [
          "Ne rien faire tant qu'il n'y a pas de preuve formelle",
          "En parler directement et sans filtre à la famille pour vérifier",
          "Suivre la procédure de signalement interne (direction, service compétent) sans enquêter soi-même",
          "Ignorer la situation car ce n'est pas le rôle du professionnel",
          "En parler uniquement aux autres élèves pour avoir leur avis",
        ],
        correctIndex: 2,
        explanation:
          "Face à une suspicion de danger, le professionnel de l'éducation doit signaler via la procédure prévue (direction, cellule dédiée), sans mener sa propre enquête ni confronter directement la famille.",
      },
      {
        question: "Quelle est la différence entre évaluation formative et évaluation sommative ?",
        options: [
          "Il n'y a aucune différence, ce sont des synonymes",
          "La formative accompagne l'apprentissage en cours de route (feedback, ajustement), la sommative valide un niveau atteint à un moment donné",
          "La sommative est toujours orale, la formative toujours écrite",
          "La formative ne concerne que les évaluations notées",
          "La sommative sert uniquement à sanctionner l'élève",
        ],
        correctIndex: 1,
        explanation:
          "L'évaluation formative sert à ajuster l'enseignement en cours d'apprentissage (feedback régulier), tandis que la sommative certifie un acquis à un instant T (examen, contrôle final).",
      },
      {
        question: "Pourquoi l'étayage (scaffolding) doit-il être progressivement retiré au fil de l'apprentissage ?",
        options: [
          "Il ne doit jamais être retiré, sinon l'élève échoue",
          "Pour permettre à l'apprenant de gagner en autonomie et ne pas devenir dépendant de l'aide externe",
          "Parce que l'étayage n'a aucune utilité réelle",
          "Uniquement pour réduire la charge de travail de l'enseignant",
          "Le retrait de l'étayage n'a aucun lien avec l'autonomie",
        ],
        correctIndex: 1,
        explanation:
          "Le principe de l'étayage est de le retirer progressivement (fading) à mesure que l'apprenant maîtrise la tâche, pour construire une véritable autonomie et non une dépendance à l'aide.",
      },
      {
        question: "Comment analyser une erreur d'un apprenant de façon constructive ?",
        options: [
          "La signaler uniquement comme fausse, sans plus d'explication",
          "Chercher le raisonnement qui a mené à l'erreur pour cibler précisément la source de l'incompréhension",
          "Ignorer l'erreur si l'élève est globalement bon",
          "Comparer systématiquement à la performance des autres élèves",
          "Considérer que toute erreur est due à un manque de travail",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur révèle souvent un raisonnement cohérent mais incomplet ou mal orienté : l'analyser permet un feedback ciblé, bien plus utile qu'un simple constat d'échec.",
      },
      {
        question: "Qu'est-ce que le \"biais de l'expert\" en pédagogie et pourquoi est-il un piège ?",
        options: [
          "Il n'existe pas en réalité",
          "C'est la tendance d'un expert à sous-estimer les difficultés d'un débutant, car les notions lui paraissent évidentes",
          "C'est le fait qu'un expert enseigne toujours mieux qu'un débutant",
          "C'est un biais qui ne concerne que les élèves, jamais les enseignants",
          "C'est la préférence d'un enseignant pour les meilleurs élèves",
        ],
        correctIndex: 1,
        explanation:
          "Le biais de l'expert pousse à considérer une notion comme \"évidente\" une fois maîtrisée, ce qui conduit à sauter des étapes essentielles pour un débutant : un piège classique en pédagogie.",
      },
      {
        question: "Pourquoi la motivation intrinsèque est-elle généralement plus durable que la motivation extrinsèque chez un apprenant ?",
        options: [
          "Ce n'est pas vrai, les deux ont un effet strictement identique",
          "Parce qu'elle repose sur l'intérêt ou le sens donné à l'activité elle-même, indépendamment d'une récompense externe qui peut disparaître",
          "La motivation extrinsèque n'existe pas réellement",
          "Uniquement les très bons élèves ont une motivation intrinsèque",
          "La motivation intrinsèque ne concerne que les adultes",
        ],
        correctIndex: 1,
        explanation:
          "La motivation intrinsèque (intérêt, sens, plaisir d'apprendre) résiste mieux dans le temps que la motivation extrinsèque (note, récompense), qui s'effondre souvent dès que la récompense disparaît.",
      },
    ],
  },

  restauration: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en restauration/cuisine ?",
        options: [
          "J'aime le travail d'équipe sous pression et le résultat concret dans l'assiette",
          "Parce que je regarde beaucoup d'émissions de cuisine à la télé",
          "Je n'ai pas de raison particulière",
          "Parce que c'est facile de trouver du travail",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le goût du travail d'équipe sous rythme soutenu et du résultat concret est une motivation solide et réaliste pour ce métier exigeant.",
      },
      {
        question: "Que fais-tu si tu reçois une commande client que tu ne comprends pas bien ?",
        options: [
          "Je devine ce qu'il faut faire",
          "Je demande une confirmation claire avant de commencer, sans faire attendre trop longtemps",
          "J'improvise complètement autre chose",
          "J'ignore la commande",
          "Je fais comme la dernière fois, même si ce n'est pas pareil",
        ],
        correctIndex: 1,
        explanation:
          "Clarifier rapidement une commande ambiguë évite les erreurs coûteuses (temps, ingrédients, satisfaction client) -- mieux vaut une question rapide qu'une erreur en salle ou en cuisine.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être stressé sous forte pression, donc je m'organise en amont pour limiter l'impro de dernière minute",
          "Je n'aime pas travailler le week-end du tout",
          "Je suis souvent en retard",
          "Je n'aime pas vraiment cuisiner",
        ],
        correctIndex: 1,
        explanation:
          "Le stress sous pression est un défi réel et commun en restauration ; en parler avec une méthode concrète pour le gérer montre une bonne conscience du métier.",
      },
      {
        question: "Pourquoi l'hygiène est-elle une priorité absolue en cuisine ?",
        options: [
          "C'est surtout pour l'image du restaurant",
          "Parce qu'un manquement peut causer une intoxication alimentaire, avec un risque direct pour la santé des clients",
          "Ce n'est pas vraiment prioritaire si la cuisine est propre visuellement",
          "Uniquement en cas de contrôle sanitaire",
          "Ça ne concerne que les grands restaurants",
        ],
        correctIndex: 1,
        explanation:
          "Un manquement d'hygiène peut provoquer une intoxication alimentaire avec un vrai risque pour la santé : ce n'est jamais une question de simple image.",
      },
      {
        question: "Un plat part en salle avec une petite erreur de dressage. Que fais-tu ?",
        options: [
          "Je l'envoie quand même, ça ne se verra pas",
          "Je le corrige avant l'envoi si le temps le permet, ou je préviens immédiatement s'il est déjà parti",
          "Je fais comme si de rien n'était",
          "J'attends que le client se plaigne",
          "Je blâme un collègue pour l'erreur",
        ],
        correctIndex: 1,
        explanation:
          "La rigueur sur la présentation avant envoi -- ou une communication rapide en cas d'erreur déjà partie -- reflète le professionnalisme attendu en restauration.",
      },
    ],
    medium: [
      {
        question: "Pendant un coup de feu, deux commandes urgentes arrivent en même temps. Comment t'organises-tu ?",
        options: [
          "Je panique et j'arrête tout",
          "Je priorise selon les temps de cuisson et communique clairement avec l'équipe pour synchroniser l'envoi",
          "Je fais les deux commandes n'importe comment, vite fait",
          "Je laisse tomber une des deux commandes",
          "J'attends le calme avant de commencer",
        ],
        correctIndex: 1,
        explanation:
          "La gestion du \"coup de feu\" repose sur la priorisation des temps de cuisson et une communication fluide en équipe (brigade), pas sur la précipitation individuelle.",
      },
      {
        question: "Un client se plaint que son plat est arrivé froid. Que fais-tu en salle ?",
        options: [
          "Je discute pour prouver qu'il a tort",
          "Je m'excuse, je fais réchauffer ou refaire le plat rapidement, et je préviens la cuisine de la raison",
          "J'ignore la remarque",
          "Je le fais payer plein tarif sans rien proposer",
          "Je blâme la cuisine devant le client",
        ],
        correctIndex: 1,
        explanation:
          "Une réponse rapide, une excuse sincère et une solution concrète (replat, geste commercial) transforment un incident en opportunité de fidélisation, plutôt qu'en conflit.",
      },
      {
        question: "Pourquoi la traçabilité des produits (dates, provenance) est-elle une obligation en restauration ?",
        options: [
          "C'est une simple formalité sans utilité",
          "Pour garantir la sécurité alimentaire et pouvoir réagir vite en cas de problème (rappel produit, allergie)",
          "Uniquement pour la comptabilité",
          "Ça ne concerne que les produits frais",
          "Ça n'a aucun lien avec la sécurité des clients",
        ],
        correctIndex: 1,
        explanation:
          "La traçabilité permet de retrouver rapidement l'origine d'un produit en cas de problème sanitaire ou d'allergie, un enjeu de sécurité alimentaire majeur.",
      },
      {
        question: "Comment gères-tu la rotation des stocks (méthode PEPS/FIFO) ?",
        options: [
          "J'utilise toujours les produits les plus récemment arrivés en premier",
          "J'utilise en priorité les produits arrivés en premier (\"premier entré, premier sorti\") pour limiter le gaspillage et les périmés",
          "Je ne me préoccupe pas de l'ordre d'utilisation",
          "Je jette systématiquement les anciens stocks sans les utiliser",
          "La rotation des stocks ne concerne que la boisson",
        ],
        correctIndex: 1,
        explanation:
          "La méthode FIFO (\"premier entré, premier sorti\") limite le gaspillage et le risque de servir un produit périmé, un principe de base en cuisine professionnelle.",
      },
      {
        question: "Un collègue commet une erreur qui retarde tout le service. Quelle attitude adopter ?",
        options: [
          "Le rabaisser devant toute l'équipe",
          "L'aider à rattraper le retard maintenant, puis en reparler calmement après le service",
          "Ignorer complètement le problème",
          "Refuser de l'aider pour le \"punir\"",
          "Prévenir tous les clients de l'erreur du collègue",
        ],
        correctIndex: 1,
        explanation:
          "Pendant le service, la priorité est de rattraper collectivement le retard ; le débriefing constructif vient après, à froid, sans humilier personne devant l'équipe ou les clients.",
      },
      {
        question: "Pourquoi la mise en place avant le service est-elle si déterminante ?",
        options: [
          "Elle n'a pas vraiment d'impact sur le déroulé du service",
          "Elle anticipe les besoins du service pour éviter les ruptures et les pertes de temps une fois le coup de feu lancé",
          "Elle sert uniquement à l'inspection visuelle du chef",
          "Elle ne concerne que les grandes brigades",
          "C'est une étape facultative selon l'humeur du jour",
        ],
        correctIndex: 1,
        explanation:
          "Une bonne mise en place anticipe les besoins pour que le service se déroule fluide, sans rupture de stock ni improvisation coûteuse en temps sous pression.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la méthode HACCP en restauration et pourquoi est-elle obligatoire ?",
        options: [
          "Une norme esthétique de dressage des plats",
          "Une méthode d'analyse et de maîtrise des points critiques pour la sécurité sanitaire des aliments, obligatoire dans les établissements de restauration",
          "Un logiciel de gestion des stocks",
          "Une certification réservée aux restaurants étoilés",
          "Une méthode de calcul des marges",
        ],
        correctIndex: 1,
        explanation:
          "HACCP (Hazard Analysis Critical Control Point) identifie et maîtrise les points critiques de sécurité alimentaire (température, contamination croisée, etc.) ; c'est une obligation réglementaire, pas une option.",
      },
      {
        question: "Un client signale une allergie sévère à un allergène présent dans un plat déjà en préparation. Quelle est la bonne conduite ?",
        options: [
          "Retirer juste l'ingrédient visible de l'assiette avant de servir",
          "Refaire le plat depuis le début avec du matériel et des surfaces propres, en évitant toute contamination croisée",
          "Servir le plat en prévenant simplement le client de faire attention",
          "Ignorer la demande si le plat est déjà presque prêt",
          "Demander au client de vérifier lui-même chaque ingrédient",
        ],
        correctIndex: 1,
        explanation:
          "Une allergie sévère impose de refaire le plat avec du matériel et des surfaces non contaminées : retirer un ingrédient visible ne suffit pas, des traces invisibles peuvent provoquer une réaction grave.",
      },
      {
        question: "Pourquoi la chaîne du froid est-elle un point critique de sécurité alimentaire ?",
        options: [
          "Elle n'a d'impact que sur le goût, pas sur la sécurité",
          "Une rupture de la chaîne du froid favorise la prolifération bactérienne et augmente fortement le risque d'intoxication alimentaire",
          "Elle ne concerne que les produits surgelés",
          "C'est surtout une question de présentation",
          "Elle n'a aucun lien avec le développement bactérien",
        ],
        correctIndex: 1,
        explanation:
          "Une rupture de la chaîne du froid favorise la multiplication de bactéries pathogènes ; c'est l'un des points de contrôle critiques identifiés par la méthode HACCP.",
      },
      {
        question: "Comment calculer le \"food cost\" (coût matière) d'un plat, et pourquoi est-ce essentiel pour la rentabilité ?",
        options: [
          "En additionnant uniquement le prix de vente du plat",
          "En rapportant le coût des ingrédients utilisés au prix de vente du plat, pour vérifier la marge dégagée",
          "Le food cost n'a aucun impact sur la rentabilité d'un restaurant",
          "En comptant uniquement le coût de la main d'œuvre",
          "En se basant uniquement sur les prix pratiqués par la concurrence",
        ],
        correctIndex: 1,
        explanation:
          "Le food cost (coût matière / prix de vente) permet de vérifier que chaque plat dégage une marge suffisante ; un pilotage indispensable pour la rentabilité d'un restaurant.",
      },
      {
        question: "Pourquoi séparer les zones et le matériel entre produits crus et produits cuits/prêts à consommer ?",
        options: [
          "Ce n'est qu'une préférence d'organisation sans réel enjeu",
          "Pour éviter la contamination croisée, un risque majeur de transmission de bactéries pathogènes",
          "Uniquement pour gagner de la place en cuisine",
          "Cette séparation ne concerne que les cuisines japonaises",
          "Ça facilite seulement le nettoyage, sans lien avec la sécurité",
        ],
        correctIndex: 1,
        explanation:
          "La séparation des zones et du matériel (planches, couteaux) entre cru et cuit prévient la contamination croisée, une cause fréquente de toxi-infections alimentaires.",
      },
      {
        question: "Qu'est-ce que le \"mise en place inversée\" ou l'anticipation des rushs dans la gestion d'un service ?",
        options: [
          "Une technique qui consiste à ne rien préparer avant le service",
          "Anticiper les pics de charge prévisibles (horaires, réservations) pour préparer en amont les éléments les plus consommés",
          "Une méthode réservée à la restauration rapide uniquement",
          "Le fait de préparer les desserts en dernier systématiquement",
          "Un concept qui n'a aucune utilité pratique",
        ],
        correctIndex: 1,
        explanation:
          "Anticiper les pics de charge grâce aux réservations et à l'historique de fréquentation permet de préparer en amont les produits les plus demandés, fluidifiant le service au moment critique.",
      },
      {
        question: "Pourquoi la communication précise entre salle et cuisine (bons de commande, timing) est-elle un point critique de la qualité de service ?",
        options: [
          "Elle n'a pas vraiment d'impact tant que les plats sortent",
          "Une mauvaise synchronisation cause des plats froids, des attentes inégales à table, et une dégradation de l'expérience client",
          "Ça ne concerne que les grands restaurants gastronomiques",
          "Le timing entre salle et cuisine est secondaire face au goût des plats",
          "La communication salle-cuisine est purement informelle et sans procédure",
        ],
        correctIndex: 1,
        explanation:
          "Un mauvais timing entre salle et cuisine peut faire arriver les plats froids ou de façon désynchronisée à une même table, dégradant directement l'expérience client malgré une bonne cuisine.",
      },
    ],
  },

  batiment: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le BTP/bâtiment ?",
        options: [
          "J'aime voir un résultat concret se construire de mes mains",
          "Parce que ça paraît un métier facile",
          "Je n'ai pas vraiment de raison",
          "Parce qu'un ami m'en a parlé sans plus de détails",
          "Je n'avais pas d'autre choix",
        ],
        correctIndex: 0,
        explanation:
          "Le goût du concret et de la réalisation physique d'un ouvrage est une motivation authentique et bien identifiée dans ce secteur.",
      },
      {
        question: "Pourquoi le port des équipements de protection individuelle (EPI) est-il non négociable sur un chantier ?",
        options: [
          "C'est surtout pour le style",
          "Parce que le chantier est un environnement à risques réels (chutes, chocs, projections) et les EPI réduisent ces risques",
          "Uniquement en cas de contrôle de l'inspection du travail",
          "Ça dépend de l'humeur du chef de chantier",
          "Les EPI ne servent à rien en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Un chantier présente des risques réels et fréquents (chute, chute d'objet, coupure) : les EPI (casque, chaussures de sécurité, gants) réduisent concrètement ces risques.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux manquer un peu de patience sur les tâches répétitives, donc je m'organise pour garder ma concentration",
          "Je n'aime pas le travail physique",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à un vrai enjeu du métier (concentration sur des tâches répétitives), avec une piste d'amélioration, montre de la lucidité professionnelle.",
      },
      {
        question: "Que fais-tu si tu remarques une anomalie de sécurité sur le chantier (échafaudage instable, câble apparent) ?",
        options: [
          "Je continue mon travail sans rien dire",
          "Je signale immédiatement l'anomalie au chef de chantier avant de continuer",
          "Je répare moi-même sans en parler à personne",
          "J'attends qu'un accident arrive pour agir",
          "Je préviens uniquement mes collègues sans remonter l'info",
        ],
        correctIndex: 1,
        explanation:
          "Signaler immédiatement toute anomalie de sécurité à la hiérarchie est un réflexe essentiel : la prévention passe avant tout, avant même de continuer le travail.",
      },
      {
        question: "Pourquoi le respect des délais est-il crucial dans un projet de construction ?",
        options: [
          "Ce n'est pas si important si le résultat final est bon",
          "Parce que les corps de métier s'enchaînent : un retard sur une étape retarde souvent tout le chantier",
          "Uniquement pour la facturation",
          "Les délais n'ont aucun impact sur les autres équipes",
          "Le respect des délais ne concerne que les gros chantiers",
        ],
        correctIndex: 1,
        explanation:
          "Sur un chantier, les corps de métier interviennent souvent en séquence (gros œuvre, second œuvre, finitions) : un retard sur une étape se répercute en cascade sur toutes les suivantes.",
      },
    ],
    medium: [
      {
        question: "Tu remarques une erreur de mesure sur un plan que tu es en train de suivre. Que fais-tu ?",
        options: [
          "Je continue en ignorant l'erreur pour ne pas perdre de temps",
          "Je signale l'erreur au responsable/conducteur de travaux avant de poursuivre l'exécution",
          "Je corrige moi-même le plan sans en parler à personne",
          "Je laisse un collègue s'en apercevoir tout seul",
          "Je continue exactement selon le plan même si le résultat semble incohérent",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur d'exécution basée sur un plan erroné peut coûter cher (reprise, sécurité, délais) : signaler avant d'agir est le réflexe attendu, plutôt que de corriger seul ou d'ignorer.",
      },
      {
        question: "Comment organises-tu ta journée sur un chantier avec plusieurs tâches à réaliser ?",
        options: [
          "Je fais les tâches dans un ordre aléatoire",
          "Je priorise selon les contraintes techniques (séchage, dépendances entre tâches) et les consignes du chef d'équipe",
          "Je fais uniquement les tâches les plus simples en premier",
          "Je ne planifie jamais rien à l'avance",
          "Je fais toujours les mêmes tâches sans jamais varier",
        ],
        correctIndex: 1,
        explanation:
          "Certaines tâches dépendent techniquement d'autres (temps de séchage, ordre des corps de métier) : une bonne organisation respecte ces contraintes et les consignes de coordination du chantier.",
      },
      {
        question: "Pourquoi la coordination entre corps de métier (électricien, plombier, maçon) est-elle délicate ?",
        options: [
          "Elle ne l'est pas vraiment, chacun travaille indépendamment",
          "Parce que leurs interventions sont souvent imbriquées dans le temps et l'espace, et un décalage peut créer des conflits ou des reprises",
          "Uniquement sur les très petits chantiers",
          "La coordination ne concerne que le chef de chantier, jamais les ouvriers",
          "Ça n'a aucun impact sur la qualité finale",
        ],
        correctIndex: 1,
        explanation:
          "Les corps de métier interviennent souvent au même endroit à des moments proches (cloisons, réseaux) : un mauvais séquençage crée des conflits d'espace ou des reprises coûteuses.",
      },
      {
        question: "Un client/maître d'ouvrage demande une modification en cours de chantier non prévue au devis. Que fais-tu ?",
        options: [
          "Je réalise la modification immédiatement sans en informer personne",
          "Je remonte la demande au responsable pour évaluer l'impact (coût, délai) avant toute exécution",
          "Je refuse catégoriquement toute discussion",
          "Je fais comme si je n'avais rien entendu",
          "Je décide seul si c'est faisable ou non",
        ],
        correctIndex: 1,
        explanation:
          "Toute modification hors devis initial doit être validée en amont (impact coût/délai, avenant) avant exécution, pour éviter les litiges et les dépassements non maîtrisés.",
      },
      {
        question: "Pourquoi la lecture précise des plans et des cotes est-elle une compétence clé ?",
        options: [
          "Elle n'a pas vraiment d'importance si on a de l'expérience",
          "Une mauvaise lecture peut entraîner des erreurs de pose ou de dimension coûteuses à corriger",
          "Les plans ne sont utiles qu'au bureau d'études",
          "Ça ne concerne que les architectes",
          "Les cotes sont toujours approximatives en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Une erreur de lecture de plan (cote, échelle, orientation) peut entraîner des reprises coûteuses en temps et en matériaux : la précision est une compétence centrale du métier.",
      },
      {
        question: "Comment réagis-tu face à une consigne de sécurité qui ralentit visiblement le rythme de travail ?",
        options: [
          "Je la contourne pour aller plus vite",
          "Je l'applique quand même : la sécurité prime toujours sur la rapidité d'exécution",
          "Je l'applique seulement si un supérieur me regarde",
          "Je demande à mes collègues de ne pas l'appliquer non plus",
          "Je considère que les règles de sécurité sont souvent exagérées",
        ],
        correctIndex: 1,
        explanation:
          "Sur un chantier, aucune contrainte de rythme ne justifie de contourner une règle de sécurité : les accidents du BTP restent parmi les plus fréquents et les plus graves en France.",
      },
    ],
    difficile: [
      {
        question: "Que désigne le \"gros œuvre\" par opposition au \"second œuvre\" dans un projet de construction ?",
        options: [
          "Le gros œuvre concerne uniquement la décoration finale",
          "Le gros œuvre regroupe les éléments structurels (fondations, murs porteurs, charpente), le second œuvre les finitions et équipements (électricité, plomberie, revêtements)",
          "Il n'y a aucune différence entre les deux termes",
          "Le second œuvre désigne toujours les travaux les plus chers",
          "Le gros œuvre concerne uniquement les chantiers publics",
        ],
        correctIndex: 1,
        explanation:
          "Le gros œuvre assure la solidité et la structure du bâtiment (fondations, murs porteurs, charpente) ; le second œuvre regroupe les travaux de finition et d'équipement réalisés une fois la structure achevée.",
      },
      {
        question: "Pourquoi le respect des Documents Techniques Unifiés (DTU) est-il essentiel dans l'exécution d'un ouvrage ?",
        options: [
          "Les DTU sont de simples recommandations sans valeur contractuelle",
          "Les DTU fixent les règles de l'art à respecter techniquement ; s'en écarter engage la responsabilité de l'entreprise en cas de désordre",
          "Ils ne concernent que les architectes, jamais les ouvriers",
          "Les DTU ne s'appliquent qu'aux bâtiments historiques",
          "Ils sont facultatifs si le client ne les demande pas explicitement",
        ],
        correctIndex: 1,
        explanation:
          "Les DTU codifient les règles de l'art par corps de métier ; ne pas les respecter expose l'entreprise à une mise en cause de sa responsabilité en cas de sinistre ou de malfaçon.",
      },
      {
        question: "Qu'est-ce que la garantie décennale et pourquoi structure-t-elle la responsabilité dans le BTP ?",
        options: [
          "Une assurance facultative sans réel enjeu",
          "Une obligation légale qui engage la responsabilité du constructeur pendant 10 ans pour les désordres compromettant la solidité ou la destination de l'ouvrage",
          "Une garantie qui ne couvre que l'esthétique des finitions",
          "Elle ne s'applique qu'aux bâtiments publics",
          "Elle dure seulement un an après la réception des travaux",
        ],
        correctIndex: 1,
        explanation:
          "La garantie décennale, obligatoire, engage la responsabilité du constructeur pendant 10 ans pour tout désordre compromettant la solidité de l'ouvrage ou le rendant impropre à sa destination.",
      },
      {
        question: "Pourquoi le \"plan de prévention\" est-il obligatoire en cas d'intervention d'entreprises extérieures sur un même site ?",
        options: [
          "C'est une simple formalité administrative sans utilité",
          "Il identifie les risques liés à la coactivité de plusieurs entreprises sur un même chantier et définit les mesures de prévention communes",
          "Il ne concerne que les chantiers de plus de 10 ans",
          "Il remplace totalement le port des EPI",
          "Il n'est utile qu'en cas d'accident déjà survenu",
        ],
        correctIndex: 1,
        explanation:
          "Le plan de prévention anticipe les risques liés à la coactivité (plusieurs entreprises sur un même site) qui peuvent s'additionner ou se combiner de façon dangereuse s'ils ne sont pas coordonnés.",
      },
      {
        question: "Quelle différence essentielle sépare un maître d'ouvrage d'un maître d'œuvre ?",
        options: [
          "Ce sont deux termes strictement synonymes",
          "Le maître d'ouvrage est le commanditaire du projet, le maître d'œuvre est le professionnel qui conçoit et coordonne sa réalisation technique",
          "Le maître d'œuvre finance toujours le projet",
          "Le maître d'ouvrage est toujours l'architecte",
          "Cette distinction ne s'applique qu'aux projets publics",
        ],
        correctIndex: 1,
        explanation:
          "Le maître d'ouvrage commandite et finance le projet (souvent le client), le maître d'œuvre (architecte, bureau d'études) conçoit et coordonne sa réalisation technique.",
      },
      {
        question: "Pourquoi le calcul des charges et descentes de charges est-il déterminant dans la conception structurelle ?",
        options: [
          "Il n'a d'importance que sur l'aspect esthétique",
          "Il garantit que chaque élément porteur peut supporter les charges qui lui sont transmises, sous peine de risque d'effondrement",
          "Il ne sert qu'à établir un devis",
          "Le calcul des charges ne concerne que les toitures",
          "C'est une étape facultative sur les petits ouvrages",
        ],
        correctIndex: 1,
        explanation:
          "Une descente de charges mal calculée peut sous-dimensionner un élément porteur, avec un risque réel de désordre structurel voire d'effondrement : c'est un calcul de sécurité fondamental.",
      },
      {
        question: "Qu'est-ce qu'une réception de travaux avec réserves, et pourquoi ce moment est-il juridiquement important ?",
        options: [
          "Un simple rendez-vous informel sans conséquence",
          "L'acte par lequel le maître d'ouvrage accepte l'ouvrage tout en signalant des défauts à corriger, ce qui déclenche le point de départ des garanties légales",
          "Un document qui n'engage que l'entreprise, jamais le client",
          "Une étape facultative si le client est satisfait à l'oral",
          "Un acte qui annule automatiquement toute garantie",
        ],
        correctIndex: 1,
        explanation:
          "La réception (avec ou sans réserves) est un acte juridique clé : elle marque le transfert de responsabilité et déclenche le point de départ des garanties légales (parfait achèvement, décennale).",
      },
    ],
  },

  agroalimentaire: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage en agroalimentaire/agriculture ?",
        options: [
          "J'aime le lien entre la production concrète et l'alimentation des gens",
          "Parce que je pense que c'est un secteur sans contraintes",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Le lien entre production et alimentation, avec un impact concret et quotidien, est une motivation solide et cohérente pour ce secteur.",
      },
      {
        question: "Pourquoi le respect des règles d'hygiène est-il central dans l'agroalimentaire ?",
        options: [
          "C'est surtout une question d'image de marque",
          "Parce qu'un manquement peut contaminer un produit destiné à la consommation humaine, avec un risque sanitaire direct",
          "Ce n'est important que pour les grandes usines",
          "Uniquement en cas de contrôle",
          "Ça ne concerne que les produits frais",
        ],
        correctIndex: 1,
        explanation:
          "Dans l'agroalimentaire, une faille d'hygiène peut contaminer un produit consommé par des milliers de personnes : c'est un enjeu de santé publique, pas seulement d'image.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux manquer de patience sur des tâches répétitives, donc je travaille ma concentration sur la durée",
          "Je n'aime pas le travail en horaires décalés",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié aux contraintes du métier (répétitivité, rigueur), accompagné d'une démarche d'amélioration, montre une bonne connaissance du secteur.",
      },
      {
        question: "Pourquoi la saisonnalité est-elle une donnée importante en agriculture ?",
        options: [
          "Elle n'a pas vraiment d'impact sur l'organisation du travail",
          "Parce que les cycles de culture/récolte imposent des périodes de forte activité qu'il faut anticiper",
          "Uniquement pour fixer les prix de vente",
          "La saisonnalité ne concerne que les fruits exotiques",
          "Elle a disparu grâce aux techniques modernes",
        ],
        correctIndex: 1,
        explanation:
          "Les cycles naturels de culture et de récolte imposent des pics d'activité (semis, récolte) qu'il faut anticiper en organisation et en main d'œuvre.",
      },
      {
        question: "Que fais-tu si tu remarques un produit qui ne respecte visiblement pas les normes de qualité sur la chaîne ?",
        options: [
          "Je le laisse passer pour ne pas ralentir la production",
          "Je le signale immédiatement selon la procédure de contrôle qualité",
          "Je le corrige moi-même sans en parler à personne",
          "Je l'ignore si personne ne regarde",
          "Je le mets de côté sans prévenir personne",
        ],
        correctIndex: 1,
        explanation:
          "Signaler immédiatement un écart de qualité selon la procédure prévue permet de traiter le problème à la source, avant qu'il n'affecte un lot entier ou un consommateur.",
      },
    ],
    medium: [
      {
        question: "Pourquoi la traçabilité \"de la fourche à la fourchette\" est-elle un principe fondamental du secteur ?",
        options: [
          "C'est un principe purement marketing",
          "Elle permet de suivre un produit à chaque étape (production, transformation, distribution) pour réagir vite en cas de problème sanitaire",
          "Elle ne concerne que les produits bio",
          "Elle sert uniquement à fixer les prix",
          "Elle n'a aucun intérêt pour le consommateur final",
        ],
        correctIndex: 1,
        explanation:
          "La traçabilité complète permet d'identifier rapidement l'origine d'un problème sanitaire (contamination, rappel produit) et de limiter son impact en isolant les lots concernés.",
      },
      {
        question: "Comment gères-tu un contrôle qualité qui détecte un lot non conforme juste avant l'expédition ?",
        options: [
          "Je laisse partir le lot pour respecter le délai client",
          "Je bloque le lot et applique la procédure de non-conformité (isolement, analyse, décision hiérarchique)",
          "Je mélange le lot non conforme avec un lot conforme",
          "Je décide seul de la conformité sans suivre de procédure",
          "J'attends une réclamation client avant d'agir",
        ],
        correctIndex: 1,
        explanation:
          "Un lot non conforme doit être bloqué et traité selon la procédure établie (isolement, analyse) avant toute expédition : le respect du délai ne justifie jamais de prendre un risque sanitaire.",
      },
      {
        question: "Pourquoi les conditions de stockage (température, hygrométrie) sont-elles surveillées en continu ?",
        options: [
          "Par précaution excessive sans réel enjeu",
          "Parce qu'une variation peut accélérer le développement bactérien ou dégrader la qualité du produit stocké",
          "Uniquement pour respecter une norme esthétique",
          "Ça ne concerne que les produits laitiers",
          "La surveillance continue n'a aucun intérêt pratique",
        ],
        correctIndex: 1,
        explanation:
          "Une variation de température ou d'hygrométrie peut favoriser le développement bactérien ou altérer la qualité du produit : la surveillance continue est un point de contrôle essentiel.",
      },
      {
        question: "Comment expliquer un écart de rendement à un responsable sans donner l'impression de te justifier vaguement ?",
        options: [
          "En restant volontairement flou pour ne pas être blâmé",
          "En identifiant précisément la cause (météo, panne, qualité intrant) avec des données concrètes à l'appui",
          "En blâmant systématiquement un collègue",
          "En évitant complètement le sujet",
          "En donnant une excuse générique sans vérification",
        ],
        correctIndex: 1,
        explanation:
          "Une explication crédible s'appuie sur des données concrètes et une cause identifiée précisément, plutôt que sur une justification vague ou un report de responsabilité.",
      },
      {
        question: "Pourquoi la rotation des cultures est-elle une pratique agricole recommandée ?",
        options: [
          "Elle n'a aucun effet réel sur les sols",
          "Elle limite l'épuisement des sols et réduit la pression des maladies/ravageurs spécifiques à une culture répétée",
          "Elle sert uniquement à varier le paysage",
          "Elle est imposée uniquement pour des raisons esthétiques",
          "Elle concerne uniquement l'agriculture biologique",
        ],
        correctIndex: 1,
        explanation:
          "Alterner les cultures limite l'épuisement des sols en nutriments spécifiques et réduit la pression de maladies ou parasites qui s'installent avec une culture répétée à l'identique.",
      },
      {
        question: "Un client final se plaint d'un produit périmé trouvé en rayon. Comment analyser la cause probable ?",
        options: [
          "C'est toujours la faute du magasin, sans autre vérification",
          "Vérifier la chaîne (production, stockage, logistique, gestion des DLC en rayon) pour identifier où la rupture a pu se produire",
          "Ignorer la réclamation si le produit vient d'une autre usine",
          "Accuser directement le client sans vérification",
          "Considérer que ce type d'incident est inévitable",
        ],
        correctIndex: 1,
        explanation:
          "Un produit périmé en rayon peut venir de plusieurs maillons (erreur de date en production, mauvaise gestion de stock en magasin) : une analyse méthodique de la chaîne identifie la vraie cause.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que la méthode HACCP appliquée à une usine de transformation agroalimentaire, au-delà de la restauration ?",
        options: [
          "Un système de gestion des ressources humaines",
          "Une méthode systématique d'identification, d'évaluation et de maîtrise des dangers significatifs pour la sécurité des aliments à chaque étape du process industriel",
          "Une norme uniquement esthétique d'emballage",
          "Un logiciel de comptabilité des stocks",
          "Une certification facultative sans obligation légale",
        ],
        correctIndex: 1,
        explanation:
          "HACCP identifie les points critiques de maîtrise (CCP) tout au long du process industriel -- réception matière première, transformation, conditionnement -- pour prévenir les dangers biologiques, chimiques et physiques.",
      },
      {
        question: "Pourquoi la gestion des allergènes impose-t-elle un étiquetage et un nettoyage de ligne stricts ?",
        options: [
          "L'étiquetage des allergènes est facultatif en Europe",
          "Une trace d'allergène non maîtrisée (contamination croisée sur une ligne partagée) peut provoquer une réaction grave, parfois mortelle, chez un consommateur sensible",
          "Le nettoyage de ligne ne concerne que l'aspect visuel du produit",
          "Les allergènes ne posent problème qu'en très grande quantité",
          "Cette réglementation ne s'applique qu'aux produits importés",
        ],
        correctIndex: 1,
        explanation:
          "Une contamination croisée par allergène (ligne partagée mal nettoyée) peut déclencher une réaction allergique grave voire mortelle, d'où l'obligation d'étiquetage précis (règlement INCO) et de procédures de nettoyage strictes.",
      },
      {
        question: "Que désigne la Date Limite de Consommation (DLC) par opposition à la Date de Durabilité Minimale (DDM) ?",
        options: [
          "Ce sont deux termes strictement équivalents",
          "La DLC concerne les denrées périssables avec un risque sanitaire au-delà (\"à consommer jusqu'au\"), la DDM concerne une perte de qualité sans danger sanitaire (\"à consommer de préférence avant\")",
          "La DDM est toujours plus stricte que la DLC",
          "La DLC ne s'applique qu'aux produits surgelés",
          "La DDM concerne uniquement les produits importés",
        ],
        correctIndex: 1,
        explanation:
          "Dépasser une DLC présente un risque sanitaire réel (le produit ne doit plus être consommé) ; dépasser une DDM signifie une possible perte de qualité (goût, texture) sans danger sanitaire avéré.",
      },
      {
        question: "Pourquoi les analyses microbiologiques par échantillonnage ne garantissent-elles jamais un risque zéro absolu ?",
        options: [
          "Parce que les laboratoires font systématiquement des erreurs",
          "Parce qu'un échantillonnage ne teste qu'une fraction du lot ; la fiabilité repose donc sur la maîtrise du process en amont (HACCP) plus que sur le seul contrôle final",
          "Parce que les analyses microbiologiques sont interdites en France",
          "Parce que le risque zéro est atteint dès la première analyse",
          "Parce que l'échantillonnage ne concerne que les produits d'origine animale",
        ],
        correctIndex: 1,
        explanation:
          "Un contrôle par échantillonnage ne peut tester qu'une fraction représentative d'un lot : la vraie garantie de sécurité vient de la maîtrise des points critiques tout au long du process (approche préventive HACCP), pas du seul contrôle final.",
      },
      {
        question: "Quel est l'enjeu du \"bien-être animal\" dans les nouvelles normes agroalimentaires, au-delà de l'aspect éthique ?",
        options: [
          "Il n'a aucun impact sur la qualité du produit final",
          "Un animal stressé ou mal traité peut présenter une altération de la qualité de sa viande/lait et un risque sanitaire accru, en plus de l'enjeu réglementaire et d'image",
          "C'est une préoccupation purement marketing sans base scientifique",
          "Le bien-être animal ne concerne que les labels bio",
          "Cet enjeu ne concerne que les consommateurs, jamais les producteurs",
        ],
        correctIndex: 1,
        explanation:
          "Au-delà de l'enjeu éthique et réglementaire, le stress animal est documenté comme un facteur pouvant altérer la qualité du produit (viande, lait) et fragiliser son état sanitaire.",
      },
      {
        question: "Pourquoi l'agriculture de précision (capteurs, données) transforme-t-elle la gestion des intrants (eau, engrais) ?",
        options: [
          "Elle n'a aucun effet réel sur les pratiques agricoles",
          "Elle permet d'ajuster précisément les apports (eau, engrais, produits phytosanitaires) parcelle par parcelle selon les besoins réels, plutôt qu'un traitement uniforme",
          "Elle ne concerne que les très grandes exploitations",
          "Elle remplace totalement le rôle de l'agriculteur",
          "Elle sert uniquement à des fins de communication marketing",
        ],
        correctIndex: 1,
        explanation:
          "Les capteurs et données (météo, humidité du sol, imagerie) permettent d'ajuster les apports au plus près du besoin réel de chaque parcelle, réduisant le gaspillage et l'impact environnemental par rapport à un traitement uniforme.",
      },
      {
        question: "Pourquoi la certification (bio, IGP, label rouge) engage-t-elle un cahier des charges contraignant tout au long de la chaîne ?",
        options: [
          "Le cahier des charges ne concerne que l'étiquette finale",
          "Parce que la certification garantit au consommateur le respect de critères précis à chaque étape (production, transformation), vérifiés par des organismes indépendants",
          "Les certifications n'ont aucune valeur contraignante réelle",
          "Elles ne s'appliquent qu'aux produits vendus à l'export",
          "Le cahier des charges peut être modifié librement par le producteur",
        ],
        correctIndex: 1,
        explanation:
          "Une certification engage un cahier des charges précis vérifié par un organisme indépendant à chaque étape de la chaîne : c'est cette vérification externe qui donne sa crédibilité au label auprès du consommateur.",
      },
    ],
  },

  transport: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le transport/automobile ?",
        options: [
          "J'aime comprendre comment les choses mécaniques fonctionnent et les réparer",
          "Parce que je trouve ça un métier facile",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La curiosité mécanique et le goût de comprendre/réparer un système concret est une motivation authentique et bien identifiée dans ce secteur.",
      },
      {
        question: "Pourquoi le respect des procédures de sécurité est-il essentiel en atelier mécanique ?",
        options: [
          "C'est surtout pour respecter une norme esthétique",
          "Parce qu'un atelier présente des risques réels (levage, outils, produits chimiques) qu'une procédure mal suivie peut aggraver",
          "Uniquement en cas de contrôle",
          "Ça dépend de l'expérience du technicien",
          "Les procédures de sécurité ne servent à rien en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Un atelier comporte des risques réels (véhicule sur pont élévateur, outils, produits chimiques) : les procédures de sécurité existent pour prévenir des accidents graves et fréquents dans ce métier.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite sur un diagnostic, donc j'apprends à être méthodique avant de conclure",
          "Je n'aime pas travailler avec mes mains",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste lié à la rigueur du diagnostic, avec une piste d'amélioration concrète, montre une bonne compréhension des exigences du métier.",
      },
      {
        question: "Un client explique un problème sur son véhicule de façon confuse. Que fais-tu ?",
        options: [
          "Je devine le problème sans poser de questions",
          "Je pose des questions précises pour reformuler clairement le symptôme avant d'intervenir",
          "Je lui dis que je ne comprends rien",
          "Je change une pièce au hasard en espérant que ça résout le problème",
          "J'ignore sa description et je fais un diagnostic complet systématique sans l'écouter",
        ],
        correctIndex: 1,
        explanation:
          "Clarifier précisément le symptôme décrit par le client, même de façon maladroite, oriente un diagnostic efficace et évite les interventions inutiles.",
      },
      {
        question: "Pourquoi la rigueur documentaire (fiche d'intervention, historique du véhicule) est-elle importante ?",
        options: [
          "Ce n'est qu'une formalité sans utilité pratique",
          "Elle assure la traçabilité des interventions, utile pour un diagnostic futur ou une question de garantie",
          "Uniquement pour la facturation",
          "Ça ne concerne que les véhicules neufs",
          "La documentation n'a aucun lien avec la qualité du service",
        ],
        correctIndex: 1,
        explanation:
          "Un historique précis des interventions facilite un futur diagnostic (éviter de refaire un test déjà fait) et protège en cas de litige sur une garantie.",
      },
    ],
    medium: [
      {
        question: "Un client refuse une réparation recommandée pour des raisons de sécurité (ex. freins usés). Que fais-tu ?",
        options: [
          "Je le laisse repartir sans rien dire de plus",
          "Je l'informe clairement et par écrit des risques, tout en respectant sa décision finale",
          "Je force la réparation sans son accord",
          "Je refuse de lui rendre son véhicule",
          "Je ne mentionne le risque qu'à l'oral, vaguement",
        ],
        correctIndex: 1,
        explanation:
          "Informer clairement et par écrit protège à la fois le client (conscience du risque réel) et le professionnel (traçabilité de l'information donnée), tout en respectant la liberté de décision du client.",
      },
      {
        question: "Comment procèdes-tu face à une panne intermittente, difficile à reproduire en atelier ?",
        options: [
          "Je change des pièces au hasard jusqu'à ce que ça marche",
          "Je recueille un maximum d'informations précises (conditions d'apparition) et utilise les outils de diagnostic disponibles avant d'intervenir",
          "Je dis au client que le problème n'existe pas",
          "J'abandonne le diagnostic immédiatement",
          "Je conclus directement sans vérification",
        ],
        correctIndex: 1,
        explanation:
          "Une panne intermittente nécessite une collecte précise des conditions d'apparition et l'usage des outils de diagnostic (valise, historique de codes défaut) plutôt qu'un remplacement de pièces au hasard, coûteux et peu fiable.",
      },
      {
        question: "Pourquoi respecter scrupuleusement le couple de serrage préconisé par le constructeur ?",
        options: [
          "Ce n'est qu'une indication approximative sans réelle importance",
          "Un serrage insuffisant ou excessif peut endommager la pièce ou compromettre la sécurité (ex. roue mal serrée)",
          "Le couple de serrage ne concerne que les pièces esthétiques",
          "Il suffit de serrer le plus fort possible par sécurité",
          "Cette préconisation ne s'applique qu'aux véhicules de compétition",
        ],
        correctIndex: 1,
        explanation:
          "Un couple de serrage mal respecté peut endommager un filetage ou, pire, compromettre la sécurité (ex. une roue insuffisamment serrée) : la précision technique prime sur l'approximation.",
      },
      {
        question: "Comment gères-tu un désaccord technique avec un collègue plus expérimenté sur un diagnostic ?",
        options: [
          "J'impose systématiquement mon point de vue",
          "J'expose mon raisonnement et les éléments qui le soutiennent, tout en restant ouvert à son expertise",
          "Je cède immédiatement sans exposer mon raisonnement",
          "Je fais l'intervention à sa place en cachette",
          "J'évite complètement le sujet",
        ],
        correctIndex: 1,
        explanation:
          "Exposer son raisonnement de façon argumentée, tout en restant ouvert à l'expérience du collègue, permet un vrai échange technique constructif plutôt qu'un simple rapport de force.",
      },
      {
        question: "Pourquoi le contrôle technique périodique des véhicules est-il obligatoire ?",
        options: [
          "Uniquement pour générer des revenus aux centres de contrôle",
          "Pour vérifier que le véhicule respecte des normes de sécurité et environnementales minimales avant de continuer à circuler",
          "Le contrôle technique n'a aucun lien avec la sécurité routière",
          "Il ne concerne que les véhicules de plus de 20 ans",
          "C'est une simple formalité administrative sans vérification réelle",
        ],
        correctIndex: 1,
        explanation:
          "Le contrôle technique vérifie des points de sécurité (freinage, direction, éclairage) et environnementaux (émissions) essentiels pour la sécurité routière et la protection de l'environnement.",
      },
      {
        question: "Comment expliques-tu un devis de réparation élevé à un client mécontent ?",
        options: [
          "Je refuse d'expliquer, le prix est le prix",
          "Je détaille précisément les pièces et le temps de main d'œuvre pour justifier le montant de façon transparente",
          "Je baisse systématiquement le prix pour éviter le conflit",
          "Je blâme le constructeur du véhicule",
          "J'évite le sujet en espérant qu'il ne revienne pas dessus",
        ],
        correctIndex: 1,
        explanation:
          "Une explication transparente et détaillée (pièces, main d'œuvre) construit la confiance, même si le prix reste élevé -- bien plus efficace qu'une réponse évasive ou défensive.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi un diagnostic électronique (valise OBD) ne remplace-t-il jamais totalement l'analyse du technicien ?",
        options: [
          "Parce que la valise de diagnostic ne fonctionne jamais correctement",
          "Parce qu'un code défaut indique un symptôme électronique, mais la cause réelle nécessite souvent un raisonnement mécanique complémentaire pour être confirmée",
          "Parce que les valises de diagnostic sont interdites sur les véhicules récents",
          "Parce que le technicien n'a jamais besoin d'outils électroniques",
          "Parce que les codes défaut sont toujours faux",
        ],
        correctIndex: 1,
        explanation:
          "Un code défaut pointe un symptôme (ex. capteur hors plage) mais pas toujours la cause racine (câblage, composant lié) : l'expertise du technicien reste nécessaire pour interpréter et confirmer le diagnostic.",
      },
      {
        question: "Quelle est la responsabilité juridique d'un garage qui laisse repartir un véhicule avec un défaut de sécurité connu, sans en informer le client par écrit ?",
        options: [
          "Aucune, seul le client est responsable de la sécurité de son véhicule",
          "Sa responsabilité peut être engagée en cas d'accident lié à ce défaut, faute d'avoir informé clairement le client du risque",
          "Le garage n'est jamais responsable après restitution du véhicule",
          "La responsabilité ne concerne que les véhicules neufs sous garantie",
          "Elle ne s'applique qu'en cas de défaut visible à l'œil nu",
        ],
        correctIndex: 1,
        explanation:
          "Le professionnel a un devoir d'information et de conseil : ne pas signaler par écrit un défaut de sécurité connu peut engager sa responsabilité en cas d'accident lié à ce défaut.",
      },
      {
        question: "Pourquoi les véhicules électriques imposent-ils des habilitations électriques spécifiques (norme NF C18-550) pour intervenir dessus ?",
        options: [
          "Cette habilitation est purement symbolique, sans réel enjeu de sécurité",
          "Les circuits haute tension présentent un risque d'électrocution grave, nécessitant une formation et des procédures de consignation spécifiques",
          "Elle ne concerne que les véhicules de compétition électriques",
          "Un technicien automobile classique peut intervenir sans formation supplémentaire",
          "Cette norme ne s'applique qu'aux bornes de recharge, jamais aux véhicules",
        ],
        correctIndex: 1,
        explanation:
          "Les circuits haute tension d'un véhicule électrique/hybride présentent un risque réel d'électrocution : une habilitation spécifique (consignation, équipements isolants) est obligatoire pour intervenir en sécurité.",
      },
      {
        question: "Pourquoi la traçabilité des pièces détachées (origine, conformité) est-elle un enjeu de sécurité, au-delà de la question commerciale ?",
        options: [
          "Elle n'a aucun lien avec la sécurité du véhicule",
          "Une pièce non conforme ou contrefaite peut avoir une résistance mécanique inférieure aux normes, avec un risque direct sur des organes de sécurité (freins, direction)",
          "La traçabilité ne concerne que les pièces esthétiques",
          "Toutes les pièces détachées ont légalement la même qualité garantie",
          "C'est un enjeu réservé aux constructeurs, jamais aux garages",
        ],
        correctIndex: 1,
        explanation:
          "Une pièce contrefaite ou non homologuée peut ne pas respecter les normes de résistance mécanique attendues, un risque particulièrement critique sur des organes de sécurité comme les freins ou la direction.",
      },
      {
        question: "En quoi la maintenance prédictive (analyse de données véhicule) change-t-elle l'approche classique de l'entretien préventif ?",
        options: [
          "Elle n'apporte aucune amélioration par rapport à l'entretien classique",
          "Elle anticipe une panne probable à partir de données réelles d'usure/usage, plutôt que de se baser uniquement sur un calendrier ou un kilométrage fixe",
          "Elle remplace totalement le rôle du mécanicien",
          "Elle ne concerne que les flottes de véhicules professionnels",
          "Elle repose uniquement sur l'intuition du technicien",
        ],
        correctIndex: 1,
        explanation:
          "La maintenance prédictive s'appuie sur des données réelles d'usage (capteurs, historique) pour anticiper une panne probable, une approche plus fine qu'un simple calendrier fixe qui ignore l'usage réel du véhicule.",
      },
      {
        question: "Pourquoi la formation continue est-elle particulièrement critique dans ce métier face à l'évolution rapide des technologies embarquées ?",
        options: [
          "Les technologies automobiles évoluent très lentement, la formation initiale suffit toute la carrière",
          "L'électronique embarquée, les aides à la conduite et la motorisation électrique évoluent vite : sans formation continue, un technicien perd en pertinence sur les véhicules récents",
          "La formation continue ne concerne que les cadres du secteur",
          "Elle est optionnelle si le technicien a beaucoup d'ancienneté",
          "Elle n'a aucun impact sur la qualité des interventions",
        ],
        correctIndex: 1,
        explanation:
          "L'électronique embarquée, les aides à la conduite (ADAS) et l'électrification évoluent vite : sans mise à jour régulière des compétences, un technicien perd en capacité à diagnostiquer correctement les véhicules récents.",
      },
      {
        question: "Pourquoi un rappel constructeur (recall) impose-t-il une procédure stricte de suivi, même sur des véhicules déjà vendus ?",
        options: [
          "Les rappels constructeurs sont purement facultatifs pour le client",
          "Un défaut de sécurité identifié après commercialisation doit être corrigé pour tous les véhicules concernés, avec traçabilité de chaque intervention réalisée",
          "Le rappel ne concerne que les véhicules encore en concession",
          "Un rappel n'a aucune valeur légale contraignante",
          "Le suivi du rappel est laissé à la discrétion de chaque garage",
        ],
        correctIndex: 1,
        explanation:
          "Un rappel constructeur répond à un défaut de sécurité identifié après commercialisation : la procédure impose une correction systématique et tracée de tous les véhicules concernés, sous la responsabilité du constructeur.",
      },
    ],
  },

  energie: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans l'énergie/environnement ?",
        options: [
          "Je veux contribuer concrètement à des solutions énergétiques plus durables",
          "Parce que c'est un secteur à la mode en ce moment",
          "Je n'ai pas de raison particulière",
          "Parce qu'on me l'a conseillé sans plus de détails",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Une motivation liée à un impact concret et durable est plus solide et crédible qu'une motivation liée à une simple tendance du moment.",
      },
      {
        question: "Pourquoi la sécurité électrique est-elle une priorité absolue sur ce type de poste ?",
        options: [
          "C'est surtout une question de norme esthétique",
          "Parce qu'une intervention sur une installation électrique/énergétique comporte des risques graves (électrocution, explosion) en cas d'erreur",
          "Uniquement en cas de contrôle",
          "Ça dépend de l'expérience du technicien",
          "Les règles de sécurité électrique ne servent à rien en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Une installation énergétique (électrique, gaz, thermique) comporte des risques graves et immédiats en cas d'erreur : les règles de sécurité ne sont jamais une option secondaire.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir aller trop vite, donc j'apprends à toujours vérifier une installation avant de la considérer terminée",
          "Je n'aime pas le travail technique",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à la rigueur de vérification, avec une piste d'amélioration concrète, montre une bonne compréhension des enjeux de sécurité du métier.",
      },
      {
        question: "Pourquoi la transition énergétique est-elle un enjeu qui dépasse la seule question technique ?",
        options: [
          "Elle ne concerne que les ingénieurs spécialisés",
          "Parce qu'elle implique des choix économiques, sociaux et environnementaux qui touchent l'ensemble de la société",
          "C'est un sujet purement politique sans lien avec le terrain",
          "Elle n'a aucun impact sur les métiers techniques",
          "Elle ne concerne que les grands pays industrialisés",
        ],
        correctIndex: 1,
        explanation:
          "La transition énergétique combine des enjeux techniques, économiques, sociaux et environnementaux : elle dépasse largement la seule dimension technique et concerne toute la société.",
      },
      {
        question: "Que fais-tu si tu constates une fuite ou une anomalie sur une installation lors d'une intervention ?",
        options: [
          "Je continue mon intervention initiale sans en tenir compte",
          "Je sécurise la zone si nécessaire et signale immédiatement l'anomalie selon la procédure",
          "Je répare moi-même sans être habilité ni en parler à personne",
          "J'attends la fin de journée pour le signaler",
          "Je l'ignore si ce n'est pas ma tâche du jour",
        ],
        correctIndex: 1,
        explanation:
          "Sécuriser puis signaler immédiatement toute anomalie est le réflexe attendu : certaines fuites (gaz, fluide) peuvent avoir des conséquences graves si elles ne sont pas traitées rapidement.",
      },
    ],
    medium: [
      {
        question: "Comment expliques-tu à un client particulier l'intérêt d'un investissement en isolation avant de parler d'énergies renouvelables ?",
        options: [
          "Je lui recommande directement les panneaux solaires sans autre analyse",
          "Je lui explique que réduire d'abord les besoins (isolation) rend tout système énergétique installé ensuite plus efficace et moins coûteux à dimensionner",
          "Je lui dis que l'isolation n'a aucun rapport avec les renouvelables",
          "Je ne fais aucune recommandation particulière",
          "Je lui propose le système le plus cher disponible",
        ],
        correctIndex: 1,
        explanation:
          "Le principe \"sobriété avant renouvelable\" est un fondamental du secteur : réduire les besoins avant d'investir dans la production permet un dimensionnement plus efficace et économique.",
      },
      {
        question: "Pourquoi la consignation d'une installation avant intervention est-elle une étape non négociable ?",
        options: [
          "C'est une formalité qui peut être sautée si on est pressé",
          "Elle garantit que l'installation est bien hors tension/hors pression avant toute intervention, évitant un risque d'accident grave",
          "Elle ne concerne que les grandes installations industrielles",
          "Elle sert uniquement à des fins administratives",
          "La consignation n'a aucun lien avec la sécurité du technicien",
        ],
        correctIndex: 1,
        explanation:
          "La consignation (couper, condamner, vérifier l'absence d'énergie) garantit qu'aucune énergie résiduelle ne peut blesser le technicien pendant l'intervention : une étape de sécurité fondamentale, jamais facultative.",
      },
      {
        question: "Comment évalues-tu la pertinence d'une solution énergétique pour un client (particulier ou entreprise) ?",
        options: [
          "En proposant systématiquement la solution la plus récente sur le marché",
          "En analysant les besoins réels, la consommation actuelle et le retour sur investissement avant de recommander une solution",
          "En me basant uniquement sur le prix le plus bas",
          "Sans analyse particulière, au feeling",
          "En copiant la solution installée chez le voisin",
        ],
        correctIndex: 1,
        explanation:
          "Une recommandation pertinente s'appuie sur une analyse réelle des besoins et de la consommation, avec un calcul de retour sur investissement, plutôt que sur une solution générique ou à la mode.",
      },
      {
        question: "Pourquoi le suivi de la performance énergétique après installation est-il aussi important que l'installation elle-même ?",
        options: [
          "Ce n'est pas vraiment utile une fois l'installation terminée",
          "Il permet de vérifier que les gains attendus sont bien réalisés et d'ajuster si l'installation sous-performe",
          "Le suivi ne concerne que les installations défectueuses",
          "Il sert uniquement à facturer davantage le client",
          "La performance réelle correspond toujours exactement aux prévisions théoriques",
        ],
        correctIndex: 1,
        explanation:
          "Une installation peut sous-performer par rapport aux prévisions théoriques (usage réel, défaut, mauvais réglage) : le suivi post-installation permet de détecter et corriger ces écarts.",
      },
      {
        question: "Comment réagis-tu si un client insiste pour une solution énergétique inadaptée à son besoin réel ?",
        options: [
          "J'accepte sans discussion pour ne pas perdre la vente",
          "J'explique clairement les limites de son choix avec des arguments techniques, tout en respectant sa décision finale",
          "Je refuse catégoriquement de discuter avec lui",
          "J'installe la solution sans jamais mentionner mes réserves",
          "Je change de sujet pour éviter le désaccord",
        ],
        correctIndex: 1,
        explanation:
          "Expliquer clairement les limites techniques d'un choix, avec des arguments concrets, respecte à la fois l'expertise du professionnel et la liberté de décision finale du client.",
      },
      {
        question: "Pourquoi la maintenance préventive des équipements énergétiques (chaudières, panneaux, onduleurs) est-elle recommandée ?",
        options: [
          "Elle n'a pas vraiment d'impact sur la durée de vie des équipements",
          "Elle permet de détecter une usure ou un dysfonctionnement avant qu'il ne cause une panne coûteuse ou un risque de sécurité",
          "Uniquement pour respecter une obligation administrative",
          "Elle sert uniquement à générer du chiffre d'affaires supplémentaire",
          "La maintenance préventive ne concerne que les grandes installations",
        ],
        correctIndex: 1,
        explanation:
          "Une maintenance préventive détecte l'usure avant la panne, ce qui évite des interruptions coûteuses et, sur certains équipements, prévient de vrais risques de sécurité (surchauffe, fuite).",
      },
    ],
    difficile: [
      {
        question: "Pourquoi le facteur de charge (load factor) est-il déterminant pour évaluer la pertinence d'une source d'énergie renouvelable intermittente ?",
        options: [
          "Le facteur de charge n'a aucun lien avec la production réelle d'électricité",
          "Il mesure le rapport entre la production réelle et la production théorique maximale, révélant l'intermittence réelle (ex. éolien, solaire) à intégrer dans le dimensionnement du réseau",
          "Il ne concerne que les centrales nucléaires",
          "Un facteur de charge élevé signifie toujours une installation défaillante",
          "Ce facteur est fixé une fois pour toutes, indépendamment de la météo",
        ],
        correctIndex: 1,
        explanation:
          "Le facteur de charge révèle l'écart entre la puissance installée théorique et la production réelle (variable selon le vent, l'ensoleillement) : une donnée essentielle pour dimensionner un mix énergétique intégrant des sources intermittentes.",
      },
      {
        question: "Qu'est-ce que l'habilitation électrique (norme NF C18-510) et pourquoi conditionne-t-elle légalement certaines interventions ?",
        options: [
          "Un diplôme facultatif sans valeur légale réelle",
          "Une autorisation délivrée par l'employeur, attestant qu'un salarié a les compétences pour intervenir en sécurité sur ou près d'installations électriques, selon le niveau de risque",
          "Une certification qui ne concerne que les ingénieurs, jamais les techniciens",
          "Elle est valable à vie sans recyclage nécessaire",
          "Elle ne concerne que les interventions sur le réseau public",
        ],
        correctIndex: 1,
        explanation:
          "L'habilitation électrique conditionne légalement le droit d'intervenir sur ou à proximité d'installations électriques selon un niveau de risque précis ; elle nécessite un recyclage périodique pour rester valide.",
      },
      {
        question: "Pourquoi le stockage d'énergie (batteries, STEP) est-il un enjeu technique majeur pour l'intégration massive des renouvelables intermittentes ?",
        options: [
          "Le stockage n'a aucun rôle dans la stabilité du réseau électrique",
          "Il permet de lisser le décalage entre les pics de production (ex. solaire en journée) et les pics de consommation, essentiel pour équilibrer un réseau avec une forte part d'intermittence",
          "Il ne concerne que les usages domestiques individuels",
          "Le stockage remplace totalement le besoin de production pilotable",
          "Cet enjeu ne concerne que les pays sans réseau électrique centralisé",
        ],
        correctIndex: 1,
        explanation:
          "Le stockage compense le décalage temporel entre production intermittente (ex. pic solaire à midi) et pic de consommation (souvent le soir), un enjeu clé pour stabiliser un réseau avec une forte part de renouvelables.",
      },
      {
        question: "Qu'est-ce que le \"rebound effect\" (effet rebond) en efficacité énergétique, et pourquoi complique-t-il l'évaluation des gains ?",
        options: [
          "Un phénomène qui n'existe que dans la théorie économique, sans réalité observée",
          "Le fait qu'une amélioration d'efficacité énergétique peut inciter à une consommation accrue (ex. chauffer plus grand car moins cher), réduisant une partie des économies attendues",
          "Une panne fréquente sur les équipements économes en énergie",
          "Un phénomène qui ne concerne que le secteur du bâtiment",
          "Une augmentation automatique du prix de l'énergie après rénovation",
        ],
        correctIndex: 1,
        explanation:
          "L'effet rebond décrit comment un gain d'efficacité peut inciter à une consommation plus généreuse (chauffer une plus grande surface, par exemple), ce qui réduit une partie de l'économie théoriquement attendue -- un point clé à anticiper dans l'évaluation des projets.",
      },
      {
        question: "Pourquoi l'analyse du cycle de vie (ACV) est-elle nécessaire pour comparer objectivement deux solutions énergétiques ?",
        options: [
          "Elle ne prend en compte que le coût d'achat initial",
          "Elle évalue l'impact environnemental sur l'ensemble du cycle (fabrication, usage, fin de vie), évitant de comparer uniquement les émissions en phase d'usage",
          "L'ACV ne s'applique qu'aux véhicules électriques",
          "Elle est identique pour toutes les technologies, sans variation",
          "Elle ne concerne que les aspects financiers d'un projet",
        ],
        correctIndex: 1,
        explanation:
          "Comparer deux solutions uniquement sur leur impact en phase d'usage peut être trompeur (ex. fabrication de batteries) : l'ACV intègre fabrication, usage et fin de vie pour une comparaison réellement objective.",
      },
      {
        question: "Pourquoi la flexibilité de la demande (pilotage de la consommation) devient-elle un levier aussi important que la production dans la gestion d'un réseau électrique décarboné ?",
        options: [
          "La flexibilité de la demande n'a aucun rôle dans l'équilibre du réseau",
          "Décaler certains usages (recharge, chauffage) vers les heures de forte production renouvelable réduit le besoin de moyens de production pilotables coûteux et carbonés",
          "Elle ne concerne que les très gros consommateurs industriels",
          "Elle remplace totalement le besoin de production d'électricité",
          "Ce levier n'existe que dans les scénarios théoriques, jamais en pratique",
        ],
        correctIndex: 1,
        explanation:
          "Décaler la consommation vers les périodes de forte production renouvelable (effacement, pilotage intelligent) réduit le recours à des moyens de production pilotables souvent plus carbonés, un levier de plus en plus central dans la transition énergétique.",
      },
      {
        question: "Pourquoi le \"paradoxe de Jevons\" complique-t-il l'idée que l'amélioration technologique de l'efficacité énergétique suffit à réduire la consommation globale ?",
        options: [
          "Ce paradoxe n'a aucune validité, l'efficacité réduit toujours mécaniquement la consommation globale",
          "Il décrit comment une baisse du coût d'usage d'une ressource, permise par l'efficacité, peut stimuler une demande globale plus forte qui compense voire dépasse le gain initial",
          "Il ne concerne que le charbon au XIXe siècle, sans pertinence aujourd'hui",
          "Il s'applique uniquement aux énergies renouvelables",
          "Il démontre que l'efficacité énergétique n'a jamais d'effet mesurable",
        ],
        correctIndex: 1,
        explanation:
          "Le paradoxe de Jevons, proche de l'effet rebond mais à l'échelle macroéconomique, montre qu'une ressource rendue plus efficace (donc moins chère à l'usage) peut voir sa demande globale augmenter au point de compenser, voire dépasser, le gain d'efficacité initial.",
      },
    ],
  },

  mode: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la mode/luxe/beauté ?",
        options: [
          "J'aime l'univers créatif tout en développant un vrai sens du détail et du service",
          "Parce que je veux porter des vêtements de marque gratuitement",
          "Je n'ai pas de raison particulière",
          "Parce que c'est un secteur qui a l'air facile",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "Associer créativité et exigence de service/détail montre une compréhension réaliste du secteur, loin des clichés sur les avantages personnels.",
      },
      {
        question: "Un client hésite longtemps sans faire d'achat. Quelle attitude adopter en vente ?",
        options: [
          "Le forcer à acheter rapidement",
          "Rester disponible, répondre à ses questions sans pression, et le laisser décider à son rythme",
          "L'ignorer complètement s'il ne semble pas décidé",
          "Le suivre en insistant sans arrêt",
          "Lui dire directement que ça ne lui va pas",
        ],
        correctIndex: 1,
        explanation:
          "Une vente conseil de qualité respecte le rythme du client : une présence disponible sans pression construit la confiance et la fidélisation, contrairement à l'insistance.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux avoir un avis tranché sur le style, donc j'apprends à toujours adapter mon conseil aux goûts du client plutôt qu'aux miens",
          "Je n'aime pas être en contact avec les clients",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut réaliste et spécifique au métier (subjectivité esthétique), avec une prise de recul sur l'adaptation au client, montre une bonne conscience professionnelle.",
      },
      {
        question: "Pourquoi la présentation soignée des produits en boutique est-elle importante ?",
        options: [
          "Ce n'est qu'un détail sans réel impact commercial",
          "Parce qu'elle valorise le produit et reflète l'image de la marque, influençant directement la perception du client",
          "Uniquement pour respecter une consigne administrative",
          "La présentation n'a aucun lien avec les ventes",
          "Ça ne concerne que les boutiques de luxe",
        ],
        correctIndex: 1,
        explanation:
          "La présentation (merchandising) valorise le produit et transmet l'image de marque : un élément qui influence concrètement la perception et la décision d'achat du client.",
      },
      {
        question: "Que fais-tu si un client se plaint d'un défaut sur un article récemment acheté ?",
        options: [
          "Je refuse systématiquement toute réclamation",
          "J'écoute sa réclamation et applique la procédure du service (échange, retour, geste commercial selon les règles de la marque)",
          "Je le renvoie directement vers un autre magasin",
          "Je lui dis que c'est de sa faute sans vérifier",
          "J'ignore la réclamation si le client n'insiste pas",
        ],
        correctIndex: 1,
        explanation:
          "Écouter la réclamation et appliquer la procédure prévue transforme un incident en opportunité de fidélisation, essentielle dans un secteur où l'expérience client est un facteur clé de différenciation.",
      },
    ],
    medium: [
      {
        question: "Comment conseilles-tu un client qui insiste pour un article visiblement inadapté à sa morphologie/besoin ?",
        options: [
          "Je le laisse acheter sans rien dire, même si je pense que ça ne lui convient pas",
          "Je propose honnêtement une alternative mieux adaptée, tout en respectant sa décision finale s'il persiste",
          "Je refuse catégoriquement de le servir",
          "Je me moque discrètement de son choix",
          "J'insiste lourdement pour qu'il change d'avis",
        ],
        correctIndex: 1,
        explanation:
          "Un conseil honnête, avec une alternative argumentée, construit la confiance à long terme -- bien plus qu'une vente forcée qui risque de générer un retour ou une insatisfaction.",
      },
      {
        question: "Pourquoi la connaissance approfondie des matières et du savoir-faire produit est-elle valorisée dans le luxe ?",
        options: [
          "Elle n'a pas vraiment d'utilité en vente",
          "Parce qu'elle permet de justifier la valeur du produit auprès d'un client exigeant et de raconter une histoire qui légitime le prix",
          "Uniquement pour impressionner les collègues",
          "Cette connaissance ne concerne que les acheteurs professionnels",
          "Elle n'a aucun lien avec l'expérience client",
        ],
        correctIndex: 1,
        explanation:
          "Dans le luxe, le prix se justifie par la qualité, le savoir-faire et l'histoire du produit : une connaissance précise permet de transmettre cette valeur de façon crédible au client.",
      },
      {
        question: "Comment gères-tu une forte affluence en boutique pendant les soldes/périodes de forte activité ?",
        options: [
          "Je m'occupe d'un seul client pendant que les autres attendent sans être informés",
          "Je priorise et informe chaque client du temps d'attente, en gardant un rythme fluide et courtois",
          "Je néglige la qualité de service pour aller plus vite",
          "Je ferme la boutique jusqu'à ce que ça se calme",
          "Je laisse les clients se débrouiller seuls sans accompagnement",
        ],
        correctIndex: 1,
        explanation:
          "Informer clairement sur les délais et prioriser avec courtoisie permet de garder une bonne expérience client même en période de forte affluence, sans sacrifier la qualité de service.",
      },
      {
        question: "Pourquoi l'analyse des tendances est-elle utile mais ne doit pas remplacer l'écoute directe du client ?",
        options: [
          "Les tendances suffisent toujours à prédire les attentes de chaque client individuellement",
          "Les tendances donnent un cadre général, mais chaque client a des goûts et besoins spécifiques qu'une analyse générique ne peut pas capturer",
          "L'analyse des tendances n'a aucune utilité en boutique",
          "Il vaut mieux ignorer complètement les tendances du marché",
          "Les tendances remplacent totalement le rôle du vendeur conseil",
        ],
        correctIndex: 1,
        explanation:
          "Les tendances donnent un cadre utile pour l'offre générale, mais un bon conseil personnalisé nécessite d'écouter les goûts et besoins spécifiques de chaque client, au-delà des généralités du marché.",
      },
      {
        question: "Comment réagis-tu face à un client insatisfait qui exprime son mécontentement de façon publique en boutique ?",
        options: [
          "Je l'ignore pour ne pas envenimer la situation",
          "Je propose calmement de poursuivre la discussion dans un espace plus discret pour trouver une solution",
          "Je le contredis fermement devant les autres clients",
          "Je le fais sortir immédiatement de la boutique",
          "Je hausse le ton pour lui répondre",
        ],
        correctIndex: 1,
        explanation:
          "Déplacer la discussion vers un espace plus calme désamorce la tension publique et permet de traiter le problème posément, sans nuire à l'expérience des autres clients ni à l'image de la marque.",
      },
      {
        question: "Pourquoi la cohérence entre l'expérience en boutique et l'image de marque en ligne est-elle importante ?",
        options: [
          "Ce n'est pas vraiment un enjeu, les deux canaux sont indépendants",
          "Parce que le client perçoit la marque comme un tout, et une incohérence peut fragiliser la confiance et l'image perçue",
          "Uniquement pour des raisons de communication interne",
          "Ça ne concerne que les grandes enseignes internationales",
          "Cette cohérence n'a aucun impact sur les ventes",
        ],
        correctIndex: 1,
        explanation:
          "Le client vit la marque comme une expérience globale (digital, boutique) : une incohérence entre les deux (ton, qualité de service, image) fragilise la confiance et la perception de valeur.",
      },
    ],
    difficile: [
      {
        question: "Pourquoi le \"merchandising\" en boutique repose-t-il sur des principes précis (parcours client, zones chaudes/froides) et pas seulement sur l'esthétique ?",
        options: [
          "Le merchandising n'a aucun impact mesurable sur les ventes",
          "Il structure le parcours du client pour maximiser l'exposition aux produits stratégiques et guider naturellement le regard et le déplacement, au-delà du simple visuel",
          "Il ne concerne que la décoration de vitrine",
          "Les zones chaudes et froides sont un concept sans base réelle en comportement d'achat",
          "Le merchandising est identique quelle que soit la configuration du magasin",
        ],
        correctIndex: 1,
        explanation:
          "Le merchandising s'appuie sur des données de comportement d'achat (zones chaudes/froides, flux de circulation) pour organiser stratégiquement l'exposition des produits, bien au-delà d'un simple choix esthétique.",
      },
      {
        question: "Qu'est-ce que la contrefaçon au sens juridique, et pourquoi représente-t-elle un enjeu majeur pour les marques de luxe ?",
        options: [
          "Un simple synonyme légal de produit \"inspiré\" d'un autre",
          "La reproduction ou l'imitation non autorisée d'un produit protégé (marque, dessin, brevet), qui porte atteinte à la valeur de la marque et constitue un délit pénal",
          "Une pratique légale tant que le prix de vente est inférieur à l'original",
          "Un problème qui ne concerne que les produits vendus en ligne",
          "Un phénomène marginal sans réel impact économique",
        ],
        correctIndex: 1,
        explanation:
          "La contrefaçon est un délit pénal en France (reproduction non autorisée d'un droit de propriété intellectuelle) qui dilue l'image et la valeur perçue d'une marque, un enjeu économique et juridique majeur du secteur luxe.",
      },
      {
        question: "Pourquoi la traçabilité et la transparence de la chaîne d'approvisionnement deviennent-elles un enjeu stratégique dans la mode ?",
        options: [
          "Ce n'est qu'une contrainte réglementaire sans impact sur l'image de marque",
          "Les consommateurs et régulateurs exigent de plus en plus de connaître les conditions de production (matières, main d'œuvre), un enjeu d'image et de conformité (ex. devoir de vigilance)",
          "La traçabilité ne concerne que les matières premières agricoles",
          "Elle n'a aucun lien avec la réputation d'une marque",
          "Cet enjeu ne touche que les petites marques indépendantes",
        ],
        correctIndex: 1,
        explanation:
          "La pression des consommateurs et du cadre réglementaire (comme le devoir de vigilance) pousse les marques à documenter leur chaîne d'approvisionnement, sous peine de risque réputationnel et juridique.",
      },
      {
        question: "Qu'est-ce que le \"pricing power\" d'une marque de luxe et sur quoi repose-t-il principalement ?",
        options: [
          "Uniquement sur le coût réel des matières premières utilisées",
          "Sur la valeur perçue (image, désirabilité, rareté, storytelling) plus que sur le seul coût de production du produit",
          "Sur une fixation légale du prix par l'État",
          "Sur le prix moyen pratiqué par la concurrence directe",
          "Sur le volume de production uniquement",
        ],
        correctIndex: 1,
        explanation:
          "Dans le luxe, le prix reflète surtout la valeur perçue (image de marque, rareté, savoir-faire, histoire) bien plus que le coût de production réel : c'est ce \"pricing power\" qui distingue le luxe du marché de masse.",
      },
      {
        question: "Pourquoi la gestion des stocks (open-to-buy) est-elle particulièrement stratégique dans la mode, secteur à forte saisonnalité ?",
        options: [
          "La gestion de stock n'a aucune spécificité dans ce secteur",
          "Parce qu'un produit de mode perd rapidement de la valeur hors saison, rendant crucial l'équilibre entre rupture de stock et surstock à écouler en soldes",
          "Il suffit toujours de commander le maximum possible pour ne jamais être en rupture",
          "Les invendus n'ont aucun impact financier significatif",
          "Cette gestion ne concerne que les grandes chaînes internationales",
        ],
        correctIndex: 1,
        explanation:
          "Un produit de mode se dévalue vite hors saison : un mauvais pilotage des achats (open-to-buy) mène soit à des ruptures qui font perdre des ventes, soit à un surstock coûteux à écouler en soldes ou destruction.",
      },
      {
        question: "En quoi le \"quiet luxury\" (luxe discret) illustre-t-il une évolution des codes traditionnels du secteur ?",
        options: [
          "C'est un phénomène purement marketing sans base dans le comportement des consommateurs",
          "Il traduit un déplacement de la valeur perçue, du logo visible et ostentatoire vers la qualité des matières et la coupe, pour une clientèle en quête de discrétion",
          "Il concerne exclusivement les marques nouvellement créées",
          "Ce concept a totalement remplacé la demande pour le luxe visible",
          "Il n'a aucun lien avec le positionnement prix des produits",
        ],
        correctIndex: 1,
        explanation:
          "Le \"quiet luxury\" reflète une évolution des attentes d'une partie de la clientèle, qui valorise la qualité intrinsèque et la discrétion plutôt que la visibilité du logo -- un signal stratégique important pour l'offre produit.",
      },
      {
        question: "Pourquoi la valorisation d'un produit de luxe repose-t-elle en partie sur la maîtrise volontaire de la distribution (nombre de points de vente, exclusivité) ?",
        options: [
          "La distribution n'a aucun effet sur la valeur perçue d'un produit",
          "Une distribution trop large banalise le produit et dilue la perception de rareté qui justifie une partie de son prix et de son attractivité",
          "Il faut toujours maximiser le nombre de points de vente pour augmenter les ventes",
          "Ce principe ne concerne que les produits de très haute joaillerie",
          "La rareté n'a jamais d'influence sur la désirabilité d'un produit",
        ],
        correctIndex: 1,
        explanation:
          "La rareté perçue (distribution maîtrisée, quantités limitées) fait partie intégrante de la valeur d'un produit de luxe ; une distribution trop large la dilue et peut affaiblir durablement l'attractivité et le positionnement de la marque.",
      },
    ],
  },

  culture: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans la culture/audiovisuel/médias ?",
        options: [
          "J'aime participer à la création et à la diffusion de contenus qui touchent un public",
          "Parce que je veux juste rencontrer des personnalités connues",
          "Je n'ai pas de raison particulière",
          "Parce que ça a l'air un métier facile et amusant",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "L'intérêt pour la création et la diffusion de contenu, avec une vraie dimension d'impact sur un public, est une motivation solide et professionnelle.",
      },
      {
        question: "Un projet culturel/événement a un imprévu de dernière minute (technique, intervenant absent). Que fais-tu ?",
        options: [
          "Je panique et j'annule tout",
          "Je reste calme, j'évalue les options de repli et j'en informe rapidement les responsables concernés",
          "J'improvise sans en informer personne",
          "J'attends que quelqu'un d'autre gère le problème",
          "Je blâme immédiatement quelqu'un sans chercher de solution",
        ],
        correctIndex: 1,
        explanation:
          "Le secteur culturel/événementiel est particulièrement exposé aux imprévus : garder son calme, évaluer des solutions de repli et communiquer vite est essentiel pour limiter l'impact.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux être perfectionniste sur le rendu créatif, donc j'apprends à respecter les délais avant de peaufiner indéfiniment",
          "Je n'aime pas travailler en équipe",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à un vrai enjeu du secteur (équilibre créativité/délai), avec une piste d'amélioration, montre une bonne compréhension des contraintes de production.",
      },
      {
        question: "Pourquoi le respect des délais de production/diffusion est-il particulièrement strict dans ce secteur ?",
        options: [
          "Ce n'est pas si important si le contenu final est bon",
          "Parce qu'une diffusion (émission, événement, publication) est souvent liée à une date fixe non négociable, avec un public qui attend",
          "Uniquement pour la facturation interne",
          "Les délais n'ont aucun impact sur les autres équipes",
          "Le respect des délais ne concerne que les grandes productions",
        ],
        correctIndex: 1,
        explanation:
          "Une diffusion (TV, événement, sortie culturelle) est souvent calée sur une date fixe et communiquée au public : un retard a un impact direct et visible, contrairement à d'autres secteurs plus flexibles.",
      },
      {
        question: "Que fais-tu si tu remarques une erreur factuelle dans un contenu presque prêt à être diffusé/publié ?",
        options: [
          "Je laisse passer pour respecter le délai",
          "Je signale immédiatement l'erreur au responsable, même si ça retarde légèrement la publication",
          "Je corrige moi-même sans en parler à personne",
          "J'attends que quelqu'un d'autre s'en rende compte",
          "Je considère que ce n'est pas grave si personne ne le remarque",
        ],
        correctIndex: 1,
        explanation:
          "Signaler une erreur factuelle avant diffusion protège la crédibilité du média/de la structure : mieux vaut un léger retard qu'une erreur publiée et potentiellement virale.",
      },
    ],
    medium: [
      {
        question: "Comment gères-tu la pression d'un bouclage (deadline de diffusion/publication) avec un contenu pas totalement finalisé ?",
        options: [
          "Je publie en l'état sans vérification, quitte à avoir des erreurs",
          "Je priorise les corrections essentielles (factuelles, légales) et communique clairement si un délai supplémentaire est nécessaire",
          "Je repousse systématiquement la publication sans en informer personne",
          "Je délègue tout le travail à la dernière minute sans supervision",
          "J'ignore complètement le bouclage prévu",
        ],
        correctIndex: 1,
        explanation:
          "Prioriser les corrections vraiment critiques et communiquer de façon transparente sur un éventuel délai est plus professionnel qu'une publication précipitée avec des erreurs ou un silence sur le retard.",
      },
      {
        question: "Pourquoi la vérification des sources est-elle une étape non négociable dans la production de contenu médiatique/culturel ?",
        options: [
          "Ce n'est important que pour les sujets sensibles",
          "Parce que diffuser une information erronée peut nuire à la crédibilité du média et, selon les cas, engager sa responsabilité juridique",
          "La vérification des sources ralentit inutilement le travail",
          "Elle ne concerne que les journalistes, jamais les autres métiers du secteur",
          "Une seule source suffit toujours à valider une information",
        ],
        correctIndex: 1,
        explanation:
          "Une information erronée diffusée peut nuire durablement à la crédibilité d'un média et engager sa responsabilité (diffamation, désinformation) : la vérification des sources est un fondement du métier.",
      },
      {
        question: "Comment collabores-tu avec des intervenants créatifs (artistes, réalisateurs) qui ont une vision différente de la tienne ?",
        options: [
          "J'impose systématiquement ma vision technique/organisationnelle",
          "Je cherche un compromis qui respecte la vision créative tout en tenant compte des contraintes de production",
          "Je cède totalement sans exprimer les contraintes réelles",
          "J'évite tout échange avec les intervenants créatifs",
          "Je considère que les contraintes de production n'ont pas à être mentionnées",
        ],
        correctIndex: 1,
        explanation:
          "Trouver un compromis entre vision créative et contraintes réelles de production (budget, délai, technique) est une compétence clé pour collaborer efficacement dans ce secteur.",
      },
      {
        question: "Pourquoi les droits d'auteur et l'utilisation de musiques/images sous licence sont-ils à vérifier systématiquement ?",
        options: [
          "Ce n'est nécessaire que pour les grosses productions commerciales",
          "Utiliser un contenu sans autorisation peut entraîner des poursuites et le retrait du contenu publié, même pour un usage à but non lucratif",
          "Les droits d'auteur ne s'appliquent pas aux contenus diffusés en ligne",
          "Il suffit de citer la source pour être en règle légalement",
          "Cette vérification n'a aucun impact réel en pratique",
        ],
        correctIndex: 1,
        explanation:
          "L'utilisation d'un contenu protégé sans autorisation (même pour un usage non commercial) expose à des poursuites et au retrait du contenu : une vérification systématique des droits est indispensable.",
      },
      {
        question: "Comment analyses-tu l'audience/le public visé avant de concevoir un contenu culturel ou éditorial ?",
        options: [
          "Je conçois le contenu uniquement selon mes goûts personnels",
          "J'identifie les attentes, habitudes et codes du public visé pour adapter le format et le ton",
          "L'analyse d'audience n'a pas vraiment d'utilité",
          "Je copie simplement ce qui fonctionne déjà ailleurs, sans adaptation",
          "Je considère que tous les publics ont les mêmes attentes",
        ],
        correctIndex: 1,
        explanation:
          "Adapter le format et le ton aux attentes réelles du public visé (plutôt qu'à ses propres goûts) est central pour qu'un contenu culturel ou éditorial trouve son audience.",
      },
      {
        question: "Pourquoi le travail en équipe pluridisciplinaire (technique, créatif, production) est-il structurant dans l'audiovisuel/l'événementiel ?",
        options: [
          "Ce n'est qu'une contrainte organisationnelle sans réel intérêt",
          "Parce que chaque métier apporte une expertise indispensable et interdépendante à la réalisation finale du projet",
          "Uniquement pour répartir les tâches ingrates",
          "La pluridisciplinarité ne concerne que les grosses productions",
          "Ça n'a pas d'impact sur la qualité du résultat final",
        ],
        correctIndex: 1,
        explanation:
          "Technique, créatif et production sont fortement interdépendants dans l'audiovisuel/l'événementiel : chaque expertise est indispensable et leur bonne coordination conditionne directement la qualité du résultat.",
      },
    ],
    difficile: [
      {
        question: "Qu'est-ce que le droit moral de l'auteur, et en quoi diffère-t-il des droits patrimoniaux dans le cadre de la propriété intellectuelle ?",
        options: [
          "Ce sont deux termes strictement synonymes en droit français",
          "Le droit moral (paternité, intégrité de l'œuvre) est perpétuel et incessible, tandis que les droits patrimoniaux (exploitation, rémunération) peuvent être cédés ou avoir une durée limitée",
          "Le droit moral ne concerne que les œuvres audiovisuelles",
          "Les droits patrimoniaux sont toujours prioritaires sur le droit moral",
          "Le droit moral peut être vendu comme les droits patrimoniaux",
        ],
        correctIndex: 1,
        explanation:
          "En droit français, le droit moral (respect du nom et de l'intégrité de l'œuvre) est perpétuel, inaliénable et incessible, contrairement aux droits patrimoniaux qui peuvent être cédés ou licenciés pour l'exploitation commerciale.",
      },
      {
        question: "Pourquoi la diffamation et l'atteinte à la vie privée sont-elles des risques juridiques spécifiques au traitement médiatique de l'information ?",
        options: [
          "Ces notions n'existent pas en droit français",
          "Diffuser une allégation portant atteinte à l'honneur d'une personne (diffamation) ou révéler des éléments de sa vie privée sans justification d'intérêt public engage la responsabilité civile et pénale du média",
          "Ces risques ne concernent que les publications papier",
          "Toute information vérifiée peut être diffusée sans limite légale",
          "Ces notions ne s'appliquent qu'aux personnalités publiques",
        ],
        correctIndex: 1,
        explanation:
          "La loi française encadre strictement la diffamation (allégation portant atteinte à l'honneur) et l'atteinte à la vie privée : leur violation, même pour une information vraie mais sans justification d'intérêt légitime, engage une responsabilité civile et pénale.",
      },
      {
        question: "Qu'est-ce que la ligne éditoriale d'un média, et pourquoi structure-t-elle les choix de contenu au-delà des préférences individuelles ?",
        options: [
          "Un simple document administratif sans influence réelle",
          "Un ensemble de principes (ton, valeurs, périmètre thématique) qui garantit la cohérence de l'identité du média face à son public et ses annonceurs",
          "Elle ne concerne que les médias d'opinion, jamais les médias généralistes",
          "Elle est fixée une fois pour toutes et ne peut jamais évoluer",
          "La ligne éditoriale n'a aucun lien avec la crédibilité perçue du média",
        ],
        correctIndex: 1,
        explanation:
          "La ligne éditoriale structure la cohérence d'un média (ton, angle, périmètre) au-delà des préférences d'un contributeur individuel, un repère essentiel pour la crédibilité et l'identité perçue par le public.",
      },
      {
        question: "Pourquoi le financement mixte (public/privé/mécénat) de nombreux projets culturels crée-t-il des enjeux d'indépendance éditoriale ou artistique ?",
        options: [
          "Ce type de financement n'a aucune incidence sur la liberté créative",
          "Un financeur (sponsor, mécène, subvention conditionnée) peut chercher à influencer le contenu, ce qui impose des garde-fous pour préserver l'indépendance artistique/éditoriale",
          "Le financement public est toujours sans condition, contrairement au privé",
          "Cet enjeu ne concerne que les très grandes productions internationales",
          "Le mécénat élimine tout risque d'influence sur le contenu",
        ],
        correctIndex: 1,
        explanation:
          "Tout financeur a potentiellement un intérêt à influencer le contenu produit : la structuration de garde-fous (chartes, comités indépendants) est essentielle pour préserver la liberté artistique ou éditoriale du projet.",
      },
      {
        question: "Qu'est-ce que l'exception de courte citation en droit d'auteur, et pourquoi son usage reste-t-il strictement encadré ?",
        options: [
          "Elle autorise à reproduire une œuvre entière tant que la source est citée",
          "Elle permet de citer un court extrait d'une œuvre sans autorisation, à condition de respecter des critères précis (brièveté, but critique/pédagogique, mention de la source)",
          "Elle s'applique uniquement aux œuvres tombées dans le domaine public",
          "Elle autorise n'importe quel usage commercial d'un extrait",
          "Cette exception n'existe pas en droit français",
        ],
        correctIndex: 1,
        explanation:
          "L'exception de courte citation autorise un usage limité et encadré (brièveté réelle, finalité critique/pédagogique, mention de la source) : au-delà de ces critères stricts, l'autorisation de l'auteur redevient nécessaire.",
      },
      {
        question: "Pourquoi la mesure d'audience (taux, algorithmes de recommandation) influence-t-elle de plus en plus la production de contenu, et quel risque cela pose-t-il ?",
        options: [
          "La mesure d'audience n'a aucune influence sur les choix de production",
          "Elle guide de plus en plus les choix de contenu vers ce qui \"performe\", avec le risque d'uniformiser l'offre au détriment de la prise de risque créative ou éditoriale",
          "Cet enjeu ne concerne que les plateformes de streaming",
          "Les algorithmes de recommandation ne mesurent jamais le comportement réel des utilisateurs",
          "Cette influence garantit toujours une meilleure qualité éditoriale ou artistique",
        ],
        correctIndex: 1,
        explanation:
          "La pression de la performance mesurée (audience, engagement algorithmique) peut pousser à reproduire des formats qui fonctionnent déjà, au risque d'uniformiser l'offre et de réduire la prise de risque créative ou éditoriale.",
      },
      {
        question: "Pourquoi le régime de l'intermittence du spectacle a-t-il été conçu spécifiquement pour les métiers techniques et artistiques du secteur culturel ?",
        options: [
          "Il s'agit d'un régime identique à l'assurance chômage classique, sans spécificité",
          "Il répond à la discontinuité structurelle de l'emploi dans ce secteur (contrats courts et successifs liés aux productions), en adaptant les conditions d'indemnisation à ce rythme atypique",
          "Il ne concerne que les artistes déjà très reconnus",
          "Ce régime a été supprimé et n'existe plus en France",
          "Il garantit un revenu fixe identique quel que soit le volume d'activité",
        ],
        correctIndex: 1,
        explanation:
          "Le régime spécifique de l'intermittence répond à la discontinuité structurelle de l'emploi dans le spectacle et l'audiovisuel (succession de contrats courts liés aux productions), inadaptée aux règles classiques de l'assurance chômage.",
      },
    ],
  },

  sport: {
    facile: [
      {
        question: "Pourquoi veux-tu faire ton alternance/stage dans le sport/l'animation ?",
        options: [
          "J'aime transmettre l'envie de bouger et accompagner la progression des pratiquants",
          "Parce que je veux juste faire du sport gratuitement",
          "Je n'ai pas de raison particulière",
          "Parce que c'est un métier qui a l'air facile",
          "Je n'avais pas d'autre idée",
        ],
        correctIndex: 0,
        explanation:
          "La motivation à transmettre et accompagner la progression est au cœur du métier d'encadrement sportif, bien plus solide qu'une motivation centrée sur un avantage personnel.",
      },
      {
        question: "Pourquoi la sécurité des pratiquants est-elle la priorité numéro un lors d'une séance/activité ?",
        options: [
          "Ce n'est pas la priorité si l'ambiance est bonne",
          "Parce qu'un encadrant est responsable de l'intégrité physique des personnes qu'il encadre, avant tout objectif de performance",
          "Uniquement en cas de contrôle de la fédération",
          "La sécurité dépend uniquement du niveau des pratiquants",
          "Les règles de sécurité ne servent à rien en pratique",
        ],
        correctIndex: 1,
        explanation:
          "L'encadrant est responsable de la sécurité physique des pratiquants : cette responsabilité prime toujours sur l'objectif de performance ou d'animation de la séance.",
      },
      {
        question: "Quel est ton plus grand défaut pour ce métier ?",
        options: [
          "Je n'ai aucun défaut",
          "Je peux vouloir pousser trop fort la performance, donc j'apprends à adapter le rythme à chaque profil",
          "Je n'aime pas être en contact avec un public",
          "Je suis souvent en retard",
          "Je ne sais pas",
        ],
        correctIndex: 1,
        explanation:
          "Un défaut lié à un vrai enjeu pédagogique (adaptation du niveau d'exigence), avec une piste d'amélioration, montre une bonne compréhension du rôle d'encadrant.",
      },
      {
        question: "Un enfant/pratiquant se sent exclu par le groupe pendant une activité. Que fais-tu ?",
        options: [
          "Je laisse le groupe gérer la situation seul",
          "J'intègre activement la personne via un rôle ou une activité qui la remet en confiance dans le groupe",
          "Je gronde le groupe sans chercher à comprendre la situation",
          "J'ignore la situation si l'activité se déroule normalement",
          "Je retire la personne du groupe sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Réintégrer activement une personne exclue (rôle valorisant, activité adaptée) est une compétence clé d'un bon encadrant, plutôt que d'ignorer ou d'aggraver la situation.",
      },
      {
        question: "Pourquoi l'échauffement est-il une étape systématique avant toute activité physique intense ?",
        options: [
          "Ce n'est qu'une habitude sans réel intérêt",
          "Il prépare le corps à l'effort et réduit significativement le risque de blessure musculaire ou articulaire",
          "Uniquement pour faire patienter le groupe",
          "L'échauffement ne concerne que les sportifs de haut niveau",
          "Il n'a aucun lien avec la performance ou la sécurité",
        ],
        correctIndex: 1,
        explanation:
          "L'échauffement prépare progressivement muscles et articulations à l'effort, réduisant concrètement le risque de blessure : une étape jamais facultative avant un effort intense.",
      },
    ],
    medium: [
      {
        question: "Un pratiquant se blesse légèrement pendant ta séance. Quelle est la bonne procédure ?",
        options: [
          "Continuer la séance sans s'en occuper",
          "Interrompre si nécessaire, évaluer la gravité, appliquer les premiers gestes adaptés et prévenir les personnes concernées (responsable, famille si mineur)",
          "Minimiser systématiquement la blessure pour ne pas alarmer",
          "Renvoyer la personne seule sans accompagnement",
          "Continuer l'activité en ignorant complètement l'incident",
        ],
        correctIndex: 1,
        explanation:
          "Face à une blessure, la priorité est d'évaluer sa gravité et d'agir en conséquence (premiers secours, information des responsables), jamais de minimiser ou d'ignorer l'incident.",
      },
      {
        question: "Comment adaptes-tu une séance pour un groupe avec des niveaux physiques très différents ?",
        options: [
          "Je propose le même exercice à la même intensité pour tout le monde",
          "Je propose des variantes d'intensité/difficulté selon le niveau de chacun, tout en gardant un objectif commun",
          "Je m'occupe uniquement des meilleurs éléments du groupe",
          "Je ralentis systématiquement tout le groupe au rythme du plus faible",
          "Je considère qu'un groupe hétérogène n'est pas gérable",
        ],
        correctIndex: 1,
        explanation:
          "Proposer des variantes d'intensité selon le niveau (différenciation pédagogique appliquée au sport) permet à un groupe hétérogène de progresser ensemble sans exclure ni brimer personne.",
      },
      {
        question: "Pourquoi la communication claire des consignes de sécurité avant une activité à risque est-elle essentielle ?",
        options: [
          "Ce n'est utile que pour les activités extrêmes",
          "Parce qu'une consigne mal comprise peut entraîner un accident évitable, la responsabilité de l'encadrant étant alors engagée",
          "Les consignes de sécurité ralentissent inutilement l'activité",
          "Cette communication ne concerne que les compétitions officielles",
          "Les pratiquants comprennent toujours les risques sans explication",
        ],
        correctIndex: 1,
        explanation:
          "Une consigne de sécurité mal transmise ou mal comprise peut causer un accident évitable, et engage directement la responsabilité de l'encadrant : la clarté de la communication est donc essentielle, pas optionnelle.",
      },
      {
        question: "Comment gères-tu un conflit entre deux membres du groupe pendant une séance ?",
        options: [
          "Je les ignore en espérant que ça se calme tout seul",
          "J'interviens rapidement pour apaiser la tension et clarifier la règle commune, sans prendre parti de façon injuste",
          "Je prends systématiquement parti pour celui qui parle en premier",
          "J'exclus définitivement les deux personnes sans dialogue",
          "Je laisse le conflit s'envenimer devant tout le groupe",
        ],
        correctIndex: 1,
        explanation:
          "Intervenir rapidement et de façon équitable pour apaiser un conflit, en rappelant la règle commune, est essentiel pour préserver un climat de groupe sain et sécurisant.",
      },
      {
        question: "Pourquoi le suivi de la progression individuelle est-il important, au-delà du résultat collectif d'une séance ?",
        options: [
          "Ce n'est pas vraiment utile si le groupe progresse globalement",
          "Il permet d'ajuster l'accompagnement de chaque pratiquant et de maintenir sa motivation sur la durée",
          "Le suivi individuel ne concerne que le sport de haut niveau",
          "Il n'a aucun lien avec la motivation des pratiquants",
          "Le résultat collectif suffit toujours à évaluer la qualité de l'encadrement",
        ],
        correctIndex: 1,
        explanation:
          "Suivre la progression individuelle permet d'ajuster l'accompagnement à chaque profil et de maintenir la motivation sur la durée, au-delà du seul résultat collectif visible en séance.",
      },
      {
        question: "Comment réagis-tu si un parent conteste ta méthode d'encadrement devant l'enfant ?",
        options: [
          "Je débats fermement devant l'enfant",
          "Je reste posé et propose d'en reparler calmement à un autre moment, sans l'enfant",
          "Je cède immédiatement sans explication",
          "J'ignore complètement le parent",
          "Je critique le parent devant l'enfant",
        ],
        correctIndex: 1,
        explanation:
          "Comme dans l'éducation, déplacer la discussion hors de la présence de l'enfant protège sa relation de confiance avec l'encadrant et permet un échange plus constructif avec le parent.",
      },
    ],
    difficile: [
      {
        question: "Quelle est la responsabilité juridique d'un encadrant sportif en cas d'accident lors d'une activité qu'il dirige ?",
        options: [
          "Aucune, seule la fédération sportive est responsable en toutes circonstances",
          "Sa responsabilité peut être engagée s'il est démontré une faute (défaut de surveillance, consigne inadaptée, non-respect des normes d'encadrement)",
          "La responsabilité est systématiquement rejetée sur le pratiquant, quel que soit le contexte",
          "Elle ne s'applique qu'aux activités de compétition officielle",
          "Elle ne concerne que les encadrants professionnels diplômés d'État",
        ],
        correctIndex: 1,
        explanation:
          "La responsabilité de l'encadrant peut être engagée (civile voire pénale) en cas de faute démontrée : défaut de surveillance, consigne de sécurité inadaptée, ou non-respect des taux d'encadrement réglementaires.",
      },
      {
        question: "Pourquoi les taux d'encadrement réglementaires (nombre de pratiquants par encadrant) sont-ils fixés selon l'activité et l'âge du public ?",
        options: [
          "Ces taux sont purement indicatifs et sans valeur légale",
          "Parce qu'ils garantissent une capacité réelle de surveillance et d'intervention en cas de problème, proportionnée au risque de l'activité et à l'autonomie du public",
          "Ils sont identiques pour toutes les activités, sans distinction d'âge",
          "Ils ne concernent que les activités aquatiques",
          "Ils sont fixés uniquement pour des raisons budgétaires",
        ],
        correctIndex: 1,
        explanation:
          "Les taux d'encadrement varient selon le risque de l'activité (ex. natation) et l'autonomie du public (âge, niveau) pour garantir une réelle capacité de surveillance et d'intervention rapide en cas de besoin.",
      },
      {
        question: "Qu'est-ce que le surentraînement (overtraining), et pourquoi un encadrant doit-il savoir en repérer les signes ?",
        options: [
          "Un mythe sans base physiologique réelle",
          "Un état de fatigue chronique lié à un déséquilibre entre charge d'entraînement et récupération, pouvant entraîner blessures, baisse de performance et troubles de santé",
          "Un phénomène qui ne concerne que les athlètes professionnels",
          "Un simple manque de motivation du pratiquant",
          "Un état qui se résout toujours en une seule nuit de sommeil",
        ],
        correctIndex: 1,
        explanation:
          "Le surentraînement résulte d'un déséquilibre durable entre charge d'effort et récupération : un encadrant averti doit en repérer les signes (fatigue persistante, baisse de performance, irritabilité) pour ajuster la charge avant qu'un problème de santé n'apparaisse.",
      },
      {
        question: "Pourquoi la spécialisation précoce intensive chez un jeune sportif est-elle aujourd'hui questionnée par les sciences du sport ?",
        options: [
          "Elle n'a jamais été questionnée, c'est toujours recommandé",
          "Elle est associée à un risque accru de blessures de surutilisation et de désengagement (burn-out) précoce, par rapport à une pratique diversifiée à un jeune âge",
          "Elle ne concerne que les sports collectifs",
          "Cette question ne concerne que les très hauts niveaux de performance adulte",
          "La spécialisation précoce garantit toujours une meilleure performance à l'âge adulte",
        ],
        correctIndex: 1,
        explanation:
          "Les sciences du sport documentent un risque accru de blessures de surutilisation et de désengagement précoce lié à la spécialisation trop intensive et trop jeune, plaidant pour une diversification sportive avant la spécialisation.",
      },
      {
        question: "Qu'est-ce que la charge d'entraînement (interne/externe) et pourquoi son suivi est-il central en préparation physique ?",
        options: [
          "Un concept théorique sans application pratique sur le terrain",
          "La charge externe mesure le travail effectivement réalisé (volume, intensité), la charge interne la réponse physiologique du pratiquant (fréquence cardiaque, perception d'effort) -- leur suivi croisé permet d'ajuster l'entraînement et de prévenir le surentraînement",
          "Seule la charge externe compte réellement, la charge interne est négligeable",
          "Ce suivi ne concerne que les sports d'endurance",
          "La charge d'entraînement est identique pour tous les pratiquants d'un même groupe",
        ],
        correctIndex: 1,
        explanation:
          "Croiser charge externe (travail réellement effectué) et charge interne (réponse physiologique individuelle) permet d'ajuster finement l'entraînement à chaque pratiquant et de prévenir les blessures liées à une charge mal calibrée.",
      },
      {
        question: "Pourquoi l'encadrement sportif de publics en situation de handicap nécessite-t-il une approche spécifique, au-delà de l'adaptation matérielle ?",
        options: [
          "Il suffit toujours d'adapter uniquement le matériel utilisé",
          "Il nécessite d'adapter la pédagogie, la communication et les objectifs à chaque situation individuelle, en s'appuyant si besoin sur l'expertise de professionnels spécialisés",
          "Cette approche est identique quel que soit le type de handicap",
          "Elle ne concerne que les activités de compétition adaptée",
          "L'adaptation matérielle seule garantit toujours un encadrement de qualité",
        ],
        correctIndex: 1,
        explanation:
          "Au-delà du matériel, un encadrement adapté nécessite d'ajuster la pédagogie et la communication à la situation individuelle de chaque personne, en s'appuyant si besoin sur des professionnels spécialisés (handisport, éducateurs spécialisés).",
      },
      {
        question: "Pourquoi la périodisation de l'entraînement (alternance de cycles de charge et de récupération) est-elle un principe fondamental en préparation physique ?",
        options: [
          "Il vaut toujours mieux maximiser l'intensité en continu, sans phase de récupération planifiée",
          "Elle permet de programmer des cycles de charge croissante suivis de phases de récupération, pour optimiser la progression tout en limitant le risque de blessure et de surentraînement",
          "La périodisation ne concerne que les sports de très haut niveau olympique",
          "Elle n'a aucun effet mesurable sur la performance à long terme",
          "Elle consiste à répéter systématiquement le même programme toute l'année",
        ],
        correctIndex: 1,
        explanation:
          "La périodisation planifie l'alternance de cycles de charge et de récupération pour optimiser la progression sur la durée, tout en réduisant le risque de blessure et de surentraînement lié à une charge constante sans repos structuré.",
      },
    ],
  },
};
