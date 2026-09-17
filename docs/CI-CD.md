# CI/CD strategy

## The three branches

| Branch    | Backend                                             | What CI does on push/PR                                  | Distribution        |
|-----------|------------------------------------------------------|------------------------------------------------------------|----------------------|
| `dev`     | **Hosted** dev Supabase project + Clerk *test* instance | PR: lint/typecheck/test. Merge: build + Maestro smoke test | none — internal only |
| `staging` | Staging Supabase project + Clerk staging instance     | PR: lint/typecheck/test + full Maestro gate. Merge: build + TestFlight (internal) + web preview | TestFlight, Vercel preview |
| `main`    | Production Supabase project + Clerk production instance | PR: lint/typecheck/test. Merge: fingerprint → build-or-OTA-update → App Store submit + web prod | App Store, Vercel production |

**Your own laptop is a fourth, separate thing.** Local development uses
`supabase start` (a real local Postgres via Docker) and a Clerk *development*
instance, configured in your own `.env` file. No CI runner — not GitHub
Actions, not EAS's own workers — can ever reach `localhost`, so "dev" as a
*branch* has to point at a small hosted Supabase project instead. Keep that
hosted dev project cheap and disposable; it's fine for it to get wiped and
reseeded periodically.

## Why EAS Workflows instead of GitHub Actions for the build/test/release steps

GitHub Actions runs the fast stuff (`ci-checks.yml`: lint, typecheck, unit
tests — these need no native build and finish in under a minute). Everything
that needs an actual native build or simulator (Maestro E2E, TestFlight
submission, production releases) runs on **EAS Workflows** instead
(`.eas/workflows/*.yml`), because:

- iOS builds need macOS. GitHub-hosted macOS runners are billed by the minute
  and slow; EAS's build workers are already the thing you're paying for to
  ship the app at all.
- EAS Workflows' pre-packaged `build`, `submit`, `update`, `fingerprint`, and
  `maestro` job types already know how to talk to EAS Build/Update/Submit —
  no credentials or app-store API glue code to maintain separately.
- The fingerprint-based production workflow means a JS-only change ships as
  an instant OTA update instead of waiting on a full App Store review cycle.

EAS Workflows triggers directly off GitHub push/PR events once your repo is
linked (`eas project:link` then connect the repo in the EAS dashboard) — you
don't need to make GitHub Actions call EAS; they run side by side, watching
the same branches.

## One-time setup checklist

1. `npx create-expo-app@latest --template blank-typescript` (or drop this
   scaffold's files into an existing project) — this repo assumes Expo Router,
   adjust if you go a different route.
2. `eas login`, then `eas init` to create the EAS project and get an
   `EAS_PROJECT_ID`.
3. In the EAS dashboard, link this GitHub repo to the EAS project (Project
   Settings → GitHub). This is what lets `.eas/workflows/*.yml` trigger
   automatically.
4. Create the three long-lived branches: `git checkout -b dev`,
   `git checkout -b staging` (both off `main`). Set `main` as the default
   branch people don't push to directly.
5. **Branch protection** (GitHub repo settings → Branches — this can't be
   done from a script without a repo-scoped token, so it's manual):
   - `dev`: require the `CI checks` workflow to pass before merge. Allow
     squash-merge from feature branches.
   - `staging`: require both `CI checks` and `Staging E2E gate` to pass.
     Require at least 1 human review.
   - `main`: same as staging, plus require the PR to come from `staging`
     specifically (there's no native GitHub setting for "only from this
     branch" — the `staging_to_main.md` PR template's checklist is the
     practical substitute; consider a lightweight required-status check
     script later if this gets violated in practice).
6. Set up three Supabase projects (dev-hosted, staging, production) and three
   Clerk instances (test, staging, production) — never share one across
   environments, even for convenience.
7. Copy `.env.dev.example` → `.env.dev`, `.env.staging.example` →
   `.env.staging`, `.env.production.example` → `.env.production`. Fill in
   real values. Run:
   ```
   npm run push-env:dev
   npm run push-env:staging
   npm run push-env:production
   ```
8. Also push `VERCEL_TOKEN` (and, if your Vercel org needs them,
   `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`) into the `preview` and `production`
   EAS environments — the web-deploy workflows read them the same way.
9. Trigger the first build manually for each profile once, so EAS can prompt
   you to generate credentials interactively (subsequent CI-triggered builds
   reuse them):
   ```
   eas build --profile development --platform ios
   eas build --profile preview --platform ios
   eas build --profile production --platform ios
   ```
10. Seed a permanent "E2E Test Community" tenant plus the dedicated E2E test
    account in *both* the dev-hosted and staging Supabase projects — this is
    what `.maestro/*.yml` signs in as and joins. Never point Maestro at a
    real community.
11. **Slack notifications** (`staging-release.yml`'s `notify` job): this uses
    EAS Workflows' pre-packaged `slack` job type. I haven't verified its exact
    `params` shape against current docs — check
    [the pre-packaged jobs reference](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/)
    and connect Slack in the EAS dashboard (Project Settings → Integrations)
    before relying on it; treat that one job as unverified until you've seen
    it actually post a message.

## The agent-based flow this is built for

The intent: an agent (Claude Code or similar) works directly on a feature
branch off `dev`, opens a PR into `dev`, and the `CI checks` workflow is the
first-line judge — an agent's PR that fails lint/typecheck/tests should never
reach a human's queue at all. A human reviews only:

- PRs from a feature branch into `dev` (light review — the CI gate already
  caught the mechanical stuff; this is about "is this the right approach")
- The periodic `dev` → `staging` PR (using `dev_to_staging.md`), gated on the
  full Maestro suite passing
- The periodic `staging` → `main` PR (using `staging_to_main.md`), gated on
  time-on-TestFlight plus the same checks

This means the *volume* of human attention scales with releases, not with
commits — an agent can iterate on `dev` all day without a human in the loop
for each change, as long as the CI gates are trustworthy. That trustworthiness
is the whole point of having a real Maestro suite rather than only unit
tests: unit tests catch broken logic, but only an E2E flow catches "the
sign-in screen doesn't render" or "the join button is silently unreachable."

## What's deliberately NOT automated yet

- Database migrations aren't wired into any workflow here — promoting a
  schema change from staging to production is still a manual, reviewed step.
  Automating that safely (migration-before-deploy ordering, rollback) is a
  separate piece of work, not bundled into this scaffold.
- There's no automated rollback trigger on a bad production Maestro result —
  production doesn't run Maestro at all in this setup (the staging gate is
  the last automated check). Add a production smoke test only once you trust
  it not to false-positive against real user data.
