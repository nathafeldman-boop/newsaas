// Délai maximal d'une requête HTTP vers Supabase. Sans lui, quand la base
// sature, une requête attend jusqu'au délai de la fonction (300 s) : le
// 09/10 au matin, des dizaines de pages sont restées bloquées 5 minutes
// chacune et ont épuisé le quota Vercel (projet mis en pause). Passé ce
// délai, la requête échoue comme une erreur Supabase ordinaire (déjà gérée
// par les appelants) et la fonction se termine.
// L'échec est signalé comme une annulation (AbortError) : postgrest-js ne
// retente pas une requête annulée, alors qu'il retente 3 fois une erreur
// réseau (soit 4 fois le délai, plus 7 s d'attente).
//
// Coupe-circuit (par instance) : après FAILURES_TO_OPEN délais dépassés en
// moins de FAILURE_WINDOW_MS, plus aucune requête n'est envoyée pendant
// OPEN_MS (échec immédiat), puis une seule passe pour tester la base. Une
// base saturée (09/10, 10 h 20 UTC : même un simple comptage dépassait le
// délai) n'est ainsi plus noyée sous les nouvelles requêtes des pages et des
// robots, et peut se rétablir ; idem juste après un redémarrage.
const FAILURES_TO_OPEN = 3;
const FAILURE_WINDOW_MS = 30_000;
const OPEN_MS = 15_000;

let failures: number[] = [];
let openUntil = 0;
let probing = false;

function abortError(message: string): DOMException {
  return new DOMException(message, "AbortError");
}

export function fetchWithTimeout(ms: number): typeof fetch {
  return async (input, init) => {
    const now = Date.now();
    const halfOpen = openUntil > 0 && now >= openUntil;
    if (now < openUntil || (halfOpen && probing)) {
      throw abortError("Supabase en pause : trop de délais dépassés à l'instant");
    }
    if (halfOpen) probing = true;
    const timeout = AbortSignal.timeout(ms);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      const response = await fetch(input, { ...init, signal });
      if (halfOpen) openUntil = 0;
      return response;
    } catch (err) {
      if (timeout.aborted && !init?.signal?.aborted) {
        const at = Date.now();
        failures = [...failures.filter((t) => at - t < FAILURE_WINDOW_MS), at];
        if (halfOpen || failures.length >= FAILURES_TO_OPEN) {
          openUntil = at + OPEN_MS;
          failures = [];
          console.error(`Supabase: coupe-circuit ouvert pour ${OPEN_MS / 1000} s`);
        }
        throw abortError(`Supabase sans réponse après ${ms / 1000} s`);
      }
      throw err;
    } finally {
      if (halfOpen) probing = false;
    }
  };
}
