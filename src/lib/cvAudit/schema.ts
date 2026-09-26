import { z } from "zod";

// Contrat de sortie commun à l'audit CV statique (staticAudit.ts) et à
// l'audit Claude (generateWithAnthropic.ts) -- relocalisé ici depuis
// src/lib/mistral/auditCv.ts (l'ancienne implémentation Mistral, supprimée
// depuis) : Mistral n'était même plus le repli de cette fonctionnalité
// (staticAudit.ts l'est), ça n'avait plus de sens que ce type continue à
// vivre dans un module "mistral".
export const cvAuditSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(8),
  missing_sections: z.array(z.string()).max(6),
});

export type CvAudit = z.infer<typeof cvAuditSchema>;
