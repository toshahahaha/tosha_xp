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
    'music-player': '🎵 Music Player'
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
const IPOD_DURATION = 204; // 3:24 in seconds
let ipodSeconds = 0;
let ipodPlaying = false;
let ipodTimer = null;

function ipodTick() {
  if (!ipodPlaying) return;
  ipodSeconds = Math.min(ipodSeconds + 1, IPOD_DURATION);
  const pct = (ipodSeconds / IPOD_DURATION) * 100;
  const fill = document.getElementById('ipod-fill');
  const elapsed = document.getElementById('ipod-elapsed');
  if (fill) fill.style.width = pct + '%';
  if (elapsed) elapsed.textContent = formatIpodTime(ipodSeconds);
  if (ipodSeconds >= IPOD_DURATION) {
    ipodSeconds = 0;
  }
}

function formatIpodTime(s) {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

function ipodPlayPause() {
  ipodPlaying = !ipodPlaying;
  const wheel = document.getElementById('ipod-wheel');
  if (ipodPlaying) {
    if (!ipodTimer) ipodTimer = setInterval(ipodTick, 1000);
    if (wheel) wheel.classList.add('ipod-spinning');
  } else {
    if (wheel) wheel.classList.remove('ipod-spinning');
  }
}

function ipodSkip() {
  ipodSeconds = 0;
  const fill = document.getElementById('ipod-fill');
  const elapsed = document.getElementById('ipod-elapsed');
  if (fill) fill.style.width = '0%';
  if (elapsed) elapsed.textContent = '0:00';
  if (ipodPlaying) {
    const wheel = document.getElementById('ipod-wheel');
    if (wheel) { wheel.classList.remove('ipod-spinning'); void wheel.offsetWidth; wheel.classList.add('ipod-spinning'); }
  }
}

function ipodRewind() {
  ipodSeconds = 0;
  const fill = document.getElementById('ipod-fill');
  const elapsed = document.getElementById('ipod-elapsed');
  if (fill) fill.style.width = '0%';
  if (elapsed) elapsed.textContent = '0:00';
}

// ===================== PAINT (mini) =====================
(function () {
  const PAINT_ID = "paint";

  const state = {
    tool: "pencil",
    drawing: false,
    primary: "#000000",
    secondary: "#ffffff",
    size: 3,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    snapshot: null,       // ImageData for shape preview
    undo: [],
    redo: [],
    maxHistory: 30,
  };

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function isPaintOpen() {
    const w = document.getElementById(PAINT_ID);
    return w && w.classList.contains("show");
  }

  function canvasPos(canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (canvas.width / r.width);
    const y = (clientY - r.top) * (canvas.height / r.height);
    return { x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) };
  }

  function pushUndo(ctx, canvas) {
    try {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      state.undo.push(img);
      if (state.undo.length > state.maxHistory) state.undo.shift();
      state.redo.length = 0;
      updateUndoRedoButtons();
    } catch {
      // ignore (tainted canvas could happen only if loading cross-origin images)
    }
  }

  function applyImageData(ctx, img) {
    if (!img) return;
    ctx.putImageData(img, 0, 0);
  }

  function updateUndoRedoButtons() {
    const undoBtn = document.getElementById("paintUndo");
    const redoBtn = document.getElementById("paintRedo");
    if (undoBtn) undoBtn.disabled = state.undo.length === 0;
    if (redoBtn) redoBtn.disabled = state.redo.length === 0;
  }

  function floodFill(ctx, canvas, x, y, fillHex) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;

    const idx0 = ((y | 0) * w + (x | 0)) * 4;
    const target = [data[idx0], data[idx0 + 1], data[idx0 + 2], data[idx0 + 3]];
    const fill = hexToRgba(fillHex);

    // If same color, bail
    if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2] && target[3] === fill[3]) return;

    const stack = [[x | 0, y | 0]];
    const seen = new Uint8Array(w * canvas.height);

    function match(i) {
      return data[i] === target[0] && data[i + 1] === target[1] && data[i + 2] === target[2] && data[i + 3] === target[3];
    }

    while (stack.length) {
      const [sx, sy] = stack.pop();
      if (sx < 0 || sy < 0 || sx >= w || sy >= canvas.height) continue;
      const p = sy * w + sx;
      if (seen[p]) continue;
      seen[p] = 1;

      const i = p * 4;
      if (!match(i)) continue;

      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];

      stack.push([sx + 1, sy]);
      stack.push([sx - 1, sy]);
      stack.push([sx, sy + 1]);
      stack.push([sx, sy - 1]);
    }

    ctx.putImageData(img, 0, 0);
  }

  function hexToRgba(hex) {
    const h = hex.replace("#", "").trim();
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }

  function setStatus(text) {
    const el = document.getElementById("paintStatusLeft");
    if (el) el.textContent = text;
  }

  function ensureInit() {
    const win = document.getElementById(PAINT_ID);
    if (!win || win.dataset.paintInit === "1") return;

    const canvas = document.getElementById("paintCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Start with white background like Paint
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Palette
    const palette = [
      "#000000","#7f7f7f","#880015","#ed1c24","#ff7f27","#fff200","#22b14c",
      "#00a2e8","#3f48cc","#a349a4","#ffffff","#c3c3c3","#b97a57","#ffaec9",
      "#ffc90e","#efe4b0","#b5e61d","#99d9ea","#7092be","#c8bfe7","#fefefe",
      "#e5e5e5","#9c5a3c","#ff9dbb","#ffd37a","#fff7c7","#d7f7a3","#cdefff",
      "#9fb7d9","#e3d7ff"
    ];
    const palEl = document.getElementById("paintPalette");
    palEl.innerHTML = "";
    for (const c of palette) {
      const d = document.createElement("div");
      d.className = "color";
      d.style.background = c;
      d.title = c;
      d.addEventListener("click", (e) => {
        // left click primary, right click secondary
        if (e.button === 2) state.secondary = c;
        else state.primary = c;
        updateSwatches();
      });
      d.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        state.secondary = c;
        updateSwatches();
      });
      palEl.appendChild(d);
    }

    function updateSwatches() {
      const p = document.getElementById("paintPrimary");
      const s = document.getElementById("paintSecondary");
      if (p) p.style.background = state.primary;
      if (s) s.style.background = state.secondary;
    }
    updateSwatches();

    // Tools
    const toolBtns = $all(".paint-tools .tool", win);
    toolBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        toolBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.tool = btn.dataset.tool;
        setStatus(`Tool: ${state.tool}`);
      });
    });

    // Size
    const size = document.getElementById("paintSize");
    size.addEventListener("input", () => {
      state.size = Number(size.value);
      setStatus(`Size: ${state.size}px`);
    });

    // Undo/Redo
    document.getElementById("paintUndo").addEventListener("click", () => {
      if (!state.undo.length) return;
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      state.redo.push(current);
      const prev = state.undo.pop();
      applyImageData(ctx, prev);
      updateUndoRedoButtons();
      setStatus("Undo");
    });

    document.getElementById("paintRedo").addEventListener("click", () => {
      if (!state.redo.length) return;
      const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      state.undo.push(current);
      const next = state.redo.pop();
      applyImageData(ctx, next);
      updateUndoRedoButtons();
      setStatus("Redo");
    });

    // Menu
    const menu = document.getElementById("paintMenu");
    const fileBtn = win.querySelector('.paint-menu-btn[data-menu="file"]');
    fileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
    });
    window.addEventListener("click", () => menu.classList.remove("show"));
    menu.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      menu.classList.remove("show");
      if (action === "new") {
        pushUndo(ctx, canvas);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setStatus("New");
      } else if (action === "open") {
        document.getElementById("paintFile").click();
      } else if (action === "save") {
        saveAsPng(canvas);
      } else if (action === "clear") {
        pushUndo(ctx, canvas);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setStatus("Cleared");
      } else if (action === "exit") {
        closeWindow(PAINT_ID);
      }
    });

    // Open image
    const fileInput = document.getElementById("paintFile");
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        pushUndo(ctx, canvas);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // fit into canvas keeping aspect
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const ox = (canvas.width - w) >> 1;
        const oy = (canvas.height - h) >> 1;
        ctx.drawImage(img, ox, oy, w, h);
        URL.revokeObjectURL(url);
        setStatus("Opened image");
      };
      img.src = url;
      fileInput.value = "";
    });

    // Drawing helpers
    function setStrokeStyle(isEraser) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = state.size;
      ctx.strokeStyle = isEraser ? "#ffffff" : state.primary;
      ctx.fillStyle = state.primary;
    }

    function beginShapeSnapshot() {
      try { state.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); }
      catch { state.snapshot = null; }
    }

    function restoreShapeSnapshot() {
      if (state.snapshot) ctx.putImageData(state.snapshot, 0, 0);
    }

    function drawLine(x1, y1, x2, y2) {
      setStrokeStyle(false);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function drawRect(x1, y1, x2, y2) {
      setStrokeStyle(false);
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      ctx.strokeRect(x, y, w, h);
    }

    function drawEllipse(x1, y1, x2, y2) {
      setStrokeStyle(false);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mouse events (attach to canvas)
    canvas.addEventListener("mousedown", (e) => {
      if (!isPaintOpen()) return;
      const { x, y } = canvasPos(canvas, e.clientX, e.clientY);
      state.drawing = true;
      state.startX = state.lastX = x;
      state.startY = state.lastY = y;

      // Right click swaps to secondary for drawing tools (like paint)
      const useSecondary = e.button === 2;
      if (useSecondary) {
        [state.primary, state.secondary] = [state.secondary, state.primary];
        // swap back after stroke ends (we’ll swap back on mouseup)
      }

      // commit current state to undo when starting an operation that changes pixels
      pushUndo(ctx, canvas);

      if (state.tool === "fill") {
        floodFill(ctx, canvas, x | 0, y | 0, state.primary);
        state.drawing = false;
        setStatus("Filled");
        if (useSecondary) [state.primary, state.secondary] = [state.secondary, state.primary];
        return;
      }

      if (["line", "rect", "ellipse"].includes(state.tool)) {
        beginShapeSnapshot();
      }

      if (state.tool === "pencil") {
        setStrokeStyle(false);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.01, y + 0.01);
        ctx.stroke();
      }

      if (state.tool === "brush") {
        setStrokeStyle(false);
        ctx.lineWidth = Math.max(2, state.size * 1.6);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }

      if (state.tool === "eraser") {
        setStrokeStyle(true);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }

      setStatus(`Drawing: ${state.tool}`);
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!state.drawing || !isPaintOpen()) return;
      const { x, y } = canvasPos(canvas, e.clientX, e.clientY);

      if (state.tool === "pencil") {
        setStrokeStyle(false);
        ctx.lineWidth = Math.max(1, state.size);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (state.tool === "brush") {
        setStrokeStyle(false);
        ctx.lineWidth = Math.max(2, state.size * 1.6);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (state.tool === "eraser") {
        setStrokeStyle(true);
        ctx.lineWidth = Math.max(6, state.size * 2.2);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (state.tool === "line") {
        restoreShapeSnapshot();
        drawLine(state.startX, state.startY, x, y);
      } else if (state.tool === "rect") {
        restoreShapeSnapshot();
        drawRect(state.startX, state.startY, x, y);
      } else if (state.tool === "ellipse") {
        restoreShapeSnapshot();
        drawEllipse(state.startX, state.startY, x, y);
      }

      state.lastX = x;
      state.lastY = y;
    });

    function endStroke(e) {
      if (!state.drawing) return;
      state.drawing = false;

      // Finish shape tools cleanly
      if (["line","rect","ellipse"].includes(state.tool)) {
        state.snapshot = null;
      }

      // If right-click was used, swap back
      if (e && e.button === 2) {
        [state.primary, state.secondary] = [state.secondary, state.primary];
        updateSwatches();
      }

      setStatus("Ready");
      updateUndoRedoButtons();
    }

    canvas.addEventListener("mouseup", endStroke);
    canvas.addEventListener("mouseleave", endStroke);

    // Prevent context menu on canvas (Paint uses right-click as secondary)
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // show dimensions
    const dim = document.getElementById("paintStatusRight");
    if (dim) dim.textContent = `${canvas.width} × ${canvas.height}px`;

    win.dataset.paintInit = "1";
    updateUndoRedoButtons();
  }

  function saveAsPng(canvas) {
    const a = document.createElement("a");
    a.download = "paint.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  // Hook into your existing openWindow: initialize when Paint is opened
  const originalOpenWindow = window.openWindow;
  window.openWindow = function (id) {
    const r = originalOpenWindow ? originalOpenWindow(id) : undefined;
    if (id === PAINT_ID) ensureInit();
    return r;
  };

  // Also init if already present and opened some other way
  window.addEventListener("load", () => {
    const w = document.getElementById(PAINT_ID);
    if (w) w.addEventListener("mousedown", ensureInit, { once: true });
  });
})();


