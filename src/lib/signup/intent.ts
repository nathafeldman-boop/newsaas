import { slugify } from "@/lib/offers/segments";
import { TOP_CITIES } from "@/lib/onboarding/options";
import { CITY_COORDINATES } from "@/lib/seo/cityCoordinates";
import { getMetier, type Metier } from "@/lib/seo/metiers";
import { cityPhrase } from "@/lib/seo/programmaticIndex";
import type { ContractType } from "@/types/database";

// Inscription contextuelle : depuis « Alternance commercial à Lyon », le
// bouton mène à /inscription?type=alternance&metier=commercial&ville=Lyon,
// qui reprend ce contexte dans son accroche et pré-remplit la ville de
// l'onboarding. Les paramètres viennent de l'URL : seuls un type connu, un
// métier de la taxonomie et une ville de la liste des villes principales
// sont repris, jamais un texte arbitraire affiché tel quel.

export type SignupIntent = { type: ContractType | null; metier: Metier | null; city: string | null };

const KNOWN_CITY_SLUGS = new Set([...Object.keys(CITY_COORDINATES), ...TOP_CITIES.map(slugify)]);

export function signupHref(intent: { type?: ContractType | null; metier?: string | null; city?: string | null }): string {
  const params = new URLSearchParams();
  if (intent.type) params.set("type", intent.type);
  if (intent.metier) params.set("metier", intent.metier);
  if (intent.city && KNOWN_CITY_SLUGS.has(slugify(intent.city))) params.set("ville", intent.city);
  const query = params.toString();
  return query ? `/inscription?${query}` : "/inscription";
}

export function resolveSignupIntent(params: { type?: string; metier?: string; ville?: string }): SignupIntent {
  const type = params.type === "alternance" || params.type === "stage" ? params.type : null;
  const metier = params.metier ? (getMetier(params.metier) ?? null) : null;
  const ville = params.ville?.trim() ?? "";
  // Majuscule initiale et longueur bornée en plus de la liste : « lYoN » ou
  // un texte de 200 caractères ne s'affichent pas.
  const city = ville.length <= 40 && /^\p{Lu}/u.test(ville) && KNOWN_CITY_SLUGS.has(slugify(ville)) ? ville : null;
  return { type, metier, city };
}

const OFFERS: Record<ContractType, string> = { alternance: "offres d'alternance", stage: "offres de stage" };

// Barre d'inscription des pages publiques (voir StickySignupBar) : toujours
// un texte, générique sans contexte.
export function signupBarText(intent: SignupIntent): string {
  const what = intent.type ? OFFERS[intent.type] : "offres d'alternance et de stage";
  const parts = [`Reçois les nouvelles ${what}`];
  if (intent.metier) parts.push(intent.metier.domain);
  if (intent.city) parts.push(cityPhrase(intent.city));
  return `${parts.join(" ")} dès leur publication. Gratuit.`;
}

// Accroche de la page d'inscription, null sans contexte (accroche générique).
export function signupHeadline(intent: SignupIntent): string | null {
  if (!intent.type && !intent.metier && !intent.city) return null;
  const what = intent.type ? OFFERS[intent.type] : "offres d'alternance et de stage";
  const parts = [`Les nouvelles ${what}`];
  if (intent.metier) parts.push(intent.metier.domain);
  if (intent.city) parts.push(cityPhrase(intent.city));
  return `${parts.join(" ")} arrivent dans ton fil dès leur publication.`;
}
