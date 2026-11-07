'use strict';
// Pruebas de regresión del anfitrión web (D50), ficheros nuevos: `fase9-h1.test.js` es normativa y no se toca.
// R1 (H1-revision.md §2): si `sse.streamChat` rechaza (p. ej. `AbortSignal.any` no existe en Safari < 17.4, o
// `res.body` es null), `ask` no puede dejar a klothulhu en «pensando» para siempre.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { createHost } = require(path.join(__dirname, '..', 'host.js'));

const TOKEN = 'abcd1234efgh5678-secreto';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

const core = require(path.join(__dirname, '..', 'webcore.js'));

function hostWith(sse) {
  const host = createHost({ storage: fakeStorage({ [core.TOKEN_KEY]: TOKEN }), sse });
  const events = [];
  let needToken = 0;
  host.onEvent((e) => events.push(e));
  host.onNeedToken(() => { needToken += 1; });
  return { host, events, needToken: () => needToken };
}

// Silencia `console.warn` mientras dura `fn` y devuelve lo que se avisó.
async function conWarn(fn) {
  const real = console.warn;
  const avisos = [];
  console.warn = (...a) => { avisos.push(a); };
  try { await fn(); } finally { console.warn = real; }
  return avisos;
}

test('R1: si streamChat lanza, ask emite un solo error unreachable y no pide token', async () => {
  const sse = { streamChat: async () => { throw new TypeError('AbortSignal.any is not a function'); } };
  const { host, events, needToken } = hostWith(sse);
  const avisos = await conWarn(() => host.ask('hola'));
  assert.deepEqual(events, [{ type: 'error', data: { code: 'unreachable' } }]);
  assert.equal(needToken(), 0);
  assert.equal(host.hasToken(), true, 'el token no se toca');
  assert.equal(avisos.length, 1, 'el fallo queda en console.warn');
});

test('R1: si streamChat lanza con la pregunta ya cortada por otra, no emite nada', async () => {
  let llamadas = 0;
  const sse = {
    streamChat: async ({ signal }) => {
      llamadas += 1;
      if (llamadas > 1) return;   // la segunda pregunta termina bien
      await new Promise((resolve) => signal.addEventListener('abort', resolve));
      throw new Error('cortada');
    },
  };
  const { host, events, needToken } = hostWith(sse);
  const avisos = await conWarn(async () => {
    const primera = host.ask('una');
    await Promise.resolve();
    await host.ask('dos');   // aborta la primera
    await primera;
  });
  assert.equal(llamadas, 2);
  assert.deepEqual(events, []);
  assert.equal(needToken(), 0);
  assert.equal(avisos.length, 0);
});
