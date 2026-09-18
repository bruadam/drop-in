# 02 — Core loop: onboarding → feed → create → attend → chat

The smallest slice that makes the app actually useful. Depends on
[01-data-layer.md](01-data-layer.md) and the Clerk-Organizations-as-tenants
architecture in [05-admin-and-tenancy.md](05-admin-and-tenancy.md) — the
join step below specifically assumes that's built, since "join a
community" means "join its Clerk Organization," not just an `INSERT`.

## Onboarding (writes, not just reads)

- `src/app/(onboarding)/choose-community.tsx` — replace `MOCK_COMMUNITIES`
  with a geo query against `tenants` (~20km radius per spec — needs
  lat/lng columns on `tenants`, and the device's location; `expo-location`
  isn't installed yet), plus a search path for tenants that opted into
  discoverability beyond proximity. Selecting a result **redeems the
  invite code or completes the geo/search join** by calling the Edge
  Function that adds the resident to the corresponding Clerk Organization
  (see [01-data-layer.md](01-data-layer.md) §6) — not just local
  navigation state. If a tenant has an open-join policy (spec §2), the
  same path applies without needing a code.
- On successful join: apply the tenant's `theme.accent` via `setAccent()`
  from `useTenantTheme()`, and persist which tenant is "current" somewhere
  that survives app restarts (a column on the profile, or read back from
  Clerk's active-organization state — don't hold it only in navigation
  params).
- `src/app/(onboarding)/profile-setup.tsx` — upsert into `profiles` (+
  `profile_interests`) instead of local state only. Load `ZONES` from
  `tenants.zones` and `INTERESTS` from the `interests` table (shared base
  list + this tenant's extensions — see
  [01-data-layer.md](01-data-layer.md) §8) instead of the hardcoded
  arrays. The free-text "suggest a new interest" option from spec §5
  isn't built yet — add it here, queuing into the pending-approval state
  from 01-data-layer.md.
- `src/app/(onboarding)/connect-fitness.tsx` — the Strava/Apple Health
  buttons can stay stubbed here; that's
  [06-integrations.md](06-integrations.md). What *does* need to happen:
  mark onboarding complete on the profile so `src/app/index.tsx`'s TODO —
  skip onboarding for returning users — can actually be implemented.
  Right now every signed-in user restarts onboarding every launch.

## Activity feed (`src/app/(tabs)/index.tsx`)

Replace `MOCK_ACTIVITIES` with a React Query hook (put it in a new
`src/hooks/useActivities.ts`, following the `useSupabase()` pattern
already established) that:

- Reads `activities` joined with `profiles` (host), `interests`, and
  `routes` (for the map preview), scoped to the current tenant via RLS.
- Filters to the 48h horizon and `status = 'open'`, ordered soonest-first
  — vague/spontaneous activities (`starts_at is null`) should sort
  separately (e.g. grouped under "still figuring out the time" rather than
  interleaved by a null timestamp).
- Subscribes to Supabase Realtime on `activities` for this tenant so new
  posts / status changes appear live, not just on pull-to-refresh.
- **Each card needs the level badge (beginner-friendly / open to all /
  advanced) and, when a route is attached, a small map preview** — per
  spec §6/§15, these are core parts of the card, not optional detail. The
  current stub card only shows time/zone/title/host/tags; add `level` and
  route preview when wiring real data, not as a later polish pass.
- Apply the **pace/level matching safeguard** (spec §6): cross-check the
  viewer's own `fitness_connections.avg_pace_seconds_per_km` against an
  activity's `target_pace_seconds_per_km` before surfacing it as a
  recommended match; a viewer with no connection only gets beginner
  activities recommended (they can still browse/join anything by
  scrolling — this only affects what's pushed as a strong match).

The interest filter chips should populate from the tenant's `interests`
table, not the hardcoded `INTEREST_FILTERS` array.

## Create activity (`src/app/activity/create.tsx`)

- Insert into `activities` on submit. Fields the spec requires that the
  current stub doesn't yet collect: `duration_minutes`, `training_type`
  (freeform tag, same tenant-editable pattern as interests),
  `level` (beginner/open/advanced), `target_pace_seconds_per_km`
  (running/cycling only), and a route attachment (`route_id`, picked from
  a connected Strava account or an uploaded GPX — depends on
  [06-integrations.md](06-integrations.md)). `kind: "dropin"`, `starts_at`
  either computed from `hoursFromNow` or `null` for the vague-time toggle.
- The client-side 48h check via `isWithinActivityHorizon` already exists
  and should stay — it's the fast-fail UX layer in front of the DB
  `CHECK` constraint from [01-data-layer.md](01-data-layer.md), not a
  replacement for it.
- Interest chips: load from `interests`, not the hardcoded list.
- **Rate-limit activity creation per resident** (spec §9: "max N per day,
  to prevent notification spam"). Enforce server-side (a check in the
  insert path or a Postgres trigger counting today's activities for
  `creator_id`), not just a client-side disable — a determined client
  could bypass a UI-only limit.
- Run the AI moderation check
  ([04-moderation-and-trust.md](04-moderation-and-trust.md)) as part of
  this insert path — every new activity needs to hit the moderation
  pipeline before or immediately after it becomes visible to other
  residents. If the verdict is `block`, the author should see a **generic
  "this couldn't be posted" notice — never the model's internal
  reasoning** (spec §13, explicit).
- The paid/free toggle needs an actual price field once
  [06-integrations.md](06-integrations.md)'s Polar.sh flow exists; the
  current boolean-only stub is fine as an intermediate step.

## Activity detail (`src/app/activity/[id].tsx`)

- Replace `MOCK_ATTENDEES` / `MOCK_MESSAGES` with real `attendance` and
  `messages` queries, both scoped to `activity_id`.
- "I'm going" button: upsert into `attendance` (`status: "going"`) —
  consider what happens on capacity being reached (`status` on the
  activity flips to `"full"`; the button should reflect that instead of
  staying enabled). For a paid activity, this becomes a "pay and join"
  button — see [06-integrations.md](06-integrations.md).
- Chat: subscribe to `messages` via Supabase Realtime for this
  `activity_id`, insert on send. Run new messages through the same
  moderation pipeline as activities — per spec §13, a `review`-flagged
  message stays visible to its own sender but hidden from other attendees
  until a moderator clears it (so the sender isn't tipped off). This needs
  explicit handling in the query (filter `moderation_queue` status per
  viewer, not just per message) — it's easy to get this backwards.
- For a *vague* activity (`starts_at is null`), the host firming up a time
  should happen through this same chat/detail screen, updating the same
  row in place (`starts_at` set), notifying everyone already
  interested — this UI affordance doesn't exist yet.
- If the activity is paid, the detail/chat screen also needs the in-chat
  "payment request" bubble with its own pay action (spec §15) — see
  [06-integrations.md](06-integrations.md) for the Polar.sh/MobilePay
  mechanics behind it.

## Points

Every `attendance` (status → "going", activity completed) and every
hosted activity that completes should append a row to `points_ledger`
(`reason: "attended"` / `"hosted"`) — flat points per action per spec
§12, not scaled by duration or anything else. This can be a Postgres
trigger or an Edge Function — a trigger is simpler and keeps the logic in
one place close to the data. Also maintain `profiles.points_total` as a
cache refreshed on write (spec §4: "kept for fast feed/leaderboard reads
rather than aggregating live every time") — this is a *different* number
from the fitness-hours leaderboard in
[03-social-and-community.md](03-social-and-community.md); don't conflate
the two. Exact point values and social-level tier thresholds are
explicitly a v2 tuning question (spec §10/§12, "needs a tuning pass,
ideally after seeing real usage") — ship placeholder values and don't
bikeshed them now.
