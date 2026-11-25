import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";
import { safeJsonLd } from "@/lib/seo/jsonLd";
import { SCHOOL_STAGES, SCHOOL_STAGE_IDS, schoolStageLetter } from "@/lib/schoolStage/levels";
import { loadSchoolCityPage, nearbySchoolCities, schoolCity, type SchoolCityPage } from "@/lib/schoolStage/cityPage";
import { GUIDES } from "@/components/schoolStage/SchoolStageGuide";
import type { SchoolStageLevel } from "@/types/database";

// Page « stage de 3e à Lyon » (25/11), voir lib/schoolStage/cityPage.ts.
// Tous les chiffres viennent des sources relues le jour même.

const muted = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;
const MAX_OFFERS = 24;

function shortLevel(level: SchoolStageLevel): string {
  return level === "3e" ? "de 3e" : level === "seconde" ? "de seconde" : level === "premiere" ? "de 1re" : "de bac pro";
}

function titleFor(level: SchoolStageLevel, city: string): string {
  return level === "bac_pro" ? `Stage de bac pro (PFMP) à ${city}` : `Stage ${shortLevel(level)} à ${city}`;
}

function offerCount(page: SchoolCityPage): string | null {
  if (!page.offers || page.offers.length === 0) return null;
  // fetchE1S lit au plus 4 pages de 30 offres.
  return page.offers.length >= 120 ? "plus de 120" : String(page.offers.length);
}

function hasContent(page: SchoolCityPage): boolean {
  return (page.offers?.length ?? 0) > 0 || page.sectors.length > 0;
}

export async function schoolCityMetadata(level: SchoolStageLevel, slug: string): Promise<Metadata> {
  const page = await loadSchoolCityPage(level, slug);
  if (!page) return { title: "Page introuvable", robots: { index: false, follow: true } };
  const count = offerCount(page);
  const title = `${titleFor(level, page.label)} : ${count ? `${count} offres et ` : ""}entreprises près de chez toi`;
  const description = count
    ? `${count} offres de stage ${shortLevel(level)} publiées sur 1élève1stage autour de ${page.label}, des entreprises qui peuvent t'accueillir et un modèle de lettre de demande.`
    : `Entreprises près de ${page.label} à contacter pour ton stage ${shortLevel(level)}, un modèle de lettre de demande et nos conseils pour trouver vite.`;
  const url = `${SITE_URL}/${SCHOOL_STAGES[level].slug}/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    robots: hasContent(page) ? INDEXABLE_ROBOTS : { index: false, follow: true },
  };
}

export async function SchoolCityPageView({ level, slug }: { level: SchoolStageLevel; slug: string }) {
  const page = await loadSchoolCityPage(level, slug);
  if (!page) notFound();
  const g = GUIDES[level];
  const info = SCHOOL_STAGES[level];
  const count = offerCount(page);
  const checked = new Date(page.checkedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  const nearby = await Promise.all(nearbySchoolCities(slug).map(async (s) => ({ slug: s, name: (await schoolCity(s)).name })));
  const example = schoolStageLetter({ level, fullName: null, company: "[nom de l'entreprise]", activity: null });
  const faq = [
    {
      q: `Où trouver un stage ${shortLevel(level)} à ${page.label} ?`,
      a: count
        ? `Le ${checked}, ${count} offres de stage ${shortLevel(level)} étaient publiées sur 1élève1stage dans un rayon de 25 km autour de ${page.label}. Tu peux aussi demander directement aux entreprises proches : commerces, restaurants, pharmacies, cabinets...`
        : `Demande directement aux entreprises proches de chez toi : commerces, restaurants, pharmacies, cabinets... Beaucoup de stages se trouvent comme ça. Envoie ou dépose une lettre de demande à plusieurs entreprises en même temps.`,
    },
    { q: `Quand chercher son stage ${shortLevel(level)} ?`, a: g.tips[0] },
    { q: "Faut-il une convention de stage ?", a: g.facts.find((f) => f.toLowerCase().includes("convention")) ?? "Oui : une convention est signée par ton établissement, la structure d'accueil et tes parents." },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Stageio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: info.label, item: `${SITE_URL}/${info.slug}` },
          { "@type": "ListItem", position: 3, name: page.label, item: `${SITE_URL}/${info.slug}/${slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <nav style={{ fontSize: 13, ...muted }}>
        <Link href={`/${info.slug}`}>{info.label}</Link> › {page.label}
      </nav>
      <p className="tag tag-accent" style={{ fontSize: 12.5, marginTop: 12 }}>
        🎒 {info.label}
        {page.departement ? ` · ${page.departement}` : ""}
      </p>
      <h1 style={{ fontSize: 30, margin: "12px 0 0", lineHeight: 1.15 }}>
        {titleFor(level, page.label)} : {count ? `${count} offres et ` : ""}des entreprises près de chez toi
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.55, margin: "12px 0 0", ...muted }}>
        {g.intro} Voici, autour de {page.label}, {count ? "les offres publiées par l'État et " : ""}des entreprises à qui demander. Mis à jour le {checked}.
      </p>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)", background: "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))" }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>Ta lettre de demande, prête pour chaque entreprise</p>
        <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, ...muted }}>
          Sur Stageio, tu swipes les offres et les entreprises autour de {page.label}, et ta lettre est préparée pour chacune. À l&apos;inscription, choisis « {info.label} ».
        </p>
        <Link href="/inscription" className="btn btn-primary" style={{ marginTop: 14, display: "inline-flex" }}>
          Trouver mon stage à {page.label}
        </Link>
      </div>

      {page.offers && page.offers.length > 0 && (
        <section>
          <h2 style={{ fontSize: 21, margin: "32px 0 6px" }}>
            {count} offres de stage {shortLevel(level)} autour de {page.label}
          </h2>
          <p style={{ fontSize: 13.5, margin: "0 0 12px", ...muted }}>
            Offres publiées sur 1élève1stage (ministère de l&apos;Éducation nationale), dans un rayon de 25 km, relevées le {checked}. Pour postuler, tu te connectes sur 1élève1stage avec ÉduConnect.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {page.offers.slice(0, MAX_OFFERS).map((o) => (
              <li key={o.id} className="card" style={{ padding: "12px 14px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{o.title}</p>
                <p style={{ margin: "3px 0 0", fontSize: 13.5, ...muted }}>
                  {[o.company, o.city, o.weeks, o.dates].filter(Boolean).join(" · ")}
                </p>
                {o.url && (
                  <a href={o.url} target="_blank" rel="noreferrer nofollow" style={{ fontSize: 13, fontWeight: 700 }}>
                    Voir l&apos;offre sur 1élève1stage
                  </a>
                )}
              </li>
            ))}
          </ul>
          {page.offers.length > MAX_OFFERS && (
            <p style={{ fontSize: 13.5, margin: "10px 0 0", ...muted }}>
              Et {page.offers.length - MAX_OFFERS} autres offres : <Link href="/inscription">retrouve-les toutes sur Stageio</Link>.
            </p>
          )}
        </section>
      )}

      {page.sectors.length > 0 && (
        <section>
          <h2 style={{ fontSize: 21, margin: "32px 0 6px" }}>Entreprises à contacter près de {page.label}</h2>
          <p style={{ fontSize: 13.5, margin: "0 0 12px", ...muted }}>
            Elles n&apos;ont pas forcément publié d&apos;offre : demande-leur directement, avec ta lettre. Établissements ouverts avec des salariés, d&apos;après l&apos;annuaire des entreprises (Insee).
          </p>
          <div style={{ display: "grid", gap: 16 }}>
            {page.sectors.map((s) => (
              <div key={s.id}>
                <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>
                  {s.emoji} {s.label}
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.6, listStyle: "disc" }}>
                  {s.companies.map((c) => (
                    <li key={c.siret}>
                      <strong>{c.name}</strong> · {c.activity} · {c.address}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 style={{ fontSize: 21, margin: "32px 0 8px" }}>Ce qu&apos;il faut savoir</h2>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6, listStyle: "disc" }}>
        {g.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2 style={{ fontSize: 21, margin: "28px 0 8px" }}>Modèle de lettre de demande de stage</h2>
      <pre className="card" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.55, padding: 18, margin: 0 }}>
        {example}
      </pre>

      <h2 style={{ fontSize: 21, margin: "28px 0 8px" }}>Questions fréquentes</h2>
      {faq.map((f) => (
        <div key={f.q} style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>{f.q}</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "4px 0 0", ...muted }}>{f.a}</p>
        </div>
      ))}

      {nearby.length > 0 && (
        <p style={{ fontSize: 14, margin: "28px 0 0", lineHeight: 1.7 }}>
          <strong>Stage {shortLevel(level)} dans les villes proches :</strong>{" "}
          {nearby.map((n, i) => (
            <span key={n.slug}>
              {i > 0 ? " · " : ""}
              <Link href={`/${info.slug}/${n.slug}`}>{n.name}</Link>
            </span>
          ))}
        </p>
      )}
      <p style={{ fontSize: 14, margin: "10px 0 0", lineHeight: 1.7 }}>
        <strong>Autres stages à {page.label} :</strong>{" "}
        {SCHOOL_STAGE_IDS.filter((id) => id !== level).map((id, i) => (
          <span key={id}>
            {i > 0 ? " · " : ""}
            <Link href={`/${SCHOOL_STAGES[id].slug}/${slug}`}>{SCHOOL_STAGES[id].label}</Link>
          </span>
        ))}
      </p>
      <p style={{ fontSize: 12.5, margin: "20px 0 0", ...muted }}>
        Sources : 1élève1stage (licence Etalab 2.0), annuaire des entreprises (Insee), education.gouv.fr et eduscol.
      </p>
    </main>
  );
}
