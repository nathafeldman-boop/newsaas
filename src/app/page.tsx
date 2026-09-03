import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SwipeDemo } from "@/components/landing/SwipeDemo";
import { Reveal } from "@/components/ui/Reveal";
import { Highlight } from "@/components/ui/Highlight";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    title: "Crée ton profil",
    text: "Compétences, ville, parcours, et ton CV si tu veux — facultatif.",
  },
  {
    title: "Swipe les offres",
    text: "Logo, salaire, avis d'anciens alternants : tout pour décider d'un regard.",
  },
  {
    title: "Postule en un geste",
    text: "Directement depuis la carte que tu aimes, sans ressaisir tes infos.",
  },
];

const STATS = [
  { value: "1 400", label: "Offres actives", color: "var(--color-accent)" },
  { value: "48h", label: "Délai moyen" },
  { value: "62%", label: "Alternances", color: "var(--color-accent-2)" },
  { value: "4.6★", label: "Note moyenne" },
];

const TESTIMONIALS = [
  {
    quote:
      "Trois jours après mon inscription, j'avais déjà un entretien.",
    author: "Léa",
    role: "alternante en marketing digital",
  },
  {
    quote:
      "J'ai enfin arrêté de recopier la même lettre de motivation sur quinze sites différents.",
    author: "Thomas",
    role: "stagiaire développement web",
  },
  {
    quote:
      "Les offres qui remontent correspondent vraiment à ce que j'ai mis dans mon profil, ça change tout.",
    author: "Inès",
    role: "alternante ressources humaines",
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

export default function LandingPage() {

  return (
    <div className="flex-1">
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <nav className="nav mx-auto max-w-[1200px]">
        <span className="nav-brand">Stageio</span>
        <Link href="/login" style={{ whiteSpace: "nowrap" }}>
          Se connecter
        </Link>
        <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
          Créer mon compte
        </Link>
      </nav>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-9">
        <section className="grid gap-10 py-16 md:grid-cols-[6fr_5fr] md:items-center md:py-[90px]">
          <div>
            <span className="tag tag-accent" style={{ marginBottom: 16 }}>
              Alternance &amp; stage
            </span>
            <h1
              style={{
                fontSize: "clamp(42px,6vw,72px)",
                lineHeight: 1.05,
                margin: "16px 0 0",
                maxWidth: "14ch",
              }}
            >
              Trouve ta prochaine expérience, <Highlight>en swipant</Highlight>.
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: "28px",
                maxWidth: "52ch",
                color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
                margin: "22px 0 0",
              }}
            >
              Fini les quarante candidatures identiques sur dix sites
              différents. On te propose les offres qui matchent ton profil ;
              tu likes, tu postules, c&apos;est tout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                Créer mon compte gratuitement
              </Link>
              <Link href="/login" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
          <figure
            className="washed m-0 overflow-hidden"
            style={{
              borderRadius: "var(--radius-lg)",
              position: "relative",
              width: "100%",
              aspectRatio: "4/3",
              background: "var(--color-accent-200)",
            }}
          >
            <Image
              src="/team-photo.jpg"
              alt="L'équipe Stageio"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
              priority
            />
          </figure>
        </section>

        <section className="py-8 text-center">
          <span className="tag tag-accent-2" style={{ marginBottom: 16 }}>
            Essaie, là, tout de suite
          </span>
          <h2 style={{ fontSize: 26, margin: "14px auto 0", maxWidth: "22ch" }}>
            Glisse la carte pour voir comment ça marche
          </h2>
          <p
            style={{
              fontSize: 14.5,
              margin: "10px auto 0",
              maxWidth: "40ch",
              color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
            }}
          >
            À droite pour aimer, à gauche pour passer. Sur l&apos;appli, chaque
            carte que tu vois est déjà triée pour ton profil.
          </p>
          <div className="mt-7 flex justify-center">
            <SwipeDemo />
          </div>
        </section>

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
                        color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
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

        <section className="py-8">
          <span className="tag tag-accent-2" style={{ marginBottom: 16 }}>
            Le parcours
          </span>
          <div className="mt-4 grid gap-7 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="card">
                  <h3 className="card-title">{step.title}</h3>
                  <p className="card-body">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="py-8">
          <span className="tag tag-accent-2" style={{ marginBottom: 16 }}>
            Ils ont trouvé
          </span>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.08}>
                <figure
                  className="card elev-md m-0"
                  style={{ background: "var(--color-accent-2-100)", padding: "var(--space-6)" }}
                >
                  <blockquote
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(17px,1.6vw,20px)",
                      lineHeight: 1.4,
                      margin: 0,
                      color: "var(--color-accent-2-800)",
                    }}
                  >
                    « {t.quote} »
                  </blockquote>
                  <figcaption style={{ fontSize: 13, color: "var(--color-accent-2-700)", marginTop: 14 }}>
                    — {t.author}, {t.role}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="py-8">
          <span className="tag tag-accent" style={{ marginBottom: 16 }}>
            Questions fréquentes
          </span>
          <div className="mt-4 flex flex-col gap-3" style={{ maxWidth: "68ch" }}>
            {FAQ.map((item, i) => (
              <Reveal key={item.question} delay={i * 0.05}>
                <details className="card" style={{ padding: "var(--space-5)" }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontFamily: "var(--font-heading)",
                      fontSize: 15,
                    }}
                  >
                    {item.question}
                  </summary>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: "10px 0 0",
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

        <section className="py-10 pb-20">
          <Reveal>
            <h2 style={{ fontSize: 28, margin: 0, maxWidth: "24ch" }}>
              Un pote te parraine ? Vous gagnez <Highlight color="var(--color-accent-100)">tous les deux</Highlight>.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
                margin: "12px 0 0",
                maxWidth: "50ch",
              }}
            >
              Chaque compte a son lien de parrainage, disponible dans le profil
              une fois inscrit.
            </p>
            <div className="mt-5 flex max-w-[420px] items-stretch gap-3">
              <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                Créer mon compte
              </Link>
            </div>
          </Reveal>
        </section>

        <footer
          className="py-6 flex flex-wrap gap-x-5 gap-y-2"
          style={{ borderTop: "1px solid var(--color-divider)" }}
        >
          {[
            { href: "/legal/mentions-legales", label: "Mentions légales" },
            { href: "/legal/cgu", label: "CGU" },
            { href: "/legal/cgv", label: "CGV" },
            { href: "/legal/confidentialite", label: "Confidentialité" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}
            >
              {item.label}
            </Link>
          ))}
        </footer>
      </div>
    </div>
  );
}
