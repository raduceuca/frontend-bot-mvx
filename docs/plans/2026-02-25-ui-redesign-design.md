# MultiversX Bot — UI & Copy Redesign

**Date:** 2026-02-25
**Status:** Approved
**Scope:** Visual overhaul + copy rewrite. No functional changes except Mystery Box widget and faucet repositioning.

---

## Product Context

MultiversX Bot is a demo showcasing an AI agent that executes autonomously on the MultiversX blockchain. Users give the agent a job (0.05 EGLD), and it performs on-chain actions — swaps, transfers, contract calls. Target audience: crypto/AI Twitter, agentic commerce enthusiasts, anyone curious about AI + blockchain. The demo needs to look premium and be immediately compelling when shared from an X post.

---

## Visual Direction

### Palette
- **Accent:** `#23F7DD` (MultiversX teal) and its opacity variants (10%, 20%, 50%) for surfaces, borders, glows
- **Background:** Current deep dark tones from the existing theme system
- **Text:** White primary, slate secondary (~`#94A3B8`), `#23F7DD` for highlights
- **Borders/surfaces:** White at 5-8% opacity for glass cards
- **Monochromatic:** No secondary accent color. Dark + teal only.

### Typography
- **Headings:** Space Grotesk, bold weights, tight tracking
- **Body:** Space Grotesk light/regular
- **Data/status:** Space Mono — wallet addresses, tx hashes, status indicators only
- **Remove:** DM Serif Display (the `.text-drama` serif font) — clashes with premium tech direction

### Surfaces
- Glass cards: `bg-white/[0.03]` with `border-white/[0.06]`, subtle `backdrop-blur`
- No heavy shadows. Depth through layering and border opacity.
- Corners: `rounded-2xl` for major cards, `rounded-xl` for inner elements

### Motion
- Minimal, purposeful. Fade-in on page load (200ms), smooth transitions on hover/state changes.
- No decorative animations.
- Agent status indicator: subtle breathing pulse on the status dot (the only "alive" animation).

---

## Public Landing Page (Home)

Single-page scroll, three zones.

### Zone 1 — Hero (viewport height, centered)
- Small label: "AI Agent on MultiversX" — monospace, `#23F7DD`, uppercase, tracking-wide
- Heading: "MultiversX Bot" — Space Grotesk bold, `text-6xl`/`text-7xl`, white
- Subline: "An autonomous agent that executes on-chain." — slate secondary, `text-lg`
- CTA: "Connect Wallet" — `#23F7DD` bg, dark text, `rounded-xl`
- Below CTA: "Powered by MultiversX" or network badge

### Zone 2 — What It Does (3 feature cards)
Three compact cards in a row (stack on mobile):
1. "Give it a job" — describe what you want done on-chain
2. "It decides & executes" — the agent autonomously performs swaps, transfers, calls
3. "You get results" — tokens, transactions, proof — all on-chain

Each card: glass surface, teal icon/accent, 2 lines of copy max.

### Zone 3 — Footer
Network indicator, version, disclaimer link. Minimal.

### Removed from Home
- "How can you connect" section with 5 wallet cards and browser extension promo
- Theme switcher
- "Choose your path, you must" copy
- Background images/illustrations

---

## Dashboard (Logged-in)

### Layout
Two-column: sidebar (fixed, `w-80`) + scrollable main area. Collapsible drawer on mobile.

### Left Sidebar
- MultiversX Bot logo at top
- Account info: wallet address (truncated, copyable), balance, shard — flat list, no accordion
- Navigation items: "Create Job", "Mystery Box"
- Logout at bottom

### Main Area — Faucet Gate (devnet only, conditional)
**Shown when user balance is insufficient. Not dismissable until funded.**
- Prominent card with teal border at top of main area
- Heading: "You need xEGLD to get started"
- Copy: "Request 5 xEGLD from the devnet faucet to try the agent."
- [Request xEGLD] button with reCAPTCHA
- On success: card collapses, reveals normal job interface
- On mainnet: never rendered

### Main Area — Header
- Status dot (breathing pulse) + "Agent Online" — small monospace, `#23F7DD`
- Heading: "What should I do?" — large Space Grotesk
- When job active: dynamic heading ("Working on it..." / "Job Complete")

### Main Area — Create Job Widget (primary)
**Config simplified:**
- Hide: Agent Nonce, Service ID, Token Nonce (auto-set as defaults)
- Show: job cost as label ("0.05 EGLD"), not editable
- Single "Create Job" button

**Chat interface (keep current UX, restyle):**
- Remove "Agent Chat" heading — show job ID + status badge inline
- Keep user/agent/system message layout and animations
- Keep typing indicator (three dots)
- Status badges: "Processing", "Ready", "Complete", "Failed"

**Feedback modal:** Keep star rating, match new glass surface styling.

### Main Area — Mystery Box Widget (below Create Job)
- Compact glass card with subtle teal border
- Heading: "Mystery Box"
- Copy: "Let the agent trade 1 EGLD on xExchange. See what comes back."
- Button: "Open Mystery Box" — teal accent
- Result: list of tokens received, amounts, transaction link

### Main Area — Faucet Widget (devnet, below Mystery Box)
- Kept as fallback for users who want more xEGLD after initial gate
- Same reCAPTCHA flow, cleaned up styling

---

## Copy Guide

### Voice
Direct, confident, minimal. Not sarcastic, not corporate. Like a well-built tool that doesn't explain itself.

### Replacements

| Location | Current | New |
|----------|---------|-----|
| Hero eyebrow | "Autonomous Agent on MultiversX" | "AI Agent on MultiversX" |
| Hero subline | "Give an AI a wallet. See what happens." | "An autonomous agent that executes on-chain." |
| Hero description | "Open Claw listens, decides..." (paragraph) | Removed — 3 feature cards replace this |
| Dashboard status | "System Initialize: Agent Ready" | "Agent Online" |
| Dashboard heading | "Awaiting Command" | "What should I do?" |
| Config section | "Core Configuration Matrix" | Removed |
| Widget title | "Agent Orchestrator" | Removed |
| Idle state | "System Inactive" + robot icon | Default state is the prompt — no idle screen |
| Home section | "How can you connect / Choose your path, you must." | Removed |
| Button | "Initialize Job" | "Create Job" |
| Button | "Send to Bot" | "Send" |
| Button | "Mark as Finished" | "End Job" |
| Brand name | "Open Claw" | "MultiversX Bot" |

---

## What Stays Unchanged

- **Theme CSS variable architecture** (`--mvx-*` tokens) — update values, keep structure
- **SDK integration** — wallet, auth, transaction signing, native auth
- **Chat message components** — user/agent/system rendering logic, restyle only
- **Responsive breakpoints** — same mobile-first approach
- **Router structure** — same routes, same auth guards
- **Wrappers** — BatchTransactionsContext, AxiosInterceptors, AuthRedirectWrapper
- **Widget architecture** — same pattern, add Mystery Box

---

## User Flow

```
1. Land on Home → see hero + feature cards
2. Click "Connect Wallet" → SDK wallet panel
3. Dashboard loads → balance check
   3a. Insufficient → Faucet gate card → request xEGLD → funded
   3b. Sufficient → skip to step 4
4. "What should I do?" → Create Job (primary) or Mystery Box (secondary)
5. Create Job → pay 0.05 EGLD → chat with agent → job complete → feedback
6. Mystery Box → pay 1 EGLD → agent trades on xExchange → receive tokens
```
