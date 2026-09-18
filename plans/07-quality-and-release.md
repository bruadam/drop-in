# 07 — Quality & release

Some of this can happen in parallel with the earlier plans; the CI/CD
checklist items specifically should happen early since later work depends
on the pipeline actually running.

## Finish the `docs/CI-CD.md` one-time setup checklist

Written but not fully executed. Specifically still open as of this
writing:
- `eas init` is done (EAS project `25c7e9df-deb1-486e-9884-076426c88173`,
  linked in `app.config.ts`), but **branch protection** (step 5: `dev` /
  `staging` / `main` rules) is manual GitHub UI work, not yet done.
- Three Supabase projects + three Clerk instances (step 6) — only one
  Clerk dev instance exists so far (`app_3JTaXgZDPWhicflv5iUEBM3EzWi`,
  currently *is* the "development" instance referenced in
  `docs/ENVIRONMENTS.md`). Staging and production Clerk instances and all
  three Supabase projects still need creating — see
  [01-data-layer.md](01-data-layer.md) §1 for the Supabase side.
- `.env.staging`/`.env.production` (gitignored, never created yet) need
  real values once those environments exist, then `npm run push-env:staging`
  / `push-env:production`.
- Step 9 (manual first build per profile, to generate credentials
  interactively) hasn't happened — `eas build --profile development
  --platform ios` succeeded once already in this session's testing, so
  development credentials likely already exist; preview/production still
  need their first manual build.
- Step 10: seed the permanent "E2E Test Community" + dedicated test
  account in dev and staging (depends on
  [01-data-layer.md](01-data-layer.md) §7).
- Step 11: the Slack notification job in `staging-release.yml` is flagged
  unverified in the doc itself — verify it actually posts before relying
  on it.

## Testing

- `.maestro/*.yml` (sign_in, join_community, create_dropin,
  alter_ego_reveal) are written against the seeded E2E test community —
  they can't pass until that seed exists ([01-data-layer.md](01-data-layer.md)
  §7). Run them locally (`maestro test .maestro/sign_in.yml`) as soon as
  that's seeded, don't wait for CI to be the first place they run.
- Unit test coverage is currently minimal (one file,
  `src/lib/__tests__/activity-window.test.ts`) — `jest.config.js`'s
  coverage threshold is deliberately low to start (10%) and is meant to
  ratchet up as real coverage grows. Add tests alongside each plan above
  as logic lands (moderation verdict handling, points calculation, the
  alter-ego matching job, RLS-adjacent query builders), not as a
  separate catch-up pass at the end.

## Polish

- Tab bar icons are text-only (`src/app/(tabs)/_layout.tsx`) — the
  reference designs use custom 22×22 line-style SVGs. Needs
  `react-native-svg` (or `@expo/vector-icons`) wired in; not currently a
  dependency.
- The real swipeable card-stack gesture for the moderation queue (cosmetic
  — see [04-moderation-and-trust.md](04-moderation-and-trust.md)).
- A member profile screen (`src/app/member/[id].tsx`, doesn't exist yet —
  see [03-social-and-community.md](03-social-and-community.md)).
- An "invite poster" generator (`design-reference/invite-poster-admin.html`
  — a printable/shareable QR invite card) has a mockup but no
  corresponding route anywhere; low priority, only build if actually
  requested.

## Store submission

- `ITSAppUsesNonExemptEncryption: false` is already declared in
  `app.config.ts`.
- Apple requires Sign in with Apple alongside any other third-party
  sign-in on iOS (guideline 4.8) — already satisfied, the sign-in screen
  offers it.
- App icons exist (`assets/icon.png` etc., from the initial `expo
  create-app` scaffold) but are Expo's generic default artwork, not
  Drop-In branding — replace before submitting.
- Everything else (screenshots, App Store Connect metadata, privacy
  labels) is standard submission work with no Drop-In-specific gotchas
  beyond what's already in `docs/CI-CD.md`'s workflow.
