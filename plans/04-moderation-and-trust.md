# 04 — Moderation & trust

Depends on [01-data-layer.md](01-data-layer.md) (`moderation_queue`,
`user_suspensions` tables + RLS restricting writes to moderator/admin
roles).

## AI moderation pipeline

Per spec: every new `activity` and every new `message` gets screened by an
LLM (the spec suggests the Anthropic API) via a Supabase Edge Function.

- Edge Function triggered on insert (a Postgres webhook / trigger calling
  the function, or the function called directly from the client insert
  path in `activity/create.tsx` and `activity/[id].tsx` before the row is
  considered "live" — a DB trigger is more robust since it can't be
  bypassed by a client that skips the call).
- The function calls the LLM with the content, gets back a verdict
  (`allow` / `review` / `block`), and inserts a `moderation_queue` row
  (`subject_type`, `subject_id`, `ai_verdict`, `ai_reason`, `status:
  "pending"` unless verdict is `allow`, in which case it can skip the
  queue entirely and go straight to visible).
- `block` verdicts should prevent the content from being visible at all
  until a human overturns it; `review` should still be visible but
  flagged (matches the "AI flagged" badge already in
  `src/app/moderation/index.tsx`'s mock data).

## Moderation queue screen (`src/app/moderation/index.tsx`)

- Replace `MOCK_QUEUE` with a query for `status = 'pending'`,
  tenant-scoped, ordered oldest-first.
- Approve/reject buttons: update `status` (`approved`/`rejected`),
  `reviewed_by` (current profile id), `reviewed_at`. On reject, prompt for
  a `user_suspensions` entry (see below) — the current stub just removes
  the item from the local list without any of this.
- The real swipeable card-stack gesture (matching the design mockup) is
  cosmetic polish — the button-based interaction already works and is
  fine to ship first; don't block the data wiring on the gesture work.
- Gate this whole route on `profiles.role` being `moderator` or `admin` —
  right now it's reachable by anyone who navigates to `/moderation`. This
  needs both a UI guard (hide the nav entry — already partially done in
  `src/app/(tabs)/profile.tsx`) **and** an RLS policy (the UI guard alone
  isn't security).

## Suspensions

- On a moderation reject (or a direct moderator action against a user),
  insert into `user_suspensions` with a `level` (`1_day` / `1_week` /
  `permanent`), `reason`, `issued_by`, `expires_at` computed from `level`.
- Enforce suspensions at the RLS layer (a suspended, non-expired profile
  shouldn't be able to insert activities/messages/attendance) — this is a
  policy addition on those tables checking against `user_suspensions`, not
  a client-side check.
- An appeals process is explicitly out of scope for v1 (spec: "not
  designed") — don't build one speculatively.

## Moderator promotion

v1 promotion is manual (a moderator flips `profiles.role` via the
Supabase dashboard directly) — per spec, auto-promotion is v2. No UI work
needed here beyond making sure `profiles.role` is easy to find/edit in the
dashboard (a reasonable default view/index is enough).
