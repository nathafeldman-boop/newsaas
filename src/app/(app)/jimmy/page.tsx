import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/subscription/isPremium";
import { PremiumCtaLink } from "@/components/premium/PremiumCtaLink";
import { JimmyChat } from "@/components/jimmy/JimmyChat";

export default async function JimmyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jimmy");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  const premium = isPremium(profile);

  // Même gating "réservé Premium, pas d'aperçu" que /dashboard : Jimmy a
  // besoin du vrai contexte du compte pour être utile, un aperçu limité
  // n'aurait pas de sens ici.
  if (!premium) {
    return (
      <div className="mx-auto w-full max-w-[520px] text-center" style={{ padding: "40px 0" }}>
        <p style={{ fontSize: 40, margin: 0 }}>🤖</p>
        <h1 style={{ fontSize: 24, margin: "12px 0 0" }}>Jimmy, ton copilote</h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            margin: "10px auto 0",
            maxWidth: "36ch",
            color: "color-mix(in srgb, var(--color-text) 65%, transparent)",
          }}
        >
          Il connaît ton profil, tes candidatures et tes favoris : demande-lui quelles offres
          postuler aujourd&apos;hui, comment préparer un entretien, ou pourquoi une offre te
          correspond. Réservé aux membres Premium.
        </p>
        <PremiumCtaLink
          userId={user.id}
          source="jimmy_gate"
          className="btn btn-primary mt-5"
          style={{ whiteSpace: "nowrap" }}
        >
          🔓 Débloquer avec Premium (7,99€/mois)
        </PremiumCtaLink>
      </div>
    );
  }

  const { data: history } = await supabase
    .from("jimmy_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(40);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">
      <h1 style={{ fontSize: 26, margin: 0 }}>🤖 Jimmy</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
        Ton copilote de recherche, connecté à ton profil, tes candidatures et tes favoris.
      </p>
      <div className="mt-5 flex-1">
        <JimmyChat initialMessages={history ?? []} />
      </div>
    </div>
  );
}
