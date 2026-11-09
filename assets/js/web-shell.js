// Web-only helpers (not used in the Android app).
(function () {
  // 1. Service worker (offline play + fast loads)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  // 2. Pause music when tab/app is hidden, resume on return
  document.addEventListener('visibilitychange', function () {
    var bgm = document.getElementById('bgm');
    if (!bgm) return;
    if (document.hidden) {
      if (!bgm.paused) { bgm.pause(); bgm.dataset.pausedByLifecycle = '1'; }
    } else if (bgm.dataset.pausedByLifecycle === '1') {
      bgm.dataset.pausedByLifecycle = '0';
      bgm.play().catch(function () {});
    }
  });

  // 3. "Turn your phone upright" overlay (iOS can't lock orientation)
  var css = document.createElement('style');
  css.textContent = '#rotateGuard{display:none;position:fixed;inset:0;z-index:5000;background:#0B3D66;color:#fff;' +
    'font-family:"Baloo 2",sans-serif;text-align:center;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:24px}' +
    '#rotateGuard .ico{font-size:48px}#rotateGuard b{font-size:20px}' +
    '@media (orientation:landscape) and (max-height:520px) and (pointer:coarse){#rotateGuard{display:flex}}';
  document.head.appendChild(css);
  function addGuard() {
    var d = document.createElement('div');
    d.id = 'rotateGuard';
    d.innerHTML = '<div class="ico">📱</div><b>Please turn your phone upright</b><span>Genso Game is played in portrait mode.</span>';
    document.body.appendChild(d);
  }
  if (document.body) addGuard(); else document.addEventListener('DOMContentLoaded', addGuard);

  // 4. iOS "Add to Home Screen" hint (menu page only)
  try {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    var onMenu = /(^|\/)(index\.html)?$/.test(location.pathname);
    var KEY = 'genso_install_hint_dismissed';
    if (isIOS && !standalone && onMenu && !localStorage.getItem(KEY)) {
      setTimeout(function () {
        var h = document.createElement('div');
        h.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:4000;' +
          'background:rgba(11,61,102,.96);color:#fff;border-radius:16px;padding:14px 16px;font:600 14px/1.35 "Baloo 2",sans-serif;' +
          'box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center';
        h.innerHTML = '<div style="flex:1">Play like an app: tap <b>Share</b> <span style="font-size:17px">⬆️</span> then <b>Add to Home Screen</b>.</div>' +
          '<button style="background:#fff;color:#0B3D66;border:0;border-radius:10px;padding:8px 12px;font:700 13px \'Baloo 2\',sans-serif">Got it</button>';
        h.querySelector('button').onclick = function () {
          try { localStorage.setItem(KEY, '1'); } catch (e) {}
          h.remove();
        };
        document.body.appendChild(h);
      }, 1500);
    }
  } catch (e) {}
})();
