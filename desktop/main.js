'use strict';
const {
  app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, dialog, clipboard,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { streamChat, forget } = require('./sse-client');
const { appendLog } = require('./debug-log');
const { normalizeConfig } = require('./config');
const { PANEL_W, openBounds, closeBounds } = require('./layout');

// The engine draws a 640x128 strip (D12); the input box sits below it.
const STAGE_W = 640;
const STAGE_H = 128;
const INPUT_H = 44;

const LOG_FILE = path.join(__dirname, 'klothulhu-debug.log');   // ruta fija: el renderer no elige nada

let win = null;
let tray = null;
let cfg = null;
let inflight = null;   // AbortController of the current /chat request
let panelShift = null; // null = panel de historial cerrado; si no, lo que la ventana se movió a la izquierda al abrirlo (D27)
let drag = null;       // { timer, dx, dy }

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

function createWindow() {
  const width = Math.round(STAGE_W * cfg.scale);
  const height = Math.round(STAGE_H * cfg.scale) + INPUT_H;
  const { workArea } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    width, height,
    x: workArea.x + workArea.width - width - 24,
    y: workArea.y + workArea.height - height - 8,
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

ipcMain.handle('init', () => ({ scale: cfg.scale, hotkey: cfg.hotkey, look: cfg.look, debug: cfg.debug, readSpeed: cfg.readSpeed, panelW: PANEL_W }));

// D27: abrir y cerrar el panel de historial ensancha la ventana. Abrir dos veces o cerrar sin abrir no hace nada.
ipcMain.handle('panel', (_e, open) => {
  const add = Math.round(PANEL_W * cfg.scale);
  const setBounds = (b) => {
    // Windows: con resizable:false, setBounds puede no cambiar el tamaño.
    win.setResizable(true);
    win.setBounds(b);
    win.setResizable(false);
  };
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
    createWindow();
    createTray();
    if (!globalShortcut.register(cfg.hotkey, summon)) {
      console.warn(`Could not register hotkey ${cfg.hotkey}`);
    }
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
