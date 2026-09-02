import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { extractOfferId, offerPath } from "@/lib/offers/publicUrl";
import { SITE_URL } from "@/lib/site";
import type { Offer } from "@/types/database";

// Fiche publique, sans compte : c'est le seul contenu de l'app indexable par
// Google (le reste est derrière l'inscription). L'ID fait foi, le slug
// humain n'est que décoratif — voir src/lib/offers/publicUrl.ts.
async function getOffer(slug: string): Promise<Offer | null> {
  const id = extractOfferId(slug);
  if (!id) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOffer(slug);
  if (!offer) return { title: "Offre introuvable" };

  const title = `${offer.title} — ${offer.company} (${offer.contract_type}) | Stageio`;
  const description = offer.description.slice(0, 155);
  const url = `${SITE_URL}${offerPath(offer)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${offer.title} chez ${offer.company}`,
      description,
      url,
      type: "website",
    },
  };
}

function jobPostingJsonLd(offer: Offer) {
  const validThrough = new Date(offer.last_seen_at);
  validThrough.setDate(validThrough.getDate() + 30);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offer.title,
    description: offer.description || offer.title,
    identifier: {
      "@type": "PropertyValue",
      name: "Stageio",
      value: offer.id,
    },
    datePosted: offer.published_at,
    validThrough: validThrough.toISOString(),
    employmentType: offer.contract_type === "alternance" ? "OTHER" : "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: offer.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: offer.location,
        addressCountry: "FR",
      },
    },
    ...(offer.salary ? { baseSalary: offer.salary } : {}),
  };
}

const CONTRACT_LABEL: Record<Offer["contract_type"], string> = {
  alternance: "Alternance",
  stage: "Stage",
};

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getOffer(slug);
  if (!offer) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(offer)) }}
      />

      <Link href="/offres" style={{ fontSize: 13 }}>
        ← Toutes les offres
      </Link>

      <div className="card elev-sm mt-4" style={{ padding: "var(--space-6)" }}>
        <span className="tag tag-accent">{CONTRACT_LABEL[offer.contract_type]}</span>
        <h1 style={{ fontSize: 26, margin: "12px 0 4px" }}>{offer.title}</h1>
        <p style={{ fontSize: 15, fontFamily: "var(--font-heading)", margin: 0 }}>
          {offer.company}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="tag tag-neutral">📍 {offer.location}</span>
          {offer.sector && <span className="tag tag-neutral">{offer.sector}</span>}
          {offer.duration && <span className="tag tag-neutral">⏱ {offer.duration}</span>}
          {offer.salary && <span className="tag tag-neutral">💶 {offer.salary}</span>}
          {offer.remote_policy && <span className="tag tag-neutral">🏠 {offer.remote_policy}</span>}
        </div>

        <h2 style={{ fontSize: 16, margin: "24px 0 8px" }}>Description</h2>
        <p style={{ fontSize: 14, whiteSpace: "pre-line" }}>{offer.description}</p>

        {offer.requirements && (
          <>
            <h2 style={{ fontSize: 16, margin: "20px 0 8px" }}>Profil recherché</h2>
            <p style={{ fontSize: 14, whiteSpace: "pre-line" }}>{offer.requirements}</p>
          </>
        )}

        {offer.apply_url && (
          <a
            href={offer.apply_url}
            target="_blank"
            rel="noopener nofollow"
            className="btn btn-primary btn-block"
            style={{ marginTop: 24 }}
          >
            Postuler à cette offre
          </a>
        )}
      </div>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 14, margin: "0 0 12px" }}>
          Crée ton compte pour swiper d&apos;autres offres qui matchent ton profil.
        </p>
        <Link href="/inscription" className="btn btn-secondary">
          Créer mon compte gratuitement
        </Link>
      </div>
    </div>
  );
}
