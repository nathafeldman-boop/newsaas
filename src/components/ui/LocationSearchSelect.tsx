"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Sélection unique (une seule ville/département) sur une liste combinée
// -- 12 métropoles + 100 départements est trop long pour une grille de
// tuiles sans filtre, d'où la barre de recherche. Sans recherche active,
// affiche seulement le début de la liste (les métropoles, comportement
// historique) pour ne pas noyer l'écran sous 100+ tuiles.
export function LocationSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Rechercher une ville ou un département...",
  defaultVisibleCount = 12,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  defaultVisibleCount?: number;
}) {
  const [query, setQuery] = useState("");

  const normalizedQuery = normalize(query.trim());
  const defaultOptions = options.slice(0, defaultVisibleCount);
  // Sans recherche active, la valeur déjà choisie doit rester visible même
  // si elle est hors de la tranche par défaut (ex: un département choisi
  // via la recherche puis celle-ci effacée) -- sinon la sélection semble
  // avoir disparu alors qu'elle est toujours active.
  const visibleOptions = normalizedQuery
    ? options.filter((o) => normalize(o).includes(normalizedQuery)).slice(0, 30)
    : value && !defaultOptions.includes(value)
      ? [...defaultOptions, value]
      : defaultOptions;

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
      <div className="flex flex-wrap gap-2">
        {visibleOptions.length === 0 && (
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun résultat.
          </p>
        )}
        {visibleOptions.map((option) => {
          const selected = value === option;
          return (
            <motion.button
              key={option}
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              onClick={() => onChange(option)}
              className={selected ? "tag" : "tag tag-neutral"}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                ...(selected ? { background: "var(--color-accent)", color: "var(--color-bg)" } : {}),
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
