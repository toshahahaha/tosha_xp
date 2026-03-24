// ===================== SITE LOADING (MitchIvin-style) =====================
(function () {
  const MIN_MS = 3200;
  const MAX_MS = 6000;
  const FADE_MS = 280; // must match CSS

  function rand(min, max){ return Math.floor(min + Math.random() * (max - min + 1)); }

  function animateBar() {
    const boot = document.getElementById('site-boot');
    if (!boot) return () => {};
    const blocks = boot.querySelector('.site-boot__barBlocks');
    const track  = boot.querySelector('.site-boot__barTrack');
    if (!blocks || !track) return () => {};

    let raf = 0;
    let start = performance.now();
    const speed = 210; // px/sec

    const loop = (t) => {
      const dt = (t - start) / 1000;
      const w = track.getBoundingClientRect().width;
      const from = -90;
      const to = w + 20;
      const range = to - from;
      const x = from + ((dt * speed) % range);
      blocks.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }

  function startBoot() {
    const boot = document.getElementById('site-boot');
    const login = document.getElementById('login-screen');
    if (!boot || !login) return;

    // Hide login while “Still booting…”
    login.style.display = 'none';
    boot.style.display = 'block';
    boot.classList.remove('is-fading');
    boot.setAttribute('aria-hidden', 'false');

    const stop = animateBar();
    const hold = rand(MIN_MS, MAX_MS);

    const finish = () => {
      stop();
      boot.classList.add('is-fading');
      boot.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        boot.style.display = 'none';
        login.style.display = '';
      }, FADE_MS);
    };

    // Optional skip like the real “boot”: click/Enter/Esc
    const onKey = (e) => (e.key === 'Enter' || e.key === 'Escape') && finish();
    window.addEventListener('keydown', onKey, { once: true });
    boot.addEventListener('click', finish, { once: true });

    setTimeout(finish, hold);
  }

  window.addEventListener('load', startBoot);
})();

// ===================== STATE =====================
let dragState = null;
let resizeState = null;
let activeWindow = null;
let minimizedWindows = {};
let startMenuOpen = false;

// ===================== LOGIN =====================
function doLogin() {
  const loginScreen = document.getElementById('login-screen');
  const welcomeScreen = document.getElementById('welcome-screen');
  const desktop = document.getElementById('desktop');

  loginScreen.style.opacity = '0';
  loginScreen.style.transition = 'opacity 0.6s';

  setTimeout(() => {
    loginScreen.style.display = 'none';
    welcomeScreen.classList.add('show');

    setTimeout(() => {
      welcomeScreen.style.opacity = '0';
      welcomeScreen.style.transition = 'opacity 0.8s';
      desktop.classList.add('show');

      setTimeout(() => {
        welcomeScreen.style.display = 'none';
        document.getElementById('notification').classList.add('show');
        updateClock();
        setInterval(updateClock, 1000);
      }, 800);
    }, 1800);
  }, 600);
}

function doRestart() {
  location.reload();
}

function doLogOff() {
  toggleStartMenu(false);
  document.getElementById('logoff-dialog').classList.add('show');
}

function goToLogin() {
  document.getElementById('logoff-dialog').classList.remove('show');
  document.getElementById('desktop').classList.remove('show');
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.display = '';
  loginScreen.style.opacity = '0';
  setTimeout(() => {
    loginScreen.style.opacity = '1';
  }, 50);
}

function doShutdown() {
  toggleStartMenu(false);
  document.body.innerHTML = '<div style="background:black;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Tahoma,sans-serif;font-size:18px;">It is now safe to turn off your computer.</div>';
}

// ===================== CLOCK =====================
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('clock').textContent = `${h}:${m} ${ampm}`;
}

// ===================== WINDOWS =====================
function openWindow(id) {
  const win = document.getElementById(id);
  win.classList.add('show');
  if (minimizedWindows[id]) {
    win.style.display = 'flex';
    delete minimizedWindows[id];
  }
  setActiveWindow(id);
  addTaskbarItem(id);
  toggleStartMenu(false);
}

function closeWindow(id) {
  const win = document.getElementById(id);
  win.classList.remove('show');
  removeTaskbarItem(id);
  if (minimizedWindows[id]) delete minimizedWindows[id];
}

function minimizeWin(id) {
  const win = document.getElementById(id);
  win.style.display = 'none';
  minimizedWindows[id] = true;
  const tb = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (tb) tb.classList.remove('active');
}

function setActiveWindow(id) {
  document.querySelectorAll('.xp-window').forEach(w => {
    w.classList.remove('active-win');
    w.style.zIndex = '100';
  });
  document.querySelectorAll('.taskbar-item').forEach(t => t.classList.remove('active'));
  const win = document.getElementById(id);
  if (win) {
    win.classList.add('active-win');
    win.style.zIndex = '200';
  }
  const tb = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (tb) tb.classList.add('active');
  activeWindow = id;
}

function addTaskbarItem(id) {
  if (document.querySelector(`.taskbar-item[data-win="${id}"]`)) return;
  const names = {
    'about-me': '👤 About Me',
    'my-resume': '📄 My Resume',
    'my-projects': '🌐 My Projects',
    'contact-me': '✉️ Contact Me',
    'music-player': '🎵 Music Player',
    'minecraft': '⛏️ Minecraft',
    'paint': '🎨 Paint'
  };
  const tb = document.getElementById('taskbar-windows');
  const item = document.createElement('div');
  item.className = 'taskbar-item';
  item.dataset.win = id;
  item.textContent = names[id] || id;
  item.onclick = () => {
    if (minimizedWindows[id]) {
      const win = document.getElementById(id);
      win.style.display = 'flex';
      delete minimizedWindows[id];
      setActiveWindow(id);
    } else if (activeWindow === id) {
      minimizeWin(id);
    } else {
      setActiveWindow(id);
    }
  };
  tb.appendChild(item);
}

function removeTaskbarItem(id) {
  const tb = document.querySelector(`.taskbar-item[data-win="${id}"]`);
  if (tb) tb.remove();
}

// ===================== DRAGGING =====================
function startDrag(e, id) {
  setActiveWindow(id);
  const win = document.getElementById(id);
  const rect = win.getBoundingClientRect();
  dragState = {
    id,
    startX: e.clientX,
    startY: e.clientY,
    origLeft: rect.left,
    origTop: rect.top
  };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

function onDrag(e) {
  if (!dragState) return;
  const win = document.getElementById(dragState.id);
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  win.style.left = (dragState.origLeft + dx) + 'px';
  win.style.top = (dragState.origTop + dy) + 'px';
}

function stopDrag() {
  dragState = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// ===================== RESIZING =====================
function startResize(e, id, direction) {
  e.preventDefault();
  e.stopPropagation();
  setActiveWindow(id);
  const win = document.getElementById(id);
  const rect = win.getBoundingClientRect();
  resizeState = {
    id,
    direction,
    startX: e.clientX,
    startY: e.clientY,
    origLeft:   rect.left,
    origTop:    rect.top,
    origWidth:  rect.width,
    origHeight: rect.height
  };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
  if (!resizeState) return;
  const { id, direction, startX, startY, origLeft, origTop, origWidth, origHeight } = resizeState;
  const win = document.getElementById(id);
  const minW = 300;
  const minH = 200;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  let newLeft   = origLeft;
  let newTop    = origTop;
  let newWidth  = origWidth;
  let newHeight = origHeight;

  if (direction.includes('e')) newWidth  = Math.max(minW, origWidth  + dx);
  if (direction.includes('s')) newHeight = Math.max(minH, origHeight + dy);
  if (direction.includes('w')) {
    newWidth = Math.max(minW, origWidth - dx);
    newLeft  = origLeft + origWidth - newWidth;
  }
  if (direction.includes('n')) {
    newHeight = Math.max(minH, origHeight - dy);
    newTop    = origTop + origHeight - newHeight;
  }

  win.style.left   = newLeft   + 'px';
  win.style.top    = newTop    + 'px';
  win.style.width  = newWidth  + 'px';
  win.style.height = newHeight + 'px';
}

function stopResize() {
  resizeState = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}

// ===================== START MENU =====================
function toggleStartMenu(force) {
  const sm = document.getElementById('start-menu');
  const btn = document.getElementById('start-btn');
  if (force === false) {
    sm.classList.remove('show');
    btn.classList.remove('active');
    startMenuOpen = false;
    return;
  }
  startMenuOpen = !startMenuOpen;
  sm.classList.toggle('show', startMenuOpen);
  btn.classList.toggle('active', startMenuOpen);
}

document.addEventListener('click', (e) => {
  if (startMenuOpen && !document.getElementById('start-menu').contains(e.target) && !document.getElementById('start-btn').contains(e.target)) {
    toggleStartMenu(false);
  }
});

// ===================== CONTACT FORM =====================
function sendMsg() {
  alert('Message sent! (This is a demo — connect via LinkedIn to reach Tosha)');
}

// ===================== KEYBOARD =====================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleStartMenu(false);
});

// ===================== IPOD PLAYER =====================
function $(id) { return document.getElementById(id); }

// ─── Song library ───────────────────────────────────────
const IPOD_SONGS = [
  {
    src:    "iPod Touch.mp3",
    title:  "iPod Touch",
    artist: "Ninajirachi",
    album:  "I Love My Computer",
    art:    "https://i1.sndcdn.com/artworks-IXsnvZeztxgQoL29-INTj2g-t500x500.png"
  },
  {
    src:    "That Green Gentleman.mp3",
    title:  "That Green Gentleman",
    artist: "Panic! at the Disco",
    album:  "Pretty. Odd.",
    art:    "https://upload.wikimedia.org/wikipedia/en/4/4d/Panicatthedisco-prettyodd.jpg"
  },
  {
    src:    "CSIRAC.m4a",
    title:  "CSIRAC",
    artist: "Ninajirachi",
    album:  "CSIRAC",
    art:    ""
  },
];

// ─── Playlists ──────────────────────────────────────────
// Each playlist holds indices into IPOD_SONGS
const IPOD_PLAYLISTS = [
  { name: "now",  songs: [0, 2] },
  { name: "then", songs: [1] },
];

// ─── Playback state ─────────────────────────────────────
let ipodPlaying  = false;
let ipodSongIdx  = 0;
let ipodQueue    = [0, 1, 2];
let ipodQueuePos = 0;

// ─── Navigation state ───────────────────────────────────
// Stack entries: { view, cursor, extra }
// extra = playlist index for playlistsongs view, else undefined
const ipodNavStack = [];
let ipodView      = 'mainmenu';
let ipodViewExtra = undefined;   // extra data for the CURRENT view (e.g. playlist index)
let ipodCursor    = 0;

// ─── Items for a given view ──────────────────────────────
function ipodGetItems(view, extra) {
  switch (view) {
    case 'mainmenu':      return ['Music', 'Now Playing', 'Settings'];
    case 'music':         return ['Playlists', 'All Songs'];
    case 'playlists':     return IPOD_PLAYLISTS.map(p => p.name);
    case 'allsongs':      return IPOD_SONGS.map(s => s.title);
    case 'playlistsongs': {
      const pl = IPOD_PLAYLISTS[extra];
      return pl ? pl.songs.map(i => IPOD_SONGS[i].title) : [];
    }
    case 'settings': return ['Repeat: Off', 'Shuffle: Off', 'Backlight: Always On'];
    default: return [];
  }
}

// ─── Map view name → list element ID ─────────────────────
const IPOD_LIST_IDS = {
  mainmenu:      'ipod-list-mainmenu',
  music:         'ipod-list-music',
  playlists:     'ipod-list-playlists',
  allsongs:      'ipod-list-allsongs',
  playlistsongs: 'ipod-list-playlistsongs',
};

// ─── Render a list for a view ────────────────────────────
function ipodRenderList(view, extra, activeCursor) {
  const ul = $(IPOD_LIST_IDS[view]);
  if (!ul || view === 'settings' || view === 'nowplaying') return;
  const items = ipodGetItems(view, extra);
  const cursor = (activeCursor !== undefined) ? activeCursor : ipodCursor;
  const isSongList = (view === 'allsongs' || view === 'playlistsongs');

  ul.innerHTML = '';
  items.forEach((label, i) => {
    const li = document.createElement('li');
    li.className = 'ipod-menu-item' + (i === cursor ? ' ipod-menu-item--active' : '');
    if (isSongList) {
      const globalIdx = view === 'allsongs' ? i : (IPOD_PLAYLISTS[extra]?.songs[i] ?? i);
      const playing = globalIdx === ipodSongIdx && ipodPlaying;
      li.textContent = (playing ? '♪ ' : '') + label;
    } else {
      li.innerHTML = `<span>${label}</span><span class="ipod-arrow">›</span>`;
    }
    ul.appendChild(li);
  });
}

// ─── Transition to a new view ────────────────────────────
function ipodShowView(viewName, extra, direction) {
  // direction: 'forward' | 'back' (for slide animation)
  const screen = document.querySelector('.ipod-screen');
  const currentEl = $('ipod-view-' + ipodView);
  const nextEl    = $('ipod-view-' + viewName);
  if (!nextEl) return;

  // Slide animation
  if (screen && currentEl && nextEl && currentEl !== nextEl) {
    const isBack = direction === 'back';
    // Position next view off-screen
    nextEl.style.transition = 'none';
    nextEl.style.transform  = isBack ? 'translateX(-100%)' : 'translateX(100%)';
    nextEl.style.display    = '';
    // Force reflow
    nextEl.getBoundingClientRect();
    // Slide current out + next in simultaneously
    currentEl.style.transition = 'transform 0.18s ease-in-out';
    currentEl.style.transform  = isBack ? 'translateX(100%)' : 'translateX(-100%)';
    nextEl.style.transition    = 'transform 0.18s ease-in-out';
    nextEl.style.transform     = 'translateX(0)';
    setTimeout(() => {
      currentEl.style.display    = 'none';
      currentEl.style.transition = '';
      currentEl.style.transform  = '';
      nextEl.style.transition    = '';
    }, 185);
  } else {
    document.querySelectorAll('.ipod-view').forEach(el => {
      el.style.display = 'none';
      el.style.transform = '';
    });
    nextEl.style.display = '';
  }

  ipodView      = viewName;
  ipodViewExtra = extra;

  // Render list content for new view
  ipodRenderList(viewName, extra, ipodCursor);

  // Update playlist header
  if (viewName === 'playlistsongs' && extra !== undefined && IPOD_PLAYLISTS[extra]) {
    const hdr = $('ipod-playlist-header');
    if (hdr) hdr.textContent = IPOD_PLAYLISTS[extra].name;
  }

  // Status bar title
  const titles = {
    mainmenu: 'iPod', music: 'Music', playlists: 'Playlists',
    playlistsongs: (extra !== undefined && IPOD_PLAYLISTS[extra]) ? IPOD_PLAYLISTS[extra].name : 'Playlist',
    allsongs: 'All Songs', nowplaying: 'Now Playing', settings: 'Settings'
  };
  const stEl = $('ipod-status-title');
  if (stEl) stEl.textContent = titles[viewName] || 'iPod';

  // Window statusbar
  const sb = $('ipod-statusbar');
  if (sb) {
    if (viewName === 'nowplaying') {
      const t = IPOD_SONGS[ipodSongIdx];
      sb.textContent = `♪ ${t.title} — ${t.artist}`;
    } else {
      sb.textContent = `iPod — ${titles[viewName] || ''}`;
    }
  }
}

// ─── Update just the cursor highlight (no full re-render) ─
function ipodUpdateCursor(view, extra) {
  const ul = $(IPOD_LIST_IDS[view]);
  if (!ul) return;
  ul.querySelectorAll('.ipod-menu-item').forEach((li, i) => {
    li.classList.toggle('ipod-menu-item--active', i === ipodCursor);
  });
}

// ─── Scroll up/down ──────────────────────────────────────
function ipodScrollDown() {
  const items = ipodGetItems(ipodView, ipodViewExtra);
  if (!items.length) return;
  ipodCursor = (ipodCursor + 1) % items.length;
  ipodUpdateCursor(ipodView, ipodViewExtra);
}
function ipodScrollUp() {
  const items = ipodGetItems(ipodView, ipodViewExtra);
  if (!items.length) return;
  ipodCursor = (ipodCursor - 1 + items.length) % items.length;
  ipodUpdateCursor(ipodView, ipodViewExtra);
}

// ─── SELECT (center button) ──────────────────────────────
function ipodSelect() {
  if (ipodView === 'nowplaying') { ipodPlayPause(); return; }
  if (ipodView === 'settings')   return;

  // Push current state onto nav stack
  const push = () => ipodNavStack.push({ view: ipodView, cursor: ipodCursor, extra: ipodViewExtra });

  if (ipodView === 'mainmenu') {
    const dests = ['music', 'nowplaying', 'settings'];
    const dest = dests[ipodCursor];
    if (!dest) return;
    push(); ipodCursor = 0; ipodShowView(dest, undefined, 'forward');

  } else if (ipodView === 'music') {
    const dests = ['playlists', 'allsongs'];
    const dest = dests[ipodCursor];
    if (!dest) return;
    push(); ipodCursor = 0; ipodShowView(dest, undefined, 'forward');

  } else if (ipodView === 'playlists') {
    const plIdx = ipodCursor;
    push(); ipodCursor = 0; ipodShowView('playlistsongs', plIdx, 'forward');

  } else if (ipodView === 'playlistsongs') {
    const pl = IPOD_PLAYLISTS[ipodViewExtra];
    if (!pl) return;
    const songIdx = pl.songs[ipodCursor];
    if (songIdx === undefined) return;
    ipodQueue    = pl.songs.slice();
    ipodQueuePos = ipodCursor;
    push(); ipodCursor = 0;
    ipodLoadTrack(songIdx, true);
    ipodShowView('nowplaying', undefined, 'forward');

  } else if (ipodView === 'allsongs') {
    const songIdx = ipodCursor;
    ipodQueue    = IPOD_SONGS.map((_, i) => i);
    ipodQueuePos = songIdx;
    push(); ipodCursor = 0;
    ipodLoadTrack(songIdx, true);
    ipodShowView('nowplaying', undefined, 'forward');
  }
}

// ─── MENU button (go back) ───────────────────────────────
function ipodMenu() {
  if (ipodNavStack.length === 0) return;
  const prev = ipodNavStack.pop();
  ipodCursor = prev.cursor;
  ipodShowView(prev.view, prev.extra, 'back');
}

// ─── Load + play a track ─────────────────────────────────
function ipodLoadTrack(songIdx, autoplay) {
  ipodSongIdx = ((songIdx % IPOD_SONGS.length) + IPOD_SONGS.length) % IPOD_SONGS.length;
  const track = IPOD_SONGS[ipodSongIdx];
  const audio = $("ipod-audio");
  if (!audio) return;

  audio.pause();
  audio.src = track.src;
  audio.load();

  // Update Now Playing display
  const titleSpan = document.querySelector("#ipod-marquee span");
  if (titleSpan) titleSpan.textContent = track.title;
  const artistEl = $('ipod-artist-label');
  const albumEl  = $('ipod-album-label');
  const artEl    = $('ipod-cover');
  if (artistEl) artistEl.textContent = track.artist;
  if (albumEl)  albumEl.textContent  = track.album;
  if (artEl)    artEl.src            = track.art;

  ipodSyncUI();

  // Update window statusbar
  const sb = $('ipod-statusbar');
  if (sb && ipodView === 'nowplaying') sb.textContent = `♪ ${track.title} — ${track.artist}`;

  if (autoplay) {
    audio.play()
      .then(() => { ipodPlaying = true; ipodSetPlayingUI(true); })
      .catch(err => console.warn("Audio play blocked:", err));
  } else {
    ipodPlaying = false;
    ipodSetPlayingUI(false);
  }
}

function formatIpodTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

function ipodSyncUI() {
  const audio = $("ipod-audio");
  if (!audio) return;
  const elapsed = $("ipod-elapsed");
  const total   = $("ipod-total");
  const fill    = $("ipod-fill");
  const counter = $("ipod-track-counter");

  if (elapsed) elapsed.textContent = formatIpodTime(audio.currentTime || 0);
  const dur = audio.duration;
  if (total) total.textContent = Number.isFinite(dur) ? formatIpodTime(dur) : "0:00";
  const pct = (Number.isFinite(dur) && dur > 0) ? (audio.currentTime / dur) * 100 : 0;
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  if (counter) counter.textContent = `${ipodQueuePos + 1} of ${ipodQueue.length}`;
}

function ipodSetPlayingUI(isPlaying) {
  const wheel = $("ipod-wheel");
  if (wheel) wheel.classList.toggle("ipod-spinning", isPlaying);
}

function ipodPlayPause() {
  const audio = $("ipod-audio");
  if (!audio) return;
  if (audio.paused) {
    // If nothing loaded, go to now playing
    if (!audio.src || audio.src === window.location.href) {
      ipodLoadTrack(0, true); return;
    }
    audio.play()
      .then(() => { ipodPlaying = true; ipodSetPlayingUI(true); })
      .catch(err => console.warn("Audio play blocked:", err));
  } else {
    audio.pause();
    ipodPlaying = false;
    ipodSetPlayingUI(false);
  }
}

function ipodSkip() {
  // Next in queue
  const wasPlaying = ipodPlaying || !$("ipod-audio")?.paused;
  ipodQueuePos = (ipodQueuePos + 1) % ipodQueue.length;
  ipodLoadTrack(ipodQueue[ipodQueuePos], wasPlaying);
  // If on Now Playing screen, stay there
  if (ipodView !== 'nowplaying') {
    ipodNavStack.push({ view: ipodView, cursor: ipodCursor, extra: undefined });
    ipodShowView('nowplaying');
  }
}

function ipodRewind() {
  const audio = $("ipod-audio");
  if (!audio) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    ipodSyncUI();
  } else {
    const wasPlaying = ipodPlaying;
    ipodQueuePos = (ipodQueuePos - 1 + ipodQueue.length) % ipodQueue.length;
    ipodLoadTrack(ipodQueue[ipodQueuePos], wasPlaying);
    if (ipodView !== 'nowplaying') {
      ipodNavStack.push({ view: ipodView, cursor: ipodCursor, extra: undefined });
      ipodShowView('nowplaying');
    }
  }
}

// ─── Init ────────────────────────────────────────────────
(function initIpod() {
  const audio = $("ipod-audio");
  if (!audio) return;

  audio.addEventListener("loadedmetadata", ipodSyncUI);
  audio.addEventListener("timeupdate",     ipodSyncUI);
  audio.addEventListener("play",  () => { ipodPlaying = true;  ipodSetPlayingUI(true);  });
  audio.addEventListener("pause", () => { ipodPlaying = false; ipodSetPlayingUI(false); });
  audio.addEventListener("ended", () => {
    // Auto-advance to next in queue
    ipodQueuePos = (ipodQueuePos + 1) % ipodQueue.length;
    ipodLoadTrack(ipodQueue[ipodQueuePos], true);
  });

  // Build playlists + allsongs lists on load
  ipodRenderList('playlists');
  ipodRenderList('allsongs');

  // Start on main menu
  ipodShowView('mainmenu');
  ipodUpdateCursor('mainmenu');
  ipodSyncUI();

  // Scroll wheel: click-and-drag clockwise/counterclockwise
  const wheel = $("ipod-wheel");
  if (wheel) {
    let wheelDragging = false;
    let wheelLastAngle = null;
    let wheelAccum = 0;
    const SCROLL_THRESHOLD = 25; // degrees per step

    function getAngle(e, rect) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    }

    function wheelStart(e) {
      // Don't hijack center button or cardinal labels
      if (e.target.classList.contains('ipod-center-btn') ||
          e.target.classList.contains('ipod-wheel-label')) return;
      wheelDragging = true;
      wheelLastAngle = getAngle(e, wheel.getBoundingClientRect());
      wheelAccum = 0;
      e.preventDefault();
    }
    function wheelMove(e) {
      if (!wheelDragging) return;
      const angle = getAngle(e, wheel.getBoundingClientRect());
      let delta = angle - wheelLastAngle;
      // Wrap around ±180
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      wheelAccum += delta;
      wheelLastAngle = angle;
      if (wheelAccum > SCROLL_THRESHOLD)  { ipodScrollDown(); wheelAccum = 0; }
      if (wheelAccum < -SCROLL_THRESHOLD) { ipodScrollUp();   wheelAccum = 0; }
      e.preventDefault();
    }
    function wheelEnd() { wheelDragging = false; wheelLastAngle = null; }

    wheel.addEventListener('mousedown',  wheelStart);
    wheel.addEventListener('touchstart', wheelStart, { passive: false });
    document.addEventListener('mousemove',  wheelMove);
    document.addEventListener('touchmove',  wheelMove, { passive: false });
    document.addEventListener('mouseup',    wheelEnd);
    document.addEventListener('touchend',   wheelEnd);
  }
})();

// ===================== PAINT (XP accurate) =====================
(function () {
  const PAINT_ID = "paint";

  // XP MS Paint color palette (exact 28-color palette, 2 rows of 14)
  const XP_PALETTE = [
    // Row 1
    "#000000","#808080","#800000","#808000","#008000","#008080","#000080","#800080",
    "#808040","#004040","#0080FF","#004080","#8000FF","#804000",
    // Row 2
    "#ffffff","#c0c0c0","#ff0000","#ffff00","#00ff00","#00ffff","#0000ff","#ff00ff",
    "#ffff80","#00ff80","#80ffff","#8080ff","#ff0080","#ff8040"
  ];

  const st = {
    tool: "pencil",
    drawing: false,
    fg: "#000000",   // left-click color (foreground)
    bg: "#ffffff",   // right-click color (background)
    size: 3,         // brush/pencil size
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    snapshot: null,  // ImageData for live shape preview
    undo: [],
    redo: [],
    maxUndo: 30,
    // selection state
    selActive: false,
    selX: 0, selY: 0, selW: 0, selH: 0,
    // text state
    textActive: false,
    textX: 0, textY: 0,
    // airbrush interval
    airTimer: null,
  };

  let canvas, ctx, selCanvas, selCtx;
  let inited = false;

  /* ---- helpers ---- */
  function canvasXY(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - r.left) * (canvas.width  / r.width)),
      y: Math.round((e.clientY - r.top)  * (canvas.height / r.height))
    };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function pushUndo() {
    try {
      st.undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (st.undo.length > st.maxUndo) st.undo.shift();
      st.redo.length = 0;
    } catch(e) {}
  }

  function hexToRgba(hex) {
    const h = hex.replace("#","");
    const n = parseInt(h,16);
    return [(n>>16)&255,(n>>8)&255,n&255,255];
  }

  function floodFill(x, y, fillHex) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data, W = canvas.width, H = canvas.height;
    const i0 = (y*W+x)*4;
    const [tr,tg,tb,ta] = [d[i0],d[i0+1],d[i0+2],d[i0+3]];
    const [fr,fg,fb,fa] = hexToRgba(fillHex);
    if (tr===fr&&tg===fg&&tb===fb&&ta===fa) return;
    const stack = [x+y*W];
    const visited = new Uint8Array(W*H);
    while (stack.length) {
      const p = stack.pop();
      if (visited[p]) continue;
      visited[p] = 1;
      const px_ = p%W, py_ = (p/W)|0;
      if (px_<0||px_>=W||py_<0||py_>=H) continue;
      const i = p*4;
      if (d[i]!==tr||d[i+1]!==tg||d[i+2]!==tb||d[i+3]!==ta) continue;
      d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=fa;
      stack.push(p+1,p-1,p+W,p-W);
    }
    ctx.putImageData(img,0,0);
  }

  function setLineStyle(color, size) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function snapShot() {
    try { st.snapshot = ctx.getImageData(0,0,canvas.width,canvas.height); } catch(e) {}
  }
  function restoreSnap() {
    if (st.snapshot) ctx.putImageData(st.snapshot,0,0);
  }

  /* ---- shape drawing ---- */
  function drawShapePreview(x2, y2) {
    restoreSnap();
    const x1=st.startX, y1=st.startY;
    const color = st._useSecondary ? st.bg : st.fg;
    setLineStyle(color, st.size);
    ctx.beginPath();
    const tool = st.tool;
    if (tool === "line") {
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    } else if (tool === "rect") {
      const rx=Math.min(x1,x2),ry=Math.min(y1,y2),rw=Math.abs(x2-x1),rh=Math.abs(y2-y1);
      ctx.strokeRect(rx,ry,rw,rh);
    } else if (tool === "roundrect") {
      const rx=Math.min(x1,x2),ry=Math.min(y1,y2),rw=Math.abs(x2-x1),rh=Math.abs(y2-y1),rad=8;
      ctx.roundRect(rx,ry,rw,rh,[rad]); ctx.stroke();
    } else if (tool === "ellipse") {
      const cx=(x1+x2)/2,cy=(y1+y2)/2,ex=Math.max(1,Math.abs(x2-x1)/2),ey=Math.max(1,Math.abs(y2-y1)/2);
      ctx.ellipse(cx,cy,ex,ey,0,0,Math.PI*2); ctx.stroke();
    } else if (tool === "curve") {
      const cpx=(x1+x2)/2, cpy=Math.min(y1,y2)-Math.abs(x2-x1)*0.4;
      ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
    }
  }

  /* ---- Selection overlay ---- */
  function drawSelOverlay() {
    selCtx.clearRect(0,0,selCanvas.width,selCanvas.height);
    if (!st.selActive || st.selW === 0 || st.selH === 0) return;
    const x=Math.min(st.selX,st.selX+st.selW), y=Math.min(st.selY,st.selY+st.selH);
    const w=Math.abs(st.selW), h=Math.abs(st.selH);
    selCtx.strokeStyle = "#000";
    selCtx.lineWidth = 1;
    selCtx.setLineDash([4,4]);
    selCtx.strokeRect(x+0.5,y+0.5,w,h);
    selCtx.setLineDash([]);
  }

  /* ---- Color bar ---- */
  function updateColorBar() {
    const fg = document.getElementById("paintFG");
    const bg = document.getElementById("paintBG");
    if (fg) fg.style.background = st.fg;
    if (bg) bg.style.background = st.bg;
  }

  /* ---- Status bar ---- */
  function setStatus(msg) {
    const el = document.getElementById("paintStatusLeft");
    if (el) el.textContent = msg;
  }
  function setCoords(x,y) {
    const el = document.getElementById("paintStatusCoords");
    if (el) el.textContent = (x != null) ? `${x},${y}` : "";
  }
  function setSizeStatus(w,h) {
    const el = document.getElementById("paintStatusSize");
    if (el) el.textContent = `${w} × ${h}`;
  }

  /* ---- Airbrush helper ---- */
  function doAirbrush(x,y,color) {
    const r = st.size * 5 + 5;
    const density = 0.25;
    const count = Math.round(r * r * density * 0.1);
    for (let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.random() * r;
      const px_ = x + Math.cos(angle)*dist;
      const py_ = y + Math.sin(angle)*dist;
      ctx.fillStyle = color;
      ctx.fillRect(px_|0, py_|0, 1, 1);
    }
  }

  /* ---- Menu system ---- */
  function initMenus() {
    const menubar = document.getElementById("paintMenubar");
    if (!menubar) return;

    const dropMap = {
      "file":  "paintDropFile",
      "edit":  "paintDropEdit",
      "image": "paintDropImage",
    };

    // Position dropdown under the menu item
    function openDrop(item, dropId) {
      closeAllDrops();
      const drop = document.getElementById(dropId);
      if (!drop) return;
      item.classList.add("open");
      const r = item.getBoundingClientRect();
      const br = menubar.getBoundingClientRect();
      drop.style.left = (r.left - br.left) + "px";
      drop.classList.add("show");
    }
    function closeAllDrops() {
      document.querySelectorAll(".paint-menu-item.open").forEach(el => el.classList.remove("open"));
      document.querySelectorAll(".paint-dropdown.show").forEach(el => el.classList.remove("show"));
    }

    menubar.querySelectorAll(".paint-menu-item").forEach(item => {
      const menu = item.dataset.menu;
      item.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        const dropId = dropMap[menu];
        if (!dropId) { closeAllDrops(); return; }
        const isOpen = item.classList.contains("open");
        if (isOpen) closeAllDrops();
        else openDrop(item, dropId);
      });
    });

    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest(".paint-dropdown") && !e.target.closest(".paint-menu-item")) {
        closeAllDrops();
      }
    });

    // Dropdown actions
    document.querySelectorAll(".paint-dd-item[data-action]").forEach(item => {
      item.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        closeAllDrops();
        const action = item.dataset.action;
        handleMenuAction(action);
      });
    });
  }

  function handleMenuAction(action) {
    if (action === "new") {
      pushUndo();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      setStatus("");
    } else if (action === "open") {
      document.getElementById("paintFile").click();
    } else if (action === "save" || action === "saveas") {
      const a = document.createElement("a");
      a.download = "untitled.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } else if (action === "exit") {
      closeWindow(PAINT_ID);
    } else if (action === "undo") {
      doUndo();
    } else if (action === "redo") {
      doRedo();
    } else if (action === "clearimage") {
      pushUndo();
      ctx.fillStyle = st.bg;
      ctx.fillRect(0,0,canvas.width,canvas.height);
    } else if (action === "selectall") {
      st.selActive=true; st.selX=0; st.selY=0; st.selW=canvas.width; st.selH=canvas.height;
      drawSelOverlay();
    } else if (action === "invertcolors") {
      pushUndo();
      const img = ctx.getImageData(0,0,canvas.width,canvas.height);
      const d = img.data;
      for (let i=0;i<d.length;i+=4){d[i]=255-d[i];d[i+1]=255-d[i+1];d[i+2]=255-d[i+2];}
      ctx.putImageData(img,0,0);
    }
  }

  function doUndo() {
    if (!st.undo.length) return;
    const cur = ctx.getImageData(0,0,canvas.width,canvas.height);
    st.redo.push(cur);
    const prev = st.undo.pop();
    ctx.putImageData(prev,0,0);
  }
  function doRedo() {
    if (!st.redo.length) return;
    const cur = ctx.getImageData(0,0,canvas.width,canvas.height);
    st.undo.push(cur);
    const next = st.redo.pop();
    ctx.putImageData(next,0,0);
  }

  /* ---- Tool selection ---- */
  function selectTool(toolName) {
    st.tool = toolName;
    st.selActive = false;
    drawSelOverlay();
    // Update active state on buttons
    document.querySelectorAll("#paintToolbox .ptool").forEach(b => {
      b.classList.toggle("active", b.dataset.tool === toolName);
    });
    // Update cursor
    const cursors = {
      pencil: "crosshair", brush: "crosshair", eraser: "cell",
      fill: "crosshair", eyedropper: "crosshair", text: "text",
      zoom: "zoom-in", airbrush: "crosshair",
      line: "crosshair", curve: "crosshair",
      rect: "crosshair", roundrect: "crosshair",
      ellipse: "crosshair", polygon: "crosshair",
      "select-rect": "crosshair", "select-free": "crosshair",
    };
    canvas.style.cursor = cursors[toolName] || "crosshair";
  }

  /* ---- Main init ---- */
  function ensureInit() {
    const win = document.getElementById(PAINT_ID);
    if (!win || inited) return;
    inited = true;

    canvas    = document.getElementById("paintCanvas");
    selCanvas = document.getElementById("paintSelCanvas");
    ctx       = canvas.getContext("2d", { willReadFrequently: true });
    selCtx    = selCanvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    setSizeStatus(canvas.width, canvas.height);

    /* ---- Palette ---- */
    const palEl = document.getElementById("paintPalette");
    if (palEl) {
      palEl.innerHTML = "";
      XP_PALETTE.forEach(c => {
        const d = document.createElement("div");
        d.className = "pcolor";
        d.style.background = c;
        d.title = c;
        d.addEventListener("mousedown", (e) => {
          e.preventDefault();
          if (e.button === 2) { st.bg = c; } else { st.fg = c; }
          updateColorBar();
        });
        d.addEventListener("contextmenu", e => { e.preventDefault(); st.bg=c; updateColorBar(); });
        palEl.appendChild(d);
      });
    }
    updateColorBar();

    /* ---- FG/BG click-to-swap ---- */
    const fgEl = document.getElementById("paintFG");
    const bgEl = document.getElementById("paintBG");
    if (fgEl) fgEl.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.type = "color"; input.value = st.fg;
      input.oninput = () => { st.fg = input.value; updateColorBar(); };
      input.click();
    });
    if (bgEl) bgEl.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.type = "color"; input.value = st.bg;
      input.oninput = () => { st.bg = input.value; updateColorBar(); };
      input.click();
    });

    /* ---- Tool buttons ---- */
    document.querySelectorAll("#paintToolbox .ptool").forEach(btn => {
      btn.addEventListener("click", () => selectTool(btn.dataset.tool));
    });
    selectTool("pencil");

    /* ---- Size dots ---- */
    document.querySelectorAll(".psize-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        document.querySelectorAll(".psize-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        st.size = Number(dot.dataset.size);
      });
    });

    /* ---- Open file ---- */
    const fileInput = document.getElementById("paintFile");
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
          pushUndo();
          ctx.fillStyle="#ffffff";
          ctx.fillRect(0,0,canvas.width,canvas.height);
          const scale = Math.min(canvas.width/img.width, canvas.height/img.height);
          const w=img.width*scale, h=img.height*scale;
          ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
          URL.revokeObjectURL(url);
        };
        img.src = url;
        fileInput.value = "";
      });
    }

    /* ---- Menus ---- */
    initMenus();

    /* ---- Keyboard shortcuts ---- */
    document.addEventListener("keydown", (e) => {
      const win2 = document.getElementById(PAINT_ID);
      if (!win2 || !win2.classList.contains("show")) return;
      if (e.ctrlKey) {
        if (e.key==="z"||e.key==="Z") { e.preventDefault(); doUndo(); }
        else if (e.key==="y"||e.key==="Y") { e.preventDefault(); doRedo(); }
        else if (e.key==="s"||e.key==="S") { e.preventDefault(); handleMenuAction("save"); }
        else if (e.key==="a"||e.key==="A") { e.preventDefault(); handleMenuAction("selectall"); }
        else if (e.key==="i"||e.key==="I") { e.preventDefault(); handleMenuAction("invertcolors"); }
      }
    });

    /* ---- Canvas mouse events ---- */
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const {x,y} = canvasXY(e);
      st.drawing = true;
      st.startX = st.lastX = x;
      st.startY = st.lastY = y;
      st._useSecondary = (e.button === 2);
      const color = st._useSecondary ? st.bg : st.fg;
      const eraseColor = st._useSecondary ? st.fg : st.bg;

      // Single-click tools
      if (st.tool === "fill") {
        pushUndo();
        floodFill(x|0,y|0,color);
        st.drawing = false;
        return;
      }
      if (st.tool === "eyedropper") {
        const px_ = ctx.getImageData(x|0,y|0,1,1).data;
        const hex = "#"+[px_[0],px_[1],px_[2]].map(v=>v.toString(16).padStart(2,"0")).join("");
        if (st._useSecondary) st.bg = hex; else st.fg = hex;
        updateColorBar();
        st.drawing = false;
        return;
      }
      if (st.tool === "zoom") {
        // XP Paint zoom: just a cosmetic no-op here (canvas doesn't scale)
        st.drawing = false;
        return;
      }

      // Commit to undo history on mousedown for free-drawing tools
      if (!["line","rect","roundrect","ellipse","curve","polygon","select-rect","select-free"].includes(st.tool)) {
        pushUndo();
      }

      if (st.tool === "pencil") {
        setLineStyle(color, 1);
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+0.01,y+0.01);
        ctx.stroke();
      } else if (st.tool === "brush") {
        setLineStyle(color, st.size * 2);
        ctx.beginPath();
        ctx.moveTo(x,y);
      } else if (st.tool === "eraser") {
        setLineStyle(eraseColor, st.size * 4);
        ctx.beginPath();
        ctx.moveTo(x,y);
      } else if (st.tool === "airbrush") {
        doAirbrush(x,y,color);
        st.airTimer = setInterval(() => {
          if (!st.drawing) { clearInterval(st.airTimer); st.airTimer=null; return; }
          doAirbrush(st.lastX, st.lastY, color);
        }, 50);
      } else if (["line","rect","roundrect","ellipse","curve"].includes(st.tool)) {
        pushUndo();
        snapShot();
      } else if (st.tool === "select-rect") {
        st.selActive = false;
        drawSelOverlay();
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      const {x,y} = canvasXY(e);
      setCoords(x,y);

      if (!st.drawing) return;
      const color = st._useSecondary ? st.bg : st.fg;
      const eraseColor = st._useSecondary ? st.fg : st.bg;

      if (st.tool === "pencil") {
        setLineStyle(color, 1);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y);
      } else if (st.tool === "brush") {
        setLineStyle(color, st.size * 2);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y);
      } else if (st.tool === "eraser") {
        setLineStyle(eraseColor, st.size * 4);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y);
      } else if (st.tool === "airbrush") {
        st.lastX = x; st.lastY = y;
      } else if (["line","rect","roundrect","ellipse","curve"].includes(st.tool)) {
        drawShapePreview(x,y);
      } else if (st.tool === "select-rect") {
        st.selX = st.startX; st.selY = st.startY;
        st.selW = x - st.startX; st.selH = y - st.startY;
        st.selActive = true;
        drawSelOverlay();
      }

      st.lastX = x; st.lastY = y;
    });

    canvas.addEventListener("mouseleave", () => setCoords(null, null));

    canvas.addEventListener("mouseup", (e) => {
      if (!st.drawing) return;
      st.drawing = false;

      if (st.airTimer) { clearInterval(st.airTimer); st.airTimer = null; }

      // For shape tools, the preview is already on canvas from mousemove
      st.snapshot = null;

      setStatus("");
    });
  }

  /* ---- Hook into openWindow ---- */
  const _origOpen = window.openWindow;
  window.openWindow = function(id) {
    const r = _origOpen ? _origOpen(id) : undefined;
    if (id === PAINT_ID) setTimeout(ensureInit, 0);
    return r;
  };
})();


// ===================== MINECRAFT GAME (First-Person 3D) =====================
(function () {
  // --- World dimensions ---
  const WX = 64, WY = 64, WZ = 64; // world size in blocks (X, Y=height, Z)

  // --- Block IDs ---
  const B = {AIR:0,GRASS:1,DIRT:2,STONE:3,LOG:4,LEAVES:5,SAND:6,WATER:7,COAL:8,IRON:9,BEDROCK:10,GRAVEL:11,PLANKS:12,GLASS:13,FLOWER:14,TALLGRASS:15,SNOW:16,WOOD_PLANK:17};

  // Block data: [name, hardness, dropId, sideRGB, topRGB, bottomRGB]
  // RGB as [r,g,b] arrays for fast pixel math
  const BD = [
    ['Air',       0,        B.AIR,    null,           null,           null          ],
    ['Grass',     15,       B.DIRT,   [115,88,55],    [88,158,36],    [115,88,55]   ],
    ['Dirt',      12,       B.DIRT,   [134,96,67],    [134,96,67],    [134,96,67]   ],
    ['Stone',     40,       B.STONE,  [136,136,136],  [136,136,136],  [136,136,136] ],
    ['Log',       20,       B.PLANKS, [102,80,44],    [162,130,58],   [162,130,58]  ],
    ['Leaves',    5,        B.AIR,    [54,118,48],    [54,118,48],    [54,118,48]   ],
    ['Sand',      12,       B.SAND,   [218,206,124],  [218,206,124],  [218,206,124] ],
    ['Water',     Infinity, B.AIR,    [32,104,228],   [32,104,228],   [32,104,228]  ],
    ['Coal Ore',  45,       B.COAL,   [136,136,136],  [136,136,136],  [136,136,136] ],
    ['Iron Ore',  50,       B.IRON,   [136,136,136],  [136,136,136],  [136,136,136] ],
    ['Bedrock',   Infinity, B.AIR,    [42,42,42],     [42,42,42],     [42,42,42]    ],
    ['Gravel',    15,       B.GRAVEL, [126,124,122],  [126,124,122],  [126,124,122] ],
    ['Planks',    18,       B.PLANKS, [192,150,72],   [192,150,72],   [192,150,72]  ],
    ['Glass',     12,       B.GLASS,  [190,230,255],  [190,230,255],  [190,230,255] ],
    ['Flower',    2,        B.AIR,    [220,80,80],    [220,80,80],    [220,80,80]   ],
    ['Tall Grass',2,        B.AIR,    [74,148,44],    [74,148,44],    [74,148,44]   ],
    ['Snow',      8,        B.AIR,    [242,246,248],  [242,246,248],  [242,246,248] ],
    ['Wood Plank',18,       B.PLANKS, [192,150,72],   [192,150,72],   [192,150,72]  ],
  ];

  const bName = i => BD[i][0];
  const bHard = i => BD[i][1];
  const bDrop = i => BD[i][2];
  const bSide = i => BD[i][3];
  const bTop2 = i => BD[i][4];
  const bBot  = i => BD[i][5];
  const bSolid= i => i!==B.AIR && i!==B.WATER && i!==B.LEAVES && i!==B.GLASS;

  // --- 3D World ---
  let world; // Uint8Array [y*WZ*WX + z*WX + x]
  function getB(x,y,z){
    if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ) return B.STONE;
    return world[y*WZ*WX + z*WX + x];
  }
  function setB(x,y,z,id){
    if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ) return;
    world[y*WZ*WX + z*WX + x] = id;
  }
  function solid(id){ return id!==B.AIR && id!==B.WATER && id!==B.LEAVES && id!==B.GLASS; }

  // --- Player state (3D first-person) ---
  // pos: feet position
  let px=32, py=40, pz=32;    // world position (float)
  let pvx=0, pvy=0, pvz=0;    // velocity
  let yaw=0, pitch=0;          // radians; yaw=horizontal, pitch=vertical
  let onGround=false;
  let hp=20, maxHp=20;
  let hunger=20, maxHunger=20;
  const EYE_H = 1.62;          // eye height above feet
  const GRAVITY = 22;
  const JUMP_VEL = 8.5;
  const WALK_SPEED = 4.3;
  const SPRINT_SPEED = 6.5;
  const REACH = 4.5;
  const PLAYER_W = 0.6;
  const PLAYER_H = 1.8;

  // --- Input ---
  const keys = {};
  let lmb=false, rmb=false, lastRmb=0;
  let breakTick=0, breakBx=-1,breakBy=-1,breakBz=-1;
  // Drag-to-look (Mac/trackpad fallback — works without pointer lock)
  let dragging=false, lastMouseX=0, lastMouseY=0;

  // --- Creative / Fly mode ---
  let flyMode=true;          // start in creative fly mode
  let flySpeed=10;
  let lastSpaceTap=0;        // for double-tap space detection

  // --- Hotbar ---
  let hotbar=[
    {id:B.PLANKS,ct:64},{id:B.DIRT,ct:64},{id:B.STONE,ct:64},
    {id:B.SAND,ct:64},{id:B.GRAVEL,ct:64},{id:B.GLASS,ct:32},
    {id:B.LOG,ct:32},{id:B.LEAVES,ct:32},null
  ];
  let slot=0;

  // --- Canvas / rendering ---
  let canvas, ctx, cw, ch;
  let imgData, pxBuf;           // pixel buffer for software raycaster
  let offCanvas, offCtx;        // offscreen canvas for scaled render
  const SCALE = 2;              // render at 1/SCALE resolution, scale up

  // --- Time ---
  let dayT=0.35;
  let lastRaf=0, raf=null, gameInited=false;
  let mcFocused=false;
  let pointerLocked=false;

  // =============== WORLD GENERATION ===============
  function hash(n){ let x=Math.sin(n)*43758.5453123; return x-Math.floor(x); }
  function noise2(x,z,s){ return hash(x*127.1+z*311.7+s*43.3); }
  function smoothNoise2(x,z,s){
    const ix=Math.floor(x), iz=Math.floor(z);
    const fx=x-ix, fz=z-iz;
    const ux=fx*fx*(3-2*fx), uz=fz*fz*(3-2*fz);
    const a=noise2(ix,iz,s), b=noise2(ix+1,iz,s);
    const c=noise2(ix,iz+1,s), d=noise2(ix+1,iz+1,s);
    return a*(1-ux)*(1-uz)+b*ux*(1-uz)+c*(1-ux)*uz+d*ux*uz;
  }
  function fbm2(x,z,s,oct=4){
    let v=0,a=1,f=1,m=0;
    for(let o=0;o<oct;o++){ v+=smoothNoise2(x*f,z*f,s+o*100)*a; m+=a; a*=0.5; f*=2; }
    return v/m;
  }

  function generateWorld(){
    const seed=Math.random()*9999|0;
    world=new Uint8Array(WX*WY*WZ);

    // --- Heightmap with multiple terrain layers ---
    // y=0 is TOP of world (sky), y increases downward
    // Surface is around y=18-36; bedrock at y=WY-1=63
    const WATER_Y = 30; // water surface level
    const BASE_Y  = 28; // average ground level
    const hmap = new Int32Array(WX*WZ);

    for(let x=0;x<WX;x++){
      for(let z=0;z<WZ;z++){
        // Layered noise: large hills + medium detail + small bumps
        const large  = fbm2(x/32, z/32, seed,      4) * 14; // big hills
        const medium = fbm2(x/12, z/12, seed+1000, 3) * 5;  // medium detail
        const small  = fbm2(x/5,  z/5,  seed+2000, 2) * 2;  // surface roughness
        hmap[z*WX+x] = Math.round(BASE_Y + large + medium + small);
      }
    }

    // --- Fill voxels ---
    for(let x=0;x<WX;x++){
      for(let z=0;z<WZ;z++){
        const surf = Math.max(2, Math.min(WY-4, hmap[z*WX+x]));
        const isBeach = surf >= WATER_Y-1 && surf <= WATER_Y+1;
        const isHigh  = surf < BASE_Y-6; // elevated / snowy peaks

        for(let y=0;y<WY;y++){
          let id;
          if(y===WY-1) id=B.BEDROCK;
          else if(y < surf) id=B.AIR;       // above surface = air
          else if(y===surf){
            if(surf > WATER_Y)        id=B.AIR;   // will be set below
            else if(isBeach)          id=B.SAND;
            else if(isHigh)           id=B.SNOW;
            else                      id=B.AIR;   // grass below
          }
          else if(y > surf && y <= WATER_Y) id=B.WATER; // water fill
          else if(y===surf+1||y===surf+2&&y>WATER_Y){
            // Below surface
            if(isBeach)               id=B.SAND;
            else if(isHigh)           id=B.STONE;
            else                      id=B.GRASS; // <- surface block
          }
          else if(y > surf+1 && y <= surf+4) id=B.DIRT;
          else {
            const n=noise2(x*0.31+y*0.19, z*0.27, seed+500);
            if(n>0.93)      id=B.COAL;
            else if(n>0.90) id=B.IRON;
            else if(n>0.88) id=B.GRAVEL;
            else            id=B.STONE;
          }
          setB(x,y,z,id);
        }
      }
    }

    // Correct pass: set actual surface block at surf+1 (first solid below air)
    for(let x=0;x<WX;x++){
      for(let z=0;z<WZ;z++){
        const surf=Math.max(2,Math.min(WY-4,hmap[z*WX+x]));
        if(surf > WATER_Y){
          // Surface is above water — place grass/snow/sand
          const isBeach = surf<=WATER_Y+2;
          const isHigh  = surf < BASE_Y-6;
          const surfBlock = isBeach ? B.SAND : isHigh ? B.SNOW : B.GRASS;
          setB(x, surf+1, z, surfBlock);
          // Dirt layer beneath
          for(let d=2;d<=4;d++) if(getB(x,surf+d,z)!==B.STONE&&getB(x,surf+d,z)!==B.BEDROCK) setB(x,surf+d,z,B.DIRT);
        }
      }
    }

    // --- Trees (denser, varied types) ---
    // Forest biome clustering
    for(let x=3;x<WX-3;x++){
      for(let z=3;z<WZ-3;z++){
        const surf=Math.max(2,Math.min(WY-4,hmap[z*WX+x]));
        const isGrass = getB(x,surf+1,z)===B.GRASS;
        if(!isGrass) continue;
        // Forest cluster noise — groups trees together naturally
        const forestDensity = fbm2(x/8, z/8, seed+3000, 2);
        const treeNoise = noise2(x*5.3, z*4.7, seed+77);
        if(forestDensity > 0.55 && treeNoise > 0.62){
          placeTree3D(x, surf+1, z, seed);
        }
      }
    }

    // --- Flowers and tall grass scattered on grass surface ---
    for(let x=1;x<WX-1;x++){
      for(let z=1;z<WZ-1;z++){
        const surf=Math.max(2,Math.min(WY-4,hmap[z*WX+x]));
        if(getB(x,surf+1,z)!==B.GRASS) continue;
        const n=noise2(x*7.3,z*6.1,seed+9000);
        const aboveSurf=surf; // surf is air, surf+1 is grass block, surf is where to place deco
        if(n>0.88)      setB(x, surf,   z, B.FLOWER);    // flower on top
        else if(n>0.80) setB(x, surf,   z, B.TALLGRASS); // tall grass on top
      }
    }
  }

  function placeTree3D(x, surfY, z, seed){
    // surfY = the grass block y index (y increases downward)
    // Trunk goes UP = decreasing y
    const h = 4 + Math.floor(noise2(x*1.71, z*1.53, seed+42) * 3); // height 4-6
    // Place trunk (surfY-1 up to surfY-h, in y-decreasing direction)
    for(let i=1;i<=h;i++) setB(x, surfY-i, z, B.LOG);
    // Leaf canopy — centered at top of trunk
    const topY = surfY - h;
    // Layer pattern like real Minecraft oak: wide at bottom, narrow at top
    const layers = [
      {dy:0,  r:2},  // bottom of canopy
      {dy:-1, r:2},  // middle wide
      {dy:-2, r:1},  // top narrow
      {dy:-3, r:1},  // tip
    ];
    for(const {dy,r} of layers){
      for(let dx=-r;dx<=r;dx++){
        for(let dz=-r;dz<=r;dz++){
          // Round corners (remove corners for r=2)
          if(r===2 && Math.abs(dx)===2 && Math.abs(dz)===2) continue;
          const lx=x+dx, lz=z+dz, ly=topY+dy;
          if(lx>=0&&lx<WX&&lz>=0&&lz<WZ&&ly>=0&&ly<WY){
            if(getB(lx,ly,lz)===B.AIR) setB(lx,ly,lz,B.LEAVES);
          }
        }
      }
    }
  }

  // =============== 3D RAYCASTING ENGINE ===============
  // DDA-based voxel raycaster (like early Minecraft, full 3D)
  function castRay(ox,oy,oz, dx,dy,dz, maxDist){
    // Returns {bx,by,bz,face,dist} or null
    // face: 0=+x,1=-x,2=+y,3=-y,4=+z,5=-z
    let bx=Math.floor(ox), by=Math.floor(oy), bz=Math.floor(oz);
    const sx=dx>0?1:-1, sy=dy>0?1:-1, sz=dz>0?1:-1;
    const tdx=Math.abs(dx)<1e-10?Infinity:Math.abs(1/dx);
    const tdy=Math.abs(dy)<1e-10?Infinity:Math.abs(1/dy);
    const tdz=Math.abs(dz)<1e-10?Infinity:Math.abs(1/dz);
    let tx=(dx>0?(bx+1-ox):( ox-bx))*Math.abs(tdx);
    let ty=(dy>0?(by+1-oy):( oy-by))*Math.abs(tdy);
    let tz=(dz>0?(bz+1-oz):( oz-bz))*Math.abs(tdz);
    let face=0, dist=0;
    for(let i=0;i<80;i++){
      if(tx<ty&&tx<tz){ bx+=sx; dist=tx; tx+=tdx; face=dx>0?1:0; }
      else if(ty<tz)   { by+=sy; dist=ty; ty+=tdy; face=dy>0?3:2; }
      else             { bz+=sz; dist=tz; tz+=tdz; face=dz>0?5:4; }
      if(dist>maxDist) return null;
      if(bx<0||bx>=WX||by<0||by>=WY||bz<0||bz>=WZ) continue;
      const id=getB(bx,by,bz);
      if(id!==B.AIR&&id!==B.WATER) return {bx,by,bz,face,dist,id};
    }
    return null;
  }

  // Get block face neighbor (for placing)
  function faceNeighbor(bx,by,bz,face){
    const off=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const [ox,oy,oz]=off[face];
    return {bx:bx+ox,by:by+oy,bz:bz+oz};
  }

  // =============== TEXTURE GENERATION ===============
  // Pre-generate 16x16 pixel textures for each block face type
  const TEX_SIZE = 16;
  const textures = {}; // blockId_face -> Uint32Array(16*16)

  function makeTexture(id, face){
    const key=`${id}_${face}`;
    if(textures[key]) return textures[key];
    const t = new Uint32Array(TEX_SIZE*TEX_SIZE);
    // Get base color
    let rgb = (face===2||face===3) ? bTop2(id)||bSide(id) : bSide(id);
    if(!rgb){ textures[key]=t; return t; }
    const [br,bg,bb]=rgb;

    // Noise hash for this block face
    function h(x,y){ return ((x*374761393+y*668265263+id*2246822519)>>>0)&255; }

    for(let py2=0;py2<TEX_SIZE;py2++){
      for(let px2=0;px2<TEX_SIZE;px2++){
        const n=h(px2,py2);
        // Vary brightness slightly for texture feel
        const v=1.0 + (n/255-0.5)*0.18;
        let r=Math.min(255,Math.max(0,br*v|0));
        let g=Math.min(255,Math.max(0,bg*v|0));
        let b=Math.min(255,Math.max(0,bb*v|0));

        // Special texture details
        if(id===B.GRASS && (face===0||face===1||face===4||face===5)){
          // side: dirt below, green top strip
          if(py2<3){ r=Math.min(255,90+((n>>1)&20)); g=Math.min(255,155+((n>>2)&25)); b=Math.min(255,40+((n>>3)&15)); }
          else { r=Math.min(255,121+(n>>4&20)); g=Math.min(255,85+(n>>3&15)); b=Math.min(255,58+(n>>2&10)); }
        }
        if(id===B.GRASS && face===2){
          // top: grass green with variation
          r=Math.min(255,70+(n>>2&30)); g=Math.min(255,145+(n>>1&35)); b=Math.min(255,30+(n>>3&20));
        }
        if(id===B.LOG){
          if(face===2||face===3){
            // top: rings
            const cx=px2-7.5,cy=py2-7.5;
            const dist=Math.sqrt(cx*cx+cy*cy);
            if((dist%3)<1){ r=Math.min(255,r-20); g=Math.min(255,g-15); }
          } else {
            // side: vertical grain lines
            if(px2%4===0){ r=Math.max(0,r-20); g=Math.max(0,g-15); }
          }
        }
        if(id===B.STONE){
          // cracks
          if(n<15){ r=90;g=90;b=90; }
        }
        if(id===B.COAL){
          // coal spots
          if(n<25){ r=20;g=20;b=20; }
        }
        if(id===B.IRON){
          // iron spots
          if(n<30){ r=190;g=140;b=100; }
        }
        if(id===B.SAND){
          if(n<20){ r=Math.max(0,r-10); g=Math.max(0,g-10); }
        }
        if(id===B.PLANKS){
          // wood grain
          if(py2%4===0){ r=Math.max(0,r-15); g=Math.max(0,g-12); }
          if(py2%8===4&&px2>TEX_SIZE/2){ r=Math.max(0,r-10); }
        }
        if(id===B.WATER){
          r=30; g=90+(n>>2&30); b=200+(n>>3&30);
        }
        if(id===B.BEDROCK){
          const m=h(px2^3,py2^5);
          r=30+(m>>4&15); g=30+(m>>4&15); b=30+(m>>4&15);
        }
        if(id===B.LEAVES){
          r=48+(n>>3&20); g=100+(n>>2&30); b=40+(n>>3&15);
          if(n>230){ r=0;g=0;b=0; } // transparent gaps
        }
        if(id===B.GLASS){
          // mostly transparent-looking, blue tint with edge lines
          const edge=(px2===0||px2===TEX_SIZE-1||py2===0||py2===TEX_SIZE-1);
          r=edge?180:200; g=edge?210:230; b=edge?220:255;
        }

        // Pack RGBA (little-endian: ABGR)
        t[py2*TEX_SIZE+px2] = 0xFF000000|(b<<16)|(g<<8)|r;
      }
    }
    textures[key]=t;
    return t;
  }

  // Pre-bake all textures
  function bakeTextures(){
    for(let id=1;id<BD.length;id++){
      for(let f=0;f<6;f++) makeTexture(id,f);
    }
  }

  // =============== PHYSICS ===============
  function aabbSolid(x,y,z){
    const id=getB(Math.floor(x),Math.floor(y),Math.floor(z));
    return bSolid(id);
  }

  function physStep(dt){
    const sinY=Math.sin(yaw), cosY=Math.cos(yaw);
    const cosPitch=Math.cos(pitch), sinPitch=Math.sin(pitch);
    const spd = (keys['control']||keys['controlleft']||keys['shift']||keys['shiftleft']) && !flyMode
                  ? SPRINT_SPEED : flyMode ? flySpeed : WALK_SPEED;
    const fw = (keys['w']||keys['arrowup'])    ? 1 : (keys['s']||keys['arrowdown'])  ? -1 : 0;
    const st = (keys['d']||keys['arrowright']) ? 1 : (keys['a']||keys['arrowleft'])  ? -1 : 0;

    if(flyMode){
      // ---- Creative fly: no gravity, full 3D movement ----
      // Horizontal movement in yaw direction (ignore pitch for WASD so you don't fly into sky)
      pvx = (sinY*fw + cosY*st) * spd;
      pvz = (cosY*fw - sinY*st) * spd;
      // Vertical: Space=up, Shift=down
      const upDown = (keys[' ']) ? 1 : (keys['shift']||keys['shiftleft']||keys['shiftright']) ? -1 : 0;
      pvy = upDown * spd;

      // Apply movement (no collision in fly mode — ghost through)
      px += pvx*dt; py += pvy*dt; pz += pvz*dt;

      // Clamp world bounds
      px=Math.max(0.3,Math.min(WX-0.3,px));
      pz=Math.max(0.3,Math.min(WZ-0.3,pz));
      py=Math.max(-10,Math.min(WY+10,py));
    } else {
      // ---- Survival: gravity + collision ----
      pvy -= GRAVITY*dt;
      if(pvy<-50) pvy=-50;

      const inWater = getB(px|0, (py+EYE_H*0.5)|0, pz|0)===B.WATER;
      if(inWater){ pvy*=0.88; pvx*=0.85; pvz*=0.85; }

      pvx = (sinY*fw + cosY*st) * spd;
      pvz = (cosY*fw - sinY*st) * spd;
      if(inWater && keys[' ']) pvy=3;
      if(!inWater && keys[' '] && onGround){ pvy=JUMP_VEL; onGround=false; }

      const HW=PLAYER_W/2;
      px+=pvx*dt;
      for(let dy2=0;dy2<PLAYER_H;dy2+=0.5){
        if(aabbSolid(px-HW,py+dy2,pz)||aabbSolid(px+HW,py+dy2,pz)){
          px-=pvx*dt; pvx=0; break;
        }
      }
      pz+=pvz*dt;
      for(let dy2=0;dy2<PLAYER_H;dy2+=0.5){
        if(aabbSolid(px-HW,py+dy2,pz-HW)||aabbSolid(px+HW,py+dy2,pz+HW)){
          pz-=pvz*dt; pvz=0; break;
        }
      }
      py+=pvy*dt;
      onGround=false;
      if(pvy<0){
        if(aabbSolid(px,py,pz)||aabbSolid(px+HW,py,pz)||aabbSolid(px-HW,py,pz)||
           aabbSolid(px,py,pz+HW)||aabbSolid(px,py,pz-HW)){
          py-=pvy*dt; pvy=0; onGround=true;
        }
      } else {
        if(aabbSolid(px,py+PLAYER_H,pz)){
          py-=pvy*dt; pvy=0;
        }
      }
      px=Math.max(0.5,Math.min(WX-0.5,px));
      pz=Math.max(0.5,Math.min(WZ-0.5,pz));
      if(py<0){py=0;pvy=0;}
      if(py>WY-2){py=WY-2;pvy=0;}
    }
  }

  // =============== BLOCK INTERACTION ===============
  function getLookDir(){
    const cosPitch=Math.cos(pitch);
    return {
      dx: Math.sin(yaw)*cosPitch,
      dy: Math.sin(pitch),
      dz: Math.cos(yaw)*cosPitch
    };
  }

  function targetBlock3D(){
    const ey=py+EYE_H;
    const {dx,dy,dz}=getLookDir();
    return castRay(px,ey,pz, dx,dy,dz, REACH);
  }

  function addInv(id,n){
    for(const s of hotbar){ if(s&&s.id===id&&s.ct<64){ s.ct=Math.min(64,s.ct+n); return; } }
    for(let i=0;i<9;i++){ if(!hotbar[i]){ hotbar[i]={id,ct:n}; return; } }
  }

  function doBreak(){
    const t=targetBlock3D(); if(!t) return;
    const id=getB(t.bx,t.by,t.bz);
    if(id===B.AIR||!isFinite(bHard(id))) return;
    if(t.bx===breakBx&&t.by===breakBy&&t.bz===breakBz){
      breakTick++;
      if(breakTick>=bHard(id)){
        const drop=bDrop(id);
        if(drop!==B.AIR) addInv(drop,1);
        setB(t.bx,t.by,t.bz,B.AIR);
        breakBx=-1; breakTick=0;
      }
    } else {
      breakBx=t.bx; breakBy=t.by; breakBz=t.bz; breakTick=0;
    }
  }

  function doPlace(){
    const now=performance.now();
    if(now-lastRmb<250) return;
    const t=targetBlock3D(); if(!t) return;
    const n=faceNeighbor(t.bx,t.by,t.bz,t.face);
    const existing=getB(n.bx,n.by,n.bz);
    if(existing!==B.AIR&&existing!==B.WATER) return;
    const item=hotbar[slot];
    if(!item||item.ct<=0) return;
    // Don't place inside player AABB
    const HW=PLAYER_W/2;
    if(n.bx>=Math.floor(px-HW)&&n.bx<=Math.floor(px+HW)&&
       n.by>=Math.floor(py)&&n.by<=Math.floor(py+PLAYER_H)&&
       n.bz>=Math.floor(pz-HW)&&n.bz<=Math.floor(pz+HW)) return;
    setB(n.bx,n.by,n.bz,item.id);
    item.ct--;
    if(item.ct<=0) hotbar[slot]=null;
    lastRmb=now;
  }

  // =============== SKY ===============
  function lerp(a,b,t){ return a+(b-a)*t; }
  function skyRGB(){
    const t=dayT;
    if(t<0.22||t>0.84) return [10,10,30];
    if(t<0.30) return [lerp(10,255,( t-0.22)/0.08)|0, lerp(10,100,(t-0.22)/0.08)|0, lerp(30,50,(t-0.22)/0.08)|0];
    if(t<0.38) return [lerp(255,135,(t-0.30)/0.08)|0, lerp(100,200,(t-0.30)/0.08)|0, lerp(50,235,(t-0.30)/0.08)|0];
    if(t<0.62) return [135,206,235];
    if(t<0.70) return [lerp(135,255,(t-0.62)/0.08)|0, lerp(206,100,(t-0.62)/0.08)|0, lerp(235,50,(t-0.62)/0.08)|0];
    if(t<0.78) return [lerp(255,10,(t-0.70)/0.08)|0, lerp(100,10,(t-0.70)/0.08)|0, lerp(50,30,(t-0.70)/0.08)|0];
    return [10,10,30];
  }
  function lightLevel(){
    const t=dayT;
    if(t<0.22||t>0.84) return 0.2;
    if(t<0.36) return lerp(0.2,1.0,(t-0.22)/0.14);
    if(t<0.64) return 1.0;
    if(t<0.78) return lerp(1.0,0.2,(t-0.64)/0.14);
    return 0.2;
  }

  // =============== FIRST-PERSON RENDERER ===============
  function render(){
    if(!ctx) return;

    // Resize pixel buffer if needed
    const rw=Math.ceil(cw/SCALE), rh=Math.ceil(ch/SCALE);
    if(!offCanvas||offCanvas.width!==rw||offCanvas.height!==rh){
      offCanvas=document.createElement('canvas');
      offCanvas.width=rw; offCanvas.height=rh;
      offCtx=offCanvas.getContext('2d');
      imgData=offCtx.createImageData(rw,rh);
      pxBuf=new Uint32Array(imgData.data.buffer);
    }

    const [sr,sg,sb]=skyRGB();
    const sky32=0xFF000000|(sb<<16)|(sg<<8)|sr;
    const ll=lightLevel();
    const ey=py+EYE_H;

    // Minecraft-like FOV: 70° total horizontal = 35° half-angle
    // Use a proper perspective projection with a plane-based approach
    // planeDist = 1 / tan(fovH/2)  where fovH = 70deg = 1.2217 rad
    const FOV_H = 1.2217; // 70 degrees total horizontal FOV
    const halfTanH = Math.tan(FOV_H * 0.5); // tan(35°) ≈ 0.700
    const halfTanV = halfTanH * (rh / rw);  // maintain aspect ratio

    const sinYaw=Math.sin(yaw), cosYaw=Math.cos(yaw);
    const sinPitch=Math.sin(pitch), cosPitch=Math.cos(pitch);

    // Forward vector (look direction)
    const fwdX = sinYaw * cosPitch;
    const fwdY = sinPitch;
    const fwdZ = cosYaw * cosPitch;
    // Right vector (perpendicular horizontal)
    const rgtX = cosYaw;
    const rgtY = 0;
    const rgtZ = -sinYaw;
    // Up vector (perpendicular vertical, accounts for pitch)
    const upX = -sinYaw * sinPitch;
    const upY = cosPitch;
    const upZ = -cosYaw * sinPitch;

    // Ray march each column (and row for pitch)
    for(let sx2=0;sx2<rw;sx2++){
      const camX2 = (sx2 / rw) * 2.0 - 1.0; // -1 to +1

      for(let sy2=0;sy2<rh;sy2++){
        const camY2 = 1.0 - (sy2 / rh) * 2.0; // +1 top, -1 bottom

        // Build ray direction using plane projection (no atan distortion)
        const dx = fwdX + rgtX * camX2 * halfTanH + upX * camY2 * halfTanV;
        const dy = fwdY + rgtY * camX2 * halfTanH + upY * camY2 * halfTanV;
        const dz = fwdZ + rgtZ * camX2 * halfTanH + upZ * camY2 * halfTanV;
        // Normalize
        const invLen = 1.0 / Math.sqrt(dx*dx+dy*dy+dz*dz);
        const rdx=dx*invLen, rdy=dy*invLen, rdz=dz*invLen;

        const hit=castRay(px,ey,pz, rdx,rdy,rdz, 80);
        let col32;
        if(!hit){
          // Sky gradient: darker at top, lighter near horizon
          if(rdy < 0.0){
            // Below horizon — ground/void color (earthy brown)
            const t = Math.min(1, -rdy * 4);
            const gr = lerp(sr, 70, t)|0;
            const gg = lerp(sg, 55, t)|0;
            const gb = lerp(sb, 35, t)|0;
            col32=0xFF000000|(gb<<16)|(gg<<8)|gr;
          } else {
            // Sky — slight gradient (lighter near horizon)
            const t = Math.min(1, rdy * 2);
            const skR = lerp(sr, Math.max(0,sr-20), t)|0;
            const skG = lerp(sg, Math.max(0,sg-15), t)|0;
            const skB = lerp(sb, Math.min(255,sb+10), t)|0;
            col32=0xFF000000|(skB<<16)|(skG<<8)|skR;
          }
        } else {
          const {bx,by,bz,face,dist,id}=hit;
          // Sample texture
          const tex=makeTexture(id,face);
          // UV mapping per face — use normalized ray at hit point
          let u,v;
          const hitX=px+rdx*dist, hitY=ey+rdy*dist, hitZ=pz+rdz*dist;
          if(face===0||face===1){ u=(hitZ-Math.floor(hitZ)); v=1-(hitY-Math.floor(hitY)); }
          else if(face===2||face===3){ u=(hitX-Math.floor(hitX)); v=(hitZ-Math.floor(hitZ)); }
          else { u=(hitX-Math.floor(hitX)); v=1-(hitY-Math.floor(hitY)); }
          if(face===1||face===5) u=1-u;
          const tu=Math.min(TEX_SIZE-1,Math.max(0,(u*(TEX_SIZE))|0));
          const tv2=Math.min(TEX_SIZE-1,Math.max(0,(v*(TEX_SIZE))|0));
          let t32=tex[tv2*TEX_SIZE+tu]||0xFF808080;

          // Distance fog — Minecraft fades to sky color starting at ~16 blocks, full fog at 48
          const fogAmt = Math.max(0, Math.min(1, (dist - 16) / 32));
          // Face shading (Minecraft style: top=1.0, N/S=0.8, E/W=0.6, bottom=0.5)
          const faceSh=(face===2)?1.0:(face===3)?0.5:(face===0||face===1)?0.65:0.80;
          const totalSh = ll * faceSh;

          let tr=(t32)&0xFF, tg=(t32>>8)&0xFF, tb2=(t32>>16)&0xFF;
          // Apply lighting first
          tr = (tr * totalSh)|0;
          tg = (tg * totalSh)|0;
          tb2 = (tb2 * totalSh)|0;
          // Then blend toward sky color with fog
          tr = lerp(tr, sr, fogAmt)|0;
          tg = lerp(tg, sg, fogAmt)|0;
          tb2 = lerp(tb2, sb, fogAmt)|0;
          // Breaking crack overlay
          if(breakBx===bx&&breakBy===by&&breakBz===bz&&breakTick>0){
            const prog=breakTick/bHard(id);
            const dark=prog*120|0;
            tr=Math.max(0,tr-dark); tg=Math.max(0,tg-dark); tb2=Math.max(0,tb2-dark);
          }
          col32=0xFF000000|(Math.min(255,tb2)<<16)|(Math.min(255,tg)<<8)|Math.min(255,tr);
        }
        pxBuf[sy2*rw+sx2]=col32;
      }
    }

    // Blit offscreen buffer to main canvas at full size
    offCtx.putImageData(imgData,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(offCanvas,0,0,rw,rh,0,0,cw,ch);

    drawHUD3D();

    // Vignette
    const vig=ctx.createRadialGradient(cw/2,ch/2,ch*0.3,cw/2,ch/2,ch*0.9);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    vig.addColorStop(1,'rgba(0,0,0,0.35)');
    ctx.fillStyle=vig;
    ctx.fillRect(0,0,cw,ch);

    if(!mcFocused){
      ctx.fillStyle='rgba(0,0,0,0.65)';
      ctx.fillRect(0,0,cw,ch);
      // Panel
      const pw=380, ph=148;
      const px2=cw/2-pw/2, py2=ch/2-ph/2;
      ctx.fillStyle='rgba(20,20,20,0.94)';
      ctx.strokeStyle='rgba(255,255,255,0.22)';
      ctx.lineWidth=1;
      roundRect(ctx,px2,py2,pw,ph,6); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.22)';
      roundRect(ctx,px2+0.5,py2+0.5,pw-1,ph-1,6); ctx.stroke();
      ctx.fillStyle='#fff';
      ctx.font='bold 18px "Courier New",monospace';
      ctx.textAlign='center';
      ctx.fillText('🎮  Click to Play',cw/2,py2+30);
      ctx.font='11px "Courier New",monospace';
      ctx.fillStyle='#aaa';
      ctx.fillText('WASD · Move                Space/Shift · Fly Up/Down',cw/2,py2+52);
      ctx.fillText('Click + Drag · Look around',cw/2,py2+68);
      ctx.fillText('LClick · Break block       RClick · Place block',cw/2,py2+84);
      ctx.fillText('Scroll / 1–9 · Select hotbar slot',cw/2,py2+100);
      ctx.fillStyle='#55FFFF';
      ctx.fillText('✈ Double-tap Space or F · Toggle creative fly',cw/2,py2+117);
      ctx.fillStyle='#44ccff';
      ctx.fillText('✓ Mac & Trackpad friendly',cw/2,py2+132);
      ctx.fillStyle='#ff9944';
      ctx.fillText('Esc · Pause',cw/2,py2+147);
      ctx.textAlign='left';
    } else {
      // Pause button (top-right of canvas, always visible while playing)
      const bw=68, bh=26, bx2=cw-bw-4, by2=4;
      ctx.fillStyle='rgba(0,0,0,0.55)';
      roundRect(ctx,bx2,by2,bw,bh,4); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)';
      ctx.lineWidth=1;
      roundRect(ctx,bx2+0.5,by2+0.5,bw-1,bh-1,4); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.75)';
      ctx.font='bold 10px "Courier New",monospace';
      ctx.textAlign='center';
      ctx.fillText('⏸ Esc/Pause', bx2+bw/2, by2+17);
      ctx.textAlign='left';
    }
  }

  // =============== HUD ===============
  function drawHUD3D(){
    // Crosshair
    const cx=cw/2, cy=ch/2;
    ctx.strokeStyle='rgba(255,255,255,0.85)';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx-10,cy); ctx.lineTo(cx+10,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-10); ctx.lineTo(cx,cy+10); ctx.stroke();
    // Dark outline for crosshair
    ctx.strokeStyle='rgba(0,0,0,0.45)';
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-10,cy); ctx.lineTo(cx+10,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-10); ctx.lineTo(cx,cy+10); ctx.stroke();

    // Target block outline (drawn in world = overlay on HUD)
    const tgt=targetBlock3D();
    // (outline handled via darkening in raycaster)

    // Hotbar (Minecraft-style)
    const SLOT=40, N=9, GAP=2;
    const hbW=N*(SLOT+GAP)-GAP;
    const hbX=Math.floor((cw-hbW)/2);
    const hbY=ch-SLOT-10;

    // Hotbar background (dark semi-transparent)
    ctx.fillStyle='rgba(0,0,0,0.5)';
    roundRect(ctx, hbX-3,hbY-3,hbW+6,SLOT+6, 3);
    ctx.fill();

    for(let i=0;i<N;i++){
      const sx=hbX+i*(SLOT+GAP), sy=hbY;
      const sel=i===slot;
      // Slot border
      ctx.strokeStyle=sel?'#FFFFFF':'rgba(255,255,255,0.3)';
      ctx.lineWidth=sel?2:1;
      ctx.strokeStyle=sel?'rgba(255,255,255,0.9)':'rgba(100,100,100,0.6)';
      ctx.strokeRect(sx+0.5,sy+0.5,SLOT-1,SLOT-1);
      // Slot inner
      ctx.fillStyle=sel?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.25)';
      ctx.fillRect(sx+1,sy+1,SLOT-2,SLOT-2);

      const item=hotbar[i];
      if(item&&item.ct>0){
        drawItemIcon(ctx, item.id, sx+4, sy+4, SLOT-8);
        // Count
        ctx.font='bold 9px "Courier New",monospace';
        ctx.textAlign='right';
        ctx.fillStyle='white';
        ctx.shadowColor='#000'; ctx.shadowBlur=2;
        ctx.fillText(item.ct, sx+SLOT-2, sy+SLOT-3);
        ctx.shadowBlur=0;
      }
    }

    // Health bar (hearts above hotbar left)
    const heartX=hbX;
    const heartY=hbY-22;
    for(let i=0;i<10;i++){
      const hx=heartX+i*18, hy=heartY;
      const filled=(i<hp/2);
      const half=(i===(Math.ceil(hp/2)-1) && hp%2===1);
      ctx.font='14px serif';
      ctx.fillStyle=filled?'#FF3333':'rgba(255,50,50,0.3)';
      ctx.shadowColor='#000'; ctx.shadowBlur=2;
      ctx.fillText('❤',hx,hy);
      ctx.shadowBlur=0;
    }

    // Hunger bar (above hotbar right)
    const hunX=hbX+hbW;
    const hunY=hbY-22;
    for(let i=9;i>=0;i--){
      const hx=hunX-(9-i)*18-14, hy=hunY;
      const filled=(i<hunger/2);
      ctx.font='14px serif';
      ctx.fillStyle=filled?'#CC8800':'rgba(180,100,0,0.3)';
      ctx.shadowColor='#000'; ctx.shadowBlur=2;
      ctx.fillText('🍗',hx,hy);
      ctx.shadowBlur=0;
    }

    // Selected item name
    const cur=hotbar[slot];
    if(cur&&cur.ct>0){
      const nm=bName(cur.id);
      ctx.font='bold 13px "Courier New",monospace';
      ctx.textAlign='center';
      const tw=ctx.measureText(nm).width;
      ctx.fillStyle='rgba(0,0,0,0.55)';
      ctx.fillRect(cw/2-tw/2-6,hbY-42,tw+12,18);
      ctx.fillStyle='#FFFF55';
      ctx.shadowColor='#000'; ctx.shadowBlur=3;
      ctx.fillText(nm,cw/2,hbY-28);
      ctx.shadowBlur=0;
    }
    ctx.textAlign='left';

    // Right hand / held item (bottom-right corner)
    const item=hotbar[slot];
    if(item&&item.ct>0){
      ctx.save();
      ctx.translate(cw-60, ch-30);
      ctx.rotate(-0.3);
      drawItemIcon(ctx, item.id, -20, -40, 52);
      // Arm stub
      ctx.fillStyle='#4478CC';
      ctx.fillRect(-12, 0, 28, 40);
      // Hand
      ctx.fillStyle='#E8C090';
      ctx.fillRect(-10, -8, 26, 14);
      ctx.restore();
    }

    // Day/night indicator (top-left)
    ctx.font='9px monospace';
    ctx.fillStyle='rgba(255,255,255,0.55)';
    ctx.textAlign='left';
    const timeStr = dayT<0.25||dayT>0.83 ? '🌙 Night' : dayT<0.38||dayT>0.62 ? '🌅 Dusk/Dawn' : '☀ Day';
    ctx.fillText(timeStr, 6, 14);

    // Fly mode indicator
    if(flyMode){
      const fwLabel='✈ CREATIVE FLY';
      ctx.font='bold 10px "Courier New",monospace';
      const fw2=ctx.measureText(fwLabel).width;
      ctx.fillStyle='rgba(0,0,0,0.45)';
      ctx.fillRect(cw/2-fw2/2-5, 4, fw2+10, 16);
      ctx.fillStyle='#55FFFF';
      ctx.textAlign='center';
      ctx.shadowColor='#000'; ctx.shadowBlur=3;
      ctx.fillText(fwLabel, cw/2, 16);
      ctx.shadowBlur=0;
      ctx.textAlign='left';
      // Controls reminder
      ctx.font='8px monospace';
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.textAlign='center';
      ctx.fillText('Space=Up  Shift=Down  F=Toggle fly', cw/2, 28);
      ctx.textAlign='left';
    }

    ctx.textAlign='left';
  }

  function roundRect(ctx2,x,y,w,h,r){
    ctx2.beginPath();
    ctx2.moveTo(x+r,y);
    ctx2.lineTo(x+w-r,y); ctx2.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx2.lineTo(x+w,y+h-r); ctx2.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx2.lineTo(x+r,y+h); ctx2.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx2.lineTo(x,y+r); ctx2.quadraticCurveTo(x,y,x+r,y);
    ctx2.closePath();
  }

  function drawItemIcon(ctx2, id, x, y, s){
    // Draw a tiny isometric-ish block icon for hotbar
    const side=bSide(id), top=bTop2(id)||side;
    if(!side) return;
    // Top face
    ctx2.fillStyle=`rgb(${top[0]},${top[1]},${top[2]})`;
    ctx2.fillRect(x, y, s, s*0.5);
    // Left face (slightly darker)
    const dm=0.75;
    ctx2.fillStyle=`rgb(${side[0]*dm|0},${side[1]*dm|0},${side[2]*dm|0})`;
    ctx2.fillRect(x, y+s*0.5, s*0.5, s*0.5);
    // Right face
    const dm2=0.85;
    ctx2.fillStyle=`rgb(${side[0]*dm2|0},${side[1]*dm2|0},${side[2]*dm2|0})`;
    ctx2.fillRect(x+s*0.5, y+s*0.5, s*0.5, s*0.5);
    ctx2.strokeStyle='rgba(0,0,0,0.3)'; ctx2.lineWidth=0.5;
    ctx2.strokeRect(x+0.5,y+0.5,s-1,s-1);
  }

  // =============== GAME LOOP ===============
  const DAY_DURATION = 600; // seconds per full day cycle

  function frame(now){
    raf=requestAnimationFrame(frame);
    const dt=Math.min((now-lastRaf)/1000, 0.05);
    lastRaf=now;

    const win=document.getElementById('minecraft');
    if(!win||!win.classList.contains('show')){ render(); return; }

    dayT=(dayT+dt/DAY_DURATION)%1;

    if(mcFocused){
      if(lmb) doBreak(); else { breakBx=-1; breakTick=0; }
      const steps=3;
      for(let s=0;s<steps;s++) physStep(dt/steps);
    }

    render();
  }

  // =============== INIT ===============
  function initGame(){
    canvas=document.getElementById('mc-canvas');
    if(!canvas) return;
    ctx=canvas.getContext('2d',{alpha:false});

    function resize(){
      cw=canvas.clientWidth||800;
      ch=canvas.clientHeight||480;
      canvas.width=cw;
      canvas.height=ch;
      offCanvas=null; imgData=null; // force rebuffer on next render
    }
    resize();
    new ResizeObserver(resize).observe(canvas);

    generateWorld();
    bakeTextures();

    // Spawn player on surface — scan top-down (y=0 is sky, increasing y = deeper)
    // Find first solid block that has air above it
    const spawnX=Math.floor(WX/2), spawnZ=Math.floor(WZ/2);
    let spawnSurfY = 30; // fallback guess
    for(let y=2;y<WY-2;y++){
      const above = getB(spawnX, y-1, spawnZ);
      const here  = getB(spawnX, y,   spawnZ);
      if(!bSolid(above) && bSolid(here)){
        spawnSurfY = y; // y is the surface block, y-1 is air above
        break;
      }
    }
    // Place player feet so they stand ON TOP of the surface block
    // Surface block is at spawnSurfY, player feet = spawnSurfY-1 (one block above)
    px = spawnX + 0.5;
    py = spawnSurfY - 1 - 0.01; // feet at y just above surface block
    pz = spawnZ + 0.5;
    pvx=0; pvy=0; pvz=0; onGround=true;
    yaw=0.5; pitch=-0.15; // look slightly down at terrain

    // ---- Pointer lock (enhancement, not required) ----
    function tryLockPointer(){
      if(canvas.requestPointerLock){
        try{ canvas.requestPointerLock(); } catch(err){}
      }
    }
    function releaseLock(){
      try{ if(document.exitPointerLock) document.exitPointerLock(); } catch(err){}
      pointerLocked=false;
    }
    function pauseGame(){
      releaseLock();
      mcFocused=false; dragging=false;
      Object.keys(keys).forEach(k=>keys[k]=false);
      lmb=false; rmb=false;
    }

    document.addEventListener('pointerlockchange',()=>{
      pointerLocked=(document.pointerLockElement===canvas);
      if(!pointerLocked && mcFocused){
        // Pointer lock lost but keep game focused (Mac fallback still works)
      }
    });

    // ---- Mouse move: pointer lock delta OR drag delta ----
    canvas.addEventListener('mousemove',e=>{
      if(!mcFocused) return;
      if(pointerLocked){
        // Pointer lock gives us reliable movementX/Y
        yaw   += e.movementX * 0.003;
        pitch -= e.movementY * 0.003;
      } else if(dragging){
        // Drag-to-look fallback (Mac/trackpad friendly)
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        yaw   += dx * 0.004;
        pitch -= dy * 0.004;
      }
      lastMouseX=e.clientX; lastMouseY=e.clientY;
      pitch=Math.max(-Math.PI*0.49,Math.min(Math.PI*0.49,pitch));
    });

    // ---- Mousedown: focus + drag start + block actions ----
    canvas.addEventListener('mousedown',e=>{
      // Check if pause button was clicked (top-right corner, 70×28 area)
      if(mcFocused && e.clientX > canvas.getBoundingClientRect().right - 76 &&
         e.clientY < canvas.getBoundingClientRect().top + 34){
        pauseGame(); e.preventDefault(); return;
      }
      if(!mcFocused){
        mcFocused=true;
        tryLockPointer();
        lastMouseX=e.clientX; lastMouseY=e.clientY;
        e.preventDefault(); return;
      }
      lastMouseX=e.clientX; lastMouseY=e.clientY;
      if(e.button===0){ lmb=true; dragging=true; }
      if(e.button===2){ rmb=true; doPlace(); }
      e.preventDefault();
    });
    canvas.addEventListener('mouseup',e=>{
      if(e.button===0){ lmb=false; dragging=false; }
      if(e.button===2) rmb=false;
    });
    // Touch: two-finger drag for look, one-finger for move (basic)
    let touchStartX=0, touchStartY=0, touchId=-1;
    canvas.addEventListener('touchstart',e=>{
      if(!mcFocused){ mcFocused=true; }
      if(e.touches.length===1){
        touchId=e.touches[0].identifier;
        touchStartX=e.touches[0].clientX;
        touchStartY=e.touches[0].clientY;
        lastMouseX=touchStartX; lastMouseY=touchStartY;
        dragging=true;
      }
      e.preventDefault();
    },{passive:false});
    canvas.addEventListener('touchmove',e=>{
      if(!mcFocused) return;
      for(let i=0;i<e.touches.length;i++){
        if(e.touches[i].identifier===touchId){
          const dx=e.touches[i].clientX-lastMouseX;
          const dy=e.touches[i].clientY-lastMouseY;
          yaw   += dx * 0.005;
          pitch -= dy * 0.005;
          pitch=Math.max(-Math.PI*0.49,Math.min(Math.PI*0.49,pitch));
          lastMouseX=e.touches[i].clientX;
          lastMouseY=e.touches[i].clientY;
        }
      }
      e.preventDefault();
    },{passive:false});
    canvas.addEventListener('touchend',e=>{ dragging=false; e.preventDefault(); },{passive:false});

    canvas.addEventListener('contextmenu',e=>e.preventDefault());

    // ---- Scroll: slot selection (no pointer lock gate) ----
    canvas.addEventListener('wheel',e=>{
      if(!mcFocused) return;
      slot=((slot+(e.deltaY>0?1:-1))+9)%9;
      e.preventDefault();
    },{passive:false});

    // ---- Keyboard: works whenever game is focused (no pointer lock required) ----
    document.addEventListener('keydown',e=>{
      const win2=document.getElementById('minecraft');
      if(!win2||!win2.classList.contains('show')) return;
      if(e.key==='Escape'){
        pauseGame();
        return;
      }
      if(!mcFocused) return;
      const k=e.key.toLowerCase();

      // Double-tap Space = toggle fly mode (like Minecraft creative)
      if(e.key===' '||e.key==='Spacebar'){
        const now=performance.now();
        if(now-lastSpaceTap<300){
          flyMode=!flyMode;
          pvy=0; // stop vertical momentum when switching
          lastSpaceTap=0;
        } else {
          lastSpaceTap=now;
        }
      }

      keys[k]=true;
      if(e.key>='1'&&e.key<='9') slot=parseInt(e.key)-1;
      // F key: toggle fly shortcut
      if(k==='f') { flyMode=!flyMode; pvy=0; }
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener('keyup',e=>{
      keys[e.key.toLowerCase()]=false;
    });

    lastRaf=performance.now();
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(frame);
  }

  // Hook into openWindow
  const _origOpen=window.openWindow;
  window.openWindow=function(id){
    const r=_origOpen?_origOpen(id):undefined;
    if(id==='minecraft'&&!gameInited){
      gameInited=true;
      setTimeout(initGame,80);
    }
    if(id==='media-player') wmpInit();
    return r;
  };
})();

// ===================== WINDOWS MEDIA PLAYER =====================
(function(){

  // ── Song library ──────────────────────────────────────────────
  const WMP_SONGS = [
    {
      title:  'iPod Touch',
      artist: 'Ninajirachi',
      album:  'I Love My Computer',
      src:    'iPod Touch.mp3'
    },
    {
      title:  'That Green Gentleman',
      artist: 'Panic! at the Disco',
      album:  'Pretty. Odd.',
      src:    'That Green Gentleman.mp3'
    },
    {
      title:  'CSIRAC',
      artist: 'Ninajirachi',
      album:  'CSIRAC',
      src:    'CSIRAC.m4a'
    }
  ];

  // ── State ────────────────────────────────────────────────────
  let wmpIdx     = 0;
  let wmpPlaying = false;
  let wmpShuffle = false;
  let wmpRepeat  = false;
  let wmpInited  = false;
  let wmpPresetIdx = 0;
  let wmpPresetKeys = [];

  // Web Audio / Butterchurn refs
  let wmpAudioCtx, wmpAnalyser, wmpSource, wmpVisualizer;
  let wmpVizRaf = 0;

  // DOM refs
  let audio, canvas, playBtn, statusBar, seekFill, seekThumb,
      elapsedEl, totalEl, infobarText, vizLabel;

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────
  window.wmpPlayPause = () => { wmpEnsureCtx(); wmpPlaying ? pause() : play(); };
  window.wmpStop      = () => { pause(); if (audio) { audio.currentTime = 0; wmpUpdateSeek(); } };
  window.wmpPrev      = () => { wmpLoadTrack((wmpIdx - 1 + WMP_SONGS.length) % WMP_SONGS.length, true); };
  window.wmpNext      = () => { wmpLoadTrack(wmpShuffle ? wmpRandNext() : (wmpIdx+1) % WMP_SONGS.length, true); };
  window.wmpToggleShuffle = () => {
    wmpShuffle = !wmpShuffle;
    const b = document.getElementById('wmp-shuffle-btn');
    if (b) b.classList.toggle('active', wmpShuffle);
  };
  window.wmpToggleRepeat = () => {
    wmpRepeat = !wmpRepeat;
    const b = document.getElementById('wmp-repeat-btn');
    if (b) b.classList.toggle('active', wmpRepeat);
  };
  window.wmpSetVolume = v => { if (audio) audio.volume = v / 100; };
  window.wmpSeek = e => {
    const bar = document.getElementById('wmp-seekbar');
    if (!bar || !audio || !audio.duration) return;
    const pct = Math.max(0, Math.min(1, e.offsetX / bar.clientWidth));
    audio.currentTime = pct * audio.duration;
  };
  window.wmpCycleViz = dir => {
    if (!wmpPresetKeys.length) return;
    wmpPresetIdx = (wmpPresetIdx + dir + wmpPresetKeys.length) % wmpPresetKeys.length;
    wmpApplyPreset(wmpPresetKeys[wmpPresetIdx]);
  };

  // ─────────────────────────────────────────────────────────────
  // Init — called once when the WMP window first opens
  // ─────────────────────────────────────────────────────────────
  window.wmpInit = function() {
    if (wmpInited) return;
    wmpInited = true;

    audio         = document.getElementById('wmp-audio');
    canvas        = document.getElementById('wmp-canvas');
    playBtn       = document.getElementById('wmp-play-btn');
    statusBar     = document.getElementById('wmp-statusbar');
    seekFill      = document.getElementById('wmp-seek-fill');
    seekThumb     = document.getElementById('wmp-seek-thumb');
    elapsedEl     = document.getElementById('wmp-elapsed');
    totalEl       = document.getElementById('wmp-total');
    infobarText   = document.getElementById('wmp-infobar-text');
    vizLabel      = document.getElementById('wmp-viz-label');

    audio.volume = 0.8;
    audio.addEventListener('timeupdate', wmpUpdateSeek);
    audio.addEventListener('ended', () => {
      if (wmpRepeat) { audio.currentTime = 0; play(); }
      else window.wmpNext();
    });
    // Audio plays natively through the <audio> element.
    // We do NOT use createMediaElementSource so audio is never hijacked
    // by the AudioContext — this ensures playback works on file:// and hosted.

    // Size the canvas to fill its container
    wmpResizeCanvas();
    new ResizeObserver(wmpResizeCanvas).observe(canvas.parentElement);

    // Build playlist
    wmpBuildPlaylist();

    // Load first track (no autoplay until user clicks)
    wmpLoadTrack(0, false);

    // Boot Butterchurn visualizer immediately (no audio needed yet)
    wmpBootButterchurn();
  };

  // ─────────────────────────────────────────────────────────────
  // Butterchurn boot — runs on init, retries until libs are ready
  // ─────────────────────────────────────────────────────────────
  function wmpBootButterchurn() {
    if (typeof window.butterchurn === 'undefined' || typeof window.butterchurnPresets === 'undefined') {
      setTimeout(wmpBootButterchurn, 300);
      return;
    }

    // The UMD build wraps the class under .default
    const Butterchurn = window.butterchurn.default || window.butterchurn;
    const getPresets  = window.butterchurnPresets.getPresets
      ? () => window.butterchurnPresets.getPresets()
      : () => window.butterchurnPresets.default.getPresets();

    // Create AudioContext now (needed by Butterchurn constructor)
    // Audio element is NOT connected yet — that happens on first user gesture
    if (!wmpAudioCtx) {
      wmpAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      wmpAnalyser = wmpAudioCtx.createAnalyser();
      wmpAnalyser.fftSize = 2048;
      wmpAnalyser.smoothingTimeConstant = 0.8;
    }

    // Resize canvas now so Butterchurn gets correct dimensions
    wmpResizeCanvas();

    wmpVisualizer = Butterchurn.createVisualizer(wmpAudioCtx, canvas, {
      width:  canvas.width,
      height: canvas.height,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1
    });

    // Connect analyser to Butterchurn
    wmpVisualizer.connectAudio(wmpAnalyser);

    // Load preset list — store getPresets fn for later use in wmpApplyPreset
    window._wmpGetPresets = getPresets;
    const allPresets = getPresets();
    wmpPresetKeys = Object.keys(allPresets);

    // Pick a nice starting preset — try a known good one or random
    const preferredStarts = [
      'Flexi - mass particle system donut',
      'Unchained - Braindance',
      'Flexi - against the machine',
      'Aderrasi + Flexi - Iridescent Corruption',
      'Flexi - plasma donut',
    ];
    let startName = wmpPresetKeys[0];
    for (const name of preferredStarts) {
      if (allPresets[name]) { startName = name; break; }
    }
    wmpPresetIdx = wmpPresetKeys.indexOf(startName);
    if (wmpPresetIdx < 0) wmpPresetIdx = 0;

    wmpApplyPreset(wmpPresetKeys[wmpPresetIdx]);

    // Resume AudioContext so Butterchurn renders immediately (visuals run without music)
    // The browser may re-suspend it; wmpEnsureCtx() resumes again on play click.
    wmpAudioCtx.resume().catch(() => {});

    // Start Butterchurn render loop
    cancelAnimationFrame(wmpVizRaf);
    wmpRenderLoop();
  }

  // ─────────────────────────────────────────────────────────────
  // Web Audio connect — called on first user gesture (play button)
  // Connects the audio element to the analyser so visuals react to music
  // ─────────────────────────────────────────────────────────────
  function wmpEnsureCtx() {
    if (!wmpAudioCtx) return;
    if (wmpAudioCtx.state === 'suspended') {
      wmpAudioCtx.resume().catch(() => {});
    }
  }

  function wmpApplyPreset(presetName) {
    if (!wmpVisualizer) return;
    const getPresets = window._wmpGetPresets || (() => window.butterchurnPresets.getPresets());
    const presets = getPresets();
    const preset = presets[presetName];
    if (!preset) return;
    wmpVisualizer.loadPreset(preset, 2.0); // 2s blend transition
    if (vizLabel) {
      // Shorten very long preset names for display
      let label = presetName.replace(/^[^-]+ - /, '');
      if (label.length > 40) label = label.slice(0, 38) + '…';
      vizLabel.textContent = label;
    }
  }

  // Auto-cycle presets every 30s while playing
  let wmpPresetTimer = null;
  function wmpStartPresetCycle() {
    clearInterval(wmpPresetTimer);
    wmpPresetTimer = setInterval(() => {
      if (!wmpPlaying || !wmpPresetKeys.length) return;
      wmpPresetIdx = (wmpPresetIdx + 1) % wmpPresetKeys.length;
      wmpApplyPreset(wmpPresetKeys[wmpPresetIdx]);
    }, 30000);
  }

  // ─────────────────────────────────────────────────────────────
  // Render loop (after Butterchurn is ready)
  // ─────────────────────────────────────────────────────────────
  function wmpRenderLoop() {
    const loop = () => {
      wmpVizRaf = requestAnimationFrame(loop);
      if (!wmpVisualizer) return;
      // Only render if the WMP window is visible
      const win = document.getElementById('media-player');
      if (!win || !win.classList.contains('show')) return;
      wmpVisualizer.render();
    };
    loop();
  }

  // (Idle loop removed — calling getContext('2d') on the canvas would prevent
  //  Butterchurn from acquiring a WebGL context. Canvas stays black via CSS.)

  // ─────────────────────────────────────────────────────────────
  // Handle canvas resize — also notify Butterchurn
  // ─────────────────────────────────────────────────────────────
  function wmpResizeCanvas() {
    if (!canvas) return;
    const w = canvas.offsetWidth  || 400;
    const h = canvas.offsetHeight || 260;
    if (canvas.width === w && canvas.height === h) return;
    canvas.width  = w;
    canvas.height = h;
    if (wmpVisualizer) {
      wmpVisualizer.setRendererSize(w, h);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Load a track
  // ─────────────────────────────────────────────────────────────
  function wmpLoadTrack(idx, autoplay) {
    wmpIdx = idx;
    const song = WMP_SONGS[idx];

    audio.src = song.src;
    audio.load();

    if (infobarText) infobarText.textContent = `${song.title} — ${song.artist}`;
    if (statusBar)   statusBar.textContent   = `${song.title} — ${song.artist}`;

    document.querySelectorAll('.wmp-pl-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      const sym = el.querySelector('.wmp-pl-playing');
      if (sym) sym.style.display = i === idx ? 'inline' : 'none';
    });

    audio.addEventListener('loadedmetadata', () => {
      if (totalEl) totalEl.textContent = fmtTime(audio.duration);
      wmpUpdateSeek();
    }, { once: true });

    if (autoplay) play();
    else {
      wmpPlaying = false;
      wmpSetPlayIcon(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Play / Pause
  // ─────────────────────────────────────────────────────────────
  function play() {
    // Resume AudioContext for Butterchurn visuals (does not affect audio output)
    if (wmpAudioCtx && wmpAudioCtx.state === 'suspended') {
      wmpAudioCtx.resume().catch(() => {});
    }
    audio.play().then(() => {
      wmpPlaying = true;
      wmpSetPlayIcon(true);
      if (infobarText) infobarText.textContent = `▶  ${WMP_SONGS[wmpIdx].title} — ${WMP_SONGS[wmpIdx].artist}`;
      if (statusBar) statusBar.textContent = `Playing: ${WMP_SONGS[wmpIdx].title} — ${WMP_SONGS[wmpIdx].artist}`;
      wmpStartPresetCycle();
    }).catch(err => {
      console.warn('WMP play blocked:', err);
    });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    wmpPlaying = false;
    wmpSetPlayIcon(false);
    if (infobarText) infobarText.textContent = `${WMP_SONGS[wmpIdx].title} — ${WMP_SONGS[wmpIdx].artist}`;
    if (statusBar) statusBar.textContent = `Paused: ${WMP_SONGS[wmpIdx].title}`;
    clearInterval(wmpPresetTimer);
  }

  function wmpSetPlayIcon(playing) {
    const icon = document.getElementById('wmp-play-icon');
    if (!icon) return;
    if (playing) {
      // Pause icon: two rectangles
      icon.innerHTML = '<rect x="2" y="2" width="4" height="10" fill="currentColor"/><rect x="8" y="2" width="4" height="10" fill="currentColor"/>';
    } else {
      // Play icon: triangle
      icon.innerHTML = '<polygon points="2,1 2,13 13,7" fill="currentColor"/>';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Seek bar
  // ─────────────────────────────────────────────────────────────
  function wmpUpdateSeek() {
    if (!audio || !audio.duration) return;
    const pct = audio.currentTime / audio.duration;
    if (seekFill)  seekFill.style.width = (pct * 100) + '%';
    if (seekThumb) seekThumb.style.left = (pct * 100) + '%';
    if (elapsedEl) elapsedEl.textContent = fmtTime(audio.currentTime);
    if (totalEl)   totalEl.textContent   = fmtTime(audio.duration);
  }

  // ─────────────────────────────────────────────────────────────
  // Playlist sidebar
  // ─────────────────────────────────────────────────────────────
  function wmpBuildPlaylist() {
    const list = document.getElementById('wmp-playlist');
    if (!list) return;
    list.innerHTML = '';
    WMP_SONGS.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'wmp-pl-item' + (i === 0 ? ' active' : '');
      el.onclick = () => { wmpEnsureCtx(); wmpLoadTrack(i, true); };
      el.innerHTML = `
        <div class="wmp-pl-num">${i+1}</div>
        <div class="wmp-pl-info">
          <div class="wmp-pl-title">${s.title}</div>
          <div class="wmp-pl-artist">${s.artist}</div>
        </div>
        <span class="wmp-pl-playing" style="display:${i===0?'inline':'none'}">♪</span>`;
      list.appendChild(el);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  }

  function wmpRandNext() {
    let n;
    do { n = Math.floor(Math.random() * WMP_SONGS.length); } while (n === wmpIdx && WMP_SONGS.length > 1);
    return n;
  }

})();


