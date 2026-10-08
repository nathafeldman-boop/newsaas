import Link from "next/link";
import { PRO_RATES, SMIC_MONTHLY_GROSS, STAGE_HOURLY_MIN, STAGE_MANDATORY_AFTER, formatEuros, formatPercent, internshipGratification, round2 } from "@/lib/salary/legalRates";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import type { ContractType } from "@/types/database";

// Texte de fond des hubs /alternance et /stage (requêtes « alternance » :
// 33 100 recherches/mois, « stage » : 18 100) : jusqu'ici une phrase et des
// listes de liens. Faits stables uniquement, montants tirés de legalRates
// pour ne jamais être périmés, et liens vers les guides qui détaillent.

const amount = (rate: number) => formatEuros(round2(SMIC_MONTHLY_GROSS * rate), 0);
const stageMonthly = formatEuros(internshipGratification(35).gross, 0);
const stageHourly = STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--color-divider)", textAlign: "left", verticalAlign: "top" };
const h2: React.CSSProperties = { fontSize: 20, margin: "40px 0 10px" };
const p: React.CSSProperties = { fontSize: 15, lineHeight: 1.65, margin: "0 0 12px" };

type Faq = { q: string; a: string };

const ALTERNANCE_FAQ: Faq[] = [
  {
    q: "C'est quoi, l'alternance ?",
    a: "C'est préparer un diplôme ou un titre professionnel en partageant ton temps entre une école (un CFA) et une entreprise qui te salarie. Tu signes un contrat de travail : un contrat d'apprentissage ou un contrat de professionnalisation.",
  },
  {
    q: "Quel âge pour faire une alternance ?",
    a: "En apprentissage, de 16 à 29 ans (dès 15 ans si tu as terminé la 3e, et sans limite d'âge dans certains cas, par exemple pour une personne handicapée). En contrat de professionnalisation, de 16 à 25 ans, ou à partir de 26 ans si tu es demandeur d'emploi.",
  },
  {
    q: "Combien gagne un alternant ?",
    a: `En apprentissage, entre ${amount(0.27)} et ${amount(1)} brut par mois en 2026 selon ton âge et ton année de contrat, presque sans cotisations. En contrat pro, de ${formatPercent(PRO_RATES.under21.belowBacPro)} à ${formatPercent(PRO_RATES["21to25"].bacProOrMore)} du SMIC avant 26 ans, et au moins le SMIC après.`,
  },
  {
    q: "Comment trouver une alternance ?",
    a: "Regarde chaque jour les nouvelles offres de ton métier et de ta ville, et postule vite. En parallèle, envoie des candidatures spontanées aux entreprises qui embauchent des alternants sans publier d'offre, demande à ton école ses entreprises partenaires et relance au bout de 7 à 10 jours.",
  },
];

const STAGE_FAQ: Faq[] = [
  {
    q: "Un stage est-il payé ?",
    a: `Oui, dès que le stage dure plus de ${STAGE_MANDATORY_AFTER} sur la même année d'enseignement : la gratification minimale est de ${stageHourly} € par heure, soit environ ${stageMonthly} par mois à temps plein, sans cotisations à ce niveau. En dessous, l'entreprise peut te payer, mais n'y est pas obligée.`,
  },
  {
    q: "Combien de temps peut durer un stage ?",
    a: "6 mois au maximum par année d'enseignement dans la même entreprise.",
  },
  {
    q: "Peut-on faire un stage sans convention ?",
    a: "Non. Un stage se fait toujours avec une convention signée par toi, ton établissement et l'entreprise. Sans convention, ce n'est pas un stage.",
  },
  {
    q: "Comment trouver un stage ?",
    a: "Commence 3 à 6 mois avant la date de début, regarde chaque jour les nouvelles offres de ton domaine et de ta ville, envoie des candidatures spontanées et mobilise le service des stages de ton école.",
  },
];

function faqJsonLd(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
}

function FaqList({ faq }: { faq: Faq[] }) {
  return (
    <>
      {faq.map((item) => (
        <div key={item.q} style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, margin: "0 0 4px" }}>{item.q}</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{item.a}</p>
        </div>
      ))}
    </>
  );
}

function AlternanceEditorial() {
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd(ALTERNANCE_FAQ)) }} />
      <h2 style={h2}>L&apos;alternance en bref</h2>
      <p style={p}>
        L&apos;alternance, c&apos;est préparer un diplôme ou un titre professionnel en partageant ton temps entre une
        école (un CFA) et une entreprise qui te salarie. Deux contrats existent :
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={cell} />
              <th style={cell}>Contrat d&apos;apprentissage</th>
              <th style={cell}>Contrat de professionnalisation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>Âge</td>
              <td style={cell}>16 à 29 ans (sans limite dans certains cas)</td>
              <td style={cell}>16 à 25 ans, ou demandeur d&apos;emploi de 26 ans et plus</td>
            </tr>
            <tr>
              <td style={cell}>Durée</td>
              <td style={cell}>6 mois à 3 ans</td>
              <td style={cell}>6 à 12 mois, jusqu&apos;à 24 mois dans certains cas</td>
            </tr>
            <tr>
              <td style={cell}>Salaire minimum (2026)</td>
              <td style={cell}>
                27 % à 100 % du SMIC selon l&apos;âge et l&apos;année, soit {amount(0.27)} à {amount(1)} brut par mois
              </td>
              <td style={cell}>
                {formatPercent(PRO_RATES.under21.belowBacPro)} à {formatPercent(PRO_RATES["21to25"].bacProOrMore)} du SMIC avant
                26 ans, au moins le SMIC après
              </td>
            </tr>
            <tr>
              <td style={cell}>Formation</td>
              <td style={cell}>Gratuite pour l&apos;apprenti, au moins 25 % du temps</td>
              <td style={cell}>Prise en charge par l&apos;employeur et son opérateur de compétences</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ ...p, marginTop: 12 }}>
        <strong>Le rythme</strong> dépend de l&apos;école : 2 ou 3 jours en entreprise par semaine, une semaine sur
        deux, ou plusieurs semaines d&apos;affilée. <strong>Quand chercher ?</strong> Les entreprises recrutent surtout
        entre le printemps et la rentrée, mais des offres paraissent toute l&apos;année, et certaines formations ont
        une rentrée décalée en janvier ou en février.
      </p>
      <p style={p}>
        Pour aller plus loin : <Link href="/outils/simulateur-salaire-alternance">salaire en alternance 2026</Link>,{" "}
        <Link href="/guides/contrat-apprentissage-ou-contrat-pro">apprentissage ou contrat pro</Link>,{" "}
        <Link href="/guides/quand-chercher-son-alternance">quand chercher</Link>,{" "}
        <Link href="/guides/je-ne-trouve-pas-d-alternance">je ne trouve pas d&apos;alternance</Link>,{" "}
        <Link href="/guides/la-bonne-alternance">La Bonne Alternance</Link>,{" "}
        <Link href="/outils/cv-alternance">CV d&apos;alternance</Link> et{" "}
        <Link href="/outils/lettre-de-motivation-alternance">lettre de motivation</Link>.
      </p>
      <h2 style={h2}>Questions fréquentes sur l&apos;alternance</h2>
      <FaqList faq={ALTERNANCE_FAQ} />
    </section>
  );
}

function StageEditorial() {
  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd(STAGE_FAQ)) }} />
      <h2 style={h2}>Le stage en bref</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 12px", paddingLeft: 20, listStyle: "disc" }}>
        <li>
          Toujours avec une <Link href="/guides/convention-de-stage">convention de stage</Link> signée par toi, ton
          établissement et l&apos;entreprise.
        </li>
        <li>6 mois au maximum par année d&apos;enseignement dans la même entreprise.</li>
        <li>
          <Link href="/guides/gratification-de-stage">Gratification</Link> obligatoire au-delà de {STAGE_MANDATORY_AFTER}
          : au moins {stageHourly} € de l&apos;heure, soit environ {stageMonthly} par mois à temps plein.
        </li>
        <li>Le stagiaire n&apos;est pas un salarié : il vient apprendre, pas remplacer un salarié absent.</li>
      </ul>
      <p style={p}>
        Pour aller plus loin : <Link href="/guides/trouver-un-stage">trouver un stage</Link>,{" "}
        <Link href="/outils/cv-stage">CV de stage</Link>,{" "}
        <Link href="/outils/lettre-de-motivation-stage">lettre de motivation de stage</Link>,{" "}
        <Link href="/guides/entretien-de-stage">entretien de stage</Link> et{" "}
        <Link href="/guides/rapport-de-stage">rapport de stage</Link>.
      </p>
      <h2 style={h2}>Questions fréquentes sur les stages</h2>
      <FaqList faq={STAGE_FAQ} />
    </section>
  );
}

export function HubEditorial({ type }: { type: ContractType }) {
  return type === "alternance" ? <AlternanceEditorial /> : <StageEditorial />;
}
