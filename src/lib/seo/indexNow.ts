import { SITE_URL } from "@/lib/site";

// IndexNow (Bing, Yandex, Seznam, Naver...) : signale des URLs nouvelles ou
// modifiées en quelques secondes au lieu d'attendre le passage du robot.
// Bing alimente aussi ChatGPT Search et Copilot. Google ne participe PAS à
// IndexNow (pour lui : sitemap + Search Console). La clé est publique par
// conception : le fichier public/<clé>.txt prouve qu'on contrôle le domaine.
export const INDEXNOW_KEY = "8e5e8230ae5072b16c7624b1e0d3e25e";
const BATCH_SIZE = 10_000;

// Bing en premier : c'est la cible (Bing + ChatGPT Search + Copilot) et ses
// erreurs sont explicites. api.indexnow.org (relais partagé) en secours --
// il a renvoyé 403 au premier essai du 06/10 alors que le fichier de clé
// était bien en ligne.
const ENDPOINTS = ["https://www.bing.com/indexnow", "https://api.indexnow.org/indexnow"];

async function postBatch(urlList: string[]): Promise<{ ok: boolean; detail: string }> {
  const host = new URL(SITE_URL).host;
  const body = JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList });
  const failures: string[] = [];
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      // 200 = reçu, 202 = reçu (clé en cours de vérification, normal au début).
      if (response.status === 200 || response.status === 202) return { ok: true, detail: `${endpoint} ${response.status}` };
      const text = (await response.text()).slice(0, 200).replace(/\s+/g, " ");
      failures.push(`${new URL(endpoint).host} ${response.status}${text ? ` (${text})` : ""}`);
    } catch (err) {
      failures.push(`${new URL(endpoint).host} injoignable (${err instanceof Error ? err.message : "erreur"})`);
    }
  }
  console.error("submitToIndexNow failed", failures);
  return { ok: false, detail: failures.join(" ; ") };
}

export async function submitToIndexNow(urls: string[]): Promise<{ submitted: number; error?: string }> {
  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const urlList = urls.slice(i, i + BATCH_SIZE);
    const result = await postBatch(urlList);
    if (!result.ok) return { submitted, error: result.detail };
    submitted += urlList.length;
  }
  return { submitted };
}
