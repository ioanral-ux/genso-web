// Shared across index.html, genso-game.html, genso-game-kawaii.html.
// Handles two things Capacitor doesn't do for you automatically:
//   1. Pausing background music when the app is sent to the background
//      (Home button, app switcher, screen lock) and resuming it on return —
//      otherwise the <audio> element just keeps playing invisibly.
//   2. A standard "press back again to exit" pattern on the hardware/gesture
//      back button, so a single accidental back-press doesn't dump the
//      player out of the app.
(function () {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App) return; // running in a plain desktop browser preview, not the wrapped app

  // ---- 1. Pause/resume bgm on background/foreground ----
  App.addListener('appStateChange', ({ isActive }) => {
    const bgm = document.getElementById('bgm');
    if (!bgm) return;
    if (isActive) {
      // Only resume if the player hadn't manually muted it before backgrounding.
      if (bgm.dataset.pausedByLifecycle === '1') {
        bgm.play().catch(() => {});
        bgm.dataset.pausedByLifecycle = '0';
      }
    } else {
      if (!bgm.paused) {
        bgm.pause();
        bgm.dataset.pausedByLifecycle = '1';
      }
    }
  });

  // ---- 2. Double-back-to-exit ----
  let lastBackPress = 0;
  const EXIT_WINDOW_MS = 2000;

  function showExitToast() {
    let toast = document.getElementById('exit-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'exit-toast';
      toast.textContent = 'Press back again to exit';
      toast.style.cssText = `
        position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
        background:rgba(20,20,20,0.85); color:#fff;
        font-family:'JetBrains Mono','Baloo 2',sans-serif; font-size:13px;
        padding:10px 18px; border-radius:999px; z-index:9999;
        pointer-events:none; opacity:0; transition:opacity 0.2s ease;
      `;
      document.body.appendChild(toast);
    }
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, EXIT_WINDOW_MS - 100);
  }

  App.addListener('backButton', () => {
    // On the splash/menu screen (index.html), back should exit directly —
    // there's nothing "back" from, UNLESS a Settings or High Scores overlay
    // is currently open on top of it, in which case back should close that
    // overlay first rather than dumping the player out of the app.
    const isGameScreen = document.body.classList.contains('genso-game-screen')
      || !!document.getElementById('game');

    if (!isGameScreen) {
      const openOverlayEl = document.querySelector('.settings-overlay.show');
      if (openOverlayEl && typeof window.closeOverlay === 'function') {
        window.closeOverlay(openOverlayEl);
        return;
      }
      App.exitApp();
      return;
    }

    const now = Date.now();
    if (now - lastBackPress < EXIT_WINDOW_MS) {
      App.exitApp();
    } else {
      lastBackPress = now;
      showExitToast();
    }
  });
})();
