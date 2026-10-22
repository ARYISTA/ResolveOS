"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Wifi,
  WifiOff,
  Key,
  Cpu,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/state/AppContext";
import {
  testConnection,
  login,
  logout,
  getAuthToken,
} from "@/lib/api/client";
import { resetMockData } from "@/lib/api/cases";

export default function SettingsPage() {
  const { state, dispatch, showToast } = useApp();

  // Local state for URLs
  const [apiBaseUrl, setApiBaseUrl] = useState(state.apiBaseUrl);
  const [wsUrl, setWsUrl] = useState(state.wsUrl);

  // Connection test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    status: number;
    message: string;
  } | null>(null);

  // Auth form state
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  // Check initial token status
  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  // Synchronize local input state if AppContext changes
  useEffect(() => {
    setApiBaseUrl(state.apiBaseUrl);
    setWsUrl(state.wsUrl);
  }, [state.apiBaseUrl, state.wsUrl]);

  // Test connection button handler
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(apiBaseUrl);
      setTestResult({
        tested: true,
        ok: res.ok,
        status: res.status,
        message: res.message,
      });

      if (res.ok) {
        showToast({
          title: "Connection test succeeded",
          message: `Backend at ${apiBaseUrl} responded with HTTP ${res.status}.`,
          type: "success",
        });
      } else {
        showToast({
          title: "Connection test failed",
          message: res.message,
          type: "warning",
        });
      }
    } catch (err) {
      setTestResult({
        tested: true,
        ok: false,
        status: 0,
        message: err instanceof Error ? err.message : "Unknown connection error",
      });
    } finally {
      setTesting(false);
    }
  };

  // Save URLs to AppContext
  const handleSaveEndpoints = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: "SET_ENDPOINTS",
      apiBaseUrl: apiBaseUrl.trim(),
      wsUrl: wsUrl.trim(),
    });
    showToast({
      title: "Settings saved",
      message: "API and WebSocket base URLs updated.",
      type: "success",
    });
  };

  // Auth login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login(username, password);
      setHasToken(true);
      setPassword("");
      showToast({
        title: "Authenticated successfully",
        message: `Signed in as ${username}. Token held in memory.`,
        type: "success",
      });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth logout handler
  const handleLogout = () => {
    logout();
    setHasToken(false);
    showToast({
      title: "Signed out",
      message: "Session token cleared from memory.",
      type: "info",
    });
  };

  // Reset demo data handler
  const handleResetData = () => {
    resetMockData();
    showToast({
      title: "Demo data reset",
      message: "All cases and escalations restored to seed state.",
      type: "success",
    });
  };

  // Switch mode with auto connection check if switching to live
  const handleModeSwitch = async (newMode: "mock" | "live") => {
    if (newMode === "live") {
      const res = await testConnection(apiBaseUrl);
      if (!res.ok) {
        dispatch({ type: "SET_FALLBACK", active: true });
        showToast({
          title: "Backend unreachable",
          message: "Could not reach live backend. Mock mode remains active as fallback.",
          type: "warning",
        });
        return;
      }
      dispatch({ type: "SET_FALLBACK", active: false });
    } else {
      dispatch({ type: "SET_FALLBACK", active: false });
    }
    dispatch({ type: "SET_MODE", mode: newMode });
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
          Manage runtime data sources, API connectivity, authentication, model configurations, and demo simulation parameters.
        </p>
      </div>

      {/* ─── 1. Runtime Mode Toggle Card ──────────────────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Runtime execution mode
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
              Switch between offline simulated agent execution and live Spring Boot / LangGraph services.
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background:
                state.mode === "live"
                  ? "var(--success-soft)"
                  : "var(--warning-soft)",
              color:
                state.mode === "live"
                  ? "var(--success)"
                  : "var(--warning)",
            }}
          >
            {state.mode === "live" ? "Live active" : "Mock active"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Mock Option */}
          <button
            type="button"
            onClick={() => handleModeSwitch("mock")}
            style={{
              padding: 16,
              borderRadius: 8,
              border:
                state.mode === "mock"
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
              background:
                state.mode === "mock"
                  ? "var(--surface-2)"
                  : "var(--surface)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--warning)",
                }}
              />
              <strong style={{ fontSize: 14, color: "var(--text)" }}>Mock mode</strong>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Deterministic in-browser execution with simulated multi-agent delays and offline fallbacks. Recommended for stage demos.
            </p>
          </button>

          {/* Live Option */}
          <button
            type="button"
            onClick={() => handleModeSwitch("live")}
            style={{
              padding: 16,
              borderRadius: 8,
              border:
                state.mode === "live"
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
              background:
                state.mode === "live"
                  ? "var(--surface-2)"
                  : "var(--surface)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--success)",
                }}
              />
              <strong style={{ fontSize: 14, color: "var(--text)" }}>Live mode</strong>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Connects to Spring Boot orchestrator and LangGraph pipeline over REST and native WebSocket streams.
            </p>
          </button>
        </div>
      </section>

      {/* ─── 2. Backend Connectivity & Connection Test ───────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Server size={18} color="var(--accent)" />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Backend endpoints & connectivity
          </h2>
        </div>

        <form onSubmit={handleSaveEndpoints} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                API base URL
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="http://localhost:8080"
                required
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                WebSocket base URL
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                required
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>

          {/* Connection Test Result Box */}
          {testResult && (
            <div
              role="alert"
              style={{
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: testResult.ok
                  ? "var(--success-soft)"
                  : "var(--warning-soft)",
                border: testResult.ok
                  ? "1px solid var(--success)"
                  : "1px solid var(--warning)",
              }}
            >
              {testResult.ok ? (
                <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ fontSize: 13 }}>
                <strong style={{ display: "block", color: "var(--text)" }}>
                  {testResult.ok
                    ? `Connection successful (HTTP ${testResult.status})`
                    : `Connection unsuccessful (${testResult.status ? `HTTP ${testResult.status}` : "Network offline"})`}
                </strong>
                <span style={{ color: "var(--text-muted)" }}>{testResult.message}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 500,
                cursor: testing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {testing ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span>{testing ? "Testing..." : "Test connection"}</span>
            </button>

            <button
              type="submit"
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: "var(--accent)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Save endpoints
            </button>
          </div>
        </form>
      </section>

      {/* ─── 3. Backend Authentication (In-Memory) ───────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={18} color="var(--accent)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Backend authentication
            </h2>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 999,
              background: hasToken ? "var(--success-soft)" : "var(--surface-2)",
              color: hasToken ? "var(--success)" : "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {hasToken ? <ShieldCheck size={14} /> : null}
            {hasToken ? "JWT in memory" : "Unauthenticated"}
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
          Per security guidelines, tokens are kept purely in memory and never written to localStorage. Re-authentication prompt triggers automatically if token expires.
        </p>

        {authError && (
          <div
            role="alert"
            style={{
              background: "var(--danger-soft)",
              border: "1px solid var(--danger)",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--danger)",
              marginBottom: 16,
            }}
          >
            {authError}
          </div>
        )}

        {hasToken ? (
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 8,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ fontSize: 13, display: "block" }}>Active session token</strong>
              <code style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Authorization: Bearer eyJhbGci...[SECURE]
              </code>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--danger)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear session
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

            <button
              type="submit"
              disabled={authLoading}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: "var(--accent)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 500,
                cursor: authLoading ? "not-allowed" : "pointer",
              }}
            >
              {authLoading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
        )}
      </section>

      {/* ─── 4. Model Configuration (Read-Only) ───────────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu size={18} color="var(--accent)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Model configuration (read-only)
            </h2>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 4,
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            RQ2 Evaluation Config
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px 0" }}>
          In Live mode, model choices and embedding hyperparameters are fixed by the backend deployment to guarantee deterministic benchmarking.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Decision LLM
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              Claude 3.5 Sonnet
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              Anthropic (v20241022)
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Embedding model
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              text-embedding-3-large
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              OpenAI (3072 dimensions)
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Chunking policy
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              512 tokens / 50 overlap
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              Semantic boundary splitting
            </div>
          </div>

          <div style={{ background: "var(--surface-2)", padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Retrieval Top-K
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              K = 4 clauses
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
              Threshold: score &ge; 0.85
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Demo Controls ────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Sliders size={18} color="var(--accent)" />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Demo controls & presentation helpers
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Reset Demo Data */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <strong style={{ fontSize: 14, display: "block" }}>Reset demo data</strong>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Clears added cases and restores original 24 seed cases across all domains.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RotateCcw size={14} />
              <span>Reset data</span>
            </button>
          </div>

          {/* Simulate Latency Speed */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <strong style={{ fontSize: 14, display: "block" }}>Simulate pipeline speed</strong>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Controls node progression pacing in Mock mode for presentation clarity.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["fast", "normal", "slow"] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => dispatch({ type: "SET_LATENCY_SPEED", speed: spd })}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 6,
                    border:
                      state.latencySpeed === spd
                        ? "1px solid var(--accent)"
                        : "1px solid var(--border)",
                    background:
                      state.latencySpeed === spd
                        ? "var(--accent-soft)"
                        : "transparent",
                    color:
                      state.latencySpeed === spd
                        ? "var(--accent)"
                        : "var(--text)",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* Force Escalation Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong style={{ fontSize: 14, display: "block" }}>Force human review (HITL)</strong>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                When enabled, forces all simulated cases to pause at the Human Review node.
              </p>
            </div>
            <label
              style={{
                position: "relative",
                display: "inline-block",
                width: 44,
                height: 24,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={state.forceEscalation}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FORCE_ESCALATION",
                    enabled: e.target.checked,
                  })
                }
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: state.forceEscalation
                    ? "var(--accent)"
                    : "var(--border)",
                  transition: "background 200ms ease",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: state.forceEscalation ? 22 : 2,
                  top: 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#ffffff",
                  transition: "left 200ms ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
