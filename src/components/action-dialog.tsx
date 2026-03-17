"use client";

import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  mode: "confirm" | "prompt";
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
  value?: string;
  onValueChange?: (value: string) => void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ActionDialog = memo(function ActionDialog({
  open,
  mode,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "default",
  value = "",
  onValueChange,
  confirmDisabled = false,
  confirmLoading = false,
  onConfirm,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    if (!mounted) return;
    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timeout);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (mode === "prompt") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mounted, mode]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      data-state={visible ? "open" : "closed"}
      role="presentation"
      onClick={onClose}
    >
      <div
        className="dialog-shell"
        data-state={visible ? "open" : "closed"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-200">{description}</p> : null}

        {mode === "prompt" ? (
          <div className="mt-4">
            <input
              ref={inputRef}
              className="glass-input w-full"
              value={value}
              onChange={(event) => onValueChange?.(event.target.value)}
              maxLength={50}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !confirmDisabled) onConfirm();
              }}
            />
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="glass-secondary px-4 py-2 text-sm" type="button" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={tone === "danger" ? "liquid-button dialog-danger px-4 py-2 text-sm" : "liquid-button px-4 py-2 text-sm"}
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? "Salvando..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
