# Shared backend instructions

These apps share a centrally managed Supabase backend. Follow these rules for every future change.

## Canonical backend source

- SQL migrations: `D:/git/CASH LEDGER/client-platform/template/supabase/migrations`
- Edge Functions and shared helpers: `D:/git/CASH LEDGER/client-platform/template/supabase/functions`
- Shared Supabase configuration: `D:/git/CASH LEDGER/client-platform/template/supabase/config.toml`

The central template is the source used for future client setup and backend releases. Do not leave a required backend change only in this application's local Supabase folder.

## Making changes

1. For schema, RLS, grants, database functions, triggers, indexes, storage policies, or scheduled database jobs, create a NEW timestamped SQL migration in the canonical migrations folder. Use:
   `supabase migration new descriptive_change_name --workdir "D:/git/CASH LEDGER/client-platform/template"`
2. Never rewrite an existing released migration or the baseline. Never use destructive resets to synchronize clients.
3. Edit Edge Function source in the canonical functions folder, including shared dependencies. Edge Functions are code, not SQL migrations; do not put their source in the migrations folder.
4. Preserve project isolation: no hardcoded production project URLs, keys, client IDs, or external credentials in shared changes. Never commit secrets. Document required secret NAMES and per-client configuration steps, using placeholders only.
5. Keep backend changes backward-compatible with all four apps: millmanagement-system, grm-cash-ledger, team-flow-44-new, and github-to-app123. Consider PA compatibility where relevant, but PA is unfinished and must not be enabled or deployed automatically.
6. Review changes and test locally or on an explicitly approved test project. Do not modify verification expectations merely to hide a failure. Report any settings that need manual per-project setup rather than claiming SQL covers everything.
7. Saving files does NOT apply a database release or deploy an app. Do not run remote migrations, deploy functions, run mutating SQL, unlock release acceptance, publish Netlify, or build/publish Android releases without the user's explicit authorization for the target and operation.
8. Use the central client-platform setup/release workflow for cloned client databases. Do not bypass its safety locks or deploy via an app-local linked project. Original shared production `swxbydfypyojcerentsz` predates the clone migration history and therefore must not be passed through clone-wide migration-history repair. A release to it requires the user's explicit target-and-operation authorization, canonical source files, a narrowly scoped one-time release, pre-release inventory/backup, transactional SQL, verification, rollback notes, and a release report. Never remove or rewrite its unrelated migration-history entries. Test clone `onictiihrbfylgqolvji` is not automatic permission to mutate production.
9. At handoff, list the central files changed, verification performed, pending deployment steps, and whether frontend/Android rebuilds are needed. Separate SQL migrations, Edge Function changes, secrets/settings, and frontend-only changes.

If the canonical folders are unavailable, stop and report the missing central workspace; do not silently create an alternative backend source.

