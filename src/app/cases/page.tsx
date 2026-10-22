"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
  Inbox,
  AlertCircle,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getCases } from "@/lib/api/cases";
import { formatINR, formatISTDate } from "@/lib/utils";
import { useApp } from "@/state/AppContext";
import { getDomain } from "@/lib/domains";
import { StatusChip, CaseStatus } from "@/components/case/StatusChip";
import { RiskChip } from "@/components/case/RiskChip";
import type { CaseRecord, Risk, Verdict } from "@/lib/schemas";

function CasesTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useApp();
  const domainConfig = getDomain(state.domain || "banking");
  const activeCompany =
    domainConfig?.companies.find((c) => c.id === state.companyId) ||
    domainConfig?.companies[0] ||
    null;

  // Extract filter parameters from URL query string
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentRisk = searchParams.get("risk") || "ALL";
  const currentOutcome = searchParams.get("outcome") || "ALL";
  const currentCustomer = searchParams.get("customer") || "";
  const currentFromDate = searchParams.get("fromDate") || "";
  const currentToDate = searchParams.get("toDate") || "";
  const currentSortBy = (searchParams.get("sortBy") as "amount" | "date" | "status") || "date";
  const currentSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Local state for immediate input feedback
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [customerInput, setCustomerInput] = useState(currentCustomer);

  // Cases data state
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync inputs when URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setCustomerInput(currentCustomer);
  }, [currentCustomer]);

  // Update URL helper
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset page to 1 on filter changes unless explicitly updating page
      if (!updates.page && params.has("page")) {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Fetch cases from API
  const fetchCasesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const companyId = activeCompany?.id || undefined;
      const res = await getCases({
        companyId,
        search: currentSearch || undefined,
        status: currentStatus !== "ALL" ? (currentStatus as CaseStatus) : undefined,
        risk: currentRisk !== "ALL" ? (currentRisk as Risk) : undefined,
        outcome: currentOutcome !== "ALL" ? (currentOutcome as Verdict) : undefined,
        customer: currentCustomer || undefined,
        fromDate: currentFromDate || undefined,
        toDate: currentToDate || undefined,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
        page: currentPage,
        limit: 20,
      });

      setCases(res.cases);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  }, [
    activeCompany?.id,
    currentSearch,
    currentStatus,
    currentRisk,
    currentOutcome,
    currentCustomer,
    currentFromDate,
    currentToDate,
    currentSortBy,
    currentSortOrder,
    currentPage,
  ]);

  useEffect(() => {
    fetchCasesData();
  }, [fetchCasesData]);

  // Sorting toggle
  const handleSort = (field: "amount" | "date" | "status") => {
    if (currentSortBy === field) {
      const nextOrder = currentSortOrder === "asc" ? "desc" : "asc";
      updateUrlParams({ sortBy: field, sortOrder: nextOrder, page: "1" });
    } else {
      updateUrlParams({ sortBy: field, sortOrder: "desc", page: "1" });
    }
  };

  const getAriaSort = (field: "amount" | "date" | "status") => {
    if (currentSortBy !== field) return "none";
    return currentSortOrder === "asc" ? "ascending" : "descending";
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setCustomerInput("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentSearch ||
    currentStatus !== "ALL" ||
    currentRisk !== "ALL" ||
    currentOutcome !== "ALL" ||
    currentCustomer ||
    currentFromDate ||
    currentToDate
  );

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
      {/* ─── Page Title Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
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
            Cases
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            All refund resolution cases for{" "}
            <strong>{activeCompany?.name || "active company"}</strong>. Filter by
            status, risk, outcome, or date range.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={fetchCasesData}
            title="Refresh case table"
            aria-label="Refresh case table"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <Link
            href="/customer"
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
            <span>Raise new case</span>
          </Link>
        </div>
      </div>

      {/* ─── Filters Bar (Syncs with URL) ──────────────────────────────────── */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          {/* Search by Case ID */}
          <div>
            <label
              htmlFor="search-case-id"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Search by case ID
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="search-case-id"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateUrlParams({ search: searchInput });
                  }
                }}
                onBlur={() => {
                  if (searchInput !== currentSearch) {
                    updateUrlParams({ search: searchInput });
                  }
                }}
                placeholder="e.g. case-bk-1001"
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Filter: Customer */}
          <div>
            <label
              htmlFor="filter-customer"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Customer name
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="filter-customer"
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateUrlParams({ customer: customerInput });
                  }
                }}
                onBlur={() => {
                  if (customerInput !== currentCustomer) {
                    updateUrlParams({ customer: customerInput });
                  }
                }}
                placeholder="e.g. Arjun"
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Filter: Status */}
          <div>
            <label
              htmlFor="filter-status"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Status
            </label>
            <select
              id="filter-status"
              value={currentStatus}
              onChange={(e) => updateUrlParams({ status: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
              <option value="REJECTED">Rejected</option>
              <option value="PROCESSING">Processing</option>
              <option value="OPEN">Open</option>
            </select>
          </div>

          {/* Filter: Risk */}
          <div>
            <label
              htmlFor="filter-risk"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Risk level
            </label>
            <select
              id="filter-risk"
              value={currentRisk}
              onChange={(e) => updateUrlParams({ risk: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="ALL">All risk levels</option>
              <option value="LOW">Low risk</option>
              <option value="MEDIUM">Medium risk</option>
              <option value="HIGH">High risk</option>
            </select>
          </div>

          {/* Filter: Outcome */}
          <div>
            <label
              htmlFor="filter-outcome"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Outcome
            </label>
            <select
              id="filter-outcome"
              value={currentOutcome}
              onChange={(e) => updateUrlParams({ outcome: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="ALL">All outcomes</option>
              <option value="ALLOW">Allow (Approved)</option>
              <option value="DENY">Deny (Rejected)</option>
              <option value="ESCALATE">Escalate (HITL)</option>
            </select>
          </div>
        </div>

        {/* Date Range & Clear Filters Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Calendar size={13} />
              <span>Date range:</span>
            </span>

            <input
              type="date"
              aria-label="From date"
              value={currentFromDate}
              onChange={(e) => updateUrlParams({ fromDate: e.target.value })}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 12,
              }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
            <input
              type="date"
              aria-label="To date"
              value={currentToDate}
              onChange={(e) => updateUrlParams({ toDate: e.target.value })}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 12,
              }}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "transparent",
                color: "var(--accent)",
                border: "none",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <XCircle size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Loading Skeleton State ────────────────────────────────────────── */}
      {isLoading ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 44,
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
            }}
          />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              style={{
                height: 48,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 16,
              }}
            >
              <div
                style={{
                  height: 14,
                  width: 100,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 140,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 80,
                  background: "var(--surface-2)",
                  borderRadius: 4,
                  marginLeft: "auto",
                }}
              />
              <div
                style={{
                  height: 22,
                  width: 90,
                  background: "var(--surface-2)",
                  borderRadius: 999,
                }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ─── Error State ─────────────────────────────────────────────────── */
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
          <AlertCircle size={32} style={{ margin: "0 auto 10px auto" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px 0" }}>
            Failed to load cases
          </h2>
          <p style={{ fontSize: 13, margin: "0 0 16px 0", opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={fetchCasesData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      ) : cases.length === 0 ? (
        /* ─── Empty State ─────────────────────────────────────────────────── */
        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <Inbox
            size={36}
            strokeWidth={1.5}
            style={{ margin: "0 auto 12px auto", color: "var(--text-muted)" }}
          />
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 6,
            }}
          >
            No cases found
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {hasActiveFilters
              ? "No cases match the selected filters. Try clearing filters or altering search terms."
              : "No cases exist yet for this company."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearAllFilters}
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
                border: "none",
                cursor: "pointer",
              }}
            >
              <XCircle size={14} />
              <span>Clear filters</span>
            </button>
          ) : (
            <Link
              href="/customer"
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
              <span>Raise a test case</span>
            </Link>
          )}
        </div>
      ) : (
        /* ─── Cases Table ─────────────────────────────────────────────────── */
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
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
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Case ID
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Customer
                  </th>
                  {/* Sortable Amount Header */}
                  <th
                    aria-sort={getAriaSort("amount")}
                    style={{
                      padding: "12px 16px",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    <button
                      onClick={() => handleSort("amount")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <span>Amount</span>
                      {currentSortBy === "amount" ? (
                        currentSortOrder === "asc" ? (
                          <ArrowUp size={13} color="var(--accent)" />
                        ) : (
                          <ArrowDown size={13} color="var(--accent)" />
                        )
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </button>
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Domain
                  </th>
                  {/* Sortable Status Header */}
                  <th
                    aria-sort={getAriaSort("status")}
                    style={{ padding: "12px 16px", fontWeight: 500 }}
                  >
                    <button
                      onClick={() => handleSort("status")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <span>Status</span>
                      {currentSortBy === "status" ? (
                        currentSortOrder === "asc" ? (
                          <ArrowUp size={13} color="var(--accent)" />
                        ) : (
                          <ArrowDown size={13} color="var(--accent)" />
                        )
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </button>
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Risk
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Outcome
                  </th>
                  {/* Sortable Date Header */}
                  <th
                    aria-sort={getAriaSort("date")}
                    style={{ padding: "12px 16px", fontWeight: 500 }}
                  >
                    <button
                      onClick={() => handleSort("date")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <span>Date (IST)</span>
                      {currentSortBy === "date" ? (
                        currentSortOrder === "asc" ? (
                          <ArrowUp size={13} color="var(--accent)" />
                        ) : (
                          <ArrowDown size={13} color="var(--accent)" />
                        )
                      ) : (
                        <ArrowUpDown size={13} />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const outcome = c.outcome;
                  return (
                    <tr
                      key={c.id}
                      tabIndex={0}
                      onClick={() => router.push(`/cases/${c.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/cases/${c.id}`);
                        }
                      }}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        transition: "background 150ms ease-out",
                        outline: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.background = "var(--surface-2)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Case ID */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                          color: "var(--accent)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.id}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 500, color: "var(--text)" }}>
                          {c.customerName}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                          }}
                        >
                          {c.customerTier} tier
                        </div>
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatINR(c.requestedAmount)}
                      </td>

                      {/* Domain */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-secondary)",
                          textTransform: "capitalize",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.domain}
                      </td>

                      {/* Status Chip */}
                      <td style={{ padding: "12px 16px" }}>
                        <StatusChip status={c.status} size="sm" />
                      </td>

                      {/* Risk Chip */}
                      <td style={{ padding: "12px 16px" }}>
                        <RiskChip risk={c.riskLevel || "LOW"} size="sm" />
                      </td>

                      {/* Outcome */}
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {outcome === "ALLOW" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "var(--success)",
                              fontWeight: 500,
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Allow</span>
                          </span>
                        ) : outcome === "DENY" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "var(--danger)",
                              fontWeight: 500,
                            }}
                          >
                            <XCircle size={13} />
                            <span>Deny</span>
                          </span>
                        ) : outcome === "ESCALATE" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "var(--warning)",
                              fontWeight: 500,
                            }}
                          >
                            <AlertTriangle size={13} />
                            <span>Escalate</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Date (IST) */}
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatISTDate(c.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination Bar ────────────────────────────────────────────── */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-muted)",
              background: "var(--surface)",
            }}
          >
            <div>
              Showing{" "}
              <strong>
                {Math.min(
                  totalCount,
                  (currentPage - 1) * 20 + 1
                )}
                -
                {Math.min(totalCount, currentPage * 20)}
              </strong>{" "}
              of <strong>{totalCount}</strong> cases
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>

              <div style={{ display: "flex", gap: 4 }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() =>
                    updateUrlParams({ page: String(currentPage - 1) })
                  }
                  aria-label="Previous page"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background:
                      currentPage <= 1
                        ? "var(--surface-2)"
                        : "var(--surface)",
                    color:
                      currentPage <= 1
                        ? "var(--text-muted)"
                        : "var(--text)",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    opacity: currentPage <= 1 ? 0.6 : 1,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    updateUrlParams({ page: String(currentPage + 1) })
                  }
                  aria-label="Next page"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background:
                      currentPage >= totalPages
                        ? "var(--surface-2)"
                        : "var(--surface)",
                    color:
                      currentPage >= totalPages
                        ? "var(--text-muted)"
                        : "var(--text)",
                    cursor:
                      currentPage >= totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage >= totalPages ? 0.6 : 1,
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
          <div
            style={{
              height: 36,
              width: 180,
              background: "var(--surface-2)",
              borderRadius: 6,
              marginBottom: 16,
            }}
          />
          <div
            style={{
              height: 400,
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          />
        </div>
      }
    >
      <CasesTableContent />
    </Suspense>
  );
}
