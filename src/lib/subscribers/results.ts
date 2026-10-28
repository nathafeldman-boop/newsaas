import { isSentStatus } from "@/lib/applications/status";
import type { Application } from "@/types/database";

// « Tes résultats » du tableau de bord (28/10, Nathan : « qu'ils voient
// l'amélioration […] les premiers résultats en 2-3 jours ») : uniquement
// des comptes réels (candidatures du suivi, candidatures spontanées
// envoyées, réponses arrivées dans la boîte Stageio), jamais d'estimation.

const DAY = 86_400_000;

export type Results = {
  sentTotal: number;
  sentWeek: number;
  spontaneousTotal: number;
  replies: number;
  interviews: number;
  accepted: number;
  firstReplyAt: string | null;
};

export function computeResults(params: {
  applications: Pick<Application, "status" | "applied_at" | "sent_at">[];
  spontaneousAt: string[];
  inboundAt: string[];
  now: number;
}): Results {
  const weekAgo = params.now - 7 * DAY;
  let sentTotal = 0;
  let sentWeek = 0;
  let answered = 0;
  let interviews = 0;
  let accepted = 0;
  for (const a of params.applications) {
    if (!isSentStatus(a.status)) continue;
    sentTotal++;
    if (Date.parse(a.sent_at ?? a.applied_at) >= weekAgo) sentWeek++;
    if (a.status === "en_cours" || a.status === "entretien" || a.status === "acceptee" || a.status === "refusee") answered++;
    if (a.status === "entretien") interviews++;
    if (a.status === "acceptee") accepted++;
  }
  const spontaneousWeek = params.spontaneousAt.filter((at) => Date.parse(at) >= weekAgo).length;
  const inbound = [...params.inboundAt].sort();
  return {
    sentTotal: sentTotal + params.spontaneousAt.length,
    sentWeek: sentWeek + spontaneousWeek,
    spontaneousTotal: params.spontaneousAt.length,
    // Réponses : le plus grand des deux comptes (statuts du suivi, messages
    // reçus) pour ne pas compter deux fois la même réponse.
    replies: Math.max(answered, inbound.length),
    interviews,
    accepted,
    firstReplyAt: inbound[0] ?? null,
  };
}
