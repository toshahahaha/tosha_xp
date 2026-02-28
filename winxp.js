// ===================== STATE =====================
let dragState = null;
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
    'contact-me': '✉️ Contact Me'
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
