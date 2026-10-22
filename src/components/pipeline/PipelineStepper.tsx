"use client";

import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  XCircle,
  CircleDashed,
  RotateCw,
} from "lucide-react";
import type { NodeName } from "@/lib/schemas";

export type NodeStateStatus =
  | "idle"
  | "running"
  | "success"
  | "warning"
  | "failed"
  | "waiting"
  | "skipped";

export interface NodeStateInfo {
  node: NodeName;
  displayName: string;
  layer: "ai" | "deterministic" | "human" | "transaction";
  layerLabel: string;
  status: NodeStateStatus;
  durationMs?: number;
  resultSummary?: string;
  errorMessage?: string;
}

interface PipelineStepperProps {
  nodes: NodeStateInfo[];
  selectedNode: NodeName | null;
  onSelectNode: (node: NodeName) => void;
  onRetryNode?: (node: NodeName) => void;
  showHumanReview: boolean;
}

const LAYER_CONFIG = {
  ai: {
    label: "AI Agent",
    bg: "var(--layer-ai-soft)",
    text: "var(--layer-ai)",
  },
  deterministic: {
    label: "Deterministic",
    bg: "var(--layer-deterministic-soft)",
    text: "var(--layer-deterministic)",
  },
  human: {
    label: "Human",
    bg: "var(--layer-human-soft)",
    text: "var(--layer-human)",
  },
  transaction: {
    label: "Transaction",
    bg: "var(--layer-transaction-soft)",
    text: "var(--layer-transaction)",
  },
};

function renderStatusIcon(status: NodeStateStatus) {
  switch (status) {
    case "success":
      return <CheckCircle2 size={16} strokeWidth={2} color="var(--success)" />;
    case "running":
      return (
        <Loader2
          size={16}
          strokeWidth={2}
          color="var(--accent)"
          className="animate-spin"
        />
      );
    case "waiting":
      return <Clock size={16} strokeWidth={2} color="var(--warning)" />;
    case "warning":
      return <AlertCircle size={16} strokeWidth={2} color="var(--warning)" />;
    case "failed":
      return <XCircle size={16} strokeWidth={2} color="var(--danger)" />;
    case "skipped":
      return (
        <CircleDashed size={16} strokeWidth={1.5} color="var(--text-faint)" />
      );
    case "idle":
    default:
      return (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "1.5px solid var(--border-strong)",
          }}
        />
      );
  }
}

function getStatusLabel(status: NodeStateStatus): string {
  switch (status) {
    case "success":
      return "Completed";
    case "running":
      return "Processing...";
    case "waiting":
      return "Awaiting review";
    case "warning":
      return "Warning";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    case "idle":
    default:
      return "Pending";
  }
}

export function PipelineStepper({
  nodes,
  selectedNode,
  onSelectNode,
  onRetryNode,
  showHumanReview,
}: PipelineStepperProps) {
  const visibleNodes = nodes.filter(
    (n) => n.node !== "HUMAN_REVIEW" || showHumanReview
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        position: "relative",
      }}
      role="list"
      aria-label="Agent pipeline execution steps"
    >
      {visibleNodes.map((item, index) => {
        const isSelected = selectedNode === item.node;
        const isRunning = item.status === "running";
        const isWaiting = item.status === "waiting";
        const isFailed = item.status === "failed";
        const layerInfo = LAYER_CONFIG[item.layer];
        const isLast = index === visibleNodes.length - 1;

        return (
          <div
            key={item.node}
            role="listitem"
            style={{
              position: "relative",
              paddingBottom: isLast ? 0 : 16,
            }}
          >
            {/* Connecting vertical line */}
            {!isLast && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 20,
                  top: 38,
                  bottom: 0,
                  width: 1,
                  background:
                    item.status === "success"
                      ? "var(--success)"
                      : item.status === "failed"
                      ? "var(--danger)"
                      : "var(--border-strong)",
                  transition: "background 200ms ease-out",
                  zIndex: 0,
                }}
              />
            )}

            {/* Node card */}
            <div
              tabIndex={0}
              role="button"
              aria-label={`${item.displayName} node: ${getStatusLabel(item.status)}`}
              onClick={() => onSelectNode(item.node)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectNode(item.node);
                }
              }}
              style={{
                position: "relative",
                zIndex: 1,
                background: isSelected
                  ? "var(--accent-soft)"
                  : isWaiting
                  ? "var(--layer-human-soft)"
                  : isFailed
                  ? "var(--danger-soft)"
                  : "var(--surface)",
                border: isSelected
                  ? "1px solid var(--accent)"
                  : isRunning
                  ? "1px solid var(--accent)"
                  : isWaiting
                  ? "1px solid var(--warning)"
                  : isFailed
                  ? "1px solid var(--danger)"
                  : "1px solid var(--border)",
                borderRadius: 12,
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all 150ms ease-out",
                outline: "none",
              }}
              className={`${isRunning ? "node-running" : ""} hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                {/* Left: icon + name + layer badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {renderStatusIcon(item.status)}
                  </div>

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {item.displayName}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: layerInfo.bg,
                      color: layerInfo.text,
                    }}
                  >
                    {layerInfo.label}
                  </span>
                </div>

                {/* Right: duration ms or status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color:
                        item.status === "success"
                          ? "var(--success)"
                          : item.status === "running"
                          ? "var(--accent)"
                          : item.status === "waiting"
                          ? "var(--warning)"
                          : item.status === "failed"
                          ? "var(--danger)"
                          : "var(--text-faint)",
                    }}
                  >
                    {getStatusLabel(item.status)}
                  </span>

                  {item.durationMs !== undefined && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.durationMs}ms
                    </span>
                  )}
                </div>
              </div>

              {/* One-line result summary or error */}
              {item.status === "failed" && item.errorMessage ? (
                <div
                  style={{
                    paddingLeft: 30,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--danger)",
                      margin: 0,
                      lineHeight: "18px",
                    }}
                  >
                    Error: {item.errorMessage}
                  </p>

                  {onRetryNode && (
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryNode(item.node);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          height: 28,
                          padding: "0 12px",
                          borderRadius: 6,
                          background: "var(--accent)",
                          color: "var(--on-accent)",
                          fontSize: 12,
                          fontWeight: 500,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <RotateCw size={12} strokeWidth={2} />
                        <span>Retry {item.displayName}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                item.resultSummary && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      paddingLeft: 30,
                      lineHeight: "16px",
                    }}
                  >
                    {item.resultSummary}
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
