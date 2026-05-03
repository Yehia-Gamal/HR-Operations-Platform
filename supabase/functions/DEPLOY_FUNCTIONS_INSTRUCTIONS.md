# Edge Functions Deploy Instructions

Use rotated secrets only. Do not print or commit secret values.

## Required Functions

- `admin-create-user`
- `admin-update-user`
- `employee-register`
- `resolve-login-identifier`
- `passkey-register`
- `send-push-notification`

## Required Secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `LOGIN_RATE_LIMIT_SALT` recommended for `resolve-login-identifier`
- `ALLOWED_ORIGINS` recommended for CORS
- `SITE_URL` recommended for CORS

## Deploy

```powershell
$env:SUPABASE_ACCESS_TOKEN = "<ROTATED_SUPABASE_ACCESS_TOKEN>"

npx supabase functions deploy admin-create-user --project-ref "<PROJECT_REF>" --use-api
npx supabase functions deploy admin-update-user --project-ref "<PROJECT_REF>" --use-api
npx supabase functions deploy employee-register --project-ref "<PROJECT_REF>" --use-api
npx supabase functions deploy resolve-login-identifier --project-ref "<PROJECT_REF>" --use-api
npx supabase functions deploy passkey-register --project-ref "<PROJECT_REF>" --use-api
npx supabase functions deploy send-push-notification --project-ref "<PROJECT_REF>" --use-api
```

Set secrets from Supabase Dashboard > Edge Functions > Secrets, or with CLI after placing values only in the current shell environment.

```powershell
npx supabase secrets set `
  SUPABASE_URL="$env:SUPABASE_URL" `
  SUPABASE_ANON_KEY="$env:SUPABASE_ANON_KEY" `
  SUPABASE_SERVICE_ROLE_KEY="$env:SUPABASE_SERVICE_ROLE_KEY" `
  VAPID_PUBLIC_KEY="$env:VAPID_PUBLIC_KEY" `
  VAPID_PRIVATE_KEY="$env:VAPID_PRIVATE_KEY" `
  VAPID_SUBJECT="$env:VAPID_SUBJECT" `
  --project-ref "<PROJECT_REF>"
```

Do not deploy with keys that were pasted into chat or stored in repo files.
