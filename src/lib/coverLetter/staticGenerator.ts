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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée concrètement et que je saurais mobiliser rapidement sur vos projets.",
      "Ayant travaillé sur {{skill}}, je pense pouvoir apporter une contribution technique immédiate sur ce poste.",
      "Ma pratique de {{skill}} me semble directement en phase avec les besoins exprimés dans votre offre.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une base technique solide que je suis prêt à mettre au service de vos équipes dès le premier jour.",
      "Mon parcours en {{formation}} m'a habitué à résoudre des problèmes concrets, exactement l'état d'esprit que je compte apporter à ce poste.",
    ],
    achievementLines: [
      "Pour vous donner un exemple concret : {{achievement}}",
      "À titre d'illustration, {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'intéresse en particulier parce que {{whyCompany}}",
      "Ce qui me motive chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je serais ravi(e) d'échanger avec vous pour vous présenter plus en détail ma motivation et mes compétences techniques.",
      "Disponible rapidement, je me tiens à votre disposition pour un entretien technique quand vous le souhaitez.",
      "Je reste à votre disposition pour toute question et espère avoir l'opportunité d'en discuter de vive voix.",
    ],
  },

  business: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au poste que je recherche pour développer mes compétences commerciales.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je souhaite vous proposer ma candidature pour le poste de {{poste}} en {{contrat}} chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : {{entreprise}} est un environnement dans lequel je souhaite évoluer.",
    ],
    fitWithSkill: [
      "Votre offre demande {{skill}} : c'est une compétence que j'ai déjà mise en pratique et que je sais transformer en résultats concrets.",
      "Je maîtrise {{skill}}, un point directement en lien avec les priorités de ce poste.",
      "Ma pratique de {{skill}} me permettrait de contribuer rapidement aux objectifs de votre équipe.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a apporté une vraie culture du résultat, un atout que je compte mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris à comprendre les enjeux business avant d'agir, exactement l'approche que je veux appliquer sur ce poste.",
    ],
    achievementLines: [
      "Pour donner un exemple concret : {{achievement}}",
      "À titre d'illustration de mon engagement : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'attire particulièrement parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je serais heureux(se) de vous rencontrer pour discuter de ma motivation et de ce que je peux apporter à votre équipe.",
      "Disponible rapidement, je reste à votre disposition pour un entretien.",
      "J'espère avoir l'opportunité d'échanger avec vous prochainement.",
    ],
  },

  rh_admin: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément au poste que je recherche.",
      "C'est avec sérieux et motivation que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : elle correspond à mes attentes et à ma rigueur de travail.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais appliquer avec la rigueur attendue sur ce type de poste.",
      "Je pratique {{skill}}, un point directement utile pour les missions décrites dans votre offre.",
      "Ma maîtrise de {{skill}} correspond aux exigences précises de ce poste.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a apporté rigueur et sens de l'organisation, des qualités essentielles pour ce type de mission.",
      "Mon parcours en {{formation}} m'a habitué à respecter des procédures précises tout en gardant un vrai sens du service.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon sérieux : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre entière disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "Je vous remercie par avance de l'examen de ma candidature et reste disponible pour tout complément d'information.",
    ],
  },

  terrain: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement au poste concret que je recherche.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : c'est le type de travail concret qui me motive.",
    ],
    fitWithSkill: [
      "Votre offre demande {{skill}}, une compétence pratique que j'ai déjà mise en œuvre sur le terrain.",
      "Je maîtrise {{skill}}, directement utile pour les missions de ce poste.",
      "Ma pratique de {{skill}} me permettrait d'être rapidement opérationnel(le) chez vous.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné les bases pratiques nécessaires pour être efficace rapidement sur le terrain.",
      "Mon parcours en {{formation}} m'a appris à être fiable et rigoureux(se) dans un travail concret, au quotidien.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon savoir-faire : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Disponible rapidement, je me tiens à votre disposition pour un entretien.",
      "Je reste à votre disposition pour échanger de vive voix sur ma candidature.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
    ],
  },

  sante_social: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément à mon projet professionnel.",
      "C'est avec un vrai engagement humain que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : accompagner des personnes concrètement est ce qui me motive.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble essentielle pour ce type d'accompagnement.",
      "Je pratique {{skill}}, directement utile pour les missions décrites dans votre offre.",
      "Ma maîtrise de {{skill}} correspond bien aux besoins exprimés dans votre annonce.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a appris l'écoute et la rigueur nécessaires pour accompagner des personnes au quotidien.",
      "Mon parcours en {{formation}} m'a donné une vraie sensibilité humaine, essentielle pour ce type de poste.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon engagement : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous présenter ma motivation de vive voix.",
    ],
  },

  creatif: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} a immédiatement retenu mon attention : c'est exactement l'univers créatif dans lequel je veux évoluer.",
      "C'est avec enthousiasme que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} correspond précisément à ce que je recherche : un cadre créatif exigeant.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais mettre au service de vos projets créatifs.",
      "Je maîtrise {{skill}}, directement en lien avec les besoins de ce poste.",
      "Ma pratique de {{skill}} me permettrait d'apporter rapidement une vraie valeur créative à votre équipe.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une vraie sensibilité créative que je souhaite mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris à allier créativité et rigueur, un équilibre essentiel pour ce poste.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon travail : {{achievement}}",
      "À titre d'illustration de ma créativité : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'attire particulièrement parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je serais ravi(e) de vous présenter mon univers créatif et mon portfolio lors d'un entretien.",
      "Disponible rapidement, je reste à votre disposition pour échanger sur mes créations.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous en dire plus sur mon travail.",
    ],
  },

  tourisme: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond exactement à l'environnement dynamique que je recherche.",
      "C'est avec énergie que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention : le contact client est ce qui me motive au quotidien.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble essentielle pour ce poste orienté client.",
      "Je maîtrise {{skill}}, directement utile pour les missions décrites dans votre offre.",
      "Ma pratique de {{skill}} me permettrait d'être rapidement à l'aise sur ce poste.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a appris le sens du service et de l'accueil, essentiel pour ce type de poste.",
      "Mon parcours en {{formation}} m'a donné une vraie énergie et le goût du contact client au quotidien.",
    ],
    achievementLines: [
      "Pour donner un exemple concret de mon sens du service : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui m'attire chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Disponible rapidement, je me tiens à votre disposition pour un entretien.",
      "Je reste à votre disposition pour échanger de vive voix sur ma candidature.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
    ],
  },

  education: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} au sein de {{entreprise}} correspond précisément à mon projet professionnel dans la transmission.",
      "C'est avec un vrai goût pour la pédagogie que je candidate au poste de {{poste}} ({{contrat}}) chez {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, au sein de {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu mon attention : accompagner la progression d'un public est ce qui me motive.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et qui me semble utile pour ce poste pédagogique.",
      "Je pratique {{skill}}, directement en lien avec les besoins exprimés dans votre offre.",
      "Ma maîtrise de {{skill}} correspond bien aux missions décrites.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une vraie appétence pour la transmission et la pédagogie.",
      "Mon parcours en {{formation}} m'a appris la patience et la clarté nécessaires pour accompagner des apprenants.",
    ],
    achievementLines: [
      "Pour illustrer concrètement mon engagement pédagogique : {{achievement}}",
      "À titre d'exemple : {{achievement}}",
    ],
    whyCompanyLines: [
      "Je souhaite rejoindre {{entreprise}} en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer pour vous présenter ma motivation de vive voix.",
    ],
  },

  generaliste: {
    openers: [
      "Votre offre de {{poste}} en {{contrat}} chez {{entreprise}} correspond précisément au poste que je recherche.",
      "C'est avec motivation que je candidate au poste de {{poste}} ({{contrat}}) au sein de {{entreprise}}.",
      "Je vous adresse ma candidature pour le poste de {{poste}} en {{contrat}}, chez {{entreprise}}.",
      "Votre annonce pour un(e) {{poste}} en {{contrat}} a retenu toute mon attention.",
    ],
    fitWithSkill: [
      "Votre offre mentionne {{skill}}, une compétence que j'ai développée et que je saurais mobiliser rapidement.",
      "Je maîtrise {{skill}}, directement en lien avec les besoins de ce poste.",
      "Ma pratique de {{skill}} me permettrait de contribuer rapidement à vos équipes.",
    ],
    fitFallback: [
      "Ma formation ({{formation}}) m'a donné une base solide que je souhaite mettre au service de {{entreprise}}.",
      "Mon parcours en {{formation}} m'a appris la rigueur et l'envie d'apprendre, deux qualités que je compte apporter à ce poste.",
    ],
    achievementLines: [
      "Pour donner un exemple concret : {{achievement}}",
      "À titre d'illustration : {{achievement}}",
    ],
    whyCompanyLines: [
      "{{entreprise}} m'intéresse en particulier parce que {{whyCompany}}",
      "Ce qui motive ma candidature chez {{entreprise}} : {{whyCompany}}",
    ],
    closings: [
      "Je reste à votre disposition pour un entretien et vous remercie de l'attention portée à ma candidature.",
      "Disponible rapidement, je me tiens à votre disposition pour échanger plus en détail.",
      "J'espère avoir l'opportunité de vous rencontrer prochainement.",
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
): string {
  const sector = profile?.sectors?.[0] ?? null;
  const family = familyForSector(sector);
  const content = CONTENT[family];

  const hasFormationInfo = !!(profile?.formation || profile?.education_level);
  const vars: Record<string, string> = {
    poste: offer.title,
    entreprise: offer.company,
    contrat: offer.contract_type === "alternance" ? "alternance" : "stage",
    formation: profile?.formation || profile?.education_level || "",
  };

  const matchedSkill = findMatchedSkill(profile, offer);
  const paragraphs: string[] = [fill(pick(content.openers), vars)];

  if (matchedSkill) {
    paragraphs.push(fill(pick(content.fitWithSkill), { ...vars, skill: matchedSkill }));
  } else if (hasFormationInfo) {
    paragraphs.push(fill(pick(content.fitFallback), vars));
  } else {
    paragraphs.push(fill(pick(GENERIC_FIT_NO_FORMATION), vars));
  }

  const achievement = extra?.achievement?.trim();
  if (achievement) {
    paragraphs.push(fill(pick(content.achievementLines), { ...vars, achievement }));
  }

  const whyCompany = extra?.whyCompany?.trim();
  if (whyCompany) {
    paragraphs.push(fill(pick(content.whyCompanyLines), { ...vars, whyCompany }));
  }

  paragraphs.push(fill(pick(content.closings), vars));

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const signature = firstName ? `Cordialement,\n${firstName}` : "Cordialement,";

  return [...paragraphs, signature].join("\n\n");
}
