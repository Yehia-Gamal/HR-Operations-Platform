<<<<<<< HEAD
# نظام HR Attendance - أحلى شباب

تم فصل النظام إلى واجهتين مستقلتين تعملان على نفس Supabase ونفس قاعدة البيانات ونفس الصلاحيات.

## التشغيل

- التطبيق الافتراضي للموظفين: `index.html`
- تطبيق الموظفين المباشر: `employee/index.html`
- لوحة الإدارة: `admin/index.html`
- رابط الإدارة المختصر: `admin-login.html`

`index.html` يفتح تطبيق الموظفين فقط. لا يوجد أي معامل رابط يفتح الإدارة من الصفحة الافتراضية، ولا يظهر رابط إدارة داخل تطبيق الموظفين.

يفضل التشغيل عبر Live Server أو أي استضافة HTTPS/localhost، خصوصًا للبصمة وWebAuthn وGPS.

## تفعيل Supabase

النسخة الحالية مضبوطة افتراضيًا على الوضع المحلي الآمن حتى لا تعمل بمفاتيح ناقصة أو مكشوفة.

افتح:

```text
shared/js/supabase-config.js
```

ثم بعد تدوير المفاتيح ونشر Edge Functions، اضبط:

```js
enabled: true,
strict: true,
url: "https://PROJECT.supabase.co",
anonKey: "YOUR_ROTATED_ANON_OR_PUBLISHABLE_KEY"
```

لا تضع `service_role` في أي ملف Frontend.

## ترتيب قاعدة البيانات

1. شغّل `supabase/sql/001_schema_rls_seed.sql`.
2. شغّل ملفات `supabase/sql/patches` بالترتيب الرقمي.
3. انشر Edge Functions:

```bash
supabase functions deploy admin-create-user
supabase functions deploy admin-update-user
supabase functions deploy resolve-login-identifier
supabase functions deploy passkey-register
```

4. اضبط Secrets المذكورة في `.env.example` و `docs/PRODUCTION_CHECKLIST.md`.

## الهيكل

```text
hr_supabase/
├── index.html                  # يفتح تطبيق الموظفين فقط
├── admin-login.html            # رابط مختصر للوحة الإدارة
├── admin/
│   └── index.html              # لوحة الإدارة للأدمن والمديرين
├── employee/
│   └── index.html              # تطبيق موبايل للموظفين
├── shared/
│   ├── css/                    # CSS مشترك + CSS تطبيق الموظف
│   ├── js/                     # API وSupabase وواجهات admin/employee
│   ├── images/                 # اللوجو والأيقونات
│   └── pwa/                    # Manifests منفصلة
├── sw.js                       # Service Worker على مستوى الجذر
├── supabase/                   # SQL / Edge Functions
├── tools/
│   └── reset-cache.html
└── docs/
```

## ملاحظات أمان

- تم تنظيف ملف استيراد الموظفين من البيانات الحقيقية وكلمات المرور المتوقعة.
- تم حذف `.git` و `supabase/.temp` من نسخة التسليم المضغوطة.
- المرفقات الخاصة تستخدم Signed URLs مؤقتة.
- تسجيل الدخول برقم الهاتف عليه Rate Limit من Edge Function.
- بعد أي تحديث افتح `tools/reset-cache.html` لمسح الكاش وService Worker القديم.

## بيانات Demo المحلية

عند عدم تفعيل Supabase، يمكن تجربة الواجهة محليًا بكلمة مرور Demo:

```text

```

استخدمها للتجربة فقط، ولا تعتمد على الوضع المحلي في التشغيل الفعلي.


## تحديث الهيكل الإداري

تم إضافة الهيكل الإداري الخاص بجمعية خواطر أحلى شباب داخل:

- `shared/js/database.js` للوضع المحلي/Demo.
- `supabase/sql/patches/018_ahla_shabab_org_hierarchy.sql` للتطبيق على Supabase.
- `docs/ORGANIZATION_HIERARCHY.md` للتوثيق.

بعد تشغيل Patches السابقة، شغّل Patch رقم 018 لتحديث علاقات المدير المباشر، ثم أنشئ حسابات الدخول الحقيقية من لوحة الإدارة أو Edge Function.

## Stability Pack 2026-04-29-03

تمت إضافة حزمة إصلاحات للحفظ المحلي، الإجازات، إنشاء الموظفين، خزنة كلمات المرور المؤقتة، ولجنة حل المشاكل والخلافات.

للوضع المحلي: أي تعديل يتم حفظه داخل متصفح نفس الجهاز فقط. للحفظ الحقيقي بين الأجهزة يجب تفعيل Supabase.

شغّل SQL Patch التالي بعد patches السابقة:

```sql
supabase/sql/patches/019_stability_passwords_disputes_requests.sql
```

مهم: في الإنتاج لا يمكن قراءة كلمات المرور الأصلية من Supabase Auth. المتاح هو إصدار كلمة مرور مؤقتة جديدة وإجبار الموظف على تغييرها.

## Full Operations Pack 020

تمت إضافة حزمة تشغيل كاملة تشمل التقرير التنفيذي، المهام، مستندات الموظفين، أرصدة الإجازات، ومصفوفة الصلاحيات.

بعد رفع النسخة إلى Supabase شغّل الملف التالي بعد كل الـ patches السابقة:

```sql
supabase/sql/patches/020_full_operations_pack.sql
```

ثم افتح لوحة الإدارة وستجد الصفحات الجديدة:

- تقرير الشيخ محمد.
- أرصدة الإجازات.
- مستندات الموظفين.
- المهام.
- مصفوفة الصلاحيات.

وفي تطبيق الموظف ستجد:

- طلباتي.
- مهامي.
- مستنداتي.


## حزمة OPS Hardening 2026-04-29

أضيفت في هذه النسخة صفحات وميزات جديدة:
- مركز الجودة والإصلاح داخل لوحة الإدارة.
- أتمتة تصعيد الطلبات المتأخرة SLA.
- مركز السياسات والتوقيعات للإدارة.
- صفحة السياسات داخل تطبيق الموظف.
- Patch رقم 021 لتجهيز جداول السياسات والتصعيد والصيانة.
- أدوات فحص أحدث: `node tools/check-js.mjs` و `node tools/smoke-check.mjs`.

بعد التحديث يفضل فتح `tools/reset-cache.html` أو عمل Hard Refresh.


## حزمة الاستكمال 022

تمت إضافة غرفة التحكم، مركز البيانات، والتقارير اليومية. عند التشغيل على Supabase يجب تطبيق الملف:

```text
supabase/sql/patches/022_control_room_data_center_daily_reports.sql
```

بعدها امسح كاش المتصفح من `tools/reset-cache.html`.

## Executive Mobile + Secure Admin Gateway Pack

- رابط الموظفين العام: `/` أو `/employee/`.
- بوابة تشغيل الإدارة غير الظاهرة للموظفين: `/operations-gate/`.
- صفحة المتابعة التنفيذية للموبايل: `/executive/` أو داخل الإدارة `#executive-mobile`.
- لتشغيل طلب الموقع المباشر على Supabase نفّذ Patch رقم `023_executive_mobile_gateway_live_location.sql` بعد كل الـ patches السابقة.
- كود بوابة التشغيل الافتراضي للتجربة المحلية: `LOCAL-DEMO-GATE`. غيّره قبل النشر الحقيقي.

## Continuity Hardening Pack — 2026-04-29

أضيفت حزمة تقوية جديدة تشمل:

- صفحة **اعتمادات حساسة** داخل لوحة الإدارة.
- تحويل حذف الموظف من المستخدم غير التنفيذي إلى طلب اعتماد بدل الحذف المباشر.
- تقوية بوابة التشغيل بقفل مؤقت بعد 5 محاولات خاطئة.
- إظهار طلبات الموقع المباشر المعلقة في الصفحة الرئيسية للموظف.
- Patch جديد لقاعدة البيانات: `024_sensitive_approvals_gateway_hardening.sql`.

بعد استبدال الملفات افتح `tools/reset-cache.html` مرة واحدة أو نفّذ Hard Refresh.

## Smart Operations Pack 025

تمت إضافة قواعد الحضور الذكية، تقارير تنفيذية PDF، أرشيف موظف، مركز مراجعة البصمات، لوحة المدير المباشر، التقييم الشهري، صفحة مطلوب مني الآن، فحص Supabase، تحديثات Database، وBackup تلقائي. شغّل SQL Patches حتى رقم 030 قبل الإنتاج.

## Mobile Executive + Push Fix

- كود بوابة التشغيل التجريبي: `LOCAL-DEMO-GATE`، ويتم تغييره من `shared/js/supabase-config.js` داخل `adminGateway.accessCode`.
- تم تحسين شاشة المتابعة التنفيذية للموبايل وإظهار القائمة الجانبية بشكل صحيح.
- تم تجهيز إشعارات PWA محلية؛ للتنبيهات الحقيقية بين أجهزة مختلفة يلزم HTTPS + Supabase/Push backend.
=======
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
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
