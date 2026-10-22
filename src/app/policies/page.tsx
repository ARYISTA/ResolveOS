"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  AlertCircle,
  History,
} from "lucide-react";
import { getPolicies } from "@/lib/api/policies";
import { formatISTDate } from "@/lib/utils";
import { useApp } from "@/state/AppContext";
import { getDomain } from "@/lib/domains";
import type { PolicyRecord } from "@/lib/schemas";

export default function PoliciesPage() {
  const { state } = useApp();
  const domainConfig = getDomain(state.domain || "banking");
  const activeCompany =
    domainConfig?.companies.find((c) => c.id === state.companyId) ||
    domainConfig?.companies[0] ||
    null;

  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPoliciesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPolicies();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPoliciesData();
  }, [loadPoliciesData]);

  // Group policies by company
  const groupedByCompany = policies.reduce((acc, pol) => {
    const key = pol.companyName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pol);
    return acc;
  }, {} as Record<string, PolicyRecord[]>);

  // ─── Loading Skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              height: 32,
              width: 200,
              background: "var(--surface-2)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 18,
              width: 340,
              background: "var(--surface-2)",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 180,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 0" }}>
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: 24,
            borderRadius: 12,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            textAlign: "center",
          }}
        >
          <AlertCircle size={32} style={{ margin: "0 auto 12px auto" }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px 0" }}>
            Failed to load policy library
          </h2>
          <p style={{ fontSize: 14, margin: "0 0 20px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={loadPoliciesData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingBottom: 48,
      }}
    >
      {/* ─── Header & Action ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Policy library
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Indexed dispute guidelines and chunk embeddings grouped by operating
            company.
          </p>
        </div>

        <Link
          href="/setup?step=2"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--bg)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Upload size={15} />
          <span>Upload new version</span>
        </Link>
      </div>

      {/* ─── Grouped Policies List ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {Object.entries(groupedByCompany).map(([companyName, companyPolicies]) => (
          <div key={companyName} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Company Section Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 6,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Building2 size={18} color="var(--accent)" />
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {companyName}
              </h2>
              {activeCompany?.name === companyName && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "1px 7px",
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  Active tenant
                </span>
              )}
            </div>

            {/* Policy Cards for this company */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: 16,
              }}
            >
              {companyPolicies.map((policy) => {
                const activeVer =
                  policy.versions.find((v) => v.active) || policy.versions[0];
                const prevVer =
                  policy.versions.find((v) => v.version === activeVer.version - 1);
                const chunkDiff = prevVer
                  ? activeVer.chunkCount - prevVer.chunkCount
                  : 0;

                return (
                  <div
                    key={policy.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 16,
                      transition: "border-color 150ms ease-out",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FileText size={18} color="var(--accent)" />
                          <h3
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "var(--text)",
                              margin: 0,
                            }}
                          >
                            {policy.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--surface-2)",
                            color: "var(--text)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          v{activeVer.version}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 14,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Layers size={13} />
                          <span>{activeVer.chunkCount} indexed chunks</span>
                        </span>
                        {chunkDiff > 0 && (
                          <span
                            style={{
                              color: "var(--success)",
                              fontWeight: 500,
                            }}
                          >
                            (+{chunkDiff} vs v{prevVer?.version})
                          </span>
                        )}
                        <span>·</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={13} />
                          <span>{formatISTDate(activeVer.updatedAt)}</span>
                        </span>
                      </div>

                      {/* Version history list */}
                      <div
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <History size={12} />
                          <span>Version history</span>
                        </div>
                        {policy.versions.map((v) => (
                          <div
                            key={v.version}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 600,
                                  color: v.active ? "var(--accent)" : "var(--text-muted)",
                                }}
                              >
                                v{v.version}
                              </span>
                              {v.active && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "var(--success-soft)",
                                    color: "var(--success)",
                                    fontWeight: 500,
                                  }}
                                >
                                  active
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 11,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {v.chunkCount} chunks · {v.fileSizeKb} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <Link
                        href={`/setup?step=2`}
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Upload size={13} />
                        <span>Upload new version</span>
                      </Link>

                      <Link
                        href={`/policies/${policy.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        <span>View document & chunks</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
