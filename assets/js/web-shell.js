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

  // 4. Touch devices: no browser long-press menu / text selection, and fix the hover hint
  var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  if (coarse) {
    var c2 = document.createElement('style');
    c2.textContent = 'html,body,a,img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';
    document.head.appendChild(c2);
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('DOMContentLoaded', function () {
      var f = document.querySelector('.footnote');
      if (f) f.textContent = 'tap a card to jump in';
    });
  }

  // 5. Page never scrolls by itself (browser URL bar changes the viewport height)
  var c3 = document.createElement('style');
  c3.textContent = 'html,body{overscroll-behavior:none}#stage{overflow:hidden!important}';
  if (document.querySelector('script[src*="web-shell"]') && /genso-game/.test(location.pathname)) document.head.appendChild(c3);

  // 5b. Menu page: no scrollbar flash when a card expands; keep footnote clear of the bottom bar
  if (/(^|\/)(index\.html)?$/.test(location.pathname)) {
    var c4 = document.createElement('style');
    c4.textContent = '#stage{scrollbar-width:none;padding-bottom:64px!important}#stage::-webkit-scrollbar{display:none}';
    document.head.appendChild(c4);
  }

  // 6. "Get the app" bar on the menu page (hidden once installed to the home screen)
  try {
    var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    var onMenu = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (onMenu && !standalone) {
      var PLAY = 'https://play.google.com/store/apps/details?id=com.opyian.gensogame';
      var st = document.createElement('style');
      st.textContent =
        '#getApp{position:fixed;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3000;display:flex;gap:8px;justify-content:center;padding:0 10px}' +
        '#getApp a,#getApp button{flex:0 1 auto;font:700 13px "Baloo 2",sans-serif;color:#0B3D66;background:rgba(255,255,255,.92);border:0;border-radius:999px;padding:9px 14px;text-decoration:none;box-shadow:0 3px 10px rgba(0,0,0,.25);cursor:pointer;white-space:nowrap}' +
        '#iosModal{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:20px}' +
        '#iosModal.show{display:flex}#iosModal .box{background:#fff;color:#0B3D66;border-radius:18px;max-width:340px;width:100%;padding:20px;font:600 15px/1.45 "Baloo 2",sans-serif}' +
        '#iosModal h3{margin:0 0 8px;font-size:18px}#iosModal ol{margin:8px 0 14px;padding-left:20px}#iosModal button{width:100%;background:#0B3D66;color:#fff;border:0;border-radius:12px;padding:10px;font:700 14px "Baloo 2",sans-serif}';
      document.head.appendChild(st);
      var init = function () {
        var bar = document.createElement('div'); bar.id = 'getApp';
        bar.innerHTML = '<a href="' + PLAY + '" target="_blank" rel="noopener">▶ Android: Google Play</a><button type="button">iPhone: add to Home Screen</button>';
        var m = document.createElement('div'); m.id = 'iosModal';
        m.innerHTML = '<div class="box"><h3>Play it like an app on iPhone</h3><ol><li>Open <b>gensogame.com</b> in <b>Safari</b></li><li>Tap the <b>Share</b> button (square with an arrow)</li><li>Choose <b>Add to Home Screen</b></li></ol><button type="button">Got it</button></div>';
        bar.querySelector('button').onclick = function () { m.classList.add('show'); };
        m.querySelector('button').onclick = function () { m.classList.remove('show'); };
        m.onclick = function (e) { if (e.target === m) m.classList.remove('show'); };
        document.body.appendChild(bar); document.body.appendChild(m);
      };
      if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
    }
  } catch (e) {}
})();
