# Production Deployment Guide - V31 Clean

## 1) SQL Editor

Ø´ØºÙ‘Ù„ Ù…Ù„Ù ÙˆØ§Ø­Ø¯ ÙÙ‚Ø·:

```text
supabase/sql/RUN_IN_SUPABASE_SQL_EDITOR.sql
```

Ø¨Ø¹Ø¯ Ù†Ø´Ø± Ø§Ù„Ø¯ÙˆØ§Ù„ Ø´ØºÙ‘Ù„:

```text
supabase/sql/VERIFY_AFTER_SUPABASE_DEPLOY.sql
```

## 2) Edge Functions

Ù…Ù† PowerShell:

```powershell
.\DEPLOY_SUPABASE_PRODUCTION.ps1
```

Ø£Ùˆ Ù…Ù† Bash:

```bash
./DEPLOY_SUPABASE_PRODUCTION.sh
```

Ø§Ù„Ø¯ÙˆØ§Ù„ Ø§Ù„Ù†Ø´Ø·Ø© ÙÙ‚Ø·:

```text
admin-create-user
admin-update-user
resolve-login-identifier
passkey-register
send-attendance-reminders
send-push-notifications
```

## 3) GitHub Pages

Ø§Ø±ÙØ¹ Ù…Ø­ØªÙˆÙŠØ§Øª Ø­Ø²Ù…Ø©:

```text
hr_ahla_shabab_v31_public_pages_upload.zip
```

## 4) ØªÙ†Ø¸ÙŠÙ Ø§Ù„ÙƒØ§Ø´ Ø¨Ø¹Ø¯ Ø§Ù„Ø±ÙØ¹

```js
HR_CLEAR_APP_CACHE()
```

## 5) Ø§Ù„Ø£Ø±Ø´ÙŠÙ

Ø£ÙŠ Ù…Ù„ÙØ§Øª Ù‚Ø¯ÙŠÙ…Ø© Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙ‚Ø· Ù„Ù„Ø±Ø¬ÙˆØ¹ Ø¯Ø§Ø®Ù„ `_archive`ØŒ ÙˆÙ„Ø§ ÙŠØªÙ… ØªØ´ØºÙŠÙ„Ù‡Ø§ ÙÙŠ Ø§Ù„Ù†Ø´Ø± Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ.
