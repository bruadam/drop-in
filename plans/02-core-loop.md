# 02 — Core loop: onboarding → feed → create → attend → chat

The smallest slice that makes the app actually useful. Depends on
[01-data-layer.md](01-data-layer.md) being at least partially done (`tenants`,
`profiles`, `interests`, `activities`, `attendance`, `messages` tables + RLS).

## Onboarding (writes, not just reads)

- `src/app/(onboarding)/choose-community.tsx` — replace `MOCK_COMMUNITIES`
  with a geo query against `tenants` (~20km radius per spec; needs lat/lng
  columns on `tenants` and the device's location — `expo-location` isn't
  installed yet). Keep the invite-code path as a fallback/alternative, not
  a replacement: validate against `invite_codes` (uses_count < max_uses,
  not expired), increment `uses_count` on success.
- On community selection: persist the chosen `tenant_id` somewhere the
  rest of the app can read it (a small context or a column read back from
  the signed-in profile — don't just hold it in navigation params, it
  needs to survive app restarts), and call `setAccent()` from
  `useTenantTheme()` with the tenant's `theme.accent`.
- `src/app/(onboarding)/profile-setup.tsx` — upsert into `profiles` (+
  `profile_interests`) instead of local state only. Load the `ZONES` and
  `INTERESTS` lists from `tenants.zones` / the `interests` table instead
  of the hardcoded arrays.
- `src/app/(onboarding)/connect-fitness.tsx` — the Strava/Apple Health
  buttons can stay stubbed here; that's [06-integrations.md](06-integrations.md).
  What *does* need to happen: mark onboarding complete on the profile (a
  boolean or a "has zone + has ≥1 interest" derived check) so
  `src/app/index.tsx`'s TODO — skip onboarding for returning users — can
  actually be implemented. Right now every signed-in user restarts
  onboarding every launch; fix that here.

## Activity feed (`src/app/(tabs)/index.tsx`)

Replace `MOCK_ACTIVITIES` with a React Query hook (put it in a new
`src/hooks/useActivities.ts`, following the `useSupabase()` pattern
already established) that:

- Reads `activities` joined with `profiles` (host) and `interests` (for
  the filter chips), scoped to the current tenant via RLS.
- Filters to the 48h horizon and `status = 'open'`, ordered soonest-first
  — vague/spontaneous activities (`starts_at is null`) should sort
  separately (e.g. grouped under "still figuring out the time" rather than
  interleaved by a null timestamp).
- Subscribes to Supabase Realtime on `activities` for this tenant so new
  posts / status changes appear live, not just on pull-to-refresh.

The interest filter chips should populate from the tenant's `interests`
table, not the hardcoded `INTEREST_FILTERS` array.

## Create activity (`src/app/activity/create.tsx`)

- Insert into `activities` on submit (`kind: "dropin"`, `starts_at` either
  computed from `hoursFromNow` or `null` for the vague-time toggle). The
  client-side 48h check via `isWithinActivityHorizon` already exists and
  should stay — it's the fast-fail UX layer in front of the DB `CHECK`
  constraint from 01-data-layer.md, not a replacement for it.
- Interest chips: load from `interests`, not the hardcoded list.
- Run the AI moderation check (see
  [04-moderation-and-trust.md](04-moderation-and-trust.md)) as part of this
  insert path — every new activity needs to hit the moderation pipeline
  before or immediately after it becomes visible to other residents.
- The paid/free toggle can stay a plain flag for now; wiring actual
  payment collection is [06-integrations.md](06-integrations.md).

## Activity detail (`src/app/activity/[id].tsx`)

- Replace `MOCK_ATTENDEES` / `MOCK_MESSAGES` with real `attendance` and
  `messages` queries, both scoped to `activity_id`.
- "I'm going" button: upsert into `attendance` (`status: "going"`) —
  consider what happens on capacity being reached (`status` on the
  activity flips to `"full"`; the button should reflect that instead of
  staying enabled).
- Chat: subscribe to `messages` via Supabase Realtime for this
  `activity_id`, insert on send. Run new messages through the same
  moderation pipeline as activities.
- For a *vague* activity (`starts_at is null`), the host firming up a time
  should happen through this same chat/detail screen (per spec: "same
  activity row, `starts_at` updated in place") — this needs a small UI
  affordance for the host to set/update the time that doesn't exist yet.

## Points

Every `attendance` (status → "going") and every hosted activity that
reaches its start time without cancellation should append a row to
`points_ledger` (`reason: "attended"` / `"hosted"`). This can be a
Postgres trigger or an Edge Function — a trigger is simpler and keeps the
logic in one place close to the data. Exact point values are explicitly
a v2 tuning question (see `plans/README.md`'s scope section) — ship
placeholder values (e.g. 10 for attending, 20 for hosting) and don't
bikeshed them now.
