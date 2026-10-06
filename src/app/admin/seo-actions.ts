"use server";

import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin/accessCode";
import { submitToIndexNow } from "@/lib/seo/indexNow";
import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { GUIDES } from "@/lib/guides/guidesData";
import { SITE_URL } from "@/lib/site";
import type { ContractType } from "@/types/database";

const STATIC_PATHS = [
  "/",
  "/offres",
  "/offres/alternance",
  "/offres/stage",
  "/alternance",
  "/stage",
  "/guides",
  "/outils/simulateur-salaire-alternance",
  "/inscription",
];

async function programmaticPaths(type: ContractType): Promise<string[]> {
  const index = await getProgrammaticIndex(type);
  const keep = (count: number) => count >= INDEXABLE_MIN_OFFERS;
  return [
    ...Object.values(index.metiers).filter((m) => keep(m.count)).map((m) => `/${type}/${m.slug}`),
    ...Object.values(index.cities).filter((c) => keep(c.count)).map((c) => `/${type}/${c.slug}`),
    ...Object.values(index.combos).filter((c) => keep(c.count)).map((c) => `/${type}/${c.metier}/${c.city}`),
  ];
}

// Bouton admin : envoie d'un coup toutes les URLs indexables du site à
// IndexNow (Bing & co). À relancer après un gros changement de contenu --
// inutile de cliquer tous les jours.
export async function submitIndexNowAction() {
  await assertAdminSession();
  let result: { submitted: number; error?: string };
  try {
    const [alternance, stage, offersAlternance, offersStage] = await Promise.all([
      programmaticPaths("alternance"),
      programmaticPaths("stage"),
      fetchOfferSitemapEntries("alternance"),
      fetchOfferSitemapEntries("stage"),
    ]);
    const paths = [
      ...STATIC_PATHS,
      ...GUIDES.map((guide) => `/guides/${guide.slug}`),
      ...alternance,
      ...stage,
      ...offersAlternance.map((entry) => entry.path),
      ...offersStage.map((entry) => entry.path),
    ];
    result = await submitToIndexNow(paths.map((path) => `${SITE_URL}${path === "/" ? "/" : path}`));
  } catch (err) {
    console.error("submitIndexNowAction failed", err);
    result = { submitted: 0, error: "Erreur pendant la collecte des URLs (voir les logs)." };
  }
  const params = new URLSearchParams({ indexnow: result.error ? "error" : "ok", count: String(result.submitted) });
  if (result.error) params.set("message", result.error);
  redirect(`/admin?${params.toString()}`);
}
