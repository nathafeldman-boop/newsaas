// Client pour l'API officielle "Offres d'emploi v2" de France Travail
// (ex-Pôle Emploi, https://francetravail.io/data/api/offres-emploi) --
// gratuite, volume très supérieur à Adzuna (des centaines de milliers
// d'offres, vs un plan Trial Adzuna limité à quelques centaines d'appels/
// mois) : source principale visée pour dépasser 10 000 offres actives
// (demande du 28/09). Authentification OAuth2 client_credentials
// (machine-to-machine), contrairement à Adzuna (simple app_id/app_key en
// query string).
//
// ATTENTION : les noms de champs de la réponse JSON (intitule, entreprise,
// lieuTravail, etc.) et le format exact ci-dessous sont basés sur la
// documentation publique et plusieurs implémentations tierces, PAS vérifiés
// contre un vrai appel depuis ce sandbox (francetravail.io est bloqué par le
// proxy réseau de cet environnement de dev). Nathan doit créer un compte sur
// francetravail.io, souscrire son application à "Offres d'emploi v2", puis
// vérifier via les logs du premier vrai run de sync-france-travail (voir
// route.ts) que le mapping tient -- tout champ manquant/renommé loggue une
// erreur claire au lieu d'échouer en silence (voir mapOffer.ts).

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";
const SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const SCOPE = "api_offresdemploiv2 o2dsoffre";

// Fenêtre max par requête (documentée : Range max jusqu'à 1000-1149, donc
// ~1150 résultats accessibles par combinaison de mots-clés avant d'avoir
// besoin de segmenter davantage -- voir sync-france-travail/route.ts).
export const PAGE_SIZE = 150;
export const MAX_RANGE_END = 1149;

// Limite de l'API : 3 appels par seconde par application, au-delà HTTP 429.
// Les synchros lancent plusieurs recherches en parallèle (jusqu'à 4 pour la
// synchro par département) : tous les appels de recherche passent par cette
// file, espacés d'au moins 350 ms (~2,9 par seconde).
const MIN_INTERVAL_MS = 350;
let nextSlot = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

const MAX_429_RETRIES = 3;

function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = Number(res.headers.get("Retry-After"));
  return Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 1000 * (attempt + 1);
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

// Un seul jeton demandé à la fois, même quand plusieurs recherches démarrent
// ensemble.
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 5000) {
    return cachedToken.value;
  }
  if (!pendingToken) {
    pendingToken = fetchAccessToken().finally(() => {
      pendingToken = null;
    });
  }
  return pendingToken;
}

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET non configurés.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: SCOPE,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`France Travail auth HTTP ${res.status} : ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cachedToken.value;
}

export interface FranceTravailJob {
  id: string;
  intitule: string;
  description: string;
  dateCreation: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string };
  salaire?: { libelle?: string };
  typeContratLibelle?: string;
  origineOffre?: { urlOrigine?: string };
  contact?: { urlPostulation?: string };
}

interface SearchResult {
  jobs: FranceTravailJob[];
  totalResults: number | null;
}

// rangeStart/rangeEnd : bornes de la fenêtre demandée (voir PAGE_SIZE côté
// appelant). 200 = page complète, 206 = page partielle (fin de résultats
// atteinte) -- les deux sont un succès, 204 = aucun résultat pour cette
// requête.
// `departement` (code "75", "2A", "971") : contourne le plafond de ~1 150
// résultats par recherche en découpant par département (voir
// sync-france-travail-departements).
export async function searchFranceTravailPage(
  what: string,
  rangeStart: number,
  rangeEnd: number,
  departement?: string,
): Promise<SearchResult> {
  const token = await getAccessToken();

  const url = new URL(SEARCH_URL);
  url.searchParams.set("motsCles", what);
  if (departement) url.searchParams.set("departement", departement);

  let res: Response;
  for (let attempt = 0; ; attempt++) {
    await throttle();
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Range: `offres=${rangeStart}-${rangeEnd}`,
      },
    });
    if (res.status !== 429 || attempt >= MAX_429_RETRIES) break;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs(res, attempt)));
  }

  if (res.status === 204) return { jobs: [], totalResults: 0 };

  if (!res.ok && res.status !== 206) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `France Travail HTTP ${res.status} (what="${what}"${departement ? `, departement=${departement}` : ""}, range ${rangeStart}-${rangeEnd}) : ${text.slice(0, 300)}`,
    );
  }

  const json = (await res.json()) as { resultats?: FranceTravailJob[] };
  const contentRange = res.headers.get("Content-Range");
  // Format documenté : "offres START-END/TOTAL".
  const totalResults = contentRange ? Number(contentRange.split("/")[1]) || null : null;

  return { jobs: json.resultats ?? [], totalResults };
}
