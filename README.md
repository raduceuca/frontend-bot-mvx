# Max: MultiversX Agent

An autonomous AI agent that lives on-chain. Max has its own wallet and executes blockchain actions (token swaps, transfers, smart contract interactions) on your behalf. You just tell it what to do.

**Live on devnet:** [maxonmvx.xyz](https://maxonmvx.xyz)

---

## What is Max?

Max is an AI agent built on the [MultiversX](https://multiversx.com) blockchain. You pay a small fee (0.05 EGLD) to open a job, then chat with Max in plain English. Max interprets your intent and executes real on-chain transactions. No manual signing, no clicking through swap interfaces.

### How it works

1. **Connect your wallet:** MetaMask Snap, xPortal, Ledger, Passkey, or Web Wallet
2. **Start a job:** Sign a 0.05 EGLD transaction to the on-chain reputation registry
3. **Chat with Max:** Tell it what you want in plain language
4. **Max executes:** It reads market data, picks tokens, sends transactions, interacts with smart contracts
5. **Rate your experience:** Your feedback is recorded on-chain

### Mystery Box

A one-click demo feature: send 1 EGLD, and Max crawls xExchange DEX, picks trending tokens, splits your EGLD across them, and sends the tokens back to your wallet.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5.2 |
| Build | Vite 4, deployed on Vercel |
| Styling | Tailwind CSS v4, Satoshi font, teal-accent dark theme |
| Blockchain | @multiversx/sdk-dapp v5, sdk-core v15, sdk-dapp-ui v0.x |
| Animations | Motion (Framer Motion v12) |
| Icons | Font Awesome 6 |
| Chat rendering | react-markdown |
| Auth | MultiversX native auth (signed JWT bearer tokens) |

---

## Getting Started

### Requirements

- Node.js 16.20.0+
- pnpm 8.19.4+

### Install

```bash
pnpm install
```

### Development

```bash
pnpm start-devnet     # HTTPS dev server on port 3003 (devnet)
pnpm start-testnet    # testnet
pnpm start-mainnet    # mainnet
```

### Build

```bash
pnpm build-devnet     # TypeScript check + production build (devnet)
pnpm build-testnet
pnpm build-mainnet
```

Build output goes to `/build`. Each script copies the environment-specific config before building.

### Lint

```bash
pnpm lint             # ESLint with auto-fix
```

### Test

```bash
pnpm test                    # Jest unit/integration tests
pnpm run-playwright-test     # Playwright E2E (headless)
pnpm run-playwright-test-ui  # Playwright E2E (UI mode)
```

---

## Architecture

### Multi-Environment Configuration

Three config files in `src/config/` (`config.devnet.ts`, `config.testnet.ts`, `config.mainnet.ts`) extend a shared config with environment-specific values (API URL, contract address, environment enum). Build scripts copy the active config to `src/config/index.ts`. **Do not edit that file directly.**

### Key Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Task Service API | `mx-bot-api.elrond.ro` | AI agent prompts and task polling |
| Facilitator API | `x402-facilitator.elrond.ro` | Job creation and payment preparation |
| TaskClaw API | `devnet-taskclaw-api.multiversx.com` | Task management |

### Project Structure

```
src/
├── assets/            # SVG icons, images
├── components/        # Shared components (Header, Footer, Layout, BuildYourAgent, Logo)
├── config/            # Environment configs (devnet/testnet/mainnet)
├── hooks/             # Custom hooks (useCreateJob, useSendTokensToBot, useGiveFeedback)
├── lib/               # MultiversX SDK re-exports (sdkDapp, sdkDappUI, sdkCore)
├── localConstants/    # Route enums, local constants
├── pages/
│   ├── Home/          # Landing page (HomeHero, HomeCapabilities, HomeConnect)
│   ├── Dashboard/     # Authenticated dashboard with CreateJob chat widget
│   ├── Disclaimer/    # Legal disclaimer
│   └── Unlock/        # Wallet connection page
├── routes/            # React Router v6 route definitions
├── styles/            # Global CSS (style.css) + Tailwind config (tailwind.css)
└── wrappers/          # Context providers (BatchTransactions, AxiosInterceptors, AuthRedirect)
```

### Core Component: CreateJob

`src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx` is the heart of the product: a chat interface and job management system with a state machine.

```
idle → creating (sign tx) → ready (chat active) → prompting → rating → idle
                                                 → sending_tokens → swapping → rating → idle
```

Features:
- Full chat UI with Markdown rendering
- Transaction tracking with activity bar
- Quick action chips (Mystery Box, faucet, fun prompts)
- Session persistence via `sessionStorage`
- On-chain feedback/rating system

### Wallet Support

- MetaMask Snap (browser extension)
- Passkey / WebAuthn
- xPortal (mobile)
- Ledger (hardware)
- MultiversX Web Wallet

### Design System

- **Theme:** Dark only (`mvx:dark-theme`) with teal accent (`#23F7DD`)
- **Font:** Satoshi (400/500/700 weights)
- **CSS:** Custom properties in `src/styles/style.css`, Tailwind v4 `@theme` overrides in `tailwind.css`
- **Design specs:** `DESIGN_PROMPT.md` (visual system) and `IMPLEMENTATION_SPEC.md` (copy/UX)

---

## Passkey / WebAuthn Setup

WebAuthn requires HTTPS with valid certificates for local development.

### 1. Configure hosts

```bash
# Add to /etc/hosts:
127.0.0.1    localhost.multiversx.com
```

### 2. Generate certificates

```bash
brew install mkcert
mkcert -install
mkcert localhost.multiversx.com localhost 127.0.0.1 ::1
```

### 3. Configure Vite

Update `vite.config.ts` to use the generated certificate files instead of `@vitejs/plugin-basic-ssl`:

```typescript
import fs from 'fs';

const https = {
  key: fs.readFileSync('./certificates/localhost.multiversx.com-key.pem'),
  cert: fs.readFileSync('./certificates/localhost.multiversx.com.pem')
};

export default defineConfig({
  server: {
    port: 443,
    strictPort: true,
    https,
    host: true
  }
});
```

### 4. Start development

```bash
pnpm start-devnet --force
```

Open [https://localhost.multiversx.com](https://localhost.multiversx.com).

---

## OpenClaw Ecosystem

Max is built on the OpenClaw framework. To build your own agent:

1. **Create skills:** [multiversx-openclaw-skills](https://github.com/multiversx/multiversx-openclaw-skills)
2. **Deploy the bot:** [moltbot-starter-kit](https://github.com/AdrianMolt/moltbot-starter-kit)
3. **Set up payments:** [mx-8004](https://github.com/AdrianMolt/mx-8004) (x402 integration)
4. **Register your agent:** On the MultiversX agent registry

---

## License

GPL-3.0-or-later
