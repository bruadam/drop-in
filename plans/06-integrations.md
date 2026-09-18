# 06 — Integrations: notifications, fitness, payments

These are largely independent of each other — build in whatever order
matches what's being tested/demoed next, unlike the earlier plans which
have a harder dependency order.

## Push notifications (iOS only for v1)

`expo-notifications` is already installed and its config plugin
registered. Per spec §7, the mechanics are specific — match them exactly:

- **Registration**: on first login on iOS, request notification
  permission and register the device's Expo push token against
  `push_tokens` (one resident can have multiple tokens across devices —
  the table already supports this).
- **Delivery**: a Supabase Edge Function triggered by a **Postgres
  trigger** on `activities` insert, `attendance` insert, or
  `alter_ego_matches` update — computes the matched audience (**same
  tenant + matching interest tag + matching zone if the activity
  specifies one**) and calls the Expo Push API with the relevant tokens.
  Don't build this as a client-triggered call — it needs to fire
  regardless of which client (or none) is active when the row changes.
- **Trigger events**, per spec §6: a new activity matching your
  interests+zone is posted; someone joins an activity you created or are
  attending; a vague call-out you're interested in gets a firm time; your
  alter-ego match reveals; someone you follow posts (see
  [03-social-and-community.md](03-social-and-community.md)'s open
  question about digesting this one).
- **Every notification type must be toggleable per resident from day
  one** (spec §7, explicit — "even though delivery itself is push-only,
  this avoids a painful migration later"). The toggles already exist in
  the UI (`src/app/(tabs)/profile.tsx`'s `NOTIFICATION_TYPES`) as local
  state only — persist them (a jsonb column on `profiles` or a small
  dedicated table) and have the sending logic respect them.
- **Web residents**: no push in v1 — spec §7 says they should see the
  same events as an **in-app badge/feed** instead, explicitly noted as a
  v1.1 candidate once the core loop is validated. Don't skip this
  entirely just because it's not push — some in-app equivalent (even a
  simple unread-count badge) is called out as the intended v1 web
  experience, not "nothing."
- Web push and Android push are explicitly v2 — don't build the
  cross-platform abstraction now.

## Fitness integrations (Strava, Apple Health)

Per spec, these exist for one purpose: a "pace-matching safeguard" (so
e.g. a beginner isn't matched into an advanced-pace running group) plus
feeding the athletic leaderboard
([03-social-and-community.md](03-social-and-community.md)) — not a
fitness-tracking feature in its own right. Keep scope tight to that.

- **Strava**: OAuth via `expo-auth-session` (already installed) against
  Strava's OAuth endpoints (standard `activity:read` scope, per spec §3),
  store `access_token`/`refresh_token` server-side (an Edge Function, not
  client-stored — Strava tokens shouldn't sit in the app), sync
  `avg_pace_seconds_per_km` / `weekly_hours_rolling_avg` into
  `fitness_connections`. GPX/route import (`routes` table,
  `source: "strava"`) can piggyback on the same connection.
- **Apple Health**: read-only, on-device via HealthKit — no server OAuth
  is possible for this one (spec §3, explicit — "the app reads locally
  and syncs a rolled-up summary, not raw workouts"). Needs
  `react-native-health` or an Expo HealthKit module (not currently
  installed; check current Expo SDK support before picking a library).
  Sync only the rolled-up summary to `fitness_connections`
  (`provider: "apple_health"`) — raw HealthKit data never leaves the
  device.
- Wire both into `src/app/(onboarding)/connect-fitness.tsx`'s existing
  buttons (currently no-ops) and make them skippable, matching the
  screen's current "low-pressure" framing — skipping doesn't block
  onboarding, it just means only beginner-level activities get
  recommended until a connection exists (spec §5).
- GPX parsing library choice is explicitly undecided in the spec (§10) —
  pick one when the route-upload flow is actually being built, along with
  whether route previews render as a static or interactive map (also
  undecided).

## Payments: Polar.sh + MobilePay

Per spec §3: **no in-app money movement either way** — this is checkout
handoff and number-surfacing, not a payments system. Spec §3 explicitly
rejected a host-collects-directly in-app flow (would require every host
to hold their own Vipps MobilePay merchant agreement, or Drop-In becoming
a regulated money-holding entity) — don't revisit that decision without a
real reason to.

- **Community-sold/ticketed activities** (the "paid" toggle in
  `activity/create.tsx`, needs a price field added per
  [02-core-loop.md](02-core-loop.md)): Polar.sh checkout, triggered from
  the activity detail screen's "pay and join" flow when `activities.is_paid`
  is true. A **Polar.sh webhook flips `attendance.status` to a
  paid-and-going state and posts a confirmation into the activity chat**
  (spec §3, specific) — this is more than just "payment succeeded," it's
  a chat-visible confirmation message, don't skip that part.
- **Handle the Polar webhook idempotently** (spec §10, same hygiene note
  as the Clerk webhook in [01-data-layer.md](01-data-layer.md) §6) — a
  duplicate or replayed payment-confirmation event must never double-charge
  or double-grant `going` status.
- **Open question from spec §10, worth checking before building**:
  whether Polar.sh's checkout actually exposes MobilePay as a selectable
  method for Danish customers (Stripe does; not confirmed for Polar
  specifically). If it does, the community-sold-activity path could offer
  MobilePay too without the regulatory problem the peer-to-peer path
  avoids below. Check this directly before assuming Polar-only.
- **Peer-to-peer** (a resident hosting something with a cost, e.g.
  splitting a ride or a sauna session): surface the host's MobilePay
  number/deep link — not a processed transaction, just an instruction, per
  spec §3. Needs a `mobilepay_number` field on `profiles` (not yet in the
  schema — add it in [01-data-layer.md](01-data-layer.md) if not already
  there by the time this is built) and an in-chat "payment request"
  bubble (spec §15) with its own pay action that opens a `mobilepay://`
  deep link (or web fallback). Drop-In tracks that a request was sent,
  never that money moved.
