import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchActiveOfferCount, fetchPublicOffers } from "@/lib/offers/fetchPublicOffers";
import { signupHref } from "@/lib/signup/intent";
import { PublicOffersGrid } from "@/components/offers/PublicOffersGrid";
import { OffersSegmentNav } from "@/components/offers/OffersSegmentNav";
import { LinkChips } from "@/components/seo/ProgrammaticPage";
import { getHubModel } from "@/lib/seo/programmaticPage";
import { SITE_URL } from "@/lib/site";
import { pagedPath, pagedTitle } from "@/lib/seo/pagination";
import type { ContractType } from "@/types/database";

// /offres/alternance et /offres/stage : la liste complète d'un type, la page
// qui répond à « offre alternance » / « offre d'alternance » (5 500
// recherches par mois à elles deux) et « offre de stage » (1 900). Compte
// exact en cache 10 min ; nouveautés de la semaine et top métiers / villes
// depuis l'index programmatique (en cache lui aussi).

const OF: Record<ContractType, string> = { alternance: "d'alternance", stage: "de stage" };

const fr = (n: number) => n.toLocaleString("fr-FR");

// L'index n'apporte que du complément : s'il est indisponible, la liste
// s'affiche quand même (sans nouveautés ni liens métiers / villes).
const hubModel = (type: ContractType) => getHubModel(type).catch(() => null);

export async function offersTypeMetadata(type: ContractType, page: number): Promise<Metadata> {
  const path = `/offres/${type}`;
  const canonical = `${SITE_URL}${pagedPath(path, page)}`;
  if (page > 1) {
    return {
      title: pagedTitle(`Offres ${OF[type]}`, page),
      description: `Toutes les offres ${OF[type]} disponibles sur Stageio, mises à jour chaque jour. Parcours-les sans créer de compte. Page ${page}.`,
      alternates: { canonical },
    };
  }
  const [count, hub] = await Promise.all([fetchActiveOfferCount(type), hubModel(type)]);
  const recent = hub && hub.index.recent7d > 0 ? `, dont ${fr(hub.index.recent7d)} publiées cette semaine` : "";
  const examples = hub ? `${hub.metiers.slice(0, 3).map((m) => m.label).join(", ")}… : ` : "";
  return {
    title: `Offres ${OF[type]} ${new Date().getFullYear()} : ${fr(count)} offres à pourvoir`,
    description: `${fr(count)} offres ${OF[type]} en France${recent}. ${examples}trie par métier et par ville, sans créer de compte. Mis à jour chaque jour.`,
    alternates: { canonical },
  };
}

export async function OffersTypePage({ type, page }: { type: ContractType; page: number }) {
  const path = `/offres/${type}`;
  const [{ offers, count, totalPages }, hub] = await Promise.all([fetchPublicOffers(type, page), hubModel(type)]);
  const recent = hub?.index.recent7d ?? 0;
  if (page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-9">
      <h1 style={{ fontSize: 28, margin: 0 }}>Offres {OF[type]} en France</h1>
      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <strong>{fr(count)}</strong> offres {OF[type]} actives
        {recent > 0 ? <>, dont {fr(recent)} publiées ces 7 derniers jours</> : null}. La liste est mise
        à jour chaque jour à partir de France Travail et d&apos;Adzuna.{" "}
        <Link href={signupHref({ type })}>Crée ton profil gratuit</Link> pour swiper celles qui te correspondent.
      </p>
      {type === "alternance" && (
        <p style={{ fontSize: 14, margin: "4px 0 0" }}>
          Combien tu seras payé ?{" "}
          <Link href="/outils/simulateur-salaire-alternance">Simule ton salaire d&apos;alternant</Link>.
        </p>
      )}

      <p style={{ fontSize: 14, margin: "8px 0 0" }}>
        <Link href={`/${type}`}>Offres {OF[type]} par métier et par ville</Link>
      </p>
      <OffersSegmentNav active={type} />
      <PublicOffersGrid offers={offers} page={page} totalPages={totalPages} basePath={path} />
      {page === 1 && hub && (
        <>
          <LinkChips title={`Offres ${OF[type]} par métier`} links={hub.metiers.slice(0, 16)} />
          <LinkChips title={`Offres ${OF[type]} par ville`} links={hub.cities.slice(0, 16)} />
        </>
      )}
    </div>
  );
}
