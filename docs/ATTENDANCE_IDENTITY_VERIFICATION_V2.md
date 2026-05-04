# Attendance Identity Guard — V2 Server Review

هذه الإضافة تكمل نظام منع التلاعب في البصمة وتضيف طبقة تحقق خادمية بجانب تحقق المتصفح.

## ما أضيف في V2

1. فحص خادمي لاستخدام نفس `device_fingerprint_hash` لأكثر من موظف خلال 30 دقيقة.
2. رفع علامة خطر جديدة: `SERVER_SHARED_DEVICE_RECENT`.
3. تحويل البصمة تلقائياً للمراجعة عند ظهور العلامة.
4. Patch 052 يحتوي على:
   - `attendance_identity_review_queue`
   - `review_attendance_identity_check(...)`
   - سياسات Storage للـ bucket `punch-selfies`
5. لوحة الأدمن ترسل `identityCheckId` إلى RPC عند الاعتماد/الرفض إن كان موجوداً.

## ترتيب التشغيل

1. تأكد من تشغيل Patch 051.
2. أنشئ bucket باسم `punch-selfies`.
3. شغّل Patch 052.
4. اختبر من جهاز واحد مع حسابين مختلفين خلال 30 دقيقة؛ يجب ظهور `SERVER_SHARED_DEVICE_RECENT` وتحويل الحركة إلى مراجعة HR.

## ملاحظات أمان

- لا تعتمد على localStorage وحده لكشف الجهاز المشترك؛ V2 يضيف تحققاً من قاعدة البيانات.
- ما زال التحقق الحقيقي من WebAuthn يحتاج challenge server-side كامل قبل تفعيل passkeys كعامل أمان وحيد.
