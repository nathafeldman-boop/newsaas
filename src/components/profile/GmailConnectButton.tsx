// Autorisation Google dédiée (voir api/gmail/connect) : un lien suffit, le
// compte Stageio connecté reste le même.
export function GmailConnectButton() {
  return (
    <a href="/api/gmail/connect" className="btn btn-secondary btn-block" style={{ textAlign: "center" }}>
      Connecter Gmail
    </a>
  );
}
