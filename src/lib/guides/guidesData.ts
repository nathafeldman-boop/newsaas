import { MORE_GUIDES } from "@/lib/guides/moreGuides";

export type GuideFaqItem = { q: string; a: string };
export type GuideTable = { headers: string[]; rows: string[][] };
export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  table?: GuideTable;
};
export type GuideSource = { label: string; url: string };

export type Guide = {
  slug: string;
  title: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  intro: string[];
  sections: GuideSection[];
  faq?: GuideFaqItem[];
  sources?: GuideSource[];
  // Guides liés en priorité dans « À lire aussi » (complétés automatiquement).
  related?: string[];
};

// Contenu factuel (rémunérations, durées légales) vérifié le 02/10/2026 --
// SMIC et durée max de stage confirmés sur source officielle
// (info.gouv.fr, justice.fr) ; barèmes apprentissage/contrat pro et droits
// comparés recoupés sur plusieurs sources juridiques/RH indépendantes mais
// pas revérifiés en direct sur service-public.fr -- d'où le renvoi
// explicite vers service-public.fr dans le texte pour les montants les
// plus susceptibles d'évoluer. Si le SMIC est revalorisé après cette date,
// penser à mettre à jour `sections` ci-dessous en même temps que la date
// `updatedAt`.
export const GUIDES: Guide[] = [
  {
    slug: "alternance-vs-stage",
    title: "Alternance ou stage : quelles différences en 2026 ?",
    metaDescription:
      "Statut, rémunération, durée, droits : les vraies différences entre un contrat d'alternance (apprentissage) et un stage, avec les montants 2026.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    intro: [
      "« Alternance » et « stage » sont souvent confondus, mais ce sont deux statuts très différents sur le plan légal : l'un fait de toi un salarié, l'autre non. Voici les différences qui comptent vraiment avant de choisir.",
    ],
    sections: [
      {
        heading: "Le statut : salarié ou non",
        paragraphs: [
          "Un stagiaire n'est pas salarié : il reste étudiant, encadré par une convention de stage tripartite entre lui, l'entreprise et son établissement. Un alternant (apprenti ou en contrat de professionnalisation), lui, signe un vrai contrat de travail (CDD ou CDI) et devient salarié à part entière de l'entreprise, avec les mêmes obligations et protections que n'importe quel salarié.",
          "Cette différence de statut explique presque toutes les autres : rémunération, cotisations, congés, droit au chômage.",
        ],
      },
      {
        heading: "La rémunération",
        paragraphs: [
          "Un stage n'est obligatoirement rémunéré qu'à partir de 2 mois de présence (consécutifs ou non) dans la même entreprise sur une même année scolaire ou universitaire, soit 44 jours ou 308 heures. En dessous de ce seuil, l'entreprise n'a aucune obligation légale de gratification. Le minimum légal est de 4,50 €/heure en 2026 (15 % du plafond horaire de la sécurité sociale) -- soit environ 682 €/mois pour un stage à temps plein (35h/semaine), à titre indicatif.",
          "Un apprenti est payé en pourcentage du SMIC, selon son âge et son année de contrat (SMIC 2026 : 1 867,02 €/mois) :",
        ],
        table: {
          headers: ["Âge", "1re année", "2e année", "3e année"],
          rows: [
            ["Moins de 18 ans", "27 % (≈504 €)", "39 % (≈728 €)", "55 % (≈1 027 €)"],
            ["18-20 ans", "43 % (≈803 €)", "51 % (≈952 €)", "67 % (≈1 251 €)"],
            ["21-25 ans", "53 % (≈990 €)", "61 % (≈1 139 €)", "78 % (≈1 456 €)"],
            ["26 ans et plus", "100 % du SMIC (toutes années)", "—", "—"],
          ],
        },
      },
      {
        heading: "La durée",
        paragraphs: [
          "Un stage est limité à 6 mois (924 heures de présence) par entreprise sur une même année scolaire ou universitaire.",
          "Un contrat d'apprentissage dure généralement de 6 mois à 3 ans selon le diplôme visé (jusqu'à 4 ans en cas d'aménagement pour handicap).",
        ],
      },
      {
        heading: "Les autres droits",
        table: {
          headers: ["", "Stage", "Alternance"],
          rows: [
            ["Congés payés", "Pas de droit légal (autorisations d'absence au-delà de 2 mois)", "Oui, comme tout salarié (2,5 jours/mois)"],
            ["Droit au chômage en fin de contrat", "Non (statut non-salarié)", "Oui, sous les conditions habituelles"],
            ["Mutuelle d'entreprise", "Non obligatoire", "Obligatoire, comme tout salarié"],
            ["Tickets-restaurant", "Selon la politique de l'entreprise", "Comme tout salarié de l'entreprise"],
          ],
        },
        paragraphs: [
          "Les pourcentages et seuils ci-dessus sont stables depuis plusieurs années mais peuvent évoluer : vérifie toujours le barème en vigueur sur service-public.fr avant de signer un contrat.",
        ],
      },
    ],
    faq: [
      {
        q: "Un stage peut-il être payé plus que le minimum légal ?",
        a: "Oui, le montant de 4,50 €/heure (2026) est un plancher légal : l'entreprise peut proposer une gratification plus élevée, c'est même fréquent dans certains secteurs (tech, finance).",
      },
      {
        q: "Combien gagne un apprenti de 20 ans en 2e année ?",
        a: "Environ 952 €/mois brut (51 % du SMIC 2026), sauf si un accord de branche ou l'entreprise prévoit mieux.",
      },
      {
        q: "Le stage donne-t-il droit au chômage à la fin ?",
        a: "Non : le stagiaire n'étant pas salarié, il ne cotise pas à l'assurance chômage et n'a donc aucun droit à l'allocation chômage en fin de stage. C'est l'alternant, salarié, qui peut y avoir droit.",
      },
      {
        q: "Peut-on passer d'un stage à une alternance dans la même entreprise ?",
        a: "Oui, c'est même un cas fréquent : rien n'empêche une entreprise de proposer un contrat d'apprentissage à un ancien stagiaire si le poste et le diplôme visé s'y prêtent.",
      },
    ],
    sources: [
      { label: "SMIC 2026 (info.gouv.fr)", url: "https://www.info.gouv.fr/public/index.php/actualite/le-smic-revalorise-le-1er-juin-2026" },
      { label: "Durée maximale d'un stage (justice.fr)", url: "https://www.justice.fr/fiche/stage-etudiant-milieu-professionnel" },
      { label: "Rémunération de l'apprenti (DREETS)", url: "https://nouvelle-aquitaine.dreets.gouv.fr/sites/nouvelle-aquitaine.dreets.gouv.fr/IMG/pdf/depliant_remuneration_apprenti.pdf" },
    ],
  },
  {
    slug: "trouver-une-alternance",
    title: "Comment trouver une alternance rapidement : le guide étape par étape",
    metaDescription:
      "Quand commencer, où chercher, comment relancer : la méthode concrète pour trouver une alternance plus vite, étape par étape.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    related: ["quand-chercher-son-alternance", "alternance-sans-entreprise", "trouver-alternance-linkedin", "candidature-spontanee-alternance"],
    intro: [
      "Trouver une entreprise pour une alternance prend en moyenne plusieurs semaines, parfois plusieurs mois -- mais la méthode compte autant que le nombre de candidatures envoyées. Voici comment t'organiser.",
    ],
    sections: [
      {
        heading: "Quand commencer à chercher",
        paragraphs: [
          "Le plus tôt possible, idéalement 3 à 6 mois avant la rentrée visée. Les entreprises recrutent leurs alternants en continu toute l'année, mais le volume d'offres augmente nettement entre le printemps et l'été, avant la rentrée de septembre. Commencer en janvier-février pour une rentrée en septembre te laisse le temps de rater des entretiens, ajuster ton CV et retenter sans stress de dernière minute.",
        ],
      },
      {
        heading: "Cibler les bons secteurs et métiers",
        paragraphs: [
          "Candidater à tout et n'importe quoi dilue ton énergie et se voit dans tes lettres de motivation. Mieux vaut cibler 2-3 secteurs ou métiers précis, quitte à élargir la zone géographique ou la taille d'entreprise plutôt que le métier lui-même.",
        ],
      },
      {
        heading: "Préparer son dossier avant de candidater",
        paragraphs: [
          "Un CV et une lettre de motivation réutilisables (mais jamais identiques d'une candidature à l'autre) te font gagner un temps précieux une fois les bonnes offres repérées. Voir nos guides dédiés : CV pour une alternance et lettre de motivation pour une alternance.",
        ],
      },
      {
        heading: "Multiplier les canaux",
        list: [
          "Jobboards spécialisés et plateformes comme Stageio, qui centralisent les offres de plusieurs sources (recruteurs, agrégateurs, jobboards publics) et les trie selon ton profil.",
          "Le réseau : CFA/école, anciens élèves, LinkedIn -- une bonne partie des alternances se décident encore sur recommandation.",
          "La candidature spontanée auprès d'entreprises qui n'ont pas forcément publié d'offre mais recrutent des alternants chaque année.",
        ],
      },
      {
        heading: "Relancer sans se décourager",
        paragraphs: [
          "Une absence de réponse après 1-2 semaines n'est presque jamais un refus déguisé -- un mail de relance poli, court, et qui réaffirme ta motivation suffit souvent à remonter en haut de la pile.",
        ],
      },
      {
        heading: "Aller plus vite avec Stageio",
        paragraphs: [
          "Stageio centralise les offres d'alternance et de stage de plusieurs sources et les classe selon ton profil (secteur, métier visé, ville, compétences) : tu swipes les offres pertinentes au lieu de parcourir des dizaines de jobboards un par un, et tu peux candidater directement.",
        ],
      },
    ],
    faq: [
      {
        q: "Quand commencer à chercher son alternance ?",
        a: "3 à 6 mois avant la rentrée visée, idéalement entre janvier et avril pour une rentrée en septembre.",
      },
      {
        q: "Combien de candidatures faut-il envoyer en moyenne ?",
        a: "Il n'y a pas de chiffre universel -- cela dépend du secteur et de la zone géographique -- mais mieux vaut 15 candidatures ciblées et personnalisées que 100 envoyées sans distinction.",
      },
      {
        q: "Faut-il avoir trouvé une entreprise avant de s'inscrire en CFA ?",
        a: "Ça dépend du CFA : certains exigent un contrat signé à l'inscription, d'autres t'inscrivent sous réserve et te laissent quelques mois pour trouver l'entreprise. Vérifie directement avec l'établissement visé.",
      },
    ],
  },
  {
    slug: "cv-alternance",
    title: "CV pour une alternance : structure, exemple et erreurs à éviter",
    metaDescription:
      "La structure d'un CV d'alternance qui retient l'attention, même sans expérience, et les erreurs qui l'éliminent direct.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    intro: [
      "Un recruteur passe en moyenne moins d'une minute sur un premier CV. Pour une alternance, où la plupart des candidats ont peu ou pas d'expérience professionnelle, la structure compte autant que le contenu.",
    ],
    sections: [
      {
        heading: "La structure qui fonctionne",
        list: [
          "En-tête : nom, formation visée, ville, contact -- pas de photo obligatoire, pas de date de naissance.",
          "Formation : dans l'ordre antichronologique (la plus récente en premier), avec l'établissement et l'année.",
          "Expériences (stages, jobs étudiants, projets d'école) : chacune avec 2-3 lignes concrètes, pas une simple liste de tâches.",
          "Compétences : outils, logiciels, langues -- niveau indiqué honnêtement.",
          "Centres d'intérêt : seulement s'ils disent quelque chose de toi (une asso, un projet perso), jamais pour remplir la page.",
        ],
      },
      {
        heading: "Pas d'expérience professionnelle ? Ce qui compte quand même",
        paragraphs: [
          "Les projets scolaires, les jobs d'été, le bénévolat associatif, un BAFA, une mobilité étudiante à l'étranger : tout ce qui montre une compétence transférable (organisation, travail en équipe, autonomie) a sa place sur un CV d'alternance, à condition d'être formulé en termes de résultat ou de responsabilité plutôt que de simple présence.",
        ],
      },
      {
        heading: "Les erreurs qui éliminent un CV direct",
        list: [
          "Plus d'une page (sauf profil très senior en reconversion).",
          "Des fautes d'orthographe -- le détail le plus facile à corriger et le plus souvent négligé.",
          "Une adresse email peu professionnelle.",
          "Des descriptions de tâches génériques (« assistanat administratif ») sans aucun résultat ou contexte chiffré.",
          "Un titre de CV absent ou flou : indique clairement le poste/la formation visée en haut de page.",
        ],
      },
      {
        heading: "Et après le CV ?",
        paragraphs: [
          "Un bon CV ne suffit pas sans une lettre de motivation qui le complète plutôt que de le répéter -- voir notre guide lettre de motivation pour une alternance. Sur Stageio, l'abonnement Premium inclut aussi un audit de CV noté sur 100, qui pointe précisément ce qui bloque sur ton CV avant que tu l'envoies.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une photo sur un CV d'alternance en France ?",
        a: "Non, ce n'est pas obligatoire et de plus en plus d'entreprises la déconseillent pour éviter toute discrimination à la sélection. Un CV sans photo est parfaitement normal.",
      },
      {
        q: "Un CV d'une page, c'est vraiment obligatoire ?",
        a: "Ce n'est pas une règle légale, mais une norme très largement suivie pour un profil junior : au-delà d'une page, le risque est que l'essentiel se dilue et que le CV soit survolé plutôt que lu.",
      },
    ],
  },
  {
    slug: "lettre-de-motivation-alternance",
    title: "Lettre de motivation pour une alternance : exemple et méthode",
    metaDescription:
      "La structure en 3 paragraphes, les phrases à bannir, et comment personnaliser chaque lettre de motivation sans tout réécrire à chaque fois.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    intro: [
      "Une bonne lettre de motivation pour une alternance ne répète pas le CV : elle explique pourquoi CETTE entreprise, pour CE poste, et relie 2-3 éléments concrets du profil du candidat à ce que l'offre demande vraiment.",
    ],
    sections: [
      {
        heading: "La structure en 3 paragraphes",
        list: [
          "1er paragraphe : référence précise au poste et à l'entreprise (jamais une accroche interchangeable d'une lettre à l'autre) -- dis explicitement si c'est une alternance ou un stage et pourquoi ce choix.",
          "2e paragraphe : 2 à 3 exigences concrètes de l'offre, chacune reliée à un élément réel du profil (une compétence, une ligne du CV, une formation) -- jamais une affirmation générique non justifiée juste après.",
          "3e paragraphe : la motivation pour l'entreprise spécifiquement (pas « le secteur » en général), et une formule de politesse simple.",
        ],
      },
      {
        heading: "Les phrases à bannir",
        paragraphs: [
          "« Je suis très motivé(e) et rigoureux(se) » ou « cette offre correspond parfaitement à mon projet » : ces formules ne veulent rien dire tant qu'elles ne sont pas immédiatement suivies d'une preuve concrète. Sans preuve juste après, elles affaiblissent la lettre plutôt que de la renforcer.",
        ],
      },
      {
        heading: "Personnaliser sans tout réécrire",
        paragraphs: [
          "Garde une trame fixe (les 3 paragraphes ci-dessus) et change uniquement : le nom de l'entreprise et du poste, les 2-3 exigences ciblées dans le 2e paragraphe, et une phrase sur ce qui motive spécifiquement pour cette entreprise. Le reste (ta formation, tes compétences clés) reste stable d'une candidature à l'autre.",
        ],
      },
      {
        heading: "Longueur recommandée",
        paragraphs: [
          "170 à 240 mots suffisent largement pour une alternance ou un stage -- au-delà, le risque est que la lettre ne soit pas lue en entier.",
        ],
      },
      {
        heading: "Gagner du temps avec l'IA",
        paragraphs: [
          "L'abonnement Premium de Stageio inclut une génération de lettre de motivation par IA : elle reprend exactement cette structure (accroche précise, exigences reliées au profil, formule de politesse, 170-240 mots), personnalisée à partir de ton profil et du CV, pour chaque offre.",
        ],
      },
    ],
    faq: [
      {
        q: "Faut-il une lettre de motivation différente pour chaque offre ?",
        a: "Oui pour le contenu (les exigences ciblées et la motivation pour l'entreprise), mais pas besoin de tout réécrire : garder une trame fixe et n'ajuster que 2-3 éléments par lettre suffit.",
      },
      {
        q: "Quelle longueur pour une lettre de motivation d'alternance ?",
        a: "170 à 240 mots est une longueur qui se lit en entier sans se diluer -- une lettre trop longue risque d'être survolée plutôt que lue.",
      },
    ],
  },
  ...MORE_GUIDES,
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

// Rubriques de la page /guides. Un guide absent de ces listes s'affiche quand
// même, dans « Autres guides » : en ajouter un ne peut pas le faire disparaître.
export const GUIDE_CATEGORIES: { title: string; slugs: string[] }[] = [
  {
    title: "Trouver une alternance ou un stage",
    slugs: [
      "alternance-vs-stage",
      "trouver-une-alternance",
      "je-ne-trouve-pas-d-alternance",
      "sites-pour-trouver-une-alternance",
      "la-bonne-alternance",
      "trouver-un-stage",
      "quand-chercher-son-alternance",
      "rentree-decalee-alternance",
      "alternance-sans-entreprise",
      "alternance-sans-le-bac",
      "trouver-alternance-linkedin",
      "candidature-spontanee-alternance",
      "aides-embauche-apprenti",
      "choisir-son-ecole-en-alternance",
      "parcoursup-alternance",
      "alternance-a-distance",
      "bts-bachelor-master-alternance",
      "stage-de-fin-d-etudes",
      "stage-a-l-etranger",
      "stage-de-seconde",
      "stage-de-3e",
      "annee-de-cesure",
      "alternance-fonction-publique",
      "aide-soignant-alternance",
      "educateur-specialise-apprentissage",
    ],
  },
  {
    title: "CV, lettre et candidature",
    slugs: [
      "cv-alternance",
      "cv-stage",
      "soft-skills-cv",
      "profil-linkedin-etudiant",
      "lettre-de-motivation-alternance",
      "lettre-de-motivation-stage",
      "lettre-de-motivation-chatgpt",
      "mail-candidature-stage-alternance",
      "relancer-candidature",
    ],
  },
  {
    title: "Entretien",
    slugs: [
      "entretien-alternance",
      "entretien-de-stage",
      "se-presenter-en-entretien",
      "questions-a-poser-en-entretien",
      "mail-de-remerciement",
      "refuser-une-offre",
    ],
  },
  {
    title: "Tes droits : contrat, salaire, aides",
    slugs: [
      "contrat-apprentissage-ou-contrat-pro",
      "alternance-age-limite",
      "periode-essai-alternance",
      "rupture-contrat-apprentissage",
      "aides-alternants",
      "conges-alternant",
      "gratification-de-stage",
      "convention-de-stage",
      "chomage-fin-alternance",
      "logement-alternance-stage",
      "impots-alternant",
      "bourse-et-alternance",
      "transport-alternance-stage",
      "temps-de-travail-apprenti",
      "arret-maladie-alternance",
      "carte-etudiant-des-metiers",
    ],
  },
  {
    title: "Pendant et après",
    slugs: ["premier-jour-en-entreprise", "maitre-d-apprentissage", "rythme-alternance", "alternance-deux-villes", "rapport-de-stage", "soutenance-de-stage", "attestation-de-stage", "cdi-apres-alternance"],
  },
];
