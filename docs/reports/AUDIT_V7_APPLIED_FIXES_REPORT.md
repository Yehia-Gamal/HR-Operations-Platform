# Audit V7 Applied Fixes Report

**Version:** 1.3.2-audit-v7-hardening  
**Date:** 2026-05-02

## Applied security fixes

- Kept `shared/js/supabase-config.js` as a safe placeholder without real Supabase project ref or publishable key.
- Ensured `.gitignore` blocks `shared/js/supabase-config.js`, `server.*.log`, `*.env.local`, `node_modules/`, `supabase/.temp/`, and `supabase/VAPID_SECRETS_TO_SET.env`.
- Replaced real project ref mentions in deployment docs with `YOUR_PROJECT_REF`.
- Added `041_audit_v7_security_mobile_alignment.sql` and migration mirror to:
  - define a role/permission-based `current_can_view_password_vault()` guard;
  - document `temporary_password` as a legacy boolean flag only;
  - encrypt legacy plaintext `credential_vault.temporary_password` / `temp_password` into `encrypted_temporary_password` when legacy tables exist.
- Split Service Workers so employee devices no longer cache admin UI assets:
  - `sw-employee.js`
  - `sw-admin.js`
  - `sw-executive.js`
  - `sw.js` remains as a safe legacy worker without `app-admin.js`.

## Applied employee mobile fixes

- Restored 5-item bottom navigation:
  - الرئيسية، مطلوب مني، البصمة، الإشعارات، المزيد.
- Moved the remaining routes to a bottom More Sheet.
- Replaced ASCII/Unicode symbols with clear emoji icons.
- Restored and hardened More Sheet CSS.
- Fixed corrupted Arabic labels in the More Sheet.
- Corrected `manifest-employee.json` with absolute `start_url`, `scope`, and `id`.

## Applied UX fixes

- Added toast CSS and kept toast JS active.
- Added haptic feedback on success/error messages.
- Added loading skeleton CSS and a loading skeleton shell while employee pages load.
- Added password-strength indicator to recovery and employee password-change forms.
- Added push-permission explainer before requesting browser notification permission.
- Added print styles for employee pages.
- Added Cairo font links to main portals.
- Added z-index variables and final mobile nav overrides.

## Applied admin performance/logic fixes

- Added 2-minute in-memory cache for `referenceData()`.
- Reduced attendance query limit from 20,000 to 2,000 and shows a warning when exceeded.
- Removed artificial `window.setTimeout(render, 900)` after punch operations.
- Fixed `attendanceExportRows()` to unwrap endpoint results.
- Improved `bindUserActions()` to reuse the already-loaded users array instead of refetching on each click.
- Added debounce to employee and user filters.
- Changed runtime reset-password fallback to generate a cryptographically random temporary password.

## Verification

Passed:

- `npm test`
- `npm run check:js`
- `npm run check:html`
- `npm run check:guards`
- `npm run check:prepublish`
- `npm run check:production`
- `npm run check:final`
- `npm run check:sanitization`
- `npm run check:kpi-policy`
- `npm run check:kpi-cycle`
- `npm run check:management-suite`
- `npm run check:sql`
- `node tools/smoke-check.mjs`
- Static HTTP smoke check for `/`, `/employee/`, `/admin/`, `/executive/`, `/operations-gate/`, and all service worker files.

## Manual actions still required outside this ZIP

- Regenerate the Supabase anon key in Supabase Dashboard if any old key was exposed.
- Generate fresh VAPID keys and store private values only in Supabase Secrets.
- Fill `shared/js/supabase-config.js` locally or via deployment process using the new anon key.
- Run SQL patches through `041_audit_v7_security_mobile_alignment.sql`.
- Deploy Edge Functions after applying SQL.
