param(
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF
)

if (-not $ProjectRef) { $ProjectRef = "yemradvxmwadlldnxtpz" }

Write-Host "`n== v31-production-deploy-ready-keep-dev-files Supabase Production Deploy =="
Write-Host "Project ref: $ProjectRef`n"
Write-Host "1) Before running this script, apply:"
Write-Host "   supabase/sql/RUN_IN_SUPABASE_SQL_EDITOR.sql`n"

supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { Write-Error "فشل ربط مشروع Supabase."; exit $LASTEXITCODE }

supabase secrets set `
  SITE_URL="https://yehia-gamal.github.io" `
  ALLOWED_ORIGINS="https://yehia-gamal.github.io,https://yehia-gamal.github.io/HR-Operations-Platform,http://localhost:5500,http://127.0.0.1:5500,http://localhost:4173,http://127.0.0.1:4173" `
  WEBAUTHN_ENABLED="false" `
  --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { Write-Error "فشل ضبط secrets المطلوبة."; exit $LASTEXITCODE }

$functions = @(
  "admin-create-user",
  "admin-update-user",
  "resolve-login-identifier",
  "passkey-register",
  "send-attendance-reminders",
  "send-push-notifications"
)

foreach ($fn in $functions) {
  Write-Host "`nنشر الدالة: $fn"
  supabase functions deploy $fn --project-ref $ProjectRef
  if ($LASTEXITCODE -ne 0) {
    Write-Error "فشل نشر الدالة $fn"
    exit $LASTEXITCODE
  }
  Write-Host "تم نشر الدالة $fn"
}

Write-Host "`nتم نشر دوال Supabase لإصدار v31."
Write-Host "بعدها شغّل ملف التحقق: supabase/sql/VERIFY_AFTER_SUPABASE_DEPLOY.sql"
