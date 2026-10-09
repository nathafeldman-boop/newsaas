import Link from "next/link";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { STAGE_HOURLY_MIN, STAGE_MANDATORY_AFTER, formatEuros } from "@/lib/salary/legalRates";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { LISTED_METIERS } from "@/lib/seo/metiers";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { capitalize, monthYear, plural, segmentPath } from "@/lib/seo/programmaticPage";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";
import { signupHref } from "@/lib/signup/intent";
import { SITE_URL } from "@/lib/site";
import type { ContractType } from "@/types/database";

// Pages « alternance urgente » et « stage urgent » : à l'automne, les
// étudiants sans contrat ou sans stage cherchent les offres du moment. Offres
// de la semaine par ville et par métier, repères légaux et plan d'action,
// avec les 24 dernières offres. Index en cache 1 h, liste en cache 10 min.

const hourly = formatEuros(STAGE_HOURLY_MIN, 2);

type Copy = {
  name: string;
  h1: string;
  title: (n: number, month: string) => string;
  description: (n: number) => string;
  intro: (n: number) => React.ReactNode;
  latestTitle: string;
  planTitle: string;
  plan: React.ReactNode[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
};

const COPY: Record<ContractType, Copy> = {
  alternance: {
    name: "Alternance urgente",
    h1: "Alternance urgente : les offres publiées cette semaine",
    title: (n, month) => `Alternance urgente : ${plural(n, "offre publiée", "offres publiées")} cette semaine (${month})`,
    description: (n) =>
      `${plural(n, "offre", "offres")} d'alternance publiées ces 7 derniers jours, par ville et par métier. Pas encore d'entreprise ? Tu peux encore signer jusqu'à 3 mois après le début de ta formation : le plan d'action.`,
    intro: (n) => (
      <>
        La rentrée est passée et tu n&apos;as pas encore signé ? Ce n&apos;est pas fichu :{" "}
        <strong>{plural(n, "offre d'alternance a été publiée", "offres d'alternance ont été publiées")} ces 7 derniers jours</strong>, et un contrat
        d&apos;apprentissage peut commencer jusqu&apos;à 3 mois après le début de ta formation. Les offres récentes sont
        celles où tu as le plus de chances : postule dans les 48 heures.
      </>
    ),
    latestTitle: "Les dernières offres d'alternance",
    planTitle: "Le plan pour signer avant la fin de l'automne",
    plan: [
      <>
        Demande à ton CFA s&apos;il t&apos;accepte sans contrat le temps de trouver (3 mois au maximum) et la liste des
        entreprises qui le contactent : <Link href="/guides/alternance-sans-entreprise">commencer sans employeur</Link>.
      </>,
      <>Regarde chaque jour les nouvelles offres de ta ville et de ton métier, et postule dans les 48 heures.</>,
      <>
        Envoie des candidatures spontanées aux entreprises proches de chez toi et de ton école, avec ton rythme
        école / entreprise : <Link href="/guides/candidature-spontanee-alternance">modèle de candidature spontanée</Link>.
      </>,
      <>
        Élargis ta zone au département ou à la ville voisine : les pages par département (par exemple{" "}
        <Link href="/alternance/departement/nord">le Nord</Link> ou <Link href="/alternance/departement/rhone">le Rhône</Link>) regroupent
        toutes les communes.
      </>,
      <>
        Relance au bout de 7 à 10 jours sans réponse : <Link href="/guides/relancer-candidature">comment relancer</Link>.
      </>,
      <>
        Rien au bout de quelques semaines ? Revois ton ciblage avec notre guide{" "}
        <Link href="/guides/je-ne-trouve-pas-d-alternance">je ne trouve pas d&apos;alternance</Link>, et garde en tête la{" "}
        <Link href="/guides/rentree-decalee-alternance">rentrée décalée</Link> de janvier-février.
      </>,
    ],
    faq: [
      {
        q: "Est-il trop tard pour trouver une alternance en octobre ?",
        a: "Non. Un contrat d'apprentissage peut commencer jusqu'à 3 mois après le début de ta formation, et de nouvelles offres sont publiées chaque jour. Beaucoup d'entreprises recrutent encore après la rentrée, notamment pour remplacer un alternant qui n'a pas confirmé.",
      },
      {
        q: "Puis-je commencer ma formation sans entreprise ?",
        a: "Oui, si ton CFA l'accepte : entre 16 et 29 ans, tu peux commencer la formation pendant 3 mois au maximum sans employeur, avec le statut de stagiaire de la formation professionnelle (article L6222-12-1 du Code du travail). Tu n'es pas payé tant que tu n'as pas signé de contrat.",
      },
      {
        q: "Et si je n'ai rien trouvé au bout de 3 mois ?",
        a: "Tu ne peux pas rester en apprentissage sans contrat. Vois avec ton école les solutions : continuer sous un autre statut quand c'est possible, viser un contrat de professionnalisation, ou une rentrée décalée en janvier ou février.",
      },
    ],
    sources: [
      { label: "Code du travail, article L6222-12-1", url: "https://code.travail.gouv.fr/code-du-travail/l6222-12-1" },
      { label: "Contrat d'apprentissage (service-public.gouv.fr)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" },
    ],
  },
  stage: {
    name: "Stage urgent",
    h1: "Stage urgent : les offres de stage publiées cette semaine",
    title: (n, month) => `Stage urgent : ${plural(n, "offre de stage publiée", "offres de stage publiées")} cette semaine (${month})`,
    description: (n) =>
      `${plural(n, "offre", "offres")} de stage publiées ces 7 derniers jours, par ville et par domaine. Tu dois trouver vite ? Le plan pour décrocher ton stage et faire signer ta convention à temps.`,
    intro: (n) => (
      <>
        Ton école te demande un stage et tu n&apos;as encore rien ?{" "}
        <strong>{plural(n, "offre de stage a été publiée", "offres de stage ont été publiées")} ces 7 derniers jours</strong>. Les offres
        récentes sont celles où tu as le plus de chances : postule dans les 48 heures, et prépare en parallèle des
        candidatures spontanées.
      </>
    ),
    latestTitle: "Les dernières offres de stage",
    planTitle: "Le plan pour décrocher un stage rapidement",
    plan: [
      <>Regarde chaque jour les nouvelles offres de ta ville et de ton domaine, et postule dans les 48 heures.</>,
      <>
        Demande à ton école la liste des entreprises qui ont déjà accueilli ses étudiants, et contacte les anciens de ta
        formation : c&apos;est souvent là que se trouvent les stages qui ne sont jamais publiés.
      </>,
      <>
        Envoie des candidatures spontanées aux entreprises proches, avec tes dates exactes et la durée du stage dès la
        première ligne : <Link href="/guides/mail-candidature-stage-alternance">modèles de mails de candidature</Link>.
      </>,
      <>
        Un CV d&apos;une page et une lettre courte suffisent : <Link href="/outils/cv-stage">générateur de CV de stage</Link> et{" "}
        <Link href="/outils/lettre-de-motivation-stage">de lettre de motivation</Link>, gratuits.
      </>,
      <>
        Relance au bout de 7 à 10 jours sans réponse : <Link href="/guides/relancer-candidature">comment relancer</Link>.
      </>,
      <>
        Dès que tu as un accord, lance la <Link href="/guides/convention-de-stage">convention de stage</Link> avec ton école : elle doit
        être signée avant ton premier jour.
      </>,
    ],
    faq: [
      {
        q: "Comment trouver un stage rapidement ?",
        a: "Postule aux offres publiées dans la semaine, envoie des candidatures spontanées aux entreprises proches avec tes dates et la durée du stage, et demande à ton école et aux anciens étudiants les entreprises qui accueillent des stagiaires. Relance au bout d'une semaine sans réponse.",
      },
      {
        q: "Peut-on commencer un stage sans convention ?",
        a: "Non. La convention de stage doit être signée par toi, l'entreprise et ton établissement avant le premier jour. Préviens ton école dès que tu as un accord : la signature prend parfois plusieurs jours.",
      },
      {
        q: "Un stage court est-il payé ?",
        a: `La gratification n'est obligatoire qu'au-delà de ${STAGE_MANDATORY_AFTER} de stage dans la même année d'enseignement : au minimum ${hourly} de l'heure en 2026. En dessous, l'entreprise peut te verser une gratification, sans y être obligée.`,
      },
    ],
    sources: [
      { label: "Gratification minimale de stage (service-public.gouv.fr)", url: "https://entreprendre.service-public.gouv.fr/vosdroits/F32131" },
      { label: "Stage étudiant en milieu professionnel (justice.fr)", url: "https://www.justice.fr/fiche/stage-etudiant-milieu-professionnel" },
    ],
  },
};

export async function urgentOffersMetadata(type: ContractType): Promise<Metadata> {
  const index = await getProgrammaticIndex(type);
  const copy = COPY[type];
  const path = `/${type}/urgent`;
  const title = copy.title(index.recent7d, monthYear(index.generatedAt));
  const description = copy.description(index.recent7d);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: INDEXABLE_ROBOTS,
    openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
  };
}

export async function UrgentOffersPage({ type }: { type: ContractType }) {
  const [index, { offers }] = await Promise.all([getProgrammaticIndex(type), fetchPublicOffers(type, 1)]);
  const copy = COPY[type];
  const path = `/${type}/urgent`;
  const typeLabel = type === "alternance" ? "Alternance" : "Stage";

  const cities = Object.values(index.cities)
    .filter((c) => c.recent7d > 0)
    .sort((a, b) => b.recent7d - a.recent7d)
    .slice(0, 16)
    .map((c) => ({ href: segmentPath(type, null, c.slug), label: c.label, count: c.recent7d }));
  const metiers = LISTED_METIERS.map((m) => ({ m, stats: index.metiers[m.slug] }))
    .filter((x) => x.stats && x.stats.recent7d > 0)
    .sort((a, b) => b.stats!.recent7d - a.stats!.recent7d)
    .slice(0, 16)
    .map((x) => ({ href: segmentPath(type, x.m.slug, null), label: capitalize(x.m.label), count: x.stats!.recent7d }));

  const updated = new Date(index.generatedAt);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: typeLabel, item: `${SITE_URL}/${type}` },
      { "@type": "ListItem", position: 3, name: copy.name, item: `${SITE_URL}${path}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
  const signupLink = signupHref({ type });

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, marginBottom: 12 }}>
        <Link href="/">Accueil</Link> › <Link href={`/${type}`}>{typeLabel}</Link> › {copy.name}
      </nav>

      <h1 style={{ fontSize: 28, margin: 0 }}>{copy.h1}</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.7 }}>
        Mis à jour le{" "}
        <time dateTime={index.generatedAt}>
          {updated.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
        </time>
      </p>

      <p style={{ fontSize: 15, margin: "16px 0 0" }}>{copy.intro(index.recent7d)}</p>

      <div className="card mt-6" style={{ padding: "var(--space-4)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
        <p style={{ fontSize: 14, margin: 0 }}>
          <strong>Ne rate pas les prochaines.</strong> Crée ton profil gratuit : les nouvelles offres de ta ville et de ton
          {type === "alternance" ? " métier" : " domaine"} arrivent dans ton fil dès leur publication.
        </p>
        <Link href={signupLink} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
          Créer mon profil gratuit
        </Link>
      </div>

      <LinkChips title="Les villes avec le plus d'offres cette semaine" links={cities} />
      <LinkChips title={`Les ${type === "alternance" ? "métiers" : "domaines"} avec le plus d'offres cette semaine`} links={metiers} />

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: 0 }}>{copy.latestTitle}</h2>
        <PublicOffersGrid offers={offers} page={1} totalPages={1} basePath={`/offres/${type}`} />
        <p style={{ fontSize: 14, marginTop: 16 }}>
          <Link href={`/offres/${type}?page=2`}>Voir les offres suivantes →</Link>
        </p>
      </section>

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>{copy.planTitle}</h2>
        <ul style={{ fontSize: 15, paddingLeft: 20, margin: 0, display: "grid", gap: 6 }}>
          {copy.plan.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
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
          Sources :{" "}
          {copy.sources.map((source, i) => (
            <span key={source.url}>
              {i > 0 && " ; "}
              <a href={source.url} rel="noopener">
                {source.label}
              </a>
            </span>
          ))}
          .
        </p>
      </section>

      <StickySignupBar href={signupLink} />
    </div>
  );
}
