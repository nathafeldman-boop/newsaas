import Link from "next/link";
import type { Metadata } from "next";
import { CvBuilder } from "@/components/tools/CvBuilder";
import { CvSheet } from "@/components/tools/CvSheet";
import { EMPTY_CV_INPUT, type CvContract, type CvInput } from "@/lib/tools/cv";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";

// Pages /outils/cv-alternance et /outils/cv-stage : le générateur gratuit
// (PDF via l'impression du navigateur), la structure, un exemple complet
// rendu côté serveur, les erreurs à éviter et une FAQ. Exemples fictifs.

type PageContent = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  structure: string[];
  example: { title: string; cv: CvInput };
  mistakes: string[];
  faq: { q: string; a: string }[];
  guides: { href: string; label: string }[];
};

export const CV_PAGES: Record<CvContract, PageContent> = {
  alternance: {
    path: "/outils/cv-alternance",
    title: "CV alternance : générateur gratuit en PDF et exemple (2026)",
    description:
      "Crée ton CV d'alternance gratuitement et télécharge-le en PDF, sans compte : modèle clair d'une page, exemple complet, ce qu'il faut mettre et les erreurs à éviter.",
    h1: "CV d'alternance : le générateur gratuit",
    intro:
      "Remplis les champs : ton CV se met en page tout seul, sur une page A4, et se télécharge en PDF. C'est gratuit, sans compte, et rien n'est enregistré. Un CV d'alternance doit dire en 5 secondes quel poste tu vises, quelle formation tu prépares et à quel rythme.",
    structure: [
      "Le titre : le poste visé, le contrat et la date (« Alternance en BTS MCO – vendeur – rentrée septembre 2027 »).",
      "Tes coordonnées : ville, téléphone, mail, et ton LinkedIn si tu en as un.",
      "Le rythme et la rentrée : c'est la première question de l'entreprise.",
      "Un profil de 2 lignes : qui tu es, ce que tu cherches, ce que tu apportes.",
      "La formation : celle que tu vas préparer en alternance, puis ton dernier diplôme.",
      "Les expériences : jobs, stages, projets, bénévolat, avec des résultats concrets.",
      "Les compétences, les langues avec leur niveau, et quelques centres d'intérêt qui disent quelque chose de toi.",
    ],
    example: {
      title: "Exemple de CV d'alternance (BTS MCO)",
      cv: {
        ...EMPTY_CV_INPUT,
        contract: "alternance",
        firstName: "Léa",
        lastName: "Martin",
        headline: "Alternance en BTS MCO – vendeuse conseil – rentrée septembre 2027",
        city: "Lyon",
        phone: "06 12 34 56 78",
        email: "lea.martin@mail.fr",
        summary: "Sportive et à l'aise avec les clients, je cherche une alternance en magasin pour préparer mon BTS MCO et apprendre le métier de la vente.",
        availability: "2 jours en formation, 3 jours en entreprise, dès septembre 2027",
        education: [
          { dates: "2027-2029", title: "BTS Management commercial opérationnel (en alternance)", place: "CFA Sud Commerce, Lyon", details: "" },
          { dates: "2024-2027", title: "Baccalauréat STMG", place: "Lycée Ampère, Lyon", details: "Option mercatique" },
        ],
        experience: [
          {
            dates: "Été 2026",
            title: "Agente d'accueil (job d'été)",
            place: "Camping Les Pins",
            details: "Accueil et renseignement des vacanciers, jusqu'à 200 par jour\nGestion des réservations et de la caisse",
          },
          { dates: "2023-2027", title: "Bénévole", place: "Club de football de Villeurbanne", details: "Organisation des tournois jeunes et tenue de la buvette" },
        ],
        skills: "Encaissement, conseil client, mise en rayon, Excel",
        languages: "Anglais : B1, Espagnol : A2",
        interests: "Running (semi-marathon), football",
      },
    },
    mistakes: [
      "Un titre vague (« Étudiant ») : écris le poste, le contrat et la date.",
      "Oublier le rythme d'alternance et la date de rentrée.",
      "Plus d'une page : à ton niveau, une page suffit toujours.",
      "Des expériences sans résultat : chiffre ce que tu as fait quand c'est possible.",
      "Une photo ou une adresse mail peu sérieuse : mieux vaut pas de photo qu'une photo de vacances.",
    ],
    faq: [
      {
        q: "Que mettre dans un CV pour une alternance ?",
        a: "Un titre avec le poste, le contrat et la date de rentrée, tes coordonnées, ton rythme d'alternance, un profil de 2 lignes, la formation que tu prépares, tes expériences (jobs, stages, projets), tes compétences et tes langues.",
      },
      {
        q: "Faut-il mettre une photo sur un CV d'alternance ?",
        a: "Ce n'est pas obligatoire en France. Si tu en mets une, choisis une photo sobre et récente ; sinon, n'en mets pas.",
      },
      {
        q: "Je n'ai aucune expérience, que mettre ?",
        a: "Tes jobs d'été, ton bénévolat, tes projets d'école, ton sport en club, tes stages d'observation : tout ce qui montre que tu sais t'engager. Un recruteur d'alternant n'attend pas d'expérience professionnelle.",
      },
      {
        q: "Comment télécharger mon CV en PDF ?",
        a: "Clique sur « Télécharger en PDF », puis choisis « Enregistrer au format PDF » dans la fenêtre d'impression. C'est gratuit et rien n'est enregistré sur nos serveurs.",
      },
    ],
    guides: [
      { href: "/guides/cv-alternance", label: "Le guide complet du CV d'alternance" },
      { href: "/outils/lettre-de-motivation-alternance", label: "Générateur de lettre de motivation" },
      { href: "/guides/soft-skills-cv", label: "Les soft skills à mettre sur ton CV" },
      { href: "/guides/profil-linkedin-etudiant", label: "Ton profil LinkedIn" },
      { href: "/guides/je-ne-trouve-pas-d-alternance", label: "Je ne trouve pas d'alternance" },
    ],
  },
  stage: {
    path: "/outils/cv-stage",
    title: "CV de stage : générateur gratuit en PDF et exemple (2026)",
    description:
      "Crée ton CV de stage gratuitement et télécharge-le en PDF, sans compte : modèle clair d'une page, exemple complet, ce qu'il faut mettre et les erreurs à éviter.",
    h1: "CV de stage : le générateur gratuit",
    intro:
      "Remplis les champs : ton CV se met en page tout seul, sur une page A4, et se télécharge en PDF. C'est gratuit, sans compte, et rien n'est enregistré. Un CV de stage doit dire en 5 secondes quel stage tu cherches, à quelles dates, et ce que tu sais déjà faire.",
    structure: [
      "Le titre : le stage visé, sa durée et ses dates (« Stage de 10 semaines en marketing digital – avril 2027 »).",
      "Tes coordonnées : ville, téléphone, mail, et ton LinkedIn si tu en as un.",
      "Les dates exactes du stage : c'est la première chose que regarde le recruteur.",
      "Un profil de 2 lignes : ta formation, ce que tu cherches, ce que tu apportes.",
      "La formation : ton diplôme en cours, puis le précédent.",
      "Les expériences : stages, jobs, projets d'école, associations, avec des résultats concrets.",
      "Les compétences (logiciels, langages, méthodes) et les langues avec leur niveau.",
    ],
    example: {
      title: "Exemple de CV de stage (BUT TC, marketing digital)",
      cv: {
        ...EMPTY_CV_INPUT,
        contract: "stage",
        firstName: "Inès",
        lastName: "Durand",
        headline: "Stage de 10 semaines en marketing digital – avril 2027",
        city: "Lille",
        phone: "06 22 33 44 55",
        email: "ines.durand@mail.fr",
        summary: "Étudiante en 2e année de BUT TC, créative et à l'aise avec les réseaux sociaux, je cherche un stage pour piloter des campagnes réelles.",
        availability: "Du 6 avril au 12 juin 2027",
        education: [
          { dates: "2025-2028", title: "BUT Techniques de commercialisation", place: "IUT de Lille", details: "Parcours marketing digital, e-business et entrepreneuriat" },
          { dates: "2025", title: "Baccalauréat général", place: "Lycée Faidherbe, Lille", details: "Spécialités SES et anglais" },
        ],
        experience: [
          {
            dates: "2025-2027",
            title: "Responsable communication (bénévole)",
            place: "Association sportive de l'IUT",
            details: "Gestion du compte Instagram : abonnés doublés en un an\nCréation des visuels des événements sur Canva",
          },
          { dates: "Été 2026", title: "Vendeuse (job d'été)", place: "Boutique de prêt-à-porter", details: "Conseil client et mise en avant des nouvelles collections" },
        ],
        skills: "Canva, Meta Business Suite, rédaction web, Google Analytics",
        languages: "Anglais : B2",
        interests: "Photographie, voyages en Europe",
      },
    },
    mistakes: [
      "Oublier les dates et la durée du stage.",
      "Un titre vague (« Étudiante ») : écris le stage visé.",
      "Plus d'une page : une page suffit toujours pour un stage.",
      "Lister des logiciels sans niveau ni preuve : dis ce que tu en as fait.",
      "Envoyer le même CV partout : adapte le titre et le profil à chaque stage.",
    ],
    faq: [
      {
        q: "Que mettre dans un CV de stage ?",
        a: "Un titre avec le stage visé et ses dates, tes coordonnées, un profil de 2 lignes, ta formation, tes expériences (stages, jobs, projets, associations), tes compétences et tes langues.",
      },
      {
        q: "Faut-il mettre une photo sur un CV de stage ?",
        a: "Ce n'est pas obligatoire en France. Si tu en mets une, choisis une photo sobre et récente ; sinon, n'en mets pas.",
      },
      {
        q: "Comment faire un CV de stage sans expérience ?",
        a: "Mets en avant tes projets d'école, tes jobs, ton engagement associatif ou sportif, et les compétences acquises en formation. Un recruteur de stagiaire n'attend pas d'expérience professionnelle.",
      },
      {
        q: "Comment télécharger mon CV en PDF ?",
        a: "Clique sur « Télécharger en PDF », puis choisis « Enregistrer au format PDF » dans la fenêtre d'impression. C'est gratuit et rien n'est enregistré sur nos serveurs.",
      },
    ],
    guides: [
      { href: "/guides/cv-stage", label: "Le guide complet du CV de stage" },
      { href: "/outils/lettre-de-motivation-stage", label: "Générateur de lettre de motivation" },
      { href: "/guides/soft-skills-cv", label: "Les soft skills à mettre sur ton CV" },
      { href: "/guides/trouver-un-stage", label: "Trouver un stage" },
      { href: "/guides/convention-de-stage", label: "La convention de stage" },
    ],
  },
};

export function cvMetadata(contract: CvContract): Metadata {
  const page = CV_PAGES[contract];
  const url = `${SITE_URL}${page.path}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, type: "website" },
  };
}

const sectionTitle: React.CSSProperties = { fontSize: 20, margin: "40px 0 12px" };

export function CvPage({ contract }: { contract: CvContract }) {
  const page = CV_PAGES[contract];
  const other = CV_PAGES[contract === "alternance" ? "stage" : "alternance"];
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

      <CvBuilder defaultContract={contract} />

      <div style={{ maxWidth: "70ch" }}>
        <h2 style={sectionTitle}>Ce qu&apos;il faut mettre, dans l&apos;ordre</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
          {page.structure.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>

        <h2 style={sectionTitle}>{page.example.title}</h2>
        <CvSheet cv={page.example.cv} />
        <p style={{ fontSize: 12, margin: "8px 0 0" }}>Exemple fictif : personne et parcours inventés.</p>

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
          <Link href={`/${contract}`} className="tag tag-neutral">
            Les offres {contract === "alternance" ? "d'alternance" : "de stage"} par métier et par ville
          </Link>
        </div>
      </div>
    </div>
  );
}
