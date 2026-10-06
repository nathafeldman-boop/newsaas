import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { extractOfferId, offerPath, offerSlug } from "@/lib/offers/publicUrl";
import { normalizeCityKey } from "@/lib/offers/segments";
import { getOfferContextLinks, type OfferContextLinks } from "@/lib/offers/similarOffers";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import type { Offer } from "@/types/database";

// ISR : chaque fiche est rendue à la 1re visite puis servie depuis le cache
// Vercel pendant 1 h, au lieu d'un rendu + requête Supabase à chaque passage
// de Googlebot (TTFB = signal Core Web Vitals). Une offre désactivée par le
// cron disparaît donc au plus 1 h après -- largement suffisant.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

// Fiche publique, sans compte : c'est le seul contenu de l'app indexable par
// Google (le reste est derrière l'inscription). L'ID fait foi, le slug
// humain n'est que décoratif — voir src/lib/offers/publicUrl.ts.
// cache() : generateMetadata et la page partagent la même requête.
const getOffer = cache(async (slug: string): Promise<Offer | null> => {
  const id = extractOfferId(slug);
  if (!id) return null;

  const { data, error } = await createPublicClient()
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  // Une panne Supabase ne doit jamais se transformer en 404 (Google
  // retirerait la page de l'index) : on laisse remonter en 500.
  if (error) throw new Error(error.message);

  return data;
});

const CONTRACT_LABEL: Record<Offer["contract_type"], string> = {
  alternance: "Alternance",
  stage: "Stage",
};

function offerTitle(offer: Offer): string {
  const mentionsContract =
    offer.contract_type === "alternance" ? /altern|apprenti/i.test(offer.title) : /stag/i.test(offer.title);
  // Le layout racine ajoute déjà " | Stageio" (title.template) : ne jamais
  // le remettre ici, sinon "| Stageio | Stageio" dans Google.
  return `${mentionsContract ? "" : `${CONTRACT_LABEL[offer.contract_type]} : `}${offer.title} – ${offer.company}`;
}

function truncateOnWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–]+$/, "")}…`;
}

// Contexte unique (contrat, entreprise, ville, durée) AVANT l'extrait : les
// 155 premiers caractères bruts de la description étaient souvent un texte
// générique d'entreprise identique sur toutes ses offres.
function offerMetaDescription(offer: Offer): string {
  const city = normalizeCityKey(offer.location) || offer.location;
  const context = `${CONTRACT_LABEL[offer.contract_type]} chez ${offer.company} à ${city}${
    offer.duration ? ` (${offer.duration})` : ""
  }.`;
  const snippet = offer.description.replace(/\s+/g, " ").trim();
  return truncateOnWord(snippet ? `${context} ${snippet}` : context, 155);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOffer(slug);
  if (!offer) return { title: "Offre introuvable", robots: { index: false, follow: true } };

  const title = offerTitle(offer);
  const description = offerMetaDescription(offer);
  const url = `${SITE_URL}${offerPath(offer)}`;
  // Image par offre quand elle existe (Adzuna/France Travail/manuel) --
  // sinon on n'écrit pas la clé, les metadata héritent de l'og-image par
  // défaut du layout racine plutôt que de n'avoir aucune image du tout.
  const ogImages = offer.image_url ? [offer.image_url] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${offer.title} chez ${offer.company}`,
      description,
      url,
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    ...(ogImages ? { twitter: { card: "summary_large_image", images: ogImages } } : {}),
  };
}

// schema.org exige que "baseSalary" soit un objet MonetaryAmount structuré
// (currency + value numérique), jamais une chaîne libre -- offer.salary est
// un texte non structuré ("900-1200€/mois", "25000-30000€" pour les offres
// Adzuna sans mention d'unité...), injecté tel quel jusqu'ici : un type
// invalide que Google écarte ou signale en erreur dans Search Console.
// N'émet une valeur QUE si le texte mentionne explicitement une unité
// (mois/an/jour/heure) : les salaires Adzuna sans mention (annuels côté API,
// mais affichés sans "/an") ne doivent jamais être devinés comme mensuels,
// ce qui donnerait un salaire structuré faux -- l'absence du champ est
// toujours plus sûre qu'une valeur inventée.
function parseBaseSalary(salary: string | null) {
  if (!salary) return undefined;

  const unitText = /\/\s*an\b|annuel/i.test(salary)
    ? "YEAR"
    : /\/\s*jour\b|journalier/i.test(salary)
      ? "DAY"
      : /\/\s*heure\b|horaire/i.test(salary)
        ? "HOUR"
        : /\/\s*mois\b|mensuel/i.test(salary)
          ? "MONTH"
          : null;
  if (!unitText) return undefined;

  const match = salary.match(/(\d[\d\s]{0,6})(?:\s*-\s*(\d[\d\s]{0,6}))?\s*€/);
  if (!match) return undefined;
  const min = Number(match[1].replace(/\s/g, ""));
  const max = match[2] ? Number(match[2].replace(/\s/g, "")) : null;
  if (!min || Number.isNaN(min)) return undefined;

  const value =
    max && max > min
      ? { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitText }
      : { "@type": "QuantitativeValue", value: min, unitText };

  return { "@type": "MonetaryAmount", currency: "EUR", value };
}

// Google for Jobs exige la description COMPLÈTE du poste dans le JSON-LD et
// sur la page. Adzuna ne fournit qu'un extrait (~500 caractères coupé par
// "…") : un JobPosting tronqué enfreint les consignes (risque d'action
// manuelle sur les données structurées de tout le site). On ne le publie
// donc que pour les offres dont on a le texte intégral (France Travail,
// saisie manuelle) -- voir l'audit SEO du 06/10.
function isJobPostingEligible(offer: Offer): boolean {
  if (offer.source === "adzuna") return false;
  const description = offer.description.trim();
  if (/(…|\.\.\.)$/.test(description)) return false;
  return description.length >= 200;
}

function jobPostingJsonLd(offer: Offer) {
  const validThrough = new Date(offer.last_seen_at);
  validThrough.setDate(validThrough.getDate() + 30);
  const baseSalary = parseBaseSalary(offer.salary);

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
    ...(baseSalary ? { baseSalary } : {}),
  };
}

const LISTING_LABEL: Record<Offer["contract_type"], string> = {
  alternance: "Offres d'alternance",
  stage: "Offres de stage",
};

// Fil d'Ariane identique en JSON-LD et à l'écran : Accueil > Offres de
// stage > Lyon > l'offre (la ville seulement si sa page existe).
function breadcrumbItems(offer: Offer, links: OfferContextLinks): { name: string; path: string }[] {
  return [
    { name: "Accueil", path: "/" },
    { name: LISTING_LABEL[offer.contract_type], path: `/offres/${offer.contract_type}` },
    ...(links.city ? [{ name: links.city.label, path: `/offres/ville/${links.city.slug}` }] : []),
    { name: offer.title, path: offerPath(offer) },
  ];
}

function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = await getOffer(slug);
  if (!offer) notFound();
  // Une seule URL par offre : /offres/n-importe-quoi-<uuid> ou un ancien
  // slug (titre modifié par la source) redirige en 308 vers l'URL canonique.
  if (slug !== offerSlug(offer)) permanentRedirect(offerPath(offer));

  const links = await getOfferContextLinks(offer);
  const crumbs = breadcrumbItems(offer, links);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      {isJobPostingEligible(offer) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jobPostingJsonLd(offer)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(crumbs)) }}
      />

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        {crumbs.slice(0, -1).map((crumb, index) => (
          <span key={crumb.path}>
            {index > 0 && " › "}
            <Link href={crumb.path}>{crumb.name}</Link>
          </span>
        ))}
      </nav>

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

      {links.similar.length > 0 && (
        <section className="mt-8">
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>
            {links.city && links.similar.every((similar) => links.city?.locations.includes(similar.location))
              ? `D'autres offres ${offer.contract_type === "alternance" ? "d'alternance" : "de stage"} à ${links.city.label}`
              : "Offres similaires"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.similar.map((similar) => (
              <Link key={similar.id} href={offerPath(similar)} className="card elev-sm">
                <h3 className="card-title">{similar.title}</h3>
                <p className="card-body">
                  {similar.company} — {similar.location}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {links.city && (
          <Link href={`/offres/ville/${links.city.slug}`} className="tag tag-neutral">
            Toutes les offres à {links.city.label} ({links.city.count})
          </Link>
        )}
        {links.sector && (
          <Link href={`/offres/secteur/${links.sector.slug}`} className="tag tag-neutral">
            Offres en {links.sector.label} ({links.sector.count})
          </Link>
        )}
        <Link href={`/offres/${offer.contract_type}`} className="tag tag-neutral">
          {LISTING_LABEL[offer.contract_type]}
        </Link>
        <Link href="/outils/simulateur-salaire-alternance" className="tag tag-neutral">
          {offer.contract_type === "alternance" ? "Simuler mon salaire d'alternant" : "Calculer ma gratification de stage"}
        </Link>
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
