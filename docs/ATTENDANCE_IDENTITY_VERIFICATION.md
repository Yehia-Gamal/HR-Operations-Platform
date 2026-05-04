# نظام تحقق هوية البصمة ومنع التلاعب

تمت إضافة طبقة تحقق جديدة للحضور والانصراف لمنع استخدام جهاز واحد لتسجيل عدة موظفين.

## ما الذي تم إضافته؟

1. **Passkey خاص بنفس الموظف**
   - عند تسجيل البصمة، التطبيق لا يطلب أي مفتاح مرور محفوظ على الجهاز.
   - يتم استخدام `allowCredentials` لحصر مفاتيح المرور على المفاتيح المسجلة لهذا الموظف فقط.

2. **بصمة جهاز موثوق**
   - يتم حساب `deviceFingerprintHash` من خصائص الجهاز/المتصفح.
   - أي تغيير في البصمة أو استخدام جهاز غير مطابق يرفع درجة الخطر.

3. **سيلفي فوري عند البصمة**
   - يتم طلب الكاميرا والتقاط صورة سيلفي عند الحضور أو الانصراف.
   - يتم رفع الصورة إلى bucket `punch-selfies`.
   - إذا فشل السيلفي أو تم رفض الكاميرا، لا تضيع المحاولة؛ لكنها تتحول لمراجعة HR بدرجة خطر أعلى.

4. **منع استخدام نفس الجهاز لأكثر من موظف**
   - التطبيق يحتفظ محليًا بآخر بصمات الجهاز لمدة 30 دقيقة.
   - إذا سجل نفس الجهاز لأكثر من موظف خلال الفترة، تظهر علامة `SHARED_DEVICE_RECENT` وتتحول الحركة للمراجعة.
   - Patch 051 يضيف view باسم `attendance_shared_device_alerts` لاكتشاف ذلك على مستوى قاعدة البيانات.

5. **Risk Score**
   - يتم حساب درجة خطر من 0 إلى 100.
   - أمثلة العلامات:
     - `PASSKEY_NOT_IN_EMPLOYEE_ALLOWLIST`
     - `DEVICE_FINGERPRINT_CHANGED`
     - `SHARED_DEVICE_RECENT`
     - `MISSING_SELFIE`
     - `CAMERA_DENIED`
     - `LOW_GPS_ACCURACY`
     - `OUTSIDE_GEOFENCE`

6. **مراجعة HR**
   - إذا كانت درجة الخطر 35 أو أكثر، أو إذا كان الموقع خارج النطاق، تتحول الحركة إلى `requires_review`.
   - لوحة الإدارة تعرض الآن درجة الخطر، العلامات، ورابط السيلفي في صفحات الحضور والمراجعة.

## الملفات المضافة أو المعدلة

- `shared/js/attendance-identity.js`
- `shared/js/employee-app.js`
- `shared/js/api.js`
- `shared/js/supabase-api.js`
- `shared/js/app-admin.js`
- `shared/css/employee.css`
- `supabase/sql/patches/051_attendance_identity_verification.sql`
- `tools/check-attendance-identity.mjs`

## قبل التشغيل الحقيقي

1. شغّل SQL patch:

```sql
-- من SQL Editor
-- supabase/sql/patches/051_attendance_identity_verification.sql
```

2. تأكد من وجود bucket:

```text
punch-selfies
```

3. يجب أن يسمح bucket بالرفع للمستخدمين الموثقين، وأن تكون القراءة حسب سياسة المؤسسة.

4. لا تفعل `WEBAUTHN_ENABLED=true` في Supabase Functions إلا بعد التأكد من جاهزية وظيفة `passkey-register` وإعدادات HTTPS/Origin.

