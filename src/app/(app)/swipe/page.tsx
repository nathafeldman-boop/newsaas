import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export default async function SwipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/swipe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("looking_for")
    .eq("id", user.id)
    .single();

  const { data: swiped } = await supabase
    .from("swipes")
    .select("offer_id")
    .eq("user_id", user.id);

  const excludeIds = (swiped ?? []).map((s) => s.offer_id);

  let query = supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(30);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  if (profile?.looking_for && profile.looking_for.length > 0) {
    query = query.in("contract_type", profile.looking_for);
  }

  const { data: offers } = await query;

  return (
    <div className="flex flex-1 flex-col items-center">
      <SwipeDeck offers={offers ?? []} userId={user.id} />
    </div>
  );
}
