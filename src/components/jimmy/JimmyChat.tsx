"use client";

import { useRef, useState, useTransition } from "react";
import { sendJimmyMessageAction } from "@/app/(app)/jimmy/actions";
import type { JimmyMessageRole } from "@/types/database";

type DisplayMessage = {
  id: string;
  role: JimmyMessageRole;
  content: string;
};

const SUGGESTIONS = [
  "Quelles offres devrais-je postuler aujourd'hui ?",
  "J'ai un entretien bientôt, aide-moi à me préparer.",
  "Je viens d'être refusé, que puis-je améliorer ?",
];

export function JimmyChat({
  initialMessages,
}: {
  initialMessages: { id: string; role: JimmyMessageRole; content: string }[];
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  // Compteur stable (pas Date.now()) pour des clés optimistes uniques --
  // Date.now() est un appel impur, interdit par les règles de pureté du
  // React Compiler dès qu'il est atteignable depuis le corps du composant.
  const nextOptimisticId = useRef(0);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    setInput("");

    nextOptimisticId.current += 1;
    const optimisticId = `optimistic-${nextOptimisticId.current}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "user", content: trimmed }]);
    scrollToBottom();

    startTransition(async () => {
      const result = await sendJimmyMessageAction(trimmed);
      if (result.status === "success") {
        setMessages((prev) => [
          ...prev,
          { id: `${optimisticId}-reply`, role: "assistant", content: result.reply },
        ]);
        scrollToBottom();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        className="flex flex-col gap-3"
        style={{
          flex: 1,
          minHeight: 320,
          maxHeight: "56dvh",
          overflowY: "auto",
          padding: "4px 2px",
        }}
      >
        {messages.length === 0 && (
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <p style={{ fontSize: 13.5, margin: 0, color: "color-mix(in srgb, var(--color-text) 75%, transparent)" }}>
              Salut, je suis Jimmy 👋 Je connais ton profil, tes candidatures et tes favoris.
              Demande-moi ce que tu veux savoir sur ta recherche.
            </p>
            <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12.5, textAlign: "left", justifyContent: "flex-start" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className="card"
            style={{
              padding: "10px 14px",
              maxWidth: "82%",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "var(--color-accent-100)" : "var(--color-surface)",
              whiteSpace: "pre-wrap",
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            {m.content}
          </div>
        ))}

        {pending && (
          <div className="card" style={{ padding: "10px 14px", alignSelf: "flex-start", fontSize: 13, opacity: 0.7 }}>
            Jimmy réfléchit…
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12.5, color: "var(--color-accent-700)", margin: "8px 0 0" }}>{error}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
        style={{ marginTop: 12 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris à Jimmy…"
          disabled={pending}
          style={{
            flex: 1,
            borderRadius: 999,
            border: "1px solid var(--color-divider)",
            padding: "10px 16px",
            fontSize: 13.5,
          }}
        />
        <button type="submit" disabled={pending || !input.trim()} className="btn btn-primary" style={{ borderRadius: 999, padding: "10px 18px" }}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
