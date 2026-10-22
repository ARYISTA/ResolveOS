/**
 * mockEngine.ts
 *
 * Emits the same WebSocket event shapes as the real backend, on a timer.
 * A full case runs in ~6–10 seconds.
 *
 * Safe case: runs all nodes, ends with ALLOW.
 * High-risk case: pauses at HUMAN_REVIEW until approve() or reject() is called.
 *
 * Components never call this directly — they go through lib/api/ws.ts.
 */

import type { WsEvent, NodeName, Risk, Verdict } from "@/lib/schemas";

type Listener = (event: WsEvent) => void;

// ─── Node sequence and timings ────────────────────────────────────────────────

const NODES: NodeName[] = [
  "INTAKE",
  "VALIDATION",
  "POLICY_RETRIEVAL",
  "DECISION",
  "RISK",
  "ENFORCEMENT",
];

// Duration each node "processes" before completing (ms)
const NODE_DURATION: Record<NodeName, number> = {
  INTAKE: 800,
  VALIDATION: 600,
  POLICY_RETRIEVAL: 1400,
  DECISION: 1200,
  RISK: 700,
  ENFORCEMENT: 900,
  HUMAN_REVIEW: 0, // paused — resumed externally
  EXECUTION: 1000,
};

// Plausible output snippets per node
const NODE_OUTPUT: Record<NodeName, Record<string, unknown>> = {
  INTAKE: {
    intent: "refund_request",
    entities: { amount: null, reason: "Customer dispute regarding failed or incorrect debit" },
    confidence: 0.94,
    summary: "Customer refund request parsed and intent classified as dispute reversal.",
  },
  VALIDATION: {
    transactionExists: true,
    belongsToCustomer: true,
    withinWindow: true,
    alreadyRefunded: false,
    summary: "Transaction confirmed: authentic, linked to customer, and within dispute SLA window.",
  },
  POLICY_RETRIEVAL: {
    chunksRetrieved: 3,
    topScore: 0.93,
    summary: "Retrieved 3 policy clauses from indexed refund and dispute policy.",
    citations: [
      {
        policyId: "pol-banking-v1",
        version: 1,
        documentName: "Refund & Dispute Policy v1.4",
        page: 6,
        section: "Section 3.2 Turnaround Time (TAT) for Failed Debits",
        chunkId: "chk-04",
        excerpt:
          "Where an account is debited but the beneficiary account is not credited during a transfer, the system shall initiate an auto-reversal within T+1 working days without requiring manual grievance registration.",
        score: 0.93,
      },
      {
        policyId: "pol-banking-v1",
        version: 1,
        documentName: "Refund & Dispute Policy v1.4",
        page: 4,
        section: "Section 2.3 Reporting Windows and Zero-Liability Criteria",
        chunkId: "chk-03",
        excerpt:
          "Customer liability shall be zero where the transaction occurs through system failure and the customer notifies the institution within three working days.",
        score: 0.88,
      },
      {
        policyId: "pol-banking-v1",
        version: 1,
        documentName: "Refund & Dispute Policy v1.4",
        page: 10,
        section: "Section 5.0 Auto-Reversal Mandates and Compensation",
        chunkId: "chk-07",
        excerpt:
          "Delay beyond turnaround timeline entitles the customer to compensation directly credited to the linked account upon verified reconciliation.",
        score: 0.82,
      },
    ],
  },
  DECISION: {
    recommendation: "APPROVE_REFUND",
    confidence: 0.89,
    reasoningSummary:
      "Transaction records verify debited funds were not received by merchant. Clause 3.2 mandates full refund. Requested amount is within authorized auto-approve limit.",
    summary: "Recommendation: APPROVE_REFUND (89% confidence).",
  },
  RISK: {
    level: "LOW",
    score: 0.14,
    factors: ["Account in good standing", "No prior disputed transactions", "Consistent device fingerprint"],
    summary: "Risk level assessed as LOW (0.14 anomaly score).",
  },
  ENFORCEMENT: {
    checks: [
      { rule: "Schema validation", passed: true, reason: "Dispute payload satisfies required schema" },
      { rule: "Tenant isolation", passed: true, reason: "Tenant authority and customer boundary valid" },
      { rule: "Policy conditions met", passed: true, reason: "Verified against Clause 3.2 conditions" },
      { rule: "Amount within limit", passed: true, reason: "Amount is within auto-approve threshold" },
      { rule: "Transaction validity", passed: true, reason: "Transaction confirmed settled and disputed" },
      { rule: "Risk acceptable", passed: true, reason: "Risk score below threshold" },
      { rule: "HITL required", passed: false, reason: "No mandatory human escalation triggers met" },
    ],
    verdict: "ALLOW",
    summary: "Deterministic guardrails passed 7/7 checks. Verdict: ALLOW.",
  },
  HUMAN_REVIEW: { reviewer: null, decision: null, summary: "Pending review by compliance officer." },
  EXECUTION: {
    refundRef: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    gatewayStatus: "SUCCESS",
    summary: "Payment gateway transaction reversed. Credit notification dispatched.",
  },
};

// ─── Active sessions ──────────────────────────────────────────────────────────

interface Session {
  caseId: string;
  triggersHitl: boolean;
  listener: Listener;
  // For HITL: resolve the paused promise when a human decision arrives
  hitlResolve?: (decision: "APPROVED" | "REJECTED") => void;
  aborted: boolean;
}

const sessions = new Map<string, Session>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emit(session: Session, event: WsEvent): void {
  if (!session.aborted) {
    session.listener(event);
  }
}

function now(): string {
  return new Date().toISOString();
}

// ─── Main pipeline runner ─────────────────────────────────────────────────────

async function runPipeline(session: Session): Promise<void> {
  const { caseId, triggersHitl } = session;

  // Run standard nodes
  for (const node of NODES) {
    if (session.aborted) return;

    emit(session, { type: "NODE_STARTED", caseId, node, ts: now() });

    await sleep(NODE_DURATION[node]);
    if (session.aborted) return;

    // Override RISK output for high-risk preset
    const output =
      node === "RISK" && triggersHitl
        ? { level: "HIGH" as Risk, factors: ["Large amount", "First dispute"] }
        : node === "ENFORCEMENT" && triggersHitl
        ? {
            ...NODE_OUTPUT.ENFORCEMENT,
            checks: [
              { rule: "Schema valid", passed: true },
              { rule: "Tenant valid", passed: true },
              { rule: "Policy conditions met", passed: true },
              { rule: "Amount within limit", passed: false },
              { rule: "Transaction valid", passed: true },
              { rule: "Risk acceptable", passed: false },
              { rule: "HITL required", passed: true },
            ],
            verdict: "ESCALATE",
          }
        : NODE_OUTPUT[node];

    emit(session, {
      type: "NODE_COMPLETED",
      caseId,
      node,
      durationMs: NODE_DURATION[node],
      output,
    });

    emit(session, {
      type: "AUDIT_EVENT",
      caseId,
      action: `${node}_COMPLETED`,
      actor: "system",
      ts: now(),
    });
  }

  if (session.aborted) return;

  // ─── HITL branch ─────────────────────────────────────────────────────────
  if (triggersHitl) {
    emit(session, {
      type: "HITL_REQUIRED",
      caseId,
      reason: "Amount exceeds auto-approve threshold. Risk level HIGH.",
      riskLevel: "HIGH",
    });

    emit(session, {
      type: "NODE_STARTED",
      caseId,
      node: "HUMAN_REVIEW",
      ts: now(),
    });

    // Pause until a human decision arrives
    const humanDecision = await new Promise<"APPROVED" | "REJECTED">(
      (resolve) => {
        session.hitlResolve = resolve;
      }
    );

    if (session.aborted) return;

    emit(session, {
      type: "HITL_RESOLVED",
      caseId,
      decision: humanDecision,
      reviewer: "demo-reviewer",
    });

    emit(session, {
      type: "NODE_COMPLETED",
      caseId,
      node: "HUMAN_REVIEW",
      durationMs: 0,
      output: { decision: humanDecision, reviewer: "demo-reviewer" },
    });

    if (humanDecision === "REJECTED") {
      emit(session, {
        type: "CASE_COMPLETED",
        caseId,
        verdict: "DENY",
      });
      sessions.delete(caseId);
      return;
    }
  }

  // ─── Execution ────────────────────────────────────────────────────────────
  if (session.aborted) return;

  emit(session, { type: "NODE_STARTED", caseId, node: "EXECUTION", ts: now() });
  await sleep(NODE_DURATION.EXECUTION);
  if (session.aborted) return;

  const refundRef = `REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  emit(session, {
    type: "NODE_COMPLETED",
    caseId,
    node: "EXECUTION",
    durationMs: NODE_DURATION.EXECUTION,
    output: { refundRef, gatewayStatus: "SUCCESS" },
  });

  const verdict: Verdict = triggersHitl ? "ALLOW" : "ALLOW";
  emit(session, { type: "CASE_COMPLETED", caseId, verdict, refundRef });

  emit(session, {
    type: "AUDIT_EVENT",
    caseId,
    action: "REFUND_EXECUTED",
    actor: "transaction-service",
    ts: now(),
  });

  sessions.delete(caseId);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start a mock case run. Returns a caseId.
 * onEvent is called for every WS event in order.
 */
export function startMockCase(
  opts: { caseId?: string; triggersHitl?: boolean },
  onEvent: Listener
): string {
  const caseId = opts.caseId ?? crypto.randomUUID();
  const session: Session = {
    caseId,
    triggersHitl: opts.triggersHitl ?? false,
    listener: onEvent,
    aborted: false,
  };
  sessions.set(caseId, session);
  runPipeline(session);
  return caseId;
}

/**
 * Resume a HITL-paused case. Must be called by the reviewer action.
 */
export function resolveHitl(
  caseId: string,
  decision: "APPROVED" | "REJECTED"
): void {
  const session = sessions.get(caseId);
  if (session?.hitlResolve) {
    session.hitlResolve(decision);
  }
}

/**
 * Abort an in-progress case (e.g., user navigates away).
 */
export function abortMockCase(caseId: string): void {
  const session = sessions.get(caseId);
  if (session) {
    session.aborted = true;
    sessions.delete(caseId);
  }
}

// ─── Policy ingestion runner ──────────────────────────────────────────────────

const INGESTION_STAGES = [
  { stage: "Uploaded", percent: 20 },
  { stage: "Parsing", percent: 40 },
  { stage: "Chunking", percent: 60 },
  { stage: "Embedding", percent: 80 },
  { stage: "Indexed", percent: 100 },
] as const;

const ingestionSessions = new Map<string, { aborted: boolean }>();

/**
 * Start mock policy ingestion progression.
 * Emits INGESTION_PROGRESS events through the 5 stages.
 */
export function startMockIngestion(
  policyId: string,
  onEvent: Listener
): void {
  const session = { aborted: false };
  ingestionSessions.set(policyId, session);

  (async () => {
    for (const step of INGESTION_STAGES) {
      if (session.aborted) return;
      await sleep(650);
      if (session.aborted) return;

      onEvent({
        type: "INGESTION_PROGRESS",
        policyId,
        stage: step.stage,
        percent: step.percent,
      });
    }
    ingestionSessions.delete(policyId);
  })();
}

/**
 * Abort an in-progress policy ingestion.
 */
export function abortMockIngestion(policyId: string): void {
  const session = ingestionSessions.get(policyId);
  if (session) {
    session.aborted = true;
    ingestionSessions.delete(policyId);
  }
}

