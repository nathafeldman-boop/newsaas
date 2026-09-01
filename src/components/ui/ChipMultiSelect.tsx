"use client";

import { cn } from "@/lib/utils";

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
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-foreground/70 hover:border-brand/50",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
