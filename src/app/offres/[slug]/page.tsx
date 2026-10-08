import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { offerRemovalDate } from "@/lib/offers/expiry";
import { UNNAMED_EMPLOYER, isJobPostingEligible } from "@/lib/seo/jobPosting";
import { departementFromLocation, getDepartement, getDepartementBySlug, getRegionBySlug } from "@/lib/seo/departements";
import { cityPhrase, parseMonthlySalary } from "@/lib/seo/programmaticIndex";
import { extractOfferId, offerPath, offerSlug } from "@/lib/offers/publicUrl";
import { normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { getOfferContextLinks, type OfferContextLinks, type OfferMarket } from "@/lib/offers/similarOffers";
import { APPRENTICE_RATES, SMIC_MONTHLY_GROSS, STAGE_HOURLY_MIN, formatEuros, formatPercent } from "@/lib/salary/legalRates";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ApplyButton } from "@/components/offers/ApplyButton";
import { offerGuides } from "@/lib/guides/contextGuides";
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
  const place = placePhrase(offer.location);
  const withCity = place && !normalizeForMatch(offer.title).includes(normalizeForMatch(city)) ? ` ${place}` : "";
  // Employeur masqué (« Entreprise non communiquée », ~14 % des offres France
  // Travail) : la mention prend de la place dans Google sans rien apprendre.
  const company = UNNAMED_EMPLOYER.test(offer.company) ? "" : ` – ${offer.company}`;
  return `${mentionsContract ? "" : `${CONTRACT_LABEL[offer.contract_type]} : `}${offer.title}${withCity}${company}`;
}

// "à Lyon", "au Havre", mais "dans le Rhône" ou "en Bretagne" quand l'offre
// n'indique qu'un département ou une région ("à Rhône" sinon). Vienne (38)
// reste une ville : le code du lieu ne correspond pas au département 86.
function placePhrase(location: string): string | null {
  const key = normalizeCityKey(location);
  if (!key) return null;
  const slug = slugify(key);
  const departement = getDepartementBySlug(slug);
  if (departement) {
    const code = departementFromLocation(location);
    if (!code || code === departement.code) return departement.phrase;
  }
  const region = getRegionBySlug(slug);
  if (region) return region.phrase;
  return cityPhrase(titleCase(key));
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

// « Mensuel de 1100.00 Euros à 1300.00 Euros sur 12 mois » (France Travail)
// -> « 1 100 à 1 300 € brut par mois ». Jamais pour Adzuna (souvent une
// estimation annuelle d'Adzuna, pas le salaire de l'annonce), ni quand le
// montant n'est pas plausible.
function salaryText(offer: Offer): string | null {
  if (offer.source === "adzuna" || !offer.salary || parseMonthlySalary(offer.salary) === null) return null;
  const text = offer.salary.toLowerCase().replace(/sur \d+(?:[.,]\d+)? mois/g, " ");
  const unit = /horaire/.test(text) ? "de l'heure" : /annuel/.test(text) ? "par an" : /mensuel/.test(text) ? "par mois" : null;
  if (!unit) return null;
  const amounts = [...text.matchAll(/\d[\d ]*(?:[.,]\d+)?/g)]
    .map((match) => Number(match[0].replace(/\s/g, "").replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 2);
  if (amounts.length === 0) return null;
  const format = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: unit === "de l'heure" ? 2 : 0 });
  const amount = amounts.length === 2 && amounts[1] !== amounts[0] ? `${format(amounts[0])} à ${format(amounts[1])} €` : `${format(amounts[0])} €`;
  return `${amount} brut ${unit}`;
}

// Contexte unique (contrat, entreprise, ville, durée) AVANT l'extrait : les
// 155 premiers caractères bruts de la description étaient souvent un texte
// générique d'entreprise identique sur toutes ses offres.
function offerMetaDescription(offer: Offer): string {
  const place = placePhrase(offer.location);
  // Le salaire, quand l'annonce le donne, juste après : c'est ce que le
  // candidat cherche en premier dans les résultats.
  const salary = salaryText(offer);
  const context = `${CONTRACT_LABEL[offer.contract_type]} chez ${offer.company}${place ? ` ${place}` : ""}${
    offer.duration ? ` (${offer.duration})` : ""
  }${salary ? `, ${salary}` : ""}.`;
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
      title: UNNAMED_EMPLOYER.test(offer.company) ? offer.title : `${offer.title} chez ${offer.company}`,
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

// Google Jobs accepte (et recommande) du HTML simple dans la description :
// les retours à la ligne du texte France Travail deviennent des <br>, sinon
// la description s'affiche en un seul bloc.
function jobPostingDescription(text: string): string {
  const escaped = text.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function jobPostingJsonLd(offer: Offer) {
  // Date à laquelle le cron retire réellement l'offre du site -- jamais dans
  // le passé tant que la fiche est en ligne (cron en retard d'un jour).
  const validThrough = offerRemovalDate(offer.published_at, offer.last_seen_at);
  const departement = getDepartement(departementFromLocation(offer.location) ?? "");
  const baseSalary = parseBaseSalary(offer.salary);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offer.title,
    description: jobPostingDescription(offer.description || offer.title),
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

// Chiffres propres à Stageio sur la fiche (le texte de l'annonce, lui, est
// repris de la source et se retrouve sur d'autres sites) : le marché du
// métier dans la ville, le salaire médian indiqué, les autres entreprises
// qui recrutent, et le minimum légal.
function MarketBlock({ market, contractType }: { market: OfferMarket; contractType: Offer["contract_type"] }) {
  const offersOf = contractType === "alternance" ? "offres d'alternance" : "offres de stage";
  const n = (value: number) => value.toLocaleString("fr-FR");
  const rates = APPRENTICE_RATES;
  return (
    <section className="mt-8">
      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>{market.label} : les chiffres</h2>
      <ul style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0, paddingLeft: 20, listStyle: "disc" }}>
        <li>
          <Link href={market.href}>
            {n(market.count)} {offersOf}
          </Link>{" "}
          en ce moment sur Stageio
          {market.recent7d > 0 ? `, dont ${n(market.recent7d)} publiée${market.recent7d > 1 ? "s" : ""} ces 7 derniers jours` : ""}.
        </li>
        {market.salaryMedian !== null && (
          <li>
            Salaire médian indiqué dans ces offres : {formatEuros(market.salaryMedian, 0)} brut par mois (sur {n(market.salaryN)} offres
            France Travail qui l&apos;indiquent).
          </li>
        )}
        {market.companies.length > 0 && (
          <li>
            Recrutent aussi :{" "}
            {market.companies.map((company, i) => (
              <span key={company.href}>
                {i > 0 ? ", " : ""}
                <Link href={company.href}>{company.label}</Link>
              </span>
            ))}
            .
          </li>
        )}
        {contractType === "alternance" ? (
          <li>
            Minimum légal d&apos;un apprenti en 1re année : {formatPercent(rates["18to20"][1])} du SMIC de 18 à 20 ans (
            {formatEuros(SMIC_MONTHLY_GROSS * rates["18to20"][1], 0)} brut par mois), {formatPercent(rates["21to25"][1])} de 21 à 25 ans (
            {formatEuros(SMIC_MONTHLY_GROSS * rates["21to25"][1], 0)}), 100 % à partir de 26 ans.{" "}
            <Link href="/outils/simulateur-salaire-alternance">Calcule ton salaire</Link>
          </li>
        ) : (
          <li>
            Au-delà de 2 mois de stage, la gratification minimale est de {formatEuros(STAGE_HOURLY_MIN)} par heure.{" "}
            <Link href="/guides/gratification-de-stage">Tout sur la gratification</Link>
          </li>
        )}
      </ul>
    </section>
  );
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
          {offer.salary && <span className="tag tag-neutral">💶 {salaryText(offer) ?? offer.salary}</span>}
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
          <ApplyButton
            href={offer.apply_url}
            followUp={`Une seule candidature suffit rarement : crée ton profil gratuit en 1 minute et swipe les autres offres${
              links.market ? ` «\u00a0${links.market.label}\u00a0»` : ""
            } dès leur publication.`}
          />
        )}
        <p style={{ fontSize: 13, margin: "10px 0 0", textAlign: "center" }}>
          Besoin d&apos;une lettre de motivation ou d&apos;un CV ? Nos générateurs gratuits :{" "}
          <Link href={`/outils/lettre-de-motivation-${offer.contract_type}`}>lettre</Link> ·{" "}
          <Link href={`/outils/cv-${offer.contract_type}`}>CV en PDF</Link>
        </p>
        <ShareButtons
          title="Cette offre peut intéresser un pote ?"
          url={`${SITE_URL}${offerPath(offer)}`}
          text={`${offer.title}${UNNAMED_EMPLOYER.test(offer.company) ? "" : ` chez ${offer.company}`} (${titleCase(normalizeCityKey(offer.location)) || offer.location}), regarde :`}
        />
      </div>

      <div className="card mt-4" style={{ padding: "var(--space-4) var(--space-5)" }}>
        <p style={{ fontSize: 14.5, margin: "0 0 12px" }}>
          <strong>
            {links.market ? `${links.market.label} : ne rate pas les prochaines offres.` : "Ne rate pas les prochaines offres."}
          </strong>{" "}
          Crée ton profil gratuit en 1 minute : tu swipes les nouvelles offres qui te correspondent dès leur publication.
        </p>
        <Link href="/inscription" className="btn btn-primary">
          Créer mon profil gratuit
        </Link>
      </div>

      {links.market && <MarketBlock market={links.market} contractType={offer.contract_type} />}

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
        {[links.programmatic.metierCity, ...links.programmatic.formations, links.programmatic.departement, links.programmatic.metier, links.programmatic.city, links.company]
          .filter((link): link is NonNullable<typeof link> => link !== null)
          .map((link) => (
            <Link key={link.href} href={link.href} className="tag tag-neutral">
              {link.label} ({link.count})
            </Link>
          ))}
        {/* Liste sans contenu (noindex) : seulement si la ville n'a pas de page /alternance/[ville]. */}
        {links.city && !links.programmatic.city && (
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
      <p style={{ fontSize: 13.5, margin: "14px 0 0" }}>
        Guides utiles :{" "}
        {offerGuides(offer.contract_type, offer.title).map((guide, i) => (
          <span key={guide.slug}>
            {i > 0 && " · "}
            <Link href={`/guides/${guide.slug}`}>{guide.label}</Link>
          </span>
        ))}
      </p>

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

      {/* Les fiches expirées gardent du trafic Google (les plus cliquées l'étaient
          déjà le 07/10) : le visiteur a raté celle-ci, on lui propose de ne pas
          rater les suivantes. */}
      <div
        className="card mt-4"
        style={{ padding: "var(--space-4) var(--space-5)", background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}
      >
        <p style={{ fontSize: 14.5, margin: 0 }}>
          <strong>Ne rate pas la prochaine.</strong> Crée ton profil gratuit en 1 minute : les nouvelles offres
          {links.market ? ` «\u00a0${links.market.label}\u00a0»` : ""} arrivent dans ton fil dès leur publication.
        </p>
        <Link href="/inscription" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 8 }}>
          Créer mon profil gratuit
        </Link>
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
        {[links.programmatic.metierCity, ...links.programmatic.formations, links.programmatic.departement, links.programmatic.metier, links.programmatic.city, links.company]
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

