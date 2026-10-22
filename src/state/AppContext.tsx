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
import { configureClient, login, onAuthExpired } from "@/lib/api/client";
import { configureWs, subscribeToEscalations } from "@/lib/api/ws";
import { getEscalations } from "@/lib/api/cases";

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
  apiBaseUrl: "http://localhost:8080",
  wsUrl: "ws://localhost:8080",
  fallbackActive: false,
  latencySpeed: "normal",
  forceEscalation: false,
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
    case "SET_ENDPOINTS":
      return { ...state, apiBaseUrl: action.apiBaseUrl, wsUrl: action.wsUrl };
    case "SET_FALLBACK":
      return { ...state, fallbackActive: action.active };
    case "SET_LATENCY_SPEED":
      return { ...state, latencySpeed: action.speed };
    case "SET_FORCE_ESCALATION":
      return { ...state, forceEscalation: action.enabled };
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

  // Keep HTTP client and WebSocket URLs synchronized with state
  useEffect(() => {
    configureClient(state.mode, state.apiBaseUrl);
    configureWs(state.wsUrl);
  }, [state.mode, state.apiBaseUrl, state.wsUrl]);

  // In-memory authentication re-login dialog state (PRD Section 11 & Task)
  const [reloginOpen, setReloginOpen] = useState(false);
  const [reloginUser, setReloginUser] = useState("admin");
  const [reloginPass, setReloginPass] = useState("");
  const [reloginLoading, setReloginLoading] = useState(false);
  const [reloginError, setReloginError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthExpired(() => {
      setReloginOpen(true);
      setReloginError("Your session token has expired. Please re-authenticate.");
    });
    return unsub;
  }, []);

  const handleRelogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setReloginLoading(true);
    setReloginError(null);
    try {
      await login(reloginUser, reloginPass);
      setReloginOpen(false);
      setReloginPass("");
      showToast({
        title: "Session restored",
        message: "Successfully re-authenticated with backend.",
        type: "success",
      });
    } catch (err) {
      setReloginError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setReloginLoading(false);
    }
  };

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
      {/* ─── Offline / Backend Unreachable Fallback Banner (PRD 11) ────────── */}
      {state.fallbackActive && (
        <aside
          role="status"
          aria-live="polite"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 9998,
            background: "var(--warning-soft)",
            borderBottom: "1px solid var(--warning)",
            padding: "8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--text)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span>
              <strong>Fallback active:</strong> Live backend at {state.apiBaseUrl} is unreachable. Operating in Mock mode.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/settings"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--accent)",
                textDecoration: "underline",
              }}
            >
              Check settings
            </Link>
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_FALLBACK", active: false })}
              aria-label="Dismiss fallback notification"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--text-muted)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {children}

      {/* ─── Non-disruptive Re-login Dialog (PRD Section 11) ───────────────── */}
      {reloginOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="relogin-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <h3 id="relogin-title" style={{ margin: "0 0 8px 0", fontSize: 18 }}>
              Authentication required
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Your live session token has expired. Enter your credentials to continue without losing your current screen state.
            </p>

            {reloginError && (
              <div
                role="alert"
                style={{
                  background: "var(--danger-soft)",
                  border: "1px solid var(--danger)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "var(--danger)",
                  marginBottom: 16,
                }}
              >
                {reloginError}
              </div>
            )}

            <form onSubmit={handleRelogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={reloginUser}
                  onChange={(e) => setReloginUser(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={reloginPass}
                  onChange={(e) => setReloginPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setReloginOpen(false);
                    dispatch({ type: "SET_MODE", mode: "mock" });
                    showToast({
                      title: "Switched to Mock",
                      message: "Operating in offline Mock mode.",
                      type: "info",
                    });
                  }}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Switch to Mock
                </button>
                <button
                  type="submit"
                  disabled={reloginLoading}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--accent)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: reloginLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {reloginLoading ? "Authenticating..." : "Log in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
