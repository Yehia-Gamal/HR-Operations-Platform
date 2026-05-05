import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { options, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'POST') return json(req, { error: 'METHOD_NOT_ALLOWED' }, 405);

  if (Deno.env.get('WEBAUTHN_ENABLED') === 'false') {
    return json(req, {
      error: 'PASSKEYS_DISABLED',
      message: 'تم تعطيل مفاتيح المرور من إعدادات الخادم WEBAUTHN_ENABLED=false.'
    }, 501);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return json(req, { error: 'MISSING_SUPABASE_SECRETS' }, 500);
  const authHeader = req.headers.get('Authorization') ?? '';
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) return json(req, { error: 'UNAUTHORIZED' }, 401);

  const body = await req.json().catch(() => ({}));
  const credentialId = String(body.credentialId || '').trim();
  if (!credentialId) {
    return json(req, { error: 'CREDENTIAL_ID_REQUIRED', message: 'لم يتم استلام معرف Passkey من المتصفح.' }, 400);
  }
  if (!body.attestationObject || !body.clientDataJSON) {
    return json(req, { error: 'INVALID_WEBAUTHN_RESPONSE', message: 'استجابة Passkey غير مكتملة.' }, 400);
  }

  const { data: profile } = await client
    .from('profiles')
    .select('employee_id')
    .eq('id', authData.user.id)
    .maybeSingle();

  const { data, error } = await client.from('passkey_credentials').upsert({
    user_id: authData.user.id,
    employee_id: profile?.employee_id || null,
    label: body.label || 'Passkey',
    credential_id: credentialId,
    public_key: body.publicKey || body.attestationObject || '',
    transports: body.transports || [],
    platform: body.platform || '',
    device_fingerprint_hash: body.deviceFingerprintHash || null,
    trusted: body.trusted !== false,
    status: 'DEVICE_TRUSTED',
    browser_supported: true,
  }, { onConflict: 'user_id,credential_id' }).select('*').single();
  if (error) return json(req, { error: error.message }, 400);
  await client.from('profiles').update({ passkey_enabled: true }).eq('id', authData.user.id);
  return json(req, { ok: true, credential: data });
});
