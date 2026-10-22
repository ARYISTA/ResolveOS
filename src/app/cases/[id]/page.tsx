"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  History,
  Activity,
  Layers,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import {
  getCase,
  resolveHumanReview,
  retryCaseNode,
} from "@/lib/api/cases";
import {
  subscribeToCaseEvents,
  simulateWsDrop,
  type WsConnectionStatus,
} from "@/lib/api/ws";
import { formatINR } from "@/lib/utils";
import type {
  CaseRecord,
  WsEvent,
  NodeName,
  Verdict,
  Risk,
  Decision,
  PolicyReference,
  EnforcementRule,
} from "@/lib/schemas";

import {
  PipelineStepper,
  NodeStateInfo,
} from "@/components/pipeline/PipelineStepper";
import {
  AgentRoster,
  AgentRosterItem,
} from "@/components/pipeline/AgentRoster";
import {
  AgentFeed,
  AgentFeedMessage,
} from "@/components/pipeline/AgentFeed";
import { DecisionPanel } from "@/components/case/DecisionPanel";
import { CitationCard } from "@/components/case/CitationCard";
import { EnforcementChecklist } from "@/components/case/EnforcementChecklist";
import { Timeline, StageLatency } from "@/components/case/Timeline";
import { AuditList, CaseAuditEventItem } from "@/components/case/AuditList";

// Initial nodes in exact order
const DEFAULT_NODES: NodeStateInfo[] = [
  {
    node: "INTAKE",
    displayName: "Intake Agent",
    layer: "ai",
    layerLabel: "AI Agent",
    status: "idle",
  },
  {
    node: "VALIDATION",
    displayName: "Validation Engine",
    layer: "deterministic",
    layerLabel: "Deterministic",
    status: "idle",
  },
  {
    node: "POLICY_RETRIEVAL",
    displayName: "Policy Retrieval",
    layer: "ai",
    layerLabel: "AI Agent (RAG)",
    status: "idle",
  },
  {
    node: "DECISION",
    displayName: "Decision Agent",
    layer: "ai",
    layerLabel: "AI Agent (LLM)",
    status: "idle",
  },
  {
    node: "RISK",
    displayName: "Risk Classifier",
    layer: "ai",
    layerLabel: "AI Agent",
    status: "idle",
  },
  {
    node: "ENFORCEMENT",
    displayName: "Policy Enforcement",
    layer: "deterministic",
    layerLabel: "Deterministic",
    status: "idle",
  },
  {
    node: "HUMAN_REVIEW",
    displayName: "Human Review",
    layer: "human",
    layerLabel: "Human",
    status: "idle",
  },
  {
    node: "EXECUTION",
    displayName: "Transaction Service",
    layer: "transaction",
    layerLabel: "Transaction",
    status: "idle",
  },
];

const INITIAL_ROSTER: AgentRosterItem[] = [
  {
    id: "ag-intake",
    name: "Intake Agent",
    initials: "IA",
    layer: "ai",
    nodeName: "INTAKE",
    status: "idle",
  },
  {
    id: "ag-retrieval",
    name: "Retrieval Agent",
    initials: "RA",
    layer: "ai",
    nodeName: "POLICY_RETRIEVAL",
    status: "idle",
  },
  {
    id: "ag-decision",
    name: "Decision Agent",
    initials: "DA",
    layer: "ai",
    nodeName: "DECISION",
    status: "idle",
  },
  {
    id: "ag-risk",
    name: "Risk Agent",
    initials: "KA",
    layer: "ai",
    nodeName: "RISK",
    status: "idle",
  },
  {
    id: "ag-pep",
    name: "Enforcement Point",
    initials: "PE",
    layer: "deterministic",
    nodeName: "ENFORCEMENT",
    status: "idle",
  },
  {
    id: "ag-tx",
    name: "Transaction Service",
    initials: "TS",
    layer: "transaction",
    nodeName: "EXECUTION",
    status: "idle",
  },
  {
    id: "ag-human",
    name: "Review Agent",
    initials: "HR",
    layer: "human",
    nodeName: "HUMAN_REVIEW",
    status: "idle",
  },
];

const INITIAL_ENFORCEMENT_RULES: EnforcementRule[] = [
  { rule: "Schema valid", passed: true, reason: "Awaiting evaluation" },
  { rule: "Tenant valid", passed: true, reason: "Awaiting evaluation" },
  { rule: "Policy conditions met", passed: true, reason: "Awaiting evaluation" },
  { rule: "Amount within limit", passed: true, reason: "Awaiting evaluation" },
  { rule: "Transaction valid", passed: true, reason: "Awaiting evaluation" },
  { rule: "Risk acceptable", passed: true, reason: "Awaiting evaluation" },
  { rule: "HITL required", passed: true, reason: "Awaiting evaluation" },
];

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = (params?.id as string) || "";

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [nodes, setNodes] = useState<NodeStateInfo[]>(DEFAULT_NODES);
  const [roster, setRoster] = useState<AgentRosterItem[]>(INITIAL_ROSTER);
  const [messages, setMessages] = useState<AgentFeedMessage[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeName | null>("DECISION");
  const [showHumanReview, setShowHumanReview] = useState(false);
  const [isHitlPaused, setIsHitlPaused] = useState(false);
  const [hitlResolved, setHitlResolved] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Connection & recovery state
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>("connected");

  // Case details & outcomes
  const [overallVerdict, setOverallVerdict] = useState<Verdict | undefined>();
  const [decisionOutcome, setDecisionOutcome] =
    useState<Decision>("APPROVE_REFUND");
  const [approvedAmount, setApprovedAmount] = useState<number | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [confidence, setConfidence] = useState<number>(0.89);
  const [riskLevel, setRiskLevel] = useState<Risk>("LOW");
  const [reasoningSummary, setReasoningSummary] = useState<string>("");
  const [citations, setCitations] = useState<PolicyReference[]>([]);
  const [enforcementChecks, setEnforcementChecks] = useState<EnforcementRule[]>(
    INITIAL_ENFORCEMENT_RULES
  );
  const [latencies, setLatencies] = useState<StageLatency[]>([]);
  const [auditEvents, setAuditEvents] = useState<CaseAuditEventItem[]>([]);

  // Active detail tab
  const [activeTab, setActiveTab] = useState<
    "decision" | "citations" | "enforcement" | "timeline" | "audit"
  >("decision");

  // Timer & accessibility announcement
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");

  // Load case metadata
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getCase(caseId);
        if (mounted) {
          if (!data) {
            setError("Case not found.");
          } else {
            setCaseRecord(data);
            if (data.triggersHitl) {
              setShowHumanReview(true);
            }
            if (data.approvedAmount !== undefined) {
              setApprovedAmount(data.approvedAmount);
            }
            if (data.rejectionReason !== undefined) {
              setRejectionReason(data.rejectionReason);
            }
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load case");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  // Snapshot reload on WebSocket reconnect
  const loadCaseSnapshot = useCallback(async () => {
    try {
      const snap = await getCase(caseId);
      if (snap) {
        setCaseRecord(snap);
        if (snap.status === "RESOLVED") setOverallVerdict("ALLOW");
        if (snap.status === "REJECTED") setOverallVerdict("DENY");
        if (snap.status === "ESCALATED") {
          setIsHitlPaused(true);
          setShowHumanReview(true);
        }
        if (snap.approvedAmount !== undefined) {
          setApprovedAmount(snap.approvedAmount);
        }
        if (snap.rejectionReason !== undefined) {
          setRejectionReason(snap.rejectionReason);
        }
      }
    } catch {
      // Ignore transient fetch failure on reload
    }
  }, [caseId]);

  // Elapsed timer: freezes while isHitlPaused is true, resumes on HITL_RESOLVED, stops permanently on isCompleted
  useEffect(() => {
    if (isCompleted || isHitlPaused || isLoading || error) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isHitlPaused, isLoading, error]);

  // Handle incoming WebSocket events
  const handleWsEvent = useCallback((event: WsEvent) => {
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    switch (event.type) {
      case "NODE_STARTED": {
        const { node } = event;

        // Update pipeline nodes
        setNodes((prev) =>
          prev.map((n) =>
            n.node === node
              ? {
                  ...n,
                  status: "running",
                  errorMessage: undefined,
                  resultSummary: "Processing...",
                }
              : n
          )
        );

        // Update agent roster
        setRoster((prev) =>
          prev.map((a) =>
            a.nodeName === node
              ? { ...a, status: "running", lastMessage: `Started ${node}` }
              : a
          )
        );

        if (node === "HUMAN_REVIEW") {
          setShowHumanReview(true);
          setIsHitlPaused(true);
        }
        break;
      }

      case "NODE_COMPLETED": {
        const { node, durationMs, output } = event;

        // Compute readable summary from output
        let summary = "";
        if (typeof output?.summary === "string") {
          summary = output.summary;
        } else if (node === "INTAKE") {
          summary = "Intent classified: Refund request verified.";
        } else if (node === "VALIDATION") {
          summary = "Customer, transaction, and eligibility validated.";
        } else if (node === "POLICY_RETRIEVAL") {
          summary = "Policy sections retrieved with high similarity.";
        } else if (node === "DECISION") {
          summary = "Resolution recommendation generated.";
        } else if (node === "RISK") {
          summary = "Risk factors calculated.";
        } else if (node === "ENFORCEMENT") {
          summary = "Rule-based boundary checks evaluated.";
        } else if (node === "HUMAN_REVIEW") {
          summary = `Human review decision: ${output?.decision || "APPROVED"}.`;
        } else if (node === "EXECUTION") {
          summary = `Refund executed: ${output?.refundRef || "SUCCESS"}.`;
        }

        // Update nodes
        setNodes((prev) =>
          prev.map((n) =>
            n.node === node
              ? {
                  ...n,
                  status: "success",
                  durationMs,
                  errorMessage: undefined,
                  resultSummary: summary,
                }
              : n
          )
        );

        // Update roster
        setRoster((prev) =>
          prev.map((a) =>
            a.nodeName === node
              ? { ...a, status: "completed", lastMessage: summary }
              : a
          )
        );

        // Add to agent feed
        const agentEntry = INITIAL_ROSTER.find((r) => r.nodeName === node);
        setMessages((prev) => [
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            agentName: agentEntry?.name || node,
            message: summary,
            timestamp: nowTime,
          },
          ...prev,
        ]);

        // Update stage latency in timeline
        const nodeEntry = DEFAULT_NODES.find((d) => d.node === node);
        if (nodeEntry && durationMs > 0) {
          setLatencies((prev) => [
            ...prev.filter((l) => l.node !== node),
            {
              node,
              displayName: nodeEntry.displayName,
              durationMs,
            },
          ]);
        }

        // Populate tab detail models
        if (node === "POLICY_RETRIEVAL" && Array.isArray(output?.citations)) {
          setCitations(output.citations as PolicyReference[]);
        }
        if (node === "DECISION") {
          if (typeof output?.confidence === "number") {
            setConfidence(output.confidence);
          }
          if (typeof output?.reasoningSummary === "string") {
            setReasoningSummary(output.reasoningSummary);
          }
          if (typeof output?.recommendation === "string") {
            setDecisionOutcome(output.recommendation as Decision);
          }
        }
        if (node === "RISK") {
          if (typeof output?.level === "string") {
            setRiskLevel(output.level as Risk);
          }
        }
        if (node === "ENFORCEMENT") {
          if (Array.isArray(output?.checks)) {
            setEnforcementChecks(output.checks as EnforcementRule[]);
          }
          if (typeof output?.verdict === "string") {
            setOverallVerdict(output.verdict as Verdict);
          }
        }

        // Announce completed step to screen readers
        setAnnouncement(`${nodeEntry?.displayName || node} completed`);
        break;
      }

      case "NODE_FAILED": {
        const { node, error: errMsg } = event;
        setNodes((prev) =>
          prev.map((n) =>
            n.node === node
              ? {
                  ...n,
                  status: "failed",
                  errorMessage: errMsg,
                  resultSummary: `Execution failed: ${errMsg}`,
                }
              : n
          )
        );
        setRoster((prev) =>
          prev.map((a) =>
            a.nodeName === node
              ? { ...a, status: "idle", lastMessage: "Node failed" }
              : a
          )
        );
        setAnnouncement(`Node ${node} failed: ${errMsg}`);
        break;
      }

      case "HITL_REQUIRED": {
        setShowHumanReview(true);
        setIsHitlPaused(true);
        setOverallVerdict("ESCALATE");
        setNodes((prev) =>
          prev.map((n) =>
            n.node === "HUMAN_REVIEW"
              ? {
                  ...n,
                  status: "waiting",
                  resultSummary: "Paused awaiting compliance officer sign-off",
                }
              : n
          )
        );
        setAnnouncement("Case escalated: awaiting human review decision");
        break;
      }

      case "HITL_RESOLVED": {
        setIsHitlPaused(false);
        setHitlResolved(true);
        const isApproved = event.decision === "APPROVED";

        if (event.modifiedAmount !== undefined) {
          setApprovedAmount(event.modifiedAmount);
        }
        if (event.reason) {
          setRejectionReason(event.reason);
        }

        setNodes((prev) =>
          prev.map((n) =>
            n.node === "HUMAN_REVIEW"
              ? {
                  ...n,
                  status: isApproved ? "success" : "failed",
                  resultSummary: isApproved
                    ? `Human review approved${
                        event.modifiedAmount
                          ? ` (adjusted to ${formatINR(event.modifiedAmount)})`
                          : ""
                      }`
                    : `Human review rejected: ${event.reason || "Dispute rejected by reviewer"}`,
                }
              : n
          )
        );
        setAnnouncement(`Human review resolved: ${event.decision}`);
        break;
      }

      case "CASE_COMPLETED": {
        setIsCompleted(true);
        setIsHitlPaused(false);
        setOverallVerdict(event.verdict);
        if (event.approvedAmount !== undefined) {
          setApprovedAmount(event.approvedAmount);
        }

        // If rejected, mark execution as skipped
        if (event.verdict === "DENY") {
          setNodes((prev) =>
            prev.map((n) =>
              n.node === "EXECUTION" && n.status === "idle"
                ? {
                    ...n,
                    status: "skipped",
                    resultSummary: "Execution skipped due to dispute rejection",
                  }
                : n
            )
          );
        }

        setAnnouncement(`Case completed with verdict: ${event.verdict}`);
        break;
      }

      case "AUDIT_EVENT": {
        setAuditEvents((prev) => [
          {
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            action: event.action,
            actor: event.actor,
            timestamp: event.ts,
            oldState: event.oldState,
            newState: event.newState,
          },
          ...prev,
        ]);
        break;
      }
    }
  }, []);

  // Subscribe to WebSocket case events with reconnect & snapshot restore
  useEffect(() => {
    if (!caseRecord) return;

    const unsubscribe = subscribeToCaseEvents(
      caseId,
      {
        triggersHitl: caseRecord.triggersHitl ?? false,
        failNode: caseRecord.failNode,
        hitlModifiedAmount: caseRecord.hitlModifiedAmount,
        onStatusChange: (status) => setWsStatus(status),
        onReconnect: () => {
          loadCaseSnapshot();
        },
      },
      (event: WsEvent) => {
        handleWsEvent(event);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [caseRecord, caseId, handleWsEvent, loadCaseSnapshot]);

  // Compliance officer approves human review
  const handleApproveReview = async (modifiedAmount?: number) => {
    setIsReviewing(true);
    try {
      await resolveHumanReview(caseId, "APPROVED", {
        modifiedAmount: modifiedAmount ?? caseRecord?.hitlModifiedAmount,
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Compliance officer rejects human review
  const handleRejectReview = async (reason?: string) => {
    setIsReviewing(true);
    try {
      await resolveHumanReview(caseId, "REJECTED", {
        reason: reason || "Claim does not meet compliance verification standards.",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Retry action for a failed pipeline node
  const handleRetryNode = async (node: NodeName) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.node === node
          ? {
              ...n,
              status: "running",
              errorMessage: undefined,
              resultSummary: "Retrying...",
            }
          : n
      )
    );
    await retryCaseNode(caseId, node);
  };

  // Node selection handler
  const handleSelectNode = (node: NodeName) => {
    setSelectedNode(node);
    if (node === "POLICY_RETRIEVAL") {
      setActiveTab("citations");
    } else if (node === "ENFORCEMENT") {
      setActiveTab("enforcement");
    } else if (node === "EXECUTION") {
      setActiveTab("timeline");
    } else {
      setActiveTab("decision");
    }
  };

  // Total elapsed latency sum
  const totalLatencyMs = latencies.reduce((acc, l) => acc + l.durationMs, 0);

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            height: 60,
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className="lg:col-span-5"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  background: "var(--surface)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
          <div className="lg:col-span-7">
            <div
              style={{
                height: 380,
                background: "var(--surface)",
                borderRadius: 12,
                border: "1px solid var(--border)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────

  if (error || !caseRecord) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 32,
          background: "var(--danger-soft)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--danger)",
        }}
      >
        <ShieldAlert size={32} style={{ margin: "0 auto 12px auto" }} />
        <h2 style={{ fontSize: 20, margin: "0 0 8px 0" }}>Case not found</h2>
        <p style={{ fontSize: 14, margin: "0 0 20px 0" }}>
          {error || "Unknown error occurred"}
        </p>
        <Link
          href="/customer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to customer simulator</span>
        </Link>
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
        gap: 20,
        paddingBottom: 48,
      }}
    >
      {/* ─── Reconnecting Alert Banner (Shown when WS connection drops) ────────── */}
      {wsStatus === "reconnecting" && (
        <div
          role="status"
          style={{
            background: "var(--warning-soft)",
            border: "1px solid var(--warning)",
            borderRadius: 8,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--warning)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RefreshCw size={15} className="animate-spin" />
            <span>
              Connection lost. Reconnecting to live pipeline stream with
              backoff...
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              background: "var(--surface)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            Auto-reconnecting
          </span>
        </div>
      )}

      {/* ─── Sticky Header ──────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          paddingTop: 8,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Left: back link + case id + customer + amount + domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/customer"
              aria-label="Back to simulator"
              style={{
                display: "flex",
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
              <ArrowLeft size={16} strokeWidth={1.5} />
            </Link>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {caseRecord.id}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    textTransform: "capitalize",
                  }}
                >
                  {caseRecord.domain}
                </span>

                {caseRecord.presetTag && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Preset: {caseRecord.presetTag}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>
                  Customer: <strong>{caseRecord.customerName}</strong> (
                  {caseRecord.customerTier})
                </span>
                <span>·</span>
                <span>
                  Amount:{" "}
                  <strong
                    style={{
                      color: "var(--text)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatINR(caseRecord.requestedAmount)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: status chip + elapsed timer + test ws drop */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status Chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background:
                  overallVerdict === "ALLOW"
                    ? "var(--success-soft)"
                    : overallVerdict === "DENY"
                    ? "var(--danger-soft)"
                    : isHitlPaused
                    ? "var(--warning-soft)"
                    : "var(--surface-2)",
                color:
                  overallVerdict === "ALLOW"
                    ? "var(--success)"
                    : overallVerdict === "DENY"
                    ? "var(--danger)"
                    : isHitlPaused
                    ? "var(--warning)"
                    : "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              {overallVerdict === "ALLOW" ? (
                <>
                  <CheckCircle2 size={14} strokeWidth={2} />
                  <span>RESOLVED (ALLOW)</span>
                </>
              ) : overallVerdict === "DENY" ? (
                <>
                  <ShieldAlert size={14} strokeWidth={2} />
                  <span>DENIED</span>
                </>
              ) : isHitlPaused ? (
                <>
                  <AlertTriangle size={14} strokeWidth={2} />
                  <span>WAITING FOR REVIEW</span>
                </>
              ) : (
                <>
                  <Activity
                    size={14}
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                  <span>PIPELINE RUNNING</span>
                </>
              )}
            </div>

            {/* Elapsed Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                color: isHitlPaused ? "var(--warning)" : "var(--text-muted)",
                background: "var(--surface)",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontVariantNumeric: "tabular-nums",
              }}
              title={
                isHitlPaused
                  ? "Timer frozen while waiting for reviewer"
                  : "Active pipeline processing time"
              }
            >
              <Clock size={14} strokeWidth={1.5} />
              <span>{elapsedSeconds}s</span>
              {isHitlPaused && (
                <span style={{ fontSize: 10, color: "var(--warning)" }}>
                  (paused)
                </span>
              )}
            </div>

            {/* Simulate WS Drop button for verification */}
            <button
              type="button"
              onClick={() => simulateWsDrop(caseId)}
              title="Test WebSocket drop & backoff reconnection"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                height: 28,
                padding: "0 8px",
                borderRadius: 6,
                background: "var(--surface-2)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <WifiOff size={12} />
              <span>Drop WS</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Two-Column Grid: Pipeline (40%) and Detail Tabs (60%) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (about 40%): Agent Roster, Pipeline Stepper, Agent Feed */}
        <div
          className="lg:col-span-5"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Agent Roster Strip */}
          <AgentRoster
            agents={roster}
            showHumanReview={showHumanReview}
          />

          {/* Custom CSS Vertical Pipeline Stepper */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "0.02em",
                }}
              >
                EXECUTION PIPELINE
              </span>
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                Click node to view details
              </span>
            </div>

            <PipelineStepper
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              onRetryNode={handleRetryNode}
              showHumanReview={showHumanReview}
            />
          </div>

          {/* Collapsible Agent Message Feed */}
          <AgentFeed messages={messages} />
        </div>

        {/* Right Column (about 60%): Detail Tabs */}
        <div
          className="lg:col-span-7"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Tab Navigation */}
          <div
            role="tablist"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
              overflowX: "auto",
            }}
          >
            {[
              { id: "decision", label: "Decision", icon: CheckCircle2 },
              {
                id: "citations",
                label: `Citations (${citations.length})`,
                icon: FileText,
              },
              {
                id: "enforcement",
                label: `Enforcement (${enforcementChecks.length})`,
                icon: Layers,
              },
              { id: "timeline", label: "Timeline", icon: History },
              {
                id: "audit",
                label: `Audit (${auditEvents.length})`,
                icon: Activity,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 14px",
                    borderRadius: 8,
                    background: isActive ? "var(--accent-soft)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    border: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 450,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 150ms ease-out",
                  }}
                >
                  <Icon size={14} strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div>
            {/* 1. Decision Tab */}
            {activeTab === "decision" && (
              <DecisionPanel
                verdict={overallVerdict}
                decision={decisionOutcome}
                recommendedAmount={caseRecord.requestedAmount}
                approvedAmount={approvedAmount}
                rejectionReason={rejectionReason}
                defaultModifiedAmount={caseRecord.hitlModifiedAmount}
                confidence={confidence}
                riskLevel={riskLevel}
                reasoningSummary={
                  reasoningSummary ||
                  "Awaiting AI reasoning completion from the Decision Agent."
                }
                isEscalated={isHitlPaused || overallVerdict === "ESCALATE"}
                hitlResolved={hitlResolved}
                onApproveReview={handleApproveReview}
                onRejectReview={handleRejectReview}
                isReviewing={isReviewing}
              />
            )}

            {/* 2. Policy Citations Tab */}
            {activeTab === "citations" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                      margin: 0,
                    }}
                  >
                    Retrieved policy evidence & clauses
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Dense vector similarity retrieval
                  </span>
                </div>

                {citations.length === 0 ? (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: 32,
                      background: "var(--surface)",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 14,
                    }}
                  >
                    No citations retrieved yet. The Retrieval Agent extracts
                    citations once POLICY_RETRIEVAL executes.
                  </div>
                ) : (
                  citations.map((c, idx) => (
                    <CitationCard key={c.chunkId || idx} citation={c} />
                  ))
                )}
              </div>
            )}

            {/* 3. Enforcement Checks Tab */}
            {activeTab === "enforcement" && (
              <EnforcementChecklist
                checks={enforcementChecks}
                verdict={overallVerdict}
              />
            )}

            {/* 4. Timeline Tab */}
            {activeTab === "timeline" && (
              <Timeline
                latencies={latencies}
                totalTimeMs={totalLatencyMs}
                traceId={caseRecord.traceId}
              />
            )}

            {/* 5. Audit Tab */}
            {activeTab === "audit" && <AuditList events={auditEvents} />}
          </div>
        </div>
      </div>

      {/* Screen Reader polite live region */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </div>
    </div>
  );
}
