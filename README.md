# Drop-In — CI/CD scaffold

This is infrastructure scaffolding, not the app itself — it assumes an Expo
Router project either already exists or gets created alongside these files
(`npx create-expo-app@latest --template blank-typescript`).

Start here: **[docs/CI-CD.md](docs/CI-CD.md)** — the full branch strategy,
one-time setup checklist, and how the agent-based PR flow is meant to work.

Then: **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)** — what every env
variable is for and where it lives.

## Quick local start

```
cp .env.example .env    # fill in your local Supabase + Clerk dev keys
npm install
npx expo install --fix  # aligns exact versions to this Expo SDK — do this
                         # before trusting package.json's pinned versions verbatim
supabase start           # local Postgres, separate terminal
npm start
```

## Before every commit

```
npm run lint
npm run typecheck
npm test
```

All three also run in CI on every PR (`.eas/workflows/ci-checks.yml`) — running
them locally first just means you find out in seconds instead of waiting on
the pipeline.
