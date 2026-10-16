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
          <li>Paiement (Premium) : géré entièrement par Stripe — nous ne stockons jamais ton numéro de carte.</li>
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
          <li><strong>Google</strong> — connexion avec ton compte Google.</li>
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
            en désactivant les alertes email depuis ton profil.
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
