"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { NodeName } from "@/lib/schemas";

export interface StageLatency {
  node: NodeName;
  displayName: string;
  durationMs: number;
}

interface TimelineProps {
  latencies: StageLatency[];
  totalTimeMs: number;
  traceId: string;
}

export function Timeline({ latencies, totalTimeMs, traceId }: TimelineProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTraceId = () => {
    navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxDuration = Math.max(...latencies.map((l) => l.durationMs), 1);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header: Total execution latency and Trace ID */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
            TOTAL RESOLUTION TIME
          </span>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              marginTop: 2,
            }}
          >
            {(totalTimeMs / 1000).toFixed(2)}s{" "}
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              ({totalTimeMs} ms)
            </span>
          </div>
        </div>

        {/* Trace ID with copy button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface-2)",
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>trace_id:</span>
          <code
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--accent)",
            }}
          >
            {traceId}
          </code>
          <button
            type="button"
            onClick={handleCopyTraceId}
            aria-label="Copy trace ID"
            style={{
              background: "transparent",
              border: "none",
              color: copied ? "var(--success)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: 2,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Latency Breakdown Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "0.02em",
          }}
        >
          STAGE LATENCY BREAKDOWN
        </span>

        {latencies.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
            Latency metrics are recorded as nodes finish execution.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {latencies.map((item) => {
              const widthPct = Math.round((item.durationMs / maxDuration) * 100);

              return (
                <div
                  key={item.node}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 130,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.displayName}
                  </span>

                  {/* Horizontal Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 12,
                      background: "var(--surface-2)",
                      borderRadius: 4,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(widthPct, 4)}%`,
                        height: "100%",
                        background: "var(--accent)",
                        borderRadius: 4,
                        transition: "width 200ms ease-out",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      width: 60,
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.durationMs}ms
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
