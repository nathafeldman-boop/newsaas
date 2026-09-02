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
        Suivi automatique des réponses
      </p>
      <p style={{ fontSize: 13, color: "var(--color-accent-800)", opacity: 0.85, margin: "6px 0 0" }}>
        Connecte ta boîte Gmail : Stageio lit les emails liés à tes
        candidatures pour détecter automatiquement les réponses des
        recruteurs (entretien, refus) et met à jour tes statistiques sur{" "}
        <span style={{ fontWeight: 600 }}>Mes candidatures</span> — sans
        jamais lire le reste de ta boîte.
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

      <div style={{ marginTop: 14 }}>
        {connection ? (
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 13, color: "var(--color-accent-800)" }}>
              Connecté : {connection.email_address}
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
