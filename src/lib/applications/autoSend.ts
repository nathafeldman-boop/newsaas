// Réponse de /api/applications/auto-send (un fichier route.ts ne peut
// exporter que ses méthodes HTTP et sa configuration).

// « email » : envoi direct à l'adresse publiée par l'entreprise.
// « lba » : candidature transmise par La bonne alternance (service public,
// gratuit), qui l'envoie elle-même au recruteur.
export type AutoSendChannel = "email" | "lba";

export type AutoSendResult =
  | { status: "ready"; company: string; to: string; channel: AutoSendChannel }
  | { status: "sent"; company: string; to: string; from: string; sentLast24h: number; channel: AutoSendChannel }
  | {
      status: "manual";
      reason: AutoSendManualReason;
      company?: string;
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
  | "premium_required"
  | "not_found";

// Infos que l'étudiant peut compléter sur place, au moment du like.
export const FIXABLE_REASONS: AutoSendManualReason[] = ["no_cv", "no_phone", "no_name"];

// Au-delà, l'avertissement rappelle le risque d'être vu comme un envoi de
// masse (pas de plafond : choix de Nathan).
export const AUTO_SEND_WARNING_THRESHOLD = 20;

export const LBA_LABEL = "La bonne alternance";
