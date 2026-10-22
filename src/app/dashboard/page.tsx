"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Coins,
  Clock,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Upload,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/api/metrics";
import { getRecentCases, getEscalations } from "@/lib/api/cases";
import { formatINR, formatISTDate } from "@/lib/utils";
import { useApp } from "@/state/AppContext";
import { getDomain } from "@/lib/domains";
import { StatusChip } from "@/components/case/StatusChip";
import { RiskChip } from "@/components/case/RiskChip";
import type { DashboardMetrics, CaseRecord } from "@/lib/schemas";

export default function DashboardPage() {
  const router = useRouter();
  const { state } = useApp();
  const domainConfig = getDomain(state.domain || "banking");
  const activeCompany =
    domainConfig?.companies.find((c) => c.id === state.companyId) ||
    domainConfig?.companies[0] ||
    null;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<CaseRecord[]>([]);
  const [pendingEscalations, setPendingEscalations] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const companyId = activeCompany?.id || undefined;
      const [metricsData, recentData, escalationsData] = await Promise.all([
        getDashboardMetrics(companyId),
        getRecentCases(companyId, 10),
        getEscalations(),
      ]);

      setMetrics(metricsData);
      setRecentCases(recentData);
      // Filter escalations for active company if set, up to 5
      const filteredEscalations = companyId
        ? escalationsData.filter((e) => e.companyId === companyId)
        : escalationsData;
      setPendingEscalations(filteredEscalations.slice(0, 5));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard metrics"
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ─── Loading Skeleton State ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
        {/* Header skeleton */}
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
              width: 380,
              background: "var(--surface-2)",
              borderRadius: 4,
            }}
          />
        </div>

        {/* Stat cards skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: 96,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
          ))}
        </div>

        {/* Charts skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              height: 280,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              height: 280,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
        </div>

        {/* Tables skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              height: 320,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
          <div
            style={{
              height: 320,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
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
            Unable to load dashboard
          </h2>
          <p style={{ fontSize: 14, margin: "0 0 20px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={loadDashboardData}
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

  // ─── Empty State ───────────────────────────────────────────────────────────
  if (!metrics || metrics.totalCases === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {activeCompany?.name || "Company"} dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Performance metrics and resolution pipeline activity.
          </p>
        </div>

        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            maxWidth: 600,
            margin: "40px auto",
          }}
        >
          <Inbox
            size={40}
            strokeWidth={1.5}
            style={{ margin: "0 auto 16px auto", color: "var(--text-muted)" }}
          />
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            No cases processed yet
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            Run a scenario in the customer simulator to generate resolution
            cases and view pipeline telemetry.
          </p>
          <Link
            href="/customer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "var(--bg)",
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <PlusCircle size={16} />
            <span>Raise a test case</span>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Time series line coordinates calculation (native SVG) ─────────────────
  // Find max value in timeline for scaling
  const maxTimeCount = Math.max(
    1,
    ...metrics.casesOverTime.map((d) => d.count)
  );
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 24;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = metrics.casesOverTime.map((item, idx) => {
    const x =
      paddingX +
      (idx / Math.max(1, metrics.casesOverTime.length - 1)) * innerWidth;
    const y =
      chartHeight - paddingY - (item.count / maxTimeCount) * innerHeight;
    return { x, y, ...item };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Max latency for scaling stage latencies
  const maxLatency = Math.max(
    1,
    ...metrics.stageLatencies.map((s) => s.latencyMs)
  );

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
      {/* ─── Top Header & Quick Actions ─────────────────────────────────────── */}
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
            {activeCompany?.name || "Company"} dashboard
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Autonomous multi-agent resolution performance metrics</span>
            <span>·</span>
            <span style={{ textTransform: "capitalize" }}>
              Domain: {state.domain || "Banking"}
            </span>
          </p>
        </div>

        {/* Quick actions per PRD 6.3 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/customer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "var(--bg)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <PlusCircle size={15} />
            <span>Raise a test case</span>
          </Link>

          <Link
            href="/setup"
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
              textDecoration: "none",
            }}
          >
            <Upload size={15} />
            <span>Upload policy</span>
          </Link>

          <Link
            href="/security-lab"
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
              textDecoration: "none",
            }}
          >
            <ShieldCheck size={15} />
            <span>Run security test</span>
          </Link>
        </div>
      </div>

      {/* ─── 6 Stat Cards Grid ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 16,
        }}
      >
        {/* Total Cases */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Total cases</span>
            <Inbox size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {metrics.totalCases}
          </div>
        </div>

        {/* Auto-resolved */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--success)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Auto-resolved</span>
            <CheckCircle2 size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {metrics.autoResolved}
          </div>
        </div>

        {/* Escalated */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--warning)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Escalated</span>
            <AlertTriangle size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {metrics.escalated}
          </div>
        </div>

        {/* Rejected */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--danger)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Rejected</span>
            <XCircle size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {metrics.rejected}
          </div>
        </div>

        {/* Total Refunded */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Total refunded</span>
            <Coins size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatINR(metrics.totalRefunded)}
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "var(--text-muted)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>Avg resolution time</span>
            <Clock size={16} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(metrics.avgResolutionTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>

      {/* ─── Hand-Built Charts Section ───────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        {/* Left Chart: Cases by Outcome & Pipeline Latency */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Section 1: Cases by Outcome */}
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                margin: "0 0 14px 0",
              }}
            >
              Cases by outcome
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metrics.casesByOutcome.map((item) => (
                <div key={item.outcome}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--surface-2)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(2, item.percentage)}%`,
                        background: item.color,
                        borderRadius: 4,
                        transition: "width 0.2s ease-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Average latency per pipeline stage */}
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                margin: "0 0 14px 0",
              }}
            >
              Average latency per pipeline stage
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {metrics.stageLatencies.map((stage) => {
                const percent = Math.round(
                  (stage.latencyMs / maxLatency) * 100
                );
                return (
                  <div key={stage.stage}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        {stage.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {stage.latencyMs} ms
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "var(--surface-2)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percent}%`,
                          background: "var(--accent)",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Chart: Cases over time (Native SVG with 3 hairline gridlines) */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Cases over time
                </h2>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    margin: "2px 0 0 0",
                  }}
                >
                  Last 7 days volume distribution
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                }}
              >
                7-day window
              </span>
            </div>

            {/* Native SVG Chart with 3 hairline gridlines */}
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: "100%", height: 180, display: "block" }}
                aria-label="Cases over time chart"
              >
                {/* 3 Hairline Gridlines max per PRD & design.md */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="var(--border)"
                  strokeWidth="1"
                />

                {/* Y-axis hairline labels */}
                <text
                  x={paddingX - 8}
                  y={paddingY + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {maxTimeCount}
                </text>
                <text
                  x={paddingX - 8}
                  y={chartHeight / 2 + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(maxTimeCount / 2)}
                </text>
                <text
                  x={paddingX - 8}
                  y={chartHeight - paddingY + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  0
                </text>

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />

                {/* Dots and direct value labels */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="var(--surface)"
                      stroke="var(--accent)"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="var(--text)"
                      fontFamily="var(--font-mono)"
                    >
                      {pt.count}
                    </text>
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--text-muted)"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span>Peak throughput: {maxTimeCount} cases/day</span>
            <Link
              href="/cases"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <span>Explore all cases</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Lower Section: Recent Cases & Pending Escalations ──────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        {/* Recent Cases Table */}
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
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Recent cases
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                Last 10 processed cases
              </p>
            </div>
            <Link
              href="/cases"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </Link>
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
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>
                    Case ID
                  </th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    Amount
                  </th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>
                    Status
                  </th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>
                    Date (IST)
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}`)}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "background 150ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "11px 16px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 500,
                        color: "var(--accent)",
                      }}
                    >
                      {c.id}
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {c.customerName}
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {formatINR(c.requestedAmount)}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <StatusChip status={c.status} size="sm" />
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatISTDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Escalations Panel */}
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Pending escalations
                </h2>
                {pendingEscalations.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: "var(--warning-soft)",
                      color: "var(--warning)",
                    }}
                  >
                    {pendingEscalations.length} open
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                Human review required before fund disbursement
              </p>
            </div>
            <Link
              href="/reviews"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Review queue</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ flex: 1, padding: 12 }}>
            {pendingEscalations.length === 0 ? (
              <div
                style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                <CheckCircle2
                  size={28}
                  style={{
                    margin: "0 auto 8px auto",
                    color: "var(--success)",
                  }}
                />
                <p style={{ margin: 0 }}>
                  No open escalations in the review queue.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingEscalations.map((esc) => (
                  <Link
                    key={esc.id}
                    href={`/reviews/${esc.id}`}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      textDecoration: "none",
                      transition: "background 150ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {esc.id}
                        </span>
                        <RiskChip risk={esc.riskLevel || "HIGH"} size="sm" />
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatINR(esc.requestedAmount)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      Customer: <strong>{esc.customerName}</strong>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 240,
                        }}
                      >
                        {esc.escalationReason || "Threshold limit exceeded"}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          color: "var(--accent)",
                          fontWeight: 500,
                        }}
                      >
                        <span>Review</span>
                        <ExternalLink size={11} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
