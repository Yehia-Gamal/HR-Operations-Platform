# Runtime Alignment Fix Report — v1.3.1

تمت مراجعة نسخة `hr_supabase_web_management_hr_reports_v1_3_0(4)` وتطبيق إصلاحات تشغيل تمنع أخطاء Supabase Runtime وSQL Patches.

## أهم ما تم تعديله

1. إصلاح `035_final_sanitization_live_readiness.sql`:
   - حماية حذف `role_permissions` حتى لا يفشل إذا كان الجدول غير موجود.
   - تحويل سياسات `profiles.role` الخاطئة إلى `profiles.role_id + roles.slug`.
   - ترقية جدول `push_subscriptions` بإضافة `employee_id`, `keys`, `user_agent`, `platform`, `is_active`, `updated_at`.

2. إضافة Patch جديد:
   - `supabase/sql/patches/040_runtime_alignment_fix.sql`
   - ونسخة Supabase migration مقابلة:
     `supabase/migrations/20260502074005_040_runtime_alignment_fix.sql`

3. إصلاح سكربتات SQL:
   - `tools/apply-supabase-sql.mjs` يستخدم الآن dependency الموجودة `pg` بدل مكتبة غير مثبتة.
   - `run-patches.mjs` أصبح يعتمد على `SUPABASE_DB_URL` من البيئة بدل أي بيانات اتصال ثابتة.

4. تحسين ربط Supabase Runtime:
   - إضافة endpoints مفقودة إلى `shared/js/supabase-api.js` حتى لا ترجع الصفحات المهمة إلى localStorage في وضع Supabase.
   - شملت: هيكل الإدارة، ربط المدير، فريق المدير، عمليات HR، مسار الشكاوى، مركز التقارير، التقييمات الشهرية، قواعد الحضور الذكية، النسخ الاحتياطي، حالة migrations، مركز إجراءات الموظف.

5. Push Notifications:
   - حفظ اشتراك Web Push أصبح `upsert` على `endpoint`.
   - إرسال إعلان إداري أو تذكير فريق/KPI يحاول استدعاء Edge Function: `send-push-notification`.

6. تحديث أدوات الفحص:
   - إضافة `npm run check:sql`.
   - تحديث الفحوصات لتتوقع Patch 040 وإصدار `1.3.1-runtime-alignment`.

## نتيجة الفحص النهائي

نجحت الأوامر التالية:

```bash
npm test
npm run check:sql
npm run check:production
npm run check:final
npm run check:sanitization
npm run check:kpi-policy
npm run check:kpi-cycle
npm run check:management-suite
npm run check:prepublish
node tools/smoke-check.mjs
```

## ملاحظات مهمة قبل النشر

- ملف `shared/js/supabase-config.js` ما زال يحتوي placeholders آمنة. قبل الإنتاج يجب وضع `url`, `anonKey`, وتفعيل `enabled: true`.
- لا تضع `service_role` في أي ملف frontend.
- يجب تشغيل SQL حتى `040_runtime_alignment_fix.sql`.
- يجب نشر Edge Functions، خصوصًا `send-push-notification` و`employee-register`.
- لتفعيل Web Push يجب ضبط VAPID secrets في Supabase وإضافة المفتاح العام فقط في `push.vapidPublicKey`.


## Patch 041 — Audit V7 hardening
شغّل أيضًا `supabase/sql/patches/041_audit_v7_security_mobile_alignment.sql` بعد Patch 040 لتطبيق حماية خزنة كلمات المرور، Service Worker المنفصل، وتحسينات الموبايل.
