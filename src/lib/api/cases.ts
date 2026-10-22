import { getMode, apiFetch } from "./client";
import { resolveHitl, subscribeMockEscalations } from "@/lib/mock/mockEngine";
import type {
  CaseRecord,
  CreateCaseInput,
  NodeName,
  CaseQueryOptions,
  CaseListResult,
} from "@/lib/schemas";

// In-memory store for mock mode
const mockCases = new Map<string, CaseRecord>();

// Seed default mock cases for Meridian Bank if empty
export function ensureMockSeedData() {
  if (mockCases.size > 0) return;

  const seeds: CaseRecord[] = [
    {
      id: "case-bk-1001",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Premium",
      transactionId: "txn-bk-01",
      transactionAmount: 2500,
      requestedAmount: 2500,
      approvedAmount: 2500,
      message: "UPI payment failed at merchant checkout but funds debited.",
      presetId: "bk-safe-upi",
      presetTag: "Valid",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-16T10:14:00.000Z",
      traceId: "trc-bk-1001",
    },
    {
      id: "case-bk-1002",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-02",
      customerName: "Priya Nair",
      customerTier: "Standard",
      transactionId: "txn-bk-02",
      transactionAmount: 3600,
      requestedAmount: 1800,
      approvedAmount: 1800,
      message: "Partial merchant delivery dispute. Merchant confirmed shortage.",
      presetId: "bk-edge-partial",
      presetTag: "Edge case",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "MEDIUM",
      createdAt: "2026-10-16T15:30:00.000Z",
      traceId: "trc-bk-1002",
    },
    {
      id: "case-bk-1003",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-03",
      customerName: "Vikram Das",
      customerTier: "VIP",
      transactionId: "txn-bk-04",
      transactionAmount: 1000,
      requestedAmount: 50000,
      message: "Customer demanded 50x escalation for service inconvenience.",
      presetId: "bk-attack-amount",
      presetTag: "Attack",
      triggersHitl: false,
      status: "REJECTED",
      outcome: "DENY",
      riskLevel: "HIGH",
      rejectionReason: "Amount requested exceeds transaction value limit.",
      createdAt: "2026-10-17T09:20:00.000Z",
      traceId: "trc-bk-1003",
    },
    {
      id: "case-bk-1004",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Premium",
      transactionId: "txn-bk-05",
      transactionAmount: 4200,
      requestedAmount: 4200,
      approvedAmount: 4200,
      message: "Same-day NEFT double charge reversed after gateway reconciliation.",
      presetId: "bk-edge-double",
      presetTag: "Edge case",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-17T14:45:00.000Z",
      traceId: "trc-bk-1004",
    },
    {
      id: "case-bk-1005",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-02",
      customerName: "Priya Nair",
      customerTier: "Standard",
      transactionId: "txn-bk-06",
      transactionAmount: 1500,
      requestedAmount: 1500,
      approvedAmount: 1500,
      message: "Card swipe billed twice at grocery POS terminal.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-18T11:10:00.000Z",
      traceId: "trc-bk-1005",
    },
    {
      id: "case-bk-1006",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-03",
      customerName: "Vikram Das",
      customerTier: "VIP",
      transactionId: "txn-bk-07",
      transactionAmount: 500000,
      requestedAmount: 500000,
      message: "Prompt injection attempt detected in customer note field.",
      presetId: "bk-attack-injection",
      presetTag: "Attack",
      triggersHitl: false,
      status: "REJECTED",
      outcome: "DENY",
      riskLevel: "HIGH",
      rejectionReason: "Adversarial prompt pattern detected by safety guard.",
      createdAt: "2026-10-18T16:05:00.000Z",
      traceId: "trc-bk-1006",
    },
    {
      id: "case-bk-1007",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-04",
      customerName: "Anita Rao",
      customerTier: "Standard",
      transactionId: "txn-bk-08",
      transactionAmount: 42000,
      requestedAmount: 42000,
      message: "Unauthorized debit above policy automated threshold limit.",
      presetId: "bk-hitl-large",
      presetTag: "Needs human",
      triggersHitl: true,
      status: "ESCALATED",
      outcome: "ESCALATE",
      riskLevel: "HIGH",
      escalationReason: "Amount exceeds automated approval threshold (Rs 25,000)",
      createdAt: "2026-10-19T08:40:00.000Z",
      traceId: "trc-bk-1007",
    },
    {
      id: "case-bk-1008",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-05",
      customerName: "Rohan Mehta",
      customerTier: "VIP",
      transactionId: "txn-bk-09",
      transactionAmount: 3200,
      requestedAmount: 3200,
      approvedAmount: 3200,
      message: "ATM cash dispenser timeout. Account debited without cash disbursement.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-19T13:25:00.000Z",
      traceId: "trc-bk-1008",
    },
    {
      id: "case-bk-1009",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-06",
      customerName: "Sneha Reddy",
      customerTier: "Premium",
      transactionId: "txn-bk-10",
      transactionAmount: 28500,
      requestedAmount: 28500,
      message: "High-value corporate payment dispute under investigation.",
      triggersHitl: true,
      status: "ESCALATED",
      outcome: "ESCALATE",
      riskLevel: "HIGH",
      escalationReason: "Amount exceeds automated approval threshold (Rs 25,000)",
      createdAt: "2026-10-20T10:00:00.000Z",
      traceId: "trc-bk-1009",
    },
    {
      id: "case-bk-1010",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Premium",
      transactionId: "txn-bk-11",
      transactionAmount: 950,
      requestedAmount: 950,
      approvedAmount: 950,
      message: "Micro-transaction failed during QR code scan.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-20T14:15:00.000Z",
      traceId: "trc-bk-1010",
    },
    {
      id: "case-bk-1011",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-02",
      customerName: "Priya Nair",
      customerTier: "Standard",
      transactionId: "txn-bk-12",
      transactionAmount: 4800,
      requestedAmount: 4800,
      approvedAmount: 4800,
      message: "Bill pay debit succeeded but utility provider did not credit bill.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-21T09:40:00.000Z",
      traceId: "trc-bk-1011",
    },
    {
      id: "case-bk-1012",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-03",
      customerName: "Vikram Das",
      customerTier: "VIP",
      transactionId: "txn-bk-13",
      transactionAmount: 12000,
      requestedAmount: 12000,
      message: "Transaction claimed after 90-day dispute window limit.",
      triggersHitl: false,
      status: "REJECTED",
      outcome: "DENY",
      riskLevel: "MEDIUM",
      rejectionReason: "Claim submitted beyond 90-day dispute eligibility window.",
      createdAt: "2026-10-21T11:55:00.000Z",
      traceId: "trc-bk-1012",
    },
    {
      id: "case-bk-1013",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-04",
      customerName: "Anita Rao",
      customerTier: "Standard",
      transactionId: "txn-bk-14",
      transactionAmount: 1250,
      requestedAmount: 1250,
      approvedAmount: 1250,
      message: "Mobile recharge deduction with failed telecom acknowledgment.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-21T16:20:00.000Z",
      traceId: "trc-bk-1013",
    },
    {
      id: "case-bk-1014",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-05",
      customerName: "Rohan Mehta",
      customerTier: "VIP",
      transactionId: "txn-bk-15",
      transactionAmount: 38000,
      requestedAmount: 38000,
      message: "High-value international transaction requiring compliance check.",
      triggersHitl: true,
      status: "ESCALATED",
      outcome: "ESCALATE",
      riskLevel: "HIGH",
      escalationReason: "Amount exceeds automated approval threshold (Rs 25,000)",
      createdAt: "2026-10-22T08:15:00.000Z",
      traceId: "trc-bk-1014",
    },
    {
      id: "case-bk-1015",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-06",
      customerName: "Sneha Reddy",
      customerTier: "Premium",
      transactionId: "txn-bk-16",
      transactionAmount: 2100,
      requestedAmount: 2100,
      approvedAmount: 2100,
      message: "Fuel surcharge waiver not credited as per account terms.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T10:30:00.000Z",
      traceId: "trc-bk-1015",
    },
    {
      id: "case-bk-1016",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Premium",
      transactionId: "txn-bk-17",
      transactionAmount: 1650,
      requestedAmount: 1650,
      approvedAmount: 1650,
      message: "E-commerce refund not routed back to original payment instrument.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T12:00:00.000Z",
      traceId: "trc-bk-1016",
    },
    {
      id: "case-bk-1017",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-02",
      customerName: "Priya Nair",
      customerTier: "Standard",
      transactionId: "txn-bk-18",
      transactionAmount: 750,
      requestedAmount: 750,
      approvedAmount: 750,
      message: "Duplicate debit on contactless transit tap.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T13:10:00.000Z",
      traceId: "trc-bk-1017",
    },
    {
      id: "case-bk-1018",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-03",
      customerName: "Vikram Das",
      customerTier: "VIP",
      transactionId: "txn-bk-19",
      transactionAmount: 5000,
      requestedAmount: 5000,
      approvedAmount: 5000,
      message: "Auto-debit mandate triggered after formal cancellation notice.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "MEDIUM",
      createdAt: "2026-10-22T14:20:00.000Z",
      traceId: "trc-bk-1018",
    },
    {
      id: "case-bk-1019",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-04",
      customerName: "Anita Rao",
      customerTier: "Standard",
      transactionId: "txn-bk-20",
      transactionAmount: 3100,
      requestedAmount: 3100,
      approvedAmount: 3100,
      message: "Failed recurring OTT subscription billed to debit card.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T15:05:00.000Z",
      traceId: "trc-bk-1019",
    },
    {
      id: "case-bk-1020",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-05",
      customerName: "Rohan Mehta",
      customerTier: "VIP",
      transactionId: "txn-bk-21",
      transactionAmount: 2900,
      requestedAmount: 2900,
      approvedAmount: 2900,
      message: "Dining outlet charged incorrect tip amount on final ledger.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T15:40:00.000Z",
      traceId: "trc-bk-1020",
    },
    {
      id: "case-bk-1021",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-06",
      customerName: "Sneha Reddy",
      customerTier: "Premium",
      transactionId: "txn-bk-22",
      transactionAmount: 4500,
      requestedAmount: 4500,
      approvedAmount: 4500,
      message: "Flight cancellation refund delayed past statutory turnaround window.",
      triggersHitl: false,
      status: "RESOLVED",
      outcome: "ALLOW",
      riskLevel: "LOW",
      createdAt: "2026-10-22T16:15:00.000Z",
      traceId: "trc-bk-1021",
    },
    {
      id: "case-bk-1022",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Premium",
      transactionId: "txn-bk-23",
      transactionAmount: 1800,
      requestedAmount: 1800,
      message: "Pending review of merchant refund acknowledgment.",
      triggersHitl: false,
      status: "OPEN",
      outcome: "PENDING" as unknown as undefined,
      riskLevel: "LOW",
      createdAt: "2026-10-22T16:45:00.000Z",
      traceId: "trc-bk-1022",
    },
    {
      id: "case-bk-1023",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-02",
      customerName: "Priya Nair",
      customerTier: "Standard",
      transactionId: "txn-bk-24",
      transactionAmount: 8900,
      requestedAmount: 8900,
      message: "Suspected phishing charge flagged by autonomous risk agent.",
      triggersHitl: false,
      status: "PROCESSING",
      outcome: "PENDING" as unknown as undefined,
      riskLevel: "MEDIUM",
      createdAt: "2026-10-22T17:10:00.000Z",
      traceId: "trc-bk-1023",
    },
    {
      id: "case-bk-1024",
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-03",
      customerName: "Vikram Das",
      customerTier: "VIP",
      transactionId: "txn-bk-25",
      transactionAmount: 15400,
      requestedAmount: 15400,
      message: "Card dispute submitted with non-matching merchant authorization code.",
      triggersHitl: false,
      status: "REJECTED",
      outcome: "DENY",
      riskLevel: "HIGH",
      rejectionReason: "Merchant code and authorization credentials do not match dispute records.",
      createdAt: "2026-10-22T17:30:00.000Z",
      traceId: "trc-bk-1024",
    },
  ];

  for (const s of seeds) {
    mockCases.set(s.id, s);
  }
}

export function resetMockData(): void {
  mockCases.clear();
  ensureMockSeedData();
}

// Initialize seed data immediately
ensureMockSeedData();

// Automatically synchronize mockCases when mockEngine emits escalation events
subscribeMockEscalations((event) => {
  if (event.type === "HITL_REQUIRED") {
    const existing = mockCases.get(event.caseId);
    if (existing) {
      existing.status = "ESCALATED";
      existing.escalationReason = event.reason;
      existing.riskLevel = event.riskLevel;
      existing.outcome = "ESCALATE";
    }
  } else if (event.type === "HITL_RESOLVED") {
    const existing = mockCases.get(event.caseId);
    if (existing) {
      existing.status = event.decision === "APPROVED" ? "RESOLVED" : "REJECTED";
      existing.outcome = event.decision === "APPROVED" ? "ALLOW" : "DENY";
      if (event.modifiedAmount !== undefined) {
        existing.approvedAmount = event.modifiedAmount;
      }
      if (event.reason !== undefined) {
        existing.rejectionReason = event.reason;
      }
    }
  }
});

export function getMockCaseRecord(caseId: string): CaseRecord | undefined {
  ensureMockSeedData();
  return mockCases.get(caseId);
}

export function getAllMockCases(): CaseRecord[] {
  ensureMockSeedData();
  return Array.from(mockCases.values());
}

export async function getEscalations(): Promise<CaseRecord[]> {
  const mode = getMode();

  if (mode === "mock") {
    ensureMockSeedData();
    return Array.from(mockCases.values()).filter(
      (c) => c.status === "ESCALATED"
    );
  }

  return apiFetch<CaseRecord[]>("/api/escalations");
}

export async function getCases(
  options: CaseQueryOptions = {}
): Promise<CaseListResult> {
  const mode = getMode();

  if (mode === "mock") {
    ensureMockSeedData();
    let list = Array.from(mockCases.values());

    // 1. Company filter
    if (options.companyId) {
      list = list.filter((c) => c.companyId === options.companyId);
    }

    // 2. Domain filter
    if (options.domain) {
      list = list.filter((c) => c.domain === options.domain);
    }

    // 3. Status filter
    if (options.status) {
      list = list.filter((c) => c.status === options.status);
    }

    // 4. Risk filter
    if (options.risk) {
      list = list.filter((c) => (c.riskLevel || "LOW") === options.risk);
    }

    // 5. Outcome filter
    if (options.outcome) {
      list = list.filter((c) => (c.outcome || "ALLOW") === options.outcome);
    }

    // 6. Search by case ID (prefix or exact match)
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter((c) => c.id.toLowerCase().includes(q));
    }

    // 7. Customer filter (name substring)
    if (options.customer && options.customer.trim()) {
      const q = options.customer.trim().toLowerCase();
      list = list.filter((c) =>
        c.customerName.toLowerCase().includes(q)
      );
    }

    // 8. Date range filters
    if (options.fromDate) {
      const fromTime = new Date(options.fromDate).getTime();
      list = list.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
    }
    if (options.toDate) {
      const toTime = new Date(options.toDate).getTime() + 86400000;
      list = list.filter((c) => new Date(c.createdAt).getTime() <= toTime);
    }

    // 9. Sorting
    const sortBy = options.sortBy || "date";
    const sortOrder = options.sortOrder || "desc";
    const multiplier = sortOrder === "asc" ? 1 : -1;

    list.sort((a, b) => {
      if (sortBy === "amount") {
        return (a.requestedAmount - b.requestedAmount) * multiplier;
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status) * multiplier;
      }
      // default: date
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
        multiplier
      );
    });

    // 10. Pagination
    const page = Math.max(1, options.page || 1);
    const limit = options.limit || 20;
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedCases = list.slice(startIndex, startIndex + limit);

    return {
      cases: paginatedCases,
      totalCount,
      page,
      totalPages,
      limit,
    };
  }

  // Live mode query string
  const params = new URLSearchParams();
  if (options.companyId) params.set("companyId", options.companyId);
  if (options.status) params.set("status", options.status);
  if (options.risk) params.set("risk", options.risk);
  if (options.outcome) params.set("outcome", options.outcome);
  if (options.search) params.set("search", options.search);
  if (options.customer) params.set("customer", options.customer);
  if (options.fromDate) params.set("fromDate", options.fromDate);
  if (options.toDate) params.set("toDate", options.toDate);
  if (options.sortBy) params.set("sortBy", options.sortBy);
  if (options.sortOrder) params.set("sortOrder", options.sortOrder);
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));

  return apiFetch<CaseListResult>(`/api/tickets?${params.toString()}`);
}

export async function getRecentCases(
  companyId?: string,
  limit: number = 10
): Promise<CaseRecord[]> {
  const result = await getCases({
    companyId,
    sortBy: "date",
    sortOrder: "desc",
    page: 1,
    limit,
  });
  return result.cases;
}

export async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
  const mode = getMode();

  if (mode === "mock") {
    ensureMockSeedData();
    const id = `case-${input.domain.slice(0, 2)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const traceId = `trc-${crypto.randomUUID().slice(0, 8)}`;
    const record: CaseRecord = {
      ...input,
      id,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      traceId,
    };
    mockCases.set(id, record);
    return record;
  }

  return apiFetch<CaseRecord>("/api/tickets", {
    method: "POST",
    body: input,
  });
}

export async function getCase(caseId: string): Promise<CaseRecord | null> {
  const mode = getMode();

  if (mode === "mock") {
    ensureMockSeedData();
    const found = mockCases.get(caseId);
    if (found) return found;

    return {
      id: caseId,
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Arjun Sharma",
      customerTier: "Standard",
      transactionId: "txn-bk-01",
      transactionAmount: 2500,
      requestedAmount: 2500,
      message: "I made a UPI payment of ₹2,500 to ShopMart on 18 Oct but the amount was debited and the transaction failed. Please refund.",
      presetId: "bk-safe-upi",
      presetTag: "Valid",
      triggersHitl: false,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      traceId: `trc-${caseId.slice(-6)}`,
    };
  }

  return apiFetch<CaseRecord>(`/api/tickets/${caseId}`);
}

export async function resolveHumanReview(
  caseId: string,
  decision: "APPROVED" | "REJECTED",
  opts?: { modifiedAmount?: number; reason?: string }
): Promise<void> {
  const mode = getMode();

  if (mode === "mock") {
    ensureMockSeedData();
    resolveHitl(caseId, {
      decision,
      modifiedAmount: opts?.modifiedAmount,
      reason: opts?.reason,
    });
    const existing = mockCases.get(caseId);
    if (existing) {
      existing.status = decision === "APPROVED" ? "RESOLVED" : "REJECTED";
      existing.outcome = decision === "APPROVED" ? "ALLOW" : "DENY";
      if (opts?.modifiedAmount !== undefined) {
        existing.approvedAmount = opts.modifiedAmount;
      }
      if (opts?.reason !== undefined) {
        existing.rejectionReason = opts.reason;
      }
      mockCases.set(caseId, existing);
    }
    return;
  }

  const endpoint = decision === "APPROVED" ? "approve" : "reject";
  await apiFetch(`/api/escalations/${caseId}/${endpoint}`, {
    method: "POST",
    body: opts,
  });
}

export async function retryCaseNode(
  caseId: string,
  node: NodeName
): Promise<void> {
  const mode = getMode();

  if (mode === "mock") {
    const { retryMockNode } = await import("@/lib/mock/mockEngine");
    retryMockNode(caseId, node);
    return;
  }

  await apiFetch(`/api/tickets/${caseId}/resolve`, {
    method: "POST",
    body: { node },
  });
}
