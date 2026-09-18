# AGENTS.md

Guidance for AI coding agents (and humans) working in this repo. Read this
before making changes — several of the gotchas below cost real debugging
time to find once already; no need to rediscover them.

## What this is

**Drop-In** — a multi-tenant community app (first tenant: UN17 Village,
Copenhagen) that helps neighbors find each other for spontaneous,
shared-interest activities within a 48-hour horizon. Full product spec
lives in the team's design docs, not in this repo; `plans/README.md`
summarizes what's built and what isn't.

## Tech stack

- **Client**: Expo (React Native) + Expo Router, one codebase for iOS +
  web (`react-native-web`).
- **Auth**: Clerk (`@clerk/expo`), email code + Google/Apple SSO, no
  passwords. **Multi-tenancy is spec'd as Clerk Organizations (tenant =
  org) but not yet built that way** — the scaffold's `tenants` is
  currently a plain Postgres table with no Clerk Org behind it, and
  forced organization-selection is disabled as a temporary unblock. This
  is not an open design choice, it's unfinished work — see
  `plans/05-admin-and-tenancy.md` before touching anything tenant-related.
- **Data**: Supabase (Postgres + RLS + Realtime + Storage + Edge
  Functions), auth delegated entirely to Clerk via a JWT `accessToken`
  callback (`src/lib/supabase.ts`) — Supabase never runs its own sign-in.
- **State/data fetching**: React Query (`@tanstack/react-query`).
- **CI/CD**: EAS Workflows (native builds/release) + GitHub Actions (fast
  lint/typecheck/test checks) + Maestro (E2E). Full strategy in
  `docs/CI-CD.md`; env var reference in `docs/ENVIRONMENTS.md`.

## Repo layout

```
src/app/              Expo Router routes (file-based)
  (auth)/              sign-in — email code + Google/Apple SSO
  (onboarding)/        choose-community → profile-setup → connect-fitness
  (tabs)/              Feed, Alter ego, Profile — the only 3 bottom tabs
  activity/            [id] detail + create (modal)
  admin/, moderation/  pushed stack screens, not tabs
src/components/ui/     Shared primitives (Button, Card, Chip, Avatar, ...)
src/theme/             Design tokens transcribed from design-reference/*.html
src/lib/                Supabase client, React Query client, activity-window logic
src/hooks/              useSupabase() — Clerk-token-bound Supabase client
src/types/database.ts   Hand-written placeholder types — replace with
                         `supabase gen types typescript` once schema exists
design-reference/       Decompressed HTML mockups (source of truth for
                         colors/spacing/typography — don't guess, read these)
docs/                   CI-CD.md, ENVIRONMENTS.md — infra reference
plans/                  What's left to build, in dependency order — start here
.eas/workflows/         EAS Workflows (native build/release CI)
.maestro/                E2E flows (need a seeded test community to pass — see plans/01)
```

## Commands

```
npm install              # requires .npmrc's legacy-peer-deps=true — see below
npm run start             # expo start
npm run ios / android     # expo run:ios / run:android — needs a prebuild first
npm run typecheck         # tsc --noEmit
npm run lint               # eslint .
npm run test                # jest
npx expo-doctor            # project health check
npx expo export --platform web   # fastest way to smoke-test that everything bundles
```

Before considering any change done: `npm run typecheck && npm run lint &&
npm run test` all clean, and ideally `npx expo export --platform web`
bundles without error (catches import/runtime issues typecheck alone
misses, in seconds, no simulator needed).

## Hard-won gotchas

**npm needs `--legacy-peer-deps` — always, via `.npmrc`.** Several
dependencies' peer ranges lag their actual SDK-57-compatible versions.
The committed `.npmrc` (`legacy-peer-deps=true`) makes `npm install` *and*
`npm ci` (what EAS Build runs, no way to pass a flag) resolve identically.
If a future `npm install` without the flag produces a different lockfile,
CI's `npm ci` will fail with "not in sync" — regenerate the lockfile with
the flag active (the default, given `.npmrc`), don't drop the flag.

**`@clerk/expo`'s default `useSignIn`/`useSignUp` are the current
method-based API — never `/legacy`.** `@clerk/expo/legacy` re-exports the
old `create()` + `attemptFirstFactor()` + `setActive()` shape for
maintaining pre-existing code only. New code uses
`signIn.emailCode.sendCode()` / `.verifyCode()`,
`signUp.verifications.*`, and `finalize({navigate})` instead of
`setActive()`. `useSSO()` is the one exception — it still uses
`setActive({session, navigate})`, not `finalize()`. See
`src/app/(auth)/sign-in.tsx` for the current reference implementation, and
the `clerk-expo` skill (if available) for the full method surface — it's
more current than this file if they disagree. Check the installed
version's actual `.d.ts` files under `node_modules/@clerk/expo/dist/` and
`node_modules/@clerk/shared/dist/types/` before trusting any cached
knowledge about the API shape; it moves fast.

**Sign-up screens need `<View nativeID="clerk-captcha" />`.** This Clerk
instance has bot-protection captcha enabled — without this mount point,
sign-up silently fails with no visible error.

**EAS wants `extra.eas.projectId` and `updates.url` as literal strings in
`app.config.ts`, not env-var-derived.** Even though env-var derivation
resolves correctly at runtime, `eas build`/`eas device:create` refuse to
proceed on a dynamic config unless they can find the literal in source
("Cannot automatically write to dynamic config"). See the
`EAS_PROJECT_ID` constant in `app.config.ts`. Neither value is secret —
hardcoding them is correct, not a workaround.

**`@clerk/expo`'s own Expo config plugin is load-bearing, not cosmetic.**
It bumps the iOS deployment target to 17.0 (the native Clerk SDK pod
requires it) and adds the Sign in with Apple entitlement. Omitting it from
`app.config.ts`'s `plugins` array breaks `pod install` with an opaque
CocoaPods/Swift-Package-Manager crash that looks unrelated to Clerk.

**Clerk *instance* config (dashboard settings) matters as much as the
code, and drifts easily.** This instance currently has: no
password/username requirement, Google + Apple OAuth enabled, no forced
organization-selection. Check/change instance config with `clerk config
pull` / `clerk config patch --dry-run` (the Clerk CLI) rather than editing
app code to work around a dashboard setting that doesn't match the product
spec — e.g. a stuck "pending" session with a `choose-organization` task is
an instance-config symptom, not a client bug, and `clerk api
/sessions?user_id=...` will show you the real session status when
`useAuth()`'s local state and a live API error seem to disagree.

**`useAuth().isLoaded` can revert to `false` mid-transition** (e.g. during
`setActive()`), not just at boot. Every route guard that decides
`isSignedIn` must check `isLoaded` first (see `src/components/ui/LoadingScreen.tsx`
and its four call sites) or it can bounce a freshly-authenticated user
back to sign-in.

**`expo-env.d.ts` is gitignored and regenerated locally by `expo
start`/`expo run:*`.** If it's missing, `tsconfig.json`'s `include` won't
reference `expo/types`' `ProcessEnv` augmentation, which changes how
`noUncheckedIndexedAccess` treats `process.env.X` reads — patterns that
read an env var into a module-level `const` and narrow it via an
if-throw, then use it in a function defined later in the same module,
stop typechecking. Prefer reading + checking env vars *inside* the
function that uses them (see `src/lib/supabase.ts`, `src/app/_layout.tsx`)
over module-level narrowing, so this doesn't matter either way.

## Conventions

- Tenant branding (accent color) flows through `useTenantTheme()` — never
  import raw colors from `src/theme/tokens.ts` directly in a screen;
  always go through the hook so per-tenant theming actually works.
- Every screen still on mock data has a `// TODO:` comment naming exactly
  what real query/table replaces it — `grep -rn TODO src/` before starting
  work in `plans/` to make sure the plan and the code still agree.
- Match React Native primitives + `StyleSheet.create` to the existing
  screens' style, not a UI kit — there isn't one beyond
  `src/components/ui/`, and it's deliberately small.

## Where to go next

`plans/README.md` — phased plan for everything between "scaffold" and
"fully functional app," in dependency order, with every open TODO mapped
to a plan file.
