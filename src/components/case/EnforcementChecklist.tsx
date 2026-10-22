import { CheckCircle2, XCircle } from "lucide-react";
import type { EnforcementRule, Verdict } from "@/lib/schemas";

interface EnforcementChecklistProps {
  checks: EnforcementRule[];
  verdict?: Verdict;
}

export function EnforcementChecklist({
  checks,
  verdict,
}: EnforcementChecklistProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Deterministic Policy Enforcement Point (PEP)
          </h4>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Zero-trust rule validation and tenant guardrails
          </span>
        </div>

        {verdict && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              background:
                verdict === "ALLOW"
                  ? "var(--success-soft)"
                  : verdict === "DENY"
                  ? "var(--danger-soft)"
                  : "var(--warning-soft)",
              color:
                verdict === "ALLOW"
                  ? "var(--success)"
                  : verdict === "DENY"
                  ? "var(--danger)"
                  : "var(--warning)",
            }}
          >
            VERDICT: {verdict}
          </span>
        )}
      </div>

      {/* Rules list */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {checks.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderBottom:
                idx < checks.length - 1 ? "1px solid var(--border)" : "none",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {item.passed ? (
                  <CheckCircle2 size={16} strokeWidth={2} color="var(--success)" />
                ) : (
                  <XCircle size={16} strokeWidth={2} color="var(--danger)" />
                )}
              </div>

              <div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                  }}
                >
                  {item.rule}
                </span>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    margin: "2px 0 0 0",
                  }}
                >
                  {item.reason}
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background: item.passed
                  ? "var(--success-soft)"
                  : "var(--danger-soft)",
                color: item.passed ? "var(--success)" : "var(--danger)",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-mono)",
              }}
            >
              {item.passed ? "PASS" : "FAIL"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
