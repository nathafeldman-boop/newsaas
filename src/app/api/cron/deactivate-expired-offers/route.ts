import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron quotidien (voir vercel.json) : désactive les offres ingérées qui
// traînent depuis trop longtemps sans avoir été retraitées (probablement
// pourvues ou expirées). Les offres de démo ne sont jamais désactivées.
// Déclenché par Vercel Cron, qui envoie automatiquement
// "Authorization: Bearer $CRON_SECRET" quand cette variable est définie.

const EXPIRY_DAYS = 45;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("offers")
    .update({ is_active: false })
    .neq("source", "demo")
    .eq("is_active", true)
    .lt("published_at", cutoff.toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deactivated: data?.length ?? 0 });
}
