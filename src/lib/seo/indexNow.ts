import { SITE_URL } from "@/lib/site";

// IndexNow (Bing, Yandex, Seznam, Naver...) : signale des URLs nouvelles ou
// modifiées en quelques secondes au lieu d'attendre le passage du robot.
// Bing alimente aussi ChatGPT Search et Copilot. Google ne participe PAS à
// IndexNow (pour lui : sitemap + Search Console). La clé est publique par
// conception : le fichier public/<clé>.txt prouve qu'on contrôle le domaine.
export const INDEXNOW_KEY = "8e5e8230ae5072b16c7624b1e0d3e25e";
const BATCH_SIZE = 10_000;

export async function submitToIndexNow(urls: string[]): Promise<{ submitted: number; error?: string }> {
  const host = new URL(SITE_URL).host;
  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const urlList = urls.slice(i, i + BATCH_SIZE);
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    // 200 = reçu, 202 = reçu (clé en cours de vérification).
    if (response.status !== 200 && response.status !== 202) {
      return { submitted, error: `IndexNow a répondu ${response.status}` };
    }
    submitted += urlList.length;
  }
  return { submitted };
}
