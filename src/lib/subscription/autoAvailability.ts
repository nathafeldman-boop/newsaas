import { inboxDomain } from "@/lib/inbox/address";

// La formule Auto n'est proposée (page Premium, proposition au like) que si
// elle peut vraiment servir : colonne premium_tier en base (SQL du 24/10) et
// boîte de candidature configurée (INBOX_DOMAIN dans Vercel). Sinon personne
// ne doit pouvoir payer un envoi automatique qui ne partirait pas.
// 26/11 (Nathan : « supprime l'abonnement auto, c'est pour ceux qui l'ont déjà
// pris ») : plus jamais proposée. Les abonnés Auto actuels gardent l'envoi
// automatique (il ne dépend pas de cette fonction).
export const AUTO_ON_SALE = false;

export function isAutoOfferAvailable(profile: object | null | undefined): boolean {
  return AUTO_ON_SALE && !!profile && "premium_tier" in profile && inboxDomain() !== null;
}
