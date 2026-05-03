const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.env.DRY_RUN === "1";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Example:");
  console.error("$env:SUPABASE_URL='https://PROJECT.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='...'; node tools/issue-supabase-passwords.mjs");
  process.exit(1);
}

function normalizePhone(value = "") {
  const ar = "٠١٢٣٤٥٦٧٨٩";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/\s+/g, "")
    .trim();
}

function makePhoneLoginPassword(profile = {}) {
  const phone = normalizePhone(profile.phone || "");
  const digits = phone.replace(/\D/g, "");
  const suffix = (digits.slice(-4) || String(profile.id || profile.email || "0000").replace(/\D/g, "").slice(-4) || "0000").padStart(4, "0");
  return `Ahla@${suffix}#2026A`;
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.error || text || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return data;
}

async function listProfiles() {
  return await supabaseFetch("/rest/v1/profiles?select=id,full_name,email,phone,employee_id,status&order=full_name.asc");
}

async function updateAuthPassword(profile, password) {
  if (DRY_RUN) return { dryRun: true };
  return await supabaseFetch(`/auth/v1/admin/users/${profile.id}`, {
    method: "PUT",
    body: JSON.stringify({
      password,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name || profile.email || profile.phone || profile.id,
      },
    }),
  });
}

async function updateProfile(profile, password) {
  if (DRY_RUN) return null;
  await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "ACTIVE",
      temporary_password: true,
      must_change_password: true,
    }),
  });
  return await supabaseFetch("/rest/v1/credential_vault?on_conflict=id", {
    method: "POST",
    body: JSON.stringify({
      id: `cred-phone-login-ready-${profile.id}`,
      user_id: profile.id,
      employee_id: profile.employee_id || null,
      email: profile.email || "",
      phone: profile.phone || "",
      temporary_password: password,
      status: "PHONE_LOGIN_READY",
      note: "كلمة مرور قوية جاهزة للدخول برقم الهاتف أو البريد، وتظهر في خزنة كلمات المرور للإدارة.",
    }),
  });
}

const profiles = await listProfiles();
const activeProfiles = profiles.filter((profile) => profile.id && (profile.phone || profile.email));
const failures = [];
const issued = [];

for (const profile of activeProfiles) {
  const password = makePhoneLoginPassword(profile);
  try {
    await updateAuthPassword(profile, password);
    await updateProfile(profile, password);
    issued.push({
      id: profile.id,
      name: profile.full_name || "",
      phone: profile.phone || "",
      email: profile.email || "",
      password,
    });
    console.log(`${DRY_RUN ? "DRY" : "OK"} ${profile.phone || profile.email} ${password}`);
  } catch (error) {
    failures.push({ id: profile.id, phone: profile.phone || "", email: profile.email || "", error: error.message });
    console.error(`FAIL ${profile.phone || profile.email}: ${error.message}`);
  }
}

console.log(JSON.stringify({ dryRun: DRY_RUN, total: activeProfiles.length, issued: issued.length, failures }, null, 2));
if (failures.length) process.exit(2);
