import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { options, json } from '../_shared/cors.ts';

type PushTarget = {
  id: string;
  user_id?: string | null;
  employee_id?: string | null;
  endpoint: string;
  p256dh?: string | null;
  auth?: string | null;
  payload?: { keys?: { p256dh?: string; auth?: string } } | null;
};

function compactText(value: unknown, fallback = '') {
  return String(value || fallback).trim();
}

async function callerIsAdmin(adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, role_id, roles:role_id(slug, permissions)')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const role = Array.isArray(data?.roles) ? data.roles[0] : data?.roles;
  const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
  return permissions.includes('*')
    || permissions.includes('alerts:manage')
    || ['admin', 'executive', 'executive-secretary', 'hr-manager'].includes(String(role?.slug || ''));
}

function subscriptionFromRow(row: PushTarget) {
  const p256dh = row.p256dh || row.payload?.keys?.p256dh || '';
  const auth = row.auth || row.payload?.keys?.auth || '';
  if (!row.endpoint || !p256dh || !auth) return null;
  return { endpoint: row.endpoint, keys: { p256dh, auth } };
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
  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json(req, { error: 'UNAUTHORIZED' }, 401);
  try {
    if (!await callerIsAdmin(adminClient, authData.user.id)) return json(req, { error: 'FORBIDDEN' }, 403);
  } catch (error) {
    return json(req, { error: 'ADMIN_CHECK_FAILED', detail: error instanceof Error ? error.message : String(error) }, 400);
  }

  const body = await req.json().catch(() => ({}));
  const title = compactText(body.title, 'نظام الحضور');
  const message = compactText(body.body || body.message, 'لديك تنبيه جديد.');
  const route = compactText(body.route, 'notifications');
  const notificationId = compactText(body.notificationId);
  const employeeId = compactText(body.employeeId);
  const userId = compactText(body.userId);

  let query = adminClient
    .from('push_subscriptions')
    .select('id,user_id,employee_id,endpoint,p256dh,auth,payload')
    .eq('status', 'ACTIVE');
  if (userId) query = query.eq('user_id', userId);
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (!userId && !employeeId && body.audience !== 'all') {
    if (notificationId) {
      const { data: note, error: noteError } = await adminClient
        .from('notifications')
        .select('user_id,employee_id,title,body,route')
        .eq('id', notificationId)
        .single();
      if (noteError) return json(req, { error: noteError.message }, 400);
      if (note?.user_id) query = query.eq('user_id', note.user_id);
      else if (note?.employee_id) query = query.eq('employee_id', note.employee_id);
    } else {
      return json(req, { error: 'TARGET_REQUIRED' }, 400);
    }
  }

  const { data: rows, error: rowsError } = await query.limit(500);
  if (rowsError) return json(req, { error: rowsError.message }, 400);

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const payload = JSON.stringify({ title, body: message, url: `/employee/#${route}`, notificationId });
  const results = [];

  for (const row of (rows || []) as PushTarget[]) {
    const subscription = subscriptionFromRow(row);
    if (!subscription) {
      results.push({ id: row.id, ok: false, error: 'INVALID_SUBSCRIPTION' });
      continue;
    }
    try {
      await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 });
      await adminClient.from('push_subscriptions').update({ last_sent_at: new Date().toISOString(), last_error: '' }).eq('id', row.id);
      results.push({ id: row.id, ok: true });
    } catch (error) {
      const statusCode = (error as any)?.statusCode || 0;
      const errorText = error instanceof Error ? error.message : String(error);
      const patch: Record<string, unknown> = { last_error: errorText, updated_at: new Date().toISOString() };
      if ([404, 410].includes(Number(statusCode))) patch.status = 'EXPIRED';
      await adminClient.from('push_subscriptions').update(patch).eq('id', row.id);
      results.push({ id: row.id, ok: false, statusCode, error: errorText });
    }
  }

  if (notificationId) {
    const sent = results.filter((item) => item.ok).length;
    const failed = results.length - sent;
    await adminClient.from('notifications').update({
      push_sent_at: sent ? new Date().toISOString() : null,
      push_status: failed ? 'PARTIAL_OR_FAILED' : 'SENT',
      push_error: failed ? `${failed} failed` : '',
    }).eq('id', notificationId);
  }

  return json(req, { ok: true, attempted: results.length, sent: results.filter((item) => item.ok).length, results });
});
