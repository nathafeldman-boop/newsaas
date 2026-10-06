import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { ShareButtons } from "@/components/share/ShareButtons";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import { getCompaniesHub, resolveCompanyPage } from "@/lib/seo/companyPage";
import { fetchOffersByIds, listedPages, pageIds } from "@/lib/seo/programmaticPage";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/site";

export async function companyMetadata(slug: string, pageParam?: string): Promise<Metadata> {
  const model = await resolveCompanyPage(slug);
  if (!model) return { title: "Entreprise introuvable", robots: { index: false, follow: true } };
  const page = parsePageParam(pageParam);
  const url = `${SITE_URL}${pagedPath(model.path, page)}`;
  return {
    title: pagedTitle(model.title, page),
    description: page > 1 ? `${model.description} Page ${page}.` : model.description,
    alternates: { canonical: url },
    robots: model.indexable ? undefined : { index: false, follow: true },
    openGraph: { title: model.title, description: model.description, url, type: "website" },
  };
}

const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 };
const statLabel: React.CSSProperties = { fontSize: 12.5, margin: "2px 0 0" };

export async function CompanyPage({ slug, pageParam }: { slug: string; pageParam?: string }) {
  const model = await resolveCompanyPage(slug);
  if (!model) notFound();
  const page = parsePageParam(pageParam);
  const totalPages = listedPages(model.company);
  if (page > totalPages) notFound();
  const offers = await fetchOffersByIds(pageIds(model.company, page));

  const breadcrumb = [
    { name: "Accueil", path: "/" },
    { name: "Entreprises", path: "/entreprises" },
    { name: model.company.label, path: model.path },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: model.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link> › <Link href="/entreprises">Entreprises</Link>
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>{model.h1}</h1>
      <p style={{ fontSize: 15, margin: "10px 0 0" }}>{model.paragraphs[0]}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card elev-sm">
          <p style={statValue}>{model.company.count.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>offres actives</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{model.company.byType.alternance.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>en alternance</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{model.company.byType.stage.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>en stage</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{model.company.cities.length.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>villes</p>
        </div>
      </div>

      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath={model.path} />

      {model.paragraphs.length > 1 && (
        <section className="mt-10">
          <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Ce qu&apos;il faut savoir sur {model.company.label}</h2>
          {model.paragraphs.slice(1).map((paragraph) => (
            <p key={paragraph} style={{ fontSize: 14.5, margin: "0 0 10px" }}>
              {paragraph}
            </p>
          ))}
        </section>
      )}

      <ShareButtons
        title="Partager"
        url={`${SITE_URL}${model.path}`}
        text={`${model.company.label} recrute : ${model.company.count} offres d'alternance et de stage 👉`}
      />

      <LinkChips title={`Où ${model.company.label} recrute`} links={model.cityLinks} />
      <LinkChips title="Les métiers proposés" links={model.metierLinks} />
      <LinkChips title="Autres entreprises qui recrutent sur les mêmes métiers" links={model.related} />

      <section className="mt-10">
        <h2 style={{ fontSize: 20, margin: "0 0 12px" }}>Questions fréquentes</h2>
        {model.faq.map((item) => (
          <div key={item.q} style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15.5, margin: "0 0 4px" }}>{item.q}</h3>
            <p style={{ fontSize: 14, margin: 0 }}>{item.a}</p>
          </div>
        ))}
      </section>

      <div className="card elev-sm mt-8" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 15, margin: "0 0 12px" }}>
          Reçois les nouvelles offres de {model.company.label} et des entreprises qui te ressemblent directement dans
          ton fil.
        </p>
        <Link href="/inscription" className="btn btn-primary">
          Créer mon compte gratuitement
        </Link>
      </div>
    </div>
  );
}

export async function companiesHubMetadata(): Promise<Metadata> {
  const { total } = await getCompaniesHub();
  return {
    title: `Entreprises qui recrutent en alternance et en stage : ${total.toLocaleString("fr-FR")} entreprises`,
    description: `Les ${total.toLocaleString("fr-FR")} entreprises qui publient des offres d'alternance et de stage en ce moment, avec le nombre d'offres, les villes et les métiers. Mis à jour chaque jour.`,
    alternates: { canonical: `${SITE_URL}/entreprises` },
  };
}

export async function CompaniesHub() {
  const { companies, total } = await getCompaniesHub();
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link>
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>Entreprises qui recrutent en alternance et en stage</h1>
      <p style={{ fontSize: 15, margin: "10px 0 0" }}>
        <strong>{total.toLocaleString("fr-FR")}</strong> entreprises ont au moins 3 offres actives en ce moment. Clique
        sur une entreprise pour voir ses offres, ses villes et ses métiers.
      </p>
      <LinkChips title="Les entreprises qui publient le plus" links={companies} />
      <p style={{ fontSize: 14, marginTop: 24 }}>
        <Link href="/alternance">Alternance par métier et par ville</Link>
        {" · "}
        <Link href="/stage">Stage par métier et par ville</Link>
        {" · "}
        <Link href="/outils/simulateur-salaire-alternance">Simulateur de salaire</Link>
      </p>
    </div>
  );
}
