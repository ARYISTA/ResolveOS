"use client";

import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, UserCheck } from "lucide-react";
import type { Decision, Risk, Verdict } from "@/lib/schemas";
import { formatINR } from "@/lib/utils";

interface DecisionPanelProps {
  verdict?: Verdict;
  decision?: Decision;
  recommendedAmount?: number;
  confidence?: number;
  riskLevel?: Risk;
  reasoningSummary?: string;
  isEscalated?: boolean;
  hitlResolved?: boolean;
  onApproveReview?: () => void;
  onRejectReview?: () => void;
  isReviewing?: boolean;
}

export function DecisionPanel({
  verdict,
  decision = "APPROVE_REFUND",
  recommendedAmount,
  confidence = 0.89,
  riskLevel = "LOW",
  reasoningSummary,
  isEscalated = false,
  hitlResolved = false,
  onApproveReview,
  onRejectReview,
  isReviewing = false,
}: DecisionPanelProps) {
  const isAllow = verdict === "ALLOW";
  const isDeny = verdict === "DENY";
  const isEscalate = verdict === "ESCALATE" || isEscalated;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Verdict Banner */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          background: isAllow
            ? "var(--success-soft)"
            : isDeny
            ? "var(--danger-soft)"
            : isEscalate
            ? "var(--warning-soft)"
            : "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {isAllow ? (
            <CheckCircle2 size={24} strokeWidth={2} color="var(--success)" />
          ) : isDeny ? (
            <XCircle size={24} strokeWidth={2} color="var(--danger)" />
          ) : isEscalate ? (
            <AlertTriangle size={24} strokeWidth={2} color="var(--warning)" />
          ) : (
            <ShieldCheck size={24} strokeWidth={1.5} color="var(--accent)" />
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isAllow
                    ? "var(--success)"
                    : isDeny
                    ? "var(--danger)"
                    : isEscalate
                    ? "var(--warning)"
                    : "var(--text)",
                }}
              >
                {verdict ? `VERDICT: ${verdict}` : "Evaluation in progress"}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text)",
                margin: "4px 0 0 0",
              }}
            >
              {isAllow
                ? "Autonomous execution permitted: Deterministic guardrails and policy criteria verified."
                : isDeny
                ? "Request denied: Violates policy constraints or failed deterministic checks."
                : isEscalate
                ? "Escalated for human oversight: High risk or value exceeding autonomous threshold."
                : "Awaiting pipeline evaluation completion."}
            </p>
          </div>
        </div>
      </div>

      {/* Human Review Escalation Banner (when case is paused at HUMAN_REVIEW) */}
      {isEscalate && !hitlResolved && onApproveReview && onRejectReview && (
        <div
          style={{
            border: "1px solid var(--warning)",
            borderRadius: 12,
            padding: 18,
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserCheck size={18} strokeWidth={1.5} color="var(--warning)" />
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Action Required: Compliance Reviewer Decision
            </h4>
          </div>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: 0,
              lineHeight: "20px",
            }}
          >
            The pipeline is paused at Human Review. As a compliance officer,
            review the evidence below and confirm the resolution.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              disabled={isReviewing}
              onClick={onApproveReview}
              style={{
                height: 36,
                padding: "0 18px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: isReviewing ? "not-allowed" : "pointer",
              }}
            >
              Approve refund
            </button>

            <button
              type="button"
              disabled={isReviewing}
              onClick={onRejectReview}
              style={{
                height: 36,
                padding: "0 18px",
                borderRadius: 8,
                background: "var(--danger-soft)",
                color: "var(--danger)",
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid var(--border)",
                cursor: isReviewing ? "not-allowed" : "pointer",
              }}
            >
              Reject dispute
            </button>
          </div>
        </div>
      )}

      {/* Decision Summary Grid */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Action */}
          <div>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
              RECOMMENDED ACTION
            </span>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                marginTop: 4,
              }}
            >
              {decision.replace("_", " ")}
            </div>
          </div>

          {/* Amount */}
          <div>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
              AMOUNT
            </span>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {recommendedAmount !== undefined ? formatINR(recommendedAmount) : "—"}
            </div>
          </div>

          {/* Confidence */}
          <div>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
              AI CONFIDENCE
            </span>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--accent)",
                marginTop: 4,
                fontFamily: "var(--font-mono)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(confidence * 100)}%
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
              RISK LEVEL
            </span>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background:
                    riskLevel === "LOW"
                      ? "var(--success-soft)"
                      : riskLevel === "MEDIUM"
                      ? "var(--warning-soft)"
                      : "var(--danger-soft)",
                  color:
                    riskLevel === "LOW"
                      ? "var(--success)"
                      : riskLevel === "MEDIUM"
                      ? "var(--warning)"
                      : "var(--danger)",
                }}
              >
                {riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Reasoning Summary */}
        {reasoningSummary && (
          <div
            style={{
              paddingTop: 14,
              borderTop: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-faint)",
                letterSpacing: "0.02em",
                display: "block",
                marginBottom: 6,
              }}
            >
              AI REASONING SUMMARY
            </span>
            <p
              style={{
                fontSize: 13,
                lineHeight: "22px",
                color: "var(--text)",
                margin: 0,
              }}
            >
              {reasoningSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
