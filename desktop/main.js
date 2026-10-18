'use strict';
const {
  app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, dialog, clipboard,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { streamChat, forget } = require('./sse-client');
const { appendLog } = require('./debug-log');
const { normalizeConfig } = require('./config');
const {
  PANEL_W, SIZE_ORDER, openBounds, closeBounds, sizeGeometry, resizeBounds, startBounds,
} = require('./layout');
const { readState, writeState } = require('./state');

const LOG_FILE = path.join(__dirname, 'klothulhu-debug.log');   // ruta fija: el renderer no elige nada

let win = null;
let tray = null;
let cfg = null;
let inflight = null;   // AbortController of the current /chat request
let panelShift = null; // null = panel de historial cerrado; si no, lo que la ventana se movió a la izquierda al abrirlo (D27)
let drag = null;       // { timer, dx, dy }
let state = null;      // { size, x, y } de estado.json (D31)
let stateFile = null;

function loadConfig() {
  const file = path.join(__dirname, 'config.json');
  if (!fs.existsSync(file)) {
    dialog.showErrorBox('Klothulhu', `Missing ${file}. Copy config.example.json and fill it in.`);
    app.exit(1);
  }
  const { cfg: normalized, warnings } = normalizeConfig(JSON.parse(fs.readFileSync(file, 'utf8')));
  for (const w of warnings) {
    console.warn(w);
    if (normalized.debug) appendLog(LOG_FILE, `warning ${w}`);
  }
  return normalized;
}

// Un fallo al guardar no rompe nada: se avisa y se sigue.
function saveState() {
  if (!win || win.isDestroyed()) return;
  const b = win.getBounds();
  state = { size: state.size, x: b.x + (panelShift ?? 0), y: b.y };   // la posición con el panel cerrado
  try {
    writeState(stateFile, state);
  } catch (err) {
    console.warn(`No se pudo guardar ${stateFile}: ${err.message}`);
    if (cfg.debug) appendLog(LOG_FILE, `warning estado.json: ${err.message}`);
  }
}

// Windows: con resizable:false, setBounds puede no cambiar el tamaño.
function setBounds(b) {
  win.setResizable(true);
  win.setBounds(b);
  win.setResizable(false);
}

function createWindow() {
  const geom = sizeGeometry(state.size, cfg.scale);
  const areas = screen.getAllDisplays().map((d) => d.workArea);
  win = new BrowserWindow({
    ...startBounds(state, geom, areas, screen.getPrimaryDisplay().workArea),
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'floating');
  // Clicks pass through to the desktop until the renderer reports the
  // pointer is over the strip or the input box.
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'klothulhu.ico'));
  tray = new Tray(icon);
  tray.setToolTip('Klothulhu');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / hide', click: toggleVisible },
    { label: 'Talk', click: summon },
    {
      label: 'Forget conversation',
      click: () => forget(cfg).catch(() => {}).finally(() => { if (win) win.webContents.send('forgotten'); }),
    },
    ...SIZE_ORDER.map((name) => ({
      label: `Size: ${name}`,
      click: () => { if (win) win.webContents.send('size-request', name); },
    })),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
  tray.on('click', toggleVisible);
}

function toggleVisible() {
  if (win.isVisible()) win.hide(); else win.showInactive();
}

function summon() {
  win.show();
  win.focus();
  win.webContents.send('summon');
}

ipcMain.handle('init', () => ({ geom: sizeGeometry(state.size, cfg.scale), sizes: SIZE_ORDER, scale: cfg.scale, hotkey: cfg.hotkey, look: cfg.look, debug: cfg.debug, readSpeed: cfg.readSpeed, panelW: PANEL_W }));

// D27: abrir y cerrar el panel de historial ensancha la ventana. Abrir dos veces o cerrar sin abrir no hace nada.
ipcMain.handle('panel', (_e, open) => {
  const add = Math.round(PANEL_W * cfg.scale);
  if (open) {
    if (panelShift !== null) return false;
    const area = screen.getDisplayMatching(win.getBounds()).workArea;
    const r = openBounds(win.getBounds(), area, add);
    setBounds(r.bounds);
    panelShift = r.shift;
    return true;
  }
  if (panelShift === null) return false;
  setBounds(closeBounds(win.getBounds(), add, panelShift));
  panelShift = null;
  return true;
});

// D31: cambia de tamaño con el panel cerrado; la esquina de abajo a la derecha se queda donde está.
ipcMain.handle('size', (_e, name) => {
  if (panelShift !== null) return null;
  const geom = sizeGeometry(name, cfg.scale);
  const area = screen.getDisplayMatching(win.getBounds()).workArea;
  setBounds(resizeBounds(win.getBounds(), area, geom.width, geom.height));
  state.size = geom.size;
  saveState();
  return geom;
});

ipcMain.on('debug', (_e, line) => { if (cfg.debug) appendLog(LOG_FILE, line); });

ipcMain.on('click-through', (_e, on) => {
  if (!drag) win.setIgnoreMouseEvents(Boolean(on), { forward: true });
});

ipcMain.on('drag-start', () => {
  if (drag) return;
  const cursor = screen.getCursorScreenPoint();
  const [wx, wy] = win.getPosition();
  drag = {
    dx: cursor.x - wx,
    dy: cursor.y - wy,
    timer: setInterval(() => {
      const p = screen.getCursorScreenPoint();
      win.setPosition(p.x - drag.dx, p.y - drag.dy);
    }, 16),
  };
});

ipcMain.on('drag-end', () => {
  if (!drag) return;
  clearInterval(drag.timer);
  drag = null;
  saveState();
});

ipcMain.handle('ask', async (_e, text) => {
  if (inflight) inflight.abort();
  const ctl = new AbortController();
  inflight = ctl;
  const send = (type, data) => {
    if (!ctl.signal.aborted && win && !win.isDestroyed()) {
      win.webContents.send('kl-event', { type, data });
    }
  };
  try {
    await streamChat({ ...cfg, text, signal: ctl.signal, onEvent: send });
  } finally {
    if (inflight === ctl) inflight = null;
  }
});

ipcMain.handle('forget', () => forget(cfg).catch(() => false));

ipcMain.handle('copy', (_e, text) => clipboard.writeText(String(text || '')));

ipcMain.on('quit', () => app.quit());

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', summon);
  app.whenReady().then(() => {
    cfg = loadConfig();
    stateFile = path.join(app.getPath('userData'), 'estado.json');
    state = readState(stateFile);
    createWindow();
    createTray();
    if (!globalShortcut.register(cfg.hotkey, summon)) {
      console.warn(`Could not register hotkey ${cfg.hotkey}`);
    }
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
