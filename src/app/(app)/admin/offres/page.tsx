import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IngestForm } from "@/components/admin/IngestForm";

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
      <h1 className="text-2xl font-bold">Ingestion d&apos;offres (Mistral)</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Colle une URL d&apos;offre publique ou son contenu brut : Mistral
        structure les champs et l&apos;offre est ajoutée au deck de swipe.
      </p>
      <p className="mt-1 text-xs text-foreground/40">
        {activeOffersCount ?? 0} offre(s) active(s) actuellement.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <IngestForm />
      </div>
    </div>
  );
}
