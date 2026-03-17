"use client";

import { memo, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!open) return;
    if (mode === "prompt") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="dialog-shell"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(100%, 440px)",
          border: "2px solid #2A2A35",
          borderRadius: "16px",
          padding: "1rem",
          background: "linear-gradient(180deg, rgba(20,20,26,0.98), rgba(13,13,18,0.98))",
          boxShadow: "0 24px 40px -22px rgba(0,0,0,0.95)",
        }}
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
