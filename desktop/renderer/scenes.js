(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlScenes = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Datos y funciones puras: sin DOM y sin motor. Se carga en el renderer y desde las pruebas de Node.
  // Fase 1 (D9): cada frase de la respuesta es una escena fija elegida por la emoción.

  // Mismo orden que EMOTIONS en server/emotion_parser.py (lo vigila la prueba P7).
  const EMOTIONS = Object.freeze(['neutral', 'happy', 'annoyed', 'confused', 'smug', 'sleepy']);

  // CAPTION_BUDGET de upstream; el motor recorta a partir de 80.
  const CAPTION_MAX = 70;

  // D24: un tramo cabe en el bocadillo de scroll del motor (VOCAB.limits.maxLongCaption). La longitud se
  // cuenta en unidades UTF-16 aquí y en caracteres en server/beats.py: iguales sin emojis, que el narrador no usa.
  const TRAMO_MAX = 500;
  const BUBBLE_LINES = 2;

  const hero = (action, from, to, then) => (then ? { action, from, to, then } : { action, from, to });

  // Puesta en escena por tipo. Josem la puede retocar; la prueba P4 vigila que el motor la pinte sin correcciones.
  const STAGING = Object.freeze({
    neutral:  { backdrop: 'night',   hero: hero('walk', 15, 40, 'inspect'),    tone: 'work' },
    happy:    { backdrop: 'forest',  hero: hero('jump', 20, 50, 'celebrate'),  particles: { kind: 'stars', density: 0.4 }, tone: 'milestone' },
    annoyed:  { backdrop: 'volcano', hero: hero('walk', 20, 45, 'shrug'),      particles: { kind: 'sparks', density: 0.4 }, tone: 'trouble' },
    confused: { backdrop: 'space',   hero: hero('think', 45, 45, 'shrug'),     particles: { kind: 'stars', density: 0.2 }, tone: 'work' },
    smug:     { backdrop: 'city',    hero: hero('sneak', 10, 40, 'point'),     tone: 'work' },
    sleepy:   { backdrop: 'night',   hero: hero('sleep', 50, 50),              particles: { kind: 'stars', density: 0.3 }, tone: 'work' },
    thinking: { backdrop: 'lab',     hero: hero('think', 45, 45),              particles: { kind: 'bubbles', density: 0.3 }, tone: 'work' },
    idle:     { backdrop: 'night',   hero: hero('sleep', 50, 50),              particles: { kind: 'stars', density: 0.2 }, tone: 'work' },
  });

  // Textos fijos, todos <= CAPTION_MAX.
  const LINES = Object.freeze({
    boot: (hotkey) => `klothulhu despierta. Pulsa ${String(hotkey).replace(/Control/, 'Ctrl')} o haz clic para hablar.`
      .slice(0, CAPTION_MAX),
    thinking: 'Consultando a los astros…',
    idle: 'Los astros duermen. Zzz…',
    // Respaldo cuando seb01 no puede contestar: { código: [emoción, texto] }.
    errors: Object.freeze({
      unreachable:    ['confused', 'Los astros no responden. seb01 no contesta.'],
      timeout:        ['sleepy',   'He esperado una eternidad, y ni siquiera la mía.'],
      http_401:       ['annoyed',  'No reconozco tu sello, mortal. Revisa el token.'],
      http_409:       ['annoyed',  'Aún estoy pensando la anterior. Paciencia.'],
      upstream_error: ['confused', 'Algo se rompió al otro lado del velo.'],
      stream_broken:  ['confused', 'Se cortó el hilo a mitad de profecía.'],
    }),
  });

  // Fin de frase: . ! ? … (uno o varios, quizá cerrando »"')) seguido de espacio o fin.
  const SENTENCE = /.*?[.!?…]+[»"')\]]*(?=\s|$)|.+$/gs;

  // Parte una frase de más de CAPTION_MAX en trozos de longitud pareja (D18).
  // Idéntico a _split_long de server/beats.py: si cambias uno, cambia el otro.
  function splitLong(s) {
    const out = [];
    while (s.length > CAPTION_MAX) {
      const k = Math.ceil(s.length / CAPTION_MAX);   // trozos que hacen falta
      const target = s.length / k;                   // longitud objetivo de cada trozo
      const gaps = [];                               // lo que queda tiene que caber en k-1 trozos
      for (let i = 1; i <= CAPTION_MAX; i++) {
        if (s[i] === ' ' && s.length - (i + 1) <= CAPTION_MAX * (k - 1)) gaps.push(i);
      }
      if (!gaps.length) {                            // palabra de más de CAPTION_MAX: corte duro
        out.push(s.slice(0, CAPTION_MAX));
        s = s.slice(CAPTION_MAX);
        continue;
      }
      const clauses = gaps.filter((i) => ',;:'.includes(s[i - 1]) && Math.abs(i - target) <= 15);
      const pool = clauses.length ? clauses : gaps;
      let best = pool[0];
      for (const g of pool) if (Math.abs(g - target) < Math.abs(best - target)) best = g;
      out.push(s.slice(0, best));
      s = s.slice(best + 1);
    }
    if (s) out.push(s);
    return out;
  }

  function beatsOfSpan(span) {
    const text = span.replace(/\s+/g, ' ').trim();
    if (!text) return [];
    const pieces = [];
    for (const m of text.match(SENTENCE) || []) {
      const s = m.trim();
      if (s) pieces.push(...splitLong(s));
    }
    const out = [];
    for (const p of pieces) {
      const last = out.length - 1;
      if (last >= 0 && out[last].length + 1 + p.length <= CAPTION_MAX) out[last] += ' ' + p;
      else out.push(p);
    }
    return out;
  }

  // marks = [{at, emotion}] ordenadas por `at`. Nunca se juntan frases de tramos distintos.
  function beats(text, marks) {
    text = String(text || '');
    const cuts = [{ at: 0, emotion: 'neutral' }];
    for (const m of marks || []) {
      if (m.at <= 0) cuts[0] = { at: 0, emotion: m.emotion };
      else if (m.at < text.length) cuts.push({ at: m.at, emotion: m.emotion });
    }
    const out = [];
    cuts.forEach((c, i) => {
      const end = i + 1 < cuts.length ? cuts[i + 1].at : text.length;
      for (const caption of beatsOfSpan(text.slice(c.at, end))) out.push({ caption, emotion: c.emotion });
    });
    return out;
  }

  // Una frase de más de TRAMO_MAX se parte por el último espacio que quepa, o en duro si no hay (D24).
  function splitHard(s) {
    const out = [];
    while (s.length > TRAMO_MAX) {
      const i = s.lastIndexOf(' ', TRAMO_MAX);
      if (i <= 0) {
        out.push(s.slice(0, TRAMO_MAX));
        s = s.slice(TRAMO_MAX);
      } else {
        out.push(s.slice(0, i));
        s = s.slice(i + 1);
      }
    }
    if (s) out.push(s);
    return out;
  }

  function tramosOfParagraph(paragraph) {
    const text = paragraph.replace(/\s+/g, ' ').trim();
    if (!text) return [];
    if (text.length <= TRAMO_MAX) return [text];
    const pieces = [];
    for (const m of text.match(SENTENCE) || []) {
      const sentence = m.trim();
      if (sentence) pieces.push(...splitHard(sentence));
    }
    const out = [];
    for (const p of pieces) {
      const last = out.length - 1;
      if (last >= 0 && out[last].length + 1 + p.length <= TRAMO_MAX) out[last] += ' ' + p;
      else out.push(p);
    }
    return out;
  }

  // Un tramo es el texto entre cambios de emoción o saltos de línea; los de más de TRAMO_MAX se parten
  // entre frases (D24). Mismas marcas que beats(). Idéntico a tramos() de server/beats.py.
  function tramos(text, marks) {
    text = String(text || '');
    const cuts = [{ at: 0, emotion: 'neutral' }];
    for (const m of marks || []) {
      if (m.at <= 0) cuts[0] = { at: 0, emotion: m.emotion };
      else if (m.at < text.length) cuts.push({ at: m.at, emotion: m.emotion });
    }
    const out = [];
    cuts.forEach((c, i) => {
      const end = i + 1 < cuts.length ? cuts[i + 1].at : text.length;
      for (const paragraph of text.slice(c.at, end).split(/\s*\n\s*/)) {
        for (const caption of tramosOfParagraph(paragraph)) out.push({ caption, emotion: c.emotion });
      }
    });
    return out;
  }

  function sceneFor(kind, caption, opts) {
    const s = STAGING[kind] || STAGING.neutral;
    const scene = {
      backdrop: s.backdrop,
      palette: {},
      hero: { ...s.hero },
      props: [],
      caption,
      tone: (opts && opts.tone) || s.tone,
    };
    if (s.particles) scene.particles = { ...s.particles };
    return scene;
  }

  // readMs de upstream (hooks/narrator.ts) más la espera de la burbuja (speaksAfter) y el fundido.
  // D22: en un golpe cortado (D18) la frase sigue en el siguiente, así que no se suman los 2 s
  // de pausa y la lectura es la mitad; `speed` (config readSpeed) multiplica solo la lectura.
  function readMs(caption, speaksAfterSec, fadeIn, opts) {
    const { cut = false, speed = 1 } = opts || {};
    const len = caption.length;
    const read = cut ? (len * 45) / 2 : 2000 + len * 45;
    return Math.round((speaksAfterSec || 0) * 1000 + (fadeIn ? 600 : 0) + 200 + len * 30 + speed * read);
  }

  // D22: true si el caption acaba sin cierre de frase (., !, ?, …), ignorando espacios y cierres.
  function isCut(caption) {
    return !/[.!?…][\s»"”')\]]*$/.test(caption);
  }

  return { EMOTIONS, CAPTION_MAX, TRAMO_MAX, BUBBLE_LINES, STAGING, LINES, beats, tramos, sceneFor, readMs, isCut };
});
