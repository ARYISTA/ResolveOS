"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getEscalations } from "@/lib/api/cases";
import { subscribeToEscalations } from "@/lib/api/ws";
import { formatINR } from "@/lib/utils";
import { useApp } from "@/state/AppContext";
import { getAllDomains } from "@/lib/domains";
import type { CaseRecord, Risk } from "@/lib/schemas";

function formatAge(isoString: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function getSlaRemaining(
  createdAt: string,
  slaMinutes: number
): { text: string; isBreached: boolean } {
  const deadline = new Date(createdAt).getTime() + slaMinutes * 60 * 1000;
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) {
    return { text: "Breached", isBreached: true };
  }
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  return { text: `${mins}m ${secs}s`, isBreached: false };
}

function renderRiskChip(risk: Risk = "HIGH") {
  const isHigh = risk === "HIGH";
  const isMed = risk === "MEDIUM";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: isHigh
          ? "var(--danger-soft)"
          : isMed
          ? "var(--warning-soft)"
          : "var(--success-soft)",
        color: isHigh
          ? "var(--danger)"
          : isMed
          ? "var(--warning)"
          : "var(--success)",
      }}
    >
      {isHigh ? (
        <AlertCircle size={12} strokeWidth={2} />
      ) : isMed ? (
        <AlertTriangle size={12} strokeWidth={2} />
      ) : (
        <CheckCircle2 size={12} strokeWidth={2} />
      )}
      <span>{risk}</span>
    </span>
  );
}

export default function ReviewQueuePage() {
  const { state } = useApp();
  const allDomains = getAllDomains();
  const currentDomain = allDomains.find((d) => d.id === state.domain);
  const slaMinutes = currentDomain?.slaMinutes ?? 30;

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Fetch escalated cases
  const loadEscalations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEscalations();
      setCases(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load review queue"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEscalations();
  }, [loadEscalations, state.mode, state.domain]);

  // Live WebSocket updates
  useEffect(() => {
    const unsub = subscribeToEscalations((event) => {
      if (event.type === "HITL_REQUIRED") {
        // Reload list when a new escalation arrives
        getEscalations()
          .then((updated) => setCases(updated))
          .catch(() => {});
      } else if (event.type === "HITL_RESOLVED") {
        // Immediately remove resolved case from the queue
        setCases((prev) => prev.filter((c) => c.id !== event.caseId));
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Update SLA countdown & age every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        paddingBottom: 48,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "3px 10px",
              borderRadius: 999,
              marginBottom: 8,
            }}
          >
            <ClipboardList size={13} />
            <span>Human-in-the-loop oversight</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              lineHeight: "34px",
              fontWeight: 500,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Human review queue
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            High-risk disputes, boundary exceptions, and claims exceeding
            autonomous approval thresholds awaiting reviewer adjudication.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            {cases.length} {cases.length === 1 ? "case pending" : "cases pending"}
          </span>

          <button
            type="button"
            onClick={loadEscalations}
            disabled={isLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 34,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 12,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              size={13}
              className={isLoading ? "animate-spin" : undefined}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Loading Skeleton ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface)",
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
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 16,
                  borderRadius: 4,
                  background: "var(--surface-2)",
                }}
              />
              <div
                style={{
                  width: 140,
                  height: 16,
                  borderRadius: 4,
                  background: "var(--surface-2)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: 16,
                  borderRadius: 4,
                  background: "var(--surface-2)",
                }}
              />
              <div
                style={{
                  width: 80,
                  height: 16,
                  borderRadius: 4,
                  background: "var(--surface-2)",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ─── Error State ─────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div
          style={{
            border: "1px solid var(--danger)",
            borderRadius: 12,
            padding: 24,
            background: "var(--danger-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--danger)",
                margin: 0,
              }}
            >
              Unable to load review queue
            </h4>
            <p
              style={{
                fontSize: 13,
                color: "var(--danger)",
                margin: "4px 0 0 0",
              }}
            >
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadEscalations}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 6,
              background: "var(--danger)",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────────────────── */}
      {!isLoading && !error && cases.length === 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 48,
            background: "var(--surface)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--surface-2)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={22} strokeWidth={1.5} />
          </div>

          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              margin: 0,
              maxWidth: 420,
              lineHeight: "22px",
            }}
          >
            Queue is empty. No cases currently require compliance review.
          </p>

          <Link
            href="/customer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 16px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              marginTop: 4,
            }}
          >
            <span>Raise dispute in customer simulator</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ─── Review Queue Table ──────────────────────────────────────────────── */}
      {!isLoading && !error && cases.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                  height: 44,
                }}
              >
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  Case ID
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  Customer
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12, textAlign: "right" }}>
                  Amount
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  Risk level
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  Reason for escalation
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  Age
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12 }}>
                  SLA timer
                </th>
                <th style={{ padding: "0 16px", fontWeight: 500, color: "var(--text-muted)", fontSize: 12, textAlign: "right" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => {
                const sla = getSlaRemaining(c.createdAt, slaMinutes);

                return (
                  <tr
                    key={c.id || idx}
                    style={{
                      height: 48,
                      borderBottom:
                        idx < cases.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      transition: "background 150ms ease-out",
                    }}
                    className="hover:bg-[var(--surface-2)]"
                  >
                    {/* Case ID */}
                    <td style={{ padding: "0 16px" }}>
                      <Link
                        href={`/reviews/${c.id}`}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        {c.id}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "0 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 500, color: "var(--text)" }}>
                          {c.customerName}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {c.customerTier}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        padding: "0 16px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {formatINR(c.requestedAmount)}
                    </td>

                    {/* Risk Level */}
                    <td style={{ padding: "0 16px" }}>
                      {renderRiskChip(c.riskLevel || "HIGH")}
                    </td>

                    {/* Escalation Reason */}
                    <td
                      style={{
                        padding: "0 16px",
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text-muted)",
                      }}
                      title={
                        c.escalationReason ||
                        "Amount exceeds auto-approve threshold. Risk level HIGH."
                      }
                    >
                      {c.escalationReason ||
                        "Amount exceeds auto-approve threshold. Risk level HIGH."}
                    </td>

                    {/* Age */}
                    <td
                      style={{
                        padding: "0 16px",
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatAge(c.createdAt)}
                    </td>

                    {/* SLA Timer */}
                    <td style={{ padding: "0 16px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: sla.isBreached
                            ? "var(--danger)"
                            : "var(--warning)",
                          background: sla.isBreached
                            ? "var(--danger-soft)"
                            : "var(--warning-soft)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        <Clock size={12} strokeWidth={2} />
                        <span>{sla.text}</span>
                      </div>
                    </td>

                    {/* Action link */}
                    <td style={{ padding: "0 16px", textAlign: "right" }}>
                      <Link
                        href={`/reviews/${c.id}`}
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
                        <span>Review</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
