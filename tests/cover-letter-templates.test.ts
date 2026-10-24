// Bibliothèque de modèles de lettres : chaque domaine × style se rend sans
// trou, sans rien inventer, et les saisies remplacent les crochets.
// Lancer : npx tsx --tsconfig tsconfig.json tests/cover-letter-templates.test.ts
import assert from "node:assert/strict";
import { PLACEHOLDER_RE, TEMPLATE_DOMAINS, TEMPLATE_STYLES, countPlaceholders, guessTemplateDomain, renderTemplate } from "../src/lib/coverLetter/templates";

const distinctPlaceholders = (t: string) => new Set(t.match(PLACEHOLDER_RE) ?? []).size;

const empty = { fullName: null, city: null, formation: null, skills: [], availabilityDate: null };
const full = { fullName: "Léa Martin", city: "Lyon", formation: "BTS MCO", skills: ["Excel", "Canva"], availabilityDate: "2026-11-02" };
const answers = { experience: "j'ai tenu la caisse d'un supermarché pendant deux étés", whyCompany: "Vos magasins misent sur le conseil", rhythm: "2 jours en cours, 3 jours en entreprise" };

assert.equal(TEMPLATE_DOMAINS.length, 13);
const seen = new Set<string>();
for (const d of TEMPLATE_DOMAINS) {
  for (const st of TEMPLATE_STYLES) {
    for (const contractType of ["alternance", "stage"] as const) {
      const offer = { title: "Assistant commercial (H/F)", company: "Orange", contractType };
      const bare = renderTemplate(d.id, st.id, { offer, profile: empty, answers: {} });
      const done = renderTemplate(d.id, st.id, { offer, profile: full, answers });
      for (const t of [bare, done]) {
        assert.ok(!/undefined|null|\{\w+\}|\s{3,}| \n|\.\./.test(t.replace(/\n\n/g, "¶")), `${d.id}/${st.id}: ${t}`);
        assert.ok(!/H\/F/.test(t), "H/F retiré");
        assert.ok(!/de (Orange|Assistant)/.test(t), "élision");
        assert.ok(!/ce alternance/.test(t));
      }
      // Sans profil : nom, formation, expérience, entreprise (et rythme en alternance) à compléter.
      assert.equal(distinctPlaceholders(bare), contractType === "alternance" ? 5 : 4, `${d.id}/${st.id}/${contractType} bare`);
      // Profil complet et saisies : plus rien à compléter.
      assert.equal(countPlaceholders(done), 0, `${d.id}/${st.id}/${contractType}: ${done}`);
      assert.match(done, /Léa Martin/);
      assert.match(done, /deux étés/);
      if (contractType === "stage") assert.ok(!/rythme d'alternance/.test(done));
      seen.add(done);
    }
  }
}
// Toutes les lettres complètes sont différentes (domaine × style × contrat).
assert.equal(seen.size, 13 * 3 * 2);

assert.equal(guessTemplateDomain("Informatique", "Développeur web"), "informatique");
assert.equal(guessTemplateDomain(null, "Éducateur spécialisé"), "sante");
assert.equal(guessTemplateDomain(null, "Préparateur de commandes"), "logistique");
assert.equal(guessTemplateDomain(null, "Ouvrier polyvalent"), "generaliste");
assert.match(renderTemplate("commerce", "concis", { offer: { title: "Vendeur", company: "Entreprise confidentielle", contractType: "stage" }, profile: empty, answers: {} }), /votre entreprise/);

console.log("cover-letter-templates: OK");
