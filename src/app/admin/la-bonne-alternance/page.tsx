import { createAdminClient } from "@/lib/supabase/admin";
import { lbaApiKey } from "@/lib/laBonneAlternance/client";
import { LbaTestPanel } from "@/app/admin/la-bonne-alternance/LbaTestPanel";

// Recherche + candidature test : jusqu'à 2 appels à l'API (25 s max chacun).
export const maxDuration = 60;

export default async function AdminLaBonneAlternancePage() {
  const admin = createAdminClient();
  const [{ count: activeOffers }, { count: sentApplications }] = await Promise.all([
    admin.from("offers").select("id", { count: "exact", head: true }).eq("source", "la_bonne_alternance").eq("is_active", true),
    admin
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "application_emailed")
      .contains("metadata", { via: "la_bonne_alternance" }),
  ]);

  const muted = { color: "color-mix(in srgb, var(--color-text) 65%, transparent)", fontSize: 13 } as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>La bonne alternance</h1>
        <p style={{ ...muted, margin: "6px 0 0" }}>
          Offres importées chaque nuit et candidatures transmises gratuitement au recruteur par le service public.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card" style={{ padding: 16 }}>
          <p style={{ ...muted, margin: 0 }}>Clé de production (LBA_API_KEY)</p>
          <p style={{ fontSize: 18, margin: "4px 0 0", fontWeight: 700 }}>{lbaApiKey() ? "Branchée" : "Pas encore"}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ ...muted, margin: 0 }}>Offres « Candidature directe » actives</p>
          <p style={{ fontSize: 18, margin: "4px 0 0", fontWeight: 700 }}>{activeOffers ?? "—"}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ ...muted, margin: 0 }}>Candidatures envoyées</p>
          <p style={{ fontSize: 18, margin: "4px 0 0", fontWeight: 700 }}>{sentApplications ?? "—"}</p>
        </div>
      </div>

      <LbaTestPanel sandboxKeySet={!!process.env.LBA_SANDBOX_KEY?.trim()} />
    </div>
  );
}
