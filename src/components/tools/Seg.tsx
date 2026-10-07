"use client";

// Choix exclusif en pastilles (simulateur de salaire, générateur de lettre).
export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  name,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={name} style={{ width: "100%" }}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={`seg-opt${option.value === value ? " is-active" : ""}`}
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
