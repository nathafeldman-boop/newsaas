import { LegalShell, Section } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <LegalShell tag="Confidentialité" title="Politique de confidentialité" updated="octobre 2026">
      <Section title="Qui sommes-nous">
        <p>
          Stageio est une plateforme française qui aide les étudiant·e·s à
          trouver une alternance ou un stage. Cette page décrit quelles
          données nous traitons, pourquoi, et comment les contrôler.
        </p>
      </Section>

      <Section title="Données que nous collectons">
        <ul style={{ margin: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li>Compte : email, nom, mot de passe (haché) ou identité Google.</li>
          <li>
            Profil : ville, compétences, secteurs, formation, mobilité,
            CV (optionnel).
          </li>
          <li>
            Activité : offres vues/likées, candidatures envoyées, statut
            de chaque candidature.
          </li>
          <li>
            Si tu connectes Gmail (optionnel) : l&apos;autorisation
            d&apos;envoyer tes candidatures depuis ta boîte, rien
            d&apos;autre (voir section dédiée ci-dessous).
          </li>
          <li>Paiement (Premium) : géré entièrement par Stripe — nous ne stockons jamais ton numéro de carte.</li>
        </ul>
      </Section>

      <Section title="Connexion Gmail : envoi de tes candidatures">
        <p>
          Cette fonctionnalité est facultative et désactivée par défaut.
          Si tu connectes Gmail depuis ton profil :
        </p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
          <li>
            Stageio reçoit seulement l&apos;autorisation d&apos;envoyer des
            emails depuis ta boîte. Stageio ne lit jamais tes emails, ni
            ta boîte de réception, ni tes contacts.
          </li>
          <li>
            Un email part uniquement quand tu le déclenches : un like sur
            une offre, avec le réglage « Postuler directement », quand
            l&apos;entreprise a publié une adresse email dans son annonce.
            Il contient ta lettre de motivation écrite pour l&apos;offre et
            ton CV, et il est adressé à cette seule adresse. Un message te
            confirme chaque envoi.
          </li>
          <li>
            On garde la trace de l&apos;envoi (offre concernée, domaine de
            l&apos;adresse du recruteur, date) pour ne jamais envoyer deux
            fois la même candidature. La lettre reste visible dans tes
            candidatures.
          </li>
          <li>
            Le jeton d&apos;accès Gmail n&apos;est utilisé que par nos
            serveurs, jamais transmis à ton navigateur ni à un tiers.
          </li>
          <li>
            L&apos;utilisation et le transfert à toute autre application des
            informations reçues des API Google respectent les{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">
              Règles relatives aux données utilisateur des services API Google
            </a>
            , y compris les exigences d&apos;utilisation limitée.
          </li>
          <li>
            Tu peux déconnecter Gmail à tout moment depuis ton profil, ou
            retirer l&apos;accès sur{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">
              myaccount.google.com/permissions
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section title="Emails que tu peux recevoir">
        <ul style={{ margin: 0, paddingLeft: 20, listStyle: "disc" }}>
          <li>Emails liés à ton compte : confirmation, connexion, paiement, parrainage.</li>
          <li>
            Alertes « nouvelles offres » qui correspondent à ton profil, et
            de temps en temps une relance sur Stageio (nouvelles offres,
            fonctionnalités, offre Premium) si tu ne passes plus.
          </li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Chaque alerte ou relance contient un lien pour ne plus en
          recevoir, et tu peux aussi les couper depuis ta page Profil
          (« Alertes nouvelles offres »). Les emails liés à ton compte
          continuent tant que le compte existe.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Stageio n&apos;utilise aucun cookie de mesure d&apos;audience ni de
          publicité. Le seul cookie déposé est strictement nécessaire au
          fonctionnement du service : la session de connexion (géré par
          Supabase Auth), et, sur l&apos;espace admin, un cookie de session
          d&apos;accès. Conformément aux recommandations de la CNIL, ces
          cookies strictement nécessaires ne requièrent pas de consentement
          préalable — aucun bandeau cookies n&apos;est donc affiché.
        </p>
      </Section>

      <Section title="Sous-traitants">
        <p>Nous faisons appel aux prestataires suivants pour faire fonctionner Stageio :</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
          <li><strong>Supabase</strong> — hébergement de la base de données, authentification, stockage des CV.</li>
          <li><strong>Vercel</strong> — hébergement de l&apos;application.</li>
          <li><strong>Anthropic (Claude)</strong> — rédaction des lettres de motivation, analyse des CV et des offres.</li>
          <li><strong>Resend</strong> — envoi des emails (compte, alertes nouvelles offres, relances).</li>
          <li><strong>Stripe</strong> — traitement des paiements de l&apos;abonnement Premium.</li>
          <li><strong>Adzuna</strong> et sources publiques — sourcing des offres d&apos;alternance/stage.</li>
          <li><strong>Google</strong> — connexion et, si tu l&apos;actives, envoi de tes candidatures depuis Gmail.</li>
        </ul>
      </Section>

      <Section title="Durée de conservation">
        <p>
          Tes données sont conservées tant que ton compte est actif. Si tu
          supprimes ton compte (voir ci-dessous), tes données personnelles
          sont effacées immédiatement de nos bases, à l&apos;exception des
          données que nous devons conserver plus longtemps pour répondre à
          une obligation légale (ex : factures).
        </p>
      </Section>

      <Section title="Tes droits (RGPD)">
        <p>
          Conformément au RGPD, tu disposes des droits suivants sur tes
          données :
        </p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
          <li>
            <strong>Droit à l&apos;effacement</strong> : supprime ton compte
            et l&apos;ensemble de tes données en un clic, à tout moment,
            depuis ton <a href="/profil">profil</a> (section &laquo;&nbsp;Zone
            de suppression&nbsp;&raquo;, tout en bas de page). Un abonnement
            Premium actif est résilié automatiquement au même moment.
          </li>
          <li>
            <strong>Droit de rectification</strong> : modifie directement
            tes informations de profil (ville, compétences, CV...) depuis
            la page <a href="/profil">profil</a>.
          </li>
          <li>
            <strong>Droit de retrait du consentement</strong> : par exemple
            en déconnectant Gmail depuis ton profil.
          </li>
          <li>
            <strong>Droit d&apos;accès et à la portabilité</strong> : contacte-nous
            à l&apos;adresse ci-dessous pour recevoir une copie de tes
            données dans un format structuré.
          </li>
          <li>
            <strong>Droit de réclamation</strong> auprès de la CNIL
            (www.cnil.fr) si tu estimes que tes droits ne sont pas
            respectés.
          </li>
        </ul>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question sur cette politique ou tes données :{" "}
          <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>
        </p>
      </Section>
    </LegalShell>
  );
}
