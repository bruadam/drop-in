# 05 — Admin & multi-tenancy

## Open decision: Clerk Organizations vs. the custom tenant table

**Decide this before doing anything else in this file** — it changes what
"platform admin" and "create community" actually mean.

The original product spec says: *"Auth & multi-tenancy: Clerk + Clerk
Organizations (org = tenant). Clerk webhook syncs a Postgres `tenants`
table."* The app as scaffolded does **not** do this — it has a fully
custom `tenants` table, a custom `org_creation_codes` gate, and a
hand-built `choose-community` / `create-community` UI with no Clerk
Organizations API calls anywhere (`useOrganizationList`,
`useOrganization`, etc. are unused). This came to light because Clerk's
default instance config had `force_organization_selection: true`, which
produced a session stuck on a "choose-organization" task the app had no
UI for — that setting is now disabled, which is the correct fix *for the
app as currently built*, but it's worth a deliberate call rather than
leaving it as an accident of debugging:

- **Option A — keep the custom system (less work from here).** Tenants
  stay a plain Postgres table. `org_creation_codes` / `platform_admins`
  gate who can create one. Multi-tenancy is enforced purely by RLS on
  `tenant_id`. This is what [01-data-layer.md](01-data-layer.md) through
  [04](04-moderation-and-trust.md) assume by default. Simpler, and Clerk
  Organizations' built-in role/membership model would be redundant with
  the `profiles.role` column already in the schema.
- **Option B — adopt Clerk Organizations properly.** `tenant_id` becomes
  a Clerk Organization ID; the Clerk→Postgres webhook
  ([01-data-layer.md](01-data-layer.md) §6) syncs `organization.*` events
  into `tenants` instead of (or in addition to) `user.*` into `profiles`;
  `choose-community.tsx` becomes an org-picker using
  `useOrganizationList()`; `create-community.tsx` calls
  `useOrganization().organization.create()` (gated the same way, via
  `org_creation_codes`) instead of inserting into `tenants` directly;
  `force_organization_selection` likely goes back to `true`, and the app
  needs a real "choose/create organization" screen to satisfy that session
  task instead of routing around it. `profiles.role` could then map to
  Clerk's org roles (`org:admin`/`org:member`) instead of a separate
  column — see the `clerk-orgs` skill for the roles/permissions model.

If undecided, default to **Option A** — it's what's already built and
what the rest of this plan assumes. Flip to Option B only as a deliberate
rewrite, not incrementally, since the two approaches disagree about where
the source of truth for "what tenant is this" lives.

The rest of this file assumes Option A.

## Platform admin (`src/app/admin/index.tsx`)

- Replace `MOCK_TENANTS` with a `tenants` query, gated on the signed-in
  user's Clerk ID existing in `platform_admins` (checked server-side via
  RLS — the route being hard to navigate to in the UI is not access
  control).
- "View as" (switch active tenant context for support/debugging without
  actually joining it) — implement as a client-side override of whichever
  "current tenant" mechanism [02-core-loop.md](02-core-loop.md)'s
  onboarding work ends up using, not a real membership change.
- Per spec, v1 admin is otherwise the Supabase dashboard directly — don't
  build additional in-app admin screens (user management, tenant editing,
  etc.) beyond this list + the create-community flow below.

## Create community (`src/app/admin/create-community.tsx`)

- Code verification step: check `org_creation_codes` (`uses_count <
  max_uses`, not expired) against Supabase instead of the current
  `creationCode.trim().length > 0` stub.
- On create: insert into `tenants` (name, `theme.accent`, zones parsed
  from the comma-separated input), increment the used creation code's
  `uses_count`, generate and display a real `invite_codes` row instead of
  the current `Math.random()`-based fake code.
- This screen's own gating (only reachable via a valid platform-admin
  creation code) already matches spec intent — no architecture change
  needed here regardless of the Option A/B decision above, just real data
  instead of mocks.
