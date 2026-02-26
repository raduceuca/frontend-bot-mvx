# Rate Previous Sessions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to rate completed/failed previous sessions via an inline star picker + confirmation modal, and fix the status bug where all sessions display as "New".

**Architecture:** Extend `PreviousSessions.tsx` with per-row interactive rating state. Extract a `RatingConfirmModal` component. The `useGiveFeedback` hook is already available — wire it into PreviousSessions via an `onRateSession` callback from CreateJob (which already has the hook). After submission, optimistic update + background refetch.

**Tech Stack:** React 18, TypeScript, Tailwind v4, Motion (framer-motion), FontAwesome, `useGiveFeedback` hook (on-chain SC call).

---

### Task 1: Investigate and fix status bug

The API may return lowercase status values or different casing than the `SessionStatus` type expects (`New`, `Pending`, `Completed`, `Failed`). The fallback `statusStyles[session.status] ?? statusStyles.New` silently masks mismatches.

**Files:**
- Modify: `src/hooks/useGetPreviousSessions.ts`

**Step 1: Add status normalization to the hook**

Add a normalizer function that maps API values to the `SessionStatus` type. Place it above the hook:

```typescript
const normalizeStatus = (raw: string): SessionStatus => {
  const map: Record<string, SessionStatus> = {
    new: 'New',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed'
  };
  return map[raw.toLowerCase()] ?? 'New';
};
```

Then in `fetchSessions`, normalize each item after sorting:

```typescript
const sorted = [...data.items]
  .sort((a, b) => b.createdAt - a.createdAt)
  .map((item) => ({
    ...item,
    status: normalizeStatus(item.status)
  }));
```

**Step 2: Verify build compiles**

Run: `pnpm build-devnet`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/hooks/useGetPreviousSessions.ts
git commit -m "fix: normalize session status from API to handle casing mismatches"
```

---

### Task 2: Add `onRateSession` callback prop to PreviousSessions

PreviousSessions needs to communicate "user wants to rate session X with Y points" back to CreateJob. Add a callback prop.

**Files:**
- Modify: `src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/PreviousSessions.tsx`

**Step 1: Extend the props interface**

Add `onRateSession` to `PreviousSessionsProps`:

```typescript
interface PreviousSessionsProps {
  sessions: PreviousSession[];
  total: number;
  isLoading: boolean;
  error: string | null;
  explorerAddress: string;
  onRetry?: () => void;
  onRateSession?: (jobId: string, agentNonce: number, rating: number) => void;
}
```

Destructure in the component signature:

```typescript
export const PreviousSessions = ({
  sessions,
  total,
  isLoading,
  error,
  explorerAddress,
  onRetry,
  onRateSession
}: PreviousSessionsProps) => {
```

**Step 2: Verify build compiles**

Run: `pnpm build-devnet`
Expected: No errors (prop is optional).

**Step 3: Commit**

```bash
git add src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/PreviousSessions.tsx
git commit -m "feat: add onRateSession callback prop to PreviousSessions"
```

---

### Task 3: Add inline star picker with expand/collapse

Add per-row state: a "Rate" button that expands to a 5-star picker. Only shown for unrated Completed/Failed sessions.

**Files:**
- Modify: `src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/PreviousSessions.tsx`

**Step 1: Add imports and state**

Add `faStarHalfStroke` import alongside existing `faStar`:

```typescript
import {
  faArrowUpRightFromSquare,
  faClock,
  faRotateRight,
  faSpinner,
  faStar,
  faStarHalfStroke
} from '@fortawesome/free-solid-svg-icons';
```

Add `useState` to React imports:

```typescript
import { DateTime } from 'luxon';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
```

**Step 2: Add helper and state inside the component**

Inside the component body, before the return:

```typescript
const canRate = (session: PreviousSession): boolean =>
  (session.status === 'Completed' || session.status === 'Failed') &&
  (!session.ratingsCount || session.ratingsCount === 0);

const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
const [hoverRating, setHoverRating] = useState(0);
```

**Step 3: Replace the right side of each session row**

Replace the `<div className='flex items-center gap-2.5 shrink-0'>` block (lines 127–143) with logic that shows either the existing rating, a "Rate" button, or the inline star picker:

```tsx
<div className='flex items-center gap-2.5 shrink-0'>
  {/* Already rated */}
  {session.ratingAvg != null &&
    session.ratingsCount != null &&
    session.ratingsCount > 0 && (
      <span className='flex items-center gap-1 text-sm text-warning'>
        <FontAwesomeIcon icon={faStar} className='text-sm' />
        {session.ratingAvg.toFixed(0)}
      </span>
    )}

  {/* Rate button (unrated Completed/Failed only) */}
  {canRate(session) && expandedJobId !== session.jobId && (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedJobId(session.jobId);
        setHoverRating(0);
      }}
      className='text-sm text-zinc-500 hover:text-warning transition-colors duration-150 cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-zinc-800'
    >
      Rate
    </button>
  )}

  {/* Inline star picker (expanded) */}
  {canRate(session) && expandedJobId === session.jobId && (
    <div
      className='flex items-center gap-0.5'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const halfValue = starIndex * 20 + 10;
        const fullValue = (starIndex + 1) * 20;
        const activeRating = hoverRating;
        const showFull = activeRating >= fullValue;
        const showHalf = activeRating >= halfValue && !showFull;
        const filled = showFull || showHalf;
        return (
          <div key={starIndex} className='relative flex w-6'>
            <span
              className={`pointer-events-none text-base transition-colors ${
                filled ? 'text-warning' : 'text-zinc-700'
              }`}
            >
              {showFull ? (
                <FontAwesomeIcon icon={faStar} />
              ) : showHalf ? (
                <FontAwesomeIcon icon={faStarHalfStroke} />
              ) : (
                <FontAwesomeIcon icon={faStar} />
              )}
            </span>
            <button
              type='button'
              onMouseEnter={() => setHoverRating(halfValue)}
              onClick={() => onRateSession?.(session.jobId, session.agentNonce, halfValue)}
              className='absolute left-0 top-0 w-1/2 h-full cursor-pointer'
              aria-label={`${halfValue} points`}
            />
            <button
              type='button'
              onMouseEnter={() => setHoverRating(fullValue)}
              onClick={() => onRateSession?.(session.jobId, session.agentNonce, fullValue)}
              className='absolute left-1/2 top-0 w-1/2 h-full cursor-pointer'
              aria-label={`${fullValue} points`}
            />
          </div>
        );
      })}
      <button
        type='button'
        onClick={() => {
          setExpandedJobId(null);
          setHoverRating(0);
        }}
        className='text-sm text-zinc-600 hover:text-zinc-400 ml-1 cursor-pointer'
        aria-label='Cancel rating'
      >
        &times;
      </button>
    </div>
  )}

  <span className='text-sm text-zinc-600 font-mono group-hover:text-zinc-400 transition-colors duration-150'>
    {truncateJobId(session.jobId)}
  </span>
  <FontAwesomeIcon
    icon={faArrowUpRightFromSquare}
    className='text-sm text-zinc-700 group-hover:text-zinc-500 transition-colors duration-150'
  />
</div>
```

**Step 4: Change the row from `<motion.a>` to `<motion.div>` wrapper**

Since clicking "Rate" should not navigate, convert the row to a `<div>` with an explicit link icon. Replace `<motion.a>` with `<motion.div>` and make only the explorer icon a link:

```tsx
<motion.div
  key={session.jobId}
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.15, delay: index * 0.03 }}
  className='group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-150'
>
  {/* ... left side unchanged ... */}
  {/* ... right side with rate button ... */}
  <a
    href={`${explorerAddress}/transactions/${session.initTxHash}`}
    target='_blank'
    rel='noopener noreferrer'
    className='text-sm text-zinc-700 group-hover:text-zinc-500 transition-colors duration-150 cursor-pointer'
    onClick={(e) => e.stopPropagation()}
  >
    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
  </a>
</motion.div>
```

**Step 5: Verify build compiles**

Run: `pnpm build-devnet`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/PreviousSessions.tsx
git commit -m "feat: add inline star picker with Rate button for unrated sessions"
```

---

### Task 4: Create RatingConfirmModal component

A lightweight confirmation modal shown after the user selects a rating from the inline picker.

**Files:**
- Create: `src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/RatingConfirmModal.tsx`

**Step 1: Create the modal component**

```tsx
import { faSpinner, faStar, faStarHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'motion/react';
import { useEffect } from 'react';

interface RatingConfirmModalProps {
  jobId: string;
  rating: number;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const truncateJobId = (jobId: string): string => {
  if (jobId.length <= 12) return jobId;
  return `${jobId.slice(0, 6)}...${jobId.slice(-4)}`;
};

export const RatingConfirmModal = ({
  jobId,
  rating,
  isSubmitting,
  error,
  onConfirm,
  onCancel
}: RatingConfirmModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onCancel]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='rate-session-title'
      onClick={() => { if (!isSubmitting) onCancel(); }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className='bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6 flex flex-col gap-4'
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id='rate-session-title'
          className='text-lg font-semibold text-zinc-50 tracking-tight'
        >
          Rate this session?
        </h3>
        <p className='text-base text-zinc-500 leading-relaxed'>
          Job {truncateJobId(jobId)} &mdash; your rating goes on-chain and
          helps improve the agent.
        </p>

        {/* Star display (read-only) */}
        <div className='flex items-center gap-1'>
          {[0, 1, 2, 3, 4].map((starIndex) => {
            const halfValue = starIndex * 20 + 10;
            const fullValue = (starIndex + 1) * 20;
            const showFull = rating >= fullValue;
            const showHalf = rating >= halfValue && !showFull;
            return (
              <span
                key={starIndex}
                className={`text-2xl ${
                  showFull || showHalf ? 'text-warning' : 'text-zinc-700'
                }`}
              >
                <FontAwesomeIcon
                  icon={showHalf ? faStarHalfStroke : faStar}
                />
              </span>
            );
          })}
          <span className='text-base text-zinc-500 font-mono ml-2'>
            {rating} / 100
          </span>
        </div>

        {error && (
          <p role='alert' className='text-error text-base'>
            {error}
          </p>
        )}

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isSubmitting}
            className='flex-1 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors duration-150 text-base font-medium cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isSubmitting}
            className='flex-1 px-4 py-2.5 bg-teal hover:bg-teal/80 text-zinc-950 rounded-lg font-medium text-base transition-colors duration-150 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Submitting&hellip;
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
```

**Step 2: Export from barrel**

In `src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/index.ts`, add:

```typescript
export { PreviousSessions } from './PreviousSessions';
export { RatingConfirmModal } from './RatingConfirmModal';
```

**Step 3: Verify build compiles**

Run: `pnpm build-devnet`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/RatingConfirmModal.tsx
git add src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/index.ts
git commit -m "feat: add RatingConfirmModal component for previous sessions"
```

---

### Task 5: Wire rating flow into CreateJob.tsx

Connect the `onRateSession` callback, manage the confirmation modal state, handle submission via `useGiveFeedback`, and do optimistic update + refetch.

**Files:**
- Modify: `src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx`

**Step 1: Import RatingConfirmModal**

Update the import from `./components`:

```typescript
import {
  PreviousSessions,
  RatingConfirmModal,
  TransactionActivityBar,
  TransactionToast
} from './components';
```

**Step 2: Add state for session rating**

Near the existing `pendingFeedback` state (around line 230), add:

```typescript
const [sessionRating, setSessionRating] = useState<{
  jobId: string;
  agentNonce: number;
  rating: number;
} | null>(null);
const [isSubmittingSessionRating, setIsSubmittingSessionRating] = useState(false);
const [sessionRatingError, setSessionRatingError] = useState<string | null>(null);
```

**Step 3: Add optimistic update state**

```typescript
const [optimisticRatings, setOptimisticRatings] = useState<
  Record<string, number>
>({});
```

**Step 4: Create handler functions**

After `handleSubmitFeedback` (around line 721), add:

```typescript
const handleRateSession = (jobId: string, agentNonce: number, rating: number) => {
  setSessionRating({ jobId, agentNonce, rating });
  setSessionRatingError(null);
};

const handleConfirmSessionRating = async () => {
  if (!sessionRating) return;
  setIsSubmittingSessionRating(true);
  setSessionRatingError(null);
  try {
    const { txHash } = await giveFeedback(
      sessionRating.jobId,
      sessionRating.agentNonce,
      sessionRating.rating
    );
    if (txHash) {
      trackTransaction({
        txHash,
        label: `Rating: ${sessionRating.rating}/100`,
        amount: '0',
        token: 'EGLD',
        status: 'confirmed'
      });
    }
    setOptimisticRatings((prev) => ({
      ...prev,
      [sessionRating.jobId]: sessionRating.rating
    }));
    setSessionRating(null);
    refetchSessions();
  } catch (err: any) {
    if (isUserCancellation(err)) {
      setSessionRatingError('Signing cancelled. Your rating was not submitted.');
    } else {
      setSessionRatingError(
        err?.message || 'Couldn\u2019t submit your rating. Try again?'
      );
    }
  } finally {
    setIsSubmittingSessionRating(false);
  }
};

const handleCancelSessionRating = () => {
  if (isSubmittingSessionRating) return;
  setSessionRating(null);
  setSessionRatingError(null);
};
```

**Step 5: Compute sessions with optimistic ratings applied**

Before the JSX return, add:

```typescript
const sessionsWithOptimisticRatings = previousSessions.map((session) => {
  const optimistic = optimisticRatings[session.jobId];
  if (optimistic == null) return session;
  return {
    ...session,
    ratingAvg: optimistic,
    ratingsCount: (session.ratingsCount ?? 0) + 1
  };
});
```

**Step 6: Update PreviousSessions usage**

Change the `<PreviousSessions>` call (~line 1226) to pass the new props:

```tsx
<PreviousSessions
  sessions={sessionsWithOptimisticRatings}
  total={previousSessionsTotal}
  isLoading={sessionsLoading}
  error={sessionsError}
  explorerAddress={network.explorerAddress}
  onRetry={refetchSessions}
  onRateSession={handleRateSession}
/>
```

**Step 7: Add RatingConfirmModal to JSX**

Right after the existing feedback modal (after line ~1570), add:

```tsx
{sessionRating && (
  <RatingConfirmModal
    jobId={sessionRating.jobId}
    rating={sessionRating.rating}
    isSubmitting={isSubmittingSessionRating}
    error={sessionRatingError}
    onConfirm={handleConfirmSessionRating}
    onCancel={handleCancelSessionRating}
  />
)}
```

**Step 8: Update the components barrel export**

In `src/pages/Dashboard/widgets/CreateJob/components/index.ts`, add RatingConfirmModal:

```typescript
export { PreviousSessions, RatingConfirmModal } from './PreviousSessions';
export { TransactionActivityBar } from './TransactionActivityBar';
export { TransactionToast } from './TransactionToast';
```

**Step 9: Verify build compiles**

Run: `pnpm build-devnet`
Expected: No errors.

**Step 10: Commit**

```bash
git add src/pages/Dashboard/widgets/CreateJob/CreateJob.tsx
git add src/pages/Dashboard/widgets/CreateJob/components/index.ts
git commit -m "feat: wire session rating flow with confirmation modal and optimistic updates"
```

---

### Task 6: Manual QA and final commit

**Step 1: Start dev server and test the full flow**

Run: `pnpm start-devnet`

Test checklist:
- [ ] Previous sessions display with correct status badges (not all "New")
- [ ] Unrated Completed/Failed sessions show "Rate" button
- [ ] Unrated New/Pending sessions do NOT show "Rate" button
- [ ] Clicking "Rate" expands inline star picker
- [ ] Hovering stars highlights them
- [ ] Clicking a star opens confirmation modal with correct rating
- [ ] Cancel in modal returns to inline picker collapsed
- [ ] Submit triggers wallet signature prompt
- [ ] After submission, row updates optimistically to show the rating
- [ ] Explorer link still works on each row
- [ ] Escape key closes confirmation modal

**Step 2: Fix any issues found during QA**

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: QA fixes for session rating feature"
```
