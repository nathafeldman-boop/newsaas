import { createAdminClient } from "@/lib/supabase/admin";

// Filtre grossier mais suffisant : le but est d'éviter que Googlebot et
// consorts ne gonflent artificiellement "visiteurs distincts" côté admin,
// pas de bloquer quoi que ce soit (ce fichier n'écrit jamais rien qui
// affecte la réponse HTTP réelle -- voir l'appel via event.waitUntil dans
// proxy.ts).
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|pingdom|uptimerobot|monitor|headlesschrome/i;

export async function logVisit(
  visitorId: string,
  path: string,
  userAgent: string | null,
): Promise<void> {
  if (userAgent && BOT_UA_PATTERN.test(userAgent)) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("site_visits").insert({ visitor_id: visitorId, path });
    if (error) {
      console.error("logVisit insert failed", error);
    }
  } catch (err) {
    // Best-effort : ne doit jamais remonter jusqu'à proxy.ts (déjà découplé
    // de la réponse réelle via waitUntil, mais on log quand même pour
    // pouvoir diagnostiquer si le compteur "en ligne"/le graphe hebdo
    // restent désespérément vides).
    console.error("logVisit threw", err);
  }
}
