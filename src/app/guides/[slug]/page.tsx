import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButtons } from "@/components/share/ShareButtons";
import type { Metadata } from "next";
import { getGuide, GUIDES } from "@/lib/guides/guidesData";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/site";

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
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd(guide)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(guide)) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />}

      <Link href="/guides" style={{ fontSize: 13 }}>
        ← Tous les guides
      </Link>

      <article className="card elev-sm mt-4" style={{ padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: 26, margin: "4px 0 16px" }}>{guide.title}</h1>

        {guide.intro.map((p, i) => (
          <p key={i} style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
            {p}
          </p>
        ))}

        {guide.sections.map((section) => (
          <section key={section.heading} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>{section.heading}</h2>

            {section.paragraphs?.map((p, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px" }}>
                {p}
              </p>
            ))}

            {section.list && (
              <ul style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px", paddingLeft: 20 }}>
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
          {[1, 2, 3, 4]
            .map((offset) => GUIDES[(GUIDES.findIndex((g) => g.slug === guide.slug) + offset) % GUIDES.length])
            .filter((g) => g.slug !== guide.slug)
            .map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} style={{ fontSize: 14 }}>
                {g.title}
              </Link>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/alternance" className="tag tag-neutral">
            Offres d&apos;alternance par métier et ville
          </Link>
          <Link href="/stage" className="tag tag-neutral">
            Offres de stage par métier et ville
          </Link>
          <Link href="/outils/simulateur-salaire-alternance" className="tag tag-neutral">
            Simulateur de salaire
          </Link>
          <Link href="/barometre-alternance-stage" className="tag tag-neutral">
            Baromètre 2026
          </Link>
        </div>
      </nav>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>
          Crée ton compte pour matcher avec des offres qui correspondent à ton profil.
        </p>
        <Link href="/inscription" className="btn btn-secondary">
          Créer mon compte gratuitement
        </Link>
      </div>
    </div>
  );
}
