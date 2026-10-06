import Link from "next/link";
import type { Metadata } from "next";
import { getProgrammaticIndex, cityPhrase, type ProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { getMetier } from "@/lib/seo/metiers";
import { SMIC_EFFECTIVE_DATE, SMIC_MONTHLY_GROSS, STAGE_HOURLY_MIN, formatEuros, internshipGratification, round2 } from "@/lib/salary/legalRates";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/site";
import type { ContractType } from "@/types/database";

// Baromètre "salaires et offres" (Phase 4) : page de données propres à
// Stageio, recalculée chaque heure à partir du catalogue actif -- le genre
// de page que des médias étudiants, écoles et blogs citent et lient (c'est
// le premier levier de backlinks). URL sans année pour garder les liens
// d'une édition à l'autre ; l'année est dans le titre.
export const dynamic = "force-dynamic";

const PATH = "/barometre-alternance-stage";
const YEAR = 2026;

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

async function loadData() {
  const [alternance, stage, companies] = await Promise.all([
    getProgrammaticIndex("alternance"),
    getProgrammaticIndex("stage"),
    getCompanyIndex(),
  ]);
  return { alternance, stage, companies };
}

export async function generateMetadata(): Promise<Metadata> {
  const { alternance, stage } = await loadData();
  const total = alternance.total + stage.total;
  return {
    title: `Baromètre ${YEAR} de l'alternance et des stages : métiers, villes, salaires`,
    description: `${total.toLocaleString("fr-FR")} offres analysées : les métiers et les villes qui recrutent le plus en alternance et en stage, les salaires indiqués et les entreprises les plus actives. Mis à jour chaque jour.`,
    alternates: { canonical: `${SITE_URL}${PATH}` },
    openGraph: { title: `Baromètre ${YEAR} de l'alternance et des stages`, url: `${SITE_URL}${PATH}`, type: "article" },
  };
}

function topMetiers(index: ProgrammaticIndex, n = 10) {
  return Object.values(index.metiers)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((m) => ({ slug: m.slug, label: capitalize(getMetier(m.slug)?.label ?? m.slug), count: m.count, salary: m.salaryMedian, salaryN: m.salaryN }));
}

function topCities(index: ProgrammaticIndex, n = 10) {
  return Object.values(index.cities)
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--color-divider)", textAlign: "left" };
const h2: React.CSSProperties = { fontSize: 21, margin: "40px 0 12px" };

function RankingTable({
  type,
  rows,
  total,
  kind,
}: {
  type: ContractType;
  rows: { href: string; label: string; count: number }[];
  total: number;
  kind: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={cell}>#</th>
            <th style={cell}>{kind}</th>
            <th style={cell}>{type === "alternance" ? "Offres d'alternance" : "Offres de stage"}</th>
            <th style={cell}>Part</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.href}>
              <td style={cell}>{i + 1}</td>
              <td style={cell}>
                <Link href={row.href}>{row.label}</Link>
              </td>
              <td style={cell}>{row.count.toLocaleString("fr-FR")}</td>
              <td style={cell}>{pct(row.count, total)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BarometrePage() {
  const { alternance, stage, companies } = await loadData();
  const total = alternance.total + stage.total;
  const recent = alternance.recent7d + stage.recent7d;
  const date = new Date(alternance.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const altMetiers = topMetiers(alternance);
  const stageMetiers = topMetiers(stage);
  const altCities = topCities(alternance);
  const stageCities = topCities(stage);
  const companyList = Object.values(companies.companies).sort((a, b) => b.count - a.count);
  const topCompanies = companyList.slice(0, 10);
  const salaryRows = Object.values(alternance.metiers)
    .filter((m) => m.salaryMedian !== null)
    .sort((a, b) => (b.salaryMedian ?? 0) - (a.salaryMedian ?? 0))
    .slice(0, 10);

  const lead1 = altMetiers[0];
  const leadCity = altCities[0];
  const faq = [
    {
      q: `Combien d'offres d'alternance et de stage y a-t-il en ce moment ?`,
      a: `Au ${date}, Stageio recense ${total.toLocaleString("fr-FR")} offres actives : ${alternance.total.toLocaleString("fr-FR")} en alternance et ${stage.total.toLocaleString("fr-FR")} en stage, dont ${recent.toLocaleString("fr-FR")} publiées ces 7 derniers jours.`,
    },
    ...(lead1
      ? [{ q: `Quel métier recrute le plus en alternance en ${YEAR} ?`, a: `Le métier « ${lead1.label} » arrive en tête avec ${lead1.count.toLocaleString("fr-FR")} offres d'alternance actives (${pct(lead1.count, alternance.total)} % du total), devant ${altMetiers.slice(1, 3).map((m) => `${m.label} (${m.count})`).join(" et ")}.` }]
      : []),
    ...(leadCity
      ? [{ q: `Quelle ville propose le plus d'alternances ?`, a: `${leadCity.label}, avec ${leadCity.count.toLocaleString("fr-FR")} offres actives, devant ${altCities.slice(1, 3).map((c) => `${c.label} (${c.count})`).join(" et ")}.` }]
      : []),
    {
      q: `Combien gagne un alternant en ${YEAR} ?`,
      a: `Le minimum légal va de ${formatEuros(round2(SMIC_MONTHLY_GROSS * 0.27), 0)} à ${formatEuros(SMIC_MONTHLY_GROSS, 0)} brut par mois selon l'âge et l'année de contrat (SMIC du ${SMIC_EFFECTIVE_DATE}). Un apprenti de 18 à 20 ans en 1re année touche au moins ${formatEuros(round2(SMIC_MONTHLY_GROSS * 0.43), 0)}.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Baromètre ${YEAR} de l'alternance et des stages`,
      dateModified: alternance.generatedAt,
      author: { "@type": "Organization", name: "Stageio", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Stageio", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
      mainEntityOfPage: `${SITE_URL}${PATH}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `Baromètre ${YEAR}`, item: `${SITE_URL}${PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-9">
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(block) }} />
      ))}
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link>
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>Baromètre {YEAR} de l&apos;alternance et des stages</h1>
      <p style={{ fontSize: 15, margin: "12px 0 0" }}>
        <strong>
          {total.toLocaleString("fr-FR")} offres actives analysées au {date}
        </strong>{" "}
        : {alternance.total.toLocaleString("fr-FR")} en alternance ({pct(alternance.total, total)} %) et{" "}
        {stage.total.toLocaleString("fr-FR")} en stage ({pct(stage.total, total)} %), dont{" "}
        {recent.toLocaleString("fr-FR")} publiées ces 7 derniers jours. Voici les métiers, les villes, les salaires et
        les entreprises qui recrutent vraiment en ce moment.
      </p>
      <p style={{ fontSize: 12.5, margin: "8px 0 0" }}>
        Données recalculées chaque heure à partir du catalogue Stageio. Méthodologie en bas de page.
      </p>

      <h2 style={h2}>Les métiers qui recrutent le plus en alternance</h2>
      <RankingTable
        type="alternance"
        kind="Métier"
        total={alternance.total}
        rows={altMetiers.map((m) => ({ href: `/alternance/${m.slug}`, label: m.label, count: m.count }))}
      />

      <h2 style={h2}>Les métiers qui recrutent le plus en stage</h2>
      <RankingTable
        type="stage"
        kind="Métier"
        total={stage.total}
        rows={stageMetiers.map((m) => ({ href: `/stage/${m.slug}`, label: m.label, count: m.count }))}
      />

      <h2 style={h2}>Les villes où il y a le plus d&apos;alternances</h2>
      <RankingTable
        type="alternance"
        kind="Ville"
        total={alternance.total}
        rows={altCities.map((c) => ({ href: `/alternance/${c.slug}`, label: c.label, count: c.count }))}
      />

      <h2 style={h2}>Les villes où il y a le plus de stages</h2>
      <RankingTable
        type="stage"
        kind="Ville"
        total={stage.total}
        rows={stageCities.map((c) => ({ href: `/stage/${c.slug}`, label: c.label, count: c.count }))}
      />

      <h2 style={h2}>Salaires en alternance : ce qu&apos;indiquent les employeurs</h2>
      {salaryRows.length > 0 ? (
        <>
          <p style={{ fontSize: 14, margin: "0 0 12px" }}>
            Salaire brut mensuel médian indiqué dans les offres France Travail (au moins 5 offres renseignées par
            métier) :
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={cell}>Métier</th>
                  <th style={cell}>Salaire médian</th>
                  <th style={cell}>Offres renseignées</th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.map((m) => (
                  <tr key={m.slug}>
                    <td style={cell}>
                      <Link href={`/alternance/${m.slug}`}>{capitalize(getMetier(m.slug)?.label ?? m.slug)}</Link>
                    </td>
                    <td style={cell}>{formatEuros(m.salaryMedian ?? 0, 0)}</td>
                    <td style={cell}>{m.salaryN}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, margin: 0 }}>Pas encore assez d&apos;offres avec salaire renseigné pour une médiane fiable.</p>
      )}
      <p style={{ fontSize: 14, margin: "12px 0 0" }}>
        Pour rappel, le minimum légal d&apos;un apprenti va de {formatEuros(round2(SMIC_MONTHLY_GROSS * 0.27), 0)} à{" "}
        {formatEuros(SMIC_MONTHLY_GROSS, 0)} brut par mois selon l&apos;âge et l&apos;année, et la gratification
        minimale d&apos;un stagiaire est de {STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/h
        (environ {formatEuros(internshipGratification(35).gross, 0)} par mois à temps plein).{" "}
        <Link href="/outils/simulateur-salaire-alternance">Calcule ton salaire exact</Link>.
      </p>

      {topCompanies.length > 0 && (
        <>
          <h2 style={h2}>Les entreprises qui publient le plus d&apos;offres</h2>
          <ol style={{ fontSize: 14, margin: 0, paddingLeft: 22 }}>
            {topCompanies.map((c) => (
              <li key={c.slug} style={{ marginBottom: 4 }}>
                <Link href={`/entreprises/${c.slug}`}>{c.label}</Link> : {c.count} offres ({c.byType.alternance} en
                alternance, {c.byType.stage} en stage)
                {c.cities[0] ? `, surtout ${cityPhrase(c.cities[0].label)}` : ""}
              </li>
            ))}
          </ol>
          <p style={{ fontSize: 13, margin: "8px 0 0" }}>
            Hors écoles et organismes de formation, qui publient des annonces pour remplir leurs propres cursus.{" "}
            <Link href="/entreprises">Toutes les entreprises</Link>.
          </p>
        </>
      )}

      <h2 style={h2}>Questions fréquentes</h2>
      {faq.map((item) => (
        <div key={item.q} style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15.5, margin: "0 0 4px" }}>{item.q}</h3>
          <p style={{ fontSize: 14, margin: 0 }}>{item.a}</p>
        </div>
      ))}

      <h2 style={{ ...h2, fontSize: 17 }}>Méthodologie</h2>
      <p style={{ fontSize: 13.5, margin: 0 }}>
        Toutes les offres d&apos;alternance (apprentissage et contrat de professionnalisation) et de stage actives sur
        Stageio, collectées chaque jour auprès de France Travail et d&apos;Adzuna ; une offre retirée par sa source
        sort du baromètre. Métier déduit de l&apos;intitulé du poste (36 familles), ville normalisée à partir du lieu
        indiqué (les offres localisées seulement au niveau d&apos;un département ou d&apos;une région ne comptent pas
        dans le classement des villes). Salaires : uniquement ceux indiqués par l&apos;employeur dans les offres France
        Travail, convertis en brut mensuel. Libre de reprise en citant « Baromètre Stageio » avec un lien vers cette
        page.
      </p>

      <div className="card elev-sm mt-8" style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <p style={{ fontSize: 15, margin: "0 0 12px" }}>
          Ces offres, tu peux les swiper : Stageio les trie selon ton profil et ta ville.
        </p>
        <Link href="/inscription" className="btn btn-primary">
          Créer mon compte gratuitement
        </Link>
      </div>
    </div>
  );
}
