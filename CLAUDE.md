# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Max** (`maxonmvx.xyz`): an autonomous AI agent frontend built on the MultiversX blockchain. Users pay ~0.05 EGLD to open a "job," then chat with the agent ("Max") in plain English. Max executes on-chain actions (token swaps, transfers, smart contract interactions) on behalf of the user.

Originally bootstrapped from the MultiversX dApp template, now heavily customized into a product with a chat interface, transaction tracking, on-chain feedback/ratings, and a "Mystery Box" demo feature.

**Currently live on devnet only** (test EGLD, no real money).

## Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm start-devnet         # Dev server (devnet), HTTPS on port 3003
pnpm start-testnet        # Dev server (testnet)
pnpm start-mainnet        # Dev server (mainnet)
```

### Build
```bash
pnpm build-devnet         # TypeScript check + build for devnet
pnpm build-testnet        # TypeScript check + build for testnet
pnpm build-mainnet        # TypeScript check + build for mainnet
```
Build output goes to `/build`. Each build script copies the environment-specific config (`src/config/config.<env>.ts`) to `src/config/index.ts` before building.

### Lint & Format
```bash
pnpm lint                 # ESLint with auto-fix
```

### Testing
```bash
pnpm test                 # Jest unit/integration tests
pnpm run-playwright-test  # Playwright E2E (headless)
pnpm run-playwright-test-ui  # Playwright E2E (UI mode)
```
Jest tests live alongside source in `src/**/tests/` directories. Playwright E2E tests live in `/tests` at project root.

## Architecture

### Core Feature: CreateJob Chat Interface

The heart of the app is `src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx`: a full chat interface and job management system with a state machine.

```
idle → creating (sign tx) → ready (chat active) → prompting (AI processing) → rating (feedback) → idle
                                                 → sending_tokens (Mystery Box) → swapping → rating → idle
```

**User flow:**
1. Connect wallet (MultiversX DeFi Wallet, xPortal, Ledger, Passkey, or Web Wallet)
2. Start a job: signs a 0.05 EGLD transaction to the reputation registry contract
3. Chat with Max in plain language. Prompts are sent to the Task Service API.
4. Max processes and responds (Markdown-rendered)
5. Rate the experience (1-5 stars, on-chain feedback via reputation registry SC)

**Mystery Box:** User sends 1 EGLD to the bot, which crawls xExchange DEX, picks trending tokens, swaps, and returns them to the user's wallet.

**Session persistence:** Jobs survive page refreshes via `sessionStorage` (jobId, agentNonce, last 10 messages).

### API Endpoints (in `src/config/sharedConfig.ts`)

| Service | URL | Purpose |
|---------|-----|---------|
| Task Service | `https://mx-bot-api.elrond.ro` | AI agent prompts and task polling |
| Facilitator | `https://x402-facilitator.elrond.ro` | Job creation / payment preparation |
| TaskClaw | `https://devnet-taskclaw-api.multiversx.com` | Task management API |

### Key Addresses

| Item | Value |
|------|-------|
| Bot wallet | `erd1uyn7ss9syxz2ek97ejuwf2rpxuvk7dkmq2l7t070fm2js3mzj5mstqtg66` |
| Reputation registry SC | `erd1qqqqqqqqqqqqqpgq5x2d2fnz5rt42k3ht8sq2el6992s4nv3d8ssqpg6de` |
| Default agent nonce | 110 |
| Agent profile | `https://agents.multiversx.com/agent/110` |

### Multi-Environment Config
Three environment configs in `src/config/`: `config.devnet.ts`, `config.testnet.ts`, `config.mainnet.ts`. They re-export shared config from `sharedConfig.ts` and add environment-specific values. **Do not edit `src/config/index.ts` directly.** It gets overwritten by build/start scripts.

### Routing
Routes defined in `src/routes/routes.ts` using React Router v6:

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Home (hero + chat + capabilities) | No |
| `/unlock` | Unlock (child of Home) | No |
| `/dashboard` | Dashboard (chat interface) | Yes |
| `/disclaimer` | Disclaimer | No |

### Page Structure

**Home page** (`src/pages/Home/`):
- `HomeHero`: Background image, animated headline, embedded CreateJob chat interface
- `HomeCapabilities`: 3 capability cards + Mystery Box CTA section
- `HomeConnect`: Wallet connection options (MetaMask Snap, Passkey, xPortal, Ledger, Web Wallet)

**Dashboard** (`src/pages/Dashboard/`):
- `DashboardHeader`: "Max is online" status + heading
- `CreateJob` widget: Full chat interface (same component as hero)
- `HomeCapabilities`: Reused capabilities section

### App Shell (Layout)
```
Header (Logo "Max" + Notifications + Network + Connect/Disconnect)
  └─ Route content
BuildYourAgent ("How it works" collapsible accordion)
Footer (copyright + network + version + disclaimer link)
```

### Custom Hooks (`src/hooks/transactions/`)

| Hook | Purpose |
|------|---------|
| `useCreateJob` | Calls Facilitator `/prepare`, signs tx, polls on-chain for confirmation |
| `useSendTokensToBot` | Sends EGLD/ESDT to bot wallet, polls confirmation |
| `useGiveFeedback` | Calls `giveFeedbackSimple` on reputation registry SC |
| `useSubmitProof` | Proof submission to SC |

### MultiversX SDK Integration
SDK re-exports centralized in `src/lib/`:
- `sdkDapp`: `@multiversx/sdk-dapp` re-exports
- `sdkDappUI`: `@multiversx/sdk-dapp-ui` re-exports
- `sdkCore`: `@multiversx/sdk-core` re-exports

### Legacy Dashboard Widgets
Template-era widgets still exist in `src/pages/Dashboard/widgets/` but are not mounted in the current Dashboard: `PingPongAbi`, `PingPongRaw`, `PingPongService`, `BatchTransactions`, `SignMessage`, `NativeAuth`, `Transactions`, `Faucet`.

## Styles & Theme

### Design System
- **Font:** Satoshi (400/500/700) via woff2
- **Accent:** Teal `#23F7DD`
- **Dark theme only** (`mvx:dark-theme`), teal-tinted dark palette
- **Custom properties** defined in `src/styles/style.css`: `--bg-0` through `--bg-3`, `--border-0` through `--border-2`, `--text-0` through `--text-3`, `--accent`
- **Tailwind v4** with `@theme` directive in `src/styles/tailwind.css`, overrides zinc scale with teal-tinted variants

### Design Specs
- `DESIGN_PROMPT.md`: Visual design system (colors, typography, spacing, component patterns)
- `IMPLEMENTATION_SPEC.md`: Copy/UX spec (exact string replacements, naming conventions)

## Code Conventions

### Imports
Absolute imports from `src` base URL (configured in `tsconfig.json`). Import order: builtin → external → internal → parent → sibling → index, alphabetized.

### Formatting (Prettier)
Single quotes, no trailing commas, 2-space indent, semicolons required, arrow parens always.

### TypeScript
Strict mode. Interfaces use `PascalCase` with `Type` or `Props` suffix. Enums use `PascalCase` with `Enum` suffix. Unused vars prefixed with `_`.

### Component Patterns
- Functional components with hooks
- Style objects typed with `satisfies Record<string, string>`
- `data-testid` attributes for test selectors
- SVGs imported as React components via SVGR plugin

## Key Dependencies
- **React 18** + **TypeScript 5.2** + **Vite 4**
- **@multiversx/sdk-dapp** (v5.x): dApp framework, auth, transaction signing
- **@multiversx/sdk-dapp-ui** (v0.x): UI component library
- **@multiversx/sdk-core** (v15.x): core blockchain types
- **Tailwind CSS v4**: styling with `@theme` syntax
- **Motion** (v12.x): animations (Framer Motion)
- **Font Awesome 6**: icons
- **Axios**: HTTP client with native auth interceptors
- **react-markdown**: Markdown rendering in chat
- **react-google-recaptcha**: Faucet protection (devnet)
- **Deployed on Vercel**: SPA rewrites in `vercel.json`

## Passkey/WebAuthn Development
Requires HTTPS with valid certificates. Add `127.0.0.1 localhost.multiversx.com` to `/etc/hosts`, generate certs with `mkcert`, and configure `vite.config.ts` to use them. See README.md for full setup.

# currentDate
Today's date is 2026-02-26.
