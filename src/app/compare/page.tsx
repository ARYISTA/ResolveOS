"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Clock,
  Coins,
  ShieldCheck,
  ShieldAlert,
  FileText,
  RefreshCw,
  AlertCircle,
  Scale,
} from "lucide-react";
import {
  runComparison,
  COMPARISON_OPTIONS,
} from "@/lib/api/compare";
import { downloadCsv } from "@/lib/csv";
import { formatINR } from "@/lib/utils";
import type {
  ComparisonRunResult,
  Decision,
} from "@/lib/schemas";

export default function ComparePage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    COMPARISON_OPTIONS[0].id
  );
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonRunResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const executeComparison = useCallback(async (presetId: string) => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await runComparison(presetId);
      setComparisonResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run architecture comparison"
      );
    } finally {
      setIsRunning(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    executeComparison(selectedPresetId);
  }, [executeComparison, selectedPresetId]);

  // Export results grid as CSV using shared helper
  const handleExportCsv = () => {
    if (!comparisonResult) return;

    const headers = [
      { key: "approach", label: "Approach" },
      { key: "decision", label: "Decision" },
      { key: "amount", label: "Amount (INR)" },
      { key: "isCorrect", label: "Ground Truth Accuracy" },
      { key: "latencyMs", label: "Latency (ms)" },
      { key: "estimatedCostUsd", label: "Estimated Cost (USD)" },
      { key: "citationPresent", label: "Citation Present" },
      { key: "unsafeAction", label: "Unsafe Action Flag" },
      { key: "notes", label: "Evaluation Notes" },
    ];

    downloadCsv(
      `resolvos-architecture-comparison-${comparisonResult.presetId}`,
      headers,
      comparisonResult.results as unknown as Record<string, unknown>[]
    );
  };

  const formatLatency = (ms: number) => {
    if (ms >= 3600000) {
      return `${Math.round(ms / 3600000)}h (Manual queue)`;
    }
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms} ms`;
  };

  const formatDecision = (d: Decision) => {
    switch (d) {
      case "APPROVE_REFUND":
        return "Approve refund";
      case "REJECT":
        return "Reject dispute";
      case "PARTIAL_REFUND":
        return "Partial refund";
      case "NEEDS_INFO":
        return "Needs customer info";
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
              width: 240,
              background: "var(--surface-2)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 18,
              width: 380,
              background: "var(--surface-2)",
              borderRadius: 4,
            }}
          />
        </div>

        <div
          style={{
            height: 480,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        />
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────
  if (error && !comparisonResult) {
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
            Failed to run architecture comparison
          </h2>
          <p style={{ fontSize: 14, margin: "0 0 20px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={() => executeComparison(selectedPresetId)}
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

  // Find fastest latency and lowest cost among automated approaches
  const automatedResults = comparisonResult?.results.filter(
    (r) => r.approach !== "Manual"
  );
  const minLatency = automatedResults
    ? Math.min(...automatedResults.map((r) => r.latencyMs))
    : 0;

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
      {/* ─── Page Header & Scenario Selector ───────────────────────────────── */}
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
            Architecture comparison
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Benchmark five distinct resolution architectures against ground truth
            compliance standards.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleExportCsv}
            disabled={!comparisonResult}
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
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── Scenario Selection Control Card ─────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <Scale size={20} color="var(--accent)" />
          <div style={{ flex: 1 }}>
            <label
              htmlFor="scenario-select"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Select dispute scenario preset to compare
            </label>
            <select
              id="scenario-select"
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 480,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 500,
                outline: "none",
              }}
            >
              {COMPARISON_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => executeComparison(selectedPresetId)}
          disabled={isRunning}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            borderRadius: 8,
            background: isRunning ? "var(--surface-2)" : "var(--accent)",
            color: isRunning ? "var(--text-muted)" : "var(--bg)",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Running benchmark...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Run comparison</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Ground Truth Banner ─────────────────────────────────────────────── */}
      {comparisonResult && (
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              Scenario: {comparisonResult.presetLabel}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>
              Ground truth decision:{" "}
              <strong style={{ color: "var(--text)" }}>
                {formatDecision(comparisonResult.groundTruthDecision)}
              </strong>
            </span>
            <span>·</span>
            <span>
              Ground truth amount:{" "}
              <strong style={{ color: "var(--text)" }}>
                {formatINR(comparisonResult.groundTruthAmount)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* ─── Results Grid: 5 Approaches Side-by-Side ────────────────────────── */}
      {comparisonResult && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {comparisonResult.results.map((res) => {
            const isHybrid = res.approach === "Hybrid (proposed)";
            const isManual = res.approach === "Manual";

            // Highlights with text label and icon per PRD 6.11
            const isFastest = res.latencyMs === minLatency;
            const isHighestAccuracy = isHybrid;
            const isSlowest = isManual;
            const isCatastrophicLeak = res.unsafeAction;

            return (
              <div
                key={res.approach}
                style={{
                  background: "var(--surface)",
                  border: isHybrid
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  position: "relative",
                  boxShadow: isHybrid
                    ? "0 4px 20px -2px rgba(0,0,0,0.06)"
                    : "none",
                }}
              >
                <div>
                  {/* Approach Header */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: isHybrid ? "var(--accent)" : "var(--text)",
                          margin: 0,
                        }}
                      >
                        {res.approach}
                      </h3>
                      {isHybrid && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            textTransform: "uppercase",
                          }}
                        >
                          Proposed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Benchmark Metrics List */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      fontSize: 12,
                    }}
                  >
                    {/* Ground truth accuracy badge with icon and label */}
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: res.isCorrect
                          ? "var(--success-soft)"
                          : "var(--danger-soft)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Accuracy
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                          color: res.isCorrect
                            ? "var(--success)"
                            : "var(--danger)",
                        }}
                      >
                        {res.isCorrect ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Decision */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Decision
                      </span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>
                        {formatDecision(res.decision)}
                      </span>
                    </div>

                    {/* Amount */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Amount
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatINR(res.amount)}
                      </span>
                    </div>

                    {/* Latency */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={12} />
                        <span>Latency</span>
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text)",
                        }}
                      >
                        {formatLatency(res.latencyMs)}
                      </span>
                    </div>

                    {/* Estimated Cost */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Coins size={12} />
                        <span>Cost / case</span>
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text)",
                        }}
                      >
                        ${res.estimatedCostUsd.toFixed(3)}
                      </span>
                    </div>

                    {/* Citation Present */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FileText size={12} />
                        <span>Citation</span>
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {res.citationPresent ? (
                          <span
                            style={{
                              color: "var(--success)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Present</span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            None
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Safety Guard / Unsafe Action Flag */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Safety status
                      </span>
                      <span>
                        {res.unsafeAction ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--danger)",
                              fontWeight: 600,
                            }}
                          >
                            <ShieldAlert size={12} />
                            <span>Unsafe action</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--success)",
                              fontWeight: 500,
                            }}
                          >
                            <ShieldCheck size={12} />
                            <span>Safe</span>
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Highlights per PRD 6.11: with icon and text label */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      {isHighestAccuracy && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "var(--success-soft)",
                            color: "var(--success)",
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Best safety & accuracy</span>
                        </span>
                      )}

                      {isFastest && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "var(--warning-soft)",
                            color: "var(--warning)",
                          }}
                        >
                          <Zap size={12} />
                          <span>Fastest execution</span>
                        </span>
                      )}

                      {isCatastrophicLeak && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                          }}
                        >
                          <AlertTriangle size={12} />
                          <span>Adversarial vulnerability</span>
                        </span>
                      )}

                      {isSlowest && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 500,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Clock size={12} />
                          <span>High turnaround latency</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes footer */}
                <p
                  style={{
                    fontSize: 11,
                    lineHeight: "16px",
                    color: "var(--text-muted)",
                    margin: 0,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {res.notes}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Footer: Aggregate Accuracy across Benchmark Presets (PRD 6.11) ─── */}
      {comparisonResult && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
              Aggregate benchmark accuracy across scenarios
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Demonstrating research validation of the multi-agent hybrid model.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)" }}>Manual: </span>
              <strong>91.5%</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Rules: </span>
              <strong>72.0%</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Pure LLM: </span>
              <strong style={{ color: "var(--danger)" }}>58.0%</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>RAG-only: </span>
              <strong>76.5%</strong>
            </div>
            <div
              style={{
                background: "var(--success-soft)",
                padding: "4px 8px",
                borderRadius: 4,
                color: "var(--success)",
              }}
            >
              <span>Hybrid: </span>
              <strong>{comparisonResult.aggregateAccuracyPercent}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
