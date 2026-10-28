// API La bonne alternance (api.apprentissage.beta.gouv.fr) : service public
// gratuit qui donne les offres d'alternance de toute la France et transmet
// lui-même les candidatures aux recruteurs par email -- pas de Resend, pas
// d'adresse de recruteur à connaître (15/10, demande de Nathan : une solution
// 100 % gratuite). Jeton LBA_API_KEY (Bearer) ; l'envoi demande en plus
// l'habilitation « applications:write », accordée sur demande.
// Routes et schémas lus dans le SDK officiel (paquet npm api-alternance-sdk
// 2.18.0) : GET /job/v1/search, POST /job/v1/apply.

// LBA_API_URL : autre adresse de l'API (aperçu local avec un faux serveur), jamais réglée en production.
const API_URL = process.env.LBA_API_URL?.trim() || "https://api.apprentissage.beta.gouv.fr/api";

// Limites de débit de l'API, par consommateur (donc pour tout Stageio).
export const SEARCH_CALLS_PER_MINUTE = 60;
export const APPLY_CALLS_PER_MINUTE = 10;
// CV en pièce jointe : PDF ou DOCX, 3 Mo maximum.
export const MAX_CV_BYTES = 3 * 1024 * 1024;

export function lbaApiKey(): string | null {
  return process.env.LBA_API_KEY?.trim() || null;
}

type LbaWorkplace = {
  name: string | null;
  description: string | null;
  website: string | null;
  siret: string | null;
  location: { address: string };
  brand: string | null;
  legal_name: string | null;
  size: string | null;
  domain: { naf: { code: string; label: string | null } | null } | null;
};

type LbaApply = {
  url: string;
  phone: string | null;
  // Présent quand La bonne alternance connaît l'email du recruteur : on peut
  // alors lui envoyer la candidature par l'API.
  recipient_id?: string | null;
};

export type LbaJob = {
  identifier: { partner_job_id: string; id: string | null; partner_label: string };
  workplace: LbaWorkplace;
  apply: LbaApply;
  contract: {
    start: string | null;
    duration: number | null;
    type: string[];
    remote: "onsite" | "remote" | "hybrid" | null;
  };
  offer: {
    title: string;
    description: string;
    desired_skills: string[];
    to_be_acquired_skills: string[];
    access_conditions: string[];
    publication: { creation: string | null; expiration: string | null };
    target_diploma: { european: "3" | "4" | "5" | "6" | "7"; label: string } | null;
    status: "Active" | "Filled" | "Cancelled";
  };
};

export type LbaApplication = {
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_attachment_name: string;
  // « data:application/pdf;base64,… »
  applicant_attachment_content: string;
  applicant_message: string | null;
  recipient_id: string;
};

export class LbaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Clé de production (LBA_API_KEY) par défaut ; une clé sandbox peut être
// passée explicitement (test depuis /admin/la-bonne-alternance : tout part
// alors vers l'environnement de recette de La bonne alternance).
async function call(path: string, init: { method: "GET" | "POST"; body?: unknown; key?: string }): Promise<unknown> {
  const key = init.key ?? lbaApiKey();
  if (!key) throw new LbaError("LBA_API_KEY manquant", 0);
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const text = await res.text();
  if (!res.ok) throw new LbaError(`HTTP ${res.status} ${text.slice(0, 300)}`, res.status);
  return text ? JSON.parse(text) : null;
}

// Offres d'un département (150 au plus par source : La bonne alternance,
// France Travail, partenaires).
export async function searchLbaJobs(departement: string, key?: string): Promise<LbaJob[]> {
  const params = new URLSearchParams({ departements: departement });
  const data = (await call(`/job/v1/search?${params}`, { method: "GET", key })) as { jobs?: LbaJob[] } | null;
  return data?.jobs ?? [];
}

// Entreprises qui n'ont pas publié d'offre mais sont susceptibles de
// recruter des alternants dans le métier cherché (« recruiters » de la même
// recherche, 150 au plus) : cibles des candidatures spontanées (28/10). Il
// faut un domaine (codes ROME) et une zone (coordonnées et rayon, ou
// département). apply.recipient_id présent = l'API sait leur transmettre une
// candidature.
export type LbaRecruiter = {
  identifier: { id: string };
  workplace: LbaWorkplace;
  apply: LbaApply;
};

export async function searchLbaRecruiters(
  params: { romes: string[]; latitude?: number; longitude?: number; radius?: number; departement?: string },
  key?: string,
): Promise<LbaRecruiter[]> {
  const query = new URLSearchParams({ romes: params.romes.join(",") });
  if (params.latitude !== undefined && params.longitude !== undefined) {
    query.set("latitude", String(params.latitude));
    query.set("longitude", String(params.longitude));
    query.set("radius", String(params.radius ?? 30));
  } else if (params.departement) {
    query.set("departements", params.departement);
  }
  const data = (await call(`/job/v1/search?${query}`, { method: "GET", key })) as { recruiters?: LbaRecruiter[] } | null;
  return data?.recruiters ?? [];
}

export async function sendLbaApplication(application: LbaApplication, key?: string): Promise<{ id: string }> {
  return (await call("/job/v1/apply", { method: "POST", body: application, key })) as { id: string };
}
