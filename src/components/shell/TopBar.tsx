"use client";

import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { getAllDomains } from "@/lib/domains";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
  { value: "reviewer", label: "Reviewer" },
  { value: "auditor", label: "Auditor" },
] as const;

export function TopBar() {
  const { state, dispatch, toggleTheme, escalationCount } = useApp();
  const allDomains = getAllDomains();
  const activeDomain = allDomains.find((d) => d.id === state.domain);

  return (
    <header
      style={{
        height: 56,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      {/* Domain badge */}
      {activeDomain ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
          aria-label={`Active domain: ${activeDomain.name}`}
        >
          {activeDomain.name}
        </span>
      ) : (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--surface-2)",
            color: "var(--text-faint)",
          }}
        >
          No domain
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Company switcher — only when domain is set */}
      {activeDomain && (
        <select
          aria-label="Company"
          value={state.companyId ?? ""}
          onChange={(e) =>
            dispatch({ type: "SET_COMPANY", companyId: e.target.value })
          }
          style={{
            height: 32,
            padding: "0 8px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="" disabled>
            Select company
          </option>
          {activeDomain.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Role switcher */}
      <select
        aria-label="Role"
        value={state.role}
        onChange={(e) =>
          dispatch({
            type: "SET_ROLE",
            role: e.target.value as typeof state.role,
          })
        }
        style={{
          height: 32,
          padding: "0 8px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Mock / Live pill */}
      <button
        onClick={() =>
          dispatch({
            type: "SET_MODE",
            mode: state.mode === "mock" ? "live" : "mock",
          })
        }
        aria-label={`Mode: ${state.mode}. Click to switch.`}
        style={{
          height: 32,
          padding: "0 12px",
          borderRadius: 999,
          border: "1px solid var(--border-strong)",
          background:
            state.mode === "mock" ? "var(--warning-soft)" : "var(--success-soft)",
          color: state.mode === "mock" ? "var(--warning)" : "var(--success)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {state.mode === "mock" ? "Mock" : "Live"}
      </button>

      {/* Notification bell */}
      <Link
        href="/reviews"
        aria-label={`Human review escalations (${escalationCount} open)`}
        style={{
          position: "relative",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Bell size={18} strokeWidth={1.5} />
        {escalationCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--warning)",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {escalationCount}
          </span>
        )}
      </Link>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${state.theme === "light" ? "dark" : "light"} theme`}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {state.theme === "light" ? (
          <Moon size={18} strokeWidth={1.5} />
        ) : (
          <Sun size={18} strokeWidth={1.5} />
        )}
      </button>
    </header>
  );
}
