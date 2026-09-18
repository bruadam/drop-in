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
  device. Instance config (no password/username, Google enabled) matches
  the "email code, Google, Apple — no passwords" spec. See `docs/CI-CD.md`
  and this session's commit history for exactly what was changed and why.
  **Forced organization-selection is currently disabled** — a temporary
  state, not the target: the spec mandates Clerk Organizations as the
  tenant model (§2), and re-enabling this is part of
  [05-admin-and-tenancy.md](05-admin-and-tenancy.md), not an open choice.
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
   community creation, invite codes, and making tenants real Clerk
   Organizations (per spec §2 — not yet built; the scaffold's tenants are
   a plain table with no Clerk Org backing it). Read this one before
   [01](01-data-layer.md) or [02](02-core-loop.md), since it changes how
   both are built.
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
  (spec §1 flags this as "machine learning to do" — a real future
  direction, not near-term work)

## Open questions carried over from the spec (§10)

Not blockers — each has a stated default/leaning in the spec, noted where
it's addressed:

| Question | Where it's addressed |
|---|---|
| Interest taxonomy: freeform vs. shared base list | [01-data-layer.md](01-data-layer.md) §8 — shared base + tenant extensions, admin-approved (the spec's assumed default) |
| Data retention window for past activities/messages | [01-data-layer.md](01-data-layer.md) §7 — 30 days assumed |
| Admin tooling depth for v1 | [05-admin-and-tenancy.md](05-admin-and-tenancy.md) — manual (dashboard) for now, matches spec's assumption |
| Leaderboard consent separate from fitness-connection consent | [03-social-and-community.md](03-social-and-community.md) — not built speculatively |
| Points values & social-level thresholds | [02-core-loop.md](02-core-loop.md) — placeholder values, tune post-launch |
| Moderator auto-promotion | [04-moderation-and-trust.md](04-moderation-and-trust.md) — eligibility signal built, promotion stays manual |
| AI moderation model/cost | [04-moderation-and-trust.md](04-moderation-and-trust.md) — needs a technical spike, not decided here either |
| Flagged-message visibility (visible to sender, hidden from others) | [04-moderation-and-trust.md](04-moderation-and-trust.md) — built as the spec's stated default |
| Suspension appeals process | Out of scope, see above |
| GPX file handling / map preview style | [06-integrations.md](06-integrations.md) — decide when building |
| Polar.sh / Clerk webhook idempotency | [01-data-layer.md](01-data-layer.md) §6, [06-integrations.md](06-integrations.md) — built as a requirement, not left open |
| Age display: exact vs. range | [03-social-and-community.md](03-social-and-community.md) — exact, to start |
| Follow notification volume / digesting | [03-social-and-community.md](03-social-and-community.md), [06-integrations.md](06-integrations.md) — plain per-post first |
| "View as" audit trail for platform admin | [05-admin-and-tenancy.md](05-admin-and-tenancy.md) — audit log built regardless of the visibility question |
| Org-creation code lifecycle (single/multi-use, expiry) | [05-admin-and-tenancy.md](05-admin-and-tenancy.md) — reasonable default, revisit if wrong |
| MobilePay support in Polar.sh checkout for Danish customers | [06-integrations.md](06-integrations.md) — verify directly before assuming Polar-only |
| Pricing/business model for white-labeling other residences | Not addressed anywhere — flag when ready to scope, not a build task |
