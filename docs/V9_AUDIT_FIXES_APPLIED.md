# V9 Audit Fixes Applied

تم تطبيق ملاحظات تقرير V9 على هذه الحزمة:

- إزالة `supabase/.temp/` من الحزمة.
- إضافة Patch 044 لتشفير `credential_vault`.
- إضافة Patch 045 لتجهيز pg_cron/backup tracking.
- استبدال كلمة المرور المبنية على الهاتف بكلمة مرور عشوائية قوية.
- إضافة `strongEnough()` إلى `admin-update-user`.
- إعادة ترقيم patches 030–034 إلى a/b suffix.
- إزالة التعليق المضلل في `.gitignore` بخصوص `supabase-config.js`.
- إضافة V9 frontend hardening helper: onboarding, push explainer, visibility-aware polling, image compression.

## ملاحظات تشغيل

قبل Patch 044 يجب ضبط `app.vault_key` في Supabase Secrets.
قبل Patch 045 يجب تفعيل `pg_cron` من Supabase Dashboard.
