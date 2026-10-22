export interface CaseAuditEventItem {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  oldState?: string;
  newState?: string;
}

interface AuditListProps {
  events: CaseAuditEventItem[];
}

export function AuditList({ events }: AuditListProps) {
  if (events.length === 0) {
    return (
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 32,
          background: "var(--surface)",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        No audit log events recorded yet.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
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
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          Immutable Case Audit Trail
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
          }}
        >
          {events.length} events
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {events.map((ev, idx) => (
          <div
            key={ev.id || idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderBottom:
                idx < events.length - 1 ? "1px solid var(--border)" : "none",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--accent)",
                }}
              >
                {ev.action}
              </span>

              <span
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                }}
              >
                actor: {ev.actor}
              </span>

              {(ev.oldState || ev.newState) && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {ev.oldState && (
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {ev.oldState}
                    </span>
                  )}
                  {ev.oldState && ev.newState && (
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                      →
                    </span>
                  )}
                  {ev.newState && (
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        fontWeight: 500,
                      }}
                    >
                      {ev.newState}
                    </span>
                  )}
                </div>
              )}
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {new Date(ev.timestamp).toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}{" "}
              IST
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
