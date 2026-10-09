import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { ShareButtons } from "@/components/share/ShareButtons";
import {
  departementPath,
  fetchOffersByIds,
  getHubModel,
  listedPages,
  pageIds,
  resolveProgrammaticPage,
  type ProgrammaticModel,
  type SegmentLink,
} from "@/lib/seo/programmaticPage";
import { pagedPath, pagedTitle, parsePageParam } from "@/lib/seo/pagination";
import { departementLinks } from "@/lib/seo/departementPage";
import { regionLinks } from "@/lib/seo/regionPage";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/site";
import { SMIC_MONTHLY_GROSS, formatEuros, internshipGratification, round2 } from "@/lib/salary/legalRates";
import type { ContractType } from "@/types/database";
import { METIER_GUIDES } from "@/lib/guides/contextGuides";
import { HubEditorial } from "@/components/seo/HubEditorial";
import { signupHref } from "@/lib/signup/intent";
import { CITY_ARTICLE_ALIASES, NOT_A_CITY, slugify } from "@/lib/offers/segments";
import { getDepartementBySlug } from "@/lib/seo/departements";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";

type RouteProps = {
  type: ContractType;
  slug: string;
  ville?: string;
  pageParam?: string;
};

export async function programmaticMetadata({ type, slug, ville, pageParam }: RouteProps): Promise<Metadata> {
  return modelMetadata(await resolveProgrammaticPage(type, slug, ville), pageParam);
}

// Métadonnées communes aux pages métier / ville / département.
export function modelMetadata(model: ProgrammaticModel | null, pageParam?: string): Metadata {
  if (!model) return { title: "Page introuvable", robots: { index: false, follow: true } };
  const page = parsePageParam(pageParam);
  const url = `${SITE_URL}${pagedPath(model.path, page)}`;
  return {
    title: pagedTitle(model.title, page),
    description: page > 1 ? `${model.description} Page ${page}.` : model.description,
    alternates: { canonical: url },
    // Sous 10 offres : page utile au visiteur, mais trop mince pour Google.
    robots: model.indexable ? INDEXABLE_ROBOTS : { index: false, follow: true },
    openGraph: { title: model.title, description: model.description, url, type: "website" },
  };
}

export function LinkChips({ title, links }: { title: string; links: SegmentLink[] }) {
  if (links.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="tag tag-neutral">
            {link.label} ({link.count})
          </Link>
        ))}
      </div>
    </section>
  );
}

const TYPE_GUIDES: Record<ContractType, { slug: string; label: string }[]> = {
  alternance: [
    { slug: "je-ne-trouve-pas-d-alternance", label: "Je ne trouve pas d'alternance" },
    { slug: "trouver-une-alternance", label: "Trouver une alternance" },
    { slug: "quand-chercher-son-alternance", label: "Quand chercher (calendrier)" },
    { slug: "cv-alternance", label: "CV d'alternance" },
    { slug: "lettre-de-motivation-alternance", label: "Lettre de motivation" },
    { slug: "contrat-apprentissage-ou-contrat-pro", label: "Apprentissage ou contrat pro" },
    { slug: "aides-alternants", label: "Aides aux alternants" },
  ],
  stage: [
    { slug: "trouver-un-stage", label: "Trouver un stage" },
    { slug: "cv-stage", label: "CV de stage" },
    { slug: "lettre-de-motivation-stage", label: "Lettre de motivation" },
    { slug: "gratification-de-stage", label: "Gratification 2026" },
    { slug: "convention-de-stage", label: "Convention de stage" },
    { slug: "rapport-de-stage", label: "Rapport de stage" },
  ],
};

// Guide propre au métier ou au diplôme de la page, en tête de la liste (pages
// métier, métier × ville, et leurs variantes département / région).
function pageGuides(type: ContractType, metier: string | undefined): { slug: string; label: string }[] {
  const own = type === "alternance" && metier ? METIER_GUIDES[metier] : undefined;
  return own ? [own, ...TYPE_GUIDES[type].filter((g) => g.slug !== own.slug)] : TYPE_GUIDES[type];
}

const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 };
const statLabel: React.CSSProperties = { fontSize: 12.5, margin: "2px 0 0" };

// Anciennes URL de lieux corrigés depuis : ville écrite sans son article
// (« /alternance/mans » -> « /alternance/le-mans »), quartier rattaché à sa
// ville (« rangueuil » -> Toulouse), département d'outre-mer pris pour une
// ville (« /alternance/la-reunion » -> la page du département).
function articleAliasPath(type: ContractType, slug: string, ville?: string): string | null {
  const place = ville ?? slug;
  const metier = ville ? slug : null;
  const alias = CITY_ARTICLE_ALIASES[place];
  if (alias) return metier ? `/${type}/${metier}/${slugify(alias)}` : `/${type}/${slugify(alias)}`;
  if (NOT_A_CITY.has(place) && getDepartementBySlug(place)) return departementPath(type, place, metier);
  return null;
}

export async function ProgrammaticPage({ type, slug, ville, pageParam }: RouteProps) {
  const model = await resolveProgrammaticPage(type, slug, ville);
  if (!model) {
    const aliasPath = articleAliasPath(type, slug, ville);
    if (aliasPath) permanentRedirect(aliasPath);
    notFound();
  }
  return <ProgrammaticPageView model={model} pageParam={pageParam} />;
}

// Rendu commun aux pages métier / ville / département.
export async function ProgrammaticPageView({ model, pageParam }: { model: ProgrammaticModel; pageParam?: string }) {
  const type = model.type;
  const signupLink = signupHref({ type, metier: model.metier?.slug, city: model.city?.label });

  const page = parsePageParam(pageParam);
  const totalPages = listedPages(model.stats);
  if (page > totalPages) notFound();
  const offers = await fetchOffersByIds(pageIds(model.stats, page));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: model.breadcrumb.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: model.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const salaryStat =
    model.stats.salaryMedian !== null
      ? { value: formatEuros(model.stats.salaryMedian, 0), label: `salaire médian indiqué (${model.stats.salaryN} offres)` }
      : type === "alternance"
        ? { value: formatEuros(round2(SMIC_MONTHLY_GROSS * 0.43), 0), label: "minimum légal à 18-20 ans, 1re année" }
        : { value: formatEuros(internshipGratification(35).gross, 0), label: "gratification minimale à temps plein" };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        {model.breadcrumb.slice(0, -1).map((crumb, index) => (
          <span key={crumb.path}>
            {index > 0 && " › "}
            <Link href={crumb.path}>{crumb.name}</Link>
          </span>
        ))}
      </nav>

      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>{model.h1}</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
        Mis à jour le{" "}
        <time dateTime={model.updatedAt}>
          {new Date(model.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
        </time>
      </p>
      <p style={{ fontSize: 15, margin: "10px 0 0" }}>{model.paragraphs[0]}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card elev-sm">
          <p style={statValue}>{model.stats.count.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>offres actives</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{model.stats.companyCount.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>entreprises qui recrutent</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{model.stats.recent7d.toLocaleString("fr-FR")}</p>
          <p style={statLabel}>publiées cette semaine</p>
        </div>
        <div className="card elev-sm">
          <p style={statValue}>{salaryStat.value}</p>
          <p style={statLabel}>{salaryStat.label}</p>
        </div>
      </div>

      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath={model.path} />
      {model.stats.count > model.stats.ids.length && (
        <p style={{ fontSize: 14, marginTop: 16 }}>
          Seules les {model.stats.ids.length} offres les plus récentes sont listées ici.{" "}
          <Link href={`/offres/${type}`}>Voir toutes les offres {type === "alternance" ? "d'alternance" : "de stage"}</Link>.
        </p>
      )}

      {/* Juste après la liste : le visiteur qui l'a parcourue est le plus
          susceptible de vouloir la suite (le bloc du bas reste, pour ceux
          qui lisent jusqu'au bout). */}
      <div className="card mt-6" style={{ padding: "var(--space-4) var(--space-5)" }}>
        <p style={{ fontSize: 14.5, margin: "0 0 12px" }}>
          <strong>{model.h1} : ne rate pas les prochaines.</strong> Crée ton profil gratuit en 1 minute : tu swipes les
          nouvelles offres qui te correspondent dès leur publication, avec une alerte par mail si tu veux.
        </p>
        <Link href={signupLink} className="btn btn-primary">
          Créer mon profil gratuit
        </Link>
      </div>

      <section className="mt-10">
        <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>Ce qu&apos;il faut savoir</h2>
        {model.paragraphs.slice(1).map((paragraph) => (
          <p key={paragraph} style={{ fontSize: 14.5, margin: "0 0 10px" }}>
            {paragraph}
          </p>
        ))}
        <p style={{ fontSize: 14.5, margin: 0 }}>
          <Link href="/outils/simulateur-salaire-alternance">
            {type === "alternance" ? "Calculer mon salaire d'alternant" : "Calculer ma gratification de stage"}
          </Link>
          {" · "}
          <Link href={`/outils/lettre-de-motivation-${type}`}>Écrire ma lettre de motivation (gratuit)</Link>
        </p>
      </section>

      <section className="mt-8">
        <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Nos guides pour {type === "alternance" ? "ton alternance" : "ton stage"}</h2>
        <div className="flex flex-wrap gap-2">
          {pageGuides(type, model.metier?.slug).map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="tag tag-neutral">
              {guide.label}
            </Link>
          ))}
        </div>
      </section>

      <ShareButtons
        title="Partager cette liste"
        url={`${SITE_URL}${model.path}`}
        text={`${model.stats.count} offres : ${model.h1} 👉`}
      />

      {model.nearby && <LinkChips title={model.nearby.title} links={model.nearby.links} />}
      {model.related && <LinkChips title={model.related.title} links={model.related.links} />}
      {model.formations && model.formations.length > 0 && (
        <LinkChips title={`${model.h1} : par diplôme`} links={model.formations} />
      )}
      {model.regions && model.regions.length > 0 && (
        <LinkChips title={`${model.h1} : par région`} links={model.regions} />
      )}
      {model.specialites && model.specialites.length > 0 && (
        <LinkChips title={`${model.h1} : par spécialité`} links={model.specialites} />
      )}
      <LinkChips title="Les entreprises qui recrutent" links={model.companies} />
      {model.family && (
        <p style={{ fontSize: 14, marginTop: 16 }}>
          Plus large : <Link href={model.family.href}>{model.family.label}</Link> ({model.family.count} offres)
        </p>
      )}
      {model.parentArea && (
        <p style={{ fontSize: 14, marginTop: 16 }}>
          Plus large : <Link href={model.parentArea.href}>{model.parentArea.label}</Link> ({model.parentArea.count} offres)
        </p>
      )}
      {model.crossType && (
        <p style={{ fontSize: 14, marginTop: model.parentArea ? 4 : 16 }}>
          Voir aussi : <Link href={model.crossType.href}>{model.crossType.label}</Link> ({model.crossType.count} offres)
        </p>
      )}

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
          Ne rate plus aucune offre : crée ton profil, les nouvelles offres qui te correspondent arrivent dans ton
          fil chaque jour.
        </p>
        <Link href={signupLink} className="btn btn-primary">
          Créer mon compte gratuitement
        </Link>
      </div>
      <StickySignupBar href={signupLink} />
    </div>
  );
}

const HUB_TEXT: Record<ContractType, { h1: string; intro: string; listPath: string }> = {
  alternance: {
    h1: "Offres d'alternance par métier et par ville",
    intro: "offres d'alternance (apprentissage et contrat pro) actives en ce moment, classées par métier et par ville",
    listPath: "/offres/alternance",
  },
  stage: {
    h1: "Offres de stage par métier et par ville",
    intro: "offres de stage actives en ce moment, classées par métier et par ville",
    listPath: "/offres/stage",
  },
};

export async function hubMetadata(type: ContractType): Promise<Metadata> {
  const { index } = await getHubModel(type);
  const text = HUB_TEXT[type];
  return {
    title: `${type === "alternance" ? "Alternance" : "Stage"} ${new Date().getFullYear()} : ${index.total.toLocaleString("fr-FR")} offres par métier et par ville`,
    description: `${index.total.toLocaleString("fr-FR")} ${text.intro}. Commercial, RH, marketing, développeur… à Paris, Lyon, Lille et partout en France.`,
    alternates: { canonical: `${SITE_URL}/${type}` },
  };
}

export async function ProgrammaticHub({ type }: { type: ContractType }) {
  const { index, metiers, cities, formations } = await getHubModel(type);
  const text = HUB_TEXT[type];
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-5 py-10 sm:px-9">
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link>
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>{text.h1}</h1>
      <p style={{ fontSize: 15, margin: "10px 0 0" }}>
        <strong>{index.total.toLocaleString("fr-FR")}</strong> {text.intro}. Choisis ton métier ou ta ville, ou{" "}
        <Link href={text.listPath}>parcours toutes les offres</Link>.
        {type === "alternance" && index.recent7d > 0 && (
          <>
            {" "}
            Pas encore de contrat ? <Link href="/alternance/urgent">Les {index.recent7d.toLocaleString("fr-FR")} offres publiées cette semaine</Link>{" "}
            · <Link href="/alternance/janvier-2027">les offres pour une rentrée décalée en janvier 2027</Link>.
          </>
        )}
        {type === "stage" && (
          <>
            {" "}
            Tu vises un stage long ? <Link href="/stage/fin-d-etudes">Stages de fin d&apos;études (6 mois, PFE)</Link> ·{" "}
            <Link href="/stage/janvier-2027">stages qui démarrent en janvier 2027</Link>.
          </>
        )}
      </p>
      {/* Seul appel à l'inscription des hubs, hors en-tête : ces deux pages
          visent « alternance » et « stage », les plus grosses requêtes. */}
      <div className="card mt-6" style={{ padding: "var(--space-4) var(--space-5)" }}>
        <p style={{ fontSize: 14.5, margin: "0 0 12px" }}>
          <strong>Pas envie de fouiller {type === "alternance" ? "métier par métier" : "page par page"} ?</strong> Crée
          ton profil gratuit en 1 minute : Stageio trie les {index.total.toLocaleString("fr-FR")} offres selon ta ville et
          ton métier, et les nouvelles arrivent dans ton fil chaque jour.
        </p>
        <Link href={signupHref({ type })} className="btn btn-primary">
          Créer mon profil gratuit
        </Link>
      </div>
      <LinkChips title="Par métier" links={metiers} />
      <LinkChips title="Par ville" links={cities} />
      <LinkChips title="Par diplôme" links={formations} />
      <LinkChips title="Par région" links={regionLinks(index)} />
      <LinkChips title="Par département" links={departementLinks(index)} />
      <HubEditorial type={type} />
      <p style={{ fontSize: 14, marginTop: 24 }}>
        <Link href="/outils/simulateur-salaire-alternance">Salaire en alternance 2026</Link>
        {" · "}
        <Link href={type === "alternance" ? "/stage" : "/alternance"}>
          {type === "alternance" ? "Offres de stage par métier et par ville" : "Offres d'alternance par métier et par ville"}
        </Link>
        {" · "}
        <Link href="/guides">Guides</Link>
      </p>
      <div className="card elev-sm mt-8" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 15, margin: "0 0 12px" }}>
          Les nouvelles {type === "alternance" ? "offres d'alternance" : "offres de stage"} de ta ville et de ton métier,
          dans ton fil dès leur publication.
        </p>
        <Link href={signupHref({ type })} className="btn btn-primary">
          Créer mon compte gratuitement
        </Link>
      </div>
      <StickySignupBar href={signupHref({ type })} />
    </div>
  );
}
