import { getMode, apiFetch } from "./client";
import type { AuditRecord, AuditQueryOptions } from "@/lib/schemas";

const MOCK_AUDIT_LOG: AuditRecord[] = [
  {
    id: "aud-001",
    ts: "2026-10-22T08:15:20.000Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Customer (Rohan Mehta)",
    actorType: "Customer",
    action: "CASE_CREATED",
    oldState: "NONE",
    newState: "OPEN",
    traceId: "trc-bk-1014",
    metadata: {
      customerId: "cust-bk-05",
      transactionId: "txn-bk-15",
      requestedAmount: 38000,
      channel: "web-simulator",
      ipAddress: "192.168.1.104",
    },
  },
  {
    id: "aud-002",
    ts: "2026-10-22T08:15:21.400Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Retrieval Agent",
    actorType: "AI",
    action: "POLICY_RETRIEVAL" as unknown as "POLICY_RETRIEVED",
    oldState: "OPEN",
    newState: "PROCESSING",
    traceId: "trc-bk-1014",
    metadata: {
      topK: 4,
      similarityThreshold: 0.85,
      documentId: "pol-banking-v1",
      topChunkId: "chk-05",
      score: 0.94,
    },
  },
  {
    id: "aud-003",
    ts: "2026-10-22T08:15:23.100Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Decision Agent (LLM)",
    actorType: "AI",
    action: "AI_DECISION_GENERATED",
    oldState: "PROCESSING",
    newState: "PROCESSING",
    traceId: "trc-bk-1014",
    metadata: {
      recommendedAction: "PARTIAL_REFUND",
      recommendedAmount: 25000,
      confidence: 0.91,
      model: "claude-3-5-sonnet",
      tokensUsed: 1420,
    },
  },
  {
    id: "aud-004",
    ts: "2026-10-22T08:15:23.450Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Policy Enforcement Point",
    actorType: "System",
    action: "RULE_CHECKED",
    oldState: "PROCESSING",
    newState: "PROCESSING",
    traceId: "trc-bk-1014",
    metadata: {
      rulesChecked: 7,
      rulesPassed: 6,
      failedRule: "Amount within automated threshold limit",
      policyLimit: 25000,
      requestedAmount: 38000,
    },
  },
  {
    id: "aud-005",
    ts: "2026-10-22T08:15:23.800Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Policy Enforcement Point",
    actorType: "System",
    action: "HITL_TRIGGERED",
    oldState: "PROCESSING",
    newState: "ESCALATED",
    traceId: "trc-bk-1014",
    metadata: {
      reason: "Requested amount (Rs 38,000) exceeds automated limit of Rs 25,000",
      riskLevel: "HIGH",
      assignedQueue: "tier2-compliance",
      slaMinutes: 30,
    },
  },
  {
    id: "aud-006",
    ts: "2026-10-22T08:24:12.000Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Compliance Officer (Anita)",
    actorType: "Human",
    action: "HUMAN_APPROVED",
    oldState: "ESCALATED",
    newState: "RESOLVED",
    traceId: "trc-bk-1014",
    metadata: {
      reviewerId: "usr-rev-02",
      decision: "APPROVED_WITH_MODIFIED_AMOUNT",
      approvedAmount: 25000,
      reviewerComment: "Approved within policy cap after customer identity verification.",
      resolutionDurationSec: 528,
    },
  },
  {
    id: "aud-007",
    ts: "2026-10-22T08:24:14.200Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1014",
    actor: "Transaction Service",
    actorType: "System",
    action: "REFUND_EXECUTED",
    oldState: "RESOLVED",
    newState: "RESOLVED",
    traceId: "trc-bk-1014",
    metadata: {
      paymentGateway: "RazorpayX",
      gatewayReference: "ref-pg-8842194",
      amountDisbursed: 25000,
      currency: "INR",
      payoutStatus: "SUCCESS",
    },
  },
  {
    id: "aud-008",
    ts: "2026-10-22T10:14:05.000Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1006",
    actor: "Customer Note Intake",
    actorType: "Customer",
    action: "CASE_CREATED",
    oldState: "NONE",
    newState: "OPEN",
    traceId: "trc-bk-1006",
    metadata: {
      customerId: "cust-bk-03",
      transactionId: "txn-bk-07",
      requestedAmount: 500000,
    },
  },
  {
    id: "aud-009",
    ts: "2026-10-22T10:14:06.100Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1006",
    actor: "Prompt Guard Service",
    actorType: "System",
    action: "REFUND_FAILED",
    oldState: "PROCESSING",
    newState: "REJECTED",
    traceId: "trc-bk-1006",
    metadata: {
      layer: "LLM guard",
      rejectionReason: "Adversarial prompt injection pattern detected.",
      verdict: "DENY",
      securityIncidentRef: "sec-inc-042",
    },
  },
  {
    id: "aud-010",
    ts: "2026-10-22T12:00:10.000Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1016",
    actor: "Customer (Arjun Sharma)",
    actorType: "Customer",
    action: "CASE_CREATED",
    oldState: "NONE",
    newState: "OPEN",
    traceId: "trc-bk-1016",
    metadata: {
      customerId: "cust-bk-01",
      requestedAmount: 1650,
      transactionId: "txn-bk-17",
    },
  },
  {
    id: "aud-011",
    ts: "2026-10-22T12:00:12.800Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1016",
    actor: "Decision Agent",
    actorType: "AI",
    action: "AI_DECISION_GENERATED",
    oldState: "PROCESSING",
    newState: "PROCESSING",
    traceId: "trc-bk-1016",
    metadata: {
      recommendedAction: "APPROVE_REFUND",
      recommendedAmount: 1650,
      confidence: 0.98,
    },
  },
  {
    id: "aud-012",
    ts: "2026-10-22T12:00:14.000Z",
    tenant: "Meridian Bank",
    caseId: "case-bk-1016",
    actor: "Transaction Service",
    actorType: "System",
    action: "REFUND_EXECUTED",
    oldState: "PROCESSING",
    newState: "RESOLVED",
    traceId: "trc-bk-1016",
    metadata: {
      gatewayReference: "ref-pg-9938102",
      amountDisbursed: 1650,
      currency: "INR",
    },
  },
];

// Normalize POLICY_RETRIEVAL to POLICY_RETRIEVED
MOCK_AUDIT_LOG.forEach((e) => {
  if ((e.action as string) === "POLICY_RETRIEVAL") {
    e.action = "POLICY_RETRIEVED";
  }
});

export async function getAuditEvents(
  options: AuditQueryOptions = {}
): Promise<AuditRecord[]> {
  const mode = getMode();

  if (mode === "mock") {
    let list = [...MOCK_AUDIT_LOG];

    if (options.tenant && options.tenant !== "ALL") {
      list = list.filter((a) => a.tenant === options.tenant);
    }

    if (options.action && options.action !== "ALL") {
      list = list.filter((a) => a.action === options.action);
    }

    if (options.actorType && options.actorType !== "ALL") {
      list = list.filter((a) => a.actorType === options.actorType);
    }

    if (options.caseId && options.caseId.trim()) {
      const q = options.caseId.trim().toLowerCase();
      list = list.filter((a) => a.caseId.toLowerCase().includes(q));
    }

    // Sort by timestamp descending
    list.sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );

    return list;
  }

  const params = new URLSearchParams();
  if (options.action && options.action !== "ALL") params.set("action", options.action);
  if (options.actorType && options.actorType !== "ALL") params.set("actorType", options.actorType);
  if (options.caseId) params.set("caseId", options.caseId);
  if (options.tenant) params.set("tenant", options.tenant);

  return apiFetch<AuditRecord[]>(`/api/audit-logs?${params.toString()}`);
}
