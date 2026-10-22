"use client";

import { NodeName } from "@/lib/schemas";

export interface AgentRosterItem {
  id: string;
  name: string;
  initials: string;
  layer: "ai" | "deterministic" | "human" | "transaction";
  nodeName: NodeName;
  status: "idle" | "running" | "completed" | "waiting";
  lastMessage?: string;
}

interface AgentRosterProps {
  agents: AgentRosterItem[];
  showHumanReview: boolean;
}

const LAYER_COLORS = {
  ai: {
    bg: "var(--layer-ai-soft)",
    text: "var(--layer-ai)",
    border: "var(--layer-ai)",
  },
  deterministic: {
    bg: "var(--layer-deterministic-soft)",
    text: "var(--layer-deterministic)",
    border: "var(--layer-deterministic)",
  },
  human: {
    bg: "var(--layer-human-soft)",
    text: "var(--layer-human)",
    border: "var(--layer-human)",
  },
  transaction: {
    bg: "var(--layer-transaction-soft)",
    text: "var(--layer-transaction)",
    border: "var(--layer-transaction)",
  },
};

export function AgentRoster({ agents, showHumanReview }: AgentRosterProps) {
  const visibleAgents = agents.filter(
    (a) => a.nodeName !== "HUMAN_REVIEW" || showHumanReview
  );

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "0.02em",
          }}
        >
          AGENT ROSTER
        </span>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {visibleAgents.filter((a) => a.status === "completed").length} of{" "}
          {visibleAgents.length} completed
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {visibleAgents.map((agent) => {
          const colors = LAYER_COLORS[agent.layer];
          const isRunning = agent.status === "running";
          const isDone = agent.status === "completed";
          const isWaiting = agent.status === "waiting";

          return (
            <div
              key={agent.id}
              title={agent.lastMessage || `${agent.name}: ${agent.status}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 54,
                textAlign: "center",
              }}
            >
              {/* Avatar 28px with initials and status dot */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${colors.border}`,
                  }}
                  className={isRunning ? "node-running" : ""}
                >
                  {agent.initials}
                </div>

                {/* Status dot */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    border: "1.5px solid var(--surface)",
                    background: isDone
                      ? "var(--success)"
                      : isRunning
                      ? "var(--accent)"
                      : isWaiting
                      ? "var(--warning)"
                      : "var(--border-strong)",
                  }}
                />
              </div>

              {/* Caption */}
              <span
                style={{
                  fontSize: 11,
                  lineHeight: "14px",
                  fontWeight: isRunning || isDone ? 500 : 400,
                  color: isRunning
                    ? "var(--accent)"
                    : isDone
                    ? "var(--text)"
                    : "var(--text-faint)",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.name.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
