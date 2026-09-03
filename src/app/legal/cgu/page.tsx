import { LegalShell, Section } from "@/components/legal/LegalShell";

export const metadata = {
  title: "CGU — Stageio",
};

export default function CGUPage() {
  return (
    <LegalShell tag="Conditions" title="Conditions générales d'utilisation" updated="septembre 2026">
      <Section title="Objet">
        <p>
          Les présentes CGU régissent l&apos;accès et l&apos;utilisation du site
          et de l&apos;application Stageio (le &laquo; Service &raquo;), qui
          permet à des étudiant·e·s de découvrir des offres d&apos;alternance
          et de stage sous forme de cartes à swiper et d&apos;y candidater.
          En créant un compte, tu acceptes sans réserve les présentes CGU.
        </p>
      </Section>

      <Section title="Accès au service">
        <p>
          L&apos;inscription est gratuite et ouverte à toute personne
          recherchant une alternance ou un stage. Un compte gratuit donne
          accès à un nombre limité de &laquo; swipes &raquo; par semaine ; la
          candidature aux offres déjà vues reste, elle, toujours illimitée,
          gratuite ou payant. L&apos;offre Premium, payante, est décrite dans
          les <a href="/legal/cgv">CGV</a>.
        </p>
      </Section>

      <Section title="Compte utilisateur">
        <ul style={{ margin: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li>Tu es responsable de la confidentialité de tes identifiants.</li>
          <li>Les informations fournies (profil, CV) doivent être exactes et à jour.</li>
          <li>
            Un compte est strictement personnel : il est interdit de le
            partager, le revendre ou l&apos;utiliser pour un usage
            automatisé (scraping, bot).
          </li>
          <li>
            Tu peux supprimer ton compte à tout moment depuis ton profil ;
            voir la <a href="/legal/confidentialite">politique de confidentialité</a> pour le
            détail de ce que devient tes données.
          </li>
        </ul>
      </Section>

      <Section title="Contenu généré par IA">
        <p>
          Stageio propose (fonctionnalité Premium) la génération assistée
          par intelligence artificielle de lettres de motivation et d&apos;un
          audit de CV, à partir des informations que tu fournis. Ces
          contenus sont des suggestions : Stageio ne garantit ni leur
          exactitude, ni qu&apos;ils obtiennent une réponse positive d&apos;un
          recruteur. Il t&apos;appartient de relire et de valider tout
          contenu avant de l&apos;envoyer.
        </p>
      </Section>

      <Section title="Offres d'emploi affichées">
        <p>
          Les offres proviennent de recruteurs, d&apos;agrégateurs (dont
          Adzuna) et de jobboards publics. Stageio s&apos;efforce de
          n&apos;afficher que des annonces récentes et actives, mais ne peut
          garantir en temps réel leur disponibilité effective : une offre
          peut être pourvue par le recruteur avant sa désactivation sur
          Stageio.
        </p>
      </Section>

      <Section title="Comportements interdits">
        <p>Il est interdit d&apos;utiliser le Service pour :</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>publier ou transmettre un contenu illicite, trompeur ou frauduleux (ex : faux profil, fausse offre) ;</li>
          <li>tenter de contourner les limites techniques du Service (quotas, sécurité, authentification) ;</li>
          <li>extraire ou réutiliser massivement les offres ou données affichées à des fins commerciales.</li>
        </ul>
      </Section>

      <Section title="Disponibilité et évolutions">
        <p>
          Stageio est un service en évolution constante : fonctionnalités,
          tarifs et présentation peuvent évoluer. Les évolutions notables
          seront communiquées via l&apos;application. Le Service est fourni
          &laquo; en l&apos;état &raquo;, sans garantie de disponibilité
          continue (maintenance, panne d&apos;un prestataire tiers).
        </p>
      </Section>

      <Section title="Résiliation">
        <p>
          Tu peux cesser d&apos;utiliser le Service et supprimer ton compte à
          tout moment. Stageio peut suspendre ou supprimer un compte en
          cas de non-respect des présentes CGU, après notification quand
          les circonstances le permettent.
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de
          litige, une solution amiable sera recherchée avant toute action
          judiciaire.
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
