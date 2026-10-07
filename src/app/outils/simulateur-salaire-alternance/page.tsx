import Link from "next/link";
import type { Metadata } from "next";
import { SalarySimulator } from "@/components/tools/SalarySimulator";
import {
  AGE_LABEL,
  APPRENTICE_RATES,
  LEGAL_RATES_UPDATED_AT,
  PRO_RATES,
  SMIC_EFFECTIVE_DATE,
  SMIC_MONTHLY_GROSS,
  STAGE_HOURLY_MIN,
  STAGE_MANDATORY_AFTER,
  formatEuros,
  formatPercent,
  internshipGratification,
  round2,
  type AgeBracket,
} from "@/lib/salary/legalRates";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";

const PATH = "/outils/simulateur-salaire-alternance";

export const metadata: Metadata = {
  title: "Simulateur de salaire en alternance 2026 (apprenti, contrat pro, stage)",
  description: `Calcule ton salaire minimum en alternance en 2026 : brut et net estimé selon ton âge et ton année de contrat (SMIC ${formatEuros(SMIC_MONTHLY_GROSS)}). Apprentissage, contrat pro et gratification de stage.`,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: "Simulateur de salaire en alternance 2026",
    description: "Combien tu seras payé en apprentissage, en contrat pro ou en stage ? Le calcul en 10 secondes.",
    url: `${SITE_URL}${PATH}`,
    type: "website",
  },
};

const amount = (rate: number) => formatEuros(round2(SMIC_MONTHLY_GROSS * rate));
const AGES = Object.keys(APPRENTICE_RATES) as AgeBracket[];
const fullTimeInternship = internshipGratification(35);

const FAQ = [
  {
    q: "Quel est le salaire d'un apprenti en 2026 ?",
    a: `Entre ${amount(0.27)} et ${amount(1)} brut par mois selon l'âge et l'année de contrat, soit 27 % à 100 % du SMIC (${formatEuros(SMIC_MONTHLY_GROSS)} depuis le ${SMIC_EFFECTIVE_DATE}). Le cas le plus courant, un apprenti de 18 à 20 ans en 1re année, touche au minimum ${amount(0.43)} brut.`,
  },
  {
    q: "Le salaire d'un apprenti est-il brut ou net ?",
    a: "Les pourcentages légaux s'appliquent au brut. Pour un contrat signé depuis le 1er mars 2025, la partie du salaire sous 50 % du SMIC n'a aucune cotisation ; au-dessus, environ 21 % de cotisations et de CSG/CRDS s'appliquent sur la seule part qui dépasse. Le net reste donc très proche du brut.",
  },
  {
    q: "Quand mon salaire d'apprenti augmente-t-il ?",
    a: "À chaque nouvelle année de contrat, et quand tu changes de tranche d'âge : la hausse s'applique à partir du 1er jour du mois qui suit ton anniversaire. Il augmente aussi automatiquement à chaque revalorisation du SMIC.",
  },
  {
    q: "L'entreprise peut-elle payer moins que ce barème ?",
    a: "Non, ce sont des minimums légaux. Ta convention collective ou ton entreprise peuvent prévoir plus, jamais moins. À partir de 21 ans, le pourcentage s'applique même au salaire minimum conventionnel de ton poste s'il est plus élevé que le SMIC.",
  },
  {
    q: "Quelle est la différence de salaire entre apprentissage et contrat pro ?",
    a: `Le contrat pro démarre plus haut (${formatPercent(PRO_RATES.under21.belowBacPro)} à ${formatPercent(PRO_RATES["21to25"].bacProOrMore)} du SMIC avant 26 ans) mais n'augmente pas avec les années et supporte des cotisations normales. L'apprentissage démarre plus bas mais progresse chaque année et est presque net de cotisations.`,
  },
  {
    q: "Combien est payé un stagiaire en 2026 ?",
    a: `Au minimum ${STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € par heure de présence, soit environ ${formatEuros(fullTimeInternship.gross)} par mois à 35 h/semaine, sans cotisations. Cette gratification n'est obligatoire que si le stage dure plus de ${STAGE_MANDATORY_AFTER}.`,
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Outils", item: `${SITE_URL}/outils` },
    { "@type": "ListItem", position: 3, name: "Simulateur de salaire alternance", item: `${SITE_URL}${PATH}` },
  ],
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Simulateur de salaire en alternance",
  url: `${SITE_URL}${PATH}`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "fr-FR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

const sectionTitle: React.CSSProperties = { fontSize: 20, margin: "40px 0 12px" };
const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--color-divider)", textAlign: "left" };

export default function SalarySimulatorPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(appJsonLd) }} />

      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link> › <Link href="/outils">Outils</Link> › Simulateur de salaire
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>Simulateur de salaire en alternance 2026</h1>
      <p style={{ fontSize: 15, margin: "12px 0 0" }}>
        <strong>
          En 2026, un apprenti touche entre {amount(0.27)} et {amount(1)} brut par mois
        </strong>
        , soit 27 % à 100 % du SMIC selon son âge et son année de contrat. Exemple : un apprenti de 18 à
        20 ans en 1re année gagne au minimum <strong>{amount(0.43)} brut</strong> (43 % du SMIC), quasiment
        sans cotisations. Choisis ton cas ci-dessous pour avoir ton montant exact, brut et net.
      </p>
      <p style={{ fontSize: 12, margin: "8px 0 24px" }}>
        Barèmes légaux à jour du SMIC du {SMIC_EFFECTIVE_DATE} ({formatEuros(SMIC_MONTHLY_GROSS)} brut/mois) —
        vérifiés le {new Date(LEGAL_RATES_UPDATED_AT).toLocaleDateString("fr-FR")}.
      </p>

      <SalarySimulator />

      <h2 style={sectionTitle}>Grille de salaire des apprentis en 2026</h2>
      <p style={{ fontSize: 14, margin: "0 0 12px" }}>
        Salaire minimum brut mensuel, en % du SMIC, selon ton âge et l&apos;année d&apos;exécution du contrat
        d&apos;apprentissage :
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={cell}>Âge</th>
              <th style={cell}>1re année</th>
              <th style={cell}>2e année</th>
              <th style={cell}>3e année</th>
            </tr>
          </thead>
          <tbody>
            {AGES.map((age) => (
              <tr key={age}>
                <td style={cell}>{AGE_LABEL[age]}</td>
                {([1, 2, 3] as const).map((year) => {
                  const rate = APPRENTICE_RATES[age][year];
                  return (
                    <td key={year} style={cell}>
                      {formatPercent(rate)} — {amount(rate)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, margin: "10px 0 0" }}>
        À partir de 21 ans, le pourcentage s&apos;applique au salaire minimum conventionnel de ton poste s&apos;il
        est plus élevé que le SMIC. Le changement de tranche d&apos;âge prend effet le 1er jour du mois qui suit
        ton anniversaire.
      </p>

      <h2 style={sectionTitle}>Salaire en contrat de professionnalisation</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={cell}>Âge</th>
              <th style={cell}>Sans bac pro</th>
              <th style={cell}>Avec bac pro ou plus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>Moins de 21 ans</td>
              <td style={cell}>
                {formatPercent(PRO_RATES.under21.belowBacPro)} — {amount(PRO_RATES.under21.belowBacPro)}
              </td>
              <td style={cell}>
                {formatPercent(PRO_RATES.under21.bacProOrMore)} — {amount(PRO_RATES.under21.bacProOrMore)}
              </td>
            </tr>
            <tr>
              <td style={cell}>21 à 25 ans</td>
              <td style={cell}>
                {formatPercent(PRO_RATES["21to25"].belowBacPro)} — {amount(PRO_RATES["21to25"].belowBacPro)}
              </td>
              <td style={cell}>
                {formatPercent(PRO_RATES["21to25"].bacProOrMore)} — {amount(PRO_RATES["21to25"].bacProOrMore)}
              </td>
            </tr>
            <tr>
              <td style={cell}>26 ans et plus</td>
              <td style={cell} colSpan={2}>
                Au moins le SMIC ({formatEuros(SMIC_MONTHLY_GROSS)}) et 85 % du minimum conventionnel
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={sectionTitle}>Gratification de stage en 2026</h2>
      <p style={{ fontSize: 14, margin: 0 }}>
        Un stagiaire n&apos;est pas salarié : il touche une gratification, obligatoire seulement si le stage dure
        plus de {STAGE_MANDATORY_AFTER} sur la même année scolaire. Le minimum légal est de{" "}
        <strong>{STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € par heure</strong> de
        présence, soit environ <strong>{formatEuros(fullTimeInternship.gross)} par mois</strong> pour 35 h par
        semaine. À ce montant, aucune cotisation : le net est égal au brut.
      </p>

      <h2 style={sectionTitle}>Brut ou net : ce que tu touches vraiment</h2>
      <ul style={{ fontSize: 14, margin: 0, paddingLeft: 20 }}>
        <li>
          <strong>Apprenti, contrat signé depuis le 1er mars 2025</strong> : 0 cotisation jusqu&apos;à{" "}
          {amount(0.5)} (50 % du SMIC), puis environ 21 % sur la seule partie qui dépasse.
        </li>
        <li>
          <strong>Apprenti, contrat signé avant</strong> : pas de CSG/CRDS, et cotisations seulement au-dessus de{" "}
          {amount(0.79)} (79 % du SMIC).
        </li>
        <li>
          <strong>Contrat pro</strong> : cotisations salariales normales, environ 21 % du brut.
        </li>
        <li>
          <strong>Stage</strong> : rien à déduire au minimum légal.
        </li>
      </ul>
      <p style={{ fontSize: 13, margin: "10px 0 0" }}>
        Les montants nets du simulateur sont des estimations : la mutuelle et la prévoyance de ton entreprise
        peuvent les faire varier de quelques euros.
      </p>

      <h2 style={sectionTitle}>Questions fréquentes</h2>
      {FAQ.map((item) => (
        <div key={item.q} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>{item.q}</h3>
          <p style={{ fontSize: 14, margin: 0 }}>{item.a}</p>
        </div>
      ))}

      <div className="card elev-sm mt-8" style={{ padding: "var(--space-6)" }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Maintenant, trouve l&apos;entreprise qui te paiera</h2>
        <p style={{ fontSize: 14, margin: "8px 0 16px" }}>
          Des milliers d&apos;offres d&apos;alternance et de stage mises à jour chaque jour, triées selon ton
          profil. Tu swipes, tu candidates.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/inscription" className="btn btn-primary">
            Créer mon compte gratuitement
          </Link>
          <Link href="/offres/alternance" className="btn btn-secondary">
            Offres d&apos;alternance
          </Link>
          <Link href="/guides/alternance-vs-stage" className="btn btn-secondary">
            Alternance ou stage ?
          </Link>
        </div>
      </div>

      <h2 style={{ ...sectionTitle, fontSize: 15 }}>Sources</h2>
      <ul style={{ fontSize: 13, margin: 0, paddingLeft: 20 }}>
        <li>
          <a href="https://www.info.gouv.fr/public/index.php/actualite/le-smic-revalorise-le-1er-juin-2026" rel="noopener">
            Revalorisation du SMIC au 1er juin 2026 (info.gouv.fr)
          </a>
        </li>
        <li>
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F2918" rel="noopener">
            Contrat d&apos;apprentissage (service-public.gouv.fr)
          </a>
        </li>
        <li>
          <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F15478" rel="noopener">
            Contrat de professionnalisation (service-public.gouv.fr)
          </a>
        </li>
        <li>
          <a href="https://entreprendre.service-public.gouv.fr/vosdroits/F32131" rel="noopener">
            Gratification minimale de stage (service-public.gouv.fr)
          </a>
        </li>
      </ul>
    </div>
  );
}
