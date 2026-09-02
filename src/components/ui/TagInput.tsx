"use client";

import { useState } from "react";

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
    <div className="input" style={{ height: "auto", minHeight: 36, paddingBlock: 8 }}>
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="tag tag-accent">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{ opacity: 0.6, marginLeft: 4, cursor: "pointer" }}
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
          style={{
            flex: 1,
            minWidth: 120,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            padding: 4,
          }}
        />
      </div>
    </div>
  );
}
