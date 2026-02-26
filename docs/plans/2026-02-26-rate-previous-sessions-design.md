# Rate Previous Sessions — Design

**Date:** 2026-02-26
**Status:** Approved

## Overview

Add the ability to rate completed/failed jobs from the Previous Sessions list. An inline "Rate" button expands to a star picker; selecting a rating opens a confirmation modal before submitting the on-chain transaction.

## Session Row Changes

Unrated Completed/Failed sessions get a "Rate" button where the star rating would normally appear. Clicking it expands an inline 5-star picker (same 10–100 scale as the existing rating flow — half-star precision).

Other sessions (New, Pending, or already rated) remain unchanged.

### State flow per row

```
[Rate button visible] → click → [Star picker expanded] → select star → [Confirmation modal opens]
→ confirm → [On-chain tx] → [Optimistic update: show rating inline] → [Background refetch]
→ cancel/skip → [Collapse back to Rate button]
```

## Status Bug Fix

The API likely returns a status value that doesn't match the `SessionStatus` type keys (`New`, `Pending`, `Completed`, `Failed`). Inspect the actual API response and add proper mapping/normalization in `useGetPreviousSessions.ts`.

## Confirmation Modal

Lightweight modal showing:
- "Rate this session?" heading
- The selected star rating (visual + numeric)
- Job ID (truncated) for context
- Submit button + Cancel button
- Error state if transaction fails
- Loading state while signing/submitting

Reuses the existing `useGiveFeedback` hook — same on-chain transaction, just triggered from a different place.

## After Submission

1. **Optimistic update** — immediately replace the "Rate" button with the star display in the row
2. **Background refetch** — call `refetchSessions()` to sync with on-chain data

## Component Changes

| File | Change |
|------|--------|
| `PreviousSessions.tsx` | Add "Rate" button, inline star picker, expand/collapse state |
| `PreviousSessions.tsx` | New `RatingConfirmModal` (small, local or extracted to sibling) |
| `useGetPreviousSessions.ts` | Normalize status field from API response |
| `PreviousSessions` props | Add `onRate` callback or use `useGiveFeedback` directly inside |

## Constraints

- Rating only allowed on Completed and Failed sessions
- Rating uses existing `useGiveFeedback` hook (on-chain tx to reputation registry SC)
- Scale: 10–100 (half-star precision, same as existing)

## Out of Scope

- Rating New/Pending sessions
- Editing an existing rating
- Viewing full chat history from previous sessions
