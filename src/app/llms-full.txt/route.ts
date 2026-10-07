import { GUIDES, type Guide, type GuideTable } from "@/lib/guides/guidesData";
import { SITE_URL } from "@/lib/site";

// Version longue de /llms.txt (convention llmstxt.org) : le texte complet
// des guides en Markdown, dans un seul fichier, pour les assistants IA qui
// lisent ce format plutôt que de parcourir les pages une à une. Généré au
// build à partir des mêmes données que les pages /guides.

export const dynamic = "force-static";

function table({ headers, rows }: GuideTable): string {
  const line = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, "/")).join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

function guideMarkdown(guide: Guide): string {
  const parts = [`## ${guide.title}`, `${SITE_URL}/guides/${guide.slug} (mis à jour le ${guide.updatedAt})`, ...guide.intro];
  for (const section of guide.sections) {
    parts.push(`### ${section.heading}`);
    if (section.table) parts.push(table(section.table));
    if (section.paragraphs) parts.push(...section.paragraphs);
    if (section.list) parts.push(section.list.map((item) => `- ${item}`).join("\n"));
  }
  if (guide.faq?.length) {
    parts.push("### Questions fréquentes");
    for (const item of guide.faq) parts.push(`**${item.q}**\n${item.a}`);
  }
  if (guide.sources?.length) {
    parts.push(`Sources : ${guide.sources.map((source) => `[${source.label}](${source.url})`).join(" ; ")}`);
  }
  return parts.join("\n\n");
}

export function GET() {
  const header = [
    "# Stageio : guides complets",
    "> Stageio (stageio.fr) est une plateforme française qui aide les étudiants à trouver une alternance ou un stage : les offres de plusieurs sources (France Travail, Adzuna, sites carrières) sont réunies, mises à jour chaque jour et triées selon le profil. Consultation gratuite ; Premium à 7,99 €/mois sans engagement ou 39,99 € à vie pour liker, candidater, générer une lettre de motivation par IA et faire auditer son CV.",
    `Ce fichier reprend le texte des ${GUIDES.length} guides de ${SITE_URL}/guides. Résumé du site : ${SITE_URL}/llms.txt. Offres par métier et par ville : ${SITE_URL}/alternance et ${SITE_URL}/stage.`,
  ].join("\n\n");
  const body = [header, ...GUIDES.map(guideMarkdown)].join("\n\n---\n\n");
  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
