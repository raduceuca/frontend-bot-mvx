# MultiversX Bot — Frontend Copy & UX Implementation Spec

> This document is the single source of truth for all copy and UX changes needed for the demo launch.
> It is written to be machine-readable by a coding agent: every change specifies the exact file, the exact current string, and the exact replacement.

---

## 0. Product Context (read this first)

### What is MultiversX Bot?
MultiversX Bot is an **autonomous AI agent** that runs on MultiversX. It has its own wallet and can execute on-chain actions — token swaps, transfers, smart contract interactions — on behalf of the user. Users pay to launch a "job," then interact with the agent via chat. The agent listens, decides, and acts.

### What is Token Safari?
Token Safari is a **pre-built demo skill** (one of potentially many). The user sends EGLD, and the agent explores today's trending tokens, decides how to allocate, executes swaps, and sends the tokens back. It's the "hello world" of the platform — a fun, tangible way to showcase all agent capabilities at once. **It is not the product itself.** It's a featured quick-action.

### Naming system
| Concept | Name | Used where |
|---------|------|------------|
| The product / platform | **MultiversX Bot** | Navbar, hero, page title, meta tags |
| The AI that executes | **the agent** (lowercase) | Chat UI, status messages, descriptions |
| A paid task session | **a job** | Buttons, headers, sidebar |
| The featured demo | **Token Safari** | Suggestion chips, landing page callout, CTA |
| The tokens you receive back | **your finds** | Completion messages (optional flair) |

### Voice rules
1. Lead with what the agent does, not what it is.
2. Token Safari is an example, not the headline.
3. Assume the user is smart but has zero context on this product.
4. Slightly playful — fun experiment, not enterprise software.
5. Kill jargon that isn't the user's: "agent nonce," "service ID," "secure uplink," "employer" → hide or rewrite.
6. Error messages should sound like a person talking.
7. Never use "powerful," "seamless," "revolutionary," or "cutting-edge."

---

## 1. Global / Meta

### 1a. `index.html` — page title + meta tags

**File:** `index.html`

The title `<title>MultiversX Bot</title>` stays as-is. Update description meta tags:

| Current | Replace with |
|---------|-------------|
| `A powerful MultiversX bot that can help you with many things.` | `An autonomous AI agent on MultiversX. It trades, swaps, and transacts on-chain — you just tell it what to do.` |

Apply the same description replacement to `og:description` and `twitter:description` meta tags. Title/og:title/twitter:title stay as `MultiversX Bot`.

### 1b. `src/components/Logo/Logo.tsx` — navbar brand name

**File:** `src/components/Logo/Logo.tsx`

No change needed — already says `MultiversX Bot` (line 29).

---

## 2. Landing Page (Home)

### 2a. `src/pages/Home/components/HomeHero/HomeHero.tsx` — hero section

**File:** `src/pages/Home/components/HomeHero/HomeHero.tsx`

The hero currently has the eyebrow "Autonomous Agent on MultiversX" and title "Open Claw". Update:

| Current | Replace with |
|---------|-------------|
| `Open Claw` (hero title, line 69) | `MultiversX Bot` |

Keep the eyebrow, subtitle, and body paragraph as-is — those are already correct:
- Eyebrow: `Autonomous Agent on MultiversX`
- Subtitle: `Give an AI a wallet. See what happens.`
- Body: `MultiversX Bot listens, decides, and executes on-chain — swaps, transfers, contract calls. No hand-holding required.`

Note: update the body paragraph to say "MultiversX Bot" instead of "Open Claw" if it references the product name.

### 2b. New component: `HomeCapabilities.tsx`

**Create file:** `src/pages/Home/components/HomeCapabilities/HomeCapabilities.tsx`

This is a new section below the hero that explains the agent's capabilities with 3 cards + a Token Safari callout.

**Section eyebrow:** `Capabilities`
**Section heading:** `What the agent can do`

**Card 1:**
- Icon: `faBrain`
- Title: `Autonomous Trades`
- Description: `Reads market data, picks tokens, and executes swaps — all on its own.`

**Card 2:**
- Icon: `faBolt`
- Title: `Execution Engine`
- Description: `Sends transactions, interacts with smart contracts, manages token transfers.`

**Card 3:**
- Icon: `faComments`
- Title: `Chat Interface`
- Description: `Talk to the agent in plain language. It interprets your intent and acts.`

**Token Safari callout (below the 3 cards):**
- Icon: `faLeaf`
- Title: `Token Safari`
- Badge: `Try it`
- Description: `Send 1 EGLD. The agent explores trending tokens on devnet, picks 5–10, splits your EGLD across them, and sends the finds to your wallet.`

Also create an index file: `src/pages/Home/components/HomeCapabilities/index.ts` exporting the component.

### 2c. `src/pages/Home/Home.tsx` — add HomeCapabilities

**File:** `src/pages/Home/Home.tsx`

- Add import: `import { HomeCapabilities } from './components/HomeCapabilities';`
- Add `<HomeCapabilities />` between `<HomeHero />` and `<Outlet />`

---

## 3. Dashboard

### 3a. `src/pages/Dashboard/Dashboard.tsx` — widget metadata

**File:** `src/pages/Dashboard/Dashboard.tsx`

| Line | Current | Replace with |
|------|---------|-------------|
| 11 | `title: 'Create Job'` | `title: 'New Job'` |
| 13 | `description: 'Initialize a new job and start a task with a prompt'` | `description: 'Launch the agent and give it something to do'` |

### 3b. `src/pages/Dashboard/components/DashboardHeader/DashboardHeader.tsx`

**File:** `src/pages/Dashboard/components/DashboardHeader/DashboardHeader.tsx`

Replace the entire component body:

| Current | Replace with |
|---------|-------------|
| `System Initialize: Agent Ready` | `Your agent is ready.` |
| `Awaiting Command` | `What do you want it to do?` |

Remove the `<span className='w-2 h-2 bg-emerald-400 rounded-full' />` — it's not rendering properly as inline in a div anyway.

### 3c. `src/pages/Dashboard/components/LeftPanel/components/SideMenu/SideMenu.tsx` — menu item label

**File:** `src/pages/Dashboard/components/LeftPanel/components/SideMenu/SideMenu.tsx`

| Line | Current | Replace with |
|------|---------|-------------|
| 11 | `title: 'Create Job'` | `title: 'New Job'` |

### 3d. `src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx` — main widget

**File:** `src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx`

#### Header copy
| Current | Replace with |
|---------|-------------|
| `Agent Orchestrator` | `MultiversX Bot` |
| `Core Configuration Matrix` | `Launch a new job` |

#### Buttons
| Current | Replace with |
|---------|-------------|
| `INITIALIZE JOB` | `START JOB` |
| `INITIALIZING` | `STARTING…` |
| `MARK AS FINISHED` | `FINISH JOB` |
| `SEND TO BOT` | `SEND TO BOT` (keep) |
| `SENDING...` | `SENDING…` (keep, just fix ellipsis) |
| `SWAPPING...` | `SWAPPING…` (keep, just fix ellipsis) |

Note: the `RESET JOB` button no longer exists in the current code (it was replaced by the finish-and-feedback flow). If it reappears, use `NEW JOB`.

#### Config field labels
| Current | Replace with |
|---------|-------------|
| `Agent Nonce` | `Agent Nonce` (keep — but move to advanced toggle, see below) |
| `Service ID` | `Service ID` (keep — but move to advanced toggle) |
| `Payment Token` | `Token` |
| `Token Nonce` | `Token Nonce` (move to advanced toggle) |
| `Amount` | `Amount (EGLD)` |

**Advanced toggle behavior:** Only show "Token" and "Amount (EGLD)" by default. Add a `showAdvanced` state (default `false`) and a small toggle button. When expanded, show Agent Nonce, Service ID, and Token Nonce fields.

#### Chat empty state
| Current | Replace with |
|---------|-------------|
| `Send a message to start the conversation` | `Your agent is standing by` |

Add suggestion chips below the empty state text:

```tsx
<div className='flex flex-wrap gap-2 mt-4 justify-center'>
  <button onClick={() => setPrompt('Start a Token Safari — explore trending tokens')} className='...'>
    🌿 Token Safari
  </button>
  <button onClick={() => setPrompt('What can you do?')} className='...'>
    💬 What can you do?
  </button>
  <button onClick={() => setPrompt('Show me trending tokens on devnet')} className='...'>
    📊 Trending tokens
  </button>
</div>
```

#### Status messages
| Current | Replace with |
|---------|-------------|
| `Submitting task…` | `Sending your request to the agent…` |
| `Verifying employer on-chain…` | `Confirming payment on-chain…` |
| `Agent is processing your request…` | `Agent is working…` |
| `Bot is swapping your tokens…` | `Agent is swapping your tokens…` |

#### Error messages
| Current | Replace with |
|---------|-------------|
| `Job creation failed:` | `Couldn't start the job:` |
| `Execution failed:` | `Something went wrong:` |
| `Communication failure:` | `Connection lost:` |
| `Execution timed out — the task took too long.` | `The agent took too long to respond. Try again?` |
| `Swap failed:` | `Swap didn't go through:` |
| `Swap task failed:` | `Swap didn't go through:` |
| `Swap timed out.` | `The swap took too long. Try again?` |
| `Send to bot failed:` | `Couldn't send tokens to the bot:` |

#### Idle state (no job)
| Current | Replace with |
|---------|-------------|
| `System Inactive` | `Agent Idle` |
| `Initialize a job configuration to establish a secure uplink with the AI agent.` | `Hit "Start Job" above to put the agent to work.` |

#### Input placeholder
| Current | Replace with |
|---------|-------------|
| `Type a message… (Enter to send, Shift+Enter for newline)` | `Tell the agent what to do…` |

#### Chat header
| Current | Replace with |
|---------|-------------|
| `Agent Chat` | `Agent Chat` (keep) |
| `JOB:` label | `Job:` (lowercase) |

#### Feedback modal
| Current | Replace with |
|---------|-------------|
| `Rate the bot` | `Rate your experience` |
| `How was your experience? Each star = 20 (half stars allowed). Your rating is sent on-chain to the reputation registry.` | `How did the agent do? Your rating goes on-chain.` |
| `Failed to submit feedback` | `Couldn't submit your rating. Try again?` |

---

## 4. Priority

### P0 — Must ship (breaks if missing)
- index.html: description meta tags
- Hero: title → "MultiversX Bot", body paragraph name reference
- Dashboard header copy
- CreateJob: header copy, button labels, status messages, error messages, idle state

### P1 — Should ship (makes the demo make sense)
- Sidebar: "Create Job" → "New Job"
- Dashboard widget title/description
- CreateJob: advanced config toggle (hide nonce/serviceId by default)
- CreateJob: suggestion chips in empty chat state
- CreateJob: input placeholder
- HomeCapabilities new component
- Feedback modal copy cleanup

### P2 — Nice to have
- CreateJob: chat header JOB → Job (lowercase)
- Fine-tune any remaining uppercase/tracking-widest styling (handled by DESIGN_PROMPT.md)

---

## 5. Flat String Replacement List

For quick search-and-replace across the entire codebase:

```
"A powerful MultiversX bot that can help you with many things." → "An autonomous AI agent on MultiversX. It trades, swaps, and transacts on-chain — you just tell it what to do."
"Open Claw" → "MultiversX Bot" (wherever it appears — hero title, any leftover references)
"Agent Orchestrator" → "MultiversX Bot"
"Core Configuration Matrix" → "Launch a new job"
"INITIALIZE JOB" → "START JOB"
"INITIALIZING" → "STARTING…"
"MARK AS FINISHED" → "FINISH JOB"
"System Inactive" → "Agent Idle"
"Initialize a job configuration to establish a secure uplink with the AI agent." → "Hit \"Start Job\" above to put the agent to work."
"Payment Token" → "Token"
"Send a message to start the conversation" → "Your agent is standing by"
"Type a message… (Enter to send, Shift+Enter for newline)" → "Tell the agent what to do…"
"Submitting task…" → "Sending your request to the agent…"
"Agent is processing your request…" → "Agent is working…"
"Job creation failed:" → "Couldn't start the job:"
"Execution failed:" → "Something went wrong:"
"Communication failure:" → "Connection lost:"
"Execution timed out — the task took too long." → "The agent took too long to respond. Try again?"
"System Initialize: Agent Ready" → "Your agent is ready."
"Awaiting Command" → "What do you want it to do?"
"Create Job" → "New Job" (in SideMenu and Dashboard widget title only — not in code identifiers)
"Initialize a new job and start a task with a prompt" → "Launch the agent and give it something to do"
"Rate the bot" → "Rate your experience"
"Swap failed:" → "Swap didn't go through:"
"Swap task failed:" → "Swap didn't go through:"
"Swap timed out." → "The swap took too long. Try again?"
"Send to bot failed:" → "Couldn't send tokens to the bot:"
"Bot is swapping your tokens…" → "Agent is swapping your tokens…"
```
