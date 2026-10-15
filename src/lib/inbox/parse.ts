// Petits utilitaires de la boîte Stageio (emails reçus via Resend Inbound).

// « Groupe Restalliance <rh@restalliance.fr> » → nom + adresse.
export function parseAddress(raw: string): { name: string | null; address: string } {
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || null, address: match[2].trim().toLowerCase() };
  return { name: null, address: raw.trim().toLowerCase() };
}

export function domainOf(address: string): string {
  return address.split("@")[1]?.toLowerCase() ?? "";
}

// Version texte d'un email HTML, pour l'affichage dans l'appli (on n'affiche
// jamais le HTML d'un expéditeur tel quel).
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
