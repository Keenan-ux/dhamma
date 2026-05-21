// Minimal service worker. Exists only so the app is installable as
// a PWA (browsers require a registered SW for install eligibility).
// Intentionally does NOT register a fetch handler — letting the
// browser handle navigation requests natively avoids the class of
// "stalled refresh" bugs that come from `event.respondWith(fetch(...))`
// passthrough handlers.
//
// skipWaiting + clients.claim mean a new version of this file takes
// over on the next load instead of waiting for all open tabs to
// close. That also self-heals users stuck on a previous version
// of the SW that did intercept fetches.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Clear any caches the previous (or future) SW versions may
    // have populated. Defensive — we don't currently cache, but
    // keeps recovery painless if that ever changes and goes wrong.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
