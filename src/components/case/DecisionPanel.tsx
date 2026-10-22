"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { Decision, Risk, Verdict } from "@/lib/schemas";
import { formatINR } from "@/lib/utils";

interface DecisionPanelProps {
  verdict?: Verdict;
  decision?: Decision;
  recommendedAmount?: number;
  approvedAmount?: number;
  rejectionReason?: string;
  defaultModifiedAmount?: number;
  confidence?: number;
  riskLevel?: Risk;
  reasoningSummary?: string;
  isEscalated?: boolean;
  hitlResolved?: boolean;
  onApproveReview?: (modifiedAmount?: number) => void;
  onRejectReview?: (reason?: string) => void;
  isReviewing?: boolean;
}

export function DecisionPanel({
  verdict,
  decision = "APPROVE_REFUND",
  recommendedAmount,
  approvedAmount,
  rejectionReason,
  defaultModifiedAmount,
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

  // Local state for reviewer modified amount and rejection reason
  const [modAmount, setModAmount] = useState<string>(
    defaultModifiedAmount ? String(defaultModifiedAmount) : ""
  );
  const [rejectReason, setRejectReason] = useState<string>(
    "Claimed amount exceeds verified merchant gateway loss records."
  );
  const [showAdjustInput, setShowAdjustInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);

  const hasModifiedAmount =
    approvedAmount !== undefined &&
    recommendedAmount !== undefined &&
    approvedAmount !== recommendedAmount;

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
            gap: 14,
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
              Action required: Compliance reviewer decision
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
            verify the dispute evidence and select an approval or rejection
            determination below.
          </p>

          {/* Review Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {/* Full approve */}
              <button
                type="button"
                disabled={isReviewing}
                onClick={() => onApproveReview()}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: isReviewing ? "not-allowed" : "pointer",
                }}
              >
                Approve full amount (
                {recommendedAmount !== undefined
                  ? formatINR(recommendedAmount)
                  : "Full"}
                )
              </button>

              {/* Toggle modified amount input */}
              <button
                type="button"
                disabled={isReviewing}
                onClick={() => {
                  setShowAdjustInput(!showAdjustInput);
                  setShowRejectInput(false);
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  background: showAdjustInput
                    ? "var(--accent-soft)"
                    : "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                  cursor: isReviewing ? "not-allowed" : "pointer",
                }}
              >
                {showAdjustInput ? "Cancel adjustment" : "Adjust amount..."}
              </button>

              {/* Toggle reject reason input */}
              <button
                type="button"
                disabled={isReviewing}
                onClick={() => {
                  setShowRejectInput(!showRejectInput);
                  setShowAdjustInput(false);
                }}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  background: showRejectInput
                    ? "var(--danger-soft)"
                    : "var(--surface-2)",
                  color: "var(--danger)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border)",
                  cursor: isReviewing ? "not-allowed" : "pointer",
                }}
              >
                {showRejectInput ? "Cancel rejection" : "Reject dispute..."}
              </button>
            </div>

            {/* Adjusted amount form */}
            {showAdjustInput && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label
                    htmlFor="modified-amount-input"
                    style={{ fontSize: 12, color: "var(--text-muted)" }}
                  >
                    Adjusted amount (INR):
                  </label>
                  <input
                    id="modified-amount-input"
                    type="number"
                    value={modAmount}
                    onChange={(e) => setModAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: 130,
                      height: 32,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border-strong)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                </div>

                <button
                  type="button"
                  disabled={isReviewing || !modAmount || Number(modAmount) <= 0}
                  onClick={() => onApproveReview(Number(modAmount))}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 6,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    fontSize: 12,
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Confirm adjusted approval
                </button>
              </div>
            )}

            {/* Rejection reason form */}
            {showRejectInput && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--danger-soft)",
                  border: "1px solid var(--danger)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <label
                  htmlFor="reject-reason-input"
                  style={{
                    fontSize: 12,
                    color: "var(--danger)",
                    fontWeight: 500,
                  }}
                >
                  Rejection reason:
                </label>
                <input
                  id="reject-reason-input"
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection justification"
                  style={{
                    width: "100%",
                    height: 32,
                    padding: "0 8px",
                    borderRadius: 6,
                    border: "1px solid var(--danger)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: 13,
                  }}
                />
                <div>
                  <button
                    type="button"
                    disabled={isReviewing || !rejectReason.trim()}
                    onClick={() => onRejectReview(rejectReason)}
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
                    Confirm dispute rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection notice if verdict is DENY */}
      {(isDeny || rejectionReason) && (
        <div
          style={{
            border: "1px solid var(--danger)",
            borderRadius: 12,
            padding: 16,
            background: "var(--danger-soft)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <XCircle
            size={18}
            strokeWidth={2}
            color="var(--danger)"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <div>
            <h5
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--danger)",
                margin: "0 0 4px 0",
              }}
            >
              Rejection reason
            </h5>
            <p
              style={{
                fontSize: 13,
                lineHeight: "20px",
                color: "var(--danger)",
                margin: 0,
              }}
            >
              {rejectionReason ||
                "Dispute was rejected by compliance review. Policy conditions or verification checks failed."}
            </p>
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
            <span
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                fontWeight: 500,
              }}
            >
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

          {/* Amount: Side by side if reviewer approved a modified amount */}
          <div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                fontWeight: 500,
              }}
            >
              {hasModifiedAmount ? "AMOUNT (ADJUSTED)" : "AMOUNT"}
            </span>

            {hasModifiedAmount ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  title="Original requested amount"
                >
                  {formatINR(recommendedAmount!)}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--accent)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  title="Reviewer approved amount"
                >
                  {formatINR(approvedAmount!)}
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginTop: 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {approvedAmount !== undefined
                  ? formatINR(approvedAmount)
                  : recommendedAmount !== undefined
                  ? formatINR(recommendedAmount)
                  : "—"}
              </div>
            )}
          </div>

          {/* Confidence */}
          <div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                fontWeight: 500,
              }}
            >
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
            <span
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                fontWeight: 500,
              }}
            >
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
