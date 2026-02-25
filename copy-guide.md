# MultiversX Bot — Copy & Voice Guide

> Quick reference for anyone writing copy for the MultiversX Bot frontend.
> For exact file-level string replacements, see `IMPLEMENTATION_SPEC.md`.
> For visual design direction, see `DESIGN_PROMPT.md`.

---

## What is this product?

**MultiversX Bot** is an autonomous AI agent that runs on MultiversX. It has its own wallet. You tell it what to do, and it executes on-chain — token swaps, transfers, smart contract calls. No manual transaction signing, no hand-holding.

**Token Safari** is a featured demo skill. The user sends EGLD, and the agent explores trending tokens, picks a handful, executes swaps, and sends the tokens back. It's the "hello world" — a fun way to see everything the agent can do in one shot. It is **not** the product. It's one thing the agent knows how to do.

---

## Naming system

| Concept | Name | Notes |
|---------|------|-------|
| The product | **MultiversX Bot** | Used in navbar, hero, page title, meta. |
| The AI | **the agent** | Lowercase. "The agent is working…" not "The Agent is working…" |
| A task session | **a job** | "Start a job," "your current job." Not "session" or "task." |
| The demo skill | **Token Safari** | Capitalized. It's a proper name for a specific skill. |
| Tokens received back | **your finds** | Optional warmth. "Here are your finds." |

---

## Voice rules

1. **Lead with what it does, not what it is.** "Give an AI a wallet. See what happens." beats "An AI-powered autonomous agent platform."
2. **Token Safari is a demo, not the headline.** The hero sells the agent platform. Token Safari is a "try this" callout.
3. **Assume zero context.** The user is smart but has never seen this product before.
4. **Slightly playful.** This is a fun experiment on devnet, not enterprise software. But don't force jokes.
5. **Kill internal jargon.** "Agent nonce," "service ID," "secure uplink," "employer" — hide these behind an advanced toggle or rewrite them.
6. **Error messages = person talking.** "Couldn't start the job" not "Job creation failed." "Connection lost" not "Communication failure."
7. **Banned words:** "powerful," "seamless," "revolutionary," "cutting-edge," "leverage," "utilize."

---

## Tone by section

### Hero (landing page)
Confident, concise, slightly provocative. One strong hook line, one clarifying sentence, done.

**Title:** `MultiversX Bot`
**Subtitle:** `Give an AI a wallet. See what happens.`
**Body:** `MultiversX Bot listens, decides, and executes on-chain — swaps, transfers, contract calls. No hand-holding required.`
**CTA:** `Connect Wallet`

### Capabilities section
Factual, brief. Each card gets one sentence max.

**Eyebrow:** `Capabilities`
**Heading:** `What the agent can do`

### Token Safari callout
Warm, inviting. This is the "try me" moment.

**Title:** `Token Safari`
**Badge:** `Try it`
**Description:** `Send 1 EGLD. The agent explores trending tokens on devnet, picks 5–10, splits your EGLD across them, and sends the finds to your wallet.`

### Dashboard header
Conversational, direct. The user just logged in.

**Welcome:** `Your agent is ready.`
**Title:** `What do you want it to do?`

### CreateJob widget
Functional, clear. The user is configuring and running a job.

**Header:** `MultiversX Bot` / `Launch a new job`
**Buttons:** `START JOB` · `FINISH JOB` · `SEND TO BOT`
**Empty chat:** `Your agent is standing by`
**Input placeholder:** `Tell the agent what to do…`

### Status messages (while agent works)
Short, calm. No shouting.

- `Sending your request to the agent…`
- `Confirming payment on-chain…`
- `Agent is working…`
- `Agent is swapping your tokens…`

### Error messages
Human, not robotic.

- `Couldn't start the job: [reason]`
- `Something went wrong: [reason]`
- `Connection lost: [reason]`
- `The agent took too long to respond. Try again?`
- `Swap didn't go through: [reason]`
- `Couldn't send tokens to the bot: [reason]`

### Idle state
Friendly nudge.

- **Title:** `Agent Idle`
- **Description:** `Hit "Start Job" above to put the agent to work.`

### Feedback modal
- **Title:** `Rate your experience`
- **Description:** `How did the agent do? Your rating goes on-chain.`

### Suggestion chips (in empty chat)
Conversational, with emoji for visual interest.

- `🌿 Token Safari`
- `💬 What can you do?`
- `📊 Trending tokens`

---

## Quick test

Read any piece of copy and ask:
1. Would a first-time visitor understand this in 3 seconds?
2. Does it sound like a person wrote it (not a marketing bot)?
3. Is it the shortest version that still works?

If yes to all three, ship it.
