## Promoting staging → main

This PR ships to production: a native build + App Store submission (if the
fingerprint changed) or an OTA update to everyone (if it didn't).

### What's included

<!-- Link the TestFlight build(s) this was actually tested on, not just the PR diff. -->

### Before merging

- [ ] This has been running on TestFlight for at least [X days — fill in your own bar] with no new crashes reported
- [ ] `.env.production` has any new variables this batch needs, already pushed to EAS's `production` environment
- [ ] If this touches the `activities`, `attendance`, `alter_ego_matches`, or `moderation_queue` tables: the production Supabase migration has been reviewed separately, not just bundled into this diff
- [ ] Rollback plan: OTA revert (`eas update:revert`) is sufficient given this, or it isn't and here's the additional step: ___

### Reviewer checklist

- [ ] This is not the first person to look at this change — it was already reviewed once going into staging
- [ ] No open item from the spec's §10 open questions is being resolved silently by this merge instead of by an explicit decision
