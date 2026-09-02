"use client";

export function ChipMultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
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
          </button>
        );
      })}
    </div>
  );
}
