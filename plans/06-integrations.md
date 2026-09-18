# 06 — Integrations: fitness, push, payments

These are independent of each other — build in whatever order matches
what's being tested/demoed next, unlike the earlier plans which have a
harder dependency order.

## Push notifications (iOS only for v1)

- `expo-notifications` is already installed and its config plugin
  registered. Missing: requesting permission, registering the device's
  Expo push token into `push_tokens` (keyed by `profile_id`), and actually
  sending notifications.
- Trigger points, per spec ("per-type toggles from day one"): new activity
  matching a followed interest/zone, new chat message, alter-ego match
  revealed, moderation queue item (moderators only). The toggles already
  exist in the UI (`src/app/(tabs)/profile.tsx`'s `NOTIFICATION_TYPES`) —
  they're local state only right now; persist them (a jsonb column on
  `profiles` or a small dedicated table) and have the sending logic
  respect them.
- Sending: an Edge Function per trigger, or one shared "notify" function
  called from the relevant insert triggers, calling Expo's push API with
  the stored tokens.
- Web push and Android push are explicitly v2 — don't build the
  cross-platform abstraction now, iOS-only via `expo-notifications` is
  sufficient.

## Fitness integrations (Strava, Apple Health)

Per spec, these exist for one purpose: a "pace-matching safeguard" (so
e.g. a beginner isn't matched into an advanced-pace running group) — not
a fitness-tracking feature in its own right. Keep scope tight to that.

- **Strava**: OAuth via `expo-auth-session` (already installed) against
  Strava's OAuth endpoints, store `access_token`/`refresh_token` server-side
  (an Edge Function, not client-stored — Strava tokens shouldn't sit in
  the app), sync `avg_pace_seconds_per_km` / `weekly_hours_rolling_avg`
  into `fitness_connections`. GPX/route import (`routes` table,
  `source: "strava"`) can piggyback on the same connection.
- **Apple Health**: read-only, on-device via HealthKit — needs
  `react-native-health` or an Expo HealthKit module (not currently
  installed; check current Expo SDK support before picking a library).
  Summarize on-device, sync only the rolled-up summary to
  `fitness_connections` (`provider: "apple_health"`) — never raw HealthKit
  data leaves the device.
- Wire both into `src/app/(onboarding)/connect-fitness.tsx`'s existing
  buttons (currently no-ops) and make them skippable, matching the
  screen's current "low-pressure" framing.
- GPX parsing library choice is explicitly undecided in the spec — pick
  one when the route-upload flow is actually being built, not before.

## Payments: Polar.sh + MobilePay

Per spec: **no in-app money movement either way** — this is checkout
handoff and number-surfacing, not a payments system.

- Community-sold/ticketed activities (the "paid" toggle in
  `activity/create.tsx`): Polar.sh checkout, triggered from the activity
  detail screen's join flow when `activities.is_paid` is true. Needs a
  Polar product/price created per paid activity (or a generic "pay to
  join" product parameterized by activity) and a webhook confirming
  payment before `attendance.status` flips to `"going"`.
- Peer-to-peer (a resident hosting something with a cost, e.g. splitting a
  ride): surface the host's MobilePay number/deep link on their profile or
  the activity detail screen — this needs a `mobilepay_number` field
  somewhere on `profiles` (not yet in the schema — add it in
  [01-data-layer.md](01-data-layer.md) if not already there by the time
  this is built) and a `mobilepay://` (or equivalent web fallback) deep
  link, nothing more.
