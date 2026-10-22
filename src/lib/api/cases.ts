import { getMode, apiFetch } from "./client";
import { resolveHitl } from "@/lib/mock/mockEngine";
import type { CaseRecord, CreateCaseInput, NodeName } from "@/lib/schemas";

// In-memory store for mock mode
const mockCases = new Map<string, CaseRecord>();

export function getMockCaseRecord(caseId: string): CaseRecord | undefined {
  return mockCases.get(caseId);
}

export async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
  const mode = getMode();

  if (mode === "mock") {
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
    const found = mockCases.get(caseId);
    if (found) return found;

    // Fallback template for direct link navigation or testing
    return {
      id: caseId,
      domain: "banking",
      companyId: "meridian-bank",
      customerId: "cust-bk-01",
      customerName: "Aarav Sharma",
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
    resolveHitl(caseId, {
      decision,
      modifiedAmount: opts?.modifiedAmount,
      reason: opts?.reason,
    });
    const existing = mockCases.get(caseId);
    if (existing) {
      existing.status = decision === "APPROVED" ? "RESOLVED" : "REJECTED";
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

  await apiFetch(`/api/cases/${caseId}/retry`, {
    method: "POST",
    body: { node },
  });
}
