import { z } from "zod";

// Contrat de sortie pour "mon CV correspond-il à CETTE offre" (section 14 de
// l'audit) -- différent de cvAuditSchema (audit du CV en isolation) : ici on
// compare explicitement le CV au texte de l'offre, donc le résultat porte
// sur le recoupement (compétences trouvées / manquantes), pas sur la
// qualité générale du CV.
export const offerFitSchema = z.object({
  score: z.number().min(0).max(100),
  matched: z.array(z.string()).max(6),
  gaps: z.array(z.string()).max(6),
  advice: z.array(z.string()).max(4),
});

export type OfferFit = z.infer<typeof offerFitSchema>;
