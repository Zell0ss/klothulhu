'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kl', {
  init: () => ipcRenderer.invoke('init'),
  ask: (text) => ipcRenderer.invoke('ask', text),
  forget: () => ipcRenderer.invoke('forget'),
  panel: (open) => ipcRenderer.invoke('panel', Boolean(open)),
  copy: (text) => ipcRenderer.invoke('copy', text),
  debug: (line) => ipcRenderer.send('debug', String(line)),
  quit: () => ipcRenderer.send('quit'),
  clickThrough: (on) => ipcRenderer.send('click-through', on),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  onEvent: (cb) => ipcRenderer.on('kl-event', (_e, msg) => cb(msg)),
  onForgotten: (cb) => ipcRenderer.on('forgotten', () => cb()),
  onSummon: (cb) => ipcRenderer.on('summon', () => cb()),
});
