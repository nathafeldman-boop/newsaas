"use server";

import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/analytics/logServerEvent";
import { WIN_SHARE_EVENT, type WinKind } from "@/lib/referrals/share";

// Partage d'une victoire (29/10) : compté pour mesurer le bouche-à-oreille.
export async function logWinShareAction(kind: WinKind, channel: "natif" | "whatsapp" | "copie"): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await logServerEvent(supabase, user.id, WIN_SHARE_EVENT, { kind, channel });
}
