"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  XCircle,
  Inbox,
  AlertCircle,
  Bot,
  User,
  Server,
  FileJson,
} from "lucide-react";
import { getAuditEvents } from "@/lib/api/audit";
import { downloadCsv } from "@/lib/csv";
import { formatISTDate } from "@/lib/utils";
import type {
  AuditRecord,
  AuditActionType,
  AuditActorType,
} from "@/lib/schemas";

function AuditTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL query filter state
  const currentAction =
    (searchParams.get("action") as AuditActionType | "ALL") || "ALL";
  const currentActorType =
    (searchParams.get("actorType") as AuditActorType | "ALL") || "ALL";
  const currentCaseId = searchParams.get("caseId") || "";

  // Local input for immediate feedback
  const [caseIdInput, setCaseIdInput] = useState(currentCaseId);

  // Expanded rows set
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    new Set()
  );

  const [events, setEvents] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCaseIdInput(currentCaseId);
  }, [currentCaseId]);

  // URL update helper
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Fetch audit records
  const fetchAuditData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuditEvents({
        action: currentAction !== "ALL" ? currentAction : undefined,
        actorType: currentActorType !== "ALL" ? currentActorType : undefined,
        caseId: currentCaseId || undefined,
      });
      setEvents(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit records"
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentAction, currentActorType, currentCaseId]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // CSV export of currently filtered events
  const handleExportCsv = () => {
    const headers = [
      { key: "id", label: "Event ID" },
      { key: "ts", label: "Timestamp (ISO)" },
      { key: "tenant", label: "Tenant" },
      { key: "caseId", label: "Case ID" },
      { key: "actor", label: "Actor" },
      { key: "actorType", label: "Actor Type" },
      { key: "action", label: "Action" },
      { key: "oldState", label: "Old State" },
      { key: "newState", label: "New State" },
      { key: "traceId", label: "Trace ID" },
      { key: "metadata", label: "Metadata" },
    ];
    downloadCsv(
      `resolvos-audit-log-${new Date().toISOString().slice(0, 10)}`,
      headers,
      events as unknown as Record<string, unknown>[]
    );
  };

  const clearAllFilters = () => {
    setCaseIdInput("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentAction !== "ALL" || currentActorType !== "ALL" || currentCaseId
  );

  const renderActorBadge = (type: AuditActorType) => {
    let bg = "var(--surface-2)";
    let color = "var(--text-muted)";
    let Icon = Server;

    switch (type) {
      case "AI":
        bg = "var(--accent-soft)";
        color = "var(--accent)";
        Icon = Bot;
        break;
      case "Human":
        bg = "var(--warning-soft)";
        color = "var(--warning)";
        Icon = User;
        break;
      case "System":
        bg = "var(--surface-2)";
        color = "var(--text-secondary)";
        Icon = Server;
        break;
      case "Customer":
        bg = "var(--success-soft)";
        color = "var(--success)";
        Icon = User;
        break;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 7px",
          borderRadius: 999,
          background: bg,
          color,
          border: "1px solid var(--border)",
        }}
      >
        <Icon size={11} />
        <span>{type}</span>
      </span>
    );
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingBottom: 48,
      }}
    >
      {/* ─── Page Header & CSV Export ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Audit log
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Immutable event record for compliance and research verification.
            Click any row to inspect metadata payload.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={fetchAuditData}
            aria-label="Refresh audit records"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={14}
              className={isLoading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={events.length === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 500,
              cursor: events.length === 0 ? "not-allowed" : "pointer",
              opacity: events.length === 0 ? 0.6 : 1,
            }}
          >
            <Download size={14} />
            <span>Export to CSV ({events.length})</span>
          </button>
        </div>
      </div>

      {/* ─── Filters Bar (Syncs to URL) ────────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          {/* Action Filter (8 PRD event types) */}
          <div>
            <label
              htmlFor="filter-action"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Action type
            </label>
            <select
              id="filter-action"
              value={currentAction}
              onChange={(e) => updateUrlParams({ action: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="ALL">All action types</option>
              <option value="CASE_CREATED">CASE_CREATED</option>
              <option value="POLICY_RETRIEVED">POLICY_RETRIEVED</option>
              <option value="AI_DECISION_GENERATED">AI_DECISION_GENERATED</option>
              <option value="RULE_CHECKED">RULE_CHECKED</option>
              <option value="HITL_TRIGGERED">HITL_TRIGGERED</option>
              <option value="HUMAN_APPROVED">HUMAN_APPROVED</option>
              <option value="REFUND_EXECUTED">REFUND_EXECUTED</option>
              <option value="REFUND_FAILED">REFUND_FAILED</option>
            </select>
          </div>

          {/* Actor Type Filter */}
          <div>
            <label
              htmlFor="filter-actor-type"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Actor type
            </label>
            <select
              id="filter-actor-type"
              value={currentActorType}
              onChange={(e) => updateUrlParams({ actorType: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="ALL">All actor types</option>
              <option value="AI">AI Agent</option>
              <option value="System">System Control</option>
              <option value="Human">Human Reviewer</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          {/* Search by Case ID */}
          <div>
            <label
              htmlFor="filter-case-id"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Search by case ID
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="filter-case-id"
                type="text"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateUrlParams({ caseId: caseIdInput });
                  }
                }}
                onBlur={() => {
                  if (caseIdInput !== currentCaseId) {
                    updateUrlParams({ caseId: caseIdInput });
                  }
                }}
                placeholder="e.g. case-bk-1014"
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div
            style={{
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={clearAllFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                background: "transparent",
                color: "var(--accent)",
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <XCircle size={13} />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Loading Skeleton ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 44,
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
            }}
          />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: 48,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 16,
              }}
            >
              <div
                style={{
                  height: 14,
                  width: 120,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 100,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 140,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ─── Error State ─────────────────────────────────────────────────── */
        <div
          style={{
            padding: 32,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--danger)",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 10px auto" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px 0" }}>
            Failed to load audit records
          </h2>
          <p style={{ fontSize: 13, margin: "0 0 16px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={fetchAuditData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      ) : events.length === 0 ? (
        /* ─── Empty State ─────────────────────────────────────────────────── */
        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <Inbox
            size={36}
            strokeWidth={1.5}
            style={{ margin: "0 auto 12px auto", color: "var(--text-muted)" }}
          />
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            No audit events found
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {hasActiveFilters
              ? "No events match the selected filters. Clear filters to view full log."
              : "No audit records recorded yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--bg)",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              <XCircle size={14} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      ) : (
        /* ─── Audit Log Table ─────────────────────────────────────────────── */
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--surface-2)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  <th style={{ width: 32, padding: "12px 8px 12px 16px" }} />
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Timestamp (IST)
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Tenant
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Case ID
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Actor
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Actor type
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    Action
                  </th>
                  <th style={{ padding: "12px 12px", fontWeight: 500 }}>
                    State transition
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Trace ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const isExpanded = expandedRowIds.has(ev.id);

                  return (
                    <tbody key={ev.id}>
                      <tr
                        tabIndex={0}
                        onClick={() => toggleRow(ev.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleRow(ev.id);
                          }
                        }}
                        style={{
                          borderBottom: isExpanded
                            ? "none"
                            : "1px solid var(--border)",
                          cursor: "pointer",
                          transition: "background 150ms ease-out",
                          background: isExpanded
                            ? "var(--surface-2)"
                            : "transparent",
                          outline: "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background =
                              "var(--surface-2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {/* Expand toggle */}
                        <td
                          style={{
                            padding: "12px 8px 12px 16px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={15} />
                          ) : (
                            <ChevronRight size={15} />
                          )}
                        </td>

                        {/* Timestamp in IST */}
                        <td
                          style={{
                            padding: "12px 12px",
                            color: "var(--text-muted)",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatISTDate(ev.ts)}
                        </td>

                        {/* Tenant */}
                        <td
                          style={{
                            padding: "12px 12px",
                            color: "var(--text)",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.tenant}
                        </td>

                        {/* Case ID */}
                        <td
                          style={{
                            padding: "12px 12px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 500,
                            color: "var(--accent)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Link
                            href={`/cases/${ev.caseId}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: "inherit",
                              textDecoration: "underline",
                            }}
                          >
                            {ev.caseId}
                          </Link>
                        </td>

                        {/* Actor */}
                        <td
                          style={{
                            padding: "12px 12px",
                            color: "var(--text)",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.actor}
                        </td>

                        {/* Actor type */}
                        <td style={{ padding: "12px 12px" }}>
                          {renderActorBadge(ev.actorType)}
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            padding: "12px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.action}
                        </td>

                        {/* Old state -> New state */}
                        <td
                          style={{
                            padding: "12px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>{ev.oldState}</span>
                          <span style={{ margin: "0 4px" }}>&rarr;</span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text)",
                            }}
                          >
                            {ev.newState}
                          </span>
                        </td>

                        {/* Trace ID */}
                        <td
                          style={{
                            padding: "12px 16px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.traceId}
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata Block (Plain text) */}
                      {isExpanded && (
                        <tr
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: "var(--surface-2)",
                          }}
                        >
                          <td colSpan={9} style={{ padding: "0 16px 16px 40px" }}>
                            <div
                              style={{
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: 14,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--text-muted)",
                                  marginBottom: 8,
                                }}
                              >
                                <FileJson size={13} />
                                <span>Metadata Payload (Plain text)</span>
                              </div>
                              <pre
                                style={{
                                  margin: 0,
                                  fontFamily: "var(--font-mono)",
                                  fontSize: 12,
                                  lineHeight: "18px",
                                  color: "var(--text)",
                                  overflowX: "auto",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {JSON.stringify(ev.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
          <div
            style={{
              height: 36,
              width: 180,
              background: "var(--surface-2)",
              borderRadius: 6,
              marginBottom: 16,
            }}
          />
          <div
            style={{
              height: 400,
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          />
        </div>
      }
    >
      <AuditTableContent />
    </Suspense>
  );
}
