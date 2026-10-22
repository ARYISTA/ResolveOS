"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MessageSquareText } from "lucide-react";

export interface AgentFeedMessage {
  id: string;
  agentName: string;
  message: string;
  timestamp: string;
}

interface AgentFeedProps {
  messages: AgentFeedMessage[];
}

export function AgentFeed({ messages }: AgentFeedProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquareText size={16} strokeWidth={1.5} color="var(--accent)" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Agent message feed
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--surface-2)",
              color: "var(--text-muted)",
            }}
          >
            {messages.length}
          </span>
        </div>

        <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Message list */}
      {isOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px 16px",
            maxHeight: 260,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {messages.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
              Waiting for agent activity...
            </p>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                style={{
                  fontSize: 13,
                  lineHeight: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--text)",
                      fontSize: 12,
                    }}
                  >
                    {item.agentName}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.timestamp}
                  </span>
                </div>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 13,
                    wordBreak: "break-word",
                  }}
                >
                  {item.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
