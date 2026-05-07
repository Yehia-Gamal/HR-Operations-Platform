// Versioned cache name; bump when updating deployment.packageVersion or cacheVersion
const CACHE_NAME = "hr-attendance-v31-live-location-alert-fix-080";
const DEFAULT_OPEN_URL = "./employee/index.html#notifications";
const ASSETS = [
  "./health.html",
  "./employee/index.html",
  "./shared/css/employee.css",
  "./shared/js/database.js",
  "./shared/js/employee-app.js",
  "./shared/js/attendance-identity.js",
  "./shared/pwa/manifest-employee.json",
  "./index.html",
  "./shared/css/styles.css",
  "./shared/css/neon-admin-theme.css",
  "./shared/css/v10-private-deploy-theme.css",
  "./shared/js/api.js",
  "./shared/js/supabase-api.js",
  "./shared/js/supabase-config.js",
  "./shared/js/push.js",
  "./shared/js/register-sw.js",
  "./shared/js/v9-hardening.js",
  "./shared/js/v10-private-deploy-fixes.js",
  "./shared/pwa/manifest.json",
  "./shared/images/ahla-shabab-logo.png",
  "./shared/images/favicon-64.png",
  "./shared/images/icon-192.png",
  "./shared/images/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch((error) => console.warn("HR cache install skipped", error)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("hr-attendance") && key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

function fallbackFor(request) {
  const url = new URL(request.url);
  if (url.pathname.includes("/executive/")) return caches.match("./executive/index.html");
  if (url.pathname.includes("/employee/")) return caches.match("./employee/index.html");
  return caches.match("./index.html");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/rest/v1/") || url.pathname.includes("/functions/v1/") || url.hostname.endsWith("supabase.co")) {
    return;
  }
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || fallbackFor(event.request) || caches.match("./shared/offline.html"))),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø¶ÙˆØ±", body: "Ù„Ø¯ÙŠÙƒ ØªÙ†Ø¨ÙŠÙ‡ Ø¬Ø¯ÙŠØ¯" };
  try { payload = event.data ? event.data.json() : payload; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title || "Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø¶ÙˆØ±", {
    body: payload.body || "Ù„Ø¯ÙŠÙƒ ØªÙ†Ø¨ÙŠÙ‡ Ø¬Ø¯ÙŠØ¯",
    icon: "./shared/images/icon-192.png",
    badge: "./shared/images/favicon-64.png",
    tag: payload.tag || "hr-notification",
    data: payload.data || {},
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = notificationTargetUrl(event.notification.data || {});
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    const targetUrl = new URL(target);
    for (const client of clientList) {
      const clientUrl = new URL(client.url);
      const sameApp = clientUrl.origin === targetUrl.origin
        && clientUrl.pathname.includes("/employee/")
        && targetUrl.pathname.includes("/employee/");
      if (sameApp && "navigate" in client) return client.navigate(target).then((focused) => focused?.focus?.() || focused);
      if (sameApp && "focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
    return undefined;
  }));
});

function notificationTargetUrl(data = {}) {
  const raw = String(data.url || "").trim();
  if (data.route === "location" || data.type === "LIVE_LOCATION_REQUEST") {
    const basePath = new URL(self.registration.scope).pathname;
    const path = basePath.includes("/employee/") ? "./index.html#location" : "./employee/index.html#location";
    return new URL(path, self.registration.scope).href;
  }
  if (raw.startsWith("/employee/")) {
    const hash = raw.includes("#") ? raw.slice(raw.indexOf("#")) : "";
    const basePath = new URL(self.registration.scope).pathname;
    return new URL(basePath.includes("/employee/") ? `./index.html${hash}` : `.${raw}`, self.registration.scope).href;
  }
  return new URL(raw || DEFAULT_OPEN_URL, self.registration.scope).href;
}

self.addEventListener("sync", (event) => {
  if (event.tag === "hr-offline-sync") {
    event.waitUntil(self.clients.matchAll().then((clientsList) => clientsList.forEach((client) => client.postMessage({ type: "SYNC_OFFLINE_QUEUE" }))));
  }
});
