"use client";

import { useState } from "react";
import { ChipMultiSelect } from "./ChipMultiSelect";

// Grille de tuiles + échappatoire "+ Autre" pour rester dans l'esprit "zéro
// saisie obligatoire" tout en laissant un accès texte optionnel.
export function ChipMultiSelectWithCustom({
  options,
  value,
  onChange,
  customPlaceholder = "Précise ici...",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  customPlaceholder?: string;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const extra = value.filter((v) => !options.includes(v));
  const allOptions = extra.length > 0 ? [...options, ...extra] : options;

  function addCustom() {
    const trimmed = customValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomValue("");
    setCustomOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <ChipMultiSelect options={allOptions} value={value} onChange={onChange} />
      {customOpen ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder={customPlaceholder}
            className="input"
          />
          <button type="button" onClick={addCustom} className="btn btn-secondary">
            Ajouter
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className="tag tag-outline"
          style={{ padding: "7px 14px", fontSize: 13, alignSelf: "flex-start" }}
        >
          + Autre
        </button>
      )}
    </div>
  );
}
