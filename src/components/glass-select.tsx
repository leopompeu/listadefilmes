"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function GlassSelect({ value, options, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    if (selected) return selected.label;
    return placeholder ?? "Selecionar";
  }, [options, placeholder, value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="glass-select-root">
      <button
        type="button"
        className="glass-input glass-select-trigger w-full"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="glass-select-chevron">⌄</span>
      </button>

      <div className="glass-select-menu" data-open={open}>
        <div className="glass-select-menu-scroll">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="glass-select-option"
              data-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
