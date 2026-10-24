import { inboxDomain } from "@/lib/inbox/address";

// La formule Auto n'est proposée (page Premium, proposition au like) que si
// elle peut vraiment servir : colonne premium_tier en base (SQL du 24/10) et
// boîte de candidature configurée (INBOX_DOMAIN dans Vercel). Sinon personne
// ne doit pouvoir payer un envoi automatique qui ne partirait pas.
export function isAutoOfferAvailable(profile: object | null | undefined): boolean {
  return !!profile && "premium_tier" in profile && inboxDomain() !== null;
}
