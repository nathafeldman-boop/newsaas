import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { cityPhrase, getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { LISTED_METIERS } from "@/lib/seo/metiers";
import { WidgetBuilder } from "@/components/widget/WidgetBuilder";

// Pour les écoles, CFA, BDE et sites étudiants : les offres d'alternance ou
// de stage de leur ville sur leur propre site, gratuitement. Page d'appui aux
// envois de docs/citations-ia.md, pas une page de recherche : non indexée.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Widget gratuit : les offres d'alternance de ta ville sur ton site",
  description: "Écoles, CFA, BDE : affichez gratuitement les offres d'alternance ou de stage de votre ville sur votre site, mises à jour chaque jour.",
  alternates: { canonical: `${SITE_URL}/outils/widget-offres` },
  robots: { index: false, follow: true },
};

const TOP_CITIES = 60;

export default async function WidgetOffersPage() {
  const [alternance, stage] = await Promise.all([getProgrammaticIndex("alternance"), getProgrammaticIndex("stage")]);
  const top = (index: typeof alternance) =>
    Object.values(index.cities)
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_CITIES)
      .map((c) => ({ slug: c.slug, label: c.label, phrase: cityPhrase(c.label) }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const metiers = LISTED_METIERS
    .map((m) => ({ slug: m.slug, label: m.label.charAt(0).toUpperCase() + m.label.slice(1) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: "0 0 10px" }}>Les offres d&apos;alternance de votre ville, sur votre site</h1>
      <p style={{ fontSize: 15, margin: "0 0 8px" }}>
        Écoles, CFA, BDE, associations étudiantes : affichez gratuitement les dernières offres d&apos;alternance ou de stage
        de votre ville, et d&apos;un métier si vous le souhaitez. La liste se met à jour toute seule chaque jour, à partir
        des offres de France Travail et d&apos;Adzuna réunies par Stageio.
      </p>
      <p style={{ fontSize: 15, margin: "0 0 20px" }}>
        Gratuit, sans compte, sans cookie publicitaire. Choisissez, copiez le code, collez-le dans votre page.
      </p>
      <WidgetBuilder cities={{ alternance: top(alternance), stage: top(stage) }} metiers={metiers} />
      <p style={{ fontSize: 13.5, marginTop: 20 }}>
        Une question, une ville ou un métier qui manque ? Écrivez-nous : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </div>
  );
}
