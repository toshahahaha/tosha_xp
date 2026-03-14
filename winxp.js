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


// ===================== MINECRAFT GAME =====================
(function () {
  // --- Constants ---
  const TILE = 32;        // px per block
  const WW   = 256;       // world width (blocks)
  const WH   = 80;        // world height (blocks)
  const PW   = 0.8;       // player width (blocks)
  const PH   = 1.85;      // player height (blocks)
  const GRAVITY    = 28;  // blocks/s²
  const JUMP_VEL   = -11; // blocks/s
  const WALK_SPEED = 5;   // blocks/s
  const REACH      = 5.5; // blocks
  const DAY_MS     = 90000; // ms per full day

  // --- Block IDs ---
  const B = { AIR:0,GRASS:1,DIRT:2,STONE:3,LOG:4,LEAVES:5,SAND:6,WATER:7,COAL:8,IRON:9,BEDROCK:10,GRAVEL:11,PLANKS:12,GLASS:13 };

  // [name, hardness(ticks@60fps), dropId, baseColor, topColor, veinColor]
  const BD = [
    ['Air',      0,         B.AIR,    null,      null,      null],
    ['Grass',    15,        B.DIRT,   '#7B4F2E', '#5A9E1C', null],
    ['Dirt',     12,        B.DIRT,   '#7B4F2E', null,      null],
    ['Stone',    40,        B.STONE,  '#787878', null,      null],
    ['Log',      20,        B.PLANKS, '#634B1F', '#9C7A3C', null],
    ['Leaves',   5,         B.AIR,    '#3A7D3A', null,      null],
    ['Sand',     12,        B.SAND,   '#D4C472', null,      null],
    ['Water',    Infinity,  B.AIR,    '#1E64DC', null,      null],
    ['Coal Ore', 45,        B.COAL,   '#787878', null,      '#111111'],
    ['Iron Ore', 50,        B.IRON,   '#787878', null,      '#C8956C'],
    ['Bedrock',  Infinity,  B.AIR,    '#252525', null,      null],
    ['Gravel',   15,        B.GRAVEL, '#7A7A78', null,      null],
    ['Planks',   18,        B.PLANKS, '#B88C3A', null,      null],
    ['Glass',    12,        B.GLASS,  'rgba(180,220,255,0.35)', null, null],
  ];

  const bName  = i => BD[i][0];
  const bHard  = i => BD[i][1];
  const bDrop  = i => BD[i][2];
  const bColor = i => BD[i][3];
  const bTop   = i => BD[i][4];
  const bVein  = i => BD[i][5];

  // --- World ---
  let world; // Uint8Array, index = y*WW+x
  function getB(x,y){ return (x<0||x>=WW||y<0||y>=WH) ? B.STONE : world[y*WW+x]; }
  function setB(x,y,id){ if(x<0||x>=WW||y<0||y>=WH) return; world[y*WW+x]=id; }
  function solid(id){ return id!==B.AIR && id!==B.WATER && id!==B.LEAVES && id!==B.GLASS; }

  // --- Player state ---
  let px,py,pvx,pvy,onGround,hp=20,maxHp=20;

  // --- Camera ---
  let camX=0,camY=0;

  // --- Input ---
  const keys={};
  let mx=0,my=0,lmb=false,rmb=false,lastRmb=0;

  // --- Breaking ---
  let brkX=-1,brkY=-1,brkTick=0;

  // --- Inventory ---
  let hotbar=[
    {id:B.PLANKS,ct:99},{id:B.DIRT,ct:99},{id:B.STONE,ct:99},
    {id:B.SAND,ct:99},{id:B.GRAVEL,ct:99},{id:B.GLASS,ct:32},
    null,null,null
  ];
  let slot=0;

  // --- Canvas / ctx ---
  let canvas,ctx,cw,ch;

  // --- Time ---
  let dayT=0.35; // fraction 0=midnight 0.5=noon
  let lastRaf=0,raf=null,gameInited=false;

  // =============== WORLD GENERATION ===============
  function hash(n){ let x=Math.sin(n)*43758.5453123; return x-Math.floor(x); }
  function noise1(x,s){ return hash(x*127.1+s*311.7); }
  function smoothNoise(x,s){
    const ix=Math.floor(x), fx=x-ix;
    const u=fx*fx*(3-2*fx);
    return noise1(ix,s)*(1-u)+noise1(ix+1,s)*u;
  }
  function fbm(x,s,oct=4){
    let v=0,a=1,f=1,m=0;
    for(let o=0;o<oct;o++){ v+=smoothNoise(x*f,s+o*100)*a; m+=a; a*=0.5; f*=2; }
    return v/m;
  }

  function generateWorld(){
    const seed=Math.random()*9999;
    world=new Uint8Array(WW*WH);

    // Heightmap
    const hmap=new Int32Array(WW);
    for(let x=0;x<WW;x++){
      hmap[x]=Math.round(30+fbm(x/50,seed)*14-2);
    }

    const WATER_Y=40;

    // Fill terrain
    for(let x=0;x<WW;x++){
      const surf=hmap[x];
      for(let y=0;y<WH;y++){
        if(y<surf){
          setB(x,y,B.AIR);
        } else if(y===surf){
          setB(x,y, surf>=WATER_Y ? B.SAND : B.GRASS);
        } else if(y<surf+5){
          setB(x,y,B.DIRT);
        } else if(y<WH-1){
          const n=noise1(x*37.1+y*13.7,seed+500);
          if(n>0.93) setB(x,y,B.COAL);
          else if(n>0.90) setB(x,y,B.IRON);
          else if(n>0.88) setB(x,y,B.GRAVEL);
          else setB(x,y,B.STONE);
          // Caves
          const cn=Math.sin(x*0.11+seed)*Math.sin(y*0.17+seed*0.5);
          if(cn>0.55&&y>surf+4&&y<WH-3) setB(x,y,B.AIR);
        } else {
          setB(x,y,B.BEDROCK);
        }
      }
    }

    // Water pools in valleys
    for(let x=0;x<WW;x++){
      for(let y=hmap[x]+1;y<=WATER_Y;y++){
        if(getB(x,y)===B.AIR) setB(x,y,B.WATER);
      }
    }

    // Sand beaches near water level
    for(let x=1;x<WW-1;x++){
      if(Math.abs(hmap[x]-WATER_Y)<=2){
        const sy=hmap[x];
        for(let dy=-1;dy<=2;dy++){
          if(getB(x,sy+dy)===B.DIRT||getB(x,sy+dy)===B.GRASS) setB(x,sy+dy,B.SAND);
        }
      }
    }

    // Trees
    for(let x=5;x<WW-5;x++){
      if(hmap[x]<WATER_Y-1 && noise1(x*3.71,seed+77)>0.72){
        if(getB(x,hmap[x])===B.GRASS) placeTree(x,hmap[x]);
        x+=4+Math.floor(noise1(x,seed)*5);
      }
    }
  }

  function placeTree(x,sy){
    const h=4+Math.floor(noise1(x*7.3,42)*3); // 4-6 tall
    for(let dy=0;dy<h;dy++) setB(x,sy-dy-1,B.LOG);
    const top=sy-h;
    const ldef=[{r:0,dy:0},{r:1,dy:1},{r:2,dy:2},{r:2,dy:3},{r:1,dy:4}];
    for(const {r,dy} of ldef){
      for(let dx=-r;dx<=r;dx++){
        if(getB(x+dx,top+dy)===B.AIR) setB(x+dx,top+dy,B.LEAVES);
      }
    }
  }

  // =============== PHYSICS ===============
  function physStep(dt){ // dt in seconds
    // Gravity
    pvy=Math.min(pvy+GRAVITY*dt, 30);

    // In water
    const midBx=Math.floor(px+PW/2);
    const midBy=Math.floor(py+PH/2);
    const inWater=getB(midBx,midBy)===B.WATER||getB(midBx,Math.floor(py))===B.WATER;

    // Horizontal input
    let moveX=0;
    if(keys['a']||keys['arrowleft']) moveX=-1;
    if(keys['d']||keys['arrowright']) moveX=1;

    if(inWater){
      pvy*=0.86;
      pvx=moveX*WALK_SPEED*0.5;
      if(keys[' ']||keys['w']||keys['arrowup']) pvy=-3;
    } else {
      pvx=moveX*WALK_SPEED;
      if((keys[' ']||keys['w']||keys['arrowup'])&&onGround){
        pvy=JUMP_VEL; onGround=false;
      }
    }

    // Move X
    const prevVy=pvy;
    px+=pvx*dt;
    resolveX();

    // Move Y
    py+=pvy*dt;
    const wasOnGround=onGround;
    onGround=false;
    resolveY(prevVy);

    // Fall damage
    if(onGround&&!wasOnGround&&prevVy>12){
      hp=Math.max(0,hp-Math.floor((prevVy-12)*1.5));
    }

    // World bounds
    px=Math.max(0,Math.min(WW-PW,px));
    if(py<0){py=0;pvy=0;}
    if(py+PH>WH){py=WH-PH;pvy=0;onGround=true;}
  }

  function resolveX(){
    const top=py, bottom=py+PH-0.01;
    if(pvx>0){
      const rx=px+PW-0.001;
      const bx=Math.floor(rx);
      for(let by=Math.floor(top);by<=Math.floor(bottom);by++){
        if(solid(getB(bx,by))){ px=bx-PW; pvx=0; break; }
      }
    } else if(pvx<0){
      const lx=px;
      const bx=Math.floor(lx);
      for(let by=Math.floor(top);by<=Math.floor(bottom);by++){
        if(solid(getB(bx,by))){ px=bx+1; pvx=0; break; }
      }
    }
  }

  function resolveY(prevVy){
    const left=px, right=px+PW-0.01;
    if(prevVy>=0){
      const by=Math.floor(py+PH-0.001);
      for(let bx=Math.floor(left);bx<=Math.floor(right);bx++){
        if(solid(getB(bx,by))){ py=by-PH; pvy=0; onGround=true; break; }
      }
    } else {
      const by=Math.floor(py);
      for(let bx=Math.floor(left);bx<=Math.floor(right);bx++){
        if(solid(getB(bx,by))){ py=by+1; pvy=0; break; }
      }
    }
  }

  // =============== BLOCK INTERACTION ===============
  function targetBlock(){
    const wx=camX+mx/TILE, wy=camY+my/TILE;
    const bx=Math.floor(wx), by=Math.floor(wy);
    const pcx=px+PW/2, pcy=py+PH/2;
    const d=Math.hypot(bx+0.5-pcx,by+0.5-pcy);
    if(d>REACH||bx<0||bx>=WW||by<0||by>=WH) return null;
    return {bx,by};
  }

  function addInv(id,n){
    for(const s of hotbar){ if(s&&s.id===id&&s.ct<99){ s.ct=Math.min(99,s.ct+n); return; } }
    for(let i=0;i<9;i++){ if(!hotbar[i]){ hotbar[i]={id,ct:n}; return; } }
  }

  function tickBreak(){
    if(!lmb){ brkX=-1;brkY=-1;brkTick=0; return; }
    const t=targetBlock();
    if(!t){ brkX=-1;brkY=-1;brkTick=0; return; }
    const {bx,by}=t;
    const id=getB(bx,by);
    if(id===B.AIR){ brkX=-1;brkY=-1;brkTick=0; return; }
    if(brkX!==bx||brkY!==by){ brkX=bx;brkY=by;brkTick=0; }
    brkTick++;
    const hard=bHard(id);
    if(!isFinite(hard)) return;
    if(brkTick>=hard){
      const drop=bDrop(id);
      if(drop!==B.AIR) addInv(drop,1);
      setB(bx,by,B.AIR);
      brkX=-1;brkY=-1;brkTick=0;
    }
  }

  function doPlace(){
    const now=performance.now();
    if(now-lastRmb<200) return;
    const t=targetBlock(); if(!t) return;
    const {bx,by}=t;
    const existing=getB(bx,by);
    if(existing!==B.AIR&&existing!==B.WATER) return;
    const item=hotbar[slot];
    if(!item||item.ct<=0) return;
    // Don't place inside player
    if(bx>=Math.floor(px)&&bx<=Math.floor(px+PW)&&by>=Math.floor(py)&&by<=Math.floor(py+PH)) return;
    setB(bx,by,item.id);
    item.ct--;
    if(item.ct<=0) hotbar[slot]=null;
    lastRmb=now;
  }

  // =============== SKY / LIGHTING ===============
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpHex(a,b,t){
    const p=n=>parseInt(n,16);
    const r=Math.round(lerp(p(a.slice(1,3)),p(b.slice(1,3)),t));
    const g=Math.round(lerp(p(a.slice(3,5)),p(b.slice(3,5)),t));
    const bl=Math.round(lerp(p(a.slice(5,7)),p(b.slice(5,7)),t));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
  }
  function skyColor(){
    const t=dayT;
    if(t<0.2||t>0.85) return '#080818';
    if(t<0.28) return lerpHex('#080818','#FF6633',(t-0.2)/0.08);
    if(t<0.36) return lerpHex('#FF6633','#87CEEB',(t-0.28)/0.08);
    if(t<0.64) return '#87CEEB';
    if(t<0.72) return lerpHex('#87CEEB','#FF6633',(t-0.64)/0.08);
    if(t<0.80) return lerpHex('#FF6633','#080818',(t-0.72)/0.08);
    return '#080818';
  }
  function lightLevel(){
    const t=dayT;
    if(t<0.22||t>0.83) return 0.25;
    if(t<0.35) return 0.25+0.75*(t-0.22)/0.13;
    if(t<0.65) return 1.0;
    if(t<0.78) return 0.25+0.75*(0.83-t)/0.13;
    return 0.25;
  }

  // =============== RENDERING ===============
  function drawBlock(bx,by){
    const id=getB(bx,by);
    if(id===B.AIR) return;
    const bc=bColor(id); if(!bc) return;

    const sx=Math.round((bx-camX)*TILE);
    const sy=Math.round((by-camY)*TILE);
    if(sx>cw+TILE||sy>ch+TILE||sx<-TILE||sy<-TILE) return;

    const S=TILE;

    // Water: animated transparent
    if(id===B.WATER){
      ctx.globalAlpha=0.65;
      ctx.fillStyle='#1E64DC';
      ctx.fillRect(sx,sy,S,S);
      ctx.globalAlpha=0.3;
      ctx.fillStyle='#5BA0FF';
      const wv=Math.floor(((Date.now()/500+bx*0.4)%1)*6);
      ctx.fillRect(sx,sy+wv,S,2);
      ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(0,50,150,0.4)';
      ctx.lineWidth=0.5;
      ctx.strokeRect(sx+0.5,sy+0.5,S-1,S-1);
      return;
    }

    // Leaves: slight transparency
    if(id===B.LEAVES) ctx.globalAlpha=0.88;
    if(id===B.GLASS) ctx.globalAlpha=0.5;

    ctx.fillStyle=bc;
    ctx.fillRect(sx,sy,S,S);

    // Grass top strip
    if(id===B.GRASS){
      const tc=bTop(id)||bc;
      ctx.fillStyle=tc;
      ctx.fillRect(sx,sy,S,Math.max(5,Math.floor(S*0.22)));
      // Blade tufts
      ctx.fillStyle='#3E7A0A';
      ctx.fillRect(sx+3,sy,2,4);
      ctx.fillRect(sx+S-6,sy,2,4);
      ctx.fillRect(sx+Math.floor(S/2)-1,sy,2,3);
    }

    // Log top ring
    if(id===B.LOG){
      const tc=bTop(id);
      if(tc){
        ctx.fillStyle=tc;
        const r=Math.floor(S*0.25);
        ctx.fillRect(sx+r,sy+r,S-r*2,S-r*2);
      }
    }

    // Ore veins (deterministic pixel pattern)
    if(bVein(id)){
      ctx.fillStyle=bVein(id);
      const pos=[[4,4],[20,6],[6,20],[24,18],[13,12],[17,24],[7,28],[25,5]];
      for(const[ox,oy] of pos){
        if(ox+5<=S&&oy+5<=S) ctx.fillRect(sx+ox,sy+oy,4,4);
      }
    }

    // Procedural texture noise
    const ns=bx*1237+by*561;
    ctx.fillStyle='rgba(0,0,0,0.11)';
    for(let i=0;i<5;i++){
      const nx=Math.abs((ns*(i+1)*131)%(S-4));
      const ny=Math.abs((ns*(i+3)*307)%(S-4));
      ctx.fillRect(sx+nx,sy+ny,3,3);
    }
    ctx.fillStyle='rgba(255,255,255,0.07)';
    for(let i=0;i<3;i++){
      const nx=Math.abs((ns*(i+7)*89)%(S-4));
      const ny=Math.abs((ns*(i+9)*53)%(S-4));
      ctx.fillRect(sx+nx,sy+ny,2,2);
    }

    // Block edge border
    ctx.strokeStyle='rgba(0,0,0,0.22)';
    ctx.lineWidth=0.5;
    ctx.strokeRect(sx+0.5,sy+0.5,S-1,S-1);

    ctx.globalAlpha=1;
  }

  function drawBreaking(){
    if(brkX<0) return;
    const id=getB(brkX,brkY);
    const hard=bHard(id);
    if(!isFinite(hard)||hard===0) return;
    const progress=brkTick/hard;
    const stage=Math.floor(progress*5);
    const sx=Math.round((brkX-camX)*TILE);
    const sy=Math.round((brkY-camY)*TILE);
    const S=TILE;

    ctx.fillStyle=`rgba(0,0,0,${0.1+progress*0.35})`;
    ctx.fillRect(sx,sy,S,S);

    ctx.strokeStyle=`rgba(0,0,0,${0.4+progress*0.4})`;
    ctx.lineWidth=1.5;
    const lines=[
      [[0.3,0.1],[0.6,0.9]],[[0.1,0.5],[0.9,0.4]],
      [[0.5,0.2],[0.2,0.8]],[[0.7,0.1],[0.3,0.7]],
      [[0.1,0.3],[0.8,0.6]],
    ];
    for(let i=0;i<stage;i++){
      const [[x1,y1],[x2,y2]]=lines[i];
      ctx.beginPath();
      ctx.moveTo(sx+x1*S,sy+y1*S);
      ctx.lineTo(sx+x2*S,sy+y2*S);
      ctx.stroke();
    }
  }

  function drawPlayer(){
    const sx=(px-camX)*TILE;
    const sy=(py-camY)*TILE;
    const pw=PW*TILE, ph=PH*TILE;

    // Legs
    ctx.fillStyle='#2B4C8A';
    ctx.fillRect(sx+pw*0.1,sy+ph*0.78,pw*0.37,ph*0.22);
    ctx.fillRect(sx+pw*0.53,sy+ph*0.78,pw*0.37,ph*0.22);

    // Body
    ctx.fillStyle='#4478CC';
    ctx.fillRect(sx+pw*0.1,sy+ph*0.4,pw*0.8,ph*0.4);

    // Head
    ctx.fillStyle='#E8C090';
    ctx.fillRect(sx+pw*0.1,sy,pw*0.8,ph*0.38);
    // Hair
    ctx.fillStyle='#5A3A18';
    ctx.fillRect(sx+pw*0.1,sy,pw*0.8,ph*0.10);

    // Eyes
    ctx.fillStyle='#1A1A1A';
    ctx.fillRect(sx+pw*0.25,sy+ph*0.15,pw*0.15,ph*0.09);
    ctx.fillRect(sx+pw*0.6, sy+ph*0.15,pw*0.15,ph*0.09);

    // Arms
    ctx.fillStyle='#4478CC';
    ctx.fillRect(sx-pw*0.12,sy+ph*0.4,pw*0.18,ph*0.36);
    ctx.fillRect(sx+pw*0.94,sy+ph*0.4,pw*0.18,ph*0.36);

    // Held item in right hand
    const item=hotbar[slot];
    if(item&&item.id!==B.AIR){
      const bc=bColor(item.id);
      if(bc){
        const iS=14;
        ctx.fillStyle=bc;
        ctx.fillRect(sx+pw*0.94+4,sy+ph*0.54,iS,iS);
        const top=bTop(item.id);
        if(top){ ctx.fillStyle=top; ctx.fillRect(sx+pw*0.94+4,sy+ph*0.54,iS,4); }
        ctx.strokeStyle='rgba(0,0,0,0.3)';
        ctx.lineWidth=0.5;
        ctx.strokeRect(sx+pw*0.94+4.5,sy+ph*0.54+0.5,iS-1,iS-1);
      }
    }
  }

  function drawHUD(){
    const SLOT_S=44, N=9;
    const hbW=N*SLOT_S+4;
    const hbX=Math.floor((cw-hbW)/2);
    const hbY=ch-SLOT_S-8;

    // Hotbar bg
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(hbX-2,hbY-2,hbW+4,SLOT_S+4);

    for(let i=0;i<N;i++){
      const sx=hbX+i*SLOT_S, sy=hbY;
      const sel=i===slot;
      ctx.fillStyle=sel?'#FFEE00':'#888';
      ctx.fillRect(sx,sy,SLOT_S-2,SLOT_S-2);
      ctx.fillStyle=sel?'#B8A800':'#555';
      ctx.fillRect(sx+2,sy+2,SLOT_S-6,SLOT_S-6);

      const item=hotbar[i];
      if(item&&item.ct>0){
        const bc=bColor(item.id);
        if(bc){
          if(item.id===B.WATER||item.id===B.GLASS) ctx.globalAlpha=0.6;
          ctx.fillStyle=bc;
          ctx.fillRect(sx+5,sy+5,SLOT_S-10,SLOT_S-10);
          ctx.globalAlpha=1;
          const top=bTop(item.id);
          if(top){ ctx.fillStyle=top; ctx.fillRect(sx+5,sy+5,SLOT_S-10,5); }
          const vn=bVein(item.id);
          if(vn){
            ctx.fillStyle=vn;
            ctx.fillRect(sx+9,sy+9,5,5);
            ctx.fillRect(sx+18,sy+14,5,5);
            ctx.fillRect(sx+24,sy+9,5,5);
          }
          ctx.strokeStyle='rgba(0,0,0,0.35)';
          ctx.lineWidth=0.5;
          ctx.strokeRect(sx+5.5,sy+5.5,SLOT_S-11,SLOT_S-11);
        }
        ctx.fillStyle='white';
        ctx.font='bold 9px monospace';
        ctx.textAlign='right';
        ctx.fillText(item.ct,sx+SLOT_S-4,sy+SLOT_S-4);
      }
      // Slot number
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.font='8px monospace';
      ctx.textAlign='left';
      ctx.fillText(i+1,sx+3,sy+10);
    }

    // Health bar
    ctx.font='14px serif';
    ctx.textAlign='left';
    for(let i=0;i<maxHp/2;i++){
      const hx=hbX+i*16;
      const hy=hbY-20;
      ctx.globalAlpha=0.85;
      ctx.fillText(i<hp/2?'❤':'♡',hx,hy);
    }
    ctx.globalAlpha=1;

    // Block name tooltip on hover
    const t=targetBlock();
    if(t){
      const id=getB(t.bx,t.by);
      if(id!==B.AIR){
        const nm=bName(id);
        ctx.font='11px "Pixelated MS Sans Serif",monospace';
        const tw=ctx.measureText(nm).width;
        ctx.fillStyle='rgba(0,0,0,0.65)';
        ctx.fillRect(mx-tw/2-6,my-28,tw+12,18);
        ctx.fillStyle='#FFFF55';
        ctx.textAlign='center';
        ctx.fillText(nm,mx,my-15);
      }
    }

    // Selected item name
    const cur=hotbar[slot];
    if(cur&&cur.ct>0){
      const nm=bName(cur.id);
      ctx.font='12px "Pixelated MS Sans Serif",monospace';
      const tw=ctx.measureText(nm).width;
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(cw/2-tw/2-6,hbY-24,tw+12,18);
      ctx.fillStyle='#FFFF55';
      ctx.textAlign='center';
      ctx.fillText(nm,cw/2,hbY-10);
    }

    ctx.textAlign='left';
  }

  function drawSky(){
    // Sky gradient
    const sky=skyColor();
    ctx.fillStyle=sky;
    ctx.fillRect(0,0,cw,ch);

    const t=dayT;
    // Sun
    if(t>0.28&&t<0.78){
      const sunProg=(t-0.28)/0.5;
      const sx=cw*(0.1+sunProg*0.8);
      const sy=ch*0.55-Math.sin(sunProg*Math.PI)*ch*0.5;
      ctx.fillStyle='#FFD700';
      ctx.beginPath(); ctx.arc(sx,sy,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFE84D';
      ctx.beginPath(); ctx.arc(sx,sy,12,0,Math.PI*2); ctx.fill();
      // Rays
      ctx.strokeStyle='rgba(255,220,0,0.3)';
      ctx.lineWidth=2;
      for(let a=0;a<8;a++){
        const ang=a*(Math.PI/4);
        ctx.beginPath();
        ctx.moveTo(sx+Math.cos(ang)*20,sy+Math.sin(ang)*20);
        ctx.lineTo(sx+Math.cos(ang)*30,sy+Math.sin(ang)*30);
        ctx.stroke();
      }
    }

    // Moon (night)
    if(t<0.25||t>0.82){
      const mp=t>0.5?(t-0.82)/0.18+1:(t)/0.25;
      const moonX=cw*(0.15+mp*0.7);
      const moonY=ch*0.4-Math.sin(mp*Math.PI)*ch*0.3;
      ctx.fillStyle='#E0E8FF';
      ctx.beginPath(); ctx.arc(moonX,moonY,13,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#B8C8EE';
      ctx.beginPath(); ctx.arc(moonX+4,moonY-3,9,0,Math.PI*2); ctx.fill();

      // Stars
      if(t<0.22||t>0.84){
        ctx.fillStyle='rgba(255,255,255,0.85)';
        for(let i=0;i<100;i++){
          const sx=((i*1234+567)%cw)|0;
          const sy=((i*911+233)%(ch*0.55))|0;
          const ss=(i%3===0)?2:1;
          ctx.fillRect(sx,sy,ss,ss);
        }
      }
    }
  }

  function render(){
    if(!ctx) return;
    ctx.imageSmoothingEnabled=false;

    drawSky();

    // Visible block range
    const x0=Math.max(0,Math.floor(camX)-1);
    const x1=Math.min(WW-1,Math.ceil(camX+cw/TILE)+1);
    const y0=Math.max(0,Math.floor(camY)-1);
    const y1=Math.min(WH-1,Math.ceil(camY+ch/TILE)+1);

    for(let by=y0;by<=y1;by++){
      for(let bx=x0;bx<=x1;bx++){
        drawBlock(bx,by);
      }
    }

    drawBreaking();

    // Target block outline
    const t=targetBlock();
    if(t){
      const id=getB(t.bx,t.by);
      if(id!==B.AIR){
        const sx=Math.round((t.bx-camX)*TILE);
        const sy=Math.round((t.by-camY)*TILE);
        ctx.strokeStyle='rgba(0,0,0,0.8)';
        ctx.lineWidth=2;
        ctx.strokeRect(sx+1,sy+1,TILE-2,TILE-2);
      }
    }

    // Night darkening overlay
    const ll=lightLevel();
    if(ll<1){
      ctx.fillStyle=`rgba(0,0,15,${(1-ll)*0.72})`;
      ctx.fillRect(0,0,cw,ch);
    }

    drawPlayer();
    drawHUD();

    // Focus hint if not focused
    if(!mcFocused){
      ctx.fillStyle='rgba(0,0,0,0.55)';
      ctx.fillRect(0,0,cw,ch);
      ctx.fillStyle='white';
      ctx.font='bold 18px "Pixelated MS Sans Serif",monospace';
      ctx.textAlign='center';
      ctx.fillText('Click to Play',cw/2,ch/2-10);
      ctx.font='12px monospace';
      ctx.fillStyle='#aaa';
      ctx.fillText('WASD: Move  Space: Jump  LClick: Break  RClick: Place',cw/2,ch/2+14);
      ctx.textAlign='left';
    }
  }

  // =============== GAME LOOP ===============
  let mcFocused=false;

  function frame(now){
    raf=requestAnimationFrame(frame);
    const dt=Math.min((now-lastRaf)/1000, 0.05);
    lastRaf=now;

    // Check window visible
    const win=document.getElementById('minecraft');
    if(!win||!win.classList.contains('show')||win.style.display==='none'){
      render(); return;
    }

    dayT=(dayT+dt/DAY_MS*1000)%1;

    if(mcFocused){
      tickBreak();
      if(rmb) doPlace();
      // Sub-steps for stability
      const steps=3;
      for(let s=0;s<steps;s++) physStep(dt/steps);
    }

    // Camera: center on player
    camX=px+PW/2-cw/TILE/2;
    camY=py+PH/2-ch/TILE/2;
    camX=Math.max(0,Math.min(WW-cw/TILE,camX));
    camY=Math.max(0,Math.min(WH-ch/TILE,camY));

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
    }
    resize();
    new ResizeObserver(resize).observe(canvas);

    generateWorld();

    // Spawn player on surface center
    const midX=Math.floor(WW/2);
    for(let y=0;y<WH;y++){
      if(solid(getB(midX,y))){
        px=midX-PW/2; py=y-PH-0.01; break;
      }
    }
    pvx=0; pvy=0; onGround=false;

    // Input
    canvas.addEventListener('mousedown',e=>{
      canvas.focus(); mcFocused=true;
      if(e.button===0) lmb=true;
      if(e.button===2){ rmb=true; doPlace(); }
      e.preventDefault();
    });
    canvas.addEventListener('mouseup',e=>{
      if(e.button===0) lmb=false;
      if(e.button===2) rmb=false;
    });
    canvas.addEventListener('mousemove',e=>{
      const r=canvas.getBoundingClientRect();
      mx=e.clientX-r.left; my=e.clientY-r.top;
    });
    canvas.addEventListener('mouseleave',()=>{ lmb=false; rmb=false; });
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{
      slot=((slot+(e.deltaY>0?1:-1))+9)%9;
      e.preventDefault();
    },{passive:false});
    canvas.addEventListener('keydown',e=>{
      keys[e.key.toLowerCase()]=true;
      if(e.key>='1'&&e.key<='9') slot=parseInt(e.key)-1;
      e.preventDefault(); e.stopPropagation();
    });
    canvas.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
    canvas.addEventListener('focus',()=>{ mcFocused=true; });
    canvas.addEventListener('blur',()=>{
      mcFocused=false;
      Object.keys(keys).forEach(k=>{ keys[k]=false; });
      lmb=false; rmb=false;
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


