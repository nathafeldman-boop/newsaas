// Délai maximal d'une requête HTTP vers Supabase. Sans lui, quand la base
// sature, une requête attend jusqu'au délai de la fonction (300 s) : le
// 09/10 au matin, des dizaines de pages sont restées bloquées 5 minutes
// chacune et ont épuisé le quota Vercel (projet mis en pause). Passé ce
// délai, la requête échoue comme une erreur Supabase ordinaire (déjà gérée
// par les appelants) et la fonction se termine.
// L'échec est signalé comme une annulation (AbortError) : postgrest-js ne
// retente pas une requête annulée, alors qu'il retente 3 fois une erreur
// réseau (soit 4 fois le délai, plus 7 s d'attente).
export function fetchWithTimeout(ms: number): typeof fetch {
  return async (input, init) => {
    const timeout = AbortSignal.timeout(ms);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      return await fetch(input, { ...init, signal });
    } catch (err) {
      if (timeout.aborted && !init?.signal?.aborted) {
        throw new DOMException(`Supabase sans réponse après ${ms / 1000} s`, "AbortError");
      }
      throw err;
    }
  };
}
