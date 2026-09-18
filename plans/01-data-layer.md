# 01 — Data layer: Supabase schema, RLS, Clerk sync

Nothing past this point can move off mock data without it. Do this first.

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

1. `tenants`, `org_creation_codes`, `platform_admins` (no tenant_id — these
   two are platform-level, not tenant-scoped)
2. `invite_codes`, `interests`, `profiles` (references `tenants`)
3. `profile_interests`, `follows`, `conversations` (reference `profiles`)
4. `routes`, `fitness_connections` (reference `profiles`)
5. `activities` (references `interests`, `routes`, `profiles`) — **the
   `starts_at` within-48h-of-`created_at` constraint must be a Postgres
   `CHECK` constraint**, not just the client-side mirror at
   `src/lib/activity-window.ts`
6. `attendance`, `messages` (reference `activities`/`conversations`)
7. `alter_ego_matches`, `points_ledger`, `push_tokens`
8. `moderation_queue`, `user_suspensions`

Every tenant-scoped table gets a `tenant_id uuid not null references
tenants(id)`.

## 4. RLS policies

Every tenant-scoped table needs (at minimum) a policy of the shape the
spec calls out:

```sql
tenant_id = (select tenant_id from profiles where id = auth.uid())
```

Plus per-table refinements: `moderation_queue` and `user_suspensions`
should additionally require the acting profile's `role` to be
`moderator`/`admin` for write access; `activities`/`messages` writes
should require `creator_id = auth.uid()` / `sender_id = auth.uid()` on
insert. `org_creation_codes` and `platform_admins` are **not**
tenant-scoped — gate those on `auth.uid()` being present in
`platform_admins` instead.

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

## 6. Clerk → Postgres sync (tenants + profiles)

The spec calls for "Clerk webhook syncs a Postgres `tenants` table" — this
doesn't exist yet. Needs:

- A Supabase Edge Function receiving Clerk's `organization.*` / `user.*`
  webhook events (see the `clerk-webhooks` skill for the verification
  pattern — always verify the signature, don't trust the payload
  unverified).
- Clerk Dashboard → Webhooks → point at the deployed Edge Function URL.
- **This is where the open Clerk-Organizations-vs-custom-tenant question
  in [05-admin-and-tenancy.md](05-admin-and-tenancy.md) actually matters**:
  if tenants stay a custom table (current state), this webhook only needs
  to sync `user.created`/`user.updated` into `profiles`. If Organizations
  get adopted instead, it also needs `organization.*` events syncing into
  `tenants`, and the onboarding/admin screens need a real rewrite. Decide
  that before building this webhook, not after.

## 7. Seed data

- UN17 Village as the first real tenant (id, name, zones: Lunden, Kronen,
  Norden, Spidsen, Søen — see `src/app/(onboarding)/profile-setup.tsx`).
- A small set of `interests` rows (the hardcoded list in
  `profile-setup.tsx` and `activity/create.tsx` should become the seed
  data, then get fetched from the table instead of hardcoded).
- Per `docs/CI-CD.md` step 10: a permanent "E2E Test Community" tenant +
  dedicated test account, seeded into **both** dev and staging projects —
  this is what `.maestro/*.yml` signs into. Never point Maestro at a real
  community.
