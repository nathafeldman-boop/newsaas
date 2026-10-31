import type { Offer, Profile } from "@/types/database";
import { classifyMetier } from "@/lib/seo/metiers";
import { METIER_PACKS, type MetierPack } from "@/lib/coverLetter/metierPacks";
import { DEFAULT_VOICE, METIER_VOICES } from "@/lib/coverLetter/metierVoice";
import { afterColon, companyName, de, displayKeyword, offerKeywords, posteLabel, sentence, type MetierLetterStyle } from "@/lib/coverLetter/metierLetter";
import { cleanCity, extractMissions, extractRythme, extractStartDate, sameCity } from "@/lib/coverLetter/offerDetails";

// Lettre sur mesure (31/10, Nathan : « la lettre […] était ultra générique
// […] régénère des templates ultra bien adaptés »). Sans IA, assemblée à
// partir de ce qu'on sait vraiment :
// - l'annonce : ses missions écrites telles quelles (« vous cherchez
//   quelqu'un pour accueillir et conseiller la clientèle »), ses mots-clés,
//   sa ville, sa date de début et son rythme ;
// - le métier (60 voix, metierVoice.ts) : 3 accroches, ce qu'un débutant
//   prend en main, ce qu'il faut raconter, une fin de lettre concrète ;
// - le profil : formation, compétences, ville, date de disponibilité.
// Deux modes :
// - « assist » (écran de candidature) : ce qu'on ne sait pas reste entre
//   crochets, avec un exemple, et l'écran liste ces passages ;
// - « auto » (Stageio Auto, envoyée telle quelle) : aucun crochet, aucune
//   expérience inventée ; ce qu'on ne sait pas est simplement omis.

export type LetterMode = "assist" | "auto";

type OfferInput = Pick<Offer, "title" | "company" | "description" | "requirements" | "contract_type"> &
  Partial<Pick<Offer, "location" | "start_date">>;
type ProfileInput =
  | (Pick<Profile, "full_name" | "formation"> & Partial<Pick<Profile, "city" | "skills" | "availability_date" | "mobility">>)
  | null;
type Extra = { achievement?: string; whyCompany?: string };

const DEFAULT_PACK: MetierPack = {
  missions: "prendre en charge les missions du poste et gagner en autonomie au contact de l'équipe",
  skills: ["organisation", "communication", "travail en équipe"],
  motive: "Je veux apprendre un métier sur le terrain, au contact de personnes qui le pratiquent tous les jours.",
  keywords: [],
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Tirage stable : la même lettre pour la même offre et le même essai.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pick = <T,>(list: readonly T[], seed: number, salt: number) => list[(seed + salt * 7) % list.length];

function joinMissions(m: string[]): string {
  if (m.length < 2) return m[0] ?? "";
  return / et /.test(m[0]) ? `${m[0]}, et ${m[1]}` : `${m[0]} et ${m[1]}`;
}

function listFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** « dès maintenant » ou « à partir du 15 septembre 2026 », d'après la date de disponibilité du profil. */
function availabilityPhrase(date: string | null | undefined, now: number): string | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return null;
  return t <= now ? "dès maintenant" : `à partir du ${dateFmt.format(t)}`;
}

export function generateTailoredLetter(
  offer: OfferInput,
  profile: ProfileInput,
  opts: { style: MetierLetterStyle; mode: LetterMode; seed?: number; extra?: Extra; now?: number },
): string {
  const { style, mode, extra } = opts;
  const assist = mode === "assist";
  const now = opts.now ?? Date.now();
  const slug = classifyMetier(offer.title)?.slug ?? null;
  const pack = (slug && METIER_PACKS[slug]) || DEFAULT_PACK;
  const voice = (slug && METIER_VOICES[slug]) || DEFAULT_VOICE;
  const seed = hash(`${offer.title}|${offer.company}|${profile?.full_name ?? ""}|${opts.seed ?? 0}`);

  const alternance = offer.contract_type === "alternance";
  const contrat = alternance ? "en alternance" : "en stage";
  const poste = posteLabel(offer.title, offer.contract_type);
  const entreprise = companyName(offer.company);
  const city = cleanCity(offer.location);
  // « Mairie de Rennes, à Rennes » : la ville n'est pas répétée.
  const cityPart = city && !fold(entreprise).includes(fold(city)) ? `, à ${city}` : "";
  const text = `${offer.description ?? ""}\n${offer.requirements ?? ""}`;
  const missions = extractMissions(text);
  // Mots-clés de l'annonce, sauf ceux déjà repris dans les missions citées.
  const keywords = offerKeywords(pack, `${offer.title} ${text}`, 3)
    .filter((k) => !missions.some((m) => fold(m).includes(fold(k))))
    .slice(0, 2);
  const startDate = extractStartDate(text, offer.start_date ?? null, now);
  const rythme = alternance ? extractRythme(text) : null;

  const formation = profile?.formation?.trim() || null;
  const formationClause = formation
    ? alternance
      ? `, en parallèle de ma formation en ${formation}`
      : `, en complément de ma formation en ${formation}`
    : assist
      ? `, ${alternance ? "en parallèle" : "en complément"} de ma formation en [ta formation, par ex. BTS, BUT ou bachelor]`
      : "";

  // 1. Accroche et poste visé.
  const hook = pick([pack.motive, ...voice.hooks], seed, 0);
  const intro =
    style === "classique"
      ? `${hook} ${pick(
          [
            `C'est pour cela que je vous adresse ma candidature au poste ${de(poste)} ${contrat} chez ${entreprise}${cityPart}.`,
            `Je vous propose donc ma candidature au poste ${de(poste)} ${contrat} chez ${entreprise}${cityPart}.`,
          ],
          seed,
          1,
        )}`
      : `Je vous écris au sujet de votre offre ${de(poste)} ${contrat} chez ${entreprise}${cityPart}. ${hook}`;

  // 2. Les missions de l'annonce (sinon celles du métier) et ce que je prends en main tout de suite.
  const learn = missions.length
    ? pick(
        [
          `Dans votre annonce, vous cherchez quelqu'un pour ${joinMissions(missions)} : c'est précisément ce que je veux apprendre à faire${formationClause}.`,
          `Vous cherchez quelqu'un pour ${joinMissions(missions)}. C'est exactement le travail que je veux apprendre${formationClause}.`,
        ],
        seed,
        2,
      )
    : `${alternance ? "En alternance" : "Pendant ce stage"}, je veux apprendre à ${pack.missions}${formationClause}.`;
  const early = `Dès les premières semaines, je pourrai ${voice.early}, puis gagner en autonomie.`;

  // 3. Compétences visées, mots-clés de l'annonce, ce que j'apporte déjà, une preuve.
  const kwClause = keywords.length ? `, notamment ${keywords.map((k) => `« ${k} »`).join(" et ")}, que vous citez dans votre annonce` : "";
  const skillsLine = `Je veux progresser en ${pack.skills[0]} et en ${pack.skills[1]}${kwClause}.`;
  const owned = (profile?.skills ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    // Pas deux fois la même compétence dans la lettre.
    .filter((s) => !pack.skills.slice(0, 2).some((k) => fold(k) === fold(s)) && !keywords.some((k) => fold(k) === fold(s)))
    .slice(0, 3)
    .map((s) => displayKeyword(s, fold(s)));
  const ownedLine = owned.length ? `J'arrive avec de premiers atouts : ${listFr(owned)}.` : "";
  const achievement = extra?.achievement?.trim().replace(/[.!]+$/, "");
  const proof = achievement
    ? sentence(`Par exemple : ${achievement}`)
    : assist
      ? `[Raconte en deux phrases ${voice.proof}. Dis ce que tu as fait et ce que tu en retiens.]`
      : "";

  // 4. Rythme, date, lieu.
  const avail = availabilityPhrase(profile?.availability_date, now);
  const live = sameCity(profile?.city, city) ? `J'habite à ${city}. ` : "";
  let availability = "";
  if (assist) {
    const date = avail ?? `à partir de [date de début${startDate ? `, l'annonce indique ${startDate}` : ""}]`;
    availability = alternance
      ? `${live}Mon rythme d'alternance : [ton rythme${rythme ? `, l'annonce indique : ${rythme}` : ", par ex. 2 jours en formation et 3 jours en entreprise"}], ${date}.`
      : `${live}Je cherche un stage de [durée du stage], ${date}.`;
  } else if (avail || live) {
    availability = `${live}${avail ? `Je suis disponible ${avail}.` : ""}`.trim();
  }

  // 5. Pourquoi cette entreprise.
  const whyCompany = extra?.whyCompany?.trim()
    ? style === "classique"
      ? `Ce qui m'attire chez ${entreprise} : ${afterColon(extra.whyCompany)}`
      : `Pourquoi ${entreprise} ? ${sentence(extra.whyCompany)}`
    : assist
      ? `[Facultatif mais efficace : une phrase sur ce qui te plaît chez ${entreprise}, par ex. un produit, un lieu que tu connais, une valeur ou une actualité.]`
      : "";

  const name = profile?.full_name?.trim() || (assist ? "[Prénom Nom]" : "");
  const paragraphs =
    style === "classique"
      ? [
          "Madame, Monsieur,",
          intro,
          `${learn} ${early}`,
          [skillsLine, ownedLine, proof].filter(Boolean).join(" "),
          availability,
          whyCompany,
          `${voice.closing} Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.`,
          name,
        ]
      : [
          "Bonjour,",
          intro,
          `${learn} ${early}`,
          [skillsLine, ownedLine, proof].filter(Boolean).join(" "),
          availability,
          whyCompany,
          voice.closing,
          name ? `Bien cordialement,\n${name}` : "Bien cordialement,",
        ];
  return paragraphs.filter((p) => p.trim()).join("\n\n");
}
