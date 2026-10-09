import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { PUBLIC_OFFERS_PAGE_SIZE } from "@/lib/offers/fetchPublicOffers";
import { normalizeCityKey, slugify } from "@/lib/offers/segments";
import { getStagePeriodOffers, STAGE_PERIODS, type StagePeriodSlug } from "@/lib/offers/stagePeriods";
import { STAGE_HOURLY_MIN, STAGE_MANDATORY_AFTER, formatEuros, internshipGratification } from "@/lib/salary/legalRates";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { pagedPath, pagedTitle } from "@/lib/seo/pagination";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { plural } from "@/lib/seo/programmaticPage";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";
import { signupHref } from "@/lib/signup/intent";
import { SITE_URL } from "@/lib/site";

// Pages « stage de fin d'études » et « stage janvier 2027 » : offres de stage
// repérées par leur intitulé (voir lib/offers/stagePeriods.ts), villes et
// entreprises, repères légaux vérifiés et guides. Sous INDEXABLE_MIN offres,
// la page reste visible mais en noindex.
const INDEXABLE_MIN = 10;
const UNNAMED = /entreprise non communiqu/i;

const hourly = formatEuros(STAGE_HOURLY_MIN, 2);
const monthly35 = formatEuros(internshipGratification(35).gross, 2);

type Copy = {
  h1: string;
  title: (n: number) => string;
  description: (n: number, companies: number) => string;
  intro: (n: number) => string;
  facts: React.ReactNode[];
  faq: { q: string; a: string }[];
};

const COPY: Record<StagePeriodSlug, Copy> = {
  "fin-d-etudes": {
    h1: "Stage de fin d'études : les offres de stage de 6 mois (PFE, M2, 3A)",
    title: (n) => `Stage de fin d'études 2027 : ${plural(n, "offre")} de stage de 6 mois et PFE`,
    description: (n, c) =>
      `${plural(n, "offre")} de stage de fin d'études (6 mois, PFE, M2, 3A) chez ${plural(c, "entreprise")}, mises à jour chaque jour. Quand postuler, gratification minimale, convention : l'essentiel.`,
    intro: (n) =>
      `Le stage de fin d'études dure en général 6 mois, au dernier semestre de ta formation. Les entreprises publient ces offres dès l'automne pour un démarrage en janvier, février ou mars : c'est maintenant qu'il faut postuler. Voici ${plural(n, "offre")} de stage dont l'intitulé parle de fin d'études, de PFE, de 6 mois, de M2 ou de 3A.`,
    facts: [
      <>Durée : 6 mois au maximum par année d&apos;enseignement dans la même entreprise (924 heures de présence).</>,
      <>
        Gratification obligatoire au-delà de {STAGE_MANDATORY_AFTER} : {hourly} de l&apos;heure au minimum en 2026, soit
        environ {monthly35} par mois pour 35 heures par semaine (<Link href="/guides/gratification-de-stage">détail du calcul</Link>).
      </>,
      <>
        Une <Link href="/guides/convention-de-stage">convention de stage</Link> signée par toi, l&apos;entreprise et ton école
        avant le premier jour.
      </>,
      <>
        Embauché après ? Une partie de la durée du stage est déduite de ta période d&apos;essai :{" "}
        <Link href="/guides/stage-de-fin-d-etudes">notre guide du stage de fin d&apos;études</Link>.
      </>,
    ],
    faq: [
      {
        q: "Quand chercher son stage de fin d'études ?",
        a: "4 à 6 mois avant la date de début. Pour un stage qui commence en février ou mars, les grandes entreprises publient leurs offres dès l'automne ; les PME plus tard, au fil de leurs besoins.",
      },
      {
        q: "Combien est payé un stage de fin d'études ?",
        a: `Au minimum ${hourly} de l'heure en 2026 dès que le stage dépasse ${STAGE_MANDATORY_AFTER}, soit environ ${monthly35} par mois pour 35 heures par semaine. Beaucoup d'entreprises versent plus, surtout en école d'ingénieurs et de commerce.`,
      },
      {
        q: "Un stage de fin d'études peut-il durer plus de 6 mois ?",
        a: "Non, pas dans la même entreprise : 6 mois au maximum par année d'enseignement, soit 924 heures de présence.",
      },
    ],
  },
  "janvier-2027": {
    h1: "Stage janvier 2027 : les offres qui démarrent en début d'année",
    title: (n) => `Stage janvier 2027 : ${plural(n, "offre")} de stage pour janvier et février`,
    description: (n, c) =>
      `${plural(n, "offre")} de stage qui démarrent en janvier ou février 2027, chez ${plural(c, "entreprise")}. Mises à jour chaque jour, avec les repères pour postuler à temps.`,
    intro: (n) =>
      `Tu cherches un stage qui commence en janvier ou février 2027 ? Voici ${plural(n, "offre")} de stage dont l'intitulé annonce un démarrage en début d'année. Beaucoup d'offres ne donnent pas la date dans leur titre : regarde aussi les stages de fin d'études et les offres de ta ville.`,
    facts: [
      <>Postule maintenant : pour un début en janvier, compte 2 à 3 mois entre la candidature et la signature de la convention.</>,
      <>
        La <Link href="/guides/convention-de-stage">convention de stage</Link> doit être signée avant le premier jour : préviens
        ton école dès que tu as une réponse positive.
      </>,
      <>
        Gratification obligatoire au-delà de {STAGE_MANDATORY_AFTER} : {hourly} de l&apos;heure au minimum en 2026, montant
        réévalué au 1er janvier (<Link href="/guides/gratification-de-stage">détail</Link>).
      </>,
      <>
        Stage de 6 mois de fin de cursus ? Voir aussi les <Link href="/stage/fin-d-etudes">stages de fin d&apos;études</Link>.
      </>,
    ],
    faq: [
      {
        q: "Est-il trop tôt pour postuler en octobre pour un stage en janvier ?",
        a: "Non, c'est le bon moment : les entreprises recrutent leurs stagiaires de début d'année entre septembre et décembre. Plus tu attends, moins il reste d'offres.",
      },
      {
        q: "Combien est payé un stage qui commence en janvier 2027 ?",
        a: `Au minimum ${hourly} de l'heure en 2026 pour un stage de plus de ${STAGE_MANDATORY_AFTER}. Le minimum est réévalué au 1er janvier : vérifie le montant 2027 au moment de signer la convention.`,
      },
      {
        q: "Faut-il une convention pour un stage en janvier ?",
        a: "Oui, comme pour tout stage : une convention signée par toi, l'entreprise et ton établissement, avant le début du stage.",
      },
    ],
  },
};

async function loadModel(slug: StagePeriodSlug) {
  const [offers, index] = await Promise.all([getStagePeriodOffers(slug), getProgrammaticIndex("stage")]);
  const cityCounts = new Map<string, number>();
  for (const offer of offers) {
    const citySlug = slugify(normalizeCityKey(offer.location));
    if (index.cities[citySlug]) cityCounts.set(citySlug, (cityCounts.get(citySlug) ?? 0) + 1);
  }
  const cities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([citySlug, count]) => ({ href: `/stage/${citySlug}`, label: index.cities[citySlug].label, count }));
  const companyCounts = new Map<string, number>();
  for (const offer of offers) {
    if (!UNNAMED.test(offer.company)) companyCounts.set(offer.company, (companyCounts.get(offer.company) ?? 0) + 1);
  }
  const companies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]);
  return { offers, cities, companies, generatedAt: index.generatedAt };
}

export async function stagePeriodMetadata(slug: StagePeriodSlug, page: number): Promise<Metadata> {
  const { offers, companies } = await loadModel(slug);
  const copy = COPY[slug];
  const path = `/stage/${slug}`;
  const title = pagedTitle(copy.title(offers.length), page);
  const description = copy.description(offers.length, companies.length);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${pagedPath(path, page)}` },
    robots: offers.length >= INDEXABLE_MIN ? INDEXABLE_ROBOTS : { index: false, follow: true },
    openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
  };
}

export async function StagePeriodPage({ slug, page }: { slug: StagePeriodSlug; page: number }) {
  const { offers, cities, companies, generatedAt } = await loadModel(slug);
  const copy = COPY[slug];
  const path = `/stage/${slug}`;
  const totalPages = Math.max(1, Math.ceil(offers.length / PUBLIC_OFFERS_PAGE_SIZE));
  if (page > totalPages) notFound();
  const pageOffers = offers.slice((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE);
  const signupLink = signupHref({ type: "stage" });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Stage", item: `${SITE_URL}/stage` },
      { "@type": "ListItem", position: 3, name: STAGE_PERIODS[slug].name, item: `${SITE_URL}${path}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      {page === 1 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />}

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, marginBottom: 12 }}>
        <Link href="/">Accueil</Link> › <Link href="/stage">Stage</Link> › {STAGE_PERIODS[slug].name}
      </nav>
      <h1 style={{ fontSize: 28, margin: 0 }}>{copy.h1}</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.7 }}>
        Mis à jour le{" "}
        <time dateTime={generatedAt}>
          {new Date(generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
        </time>
      </p>

      {page === 1 && (
        <>
          <p style={{ fontSize: 15, margin: "16px 0 0" }}>{copy.intro(offers.length)}</p>
          {companies.length > 0 && (
            <p style={{ fontSize: 15, margin: "10px 0 0" }}>
              Entreprises qui publient le plus :{" "}
              {companies
                .slice(0, 6)
                .map(([name, count]) => `${name} (${count})`)
                .join(", ")}
              .
            </p>
          )}
          <div className="card mt-6" style={{ padding: "var(--space-4)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
            <p style={{ fontSize: 14, margin: 0 }}>
              <strong>Ne rate pas les prochaines.</strong> Crée ton profil gratuit : les nouvelles offres de stage de ta ville et
              de ton domaine arrivent dans ton fil dès leur publication.
            </p>
            <Link href={signupLink} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
              Créer mon profil gratuit
            </Link>
          </div>
          <LinkChips title="Où sont ces stages" links={cities} />
        </>
      )}

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: 0 }}>
          {page === 1 ? "Les offres" : `Les offres, page ${page}`} ({offers.length.toLocaleString("fr-FR")})
        </h2>
        <PublicOffersGrid offers={pageOffers} page={page} totalPages={totalPages} basePath={path} />
      </section>

      {page === 1 && (
        <>
          <section className="mt-8">
            <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Les repères à connaître</h2>
            <ul style={{ fontSize: 15, paddingLeft: 20, margin: 0, display: "grid", gap: 6 }}>
              {copy.facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
            <p style={{ fontSize: 14, marginTop: 12 }}>
              Pour postuler : <Link href="/guides/lettre-de-motivation-stage">lettre de motivation de stage</Link> ·{" "}
              <Link href="/guides/cv-stage">CV de stage</Link> · <Link href="/guides/entretien-de-stage">entretien de stage</Link>
            </p>
          </section>

          <section className="mt-8">
            <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Questions fréquentes</h2>
            {copy.faq.map((item) => (
              <div key={item.q} style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>{item.q}</h3>
                <p style={{ fontSize: 15, margin: 0 }}>{item.a}</p>
              </div>
            ))}
            <p style={{ fontSize: 13, opacity: 0.75 }}>
              Source :{" "}
              <a href="https://entreprendre.service-public.gouv.fr/vosdroits/F32131" rel="noopener">
                gratification minimale de stage (service-public.gouv.fr)
              </a>
              .
            </p>
          </section>
        </>
      )}

      <StickySignupBar href={signupLink} />
    </div>
  );
}
