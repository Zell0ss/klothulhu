// Reproductor del cliente web (D50). COPIA DELIBERADA de la lógica en línea de desktop/renderer/index.html:
// `paint`, `play`, `pump`, `enqueue`, `think` y el tratamiento de `kl-event` llevan los mismos nombres y el
// mismo cuerpo, para que un cambio allí se pueda trasladar aquí a ojo. No es un módulo compartido porque las
// normativas de las fases 1, 5 y 6 leen el texto de index.html y no se editan; extraerlo es deuda (D50).
// Lo que cambia respecto al escritorio, y solo eso: la geometría sale de la pantalla (webGeometry), el
// anfitrión es `host` (KlHost) y no `kl`, el historial y la entrada están siempre visibles, y desaparecen
// lo de ventana (tamaños, arrastrar, click-through, copiar, cerrar, debug).
//
// Va en una función para no chocar con los globales de sse-client.js (`forget`, `streamChat`…), que como
// <script> clásico quedan en el ámbito global.
(function () {
'use strict';
const { renderScene, VOCAB } = window.FablesMotor;
const { sceneFor, holdMs, secondsPerChar, BUBBLE_LINES, LINES, CAPTION_MAX } = window.KlScenes;
const { createFeed } = window.KlFeed;
const { createConvo } = window.KlConvo;
const { avatarOptions, AVATARS } = window.KlAvatar;
const { webGeometry, webBoot } = window.KlWebCore;

const STAGE_H = 128;                  // alto de la franja del motor (D12)
const LINGER_MS = 30000;              // LINGER_MS de upstream: tras la última escena, antes de dormir
const AVATAR_KEY = 'klothulhu.avatar';

const stage = document.getElementById('stage');
const sceneImg = document.getElementById('scene');
const input = document.getElementById('ask');
const sendBtn = document.getElementById('sendBtn');
const historyPanel = document.getElementById('history');
const forgetBtn = document.getElementById('forgetBtn');
const tokenBtn = document.getElementById('tokenBtn');
const avatarBtns = [...document.querySelectorAll('#avatars button')];
const gate = document.getElementById('gate');
const gateMsg = document.getElementById('gateMsg');
const tokenInput = document.getElementById('tokenInput');
const tokenCancel = document.getElementById('tokenCancel');

// localStorage puede lanzar (modo privado, permisos): sin él la web funciona, solo que no recuerda.
let storage = null;
try { storage = window.localStorage; } catch { storage = null; }

const host = window.KlHost.createHost({ storage, sse: window.KlSse });

const warnedNow = new Set();   // se vacía en cada ask()
let look = VOCAB.defaults.look;   // pixel, sin configuración
let lookWarned = false;
let avatar = 'claude';   // el que se elige en la barra y se guarda en localStorage (D49, D50)
let avatarWarned = false;
const readSpeed = 1;  // sin configuración en el móvil (D25)
let geom = null;     // { stageW, zoom, width, height } de la pantalla actual
let lastScene = null;   // la última escena pintada, para repintarla al cambiar de avatar o de geometría

// Siempre a la consola (no hay log de fichero en la web).
function note(line) {
  console.info('[klothulhu]', line);
}

// --- painting ---------------------------------------------------------------

// Devuelve { speaksAfter, typedAfter, spc } o null si no se pudo pintar (entonces se queda la escena anterior).
function paint(scene, fadeIn) {
  const spc = secondsPerChar(readSpeed, VOCAB.defaults.secondsPerChar);
  const opts = () => ({ look, fadeIn, width: geom.stageW, height: STAGE_H, bubble: { lines: BUBBLE_LINES }, secondsPerChar: spc, ...avatarOptions(avatar, VOCAB.avatars) });   // D25, D49
  let r = renderScene(scene, opts());
  if (!r.ok && look !== VOCAB.defaults.look) {
    if (!lookWarned) { console.warn(`look "${look}" no válido (${r.error}); uso "${VOCAB.defaults.look}"`); lookWarned = true; }
    look = VOCAB.defaults.look;
    r = renderScene(scene, opts());
  }
  if (!r.ok && avatar !== 'claude') {   // D49: igual que con look, una sola vez
    if (!avatarWarned) { console.warn(`avatar "${avatar}" no válido (${r.error}); uso "claude"`); avatarWarned = true; }
    avatar = 'claude';
    markAvatar();
    r = renderScene(scene, opts());
  }
  if (!r.ok) { console.warn(`renderScene falló: ${r.error}`); return null; }
  // Avisos del motor (p. ej. props-not-drawn con un look 3D): una vez por aviso y respuesta.
  for (const w of r.warnings || []) {
    if (!warnedNow.has(w)) { warnedNow.add(w); console.warn(`motor: ${w}`); }
  }
  // El SVG entra como imagen, no como DOM (D10). Asignar el mismo src reinicia la animación, así que solo se asigna si cambia.
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.svg);
  if (sceneImg.getAttribute('src') !== src) sceneImg.src = src;
  return { speaksAfter: r.speaksAfter, typedAfter: r.typedAfter, spc };
}

// --- director: cola de escenas ---------------------------------------------

// phase: 'reading' (hay un temporizador de lectura) | 'thinking' | 'lingering' | 'idle'
let phase = 'idle';
let timer = null;
let queue = [];
let lastBackdrop = null;

// Pinta un item de la cola: la escena del servidor si la hay y el motor la acepta; si no, la fija (D21.2).
// Devuelve { hold (ms que se queda en pantalla), source ('server' | 'fixed') } o false si no se pudo pintar.
function play(item) {
  const fixed = () => sceneFor(item.kind, item.caption, item.tone ? { tone: item.tone } : undefined);
  let scene = item.scene || fixed();
  let source = item.scene ? 'server' : 'fixed';
  const prev = lastBackdrop;
  let fadeIn = prev !== null && scene.backdrop !== prev;
  let shown = paint(scene, fadeIn);
  if (!shown && item.scene) {
    scene = fixed(); source = 'fixed';
    fadeIn = prev !== null && scene.backdrop !== prev;
    shown = paint(scene, fadeIn);
  }
  if (!shown) return false;
  lastBackdrop = scene.backdrop;
  lastScene = scene;
  return { hold: holdMs(shown.typedAfter, shown.spc), source };
}

function pump() {
  clearTimeout(timer); timer = null;
  while (queue.length) {
    const item = queue.shift();
    const shown = play(item);
    if (shown === false) continue;
    if (item.fromServer && firstSceneAt === null) {
      firstSceneAt = performance.now();
      note(`first-scene ms=${Math.round(firstSceneAt - t0)} director=${item.scene ? 1 : 0} painted=${shown.source}`);
    }
    phase = 'reading';
    timer = setTimeout(pump, shown.hold);
    return;
  }
  // Cola vacía y última escena leída: espera y duerme.
  phase = 'lingering';
  applyGeomIfStill();   // un giro de pantalla que llegó leyendo se aplica ahora (D50)
  timer = setTimeout(() => {
    play({ kind: 'idle', caption: LINES.idle });
    phase = 'idle'; timer = null;
  }, LINGER_MS);
}

function enqueue(items) {
  queue.push(...items);
  if (phase !== 'reading') pump();  // si se está leyendo una escena, esta espera su turno
}

function think() {
  clearTimeout(timer); timer = null;
  queue = [];
  play({ kind: 'thinking', caption: LINES.thinking });
  phase = 'thinking';
}

// --- conversation -----------------------------------------------------------

let feed = createFeed(); // qué entra en la cola para la respuesta en curso (feed.js, D21)
let t0 = 0;              // performance.now() al pulsar Enter
let firstSceneAt = null; // cuándo se pintó la primera escena del servidor (null = aún no)
let reply = '';          // la respuesta entera, sin etiquetas
let marks = [];          // [{at, emotion}]
let awaiting = false;
let gateNote = '';       // el motivo con el que se pide el token (p. ej. el 401)

function setAwaiting(on) {
  awaiting = on;
  sendBtn.disabled = on;
}

// --- historial (D27): la conversación de esta sesión, en memoria; no se guarda ---
const convo = createConvo();

function renderHistory() {
  historyPanel.replaceChildren(...convo.entries().map((e) => {
    const turn = document.createElement('div');
    turn.className = 'turn';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = e.role === 'user' ? 'tú: ' : 'klothulhu: ';
    const text = document.createElement('span');
    text.textContent = e.text;   // nunca HTML (D10)
    turn.append(who, text);
    return turn;
  }));
  historyPanel.scrollTop = historyPanel.scrollHeight;
}

function ask(text) {
  convo.add('user', text); renderHistory();
  reply = ''; marks = []; setAwaiting(true);
  feed = createFeed(); warnedNow.clear(); firstSceneAt = null; t0 = performance.now();
  think();
  host.ask(text);
}

host.onEvent(({ type, data }) => {
  if (type === 'emotion') {
    const e = window.KlScenes.EMOTIONS.includes(data.emotion) ? data.emotion : 'neutral';
    marks.push({ at: marks.length ? reply.length : 0, emotion: e });
  } else if (type === 'delta') {
    reply += data.text;
  } else if (type === 'scene') {
    const item = feed.onScene(data);
    if (item) enqueue([item]);   // en cuanto llega: la primera sustituye a «pensando» (D21.1)
  } else if (type === 'done') {
    setAwaiting(false);
    note(`done ms=${Math.round(performance.now() - t0)} scenes=${feed.count}`);
    // Siempre se llama a enqueue, aunque no haya nada: con una respuesta vacía saca al cliente de «pensando».
    enqueue(feed.onDone(reply, marks));
    convo.add('klothulhu', reply); renderHistory();
  } else if (type === 'error') {
    setAwaiting(false);
    feed.onError();
    const known = Object.prototype.hasOwnProperty.call(LINES.errors, data.code);
    const [kind, text] = known
      ? LINES.errors[data.code]
      : ['confused', `Error desconocido: ${data.code}`.slice(0, CAPTION_MAX)];
    if (data.code === 'http_401') gateNote = text;   // la línea de siempre, también en el formulario (host avisa justo después)
    queue = [];  // la del error espera a que se lea la que está en pantalla
    enqueue([{ kind, caption: text, tone: 'trouble' }]);
  }
});

host.onForgotten(() => { convo.clear(); renderHistory(); });

// --- geometría (D50): la franja a todo el ancho; se recalcula al girar, con klothulhu parado ---

function applyGeom(g) {
  geom = g;
  const w = `${g.width}px`, h = `${g.height}px`;
  stage.style.width = w; stage.style.height = h;
  sceneImg.style.width = w; sceneImg.style.height = h;
}

function applyGeomIfStill() {
  if (awaiting || (phase !== 'idle' && phase !== 'lingering')) return;   // si no, cuando pare (pump)
  const g = webGeometry(window.innerWidth);
  if (geom && g.width === geom.width && g.stageW === geom.stageW) return;   // el teclado cambia el alto, no el ancho
  applyGeom(g);
  if (lastScene) paint(lastScene, false);   // sin fundido; el temporizador de la espera sigue como estaba
}

window.addEventListener('resize', applyGeomIfStill);
window.addEventListener('orientationchange', applyGeomIfStill);

// --- avatar (D49): vale desde la escena siguiente; con klothulhu parado, se repinta la que hay ---

function markAvatar() {
  for (const b of avatarBtns) b.setAttribute('aria-pressed', String(b.dataset.avatar === avatar));
}

function setAvatar(name) {
  if (!AVATARS.includes(name)) return;
  avatar = name;
  avatarWarned = false;
  try { storage.setItem(AVATAR_KEY, name); } catch { /* sin storage no se recuerda */ }
  markAvatar();
  if (!awaiting && (phase === 'idle' || phase === 'lingering') && lastScene) paint(lastScene, false);
}

for (const b of avatarBtns) b.addEventListener('click', () => setAvatar(b.dataset.avatar));

// --- token: se pide una vez y se guarda en el móvil ---

function showGate(msg) {
  gateMsg.textContent = msg || 'Pega el token de klothulhu. Se guarda en este móvil.';
  tokenInput.value = '';
  tokenCancel.hidden = !host.hasToken();   // sin token no hay a dónde volver
  gate.hidden = false;
  tokenInput.focus();
}

function hideGate() {
  gate.hidden = true;
  tokenInput.value = '';
  gateNote = '';
}

function saveToken() {
  if (host.setToken(tokenInput.value)) { hideGate(); input.focus(); return; }
  gateMsg.textContent = 'Ese token no vale: mínimo 16 caracteres y sin espacios.';
}

host.onNeedToken(() => showGate(gateNote));
// Es un <form> (el teclado del móvil muestra «Ir» y el navegador no se queja del campo de contraseña),
// pero nunca se envía: el token solo va por la cabecera Authorization, nunca en una URL (D50).
document.getElementById('gateBox').addEventListener('submit', (e) => { e.preventDefault(); saveToken(); });
tokenCancel.addEventListener('click', hideGate);
tokenBtn.addEventListener('click', () => showGate(''));

// --- barra y entrada ---

forgetBtn.addEventListener('click', () => {
  // Es la misma conversación que la de Konnos (D50): borrar aquí la borra allí.
  if (window.confirm('¿Olvidar toda la conversación? También se borra en Konnos.')) host.forget();
});

function submit() {
  const text = input.value.trim();
  if (!text || awaiting) return;   // mientras se espera, un segundo envío se ignora (como el escritorio)
  if (!host.hasToken()) { showGate(''); return; }
  ask(text);
  input.value = '';
  input.blur();   // cierra el teclado: la respuesta se lee en la franja
}

input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
sendBtn.addEventListener('click', submit);

// --- boot -------------------------------------------------------------------

try { avatar = storage.getItem(AVATAR_KEY) || 'claude'; } catch { avatar = 'claude'; }
if (!AVATARS.includes(avatar)) avatar = 'claude';
markAvatar();
applyGeom(webGeometry(window.innerWidth));
renderHistory();
enqueue(webBoot(window.KlScenes));
if (!host.hasToken()) showGate('');
})();
