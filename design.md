# ResolvOS Demo Frontend: Design System

Source of truth for all visual decisions. If a screen needs something not defined here, extend this file first, then build. Follows the Ponytail rules in `skills.md`: define only what the demo needs.

## 1. Design Intent

- **Feel:** calm, quiet, editorial. Same restraint as the claude.ai interface: warm paper background, generous whitespace, thin borders, almost no shadows, content first.
- **Palette:** warm browns and creams. Color is used for meaning (status, layer type), never for decoration.
- **Density:** comfortable by default, readable on a projector. Body text never below 14px.
- **Motion:** only to show state change (pipeline node running, toast in). Nothing decorative.

## 2. Color Tokens

Define once as CSS variables in `globals.css`. Components use tokens only. No hex values in components.

```css
:root {
  /* surfaces */
  --bg:            #F5F0E8;  /* page, warm cream */
  --surface:       #FBF8F3;  /* cards, panels, composer */
  --surface-2:     #EFE8DC;  /* hover, table header, subtle fills */
  --sidebar:       #EFE8DC;
  --border:        #E3D9CA;
  --border-strong: #CFC2AF;

  /* text */
  --text:          #2B211B;  /* primary, dark espresso */
  --text-muted:    #7A6A5C;
  --text-faint:    #A39482;

  /* brand / accent (brown) */
  --accent:        #8B5E3C;
  --accent-hover:  #744C2F;
  --accent-soft:   #EADBC8;  /* selected rows, active nav, soft badges */
  --on-accent:     #FBF8F3;

  /* status (muted, never neon) */
  --success:       #5B7F4F;  --success-soft: #E3EBDD;
  --warning:       #B7791F;  --warning-soft: #F3E6CC;
  --danger:        #A94438;  --danger-soft:  #F1DAD6;

  /* pipeline layer badges */
  --layer-ai:            #5C6F82;  --layer-ai-soft:            #DFE5EB;
  --layer-deterministic: #6B6258;  --layer-deterministic-soft: #E4DED5;
  --layer-human:         #B7791F;  --layer-human-soft:         #F3E6CC;
  --layer-transaction:   #5B7F4F;  --layer-transaction-soft:   #E3EBDD;

  --focus-ring:    #8B5E3C;
}

.dark {
  --bg:            #1C1713;
  --surface:       #25201A;
  --surface-2:     #2F2820;
  --sidebar:       #211C16;
  --border:        #3A3128;
  --border-strong: #4A3F33;

  --text:          #F1E9DD;
  --text-muted:    #B3A593;
  --text-faint:    #85786A;

  --accent:        #C9936A;
  --accent-hover:  #D8A57D;
  --accent-soft:   #3A2E23;
  --on-accent:     #1C1713;

  --success: #8DB07F;  --success-soft: #26301F;
  --warning: #D9A74E;  --warning-soft: #352A15;
  --danger:  #D4786D;  --danger-soft:  #3A211E;

  --layer-ai:            #8FA3B8;  --layer-ai-soft:            #222B34;
  --layer-deterministic: #A59B8F;  --layer-deterministic-soft: #2D2923;
  --layer-human:         #D9A74E;  --layer-human-soft:         #352A15;
  --layer-transaction:   #8DB07F;  --layer-transaction-soft:   #26301F;
}
```

Rules:
- Light mode is the default. Dark mode follows `prefers-color-scheme` and a manual toggle.
- Maintain WCAG AA contrast (4.5:1 body, 3:1 large text and UI borders). Check any new pairing.
- Status is never color alone: always icon plus text label.
- **Domain accent:** the five domains do not get separate color themes. Use the single brown accent everywhere. A domain is identified by its icon and name only.

### Layer color mapping (trust model, must stay consistent everywhere)

| Layer | Token | Used for |
|---|---|---|
| AI Agent | `--layer-ai` | Intake, Retrieval, Decision, Risk |
| Deterministic | `--layer-deterministic` | Validation, Policy Enforcement |
| Human | `--layer-human` | Human Review |
| Transaction | `--layer-transaction` | Execution |

## 3. Typography

System fonts only. No web fonts, no font packages.

```css
--font-sans:  ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
--font-mono:  ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

| Role | Font | Size / line height | Weight |
|---|---|---|---|
| Page title (h1) | serif | 30 / 38 | 500 |
| Section title (h2) | serif | 22 / 30 | 500 |
| Card title (h3) | sans | 16 / 24 | 600 |
| Body | sans | 15 / 24 | 400 |
| Secondary / table | sans | 14 / 20 | 400 |
| Caption / label | sans | 12 / 16 | 500, muted |
| IDs, trace_id, JSON | mono | 13 / 20 | 400 |

Serif is for page and section headings and the landing hero only. All UI controls, tables, and data use sans.

## 4. Spacing, Radius, Elevation

- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64. Nothing off-scale.
- **Radius:** 8px inputs and buttons, 12px cards and panels, 16px composer and dialogs, 999px chips.
- **Borders:** 1px `--border`. Prefer a border over a shadow.
- **Shadow:** one only, for popovers, dialogs, toasts: `0 4px 16px rgb(43 33 27 / 0.08)`.
- **Gradients, glass, blur, glow:** not used.

## 5. Layout

- **App shell:** left sidebar 248px (collapsible to 64px icon rail), top bar 56px, content area scrolls independently.
- **Content widths:** reading and form screens `max-width: 760px` centered (claude.ai chat column feel). Data screens (cases, audit, dashboard, case detail) `max-width: 1200px`.
- **Case detail:** two columns, pipeline 40%, detail panel 60%, collapsing to one column under 1024px.
- **Breakpoints:** desktop first. Support down to 768px. Phone is not a target.
- **Sidebar contents:** product name at top, nav items (icon plus label), bottom area for settings and theme toggle. Active item uses `--accent-soft` background and `--text` color, no left bar.
- **Top bar:** domain badge, company switcher, role switcher, Mock/Live pill, notification bell. All use the same 32px control height.

## 6. Components

Build on shadcn/ui primitives, restyled with the tokens above. Only build a component when a screen needs it.

**Buttons**
- Primary: `--accent` fill, `--on-accent` text, 8px radius, 36px height. Hover `--accent-hover`.
- Secondary: transparent, 1px `--border-strong`, text `--text`. Hover `--surface-2`.
- Ghost: no border, hover `--surface-2`.
- Destructive: `--danger` text on `--danger-soft`, used for Reject.
- One primary button per view region.

**Inputs and composer**
- 40px height, `--surface` fill, 1px `--border`, 8px radius, focus ring 2px `--focus-ring` with 2px offset.
- The customer message box is a **composer**: 16px radius, large padding, soft border, auto-growing textarea, submit button inside the bottom-right corner. This is the one place that mirrors the claude.ai input directly.

**Cards**
- `--surface`, 1px `--border`, 12px radius, 20px padding. No shadow. Hover state only on clickable cards: border becomes `--border-strong`.

**Domain cards (landing)**
- 3-column grid (2 under 1024px). Icon top-left in a 40px `--accent-soft` circle, name in h3, one-line description muted, two example scenarios as small muted lines.

**Chips and badges**
- 24px height, 12px text, 999px radius, soft background plus matching text token plus leading icon.
- Status chips: success, warning, danger, neutral. Risk: LOW=success, MEDIUM=warning, HIGH=danger.
- Verdict banner (ALLOW, DENY, ESCALATE): full-width card with soft background, icon, large label, one-line reason.

**Tables**
- Header row `--surface-2`, 12px uppercase-free labels in muted color, 44px rows, 1px row dividers, row hover `--surface-2`. No zebra stripes. Numbers right-aligned, tabular figures (`font-variant-numeric: tabular-nums`).

**Pipeline (custom CSS, no graph library)**
- Vertical stepper: node card per stage, connected by a 1px `--border-strong` line.
- Node card: layer badge, name, one-line result, duration (mono, muted).
- States: idle (faint border), running (accent border plus a subtle 1.2s opacity pulse), success (success icon), warning, failed (danger icon), skipped (dashed border, muted), waiting-for-human (human-layer tint plus clock icon).
- The currently selected node has `--accent-soft` background.

**Citation card**
- Left 2px border in `--accent`, document name and version in h3 size, `Section 4.2 · Page 7` in muted, excerpt in serif italic 14px with the matching phrase highlighted using `--accent-soft`, score as a small mono value, link action "View in policy".

**Agent roster and message feed**
- Roster: row of small circular avatars (28px) with initials, status dot, name below in caption style. Message feed: plain list, one line per agent message, agent name in semibold, timestamp in mono muted.

**Upload dropzone**
- Dashed 1px `--border-strong`, 12px radius, centered icon and text. Drag-over state fills `--accent-soft`. Each file below as a compact row with a thin progress bar (`--accent`).

**Charts (dashboard)**
- Hand-built SVG or CSS bars. Single-hue brown scale plus status colors only where meaning requires it. No gridline clutter: 3 horizontal hairlines max, direct value labels.

**Toasts, dialogs, popovers**
- `--surface`, 1px `--border`, the single shadow, 12px to 16px radius. Toasts bottom-right, auto-dismiss 5s, escalation toast persists until dismissed.

**Icons**
- `lucide-react`, 16px in controls, 20px in cards, 1.5px stroke, color inherits text or the relevant status token.

## 7. Motion

- Duration 150ms for hover and focus, 200ms for panel and toast transitions, ease-out. Pipeline node state change: 200ms.
- The only looping animation is the running-node pulse.
- Honor `prefers-reduced-motion: reduce` by removing the pulse and transitions.
- No page transitions, no parallax, no animated counters.

## 8. States (required on every data screen)

- **Loading:** skeleton blocks in `--surface-2`, same shape as the final content, no spinners except inside buttons.
- **Empty:** one line of muted text, one primary action. No illustrations.
- **Error:** inline `--danger-soft` panel with message and a Retry button. Never a blank screen.

## 9. Content and Tone

- Plain, direct sentences. No exclamation marks, no emoji, no marketing language.
- Sentence case for all labels and buttons.
- Money as INR with Indian grouping: `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })`.
- Dates in IST, short form (`22 Oct 2026, 14:05`).
- AI output is untrusted: render as plain text only, never as HTML.

## 10. Accessibility

- Every interactive element reachable by keyboard with a visible 2px focus ring.
- Pipeline updates announced via a polite `aria-live` region ("Policy Retrieval completed").
- Hit targets at least 32px. Labels for all inputs. Dialogs trap focus and close on Escape.

## 11. Do Not

- Do not introduce new colors, fonts, shadows, or radii without editing this file first.
- Do not use gradients, glassmorphism, neon accents, or per-domain color themes.
- Do not add an animation, charting, or graph library.
- Do not use color as the only carrier of meaning.
