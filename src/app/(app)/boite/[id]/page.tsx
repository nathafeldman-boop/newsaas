import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { replyInboxMessageAction } from "@/app/(app)/boite/actions";

export const metadata: Metadata = { title: "Message", robots: { index: false } };

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

const NOTES: Record<string, string> = {
  ok: "Réponse envoyée.",
  vide: "Écris ta réponse avant d'envoyer.",
  erreur: "La réponse n'est pas partie, réessaie.",
};

export default async function InboxMessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ envoi?: string }>;
}) {
  const { id } = await params;
  const note = NOTES[(await searchParams).envoi ?? ""];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/boite/${id}`);

  const { data: message } = await supabase
    .from("inbox_messages")
    .select("id, direction, from_address, from_name, to_address, subject, body_text, offer_id, read_at, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!message) notFound();

  if (message.direction === "in" && !message.read_at) {
    await supabase.from("inbox_messages").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  }

  const reply = replyInboxMessageAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={message.direction === "in" ? "/boite" : "/boite?onglet=envoyes"} style={{ fontSize: 14 }}>
        ← Ma boîte
      </Link>
      <div className="card elev-sm mt-4" style={{ padding: "var(--space-6)" }}>
        <h1 style={{ fontSize: 21, margin: 0 }}>{message.subject || "(sans objet)"}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: muted }}>
          {message.direction === "in" ? (
            <>
              De : <strong>{message.from_name ?? message.from_address}</strong>
              {message.from_name ? ` <${message.from_address}>` : ""}
            </>
          ) : (
            <>
              À : <strong>{message.to_address}</strong>
            </>
          )}
          {" · "}
          {new Date(message.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" })}
        </p>
        {message.offer_id && (
          <p style={{ margin: "8px 0 0", fontSize: 13 }}>
            <Link href={`/candidature/${message.offer_id}`}>Voir la candidature liée</Link>
          </p>
        )}
        <div style={{ marginTop: 18, whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.6, wordBreak: "break-word" }}>
          {message.body_text || "(message vide)"}
        </div>
      </div>

      {message.direction === "in" && (
        <form action={reply} className="card mt-4 flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
          <label htmlFor="reply" style={{ fontWeight: 700, fontSize: 15 }}>
            Répondre
          </label>
          <textarea id="reply" name="reply" rows={6} className="input" placeholder="Bonjour, merci pour votre retour…" />
          {note && <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-700)" }}>{note}</p>}
          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            Envoyer depuis ma boîte Stageio
          </button>
        </form>
      )}
    </div>
  );
}
