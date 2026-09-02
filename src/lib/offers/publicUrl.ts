import type { Offer } from "@/types/database";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// URL SEO-friendly mais stable : le slug humain est décoratif, seul l'UUID
// en suffixe fait foi pour retrouver l'offre (le titre/l'entreprise peuvent
// changer sans casser les liens déjà indexés par Google).
export function offerSlug(offer: Pick<Offer, "id" | "title" | "company" | "location">): string {
  const human = slugify(`${offer.title} ${offer.company} ${offer.location}`);
  return human ? `${human}-${offer.id}` : offer.id;
}

export function offerPath(offer: Pick<Offer, "id" | "title" | "company" | "location">): string {
  return `/offres/${offerSlug(offer)}`;
}

export function extractOfferId(slugParam: string): string | null {
  const match = slugParam.match(UUID_RE);
  return match ? match[0].toLowerCase() : null;
}
