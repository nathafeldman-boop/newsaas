import { LegalShell, Section, ToComplete } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Mentions légales — Stageio",
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell tag="Informations légales" title="Mentions légales" updated="septembre 2026">
      <Section title="Éditeur du site">
        <p>
          Le site stageio.fr est édité par :
        </p>
        <ToComplete>
          nom (ou raison sociale) de l&apos;éditeur, statut (ex : entreprise
          individuelle / micro-entreprise / société), adresse postale,
          numéro SIRET, et un email ou téléphone de contact.
        </ToComplete>
        <p style={{ marginTop: 10 }}>
          Directeur de la publication :{" "}
          <ToComplete>nom du directeur de la publication (généralement le représentant légal ci-dessus)</ToComplete>
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133,
          Walnut, CA 91789, États-Unis —{" "}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
          . La base de données et l&apos;authentification sont hébergées par
          Supabase Inc.,{" "}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>
          .
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site (textes, logo, charte
          graphique, code) est protégé par le droit d&apos;auteur et le droit
          des marques. Toute reproduction ou représentation, totale ou
          partielle, sans autorisation préalable est interdite. Les offres
          d&apos;emploi affichées appartiennent à leurs recruteurs/sources
          respectives ; Stageio agit comme agrégateur et met en avant la
          source d&apos;origine pour candidater.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p>
          Le traitement des données personnelles est détaillé dans notre{" "}
          <a href="/legal/confidentialite">politique de confidentialité</a>.
        </p>
      </Section>

      <Section title="Limitation de responsabilité">
        <p>
          Stageio agrège des offres provenant de sources tierces
          (recruteurs, Adzuna, jobboards publics) et s&apos;efforce de n&apos;en
          conserver que des annonces récentes et actives, sans pouvoir
          garantir en temps réel leur disponibilité effective chez le
          recruteur. La lettre de motivation générée par intelligence
          artificielle est une aide à la rédaction : il appartient à
          l&apos;utilisateur de la relire et de l&apos;adapter avant envoi.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question : <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>
        </p>
      </Section>
    </LegalShell>
  );
}
