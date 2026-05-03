# Ahla Shabab HR Web — Final Sanitized Live Readiness

نسخة ويب إنتاجية مُنظفة قبل مرحلة تحويل APK.

الإصدار: `1.3.1-runtime-alignment`  
آخر Patch مطلوب: `040_runtime_alignment_fix.sql`

## المسارات

- `/employee/` — تطبيق الموظفين.
- `/executive/` — المتابعة التنفيذية المختصرة.
- `/admin/` — لوحة الإدارة الكاملة.
- `/operations-gate/` — بوابة تشغيل موجهة للإدارة أو التنفيذي.

## ملاحظات أمان

- تم تعطيل التشغيل المحلي الاحتياطي في إعدادات الإنتاج: `allowLocalFallback: false`.
- لا يوجد `service_role` داخل المتصفح.
- كود بوابة التشغيل أمامي فقط، ويجب تغييره قبل الرفع.
- الحماية النهائية يجب أن تكون من Supabase Auth + RLS + Edge Functions.
- لا يتم شحن صور موظفين داخل الواجهة. استخدم Supabase Storage bucket: `avatars`.
- تم فصل ملفات إعدادات الإنتاج والتطوير:
  - `shared/js/supabase-config.production.example.js`
  - `shared/js/supabase-config.development.example.js`

## التشغيل المحلي للفحص

```bash
npm test
```

أو:

```bash
npm run check:all
```

## خطوات النشر المختصرة

1. ارفع ملفات الويب على الاستضافة.
2. شغّل SQL patches حتى `040_runtime_alignment_fix.sql`.
3. انشر Edge Functions ومنها `send-push-notification` و`employee-register` لتسجيل الموظفين الذاتي.
4. اضبط Storage buckets.
5. أضف VAPID keys إن كنت ستفعل Web Push الحقيقي.
6. جرّب الأدوار: أدمن، HR، مدير تنفيذي، سكرتير تنفيذي، موظف.

راجع:

- `docs/FINAL_DEPLOY_NOW.md`
- `docs/FINAL_ACCEPTANCE_TEST.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/reports/FINAL_SANITIZATION_LIVE_READINESS_REPORT.md`

## v1.2.1 — KPI Policy Window + HR Scoring

هذه النسخة تثبت نموذج KPI الرسمي: فترة التقييم من يوم 20 إلى 25، إجمالي 100 درجة، وفصل بنود HR الثلاثة عن بنود الموظف والمدير، مع استمرار مسار الاعتماد من الموظف إلى المدير التنفيذي.

آخر Patch مطلوب الآن:

```text
040_runtime_alignment_fix.sql
```

## v1.2.2 — KPI Cycle Control + Reports

- إضافة حالة نافذة التقييم من يوم 20 إلى 25.
- منع إرسال الموظف/المدير خارج نافذة التقييم.
- إضافة Dashboard لمراحل اعتماد KPI.
- إضافة تذكيرات KPI حسب المرحلة.
- إضافة إغلاق دورة KPI.
- إضافة Patch: `040_runtime_alignment_fix.sql`.

## v1.3.0 — Management Structure + HR Operations + Reports

تمت إضافة هيكل الإدارة والفرق، صفحة فريق المدير، صفحة عمليات HR، مسار الشكاوى والتصعيد، ومركز التقارير والتصدير. آخر Patch مطلوب الآن:

```text
040_runtime_alignment_fix.sql
```
