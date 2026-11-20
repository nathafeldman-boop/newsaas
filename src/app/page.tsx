import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_EMAIL, SITE_URL, SOCIAL_PROFILES } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { getPublicReviewStats } from "@/lib/reviews/publicStats";
import { Reveal } from "@/components/ui/Reveal";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { regionLinks } from "@/lib/seo/regionPage";
import { getRegionBySlug } from "@/lib/seo/departements";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { getMetier, isFormation, isSpecialite } from "@/lib/seo/metiers";
import { offerPath } from "@/lib/offers/publicUrl";
import { isJobPostingEligible } from "@/lib/seo/jobPosting";
import { PLAN_PRICES } from "@/lib/pricing/plans";
import { LandingTop, type HeroOffer } from "@/components/landing/LandingTop";
import { fetchActiveOfferCount } from "@/lib/offers/fetchPublicOffers";

export const metadata: Metadata = {
  // Marque en tête (la plupart des clics Google sont sur « stageio ») puis
  // les mots des recherches non-marque : « appli », « trouver une
  // alternance / un stage ».
  title: "Stageio : l'appli pour trouver ton alternance ou ton stage en swipant",
  description:
    "Les offres d'alternance et de stage de toute la France au même endroit, mises à jour chaque jour : swipe celles qui matchent ton profil, candidate en un geste, lettre de motivation par IA. Inscription gratuite.",
  alternates: { canonical: "/" },
};

// Chiffres réels (offres actives, avis) désormais lus en base -- revalidate
// plutôt que fully dynamic : la home reste servie depuis le cache (vitesse =
// signal SEO) et se régénère au plus une fois par heure, largement assez
// frais pour des stats qui bougent lentement.
export const revalidate = 3600;

const FAQ = [
  {
    question: "Stageio, c'est quoi ?",
    answer:
      "Stageio est une plateforme française qui aide les étudiant·e·s à trouver une alternance ou un stage. Les offres se consultent comme des cartes à swiper (à droite pour aimer, à gauche pour passer), triées selon ton profil : secteur, métier visé, ville, compétences et niveau d'études.",
  },
  {
    question: "Est-ce que Stageio est gratuit ?",
    answer:
      `L'inscription et la création de profil sont gratuites, et tu peux parcourir tout le catalogue d'offres sans limite. Liker une offre, candidater et générer une lettre de motivation par IA sont réservés aux membres Premium : ${PLAN_PRICES.monthly.regular}/mois sans engagement, ou ${PLAN_PRICES.lifetime.regular} en paiement unique pour un accès à vie. Prix de bienvenue de ${PLAN_PRICES.monthly.welcome}/mois ou ${PLAN_PRICES.lifetime.welcome} à vie pendant 10 minutes, à compter de la première fois où tu vois la page Premium.`,
  },
  {
    question: "Stageio propose des stages, des alternances ou des CDI ?",
    answer:
      "Les quatre : alternance, stage, et depuis novembre 2026 des CDI et des CDD ouverts aux débutants (moins d'un an d'expérience demandé). Tu choisis à l'inscription ce que tu cherches, plusieurs types si tu veux, et tu peux filtrer à tout moment depuis l'écran de swipe.",
  },
  {
    question: "Comment Stageio choisit les offres qu'il me montre ?",
    answer:
      "Chaque offre reçoit un score de compatibilité calculé à partir de ton profil (secteur, métier recherché, ville et mobilité, compétences, niveau d'études, disponibilité) : les offres les plus pertinentes pour toi remontent en premier.",
  },
  {
    question: "Comment résilier l'abonnement Premium ?",
    answer:
      "Depuis ton Profil, sur \"Gérer mon abonnement Premium\" — aucun engagement, aucune justification à donner.",
  },
  {
    question: "Stageio propose-t-il des offres partout en France ?",
    answer:
      "Oui. Tu peux chercher par ville ou par département à l'inscription, et filtrer les offres selon ta mobilité (présentiel, hybride, télétravail) — Stageio référence des offres dans toute la France, pas seulement dans les grandes métropoles.",
  },
  {
    question: "Faut-il un CV pour s'inscrire sur Stageio ?",
    answer:
      "Non, le CV est facultatif à l'inscription. Tu peux l'ajouter à tout moment depuis ton profil ; les utilisateurs Premium en profitent pour affiner encore le matching et débloquer l'audit de CV noté sur 100.",
  },
  {
    question: "Stageio couvre-t-il tous les secteurs (informatique, marketing, RH, commerce...) ?",
    answer:
      "Oui, tous les secteurs sont représentés. Tu choisis tes secteurs et les métiers que tu vises à l'inscription, et Stageio priorise les offres qui correspondent, quel que soit le domaine.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stageio",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description:
    "Plateforme française pour trouver une alternance ou un stage : les offres se consultent comme des cartes à swiper, triées selon le profil de l'étudiant.",
  email: CONTACT_EMAIL,
  sameAs: SOCIAL_PROFILES.map((profile) => profile.url),
};

// Sert au "nom du site" affiché par Google au-dessus du titre. Plus de
// SearchAction : /offres n'a jamais géré ?q= (recherche morte) et Google a
// de toute façon retiré la sitelinks search box en 2024.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stageio",
  alternateName: "stageio.fr",
  url: `${SITE_URL}/`,
};

// Google affiche des étoiles directement dans les résultats de recherche
// pour ce type (SoftwareApplication) quand un aggregateRating réel est
// présent -- on ne l'inclut que si des avis approuvés existent, jamais avec
// une note inventée (une note affichée sans avis réels viole les consignes
// Google sur les extraits d'avis).
function buildWebApplicationJsonLd(reviewStats: { count: number; average: number | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stageio",
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    // Prix réels (voir /premium) : gratuit pour parcourir les offres,
    // Premium pour liker, candidater, la lettre IA et l'audit de CV.
    offers: [
      { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Premium mensuel (sans engagement)", price: "12.79", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Premium à vie (paiement unique)", price: "63.99", priceCurrency: "EUR" },
    ],
    ...(reviewStats.count > 0 && reviewStats.average !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewStats.average,
            reviewCount: reviewStats.count,
          },
        }
      : {}),
  };
}

const mutedText = "color-mix(in srgb, var(--color-text) 65%, transparent)";
const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-accent-2-700)",
};
const h2Style: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: "clamp(30px,4.4vw,48px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.06,
};

type DiscoveryLink = { href: string; label: string };

// Bloc de liens vers les pages métier, ville et entreprise : l'accueil est la
// page la plus explorée par Google, c'est d'ici qu'il découvre le plus vite
// les nouvelles pages. Best-effort : une erreur (ou un build sans base) masque
// juste le bloc, jamais la page.
async function getDiscoveryLinks(): Promise<{
  metiers: DiscoveryLink[];
  formations: DiscoveryLink[];
  cities: DiscoveryLink[];
  regions: DiscoveryLink[];
  companies: DiscoveryLink[];
} | null> {
  try {
    const [alternance, companies] = await Promise.all([getProgrammaticIndex("alternance"), getCompanyIndex()]);
    return {
      metiers: Object.values(alternance.metiers)
        .filter((m) => !isFormation(m.slug) && !isSpecialite(m.slug))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((m) => ({ href: `/alternance/${m.slug}`, label: `Alternance ${getMetier(m.slug)?.label ?? m.slug}` })),
      formations: Object.values(alternance.metiers)
        .filter((m) => isFormation(m.slug))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((m) => ({ href: `/alternance/${m.slug}`, label: `${getMetier(m.slug)?.label ?? m.slug} en alternance` })),
      cities: Object.values(alternance.cities)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((c) => ({ href: `/alternance/${c.slug}`, label: `Alternance ${/^(le|les)\s/i.test(c.label) ? c.label : `à ${c.label}`}` })),
      regions: regionLinks(alternance).map((r) => ({ href: r.href, label: `Alternance ${getRegionBySlug(r.href.split("/").pop() ?? "")?.phrase ?? r.label}` })),
      companies: Object.values(companies.companies)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label })),
    };
  } catch (err) {
    console.error("getDiscoveryLinks failed", err);
    return null;
  }
}

// Dernières offres publiées : sans Indexing API, c'est par l'accueil (la page
// que Google explore le plus souvent) qu'il découvre le plus vite les
// nouvelles fiches. Seulement les offres éligibles à Google Jobs (pas Adzuna,
// en noindex). Best-effort comme les liens de découverte.
const LATEST_OFFERS = 12;

async function getLatestOfferLinks(): Promise<DiscoveryLink[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("offers")
      .select("id, title, company, location, description, source, contract_type")
      .eq("is_active", true)
      .not("source", "in", "(adzuna,demo)")
      .order("published_at", { ascending: false })
      .order("id")
      .limit(LATEST_OFFERS * 3);
    if (error) throw error;
    return (data ?? [])
      .filter(isJobPostingEligible)
      .slice(0, LATEST_OFFERS)
      .map((offer) => {
        const title = offer.title.length > 60 ? `${offer.title.slice(0, 57).trimEnd()}…` : offer.title;
        return { href: offerPath(offer), label: `${title} · ${offer.company}` };
      });
  } catch (err) {
    console.error("getLatestOfferLinks failed", err);
    return [];
  }
}

// Guides mis en avant sur l'accueil : la page la plus forte du site leur
// transmet du poids, et ce sont les questions que les étudiants tapent le plus.
const POPULAR_GUIDES = [
  { href: "/guides/je-ne-trouve-pas-d-alternance", label: "Je ne trouve pas d'alternance" },
  { href: "/guides/sites-pour-trouver-une-alternance", label: "Quel site ou appli pour trouver une alternance" },
  { href: "/guides/la-bonne-alternance", label: "La Bonne Alternance : mode d'emploi" },
  { href: "/guides/alternance-sans-le-bac", label: "Alternance sans le bac" },
  { href: "/guides/parcoursup-alternance", label: "Parcoursup et alternance" },
  { href: "/guides/quand-chercher-son-alternance", label: "Quand chercher son alternance" },
  { href: "/guides/gratification-de-stage", label: "Gratification de stage 2026" },
  { href: "/guides/cv-alternance", label: "CV d'alternance" },
  { href: "/guides/lettre-de-motivation-alternance", label: "Lettre de motivation" },
  { href: "/guides/contrat-apprentissage-ou-contrat-pro", label: "Apprentissage ou contrat pro" },
  { href: "/guides/aides-alternants", label: "Aides aux alternants" },
  { href: "/guides/entretien-alternance", label: "Entretien d'alternance" },
  { href: "/guides/trouver-un-stage", label: "Trouver un stage" },
  { href: "/guides/stage-de-fin-d-etudes", label: "Stage de fin d'études 2027" },
];

// Trois vraies offres récentes (CDI, alternance, CDD) pour les cartes du haut.
async function getHeroOffers(): Promise<HeroOffer[]> {
  const admin = createAdminClient();
  const pick = async (type: "cdi" | "alternance" | "cdd") => {
    const { data } = await admin
      .from("offers")
      .select("id, title, company, location, contract_type")
      .eq("is_active", true)
      .eq("contract_type", type)
      .not("company", "ilike", "%communiqu%")
      .order("published_at", { ascending: false })
      .limit(1);
    const o = data?.[0];
    if (!o) return null;
    const city = String(o.location ?? "").replace(/^\s*\d{2,3}\s*-\s*/, "").replace(/\s+\d+e?r?\s+Arrondissement$/i, "");
    const title = String(o.title).replace(/\s*\((?:H\/F|F\/H)\)\s*/gi, " ").replace(/\s+/g, " ").trim();
    const company = String(o.company).toLowerCase().replace(/(^|[\s'-])\S/g, (c) => c.toUpperCase());
    return { id: o.id, title, company, city: city.charAt(0) + city.slice(1).toLowerCase(), contract: o.contract_type } as HeroOffer;
  };
  const list = await Promise.all([pick("cdi"), pick("alternance"), pick("cdd")]).catch(() => [] as (HeroOffer | null)[]);
  return list.filter((o): o is HeroOffer => o !== null);
}

export default async function LandingPage() {
  // Client admin plutôt que le client lié aux cookies (@/lib/supabase/server) :
  // cette page n'affiche rien de spécifique au visiteur, et cookies() forcerait
  // un rendu dynamique par requête, rendant `revalidate` ci-dessus inopérant --
  // exactement le genre de lenteur que ce passage SEO cherche à éviter.
  const admin = createAdminClient();
  const [{ count: activeOffersCount }, reviewStats, discovery, latestOffers] =
    await Promise.all([
      admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
      getPublicReviewStats(),
      getDiscoveryLinks(),
      getLatestOfferLinks(),
    ]);
  // Nouvelle page d'accueil (20/11) : vraies offres en cartes et vrais chiffres.
  const [cdiCount, cddCount, { count: usersCount }, heroOffers] = await Promise.all([
    fetchActiveOfferCount("cdi").catch(() => null),
    fetchActiveOfferCount("cdd").catch(() => null),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    getHeroOffers(),
  ]);

  const webApplicationJsonLd = buildWebApplicationJsonLd(reviewStats);
  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />

      <LandingTop
        offers={heroOffers}
        activeOffers={activeOffersCount ?? null}
        cdi={cdiCount}
        cdd={cddCount}
        users={usersCount ?? null}
        rating={reviewStats.count > 0 ? reviewStats.average : null}
      />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-9">
        {discovery && (
          <section className="py-10">
            <p style={eyebrow}>Explorer les offres</p>
            <h2 style={{ ...h2Style, maxWidth: "20ch" }}>Par métier, par ville, par entreprise.</h2>
            {[
              { title: "Les métiers qui recrutent", links: discovery.metiers },
              { title: "Par diplôme", links: discovery.formations },
              { title: "Les villes", links: discovery.cities },
              { title: "Les régions", links: discovery.regions },
              { title: "Les entreprises qui publient le plus", links: discovery.companies },
              { title: "Les dernières offres publiées", links: latestOffers },
              { title: "Les guides les plus lus", links: POPULAR_GUIDES },
            ]
              .filter((group) => group.links.length > 0)
              .map((group) => (
                <div key={group.title} style={{ marginTop: 20 }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14 }}>{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.links.map((link) => (
                      <Link key={link.href} href={link.href} className="tag tag-neutral">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            <p style={{ marginTop: 20, fontSize: 14 }}>
              <Link href="/alternance">Toute l&apos;alternance par métier et ville</Link>
              {" · "}
              <Link href="/stage">Tous les stages par métier et ville</Link>
              {" · "}
              <Link href="/entreprises">Toutes les entreprises</Link>
              {" · "}
              <Link href="/barometre-alternance-stage">Baromètre 2026</Link>
              {" · "}
              <Link href="/outils/simulateur-salaire-alternance">Salaire en alternance 2026</Link>
              {" · "}
              <Link href="/outils/lettre-de-motivation-alternance">Lettre de motivation (générateur)</Link>
              {" · "}
              <Link href="/outils/cv-alternance">CV (générateur)</Link>
            </p>
          </section>
        )}

        {/* FAQ */}
        <section
          id="faq"
          className="py-10 flex flex-wrap items-start gap-9"
          style={{ scrollMarginTop: 80 }}
        >
          <Reveal>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <p style={eyebrow}>Questions fréquentes</p>
              <h2 style={{ ...h2Style, maxWidth: "11ch" }}>Tout ce que tu te demandes.</h2>
            </div>
          </Reveal>
          <div className="flex flex-col gap-2.5" style={{ flex: "2 1 480px", minWidth: 0 }}>
            {FAQ.map((item, i) => (
              <Reveal key={item.question} delay={i * 0.04}>
                <details
                  className="group"
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent)",
                    padding: "18px 20px",
                  }}
                >
                  <summary
                    className="flex items-center gap-3.5"
                    style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: 15.5, listStyle: "none" }}
                  >
                    <span style={{ flex: 1 }}>{item.question}</span>
                    <span
                      aria-hidden
                      className="flex items-center justify-center"
                      style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: "var(--color-accent-100)", color: "var(--color-accent-700)", fontSize: 13 }}
                    >
                      +
                    </span>
                  </summary>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: "12px 0 0",
                      color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
                    }}
                  >
                    {item.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <footer
          className="py-6 flex flex-wrap items-center gap-x-5 gap-y-2"
          style={{ borderTop: "1px solid var(--color-divider)" }}
        >
          <span className="flex items-center gap-2" style={{ marginRight: "auto", fontSize: 14, fontWeight: 800 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
            Stageio · © {new Date().getFullYear()}
          </span>
          {[
            { href: "/a-propos", label: "Stageio, c'est quoi ?" },
            { href: "/alternance", label: "Alternance par métier et ville" },
            { href: "/stage", label: "Stage par métier et ville" },
            { href: "/entreprises", label: "Entreprises qui recrutent" },
            { href: "/barometre-alternance-stage", label: "Baromètre 2026" },
            { href: "/guides", label: "Guides" },
            { href: "/outils", label: "Outils gratuits" },
            { href: "/outils/simulateur-salaire-alternance", label: "Salaire en alternance 2026" },
            { href: "/outils/lettre-de-motivation-alternance", label: "Lettre de motivation alternance" },
            { href: "/outils/lettre-de-motivation-stage", label: "Lettre de motivation stage" },
            { href: "/outils/cv-alternance", label: "CV alternance" },
            { href: "/outils/cv-stage", label: "CV de stage" },
            { href: "/affilies", label: "Devenir affilié" },
            { href: "/legal/mentions-legales", label: "Mentions légales" },
            { href: "/legal/cgu", label: "CGU" },
            { href: "/legal/cgv", label: "CGV" },
            { href: "/legal/confidentialite", label: "Confidentialité" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ fontSize: 13, color: mutedText }}
            >
              {item.label}
            </Link>
          ))}
        </footer>
      </div>
    </div>
  );
}
