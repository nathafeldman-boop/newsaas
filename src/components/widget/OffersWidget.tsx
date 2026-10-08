import { notFound } from "next/navigation";
import { getMetier } from "@/lib/seo/metiers";
import { cityPhrase, getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { fetchOffersByIds, segmentPath } from "@/lib/seo/programmaticPage";
import { offerPath } from "@/lib/offers/publicUrl";
import { SITE_URL } from "@/lib/site";

// Widget à intégrer (iframe) sur le site d'une école, d'un CFA ou d'un BDE :
// les 6 offres les plus récentes d'une ville, éventuellement d'un métier,
// avec un lien vers la page Stageio correspondante. Mis en cache (ISR) : un
// affichage sur un site tiers ne sollicite pas la base. Les liens ouvrent un
// nouvel onglet sur stageio.fr, avec utm_source=widget pour l'attribution.
const LIMIT = 6;

export async function OffersWidget({ type, ville, metierSlug }: { type: string; ville: string; metierSlug?: string }) {
  if (type !== "alternance" && type !== "stage") notFound();
  const index = await getProgrammaticIndex(type);
  const city = index.cities[ville];
  if (!city) notFound();
  // Métier inconnu ou sans assez d'offres dans la ville : les offres de la
  // ville plutôt qu'une page d'erreur dans le cadre du site qui l'intègre.
  const combo = metierSlug ? index.combos[`${metierSlug}/${city.slug}`] : undefined;
  const metier = combo ? (getMetier(combo.metier) ?? null) : null;
  const stats = metier && combo ? combo : city;

  const offers = await fetchOffersByIds(stats.ids.slice(0, LIMIT));
  const what = type === "alternance" ? "Offres d'alternance" : "Offres de stage";
  const label = `${what}${metier ? ` ${metier.domain}` : ""} ${cityPhrase(city.label)}`;
  const track = "utm_source=widget&utm_medium=embed";
  const pageUrl = `${SITE_URL}${segmentPath(type, metier?.slug ?? null, city.slug)}?${track}`;

  return (
    <div style={{ padding: 12, fontSize: 14, lineHeight: 1.4 }}>
      <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{label}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {offers.map((offer) => (
          <li key={offer.id} style={{ padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}>
            <a href={`${SITE_URL}${offerPath(offer)}?${track}`} target="_blank" rel="noopener" style={{ fontWeight: 600 }}>
              {offer.title}
            </a>
            <span style={{ display: "block", fontSize: 12.5, opacity: 0.75 }}>{offer.company}</span>
          </li>
        ))}
      </ul>
      {offers.length === 0 && <p style={{ margin: "8px 0" }}>Aucune offre en ce moment.</p>}
      <a href={pageUrl} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 10, fontWeight: 700 }}>
        Voir les {stats.count.toLocaleString("fr-FR")} offres sur Stageio →
      </a>
    </div>
  );
}
