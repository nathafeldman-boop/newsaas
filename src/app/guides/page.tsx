import Link from "next/link";
import type { Metadata } from "next";
import { GUIDES } from "@/lib/guides/guidesData";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides alternance et stage",
  description:
    "Nos guides pour trouver une alternance ou un stage : différences alternance/stage, CV, lettre de motivation, méthode de recherche.",
  alternates: { canonical: `${SITE_URL}/guides` },
};

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Guides alternance et stage</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        Tout ce qu&apos;il faut savoir pour trouver et réussir une alternance ou un stage.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="card elev-sm">
            <h2 className="card-title">{guide.title}</h2>
            <p className="card-body mt-1">{guide.metaDescription}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
