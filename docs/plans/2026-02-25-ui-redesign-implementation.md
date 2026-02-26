# MultiversX Bot UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the public landing page and dashboard UI with polished premium dark aesthetic, simplified copy, faucet gating, and Mystery Box widget — while keeping all existing functionality intact.

**Architecture:** Pure visual + copy overhaul. No routing changes, no new SDK integration, no auth changes. The CreateJob widget keeps its 965-line logic; we restyle its JSX and hide config fields behind defaults. Mystery Box reuses the existing `sendTokensToBot` + `triggerSwapAndReturn` flow, extracted into its own widget. Faucet gets promoted to a conditional gate card.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Motion (framer-motion), FontAwesome, `@multiversx/sdk-dapp`

**Design Doc:** `docs/plans/2026-02-25-ui-redesign-design.md`

---

## Task 1: Update Tailwind Theme Tokens

**Files:**
- Modify: `src/styles/tailwind.css`
- Modify: `src/styles/style.css`

**Step 1: Update tailwind.css — remove background image refs, tighten surface tokens**

Replace the full `@theme` block in `src/styles/tailwind.css` with:

```css
@import 'tailwindcss';

@theme {
  --breakpoint-xs: 30rem;

  --background-color-primary: var(--mvx-bg-color-primary);
  --background-color-secondary: var(--mvx-bg-color-secondary);
  --background-color-tertiary: var(--mvx-hover-bg-primary);
  --background-color-accent: var(--mvx-bg-accent-color);
  --background-color-btn-primary: var(--mvx-button-bg-primary);
  --background-color-btn-secondary: var(--mvx-button-bg-secondary);
  --background-color-btn-tertiary: var(--mvx-button-bg-secondary);
  --background-color-btn-variant: var(--mvx-button-bg-variant);
  --background-color-btn-hover: var(--mvx-hover-color-primary);
  --background-color-logo-primary: var(--mvx-text-color-primary);
  --background-color-icon: var(--mvx-link-color);

  --color-primary: var(--mvx-text-color-primary);
  --color-secondary: var(--mvx-text-color-secondary);
  --color-tertiary: var(--mvx-text-color-tertiary);
  --color-accent: var(--mvx-text-accent-color);
  --color-teal: #23F7DD;
  --color-teal-dim: rgba(35, 247, 221, 0.5);
  --color-btn-primary: var(--mvx-button-text-primary);
  --color-btn-secondary: var(--mvx-button-text-secondary);
  --color-link: var(--mvx-link-color);
  --color-success: var(--mvx-success-color);
  --color-error: var(--mvx-error-color);

  --border-color-secondary: var(--mvx-border-color-secondary);
  --border-color-logo: var(--mvx-text-color-primary);
}
```

Key changes: removed `--background-image-dark-theme`, added `--color-teal` and `--color-teal-dim` for direct accent use.

**Step 2: Add glass surface utilities and scrollbar styles to style.css**

Append to `src/styles/style.css` (after the existing font-face declarations):

```css
/* Glass surfaces */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

.glass-card-teal {
  background: rgba(35, 247, 221, 0.03);
  border: 1px solid rgba(35, 247, 221, 0.12);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* Agent status breathing pulse */
@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
.animate-breathe {
  animation: breathe 2.5s ease-in-out infinite;
}
```

**Step 3: Remove DM Serif Display and Source Sans Pro imports**

In `index.html`, remove the Google Fonts `<link>` for `Source+Sans+Pro`. In `style.css` keep only Satoshi font-face declarations (already the primary font).

**Step 4: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds with no CSS errors.

**Step 5: Commit**

```bash
git add src/styles/tailwind.css src/styles/style.css index.html
git commit -m "feat: update tailwind theme tokens and add glass surface utilities"
```

---

## Task 2: Redesign Home Page — Hero

**Files:**
- Modify: `src/pages/Home/Home.tsx`
- Modify: `src/pages/Home/components/HomeHero/HomeHero.tsx`
- Modify: `src/pages/Home/components/HomeHero/homeHero.styles.ts`

**Step 1: Simplify Home.tsx — remove HomeConnect, add feature cards inline**

Replace `src/pages/Home/Home.tsx` with:

```tsx
import { Outlet } from 'react-router-dom';
import { HomeHero } from './components/HomeHero';

const features = [
  {
    title: 'Give it a job',
    description: 'Describe what you want done on-chain — swaps, transfers, contract calls.'
  },
  {
    title: 'It decides & executes',
    description: 'The agent autonomously picks the best path and executes transactions.'
  },
  {
    title: 'You get results',
    description: 'Tokens, transactions, proof of work — all on-chain, all verifiable.'
  }
];

const styles = {
  container: 'flex flex-col items-center justify-center gap-16 bg-transparent px-4 pb-16 pt-8 max-w-5xl w-full mx-auto',
  featuresGrid: 'grid grid-cols-1 md:grid-cols-3 gap-6 w-full',
  featureCard: 'glass-card p-6 flex flex-col gap-3',
  featureTitle: 'text-primary text-lg font-bold',
  featureDescription: 'text-secondary text-sm leading-relaxed'
} satisfies Record<string, string>;

export const Home = () => (
  <div className={styles.container}>
    <HomeHero />

    <div className={styles.featuresGrid}>
      {features.map((feature) => (
        <div key={feature.title} className={styles.featureCard}>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureDescription}>{feature.description}</p>
        </div>
      ))}
    </div>

    <Outlet />
  </div>
);
```

**Step 2: Rewrite HomeHero — clean centered hero with teal accent**

Replace `src/pages/Home/components/HomeHero/HomeHero.tsx` with:

```tsx
import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components/Button';
import { RouteNamesEnum } from 'localConstants';

const styles = {
  container: 'flex flex-col items-center justify-center w-full min-h-[70vh] py-20 gap-8 text-center',
  eyebrow: 'text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-[#23F7DD]',
  title: 'text-primary text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight',
  subtitle: 'text-secondary text-lg lg:text-xl max-w-lg leading-relaxed'
} satisfies Record<string, string>;

export const HomeHero = () => {
  const navigate = useNavigate();

  const handleLogIn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.unlock);
  };

  return (
    <div className={styles.container}>
      <p className={styles.eyebrow}>AI Agent on MultiversX</p>
      <h1 className={styles.title}>MultiversX Bot</h1>
      <p className={styles.subtitle}>
        An autonomous agent that executes on-chain.
      </p>
      <Button onClick={handleLogIn}>Connect Wallet</Button>
    </div>
  );
};
```

**Step 3: Clear homeHero.styles.ts (no longer needed, but keep file to avoid import issues)**

Replace contents of `src/pages/Home/components/HomeHero/homeHero.styles.ts` with:

```typescript
export default {} satisfies Record<string, string>;
```

**Step 4: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds. Home page renders hero + 3 feature cards + footer.

**Step 5: Commit**

```bash
git add src/pages/Home/Home.tsx src/pages/Home/components/HomeHero/HomeHero.tsx src/pages/Home/components/HomeHero/homeHero.styles.ts
git commit -m "feat: redesign home page with clean hero and feature cards"
```

---

## Task 3: Redesign Dashboard Header

**Files:**
- Modify: `src/pages/Dashboard/components/DashboardHeader/DashboardHeader.tsx`

**Step 1: Replace header with new copy and breathing status dot**

Replace `src/pages/Dashboard/components/DashboardHeader/DashboardHeader.tsx` with:

```tsx
const styles = {
  container: 'flex flex-col pt-0 pb-6 lg:pt-0 lg:pb-8 justify-center items-center gap-2 self-stretch',
  statusLine: 'flex items-center gap-2',
  statusDot: 'w-2 h-2 bg-[#23F7DD] rounded-full animate-breathe',
  statusText: 'text-[#23F7DD] text-xs font-mono uppercase tracking-widest',
  title: 'text-primary text-center text-3xl xs:text-5xl lg:text-6xl font-medium transition-all duration-300'
} satisfies Record<string, string>;

export const DashboardHeader = () => (
  <div className={styles.container}>
    <div className={styles.statusLine}>
      <span className={styles.statusDot} />
      <span className={styles.statusText}>Agent Online</span>
    </div>
    <h1 className={styles.title}>What should I do?</h1>
  </div>
);
```

**Step 2: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/Dashboard/components/DashboardHeader/DashboardHeader.tsx
git commit -m "feat: redesign dashboard header with status dot and new copy"
```

---

## Task 4: Simplify Left Panel — Account Section

**Files:**
- Modify: `src/pages/Dashboard/components/LeftPanel/components/Account/Account.tsx`
- Modify: `src/pages/Dashboard/components/LeftPanel/components/Account/account.styles.ts`

**Step 1: Replace Account with flat list — no accordion, no "Connected account details" heading**

Replace `src/pages/Dashboard/components/LeftPanel/components/Account/Account.tsx` with:

```tsx
import { faLayerGroup, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactNode } from 'react';
import { ReactComponent as XLogo } from 'assets/img/x-logo.svg';
import { Label } from 'components/Label';
import { FormatAmount, MvxTrim, useGetAccount } from 'lib';
import { DataTestIdsEnum } from 'localConstants';
import styles from './account.styles';

interface AccountDetailType {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export const Account = () => {
  const { address, balance, shard } = useGetAccount();

  const accountDetails: AccountDetailType[] = [
    {
      icon: <FontAwesomeIcon icon={faWallet} className={styles.icon} />,
      label: 'Address',
      value: (
        <MvxTrim
          dataTestId='accountAddress'
          text={address}
          className='w-max'
        />
      )
    },
    {
      icon: <FontAwesomeIcon icon={faLayerGroup} className={styles.icon} />,
      label: 'Shard',
      value: <span data-testid={DataTestIdsEnum.addressShard}>{shard}</span>
    },
    {
      icon: <XLogo className={styles.xLogo} />,
      label: 'Balance',
      value: (
        <FormatAmount
          value={balance}
          data-testid='balance'
          decimalClass='opacity-70'
          labelClass='opacity-70'
          showLabel={true}
        />
      )
    }
  ];

  return (
    <div className={styles.container}>
      {accountDetails.map((detail, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.iconBox}>{detail.icon}</div>
          <div className={styles.text}>
            <Label>{detail.label}</Label>
            <span className={styles.value}>{detail.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Step 2: Update account.styles.ts**

Replace `src/pages/Dashboard/components/LeftPanel/components/Account/account.styles.ts` with:

```typescript
export default {
  container: 'flex flex-col',
  row: 'flex h-14 gap-2 items-center',
  iconBox: 'min-w-10 min-h-10 max-h-10 max-w-10 flex items-center justify-center text-tertiary border border-secondary rounded-lg overflow-hidden p-1.5 transition-all duration-200 ease-out',
  icon: 'w-6 h-6',
  xLogo: 'fill-primary w-6 h-6 transition-all duration-200 ease-out',
  text: 'truncate flex flex-col max-w-[80%]',
  value: 'text-primary text-base transition-all duration-200 ease-out'
} satisfies Record<string, string>;
```

**Step 3: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/pages/Dashboard/components/LeftPanel/components/Account/Account.tsx src/pages/Dashboard/components/LeftPanel/components/Account/account.styles.ts
git commit -m "feat: simplify account section — flat list, no accordion"
```

---

## Task 5: Add Mystery Box to Side Menu

**Files:**
- Modify: `src/pages/Dashboard/components/LeftPanel/components/SideMenu/SideMenu.tsx`
- Modify: `src/pages/Dashboard/dashboard.types.ts`

**Step 1: Add `mysteryBox` to ItemsIdentifiersEnum**

In `src/pages/Dashboard/dashboard.types.ts`, add:

```typescript
export enum ItemsIdentifiersEnum {
  pingPongRaw = 'ping-pong-raw',
  pingPongAbi = 'ping-pong-abi',
  pingPongService = 'ping-pong-service',
  signMessage = 'sign-message',
  nativeAuth = 'native-auth',
  batchTransactions = 'batch-transactions',
  transactionsAll = 'transactions-all',
  transactionsPingPong = 'transactions-ping-pong',
  createJob = 'create-job',
  mysteryBox = 'mystery-box'
}
```

**Step 2: Add Mystery Box to SideMenu**

In `src/pages/Dashboard/components/LeftPanel/components/SideMenu/SideMenu.tsx`, add the menu item:

```typescript
import { faGift, faRobot } from '@fortawesome/free-solid-svg-icons';
```

And update the `menuItems` array:

```typescript
const menuItems: MenuItemsType[] = [
  {
    title: 'Create Job',
    icon: faRobot,
    id: ItemsIdentifiersEnum.createJob
  },
  {
    title: 'Mystery Box',
    icon: faGift,
    id: ItemsIdentifiersEnum.mysteryBox
  }
];
```

**Step 3: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/pages/Dashboard/dashboard.types.ts src/pages/Dashboard/components/LeftPanel/components/SideMenu/SideMenu.tsx
git commit -m "feat: add mystery box to side menu navigation"
```

---

## Task 6: Restyle CreateJob Widget — Hide Config, Update Copy

**Files:**
- Modify: `src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx`

This is the most delicate task — we're restyling the 965-line component without breaking any logic. Changes are purely in the JSX return block.

**Step 1: Hide config fields — replace the statsGrid with a cost label**

Find the `<div className={styles.statsGrid}>` block (lines ~597-657) containing the 5 input fields (Agent Nonce, Service ID, Payment Token, Token Nonce, Amount). Replace the entire `statsGrid` div with:

```tsx
        <div className='px-8 py-4 flex items-center gap-2 text-white/40 text-xs font-mono'>
          <span>Job cost:</span>
          <span className='text-white font-bold'>0.05 EGLD</span>
        </div>
```

The state variables (`agentNonce`, `serviceId`, `token`, `nonce`, `amount`) and their defaults remain untouched — they're still used by `handleCreateJob()`.

**Step 2: Update header copy**

In the header section (lines ~520-595), make these changes:

- Replace `"Agent Orchestrator"` with `"Create Job"` (the h2 text)
- Remove the `<p>` with `"Core Configuration Matrix"`
- Replace `"INITIALIZE JOB"` button text with `"Create Job"`
- Replace `"MARK AS FINISHED"` button text with `"End Job"`
- Replace `"SEND TO BOT"` button text with `"Send to Bot"`
- Replace `"EGLD amount to send to bot:"` label with `"EGLD to trade:"`

**Step 3: Update idle state copy**

In the idle state section (lines ~853-871), replace:

- `"System Inactive"` → remove this heading entirely
- `"Initialize a job configuration to establish a secure uplink with the AI agent."` → `"Create a job to start chatting with the agent."`

**Step 4: Update chat header**

- Remove the `"Agent Chat"` heading text (the `<h3>`)
- Keep the job ID display and status badge

**Step 5: Remove inline `<style>` block**

Remove the `<style>` tag at lines 956-961 (scrollbar CSS). This is now handled by the `.custom-scrollbar` class in `style.css` from Task 1.

**Step 6: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds. All job creation, chat, polling, feedback logic works exactly as before.

**Step 7: Commit**

```bash
git add src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx
git commit -m "feat: restyle create job widget — hide config, update copy"
```

---

## Task 7: Create Mystery Box Widget

**Files:**
- Create: `src/pages/Dashboard/widgets/MysteryBox/MysteryBox.tsx`
- Create: `src/pages/Dashboard/widgets/MysteryBox/index.ts`
- Modify: `src/pages/Dashboard/widgets/index.ts`

**Step 1: Create MysteryBox component**

Create `src/pages/Dashboard/widgets/MysteryBox/MysteryBox.tsx`:

```tsx
import {
  faGift,
  faSpinner,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { TASK_SERVICE_API_URL } from 'config';
import { useCreateJob, useSendTokensToBot } from 'hooks/transactions';
import { useGetAccount, useGetLoginInfo, parseAmount } from 'lib';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';

type MysteryBoxStatus = 'idle' | 'creating' | 'sending' | 'swapping' | 'complete' | 'failed';

interface SwapResult {
  content: string;
}

const parseAgentResponse = (val: unknown): string => {
  if (typeof val !== 'string') return JSON.stringify(val, null, 2);
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'string') return parseAgentResponse(parsed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return val;
  }
};

export const MysteryBox = () => {
  const [status, setStatus] = useState<MysteryBoxStatus>('idle');
  const [result, setResult] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address: userAddress } = useGetAccount();
  const { createJob } = useCreateJob();
  const { sendTokensToBot } = useSendTokensToBot();
  const { tokenLogin } = useGetLoginInfo();

  const handleOpenMysteryBox = async () => {
    if (!userAddress) return;

    setStatus('creating');
    setResult(null);
    setError(null);

    try {
      // 1. Create a job for the mystery box
      const { jobId } = await createJob(110, '1', {
        token: 'EGLD',
        nonce: 0,
        amount: '1'
      });

      // 2. Send 1 EGLD to the bot
      setStatus('sending');
      await sendTokensToBot({
        token: 'EGLD',
        nonce: 0,
        amount: '1'
      });

      // 3. Trigger the swap
      setStatus('swapping');
      const amountAtoms = parseAmount('1');
      const swapPrompt = `The user at address ${userAddress} just sent ${amountAtoms} atoms of EGLD to the bot. Use the mx-swap-and-return skill:

1. Save this amount: user address = ${userAddress}, received token = EGLD, amount = ${amountAtoms} atoms.
2. Call the DEX metadata API (GET the same API base URL as this task service + /dex/metadata, e.g. https://mx-bot-api.elrond.ro/dex/metadata) to get the list of available tradeable tokens.
3. From the response, pick between 1 and 4 output tokens with reasoning (e.g. liquidity, diversity; exclude the input token). State briefly why you chose each.
4. Run run_swap_and_return.py with: --user-address ${userAddress} --received-token EGLD --amount ${amountAtoms} --output-tokens <your selected tokens comma-separated>. Use default bot PEM.
5. The user at ${userAddress} must receive the swapped tokens.
6. In your final report you MUST include: (a) your reasoning for choosing each output token (why you picked them), and (b) a clear line telling the user to check their wallet for their newly swapped tokens. Report which tokens and amounts were sent.`;

      const { data: initData } = await axios.post(
        `${TASK_SERVICE_API_URL}/start-task`,
        { jobId, prompt: swapPrompt },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      const taskId = initData.taskId;

      // 4. Poll for result
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60;

      while (!completed && attempts < maxAttempts) {
        attempts++;
        const { data: task } = await axios.get(
          `${TASK_SERVICE_API_URL}/tasks/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
            }
          }
        );

        if (task.status === 'completed') {
          setResult({ content: parseAgentResponse(task.result) });
          setStatus('complete');
          completed = true;
        } else if (task.status === 'failed') {
          setError(task.error || 'Swap failed');
          setStatus('failed');
          completed = true;
        }

        if (!completed) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (!completed) {
        setError('Swap timed out — the task took too long.');
        setStatus('failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(errorMsg);
      setStatus('failed');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  const isProcessing = status === 'creating' || status === 'sending' || status === 'swapping';

  const statusMessages: Record<string, string> = {
    creating: 'Creating job...',
    sending: 'Sending 1 EGLD to the agent...',
    swapping: 'Agent is choosing tokens and swapping...'
  };

  return (
    <div id={ItemsIdentifiersEnum.mysteryBox} className='flex flex-col gap-4'>
      <p className='text-sm text-secondary leading-relaxed'>
        Let the agent trade 1 EGLD on xExchange. See what comes back.
      </p>

      <AnimatePresence mode='wait'>
        {status === 'idle' && (
          <motion.div
            key='idle'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={handleOpenMysteryBox}
              disabled={!userAddress}
              className='flex items-center gap-2 px-6 py-3 bg-[#23F7DD] hover:bg-[#23F7DD]/90 text-black font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50'
            >
              <FontAwesomeIcon icon={faGift} />
              Open Mystery Box
            </button>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key='processing'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='flex items-center gap-3 text-[#23F7DD]'
          >
            <FontAwesomeIcon icon={faSpinner} spin />
            <span className='text-sm font-mono'>
              {statusMessages[status]}
            </span>
          </motion.div>
        )}

        {status === 'complete' && result && (
          <motion.div
            key='complete'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex flex-col gap-4'
          >
            <div className='flex items-center gap-2 text-[#23F7DD] text-sm font-bold'>
              <FontAwesomeIcon icon={faCheckCircle} />
              Mystery Box opened!
            </div>
            <div className='glass-card p-4 text-sm text-primary whitespace-pre-wrap leading-relaxed'>
              {result.content}
            </div>
            <button
              onClick={handleReset}
              className='self-start flex items-center gap-2 px-6 py-3 bg-[#23F7DD] hover:bg-[#23F7DD]/90 text-black font-bold rounded-xl transition-all active:scale-95'
            >
              <FontAwesomeIcon icon={faGift} />
              Open Another
            </button>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            key='failed'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex flex-col gap-3'
          >
            <div className='flex items-center gap-2 text-red-400 text-sm'>
              <FontAwesomeIcon icon={faTimesCircle} />
              {error}
            </div>
            <button
              onClick={handleReset}
              className='self-start px-4 py-2 border border-white/20 text-white/80 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors'
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

**Step 2: Create barrel export**

Create `src/pages/Dashboard/widgets/MysteryBox/index.ts`:

```typescript
export * from './MysteryBox';
```

**Step 3: Update widgets index**

Replace `src/pages/Dashboard/widgets/index.ts` with:

```typescript
export * from './CreateJob/CreateJob';
export * from './Faucet';
export * from './MysteryBox';
```

**Step 4: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/pages/Dashboard/widgets/MysteryBox/MysteryBox.tsx src/pages/Dashboard/widgets/MysteryBox/index.ts src/pages/Dashboard/widgets/index.ts
git commit -m "feat: create mystery box widget"
```

---

## Task 8: Add Faucet Gate + Wire Mystery Box into Dashboard

**Files:**
- Modify: `src/pages/Dashboard/Dashboard.tsx`
- Modify: `src/pages/Dashboard/dashboard.styles.ts`

**Step 1: Add faucet gate and Mystery Box widget to Dashboard**

Replace `src/pages/Dashboard/Dashboard.tsx` with:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from 'components/Button';
import { Loader } from 'components/Loader';
import { environment, EXTRAS_API_URL } from 'config';
import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';
import { useGetAccount, useGetLoginInfo } from 'lib';
import { WidgetType } from 'types/widget.types';
import { DashboardHeader, Widget } from './components';
import styles from './dashboard.styles';
import { CreateJob, Faucet, MysteryBox } from './widgets';

const SITE_KEY = '6LeOnY0fAAAAABCn_KfmqldzSsOEOP1JHvdfyYGd';
const MIN_BALANCE_THRESHOLD = '50000000000000000'; // 0.05 EGLD in atoms

const isBalanceSufficient = (balance: string): boolean => {
  try {
    return BigInt(balance) >= BigInt(MIN_BALANCE_THRESHOLD);
  } catch {
    return false;
  }
};

const defaultWidgets: WidgetType[] = [
  {
    title: 'Create Job',
    widget: CreateJob,
    description: 'Describe a task and the agent will execute it on-chain',
    reference: '/create-job'
  },
  {
    title: 'Mystery Box',
    widget: MysteryBox,
    description: 'Let the agent trade 1 EGLD on xExchange. See what comes back.',
    reference: '/mystery-box'
  }
];

export const Dashboard = () => {
  const { balance } = useGetAccount();
  const isDevnet = environment === EnvironmentsEnum.devnet;
  const hasFunds = isBalanceSufficient(balance);
  const [faucetDone, setFaucetDone] = useState(false);

  // Faucet gate state
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [requestDisabled, setRequestDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const { address } = useGetAccount();
  const { tokenLogin } = useGetLoginInfo();

  const showFaucetGate = isDevnet && !hasFunds && !faucetDone;

  const handleReCaptchaChange = useCallback((value: string | null) => {
    setRequestDisabled(!value);
    setCaptcha(value);
  }, []);

  const handleRequestClick = async () => {
    if (!captcha || !address) return;

    try {
      setIsLoading(true);
      setFaucetMessage(null);

      await axios.post(
        `${EXTRAS_API_URL}/faucet`,
        { captcha },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      setFaucetMessage({
        text: 'Tokens requested! They should arrive shortly.',
        isError: false
      });
      setFaucetDone(true);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to request tokens. You can request once every 24 hours.';
      setFaucetMessage({ text: errorMsg, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const activeWidgets = useMemo(() => {
    const widgets = [...defaultWidgets];

    if (isDevnet) {
      widgets.push({
        title: 'Devnet Faucet',
        widget: Faucet,
        description: 'Request 5 xEGLD tokens for testing',
        reference: 'https://devnet-wallet.multiversx.com/faucet'
      });
    }

    return widgets;
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className='flex flex-col w-full min-h-screen'>
      <div className='flex flex-col gap-2 items-center flex-1 w-full overflow-auto pt-4 pb-4 lg:pt-8 lg:pb-12'>
        <DashboardHeader />

        {showFaucetGate && (
          <div className='w-full max-w-[1600px] px-4 md:px-10 mb-6'>
            <div className='glass-card-teal p-6 lg:p-8 flex flex-col gap-4'>
              <h2 className='text-primary text-xl font-bold'>
                You need xEGLD to get started
              </h2>
              <p className='text-secondary text-sm'>
                Request 5 xEGLD from the devnet faucet to try the agent.
              </p>

              {faucetMessage && (
                <div
                  className={`text-sm ${
                    faucetMessage.isError ? 'text-red-400' : 'text-[#23F7DD]'
                  }`}
                >
                  {faucetMessage.text}
                </div>
              )}

              {(!faucetMessage || faucetMessage.isError) && (
                <ReCAPTCHA
                  sitekey={SITE_KEY}
                  onChange={handleReCaptchaChange}
                  theme='dark'
                />
              )}

              {isLoading ? (
                <Loader />
              ) : (
                <Button
                  disabled={
                    requestDisabled ||
                    isLoading ||
                    (faucetMessage !== null && !faucetMessage.isError) ||
                    !address
                  }
                  onClick={handleRequestClick}
                  className='w-full xs:w-auto'
                >
                  Request xEGLD
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={styles.dashboardWidgets}>
          {activeWidgets.map((element: WidgetType) => (
            <Widget key={element.title} {...element} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Remove background image from dashboard — update styles**

The current Dashboard.tsx inline style `backgroundImage: 'url(/background.svg)'` is removed in the rewrite above. No change needed to `dashboard.styles.ts`.

**Step 3: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds. Dashboard shows faucet gate when balance is low, then Create Job + Mystery Box + Faucet widgets.

**Step 4: Commit**

```bash
git add src/pages/Dashboard/Dashboard.tsx
git commit -m "feat: add faucet gate and mystery box to dashboard"
```

---

## Task 9: Update Card Component Styling

**Files:**
- Modify: `src/components/Card/Card.tsx`

**Step 1: Update Card to use glass surface styling**

Replace `src/components/Card/Card.tsx` with:

```tsx
import { PropsWithChildren } from 'react';
import { WithClassnameType } from 'types';

const styles = {
  container: 'glass-card flex flex-col gap-4 flex-1 p-6 lg:p-10 justify-center transition-all duration-200 ease-out',
  title: 'flex justify-between items-center text-2xl font-medium text-primary transition-all duration-200 ease-out',
  description: 'text-secondary mb-6 text-lg font-medium transition-all duration-200 ease-out'
} satisfies Record<string, string>;

interface CardPropsType extends PropsWithChildren, WithClassnameType {
  title: string;
  description?: string;
  reference: string;
  anchor?: string;
}

export const Card = ({
  title,
  children,
  description,
  anchor,
  'data-testid': dataTestId
}: CardPropsType) => (
  <div id={anchor} className={styles.container} data-testid={dataTestId}>
    <h2 className={styles.title}>{title}</h2>
    {description && <p className={styles.description}>{description}</p>}
    {children}
  </div>
);
```

**Step 2: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/Card/Card.tsx
git commit -m "feat: update card component to glass surface styling"
```

---

## Task 10: Update Header and Footer

**Files:**
- Modify: `src/components/Header/Header.tsx`
- Modify: `src/components/Header/header.styles.ts`
- Modify: `src/components/Footer/Footer.tsx`

**Step 1: Update Footer — remove heart emoji, simplify**

Replace the Footer's return JSX. Remove the "Made with heart" line. Keep disclaimer link, network/version, and a clean copyright line:

In `src/components/Footer/Footer.tsx`, replace the `"Made with"` block:

```tsx
        <div className={styles.footerDescription}>
          <span>&copy; MultiversX {currentYear}</span>
        </div>
```

And remove the `faHeart` import and `footerHeartIcon` style reference.

**Step 2: Verify**

Run: `pnpm build-devnet`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/components/Footer/Footer.tsx
git commit -m "feat: simplify footer copy"
```

---

## Task 11: Clean Up Unused Files

**Files:**
- Delete: `src/pages/Home/components/HomeConnect/` (entire directory — no longer imported)
- Verify no imports reference deleted files

**Step 1: Remove HomeConnect directory**

```bash
rm -rf src/pages/Home/components/HomeConnect/
```

**Step 2: Verify no broken imports**

Run: `pnpm build-devnet`
Expected: Build succeeds with no missing module errors.

**Step 3: Commit**

```bash
git add -A src/pages/Home/components/HomeConnect/
git commit -m "chore: remove unused HomeConnect components"
```

---

## Task 12: Final Verification

**Step 1: Full build**

Run: `pnpm build-devnet`
Expected: Clean build, no errors, no warnings.

**Step 2: Dev server smoke test**

Run: `pnpm start-devnet`

Verify:
- Home page: centered hero with "AI Agent on MultiversX" eyebrow, "MultiversX Bot" title, subtitle, Connect Wallet button, 3 feature cards below
- Connect wallet flow works
- Dashboard: breathing teal dot + "Agent Online" + "What should I do?"
- If empty wallet on devnet: faucet gate card appears at top
- Create Job widget: no config matrix visible, "Create Job" button, chat works
- Mystery Box widget: card with "Open Mystery Box" button
- Sidebar: flat account info (address, shard, balance), Create Job + Mystery Box nav items
- Footer: disclaimer, network, copyright

**Step 3: Lint**

Run: `pnpm lint`
Fix any lint errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete UI and copy redesign"
```
