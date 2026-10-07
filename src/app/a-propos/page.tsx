import Link from "next/link";
import type { Metadata } from "next";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { GUIDES } from "@/lib/guides/guidesData";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { CONTACT_EMAIL, SITE_URL, SOCIAL_PROFILES } from "@/lib/site";

// "Stageio, c'est quoi ?" : la page qui décrit la marque, ses chiffres et
// ses sources. C'est elle que Google et les assistants IA (ChatGPT, Gemini,
// Perplexity) lisent pour répondre à "c'est quoi Stageio" ou pour citer
// Stageio dans "quel site pour trouver une alternance". Chiffres recalculés
// à partir du catalogue actif, jamais écrits en dur.
export const dynamic = "force-dynamic";

const PATH = "/a-propos";
const DESCRIPTION =
  "Stageio est une plateforme française qui aide les étudiants à trouver une alternance ou un stage : les offres se consultent comme des cartes à swiper, triées selon ton profil.";

async function loadStats() {
  const [alternance, stage, companies] = await Promise.all([
    getProgrammaticIndex("alternance"),
    getProgrammaticIndex("stage"),
    getCompanyIndex(),
  ]);
  const cities = new Set([...Object.keys(alternance.cities), ...Object.keys(stage.cities)]);
  return {
    alternance: alternance.total,
    stage: stage.total,
    recent7d: alternance.recent7d + stage.recent7d,
    companies: Object.keys(companies.companies).length,
    cities: cities.size,
  };
}

export const metadata: Metadata = {
  title: "Stageio, c'est quoi ? L'appli pour trouver une alternance ou un stage",
  description: `${DESCRIPTION} Gratuit pour parcourir toutes les offres, mises à jour chaque jour.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: { title: "Stageio, c'est quoi ?", description: DESCRIPTION, url: `${SITE_URL}${PATH}`, type: "website" },
};

const n = (value: number) => value.toLocaleString("fr-FR");

export default async function AboutPage() {
  const stats = await loadStats();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}${PATH}`,
    name: "Stageio, c'est quoi ?",
    mainEntity: {
      "@type": "Organization",
      name: "Stageio",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: DESCRIPTION,
      email: CONTACT_EMAIL,
      areaServed: "FR",
      ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES.map((p) => p.url) } : {}),
    },
  };

  const section = { fontSize: 20, margin: "32px 0 10px" } as const;
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link> › Stageio, c&apos;est quoi ?
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>Stageio, c&apos;est quoi ?</h1>
      <p style={{ fontSize: 16, margin: "12px 0 0" }}>
        {DESCRIPTION} À droite pour garder une offre, à gauche pour passer : tu vois d&apos;abord celles qui collent à ton
        secteur, ton métier, ta ville et ton niveau d&apos;études.
      </p>

      <h2 style={section}>Stageio en chiffres, aujourd&apos;hui</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
        <li>
          <strong>{n(stats.alternance)}</strong> offres d&apos;alternance et <strong>{n(stats.stage)}</strong> offres de
          stage en ligne, dont {n(stats.recent7d)} publiées ces 7 derniers jours.
        </li>
        <li>
          <strong>{n(stats.cities)}</strong> villes avec au moins 3 offres, partout en France.
        </li>
        <li>
          <strong>{n(stats.companies)}</strong> entreprises qui recrutent avec une page dédiée.
        </li>
        <li>
          <strong>{GUIDES.length}</strong> guides gratuits : CV, lettre, entretien, salaire, droits des alternants et des
          stagiaires.
        </li>
      </ul>
      <p style={{ fontSize: 13, margin: "8px 0 0" }}>Chiffres recalculés chaque heure à partir des offres actives.</p>

      <h2 style={section}>D&apos;où viennent les offres ?</h2>
      <p style={{ fontSize: 15, margin: 0 }}>
        Des offres publiques de France Travail (API officielle), d&apos;Adzuna et des sites carrières des entreprises.
        Elles sont mises à jour chaque jour, et retirées quand elles ne sont plus en ligne. Quand tu postules, tu es
        redirigé vers l&apos;annonce d&apos;origine.
      </p>

      <h2 style={section}>Comment ça marche</h2>
      <ol style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
        <li>Tu crées ton profil gratuitement : alternance, stage ou les deux, secteurs, métiers, ville, niveau d&apos;études.</li>
        <li>Tu swipes les offres, classées par compatibilité avec ton profil.</li>
        <li>Tu postules aux offres qui te plaisent, avec ton CV et une lettre adaptée.</li>
      </ol>

      <h2 style={section}>Gratuit ou payant ?</h2>
      <p style={{ fontSize: 15, margin: 0 }}>
        L&apos;inscription et la consultation de toutes les offres sont gratuites. Liker une offre, candidater et générer
        une lettre de motivation par IA sont réservés aux membres Premium (7,99 € par mois sans engagement, ou 39,99 € en
        paiement unique pour un accès à vie).
      </p>

      <h2 style={section}>Ce que Stageio publie en accès libre</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
        <li><Link href="/alternance">Les offres d&apos;alternance par métier, ville, département et région</Link></li>
        <li><Link href="/stage">Les offres de stage par métier et par ville</Link></li>
        <li><Link href="/barometre-alternance-stage">Le baromètre de l&apos;alternance et des stages</Link> (métiers et villes qui recrutent, salaires)</li>
        <li><Link href="/outils/simulateur-salaire-alternance">Le simulateur de salaire en alternance</Link></li>
        <li><Link href="/guides">Les guides pour trouver et réussir son alternance ou son stage</Link></li>
        <li><Link href="/entreprises">Les entreprises qui recrutent</Link></li>
      </ul>

      <h2 style={section}>Contact</h2>
      <p style={{ fontSize: 15, margin: 0 }}>
        Une question, un partenariat, un article ? Écris à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      {SOCIAL_PROFILES.length > 0 && (
        <p style={{ fontSize: 15, margin: "8px 0 0" }}>
          Suis Stageio :{" "}
          {SOCIAL_PROFILES.map((profile, i) => (
            <span key={profile.url}>
              {i > 0 ? " · " : ""}
              <a href={profile.url} rel="me noopener" target="_blank">{profile.name}</a>
            </span>
          ))}
        </p>
      )}

      <div className="mt-8">
        <Link href="/inscription" className="btn btn-primary">Créer mon profil gratuitement</Link>
      </div>
    </div>
  );
}
