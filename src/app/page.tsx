"use client";

import { useRouter } from "next/navigation";
import {
  Landmark,
  Shield,
  MonitorPlay,
  ShoppingBag,
  Plane,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { useApp } from "@/state/AppContext";
import { getAllDomains } from "@/lib/domains";
import type { Domain } from "@/lib/schemas";

function renderDomainIcon(iconName: string) {
  switch (iconName) {
    case "Landmark":
      return <Landmark size={20} strokeWidth={1.5} />;
    case "Shield":
      return <Shield size={20} strokeWidth={1.5} />;
    case "MonitorPlay":
      return <MonitorPlay size={20} strokeWidth={1.5} />;
    case "ShoppingBag":
      return <ShoppingBag size={20} strokeWidth={1.5} />;
    case "Plane":
      return <Plane size={20} strokeWidth={1.5} />;
    default:
      return <HelpCircle size={20} strokeWidth={1.5} />;
  }
}

export default function DomainSelectionPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const domains = getAllDomains();

  const handleSelectDomain = (domainId: string) => {
    dispatch({ type: "SET_DOMAIN", domain: domainId as Domain });
    router.push("/setup");
  };

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 36,
        paddingBottom: 48,
      }}
    >
      {/* Hero section */}
      <div style={{ textAlign: "left", maxWidth: 680 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 30,
            lineHeight: "38px",
            fontWeight: 500,
            color: "var(--text)",
          }}
        >
          ResolvOS
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: "24px",
            color: "var(--text-muted)",
            marginTop: 8,
          }}
        >
          Deterministic guardrails and multi-agent AI for enterprise dispute and
          refund resolution.
        </p>
      </div>

      {/* Domain selection cards */}
      <section aria-labelledby="domains-heading">
        <div style={{ marginBottom: 16 }}>
          <h2
            id="domains-heading"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            Select industry domain
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Each domain configures specialized policy templates, transaction
            types, and simulated scenario presets.
          </p>
        </div>

        <div className="domain-cards-grid">
          {domains.map((d) => (
            <div
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectDomain(d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectDomain(d.id);
                }
              }}
              aria-label={`Select ${d.name} domain`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                transition: "border-color 150ms ease-out, background 150ms ease-out",
                outline: "none",
              }}
              className="hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <div>
                {/* Icon in accent-soft 40px circle */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  {renderDomainIcon(d.icon)}
                </div>

                {/* Domain name */}
                <h3
                  style={{
                    fontSize: 16,
                    lineHeight: "24px",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 6,
                  }}
                >
                  {d.name}
                </h3>

                {/* One-line description */}
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: "20px",
                    color: "var(--text-muted)",
                    marginBottom: 16,
                  }}
                >
                  {d.description}
                </p>

                {/* Example scenarios */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--text-faint)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    EXAMPLE SCENARIOS
                  </span>
                  {d.exampleScenarios.map((scenario, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        lineHeight: "16px",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--accent)",
                          lineHeight: "16px",
                        }}
                      >
                        •
                      </span>
                      <span>{scenario}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--accent)",
                  paddingTop: 4,
                }}
              >
                <span>Configure company</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
