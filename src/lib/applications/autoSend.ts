// Réponse de /api/applications/auto-send (un fichier route.ts ne peut
// exporter que ses méthodes HTTP et sa configuration).

// « email » : envoi direct à l'adresse publiée par l'entreprise.
// « lba » : candidature transmise par La bonne alternance (service public,
// gratuit), qui l'envoie elle-même au recruteur.
export type AutoSendChannel = "email" | "lba";

export type AutoSendResult =
  | { status: "ready"; company: string; to: string; channel: AutoSendChannel; sentToday: number; limit: number }
  | { status: "sent"; company: string; to: string; from: string; sentToday: number; limit: number; channel: AutoSendChannel }
  | {
      status: "manual";
      reason: AutoSendManualReason;
      company?: string;
      sentToday?: number;
      limit?: number;
    }
  // Trop d'envois en même temps sur tout Stageio (limite de l'API) : à
  // réessayer dans quelques secondes.
  | { status: "busy"; company?: string }
  | { status: "error"; company?: string };

export type AutoSendManualReason =
  | "no_email"
  | "inbox_off"
  | "lba_off"
  | "no_cv"
  | "cv_too_big"
  | "no_phone"
  | "no_name"
  | "already_sent"
  | "auto_required"
  | "daily_limit"
  | "not_found";

// Infos que l'étudiant peut compléter sur place, au moment du like.
export const FIXABLE_REASONS: AutoSendManualReason[] = ["no_cv", "no_phone", "no_name"];

export const LBA_LABEL = "La bonne alternance";

const parisDay = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const parisHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" });

/** Minuit à Paris le jour de `now`, en ISO : le quota de 100 envois repart chaque jour à 0 h. */
export function parisMidnightIso(now: number): string {
  const day = parisDay.format(now);
  // Décalage de Paris à cet instant (+1 h ou +2 h), lu sur l'heure affichée.
  const offset = (((Number(parisHour.format(now)) - new Date(now).getUTCHours()) % 24) + 24) % 24;
  return new Date(Date.parse(`${day}T00:00:00Z`) - offset * 3600_000).toISOString();
}
