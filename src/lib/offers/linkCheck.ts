import { fetchFranceTravailOfferStatus } from "@/lib/franceTravail/client";

// Lien de candidature encore valable ? (29/10, satisfaction : « Toutes les
// offres ne sont plus disponibles, je souhaite un remboursement », « on me
// dit l'offre n'est plus disponible ou erreur », motifs de résiliation
// Stripe des 25 et 26/10). Vérifié quand un étudiant signale une offre :
// - « dead » : la source dit qu'elle n'existe plus (France Travail par son
//   API ; ailleurs, erreur 404/410 ou un titre de page qui le dit) ;
// - « suspect » : la page le laisse entendre dans son texte ;
// - « alive » / « unknown » (site lent, bloqué, erreur serveur) : on ne
//   retire jamais une offre sur un doute.

export type LinkVerdict = "dead" | "suspect" | "alive" | "unknown";

const DEAD_TEXT = [
  /n['’]est plus (disponible|en ligne|active)/i,
  /offre (a été )?(expirée|pourvue|clôturée|supprimée)/i,
  /annonce (a été )?(expirée|pourvue|clôturée|supprimée|désactivée)/i,
  /no longer (available|accepting applications|active)/i,
  /(job|position|posting) (has )?(expired|been filled|is closed)/i,
];

/** Lien public http(s) vers un nom de domaine (jamais une IP ni un hôte local). */
export function isCheckableUrl(raw: string | null | undefined): raw is string {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":")) return false;
    return true;
  } catch {
    return false;
  }
}

/** Verdict d'une page déjà lue (fonction pure, testable). */
export function verdictFromPage(status: number, html: string): LinkVerdict {
  if (status === 404 || status === 410) return "dead";
  if (status < 200 || status >= 300) return "unknown";
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? "";
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]?.replace(/<[^>]+>/g, " ") ?? "";
  if (DEAD_TEXT.some((re) => re.test(title) || re.test(h1))) return "dead";
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .slice(0, 60_000);
  return DEAD_TEXT.some((re) => re.test(text)) ? "suspect" : "alive";
}

export async function checkOfferLink(offer: { source: string; external_id: string | null; apply_url: string | null }): Promise<LinkVerdict> {
  if (offer.source === "france_travail" && offer.external_id) {
    const status = await fetchFranceTravailOfferStatus(offer.external_id, 4000);
    return status === "gone" ? "dead" : status === "live" ? "alive" : "unknown";
  }
  if (!isCheckableUrl(offer.apply_url)) return "unknown";
  try {
    const res = await fetch(offer.apply_url, {
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StageioLinkCheck/1.0; +https://www.stageio.fr)", Accept: "text/html" },
    });
    const html = (await res.text().catch(() => "")).slice(0, 300_000);
    return verdictFromPage(res.status, html);
  } catch {
    return "unknown";
  }
}
