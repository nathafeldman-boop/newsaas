import { Resend } from "resend";
import { isSimulationEmail } from "@/lib/simulation/accounts";

let cached: Resend | null = null;

type Recipients = string | string[] | undefined;
const keep = (r: Recipients): Recipients => {
  if (r === undefined) return r;
  const list = (Array.isArray(r) ? r : [r]).filter((a) => !isSimulationEmail(a.replace(/^.*<(.+)>\s*$/, "$1")));
  return Array.isArray(r) ? list : list[0];
};
const empty = (r: Recipients) => r === undefined || (Array.isArray(r) ? r.length === 0 : !r);

// Simulation du parcours (21/11) : aucun e-mail ne part vers un compte de
// simulation (lib/simulation/accounts.ts). Destinataires retirés ; s'il
// n'en reste aucun, l'envoi est réputé fait sans rien envoyer.
type Mail = { to?: Recipients; cc?: Recipients; bcc?: Recipients } & Record<string, unknown>;
function strip<T extends Mail>(mail: T): T | null {
  const to = keep(mail.to);
  if (empty(to)) return null;
  return { ...mail, to, cc: keep(mail.cc), bcc: keep(mail.bcc) };
}

export function getResendClient() {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant côté serveur.");
  }

  const client = new Resend(apiKey);
  const send = client.emails.send.bind(client.emails);
  client.emails.send = (async (payload: Parameters<typeof send>[0], options?: Parameters<typeof send>[1]) => {
    const kept = strip(payload as unknown as Mail);
    if (!kept) return { data: { id: "simulation" }, error: null, headers: null };
    return send(kept as unknown as Parameters<typeof send>[0], options);
  }) as typeof client.emails.send;
  const batchSend = client.batch.send.bind(client.batch);
  client.batch.send = (async (payload: Parameters<typeof batchSend>[0], options?: Parameters<typeof batchSend>[1]) => {
    // Même ordre que l'envoi demandé (les appelants lisent les identifiants par position).
    const mails = (payload as unknown as Mail[]).map(strip);
    const kept = mails.filter((m): m is Mail => m !== null);
    if (kept.length === mails.length) return batchSend(payload, options);
    if (kept.length === 0) return { data: { data: mails.map(() => ({ id: "simulation" })) }, error: null, headers: null };
    const result = await batchSend(kept as unknown as Parameters<typeof batchSend>[0], options);
    const ids = result.data?.data ?? [];
    let i = 0;
    return result.data ? { ...result, data: { ...result.data, data: mails.map((m) => (m ? (ids[i++] ?? { id: "" }) : { id: "simulation" })) } } : result;
  }) as typeof client.batch.send;
  cached = client;
  return cached;
}
