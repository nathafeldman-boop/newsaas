// JSON.stringify ne échappe jamais "<" : une description d'offre (texte
// externe, extrait par Mistral depuis une page tierce) contenant
// littéralement "</script>" romprait la balise <script type="application/
// ld+json"> et permettrait d'injecter du HTML/JS arbitraire dans une page
// publique et indexée. On échappe "<" en <, qui reste un JSON valide
// et un JSON-LD valide, mais ne peut plus casser hors du script.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
