import { CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw } from "lucide-react";

export type CaseStatus = "OPEN" | "PROCESSING" | "RESOLVED" | "ESCALATED" | "REJECTED";

interface StatusChipProps {
  status: CaseStatus;
  size?: "sm" | "md";
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  let bg = "var(--surface-2)";
  let color = "var(--text-muted)";
  let label = "Open";
  let Icon = Clock;

  switch (status) {
    case "RESOLVED":
      bg = "var(--success-soft)";
      color = "var(--success)";
      label = "Resolved";
      Icon = CheckCircle2;
      break;
    case "ESCALATED":
      bg = "var(--warning-soft)";
      color = "var(--warning)";
      label = "Escalated";
      Icon = AlertTriangle;
      break;
    case "REJECTED":
      bg = "var(--danger-soft)";
      color = "var(--danger)";
      label = "Rejected";
      Icon = XCircle;
      break;
    case "PROCESSING":
      bg = "var(--accent-soft)";
      color = "var(--accent)";
      label = "Processing";
      Icon = RefreshCw;
      break;
    case "OPEN":
    default:
      bg = "var(--surface-2)";
      color = "var(--text-muted)";
      label = "Open";
      Icon = Clock;
      break;
  }

  const height = size === "sm" ? 20 : 24;
  const fontSize = size === "sm" ? 11 : 12;
  const iconSize = size === "sm" ? 12 : 13;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height,
        padding: "0 8px",
        borderRadius: 999,
        fontSize,
        fontWeight: 500,
        background: bg,
        color: color,
        border: "1px solid var(--border)",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <Icon size={iconSize} strokeWidth={1.75} />
      <span>{label}</span>
    </span>
  );
}
