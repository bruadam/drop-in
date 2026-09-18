# Drop-In — path to a fully functional app

The scaffold (Clerk auth, Supabase client, theme system, all 14 screens
from the design as navigable stubs with mock data) is done and working.
Everything below is what's left to make it a real, data-backed app. See
`AGENTS.md` at the repo root for conventions and hard-won gotchas before
starting any of this.

## Current state (done)

- Expo Router app shell: `(auth)`, `(onboarding)`, `(tabs)` route groups,
  plus `activity/`, `admin/`, `moderation/` stacks — all 14 spec screens
  exist and are navigable.
- Clerk auth: email code + Google/Apple SSO, working end-to-end on a real
  device. Instance config (no password/username, Google enabled, no forced
  org-selection) matches the "email code, Google, Apple — no passwords"
  spec. See `docs/CI-CD.md` and this session's commit history for exactly
  what was changed and why.
- Supabase client (`src/lib/supabase.ts`) bound to Clerk session tokens via
  the `accessToken` callback — no separate Supabase auth. Not yet
  connected to a real Supabase project or schema.
- Theme system (`src/theme/`) transcribed from the actual design mockups
  (`design-reference/*.html`) — colors, spacing, radius, typography are
  real values, not placeholders.
- CI/CD infrastructure (`.eas/workflows/`, `.github/`, `.maestro/`,
  `docs/CI-CD.md`) — written, but several one-time setup steps in
  `docs/CI-CD.md`'s checklist are still unchecked (Supabase projects,
  branch protection, Maestro test account/community seed, etc.).

## What's left, roughly in build order

1. **[01-data-layer.md](01-data-layer.md)** — Supabase schema, RLS, the
   Clerk→Postgres sync webhook. Nothing else can move past mock data
   without this.
2. **[02-core-loop.md](02-core-loop.md)** — onboarding writes real rows,
   the activity feed/create/detail/chat loop reads and writes real data.
   This is the smallest slice that makes the app actually useful.
3. **[03-social-and-community.md](03-social-and-community.md)** — member
   directory, stats/leaderboard, alter-ego matching.
4. **[04-moderation-and-trust.md](04-moderation-and-trust.md)** — AI
   moderation pipeline, the moderation queue screen, suspension tiers.
5. **[05-admin-and-tenancy.md](05-admin-and-tenancy.md)** — platform admin,
   community creation, invite codes — and the open Clerk Organizations vs.
   custom-tenant decision, which affects several other plans if reversed.
6. **[06-integrations.md](06-integrations.md)** — Strava/Apple Health, push
   notifications, Polar.sh + MobilePay.
7. **[07-quality-and-release.md](07-quality-and-release.md)** — tests,
   remaining `docs/CI-CD.md` checklist items, tab icons/app polish, store
   submission.

Every TODO comment already left in `src/` maps to one of these files —
grep for `TODO` if a plan and the code seem to disagree; the code comment
is the more precise pointer to *where*, the plan is the *what/why/order*.

## Scope: v1 vs. later

Per the product spec, these are explicitly **out of scope for v1** — don't
build them as part of the plans above unless a plan says otherwise:

- Strava-based alter-ego matching by training volume (v1 is interest-based
  only)
- Web push and Android push (v1 is iOS push only)
- Auto-promotion of moderators (v1 promotion is manual, via Supabase
  dashboard)
- In-app admin screens beyond the gated create-community flow (v1 admin is
  otherwise the Supabase dashboard directly)
- A leaderboard-consent toggle separate from fitness-connection consent
  (undecided in the spec — raise it if it becomes blocking)
- Exact points values / tier thresholds (needs post-launch tuning — ship
  with reasonable placeholders, don't bikeshed them now)
- A suspension appeals process
- Recurring/"permanent" activities generated from repeated weekly patterns
