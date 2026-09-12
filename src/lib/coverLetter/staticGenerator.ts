import type { Offer, Profile } from "@/types/database";

// Générateur de lettre de motivation entièrement statique -- ZÉRO appel IA.
// Remplace l'ancienne version Mistral (src/lib/mistral/generateCoverLetter.ts,
// conservée mais plus utilisée) suite à la panne de quota Mistral (429
// persistant depuis le 4 septembre) qui rendait la fonctionnalité Premium
// phare totalement indisponible -- cause directe de mauvais avis et de
// churn. Même logique que le simulateur d'entretien (voir
// src/lib/interview/questionBank.ts) : du contenu écrit à la main, assemblé
// par templating, plutôt qu'une dépendance externe qui peut tomber en panne
// sans qu'on y puisse rien.
//
// Architecture par blocs combinables (accroche / paragraphe de fit /
// réalisation / pourquoi cette entreprise / formule de politesse) plutôt que
// des lettres entières pré-écrites : quelques dizaines de blocs courts par
// famille suffisent à produire, une fois combinés, plusieurs milliers de
// lettres réellement différentes -- une variété honnête (vraie combinatoire,
// pas un chiffre gonflé) sans avoir à rédiger des centaines de lettres
// complètes.

export type CoverLetterExtra = {
  achievement?: string;
  whyCompany?: string;
};

type OfferInput = Pick<Offer, "title" | "company" | "description" | "requirements" | "contract_type">;
type ProfileInput = Pick<
  Profile,
  "full_name" | "city" | "skills" | "sectors" | "target_jobs" | "education_level" | "formation" | "experience_level"
> | null;

type LetterFamily =
  | "tech"
  | "business"
  | "rh_admin"
  | "terrain"
  | "sante_social"
  | "creatif"
  | "tourisme"
  | "education"
  | "generaliste";

// Couvre les ~125 secteurs de src/lib/onboarding/options.ts -- tout secteur
// non listé (ou absent) retombe sur "generaliste", jamais une erreur.
const FAMILY_BY_SECTOR: Record<string, LetterFamily> = {
  "Aéronautique": "tech",
  "Automobile": "tech",
  "Biologie": "tech",
  "Biotechnologie": "tech",
  "Blockchain et Web3": "tech",
  "Chimie": "tech",
  "Cybersécurité": "tech",
  "Data": "tech",
  "Développement durable": "tech",
  "Électronique": "tech",
  "Énergie": "tech",
  "Esport": "tech",
  "Industrie": "tech",
  "Informatique": "tech",
  "Ingénierie": "tech",
  "Intelligence artificielle": "tech",
  "Jeux vidéo": "tech",
  "Mécanique": "tech",
  "Qualité": "tech",
  "Recherche scientifique": "tech",
  "Réseaux et télécoms": "tech",

  "Achats": "business",
  "Assurance": "business",
  "Banque": "business",
  "Commerce": "business",
  "Communication": "business",
  "Comptabilité": "business",
  "Conseil": "business",
  "Distribution": "business",
  "E-commerce": "business",
  "Finance": "business",
  "Franchise": "business",
  "Gestion de projet": "business",
  "Grande distribution": "business",
  "Import-export": "business",
  "Marketing": "business",
  "Produit": "business",
  "Publicité": "business",
  "Statistiques et actuariat": "business",
  "Vente": "business",

  "Administration publique": "rh_admin",
  "Armée et défense": "rh_admin",
  "Diplomatie et international": "rh_admin",
  "Douanes": "rh_admin",
  "Fonction publique": "rh_admin",
  "Juridique et droit": "rh_admin",
  "Notariat": "rh_admin",
  "Police et sécurité civile": "rh_admin",
  "Politique": "rh_admin",
  "Pompiers": "rh_admin",
  "RH": "rh_admin",
  "Sécurité": "rh_admin",
  "Sécurité incendie": "rh_admin",
  "Urbanisme": "rh_admin",

  "Agriculture": "terrain",
  "Agroalimentaire": "terrain",
  "Ambulance et secours": "terrain",
  "Artisanat": "terrain",
  "BTP": "terrain",
  "Horticulture": "terrain",
  "Logistique et transport": "terrain",
  "Maintenance": "terrain",
  "Nettoyage et propreté": "terrain",
  "Paysagisme": "terrain",
  "Pêche": "terrain",
  "Sylviculture et forêt": "terrain",
  "Textile": "terrain",
  "Viticulture et œnologie": "terrain",

  "Aide à domicile": "sante_social",
  "Humanitaire et ONG": "sante_social",
  "Kinésithérapie": "sante_social",
  "Nutrition et diététique": "sante_social",
  "Optique": "sante_social",
  "Petite enfance": "sante_social",
  "Pharmacie": "sante_social",
  "Psychologie": "sante_social",
  "Santé": "sante_social",
  "Social et action sociale": "sante_social",
  "Travail social": "sante_social",
  "Vétérinaire": "sante_social",

  "Art": "creatif",
  "Audiovisuel": "creatif",
  "Bibliothèque et documentation": "creatif",
  "Bijouterie et joaillerie": "creatif",
  "Cinéma": "creatif",
  "Décoration et ameublement": "creatif",
  "Design": "creatif",
  "Édition et livre": "creatif",
  "Horlogerie": "creatif",
  "Journalisme et presse": "creatif",
  "Luxe": "creatif",
  "Mode": "creatif",
  "Musique": "creatif",
  "Photographie": "creatif",
  "Radio": "creatif",
  "Télévision": "creatif",
  "Traduction et interprétariat": "creatif",

  "Animation": "tourisme",
  "Beauté et esthétique": "tourisme",
  "Coiffure": "tourisme",
  "Événementiel": "tourisme",
  "Hôtellerie": "tourisme",
  "Restauration": "tourisme",
  "Restauration collective": "tourisme",
  "Sommellerie": "tourisme",
  "Sport": "tourisme",
  "Tourisme": "tourisme",
  "Yoga et bien-être": "tourisme",

  "Éducation et formation": "education",
  "Enseignement": "education",
};

function familyForSector(sector: string | null | undefined): LetterFamily {
  if (!sector) return "generaliste";
  return FAMILY_BY_SECTOR[sector] ?? "generaliste";
}

// \b ne marche pas bien avec les accents français -- même approche que
// containsWholeWord dans src/lib/matching/score.ts (dupliquée ici en version
// minimale plutôt que de faire dépendre ce module, orienté contenu, d'un
// module de scoring qui n'exporte pas cette fonction).
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`, "iu");
  return pattern.test(haystack);
}

type FamilyContent = {
  openers: string[];
  fitWithSkill: string[];
  fitFallback: string[];
  achievementLines: string[];
  whyCompanyLines: string[];
  closings: string[];
};

// Choix pseudo-aléatoire déterministe, sans répétition avant d'avoir épuisé
// tout le pool. Un simple `pick()` avec Math.random() indépendant à chaque
// appel donne des collisions bien plus vite qu'on ne l'imagine (paradoxe des
// anniversaires) -- avec 4-5 blocs à choisir parmi 5-6 options, deux lettres
// quasi identiques peuvent réapparaître en une dizaine de clics sur
// "Régénérer", ce qui casse instantanément l'illusion de variété. Ici,
// chaque bloc suit un ordre mélangé mais fixe (dérivé d'une graine stable
// par offre) : les N options défilent chacune une fois avant qu'une seule
// ne repasse, et un nouveau mélange (différent) démarre à chaque cycle
// complet -- pas de retour à l'identique même après plusieurs dizaines de
// générations.
function seededHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickNoRepeat<T>(arr: T[], seedKey: string, attempt: number): T {
  if (arr.length === 1) return arr[0];
  const cycle = Math.floor(attempt / arr.length);
  const posInCycle = attempt % arr.length;
  const shuffled = seededShuffle(arr, seededHash(seedKey) + cycle * 7919);
  return shuffled[posInCycle];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

const CONTENT: Record<LetterFamily, FamilyContent> = {
  tech: {
    openers: [
      "Votre offre de {{contrat}} {{poste}} chez {{entreprise}} a immédiatement retenu mon attention : c'est exactement le type de poste technique sur lequel je veux progresser.",
      "C'est avec un vrai intérêt technique que je candidate au poste de {{poste}} en {{contrat}} au sein de {{entreprise}}.",
      "Je me permets de vous adresser ma candidature pour le poste de {{poste}} ({{contrat}}) chez {{entreprise}}, un environnement qui correspond précisément à ce que je recherche.",
      "Votre annonce pour un poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond directement à mon projet professionnel.",
      "Curieux(se) de nature et attiré(e) par les défis techniques, j'ai repéré votre offre de {{poste}} en {{contrat}} chez {{entreprise}} avec un vrai intérêt.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi l'occasion de mettre mes compétences techniques au service de projets concrets.",
      "Passionné(e) par les sujets techniques, je candidate avec enthousiasme au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Toujours en veille sur les nouvelles technologies, j'ai repéré votre offre de {{poste}} en {{contrat}} chez {{entreprise}} avec un vrai enthousiasme.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au type de défi technique sur lequel je veux me former sérieusement.",
      "C'est en tombant sur votre offre de {{poste}} en {{contrat}} que j'ai immédiatement pensé que {{entreprise}} correspondait à ce que je cherche.",
      "Autodidacte et méthodique, je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous écris pour candidater au poste de {{poste}} en {{contrat}} : {{entreprise}} est exactement le type de structure technique où je veux apprendre.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée concrètement et que je saurais mobiliser rapidement sur vos projets.",
      "Ayant travaillé sur {{skill}}, je pense pouvoir apporter une contribution technique immédiate sur ce poste.",
      "Ma pratique de {{skill}} me semble directement en phase avec les besoins exprimés dans votre offre.",
      "Je pratique régulièrement {{skill}}, un point qui correspond précisément à ce que vous recherchez pour ce poste.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences sur lesquelles j'ai déjà une vraie pratique.",
      "Curieux(se) des nouvelles technologies, j'ai notamment approfondi {{skill}}, directement utile pour ce poste.",
      "J'ai déjà eu l'occasion d'utiliser {{skill}} sur des projets concrets, ce qui me permettrait d'être opérationnel(le) rapidement.",
      "{{skill}} fait partie des compétences que je continue à approfondir activement, et qui correspond exactement à votre besoin.",
      "Je me suis formé(e) sérieusement à {{skill}}, un point clé de votre offre que je saurais mobiliser dès mon arrivée.",
      "Votre besoin en {{skill}} rejoint précisément ce sur quoi je me suis entraîné(e) ces derniers mois.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une base technique solide que je suis prêt à mettre au service de vos équipes dès le premier jour.",
      "Mon parcours en {{formation}} m'a habitué à résoudre des problèmes concrets, exactement l'état d'esprit que je compte apporter à ce poste.",
      "Grâce à ma formation ({{formation}}), j'ai développé une vraie rigueur technique que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'aime comprendre en profondeur les systèmes avant d'intervenir dessus.",
      "Même sans expérience professionnelle directe, ma formation ({{formation}}) m'a donné les fondamentaux techniques nécessaires pour progresser vite sur ce poste.",
      "Ma formation ({{formation}}) m'a surtout appris à apprendre vite, une qualité essentielle pour m'adapter rapidement à vos outils et méthodes.",
      "Issu(e) d'une formation en {{formation}}, je suis à l'aise pour monter en compétence rapidement sur de nouveaux sujets techniques.",
      "Ma formation ({{formation}}) a été l'occasion de développer une vraie logique de résolution de problèmes, transposable à ce poste.",
    ],
    achievementLines: [
      "Pour vous donner un exemple concret : {{achievement}}",
      "À titre d'illustration, {{achievement}}",
      "Un exemple qui illustre bien mon approche technique : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'ai particulièrement retenu cette expérience : {{achievement}}",
      "Cela illustre bien ma façon de travailler : {{achievement}}",
      "Un projet représentatif de mon approche technique : {{achievement}}",
      "Concrètement, {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'intéresse en particulier parce que {{whyCompany}}",
      "Ce qui me motive chez {{entreprise}} : {{whyCompany}}",
      "Je souhaite rejoindre {{entreprise}} notamment parce que {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre approche technique m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à l'environnement technique que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je serais ravi(e) d'échanger avec vous pour vous présenter plus en détail ma motivation et mes compétences techniques.",
      "Disponible rapidement, je me tiens à votre disposition pour un entretien technique quand vous le souhaitez.",
      "Je reste à votre disposition pour toute question et espère avoir l'opportunité d'en discuter de vive voix.",
      "Je serais heureux(se) de vous démontrer concrètement mes compétences techniques lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste disponible pour un entretien technique, à distance ou sur place, quand cela vous conviendra.",
      "Je serais très heureux(se) de pouvoir échanger avec votre équipe technique sur mes compétences et ma motivation.",
      "N'hésitez pas à me contacter pour organiser un entretien ou un test technique, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question technique complémentaire.",
    ],
  },

  business: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au poste que je recherche pour développer mes compétences commerciales.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je souhaite vous proposer ma candidature pour le poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : {{entreprise}} est un environnement dans lequel je souhaite évoluer.",
      "Toujours à la recherche de nouveaux défis commerciaux, j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi une belle opportunité de développer mes compétences business.",
      "Dynamique et orienté(e) résultats, je candidate avec motivation au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "J'ai suivi le développement de {{entreprise}} avec attention, et votre offre de {{poste}} en {{contrat}} arrive au bon moment dans mon projet professionnel.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au type de responsabilité business que je veux prendre.",
      "Orienté(e) objectifs et à l'aise avec les chiffres, je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond exactement à l'environnement business que je recherche.",
      "C'est avec ambition que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}, une entreprise dont je partage les valeurs.",
    ],
    fitWithSkill: [
      "Votre offre demande {{skill}} : c'est une compétence que j'ai déjà mise en pratique et que je sais transformer en résultats concrets.",
      "Je maîtrise {{skill}}, un point directement en lien avec les priorités de ce poste.",
      "Ma pratique de {{skill}} me permettrait de contribuer rapidement aux objectifs de votre équipe.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences sur lesquelles j'ai déjà de l'expérience concrète.",
      "Je pratique régulièrement {{skill}}, un atout que je saurais mettre au service de vos objectifs commerciaux.",
      "Ayant déjà mis en pratique {{skill}}, je sais l'utiliser pour atteindre des objectifs concrets.",
      "{{skill}} fait partie des compétences que j'ai développées en priorité, exactement ce que demande votre offre.",
      "J'ai déjà généré des résultats concrets grâce à {{skill}}, un point sur lequel je peux rapidement être utile à votre équipe.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué dans mes précédentes expériences.",
      "Je me suis particulièrement investi(e) sur {{skill}}, une compétence directement transposable à vos enjeux commerciaux.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a apporté une vraie culture du résultat, un atout que je compte mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris à comprendre les enjeux business avant d'agir, exactement l'approche que je veux appliquer sur ce poste.",
      "Grâce à ma formation ({{formation}}), j'ai développé un vrai sens du résultat que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'ai appris à allier écoute client et sens commercial.",
      "Ma formation ({{formation}}) m'a donné de solides bases pour comprendre rapidement les enjeux commerciaux d'un poste comme celui-ci.",
      "Issu(e) d'une formation en {{formation}}, j'ai développé une vraie capacité à convaincre et à argumenter avec méthode.",
      "Mon parcours en {{formation}} m'a habitué(e) à travailler avec des objectifs chiffrés à atteindre.",
      "Ma formation ({{formation}}) a renforcé mon sens de l'écoute client, une qualité essentielle pour ce type de poste.",
    ],
    achievementLines: [
      "Pour donner un exemple concret : {{achievement}}",
      "À titre d'illustration de mon engagement : {{achievement}}",
      "Un exemple qui illustre bien mon sens du résultat : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier un exemple : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Un résultat dont je suis particulièrement fier(ère) : {{achievement}}",
      "Cela s'illustre bien par cette expérience : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'attire particulièrement parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Je souhaite rejoindre {{entreprise}} notamment parce que {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre positionnement sur le marché m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à l'environnement business que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je serais heureux(se) de vous rencontrer pour discuter de ma motivation et de ce que je peux apporter à votre équipe.",
      "Disponible rapidement, je reste à votre disposition pour un entretien.",
      "J'espère avoir l'opportunité d'échanger avec vous prochainement.",
      "Je serais ravi(e) de vous démontrer concrètement ma motivation lors d'un entretien.",
      "N'hésitez pas à me contacter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste à votre disposition pour un entretien, en présentiel ou à distance, selon vos disponibilités.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur mes objectifs et ma motivation commerciale.",
      "N'hésitez pas à me solliciter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },

  rh_admin: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément au poste que je recherche.",
      "C'est avec sérieux et motivation que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : elle correspond à mes attentes et à ma rigueur de travail.",
      "Rigoureux(se) et organisé(e), j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) correspond précisément au cadre de travail structuré que je recherche.",
      "C'est avec application et sérieux que je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "J'ai pris connaissance avec intérêt de votre offre de {{poste}} en {{contrat}} : elle correspond précisément au cadre structuré que je recherche chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au type de mission administrative sur lequel je veux m'investir.",
      "Consciencieux(se) et fiable, je candidate avec sérieux au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec conviction pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à l'environnement rigoureux que je recherche.",
      "C'est avec un vrai respect pour le cadre institutionnel que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais appliquer avec la rigueur attendue sur ce type de poste.",
      "Je pratique {{skill}}, un point directement utile pour les missions décrites dans votre offre.",
      "Ma maîtrise de {{skill}} correspond aux exigences précises de ce poste.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà eu l'occasion de mettre en pratique.",
      "Je maîtrise {{skill}}, un savoir-faire directement transposable aux missions de ce poste.",
      "Ayant déjà pratiqué {{skill}} dans un cadre exigeant, je saurais l'appliquer avec la même rigueur ici.",
      "{{skill}} fait partie des compétences que j'ai développées avec le plus de sérieux, en phase directe avec votre offre.",
      "J'ai déjà mobilisé {{skill}} dans un contexte réglementé, ce qui me permettrait d'être rapidement fiable sur ce poste.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué avec rigueur par le passé.",
      "Je me suis particulièrement formé(e) à {{skill}}, une compétence directement utile aux missions décrites.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a apporté rigueur et sens de l'organisation, des qualités essentielles pour ce type de mission.",
      "Mon parcours en {{formation}} m'a habitué à respecter des procédures précises tout en gardant un vrai sens du service.",
      "Grâce à ma formation ({{formation}}), j'ai développé une rigueur méthodique que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'accorde une grande importance à la précision et au respect des procédures.",
      "Ma formation ({{formation}}) m'a donné une vraie culture de la conformité et du travail bien fait.",
      "Issu(e) d'une formation en {{formation}}, je sais gérer des dossiers exigeants avec méthode et discrétion.",
      "Mon parcours en {{formation}} m'a habitué(e) à travailler dans un cadre normé, avec des délais et des règles précises.",
      "Ma formation ({{formation}}) a renforcé ma capacité à traiter des dossiers complexes avec fiabilité.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon sérieux : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
      "Un exemple qui illustre bien ma rigueur : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cet exemple : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une situation représentative de ma méthode de travail : {{achievement}}",
      "Cela s'illustre bien par cette expérience : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Le rôle de {{entreprise}} m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond au cadre de travail que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre entière disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "Je vous remercie par avance de l'examen de ma candidature et reste disponible pour tout complément d'information.",
      "Je serais heureux(se) de vous démontrer mon sérieux lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je vous prie d'agréer l'expression de ma motivation la plus sincère.",
      "Je reste à votre disposition pour un entretien, selon les modalités qui vous conviennent le mieux.",
      "Je serais très honoré(e) de pouvoir échanger avec vous sur ma candidature lors d'un entretien.",
      "N'hésitez pas à me contacter pour tout complément, je reste disponible rapidement.",
      "Je vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    ],
  },

  terrain: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au poste concret que je recherche.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : c'est le type de travail concret qui me motive.",
      "Manuel(le) et rigoureux(se), j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi l'occasion de mettre en pratique un savoir-faire concret.",
      "C'est avec motivation pour le travail de terrain que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre offre de {{poste}} en {{contrat}} correspond exactement au type de mission concrète que je recherche chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au type de travail de terrain qui me motive au quotidien.",
      "Fiable et volontaire, je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond exactement à l'environnement de terrain que je recherche.",
      "C'est avec sérieux et envie de bien faire que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre demande {{skill}}, une compétence pratique que j'ai déjà mise en œuvre sur le terrain.",
      "Je maîtrise {{skill}}, directement utile pour les missions de ce poste.",
      "Ma pratique de {{skill}} me permettrait d'être rapidement opérationnel(le) chez vous.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des savoir-faire que j'ai déjà pratiqués concrètement.",
      "Je pratique {{skill}} régulièrement, un atout directement applicable aux missions de ce poste.",
      "Ayant déjà mis en œuvre {{skill}} sur le terrain, je serais rapidement opérationnel(le).",
      "{{skill}} fait partie des savoir-faire que je maîtrise le mieux, en phase directe avec votre besoin.",
      "J'ai déjà utilisé {{skill}} dans des conditions réelles, ce qui me permettrait d'être efficace dès mon arrivée.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué sur mes précédentes missions.",
      "Je me suis particulièrement entraîné(e) sur {{skill}}, un savoir-faire directement utile aux missions décrites.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné les bases pratiques nécessaires pour être efficace rapidement sur le terrain.",
      "Mon parcours en {{formation}} m'a appris à être fiable et rigoureux(se) dans un travail concret, au quotidien.",
      "Grâce à ma formation ({{formation}}), j'ai acquis des bases pratiques solides que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'aime le travail bien fait et le concret du terrain.",
      "Ma formation ({{formation}}) m'a donné le goût du travail bien exécuté, dans le respect des consignes de sécurité.",
      "Issu(e) d'une formation en {{formation}}, je sais m'adapter rapidement aux exigences physiques et pratiques du terrain.",
      "Mon parcours en {{formation}} m'a habitué(e) à travailler en équipe dans des conditions parfois exigeantes.",
      "Ma formation ({{formation}}) a renforcé ma capacité à suivre des procédures précises sur le terrain.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon savoir-faire : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
      "Un exemple qui illustre bien mon savoir-faire pratique : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cette expérience : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une mission représentative de mon savoir-faire : {{achievement}}",
      "Cela s'illustre bien par cette expérience de terrain : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre savoir-faire m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à l'environnement de terrain que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Disponible rapidement, je me tiens à votre disposition pour un entretien.",
      "Je reste à votre disposition pour échanger de vive voix sur ma candidature.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
      "Je serais heureux(se) de vous démontrer concrètement mon savoir-faire lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste disponible pour un entretien ou une période d'essai sur le terrain, selon vos besoins.",
      "Je serais très heureux(se) de vous rencontrer pour vous montrer ma motivation de vive voix.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },

  sante_social: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément à mon projet professionnel.",
      "C'est avec un vrai engagement humain que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : accompagner des personnes concrètement est ce qui me motive.",
      "Empathique et à l'écoute, j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi une belle occasion de m'investir humainement.",
      "C'est avec un vrai sens du service que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre offre de {{poste}} en {{contrat}} correspond exactement au type d'accompagnement humain que je veux exercer chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'engagement humain que je veux mettre au service des autres.",
      "Bienveillant(e) et patient(e), je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec sincérité pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à mes valeurs d'accompagnement.",
      "C'est avec un vrai désir d'aider que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble essentielle pour ce type d'accompagnement.",
      "Je pratique {{skill}}, directement utile pour les missions décrites dans votre offre.",
      "Ma maîtrise de {{skill}} correspond bien aux besoins exprimés dans votre annonce.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà mises en pratique auprès de personnes accompagnées.",
      "Je pratique {{skill}} régulièrement, un atout directement utile pour ce type de mission.",
      "Ayant déjà accompagné des personnes en mettant en pratique {{skill}}, je saurais m'adapter rapidement.",
      "{{skill}} fait partie des compétences que j'ai développées avec le plus de constance, en phase avec votre besoin.",
      "J'ai déjà mobilisé {{skill}} au contact de personnes accompagnées, ce qui me permettrait d'être vite à l'aise ici.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué dans mes expériences précédentes.",
      "Je me suis particulièrement formé(e) à {{skill}}, une compétence directement utile pour ce type de mission.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a appris l'écoute et la rigueur nécessaires pour accompagner des personnes au quotidien.",
      "Mon parcours en {{formation}} m'a donné une vraie sensibilité humaine, essentielle pour ce type de poste.",
      "Grâce à ma formation ({{formation}}), j'ai développé une écoute et une patience que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'accorde une grande importance à la dignité et au respect de chaque personne accompagnée.",
      "Ma formation ({{formation}}) m'a donné les bases nécessaires pour comprendre les besoins des personnes accompagnées.",
      "Issu(e) d'une formation en {{formation}}, je sais garder mon calme et mon écoute même dans des situations sensibles.",
      "Mon parcours en {{formation}} m'a habitué(e) à travailler en équipe pluridisciplinaire autour d'un même accompagnement.",
      "Ma formation ({{formation}}) a renforcé ma capacité à m'adapter à chaque personne et à sa situation particulière.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon engagement : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
      "Un exemple qui illustre bien mon engagement humain : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cette expérience : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une situation représentative de mon engagement : {{achievement}}",
      "Cela s'illustre bien par cette expérience humaine : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre approche de l'accompagnement m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond aux valeurs humaines que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous présenter ma motivation de vive voix.",
      "Je serais heureux(se) de vous présenter mon engagement humain lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste à votre disposition pour un entretien, quand cela vous conviendra le mieux.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur mon engagement et ma motivation.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },

  creatif: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} a immédiatement retenu mon attention : c'est exactement l'univers créatif dans lequel je veux évoluer.",
      "C'est avec enthousiasme que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} correspond précisément à ce que je recherche : un cadre créatif exigeant.",
      "Créatif(ve) et curieux(se), j'ai repéré avec enthousiasme votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi l'occasion d'exprimer pleinement ma créativité.",
      "C'est avec une vraie sensibilité artistique que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre univers créatif m'inspire particulièrement, et votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à ce que je recherche.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au type de projet créatif sur lequel je veux m'exprimer.",
      "Inventif(ve) et exigeant(e), je candidate avec enthousiasme au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec enthousiasme pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à l'univers créatif que je recherche.",
      "C'est avec une vraie envie de créer que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais mettre au service de vos projets créatifs.",
      "Je maîtrise {{skill}}, directement en lien avec les besoins de ce poste.",
      "Ma pratique de {{skill}} me permettrait d'apporter rapidement une vraie valeur créative à votre équipe.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà pratiquées sur des projets créatifs.",
      "Je pratique {{skill}} régulièrement, un atout que je saurais mettre au service de votre univers créatif.",
      "Ayant déjà expérimenté {{skill}} sur des projets personnels, je saurais l'appliquer à votre univers créatif.",
      "{{skill}} fait partie des compétences que j'ai développées avec le plus de passion, en écho direct à votre offre.",
      "J'ai déjà mis en œuvre {{skill}} sur des projets concrets, ce qui me permettrait d'apporter une vraie valeur ajoutée.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai exploré dans mes créations précédentes.",
      "Je me suis particulièrement perfectionné(e) en {{skill}}, une compétence directement utile à votre univers créatif.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une vraie sensibilité créative que je souhaite mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris à allier créativité et rigueur, un équilibre essentiel pour ce poste.",
      "Grâce à ma formation ({{formation}}), j'ai développé un vrai regard créatif que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'aime explorer différentes pistes créatives avant de trancher.",
      "Ma formation ({{formation}}) m'a donné les bases techniques nécessaires pour transformer une idée en projet concret.",
      "Issu(e) d'une formation en {{formation}}, j'aime remettre en question mes idées pour aller plus loin.",
      "Mon parcours en {{formation}} m'a habitué(e) à recevoir et intégrer des retours critiques sur mon travail.",
      "Ma formation ({{formation}}) a renforcé ma curiosité et mon envie de sortir des sentiers battus.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon travail : {{achievement}}",
      "À titre d'illustration de ma créativité : {{achievement}}",
      "Un exemple qui illustre bien mon univers créatif : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier ce projet : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Un projet représentatif de mon univers : {{achievement}}",
      "Cela s'illustre bien par cette création : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'attire particulièrement parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Ce qui me plaît chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre univers artistique m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à l'univers créatif que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je serais ravi(e) de vous présenter mon univers créatif et mon portfolio lors d'un entretien.",
      "Disponible rapidement, je reste à votre disposition pour échanger sur mes créations.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous en dire plus sur mon travail.",
      "Je serais heureux(se) de vous montrer mon travail plus en détail lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste disponible pour un entretien où je pourrai vous présenter mon book et mes projets.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur ma démarche créative.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon portfolio.",
    ],
  },

  tourisme: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'environnement dynamique que je recherche.",
      "C'est avec énergie que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : le contact client est ce qui me motive au quotidien.",
      "Souriant(e) et dynamique, j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi une belle occasion de mettre mon énergie au service des clients.",
      "C'est avec un vrai sens de l'accueil que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre offre de {{poste}} en {{contrat}} correspond exactement à l'expérience client que je veux offrir chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'énergie que je veux mettre au service des clients.",
      "Chaleureux(se) et réactif(ve), je candidate avec enthousiasme au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec enthousiasme pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à l'univers que je recherche.",
      "C'est avec un vrai plaisir du contact humain que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble essentielle pour ce poste orienté client.",
      "Je maîtrise {{skill}}, directement utile pour les missions décrites dans votre offre.",
      "Ma pratique de {{skill}} me permettrait d'être rapidement à l'aise sur ce poste.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà pratiquées au contact de la clientèle.",
      "Je pratique {{skill}} régulièrement, un atout directement utile pour ce poste orienté client.",
      "Ayant déjà pratiqué {{skill}} au contact de la clientèle, je saurais m'adapter rapidement.",
      "{{skill}} fait partie des compétences que j'ai développées avec le plus de plaisir, en phase directe avec votre offre.",
      "J'ai déjà mobilisé {{skill}} en contact direct avec des clients, ce qui me permettrait d'être vite à l'aise ici.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué dans mes précédentes expériences.",
      "Je me suis particulièrement entraîné(e) sur {{skill}}, un atout directement utile pour ce poste orienté client.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a appris le sens du service et de l'accueil, essentiel pour ce type de poste.",
      "Mon parcours en {{formation}} m'a donné une vraie énergie et le goût du contact client au quotidien.",
      "Grâce à ma formation ({{formation}}), j'ai développé un vrai sens de l'accueil que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'aime créer une expérience agréable pour chaque client.",
      "Ma formation ({{formation}}) m'a donné le sens du détail qui fait la différence dans l'expérience client.",
      "Issu(e) d'une formation en {{formation}}, je sais garder le sourire même dans les moments de forte affluence.",
      "Mon parcours en {{formation}} m'a habitué(e) à m'adapter à des clientèles très différentes.",
      "Ma formation ({{formation}}) a renforcé mon goût du travail en équipe dans un environnement dynamique.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon sens du service : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
      "Un exemple qui illustre bien mon énergie au quotidien : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cette expérience : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une situation représentative de mon sens du service : {{achievement}}",
      "Cela s'illustre bien par cette expérience client : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre expérience client m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à l'univers que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Disponible rapidement, je me tiens à votre disposition pour un entretien.",
      "Je reste à votre disposition pour échanger de vive voix sur ma candidature.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
      "Je serais heureux(se) de vous rencontrer pour vous présenter mon énergie de vive voix.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste disponible pour un entretien, y compris en horaires décalés si besoin.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur ma motivation et mon énergie.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },

  education: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément à mon projet professionnel dans la transmission.",
      "C'est avec un vrai goût pour la pédagogie que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : accompagner la progression d'un public est ce qui me motive.",
      "Pédagogue dans l'âme, j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi une belle occasion de transmettre et d'accompagner.",
      "C'est avec un vrai goût pour la transmission que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre offre de {{poste}} en {{contrat}} correspond exactement à l'engagement pédagogique que je veux exercer chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'accompagnement pédagogique qui me motive.",
      "Patient(e) et pédagogue, je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec sincérité pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à ma vision de la transmission.",
      "C'est avec un vrai désir d'accompagner la progression des autres que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble utile pour ce poste pédagogique.",
      "Je pratique {{skill}}, directement en lien avec les besoins exprimés dans votre offre.",
      "Ma maîtrise de {{skill}} correspond bien aux missions décrites.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà mises en pratique auprès d'apprenants.",
      "Je pratique {{skill}} régulièrement, un atout directement utile pour ce poste pédagogique.",
      "Ayant déjà transmis {{skill}} à d'autres, je sais l'expliquer simplement et efficacement.",
      "{{skill}} fait partie des compétences que j'ai approfondies avec le plus de plaisir, en écho direct à votre offre.",
      "J'ai déjà mobilisé {{skill}} auprès d'un public varié, ce qui me permettrait d'être vite à l'aise ici.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué dans mes expériences précédentes.",
      "Je me suis particulièrement investi(e) sur {{skill}}, une compétence directement utile pour ce poste pédagogique.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une vraie appétence pour la transmission et la pédagogie.",
      "Mon parcours en {{formation}} m'a appris la patience et la clarté nécessaires pour accompagner des apprenants.",
      "Grâce à ma formation ({{formation}}), j'ai développé un vrai goût pour la transmission que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'aime adapter mon discours à chaque public pour me faire comprendre.",
      "Ma formation ({{formation}}) m'a donné les bases nécessaires pour construire des explications claires et progressives.",
      "Issu(e) d'une formation en {{formation}}, je sais m'adapter au rythme et aux besoins de chaque apprenant.",
      "Mon parcours en {{formation}} m'a habitué(e) à encourager la progression plutôt qu'à sanctionner l'erreur.",
      "Ma formation ({{formation}}) a renforcé ma capacité à captiver l'attention d'un public varié.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon engagement pédagogique : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
      "Un exemple qui illustre bien mon engagement pédagogique : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cette expérience : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une situation représentative de mon approche pédagogique : {{achievement}}",
      "Cela s'illustre bien par cette expérience de transmission : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre approche pédagogique m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à ma vision de la transmission, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous présenter ma motivation de vive voix.",
      "Je serais heureux(se) de vous présenter mon approche pédagogique lors d'un entretien.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste à votre disposition pour un entretien, quand cela vous conviendra le mieux.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur ma vision de la transmission.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },

  generaliste: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond précisément au poste que je recherche.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention.",
      "Motivé(e) et curieux(se), j'ai repéré avec intérêt votre offre de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Rejoindre {{entreprise}} en tant que {{poste}} ({{contrat}}) serait pour moi une belle opportunité professionnelle.",
      "C'est avec sérieux que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre offre de {{poste}} en {{contrat}} correspond exactement au type de poste que je recherche chez {{entreprise}}.",
      "Le poste de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'opportunité que je recherche pour progresser.",
      "Motivé(e) et impliqué(e), je candidate avec conviction au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Je vous adresse ma candidature avec sérieux pour le poste de {{poste}} en {{contrat}} : {{entreprise}} correspond à ce que je recherche.",
      "C'est avec envie que je candidate au poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais mobiliser rapidement.",
      "Je maîtrise {{skill}}, directement en lien avec les besoins de ce poste.",
      "Ma pratique de {{skill}} me permettrait de contribuer rapidement à vos équipes.",
      "L'un des prérequis de votre offre, {{skill}}, fait partie des compétences que j'ai déjà mises en pratique.",
      "Je pratique {{skill}} régulièrement, un atout directement utile pour ce poste.",
      "Ayant déjà mis en pratique {{skill}}, je saurais m'adapter rapidement aux besoins de ce poste.",
      "{{skill}} fait partie des compétences que j'ai développées avec le plus d'intérêt, en phase directe avec votre offre.",
      "J'ai déjà utilisé {{skill}} dans un contexte concret, ce qui me permettrait d'être rapidement utile à votre équipe.",
      "Votre besoin en {{skill}} correspond précisément à ce que j'ai pratiqué dans mes expériences précédentes.",
      "Je me suis particulièrement investi(e) sur {{skill}}, une compétence directement utile pour ce poste.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une base solide que je souhaite mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris la rigueur et l'envie d'apprendre, deux qualités que je compte apporter à ce poste.",
      "Grâce à ma formation ({{formation}}), j'ai développé des bases solides que je souhaite mettre au service de {{entreprise}}.",
      "Formé(e) en {{formation}}, j'ai à cœur de bien faire et d'apprendre continuellement.",
      "Ma formation ({{formation}}) m'a donné les bases nécessaires pour être rapidement opérationnel(le) sur ce poste.",
      "Issu(e) d'une formation en {{formation}}, je sais m'adapter rapidement à un nouvel environnement de travail.",
      "Mon parcours en {{formation}} m'a habitué(e) à travailler avec sérieux et méthode.",
      "Ma formation ({{formation}}) a renforcé ma curiosité et mon envie de progresser continuellement.",
    ],
    achievementLines: [
      "Pour donner un exemple concret : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
      "Un exemple qui illustre bien mon investissement : {{achievement}}",
      "Ça s'est notamment vérifié quand {{achievement}}",
      "J'en retiens en particulier cette expérience : {{achievement}}",
      "Concrètement, {{achievement}}",
      "Une situation représentative de mon investissement : {{achievement}}",
      "Cela s'illustre bien par cette expérience : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'intéresse en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
      "J'ai suivi {{entreprise}} avec intérêt, notamment parce que {{whyCompany}}",
      "Votre activité m'intéresse particulièrement : {{whyCompany}}",
      "{{entreprise}} correspond à ce que je recherche, notamment parce que {{whyCompany}}",
      "Ce qui me donne envie de rejoindre {{entreprise}} : {{whyCompany}}",
      "Je m'intéresse de près à {{entreprise}}, en particulier parce que {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
      "Je serais heureux(se) de vous rencontrer pour discuter de ma motivation.",
      "N'hésitez pas à me solliciter pour tout complément d'information, je reste disponible rapidement.",
      "Dans l'attente de votre retour, je reste pleinement disponible pour échanger sur cette opportunité.",
      "Je reste à votre disposition pour un entretien, quand cela vous conviendra le mieux.",
      "Je serais très heureux(se) de pouvoir échanger avec vous sur ma motivation.",
      "N'hésitez pas à me contacter pour organiser un entretien, je reste disponible rapidement.",
      "Je me tiens à votre disposition pour toute question complémentaire sur mon profil.",
    ],
  },
};

// Utilisé uniquement quand le profil n'a ni formation ni education_level
// (profil incomplet) : les phrases "fitFallback" de chaque famille
// référencent {{formation}} explicitement ("Ma formation (X) m'a...") --
// sans donnée réelle, mieux vaut une phrase générique correcte que
// d'injecter un texte de repli dans le trou, qui donnerait une phrase
// bancale ("Ma formation (ma formation)...").
const GENERIC_FIT_NO_FORMATION = [
  "Je suis motivé(e), rigoureux(se) et j'apprends vite, des qualités que je compte mettre au service de {{entreprise}}.",
  "J'ai une réelle envie d'apprendre et de m'investir sur ce poste, avec la rigueur qu'il demande.",
  "Je suis quelqu'un de sérieux et d'impliqué, avec une vraie capacité à m'adapter rapidement à un nouvel environnement.",
  "Ce qui me caractérise, c'est ma curiosité et ma persévérance : deux qualités que je compte mettre au service de {{entreprise}}.",
];

function findMatchedSkill(profile: ProfileInput, offer: OfferInput): string | null {
  if (!profile?.skills?.length) return null;
  const offerText = `${offer.description} ${offer.requirements ?? ""}`;
  return profile.skills.find((skill) => containsWholeWord(offerText, skill)) ?? null;
}

export function generateStaticCoverLetter(
  offer: OfferInput,
  profile: ProfileInput,
  extra?: CoverLetterExtra,
  attempt = 0,
): string {
  const sector = profile?.sectors?.[0] ?? null;
  const family = familyForSector(sector);
  const content = CONTENT[family];

  // Graine stable par offre (+ secteur, qui détermine la famille) : deux
  // candidatures différentes ne suivent pas la même séquence de mélange,
  // mais régénérer plusieurs fois LA MÊME candidature progresse dans le
  // même cycle sans jamais répéter avant d'avoir vu toutes les variantes.
  const seedBase = `${offer.company}::${offer.title}::${family}`;

  const hasFormationInfo = !!(profile?.formation || profile?.education_level);
  const vars: Record<string, string> = {
    poste: offer.title,
    entreprise: offer.company,
    contrat: offer.contract_type === "alternance" ? "alternance" : "stage",
    formation: profile?.formation || profile?.education_level || "",
  };

  const matchedSkill = findMatchedSkill(profile, offer);
  const paragraphs: string[] = [
    fill(pickNoRepeat(content.openers, `${seedBase}::opener`, attempt), vars),
  ];

  if (matchedSkill) {
    paragraphs.push(
      fill(pickNoRepeat(content.fitWithSkill, `${seedBase}::fit`, attempt), { ...vars, skill: matchedSkill }),
    );
  } else if (hasFormationInfo) {
    paragraphs.push(fill(pickNoRepeat(content.fitFallback, `${seedBase}::fit`, attempt), vars));
  } else {
    paragraphs.push(fill(pickNoRepeat(GENERIC_FIT_NO_FORMATION, `${seedBase}::fit`, attempt), vars));
  }

  const achievement = extra?.achievement?.trim();
  if (achievement) {
    paragraphs.push(
      fill(pickNoRepeat(content.achievementLines, `${seedBase}::achievement`, attempt), { ...vars, achievement }),
    );
  }

  const whyCompany = extra?.whyCompany?.trim();
  if (whyCompany) {
    paragraphs.push(
      fill(pickNoRepeat(content.whyCompanyLines, `${seedBase}::whyCompany`, attempt), { ...vars, whyCompany }),
    );
  }

  paragraphs.push(fill(pickNoRepeat(content.closings, `${seedBase}::closing`, attempt), vars));

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const signature = firstName ? `Cordialement,\n${firstName}` : "Cordialement,";

  return [...paragraphs, signature].join("\n\n");
}
