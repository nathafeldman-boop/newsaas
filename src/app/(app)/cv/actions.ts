"use server";

import { createClient } from "@/lib/supabase/server";
import { extractCvText } from "@/lib/cv/extractText";

// Déclenché juste après un upload de CV réussi (voir CvUploadPanel) : extrait
// et met en cache le texte brut une seule fois à l'upload, plutôt que de
// re-télécharger/re-parser le fichier à chaque chargement de /swipe -- sert
// de signal de matching supplémentaire pour les utilisateurs Premium (voir
// computeCvMatchBonus dans src/lib/matching/score.ts). Volontairement
// best-effort et silencieux côté UI : un échec ici (format non supporté,
// colonne cv_text pas encore migrée...) ne doit jamais faire échouer
// l'upload lui-même, déjà acté au moment où cette action est appelée.
export async function cacheCvTextAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path")
    .eq("id", user.id)
    .single();

  if (!profile?.cv_path) return;

  try {
    const { data: file } = await supabase.storage.from("cvs").download(profile.cv_path);
    if (!file) return;

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractCvText(buffer, profile.cv_path);

    const { error } = await supabase
      .from("profiles")
      .update({ cv_text: text.slice(0, 20000) })
      .eq("id", user.id);

    if (error) {
      console.error("cacheCvTextAction: update failed", error, { userId: user.id });
    }
  } catch (err) {
    console.error("cacheCvTextAction: extraction failed", err, { userId: user.id });
  }
}
