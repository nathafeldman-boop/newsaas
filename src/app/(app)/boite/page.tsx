import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateInboxAddress } from "@/lib/inbox/address";

export const metadata: Metadata = { title: "Ma boîte Stageio", robots: { index: false } };

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function formatDate(iso: string): string {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

// Boîte mail intégrée (15/10) : réponses des recruteurs (reçus) et
// candidatures parties de l'adresse Stageio de l'étudiant (envoyés).
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const sent = (await searchParams).onglet === "envoyes";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/boite");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const address = await getOrCreateInboxAddress(admin, user.id, profile?.full_name ?? null);

  const { data: messages, error } = await supabase
    .from("inbox_messages")
    .select("id, direction, from_address, from_name, to_address, subject, body_text, read_at, created_at")
    .eq("user_id", user.id)
    .eq("direction", sent ? "out" : "in")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 style={{ fontSize: 26, margin: 0 }}>Ma boîte Stageio</h1>
      <div className="card mt-4" style={{ padding: "var(--space-4)", fontSize: 14 }}>
        {address ? (
          <>
            Ton adresse de candidature : <strong style={{ wordBreak: "break-all" }}>{address}</strong>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: muted }}>
              Tes candidatures envoyées au like partent de cette adresse, et les réponses des recruteurs arrivent
              ici. Tu reçois aussi un email à chaque nouveau message.
            </p>
          </>
        ) : (
          <span style={{ color: muted }}>La boîte Stageio arrive très bientôt sur ton compte.</span>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Link href="/boite" className={sent ? "btn btn-secondary" : "btn btn-primary"}>
          Reçus
        </Link>
        <Link href="/boite?onglet=envoyes" className={sent ? "btn btn-primary" : "btn btn-secondary"}>
          Envoyés
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {error || !messages || messages.length === 0 ? (
          <p className="card" style={{ padding: "var(--space-5)", margin: 0, fontSize: 14, color: muted }}>
            {sent
              ? "Aucune candidature envoyée depuis ta boîte pour l'instant. Like une offre avec le badge « Candidature par email »."
              : "Aucun message pour l'instant. Les réponses des recruteurs arriveront ici."}
          </p>
        ) : (
          messages.map((m) => {
            const unread = !sent && !m.read_at;
            const who = sent ? m.to_address : (m.from_name ?? m.from_address);
            return (
              <Link
                key={m.id}
                href={`/boite/${m.id}`}
                className="card"
                style={{ padding: "14px 16px", textDecoration: "none", color: "inherit" }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span
                    style={{
                      fontWeight: unread ? 800 : 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {unread && (
                      <span
                        aria-label="Non lu"
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--color-accent)",
                          marginRight: 8,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                    {sent ? `À : ${who}` : who}
                  </span>
                  <span style={{ fontSize: 12, color: muted, flexShrink: 0 }}>{formatDate(m.created_at)}</span>
                </span>
                <span className="block" style={{ fontSize: 14, marginTop: 2, fontWeight: unread ? 700 : 500 }}>
                  {m.subject || "(sans objet)"}
                </span>
                <span
                  className="block"
                  style={{ fontSize: 13, marginTop: 2, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {(m.body_text ?? "").replace(/\s+/g, " ").slice(0, 140)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
