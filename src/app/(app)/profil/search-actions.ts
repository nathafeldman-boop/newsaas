"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { createAdminClient } from "@/lib/supabase/admin";
import { SIGNED_VIA_STAGEIO } from "@/lib/referrals/share";
import { sendSignedCongratsOnce } from "@/lib/referrals/signedEmail";

// "J'ai trouvé mon alternance" (RETENTION_AUDIT.md, section 17E) : jamais
// traité comme un échec produit. Clôture la recherche sans rien supprimer --
// /swipe affiche alors un état de félicitations (voir SearchCompletedCard)
// et les crons de relance (notify-new-offers, notify-no-swipe, send-swipe-
// relance) excluent ce profil tant que search_completed_at est renseigné.
export async function markSearchCompletedAction(reason: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      search_completed_at: new Date().toISOString(),
      search_completed_reason: reason || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("markSearchCompletedAction failed", error, { userId: user.id });
    return;
  }

  await logServerEvent(supabase, user.id, "search_completed", { reason });
  // Trouvée via Stageio (29/10) : félicitations et recommandation à un ami.
  if (reason === SIGNED_VIA_STAGEIO) {
    const { error: mailError } = await sendSignedCongratsOnce(createAdminClient(), user.id);
    if (mailError) console.error("markSearchCompletedAction: congrats email failed", mailError, { userId: user.id });
  }
  revalidatePath("/swipe");
  revalidatePath("/profil");
  revalidatePath("/dashboard");
}

export async function resumeSearchAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ search_completed_at: null, search_completed_reason: null })
    .eq("id", user.id);

  if (error) {
    console.error("resumeSearchAction failed", error, { userId: user.id });
    return;
  }

  await logServerEvent(supabase, user.id, "search_resumed");
  revalidatePath("/swipe");
  revalidatePath("/profil");
  revalidatePath("/dashboard");
}
