'use strict';
const {
  app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, dialog, clipboard,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { streamChat, forget } = require('./sse-client');

const SPRITE_W = 320;
const SPRITE_H = 240;
const INPUT_H = 44;
const SPRITE_DIR = path.join(__dirname, 'renderer', 'sprites');

let win = null;
let tray = null;
let cfg = null;
let inflight = null;   // AbortController of the current /chat request
let drag = null;       // { timer, dx, dy }

function loadConfig() {
  const file = path.join(__dirname, 'config.json');
  if (!fs.existsSync(file)) {
    dialog.showErrorBox('Klothulhu', `Missing ${file}. Copy config.example.json and fill it in.`);
    app.exit(1);
  }
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  return {
    apiUrl: String(c.apiUrl || '').replace(/\/+$/, ''),
    token: String(c.token || ''),
    scale: Number(c.scale) > 0 ? Number(c.scale) : 1.5,
    hotkey: c.hotkey || 'Control+Alt+K',
  };
}

function readSprites() {
  // Sent as data URLs so the renderer canvas is never tainted and can be
  // used for per-pixel hit testing. Drop new PNGs (e.g. Ojos7.png) here.
  const out = {};
  for (const f of fs.readdirSync(SPRITE_DIR)) {
    if (!f.toLowerCase().endsWith('.png')) continue;
    const b64 = fs.readFileSync(path.join(SPRITE_DIR, f)).toString('base64');
    out[path.basename(f, '.png')] = `data:image/png;base64,${b64}`;
  }
  return out;
}

function createWindow() {
  const width = Math.round(SPRITE_W * cfg.scale);
  const height = Math.round(SPRITE_H * cfg.scale) + INPUT_H;
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
  // pointer is over an opaque pixel or the input box.
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createTray() {
  const body = nativeImage.createFromPath(path.join(SPRITE_DIR, 'Cuerpo.png'));
  const icon = body.crop({ x: 82, y: 26, width: 160, height: 110 }).resize({ width: 24 });
  tray = new Tray(icon);
  tray.setToolTip('Klothulhu');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / hide', click: toggleVisible },
    { label: 'Talk', click: summon },
    { label: 'Forget conversation', click: () => forget(cfg).catch(() => {}) },
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

ipcMain.handle('init', () => ({ scale: cfg.scale, hotkey: cfg.hotkey, sprites: readSprites() }));

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
