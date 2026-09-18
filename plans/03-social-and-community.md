# 03 — Social & community: directory, stats, alter-ego

Depends on [01-data-layer.md](01-data-layer.md) and, for points, the
trigger/ledger work in [02-core-loop.md](02-core-loop.md).

## Member directory (`src/app/directory.tsx`)

- Replace `MOCK_MEMBERS` with a paginated `profiles` query, tenant-scoped
  via RLS. Search-by-name should move server-side (`ilike` filter in the
  query) once the member list can realistically be large — client-side
  `.filter()` on a full fetch is fine for the first pass but won't scale
  past a small community.
- Tapping a row should navigate to a member profile screen — this doesn't
  exist as its own route yet (the design mockups have a
  `member-profile.html` reference that was never turned into an
  `src/app/` route). Add `src/app/member/[id].tsx` showing the profile,
  stats, and a follow button (`follows` table).

## Stats & leaderboard (`src/app/stats.tsx`)

- Replace `MOCK_LEADERBOARD` with a query summing `points_ledger` per
  `profile_id`, tenant-scoped, ordered descending. A materialized view or
  a simple aggregate query both work; a materialized view is worth it once
  the ledger gets large, not before.
- The spec flags a leaderboard-consent toggle as an open/undecided
  question (separate from fitness-connection consent) — don't build it
  speculatively; if a resident actually asks not to appear, handle it
  directly then.

## Alter-ego matching (`src/app/(tabs)/alter-ego.tsx`)

This is the most algorithmically involved piece — it needs an actual
matching job, not just a table to read from.

- **Matching logic** (an Edge Function or scheduled job, weekly per
  `alter_ego_matches.week_of`): for each tenant, find pairs of profiles
  with high interest overlap (via `profile_interests`) who aren't already
  matched or mutually following. v1 is interest-based only — **do not**
  build Strava-training-volume-based matching, that's explicitly v2 per
  the spec.
- Insert one `alter_ego_matches` row per candidate pair
  (`profile_a_opted_in`/`profile_b_opted_in` both `false` initially).
- Screen logic: read the current profile's match(es) for the current
  `week_of`. States, matching what's already stubbed in the component:
  - No row yet → nothing to show (or a quiet empty state).
  - Row exists, this profile hasn't opted in → "tease" state, "I'm
    curious" button sets `profile_a_opted_in`/`profile_b_opted_in` (whichever
    is this profile) to `true`.
  - This profile opted in, other hasn't → "waiting" state.
  - Both opted in → set `revealed_at`, reveal the match, and
    auto-create a mutual `follows` row pair + a `conversations` row
    (`source: "alter_ego"`) per spec ("Now following each other's
    activities"). The revealed state's "Open chat" button should navigate
    to that conversation, not back to the feed (current stub behavior).
- Remove the dev-only "(dev) simulate mutual opt-in" button once real data
  is wired up.

## Follows / conversations

`conversations` (1:1 threads not tied to an activity) and `follows` don't
have any UI beyond what alter-ego needs above. A minimal DM screen (list
of conversations + a thread view, reusing the message-bubble pattern
already built in `activity/[id].tsx`) is needed for the alter-ego "Open
chat" flow to go anywhere real. Keep it minimal — this isn't a general
messaging product, just enough to serve the alter-ego reveal and direct
host contact.
