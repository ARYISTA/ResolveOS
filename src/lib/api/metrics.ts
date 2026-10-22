import { getMode, apiFetch } from "./client";
import { getAllMockCases } from "./cases";
import type { DashboardMetrics, NodeName } from "@/lib/schemas";

export async function getDashboardMetrics(
  companyId?: string
): Promise<DashboardMetrics> {
  const mode = getMode();

  if (mode === "mock") {
    let cases = getAllMockCases();

    if (companyId) {
      cases = cases.filter((c) => c.companyId === companyId);
    }

    if (cases.length === 0) {
      return {
        totalCases: 0,
        autoResolved: 0,
        escalated: 0,
        rejected: 0,
        totalRefunded: 0,
        avgResolutionTimeMs: 0,
        casesByOutcome: [],
        casesOverTime: [],
        stageLatencies: [],
      };
    }

    const totalCases = cases.length;
    const autoResolved = cases.filter((c) => c.status === "RESOLVED").length;
    const escalated = cases.filter((c) => c.status === "ESCALATED").length;
    const rejected = cases.filter((c) => c.status === "REJECTED").length;

    const totalRefunded = cases.reduce((acc, c) => {
      if (c.approvedAmount !== undefined) return acc + c.approvedAmount;
      if (c.status === "RESOLVED") return acc + c.requestedAmount;
      return acc;
    }, 0);

    // Outcome breakdown
    const casesByOutcome = [
      {
        outcome: "ALLOW",
        label: "Resolved (allow)",
        count: autoResolved,
        percentage: Math.round((autoResolved / totalCases) * 100),
        color: "var(--success)",
      },
      {
        outcome: "DENY",
        label: "Rejected (deny)",
        count: rejected,
        percentage: Math.round((rejected / totalCases) * 100),
        color: "var(--danger)",
      },
      {
        outcome: "ESCALATE",
        label: "Escalated (review)",
        count: escalated,
        percentage: Math.round((escalated / totalCases) * 100),
        color: "var(--warning)",
      },
    ];

    // 7-day timeline aggregation (16 Oct to 22 Oct 2026)
    const dates = [
      "16 Oct",
      "17 Oct",
      "18 Oct",
      "19 Oct",
      "20 Oct",
      "21 Oct",
      "22 Oct",
    ];

    const dayCounts = new Map<string, number>();
    for (const d of dates) {
      dayCounts.set(d, 0);
    }

    for (const c of cases) {
      const d = new Date(c.createdAt);
      // Format to "16 Oct" in IST
      const istLabel = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      }).format(d);

      if (dayCounts.has(istLabel)) {
        dayCounts.set(istLabel, (dayCounts.get(istLabel) || 0) + 1);
      } else {
        dayCounts.set(istLabel, 1);
      }
    }

    const casesOverTime = Array.from(dayCounts.entries()).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    // Standard autonomous multi-agent pipeline stage latencies
    const stageLatencies: {
      stage: NodeName;
      label: string;
      latencyMs: number;
    }[] = [
      { stage: "INTAKE", label: "Intake", latencyMs: 420 },
      { stage: "VALIDATION", label: "Validation", latencyMs: 180 },
      { stage: "POLICY_RETRIEVAL", label: "Policy retrieval", latencyMs: 1250 },
      { stage: "DECISION", label: "Decision (LLM)", latencyMs: 1680 },
      { stage: "RISK", label: "Risk classification", latencyMs: 340 },
      { stage: "ENFORCEMENT", label: "Policy enforcement", latencyMs: 210 },
      { stage: "EXECUTION", label: "Execution", latencyMs: 450 },
    ];

    const avgResolutionTimeMs = 4530; // 4.5s average automated resolution

    return {
      totalCases,
      autoResolved,
      escalated,
      rejected,
      totalRefunded,
      avgResolutionTimeMs,
      casesByOutcome,
      casesOverTime,
      stageLatencies,
    };
  }

  const endpoint = companyId
    ? `/api/metrics?companyId=${encodeURIComponent(companyId)}`
    : "/api/metrics";
  return apiFetch<DashboardMetrics>(endpoint);
}
