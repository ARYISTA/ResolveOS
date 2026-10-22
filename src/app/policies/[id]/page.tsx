"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Layers,
  Upload,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Search,
} from "lucide-react";
import { getPolicy } from "@/lib/api/policies";
import { formatISTDate } from "@/lib/utils";
import type { PolicyRecord, PolicyChunk } from "@/lib/schemas";

export default function PolicyViewerPage() {
  const params = useParams();
  const policyId = (params?.id as string) || "pol-banking-v1";

  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [searchChunkQuery, setSearchChunkQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load policy record
  const loadPolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPolicy(policyId);
      if (!data) {
        setError(`Policy with ID ${policyId} not found`);
      } else {
        setPolicy(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policy");
    } finally {
      setIsLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  // Handle URL hash anchor (e.g. #page=7 from citation links)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const match = hash.match(/page=(\d+)/);
      if (match && match[1]) {
        const pageNum = parseInt(match[1], 10);
        setActivePage(pageNum);
      }
    }
  }, []);

  // When policy loads or active page changes, select matching chunk
  useEffect(() => {
    if (policy && policy.chunks.length > 0) {
      const matchingChunk = policy.chunks.find((c) => c.page === activePage);
      if (matchingChunk) {
        setActiveChunkId(matchingChunk.id);
      }
    }
  }, [policy, activePage]);

  // Handle clicking a chunk card: updates iframe hash to that chunk's page
  const handleSelectChunk = (chunk: PolicyChunk) => {
    setActivePage(chunk.page);
    setActiveChunkId(chunk.id);
    if (typeof window !== "undefined") {
      window.location.hash = `page=${chunk.page}`;
    }
    if (iframeRef.current && policy) {
      const activeVer =
        policy.versions.find((v) => v.active) || policy.versions[0];
      iframeRef.current.src = `${activeVer.filePath}#page=${chunk.page}`;
    }
  };

  // ─── Loading Skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 48 }}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              height: 24,
              width: 140,
              background: "var(--surface-2)",
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <div
            style={{
              height: 32,
              width: 320,
              background: "var(--surface-2)",
              borderRadius: 6,
            }}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div
              style={{
                height: 600,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
          </div>
          <div className="lg:col-span-5">
            <div
              style={{
                height: 600,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────
  if (error || !policy) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 32 }}>
        <div
          style={{
            padding: 32,
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--danger)",
          }}
        >
          <AlertCircle size={36} style={{ margin: "0 auto 12px auto" }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px 0" }}>
            Policy document unavailable
          </h2>
          <p style={{ fontSize: 14, margin: "0 0 20px 0", opacity: 0.9 }}>
            {error || "The specified policy could not be found."}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <button
              onClick={loadPolicy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
            <Link
              href="/policies"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--bg)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to policy library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeVer =
    policy.versions.find((v) => v.active) || policy.versions[0];
  const prevVer = policy.versions.find(
    (v) => v.version === activeVer.version - 1
  );
  const chunkDiff = prevVer ? activeVer.chunkCount - prevVer.chunkCount : 0;

  // Filtered chunks list
  const filteredChunks = policy.chunks.filter((c) => {
    if (!searchChunkQuery.trim()) return true;
    const q = searchChunkQuery.toLowerCase();
    return (
      c.section.toLowerCase().includes(q) ||
      c.excerpt.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        paddingBottom: 48,
      }}
    >
      {/* ─── Breadcrumb & Actions Header ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/policies"
            aria-label="Back to policy library"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {policy.name}
              </h1>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                v{activeVer.version}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{policy.companyName}</span>
              <span>·</span>
              <span style={{ textTransform: "capitalize" }}>
                {policy.domain} domain
              </span>
              <span>·</span>
              <span>Updated {formatISTDate(activeVer.updatedAt)}</span>
            </div>
          </div>
        </div>

        <Link
          href="/setup?step=2"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Upload size={14} />
          <span>Upload new version</span>
        </Link>
      </div>

      {/* ─── Chunk Difference Banner (PRD 6.8) ───────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={16} color="var(--accent)" />
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            Version {activeVer.version}: {activeVer.chunkCount} indexed vector
            chunks
          </span>
          {prevVer && (
            <span
              style={{
                fontSize: 12,
                color: chunkDiff >= 0 ? "var(--success)" : "var(--danger)",
                fontWeight: 600,
              }}
            >
              ({chunkDiff >= 0 ? `+${chunkDiff}` : chunkDiff} chunks vs v
              {prevVer.version})
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          File size: {activeVer.fileSizeKb} KB
        </span>
      </div>

      {/* ─── 2-Column Split: Embedded PDF (left) & Chunks Panel (right) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plain native iframe for PDF embedding */}
        <div
          className="lg:col-span-7"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: 720,
          }}
        >
          {/* Iframe Topbar */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} />
              <span style={{ fontWeight: 500, color: "var(--text)" }}>
                PDF viewer
              </span>
              <span>·</span>
              <span>Active page: {activePage}</span>
            </div>

            <a
              href={`${activeVer.filePath}#page=${activePage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span>Open in new tab</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Iframe or Fallback Error State */}
          <div style={{ flex: 1, position: "relative", background: "var(--bg)" }}>
            {iframeError ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  textAlign: "center",
                  color: "var(--danger)",
                }}
              >
                <AlertCircle size={32} style={{ marginBottom: 12 }} />
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: "0 0 6px 0",
                  }}
                >
                  Unable to load PDF preview
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    maxWidth: 380,
                    margin: "0 0 16px 0",
                  }}
                >
                  The PDF file could not be accessed at{" "}
                  <code>{activeVer.filePath}</code>. You can view the extracted
                  chunks on the right or upload a replacement version.
                </p>
                <Link
                  href="/setup?step=2"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "var(--bg)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  <Upload size={14} />
                  <span>Upload replacement PDF</span>
                </Link>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={`${activeVer.filePath}#page=${activePage}`}
                title={`${policy.name} PDF Preview`}
                onError={() => setIframeError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column: Extracted Chunks Panel */}
        <div
          className="lg:col-span-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: 720,
          }}
        >
          {/* Chunks Panel Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
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
              <div>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Extracted chunks ({policy.chunks.length})
                </h2>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: "2px 0 0 0",
                  }}
                >
                  Click a chunk to focus the PDF viewer on that page
                </p>
              </div>
            </div>

            {/* Quick search filter for chunks */}
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={searchChunkQuery}
                onChange={(e) => setSearchChunkQuery(e.target.value)}
                placeholder="Filter chunks by keyword..."
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Chunks Scrollable List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {filteredChunks.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                No chunks match your search query.
              </div>
            ) : (
              filteredChunks.map((chunk) => {
                const isSelected =
                  activeChunkId === chunk.id || activePage === chunk.page;

                return (
                  <div
                    key={chunk.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectChunk(chunk)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectChunk(chunk);
                      }
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: isSelected
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--border)",
                      background: isSelected
                        ? "var(--accent-soft)"
                        : "var(--surface)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      outline: "none",
                      transition: "all 150ms ease-out",
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
                          color: isSelected
                            ? "var(--accent)"
                            : "var(--text)",
                        }}
                      >
                        {chunk.section}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: isSelected
                            ? "var(--surface)"
                            : "var(--surface-2)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Page {chunk.page}
                      </span>
                    </div>

                    <p
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        fontSize: 13,
                        lineHeight: "20px",
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      &ldquo;{chunk.excerpt}&rdquo;
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <span>Chunk ID: {chunk.id}</span>
                      <span>{chunk.tokenCount} tokens</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
