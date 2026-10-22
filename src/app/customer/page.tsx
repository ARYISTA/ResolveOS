"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Send,
  Building2,
  Paperclip,
  ArrowRight,
  X,
  Eye,
} from "lucide-react";
import { useApp } from "@/state/AppContext";
import { getDomain } from "@/lib/domains";
import { createCase } from "@/lib/api/cases";
import { formatINR } from "@/lib/utils";
import type { ScenarioPreset, MockTransaction } from "@/lib/schemas";

// ─── Zod validation schema for customer complaint ─────────────────────────────

const complaintSchema = z.object({
  requestedAmount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Requested amount must be greater than ₹0"),
  message: z
    .string()
    .trim()
    .min(1, "Please provide dispute details or description"),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

export default function CustomerSimulatorPage() {
  const router = useRouter();
  const { state } = useApp();

  const domainConfig = state.domain ? getDomain(state.domain) : null;
  const activeCompany =
    domainConfig?.companies.find((c) => c.id === state.companyId) || null;

  // Selected preset, customer, and transaction
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  // Customer status view state (simulated status sheet preview)
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      requestedAmount: 0,
      message: "",
    },
  });

  const messageValue = watch("message") || "";

  // Set default customer and transaction when domain/company loads
  useEffect(() => {
    if (domainConfig && domainConfig.customers.length > 0 && !selectedCustomerId) {
      const firstCust = domainConfig.customers[0];
      setSelectedCustomerId(firstCust.id);

      const custTxns = domainConfig.transactions.filter(
        (t) => t.customerId === firstCust.id
      );
      if (custTxns.length > 0) {
        setSelectedTransactionId(custTxns[0].id);
        setValue("requestedAmount", custTxns[0].amount);
      }
    }
  }, [domainConfig, selectedCustomerId, setValue]);

  // When customer changes, update transactions
  const handleCustomerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    setSelectedPresetId("");

    if (domainConfig) {
      const custTxns = domainConfig.transactions.filter(
        (t) => t.customerId === custId
      );
      if (custTxns.length > 0) {
        setSelectedTransactionId(custTxns[0].id);
        setValue("requestedAmount", custTxns[0].amount);
      }
    }
  };

  // When transaction changes, update default amount
  const handleTransactionSelect = (txn: MockTransaction) => {
    setSelectedTransactionId(txn.id);
    setValue("requestedAmount", txn.amount);
  };

  // When preset is selected, fill everything
  const handlePresetSelect = (preset: ScenarioPreset) => {
    setSelectedPresetId(preset.id);
    setSelectedCustomerId(preset.customerId);
    setSelectedTransactionId(preset.transactionId);
    setValue("message", preset.message);
    setValue("requestedAmount", preset.requestedAmount);

    if (preset.tag === "Valid" || preset.tag === "Needs human") {
      setAttachmentName("transaction_receipt.pdf");
    } else if (preset.tag === "Edge case") {
      setAttachmentName("delivery_photo.png");
    } else {
      setAttachmentName(null);
    }
  };

  // Submit case
  const onSubmitComplaint = async (values: ComplaintFormValues) => {
    if (!domainConfig || !activeCompany) return;

    const currentCustomer = domainConfig.customers.find(
      (c) => c.id === selectedCustomerId
    );
    const currentTxn = domainConfig.transactions.find(
      (t) => t.id === selectedTransactionId
    );
    const currentPreset = domainConfig.presets.find(
      (p) => p.id === selectedPresetId
    );

    const triggersHitl =
      currentPreset?.triggersHitl ??
      values.requestedAmount > activeCompany.autoApproveThreshold;

    const created = await createCase({
      domain: state.domain!,
      companyId: activeCompany.id,
      customerId: selectedCustomerId,
      customerName: currentCustomer?.name || "Customer",
      customerTier: currentCustomer?.tier || "Standard",
      transactionId: selectedTransactionId,
      transactionAmount: currentTxn?.amount || values.requestedAmount,
      requestedAmount: values.requestedAmount,
      message: values.message,
      presetId: selectedPresetId || undefined,
      presetTag: currentPreset?.tag,
      triggersHitl,
      failNode: currentPreset?.failNode,
      hitlModifiedAmount: currentPreset?.hitlModifiedAmount,
      attachmentName: attachmentName || undefined,
    });

    setSubmittedCaseId(created.id);
    setSubmittedMessage(values.message);

    // If role is customer, we show the customer status panel; otherwise navigate to /cases/[id]
    if (state.role === "admin" || state.role === "reviewer" || state.role === "auditor") {
      router.push(`/cases/${created.id}`);
    }
  };

  // ─── Empty state: No active company ─────────────────────────────────────────

  if (!domainConfig || !activeCompany) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 32,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--surface-2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <Building2 size={24} strokeWidth={1.5} />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          No active company configured
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 24,
            lineHeight: "22px",
          }}
        >
          Please complete company selection and policy setup in the wizard first
          to activate an operational company context.
        </p>
        <Link
          href="/setup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 16px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--on-accent)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <span>Go to company setup</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Filter transactions for selected customer
  const customerTransactions = domainConfig.transactions.filter(
    (t) => t.customerId === selectedCustomerId
  );

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingBottom: 48,
      }}
    >
      {/* Portal Header */}
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
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "3px 10px",
              borderRadius: 999,
              marginBottom: 8,
            }}
          >
            <span>{activeCompany.name}</span>
            <span>·</span>
            <span>Dispute & Resolution Center</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              lineHeight: "34px",
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            Customer dispute simulator
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Raise a refund query as a consumer, test boundary conditions, or
            simulate security injection scenarios.
          </p>
        </div>

        {/* Preset scenario dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="preset-select"
            style={{ fontSize: 11, fontWeight: 500, color: "var(--text-faint)" }}
          >
            SCENARIO PRESETS
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => {
              const preset = domainConfig.presets.find(
                (p) => p.id === e.target.value
              );
              if (preset) handlePresetSelect(preset);
            }}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <option value="">Choose preset scenario...</option>
            {domainConfig.presets.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.tag}] {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Customer-Side Status Panel (Shown after submit in customer role) ──── */}
      {submittedCaseId && (
        <div
          style={{
            border: "1px solid var(--accent)",
            borderRadius: 12,
            background: "var(--surface)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                }}
              >
                STATUS: UNDER REVIEW
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                }}
              >
                Case ID: {submittedCaseId}
              </span>
            </div>

            {(state.role === "admin" || state.role === "reviewer") && (
              <Link
                href={`/cases/${submittedCaseId}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                <Eye size={14} />
                <span>Switch to internal operations view</span>
              </Link>
            )}
          </div>

          <div
            style={{
              background: "var(--surface-2)",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            <strong>Your submitted query:</strong> &ldquo;{submittedMessage}&rdquo;
          </div>

          <p
            style={{
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Expected next step: Our automated verification system is evaluating
            your dispute against {activeCompany.name} resolution rules. If manual
            confirmation is required, our team will review the claim within 24
            hours.
          </p>
        </div>
      )}

      {/* ─── Complaint Submission Form ─────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmitComplaint)}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Customer and Account Selection */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              1. Customer profile
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label
                htmlFor="customer-select"
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                Active customer:
              </label>
              <select
                id="customer-select"
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                style={{
                  height: 32,
                  padding: "0 8px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {domainConfig.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier} Tier · {c.historyCount} txns)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Picker Table */}
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-faint)",
                letterSpacing: "0.02em",
                display: "block",
                marginBottom: 8,
              }}
            >
              SELECT DISPUTED TRANSACTION
            </span>

            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--surface)",
              }}
            >
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
                      height: 36,
                    }}
                  >
                    <th style={{ padding: "0 12px", width: 40 }}></th>
                    <th style={{ padding: "0 12px", fontWeight: 500, fontSize: 12, color: "var(--text-muted)" }}>
                      Txn ID
                    </th>
                    <th style={{ padding: "0 12px", fontWeight: 500, fontSize: 12, color: "var(--text-muted)" }}>
                      Date
                    </th>
                    <th style={{ padding: "0 12px", fontWeight: 500, fontSize: 12, color: "var(--text-muted)" }}>
                      Merchant / Description
                    </th>
                    <th style={{ padding: "0 12px", fontWeight: 500, fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
                      Amount
                    </th>
                    <th style={{ padding: "0 12px", fontWeight: 500, fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customerTransactions.map((t) => {
                    const isSelected = selectedTransactionId === t.id;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleTransactionSelect(t)}
                        style={{
                          height: 40,
                          borderBottom: "1px solid var(--border)",
                          background: isSelected ? "var(--accent-soft)" : "transparent",
                          cursor: "pointer",
                          transition: "background 150ms ease-out",
                        }}
                      >
                        <td style={{ padding: "0 12px", textAlign: "center" }}>
                          <input
                            type="radio"
                            name="transaction"
                            checked={isSelected}
                            onChange={() => handleTransactionSelect(t)}
                            aria-label={`Select transaction ${t.id}`}
                          />
                        </td>
                        <td
                          style={{
                            padding: "0 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--accent)",
                          }}
                        >
                          {t.id}
                        </td>
                        <td style={{ padding: "0 12px", color: "var(--text-muted)" }}>
                          {t.date}
                        </td>
                        <td style={{ padding: "0 12px", color: "var(--text)", fontWeight: 450 }}>
                          {t.merchant}
                        </td>
                        <td
                          style={{
                            padding: "0 12px",
                            textAlign: "right",
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 500,
                          }}
                        >
                          {formatINR(t.amount)}
                        </td>
                        <td style={{ padding: "0 12px", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                t.status === "Completed"
                                  ? "var(--surface-2)"
                                  : t.status === "Refunded"
                                  ? "var(--success-soft)"
                                  : "var(--warning-soft)",
                              color:
                                t.status === "Refunded"
                                  ? "var(--success)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dispute Details & Composer */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              2. Dispute message & amount
            </h3>

            {/* Requested amount field */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label
                htmlFor="requestedAmount"
                style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}
              >
                Requested refund (INR):
              </label>
              <div style={{ position: "relative", width: 140 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "var(--text-faint)",
                  }}
                >
                  ₹
                </span>
                <input
                  id="requestedAmount"
                  type="number"
                  step="100"
                  {...register("requestedAmount")}
                  style={{
                    width: "100%",
                    height: 36,
                    paddingLeft: 24,
                    paddingRight: 8,
                    borderRadius: 8,
                    border: errors.requestedAmount
                      ? "1px solid var(--danger)"
                      : "1px solid var(--border-strong)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: 14,
                    fontVariantNumeric: "tabular-nums",
                    outline: "none",
                  }}
                  className="focus:ring-2 focus:ring-[var(--focus-ring)]"
                />
              </div>
            </div>
          </div>

          {errors.requestedAmount && (
            <p
              role="alert"
              style={{
                fontSize: 12,
                color: "var(--danger)",
                margin: 0,
              }}
            >
              {errors.requestedAmount.message}
            </p>
          )}

          {/* Claude.ai-like Composer */}
          <div
            style={{
              border: errors.message
                ? "1px solid var(--danger)"
                : "1px solid var(--border-strong)",
              borderRadius: 16,
              background: "var(--surface)",
              padding: 16,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <textarea
              id="dispute-message"
              rows={4}
              placeholder="Describe what occurred, transaction details, and why a refund is required..."
              {...register("message")}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                lineHeight: "22px",
                color: "var(--text)",
                resize: "vertical",
              }}
            />

            {/* Attachment chip (display-only) */}
            {attachmentName && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "var(--surface-2)",
                  fontSize: 12,
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              >
                <Paperclip size={12} color="var(--accent)" />
                <span>{attachmentName}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentName(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Composer Footer: attachment toggle, counter, and submit button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {!attachmentName && (
                  <button
                    type="button"
                    onClick={() => setAttachmentName("evidence_receipt.pdf")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Paperclip size={14} />
                    <span>Attach document</span>
                  </button>
                )}

                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {messageValue.length} characters
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 36,
                  padding: "0 18px",
                  borderRadius: 8,
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Submit dispute</span>
                <Send size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {errors.message && (
            <p
              role="alert"
              style={{
                fontSize: 12,
                color: "var(--danger)",
                margin: 0,
              }}
            >
              {errors.message.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
