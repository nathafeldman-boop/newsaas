import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { SCHOOL_STAGES, SCHOOL_STAGE_IDS, schoolStageLetter } from "@/lib/schoolStage/levels";
import { SCHOOL_SECTORS } from "@/lib/schoolStage/companies";
import type { SchoolStageLevel } from "@/types/database";

// Pages guides publiques des stages scolaires (18/11). Uniquement des faits
// vérifiés sur education.gouv.fr / eduscol le 18/11 (voir levels.ts) ; pour
// les dates exactes, on renvoie toujours à l'établissement.

type Guide = { title: string; description: string; intro: string; facts: string[]; tips: string[] };

const GUIDES: Record<SchoolStageLevel, Guide> = {
  "3e": {
    title: "Stage de 3e : trouver une entreprise près de chez toi",
    description: "Stage d'observation de 3e : durée, convention, dates, lettre de demande prête à remplir et entreprises près de chez toi.",
    intro: "En 3e, tu fais un stage d'observation obligatoire en entreprise, dans une association ou un service public. Le plus dur : trouver où le faire.",
    facts: [
      "Il est obligatoire pour les élèves de 3e et dure en général 5 jours.",
      "Tes dates sont fixées par ton collège : demande-les avant de contacter les entreprises.",
      "Une convention de stage est signée par ton collège, l'entreprise et tes parents.",
      "L'État publie aussi des offres sur la plateforme 1élève1stage (connexion avec ÉduConnect).",
    ],
    tips: [
      "Commence tôt : les places dans les entreprises proches partent vite.",
      "Contacte plusieurs entreprises en même temps, pas une seule.",
      "Le mieux : passer déposer ta lettre en main propre, ou appeler pour demander à qui l'envoyer.",
    ],
  },
  seconde: {
    title: "Stage de seconde : trouver ton stage d'observation de fin juin",
    description: "Stage de seconde générale et technologique : deux semaines fin juin, convention, lettre de demande prête et entreprises près de chez toi.",
    intro: "En seconde générale et technologique, tu fais un stage d'observation de deux semaines en fin d'année. Les entreprises reçoivent beaucoup de demandes en même temps : mieux vaut s'y prendre tôt.",
    facts: [
      "Le stage dure deux semaines consécutives, sur les deux dernières semaines de juin (du 15 au 26 juin en 2026).",
      "Les dates exactes de chaque année sont fixées par le ministère : ton lycée te les donne.",
      "Une convention de stage est signée par ton lycée, la structure d'accueil et tes parents.",
      "Des offres sont publiées sur la plateforme de l'État 1élève1stage.",
    ],
    tips: [
      "Tous les élèves de seconde cherchent en même temps : contacte les entreprises dès l'hiver.",
      "Vise un secteur qui t'aide à choisir tes spécialités ou ton orientation.",
      "Relance poliment au bout d'une semaine sans réponse.",
    ],
  },
  premiere: {
    title: "Stage de 1re : trouver une entreprise pour ton stage",
    description: "Stage en 1re : quand il est prévu, la convention, une lettre de demande prête et des entreprises près de chez toi.",
    intro: "En 1re générale, il n'y a pas de stage obligatoire. Certaines filières en prévoient un, et tu peux aussi en chercher un pour découvrir un métier. Dans tous les cas, ton lycée doit être d'accord et signer une convention.",
    facts: [
      "Pas de stage obligatoire en 1re générale : vérifie avec ton lycée si ta filière en prévoit un.",
      "En bac professionnel, les stages s'appellent des PFMP (voir notre page bac pro).",
      "Sans convention signée par ton lycée, l'entreprise ne peut pas t'accueillir.",
    ],
    tips: [
      "Demande d'abord à ton lycée les dates possibles et la convention.",
      "Explique dans ta lettre ce que tu veux découvrir : c'est ce qui donne envie de te prendre.",
      "Contacte plusieurs entreprises en même temps.",
    ],
  },
  bac_pro: {
    title: "Stage de bac pro (PFMP) : trouver ton entreprise",
    description: "PFMP du bac pro : comment trouver ton entreprise, la convention, une lettre de demande prête et des entreprises près de chez toi.",
    intro: "En bac pro, tes stages s'appellent des PFMP (périodes de formation en milieu professionnel). Elles sont réparties sur les trois années, et c'est souvent à toi de trouver l'entreprise.",
    facts: [
      "Les PFMP sont réparties sur les trois années du bac pro ; ton lycée fixe leurs dates.",
      "L'entreprise doit correspondre à ta spécialité : demande à ton professeur référent.",
      "Une convention est signée par ton lycée, l'entreprise et toi (et tes parents si tu es mineur).",
    ],
    tips: [
      "Cherche dans le métier de ta spécialité, près de chez toi ou de ton lycée.",
      "Une entreprise qui t'a bien accueilli peut te reprendre pour la PFMP suivante, ou en alternance après le bac.",
      "Contacte plusieurs entreprises en même temps et relance au bout d'une semaine.",
    ],
  },
};

export function schoolGuideMetadata(level: SchoolStageLevel): Metadata {
  const g = GUIDES[level];
  const url = `${SITE_URL}/${SCHOOL_STAGES[level].slug}`;
  return { title: g.title, description: g.description, alternates: { canonical: url }, openGraph: { title: g.title, description: g.description, url } };
}

const muted = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;

export function SchoolStageGuide({ level }: { level: SchoolStageLevel }) {
  const g = GUIDES[level];
  const example = schoolStageLetter({ level, fullName: null, company: "[nom de l'entreprise]", activity: null });
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10">
      <p className="tag tag-accent" style={{ fontSize: 12.5 }}>
        🎒 {SCHOOL_STAGES[level].label}
      </p>
      <h1 style={{ fontSize: 30, margin: "12px 0 0", lineHeight: 1.15 }}>{g.title}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.55, margin: "12px 0 0", ...muted }}>{g.intro}</p>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)", background: "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))" }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>Les entreprises près de chez toi + ta lettre, gratuitement</p>
        <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, ...muted }}>
          Choisis un secteur ({SCHOOL_SECTORS.slice(0, 5).map((s) => s.label.toLowerCase()).join(", ")}…) : Stageio te montre les entreprises autour de
          chez toi et écrit ta lettre de demande. Moins de 15 ans : on demande l&apos;accord d&apos;un parent. Après
          l&apos;inscription, choisis « Stage de 3e, de seconde, de 1re ou de bac pro ».
        </p>
        <Link href="/inscription" className="btn btn-primary" style={{ marginTop: 14, display: "inline-flex" }}>
          Trouver mon entreprise
        </Link>
      </div>

      <h2 style={{ fontSize: 21, margin: "32px 0 8px" }}>Ce qu&apos;il faut savoir</h2>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6, listStyle: "disc" }}>
        {g.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 21, margin: "28px 0 8px" }}>Nos conseils pour trouver vite</h2>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6, listStyle: "disc" }}>
        {g.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 21, margin: "28px 0 8px" }}>Modèle de lettre de demande de stage</h2>
      <pre className="card" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.55, padding: 18, margin: 0 }}>
        {example}
      </pre>

      <p style={{ fontSize: 13, margin: "24px 0 0", ...muted }}>
        Sources : education.gouv.fr et eduscol. Offres publiées par l&apos;État :{" "}
        <a href="https://1eleve1stage.education.gouv.fr" target="_blank" rel="noreferrer">
          1élève1stage
        </a>
        .
      </p>
      <p style={{ fontSize: 13.5, margin: "16px 0 0" }}>
        Autres stages :{" "}
        {SCHOOL_STAGE_IDS.filter((id) => id !== level).map((id, i) => (
          <span key={id}>
            {i > 0 ? " · " : ""}
            <Link href={`/${SCHOOL_STAGES[id].slug}`}>{SCHOOL_STAGES[id].label}</Link>
          </span>
        ))}
      </p>
    </main>
  );
}
