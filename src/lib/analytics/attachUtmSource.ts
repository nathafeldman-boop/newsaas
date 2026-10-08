import { createAdminClient } from "@/lib/supabase/admin";

// Inscription par Google : contrairement au formulaire e-mail (utm_source
// dans raw_user_meta_data, recopié par le trigger de création du profil),
// le retour OAuth n'emporte aucune métadonnée -- ces comptes tombaient tous
// en « direct / inconnu » sur le dashboard. On reprend le cookie utm_source
// posé par proxy.ts (pub, ou site d'origine : google, chatgpt...).
// Uniquement pour un profil créé à l'instant et encore sans source : une
// simple reconnexion ne réécrit jamais l'attribution d'un ancien compte.
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

export async function attachUtmSourceIfNeeded(userId: string, utmSource: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("utm_source, created_at").eq("id", userId).single();
  if (!profile || profile.utm_source) return;
  if (Date.now() - new Date(profile.created_at).getTime() > NEW_ACCOUNT_WINDOW_MS) return;

  const { error } = await admin
    .from("profiles")
    .update({ utm_source: utmSource.slice(0, 100) })
    .eq("id", userId)
    .is("utm_source", null);
  if (error) {
    console.error("attachUtmSourceIfNeeded: profiles update failed", error, { userId });
  }
}
