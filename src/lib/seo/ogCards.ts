import { createPublicClient } from "@/lib/supabase/public";
import { extractOfferId } from "@/lib/offers/publicUrl";
import { normalizeCityKey, titleCase } from "@/lib/offers/segments";
import { resolveProgrammaticPage } from "@/lib/seo/programmaticPage";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { formatCount, type OgCard } from "@/lib/seo/ogImage";
import { GUIDES } from "@/lib/guides/guidesData";
import type { ContractType } from "@/types/database";

// Contenu des aperçus de partage (voir ogImage.tsx), page par page. En cas de
// page inconnue ou d'erreur de base, carte générique plutôt qu'une erreur :
// un aperçu cassé ferait plus de tort qu'un aperçu générique.

const TYPE_LABEL: Record<ContractType, string> = { alternance: "Alternance", stage: "Stage" };

const GENERIC: OgCard = {
  kicker: "Alternance et stage",
  title: "Trouve ton alternance ou ton stage en swipant",
};

function euros(value: number): string {
  return `${value.toLocaleString("fr-FR")} €`;
}

export async function programmaticOgCard(type: ContractType, slug: string, ville?: string): Promise<OgCard> {
  try {
    const model = await resolveProgrammaticPage(type, slug, ville);
    if (!model) return GENERIC;
    const { stats } = model;
    return {
      kicker: `${type === "alternance" ? "Offres d'alternance" : "Offres de stage"} mises à jour chaque jour`,
      title: model.h1,
      stats: [
        formatCount(stats.count, "offre"),
        formatCount(stats.companyCount, "entreprise"),
        stats.salaryMedian
          ? `${euros(stats.salaryMedian)} / mois (médiane)`
          : formatCount(stats.recent7d, "nouvelle cette semaine", "nouvelles cette semaine"),
      ],
    };
  } catch (err) {
    console.error("programmaticOgCard failed", err);
    return GENERIC;
  }
}

export async function companyOgCard(slug: string): Promise<OgCard> {
  try {
    const company = (await getCompanyIndex()).companies[slug];
    if (!company) return GENERIC;
    const kinds = (["alternance", "stage"] as const).filter((type) => company.byType[type] > 0);
    return {
      kicker: "Entreprise qui recrute",
      title: `${kinds.map((type, i) => (i === 0 ? TYPE_LABEL[type] : type)).join(" et ")} chez ${company.label}`,
      stats: [
        formatCount(company.count, "offre"),
        formatCount(company.cities.length, "ville"),
        formatCount(company.recent7d, "nouvelle cette semaine", "nouvelles cette semaine"),
      ],
    };
  } catch (err) {
    console.error("companyOgCard failed", err);
    return GENERIC;
  }
}

export async function offerOgCard(slug: string): Promise<OgCard> {
  const id = extractOfferId(slug);
  if (!id) return GENERIC;
  try {
    const { data, error } = await createPublicClient()
      .from("offers")
      .select("title, company, location, contract_type")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return GENERIC;
    const city = data.location ? titleCase(normalizeCityKey(data.location)) || data.location : null;
    return {
      kicker: city ? `${TYPE_LABEL[data.contract_type as ContractType]} à ${city}` : TYPE_LABEL[data.contract_type as ContractType],
      title: data.title,
      stats: [data.company],
      footer: "Postule en un geste sur Stageio",
    };
  } catch (err) {
    console.error("offerOgCard failed", err);
    return GENERIC;
  }
}

export function guideOgCard(slug: string): OgCard {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return GENERIC;
  return {
    kicker: "Guide gratuit",
    title: guide.title,
    footer: "Les guides Stageio pour les étudiants",
  };
}

export const SIMULATEUR_OG_CARD: OgCard = {
  kicker: "Outil gratuit",
  title: "Simulateur de salaire en alternance 2026",
  stats: ["Apprentissage", "Contrat pro", "Stage"],
  footer: "Ton salaire minimum brut et net en 10 secondes",
};

export async function barometreOgCard(): Promise<OgCard> {
  try {
    const [alternance, stage] = await Promise.all([getProgrammaticIndex("alternance"), getProgrammaticIndex("stage")]);
    return {
      kicker: "Baromètre 2026",
      title: "Alternance et stages : les métiers et les villes qui recrutent",
      stats: [
        formatCount(alternance.total, "offre d'alternance", "offres d'alternance"),
        formatCount(stage.total, "offre de stage", "offres de stage"),
      ],
      footer: "Données Stageio mises à jour chaque jour",
    };
  } catch (err) {
    console.error("barometreOgCard failed", err);
    return GENERIC;
  }
}
