"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="rounded-lg border border-border px-2 py-2 focus-within:ring-2 focus-within:ring-brand">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm text-brand-dark"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-brand-dark/60 hover:text-brand-dark"
              aria-label={`Retirer ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            } else if (e.key === "Backspace" && draft === "" && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          onBlur={addTag}
          placeholder={value.length ? "" : placeholder}
          className={cn(
            "flex-1 min-w-[8rem] px-1 py-1 text-sm focus:outline-none",
          )}
        />
      </div>
    </div>
  );
}
