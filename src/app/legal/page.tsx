import Link from "next/link";

export const metadata = {
  title: "Confidentialité — Stageio",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "color-mix(in srgb, var(--color-text) 85%, transparent)" }}>
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <div className="flex-1">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>

      <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-9">
        <span className="tag tag-accent">Confidentialité</span>
        <h1 style={{ fontSize: 32, margin: "16px 0 0" }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", margin: "6px 0 0" }}>
          Dernière mise à jour : septembre 2026
        </p>

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
              Si tu connectes Gmail (optionnel) : lecture des emails
              récents liés à tes candidatures uniquement (voir section
              dédiée ci-dessous).
            </li>
          </ul>
        </Section>

        <Section title="Connexion Gmail — ce qu'on lit, ce qu'on ne lit pas">
          <p>
            Cette fonctionnalité est facultative et désactivée par défaut.
            Si tu la connectes depuis ton profil :
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>
              On analyse les emails récents de ta boîte de réception
              principale pour détecter, par intelligence artificielle, les
              réponses de recruteurs liées à tes candidatures (invitation
              entretien, refus...).
            </li>
            <li>
              On ne stocke jamais le contenu complet d&apos;un email : seuls
              l&apos;expéditeur, le sujet, un court extrait et le
              verdict (positif/négatif/neutre) sont conservés, uniquement
              pour les emails identifiés comme liés à une candidature.
            </li>
            <li>
              Les emails sans rapport avec une candidature (newsletters,
              autres échanges personnels...) sont ignorés et jamais
              stockés.
            </li>
            <li>
              Le jeton d&apos;accès à ta boîte n&apos;est utilisé que par nos
              serveurs, jamais transmis à ton navigateur ni à un tiers
              autre que Google (pour l&apos;authentification) et Mistral AI
              (pour la classification, voir ci-dessous).
            </li>
            <li>
              Tu peux déconnecter Gmail à tout moment depuis ton profil ;
              l&apos;accès est immédiatement révoqué et les jetons stockés
              supprimés.
            </li>
          </ul>
        </Section>

        <Section title="Sous-traitants">
          <p>Nous faisons appel aux prestataires suivants pour faire fonctionner Stageio :</p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li><strong>Supabase</strong> — hébergement de la base de données, authentification, stockage des CV.</li>
            <li><strong>Vercel</strong> — hébergement de l&apos;application.</li>
            <li><strong>Mistral AI</strong> — extraction et classification de texte (offres, CV, emails).</li>
            <li><strong>Resend</strong> — envoi des emails transactionnels (parrainage, codes de vérification).</li>
            <li><strong>Adzuna</strong> et sources publiques — sourcing des offres d&apos;alternance/stage.</li>
            <li><strong>Google</strong> — connexion et, si activé, lecture Gmail.</li>
          </ul>
        </Section>

        <Section title="Tes droits (RGPD)">
          <p>
            Conformément au RGPD, tu peux à tout moment demander l&apos;accès,
            la rectification ou la suppression de tes données, ou retirer
            ton consentement (par exemple en déconnectant Gmail). Pour
            toute demande, contacte-nous à l&apos;adresse indiquée
            ci-dessous.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question sur cette politique ou tes données :{" "}
            <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>
          </p>
        </Section>
      </div>
    </div>
  );
}
