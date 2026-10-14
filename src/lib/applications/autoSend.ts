// Réponse de /api/applications/auto-send (un fichier route.ts ne peut
// exporter que ses méthodes HTTP et sa configuration).
export type AutoSendResult =
  | { status: "ready"; company: string; to: string }
  | { status: "sent"; company: string; to: string; from: string; sentLast24h: number }
  | {
      status: "manual";
      reason: AutoSendManualReason;
      company?: string;
    }
  | { status: "error"; company?: string };

export type AutoSendManualReason =
  | "no_email"
  | "no_gmail"
  | "gmail_reconnect"
  | "no_cv"
  | "already_sent"
  | "premium_required"
  | "not_found";

// Au-delà, l'avertissement rappelle les limites de Gmail et le risque
// d'être vu comme un envoi de masse (pas de plafond : choix de Nathan).
export const AUTO_SEND_WARNING_THRESHOLD = 20;
