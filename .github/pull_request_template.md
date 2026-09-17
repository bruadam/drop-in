<!--
If this PR targets dev -> staging or staging -> main specifically, GitHub
should offer the more specific template for that instead (see the
?template= links in CONTRIBUTING or just pick manually from the "Preview"
dropdown when opening the PR). This default covers everything else,
including agent-opened PRs into dev from a feature branch.
-->

## What changed and why

<!-- One or two sentences. If this was agent-authored, name the prompt/task
     briefly rather than pasting the whole conversation. -->

## How this was verified

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Ran locally against `supabase start` + a Clerk dev instance and manually checked the affected flow(s)

## Screenshots / recording (UI changes only)

<!-- Drag in a screenshot or a short screen recording. -->

## Anything the reviewer should specifically look at

<!-- Sharp edges, deliberate trade-offs, things you're unsure about. -->
