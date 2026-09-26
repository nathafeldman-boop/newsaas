import { LegalShell, Section, ToComplete } from "@/components/legal/LegalShell";

export const metadata = {
  title: "CGV — Stageio",
};

export default function CGVPage() {
  return (
    <LegalShell tag="Conditions" title="Conditions générales de vente" updated="septembre 2026">
      <Section title="Objet">
        <p>
          Les présentes CGV s&apos;appliquent à l&apos;accès Premium
          proposé sur Stageio, que ce soit sous forme d&apos;abonnement
          mensuel ou d&apos;achat unique à vie, en complément des{" "}
          <a href="/legal/cgu">CGU</a>. Elles régissent la vente de cet
          accès à tout consommateur créant un compte sur stageio.fr.
        </p>
      </Section>

      <Section title="Description de l'offre">
        <p>
          La création de compte et la navigation dans le catalogue
          d&apos;offres sont gratuites et illimitées, sans compte Premium.
          L&apos;accès Premium (abonnement mensuel ou achat à vie, voir
          &laquo;&nbsp;Prix&nbsp;&raquo; ci-dessous) donne accès, tant
          qu&apos;il est actif, à :
        </p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>la possibilité de liker une offre (la mettre en favori) et d&apos;y candidater ;</li>
          <li>la génération de lettres de motivation par intelligence artificielle ;</li>
          <li>l&apos;audit de CV noté sur 100.</li>
        </ul>
      </Section>

      <Section title="Prix">
        <p>L&apos;accès Premium est proposé selon deux formules, au choix :</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li><strong>7,99&nbsp;€ / mois</strong>, renouvelable automatiquement chaque mois ;</li>
          <li><strong>70&nbsp;€</strong>, en un paiement unique, donnant un accès Premium à vie (sans renouvellement, sans limite de durée).</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          {" "}
          <ToComplete>TVA applicable (montants ci-dessus TTC) ou &laquo; TVA non applicable, art. 293 B du CGI &raquo; selon ton statut fiscal — à préciser</ToComplete>
          . Ces deux formules donnent accès aux mêmes avantages Premium, sans
          engagement de durée : seule la fréquence (ou l&apos;absence) de
          facturation change. Le prix affiché au moment de l&apos;achat est
          celui applicable ; Stageio se réserve le droit de faire évoluer
          ses tarifs pour les nouveaux achats/abonnements, sans effet
          rétroactif sur un abonnement déjà en cours tant qu&apos;il
          n&apos;est pas renouvelé à un tarif modifié notifié au préalable,
          ni sur un accès à vie déjà acquis.
        </p>
      </Section>

      <Section title="Paiement">
        <p>
          Le paiement s&apos;effectue par carte bancaire, via notre
          prestataire de paiement sécurisé Stripe. Stageio ne stocke à
          aucun moment ton numéro de carte bancaire. La formule mensuelle
          est à <strong>renouvellement automatique</strong> : le montant
          correspondant est prélevé chaque mois, à la date anniversaire de
          la souscription, tant que l&apos;abonnement n&apos;a pas été
          résilié. La formule à vie est un <strong>paiement unique</strong>,
          sans aucun renouvellement ni prélèvement ultérieur.
        </p>
      </Section>

      <Section title="Résiliation">
        <p>
          Formule mensuelle : tu peux résilier ton abonnement à tout moment,
          sans justification ni frais, directement depuis la page
          &laquo; Premium &raquo; de ton compte (bouton &laquo; Gérer mon
          abonnement &raquo;, qui ouvre le portail de gestion Stripe). La
          résiliation prend effet à la fin de la période déjà payée : tu
          conserves l&apos;accès Premium jusqu&apos;à cette date, sans
          remboursement au prorata de la période entamée.
        </p>
        <p style={{ marginTop: 8 }}>
          Formule à vie : il n&apos;y a rien à résilier, aucun prélèvement
          récurrent n&apos;étant mis en place. L&apos;accès Premium reste
          acquis sans limite de durée après ce paiement unique.
        </p>
      </Section>

      <Section title="Droit de rétractation">
        <p>
          Conformément à l&apos;article L221-28 13° du Code de la
          consommation, le droit de rétractation de 14 jours ne s&apos;applique
          pas à un contenu numérique/service dont l&apos;exécution a
          commencé avec ton accord exprès avant la fin du délai de
          rétractation, et à condition d&apos;avoir reconnu perdre ainsi ton
          droit de rétractation. En validant ton achat (abonnement mensuel
          ou accès à vie), tu demandes la fourniture immédiate du Service
          et reconnaît perdre ton droit
          de rétractation une fois le Service pleinement exécuté (accès
          Premium activé). Tant que le Service n&apos;a pas commencé à être
          exécuté, tu peux contacter{" "}
          <a href="mailto:contact@stageio.fr">contact@stageio.fr</a> pour
          te rétracter.
        </p>
      </Section>

      <Section title="Réclamations et médiation">
        <p>
          Pour toute réclamation, contacte d&apos;abord{" "}
          <a href="mailto:contact@stageio.fr">contact@stageio.fr</a>. Si
          aucune solution amiable n&apos;est trouvée, en tant que consommateur
          tu peux recourir gratuitement au médiateur de la consommation :
        </p>
        <ToComplete>
          nom et coordonnées (site web) du médiateur de la consommation
          auquel Stageio est rattaché — obligatoire pour vendre un service
          payant à des consommateurs en France (art. L616-1 du Code de la
          consommation).
        </ToComplete>
      </Section>

      <Section title="Droit applicable">
        <p>Les présentes CGV sont soumises au droit français.</p>
      </Section>
    </LegalShell>
  );
}
