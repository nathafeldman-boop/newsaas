import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { getPublicReviewStats, getPublicTestimonials, type PublicTestimonial } from "@/lib/reviews/publicStats";
import { SwipeDemo } from "@/components/landing/SwipeDemo";
import { Reveal } from "@/components/ui/Reveal";
import { Highlight } from "@/components/ui/Highlight";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Chiffres réels (offres actives, avis) désormais lus en base -- revalidate
// plutôt que fully dynamic : la home reste servie depuis le cache (vitesse =
// signal SEO) et se régénère au plus une fois par heure, largement assez
// frais pour des stats qui bougent lentement.
export const revalidate = 3600;

const STEPS = [
  {
    n: "01",
    title: "Crée ton profil",
    text: "Compétences, ville, parcours, et ton CV si tu veux — facultatif.",
    tone: "light" as const,
  },
  {
    n: "02",
    title: "Swipe les offres",
    text: "Logo, salaire, avis d'anciens alternants : tout pour décider d'un regard.",
    tone: "light" as const,
  },
  {
    n: "03",
    title: "Postule en un geste",
    text: "Directement depuis la carte que tu aimes, sans ressaisir tes infos.",
    tone: "dark" as const,
  },
];

const FEATURES = [
  {
    icon: "✍️",
    title: "Lettre de motivation IA",
    text: "Une lettre adaptée à chaque offre, générée à partir de ton profil.",
  },
  {
    icon: "🎤",
    title: "Simulateur d'entretien",
    text: "Questions à choix multiples sur 3 niveaux pour arriver prêt·e.",
  },
  {
    icon: "📄",
    title: "Audit de CV sur 100",
    text: "Des recommandations concrètes pour sortir du lot.",
  },
];

const MARQUEE_ITEMS = [
  "Marketing digital · Lyon",
  "Dev full-stack · Nantes",
  "Chef·fe de produit · Paris",
  "Chargé·e RH · Lille",
  "Data analyst · Toulouse",
  "Community manager · Bordeaux",
  "Business developer · Marseille",
];

// Utilisés seulement si la base ne compte pas encore assez d'avis publiés
// avec commentaire (voir getPublicTestimonials) -- jamais mélangés avec de
// vrais avis pour ne pas donner l'impression que ce sont les mêmes.
const FALLBACK_TESTIMONIALS: PublicTestimonial[] = [
  {
    quote: "Trois jours après mon inscription, j'avais déjà un entretien.",
    author: "Léa, alternante en marketing digital",
  },
  {
    quote:
      "J'ai enfin arrêté de recopier la même lettre de motivation sur quinze sites différents.",
    author: "Thomas, stagiaire développement web",
  },
  {
    quote:
      "Les offres qui remontent correspondent vraiment à ce que j'ai mis dans mon profil, ça change tout.",
    author: "Inès, alternante ressources humaines",
  },
];

const FAQ = [
  {
    question: "Stageio, c'est quoi ?",
    answer:
      "Stageio est une plateforme française qui aide les étudiant·e·s à trouver une alternance ou un stage. Les offres se consultent comme des cartes à swiper (à droite pour aimer, à gauche pour passer), triées selon ton profil : secteur, métier visé, ville, compétences et niveau d'études.",
  },
  {
    question: "Est-ce que Stageio est gratuit ?",
    answer:
      "L'inscription et la création de profil sont gratuites. Le compte gratuit a un quota de swipes par semaine, mais candidater à une offre déjà vue reste toujours gratuit et illimité. L'abonnement Premium (7,99€/mois, sans engagement) débloque les swipes illimités, la lettre de motivation générée par IA et l'audit de CV.",
  },
  {
    question: "Stageio propose des stages ou des alternances ?",
    answer:
      "Les deux. Tu choisis à l'inscription si tu cherches une alternance, un stage, ou les deux, et tu peux basculer entre les deux à tout moment depuis l'écran de swipe.",
  },
  {
    question: "Comment Stageio choisit les offres qu'il me montre ?",
    answer:
      "Chaque offre reçoit un score de compatibilité calculé à partir de ton profil (secteur, métier recherché, ville et mobilité, compétences, niveau d'études, disponibilité) : les offres les plus pertinentes pour toi remontent en premier.",
  },
  {
    question: "Comment résilier l'abonnement Premium ?",
    answer:
      "Depuis la page Premium de ton compte, en un clic sur \"Gérer mon abonnement\" — aucun engagement, aucune justification à donner.",
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
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stageio",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/offres?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
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
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
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

export default async function LandingPage() {
  // Client admin plutôt que le client lié aux cookies (@/lib/supabase/server) :
  // cette page n'affiche rien de spécifique au visiteur, et cookies() forcerait
  // un rendu dynamique par requête, rendant `revalidate` ci-dessus inopérant --
  // exactement le genre de lenteur que ce passage SEO cherche à éviter.
  const admin = createAdminClient();
  const [{ count: activeOffersCount }, { count: alternanceCount }, reviewStats, realTestimonials] =
    await Promise.all([
      admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("contract_type", "alternance"),
      getPublicReviewStats(),
      getPublicTestimonials(3),
    ]);

  const alternanceShare =
    activeOffersCount && activeOffersCount > 0
      ? Math.round(((alternanceCount ?? 0) / activeOffersCount) * 100)
      : null;

  // Toujours 4 chiffres réels affichés, jamais de valeur inventée : la note
  // moyenne cède la place à un fait produit vérifiable (sans engagement) tant
  // qu'il n'y a pas assez d'avis publiés pour l'afficher honnêtement.
  const STATS = [
    {
      value: activeOffersCount ? activeOffersCount.toLocaleString("fr-FR") : "—",
      label: "Offres actives",
      color: "var(--color-accent)",
    },
    { value: "100%", label: "Gratuit à l'inscription" },
    {
      value: alternanceShare !== null ? `${alternanceShare}%` : "—",
      label: "Alternances",
      color: "var(--color-accent-2)",
    },
    reviewStats.count > 0
      ? { value: `${reviewStats.average}★`, label: `Note moyenne (${reviewStats.count} avis)` }
      : { value: "0€", label: "Sans engagement" },
  ];

  const testimonials = realTestimonials.length >= 3 ? realTestimonials : FALLBACK_TESTIMONIALS;
  const webApplicationJsonLd = buildWebApplicationJsonLd(reviewStats);
  // Même condition que /premium : tant que le Price hebdomadaire n'est pas
  // configuré côté Stripe, cette formule ne s'affiche nulle part.
  const weeklyAvailable = !!process.env.STRIPE_PRICE_ID_WEEKLY?.trim();

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

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          className="flex items-center gap-5"
          style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 24px", overflowX: "auto" }}
        >
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: "none", color: "var(--color-text)", marginRight: "auto", whiteSpace: "nowrap" }}
          >
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
            <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em" }}>Stageio</span>
          </Link>
          <a href="#comment" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
            Comment ça marche
          </a>
          <a href="#fonctions" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
            Fonctionnalités
          </a>
          <a href="#tarifs" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
            Tarifs
          </a>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
            Se connecter
          </Link>
          <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            Créer mon compte →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden
          className="lp-drift"
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "var(--color-accent-200)",
            filter: "blur(90px)",
            opacity: 0.7,
            right: -80,
            top: -60,
          }}
        />
        <div
          aria-hidden
          className="lp-drift"
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "var(--color-accent-2-200)",
            filter: "blur(80px)",
            opacity: 0.8,
            left: -120,
            bottom: -120,
            animationDirection: "reverse",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1240,
            margin: "0 auto",
            padding: "56px 24px 64px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          <Reveal>
            <span
              className="flex items-center gap-2"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px 6px 6px",
                borderRadius: 999,
                background: "var(--color-surface)",
                boxShadow: "0 1px 2px color-mix(in srgb, var(--color-text) 12%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="lp-pulse flex items-center justify-center"
                style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--color-accent)", fontSize: 12 }}
              >
                🔥
              </span>
              L&apos;app Tinder de l&apos;alternance et du stage
            </span>
            <h1
              style={{
                margin: "22px 0 0",
                fontSize: "clamp(40px,6.4vw,78px)",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textWrap: "balance" as React.CSSProperties["textWrap"],
              }}
            >
              Trouve ta prochaine expérience{" "}
              <span className="lp-wiggle" style={{ display: "inline-block" }}>
                <Highlight>en swipant</Highlight>
              </span>
            </h1>
            <p
              style={{
                margin: "24px 0 0",
                fontSize: 17,
                lineHeight: 1.6,
                maxWidth: "46ch",
                color: mutedText,
              }}
            >
              Fini les quarante candidatures identiques sur dix sites différents. On te propose
              les offres qui matchent ton profil ; tu likes, tu postules, c&apos;est tout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn btn-gradient" style={{ whiteSpace: "nowrap" }}>
                Commencer à swiper — c&apos;est gratuit
              </Link>
              <a href="#comment" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                ▶ Voir comment
              </a>
            </div>
            <div className="mt-7 flex items-center gap-3.5">
              <div className="flex">
                {["L", "T", "I"].map((letter, i) => (
                  <span
                    key={letter}
                    aria-hidden
                    className="flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--color-accent)" : i === 1 ? "var(--color-accent-2)" : "var(--color-neutral-700)",
                      color: "var(--color-bg)",
                      border: "3px solid var(--color-bg)",
                      marginLeft: i === 0 ? 0 : -10,
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {letter}
                  </span>
                ))}
                <span
                  aria-hidden
                  className="flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--color-accent-200)",
                    color: "var(--color-accent-800)",
                    border: "3px solid var(--color-bg)",
                    marginLeft: -10,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  +
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4, color: mutedText }}>
                <strong style={{ color: "var(--color-text)" }}>Gratuit à l&apos;inscription</strong>
                <br />
                CV facultatif · partout en France
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              className="mx-auto flex items-center justify-center"
              style={{ position: "relative", maxWidth: 360, minHeight: 560 }}
            >
              <div
                aria-hidden
                className="lp-spin"
                style={{
                  position: "absolute",
                  width: 420,
                  height: 420,
                  borderRadius: "50%",
                  border: "1px dashed color-mix(in srgb, var(--color-accent) 35%, transparent)",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  width: 320,
                  height: 320,
                  borderRadius: "50%",
                  background: "var(--color-accent-100)",
                  filter: "blur(60px)",
                  opacity: 0.5,
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <SwipeDemo />
              </div>

              <div
                aria-hidden
                className="lp-float"
                style={{ position: "absolute", zIndex: 3, left: -18, top: -14, ["--r" as string]: "-6deg" }}
              >
                <div
                  className="flex items-center gap-2.5"
                  style={{
                    background: "var(--color-neutral-900)",
                    color: "var(--color-bg)",
                    padding: "10px 14px 10px 10px",
                    borderRadius: 16,
                    boxShadow: "0 14px 30px color-mix(in srgb, var(--color-text) 30%, transparent)",
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 30, height: 30, borderRadius: 10, background: "var(--color-accent)", fontSize: 14 }}
                  >
                    📨
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <strong>Candidature envoyée</strong>
                    <br />
                    <span style={{ opacity: 0.75 }}>Groupe SEB · à l&apos;instant</span>
                  </span>
                </div>
              </div>

              <div
                aria-hidden
                className="lp-float"
                style={{ position: "absolute", zIndex: 3, right: -16, top: 60, animationDelay: "0.8s", ["--r" as string]: "5deg" }}
              >
                <div
                  className="flex items-center gap-2.5"
                  style={{
                    background: "var(--color-surface)",
                    padding: "9px 13px 9px 9px",
                    borderRadius: 16,
                    boxShadow: "0 14px 30px color-mix(in srgb, var(--color-text) 18%, transparent)",
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent-100)", color: "var(--color-accent-700)", fontSize: 11, fontWeight: 800 }}
                  >
                    94%
                  </span>
                  <span style={{ fontSize: 12, lineHeight: 1.3 }}>
                    <strong>Excellent match</strong>
                    <br />
                    <span style={{ color: mutedText }}>Marketing · Lyon</span>
                  </span>
                </div>
              </div>

              <div
                aria-hidden
                className="lp-float"
                style={{ position: "absolute", zIndex: 3, right: -8, bottom: 30, animationDelay: "0.3s", ["--r" as string]: "-10deg" }}
              >
                <div
                  style={{
                    border: "3px solid var(--color-accent)",
                    color: "var(--color-accent-700)",
                    background: "var(--color-accent-100)",
                    borderRadius: 12,
                    padding: "3px 14px",
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    boxShadow: "0 10px 24px color-mix(in srgb, var(--color-accent) 25%, transparent)",
                  }}
                >
                  LIKE
                </div>
              </div>

              <div
                aria-hidden
                className="lp-float"
                style={{ position: "absolute", zIndex: 1, left: -16, bottom: 70, animationDelay: "1.2s", ["--r" as string]: "0deg" }}
              >
                <div
                  className="flex items-center gap-1.5"
                  style={{
                    background: "var(--color-surface)",
                    padding: "7px 11px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 6px 16px color-mix(in srgb, var(--color-text) 12%, transparent)",
                  }}
                >
                  🔥 Série de 4 jours
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <section
        aria-hidden
        style={{
          padding: "16px 0",
          background: "var(--color-neutral-900)",
          overflow: "hidden",
          transform: "rotate(-1.2deg)",
          margin: "6px 0 0",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div className="lp-marquee flex" style={{ width: "max-content" }}>
          {[0, 1].map((rep) => (
            <div key={rep} className="flex items-center gap-10" style={{ paddingRight: 40 }}>
              {MARQUEE_ITEMS.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-10"
                  style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-bg)", whiteSpace: "nowrap" }}
                >
                  {item}
                  <span aria-hidden style={{ color: "var(--color-accent-300)" }}>♥</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-9">
        {/* MARKET REALITY */}
        <section className="py-10">
          <Reveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
                gap: 36,
                alignItems: "center",
              }}
            >
              <div>
                <p style={eyebrow}>La réalité du marché</p>
                <h2 style={{ ...h2Style, maxWidth: "13ch" }}>
                  Les alternances se font <Highlight>plus rares</Highlight>.
                </h2>
                <p style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.65, color: mutedText, maxWidth: "44ch" }}>
                  846 700 contrats signés en France en 2025, soit 5% de moins qu&apos;en 2024
                  (source DARES/Insee). Se démarquer devient essentiel — et ça commence par
                  postuler au bon endroit.
                </p>
              </div>
              <div
                className="flex flex-wrap items-end gap-6"
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "28px",
                  boxShadow: "0 1px 2px color-mix(in srgb, var(--color-text) 10%, transparent)",
                }}
              >
                <div style={{ flex: 1, minWidth: 170 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "clamp(38px,5.5vw,60px)",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    846 700
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 600, color: mutedText }}>
                    contrats d&apos;alternance en 2025
                  </p>
                  <span
                    className="mt-3 inline-flex items-center gap-1"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--color-neutral-900)",
                      color: "var(--color-bg)",
                    }}
                  >
                    ↓ −5% vs 2024
                  </span>
                </div>
                <div className="flex items-end gap-3.5" style={{ height: 140 }}>
                  <div className="flex flex-col items-center gap-2" style={{ height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ width: 44, height: "100%", borderRadius: "12px 12px 5px 5px", background: "var(--color-neutral-300)" }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: mutedText }}>2024</span>
                  </div>
                  <div className="flex flex-col items-center gap-2" style={{ height: "100%", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        width: 44,
                        height: "88%",
                        borderRadius: "12px 12px 5px 5px",
                        background: "linear-gradient(180deg, var(--color-accent), var(--color-accent-2))",
                      }}
                    />
                    <span style={{ fontSize: 11.5, fontWeight: 700 }}>2025</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section id="comment" className="py-10" style={{ scrollMarginTop: 80 }}>
          <Reveal>
            <p style={eyebrow}>Le parcours</p>
            <h2 style={{ ...h2Style, maxWidth: "16ch" }}>Trois gestes, et ta candidature est partie.</h2>
          </Reveal>
          <div className="mt-8 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div
                  className="card m-0"
                  style={{
                    padding: "var(--space-6)",
                    background: step.tone === "dark" ? "var(--color-neutral-900)" : "var(--color-surface)",
                    color: step.tone === "dark" ? "var(--color-bg)" : "inherit",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: step.tone === "dark" ? "var(--color-accent-300)" : "var(--color-accent)" }}>
                    {step.n}
                  </span>
                  <h3 style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{step.title}</h3>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 14.5,
                      lineHeight: 1.6,
                      color: step.tone === "dark" ? "color-mix(in srgb, var(--color-bg) 80%, transparent)" : mutedText,
                    }}
                  >
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FONCTIONS */}
        <section id="fonctions" className="py-10" style={{ scrollMarginTop: 80 }}>
          <Reveal>
            <p style={eyebrow}>Tout pour décrocher</p>
            <h2 style={{ ...h2Style, maxWidth: "18ch" }}>Plus qu&apos;un swipe : ton coach de candidature.</h2>
          </Reveal>

          <Reveal delay={0.05}>
            <div
              className="mt-8"
              style={{
                background: "var(--color-neutral-900)",
                color: "var(--color-bg)",
                borderRadius: "var(--radius-lg)",
                padding: "clamp(24px,4vw,44px)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
                gap: 32,
                alignItems: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: -100,
                  top: -100,
                  width: 320,
                  height: 320,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  filter: "blur(100px)",
                  opacity: 0.35,
                }}
              />
              <div style={{ position: "relative" }}>
                <span aria-hidden style={{ fontSize: 26 }}>🎯</span>
                <h3 style={{ margin: "14px 0 0", fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
                  Un score de compatibilité pour chaque offre.
                </h3>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.65, color: "var(--color-neutral-300)", maxWidth: "42ch" }}>
                  Secteur, métier, ville et mobilité, compétences, niveau d&apos;études,
                  disponibilité : les offres les plus pertinentes remontent en premier. Et le
                  deck apprend de tes likes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6" style={{ position: "relative" }}>
                <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="44" cy="44" r="38" stroke="var(--color-neutral-700)" strokeWidth="7" fill="none" />
                    <circle
                      cx="44"
                      cy="44"
                      r="38"
                      stroke="var(--color-accent-300)"
                      strokeWidth="7"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="238.8"
                      className="lp-ring"
                    />
                  </svg>
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>94%</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-neutral-400)" }}>
                      match
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5" style={{ minWidth: 200, flex: 1 }}>
                  {[
                    "Ton métier visé : marketing digital",
                    "Dans ta ville : Lyon et alentours",
                    "Compétences : SEO, Meta Ads",
                  ].map((line) => (
                    <p key={line} className="flex items-center gap-2.5" style={{ margin: 0, fontSize: 13.5 }}>
                      <span aria-hidden style={{ color: "var(--color-accent-300)" }}>✓</span>
                      {line}
                    </p>
                  ))}
                  <p className="flex items-center gap-2.5" style={{ margin: 0, fontSize: 13.5 }}>
                    <span aria-hidden style={{ color: "var(--color-accent-300)" }}>✨</span>
                    Proche d&apos;offres que tu as aimées
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-5 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="card m-0" style={{ padding: "var(--space-6)" }}>
                  <span aria-hidden style={{ fontSize: 26 }}>{f.icon}</span>
                  <h3 style={{ margin: "14px 0 0", fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em" }}>{f.title}</h3>
                  <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: mutedText }}>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* TÉMOIGNAGES */}
        <section className="py-10">
          <Reveal>
            <p style={eyebrow}>Ils ont trouvé</p>
            <h2 style={h2Style}>Ça matche, pour de vrai.</h2>
          </Reveal>
          <div className="mt-9 grid gap-7" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))" }}>
            {testimonials.map((t, i) => {
              const dark = i === 1;
              return (
                <Reveal key={`${t.author}-${i}`} delay={i * 0.08}>
                  <figure
                    className="m-0"
                    style={{
                      position: "relative",
                      background: dark ? "var(--color-neutral-900)" : "var(--color-accent-2-100)",
                      color: dark ? "var(--color-bg)" : "var(--color-accent-2-900)",
                      borderRadius: i % 2 === 0 ? "28px 28px 28px 8px" : "28px 28px 8px 28px",
                      padding: "26px 24px 22px",
                      boxShadow: "0 16px 34px color-mix(in srgb, var(--color-text) 14%, transparent)",
                      transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                    }}
                  >
                    <blockquote style={{ margin: 0, fontSize: 18.5, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.015em" }}>
                      « {t.quote} »
                    </blockquote>
                    <figcaption className="flex items-center gap-2.5 mt-5">
                      <span
                        aria-hidden
                        className="flex items-center justify-center"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: dark ? "var(--color-accent-300)" : "var(--color-accent-2)",
                          color: dark ? "var(--color-neutral-900)" : "var(--color-bg)",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {t.author.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12.5, lineHeight: 1.35, color: dark ? "var(--color-neutral-300)" : "var(--color-accent-2-700)" }}>
                        {t.author}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* STATS */}
        <section className="py-8">
          <Reveal>
            <div
              className="card elev-sm grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-6"
              style={{ padding: "var(--space-6)" }}
            >
              {STATS.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.07}>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(26px,7vw,36px)",
                        color: stat.color,
                        margin: 0,
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: mutedText,
                        margin: "6px 0 0",
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* TARIFS */}
        <section id="tarifs" className="py-10" style={{ scrollMarginTop: 80 }}>
          <Reveal>
            <p style={eyebrow}>Tarifs</p>
            <h2 style={h2Style}>Commence gratuitement.</h2>
          </Reveal>
          <div
            className="mt-8 grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", maxWidth: weeklyAvailable ? 980 : 780 }}
          >
            <Reveal delay={0.05}>
              <div
                className="flex h-full flex-col"
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  boxShadow: "0 1px 2px color-mix(in srgb, var(--color-text) 10%, transparent)",
                }}
              >
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Gratuit</p>
                <p style={{ margin: "10px 0 0", fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>0 €</p>
                <div className="flex flex-col gap-2.5" style={{ margin: "20px 0 24px", flex: 1 }}>
                  {["Quota de swipes chaque semaine", "Candidatures illimitées aux offres vues", "Favoris et suivi de candidatures"].map((line) => (
                    <p key={line} className="flex items-center gap-2.5" style={{ margin: 0, fontSize: 14, color: "color-mix(in srgb, var(--color-text) 82%, transparent)" }}>
                      <span aria-hidden style={{ color: "var(--color-accent)" }}>✓</span>
                      {line}
                    </p>
                  ))}
                </div>
                <Link href="/inscription" className="btn btn-secondary" style={{ textAlign: "center" }}>
                  Créer mon compte
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                className="flex h-full flex-col"
                style={{
                  position: "relative",
                  background: "var(--color-neutral-900)",
                  color: "var(--color-bg)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  border: "1.5px solid var(--color-accent)",
                  boxShadow: "0 22px 46px color-mix(in srgb, var(--color-text) 22%, transparent)",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden
                  style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: "50%", background: "var(--color-accent)", filter: "blur(80px)", opacity: 0.35 }}
                />
                <div className="flex items-center justify-between" style={{ position: "relative" }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>👑 Premium</p>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: "var(--color-accent)", color: "var(--color-bg)" }}>
                    Le plus choisi
                  </span>
                </div>
                <p style={{ position: "relative", margin: "10px 0 0", fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  7,99 €<span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-neutral-400)" }}> /mois</span>
                </p>
                <div className="flex flex-col gap-2.5" style={{ position: "relative", margin: "20px 0 24px", flex: 1 }}>
                  {["Swipes illimités", "Lettres de motivation IA", "Audit de CV et matching sur ton CV", "Simulateur d'entretien"].map((line) => (
                    <p key={line} className="flex items-center gap-2.5" style={{ margin: 0, fontSize: 14, color: "var(--color-neutral-200)" }}>
                      <span aria-hidden style={{ color: "var(--color-accent-300)" }}>✓</span>
                      {line}
                    </p>
                  ))}
                </div>
                <Link href="/inscription" className="btn btn-gradient" style={{ position: "relative", textAlign: "center" }}>
                  Passer en illimité
                </Link>
                <p style={{ position: "relative", margin: "10px 0 0", textAlign: "center", fontSize: 12, color: "var(--color-neutral-400)" }}>
                  Sans engagement, résiliable en un clic.
                </p>
              </div>
            </Reveal>

            {weeklyAvailable && (
              <Reveal delay={0.15}>
                <div
                  className="flex h-full flex-col"
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    padding: 28,
                    border: "1px solid var(--color-divider)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: mutedText }}>
                    Formule hebdomadaire
                  </p>
                  <p style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    3,50 €<span style={{ fontSize: 13, fontWeight: 600, color: mutedText }}> /semaine</span>
                  </p>
                  <p style={{ margin: "10px 0 24px", fontSize: 13.5, color: mutedText, flex: 1 }}>
                    Idéal pour tester Premium sur une candidature urgente.
                  </p>
                  <Link href="/inscription" className="btn btn-secondary" style={{ textAlign: "center" }}>
                    Choisir l&apos;hebdomadaire
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-10" style={{ scrollMarginTop: 80 }}>
          <Reveal>
            <p style={eyebrow}>Questions fréquentes</p>
            <h2 style={{ ...h2Style, maxWidth: "12ch" }}>Tout ce que tu te demandes.</h2>
          </Reveal>
          <div className="mt-8 flex flex-col gap-2.5" style={{ maxWidth: "68ch" }}>
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

        {/* CTA FINAL */}
        <section className="py-10 pb-20">
          <Reveal>
            <div
              style={{
                position: "relative",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(125deg, var(--color-accent), var(--color-accent-2))",
                color: "var(--color-bg)",
                padding: "clamp(36px,7vw,72px) clamp(24px,5vw,56px)",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", maxWidth: 560 }}>
                <h2 style={{ margin: 0, fontSize: "clamp(30px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                  Ton prochain match pro t&apos;attend.
                </h2>
                <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "color-mix(in srgb, var(--color-bg) 92%, transparent)", maxWidth: "44ch" }}>
                  Un pote te parraine ? Vous gagnez tous les deux. Chaque compte a son lien de
                  parrainage, dans le profil une fois inscrit.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/inscription"
                    className="btn"
                    style={{ background: "var(--color-bg)", color: "var(--color-accent-800)", whiteSpace: "nowrap", fontWeight: 800 }}
                  >
                    Créer mon compte gratuitement
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer
          className="py-6 flex flex-wrap items-center gap-x-5 gap-y-2"
          style={{ borderTop: "1px solid var(--color-divider)" }}
        >
          <span className="flex items-center gap-2" style={{ marginRight: "auto", fontSize: 14, fontWeight: 800 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
            Stageio
          </span>
          {[
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
