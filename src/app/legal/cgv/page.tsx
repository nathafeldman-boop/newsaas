import { LegalShell, Section, ToComplete } from "@/components/legal/LegalShell";

export const metadata = {
  title: "CGV",
};

export default function CGVPage() {
  return (
    <LegalShell tag="Conditions" title="Conditions générales de vente" updated="octobre 2026">
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
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
          <li>la possibilité de liker une offre (la mettre en favori) et d&apos;y candidater ;</li>
          <li>la génération de lettres de motivation par intelligence artificielle ;</li>
          <li>l&apos;audit de CV noté sur 100.</li>
        </ul>
      </Section>

      <Section title="Prix">
        <p>L&apos;accès Premium est proposé selon deux formules, au choix :</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
          <li><strong>15,99&nbsp;€ / mois</strong>, renouvelable automatiquement chaque mois ;</li>
          <li><strong>63,99&nbsp;€</strong>, en un paiement unique, donnant un accès Premium à vie (sans renouvellement, sans limite de durée).</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Ces prix s&apos;appliquent à partir du 29 octobre 2026 (auparavant : 12,79&nbsp;€ / mois, prix de
          bienvenue de 7,99&nbsp;€ / mois). Un abonnement déjà souscrit garde son prix.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Prix de bienvenue :</strong> pendant 10 minutes à compter du premier affichage de la page Premium
          sur son compte, l&apos;utilisateur peut souscrire au prix de 9,99&nbsp;€ / mois ou de 39,99&nbsp;€ pour
          l&apos;accès à vie (7,99&nbsp;€ / mois pour un délai ouvert avant le 29 octobre 2026). Le prix de bienvenue souscrit pendant ce délai reste celui de l&apos;abonnement (pas
          d&apos;augmentation au renouvellement). Le délai restant est affiché sur la page Premium ; passé ce
          délai, les prix ci-dessus s&apos;appliquent. Les destinataires de l&apos;email « nouveautés » envoyé à
          partir du 23 octobre 2026 bénéficient d&apos;un nouveau délai de 10 minutes, à compter de leur première
          visite de la page Premium après cet email. Il en va de même pour chaque email de la série « Premium »
          envoyée à partir du 24 octobre 2026 : un nouveau délai de 10 minutes à compter de la première visite de
          la page Premium ou du premier clic sur un lien de paiement de l&apos;email, après chaque email.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Promotion sur l&apos;accès à vie :</strong> du 23 octobre 2026 à 0 h 30 au 25 octobre 2026 à
          0 h 30 (heure de Paris), le prix de bienvenue de l&apos;accès à vie est de 30&nbsp;€ au lieu de
          39,99&nbsp;€ (prix le plus bas pratiqué au cours des 30 jours précédents), dans le même délai de 10
          minutes ; passé ce délai, le prix de 63,99&nbsp;€ s&apos;applique.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Offre 48 h par email :</strong> pour chaque destinataire d&apos;un email de la série « Premium »
          envoyé entre le 28 octobre 2026 à 18 h et le 1er novembre 2026 à 21 h (heure de Paris), le premier de ces
          emails ouvre, pour son seul compte, une offre de 48 heures à compter de son envoi : le prix de bienvenue
          mensuel (7,99&nbsp;€ / mois pour une offre ouverte avant le 29 octobre 2026, 9,99&nbsp;€ / mois ensuite)
          ou 30&nbsp;€ pour l&apos;accès à vie. L&apos;heure de fin est indiquée dans l&apos;email et sur la page
          Premium ; cette offre n&apos;est ouverte qu&apos;une fois par compte. Le prix mensuel souscrit pendant
          l&apos;offre reste celui de l&apos;abonnement ; passé l&apos;offre, les prix ci-dessus s&apos;appliquent.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Formule Stageio Auto</strong> (à partir du 24 octobre 2026) : <strong>28,79&nbsp;€ / mois</strong>,
          renouvelable automatiquement chaque mois, ou <strong>128&nbsp;€</strong> en un paiement unique pour un accès
          à vie. Prix de bienvenue, dans le même délai de 10 minutes (ou pendant l&apos;offre 48 h par email) :
          17,99&nbsp;€ / mois ou 80&nbsp;€ à vie. Un compte déjà Premium qui ajoute Stageio Auto paie le prix
          ci-dessus. Avant le 29 octobre 2026, Stageio Auto était à 17,99&nbsp;€ / mois ou 80&nbsp;€ à vie, sans
          prix de bienvenue. Elle comprend tous les avantages Premium et, en plus : l&apos;envoi automatique de la candidature
          de l&apos;utilisateur (lettre de motivation et CV) quand il like une offre, dans la limite de 100 envois
          par jour (heure de Paris) ; une adresse de candidature à son nom et une boîte de réception pour les
          réponses. L&apos;envoi automatique n&apos;est possible que pour les offres dont le recruteur a publié une
          adresse de candidature ou qui sont transmises par La bonne alternance (service public) ; pour les autres
          offres, et au-delà de la limite quotidienne, le like enregistre l&apos;offre en favori et l&apos;utilisateur
          postule lui-même. Les candidatures sont envoyées au nom de l&apos;utilisateur, avec la lettre qu&apos;il a
          préparée pour l&apos;offre ou, à défaut, une lettre rédigée à partir de son profil. Un abonné Premium
          mensuel qui passe à la formule Stageio Auto mensuelle voit son abonnement modifié immédiatement, la
          différence de prix pour la période en cours étant facturée au prorata ; s&apos;il choisit l&apos;accès à
          vie Stageio Auto, son abonnement Premium s&apos;arrête à la fin de la période déjà payée.
        </p>
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
          sans justification ni frais, directement depuis le
          &laquo; Profil &raquo; de ton compte (&laquo; Gérer mon abonnement
          Premium &raquo;, qui mène au portail de gestion Stripe). La
          résiliation prend effet à la fin de la période déjà payée : tu
          conserves l&apos;accès Premium jusqu&apos;à cette date, sans
          remboursement au prorata de la période entamée.
        </p>
        <p style={{ marginTop: 8 }}>
          Formule à vie : il n&apos;y a rien à résilier, aucun prélèvement
          récurrent n&apos;étant mis en place. L&apos;accès Premium reste
          acquis sans limite de durée après ce paiement unique. L&apos;accès à
          vie acheté à partir du 31 octobre 2026 n&apos;est pas remboursable, en
          dehors des cas prévus par la loi.
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

      <div id="garantie" style={{ scrollMarginTop: 80 }}>
        <Section title="Garantie « aucun entretien = remboursé »">
          <p>
            <strong>Qui en bénéficie :</strong> uniquement l&apos;utilisateur à qui cette garantie a été présentée sur la
            page Premium de Stageio (écran &laquo;&nbsp;Des résultats, ou on te rembourse&nbsp;&raquo; affiché avant les
            offres, ou message affiché quand il quitte cette page), pour un abonnement Premium mensuel souscrit après
            cet affichage. L&apos;accès à vie acheté à partir du 31 octobre 2026 n&apos;ouvre pas droit à cette
            garantie ; celui acheté avant cette date reste couvert aux conditions ci-dessous. Une seule garantie par
            personne. Les accès Premium offerts (codes d&apos;accès, parrainage) en sont exclus.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Conditions, toutes cumulatives :</strong>
          </p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, listStyle: "disc" }}>
            <li>
              avoir gardé Premium pendant 2 mois consécutifs à compter de l&apos;achat (formule mensuelle : abonnement
              ni résilié ni suspendu pendant ces 2 mois ; formule à vie : 2 mois après l&apos;achat) ;
            </li>
            <li>
              avoir liké au moins 50 offres sur Stageio pendant ces 2 mois (décompte enregistré par Stageio et affiché
              sur la page Premium) ;
            </li>
            <li>
              n&apos;avoir obtenu aucun entretien d&apos;embauche (en personne, par téléphone ou en visio, pour une
              alternance, un stage ou un emploi) pendant ces 2 mois, ce que l&apos;utilisateur certifie sur
              l&apos;honneur au moment de sa demande ; une fausse déclaration entraîne le refus ou la restitution du
              remboursement ;
            </li>
            <li>
              faire la demande avec le bouton &laquo;&nbsp;Demander mon remboursement&nbsp;&raquo; de la page Premium,{" "}
              <strong>dans les 12 heures qui suivent la fin de ces 2 mois</strong>. La date et l&apos;heure exactes de
              début et de fin de cette période sont affichées sur la page Premium dès l&apos;achat, et un email de
              rappel est envoyé la veille à l&apos;adresse du compte. Aucune demande n&apos;est recevable en dehors de
              cette période.
            </li>
          </ul>
          <p style={{ marginTop: 8 }}>
            <strong>Remboursement :</strong> l&apos;intégralité des sommes payées pour Premium (formule mensuelle :
            toutes les mensualités payées ; formule à vie : le prix payé), sur le moyen de paiement utilisé, sous 14
            jours après la demande. Le remboursement met fin à l&apos;accès Premium et, pour la formule mensuelle,
            résilie l&apos;abonnement. Cette garantie s&apos;ajoute aux droits que la loi te reconnaît et ne les
            réduit en rien. Depuis le 23 octobre 2026, la durée est de 2 mois au lieu de 3, y compris pour les achats
            faits avant cette date : les dates affichées sur la page Premium en tiennent compte.
          </p>
        </Section>
      </div>

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
