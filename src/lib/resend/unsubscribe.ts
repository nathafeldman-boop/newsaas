import { SITE_URL } from "@/lib/site";

// Désabonnement commun à tous les emails non liés au compte (alertes,
// relances, campagnes) : lien en bas de l'email ET en-têtes List-Unsubscribe,
// qui affichent le bouton « Se désabonner » de Gmail / Yahoo / Outlook à côté
// de l'expéditeur (RFC 8058, POST sur la même URL : voir api/unsubscribe).
// Couper ici met notify_new_offers à false, que toutes ces relances
// respectent.

export function unsubscribeUrlFor(profileId: string): string {
  return `${SITE_URL}/api/unsubscribe?u=${profileId}`;
}

export function unsubscribeHeaders(profileId: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrlFor(profileId)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export function unsubscribeFooterHtml(profileId: string): string {
  return `<p style="font-size:12px;color:#888;margin-top:24px">Tu reçois cet email parce que tu as un compte sur stageio.fr. <a href="${unsubscribeUrlFor(profileId)}" style="color:#888">Ne plus recevoir ces emails</a>. Un souci avec l'app ? Réponds directement à cet email.</p>`;
}
