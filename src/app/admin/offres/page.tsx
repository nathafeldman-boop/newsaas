import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IngestForm } from "@/components/admin/IngestForm";

// L'ingestion en lot fait un fetch + un appel Mistral par URL, séquentiellement :
// sans ceci la Server Action tourne sur le défaut Vercel (10s), largement
// dépassé dès qu'on colle plus de quelques URLs. 60s = plafond du plan Hobby.
export const maxDuration = 60;

export default async function AdminOffresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/offres");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect("/swipe");
  }

  const { count: activeOffersCount } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="mx-auto max-w-xl">
      <h1 style={{ fontSize: 28, margin: 0 }}>Ingestion d&apos;offres (Mistral)</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Colle une URL d&apos;offre publique ou son contenu brut : Mistral
        structure les champs et l&apos;offre est ajoutée au deck de swipe.
      </p>
      <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 40%, transparent)", margin: "4px 0 0" }}>
        {activeOffersCount ?? 0} offre(s) active(s) actuellement.
      </p>

      <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
        <IngestForm />
      </div>
    </div>
  );
}
