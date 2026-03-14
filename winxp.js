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

// ===================== IPOD PLAYER (REAL AUDIO) =====================
let ipodPlaying = false;

function $(id) { return document.getElementById(id); }

function formatIpodTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function ipodSyncUI() {
  const audio = $("ipod-audio");
  const fill = $("ipod-fill");
  const elapsed = $("ipod-elapsed");
  const total = $("ipod-total");

  if (!audio) return;

  // Times
  if (elapsed) elapsed.textContent = formatIpodTime(audio.currentTime || 0);

  const dur = audio.duration;
  if (total) total.textContent = Number.isFinite(dur) ? formatIpodTime(dur) : "0:00";

  // Progress
  const pct = (Number.isFinite(dur) && dur > 0)
    ? (audio.currentTime / dur) * 100
    : 0;

  if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function ipodSetPlayingUI(isPlaying) {
  const wheel = $("ipod-wheel");
  if (!wheel) return;
  wheel.classList.toggle("ipod-spinning", isPlaying);
}

function ipodPlayPause() {
  const audio = $("ipod-audio");
  if (!audio) {
    console.warn("Missing #ipod-audio element");
    return;
  }

  // If paused -> play, else pause
  if (audio.paused) {
    audio.play()
      .then(() => {
        ipodPlaying = true;
        ipodSetPlayingUI(true);
      })
      .catch((err) => {
        // Autoplay policies: user interaction should allow play, but handle anyway.
        console.warn("Audio play blocked:", err);
      });
  } else {
    audio.pause();
    ipodPlaying = false;
    ipodSetPlayingUI(false);
  }
}

function ipodSkip() {
  const audio = $("ipod-audio");
  if (!audio) return;

  // "Next" behavior: restart track
  audio.currentTime = 0;
  ipodSyncUI();

  // Keep playing if it was playing
  if (!audio.paused) {
    audio.play().catch(() => {});
    ipodSetPlayingUI(true);
  }
}

function ipodRewind() {
  const audio = $("ipod-audio");
  if (!audio) return;

  // "Previous" behavior: jump back to start
  audio.currentTime = 0;
  ipodSyncUI();
}

// Keep UI updated from actual audio events
(function initIpodAudio() {
  const audio = $("ipod-audio");
  if (!audio) return;

  audio.addEventListener("loadedmetadata", ipodSyncUI);
  audio.addEventListener("timeupdate", ipodSyncUI);
  audio.addEventListener("play", () => { ipodPlaying = true; ipodSetPlayingUI(true); });
  audio.addEventListener("pause", () => { ipodPlaying = false; ipodSetPlayingUI(false); });
  audio.addEventListener("ended", () => {
    ipodPlaying = false;
    ipodSetPlayingUI(false);
    audio.currentTime = 0;
    ipodSyncUI();
  });

  // Initial paint
  ipodSyncUI();
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
  const B = {AIR:0,GRASS:1,DIRT:2,STONE:3,LOG:4,LEAVES:5,SAND:6,WATER:7,COAL:8,IRON:9,BEDROCK:10,GRAVEL:11,PLANKS:12,GLASS:13};

  // Block data: [name, hardness, dropId, sideRGB, topRGB, bottomRGB]
  // RGB as [r,g,b] arrays for fast pixel math
  const BD = [
    ['Air',      0,        B.AIR,   null,           null,           null          ],
    ['Grass',    15,       B.DIRT,  [120,85,50],    [90,160,40],    [120,85,50]   ],
    ['Dirt',     12,       B.DIRT,  [121,85,58],    [121,85,58],    [121,85,58]   ],
    ['Stone',    40,       B.STONE, [128,128,128],  [128,128,128],  [128,128,128] ],
    ['Log',      20,       B.PLANKS,[100,76,40],    [156,124,65],   [156,124,65]  ],
    ['Leaves',   5,        B.AIR,   [58,122,58],    [58,122,58],    [58,122,58]   ],
    ['Sand',     12,       B.SAND,  [212,196,114],  [212,196,114],  [212,196,114] ],
    ['Water',    Infinity, B.AIR,   [30,100,220],   [30,100,220],   [30,100,220]  ],
    ['Coal Ore', 45,       B.COAL,  [128,128,128],  [128,128,128],  [128,128,128] ],
    ['Iron Ore', 50,       B.IRON,  [128,128,128],  [128,128,128],  [128,128,128] ],
    ['Bedrock',  Infinity, B.AIR,   [37,37,37],     [37,37,37],     [37,37,37]    ],
    ['Gravel',   15,       B.GRAVEL,[122,122,120],  [122,122,120],  [122,122,120] ],
    ['Planks',   18,       B.PLANKS,[185,142,64],   [185,142,64],   [185,142,64]  ],
    ['Glass',    12,       B.GLASS, [180,220,255],  [180,220,255],  [180,220,255] ],
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

    // 2D heightmap for each (x,z) column
    const hmap = new Int32Array(WX*WZ);
    const WATER_Y = 28;
    for(let x=0;x<WX;x++){
      for(let z=0;z<WZ;z++){
        hmap[z*WX+x] = Math.round(22 + fbm2(x/24, z/24, seed)*10);
      }
    }

    // Fill voxels
    for(let x=0;x<WX;x++){
      for(let z=0;z<WZ;z++){
        const surf = hmap[z*WX+x];
        for(let y=0;y<WY;y++){
          let id;
          if(y===WY-1) id=B.BEDROCK;
          else if(y>surf) id=B.AIR;
          else if(y===surf){
            id = (surf<=WATER_Y) ? B.SAND : B.GRASS;
          } else if(y>surf-4) id=B.DIRT;
          else {
            const n = noise2(x*0.37+y*0.13,z*0.29,seed+500);
            if(n>0.92) id=B.COAL;
            else if(n>0.89) id=B.IRON;
            else if(n>0.87) id=B.GRAVEL;
            else id=B.STONE;
          }
          setB(x,y,z,id);
        }
        // Water in depressions
        for(let y=surf+1;y<=WATER_Y;y++) setB(x,y,z,B.WATER);
      }
    }

    // Trees
    for(let x=3;x<WX-3;x++){
      for(let z=3;z<WZ-3;z++){
        const surf=hmap[z*WX+x];
        if(surf>WATER_Y && noise2(x*3.7,z*2.9,seed+77)>0.78){
          placeTree3D(x,surf,z);
        }
      }
    }
  }

  function placeTree3D(x,sy,z){
    const h=4+Math.floor(noise2(x*0.71,z*0.53,42)*3);
    for(let dy=1;dy<=h;dy++) setB(x,sy-dy,z,B.LOG);
    const ty=sy-h;
    for(let dy=-1;dy<=2;dy++){
      const r=dy<1?2:1;
      for(let dx=-r;dx<=r;dx++){
        for(let dz=-r;dz<=r;dz++){
          if(Math.abs(dx)+Math.abs(dz)<=r+1&&getB(x+dx,ty+dy,z+dz)===B.AIR)
            setB(x+dx,ty+dy,z+dz,B.LEAVES);
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
    pvy -= GRAVITY*dt;
    if(pvy<-50) pvy=-50;

    const inWater = getB(px|0, (py+EYE_H*0.5)|0, pz|0)===B.WATER;
    if(inWater){ pvy*=0.88; pvx*=0.85; pvz*=0.85; }

    // Directional input
    const spd = (keys['control']||keys['controlleft']) ? SPRINT_SPEED : WALK_SPEED;
    const fw = (keys['w']||keys['arrowup']) ? 1 : (keys['s']||keys['arrowdown']) ? -1 : 0;
    const st = (keys['d']||keys['arrowright']) ? 1 : (keys['a']||keys['arrowleft']) ? -1 : 0;
    const sinY=Math.sin(yaw), cosY=Math.cos(yaw);
    // Forward = (sin(yaw), cos(yaw)), Right = (cos(yaw), -sin(yaw))
    pvx = (sinY*fw + cosY*st) * spd;
    pvz = (cosY*fw - sinY*st) * spd;
    if(inWater && (keys[' '])) pvy=3;
    if(!inWater && keys[' '] && onGround){ pvy=JUMP_VEL; onGround=false; }

    // Move and collide
    const HW=PLAYER_W/2;
    // X
    px+=pvx*dt;
    for(let dy2=0;dy2<PLAYER_H;dy2+=0.5){
      if(aabbSolid(px-HW, py+dy2, pz)||aabbSolid(px+HW, py+dy2, pz)){
        px-=pvx*dt; pvx=0; break;
      }
    }
    // Z
    pz+=pvz*dt;
    for(let dy2=0;dy2<PLAYER_H;dy2+=0.5){
      if(aabbSolid(px-HW, py+dy2, pz-HW)||aabbSolid(px+HW, py+dy2, pz+HW)){
        pz-=pvz*dt; pvz=0; break;
      }
    }
    // Y
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
    // Clamp world
    px=Math.max(0.5,Math.min(WX-0.5,px));
    pz=Math.max(0.5,Math.min(WZ-0.5,pz));
    if(py<0){py=0;pvy=0;}
    if(py>WY-2){py=WY-2;pvy=0;}
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
    const cosPitch=Math.cos(pitch), sinPitch=Math.sin(pitch);
    const sinYaw=Math.sin(yaw),   cosYaw=Math.cos(yaw);
    const fovH = 1.1; // ~63 deg half-fov horizontal

    // Ray march each column (and row for pitch)
    for(let sx2=0;sx2<rw;sx2++){
      const camX2=(sx2/rw)*2-1;
      // Horizontal angle
      const rayYaw=yaw + Math.atan(camX2*Math.tan(fovH));
      const rayDX=Math.sin(rayYaw), rayDZ=Math.cos(rayYaw);

      for(let sy2=0;sy2<rh;sy2++){
        const camY2=1-(sy2/rh)*2;
        // Vertical angle
        const rayPitch=pitch + Math.atan(camY2*Math.tan(fovH*(rh/rw)));
        const cosRP=Math.cos(rayPitch), sinRP=Math.sin(rayPitch);
        const dx=rayDX*cosRP, dy=sinRP, dz=rayDZ*cosRP;

        const hit=castRay(px,ey,pz, dx,dy,dz, 64);
        let col32;
        if(!hit){
          // Sky or floor color
          if(dy<-0.01){
            // Ground fog color
            col32=0xFF000000|(0x40<<16)|(0x40<<8)|0x40;
          } else {
            col32=sky32;
          }
        } else {
          const {bx,by,bz,face,dist,id}=hit;
          // Sample texture
          const tex=makeTexture(id,face);
          // UV mapping per face
          let u,v;
          const hitX=px+dx*dist, hitY=ey+dy*dist, hitZ=pz+dz*dist;
          if(face===0||face===1){ u=(hitZ-Math.floor(hitZ)); v=1-(hitY-Math.floor(hitY)); }
          else if(face===2||face===3){ u=(hitX-Math.floor(hitX)); v=(hitZ-Math.floor(hitZ)); }
          else { u=(hitX-Math.floor(hitX)); v=1-(hitY-Math.floor(hitY)); }
          if(face===1||face===5) u=1-u;
          const tu=(u*(TEX_SIZE-1))|0, tv=(v*(TEX_SIZE-1))|0;
          let t32=tex[tv*TEX_SIZE+tu]||0xFF808080;

          // Distance fog + lighting
          const fog=Math.max(0,1-dist/40);
          const shade=ll * (0.6 + fog*0.4);
          // Face shading (like MC: top=full, sides=0.8, bottom=0.5)
          const faceSh=(face===2)?1.0:(face===3)?0.5:(face===0||face===1)?0.75:0.85;
          const totalSh=Math.min(1,shade*faceSh);

          let tr=(t32)&0xFF, tg=(t32>>8)&0xFF, tb2=(t32>>16)&0xFF;
          const fogR=sr, fogG=sg, fogB=sb;
          tr=lerp(fogR,tr*totalSh,fog)|0;
          tg=lerp(fogG,tg*totalSh,fog)|0;
          tb2=lerp(fogB,tb2*totalSh,fog)|0;
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
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,cw,ch);
      ctx.fillStyle='#fff';
      ctx.font='bold 20px "Courier New",monospace';
      ctx.textAlign='center';
      ctx.fillText('Click to Play',cw/2,ch/2-12);
      ctx.font='12px "Courier New",monospace';
      ctx.fillStyle='#ccc';
      ctx.fillText('WASD: Move  Mouse: Look  Space: Jump  LClick: Break  RClick: Place',cw/2,ch/2+14);
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

    // Day/night indicator (tiny)
    ctx.font='9px monospace';
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.textAlign='left';
    const timeStr = dayT<0.25||dayT>0.83 ? '🌙 Night' : dayT<0.38||dayT>0.62 ? '🌅 Dusk/Dawn' : '☀ Day';
    ctx.fillText(timeStr, 6, 16);

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

    // Spawn player on surface
    const spawnX=Math.floor(WX/2), spawnZ=Math.floor(WZ/2);
    for(let y=0;y<WY;y++){
      if(bSolid(getB(spawnX,y,spawnZ))){
        px=spawnX+0.5; py=y-PLAYER_H-0.01; pz=spawnZ+0.5; break;
      }
    }
    pvx=0; pvy=0; pvz=0; onGround=false;
    yaw=0.3; pitch=-0.1;

    // Pointer lock for mouse look
    canvas.addEventListener('click',()=>{
      canvas.requestPointerLock && canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange',()=>{
      pointerLocked=(document.pointerLockElement===canvas);
      mcFocused=pointerLocked;
      if(!pointerLocked){ Object.keys(keys).forEach(k=>keys[k]=false); lmb=false; rmb=false; }
    });
    canvas.addEventListener('mousemove',e=>{
      if(!pointerLocked) return;
      yaw   += e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch=Math.max(-Math.PI*0.49,Math.min(Math.PI*0.49,pitch));
    });
    canvas.addEventListener('mousedown',e=>{
      if(!pointerLocked){ canvas.requestPointerLock && canvas.requestPointerLock(); return; }
      if(e.button===0){ lmb=true; }
      if(e.button===2){ rmb=true; doPlace(); }
      e.preventDefault();
    });
    canvas.addEventListener('mouseup',e=>{
      if(e.button===0) lmb=false;
      if(e.button===2) rmb=false;
    });
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{
      slot=((slot+(e.deltaY>0?1:-1))+9)%9;
      e.preventDefault();
    },{passive:false});
    document.addEventListener('keydown',e=>{
      const win2=document.getElementById('minecraft');
      if(!win2||!win2.classList.contains('show')) return;
      keys[e.key.toLowerCase()]=true;
      if(e.key>='1'&&e.key<='9') slot=parseInt(e.key)-1;
      if(pointerLocked){ e.preventDefault(); e.stopPropagation(); }
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
    return r;
  };
})();


