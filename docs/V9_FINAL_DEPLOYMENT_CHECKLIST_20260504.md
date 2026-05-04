# V9 Final Deployment Checklist — 2026-05-04

هذه القائمة مخصصة للنسخة التي عالجت تقرير V9 وتحتوي على تعديلات الحضور، KPI، الشكاوى، V5 enhancements، وV9 hardening.

## 1) قبل رفع الملفات

- تأكد أن الملفات التالية غير موجودة داخل الحزمة العامة:
  - `supabase/.temp/`
  - `node_modules/`
  - `PRIVATE_SECRETS/`
  - `shared/data/authorized-employees.json`
- تأكد أن `shared/js/supabase-config.js` يتم توليده من بيئة النشر أو GitHub Secrets.
- لا تضع `service_role` أو `VAPID_PRIVATE_KEY` أو `SUPABASE_ACCESS_TOKEN` في أي ملف داخل المستودع.

## 2) Supabase Secrets المطلوبة

اضبط في Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `LOGIN_RATE_LIMIT_SALT`
- `LOGIN_RESOLVE_MAX_ATTEMPTS`
- `LOGIN_RESOLVE_BLOCK_MINUTES`

وقبل تشغيل Patch 044 اضبط:

- `app.vault_key`

وقبل تشغيل Patch 045 فعّل:

- `pg_cron`

## 3) ترتيب SQL

إذا كانت قاعدة البيانات بها 001–043 بالفعل، شغّل الملف الموسّع التالي من Supabase SQL Editor:

```text
supabase/sql/PRODUCTION_SQL_EDITOR_PATCHES_044_TO_074_ALL_EXPANDED.sql
```

هذا الملف لا يستخدم `\i`، ومصمم للصق المباشر داخل SQL Editor.

## 4) Edge Functions

انشر الوظائف المتاحة في مشروعك، خصوصًا:

```bash
supabase functions deploy admin-create-user --project-ref yemradvxmwadlldnxtpz
supabase functions deploy admin-update-user --project-ref yemradvxmwadlldnxtpz
supabase functions deploy resolve-login-identifier --project-ref yemradvxmwadlldnxtpz
supabase functions deploy passkey-register --project-ref yemradvxmwadlldnxtpz
supabase functions deploy employee-register --project-ref yemradvxmwadlldnxtpz
supabase functions deploy send-push-notification --project-ref yemradvxmwadlldnxtpz
```

## 5) Storage Buckets

تأكد من وجود:

- `avatars`
- `punch-selfies`
- `employee-attachments`

## 6) بعد الرفع

افتح:

```text
/health.html
```

ثم نفّذ اختبارات القبول من ملف:

```text
docs/V9_FINAL_LIVE_ACCEPTANCE_TESTS_20260504.md
```
