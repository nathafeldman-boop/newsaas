import Link from "next/link";
import type { Metadata } from "next";
import { CoverLetterGenerator } from "@/components/tools/CoverLetterGenerator";
import { buildCoverLetter, EMPTY_LETTER_INPUT, type LetterContract, type LetterInput } from "@/lib/tools/coverLetter";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";

// Pages /outils/lettre-de-motivation-alternance et -stage : le générateur
// gratuit, puis la méthode, des exemples complets (rendus côté serveur, donc
// lisibles par Google : « exemple lettre de motivation alternance ») et une
// FAQ. Les exemples sont fictifs (entreprises et écoles inventées).

type PageContent = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  structure: string[];
  examples: { title: string; input: LetterInput }[];
  mistakes: string[];
  faq: { q: string; a: string }[];
  guides: { href: string; label: string }[];
};

const example = (input: Partial<LetterInput>): LetterInput => ({ ...EMPTY_LETTER_INPUT, ...input });

export const COVER_LETTER_PAGES: Record<LetterContract, PageContent> = {
  alternance: {
    path: "/outils/lettre-de-motivation-alternance",
    title: "Lettre de motivation alternance : générateur gratuit et exemples (2026)",
    description:
      "Génère ta lettre de motivation pour une alternance en 2 minutes, gratuitement et sans compte : lettre + mail d'envoi, exemples complets, structure et erreurs à éviter.",
    h1: "Lettre de motivation pour une alternance : le générateur gratuit",
    intro:
      "Remplis les champs : ta lettre s'écrit en direct, avec la version mail pour l'envoyer. C'est gratuit, sans compte, et rien n'est enregistré. Ensuite, relis-la et rends-la vraiment personnelle : c'est ce qui fait la différence auprès d'un recruteur.",
    structure: [
      "L'objet : le poste, le fait que c'est une alternance et ta date de rentrée.",
      "1er paragraphe : qui tu es, la formation que tu vas préparer, ton école, ton rythme.",
      "2e paragraphe : pourquoi cette entreprise, avec un détail concret (un produit, un projet, une valeur).",
      "3e paragraphe : ce que tu apportes, avec une expérience réelle et 2 ou 3 qualités prouvées.",
      "4e paragraphe : pourquoi l'alternance, et ton envie de t'investir sur la durée.",
      "La fin : la demande d'entretien et tes coordonnées. Une page maximum, 250 à 300 mots.",
    ],
    examples: [
      {
        title: "Exemple : BTS MCO en alternance, vendeuse conseil",
        input: example({
          contract: "alternance",
          gender: "f",
          firstName: "Léa",
          lastName: "Martin",
          phone: "06 12 34 56 78",
          email: "lea.martin@mail.fr",
          company: "Atlas Sport",
          position: "vendeuse conseil",
          currentStudies: "en terminale STMG",
          targetTraining: "un BTS MCO",
          school: "CFA Sud Commerce",
          startDate: "septembre 2027",
          rhythm: "2 jours en formation, 3 jours en magasin",
          whyCompany: "j'achète mon équipement de running chez vous depuis trois ans et la qualité de vos conseils m'a toujours marquée",
          experience: "Pendant mon job d'été dans un camping, j'ai accueilli les vacanciers et géré les réservations, parfois seule à l'accueil.",
          qualities: ["relationnel", "motive", "organise"],
          mentionAid: false,
        }),
      },
      {
        title: "Exemple : bachelor RH en alternance, assistant RH",
        input: example({
          contract: "alternance",
          gender: "m",
          firstName: "Yanis",
          lastName: "Benali",
          phone: "07 98 76 54 32",
          email: "yanis.benali@mail.fr",
          company: "Delta Services",
          position: "assistant ressources humaines",
          currentStudies: "en 2e année de BTS SAM",
          targetTraining: "un bachelor Ressources humaines",
          school: "l'École Horizon",
          startDate: "octobre 2027",
          rhythm: "une semaine en formation, deux semaines en entreprise",
          whyCompany: "votre programme de formation interne montre l'importance que vous accordez au développement de vos équipes",
          experience: "En stage dans un cabinet comptable, j'ai mis à jour les dossiers du personnel et préparé l'arrivée de trois nouveaux salariés.",
          qualities: ["rigoureux", "autonome", "digital"],
          mentionAid: false,
        }),
      },
    ],
    mistakes: [
      "Envoyer la même lettre partout : le recruteur le voit tout de suite.",
      "Ne parler que de toi : explique aussi ce que tu apportes à l'entreprise.",
      "Oublier les infos pratiques : formation, école, rythme et date de rentrée.",
      "Des qualités sans preuve : « motivé » ne vaut rien sans un exemple concret.",
      "Laisser des fautes : fais-la relire, ou lis-la à voix haute.",
    ],
    faq: [
      {
        q: "Faut-il une lettre de motivation pour une alternance ?",
        a: "Pas toujours : certaines entreprises ne demandent qu'un CV. Mais une lettre courte et personnalisée, ou au moins un mail soigné, augmente nettement tes chances, surtout dans les PME.",
      },
      {
        q: "Quelle longueur pour une lettre de motivation d'alternance ?",
        a: "Une page maximum, soit 250 à 300 mots. Le recruteur la lit en moins d'une minute : va droit au but.",
      },
      {
        q: "Lettre ou mail : comment l'envoyer ?",
        a: "Si tu postules par mail, écris un message court qui résume ta demande, et joins ton CV et ta lettre en PDF. Le générateur te donne les deux versions.",
      },
      {
        q: "Peut-on utiliser ChatGPT ou un générateur pour sa lettre ?",
        a: "Oui pour démarrer, à condition de la personnaliser : un détail concret sur l'entreprise et une vraie expérience à toi valent plus que de belles phrases générales.",
      },
      {
        q: "Faut-il parler de l'aide à l'embauche dans sa lettre ?",
        a: "Une phrase peut convaincre une petite entreprise qui hésite : pour un contrat d'apprentissage conclu jusqu'au 31 décembre 2026, l'État verse une aide à l'employeur pour la première année.",
      },
    ],
    guides: [
      { href: "/guides/lettre-de-motivation-alternance", label: "Le guide complet de la lettre d'alternance" },
      { href: "/guides/cv-alternance", label: "Faire un CV d'alternance" },
      { href: "/guides/mail-candidature-stage-alternance", label: "Le mail de candidature" },
      { href: "/guides/candidature-spontanee-alternance", label: "La candidature spontanée" },
      { href: "/guides/je-ne-trouve-pas-d-alternance", label: "Je ne trouve pas d'alternance" },
    ],
  },
  stage: {
    path: "/outils/lettre-de-motivation-stage",
    title: "Lettre de motivation stage : générateur gratuit et exemples (2026)",
    description:
      "Génère ta lettre de motivation de stage en 2 minutes, gratuitement et sans compte : lettre + mail d'envoi, exemples complets, structure et erreurs à éviter.",
    h1: "Lettre de motivation pour un stage : le générateur gratuit",
    intro:
      "Remplis les champs : ta lettre s'écrit en direct, avec la version mail pour l'envoyer. C'est gratuit, sans compte, et rien n'est enregistré. Ensuite, relis-la et rends-la vraiment personnelle : c'est ce qui fait la différence auprès d'un recruteur.",
    structure: [
      "L'objet : le poste, la durée du stage et sa date de début.",
      "1er paragraphe : ta formation, ton école, la durée et les dates du stage.",
      "2e paragraphe : pourquoi cette entreprise, avec un détail concret.",
      "3e paragraphe : ce que tu apportes, avec une expérience réelle et 2 ou 3 qualités prouvées.",
      "4e paragraphe : ce que ce stage t'apportera, et ce que tu veux y apprendre.",
      "La fin : la demande d'entretien et tes coordonnées. Une page maximum.",
    ],
    examples: [
      {
        title: "Exemple : stage de 10 semaines en marketing digital (BUT TC)",
        input: example({
          contract: "stage",
          gender: "f",
          firstName: "Inès",
          lastName: "Durand",
          phone: "06 22 33 44 55",
          email: "ines.durand@mail.fr",
          company: "Agence Nova",
          position: "assistante marketing digital",
          currentStudies: "en 2e année de BUT Techniques de commercialisation",
          school: "l'IUT de Lille",
          duration: "10 semaines",
          startDate: "avril 2027",
          whyCompany: "vos campagnes pour des marques locales sont celles que je partage le plus autour de moi",
          experience: "J'ai repris le compte Instagram de l'association sportive de mon IUT et doublé son nombre d'abonnés en un an.",
          qualities: ["creatif", "digital", "curieux"],
        }),
      },
      {
        title: "Exemple : stage de fin d'études en contrôle de gestion (master)",
        input: example({
          contract: "stage",
          gender: "n",
          firstName: "Sasha",
          lastName: "Leroy",
          phone: "07 11 22 33 44",
          email: "sasha.leroy@mail.fr",
          company: "Maison Vallée",
          position: "contrôleur de gestion stagiaire",
          currentStudies: "en master 2 Contrôle de gestion",
          school: "l'IAE de Bordeaux",
          duration: "6 mois",
          startDate: "février 2027",
          whyCompany: "votre croissance à l'international pose exactement les questions de pilotage que je veux traiter",
          experience: "En alternance l'an dernier, j'ai automatisé le reporting mensuel des ventes et réduit sa préparation de deux jours à une demi-journée.",
          qualities: ["rigoureux", "autonome", "organise"],
        }),
      },
    ],
    mistakes: [
      "Envoyer la même lettre partout : le recruteur le voit tout de suite.",
      "Oublier la durée et les dates du stage : c'est la première chose qu'il cherche.",
      "Ne parler que de ce que le stage t'apporte : dis aussi ce que tu apportes.",
      "Des qualités sans preuve : « rigoureux » ne vaut rien sans un exemple concret.",
      "Laisser des fautes : fais-la relire, ou lis-la à voix haute.",
    ],
    faq: [
      {
        q: "Faut-il une lettre de motivation pour un stage ?",
        a: "Souvent oui, surtout pour une candidature spontanée ou un stage long. Elle peut être courte : une page maximum, ou un mail soigné avec ton CV en pièce jointe.",
      },
      {
        q: "Que mettre dans une lettre de motivation de stage ?",
        a: "Ta formation, la durée et les dates du stage, ce qui t'attire dans l'entreprise, une expérience concrète, et ce que tu veux apprendre. Termine par une demande d'entretien.",
      },
      {
        q: "Lettre ou mail : comment l'envoyer ?",
        a: "Par mail, écris un message court qui résume ta demande, et joins ton CV et ta lettre en PDF. Le générateur te donne les deux versions.",
      },
      {
        q: "Peut-on utiliser ChatGPT ou un générateur pour sa lettre ?",
        a: "Oui pour démarrer, à condition de la personnaliser : un détail concret sur l'entreprise et une vraie expérience à toi valent plus que de belles phrases générales.",
      },
    ],
    guides: [
      { href: "/guides/lettre-de-motivation-stage", label: "Le guide complet de la lettre de stage" },
      { href: "/guides/cv-stage", label: "Faire un CV de stage" },
      { href: "/guides/mail-candidature-stage-alternance", label: "Le mail de candidature" },
      { href: "/guides/trouver-un-stage", label: "Trouver un stage" },
      { href: "/guides/gratification-de-stage", label: "La gratification de stage" },
    ],
  },
};

export function coverLetterMetadata(contract: LetterContract): Metadata {
  const page = COVER_LETTER_PAGES[contract];
  const url = `${SITE_URL}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, type: "website" },
  };
}

const sectionTitle: React.CSSProperties = { fontSize: 20, margin: "40px 0 12px" };

export function CoverLetterPage({ contract }: { contract: LetterContract }) {
  const page = COVER_LETTER_PAGES[contract];
  const other = COVER_LETTER_PAGES[contract === "alternance" ? "stage" : "alternance"];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: page.h1,
      url: `${SITE_URL}${page.path}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr-FR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.h1, item: `${SITE_URL}${page.path}` },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-9">
      {jsonLd.map((data) => (
        <script key={data["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
      ))}
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link> › {page.h1}
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>{page.h1}</h1>
      <p style={{ fontSize: 15, margin: "12px 0 24px", maxWidth: "70ch" }}>{page.intro}</p>

      <CoverLetterGenerator defaultContract={contract} />

      <div style={{ maxWidth: "70ch" }}>
        <h2 style={sectionTitle}>La structure qui marche</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
          {page.structure.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>

        {page.examples.map(({ title, input }) => {
          const letter = buildCoverLetter(input);
          return (
            <section key={title}>
              <h2 style={sectionTitle}>{title}</h2>
              <div className="card" style={{ padding: "var(--space-6)", fontSize: 14, lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 12px" }}>
                  <strong>Objet : {letter.subject}</strong>
                </p>
                <p style={{ margin: "0 0 12px" }}>{letter.greeting}</p>
                {letter.paragraphs.map((paragraph) => (
                  <p key={paragraph} style={{ margin: "0 0 12px" }}>
                    {paragraph}
                  </p>
                ))}
                <p style={{ margin: "0 0 12px" }}>{letter.closing}</p>
                <p style={{ margin: 0 }}>{letter.signature}</p>
              </div>
            </section>
          );
        })}
        <p style={{ fontSize: 12, margin: "8px 0 0" }}>Exemples fictifs : personnes, parcours et entreprises inventés.</p>

        <h2 style={sectionTitle}>Les erreurs à éviter</h2>
        <ul style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
          {page.mistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2 style={sectionTitle}>Questions fréquentes</h2>
        {page.faq.map((item) => (
          <div key={item.q} style={{ margin: "0 0 14px" }}>
            <h3 style={{ fontSize: 15.5, margin: "0 0 4px" }}>{item.q}</h3>
            <p style={{ fontSize: 15, margin: 0 }}>{item.a}</p>
          </div>
        ))}

        <h2 style={sectionTitle}>Pour aller plus loin</h2>
        <div className="flex flex-wrap gap-2">
          {page.guides.map((guide) => (
            <Link key={guide.href} href={guide.href} className="tag tag-neutral">
              {guide.label}
            </Link>
          ))}
          <Link href={other.path} className="tag tag-neutral">
            {other.h1.split(" : ")[0]}
          </Link>
          <Link href="/outils/simulateur-salaire-alternance" className="tag tag-neutral">
            Simulateur de salaire
          </Link>
          <Link href={`/${contract}`} className="tag tag-neutral">
            Les offres {contract === "alternance" ? "d'alternance" : "de stage"} par métier et par ville
          </Link>
        </div>
      </div>
    </div>
  );
}
