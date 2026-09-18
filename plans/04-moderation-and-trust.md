# 04 — Moderation & trust

Depends on [01-data-layer.md](01-data-layer.md) (`moderation_queue`,
`user_suspensions` tables + RLS restricting writes to moderator/admin
roles, and the suspension-enforcement policies noted there).

## AI moderation pipeline

Per spec §13: every new `activity` (title + description) and every
`message` gets screened by an LLM (spec suggests the Anthropic API) via a
Supabase Edge Function, before it's visible to anyone but its author.

- Edge Function triggered on insert (a Postgres trigger calling the
  function is more robust than a client-side call, since a client that
  skips it can't bypass moderation).
- Verdicts:
  - `allow` — publishes immediately, no human involved.
  - `block` — never published; the author sees a **generic "this
    couldn't be posted" notice, not the model's internal reasoning**
    (spec §13, explicit — don't leak the AI's reasoning to the author).
  - `review` — held back from general visibility, written to
    `moderation_queue` (`status: "pending"`), surfaced to a moderator.
    - For an **activity**: simply absent from the feed until reviewed —
      an acceptable small delay since nothing here is more than 48h out
      regardless.
    - For a **message**: per spec §13 (flagged as "assumption, to
      confirm" but the stated default) — **hidden from other attendees,
      but still shown to its own sender as normal**, so the sender isn't
      tipped off they were flagged. Implement this as a per-viewer filter
      on the messages query (sender always sees their own message
      regardless of `moderation_queue.status`; everyone else only sees
      `allow`/`approved` messages), not a blanket hide — see
      [02-core-loop.md](02-core-loop.md)'s activity-detail section for
      where this plugs in.

## Moderation queue screen (`src/app/moderation/index.tsx`)

- Replace `MOCK_QUEUE` with a query for `status = 'pending'`,
  tenant-scoped, ordered oldest-first.
- Approve/reject buttons: update `status` (`approved`/`rejected`),
  `reviewed_by` (current profile id), `reviewed_at`.
- **On reject**, per spec §13, prompt for a suspension action against the
  content's author — not optional, the current stub just removes the item
  from the local list with no suspension flow at all:
  - Tier: `1_day` / `1_week` / `permanent`. **The UI should suggest the
    next tier up from the author's last suspension automatically** (query
    `user_suspensions` for their most recent entry), **but the moderator
    can override the suggestion** — don't force the auto-suggested tier.
  - Choosing any tier also surfaces a **"review this user's full activity
    history" action** — a per-user moderation view of their past
    activities and messages, so the moderator can spot a pattern before
    deciding. This doesn't exist as a screen yet; add
    `src/app/moderation/user/[id].tsx` (or similar) showing everything
    the user has posted, independent of moderation status, moderator-only.
- The real swipeable card-stack gesture (matching the design mockup) is
  cosmetic polish — the button-based interaction already works and is
  fine to ship first; don't block the data/suspension wiring on the
  gesture work.
- Gate this whole route on `profiles.role` being `moderator` or `admin` —
  right now it's reachable by anyone who navigates to `/moderation`. This
  needs both a UI guard (hide the nav entry — already partially done in
  `src/app/(tabs)/profile.tsx`) **and** an RLS policy (the UI guard alone
  isn't security).

## Suspensions

- Insert into `user_suspensions` with the chosen `level`, `reason`,
  `issued_by`, `expires_at` computed from `level` (`null` for permanent).
- **Enforce at the RLS layer**, not client-side: a suspended,
  non-expired profile shouldn't be able to insert activities, messages,
  or attendance rows. This is the policy addition on those tables noted
  in [01-data-layer.md](01-data-layer.md) §4. Existing history isn't
  deleted — only future participation is blocked.
- An appeals process is explicitly out of scope for v1 (spec §10/§13:
  "not designed yet") — don't build one speculatively.

## Moderator eligibility & promotion

Spec §12 describes an eligibility *signal*, separate from the promotion
action itself — the current plan/code has neither:

- **Eligibility** is computed, not a role change: a resident whose
  attended-activity hours (`sum(activities.duration_minutes)` for
  activities they attended, via `attendance`) average **5+ hours/week over
  a trailing 4-week window** is flagged eligible. This can be a scheduled
  query/view (`eligible_moderators` or similar) rather than a live
  computation on every page load.
- **Promotion** stays manual for v1 — a tenant admin promotes an eligible
  resident via the Supabase dashboard (or a lightweight admin list, see
  [05-admin-and-tenancy.md](05-admin-and-tenancy.md)) informed by the
  eligibility signal. Auto-promotion is explicitly v2 (spec §10/§12,
  "once there's confidence in the eligibility signal") — don't build it
  now, but do build the eligibility *computation* so the manual promotion
  decision has something real to look at, rather than leaving it entirely
  to admin judgment with no signal at all.
- Moderator status is scoped to one tenant (spec §12) — this falls out
  naturally from `profiles.role` being per-profile-row (one row per
  tenant membership), no extra work needed, but worth keeping in mind
  when writing the eligibility query (scope it per-tenant, not globally
  per Clerk user).

## Abuse / rate-limiting

Covered in [02-core-loop.md](02-core-loop.md)'s create-activity section
(spec §9: rate-limit activity creation per resident, server-side) — cross-
referenced here since it's also a moderation/trust concern, not purely a
core-loop one.
