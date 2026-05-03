import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { options, json } from '../_shared/cors.ts';

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return options(req);
  if (req.method !== 'POST') return json(req, { error: 'METHOD_NOT_ALLOWED' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';
  if (!supabaseUrl || !anonKey || !serviceKey) return json(req, { error: 'MISSING_SUPABASE_SECRETS' }, 500);
  if (!vapidPublicKey || !vapidPrivateKey) return json(req, { error: 'MISSING_VAPID_SECRETS' }, 500);

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: callerData, error: callerError } = await userClient.auth.getUser();
  if (callerError || !callerData.user) return json(req, { error: 'UNAUTHORIZED' }, 401);

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role_id, roles:role_id(slug, permissions)')
    .eq('id', callerData.user.id)
    .single();
  if (profileError) return json(req, { error: profileError.message }, 400);
  const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.roles;
  const permissions = role?.permissions || [];
  const allowed = permissions.includes('*') || permissions.includes('alerts:manage') || permissions.includes('users:manage') || ['admin', 'hr-manager'].includes(role?.slug);
  if (!allowed) return json(req, { error: 'FORBIDDEN_NOTIFICATION_SEND' }, 403);

  const body = await req.json().catch(() => ({}));
  const payload = {
    title: String(body.title || 'تنبيه من نظام الحضور'),
    body: String(body.body || body.message || 'لديك إشعار جديد.'),
    tag: String(body.tag || 'hr-notification'),
    data: body.data || {},
  };
  const targetUserIds = asArray(body.targetUserIds);
  const targetEmployeeIds = asArray(body.targetEmployeeIds);

  let query = adminClient.from('push_subscriptions').select('id, user_id, employee_id, endpoint, keys').eq('is_active', true);
  if (targetUserIds.length) query = query.in('user_id', targetUserIds);
  else if (targetEmployeeIds.length) query = query.in('employee_id', targetEmployeeIds);

  const { data: subscriptions, error: subError } = await query.limit(1000);
  if (subError) return json(req, { error: subError.message }, 400);

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const results = [];
  for (const sub of subscriptions || []) {
    try {
      const response = await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
      await adminClient.from('notification_delivery_log').insert({
        push_subscription_id: sub.id,
        target_user_id: sub.user_id,
        status: 'SENT',
        provider_response: { statusCode: response.statusCode, headers: response.headers },
      });
      results.push({ id: sub.id, status: 'SENT' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await adminClient.from('notification_delivery_log').insert({
        push_subscription_id: sub.id,
        target_user_id: sub.user_id,
        status: 'FAILED',
        error: message,
      });
      results.push({ id: sub.id, status: 'FAILED', error: message });
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
      if ([404, 410].includes(statusCode)) await adminClient.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
    }
  }

  return json(req, { ok: true, attempted: results.length, results });
});
