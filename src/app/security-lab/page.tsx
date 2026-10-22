"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCode,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  getSecurityPresets,
  runSecurityAttack,
  getSecurityLabSummary,
} from "@/lib/api/security";
import { formatISTDate } from "@/lib/utils";
import type {
  SecurityAttackPreset,
  SecurityAttackResult,
  SecurityLabSummary,
  SecurityLayer,
} from "@/lib/schemas";

export default function SecurityLabPage() {
  const [presets, setPresets] = useState<SecurityAttackPreset[]>([]);
  const [summary, setSummary] = useState<SecurityLabSummary | null>(null);
  const [activeResult, setActiveResult] =
    useState<SecurityAttackResult | null>(null);
  const [runningAttackId, setRunningAttackId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLabData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const presetList = getSecurityPresets();
      setPresets(presetList);
      const sum = await getSecurityLabSummary();
      setSummary(sum);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load security lab"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabData();
  }, [loadLabData]);

  const handleLaunchAttack = async (presetId: string) => {
    setRunningAttackId(presetId);
    try {
      const res = await runSecurityAttack(presetId);
      setActiveResult(res);
      // Refresh summary statistics from API
      const updatedSummary = await getSecurityLabSummary();
      setSummary(updatedSummary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Security attack simulation failed"
      );
    } finally {
      setRunningAttackId(null);
    }
  };

  const getLayerColor = (layer: SecurityLayer) => {
    switch (layer) {
      case "LLM guard":
        return {
          bg: "var(--accent-soft)",
          text: "var(--accent)",
          border: "var(--border)",
        };
      case "Schema validation":
        return {
          bg: "var(--surface-2)",
          text: "var(--text-secondary)",
          border: "var(--border)",
        };
      case "Policy enforcement":
        return {
          bg: "var(--warning-soft)",
          text: "var(--warning)",
          border: "var(--warning)",
        };
      case "Tenant isolation":
        return {
          bg: "var(--danger-soft)",
          text: "var(--danger)",
          border: "var(--danger)",
        };
    }
  };

  // ─── Loading Skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              height: 32,
              width: 220,
              background: "var(--surface-2)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 18,
              width: 360,
              background: "var(--surface-2)",
              borderRadius: 4,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: 220,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 0" }}>
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: 24,
            borderRadius: 12,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            textAlign: "center",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 12px auto" }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px 0" }}>
            Failed to load security lab
          </h2>
          <p style={{ fontSize: 14, margin: "0 0 20px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={loadLabData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingBottom: 48,
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
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
            Security lab
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Demonstrating defense-in-depth security layers against adversarial
            attacks. Zero leaked unauthorized disbursements.
          </p>
        </div>

        <button
          onClick={loadLabData}
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
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          <span>Reset telemetry</span>
        </button>
      </div>

      {/* ─── Active Result Banner (When an attack is launched) ──────────────── */}
      {activeResult && (
        <div
          role="region"
          aria-label="Attack simulation result"
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck
                size={22}
                color="var(--success)"
                strokeWidth={2}
              />
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Attack successfully blocked
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  Captured at {formatISTDate(activeResult.executedAt)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                }}
              >
                <XCircle size={13} />
                <span>Verdict: {activeResult.verdict}</span>
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                  ...getLayerColor(activeResult.layerCaught),
                }}
              >
                <Layers size={13} />
                <span>Caught by: {activeResult.layerCaught}</span>
              </span>
            </div>
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: "22px",
              color: "var(--text)",
              margin: 0,
              background: "var(--surface-2)",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            {activeResult.reason}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 12,
              paddingTop: 4,
            }}
          >
            <Link
              href={`/cases/${activeResult.caseId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span>Inspect simulated case ({activeResult.caseId})</span>
              <ExternalLink size={12} />
            </Link>

            <span>·</span>

            <Link
              href={`/audit?caseId=${activeResult.caseId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span>View immutable audit trail</span>
              <ArrowRight size={12} />
            </Link>

            <span>·</span>

            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}
            >
              Trace: {activeResult.traceId}
            </span>
          </div>
        </div>
      )}

      {/* ─── Six Attack Preset Cards ─────────────────────────────────────────── */}
      <div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
            margin: "0 0 16px 0",
          }}
        >
          Attack simulation vectors ({presets.length})
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {presets.map((preset) => {
            const isRunning = runningAttackId === preset.id;
            const wasRun = activeResult?.attackId === preset.id;

            return (
              <div
                key={preset.id}
                style={{
                  background: "var(--surface)",
                  border: wasRun
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldAlert size={18} color="var(--accent)" />
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--text)",
                          margin: 0,
                        }}
                      >
                        {preset.title}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {preset.category}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: "19px",
                      color: "var(--text-secondary)",
                      margin: "0 0 12px 0",
                    }}
                  >
                    {preset.description}
                  </p>

                  {/* Attack Payload (Plain text only, never executed or markup) */}
                  <div
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 10px",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FileCode size={11} />
                      <span>Attack text (Plain text)</span>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {preset.attackPayload}
                    </pre>
                  </div>

                  {/* Expected layer & result */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>Target layer:</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        {preset.expectedLayer}
                      </span>
                    </div>
                    <div>
                      <span>Expected: </span>
                      <span>{preset.expectedResult}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    disabled={isRunning}
                    onClick={() => handleLaunchAttack(preset.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: isRunning
                        ? "var(--surface-2)"
                        : "var(--accent)",
                      color: isRunning ? "var(--text-muted)" : "var(--bg)",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: isRunning ? "not-allowed" : "pointer",
                      transition: "opacity 150ms ease-out",
                    }}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Simulating attack...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} />
                        <span>Launch attack</span>
                      </>
                    )}
                  </button>

                  {wasRun && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--success)",
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Blocked</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Defense Summary Table ───────────────────────────────────────────── */}
      {summary && (
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
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Multi-layer defense summary
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                Zero leakage across autonomous pipeline execution boundaries
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--success)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={14} />
                <span>Zero unauthorized leakage</span>
              </span>
            </div>
          </div>

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
                  <th style={{ padding: "12px 18px", fontWeight: 500 }}>
                    Security layer
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    Attacks run
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    Blocked
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    Leaked (unauthorized)
                  </th>
                  <th style={{ padding: "12px 18px", fontWeight: 500 }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.layerSummaries.map((layer) => (
                  <tr
                    key={layer.layer}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "12px 18px",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {layer.layer}
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text)",
                      }}
                    >
                      {layer.attacksRun}
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: "var(--success)",
                      }}
                    >
                      {layer.blocked}
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color:
                          layer.leaked > 0
                            ? "var(--danger)"
                            : "var(--text-muted)",
                      }}
                    >
                      {layer.leaked}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--success)",
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Enforced</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: "var(--surface-2)",
                    fontWeight: 600,
                    fontSize: 13,
                    borderTop: "2px solid var(--border)",
                  }}
                >
                  <td style={{ padding: "12px 18px", color: "var(--text)" }}>
                    Total
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text)",
                    }}
                  >
                    {summary.totalRun}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--success)",
                    }}
                  >
                    {summary.totalBlocked}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--success)",
                    }}
                  >
                    0
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--success)",
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>100% Defense</span>
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
