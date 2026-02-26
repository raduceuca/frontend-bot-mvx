# Previous Sessions Feature — Design Doc

**Date:** 2026-02-26
**Status:** Approved

## Problem

When a user returns to the dashboard with no active job, they see only a "Start a job" CTA. There's no history of past interactions with Max, making the experience feel transient.

## Solution

Show previous sessions (jobs) in the idle state of the chat widget. Data comes from the TaskClaw API — an unauthenticated indexer that tracks all on-chain jobs.

## API

**Base URL:** `https://devnet-taskclaw-api.multiversx.com`

**Endpoint:** `GET /jobs?agentNonce={nonce}&employer={address}&from=0&size=50`

**Response:**
```json
{
  "items": [
    {
      "jobId": "032a056e...",
      "initTxHash": "aae71a56...",
      "createdAt": 1772091320000,
      "employer": "erd1fggp5r...",
      "agentNonce": 110,
      "status": "New" | "Pending",
      "verified": false,
      "ratingAvg": 100,
      "ratingsCount": 1
    }
  ],
  "total": 19
}
```

## Architecture

### New files

1. **`src/hooks/useGetPreviousSessions.ts`** — custom hook that fetches jobs from TaskClaw API, filtered by agent nonce + employer address. Returns `{ sessions, isLoading, error, refetch }`.

2. **`src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/PreviousSessions.tsx`** — renders the session list in the idle state.

3. **`src/pages/Dashboard/widgets/CreateJob/components/PreviousSessions/index.ts`** — barrel export.

### Integration point

In `CreateJob.tsx`, the idle state (line ~1105-1212, "State 2: Logged in, no active job") gets the `PreviousSessions` component inserted below the "Start Job" CTA.

### Config

Add `TASKCLAW_API_URL` to `sharedConfig.ts`.

## UI Design

The previous sessions list appears below the Start Job button in the idle state:

```
┌─────────────────────────────────┐
│  [Max avatar]                   │
│  Start a job with Max           │
│  Pay 0.05 xEGLD...             │
│                                 │
│  [ ⚡ Start Job · 0.05 EGLD ]   │
│  Advanced ▾                     │
│                                 │
│  ─── Previous sessions ───────  │
│                                 │
│  Feb 26 · New        ★ 100     │
│  └ 032a05...4937  →            │
│                                 │
│  Feb 25 · Pending              │
│  └ a1b2c3...d4e5  →            │
│                                 │
│  Feb 24 · New        ★ 80     │
│  └ f6g7h8...i9j0  →            │
│                                 │
└─────────────────────────────────┘
```

Each session row shows:
- Relative date (via `luxon`)
- Status badge (New = zinc, Pending = warning)
- Star rating if rated
- Truncated jobId with link to explorer transaction

## Implementation Plan

1. Add `TASKCLAW_API_URL` to `sharedConfig.ts`
2. Create `useGetPreviousSessions` hook
3. Create `PreviousSessions` component
4. Integrate into `CreateJob.tsx` idle state
5. Add barrel export to components index
