# 01 — Data layer: Supabase schema, RLS, Clerk sync

Nothing past this point can move off mock data without it. Do this first.
Read [05-admin-and-tenancy.md](05-admin-and-tenancy.md) first — tenants
are Clerk Organizations, which shapes several of the steps below.

## 1. Provision Supabase projects

Per `docs/CI-CD.md`'s one-time setup checklist (step 6): three separate
Supabase projects (dev-hosted, staging, production) — never share one
across environments. Also run `supabase init` locally so migrations are
tracked in this repo (a `supabase/migrations/` directory doesn't exist
yet — create it as part of this step).

## 2. Configure Clerk as a Supabase third-party auth provider

`src/lib/supabase.ts` already sends the Clerk session JWT via the
`accessToken` callback — that's the client-side half. The other half is
server-side: in each Supabase project, **Authentication → Sign In / Up →
Third Party Auth → add Clerk**, pointing at the Clerk instance's Frontend
API URL (`https://<your-instance>.clerk.accounts.dev` for dev — see
`docs/ENVIRONMENTS.md`). Without this, every Supabase request will 401
regardless of how correct the client code is.

## 3. Write the schema migration

`src/types/database.ts` already documents the full intended shape (it's a
hand-written placeholder — replace it with generated types in step 5).
Tables, in dependency order:

1. `tenants` (id = Clerk Organization ID — see
   [05-admin-and-tenancy.md](05-admin-and-tenancy.md)), `org_creation_codes`,
   `platform_admins` (the latter two have no `tenant_id` — platform-level,
   not tenant-scoped)
2. `invite_codes`, `interests`, `profiles` (references `tenants`)
3. `profile_interests`, `follows`, `conversations` (reference `profiles`)
4. `routes`, `fitness_connections` (reference `profiles`)
5. `activities` (references `interests`, `routes`, `profiles`) — **the
   `starts_at` within-48h-of-`created_at` constraint must be a Postgres
   `CHECK` constraint**, not just the client-side mirror at
   `src/lib/activity-window.ts`
6. `attendance`, `messages` (reference `activities`/`conversations` —
   exactly one of `activity_id`/`conversation_id` set per message; a
   `CHECK` constraint, not just convention)
7. `alter_ego_matches`, `points_ledger`, `push_tokens`
8. `moderation_queue`, `user_suspensions`

Every tenant-scoped table gets a `tenant_id` referencing `tenants(id)`.

## 4. RLS policies

Every tenant-scoped table needs (at minimum) a policy of the shape the
spec calls out:

```sql
tenant_id = (select tenant_id from profiles where id = auth.uid())
```

Plus per-table refinements:
- `moderation_queue` / `user_suspensions`: writes additionally require the
  acting profile's `role` to be `moderator`/`admin`.
- `activities` / `messages`: insert requires `creator_id = auth.uid()` /
  `sender_id = auth.uid()`.
- Any table gating creation/participation (`activities` insert,
  `attendance` insert, `messages` insert) should also check the acting
  profile has no active row in `user_suspensions`
  (`expires_at is null or expires_at > now()`) — this is how suspensions
  are actually enforced (see
  [04-moderation-and-trust.md](04-moderation-and-trust.md)), not a
  client-side check.
- `org_creation_codes` / `platform_admins`: not tenant-scoped — gate on
  `auth.uid()` being present in `platform_admins`.
- **Platform-admin cross-tenant read access** (spec §14: "a narrowly-scoped
  RLS exception for platform admins specifically, not a general bypass"):
  add an `OR exists (select 1 from platform_admins where user_id =
  auth.uid())` clause to the relevant `SELECT` policies (at minimum
  `tenants`, arguably the per-tenant lists the admin screen needs) —
  scoped to reads needed for the "all communities" list and "view as",
  not blanket write access.
- **`alter_ego_matches` identity gating** (spec §4: "hides
  `profile_b_id`'s identity-resolving fields from `profile_a` (and vice
  versa) until both opt-in flags are true — done via a Postgres view or
  an Edge Function rather than raw table access, so the reveal logic
  lives in one place"). Don't let the client query the raw table directly
  for this reason — build a view (or an Edge Function) that returns the
  match row with the other profile's identity fields nulled out unless
  `revealed_at is not null`, and have the alter-ego screen
  ([03-social-and-community.md](03-social-and-community.md)) query that
  instead of `alter_ego_matches` directly.

Write this as SQL migrations, not dashboard clicking, so it's reviewable
and reproducible across the three environments.

## 5. Generate real types, delete the placeholder

Once the schema is migrated to at least the dev project:

```bash
supabase gen types typescript --project-id <dev-project-ref> > src/types/database.ts
```

This replaces the hand-written file — update `src/lib/supabase.ts`'s
`createClient` call to use the generated `Database` generic
(`createClient<Database>(...)`) for real query type-safety, which the
current placeholder version deliberately doesn't have.

## 6. Clerk ↔ Postgres sync

Two directions, both needed:

- **Webhook (Clerk → Postgres), ongoing sync**: a Supabase Edge Function
  receiving Clerk's `organization.*` and `organizationMembership.*` /
  `user.*` webhook events (see the `clerk-webhooks` skill for the
  signature-verification pattern — always verify, never trust the payload
  unverified). `organization.updated` syncs `tenants` (name changes
  etc.); `organizationMembership.created/deleted` is a secondary signal
  for membership changes not already handled by the invite-code redemption
  path below; `user.created/updated` syncs `profiles`. Handle every event
  **idempotently** — a replayed webhook event must never double-create a
  row or double-grant access (spec §10 flags this explicitly for both
  Clerk and Polar webhooks; use the Clerk event ID as an idempotency key).
- **Direct write (Postgres/Edge Function → Clerk), immediate paths**: two
  flows can't wait for a webhook round-trip and must call the Clerk
  Backend API directly, writing the mirrored Postgres row in the same
  request:
  - Redeeming an `invite_codes` row (onboarding — see
    [02-core-loop.md](02-core-loop.md)): add the resident as a Clerk org
    member via the Backend API.
  - Creating a community (see
    [05-admin-and-tenancy.md](05-admin-and-tenancy.md)): create the Clerk
    Organization *and* insert the mirrored `tenants` row in one Edge
    Function call.

## 7. Data retention

Spec §9 (open question, assumed default): past activities and their
message threads should be archived (not necessarily hard-deleted) after
~30 days, to keep the feed and database lean. A scheduled Edge Function
(daily) is simpler than a Postgres cron extension dependency — either
works. Don't build this until the core loop
([02-core-loop.md](02-core-loop.md)) is actually generating enough data
for it to matter; it's a cleanup job, not a blocker for anything else.

## 8. Seed data

- UN17 Village as the first real tenant (zones: Lunden, Kronen, Norden,
  Spidsen, Søen — see `src/app/(onboarding)/profile-setup.tsx`), created
  through the real create-community path once it exists, not a raw
  `INSERT` — that's the only way to also get a real Clerk Organization for
  it.
- `interests`: per spec §10 (open question, assumed default), a **shared
  base list plus tenant-specific extensions** — not fully freeform per
  tenant with no shared vocabulary. Seed a base list (running, cycling,
  knitting, board games, powerlifting, ...) available to every tenant, and
  make each tenant's `interests` table hold its own additions on top. A
  resident's free-text "suggest a new interest" (spec §5) queues for
  tenant-admin approval — needs a `status` (`pending`/`approved`) on
  `interests` or a separate small approval table; not built yet anywhere
  in the current scaffold.
- Per `docs/CI-CD.md` step 10: a permanent "E2E Test Community" tenant +
  dedicated test account, seeded into **both** dev and staging projects —
  this is what `.maestro/*.yml` signs into. Never point Maestro at a real
  community.
