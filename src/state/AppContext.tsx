"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { X, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import type { AppState, AppAction } from "@/lib/schemas";
import { getEscalations } from "@/lib/api/cases";
import { subscribeToEscalations } from "@/lib/api/ws";

// ─── Toast Types ─────────────────────────────────────────────────────────────

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: "info" | "success" | "warning" | "danger";
  persistent?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: AppState = {
  domain: null,
  companyId: null,
  role: "admin",
  mode: "mock",
  theme: "light",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_DOMAIN":
      return { ...state, domain: action.domain, companyId: null };
    case "SET_COMPANY":
      return { ...state, companyId: action.companyId };
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_THEME":
      return { ...state, theme: action.theme };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  toggleTheme: () => void;
  escalationCount: number;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [escalationCount, setEscalationCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync theme class on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [state.theme]);

  // Detect system preference on first mount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.matches) {
      dispatch({ type: "SET_THEME", theme: "dark" });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({
      type: "SET_THEME",
      theme: state.theme === "light" ? "dark" : "light",
    });
  }, [state.theme]);

  // Toast actions
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, item]);

      if (!toast.persistent) {
        setTimeout(() => {
          dismissToast(id);
        }, 5000);
      }
      return id;
    },
    [dismissToast]
  );

  // Initial load of open escalations count
  useEffect(() => {
    let mounted = true;
    getEscalations()
      .then((cases) => {
        if (mounted) {
          setEscalationCount(cases.length);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [state.mode, state.domain]);

  // Live WebSocket subscription to global escalation events
  useEffect(() => {
    const unsubscribe = subscribeToEscalations((event) => {
      if (event.type === "HITL_REQUIRED") {
        setEscalationCount((prev) => prev + 1);

        // Persistent toast per PRD & design.md section 6
        showToast({
          title: "New human review escalation",
          message: `Case ${event.caseId} escalated: ${event.reason}`,
          type: "warning",
          persistent: true,
          actionUrl: `/reviews/${event.caseId}`,
          actionLabel: "Review case",
        });
      } else if (event.type === "HITL_RESOLVED") {
        setEscalationCount((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        toggleTheme,
        escalationCount,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}

      {/* ─── Global Toasts Container (bottom-right per design.md) ────────── */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 380,
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const isWarning = t.type === "warning";
          const isSuccess = t.type === "success";

          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: "auto",
                background: "var(--surface)",
                border: isWarning
                  ? "1px solid var(--warning)"
                  : isSuccess
                  ? "1px solid var(--success)"
                  : "1px solid var(--border)",
                borderRadius: 12,
                padding: "14px 16px",
                boxShadow: "0 4px 16px rgb(43 33 27 / 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 200ms ease-out",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isWarning ? (
                    <AlertTriangle
                      size={16}
                      strokeWidth={2}
                      color="var(--warning)"
                    />
                  ) : isSuccess ? (
                    <CheckCircle2
                      size={16}
                      strokeWidth={2}
                      color="var(--success)"
                    />
                  ) : (
                    <Info size={16} strokeWidth={1.5} color="var(--accent)" />
                  )}

                  <h5
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      margin: 0,
                    }}
                  >
                    {t.title}
                  </h5>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  aria-label="Dismiss notification"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {t.message && (
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: "18px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {t.message}
                </p>
              )}

              {t.actionUrl && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Link
                    href={t.actionUrl}
                    onClick={() => dismissToast(t.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--accent)",
                      textDecoration: "none",
                    }}
                  >
                    <span>{t.actionLabel || "View"}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
