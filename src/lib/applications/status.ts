import type { ApplicationStatus } from "@/types/database";

// Statuts de candidature (24/10, mission churn) : une seule source pour les
// libellés, les groupes du tableau de suivi et la date de relance.
//
// Avant : ouvrir la page d'une offre enregistrait la candidature comme
// « envoyée », même si l'étudiant n'avait rien envoyé. Désormais elle naît
// « à envoyer » et ne passe à « envoyée » que quand il le confirme.
// "a_preparer" et "cloturee" demandent le SQL du 24/10 (alter type) : tant
// qu'il n'est pas lancé, Postgres refuse ces valeurs (22P02) : la création
// retombe sur l'ancien « envoyée », un changement manuel affiche une erreur.

export const STATUS_ORDER: ApplicationStatus[] = ["a_preparer", "envoyee", "en_cours", "entretien", "acceptee", "refusee", "cloturee"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  a_preparer: "À envoyer",
  envoyee: "Envoyée",
  en_cours: "En cours d'échange",
  entretien: "Entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
  cloturee: "Clôturée",
};

export const STATUS_HINTS: Record<ApplicationStatus, string> = {
  a_preparer: "Lettre prête, candidature pas encore envoyée",
  envoyee: "En attente de réponse",
  en_cours: "Le recruteur t'a répondu, ça avance",
  entretien: "Entretien prévu ou passé",
  acceptee: "Réponse positive",
  refusee: "Réponse négative",
  cloturee: "Abandonnée ou offre pourvue",
};

export type StatusGroupKey = "todo" | "waiting" | "interview" | "done";

export const STATUS_GROUPS: { key: StatusGroupKey; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "todo", label: "À envoyer", statuses: ["a_preparer"] },
  { key: "waiting", label: "En attente", statuses: ["envoyee", "en_cours"] },
  { key: "interview", label: "Entretiens", statuses: ["entretien"] },
  { key: "done", label: "Terminées", statuses: ["acceptee", "refusee", "cloturee"] },
];

export function statusGroup(status: ApplicationStatus): StatusGroupKey {
  return STATUS_GROUPS.find((g) => g.statuses.includes(status))?.key ?? "waiting";
}

export const isTerminalStatus = (status: ApplicationStatus) => status === "acceptee" || status === "refusee" || status === "cloturee";

/** Statuts qui veulent dire « la candidature est partie ». */
export const isSentStatus = (status: ApplicationStatus) => status !== "a_preparer" && status !== "cloturee";

export const FOLLOW_UP_DAYS = 7;
const DAY_MS = 86_400_000;

type FollowUpFields = { status: ApplicationStatus; applied_at: string; sent_at?: string | null; follow_up_at?: string | null };

/**
 * Date de relance : celle choisie par l'étudiant, sinon 7 jours après
 * l'envoi (ou après l'ajout au suivi, pour les candidatures d'avant le
 * 24/10 qui n'ont pas de date d'envoi). Seulement pour une candidature
 * envoyée sans réponse : à envoyer, entretien ou terminée, rien à relancer.
 */
export function followUpAt(app: FollowUpFields): number | null {
  if (app.status !== "envoyee" && app.status !== "en_cours") return null;
  if (app.follow_up_at) return Date.parse(app.follow_up_at);
  return Date.parse(app.sent_at ?? app.applied_at) + FOLLOW_UP_DAYS * DAY_MS;
}

export function isFollowUpDue(app: FollowUpFields, now: number): boolean {
  const at = followUpAt(app);
  return at !== null && at <= now;
}

// Codes d'erreur Postgres / PostgREST pour le repli tant que le SQL du
// 24/10 n'est pas lancé.
export const isInvalidEnumError = (error: { code?: string } | null) => error?.code === "22P02";
export const isMissingColumnError = (error: { code?: string; message?: string } | null) =>
  error?.code === "42703" || error?.code === "PGRST204" || /column .* does not exist|Could not find the '.*' column/i.test(error?.message ?? "");

/** Heure de la requête, lue hors du rendu des composants (règle de pureté React). */
export function requestNow(): number {
  return Date.now();
}
