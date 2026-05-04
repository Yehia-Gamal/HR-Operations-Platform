# Ahla Shabab HR

نظام ويب إنتاجي لإدارة الموظفين والحضور والطلبات والتقارير، مع بوابات منفصلة للموظف والإدارة والمدير التنفيذي.

الإصدار الحالي: `1.4.0-full-workflow-live-20260504-v13-production-polish`

## المسارات

- `/employee/` تطبيق الموظفين.
- `/admin/` لوحة HR والإدارة.
- `/executive/` المتابعة التنفيذية.
- `/operations-gate/` بوابة تشغيل الإدارة والتنفيذي.
- `/health.html` فحص صحة سريع.

## التشغيل المحلي

```bash
npm run serve
```

ثم افتح:

```text
http://127.0.0.1:4173/
```

## الفحص

```bash
npm test
npm run check:js
npm run check:html
npm run check:live-deploy-readiness
npm run check:v13-production-polish
```

## النشر

المشروع يعتمد على Supabase للقاعدة والـ Edge Functions. استخدم ملفات SQL داخل `supabase/sql` والوظائف داخل `supabase/functions`.

مستندات التشغيل الحالية:

- `docs/FINAL_DEPLOY_NOW.md`
- `docs/FINAL_ACCEPTANCE_TEST.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/LIVE_DEPLOY_RUNBOOK_20260504.md`
- `docs/LIVE_SMOKE_TEST_MATRIX_20260504.md`
- `docs/SUPABASE_SECRETS_CHECKLIST.md`

## ملاحظات أمان

- لا تضع `service_role` أو أسرار VAPID الخاصة داخل الواجهة.
- ملف `.env` محلي فقط وموجود في `.gitignore`.
- صلاحيات الإنتاج النهائية يجب أن تعتمد على Supabase Auth وRLS وEdge Functions.
- ملفات إعداد Supabase العامة فقط مسموح بها داخل الواجهة.
