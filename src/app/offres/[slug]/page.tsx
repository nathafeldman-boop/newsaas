import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { offerExpiresAt } from "@/lib/offers/expiry";
import { departementFromLocation, getDepartement } from "@/lib/seo/departements";
import { extractOfferId, offerPath, offerSlug } from "@/lib/offers/publicUrl";
import { normalizeCityKey, titleCase } from "@/lib/offers/segments";
import { getOfferContextLinks, type OfferContextLinks } from "@/lib/offers/similarOffers";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { ShareButtons } from "@/components/share/ShareButtons";
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

// Offre retirée par le cron (is_active = false) : la RLS la cache au client
// public, d'où le client service role -- côté serveur uniquement, et la page
// "offre expirée" n'affiche que des champs déjà publics (titre, entreprise,
// lieu). Un ancien lien partagé ou indexé mène ainsi à des offres actives
// similaires plutôt qu'à une 404 sèche.
const getExpiredOffer = cache(async (slug: string): Promise<Offer | null> => {
  const id = extractOfferId(slug);
  if (!id) return null;
  const { data, error } = await createAdminClient()
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("is_active", false)
    .maybeSingle();
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
  // La ville dans le titre : "intitulé + ville" est la requête la plus
  // fréquente d'un candidat. Pas de doublon si l'intitulé la contient déjà.
  const city = titleCase(normalizeCityKey(offer.location));
  const withCity = city && !normalizeForMatch(offer.title).includes(normalizeForMatch(city)) ? ` à ${city}` : "";
  return `${mentionsContract ? "" : `${CONTRACT_LABEL[offer.contract_type]} : `}${offer.title}${withCity} – ${offer.company}`;
}

function normalizeForMatch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
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
  const city = titleCase(normalizeCityKey(offer.location)) || offer.location;
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
  if (!offer) {
    const expired = await getExpiredOffer(slug);
    return expired
      ? { title: `Offre expirée : ${expired.title} – ${expired.company}`, robots: { index: false, follow: true } }
      : { title: "Offre introuvable", robots: { index: false, follow: true } };
  }

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
    // Décision A (SEO_ROADMAP.md) : une fiche Adzuna n'est qu'un extrait de
    // ~500 caractères identique à celui d'Adzuna et de dizaines d'autres
    // sites. Accessible aux visiteurs et suivie (follow), mais hors index :
    // ce sont les pages métier × ville, à contenu propre, qui portent le SEO.
    ...(offer.source === "adzuna" ? { robots: { index: false, follow: true } } : {}),
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
// Google exige le nom réel de l'employeur dans hiringOrganization :
// "Entreprise non communiquée" (France Travail, employeur masqué) n'en est
// pas un.
const UNNAMED_EMPLOYER = /non communiqu|confidenti|^\s*$/i;

function isJobPostingEligible(offer: Offer): boolean {
  if (offer.source === "adzuna" || offer.source === "demo") return false;
  if (UNNAMED_EMPLOYER.test(offer.company)) return false;
  const description = offer.description.trim();
  if (/(…|\.\.\.)$/.test(description)) return false;
  return description.length >= 200;
}

function jobPostingJsonLd(offer: Offer) {
  // Date à laquelle le cron retire réellement l'offre du site -- jamais dans
  // le passé tant que la fiche est en ligne (cron en retard d'un jour).
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const expiresAt = offerExpiresAt(offer.published_at);
  const validThrough = expiresAt > tomorrow ? expiresAt : tomorrow;
  const departement = getDepartement(departementFromLocation(offer.location) ?? "");
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
        // "75 - PARIS 08" (format France Travail) -> "Paris" : Google for Jobs
        // rapproche la ville de ses données géographiques, un code de
        // département collé au nom l'empêche de placer l'offre sur la carte.
        addressLocality: titleCase(normalizeCityKey(offer.location)) || offer.location,
        ...(departement ? { addressRegion: departement.region } : {}),
        addressCountry: "FR",
      },
    },
    ...(baseSalary ? { baseSalary } : {}),
    // La candidature se fait sur le site de l'employeur ou de la source.
    directApply: false,
  };
}

const LISTING_LABEL: Record<Offer["contract_type"], string> = {
  alternance: "Offres d'alternance",
  stage: "Offres de stage",
};

// Fil d'Ariane identique en JSON-LD et à l'écran, calqué sur les pages
// programmatiques : Accueil > Alternance > Alternance commercial >
// Alternance commercial à Lyon > l'offre (chaque niveau seulement si sa
// page existe). Fait remonter le "jus" des ~5 000 fiches vers les pages
// métier × ville, celles qui doivent se positionner.
function breadcrumbItems(offer: Offer, links: OfferContextLinks): { name: string; path: string }[] {
  const { metier, city, metierCity } = links.programmatic;
  const leaf = metierCity ?? city;
  return [
    { name: "Accueil", path: "/" },
    { name: offer.contract_type === "alternance" ? "Alternance" : "Stage", path: `/${offer.contract_type}` },
    ...(metier ? [{ name: metier.label, path: metier.href }] : []),
    ...(leaf ? [{ name: leaf.label, path: leaf.href }] : []),
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
  if (!offer) {
    const expired = await getExpiredOffer(slug);
    if (!expired) notFound();
    if (slug !== offerSlug(expired)) permanentRedirect(offerPath(expired));
    return <ExpiredOffer offer={expired} />;
  }
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
          {links.company ? <Link href={links.company.href}>{offer.company}</Link> : offer.company}
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
        <ShareButtons
          title="Cette offre peut intéresser un pote ?"
          url={`${SITE_URL}${offerPath(offer)}`}
          text={`${offer.title} chez ${offer.company} (${titleCase(normalizeCityKey(offer.location)) || offer.location}), regarde :`}
        />
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
        {[links.programmatic.metierCity, links.programmatic.metier, links.programmatic.city, links.company]
          .filter((link): link is NonNullable<typeof link> => link !== null)
          .map((link) => (
            <Link key={link.href} href={link.href} className="tag tag-neutral">
              {link.label} ({link.count})
            </Link>
          ))}
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

// Offre retirée : plus de JobPosting, page en noindex (voir generateMetadata),
// et tout de suite des offres actives équivalentes -- l'étudiant arrivé par
// un vieux lien ne repart pas les mains vides.
async function ExpiredOffer({ offer }: { offer: Offer }) {
  const links = await getOfferContextLinks(offer);
  const city = titleCase(normalizeCityKey(offer.location)) || offer.location;
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
        <span className="tag tag-neutral">Offre expirée</span>
        <h1 style={{ fontSize: 24, margin: "12px 0 4px" }}>{offer.title}</h1>
        <p style={{ fontSize: 15, margin: 0 }}>
          {offer.company} — {city}
        </p>
        <p style={{ fontSize: 14, margin: "16px 0 0" }}>
          Cette offre n&apos;est plus disponible : elle a probablement été pourvue. Voici des offres{" "}
          {offer.contract_type === "alternance" ? "d'alternance" : "de stage"} encore ouvertes qui y ressemblent.
        </p>
      </div>

      {links.similar.length > 0 && (
        <section className="mt-8">
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Offres similaires encore ouvertes</h2>
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
        {[links.programmatic.metierCity, links.programmatic.metier, links.programmatic.city, links.company]
          .filter((link): link is NonNullable<typeof link> => link !== null)
          .map((link) => (
            <Link key={link.href} href={link.href} className="tag tag-neutral">
              {link.label} ({link.count})
            </Link>
          ))}
        <Link href={`/offres/${offer.contract_type}`} className="tag tag-neutral">
          {LISTING_LABEL[offer.contract_type]}
        </Link>
      </div>
    </div>
  );
}

