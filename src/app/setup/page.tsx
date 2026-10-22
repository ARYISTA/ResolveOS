"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Building2,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/state/AppContext";
import { getDomain } from "@/lib/domains";
import { subscribeToIngestion } from "@/lib/api/ws";
import { getMockSections, getMockChunks } from "@/lib/mock/fixtures";
import { formatINR } from "@/lib/utils";
import {
  UploadDropzone,
  PolicyFileInfo,
} from "@/components/policy/UploadDropzone";
import { IngestionStepper } from "@/components/policy/IngestionStepper";
import { ChunkTable } from "@/components/policy/ChunkTable";

// ─── Zod validation schema for Step 3 thresholds ─────────────────────────────

const thresholdsSchema = z
  .object({
    autoApproveLimit: z.coerce
      .number({ invalid_type_error: "Enter a valid amount" })
      .min(1, "Auto-approve limit must be at least ₹1"),
    hitlLimit: z.coerce
      .number({ invalid_type_error: "Enter a valid amount" })
      .min(1, "HITL trigger limit must be at least ₹1"),
  })
  .refine((data) => data.autoApproveLimit <= data.hitlLimit, {
    message: "Auto-approve limit cannot exceed HITL trigger limit",
    path: ["autoApproveLimit"],
  });

type ThresholdsFormValues = z.infer<typeof thresholdsSchema>;

export default function SetupWizardPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();

  // Step state (1: Company, 2: Policy upload, 3: Review and confirm)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Active domain config
  const domainConfig = state.domain ? getDomain(state.domain) : null;

  // Selected company (defaults to first company in the domain)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    domainConfig?.companies[0]?.id || ""
  );

  const activeCompany =
    domainConfig?.companies.find((c) => c.id === selectedCompanyId) ||
    domainConfig?.companies[0] ||
    null;

  // Step 2: Policy upload and ingestion state
  const [selectedFile, setSelectedFile] = useState<PolicyFileInfo | null>(null);
  const [ingestionStage, setIngestionStage] = useState<string>("Uploaded");
  const [ingestionPercent, setIngestionPercent] = useState<number>(0);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Step 3: Thresholds form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ThresholdsFormValues>({
    resolver: zodResolver(thresholdsSchema),
    defaultValues: {
      autoApproveLimit: activeCompany?.autoApproveThreshold ?? 5000,
      hitlLimit: activeCompany?.hitlThreshold ?? 25000,
    },
  });

  // Keep form values in sync when selected company changes
  useEffect(() => {
    if (activeCompany) {
      setValue("autoApproveLimit", activeCompany.autoApproveThreshold);
      setValue("hitlLimit", activeCompany.hitlThreshold);
    }
  }, [activeCompany, setValue]);

  // If user changed domain in topbar, reset company to match
  useEffect(() => {
    if (domainConfig && (!selectedCompanyId || !domainConfig.companies.some(c => c.id === selectedCompanyId))) {
      setSelectedCompanyId(domainConfig.companies[0]?.id || "");
    }
  }, [domainConfig, selectedCompanyId]);

  // Handle starting ingestion when a file is selected in Step 2
  const handleSelectFile = (file: PolicyFileInfo) => {
    setSelectedFile(file);
    setIngestionPercent(20);
    setIngestionStage("Uploaded");
    setIsIngesting(true);

    const policyId = `pol-${state.domain}-${Date.now().toString(36)}`;
    const unsubscribe = subscribeToIngestion(policyId, (event) => {
      if (event.type === "INGESTION_PROGRESS") {
        setIngestionStage(event.stage);
        setIngestionPercent(event.percent);
        if (event.percent === 100) {
          setIsIngesting(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setIngestionPercent(0);
    setIngestionStage("Uploaded");
    setIsIngesting(false);
  };

  // Submit Step 3 and activate policy
  const onActivatePolicy = () => {
    if (!activeCompany) return;
    // Set company in AppContext
    dispatch({ type: "SET_COMPANY", companyId: activeCompany.id });
    // Navigate to dashboard
    router.push("/dashboard");
  };

  // ─── Empty state: No domain selected ─────────────────────────────────────────

  if (!domainConfig) {
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
          <HelpCircle size={24} strokeWidth={1.5} />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          No domain selected
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 24,
            lineHeight: "22px",
          }}
        >
          Please select an industry domain first. Each domain loads specialized
          policy templates and scenario libraries.
        </p>
        <Link
          href="/"
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
          <span>Choose a domain</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Fixtures for Step 3
  const sections = getMockSections(state.domain);
  const chunks = getMockChunks(state.domain);

  // ─── Render Setup Wizard ───────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        paddingBottom: 48,
      }}
    >
      {/* Wizard Header */}
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
            marginBottom: 10,
          }}
        >
          <span>{domainConfig.name}</span>
          <span>·</span>
          <span>Setup wizard</span>
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
          Company and policy setup
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          Configure company parameters, ingest refund policy guidelines, and
          calibrate AI enforcement thresholds.
        </p>
      </div>

      {/* Progress Stepper Indicator */}
      <nav aria-label="Setup progress" style={{ width: "100%" }}>
        <ol
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            listStyle: "none",
            margin: 0,
            position: "relative",
          }}
        >
          {[
            { step: 1, label: "Company", available: true },
            {
              step: 2,
              label: "Policy upload",
              available: Boolean(activeCompany),
            },
            {
              step: 3,
              label: "Review and confirm",
              available: ingestionPercent === 100,
            },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isActive = currentStep === item.step;

            return (
              <li
                key={item.step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: item.available ? "pointer" : "not-allowed",
                  opacity: item.available ? 1 : 0.45,
                }}
                onClick={() => {
                  if (item.available) {
                    setCurrentStep(item.step as 1 | 2 | 3);
                  }
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    background: isCompleted
                      ? "var(--success-soft)"
                      : isActive
                      ? "var(--accent)"
                      : "var(--surface-2)",
                    color: isCompleted
                      ? "var(--success)"
                      : isActive
                      ? "var(--on-accent)"
                      : "var(--text-muted)",
                    border: isActive
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    transition: "all 150ms ease-out",
                  }}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : item.step}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-faint)",
                      lineHeight: 1,
                    }}
                  >
                    STEP {item.step}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive || isCompleted ? 600 : 400,
                      color: isActive ? "var(--accent)" : "var(--text)",
                      lineHeight: "18px",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ─── STEP 1: Company Selection ──────────────────────────────────────── */}
      {currentStep === 1 && (
        <section
          aria-labelledby="step1-heading"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <h2
              id="step1-heading"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Select company
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Choose a sample operating company for the {domainConfig.name} domain.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {domainConfig.companies.map((company) => {
              const isSelected = selectedCompanyId === company.id;

              return (
                <div
                  key={company.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelectedCompanyId(company.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCompanyId(company.id);
                    }
                  }}
                  style={{
                    background: "var(--surface)",
                    border: isSelected
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 18,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    transition: "border-color 150ms ease-out, background 150ms ease-out",
                    outline: "none",
                  }}
                  className="hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: isSelected
                          ? "var(--accent-soft)"
                          : "var(--surface-2)",
                        color: isSelected ? "var(--accent)" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={18} strokeWidth={1.5} />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {company.name}
                        </h3>
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
                          {company.currency}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 16,
                          marginTop: 10,
                          fontSize: 13,
                          color: "var(--text-muted)",
                        }}
                      >
                        <div>
                          <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                            Auto-approve limit:{" "}
                          </span>
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatINR(company.autoApproveThreshold)}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                            HITL trigger limit:{" "}
                          </span>
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatINR(company.hitlThreshold)}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                            Max refund/period:{" "}
                          </span>
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatINR(company.maxRefundPerPeriod)}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-faint)",
                          marginTop: 8,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        Sample policy: {company.samplePolicyPath}
                      </div>
                    </div>
                  </div>

                  {/* Radio selection circle */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: isSelected
                        ? "6px solid var(--accent)"
                        : "1px solid var(--border-strong)",
                      background: "var(--surface)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to domain selection</span>
            </Link>

            <button
              type="button"
              disabled={!activeCompany}
              onClick={() => setCurrentStep(2)}
              style={{
                height: 36,
                padding: "0 18px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: activeCompany ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: activeCompany ? 1 : 0.5,
              }}
            >
              <span>Continue to policy upload</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ─── STEP 2: Policy Upload ──────────────────────────────────────────── */}
      {currentStep === 2 && activeCompany && (
        <section
          aria-labelledby="step2-heading"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <h2
              id="step2-heading"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Upload policy document
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Provide the refund and dispute guidelines for {activeCompany.name}.
              The ingestion engine parses sections, generates chunks, and builds
              retrieval embeddings.
            </p>
          </div>

          {/* Upload Dropzone */}
          <UploadDropzone
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
            onClearFile={handleClearFile}
            samplePolicyPath={activeCompany.samplePolicyPath}
            isIngesting={isIngesting}
          />

          {/* Ingestion Stepper — visible once file is chosen */}
          {selectedFile && (
            <IngestionStepper
              currentStage={ingestionStage}
              percent={ingestionPercent}
            />
          )}

          {/* Action Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 8,
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to company</span>
            </button>

            <button
              type="button"
              disabled={ingestionPercent !== 100 || isIngesting}
              onClick={() => setCurrentStep(3)}
              style={{
                height: 36,
                padding: "0 18px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor:
                  ingestionPercent === 100 && !isIngesting
                    ? "pointer"
                    : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: ingestionPercent === 100 && !isIngesting ? 1 : 0.5,
              }}
            >
              <span>Continue to review</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ─── STEP 3: Review and Confirm ─────────────────────────────────────── */}
      {currentStep === 3 && activeCompany && (
        <section
          aria-labelledby="step3-heading"
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <div>
            <h2
              id="step3-heading"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Review and confirm
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              Verify parsed policy structure, preview extracted vector chunks, and
              calibrate approval thresholds for {activeCompany.name}.
            </p>
          </div>

          {/* Extracted Sections List */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
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
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Extracted policy sections ({sections.length})
              </h3>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Document: {selectedFile?.name || activeCompany.samplePolicyPath}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--accent)",
                        fontWeight: 500,
                      }}
                    >
                      {sec.section}
                    </span>
                    <span style={{ color: "var(--text)" }}>{sec.title}</span>
                  </div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    Page {sec.page}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chunk Preview Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                }}
              >
                Chunk preview table ({chunks.length} chunks)
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Vector dimension 1536
              </span>
            </div>

            <ChunkTable chunks={chunks} />
          </div>

          {/* Thresholds Form via React Hook Form and Zod */}
          <form
            onSubmit={handleSubmit(onActivatePolicy)}
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
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Calibrate decision thresholds
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Deterministic boundaries for autonomous refund execution vs human
                review escalation. Auto-approve limit cannot exceed HITL limit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Auto-approve Limit */}
              <div>
                <label
                  htmlFor="autoApproveLimit"
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text)",
                    marginBottom: 6,
                  }}
                >
                  Auto-approve limit (INR)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 14,
                      color: "var(--text-faint)",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    id="autoApproveLimit"
                    type="number"
                    step="500"
                    {...register("autoApproveLimit")}
                    style={{
                      width: "100%",
                      height: 40,
                      paddingLeft: 28,
                      paddingRight: 12,
                      borderRadius: 8,
                      border: errors.autoApproveLimit
                        ? "1px solid var(--danger)"
                        : "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                      outline: "none",
                    }}
                    className="focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
                {errors.autoApproveLimit && (
                  <p
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: "var(--danger)",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <AlertCircle size={12} />
                    <span>{errors.autoApproveLimit.message}</span>
                  </p>
                )}
              </div>

              {/* HITL Trigger Limit */}
              <div>
                <label
                  htmlFor="hitlLimit"
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text)",
                    marginBottom: 6,
                  }}
                >
                  HITL trigger limit (INR)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 14,
                      color: "var(--text-faint)",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    id="hitlLimit"
                    type="number"
                    step="1000"
                    {...register("hitlLimit")}
                    style={{
                      width: "100%",
                      height: 40,
                      paddingLeft: 28,
                      paddingRight: 12,
                      borderRadius: 8,
                      border: errors.hitlLimit
                        ? "1px solid var(--danger)"
                        : "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                      outline: "none",
                    }}
                    className="focus:ring-2 focus:ring-[var(--focus-ring)]"
                  />
                </div>
                {errors.hitlLimit && (
                  <p
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: "var(--danger)",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <AlertCircle size={12} />
                    <span>{errors.hitlLimit.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
                paddingTop: 16,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 8,
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to upload</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 36,
                  padding: "0 20px",
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
                <FileCheck2 size={16} strokeWidth={1.5} />
                <span>Activate policy</span>
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
