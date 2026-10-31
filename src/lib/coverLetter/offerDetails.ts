// Ce qu'une lettre sur mesure reprend de l'annonce (31/10) : les missions
// telles que l'entreprise les écrit (« Accueillir et conseiller la
// clientèle »), la date de début, le rythme et la ville. Lecture prudente :
// une mission n'est reprise que si elle commence par un verbe à l'infinitif
// et tient en une phrase courte ; sinon la lettre parle du métier.

// Une lettre par caractère, sans accents : les positions restent celles du texte d'origine.
const fold = (text: string) =>
  [...text]
    .map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0) || c)
    .join("")
    .toLowerCase();

// Verbes de mission courants dans les annonces (sans accents).
const VERBS = new Set(
  (
    "accueillir conseiller vendre encaisser gerer assurer participer realiser preparer suivre mettre analyser rediger contribuer effectuer " +
    "organiser animer developper concevoir coder tester installer entretenir controler verifier saisir traiter accompagner aider assister " +
    "piloter coordonner creer produire monter tourner nettoyer ranger approvisionner receptionner etiqueter deployer maintenir depanner " +
    "diagnostiquer reparer former informer repondre relancer prospecter negocier fideliser elaborer optimiser superviser etablir collecter " +
    "classer archiver planifier programmer livrer conduire charger decharger fabriquer faconner cuire decouper servir cuisiner soigner nourrir " +
    "surveiller garantir veiller identifier proposer construire poser raccorder cabler souder peindre tailler planter tondre recruter integrer " +
    "administrer securiser auditer modeliser dessiner presenter valoriser promouvoir communiquer publier moderer mesurer consolider facturer " +
    "accompagner apporter representer renseigner orienter conduire tenir appliquer respecter rechercher redresser reporter actualiser " +
    "realiser recenser concevoir integrer animer moderniser ameliorer automatiser documenter rediger traduire calculer chiffrer estimer " +
    "visiter evaluer ecrire filmer photographier illustrer maquetter prototyper usiner regler ajuster nettoyer desinfecter changer remplacer"
  ).split(/\s+/),
);

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_FOLDED = MONTHS.map((m) => fold(m));

function isMissionStart(phrase: string): boolean {
  const first = fold(phrase).split(/[^a-z']+/).find(Boolean) ?? "";
  return VERBS.has(first);
}

function cleanMission(raw: string): string | null {
  let s = raw
    .replace(/^[\s\-–—•*·▪►>✓✔→\d.)]+/, "")
    .replace(/\(\s*h\s*\/\s*f\s*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  // Une phrase : on s'arrête à la première fin de phrase ou parenthèse longue.
  s = s.split(/[.;!?]\s|[.;!?]$|\s[-–—]\s/)[0].trim();
  s = s.replace(/[\s,:;]+$/, "").replace(/\s*etc\.?$/i, "").trim();
  if (!isMissionStart(s) || s.length < 12) return null;
  if (s.length > 110) {
    const cut = s.lastIndexOf(",", 105);
    if (cut < 30) return null;
    s = s.slice(0, cut).trim();
  }
  // « saisir les pièces et de préparer… » : un seul « de » après « pour ».
  s = s.replace(/\s+et\s+d(?:e\s+|')(?=\p{L})/u, " et ");
  // Le point de vue de l'entreprise devient celui du candidat : « nos clients » → « vos clients ».
  s = s
    .replace(/\bnos\b/gi, "vos")
    .replace(/\bnotre\b/gi, "votre")
    .replace(/\bnous\b/gi, "vous");
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Missions de l'annonce, à l'infinitif (« accueillir et conseiller la clientèle »), 2 au plus. */
export function extractMissions(text: string, max = 2): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const m = cleanMission(raw);
    if (!m) return;
    const key = fold(m).slice(0, 40);
    if (seen.has(key)) return;
    seen.add(key);
    found.push(m);
  };
  // 1. Lignes de liste ou lignes qui commencent par un verbe.
  for (const line of text.split(/\n|\r|(?<=[.;])\s+(?=[-–•*·▪])/)) {
    if (found.length >= max) break;
    push(line);
  }
  // 2. Phrases du type « vous serez chargé(e) de … », « vos missions seront de … ».
  if (found.length < max) {
    const folded = fold(text);
    const re =
      /(?:vous (?:serez|seras) (?:amene|charge|en charge)[a-z()]*\s*(?:a|de|d')|vous aurez (?:pour missions? |la charge |a )?(?:de |d'|a )?|vos missions (?:seront|consisteront a|sont|principales seront)\s*(?:de |d'|a |:)?|missions? principales?\s*:\s*)\s*/g;
    let m: RegExpExecArray | null;
    while (found.length < max && (m = re.exec(folded))) {
      const start = m.index + m[0].length;
      push(text.slice(start, start + 160));
    }
  }
  return found.slice(0, max);
}

/** « septembre 2026 » (date de la colonne, sinon écrite dans l'annonce) ; null si rien de clair. */
export function extractStartDate(text: string, startDate: string | null | undefined, now = Date.now()): string | null {
  if (startDate) {
    const d = new Date(startDate);
    if (Number.isFinite(d.getTime()) && d.getTime() > now - 31 * 86_400_000) return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  const folded = fold(text);
  const months = MONTHS_FOLDED.join("|");
  const byMonth = new RegExp(`(?:debut|demarrage|prise de poste|a partir d[eu']?|des |rentree|date de debut|commencer|demarrer)[^.\\n]{0,25}?\\b(${months})\\b(?:\\s+(20\\d\\d))?`).exec(folded);
  if (byMonth) return byMonth[2] ? `${MONTHS[MONTHS_FOLDED.indexOf(byMonth[1])]} ${byMonth[2]}` : MONTHS[MONTHS_FOLDED.indexOf(byMonth[1])];
  const byDate = /(?:debut|demarrage|prise de poste|a partir du|des le|date de debut)[^.\n]{0,15}?(\d{1,2})[/.](\d{1,2})[/.](20\d\d)/.exec(folded);
  if (byDate) {
    const month = Number(byDate[2]);
    if (month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${byDate[3]}`;
  }
  return null;
}

/** Rythme d'alternance écrit dans l'annonce (« 2 jours école / 3 jours entreprise »). */
export function extractRythme(text: string): string | null {
  const folded = fold(text);
  const m = /rythme(?: d'alternance)?\s*(?::|de|-)?\s*([^.\n]{4,70})/.exec(folded);
  if (m && /\d|semaine|jour|mois/.test(m[1])) {
    const start = m.index + m[0].length - m[1].length;
    return text.slice(start, start + m[1].length).trim().replace(/[\s,;:]+$/, "");
  }
  const days = /(\d)\s*(?:jours?|j)\s*(?:en |a l'|d')?(?:ecole|cfa|formation|cours)\s*(?:\/|et|-|,)\s*(\d)\s*(?:jours?|j)\s*(?:en )?entreprise/.exec(folded);
  if (days) return `${days[1]} jours en formation, ${days[2]} jours en entreprise`;
  return null;
}

/** « 69 - LYON 03 » → « Lyon » ; null si le lieu n'est pas une ville lisible. */
export function cleanCity(location: string | null | undefined): string | null {
  if (!location) return null;
  let s = location.split(/[,(]/)[0];
  s = s.replace(/^\s*\d{2,3}\s*[-–]\s*/, "").replace(/\s+\d{1,2}(?:e|er|eme)?(?:\s+arrondissement)?\s*$/i, "").replace(/\s+cedex.*$/i, "").trim();
  if (!s || s.length < 2 || /\d/.test(s) || /teletravail|remote|distance|france|toute/.test(fold(s))) return null;
  const titled = s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase()) : s;
  return titled.replace(/\b(Sur|Sous|En|Les|La|Le|De|Du|Des)\b(?=[\s-])/g, (w, _a, offset: number) => (offset === 0 ? w : w.toLowerCase()));
}

export const sameCity = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && fold(a).trim() === fold(b).trim();
