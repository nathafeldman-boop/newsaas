import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import {
  INDEXABLE_CONTRACT_CITY_MIN,
  fetchContractCityOffers,
  getContractCitySegment,
  getContractCitySegments,
  type JobContract,
} from "@/lib/offers/contractCitySegments";
import { cityPhrase } from "@/lib/seo/programmaticIndex";
import { pagedPath, pagedTitle } from "@/lib/seo/pagination";
import { signupHref } from "@/lib/signup/intent";
import { SITE_URL } from "@/lib/site";

// /offres/cdi/[ville] et /offres/cdd/[ville] (12/11) : « CDI débutant à
// Lyon ». Liste des offres du type dans la ville, quelques repères vrais
// et le lien d'inscription. Indexée à partir de 10 offres.

const LABEL: Record<JobContract, string> = { cdi: "CDI", cdd: "CDD" };
const OTHER: Record<JobContract, JobContract> = { cdi: "cdd", cdd: "cdi" };
const fr = (n: number) => n.toLocaleString("fr-FR");

function monthYear(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());
}

export async function contractCityMetadata(type: JobContract, slug: string, page: number): Promise<Metadata> {
  const segment = await getContractCitySegment(type, slug);
  if (!segment) return { title: "Ville introuvable", robots: { index: false, follow: true } };
  const where = cityPhrase(segment.label);
  const canonical = `${SITE_URL}${pagedPath(`/offres/${type}/${segment.slug}`, page)}`;
  return {
    title: pagedTitle(`${LABEL[type]} débutant ${where} : ${fr(segment.count)} offres sans expérience (${monthYear()})`, page),
    description: `${fr(segment.count)} offres en ${LABEL[type]} ouvertes aux débutants ${where}, mises à jour chaque jour. Premier emploi, jeune diplômé, sans expérience : parcours-les sans créer de compte.`,
    alternates: { canonical },
    robots: segment.count >= INDEXABLE_CONTRACT_CITY_MIN ? undefined : { index: false, follow: true },
  };
}

export async function ContractCityPage({ type, slug, page }: { type: JobContract; slug: string; page: number }) {
  const [segment, cities, otherCities] = await Promise.all([
    getContractCitySegment(type, slug),
    getContractCitySegments(type),
    getContractCitySegments(OTHER[type]),
  ]);
  if (!segment) notFound();
  const { offers, count, totalPages } = await fetchContractCityOffers(type, segment, page);
  if (page > totalPages) notFound();

  const where = cityPhrase(segment.label);
  const other = otherCities.find((c) => c.slug === segment.slug);
  const signup = signupHref({ type, city: segment.label });
  const nearby = cities
    .filter((c) => c.slug !== segment.slug)
    .slice(0, 16)
    .map((c) => ({ href: `/offres/${type}/${c.slug}`, label: `${LABEL[type]} ${cityPhrase(c.label)}`, count: c.count }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <Link href={`/offres/${type}`} style={{ fontSize: 13 }}>
        ← Toutes les offres en {LABEL[type]}
      </Link>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        {LABEL[type]} débutant {where} : {fr(count)} offres sans expérience
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <strong>{fr(count)}</strong> offres en {LABEL[type]} ouvertes aux débutants {where} en ce moment, issues de France
        Travail et mises à jour chaque jour. <Link href={signup}>Crée ton profil gratuit</Link> : tu swipes les offres de ta
        ville, et ta candidature part en un geste.
      </p>
      {other && (
        <p style={{ fontSize: 14, margin: "4px 0 0" }}>
          Aussi : <Link href={`/offres/${OTHER[type]}/${other.slug}`}>{fr(other.count)} offres en {LABEL[OTHER[type]]} {where}</Link>.
        </p>
      )}

      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath={`/offres/${type}/${segment.slug}`} />

      {page === 1 && (
        <section className="mt-8" style={{ fontSize: 14 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Décrocher un premier {LABEL[type]} {where}</h2>
          <p style={{ margin: "0 0 8px" }}>
            Ces offres acceptent les candidats sans expérience ou en début de carrière. Les plus récentes sont en haut de
            la liste : commence par elles.
          </p>
          <p style={{ margin: 0 }}>
            Besoin d&apos;un coup de main pour ton CV ou ta lettre de motivation ? <Link href="/outils">Nos outils gratuits</Link>.
          </p>
        </section>
      )}
      {page === 1 && <LinkChips title={`Offres en ${LABEL[type]} dans d'autres villes`} links={nearby} />}
      <StickySignupBar href={signup} />
    </div>
  );
}
