# 03 — Social & community: directory, stats, alter-ego

Depends on [01-data-layer.md](01-data-layer.md) and, for points, the
trigger/ledger work in [02-core-loop.md](02-core-loop.md).

## Member directory (`src/app/directory.tsx`)

- Replace `MOCK_MEMBERS` with a paginated `profiles` query, tenant-scoped
  via RLS (backed by Clerk Organization membership — see
  [05-admin-and-tenancy.md](05-admin-and-tenancy.md)). Search-by-name
  should move server-side (`ilike` filter in the query) once the member
  list can realistically be large — client-side `.filter()` on a full
  fetch is fine for the first pass but won't scale past a small community.
  Spec also says search-by-interest, not just name.
- Tapping a row navigates to a member profile — doesn't exist as its own
  route yet (`design-reference/member-profile.html` was never turned into
  an `src/app/` route). Add `src/app/member/[id].tsx` showing:
  - avatar, display name, **age** (computed from `birth_date`, optional at
    signup) — spec §10 flags exact age vs. an age range (e.g. "30s") as
    undecided; exact is simpler, a range is the more common lighter-touch
    default for this kind of directory. Pick one when building (exact is
    fine to start) rather than blocking on it.
  - bio, zone/building, interests.
  - **Last 3 hosted activities** — spec §6's one deliberate exception to
    "past activities aren't shown": a resident's own profile surfaces
    their last 3 hosted activities regardless of how long ago, as a
    signal of what they tend to host. This needs its own query (`status
    != 'open'` allowed here, unlike the feed) — don't reuse the feed's
    "hide past activities" filter for this screen.
  - A Follow button (`follows` table) — the general "follow a host"
    feature from spec §6, independent of interest/zone matching. Same
    table the alter-ego mutual-follow uses; no source distinction needed
    since unfollowing works identically either way.

## Community stats & leaderboard (`src/app/stats.tsx`)

**This is two distinct things, not one** — the current mock data
conflates them. Per spec §11/§12, keep them separate, possibly as two
tabs on this screen:

1. **Athletic leaderboard** — ranked by hours of sport per week, from
   `fitness_connections` (Strava + Apple Health combined). Residents
   *without* a fitness connection are excluded from this ranking
   entirely, not counted as zero (spec §11, explicit). Computed on a
   schedule — spec recommends an **hourly Edge Function**, not live on
   every page load, "to avoid hammering Strava/Apple Health sync per
   view." Also on this tab: activities-per-week (trailing 7 days),
   member count (Clerk Organization membership count for the tenant, not
   a `profiles` row count), total km logged (same exclusion rule as
   above).
2. **Social/points leaderboard** — ranked by `profiles.points_total`
   (the `points_ledger`-backed cache from
   [02-core-loop.md](02-core-loop.md)'s points work). This rewards
   showing up and hosting, not athletic volume — the two are deliberately
   different axes per spec §11.

**Open question from spec §10/§11, not yet decided**: connecting a
fitness provider for pace-matching ([02-core-loop.md](02-core-loop.md))
and appearing on the public athletic leaderboard probably shouldn't be
the same consent — a separate "show me on the leaderboard" opt-in,
distinct from the underlying connection, is the spec's leaning but isn't
decided. Don't build a consent toggle speculatively; if this becomes a
real complaint once residents are using it, add it then.

## Alter-ego matching (`src/app/(tabs)/alter-ego.tsx`)

This is the most algorithmically involved piece — it needs an actual
matching job, not just a table to read from. **A resident can have more
than one active match at once** (spec §1: "it can be alter-egos in
plural, not only one person specific") — design the screen as a list of
match cards, not a single-match assumption; the current stub only handles
one.

- **Matching logic** (an Edge Function or scheduled job, weekly per
  `alter_ego_matches.week_of`): for each tenant, find pairs of profiles
  with high interest overlap (via `profile_interests`) who aren't already
  matched or mutually following. v1 is interest-based only —
  Strava-training-volume-based matching is explicitly v2 (spec §6/§10),
  don't build it.
- Insert one `alter_ego_matches` row per candidate pair
  (`profile_a_opted_in`/`profile_b_opted_in` both `false` initially). A
  resident can appear in multiple rows across different `week_of` values
  and even the same week if matched with more than one person.
- Query the identity-gating view/function from
  [01-data-layer.md](01-data-layer.md) §4 for this screen — never query
  `alter_ego_matches` directly, since the other profile's identity must
  stay hidden until both opt in.
- Screen logic per match, matching what's already stubbed:
  - No opt-in yet from this profile → "tease" state, "I'm curious" button
    sets this profile's opt-in flag.
  - This profile opted in, other hasn't → "waiting" state.
  - Both opted in → per spec §6, **both** of the following happen: set
    `revealed_at`, create a `conversations` row (`source: "alter_ego"`),
    and create a mutual `follows` row pair (each direction) — "the DM is
    the payoff, the follow keeps them crossing paths afterward." The
    revealed state's "Open chat" button navigates to that conversation
    (currently a stub that routes back to the feed — fix this).
- Remove the dev-only "(dev) simulate mutual opt-in" button once real data
  is wired up.

## Follows / conversations

A minimal DM screen (list of conversations + a thread view, reusing the
message-bubble pattern already built in `activity/[id].tsx`) is needed
for the alter-ego "Open chat" flow to go anywhere real, and for direct
host contact. Keep it minimal — this isn't a general messaging product,
just enough to serve the alter-ego reveal and direct contact.

**Open question from spec §10, not yet decided**: following several hosts
could produce a lot of push notifications ("someone you follow posted") —
needs the same per-type toggle treatment as the other notification types
in [06-integrations.md](06-integrations.md), and possibly a digest option
later rather than one push per post. Ship the plain per-post notification
first; add digesting only if it becomes a real complaint.
