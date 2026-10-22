"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Paperclip,
  Lock,
} from "lucide-react";
import { getCase, resolveHumanReview } from "@/lib/api/cases";
import { formatINR } from "@/lib/utils";
import { useApp } from "@/state/AppContext";
import { getAllDomains } from "@/lib/domains";
import {
  CaseRecord,
  PolicyReference,
  EnforcementRule,
  ReviewApproveModifiedSchema,
  ReviewApproveModifiedInput,
  ReviewRejectSchema,
  ReviewRejectInput,
} from "@/lib/schemas";
import { CitationCard } from "@/components/case/CitationCard";
import { EnforcementChecklist } from "@/components/case/EnforcementChecklist";
import { ConfirmationDialog } from "@/components/review/ConfirmationDialog";

const DEFAULT_CITATIONS: PolicyReference[] = [
  {
    policyId: "pol-banking-v1",
    version: 1,
    documentName: "High-Value Transaction Safeguards v1.2",
    page: 12,
    section: "Section 4.1 Tier-2 Discretionary Thresholds",
    chunkId: "chk-08",
    excerpt:
      "Disputed transactions exceeding ₹20,000 shall be subject to mandatory dual-officer compliance verification before any debit reversal or ledger write-back.",
    score: 0.95,
  },
  {
    policyId: "pol-banking-v1",
    version: 1,
    documentName: "Refund & Dispute Policy v1.4",
    page: 7,
    section: "Section 3.4 Disputed Liability Apportionment",
    chunkId: "chk-05",
    excerpt:
      "Where partial liability or suspicious telemetry is indicated, the compliance reviewer holds discretion to adjust approved reimbursement down to verified merchant loss amount.",
    score: 0.91,
  },
];

const DEFAULT_ENFORCEMENT_CHECKS: EnforcementRule[] = [
  {
    rule: "Schema valid",
    passed: true,
    reason: "Dispute payload conforms to standard specification",
  },
  {
    rule: "Tenant valid",
    passed: true,
    reason: "Dispute belongs to authenticated tenant context",
  },
  {
    rule: "Policy conditions met",
    passed: true,
    reason: "Customer dispute notification within valid reporting window",
  },
  {
    rule: "Amount within limit",
    passed: false,
    reason: "Requested amount exceeds maximum autonomous approval threshold",
  },
  {
    rule: "Transaction valid",
    passed: true,
    reason: "Transaction settlement record verified on core ledger",
  },
  {
    rule: "Risk acceptable",
    passed: false,
    reason: "Anomaly detection engine flagged elevated dispute risk",
  },
  {
    rule: "HITL required",
    passed: false,
    reason: "Mandatory human compliance escalation triggered",
  },
];

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params?.id as string) || "";
  const { showToast } = useApp();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active action mode
  const [actionMode, setActionMode] = useState<"none" | "modify" | "reject">("none");

  // Confirmation dialog state
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: "primary" | "danger";
    actionType: "approve" | "modify" | "reject";
    payload?: { modifiedAmount?: number; reason?: string };
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "",
    confirmVariant: "primary",
    actionType: "approve",
  });

  // Action button trigger refs for focus restoration
  const approveBtnRef = useRef<HTMLButtonElement>(null);
  const modifyBtnRef = useRef<HTMLButtonElement>(null);
  const rejectBtnRef = useRef<HTMLButtonElement>(null);

  // Load case details
  useEffect(() => {
    let mounted = true;
    async function fetchCase() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCase(caseId);
        if (mounted) {
          if (!data) {
            setError("Escalated case not found.");
          } else {
            setCaseRecord(data);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load escalation"
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchCase();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  // Domain & policy limits
  const allDomains = getAllDomains();
  const domainConfig = allDomains.find((d) => d.id === caseRecord?.domain);
  const activeCompany =
    domainConfig?.companies.find((c) => c.id === caseRecord?.companyId) ||
    domainConfig?.companies[0];

  const transactionAmount = caseRecord?.transactionAmount ?? 0;
  const policyMax = activeCompany?.hitlThreshold ?? transactionAmount;

  // React Hook Form for Modified Amount
  const {
    register: registerModify,
    handleSubmit: handleSubmitModify,
    formState: { errors: errorsModify },
    setError: setErrorModify,
  } = useForm<ReviewApproveModifiedInput>({
    resolver: zodResolver(ReviewApproveModifiedSchema),
    defaultValues: {
      modifiedAmount: caseRecord?.hitlModifiedAmount ?? caseRecord?.requestedAmount,
    },
  });

  // React Hook Form for Reject
  const {
    register: registerReject,
    handleSubmit: handleSubmitReject,
    formState: { errors: errorsReject },
  } = useForm<ReviewRejectInput>({
    resolver: zodResolver(ReviewRejectSchema),
    defaultValues: {
      comment: "",
    },
  });

  // Check if case is already resolved
  const isAlreadyResolved =
    caseRecord?.status === "RESOLVED" || caseRecord?.status === "REJECTED";

  // 1. Trigger Full Approval Confirmation
  const handleOpenApproveDialog = () => {
    if (!caseRecord) return;
    setDialogConfig({
      isOpen: true,
      title: "Confirm dispute approval",
      description: `Confirm full refund approval of ${formatINR(
        caseRecord.requestedAmount
      )} for case ${caseRecord.id}? This will immediately disburse the funds and mark the dispute resolved.`,
      confirmLabel: "Confirm full approval",
      confirmVariant: "primary",
      actionType: "approve",
    });
  };

  // 2. Trigger Modified Amount Approval Confirmation
  const onValidModify = (data: ReviewApproveModifiedInput) => {
    if (!caseRecord) return;

    // Additional policy & transaction limit checks
    if (data.modifiedAmount > transactionAmount) {
      setErrorModify("modifiedAmount", {
        message: `Amount cannot exceed transaction value of ${formatINR(
          transactionAmount
        )}`,
      });
      return;
    }

    if (data.modifiedAmount > policyMax) {
      setErrorModify("modifiedAmount", {
        message: `Amount cannot exceed policy limit of ${formatINR(policyMax)}`,
      });
      return;
    }

    setDialogConfig({
      isOpen: true,
      title: "Confirm adjusted approval",
      description: `Confirm adjusted refund approval of ${formatINR(
        data.modifiedAmount
      )} for case ${caseRecord.id}? This will disburse the adjusted refund and mark the dispute resolved.`,
      confirmLabel: "Confirm adjusted approval",
      confirmVariant: "primary",
      actionType: "modify",
      payload: { modifiedAmount: data.modifiedAmount },
    });
  };

  // 3. Trigger Rejection Confirmation
  const onValidReject = (data: ReviewRejectInput) => {
    if (!caseRecord) return;

    setDialogConfig({
      isOpen: true,
      title: "Confirm dispute rejection",
      description: `Confirm dispute rejection for case ${caseRecord.id}? This will permanently deny the refund claim with reason: "${data.comment}".`,
      confirmLabel: "Confirm rejection",
      confirmVariant: "danger",
      actionType: "reject",
      payload: { reason: data.comment },
    });
  };

  // Execute confirmed decision
  const handleConfirmDecision = async () => {
    if (!caseRecord) return;

    setIsSubmitting(true);
    try {
      if (dialogConfig.actionType === "approve") {
        await resolveHumanReview(caseRecord.id, "APPROVED");
        showToast({
          title: "Case approved",
          message: `Dispute ${caseRecord.id} has been fully approved for disbursement.`,
          type: "success",
        });
      } else if (dialogConfig.actionType === "modify") {
        await resolveHumanReview(caseRecord.id, "APPROVED", {
          modifiedAmount: dialogConfig.payload?.modifiedAmount,
        });
        showToast({
          title: "Adjusted refund approved",
          message: `Dispute ${caseRecord.id} approved for ${formatINR(
            dialogConfig.payload?.modifiedAmount || 0
          )}.`,
          type: "success",
        });
      } else if (dialogConfig.actionType === "reject") {
        await resolveHumanReview(caseRecord.id, "REJECTED", {
          reason: dialogConfig.payload?.reason,
        });
        showToast({
          title: "Case rejected",
          message: `Dispute ${caseRecord.id} has been rejected by compliance review.`,
          type: "warning",
        });
      }

      setDialogConfig((prev) => ({ ...prev, isOpen: false }));
      // Return to review queue
      router.push("/reviews");
    } catch (err: unknown) {
      showToast({
        title: "Action failed",
        message: err instanceof Error ? err.message : "Failed to submit decision",
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            height: 48,
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  background: "var(--surface)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
          <div className="lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                height: 240,
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
        <h2 style={{ fontSize: 20, margin: "0 0 8px 0" }}>Escalation not found</h2>
        <p style={{ fontSize: 14, margin: "0 0 20px 0" }}>
          {error || "Unable to locate escalated case."}
        </p>
        <Link
          href="/reviews"
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
          <span>Back to review queue</span>
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
      {/* ─── Breadcrumb & Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/reviews"
            aria-label="Back to review queue"
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
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                }}
              >
                COMPLIANCE REVIEW
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Customer: <strong>{caseRecord.customerName}</strong> ({caseRecord.customerTier}) ·{" "}
              Domain: <span style={{ textTransform: "capitalize" }}>{caseRecord.domain}</span>
            </div>
          </div>
        </div>

        {/* View in Pipeline Link */}
        <Link
          href={`/cases/${caseRecord.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          <span>View live pipeline execution</span>
          <ArrowLeft size={13} style={{ transform: "rotate(180deg)" }} />
        </Link>
      </div>

      {/* ─── Already Resolved Alert Notice ────────────────────────────────────── */}
      {isAlreadyResolved && (
        <div
          role="alert"
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: 16,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Lock size={18} color="var(--text-muted)" />
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "var(--text)" }}>
              Case already adjudicated
            </h4>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              This case has already been resolved with status:{" "}
              <strong>{caseRecord.status}</strong>. Review actions are disabled.
            </p>
          </div>
        </div>
      )}

      {/* ─── Two-Column Layout: Left (Case & Txn) | Right (AI & Evidence) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Customer Message, Transaction Details, Requested Amount */}
        <div className="lg:col-span-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Dispute Message Card */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>
                CUSTOMER COMPLAINT (PLAIN TEXT)
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Requested: <strong style={{ color: "var(--text)" }}>{formatINR(caseRecord.requestedAmount)}</strong>
              </span>
            </div>

            <div
              style={{
                background: "var(--surface-2)",
                padding: "14px 16px",
                borderRadius: 8,
                fontSize: 14,
                lineHeight: "22px",
                color: "var(--text)",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
              }}
            >
              {caseRecord.message}
            </div>

            {/* Attachment Chip if present */}
            {caseRecord.attachmentName && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  fontSize: 12,
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >
                <Paperclip size={12} color="var(--accent)" />
                <span>{caseRecord.attachmentName}</span>
              </div>
            )}
          </div>

          {/* Disputed Transaction Card */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>
              ORIGINAL TRANSACTION RECORD
            </span>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 13,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", display: "block" }}>
                  TRANSACTION ID
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 500 }}>
                  {caseRecord.transactionId}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", display: "block" }}>
                  SETTLED AMOUNT
                </span>
                <span style={{ fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {formatINR(caseRecord.transactionAmount)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", display: "block" }}>
                  CUSTOMER
                </span>
                <span style={{ color: "var(--text)" }}>
                  {caseRecord.customerName}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", display: "block" }}>
                  CUSTOMER TIER
                </span>
                <span style={{ color: "var(--text)" }}>
                  {caseRecord.customerTier}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Review Adjudication Actions ─────────────────────────────────── */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Reviewer Adjudication
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                Select an approval or rejection outcome to submit human determination.
              </p>
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {/* 1. Full Approve Button */}
                <button
                  ref={approveBtnRef}
                  type="button"
                  disabled={isAlreadyResolved || isSubmitting}
                  onClick={handleOpenApproveDialog}
                  style={{
                    flex: 1,
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    cursor: isAlreadyResolved || isSubmitting ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Approve full {formatINR(caseRecord.requestedAmount)}</span>
                </button>

                {/* 2. Toggle Modified Amount */}
                <button
                  ref={modifyBtnRef}
                  type="button"
                  disabled={isAlreadyResolved || isSubmitting}
                  onClick={() => setActionMode(actionMode === "modify" ? "none" : "modify")}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 8,
                    background: actionMode === "modify" ? "var(--accent-soft)" : "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "1px solid var(--border)",
                    cursor: isAlreadyResolved || isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {actionMode === "modify" ? "Cancel" : "Approve modified..."}
                </button>

                {/* 3. Toggle Reject */}
                <button
                  ref={rejectBtnRef}
                  type="button"
                  disabled={isAlreadyResolved || isSubmitting}
                  onClick={() => setActionMode(actionMode === "reject" ? "none" : "reject")}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 8,
                    background: actionMode === "reject" ? "var(--danger-soft)" : "var(--surface-2)",
                    color: "var(--danger)",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "1px solid var(--border)",
                    cursor: isAlreadyResolved || isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {actionMode === "reject" ? "Cancel" : "Reject..."}
                </button>
              </div>

              {/* Form: Approve with modified amount */}
              {actionMode === "modify" && !isAlreadyResolved && (
                <form
                  onSubmit={handleSubmitModify(onValidModify)}
                  style={{
                    marginTop: 8,
                    padding: 16,
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <label
                      htmlFor="modifiedAmount"
                      style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}
                    >
                      Approved modified amount (INR):
                    </label>
                    <div style={{ marginTop: 4 }}>
                      <input
                        id="modifiedAmount"
                        type="number"
                        step="100"
                        {...registerModify("modifiedAmount", { valueAsNumber: true })}
                        style={{
                          width: "100%",
                          height: 36,
                          padding: "0 10px",
                          borderRadius: 6,
                          border: errorsModify.modifiedAmount
                            ? "1px solid var(--danger)"
                            : "1px solid var(--border-strong)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          fontSize: 14,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                      Limit constraints: Max transaction {formatINR(transactionAmount)} · Policy max {formatINR(policyMax)}
                    </div>

                    {errorsModify.modifiedAmount && (
                      <p role="alert" style={{ fontSize: 12, color: "var(--danger)", margin: "4px 0 0 0" }}>
                        {errorsModify.modifiedAmount.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    style={{
                      height: 34,
                      padding: "0 16px",
                      borderRadius: 6,
                      background: "var(--accent)",
                      color: "var(--on-accent)",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      alignSelf: "flex-end",
                    }}
                  >
                    Confirm modified approval
                  </button>
                </form>
              )}

              {/* Form: Reject with required comment */}
              {actionMode === "reject" && !isAlreadyResolved && (
                <form
                  onSubmit={handleSubmitReject(onValidReject)}
                  style={{
                    marginTop: 8,
                    padding: 16,
                    borderRadius: 8,
                    background: "var(--danger-soft)",
                    border: "1px solid var(--danger)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <label
                      htmlFor="reject-comment"
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)" }}
                    >
                      Mandatory rejection comment (min 10 characters):
                    </label>
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        id="reject-comment"
                        rows={3}
                        placeholder="Detail the policy clause violation or evidence causing rejection..."
                        {...registerReject("comment")}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: errorsReject.comment
                            ? "1px solid var(--danger)"
                            : "1px solid var(--border-strong)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          fontSize: 13,
                          lineHeight: "20px",
                        }}
                      />
                    </div>

                    {errorsReject.comment && (
                      <p role="alert" style={{ fontSize: 12, color: "var(--danger)", margin: "4px 0 0 0" }}>
                        {errorsReject.comment.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    style={{
                      height: 34,
                      padding: "0 16px",
                      borderRadius: 6,
                      background: "var(--danger)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      alignSelf: "flex-end",
                    }}
                  >
                    Confirm dispute rejection
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): AI Recommendation, Policy Citations, Enforcement, Risk Factors */}
        <div className="lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Recommendation Card */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color="var(--accent)" />
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  AI Recommendation & Confidence
                </h4>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                }}
              >
                VERDICT: ESCALATE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4" style={{ paddingTop: 4 }}>
              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
                  PROPOSED ACTION
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 4 }}>
                  APPROVE REFUND
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
                  RECOMMENDED AMOUNT
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  {formatINR(caseRecord.requestedAmount)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>
                  AI CONFIDENCE
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  89%
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", display: "block", marginBottom: 4 }}>
                REASONING SUMMARY (PLAIN TEXT)
              </span>
              <p style={{ fontSize: 13, lineHeight: "22px", color: "var(--text)", margin: 0 }}>
                Transaction dispute satisfies clause criteria for failed merchant settlement. However, the requested dispute value exceeds autonomous threshold authorization rules, triggering mandatory human compliance verification.
              </p>
            </div>
          </div>

          {/* Risk Factors Card */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 18,
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                Anomaly Risk Assessment
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                }}
              >
                RISK LEVEL: HIGH
              </span>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: "20px" }}>
              <li>Dispute amount exceeds high-value threshold ({formatINR(activeCompany?.autoApproveThreshold || 5000)})</li>
              <li>First dispute on this merchant category</li>
              <li>Dual-control compliance verification mandated by policy</li>
            </ul>
          </div>

          {/* Policy Enforcement Results (reusing EnforcementChecklist) */}
          <EnforcementChecklist checks={DEFAULT_ENFORCEMENT_CHECKS} verdict="ESCALATE" />

          {/* Policy Citations (reusing CitationCard) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Policy Evidence & Regulatory Citations
            </h4>
            {DEFAULT_CITATIONS.map((cit, idx) => (
              <CitationCard key={cit.chunkId || idx} citation={cit} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Confirmation Dialog ──────────────────────────────────────────────── */}
      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        confirmVariant={dialogConfig.confirmVariant}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDecision}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        triggerRef={
          dialogConfig.actionType === "approve"
            ? approveBtnRef
            : dialogConfig.actionType === "modify"
            ? modifyBtnRef
            : rejectBtnRef
        }
      />
    </div>
  );
}
