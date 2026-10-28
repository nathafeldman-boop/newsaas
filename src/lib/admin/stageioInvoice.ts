// Compte Stripe partagé avec d'autres sites (28/10) : une facture est à
// Stageio si une de ses lignes porte un produit Stageio (tous ont « Stageio »
// dans leur nom : Premium, à vie, Auto, hebdomadaire, quotidien, ultime).
// Sert à compter les paiements des comptes supprimés ou non reliés à un
// profil, que le rattachement par compte laissait de côté (octobre affiché
// sous 1 100 € pour 1 127,94 € encaissés).
export function isStageioInvoice(inv: { lines?: { data?: { description?: string | null }[] } | null }): boolean {
  return (inv.lines?.data ?? []).some((line) => /stageio/i.test(line.description ?? ""));
}
