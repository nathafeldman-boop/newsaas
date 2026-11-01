import { FORMAT_LABELS, type LinkedinFormat } from "@/lib/linkedin/formats";

// Texte des publications LinkedIn. Volontairement SANS IA : chaque ligne est
// assemblée à partir des champs de l'offre (intitulé, entreprise, ville,
// durée), jamais réécrite. Un modèle de langue améliorerait le style mais
// pourrait inventer un salaire, une date ou un avantage -- or tout ce qui
// est publié doit être exact et vérifiable sur la fiche.
//
// LinkedIn n'interprète pas le Markdown : texte brut, emojis comme repères
// visuels, une ligne vide entre les offres. Limite LinkedIn : 3 000 caractères.

export const LINKEDIN_MAX_CHARS = 3000;

export type PostOffer = {
  id: string;
  title: string;
  company: string;
  city: string;
  duration: string | null;
  /** Lien absolu vers la fiche Stageio, UTM compris. */
  url: string;
};

export type ComposeInput = {
  format: LinkedinFormat;
  /** Libellé du secteur ou de la ville (formats « secteur » / « ville »). */
  segment: string | null;
  offers: PostOffer[];
  /** Lien de la page « toutes les offres » (UTM compris). */
  moreUrl: string;
  /** Hashtag propre au secteur (« #marketing »), ou null. */
  extraHashtag: string | null;
  /** Date de vérification affichée dans le post. */
  checkedAt: Date;
  /** Toutes les offres confirmées en ligne à la source à l'instant. */
  allVerified: boolean;
  /** Liens des offres dans le premier commentaire plutôt que dans le post. */
  linksInComment: boolean;
};

export type ComposedPost = { body: string; firstComment: string | null };

const NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

function frDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
}

function frTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
}

const TITLE_SMALL_WORDS = new Set(["de", "des", "du", "la", "le", "les", "et", "en", "au", "aux", "sur", "pour", "a", "à", "d", "l", "un", "une", "chez", "dans"]);
const TITLE_ACRONYMS = new Set(["RH", "SEO", "SEA", "IT", "BTS", "BUT", "CRM", "B2B", "B2C", "UX", "UI", "PME", "QHSE", "HSE", "IA", "SI", "ERP", "SAP", "CAP", "DCG", "RP", "TPE", "BTP", "MCO", "NDRC", "GPME", "SIO", "WEB"]);

/** Intitulé tout en capitales -> casse de phrase, sigles connus conservés. Le sens ne change pas. */
function sentenceCase(title: string): string {
  const letters = title.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 6 || letters !== letters.toUpperCase()) return title;
  return title
    .split(/(\s+|\/|-|\(|\))/)
    .map((w, i) => {
      if (TITLE_ACRONYMS.has(w.toUpperCase()) && w !== "A") return w.toUpperCase() === "WEB" ? "web" : w.toUpperCase();
      const lower = w.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : TITLE_SMALL_WORDS.has(lower) ? lower : lower;
    })
    .join("");
}

/**
 * « Assistant / Assistante RH (H/F) » -> « Assistant / Assistante RH » : la
 * mention (H/F) prend de la place sans rien apprendre au lecteur. Gère aussi
 * « H/F/NB », « F/H », les doublons (« (H/F (H/F) ») et le tout-capitales.
 */
export function cleanTitle(title: string): string {
  const stripped = title
    .replace(/[([]?\s*\b(h\s*\/\s*f|f\s*\/\s*h|h\s*-\s*f|f\s*-\s*h)(\s*\/\s*(nb|x|h|f))*\b\s*[)\]]?/gi, " ")
    .replace(/[([]\s*[)\]]/g, " ")
    .replace(/\s*[([]\s*$/g, "")
    .replace(/\s+[-–—]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return sentenceCase(stripped);
}

/**
 * Raison sociale telle que publiée par France Travail, sans retouche de casse :
 * « Saint-Gobain » ou « McDonald's » ne se devinent pas depuis des capitales,
 * et un nom d'entreprise faux est pire qu'un nom en majuscules.
 */
export function displayCompany(company: string): string {
  return company.trim().replace(/\s+/g, " ");
}

function hook(input: ComposeInput): { headline: string; intro: string } {
  const n = input.offers.length;
  const offres = n > 1 ? `${n} alternances` : "1 alternance";
  switch (input.format) {
    case "jour":
      return {
        headline: `🎓 ${offres} ajoutée${n > 1 ? "s" : ""} aujourd'hui sur Stageio`,
        intro: "Tu cherches encore ton alternance ? Voici les dernières offres arrivées sur Stageio 👇",
      };
    case "secteur":
      return {
        headline: `🎯 Alternance en ${(input.segment ?? "").toLowerCase()} : ${offres} à saisir`,
        intro: `Tu vises une alternance en ${(input.segment ?? "").toLowerCase()} ? Voici des offres récentes, encore en ligne 👇`,
      };
    case "ville":
      return {
        headline: `📍 Alternance à ${input.segment ?? ""} : ${offres} en ce moment`,
        intro: `Tu cherches une alternance à ${input.segment ?? ""} ? Voici des offres récentes, encore en ligne 👇`,
      };
    case "hebdo":
      return {
        headline: `📌 Les ${offres} à ne pas rater cette semaine`,
        intro: "Chaque vendredi, notre sélection des offres d'alternance les plus complètes de la semaine 👇",
      };
  }
}

function offerBlock(offer: PostOffer, index: number, withLink: boolean): string {
  const facts = [`🏢 ${displayCompany(offer.company)}`, `📍 ${offer.city}`, "Alternance"];
  if (offer.duration) facts.push(offer.duration);
  const lines = [`${NUMBERS[index] ?? `${index + 1}.`} ${cleanTitle(offer.title)}`, facts.join(" · ")];
  if (withLink) lines.push(`🔗 ${offer.url}`);
  return lines.join("\n");
}

function hashtags(input: ComposeInput): string {
  const tags = ["#alternance", "#recrutement", "#etudiant"];
  if (input.extraHashtag) tags.push(input.extraHashtag);
  if (input.format === "ville" && input.segment) {
    tags.push(`#${input.segment.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "")}`);
  }
  return tags.join(" ");
}

export function composePost(input: ComposeInput): ComposedPost {
  const { headline, intro } = hook(input);
  const blocks = input.offers.map((o, i) => offerBlock(o, i, !input.linksInComment));
  // « Vérifiées » seulement si la source a confirmé chaque offre : si l'API
  // France Travail n'a pas répondu pour l'une d'elles, on ne l'affirme pas.
  const when = `le ${frDate(input.checkedAt)} à ${frTime(input.checkedAt)}`;
  const verified = input.allVerified
    ? `✅ Offres vérifiées ${when}. Source des annonces : France Travail.`
    : `Offres en ligne sur Stageio ${when}. Source des annonces : France Travail.`;

  const body = [
    headline,
    intro,
    ...blocks,
    input.linksInComment ? "🔗 Les liens pour postuler sont en commentaire." : null,
    `👉 Toutes les offres : ${input.moreUrl}`,
    verified,
    "♻️ Partage ce post à quelqu'un qui cherche son alternance.",
    hashtags(input),
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n\n");

  const firstComment = input.linksInComment
    ? ["Les liens pour postuler 👇", ...input.offers.map((o, i) => `${NUMBERS[i] ?? `${i + 1}.`} ${cleanTitle(o.title)} : ${o.url}`)].join("\n")
    : null;

  return { body, firstComment };
}

/** Titre court pour l'historique et le visuel. */
export function postTitle(format: LinkedinFormat, segment: string | null): string {
  if (format === "secteur" && segment) return `Alternance ${segment.toLowerCase()}`;
  if (format === "ville" && segment) return `Alternance à ${segment}`;
  return FORMAT_LABELS[format];
}

/** utm_campaign lisible dans /admin/trafic : « jour-20261101 », « secteur-marketing-20261101 ». */
export function utmCampaign(format: LinkedinFormat, segmentKey: string | null, date: Date): string {
  const ymd = date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).replace(/-/g, "");
  return [format, segmentKey, ymd].filter(Boolean).join("-");
}

export function withUtm(absoluteUrl: string, campaign: string): string {
  const u = new URL(absoluteUrl);
  u.searchParams.set("utm_source", "linkedin");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
