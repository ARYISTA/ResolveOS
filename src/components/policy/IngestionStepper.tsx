"use client";

import { Check, Loader2 } from "lucide-react";

export const STAGES = [
  { id: "Uploaded", label: "Uploaded", description: "Document received and validated" },
  { id: "Parsing", label: "Parsing", description: "Extracting sections and text structure" },
  { id: "Chunking", label: "Chunking", description: "Splitting into semantically coherent chunks" },
  { id: "Embedding", label: "Embedding", description: "Generating vector representations" },
  { id: "Indexed", label: "Indexed", description: "Persisted to vector index for retrieval" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

interface IngestionStepperProps {
  currentStage: string;
  percent: number;
}

export function IngestionStepper({ currentStage, percent }: IngestionStepperProps) {
  const currentStageIndex = STAGES.findIndex(
    (s) => s.id.toLowerCase() === currentStage.toLowerCase()
  );

  return (
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
      {/* Header and status summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Policy ingestion pipeline
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {percent === 100
              ? "All 5 stages completed. Policy indexed and ready."
              : `Processing stage: ${currentStage || "Initializing"} (${percent}%)`}
          </p>
        </div>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 500,
            color: percent === 100 ? "var(--success)" : "var(--accent)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {percent}%
        </span>
      </div>

      {/* Thin progress bar */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: "100%",
          height: 4,
          borderRadius: 999,
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: percent === 100 ? "var(--success)" : "var(--accent)",
            transition: "width 250ms ease-out",
          }}
        />
      </div>

      {/* Stepper items */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
          paddingTop: 4,
        }}
      >
        {STAGES.map((s, index) => {
          const isDone = percent === 100 || index < currentStageIndex;
          const isCurrent =
            percent < 100 &&
            (index === currentStageIndex ||
              (currentStageIndex === -1 && index === 0));

          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              {/* Step indicator node */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    background: isDone
                      ? "var(--success-soft)"
                      : isCurrent
                      ? "var(--accent-soft)"
                      : "var(--surface-2)",
                    color: isDone
                      ? "var(--success)"
                      : isCurrent
                      ? "var(--accent)"
                      : "var(--text-faint)",
                    border: isCurrent
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  }}
                >
                  {isDone ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <Loader2
                      size={12}
                      strokeWidth={2}
                      className="animate-spin"
                    />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isCurrent || isDone ? 600 : 400,
                    color: isDone
                      ? "var(--text)"
                      : isCurrent
                      ? "var(--accent)"
                      : "var(--text-faint)",
                  }}
                >
                  {s.label}
                </span>
              </div>

              {/* Subtitle */}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  lineHeight: 1.3,
                }}
              >
                {s.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Screen reader polite announcement */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {`Policy ingestion progress: ${currentStage || "Started"}, ${percent} percent complete`}
      </div>
    </div>
  );
}
