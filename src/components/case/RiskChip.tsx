import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type { Risk } from "@/lib/schemas";

interface RiskChipProps {
  risk?: Risk;
  size?: "sm" | "md";
}

export function RiskChip({ risk = "LOW", size = "md" }: RiskChipProps) {
  const isHigh = risk === "HIGH";
  const isMed = risk === "MEDIUM";

  const bg = isHigh
    ? "var(--danger-soft)"
    : isMed
    ? "var(--warning-soft)"
    : "var(--success-soft)";

  const color = isHigh
    ? "var(--danger)"
    : isMed
    ? "var(--warning)"
    : "var(--success)";

  const label = isHigh ? "High" : isMed ? "Medium" : "Low";
  const Icon = isHigh ? AlertCircle : isMed ? AlertTriangle : CheckCircle2;

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
