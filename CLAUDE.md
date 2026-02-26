# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MultiversX dApp template (frontend-bot-mvx) — a React/TypeScript blockchain dApp built on the MultiversX ecosystem. Provides authentication, transaction signing, batch transactions, and a widget-based dashboard using `@multiversx/sdk-dapp` and `@multiversx/sdk-dapp-ui`.

## Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm start-devnet         # Dev server (devnet) — HTTPS on port 3003
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
Jest tests live alongside source in `src/**/tests/` directories, matching `*.test.ts(x)` or `*.spec.ts(x)`. Playwright E2E tests live in `/tests` at project root.

## Architecture

### Multi-Environment Config
Three environment configs in `src/config/`: `config.devnet.ts`, `config.testnet.ts`, `config.mainnet.ts`. They all re-export shared config from `sharedConfig.ts` and add environment-specific values (API URL, contract address, environment enum). **Do not edit `src/config/index.ts` directly** — it gets overwritten by build/start scripts.

### Routing
Routes defined in `src/routes/routes.ts` using React Router v6. Route names are enums in `src/localConstants/routes/routeNames.enums.ts`. Routes support `authenticatedRoute: true` for gated pages and nested `children` routes.

Key routes:
- `/` → Home (with `/unlock` child)
- `/dashboard` → Dashboard (authenticated)
- `/disclaimer` → Disclaimer

### Wrappers & Providers
`src/wrappers/` contains context providers and HOCs that wrap the app:
- **BatchTransactionsContextProvider** — manages batch transaction state, consumed via `useBatchTransactionContext()` hook
- **AxiosInterceptors** — HTTP request/response interceptor setup
- **AuthRedirectWrapper** — authentication redirect logic
- **Layout** — app shell wrapping all pages

### Dashboard Widget System
Dashboard (`src/pages/Dashboard/`) uses a widget architecture. Widgets are defined in `src/pages/Dashboard/widgets/` and exported through a barrel index. Some widgets are conditional on environment (e.g., Faucet is devnet-only).

### MultiversX SDK Integration
SDK re-exports are centralized in `src/lib/`:
- `sdkDapp` — `@multiversx/sdk-dapp` re-exports
- `sdkDappUI` — `@multiversx/sdk-dapp-ui` re-exports
- `sdkCore` — `@multiversx/sdk-core` re-exports

### Theme System
Three built-in themes: TealLab (`mvx:dark-theme`), VibeMode (`mvx:vibe-theme`), BrightLight (`mvx:light-theme`). Theme is applied via `data-mvx-theme` attribute on the document root. CSS variables defined in `src/styles/tailwind.css`. Theme management handled by `useHandleThemeManagement` hook.

## Code Conventions

### Imports
Absolute imports from `src` base URL (configured in `tsconfig.json`). Import order enforced by ESLint: builtin → external → internal → parent → sibling → index, alphabetized case-insensitively, no blank lines between groups.

### Formatting (Prettier)
Single quotes, no trailing commas, 2-space indent, semicolons required, arrow parens always.

### TypeScript
Strict mode. Interfaces use `PascalCase` with `Type` or `Props` suffix (e.g., `CardPropsType`). Enums use `PascalCase` with `Enum` suffix. Unused vars prefixed with `_` are allowed.

### Component Patterns
- Functional components with hooks
- Style objects typed with `satisfies Record<string, string>`
- `data-testid` attributes for test selectors
- SVGs imported as React components via SVGR plugin (`import { ReactComponent as Icon } from 'assets/...'`)

## Key Dependencies
- **@multiversx/sdk-dapp** (v5.x) — dApp framework, auth, transaction signing
- **@multiversx/sdk-dapp-ui** (v0.x) — UI component library
- **@multiversx/sdk-core** (v15.x) — core blockchain types and utilities
- **Motion** (v12.x) + **GSAP** (v3.x) — animations
- **Axios** — HTTP client with interceptors for native auth

## Passkey/WebAuthn Development
Requires HTTPS with valid certificates. Add `127.0.0.1 localhost.multiversx.com` to `/etc/hosts`, generate certs with `mkcert`, and configure `vite.config.ts` to use them. See README.md for full setup.
