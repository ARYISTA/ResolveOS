import { ExternalLink } from "lucide-react";
import type { PolicyReference } from "@/lib/schemas";

interface CitationCardProps {
  citation: PolicyReference;
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: "2px solid var(--accent)",
        borderRadius: "0 12px 12px 0",
        padding: 16,
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Header: Document name + version & score */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h4
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {citation.documentName} v{citation.version}
          </h4>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
              display: "block",
            }}
          >
            {citation.section} · Page {citation.page}
          </span>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--surface-2)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
          title="Vector similarity score"
        >
          <span>Score</span>
          <span>{citation.score.toFixed(2)}</span>
        </div>
      </div>

      {/* Excerpt in serif italic 14px */}
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 14,
          lineHeight: "22px",
          color: "var(--text)",
          margin: 0,
          background: "var(--surface-2)",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--border)",
        }}
      >
        &ldquo;{citation.excerpt}&rdquo;
      </p>

      {/* Footer link: View in policy */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingTop: 4,
        }}
      >
        <a
          href={`/policies/${citation.policyId}#page=${citation.page}`}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            textDecoration: "none",
          }}
        >
          <span>View in policy</span>
          <ExternalLink size={12} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}
