# Environment variables

Every variable below lives in exactly one of four places: your own `.env`
(local machine, git-ignored, never pushed anywhere), or EAS's `development` /
`preview` / `production` environment (pushed via `scripts/push-env.mjs` from
`.env.dev` / `.env.staging` / `.env.production`, also git-ignored).

| Variable | Client-visible? | Visibility in EAS | Notes |
|---|---|---|---|
| `APP_ENV` | yes (`EXPO_PUBLIC_*` would be, but this one is read at config-time, not runtime, by `app.config.ts`) | plaintext | `development` \| `preview` \| `production` |
| `EXPO_PUBLIC_SUPABASE_URL` | yes | plaintext | Different Supabase project per environment |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | plaintext | RLS does the real security work — this key is meant to be public |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | secret | Server-side / Edge Functions only. Never reference this with `EXPO_PUBLIC_` prefix or it ships in the client bundle |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | plaintext | Different Clerk instance per environment — test / staging / production are three separate Clerk apps, not one app with three environments |
| `CLERK_SECRET_KEY` | **no** | secret | Server-side only |
| `POLAR_ACCESS_TOKEN` | **no** | secret | Sandbox token for dev/staging, live token for production |
| `POLAR_WEBHOOK_SECRET` | **no** | secret | |
| `EAS_PROJECT_ID` | yes | plaintext | Same across all three environments — one EAS project, not one per environment |
| `VERCEL_TOKEN` | **no** | secret | Used only by the web-deploy workflows, not by the app itself |
| `E2E_TEST_ACCOUNT_EMAIL` / `E2E_TEST_ACCOUNT_PASSWORD` | no | sensitive | Only exists in `development` and `preview`, never `production` — there is no production Maestro run, so no production E2E account should exist at all |
| `E2E_TEST_COMMUNITY_INVITE_CODE` | no | sensitive | Invite code for a seeded, permanent "E2E Test Community" tenant — see `docs/CI-CD.md` step 10 |

## A rule of thumb for new variables

If it's read by client code (anything under `src/` that isn't an Edge
Function) it almost certainly needs the `EXPO_PUBLIC_` prefix and belongs at
`plaintext` visibility — Expo strips anything without that prefix from the
client bundle, so a missing prefix usually means "this quietly doesn't work
in production," not "this is more secure."

If it's read only server-side (Supabase Edge Functions, or this repo's own
CI scripts), it should almost never have a value visible to the client build
at all — `secret` visibility in EAS, no prefix.
