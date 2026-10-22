import { z } from "zod";

// ─── Fixed node names ─────────────────────────────────────────────────────────

export const NodeName = z.enum([
  "INTAKE",
  "VALIDATION",
  "POLICY_RETRIEVAL",
  "DECISION",
  "RISK",
  "ENFORCEMENT",
  "HUMAN_REVIEW",
  "EXECUTION",
]);
export type NodeName = z.infer<typeof NodeName>;

// ─── Core result types ────────────────────────────────────────────────────────

export const Verdict = z.enum(["ALLOW", "DENY", "ESCALATE"]);
export type Verdict = z.infer<typeof Verdict>;

export const Risk = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type Risk = z.infer<typeof Risk>;

export const Decision = z.enum([
  "APPROVE_REFUND",
  "REJECT",
  "PARTIAL_REFUND",
  "NEEDS_INFO",
]);
export type Decision = z.infer<typeof Decision>;

export const PolicyReference = z.object({
  policyId: z.string(),
  version: z.number(),
  documentName: z.string(),
  page: z.number(),
  section: z.string(),
  chunkId: z.string(),
  excerpt: z.string(),
  score: z.number(),
});
export type PolicyReference = z.infer<typeof PolicyReference>;

export const EnforcementRule = z.object({
  rule: z.string(),
  passed: z.boolean(),
  reason: z.string(),
});
export type EnforcementRule = z.infer<typeof EnforcementRule>;

export const ResolutionResult = z.object({
  caseId: z.string(),
  decision: Decision,
  recommendedAmount: z.number(),
  confidence: z.number().min(0).max(1),
  riskLevel: Risk,
  policyReferences: z.array(PolicyReference),
  requiresHumanReview: z.boolean(),
  reasoningSummary: z.string(),
  enforcement: z.array(EnforcementRule),
  verdict: Verdict,
  traceId: z.string(),
});
export type ResolutionResult = z.infer<typeof ResolutionResult>;

// ─── WebSocket event schemas ──────────────────────────────────────────────────

export const WsIngestionProgress = z.object({
  type: z.literal("INGESTION_PROGRESS"),
  policyId: z.string(),
  stage: z.string(),
  percent: z.number(),
});

export const WsNodeStarted = z.object({
  type: z.literal("NODE_STARTED"),
  caseId: z.string(),
  node: NodeName,
  ts: z.string(),
});

export const WsNodeCompleted = z.object({
  type: z.literal("NODE_COMPLETED"),
  caseId: z.string(),
  node: NodeName,
  durationMs: z.number(),
  output: z.record(z.unknown()),
});

export const WsNodeFailed = z.object({
  type: z.literal("NODE_FAILED"),
  caseId: z.string(),
  node: NodeName,
  error: z.string(),
});

export const WsHitlRequired = z.object({
  type: z.literal("HITL_REQUIRED"),
  caseId: z.string(),
  reason: z.string(),
  riskLevel: Risk,
});

export const WsHitlResolved = z.object({
  type: z.literal("HITL_RESOLVED"),
  caseId: z.string(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewer: z.string(),
  modifiedAmount: z.number().optional(),
  reason: z.string().optional(),
});

export const WsCaseCompleted = z.object({
  type: z.literal("CASE_COMPLETED"),
  caseId: z.string(),
  verdict: Verdict,
  refundRef: z.string().optional(),
  approvedAmount: z.number().optional(),
});

export const WsAuditEvent = z.object({
  type: z.literal("AUDIT_EVENT"),
  caseId: z.string(),
  action: z.string(),
  actor: z.string(),
  ts: z.string(),
  oldState: z.string().optional(),
  newState: z.string().optional(),
});

export const WsEvent = z.discriminatedUnion("type", [
  WsIngestionProgress,
  WsNodeStarted,
  WsNodeCompleted,
  WsNodeFailed,
  WsHitlRequired,
  WsHitlResolved,
  WsCaseCompleted,
  WsAuditEvent,
]);
export type WsEvent = z.infer<typeof WsEvent>;

// ─── Domain config schema ─────────────────────────────────────────────────────

export const ScenarioPreset = z.object({
  id: z.string(),
  label: z.string(),
  tag: z.enum(["Valid", "Edge case", "Needs human", "Attack"]),
  customerId: z.string(),
  transactionId: z.string(),
  message: z.string(),
  requestedAmount: z.number(),
  // Whether the mock engine should trigger HITL for this preset
  triggersHitl: z.boolean(),
  failNode: NodeName.optional(),
  hitlModifiedAmount: z.number().optional(),
});
export type ScenarioPreset = z.infer<typeof ScenarioPreset>;

export const MockCustomer = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(["Standard", "Premium", "VIP"]),
  historyCount: z.number(),
});
export type MockCustomer = z.infer<typeof MockCustomer>;

export const MockTransaction = z.object({
  id: z.string(),
  customerId: z.string(),
  date: z.string(),
  amount: z.number(),
  status: z.enum(["Completed", "Failed", "Disputed", "Refunded"]),
  merchant: z.string(),
  type: z.string(),
});
export type MockTransaction = z.infer<typeof MockTransaction>;

export const DomainConfig = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
  exampleScenarios: z.tuple([z.string(), z.string()]),
  slaMinutes: z.number().optional(),
  companies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      currency: z.literal("INR"),
      autoApproveThreshold: z.number(),
      hitlThreshold: z.number(),
      maxRefundPerPeriod: z.number(),
      samplePolicyPath: z.string(),
    })
  ),
  transactionTypes: z.array(z.string()),
  refundReasons: z.array(z.string()),
  presets: z.array(ScenarioPreset),
  customers: z.array(MockCustomer),
  transactions: z.array(MockTransaction),
});
export type DomainConfig = z.infer<typeof DomainConfig>;

// ─── App state types ──────────────────────────────────────────────────────────

export type Domain =
  | "banking"
  | "insurance"
  | "subscriptions"
  | "ecommerce"
  | "travel";

export type Role = "admin" | "customer" | "reviewer" | "auditor";

export type Mode = "mock" | "live";

export type Theme = "light" | "dark";

export interface AppState {
  domain: Domain | null;
  companyId: string | null;
  role: Role;
  mode: Mode;
  theme: Theme;
}

export type AppAction =
  | { type: "SET_DOMAIN"; domain: Domain }
  | { type: "SET_COMPANY"; companyId: string }
  | { type: "SET_ROLE"; role: Role }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_THEME"; theme: Theme };

// ─── Case record types ────────────────────────────────────────────────────────

export interface CaseRecord {
  id: string;
  domain: Domain;
  companyId: string;
  customerId: string;
  customerName: string;
  customerTier: "Standard" | "Premium" | "VIP";
  transactionId: string;
  transactionAmount: number;
  requestedAmount: number;
  approvedAmount?: number;
  rejectionReason?: string;
  message: string;
  presetId?: string;
  presetTag?: "Valid" | "Edge case" | "Needs human" | "Attack";
  triggersHitl: boolean;
  failNode?: NodeName;
  hitlModifiedAmount?: number;
  status: "OPEN" | "PROCESSING" | "RESOLVED" | "ESCALATED" | "REJECTED";
  createdAt: string;
  traceId: string;
  attachmentName?: string;
  escalationReason?: string;
  riskLevel?: Risk;
  outcome?: Verdict;
}

export interface CreateCaseInput {
  domain: Domain;
  companyId: string;
  customerId: string;
  customerName: string;
  customerTier: "Standard" | "Premium" | "VIP";
  transactionId: string;
  transactionAmount: number;
  requestedAmount: number;
  message: string;
  presetId?: string;
  presetTag?: "Valid" | "Edge case" | "Needs human" | "Attack";
  triggersHitl: boolean;
  failNode?: NodeName;
  hitlModifiedAmount?: number;
  attachmentName?: string;
}

// ─── Review Action Schemas ───────────────────────────────────────────────────

export const ReviewApproveModifiedSchema = z.object({
  modifiedAmount: z.number().positive("Amount must be greater than 0"),
});
export type ReviewApproveModifiedInput = z.infer<
  typeof ReviewApproveModifiedSchema
>;

export const ReviewRejectSchema = z.object({
  comment: z
    .string()
    .min(10, "Comment is required and must be at least 10 characters"),
});
export type ReviewRejectInput = z.infer<typeof ReviewRejectSchema>;

// ─── Case List Query & Results ───────────────────────────────────────────────

export interface CaseQueryOptions {
  companyId?: string;
  domain?: Domain;
  status?: "OPEN" | "PROCESSING" | "RESOLVED" | "ESCALATED" | "REJECTED";
  risk?: Risk;
  outcome?: Verdict;
  search?: string;
  customer?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "amount" | "date" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CaseListResult {
  cases: CaseRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalCases: number;
  autoResolved: number;
  escalated: number;
  rejected: number;
  totalRefunded: number;
  avgResolutionTimeMs: number;
  casesByOutcome: {
    outcome: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  casesOverTime: {
    date: string;
    count: number;
  }[];
  stageLatencies: {
    stage: NodeName;
    label: string;
    latencyMs: number;
  }[];
}


