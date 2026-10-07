import Link from "next/link";
import type { Metadata } from "next";
import { GUIDE_CATEGORIES, GUIDES, getGuide } from "@/lib/guides/guidesData";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides alternance et stage",
  description:
    "Tous nos guides pour trouver une alternance ou un stage : calendrier, CV, lettre de motivation, entretien, contrat, salaire, gratification et aides 2026.",
  alternates: { canonical: `${SITE_URL}/guides` },
};

function sections() {
  const listed = new Set(GUIDE_CATEGORIES.flatMap((category) => category.slugs));
  const others = GUIDES.filter((guide) => !listed.has(guide.slug));
  return [
    ...GUIDE_CATEGORIES.map((category) => ({
      title: category.title,
      guides: category.slugs.map(getGuide).filter((guide) => guide !== undefined),
    })),
    ...(others.length > 0 ? [{ title: "Autres guides", guides: others }] : []),
  ].filter((section) => section.guides.length > 0);
}

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Guides alternance et stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        Tout ce qu&apos;il faut savoir pour trouver et réussir une alternance ou un stage.
      </p>

      {sections().map((section) => (
        <section key={section.title} className="mt-8">
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>{section.title}</h2>
          <div className="flex flex-col gap-3">
            {section.guides.map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="card elev-sm">
                <h3 className="card-title">{guide.title}</h3>
                <p className="card-body mt-1">{guide.metaDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <h2 style={{ fontSize: 18, margin: "32px 0 12px" }}>Outils gratuits</h2>
      <Link href="/outils/simulateur-salaire-alternance" className="card elev-sm">
        <h3 className="card-title">Simulateur de salaire en alternance 2026</h3>
        <p className="card-body mt-1">
          Apprentissage, contrat pro ou stage : ton salaire minimum brut et net en 10 secondes, selon ton âge et
          ton année de contrat.
        </p>
      </Link>
    </div>
  );
}
