"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  isSubmitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  isSubmitting = false,
  onConfirm,
  onClose,
  triggerRef,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Manage Escape key and focus return
  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button on open
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }

      // Simple focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          triggerRef?.current?.focus();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 16px rgb(43 33 27 / 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          outline: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ marginTop: 2, flexShrink: 0 }}>
            {isDanger ? (
              <AlertCircle size={22} color="var(--danger)" strokeWidth={1.5} />
            ) : (
              <CheckCircle2 size={22} color="var(--success)" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <h3
              id="dialog-title"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text)",
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p
              id="dialog-description"
              style={{
                fontSize: 14,
                lineHeight: "22px",
                color: "var(--text-muted)",
                margin: "8px 0 0 0",
              }}
            >
              {description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: isDanger ? "var(--danger)" : "var(--accent)",
              color: isDanger ? "#ffffff" : "var(--on-accent)",
              fontSize: 13,
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
