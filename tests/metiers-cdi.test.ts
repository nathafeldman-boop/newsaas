// Pages CDI/CDD par métier (25/11) : classement des intitulés.
// Lancer : npx tsx --tsconfig tsconfig.json tests/metiers-cdi.test.ts
import assert from "node:assert/strict";
import { classifyMetier } from "@/lib/seo/metiers";
import { contractMetierPath } from "@/lib/offers/contractMetierSegments";

// « Leclerc » n'est pas un clerc de notaire.
assert.notEqual(classifyMetier("E.Leclerc - Boucher - H/F")?.slug, "juridique");
assert.equal(classifyMetier("E.Leclerc - CDI - Juriste (spécialisation en droit alimentaire) - H/F")?.slug, "juridique");
assert.equal(classifyMetier("Clerc de notaire (H/F)")?.slug, "juridique");
assert.equal(classifyMetier("Aide ménager / aide ménagère (H/F)")?.slug, "proprete");

assert.equal(contractMetierPath("cdi", "vente", null), "/offres/cdi/metier/vente");
assert.equal(contractMetierPath("cdd", "logistique", "lyon"), "/offres/cdd/metier/logistique/lyon");
console.log("metiers-cdi : OK");
