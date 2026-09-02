import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CvAuditPanel } from "@/components/profile/CvAuditPanel";
import { GmailConnectionPanel } from "@/components/profile/GmailConnectionPanel";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const { gmail } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));

  let cvSignedUrl: string | null = null;
  if (profile.cv_path) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(profile.cv_path, 60 * 60);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  const initial = (profile.full_name || user.email || "?").charAt(0).toUpperCase();

  const { data: gmailConnection } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="flex items-center gap-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Ton profil</h1>
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "2px 0 0" }}>
            Ces infos servent à te proposer de meilleures offres.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ProfileForm userId={user.id} initialProfile={profile} cvSignedUrl={cvSignedUrl} />
      </div>

      <CvAuditPanel hasCv={Boolean(profile.cv_path)} />

      <GmailConnectionPanel connection={gmailConnection ?? null} statusParam={gmail} />

      <div className="flex flex-col gap-2.5 mt-5">
        <Link
          href="/mes-candidatures"
          className="card flex-row items-center justify-between no-underline"
          style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
        >
          <span style={{ fontSize: 14 }}>Mes candidatures</span>
          <span>→</span>
        </Link>
        <Link
          href="/parrainage"
          className="card flex-row items-center justify-between no-underline"
          style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
        >
          <span style={{ fontSize: 14 }}>Parrainage</span>
          <span>→</span>
        </Link>
        {isAdmin && (
          <Link
            href="/admin/offres"
            className="card flex-row items-center justify-between no-underline sm:hidden"
            style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
          >
            <span style={{ fontSize: 14 }}>Admin — ingestion d&apos;offres</span>
            <span>→</span>
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="card flex-row items-center justify-between no-underline"
            style={{
              color: "inherit",
              padding: "var(--space-3) var(--space-4)",
              width: "100%",
              border: "none",
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14 }}>Déconnexion</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
