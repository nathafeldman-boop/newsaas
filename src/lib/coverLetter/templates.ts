import { normalizeForSector } from "@/lib/offers/sectors";
import { letterJobTitle } from "@/lib/coverLetter/jobTitle";

// Bibliothèque de modèles de lettres (24/10, mission churn) : 13 domaines ×
// 3 styles, écrits à la main, sans IA (aucun coût par lettre). L'étudiant
// choisit un domaine et un style, voit la lettre, la modifie, la copie.
//
// Règle : rien n'est inventé. Le modèle n'utilise que l'offre (poste,
// entreprise, contrat), le profil (nom, ville, formation, compétences,
// disponibilité) et ce que l'étudiant tape (une expérience, pourquoi cette
// entreprise, son rythme). Ce qui manque reste entre crochets, visible, pour
// qu'il le complète lui-même : jamais une expérience ou un diplôme supposé.
// Pas d'accord en genre (« motivé·e ») : les phrases sont tournées pour
// rester neutres.

export type TemplateStyle = "classique" | "dynamique" | "concis";

export const TEMPLATE_STYLES: { id: TemplateStyle; label: string; hint: string }[] = [
  { id: "classique", label: "Classique", hint: "Formelle, structurée : grandes entreprises, administrations" },
  { id: "dynamique", label: "Dynamique", hint: "Directe et vivante : PME, start-up, commerce" },
  { id: "concis", label: "Courte", hint: "Quelques lignes : formulaire en ligne ou e-mail" },
];

type Domain = {
  id: string;
  label: string;
  /** Mots repérés dans le secteur et le titre de l'offre (texte normalisé, sans accents). */
  match: RegExp | null;
  /** Ce que le poste implique, en une proposition (« accueillir…, conseiller… »). */
  missions: string;
  /** Ce que l'étudiant veut apprendre ou développer. */
  learn: string;
  /** Trois qualités attendues dans le métier (présentées comme attendues, pas comme acquises). */
  qualities: [string, string, string];
  /** Accroche par style ; {poste}, {entreprise}, {contrat} remplis à l'affichage. */
  hooks: Record<TemplateStyle, string>;
};

export const TEMPLATE_DOMAINS: Domain[] = [
  {
    id: "commerce",
    label: "Commerce et vente",
    match: /vente|vendeu|commerc|distribution|e-commerce|franchise|import|achat|immobili|conseiller client|caisse|magasin de|boutique/,
    missions: "accueillir et conseiller les clients, participer à l'atteinte des objectifs de vente et faire vivre le point de vente au quotidien",
    learn: "les techniques de vente, la relation client et le suivi d'indicateurs commerciaux",
    qualities: ["le sens du contact", "la persévérance", "l'envie d'atteindre des objectifs"],
    hooks: {
      classique: "Je vous adresse ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Conseiller un client, trouver ce qui lui correspond et le voir repartir satisfait : c'est ce qui me donne envie de rejoindre {entreprise} comme {poste} {contrat}.",
      concis: "Je souhaite rejoindre {entreprise} {contrat} sur le poste {dePoste}.",
    },
  },
  {
    id: "marketing",
    label: "Marketing et communication",
    match: /marketing|communication|publicit|community|reseaux sociaux|digital|brand|evenementiel|relations presse|contenu/,
    missions: "participer à la création de contenus, au suivi des campagnes et à l'analyse de leurs résultats",
    learn: "la conduite de campagnes, la création de contenus et la lecture des indicateurs de performance",
    qualities: ["la créativité", "la rigueur dans le suivi des chiffres", "une bonne plume"],
    hooks: {
      classique: "Je vous soumets ma candidature pour le poste {dePoste} {contrat} proposé par {entreprise}.",
      dynamique: "Faire connaître une marque, trouver le bon message et mesurer ce qui fonctionne : c'est le travail que j'ai envie d'apprendre chez {entreprise}, comme {poste} {contrat}.",
      concis: "Le poste {dePoste} {contrat} chez {entreprise} correspond exactement à ce que je cherche.",
    },
  },
  {
    id: "informatique",
    label: "Informatique et data",
    match: /informati|developp|data|cyber|reseau|telecom|intelligence artificielle|logiciel|devops|web|jeux video|blockchain|systeme|cloud|support it|technicien informatique/,
    missions: "contribuer au développement et à la maintenance des outils, travailler en équipe sur des projets concrets et apprendre de bonnes pratiques",
    learn: "les méthodes d'une équipe technique, la qualité du code et le travail en mode projet",
    qualities: ["la curiosité technique", "la rigueur", "le goût de résoudre des problèmes"],
    hooks: {
      classique: "Je vous présente ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Comprendre un problème, l'outiller et voir la solution servir à de vrais utilisateurs : c'est ce qui me motive à postuler chez {entreprise} comme {poste} {contrat}.",
      concis: "Je candidate au poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
  {
    id: "rh",
    label: "Ressources humaines",
    match: /\brh\b|ressources humaines|recrutement|paie|talent|formation professionnelle|charge de developpement rh/,
    missions: "participer au recrutement, à l'administration du personnel et au suivi des salariés",
    learn: "les processus de recrutement, la gestion administrative du personnel et le droit du travail appliqué",
    qualities: ["l'écoute", "la discrétion", "le sens de l'organisation"],
    hooks: {
      classique: "Je me permets de vous adresser ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Recruter les bonnes personnes et les accompagner une fois arrivées : c'est le métier que je veux apprendre chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je souhaite rejoindre l'équipe RH {deEntreprise} {contrat}, sur le poste {dePoste}.",
    },
  },
  {
    id: "gestion",
    label: "Comptabilité, gestion et finance",
    match: /compta|gestion|finance|financ|banque|assurance|actuari|audit|controle de gestion|tresorerie|fiscal/,
    missions: "participer à la saisie et au contrôle des opérations, aux clôtures et au suivi des indicateurs financiers",
    learn: "les outils comptables, les clôtures et l'analyse des chiffres d'une entreprise",
    qualities: ["la rigueur", "la fiabilité", "l'aisance avec les chiffres"],
    hooks: {
      classique: "Je vous fais part de ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Derrière chaque décision d'entreprise, il y a des chiffres justes : c'est ce travail précis que je veux apprendre chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je candidate au poste {dePoste} {contrat} proposé par {entreprise}.",
    },
  },
  {
    id: "administration",
    label: "Administration et juridique",
    match: /administrati|assistant|secretar|juridique|droit|notari|fonction publique|collectivite|douane|accueil|office manager/,
    missions: "assurer le suivi des dossiers, la gestion administrative et l'accueil des interlocuteurs",
    learn: "l'organisation d'un service, la gestion de dossiers et les outils bureautiques avancés",
    qualities: ["le sens de l'organisation", "la rigueur", "la polyvalence"],
    hooks: {
      classique: "Je vous adresse ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Un service bien organisé fait gagner du temps à toute une équipe : c'est ce rôle que je veux tenir chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je souhaite occuper le poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
  {
    id: "logistique",
    label: "Logistique et transport",
    match: /logisti|transport|entrepot|magasinier|cariste|supply|preparat|approvisionn|flux|livraison/,
    missions: "participer à la réception, au stockage et à l'expédition des marchandises, et au suivi des flux",
    learn: "l'organisation des flux, la gestion des stocks et les règles de sécurité",
    qualities: ["la fiabilité", "l'organisation", "le respect des consignes de sécurité"],
    hooks: {
      classique: "Je vous présente ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Que chaque commande parte à l'heure et au bon endroit : c'est le défi quotidien que j'ai envie de relever chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je candidate au poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
  {
    id: "industrie",
    label: "Industrie, maintenance et BTP",
    match: /industri|maintenance|mecani|electr|electrotech|btp|batiment|chantier|genie|qualite|production|automobile|aeronaut|energie|chimie|usinage|soudu|plomb|menuis|technicien/,
    missions: "participer à la production, à la maintenance des équipements ou au suivi des chantiers, en respectant les règles de qualité et de sécurité",
    learn: "les gestes techniques du métier, la lecture de plans ou de procédures et la culture sécurité",
    qualities: ["la précision", "le respect de la sécurité", "l'esprit d'équipe"],
    hooks: {
      classique: "Je vous adresse ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Comprendre comment les choses fonctionnent, les réparer, les construire : c'est ce qui me pousse vers le poste {dePoste} {contrat} chez {entreprise}.",
      concis: "Je souhaite rejoindre {entreprise} {contrat} comme {poste}.",
    },
  },
  {
    id: "sante",
    label: "Santé et social",
    match: /sante|social|soin|infirm|pharma|aide a domicile|petite enfance|educat|psycholog|optique|medic|auxiliaire|accompagnement|handicap|ehpad/,
    missions: "accompagner les personnes au quotidien, contribuer à leur bien-être et travailler en lien avec une équipe pluridisciplinaire",
    learn: "les gestes professionnels, la relation d'aide et le travail en équipe soignante ou éducative",
    qualities: ["l'empathie", "la patience", "le sens des responsabilités"],
    hooks: {
      classique: "Je vous fais part de ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Être utile aux autres, concrètement, chaque jour : c'est ce qui me donne envie de rejoindre {entreprise} comme {poste} {contrat}.",
      concis: "Je candidate au poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
  {
    id: "hotellerie",
    label: "Hôtellerie, restauration et tourisme",
    match: /hotel|restaura|cuisin|serveu|tourisme|reception|boulang|patiss|sommel|barman|commis|voyage|beaute|esthetique|coiff/,
    missions: "accueillir la clientèle, assurer un service de qualité et participer au bon fonctionnement de l'établissement",
    learn: "les standards de service, le travail en brigade ou en équipe et la gestion des moments de rush",
    qualities: ["le sens de l'accueil", "l'énergie", "la réactivité"],
    hooks: {
      classique: "Je vous adresse ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Faire passer un bon moment aux clients, même quand le service s'accélère : c'est ce que j'ai envie d'apprendre chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je souhaite rejoindre l'équipe {deEntreprise} {contrat} comme {poste}.",
    },
  },
  {
    id: "education",
    label: "Éducation, animation et sport",
    match: /enseign|education|formateur|animation|animateur|sport|coach|periscolaire|loisir/,
    missions: "encadrer et animer des groupes, préparer des activités et accompagner chacun dans sa progression",
    learn: "la préparation d'activités, l'encadrement de groupes et la pédagogie",
    qualities: ["la pédagogie", "le dynamisme", "le sens des responsabilités"],
    hooks: {
      classique: "Je vous présente ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Transmettre, faire progresser, donner envie : c'est ce qui me motive à rejoindre {entreprise} comme {poste} {contrat}.",
      concis: "Je candidate au poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
  {
    id: "creatif",
    label: "Création, design et médias",
    match: /design|graphi|audiovisuel|cinema|photo|mode|\bart\b|journalis|edition|musique|video|montage|ux|ui|architecte d.interieur|textile/,
    missions: "participer à la conception de projets créatifs, de la recherche d'idées à la réalisation, en respectant un brief",
    learn: "la conduite d'un projet créatif de bout en bout et le travail avec des clients ou des équipes",
    qualities: ["la créativité", "le souci du détail", "l'ouverture aux retours"],
    hooks: {
      classique: "Je vous soumets ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "Transformer une idée en quelque chose qu'on voit, qu'on lit ou qu'on écoute : c'est ce que je veux faire chez {entreprise}, comme {poste} {contrat}.",
      concis: "Je souhaite rejoindre {entreprise} {contrat} sur le poste {dePoste}.",
    },
  },
  {
    id: "generaliste",
    label: "Tous domaines",
    match: null,
    missions: "prendre part aux missions de l'équipe, apprendre le métier sur le terrain et prendre des responsabilités au fil des mois",
    learn: "le métier, ses outils et le fonctionnement d'une entreprise",
    qualities: ["la motivation", "la fiabilité", "l'envie d'apprendre"],
    hooks: {
      classique: "Je vous adresse ma candidature pour le poste {dePoste} {contrat} au sein {deEntreprise}.",
      dynamique: "J'ai lu votre offre {dePoste} {contrat} et j'ai eu envie de vous écrire tout de suite : voici pourquoi je veux rejoindre {entreprise}.",
      concis: "Je candidate au poste {dePoste} {contrat} chez {entreprise}.",
    },
  },
];

const GENERALISTE = TEMPLATE_DOMAINS[TEMPLATE_DOMAINS.length - 1];

/** Domaine proposé par défaut : d'après le secteur et le titre de l'offre. */
export function guessTemplateDomain(sector: string | null | undefined, title: string): string {
  const text = normalizeForSector(`${sector ?? ""} ${title}`);
  return TEMPLATE_DOMAINS.find((d) => d.match?.test(text))?.id ?? GENERALISTE.id;
}

export type TemplateInput = {
  offer: { title: string; company: string; contractType: "alternance" | "stage" };
  profile: {
    fullName: string | null;
    city: string | null;
    formation: string | null;
    skills: string[];
    availabilityDate: string | null;
  };
  /** Saisies de l'étudiant, toutes facultatives. */
  answers: { experience?: string; whyCompany?: string; rhythm?: string };
};

/** Passages à compléter : entre crochets dans le texte. */
export const PLACEHOLDER_RE = /\[[^\]\n]{3,}\]/g;

function companyName(company: string): string {
  const c = company.trim();
  return !c || /confidenti|non communiqu|anonyme/i.test(c) ? "votre entreprise" : c;
}

// « de Assistant » → « d'Assistant », « de Orange » → « d'Orange ».
function elideDe(word: string): string {
  return /^[aeiouyhâàéèêëîïôûùœ]/i.test(word) ? `d'${word}` : `de ${word}`;
}

function listFr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function sentence(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const first = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(first) ? first : `${first}.`;
}

function lowerFirst(text: string): string {
  const t = text.trim().replace(/[.!]+$/, "");
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function availability(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export function renderTemplate(domainId: string, style: TemplateStyle, input: TemplateInput): string {
  const domain = TEMPLATE_DOMAINS.find((d) => d.id === domainId) ?? GENERALISTE;
  const alternance = input.offer.contractType === "alternance";
  const poste = letterJobTitle(input.offer.title, input.offer.contractType) || "[intitulé du poste]";
  const entreprise = companyName(input.offer.company);
  const vars: Record<string, string> = {
    poste,
    entreprise,
    dePoste: elideDe(poste),
    deEntreprise: elideDe(entreprise),
    contrat: alternance ? "en alternance" : "en stage",
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

  const name = input.profile.fullName?.trim() || "[Prénom Nom]";
  const formation = input.profile.formation?.trim();
  const skills = input.profile.skills.map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const experience = input.answers.experience?.trim();
  const why = input.answers.whyCompany?.trim();
  const rhythm = input.answers.rhythm?.trim();
  const dispo = availability(input.profile.availabilityDate);
  const company = vars.entreprise;
  const [q1, q2, q3] = domain.qualities;

  // Formation en saisie libre (« BTS MCO », « une licence pro ») : entre
  // parenthèses, la phrase reste correcte quelle que soit la forme.
  const formationText = formation || "[ton diplôme et ton école]";
  const formationLine = alternance
    ? `Actuellement en formation (${formationText}), je cherche une entreprise pour mettre en pratique ce que j'apprends.`
    : `Actuellement en formation (${formationText}), je cherche un stage pour confronter mes cours à la réalité du terrain.`;
  const experienceLine = experience
    ? sentence(experience)
    : "[Une expérience concrète, même courte : job étudiant, stage, projet de cours, bénévolat, sport… et ce qu'elle t'a appris.]";
  const whyLine = why
    ? `Rejoindre ${company} me motive particulièrement : ${lowerFirst(why)}.`
    : `[Pourquoi ${company} ? Cite un produit, une valeur, un projet ou une actualité de l'entreprise.]`;
  const skillsLine = skills.length ? `Je peux m'appuyer sur ${listFr(skills)}.` : "";
  const rhythmLine = alternance
    ? rhythm
      ? `Mon rythme d'alternance : ${lowerFirst(rhythm)}.`
      : "Mon rythme d'alternance : [ex. 3 semaines en entreprise, 1 semaine en formation]."
    : "";
  const dispoLine = dispo ? `Je suis disponible à partir du ${dispo}.` : "";
  const contractNoun = alternance ? "alternance" : "stage";
  const thisContract = alternance ? "cette alternance" : "ce stage";
  const header = [name, input.profile.city?.trim()].filter(Boolean).join("\n");
  const brings = `${skills.length ? `${listFr(skills)}, et ` : ""}un état d'esprit tourné vers ${q1} et ${q2}`;

  const join = (parts: (string | false | null | undefined)[]) => parts.filter((p) => p && String(p).trim()).join("\n\n");
  const line = (parts: string[]) => parts.filter(Boolean).join(" ");

  if (style === "classique") {
    return join([
      header,
      `${company}\nObjet : candidature ${vars.contrat} – ${vars.poste}`,
      "Madame, Monsieur,",
      line([fill(domain.hooks.classique), formationLine]),
      `Le poste ${vars.dePoste} m'attire particulièrement : il s'agit de ${domain.missions}. Je souhaite y apprendre ${domain.learn}. Ce métier demande ${q1}, ${q2} et ${q3}, et c'est dans cet état d'esprit que j'aborde ${thisContract}.`,
      line([experienceLine, skillsLine]),
      whyLine,
      line([rhythmLine, dispoLine]),
      "Je me tiens à votre disposition pour un entretien, afin de vous présenter ma motivation de vive voix. Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
      name,
    ]);
  }

  if (style === "dynamique") {
    return join([
      `Objet : ${vars.poste} (${contractNoun}) – ma candidature`,
      "Bonjour,",
      fill(domain.hooks.dynamique),
      formationLine,
      `Ce que je viens chercher : ${domain.missions}, et apprendre ${domain.learn}.\nCe que j'apporte : ${brings}.`,
      experienceLine,
      whyLine,
      line([rhythmLine, dispoLine]),
      "Je peux vous en dire plus lors d'un échange, en visio ou dans vos locaux, quand vous le souhaitez.",
      `Bien à vous,\n${name}`,
    ]);
  }

  return join([
    `Objet : candidature ${contractNoun} – ${vars.poste}`,
    "Bonjour,",
    line([fill(domain.hooks.concis), formationLine]),
    `Ce poste me permettrait d'apprendre ${domain.learn}, un métier qui demande ${q1} et ${q3}.`,
    line([experienceLine, skillsLine]),
    whyLine,
    line([rhythmLine, dispoLine]),
    `Merci pour votre attention, je reste disponible pour un échange.\n${name}`,
  ]);
}

export function countPlaceholders(text: string): number {
  return text.match(PLACEHOLDER_RE)?.length ?? 0;
}
