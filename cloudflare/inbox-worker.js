// Email Worker Cloudflare de la boîte Stageio (Email Routing, gratuit).
// Chaque email reçu sur une adresse du domaine de la boîte (INBOX_DOMAIN,
// ex. candidat.stageio.fr) est relayé tel quel à Stageio, signé avec un
// secret partagé (voir src/app/api/inbox/cloudflare/route.ts).
// Aucune dépendance : le fichier se colle tel quel dans l'éditeur de Workers
// du tableau de bord Cloudflare. Variables du worker :
// - STAGEIO_URL : https://www.stageio.fr/api/inbox/cloudflare
// - INBOX_WORKER_SECRET (type « Secret ») : même valeur que sur Vercel.

// Une requête vers Vercel ne dépasse pas 4,5 Mo : au-delà de 3 Mo (4 Mo une
// fois encodé), on ne garde que le début du message -- le texte vient avant
// les pièces jointes.
const MAX_RAW_BYTES = 3 * 1024 * 1024;

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function sign(secret, text) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const worker = {
  async email(message, env) {
    const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());
    const truncated = raw.length > MAX_RAW_BYTES;
    const body = JSON.stringify({
      from: message.from,
      to: message.to,
      truncated,
      raw: toBase64(truncated ? raw.subarray(0, MAX_RAW_BYTES) : raw),
    });
    const timestamp = String(Date.now());
    const res = await fetch(env.STAGEIO_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-stageio-timestamp": timestamp,
        "x-stageio-signature": await sign(env.INBOX_WORKER_SECRET, `${timestamp}.${body}`),
      },
      body,
    });
    // Adresse qui n'appartient à personne : avis de non-remise à l'expéditeur.
    if (res.status === 404) {
      message.setReject("Adresse inconnue");
      return;
    }
    // Autre erreur : le worker échoue, visible dans ses journaux Cloudflare.
    if (!res.ok) throw new Error(`Stageio a répondu ${res.status}`);
  },
};

export default worker;
