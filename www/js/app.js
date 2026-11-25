/* ============================================================
   STARTUP: theme, back button, navigation
   ============================================================ */

const App = {
  screen: 'home',

  /* put HTML inside the main view with a fade animation */
  setView: function(html){
    const view = document.getElementById('view');
    view.innerHTML = html;
    view.style.animation = 'none';
    /* force reflow so the animation replays */
    void view.offsetWidth;
    view.style.animation = '';
  },

  /* switch screens */
  go: function(name){
    this.screen = name;

    if (name === 'home'){
      renderHome();
      renderNav('home');
    } else if (name === 'stats'){
      renderStats();
      renderNav('stats');
    } else if (name === 'learn'){
      renderLearn();
      renderNav('learn');
    } else if (name === 'profile'){
      renderProfile();
      renderNav(null);
    }
  }
};

/* ---------------- BOTTOM NAV ---------------- */
function renderNav(active){
  const nav = document.getElementById('bottom-nav');

  if (!active){
    nav.classList.add('hidden');
    nav.innerHTML = '';
    return;
  }

  nav.classList.remove('hidden');

  const items = [
    { id: 'home',  label: 'Practice', ico: 'target' },
    { id: 'learn', label: 'Learn',    ico: 'book' },
    { id: 'stats', label: 'Stats',    ico: 'bar-chart' }
  ];

  nav.innerHTML = items.map(function(it){
    return '<button class="nav-btn' + (it.id === active ? ' active' : '') + '" data-nav="' + it.id + '">' +
             icon(it.ico) +
             '<span>' + it.label + '</span>' +
           '</button>';
  }).join('');
}

/* ---------------- THEME ---------------- */
function applyTheme(){
  const mode = DB.settings.theme;
  const systemDark = window.matchMedia &&
                     window.matchMedia('(prefers-color-scheme: dark)').matches;

  const dark = mode === 'dark' || (mode === 'system' && systemDark);

  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0e0f1c' : '#f4f5fb');
}

/* ---------------- ANDROID BACK BUTTON ---------------- */
function pushGuard(){
  try { history.pushState({ mm: 1 }, ''); } catch(e){}
}

window.addEventListener('popstate', function(){
  /* sheet open -> close it */
  if (sheetIsOpen){ closeSheet(); pushGuard(); return; }

  /* dialog open -> close it */
  if (dialogIsOpen){ closeDialog(); pushGuard(); return; }

  /* inside a session -> ask to quit */
  if (Session.active){ Session.confirmQuit(); pushGuard(); return; }

  /* profile or result screen -> back to home */
  if (App.screen !== 'home'){ App.go('home'); pushGuard(); return; }

  /* on home: let the next press exit the app */
});

/* ---------------- INIT ---------------- */
function initApp(){
  loadDB();
  applyTheme();

  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }

  /* sheet + dialog backdrops close on tap */
  document.getElementById('sheet-backdrop').onclick = closeSheet;
  document.getElementById('dialog-backdrop').onclick = closeDialog;

  /* bottom nav taps */
  document.getElementById('bottom-nav').addEventListener('click', function(e){
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    const target = btn.getAttribute('data-nav');
    if (target && target !== App.screen) App.go(target);
  });

  /* block double-tap zoom on the whole app */
  let lastTouch = 0;
  document.addEventListener('touchend', function(e){
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  /* start */
  App.go('home');
  pushGuard();
}

document.addEventListener('DOMContentLoaded', initApp);