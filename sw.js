<<<<<<< HEAD
const CACHE_NAME = "hr-attendance-server-runtime-push-20260501-01";
const ASSETS = [
  "./index.html",
  "./employee/index.html",
  "./admin/index.html",
  "./admin-login.html",
=======
const CACHE_NAME = "hr-attendance-management-suite-20260502-production";
const DEFAULT_OPEN_URL = "./employee/index.html#notifications";
const ASSETS = [
  "./index.html",
  "./employee/index.html",
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  "./executive/index.html",
  "./operations-gate/index.html",
  "./shared/css/styles.css",
  "./shared/css/employee.css",
<<<<<<< HEAD
  "./shared/js/database.js",
  "./shared/js/api.js",
  "./shared/js/supabase-api.js",
  "./shared/js/supabase-config.js",
  "./shared/js/employee-app.js",
  "./shared/js/app-admin.js",
  "./shared/js/register-sw.js",
  "./shared/pwa/manifest.json",
  "./shared/pwa/manifest-employee.json",
  "./shared/pwa/manifest-admin.json",
=======
  "./shared/js/api.js",
  "./shared/js/supabase-api.js",
  "./shared/js/supabase-config.js",
  "./shared/js/push.js",
  "./shared/js/employee-app.js",
  "./shared/js/executive-app.js",
  "./shared/js/register-sw.js",
  "./shared/pwa/manifest.json",
  "./shared/pwa/manifest-employee.json",
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  "./shared/pwa/manifest-executive.json",
  "./shared/images/ahla-shabab-logo.png",
  "./shared/images/favicon-64.png",
  "./shared/images/icon-192.png",
  "./shared/images/icon-512.png",
];

self.addEventListener("install", (event) => {
<<<<<<< HEAD
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined));
=======
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch((error) => console.warn("HR cache install skipped", error)));
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
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
<<<<<<< HEAD
  if (url.pathname.includes("/employee/")) return caches.match("./employee/index.html");
  if (url.pathname.includes("/executive/")) return caches.match("./executive/index.html");
  if (url.pathname.includes("/operations-gate/")) return caches.match("./operations-gate/index.html");
  if (url.pathname.includes("/admin/")) return caches.match("./admin/index.html");
=======
  if (url.pathname.includes("/admin/")) return caches.match("./admin/index.html");
  if (url.pathname.includes("/executive/")) return caches.match("./executive/index.html");
  if (url.pathname.includes("/employee/")) return caches.match("./employee/index.html");
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  return caches.match("./index.html");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/rest/v1/") || url.hostname.endsWith("supabase.co")) {
    event.respondWith(fetch(event.request));
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
      .catch(() => caches.match(event.request).then((cached) => cached || fallbackFor(event.request))),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "نظام الحضور", body: "لديك تنبيه جديد" };
  try { payload = event.data ? event.data.json() : payload; } catch {}
<<<<<<< HEAD
  const targetUrl = new URL((payload.data && payload.data.url) || payload.url || "./employee/index.html#notifications", self.registration.scope).href;
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  event.waitUntil(self.registration.showNotification(payload.title || "نظام الحضور", {
    body: payload.body || "لديك تنبيه جديد",
    icon: "./shared/images/icon-192.png",
    badge: "./shared/images/favicon-64.png",
    tag: payload.tag || "hr-notification",
<<<<<<< HEAD
    requireInteraction: payload.requireInteraction === true,
    data: { ...(payload.data || {}), url: targetUrl },
=======
    data: payload.data || {},
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  }));
});

self.addEventListener("notificationclick", (event) => {
<<<<<<< HEAD
  const rawTargetUrl = (event.notification && event.notification.data && event.notification.data.url) || "./employee/index.html#notifications";
  const targetUrl = new URL(rawTargetUrl, self.registration.scope).href;
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client) {
        client.focus();
        if ("navigate" in client) return client.navigate(targetUrl);
        return undefined;
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
=======
  event.notification.close();
  const target = event.notification.data?.url || DEFAULT_OPEN_URL;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    return undefined;
  }));
});

<<<<<<< HEAD
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SHOW_NOTIFICATION") return;
  const payload = event.data.payload || {};
  const targetUrl = new URL((payload.data && payload.data.url) || payload.url || "./employee/index.html#notifications", self.registration.scope).href;
  event.waitUntil(self.registration.showNotification(payload.title || "نظام الحضور", {
    body: payload.body || "لديك تنبيه جديد",
    icon: "./shared/images/icon-192.png",
    badge: "./shared/images/favicon-64.png",
    tag: payload.tag || "hr-notification",
    requireInteraction: payload.requireInteraction === true,
    vibrate: payload.vibrate || [160, 80, 160],
    data: { ...(payload.data || {}), url: targetUrl },
  }));
});

=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
self.addEventListener("sync", (event) => {
  if (event.tag === "hr-offline-sync") {
    event.waitUntil(self.clients.matchAll().then((clientsList) => clientsList.forEach((client) => client.postMessage({ type: "SYNC_OFFLINE_QUEUE" }))));
  }
});
