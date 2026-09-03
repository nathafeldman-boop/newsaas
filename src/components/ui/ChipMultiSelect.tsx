"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function ChipMultiSelect({
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder = "Rechercher...",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  // Les options déjà sélectionnées restent toujours visibles même filtrées
  // par la recherche, pour pouvoir les désélectionner sans devoir effacer
  // la recherche.
  const normalizedQuery = normalize(query.trim());
  const visibleOptions =
    searchable && normalizedQuery
      ? options.filter((o) => value.includes(o) || normalize(o).includes(normalizedQuery))
      : options;

  return (
    <div className="flex flex-col gap-2.5">
      {searchable && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="input"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {visibleOptions.length === 0 && (
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun résultat.
          </p>
        )}
        {visibleOptions.map((option) => {
          const selected = value.includes(option);
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={selected ? "tag" : "tag tag-neutral"}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                ...(selected
                  ? { background: "var(--color-accent)", color: "var(--color-bg)" }
                  : {}),
              }}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
