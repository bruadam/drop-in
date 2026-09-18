# 05 — Admin & multi-tenancy

## Tenants ARE Clerk Organizations — not an open decision

An earlier version of this plan treated Clerk Organizations vs. a fully
custom tenant table as an open A/B choice. **It isn't** — the spec (§2) is
explicit: *"A tenant = one residence/community, and maps 1:1 to a Clerk
Organization — Clerk Organizations are the actual multi-tenancy backbone
(membership, invitations, roles), and a `tenants` table in Postgres
mirrors each organization (kept in sync via Clerk webhooks) to hold what
Clerk doesn't model: branding, geo-location, zone list."* That was
disabled mid-session (`force_organization_selection: false`) purely to
unblock testing while the app had no org-selection UI yet — it's a
temporary state, not the target architecture. Re-enable it once the work
below lands.

What this actually means for the pieces already scaffolded:

- **`tenants` stays a Postgres table**, but its `id` is a Clerk
  Organization ID, not an independently-generated UUID, and it's a
  *mirror* — the row is written by the Clerk webhook handler
  ([01-data-layer.md](01-data-layer.md) §6), not by app code inserting
  directly. `theme`, `zones`, and geo-location live here because Clerk
  doesn't model them.
- **Joining a community = joining its Clerk Organization.** Discovery
  (nearby/search) still queries Postgres `tenants` for geo-location, since
  Clerk has no geo concept — but the actual "join" action calls Clerk's
  Backend API to add the resident as an org member, not an `INSERT` into
  a membership table.
- **`invite_codes` stays a custom Postgres table**, separate from Clerk's
  own org-invitation system — Clerk's native invites require knowing the
  invitee's email upfront, which doesn't fit "anyone with this code can
  join." Redeeming an `invite_codes` row is what triggers the Backend API
  call that actually adds the resident to the Clerk Organization.
- **`profiles.role`** (resident/moderator/admin) stays a separate column
  rather than mapping to Clerk's org roles (`org:admin`/`org:member`) —
  the spec's role semantics (moderator eligibility, promotion) don't
  correspond cleanly to Clerk's built-in roles. Don't conflate the two.
- **`choose-community.tsx`** rewrite: geo/search list still reads
  `tenants`, but selecting one (or redeeming an invite code) needs to
  actually complete a Clerk Organization join before moving on to
  profile setup — not just set local navigation state.
- **`(auth)`/`(onboarding)`/`(tabs)` layout guards** will need to account
  for `force_organization_selection: true` once re-enabled: a session can
  be signed-in but still have a `choose-organization` session task
  pending. See `src/app/(auth)/sign-in.tsx`'s `navigateAfterAuth` — it
  already has a `session.currentTask` check stubbed
  (`// TODO: route to session-task UI`) that currently just returns and
  does nothing. That TODO is this task, made concrete: route a pending
  `choose-organization` task to the choose-community screen instead of
  silently no-op-ing.

## Platform admin (`src/app/admin/index.tsx`)

- Replace `MOCK_TENANTS` with a `tenants` query, gated on the signed-in
  user's Clerk ID existing in `platform_admins`, enforced via a **narrowly
  scoped RLS exception for platform admins specifically** (spec's own
  wording, §14) — not a general bypass, and not just a hidden nav item.
- "View as" (switch active tenant context for support/debugging without
  actually joining): per spec §14, once picked the admin "behaves exactly
  like a regular member there... rather than a special read-only admin
  mode" — switching tenant scope doesn't require a separate join, since
  platform-admin status already grants the access.
- **Open question from spec §10, not yet decided**: should "view as" be
  logged/visible to that tenant's moderators, or invisible? Spec leans
  "at least an internal audit log even if invisible to the tenant." Build
  the audit log (a simple `platform_admin_actions` table: admin id, tenant
  id, action, timestamp) regardless of the visibility question, since
  that part isn't actually in dispute.
- Per spec, v1 admin is otherwise the Supabase dashboard directly — don't
  build additional in-app admin screens beyond this list + create-community.

## Create community (`src/app/admin/create-community.tsx`)

Per spec §14: *"creates the Clerk Organization and its mirrored `tenants`
row together in one Edge Function call, so this one path doesn't depend
on the webhook round-trip to have both in sync."*

- Code verification: check `org_creation_codes` (`uses_count < max_uses`,
  not expired) against Supabase instead of the current
  `creationCode.trim().length > 0` stub.
- **Open question from spec §10, not yet decided**: single-use vs.
  multi-use `org_creation_codes` by default, and a default expiry window
  — same shape of question as `invite_codes`. Pick a reasonable default
  when building (e.g. single-use, 30-day expiry) and revisit if it proves
  wrong rather than blocking on deciding up front.
- On submit: call a single Edge Function that creates the Clerk
  Organization (Backend API) *and* inserts the mirrored `tenants` row
  (name, `theme.accent`, zones, geo-location) in one transaction/request —
  don't rely on the webhook alone to eventually create the `tenants` row,
  per the spec's explicit reasoning above.
- Generate and display a real `invite_codes` row on success, replacing the
  current `Math.random()`-based fake code.
