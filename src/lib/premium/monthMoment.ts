// Message du mois avant le paywall (27/11, Nathan : « début décembre c'est le
// moment où les recruteurs cherchent… en janvier tu diras pareil »). Textes
// vrais et prudents : le calendrier connu des recrutements, aucun chiffre inventé.

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const WHY: string[] = [
  "Les entreprises ouvrent leurs recrutements de l'année avec leurs nouveaux budgets, et beaucoup d'écoles font leur rentrée décalée en alternance.",
  "Les entreprises commencent déjà à publier leurs alternances de septembre : ceux qui postulent tôt ont le choix.",
  "C'est le début de la grande période des offres d'alternance pour la rentrée de septembre.",
  "Les offres d'alternance pour septembre arrivent en masse : c'est le moment de candidater partout.",
  "Les entreprises bouclent leurs alternances de septembre : les bonnes places partent maintenant.",
  "Les entreprises finalisent leurs recrutements avant l'été : il reste des places, mais elles partent vite.",
  "Beaucoup d'entreprises recrutent encore pour la rentrée : ceux qui postulent cet été passent avant les autres.",
  "Les dernières places pour la rentrée se jouent maintenant, avant septembre.",
  "C'est la rentrée : les entreprises qui n'ont pas encore trouvé recrutent vite.",
  "Les entreprises qui n'ont pas trouvé en septembre relancent leurs offres, et les rentrées décalées commencent.",
  "Les entreprises préparent leurs recrutements de début d'année et les rentrées décalées de janvier.",
  "Les entreprises bouclent leurs recrutements pour janvier (nouveaux budgets, rentrées décalées en alternance) : c'est maintenant, avant les fêtes.",
];

export type MonthMoment = { label: string; month: number; why: string };

/** « Début décembre », « Mi-janvier »… ; à partir du 25, on parle déjà du mois suivant. */
export function monthMoment(now: Date): MonthMoment {
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  let month = paris.getMonth();
  const day = paris.getDate();
  let prefix: string;
  if (day >= 25) {
    month = (month + 1) % 12;
    prefix = "Début";
  } else prefix = day <= 10 ? "Début" : day <= 20 ? "Mi-" : "Fin";
  const name = MOIS[month];
  const label = prefix === "Mi-" ? `Mi-${name}` : `${prefix} ${name}`;
  return { label, month, why: WHY[month] };
}
