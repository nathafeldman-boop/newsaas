"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";
import { alertOrphanedStripeSubscription } from "@/lib/resend/alertOrphanedStripeSubscription";

// Droit à l'effacement (RGPD, art. 17) : la politique de confidentialité
// promet une suppression de compte en self-service depuis le profil --
// cette action la rend réelle plutôt que de rester une simple promesse
// textuelle.
export async function deleteAccountAction(formData: FormData) {
  const confirmation = formData.get("confirmation");
  if (confirmation !== "SUPPRIMER") {
    redirect("/profil?error=delete_confirmation");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("cv_path, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  // Résilie l'abonnement Stripe actif AVANT de supprimer le compte : sinon
  // le prélèvement continuerait côté Stripe alors que plus personne ne
  // pourrait le voir ni l'annuler depuis l'app. Best-effort -- un souci
  // Stripe ne doit jamais empêcher quelqu'un d'exercer son droit à
  // l'effacement. Mais un simple console.error ne survit pas à la
  // suppression du compte qui suit (stripe_subscription_id disparaît avec
  // le profil) : sans alerte email, plus personne ne pourrait jamais
  // retrouver cet abonnement pour l'annuler manuellement, et la carte
  // continuerait d'être débitée indéfiniment. Bug réel trouvé à l'audit du
  // 2026-09-25.
  if (profile?.stripe_subscription_id) {
    try {
      const stripe = getStripeClient();
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      console.error("deleteAccountAction: échec annulation Stripe", err);
      try {
        await alertOrphanedStripeSubscription({
          userEmail: user.email ?? null,
          stripeSubscriptionId: profile.stripe_subscription_id,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      } catch (alertErr) {
        console.error("deleteAccountAction: échec de l'alerte email aussi", alertErr);
      }
    }
  }

  const admin = createAdminClient();

  // Le CV vit dans Storage, jamais couvert par le cascade SQL sur profiles.
  if (profile?.cv_path) {
    const { error: storageError } = await admin.storage.from("cvs").remove([profile.cv_path]);
    if (storageError) {
      console.error("deleteAccountAction: échec suppression CV", storageError);
    }
  }

  // Supprime l'utilisateur Auth : le cascade SQL (profiles.id -> auth.users.id
  // "on delete cascade", puis chaque table user_id -> profiles.id) supprime
  // automatiquement le profil, les swipes, candidatures, connexions email,
  // avis, filleuls, etc. -- pas besoin de les effacer un par un ici.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("deleteAccountAction: échec suppression du compte", deleteError);
    redirect("/profil?error=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/compte-supprime");
}
