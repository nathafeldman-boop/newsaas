import { notFound } from "next/navigation";
import Link from "next/link";
import { signupHref } from "@/lib/signup/intent";
import { SalarySimulator } from "@/components/tools/SalarySimulator";
import { ShareButtons } from "@/components/share/ShareButtons";
import type { Metadata } from "next";
import { getGuide, GUIDES } from "@/lib/guides/guidesData";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/site";
import { StickySignupBar } from "@/components/signup/StickySignupBar";

// Guides pour collégiens et lycéens (stage d'observation) : hors de la cible
// de l'appli (18-25 ans), pas d'encart d'inscription au milieu du texte.
const SCHOOL_GUIDES = new Set(["stage-de-3e", "stage-de-seconde"]);

// Encart d'inscription glissé après la 2e section : la personne a déjà lu
// de quoi juger le guide, et c'est souvent là qu'elle décroche.
// Les 12 plus grandes villes, qui ont toutes des offres d'alternance en
// permanence : chaque guide transmet du poids aux pages ville (les requêtes
// « alternance paris », « alternance lyon »…), et le lecteur passe de la
// méthode aux offres en un clic. Liste fixe : les guides sont générés au
// build, sans lecture de la base.
const GUIDE_CITY_LINKS = [
  { slug: "paris", label: "Paris" },
  { slug: "lyon", label: "Lyon" },
  { slug: "marseille", label: "Marseille" },
  { slug: "toulouse", label: "Toulouse" },
  { slug: "bordeaux", label: "Bordeaux" },
  { slug: "lille", label: "Lille" },
  { slug: "nantes", label: "Nantes" },
  { slug: "strasbourg", label: "Strasbourg" },
  { slug: "montpellier", label: "Montpellier" },
  { slug: "rennes", label: "Rennes" },
  { slug: "nice", label: "Nice" },
  { slug: "grenoble", label: "Grenoble" },
];

// Page d'offres la plus proche du sujet du guide, en tête des liens.
const GUIDE_OFFER_PAGES: Record<string, { href: string; label: string }> = {
  "rentree-decalee-alternance": { href: "/alternance/janvier-2027", label: "Offres d'alternance pour janvier 2027" },
  "je-ne-trouve-pas-d-alternance": { href: "/alternance/urgent", label: "Offres d'alternance de la semaine" },
  "alternance-sans-entreprise": { href: "/alternance/urgent", label: "Offres d'alternance de la semaine" },
  "stage-de-fin-d-etudes": { href: "/stage/fin-d-etudes", label: "Offres de stage de fin d'études" },
  "trouver-un-stage": { href: "/stage/urgent", label: "Offres de stage de la semaine" },
  "mail-candidature-stage-alternance": { href: "/stage/urgent", label: "Offres de stage de la semaine" },
};

function guideSignupType(slug: string): "stage" | "alternance" | null {
  const stage = /stage|convention|gratification|rapport|soutenance|attestation/.test(slug);
  const alternance = /alternance|alternant|apprenti|contrat|cfa|bts|bachelor/.test(slug);
  return stage && !alternance ? "stage" : alternance && !stage ? "alternance" : null;
}

function GuideSignupNudge({ slug }: { slug: string }) {
  const type = guideSignupType(slug);
  const stage = type === "stage";
  const alternance = type === "alternance";
  const [question, offers] =
    stage && !alternance
      ? ["Tu cherches un stage ?", "de stage"]
      : alternance && !stage
        ? ["Tu cherches une alternance ?", "d'alternance"]
        : ["Tu cherches une alternance ou un stage ?", "d'alternance et de stage"];
  return (
    <aside
      className="card mt-6"
      style={{ padding: "var(--space-4)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}
    >
      <p style={{ fontSize: 14, margin: 0 }}>
        <strong>{question}</strong> Stageio réunit les offres {offers} de France Travail et d&apos;Adzuna, mises à jour
        chaque jour. Crée ton profil gratuit : tu swipes celles qui te correspondent, triées selon ta ville et ton
        métier.
      </p>
      <Link
        href={signupHref({ type })}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start", marginTop: 8 }}
      >
        Créer mon profil gratuit
      </Link>
    </aside>
  );
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide introuvable", robots: { index: false, follow: true } };

  const url = `${SITE_URL}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.metaDescription, url, type: "article" },
  };
}

// Guides liés choisis à la main (guide.related) d'abord, puis les suivants
// de la liste pour toujours en afficher 4.
function relatedGuides(guide: NonNullable<ReturnType<typeof getGuide>>) {
  const start = GUIDES.findIndex((g) => g.slug === guide.slug);
  const rotation = [1, 2, 3, 4, 5, 6, 7, 8].map((offset) => GUIDES[(start + offset) % GUIDES.length]);
  const picked = [...(guide.related ?? []).map(getGuide), ...rotation].filter(
    (g): g is NonNullable<typeof g> => Boolean(g) && g!.slug !== guide.slug,
  );
  return picked.filter((g, i) => picked.findIndex((other) => other.slug === g.slug) === i).slice(0, 4);
}

function articleJsonLd(guide: NonNullable<ReturnType<typeof getGuide>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: { "@type": "Organization", name: "Stageio" },
    publisher: { "@type": "Organization", name: "Stageio" },
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  };
}

function breadcrumbJsonLd(guide: NonNullable<ReturnType<typeof getGuide>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
    ],
  };
}

function faqJsonLd(guide: NonNullable<ReturnType<typeof getGuide>>) {
  if (!guide.faq || guide.faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const faqLd = faqJsonLd(guide);

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd(guide)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(guide)) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />}

      <Link href="/guides" style={{ fontSize: 13 }}>
        ← Tous les guides
      </Link>

      <article className="card elev-sm mt-4" style={{ padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: 26, margin: "4px 0 6px" }}>{guide.title}</h1>
        <p style={{ fontSize: 13, margin: "0 0 16px", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
          Mis à jour le{" "}
          <time dateTime={guide.updatedAt}>
            {new Date(`${guide.updatedAt}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}
          </time>
        </p>

        {guide.intro.map((p, i) => (
          <p key={i} style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
            {p}
          </p>
        ))}

        {/* « calcul gratification stage » : le calcul tout de suite, au lieu
            d'un renvoi vers la page outil. */}
        {guide.slug === "gratification-de-stage" && (
          <section style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Calcule ta gratification</h2>
            <SalarySimulator initialContract="stage" />
          </section>
        )}

        {guide.sections.map((section, sectionIndex) => (
          <section key={section.heading} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>{section.heading}</h2>

            {section.paragraphs?.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px" }}>
                {p}
              </p>
            ))}

            {section.list && (
              <ul style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px", paddingLeft: 20, listStyle: "disc" }}>
                {section.list.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div style={{ overflowX: "auto", margin: "0 0 10px" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {section.table.headers.map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            borderBottom: "1px solid var(--color-divider)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            style={{ padding: "6px 8px", borderBottom: "1px solid var(--color-divider)" }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {sectionIndex === 1 && !SCHOOL_GUIDES.has(guide.slug) && <GuideSignupNudge slug={guide.slug} />}
          </section>
        ))}

        {guide.faq && guide.faq.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Questions fréquentes</h2>
            {guide.faq.map((item) => (
              <details key={item.q} className="mt-2" style={{ fontSize: 14 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>{item.q}</summary>
                <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>{item.a}</p>
              </details>
            ))}
          </section>
        )}

        {guide.sources && guide.sources.length > 0 && (
          <p style={{ fontSize: 12, marginTop: 28, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            Sources :{" "}
            {guide.sources.map((s, i) => (
              <span key={s.url}>
                <a href={s.url} target="_blank" rel="noopener">
                  {s.label}
                </a>
                {i < guide.sources!.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </article>

      {/* Maillage : chaque guide renvoie vers d'autres guides, les offres et
          l'outil -- sinon chaque guide est une impasse pour le visiteur
          comme pour Google. */}
      <ShareButtons title="Partager ce guide" url={`${SITE_URL}/guides/${guide.slug}`} text={`${guide.title} 👉`} />

      <nav aria-label="À lire aussi" className="mt-8">
        <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>À lire aussi</h2>
        <div className="flex flex-col gap-2">
          {relatedGuides(guide).map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} style={{ fontSize: 14 }}>
                {g.title}
              </Link>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {GUIDE_OFFER_PAGES[guide.slug] && (
            <Link href={GUIDE_OFFER_PAGES[guide.slug].href} className="tag tag-neutral">
              {GUIDE_OFFER_PAGES[guide.slug].label}
            </Link>
          )}
          <Link href="/alternance" className="tag tag-neutral">
            Offres d&apos;alternance par métier et ville
          </Link>
          <Link href="/stage" className="tag tag-neutral">
            Offres de stage par métier et ville
          </Link>
          <Link href="/outils/simulateur-salaire-alternance" className="tag tag-neutral">
            Salaire en alternance 2026
          </Link>
          <Link href={`/outils/lettre-de-motivation-${/stage/.test(guide.slug) ? "stage" : "alternance"}`} className="tag tag-neutral">
            Générateur de lettre de motivation
          </Link>
          <Link href={`/outils/cv-${/stage/.test(guide.slug) ? "stage" : "alternance"}`} className="tag tag-neutral">
            Générateur de CV
          </Link>
          <Link href="/barometre-alternance-stage" className="tag tag-neutral">
            Baromètre 2026
          </Link>
        </div>
        <p style={{ fontSize: 14, margin: "14px 0 0", lineHeight: 1.8 }}>
          Offres d&apos;alternance à{" "}
          {GUIDE_CITY_LINKS.map((city, i) => (
            <span key={city.slug}>
              {i > 0 ? " · " : ""}
              <Link href={`/alternance/${city.slug}`}>{city.label}</Link>
            </span>
          ))}
        </p>
      </nav>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>
          Crée ton compte pour matcher avec des offres qui correspondent à ton profil.
        </p>
        <Link href="/inscription" className="btn btn-primary">
          Créer mon compte gratuitement
        </Link>
      </div>
      <StickySignupBar href={signupHref({ type: guideSignupType(guide.slug) })} />
    </div>
  );
}
