const VERSION = '15a7087f0e';
const CACHE = 'genso-' + VERSION;
const CORE = ["./", "apple-touch-icon.png", "assets/fonts/baloo-2-latin-500-normal.woff2", "assets/fonts/baloo-2-latin-600-normal.woff2", "assets/fonts/baloo-2-latin-700-normal.woff2", "assets/fonts/baloo-2-latin-800-normal.woff2", "assets/fonts/fonts.css", "assets/fonts/fredoka-latin-600-normal.woff2", "assets/fonts/fredoka-latin-700-normal.woff2", "assets/fonts/jetbrains-mono-latin-400-normal.woff2", "assets/fonts/jetbrains-mono-latin-500-normal.woff2", "assets/fonts/jetbrains-mono-latin-700-normal.woff2", "assets/fonts/quicksand-latin-500-normal.woff2", "assets/fonts/quicksand-latin-600-normal.woff2", "assets/fonts/quicksand-latin-700-normal.woff2", "assets/fonts/space-grotesk-latin-500-normal.woff2", "assets/fonts/space-grotesk-latin-700-normal.woff2", "assets/images/highscores_laurel.png", "assets/images/highscores_trophy.png", "assets/images/kawaii_background.png", "assets/images/kawaii_banner_2.png", "assets/images/lab_banner_2.png", "assets/images/lab_bg.jpg", "assets/images/logo-v3.png", "assets/images/splash-hero.jpg", "assets/js/app-lifecycle.js", "assets/js/matter.min.js", "assets/js/web-shell.js", "desktop.html", "genso-game-kawaii.html", "genso-game.html", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "index.html", "manifest.webmanifest", "og-image.png"];
const AUDIO = ["assets/audio/genso_splash.mp3", "assets/audio/genso_theme.mp3", "assets/audio/genso_theme_lab.mp3"];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await Promise.allSettled(AUDIO.map(u => c.add(u)));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('genso-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function serveAudio(req) {
  const c = await caches.open(CACHE);
  let res = await c.match(req.url);
  if (!res) {
    const net = await fetch(req.url);
    if (net.ok) c.put(req.url, net.clone()).catch(() => {});
    return net;
  }
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  if (!m[1] && m[2]) { start = buf.byteLength - parseInt(m[2], 10); end = buf.byteLength - 1; }
  end = Math.min(end, buf.byteLength - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const net = await fetch(req, { signal: ctl.signal });
    clearTimeout(t);
    if (net.ok) c.put(req, net.clone());
    return net;
  } catch (_) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html')) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('.mp3')) return e.respondWith(serveAudio(req));
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) return e.respondWith(networkFirst(req));
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    return (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
  })());
});
