import { GmailConnectButton } from "@/components/profile/GmailConnectButton";
import { disconnectGmailAction } from "@/app/(app)/profil/gmail-actions";
import type { EmailConnection } from "@/types/database";

export function GmailConnectionPanel({
  connection,
  statusParam,
}: {
  connection: EmailConnection | null;
  statusParam?: string;
}) {
  return (
    <div
      className="card elev-sm"
      style={{ marginTop: 20, background: "var(--color-accent-100)" }}
    >
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, margin: 0, color: "var(--color-accent-800)" }}>
        Candidatures envoyées depuis ton Gmail
      </p>
      <p style={{ fontSize: 13, color: "var(--color-accent-800)", opacity: 0.85, margin: "6px 0 0" }}>
        Connecte ton Gmail : quand tu likes une offre dont l&apos;entreprise a publié un email (et que
        « Quand je like une offre » est sur « Postuler directement »), ta candidature part depuis ta
        boîte, avec la lettre écrite pour l&apos;offre et ton CV. Les réponses arrivent directement chez
        toi. Stageio peut seulement envoyer : il ne lit jamais tes emails.
      </p>

      {statusParam === "connected" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-2-700)", marginTop: 10 }}>
          Gmail connecté ✓
        </p>
      )}
      {statusParam === "no_refresh_token" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 10 }}>
          Connexion incomplète — réessaie (Google ne renvoie le jeton
          nécessaire que si tu autorises l&apos;accès à chaque fois).
        </p>
      )}
      {statusParam === "error" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 10 }}>
          Échec de la connexion, réessaie.
        </p>
      )}
      {statusParam === "refused" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 10 }}>
          Google n&apos;a pas donné l&apos;accès (refusé sur son écran, ou connexion Gmail pas encore
          validée par Google pour Stageio). Réessaie plus tard.
        </p>
      )}
      {statusParam === "scope" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 10 }}>
          Il manque l&apos;autorisation d&apos;envoyer des emails : réessaie et coche bien la case Gmail sur
          l&apos;écran de Google.
        </p>
      )}
      {statusParam === "config" && (
        <p style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 10 }}>
          La connexion Gmail n&apos;est pas encore disponible. Réessaie dans quelques jours.
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        {connection ? (
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 13, color: "var(--color-accent-800)" }}>
              Connecté : {connection.email_address}
              <span className="block" style={{ fontSize: 12, opacity: 0.8 }}>
                Ça ne part pas ? Déconnecte puis reconnecte : la connexion expire parfois.
              </span>
            </span>
            <form action={disconnectGmailAction}>
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                Déconnecter
              </button>
            </form>
          </div>
        ) : (
          <GmailConnectButton />
        )}
      </div>
    </div>
  );
}
