import Link from "next/link";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { LISTED_METIERS } from "@/lib/seo/metiers";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { capitalize, monthYear, plural, segmentPath } from "@/lib/seo/programmaticPage";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";
import { signupHref } from "@/lib/signup/intent";
import { SITE_URL } from "@/lib/site";

// « Alternance urgente » : en octobre, les étudiants admis en formation sans
// contrat cherchent les offres du moment (« alternance urgent »). Page
// distincte de /offres/alternance : offres de la semaine par ville et par
// métier, rappel du délai légal (3 mois) et plan d'action, avec les 24
// dernières offres. Index en cache 1 h, liste en cache 10 min.
export const dynamic = "force-dynamic";

const PATH = "/alternance/urgent";

export async function generateMetadata(): Promise<Metadata> {
  const index = await getProgrammaticIndex("alternance");
  const title = `Alternance urgente : ${plural(index.recent7d, "offre publiée", "offres publiées")} cette semaine (${monthYear(index.generatedAt)})`;
  const description = `${plural(index.recent7d, "offre", "offres")} d'alternance publiées ces 7 derniers jours, par ville et par métier. Pas encore d'entreprise ? Tu peux encore signer jusqu'à 3 mois après le début de ta formation : le plan d'action.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${PATH}` },
    robots: INDEXABLE_ROBOTS,
    openGraph: { title, description, url: `${SITE_URL}${PATH}`, type: "website" },
  };
}

const FAQ = [
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
];

export default async function UrgentAlternancePage() {
  const [index, { offers }] = await Promise.all([getProgrammaticIndex("alternance"), fetchPublicOffers("alternance", 1)]);

  const cities = Object.values(index.cities)
    .filter((c) => c.recent7d > 0)
    .sort((a, b) => b.recent7d - a.recent7d)
    .slice(0, 16)
    .map((c) => ({ href: segmentPath("alternance", null, c.slug), label: c.label, count: c.recent7d }));
  const metiers = LISTED_METIERS.map((m) => ({ m, stats: index.metiers[m.slug] }))
    .filter((x) => x.stats && x.stats.recent7d > 0)
    .sort((a, b) => b.stats!.recent7d - a.stats!.recent7d)
    .slice(0, 16)
    .map((x) => ({ href: segmentPath("alternance", x.m.slug, null), label: capitalize(x.m.label), count: x.stats!.recent7d }));

  const updated = new Date(index.generatedAt);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Alternance", item: `${SITE_URL}/alternance` },
      { "@type": "ListItem", position: 3, name: "Alternance urgente", item: `${SITE_URL}${PATH}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
  const signupLink = signupHref({ type: "alternance" });

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, marginBottom: 12 }}>
        <Link href="/">Accueil</Link> › <Link href="/alternance">Alternance</Link> › Alternance urgente
      </nav>

      <h1 style={{ fontSize: 28, margin: 0 }}>Alternance urgente : les offres publiées cette semaine</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.7 }}>
        Mis à jour le{" "}
        <time dateTime={index.generatedAt}>
          {updated.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
        </time>
      </p>

      <p style={{ fontSize: 15, margin: "16px 0 0" }}>
        La rentrée est passée et tu n&apos;as pas encore signé ? Ce n&apos;est pas fichu :{" "}
        <strong>{plural(index.recent7d, "offre d'alternance a été publiée", "offres d'alternance ont été publiées")} ces 7 derniers jours</strong>, et un contrat
        d&apos;apprentissage peut commencer jusqu&apos;à 3 mois après le début de ta formation. Les offres récentes sont
        celles où tu as le plus de chances : postule dans les 48 heures.
      </p>

      <div className="card mt-6" style={{ padding: "var(--space-4)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
        <p style={{ fontSize: 14, margin: 0 }}>
          <strong>Ne rate pas les prochaines.</strong> Crée ton profil gratuit : les nouvelles offres de ta ville et de ton
          métier arrivent dans ton fil dès leur publication.
        </p>
        <Link href={signupLink} className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
          Créer mon profil gratuit
        </Link>
      </div>

      <LinkChips title="Les villes avec le plus d'offres cette semaine" links={cities} />
      <LinkChips title="Les métiers avec le plus d'offres cette semaine" links={metiers} />

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: 0 }}>Les dernières offres d&apos;alternance</h2>
        <PublicOffersGrid offers={offers} page={1} totalPages={1} basePath="/offres/alternance" />
        <p style={{ fontSize: 14, marginTop: 16 }}>
          <Link href="/offres/alternance?page=2">Voir les offres suivantes →</Link>
        </p>
      </section>

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Le plan pour signer avant la fin de l&apos;automne</h2>
        <ul style={{ fontSize: 15, paddingLeft: 20, margin: 0, display: "grid", gap: 6 }}>
          <li>
            Demande à ton CFA s&apos;il t&apos;accepte sans contrat le temps de trouver (3 mois au maximum) et la liste des
            entreprises qui le contactent : <Link href="/guides/alternance-sans-entreprise">commencer sans employeur</Link>.
          </li>
          <li>Regarde chaque jour les nouvelles offres de ta ville et de ton métier, et postule dans les 48 heures.</li>
          <li>
            Envoie des candidatures spontanées aux entreprises proches de chez toi et de ton école, avec ton rythme
            école / entreprise : <Link href="/guides/candidature-spontanee-alternance">modèle de candidature spontanée</Link>.
          </li>
          <li>
            Élargis ta zone au département ou à la ville voisine : les pages par département (par exemple{" "}
            <Link href="/alternance/departement/nord">le Nord</Link> ou <Link href="/alternance/departement/rhone">le Rhône</Link>) regroupent
            toutes les communes.
          </li>
          <li>
            Relance au bout de 7 à 10 jours sans réponse : <Link href="/guides/relancer-candidature">comment relancer</Link>.
          </li>
          <li>
            Rien au bout de quelques semaines ? Revois ton ciblage avec notre guide{" "}
            <Link href="/guides/je-ne-trouve-pas-d-alternance">je ne trouve pas d&apos;alternance</Link>, et garde en tête la{" "}
            <Link href="/guides/rentree-decalee-alternance">rentrée décalée</Link> de janvier-février.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Questions fréquentes</h2>
        {FAQ.map((item) => (
          <div key={item.q} style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>{item.q}</h3>
            <p style={{ fontSize: 15, margin: 0 }}>{item.a}</p>
          </div>
        ))}
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          Sources :{" "}
          <a href="https://code.travail.gouv.fr/code-du-travail/l6222-12-1" rel="noopener">
            Code du travail, article L6222-12-1
          </a>{" "}
          ;{" "}
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" rel="noopener">
            Contrat d&apos;apprentissage (service-public.gouv.fr)
          </a>
          .
        </p>
      </section>

      <StickySignupBar href={signupLink} />
    </div>
  );
}
