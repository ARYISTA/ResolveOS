import { MockChunk } from "@/lib/mock/fixtures";

interface ChunkTableProps {
  chunks: MockChunk[];
  isLoading?: boolean;
}

export function ChunkTable({ chunks, isLoading = false }: ChunkTableProps) {
  if (isLoading) {
    return (
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            height: 44,
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
          }}
        />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 90,
                height: 14,
                borderRadius: 4,
                background: "var(--surface-2)",
              }}
            />
            <div
              style={{
                flex: 1,
                height: 14,
                borderRadius: 4,
                background: "var(--surface-2)",
              }}
            />
            <div
              style={{
                width: 40,
                height: 14,
                borderRadius: 4,
                background: "var(--surface-2)",
              }}
            />
            <div
              style={{
                width: 50,
                height: 14,
                borderRadius: 4,
                background: "var(--surface-2)",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
          background: "var(--surface)",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        No chunks available for this policy document.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--surface)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
                height: 40,
              }}
            >
              <th
                style={{
                  padding: "0 16px",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  width: "18%",
                }}
              >
                Chunk id
              </th>
              <th
                style={{
                  padding: "0 16px",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  width: "56%",
                }}
              >
                Section
              </th>
              <th
                style={{
                  padding: "0 16px",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textAlign: "right",
                  width: "12%",
                }}
              >
                Page
              </th>
              <th
                style={{
                  padding: "0 16px",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textAlign: "right",
                  width: "14%",
                }}
              >
                Tokens
              </th>
            </tr>
          </thead>
          <tbody>
            {chunks.map((chunk) => (
              <tr
                key={chunk.chunkId}
                style={{
                  height: 44,
                  borderBottom: "1px solid var(--border)",
                  transition: "background 150ms ease-out",
                }}
                className="hover:bg-[var(--surface-2)]"
              >
                <td
                  style={{
                    padding: "0 16px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--accent)",
                  }}
                >
                  {chunk.chunkId}
                </td>
                <td
                  style={{
                    padding: "0 16px",
                    color: "var(--text)",
                    fontWeight: 450,
                  }}
                >
                  {chunk.section}
                </td>
                <td
                  style={{
                    padding: "0 16px",
                    textAlign: "right",
                    color: "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  p. {chunk.page}
                </td>
                <td
                  style={{
                    padding: "0 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {chunk.tokenCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
