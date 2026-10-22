import { getMode, apiFetch } from "./client";
import type { PolicyRecord } from "@/lib/schemas";

const MOCK_POLICIES: PolicyRecord[] = [
  {
    id: "pol-banking-v1",
    name: "Refund & Dispute Policy",
    companyId: "meridian-bank",
    companyName: "Meridian Bank",
    domain: "banking",
    currentVersion: 2,
    createdAt: "2026-09-01T10:00:00.000Z",
    versions: [
      {
        version: 2,
        updatedAt: "2026-10-21T14:30:00.000Z",
        chunkCount: 18,
        filePath: "/policies/banking/meridian-refund-policy.pdf",
        fileSizeKb: 142,
        active: true,
      },
      {
        version: 1,
        updatedAt: "2026-09-01T10:00:00.000Z",
        chunkCount: 14,
        filePath: "/policies/banking/meridian-refund-policy-v1.pdf",
        fileSizeKb: 118,
        active: false,
      },
    ],
    chunks: [
      {
        id: "chk-01",
        section: "Section 1.1 Scope and Customer Eligibility",
        page: 1,
        tokenCount: 220,
        excerpt:
          "This policy applies to all retail checking, savings, and credit accounts maintained with Meridian Bank. Customers in good standing are eligible for automated refund resolution within 90 days of transaction settlement.",
      },
      {
        id: "chk-02",
        section: "Section 2.1 Failed UPI Transfer Reversals",
        page: 3,
        tokenCount: 310,
        excerpt:
          "For technical UPI transfer declines where account debit occurs without beneficiary credit, automated reversal shall execute within 24 hours upon NPCI clearing reconciliation without requiring manual branch filing.",
      },
      {
        id: "chk-03",
        section: "Section 3.2 Double Debit Reversals and Reconciliation",
        page: 5,
        tokenCount: 280,
        excerpt:
          "In instances where merchant POS terminals submit identical sequence hashes within a 120-minute window, the secondary debit transaction shall be flagged for immediate autonomous settlement refund.",
      },
      {
        id: "chk-04",
        section: "Section 3.4 Disputed Liability Apportionment",
        page: 7,
        tokenCount: 340,
        excerpt:
          "Where partial liability or suspicious telemetry is indicated, the compliance reviewer holds discretion to adjust approved reimbursement down to verified merchant loss amount.",
      },
      {
        id: "chk-05",
        section: "Section 4.1 Tier-2 Discretionary Thresholds",
        page: 12,
        tokenCount: 410,
        excerpt:
          "Disputed transactions exceeding ₹20,000 shall be subject to mandatory dual-officer compliance verification before any debit reversal or ledger write-back.",
      },
      {
        id: "chk-06",
        section: "Section 4.5 Mandatory Human In The Loop Thresholds",
        page: 14,
        tokenCount: 260,
        excerpt:
          "Any single claim exceeding the automated limit of ₹25,000 or exhibiting aggregate frequency anomalies must pause execution and enter the human review queue.",
      },
      {
        id: "chk-07",
        section: "Section 5.2 Chargeback Documentation Standards",
        page: 16,
        tokenCount: 190,
        excerpt:
          "Customer must provide merchant invoice or system debit notification. Missing documentation triggers automated request for customer info without denying underlying claim.",
      },
      {
        id: "chk-08",
        section: "Section 6.1 Regulatory Turnaround Time (TAT) Mandates",
        page: 18,
        tokenCount: 240,
        excerpt:
          "Pursuant to Reserve Bank of India circular RBI/2019-20/67 on harmonisation of turnaround time (TAT), authorized compensation must disburse within T+5 business days.",
      },
    ],
  },
  {
    id: "pol-banking-northwind",
    name: "Card Dispute & Chargeback Policy",
    companyId: "northwind-cards",
    companyName: "Northwind Cards",
    domain: "banking",
    currentVersion: 1,
    createdAt: "2026-09-10T12:00:00.000Z",
    versions: [
      {
        version: 1,
        updatedAt: "2026-09-10T12:00:00.000Z",
        chunkCount: 12,
        filePath: "/policies/banking/northwind-dispute-policy.pdf",
        fileSizeKb: 96,
        active: true,
      },
    ],
    chunks: [
      {
        id: "chk-nw-01",
        section: "Section 1.0 Cardholder Protection Framework",
        page: 1,
        tokenCount: 200,
        excerpt:
          "Northwind Cards limits zero-liability protection to unauthorized transactions reported within 3 days of statement issuance.",
      },
      {
        id: "chk-nw-02",
        section: "Section 2.3 Surcharge Waivers and Disputes",
        page: 4,
        tokenCount: 180,
        excerpt:
          "Fuel and IRCTC merchant surcharges debited in excess of statutory limits are refunded automatically upon monthly statement generation.",
      },
    ],
  },
  {
    id: "pol-insurance-safeguard",
    name: "Claims & Free-Look Cancellation Policy",
    companyId: "safeguard-life",
    companyName: "SafeGuard Life",
    domain: "insurance",
    currentVersion: 1,
    createdAt: "2026-08-15T09:00:00.000Z",
    versions: [
      {
        version: 1,
        updatedAt: "2026-08-15T09:00:00.000Z",
        chunkCount: 16,
        filePath: "/policies/insurance/safeguard-cancellation.pdf",
        fileSizeKb: 130,
        active: true,
      },
    ],
    chunks: [
      {
        id: "chk-ins-01",
        section: "Section 2.1 15-Day Free-Look Period",
        page: 2,
        tokenCount: 260,
        excerpt:
          "Policyholders may cancel coverage within 15 days of policy receipt and receive a full premium refund minus stamp duty and medical examination expenses.",
      },
    ],
  },
  {
    id: "pol-subs-streambox",
    name: "Subscription & Billing Policy",
    companyId: "streambox",
    companyName: "StreamBox",
    domain: "subscriptions",
    currentVersion: 1,
    createdAt: "2026-08-20T11:00:00.000Z",
    versions: [
      {
        version: 1,
        updatedAt: "2026-08-20T11:00:00.000Z",
        chunkCount: 10,
        filePath: "/policies/subscriptions/streambox-refunds.pdf",
        fileSizeKb: 88,
        active: true,
      },
    ],
    chunks: [
      {
        id: "chk-sub-01",
        section: "Section 1.2 Trial Billing Cancellation",
        page: 1,
        tokenCount: 190,
        excerpt:
          "Users billed due to cancellation request latency during trial periods are entitled to immediate 100% credit card refund.",
      },
    ],
  },
  {
    id: "pol-ecom-shopkart",
    name: "Return & Replacement Policy",
    companyId: "shopkart",
    companyName: "ShopKart",
    domain: "ecommerce",
    currentVersion: 1,
    createdAt: "2026-07-10T10:00:00.000Z",
    versions: [
      {
        version: 1,
        updatedAt: "2026-07-10T10:00:00.000Z",
        chunkCount: 15,
        filePath: "/policies/ecommerce/shopkart-returns.pdf",
        fileSizeKb: 104,
        active: true,
      },
    ],
    chunks: [
      {
        id: "chk-eco-01",
        section: "Section 3.1 Damaged on Arrival",
        page: 3,
        tokenCount: 220,
        excerpt:
          "Damaged items reported within 48 hours with courier handover unboxing evidence receive instant wallet or bank refund.",
      },
    ],
  },
];

export async function getPolicies(
  companyId?: string
): Promise<PolicyRecord[]> {
  const mode = getMode();
  if (mode === "mock") {
    if (companyId) {
      return MOCK_POLICIES.filter((p) => p.companyId === companyId);
    }
    return MOCK_POLICIES;
  }

  const endpoint = companyId
    ? `/api/policies?companyId=${encodeURIComponent(companyId)}`
    : "/api/policies";
  return apiFetch<PolicyRecord[]>(endpoint);
}

export async function getPolicy(
  policyId: string
): Promise<PolicyRecord | null> {
  const mode = getMode();
  if (mode === "mock") {
    const found = MOCK_POLICIES.find((p) => p.id === policyId);
    return found || MOCK_POLICIES[0] || null;
  }

  return apiFetch<PolicyRecord>(`/api/policies/${policyId}`);
}
