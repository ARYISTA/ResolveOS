---
name: resolvos-frontend
description: Build the ResolvOS demo frontend (Next.js, TypeScript, Tailwind) for an enterprise multi-agent refund and dispute resolution system. Use for any task that creates or changes UI, mock data, API client, WebSocket handling, or styling in this repo. Enforces the fixed tech stack, the Ponytail coding principles, and the minimal brown design system in design.md.
---

# ResolvOS Frontend: Agent Skill

You are a senior frontend engineer and mentor building a **demo frontend**. Read this file and `design.md` before writing any code. Follow both exactly. Do not redesign the architecture, change the stack, or add scope.

## 1. What You Are Building

A demo web app for an enterprise multi-agent customer query and refund resolution system. Flow: user picks a domain (Banking, Insurance, Online Subscriptions, E-commerce, Travel Ticket Booking), sets up a company and uploads its policy PDF, plays the customer raising a refund request, and watches AI agents resolve it live. Everything shown in the UI comes from either a **mock engine** (default) or the real Spring Boot + LangGraph backend (**live mode**). Same screens, same components, one data-source toggle.

The product principle the UI must make visible: **the LLM recommends, deterministic controls validate, the transaction service executes.**

The full product spec is the PRD "ResolvOS Demo Frontend". If this file and the PRD conflict on stack or approach, this file wins. If they conflict on screen behavior, the PRD wins.

## 2. Ponytail Core Coding Principles (non-negotiable)

```
# Ponytail Core Coding Principles
- YAGNI: You Ain't Gonna Need It. Build only what is required right now.
- Zero Dependencies: Prioritize native APIs and standard libraries first.
- Deletion over Addition: The cleanest code is code that was never written.
- Simplicity > Cleverness: Write code that is clean, transparent, and easy to audit.
```

### How to apply them here

**YAGNI**
- Build only the screen or feature in the current task. No "future-proofing", no extension points, no unused props, no unused config flags, no generic components used in one place.
- Do not create an abstraction until it has two real call sites. Duplicate once, abstract on the second need.
- Do not build P1 or P2 features while doing P0 work. Priorities are in the PRD section 12.
- No speculative error handling for cases that cannot happen in this demo.

**Zero Dependencies**
- Before adding any package, ask in order: (1) does the platform do it natively? (2) can it be done in under 30 lines? (3) is it on the allowlist below? Only if all three answers force it, ask the user for approval first.
- Native replacements to use by default:

| Need | Use | Not |
|---|---|---|
| HTTP | `fetch` in a small wrapper | axios |
| Real-time | native `WebSocket` | socket.io |
| Global UI state | React context + `useReducer` | Redux, Zustand, Jotai |
| Dates, money, numbers | `Intl.DateTimeFormat`, `Intl.NumberFormat` | date-fns, moment, numeral |
| IDs | `crypto.randomUUID()` | uuid |
| CSV export | `Blob` + `URL.createObjectURL` | file-saver, papaparse |
| File drop and upload | native drag events, `FormData` | react-dropzone |
| PDF viewing | `<iframe src="file.pdf#page=7">` | react-pdf |
| Charts | hand-written SVG or CSS bars | Recharts, Chart.js, D3 |
| Pipeline graph | CSS vertical stepper | React Flow |
| Animation | CSS transitions and keyframes | framer-motion |
| Class merging | template strings, or the `cn` helper shadcn ships | extra libs |
| Icons | `lucide-react` (already shadcn's) | any second icon set |
| Fonts | system font stacks | Google Fonts, font packages |

**Deletion over Addition**
- Prefer removing or simplifying existing code over adding new code. Fix a bug by deleting the wrong thing when possible.
- Delete dead code, unused imports, unused exports, and commented-out code in the same change that makes them dead.
- No barrel files (`index.ts` re-exports), no wrapper components that only pass props through, no duplicate types.
- Every PR-sized change ends with a self-review question: "What can I delete from this?"

**Simplicity over Cleverness**
- Plain functions, plain props, early returns. No metaprogramming, no deep generics, no reducer-in-reducer patterns, no render-prop mazes.
- A junior engineer should audit any file in under two minutes.
- Names say what a thing is. Comments only explain *why*, never *what*.
- Prefer a flat `switch` or lookup object over class hierarchies or strategy patterns.
- Prefer server-friendly defaults of the framework over custom infrastructure.

## 3. Fixed Tech Stack (do not substitute)

**Dependency allowlist (everything else needs user approval):**

- `next` (App Router), `react`, `react-dom`, `typescript`
- `tailwindcss` with CSS variables for tokens
- `shadcn/ui` components (copied into the repo, plus the Radix primitives they require) and `lucide-react`
- `@tanstack/react-query`
- `react-hook-form`, `zod`, `@hookform/resolvers`

Dev only: `eslint`, `prettier`, and the Next.js defaults.

Notes:
- The PRD mentioned Zustand, Recharts, React Flow, and react-pdf as options. Under Ponytail they are **not used**: use the native replacements in the table above. Revisit only if a concrete requirement cannot be met natively, and ask first.
- Use TypeScript `strict`. No `any`. Zod schemas are the source of truth for API and WebSocket payloads; infer TS types from them.
- No Redux, GraphQL, micro-frontends, BFF layer, or custom design system.

## 4. Architecture Rules

```
/src
  /app            routes (see PRD section 5)
  /components
    /ui           shadcn components, restyled via tokens
    /pipeline     PipelineStepper, NodeCard, AgentRoster, AgentFeed
    /case         DecisionPanel, CitationCard, EnforcementChecklist, Timeline
    /policy       UploadDropzone, IngestionStepper, ChunkTable
    /review       ReviewCard, ApproveRejectDialog
  /lib
    /api          client.ts (fetch wrapper), ws.ts (WebSocket wrapper), endpoints.ts
    /mock         mockEngine.ts, fixtures per domain
    /domains      banking.ts, insurance.ts, subscriptions.ts, ecommerce.ts, travel.ts
    /schemas      zod schemas and inferred types
  /state          AppContext.tsx (domain, company, role, mode, theme)
```

Hard rules:
1. **Components never call `fetch` or `WebSocket` directly.** They use hooks that call `lib/api`. This is what makes Mock and Live interchangeable.
2. **`mockEngine.ts` emits the exact same event shapes as the real backend.** Switching Mock to Live must require zero component changes.
3. **Domain behavior is data, not code.** Each file in `/lib/domains` exports one config object (companies, policy topics, transaction types, refund reasons, thresholds, scenario presets, mock customers). Screens read from it. No `if (domain === "banking")` in components.
4. **The frontend never decides a refund outcome.** It only displays what the engine or backend returns. No business rules in the UI beyond input validation.
5. **AI-generated text is untrusted.** Render as plain text only. Never `dangerouslySetInnerHTML`.
6. **Auth token** (live mode) in memory or an httpOnly cookie. Never in `localStorage`.
7. Server Components by default; add `"use client"` only for components that need state, effects, or browser APIs.

## 5. Data Contract (code against this from day one)

Node names are fixed strings: `INTAKE, VALIDATION, POLICY_RETRIEVAL, DECISION, RISK, ENFORCEMENT, HUMAN_REVIEW, EXECUTION`.

WebSocket events on `/ws/cases/{id}`:

```
INGESTION_PROGRESS   { policyId, stage, percent }
NODE_STARTED         { caseId, node, ts }
NODE_COMPLETED       { caseId, node, durationMs, output }
NODE_FAILED          { caseId, node, error }
HITL_REQUIRED        { caseId, reason, riskLevel }
HITL_RESOLVED        { caseId, decision, reviewer }
CASE_COMPLETED       { caseId, verdict, refundRef? }
AUDIT_EVENT          { caseId, action, actor, ts }
```

REST endpoints, `ResolutionResult` type, and field names are defined in the PRD section 10. Do not rename fields. If something is missing, add it to the Zod schema and tell the user.

## 6. Design Rules

Follow `design.md` exactly. Summary:
- Minimal, calm, claude.ai-like. Warm cream background, brown accent, thin 1px borders, no shadows except popovers.
- Tokens only (CSS variables). No hex in components. No gradients, glass, glow, or per-domain themes.
- System fonts. Serif for headings, sans for UI, mono for IDs and JSON.
- Layer colors are fixed: AI, Deterministic, Human, Transaction. Consistent everywhere.
- Every data screen has loading, empty, and error states.
- INR formatting via `Intl.NumberFormat("en-IN")`. Sentence case labels. No emoji.

## 7. Working Method

For every task:

1. **Read** this file, `design.md`, and the relevant PRD section. Look at existing code and match its naming and structure.
2. **State a plan in 3 to 6 lines**: files to touch, what will be deleted or reused, any dependency question. Ask at most one question, only if an essential detail is missing; otherwise proceed on reasonable assumptions and list them.
3. **Implement the smallest slice** that satisfies the task. Reuse before creating. Delete before adding.
4. **Verify**: `tsc --noEmit`, lint, and run the app. Walk the golden path for the screen you changed in Mock mode, in light and dark theme.
5. **Self-review with the Ponytail checklist** (below) and remove what fails.
6. **Report** briefly: what changed, what was deleted, assumptions made, anything that needs the user's decision.

### Build order (follow unless told otherwise)

1. App shell, context, theme tokens, domain configs, mock engine
2. Landing (domain selection) and setup wizard
3. Customer simulator
4. Case view with pipeline and citations
5. Human review queue
6. Dashboard and case list
7. P1 screens (policy viewer, audit log, security lab, architecture comparison)
8. Live mode switch and contract fixes

## 8. Ponytail Review Checklist (run before every handoff)

- [ ] Did I add anything not required by the current task? Remove it.
- [ ] Did I add a dependency? Is it on the allowlist? If not, revert or ask.
- [ ] Is there a native API or 30-line solution I skipped?
- [ ] Is every new abstraction used in at least two places?
- [ ] Did I delete the code my change made obsolete?
- [ ] Any unused prop, export, import, type, or CSS variable?
- [ ] Could a junior engineer audit each changed file in two minutes?
- [ ] Are colors, fonts, spacing, and radii all from `design.md` tokens?
- [ ] Does it work in Mock mode with no backend, in light and dark theme?
- [ ] Are loading, empty, and error states present?

## 9. Definition of Done

A change is done when: it type-checks with no `any`; lint is clean; the screen works end to end in Mock mode; keyboard navigation and visible focus work; the checklist above passes; and no new dependency was added without approval.

## 10. Never Do

- Never change the stack, folder structure, or established direction without asking.
- Never add Redux, GraphQL, a charting or graph library, an animation library, or a UI kit beyond shadcn.
- Never put business or refund logic in the frontend.
- Never call the backend or open a WebSocket outside `lib/api`.
- Never render AI output as HTML.
- Never hardcode colors, fonts, or magic numbers outside the tokens.
- Never leave commented-out code, TODO stubs, or placeholder screens for non-requested features.
- Never use real payment credentials. Money movement is simulated.
