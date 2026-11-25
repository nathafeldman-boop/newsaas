import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { StickySignupBar } from "@/components/signup/StickySignupBar";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import {
  CONTRACT_METIER_INDEXABLE_MIN,
  contractMetierPath,
  getContractMetierSegment,
} from "@/lib/offers/contractMetierSegments";
import type { JobContract } from "@/lib/offers/contractCitySegments";
import { fetchOffersByIds, pageIds, listedPages } from "@/lib/seo/programmaticPage";
import { cityPhrase } from "@/lib/seo/programmaticIndex";
import { getMetier } from "@/lib/seo/metiers";
import { pagedPath, pagedTitle } from "@/lib/seo/pagination";
import { INDEXABLE_ROBOTS } from "@/lib/seo/robots";
import { signupHref } from "@/lib/signup/intent";
import { SITE_URL } from "@/lib/site";

// /offres/cdi/metier/[metier] et /offres/cdi/metier/[metier]/[ville] (25/11),
// pareil pour le CDD : « CDI de vendeur à Lyon ». Vraies offres France
// Travail ouvertes aux débutants, voir lib/offers/contractMetierSegments.ts.

const LABEL: Record<JobContract, string> = { cdi: "CDI", cdd: "CDD" };
const OTHER: Record<JobContract, JobContract> = { cdi: "cdd", cdd: "cdi" };
const fr = (n: number) => n.toLocaleString("fr-FR");

function monthYear(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());
}

function heading(type: JobContract, domain: string, cityLabel: string | null): string {
  return `${LABEL[type]} ${domain}${cityLabel ? ` ${cityPhrase(cityLabel)}` : ""}`;
}

export async function contractMetierMetadata(type: JobContract, metier: string, city: string | null, page: number): Promise<Metadata> {
  const found = await getContractMetierSegment(type, metier, city);
  if (!found) return { title: "Page introuvable", robots: { index: false, follow: true } };
  const { segment, metier: m } = found;
  const h = heading(type, m.domain, segment.cityLabel);
  const canonical = `${SITE_URL}${pagedPath(contractMetierPath(type, metier, city), page)}`;
  return {
    title: pagedTitle(`${h} : ${fr(segment.count)} offres pour débutants (${monthYear()})`, page),
    description: `${fr(segment.count)} offres en ${LABEL[type]} ${m.domain}${segment.cityLabel ? ` ${cityPhrase(segment.cityLabel)}` : " partout en France"}, ouvertes aux débutants et mises à jour chaque jour. Parcours-les sans créer de compte.`,
    alternates: { canonical },
    robots: segment.count >= CONTRACT_METIER_INDEXABLE_MIN && page === 1 ? INDEXABLE_ROBOTS : { index: false, follow: true },
  };
}

export async function ContractMetierPage({ type, metier, city, page }: { type: JobContract; metier: string; city: string | null; page: number }) {
  const [found, other] = await Promise.all([getContractMetierSegment(type, metier, city), getContractMetierSegment(OTHER[type], metier, city)]);
  if (!found) notFound();
  const { segment, metier: m, index } = found;
  const totalPages = listedPages(segment);
  if (page > totalPages) notFound();
  const offers = await fetchOffersByIds(pageIds(segment, page));
  const h = heading(type, m.domain, segment.cityLabel);
  const signup = signupHref({ type, metier, city: segment.cityLabel });

  // Maillage : même métier dans d'autres villes, autres métiers dans la même ville (ou en France).
  const cities = index.combos
    .filter((c) => c.metier === metier && c.city !== city)
    .slice(0, 16)
    .map((c) => ({ href: contractMetierPath(type, metier, c.city), label: `${LABEL[type]} ${m.label} ${cityPhrase(c.cityLabel ?? "")}`, count: c.count }));
  const others = (city ? index.combos.filter((c) => c.city === city && c.metier !== metier) : index.metiers.filter((x) => x.metier !== metier))
    .slice(0, 16)
    .map((c) => ({ href: contractMetierPath(type, c.metier, city), label: `${LABEL[type]} ${getMetier(c.metier)?.label ?? c.metier}`, count: c.count }));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <nav style={{ fontSize: 13 }}>
        <Link href={`/offres/${type}`}>Offres en {LABEL[type]}</Link>
        {city && (
          <>
            {" › "}
            <Link href={contractMetierPath(type, metier, null)}>{heading(type, m.domain, null)}</Link>
          </>
        )}
      </nav>
      <h1 style={{ fontSize: 28, margin: "12px 0 0" }}>
        {h} : {fr(segment.count)} offres pour débutants
      </h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <strong>{fr(segment.count)}</strong> offres en {LABEL[type]} {m.domain}
        {segment.cityLabel ? ` ${cityPhrase(segment.cityLabel)}` : " partout en France"} ouvertes aux débutants en ce moment, issues de France Travail
        et mises à jour chaque jour. <Link href={signup}>Crée ton profil</Link> : tu swipes les offres qui te correspondent, et ta lettre est prête pour
        chacune.
      </p>
      {other && (
        <p style={{ fontSize: 14, margin: "4px 0 0" }}>
          Aussi :{" "}
          <Link href={contractMetierPath(OTHER[type], metier, city)}>
            {fr(other.segment.count)} offres en {heading(OTHER[type], m.domain, segment.cityLabel)}
          </Link>
          .
        </p>
      )}

      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath={contractMetierPath(type, metier, city)} />

      {page === 1 && (
        <>
          {cities.length > 0 && <LinkChips title={`${LABEL[type]} ${m.label} dans d'autres villes`} links={cities} />}
          {others.length > 0 && (
            <LinkChips title={segment.cityLabel ? `Autres métiers en ${LABEL[type]} ${cityPhrase(segment.cityLabel)}` : `Autres métiers en ${LABEL[type]}`} links={others} />
          )}
        </>
      )}
      <StickySignupBar href={signup} />
    </div>
  );
}
