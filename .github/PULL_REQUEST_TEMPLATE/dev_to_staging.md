## Promoting dev → staging

This PR merges accumulated `dev` work into `staging`, where it'll build against
the staging (preview) backend and go to TestFlight internal testers.

### What's included

<!-- A short changelog since the last dev -> staging merge is more useful
     here than a diff of every individual commit. -->

### Gate status

- [ ] `Staging E2E gate` workflow is green on this PR (full Maestro suite — CI blocks the merge until it is)
- [ ] No open spec questions (see the product spec's §10) are silently assumed by anything in this batch
- [ ] Checked whether any `.env.staging` values need updating before this ships (new env var? update the EAS "preview" environment first)

### Reviewer checklist

- [ ] Skimmed the diff for anything that looks like it was written for `dev`'s hosted test backend but would break against real staging data
- [ ] Confirmed this doesn't silently change the schema in a way the staging Supabase project hasn't been migrated for yet
