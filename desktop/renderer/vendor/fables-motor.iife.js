/*!
 * Claude Fables engine. Code from Claude Fables by henrik-thevibe, under the MIT license:
 *
 * MIT License
 *
 * Copyright (c) 2026 henrik-thevibe
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * The embedded Monocraft font is by Idrees Hassan (https://github.com/IdreesInc/Monocraft),
 * under the SIL Open Font License 1.1 (fonts/Monocraft-OFL.txt in the Claude Fables repo).
 */
"use strict";
var FablesMotor = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // index.ts
  var index_exports = {};
  __export(index_exports, {
    SCHEMA_VERSION: () => SCHEMA_VERSION,
    VOCAB: () => VOCAB,
    renderScene: () => renderScene
  });

  // ../hooks/sprites.ts
  var PALETTE = {
    o: "#d97757",
    // Claude orange
    O: "#b85c3e",
    // shaded orange
    k: "#1f1e1d",
    // ink
    w: "#ece9df",
    // paper
    W: "#b9b5a8",
    // shaded paper
    g: "#8a8780",
    // stone
    G: "#5e9c4a",
    // leaf
    d: "#3c6e34",
    // deep leaf
    b: "#7a4a2b",
    // bark
    B: "#5a3520",
    // dark bark
    r: "#e05252",
    // red
    y: "#e3b341",
    // gold
    u: "#4a90c2",
    // blue
    U: "#2f6690",
    // deep blue
    p: "#7b5fb5",
    // purple
    P: "#54408a",
    // deep purple
    c: "#6fc2c9",
    // cyan
    l: "#f06a2b",
    // lava
    s: "#c9a46a",
    // sand
    m: "#5b5f6b",
    // metal
    M: "#3b3e47"
    // dark metal
  };
  var HERO_FRAMES = [
    [
      "..ooooooooo..",
      "..ooooooooo..",
      "..okoooooko..",
      "..okoooooko..",
      "ooooooooooooo",
      "ooooooooooooo",
      "..ooooooooo..",
      "..o.o...o.o..",
      "..o.o...o.o.."
    ],
    [
      "..ooooooooo..",
      "..ooooooooo..",
      "..okoooooko..",
      "..okoooooko..",
      "ooooooooooooo",
      "ooooooooooooo",
      "..ooooooooo..",
      "...o.o.o.o...",
      "..o..o...o.o."
    ]
  ];
  var SPRITES = {
    bug: {
      accent: "#e05252",
      rows: [".k...k.", "..k.k..", ".aaaaa.", "kakakak", ".aaaaa.", "k.a.a.k", ".k...k."]
    },
    file: {
      accent: "#ece9df",
      rows: ["aaaaa..", "aaaaaa.", "aggggaa", "aaaaaaa", "agggaaa", "aaaaaaa", "aggggaa", "aaaaaaa"]
    },
    folder: {
      accent: "#e3b341",
      rows: ["aaa.....", "aaaaaaaa", "aaaaaaaa", "aaaaaaaa", "aaaaaaaa", "aaaaaaaa"]
    },
    ship: {
      accent: "#ece9df",
      rows: [
        "......k.......",
        ".....ak.......",
        "....aak.a.....",
        "...aaak.aa....",
        "..aaaak.aaa...",
        ".aaaaak.aaaa..",
        "......k.......",
        "bbbbbbbbbbbbbb",
        ".bbbbbbbbbbbb.",
        "..BBBBBBBBBB.."
      ]
    },
    train: {
      accent: "#4a90c2",
      rows: [
        "aaaaaaaaaaaaaa",
        "awwaawwaawwaaa",
        "awwaawwaawwaaa",
        "aaaaaaaaaaaaaa",
        "aaaaaaaaaaaaaa",
        "mmmmmmmmmmmmmm",
        ".kk......kk..."
      ]
    },
    door: {
      accent: "#7a4a2b",
      rows: [".aaaa.", "aaaaaa", "aBBBBa", "aBaaBa", "aBaaBa", "aBaayB", "aBaaBa", "aBaaBa", "aaaaaa"]
    },
    cloud: {
      accent: "#ece9df",
      rows: ["...aaaa.....", "..aaaaaaa...", ".aaaaaaaaaa.", "aaaaaaaaaaaa", ".WWWWWWWWWW."]
    },
    volcano: {
      accent: "#f06a2b",
      rows: [
        ".......aaa........",
        "......aBaBa.......",
        "......bBBBb.......",
        ".....bbbbbbb......",
        ".....bbBbbbb......",
        "....bbbbbbbbb.....",
        "....bbbbbBbbb.....",
        "...bbbBbbbbbbb....",
        "..bbbbbbbbbbbbbb..",
        "..bbbbbbbbBbbbbb..",
        ".bbbbBbbbbbbbbbbb.",
        "bbbbbbbbbbbbbbbbbb"
      ]
    },
    tree: {
      accent: "#5e9c4a",
      rows: ["..aaa..", ".aaaaa.", "aaaadaa", "aadaaaa", ".aaaaa.", "..aaa..", "...b...", "...b...", "..bbb.."]
    },
    rocket: {
      accent: "#e05252",
      rows: [
        "...a...",
        "..aaa..",
        "..www..",
        "..wuw..",
        "..www..",
        "..www..",
        ".awwwa.",
        "aawwwaa",
        "..lyl..",
        "...l..."
      ]
    },
    planet: {
      accent: "#7b5fb5",
      rows: [
        "...aaaa...",
        ".aaaaaaaa.",
        "aaPaaaaaaa",
        "aaaaaaPPaa",
        "aaaaaaaaaa",
        "aPPaaaaaaa",
        "aaaaaaaPaa",
        ".aaaaaaaa.",
        "...aaaa..."
      ]
    },
    cactus: {
      accent: "#5e9c4a",
      rows: ["...a...", "...a...", "a..a...", "a..a..a", "aaaa..a", "...aaaa", "...a...", "...a...", "...a..."]
    },
    server: {
      accent: "#5fd35f",
      rows: ["mmmmmmmm", "mMMMMMam", "mmmmmmmm", "mMMMMMym", "mmmmmmmm", "mMMMMMam", "mmmmmmmm", "mMMMMMam", "mmmmmmmm", "k......k"]
    },
    gear: {
      accent: "#8a8780",
      rows: ["...a...", ".aaaaa.", ".aa.aa.", "aa...aa", ".aa.aa.", ".aaaaa.", "...a..."]
    },
    trophy: {
      accent: "#e3b341",
      rows: ["aaaaaaa", "aaaaaaa", "aaaaaaa", ".aaaaa.", "..aaa..", "...a...", "..aaa..", ".aaaaa."]
    },
    flag: {
      accent: "#e05252",
      rows: ["kaaaa", "kaaaaa", "kaaaa", "k....", "k....", "k....", "k....", "k...."]
    },
    chest: {
      accent: "#e3b341",
      rows: [".bbbbbbb.", "bbbbbbbbb", "aaaaaaaaa", "bbbbabbbb", "bbbbbbbbb", "bbbbbbbbb"]
    },
    key: {
      accent: "#e3b341",
      rows: [".aa......", "a..aaaaaa", ".aa...a.a"]
    },
    bomb: {
      accent: "#3b3e47",
      rows: ["....y", "...b.", ".aaa.", "aaaaa", "aaaaa", "aaaaa", ".aaa."]
    },
    fish: {
      accent: "#e3b341",
      rows: ["..aaa..a", ".aaaaaaa", "akaaaa.a", ".aaaaaaa", "..aaa..a"]
    },
    star: {
      accent: "#e3b341",
      rows: ["..a..", "..a..", "aaaaa", ".aaa.", ".a.a."]
    },
    beaker: {
      accent: "#6fc2c9",
      rows: [".ww.", ".ww.", ".ww.", "w..w", "waaw", "waaw", "wwww"]
    },
    house: {
      accent: "#e05252",
      rows: ["....aa....", "...aaaa...", "..aaaaaa..", ".aaaaaaaa.", "aaaaaaaaaa", ".wwwwwwww.", ".wuwwwbbw.", ".wwwwwbbw.", ".wwwwwbbw."]
    },
    mushroom: {
      accent: "#e05252",
      rows: ["..aaaa..", ".awaaaa.", "aaaaawaa", "awaaaaaa", "...ww...", "...ww...", "..wwww.."]
    },
    crystal: {
      accent: "#6fc2c9",
      rows: ["..a..", ".aaa.", ".awa.", "aaaaa", "aawaa", ".aaa.", "..a.."]
    },
    magnifier: {
      accent: "#6fc2c9",
      rows: [".mmm...", "maaam..", "maaam..", "maaam..", ".mmmm..", "....mm.", ".....mm"]
    },
    bird: {
      accent: "#4a90c2",
      rows: ["a.....a", ".a...a.", "..aaa.."]
    },
    lamp: {
      accent: "#e3b341",
      rows: [".mmm.", "maaam", ".aaa.", "..m..", "..m..", "..m..", ".mmm."]
    },
    anchor: {
      accent: "#8a8780",
      rows: ["..a..", ".a.a.", "..a..", "aaaaa", "..a..", "a.a.a", ".aaa."]
    },
    ghost: {
      accent: "#ece9df",
      rows: [".aaaa.", "aaaaaa", "akaaka", "aaaaaa", "aaaaaa", "a.aa.a"]
    },
    coin: {
      accent: "#e3b341",
      rows: [".aaa.", "aayaa", "aayaa", "aayaa", ".aaa."]
    },
    book: {
      accent: "#4a90c2",
      rows: ["aaaaaaa", "awwwwwa", "awgggwa", "awwwwwa", "awgggwa", "aaaaaaa"]
    }
  };
  var SPRITE_NAMES = Object.keys(SPRITES);

  // ../hooks/scene.ts
  var BACKDROPS = [
    "forest",
    "space",
    "city",
    "desert",
    "volcano",
    "lab",
    "night"
  ];
  var HERO_ACTIONS = [
    "walk",
    "run",
    "fly",
    "carry",
    "sneak",
    "jump",
    "tumble",
    "dig",
    "inspect",
    "celebrate",
    "think",
    "panic",
    "sleep",
    "dance",
    "spin",
    "wave",
    "point",
    "peek",
    "trip",
    "shrug",
    "approach",
    "angry",
    "dazed"
  ];
  var MOTIONS = [
    "none",
    "bob",
    "drift",
    "shake",
    "fall",
    "spin",
    "blink",
    "scroll"
  ];
  var PARTICLES = [
    "stars",
    "rain",
    "bubbles",
    "sparks",
    "snow",
    "leaves"
  ];
  var APPROACH_SECONDS = 2.4;
  var APPROACH_SCALE = 2.5;
  var MAX_PROPS = 8;
  var MAX_CAPTION = 80;
  var MAX_LONG_CAPTION = 500;
  var TYPE_SECONDS_PER_CHAR = 0.03;
  var READ_HOLD_MIN = 1.2;
  var SCROLL_SECONDS = 0.3;
  var ENTRANCE_SECONDS = 0.6;
  var MAX_LABEL = 18;
  var MAX_TITLE = 24;
  var MAX_PIXEL_SIDE = 16;
  var PIXEL_KEYS = /^[a-zA-Z0-9]$/;
  var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  function parseHex(v) {
    if (typeof v !== "string") return void 0;
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v.trim());
    if (!m || m[1] === void 0) return void 0;
    const hex = m[1].toLowerCase();
    return hex.length === 3 ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : `#${hex}`;
  }
  function oneOf(v, among, fallback) {
    return typeof v === "string" && among.includes(v) ? v : fallback;
  }
  function clampNumber(v, lo, hi, fallback) {
    const n3 = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (!Number.isFinite(n3)) return fallback;
    return Math.min(hi, Math.max(lo, n3));
  }
  function cleanText(v, max) {
    if (typeof v !== "string") return void 0;
    const flat = v.replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ").replace(/\s+/g, " ").trim();
    if (flat === "") return void 0;
    return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}\u2026` : flat;
  }
  function cleanCaption(v, max = MAX_CAPTION) {
    const flat = cleanText(v, Infinity);
    if (!flat || flat.length <= max) return flat;
    const head = flat.slice(0, max);
    const sentence = /^.*[.!?](?=\s)/.exec(head)?.[0];
    if (sentence && sentence.length >= max * 0.6) return sentence;
    const room = flat.slice(0, max - 1);
    const space2 = room.lastIndexOf(" ");
    const words2 = space2 >= max / 2 ? room.slice(0, space2) : room;
    return `${words2.replace(/[\s,;:.\-–—]+$/, "")}\u2026`;
  }
  function parsePixelArt(v) {
    if (!Array.isArray(v.pixels) || !isObject(v.colors)) return void 0;
    const colors = {};
    for (const [key, value] of Object.entries(v.colors)) {
      const hex = parseHex(value);
      if (PIXEL_KEYS.test(key) && hex) colors[key] = hex;
    }
    const pixels = v.pixels.slice(0, MAX_PIXEL_SIDE).filter((row) => typeof row === "string").map((row) => [...row.slice(0, MAX_PIXEL_SIDE)].map((c) => colors[c] ? c : ".").join(""));
    const isEmpty = pixels.every((row) => /^\.*$/.test(row));
    return pixels.length > 0 && !isEmpty ? { pixels, colors } : void 0;
  }
  function parseProp(v) {
    if (!isObject(v)) return void 0;
    let sprite;
    if (typeof v.sprite === "string") {
      const name = v.sprite.toLowerCase().trim();
      sprite = SPRITE_NAMES.includes(name) ? name : void 0;
    } else if (isObject(v.sprite)) {
      sprite = parsePixelArt(v.sprite);
    }
    if (sprite === void 0) return void 0;
    const prop = {
      sprite,
      x: Math.round(clampNumber(v.x, 0, 100, 50)),
      y: oneOf(v.y, ["ground", "air", "sky"], "ground"),
      motion: oneOf(v.motion, MOTIONS, "none")
    };
    const label2 = cleanText(v.label, MAX_LABEL);
    if (label2) prop.label = label2;
    const color = parseHex(v.color);
    if (color) prop.color = color;
    return prop;
  }
  function parseScene(raw, { maxCaption = MAX_CAPTION } = {}) {
    if (!isObject(raw)) return null;
    const caption2 = cleanCaption(raw.caption, maxCaption);
    if (!caption2) return null;
    const hero11 = isObject(raw.hero) ? raw.hero : {};
    const palette = isObject(raw.palette) ? raw.palette : {};
    const scene = {
      backdrop: oneOf(raw.backdrop, BACKDROPS, "night"),
      palette: {},
      hero: {
        action: oneOf(hero11.action, HERO_ACTIONS, "walk"),
        from: Math.round(clampNumber(hero11.from, 0, 100, 10)),
        to: Math.round(clampNumber(hero11.to, 0, 100, 60)),
        // What comes next is played where Claude stands, so a second journey is just its moves in place.
        // `approach` only opens a scene: it is never the second move.
        ...typeof hero11.then === "string" && hero11.then !== "approach" && HERO_ACTIONS.includes(hero11.then) ? { then: hero11.then } : {}
      },
      props: (Array.isArray(raw.props) ? raw.props : []).map(parseProp).filter((p) => p !== void 0).slice(0, MAX_PROPS),
      caption: caption2
    };
    for (const key of ["sky", "ground", "accent"]) {
      const hex = parseHex(palette[key]);
      if (hex) scene.palette[key] = hex;
    }
    if (isObject(raw.particles)) {
      scene.particles = {
        kind: oneOf(raw.particles.kind, PARTICLES, "stars"),
        density: clampNumber(raw.particles.density, 0, 1, 0.4)
      };
    }
    if (raw.tone === "trouble" || raw.tone === "milestone" || raw.tone === "work") scene.tone = raw.tone;
    const title2 = cleanText(raw.title, MAX_TITLE);
    if (title2) scene.title = title2;
    return scene;
  }

  // ../hooks/clawd3d.ts
  var DIM = {
    LH: 2.8,
    BW: 12,
    BH: 9,
    BD: 6,
    AW: 2.4,
    AH: 2.6,
    AD: 2.4,
    AY: 4.1,
    LW: 1.2,
    LD: 1.3,
    LEGS: [[-4.85, 1.45], [-2.55, -1.45], [2.55, -1.45], [4.85, 1.45]],
    EX: 3.6,
    EY: 6.4,
    EW: 1.2,
    EH: 2
  };
  var CY = DIM.LH + DIM.BH / 2;
  var PY = DIM.LH + DIM.BH * 0.4;
  var MODEL_H = DIM.LH + DIM.BH;
  var MODEL_HALF_W = DIM.BW / 2 + DIM.AW;
  var POSE0 = { yaw: 0, pitch: 0, roll: 0, hop: 0, sq: 1, armL: 0.06, armR: 0.06, walk: 0, stride: 0, eyeX: 0, eyeY: 0, eyes: "open", liftL: 0, liftR: 0, crouch: 0, dx: 0, tumble: 0 };
  var LIGHT = norm([-0.42, 0.62, 0.66]);
  var CAMERA_PITCH = 0.2;
  var PERSP = 0.016;
  function mul(a, b) {
    return [
      a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
      a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
      a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
      a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
      a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
      a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
      a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
      a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
      a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
    ];
  }
  var rX = (t) => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
  var rY = (t) => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
  var rZ = (t) => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
  var mv = (m, x, y, z) => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  var box = (x0, y0, z0, x1, y1, z1) => [
    [x0, y0, z0],
    [x1, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x0, y1, z1],
    [x1, y1, z1]
  ];
  var FACES = { front: [4, 5, 7, 6], back: [1, 0, 2, 3], right: [5, 1, 3, 7], left: [0, 4, 6, 2], top: [6, 7, 3, 2], bottom: [0, 1, 5, 4] };
  function area(p) {
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  }
  function hullOf(pts) {
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    for (const q of p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper = [];
    for (const q of [...p].reverse()) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
      upper.push(q);
    }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }
  function build(pose, s) {
    const p = { ...POSE0, ...pose };
    const D = DIM;
    const sxz = 1 / Math.sqrt(Math.max(0.3, p.sq));
    const py = PY * p.sq;
    const R2 = mul(rY(p.yaw), mul(rX(p.pitch), rZ(p.roll)));
    const Cm = rX(CAMERA_PITCH);
    const drop = p.crouch * D.LH * 0.5;
    const tc = Math.cos(p.tumble);
    const ts = Math.sin(p.tumble);
    const tcy = D.LH + D.BH / 2;
    const tlift = p.tumble ? -Math.min(...[[-D.BW / 2, D.LH], [D.BW / 2, D.LH], [-D.BW / 2, D.LH + D.BH], [D.BW / 2, D.LH + D.BH], [-5.45, 0], [5.45, 0], [-D.BW / 2 - D.AW, D.LH + D.AY], [D.BW / 2 + D.AW, D.LH + D.AY]].map(([x, y]) => tcy + x * ts + (y - tcy) * tc)) : 0;
    const W3 = (x, y, z) => {
      if (p.tumble) {
        const ty = y - tcy;
        [x, y] = [x * tc - ty * ts, tcy + x * ts + ty * tc + tlift];
      }
      const r2 = mv(R2, x * sxz, y * p.sq - py, z * sxz);
      return mv(Cm, r2[0] + p.dx, r2[1] + py + p.hop - CY, r2[2]);
    };
    const groundY = mv(Cm, 0, -CY, 0)[1];
    const proj = (q) => {
      const f3 = 1 / (1 - q[2] * PERSP);
      return [q[0] * s * f3, -(q[1] - groundY) * s * f3];
    };
    const part = (name, corners, local, skip) => {
      const q = corners.map((c) => W3(...local ? local(c) : c));
      const sp = q.map(proj);
      const faces2 = {};
      for (const fn of Object.keys(FACES)) {
        const ix = FACES[fn];
        const Q = ix.map((i) => q[i]);
        const S = ix.map((i) => sp[i]);
        const [a, b, , d] = Q;
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        const n3 = norm([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]);
        const light = Math.min(1, Math.max(0, n3[0] * LIGHT[0] + n3[1] * LIGHT[1] + n3[2] * LIGHT[2]));
        faces2[fn] = { part: name, name: fn, pts: S, light, vis: area(S) < -0.02 && fn !== skip, depth: Q.reduce((t, c) => t + c[2], 0) / 4 };
      }
      return { name, faces: faces2, depth: q.reduce((t, c) => t + c[2], 0) / 8, corners: sp };
    };
    const body = part("body", box(-D.BW / 2, D.LH - drop, -D.BD / 2, D.BW / 2, D.LH + D.BH - drop, D.BD / 2));
    const arms = [-1, 1].map((side) => {
      const ang = side < 0 ? -p.armL : p.armR;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const px = side * D.BW / 2;
      const ay = D.LH + D.AY - drop + (side < 0 ? p.liftL : p.liftR);
      const x0 = side < 0 ? -D.BW / 2 - D.AW : D.BW / 2 - 0.3;
      const x1 = side < 0 ? -D.BW / 2 + 0.3 : D.BW / 2 + D.AW;
      return part("arm", box(x0, ay - D.AH / 2, -D.AD / 2, x1, ay + D.AH / 2, D.AD / 2), (cc) => {
        const dx = cc[0] - px;
        const dy = cc[1] - ay;
        return [px + dx * c - dy * sn, ay + dx * sn + dy * c, cc[2]];
      }, side < 0 ? "right" : "left");
    });
    const OFF = [0, Math.PI, 0, Math.PI];
    const legs = D.LEGS.map(([lx, lz], i) => {
      const ph = p.walk + (OFF[i] ?? 0);
      const sw = p.stride * 0.5 * Math.sin(ph);
      const lift2 = p.stride * 0.75 * Math.max(0, Math.cos(ph));
      const c = Math.cos(sw);
      const sn = Math.sin(sw);
      const hy = D.LH - drop;
      return part("leg", box(lx - D.LW / 2, 0, lz - D.LD / 2, lx + D.LW / 2, D.LH + 0.45 - drop, lz + D.LD / 2), (cc) => {
        const dy = cc[1] - hy;
        const dz = cc[2] - lz;
        return [cc[0], hy + dy * c - dz * sn + lift2, lz + dy * sn + dz * c];
      }, "top");
    }).sort((a, b) => a.depth - b.depth);
    const bf = body.faces;
    const [armL, armR] = arms;
    const order = [];
    if (!bf.left.vis) order.push(armL);
    if (!bf.right.vis) order.push(armR);
    if (!bf.bottom.vis) order.push(...legs);
    order.push(body);
    if (bf.bottom.vis) order.push(...legs);
    if (bf.left.vis) order.push(armL);
    if (bf.right.vis) order.push(armR);
    const faces = order.flatMap((pt) => Object.values(pt.faces).filter((f3) => f3.vis).sort((a, b) => a.depth - b.depth)).map(({ part: part2, name, pts, light }) => ({ part: part2, name, pts, light }));
    const parts = order.map((pt) => {
      const meet = /* @__PURE__ */ new Map();
      for (const fn of Object.keys(FACES)) {
        const ix = FACES[fn];
        const shown = pt.faces[fn].vis ? 1 : 0;
        ix.forEach((i, k) => {
          const j = ix[(k + 1) % 4];
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          const e = meet.get(key) ?? { i, j, shown: 0 };
          e.shown += shown;
          meet.set(key, e);
        });
      }
      const edges = [...meet.values()].map(({ i, j, shown }) => ({
        a: pt.corners[i],
        b: pt.corners[j],
        kind: shown === 2 ? "crease" : shown === 1 ? "sil" : "hidden"
      }));
      const shownFaces = Object.values(pt.faces).filter((f3) => f3.vis).sort((a, b) => a.depth - b.depth).map(({ part: part2, name, pts, light }) => ({ part: part2, name, pts, light }));
      return { name: pt.name, faces: shownFaces, hull: hullOf(pt.corners), edges };
    });
    const eyes = [];
    if (bf.front.vis) {
      const ew = D.EW / 2;
      const eh = D.EH / 2;
      const zf = D.BD / 2 + 0.03;
      for (const side of [-1, 1]) {
        const ex = side * D.EX + Math.max(-1, Math.min(1, p.eyeX)) * 0.55;
        const ey = D.LH + D.EY - drop + Math.max(-1, Math.min(1, p.eyeY)) * 0.42;
        const E = (dx, dy) => proj(W3(ex + dx, ey + dy, zf));
        const ellipse = (rx, ry, oy = 0) => Array.from({ length: 12 }, (_, i) => E(Math.cos(Math.PI * i / 6) * rx, oy + Math.sin(Math.PI * i / 6) * ry));
        if (p.eyes === "wide") eyes.push({ poly: ellipse(ew * 1.3, eh * 1.15) });
        else if (p.eyes === "focus") eyes.push({ poly: ellipse(ew * 1.1, eh * 0.42, -eh * 0.1) });
        else if (p.eyes === "dizzy") eyes.push({ line: [E(-ew, eh * 0.7), E(ew, -eh * 0.7)] }, { line: [E(-ew, -eh * 0.7), E(ew, eh * 0.7)] });
        else if (p.eyes === "sad") eyes.push({ poly: ellipse(ew * 0.85, eh * 0.8, -eh * 0.15) }, { line: [E(side * ew * 1.3, eh * 1.15), E(-side * ew * 0.9, eh * 1.6)] });
        else if (p.eyes === "angry") eyes.push({ poly: ellipse(ew * 1.05, eh * 0.6, -eh * 0.1) }, { line: [E(side * ew * 1.5, eh * 1.55), E(-side * ew * 1.1, eh * 0.9)] });
        else if (p.eyes === "spiral") {
          const steps = 24;
          eyes.push({ line: Array.from({ length: steps }, (_, i) => {
            const k = i / (steps - 1);
            return E(side * Math.cos(k * 4 * Math.PI) * eh * 1.6 * k, Math.sin(k * 4 * Math.PI) * eh * 1.6 * k);
          }) });
        } else if (p.eyes === "happy") eyes.push({ line: [E(-ew * 1.15, -eh * 0.2), E(-ew * 0.6, eh * 0.3), E(0, eh * 0.5), E(ew * 0.6, eh * 0.3), E(ew * 1.15, -eh * 0.2)] });
        else if (p.eyes === "closed") eyes.push({ line: [E(-ew * 1.2, eh * 0.05), E(-ew * 0.5, -eh * 0.22), E(0, -eh * 0.28), E(ew * 0.5, -eh * 0.22), E(ew * 1.2, eh * 0.05)] });
        else {
          const pts = [];
          const cyo = eh - ew;
          for (let i = 0; i <= 6; i++) pts.push(E(Math.cos(Math.PI * i / 6) * ew, cyo + Math.sin(Math.PI * i / 6) * ew));
          for (let i = 0; i <= 6; i++) pts.push(E(Math.cos(Math.PI + Math.PI * i / 6) * ew, -cyo + Math.sin(Math.PI + Math.PI * i / 6) * ew));
          eyes.push({ poly: pts });
        }
      }
    }
    const shadow = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 2 * i / 14;
      shadow.push(proj(mv(Cm, Math.cos(a) * 8.6, -CY, Math.sin(a) * 4.6)));
    }
    return { faces, eyes, shadow, parts };
  }
  var MOTION_TIMING = {
    walk: { frames: 6, dur: 0.64, kind: "travel" },
    run: { frames: 6, dur: 0.4, kind: "travel" },
    fly: { frames: 6, dur: 0.6, kind: "travel" },
    carry: { frames: 6, dur: 0.8, kind: "travel" },
    sneak: { frames: 6, dur: 1.1, kind: "travel" },
    jump: { frames: 6, dur: 0.7, kind: "travel" },
    tumble: { frames: 8, dur: 0.6, kind: "travel" },
    dig: { frames: 6, dur: 0.45, kind: "loop" },
    inspect: { frames: 12, dur: 3, kind: "loop" },
    celebrate: { frames: 8, dur: 0.7, kind: "loop" },
    think: { frames: 6, dur: 2.4, kind: "loop" },
    idle: { frames: 12, dur: 6, kind: "loop" },
    panic: { frames: 6, dur: 0.42, kind: "loop" },
    sleep: { frames: 6, dur: 3.2, kind: "loop" },
    dance: { frames: 8, dur: 0.9, kind: "loop" },
    spin: { frames: 8, dur: 0.8, kind: "loop" },
    wave: { frames: 6, dur: 0.8, kind: "loop" },
    point: { frames: 6, dur: 1.2, kind: "loop" },
    peek: { frames: 8, dur: 2.4, kind: "loop" },
    trip: { frames: 14, dur: 2.6, kind: "once" },
    shrug: { frames: 10, dur: 1.8, kind: "once" },
    angry: { frames: 8, dur: 0.8, kind: "loop" },
    dazed: { frames: 12, dur: 2.4, kind: "loop" }
  };
  var ease = (t, a, b) => {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  function poseAt(motion, t, yaw) {
    const a = Math.PI * 2 * t;
    const sin = Math.sin(a);
    switch (motion) {
      case "walk":
        return { yaw, walk: a, stride: 0.9, hop: Math.abs(Math.sin(a)) * 0.25, roll: sin * 0.03, armL: 0.06 + 0.12 * sin, armR: 0.06 - 0.12 * sin };
      case "run":
        return { yaw, pitch: 0.12, walk: a, stride: 1.3, hop: Math.abs(Math.sin(a)) * 0.6, armL: 0.3 + 0.35 * sin, armR: 0.3 - 0.35 * sin, sq: 1 + 0.04 * Math.cos(2 * a) };
      case "fly": {
        const flap = 0.5 - 0.5 * Math.cos(a);
        return { yaw, pitch: 0.1, armL: -0.3 + 1.7 * flap, armR: -0.3 + 1.7 * flap, hop: 0.6 * flap, walk: a, stride: 0.25 };
      }
      // A load held overhead: both arms up, the body a touch squashed under it, heavy steps.
      case "carry":
        return { yaw, walk: a, stride: 0.6, hop: Math.abs(sin) * 0.15, armL: 1.5, armR: 1.5, liftL: 3.6, liftR: 3.6, sq: 0.95 + 0.02 * Math.cos(2 * a), pitch: -0.05 };
      // On tiptoe, crouched, arms out to the sides for balance, eyes darting about.
      case "sneak":
        return { yaw, crouch: 0.55, pitch: 0.1, walk: a, stride: 0.5, armL: 0.3 + 0.08 * sin, armR: 0.3 - 0.08 * sin, eyeX: 0.8 * sin, eyeY: 0.2 };
      // Hop after hop: a crouch to wind up, a leap with arms flung up, legs tucked.
      case "jump": {
        const up = Math.max(0, sin);
        const down = Math.max(0, -sin);
        return { yaw, hop: up * 5, crouch: down * 0.5, armL: 0.1 + up * 1.2, armR: 0.1 + up * 1.2, walk: a, stride: 0.3 * up, sq: 1 + up * 0.08 - down * 0.05, eyes: up > 0.5 ? "happy" : "open" };
      }
      // Rolling along, head over heels.
      case "tumble":
        return { yaw: yaw * 0.3, tumble: -a, armL: 0.5, armR: 0.5, eyes: "dizzy" };
      case "dig":
        return { yaw: yaw * 0.6, pitch: 0.4 + 0.12 * sin, armL: -0.3 + 0.9 * Math.max(0, sin), armR: -0.3 + 0.9 * Math.max(0, -sin), sq: 0.95 };
      case "inspect":
        return { yaw: 0.7 * sin, eyeX: sin, eyeY: -0.3, pitch: 0.08, armR: 0.06 + 0.5 * Math.max(0, Math.cos(a)) };
      case "celebrate": {
        const up = Math.sin(Math.PI * t);
        return { hop: up * 3.2, armL: 0.1 + 1.3 * up, armR: 0.1 + 1.3 * up, pitch: -up * 0.25, sq: 1 + 0.08 * up, eyes: "happy" };
      }
      case "think":
        return { yaw: yaw * 0.4 + 0.15 * sin, eyeX: 0.5, eyeY: 1, roll: 0.06 * sin, sq: 1 + 0.015 * sin, armR: 0.5, eyes: t > 0.78 && t < 0.9 ? "closed" : "open" };
      // Standing about: a glance one way, a blink, a glance the other, a shift of weight, a stretch.
      case "idle": {
        const stretch = ease(t, 0.62, 0.72) - ease(t, 0.8, 0.92);
        const eyeX = t < 0.2 ? -0.8 : t >= 0.34 && t < 0.5 ? 0.8 : 0;
        return {
          yaw: yaw * 0.5 + eyeX * 0.12,
          eyeX,
          roll: t >= 0.5 && t < 0.62 ? 0.05 : 0,
          sq: 1 + 0.015 * sin + stretch * 0.06,
          armL: 0.06 + stretch * 1.1,
          armR: 0.06 + stretch * 1.1,
          eyes: t >= 0.2 && t < 0.28 ? "closed" : stretch > 0.5 ? "happy" : "open"
        };
      }
      // Flapping about: arms up and waving, a tremble from side to side, eyes wide.
      case "panic":
        return { yaw: yaw * 0.3, dx: 0.35 * Math.cos(3 * a), hop: Math.abs(Math.sin(2 * a)) * 0.6, armL: 1.3 + 0.4 * Math.sin(2 * a), armR: 1.3 - 0.4 * Math.sin(2 * a), liftL: 2.6, liftR: 2.6, sq: 1.04, eyes: "wide" };
      // Dozing where it stands: sunk low, arms hanging, a slow breath.
      case "sleep":
        return { yaw: yaw * 0.3, crouch: 0.7, pitch: 0.1, roll: 0.04 * sin, sq: 1 + 0.03 * sin, armL: -0.15, armR: -0.15, eyes: "closed" };
      // A victory jig: hopping from side to side, arms up in turn.
      case "dance":
        return { yaw: yaw * 0.5 + 0.3 * sin, hop: Math.abs(sin) * 1.6, dx: sin, roll: -sin * 0.12, walk: a, stride: 0.6, armL: 0.4 + Math.max(0, sin), armR: 0.4 + Math.max(0, -sin), eyes: "happy" };
      // A twirl on the spot.
      case "spin":
        return { yaw: yaw + a, hop: 0.3 * Math.abs(Math.sin(2 * a)), armL: 0.5, armR: 0.5 };
      // A hello: the near arm up high, waving.
      case "wave":
        return { yaw: yaw * 0.5, armL: 1.5 + 0.45 * sin, liftL: 3.8, roll: 0.04 * sin, eyes: "happy" };
      // There! An arm held out and up toward it, eyes on it, a little bounce.
      case "point":
        return { yaw: yaw * 0.8, armR: 0.45, liftR: 2, hop: 0.25 * Math.max(0, sin), eyeX: 0.8, eyes: "wide" };
      // Leaning out from where it hides, then back.
      case "peek": {
        const out = Math.max(0, sin);
        return { yaw: yaw * 0.6, crouch: 0.45, dx: 1.6 * out, roll: -0.15 * out, pitch: 0.05, eyeX: 0.8 * out, eyes: out > 0.3 ? "wide" : "open" };
      }
      // Arms windmilling, a lurch, a fall flat on its face with a squash, stars, and a spring back up.
      case "trip": {
        const span = (from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)));
        const wind = ease(t, 0, 0.08) - ease(t, 0.12, 0.2);
        const fall = ease(t, 0.12, 0.3) - ease(t, 0.72, 0.86);
        const air = Math.sin(Math.PI * span(0.12, 0.3));
        const splat = ease(t, 0.28, 0.32) - ease(t, 0.32, 0.46);
        const spring = Math.sin(Math.PI * span(0.72, 0.88));
        const down = t > 0.32 && t < 0.72;
        const flail = Math.sin(a * 10);
        return {
          yaw: yaw * 0.5,
          tumble: -1.45 * fall + (down ? 0.06 * Math.sin(a * 5) : 0),
          dx: 2.6 * fall,
          hop: air * 2.4 + spring * 2.8,
          sq: 1 - splat * 0.25 + spring * 0.08,
          armL: 0.06 + wind * (1.1 + 0.7 * flail) + (down ? 0.9 : air * 1.4),
          armR: 0.06 + wind * (1.1 - 0.7 * flail) + (down ? 0.9 : air * 1.4),
          eyes: down ? "dizzy" : wind > 0.2 || air > 0.2 ? "wide" : "open"
        };
      }
      // Arms out and up, head on one side, then settling: no idea.
      case "shrug": {
        const up = ease(t, 0, 0.3) - ease(t, 0.7, 1);
        return { yaw: yaw * 0.5, armL: 0.06 + up * 0.9, armR: 0.06 + up * 0.9, liftL: up * 1.6, liftR: up * 1.6, roll: up * 0.12, sq: 1 + up * 0.04, eyes: up > 0.4 ? "sad" : "open" };
      }
      // Stamping in place, a foot at a time with a short hop on each, arms stiff and a little out, hunched, a slight tremble.
      case "angry":
        return { yaw: yaw * 0.5, walk: a, stride: 1.1, hop: Math.abs(Math.sin(2 * a)) * 0.5, crouch: 0.2, pitch: 0.1, dx: 0.15 * Math.sin(3 * a), roll: 0.02 * Math.sin(3 * a), armL: 0.32, armR: 0.32, sq: 0.97, eyes: "angry" };
      // Swaying slowly round in a circle, arms hanging loose, eyes spinning.
      case "dazed":
        return { yaw: yaw * 0.5, dx: 0.9 * Math.cos(a), roll: 0.12 * Math.sin(a), pitch: 0.06 * Math.cos(a), armL: 0.2 + 0.25 * Math.sin(a - 0.8), armR: 0.2 + 0.25 * Math.sin(a - 2.4), sq: 1 + 0.01 * Math.sin(2 * a), eyes: "spiral" };
    }
  }
  function outlinedOrder(m) {
    const legs = m.parts.filter((p) => p.name === "leg");
    const out = [];
    for (const p of m.parts) {
      if (p.name === "leg") continue;
      if (p.name === "body") out.push(...legs);
      out.push(p);
    }
    return out;
  }
  var outlinedFaces = (m) => outlinedOrder(m).flatMap((p) => p.faces);

  // ../hooks/art/ink.ts
  var HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  var NAMED = { white: "#ffffff", black: "#000000" };
  function rgb(color) {
    const c = NAMED[color] ?? color;
    const m = HEX.exec(c);
    if (!m?.[1]) return void 0;
    const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  function lum(color) {
    const c = rgb(color);
    return c ? (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 : 0.5;
  }
  function hue(color) {
    const [r2, g, b] = (rgb(color) ?? [128, 128, 128]).map((v) => v / 255);
    const max = Math.max(r2, g, b);
    const min = Math.min(r2, g, b);
    const d = max - min;
    if (d === 0) return { h: 0, s: 0 };
    const h = max === r2 ? ((g - b) / d + 6) % 6 : max === g ? (b - r2) / d + 2 : (r2 - g) / d + 4;
    return { h: h * 60, s: max === 0 ? 0 : d / max };
  }
  var isWarm = (color) => {
    const { h, s } = hue(color);
    return s > 0.3 && (h < 55 || h > 335);
  };
  var isGreen = (color) => {
    const { h, s } = hue(color);
    return s > 0.18 && h >= 70 && h < 170;
  };
  var step = (ramp, t) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? ramp[0] ?? "#000";
  function mix(a, b, t) {
    const x = rgb(a) ?? [0, 0, 0];
    const y = rgb(b) ?? [0, 0, 0];
    return `#${x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * t).toString(16).padStart(2, "0")).join("")}`;
  }
  function gradients(svg) {
    const out = /* @__PURE__ */ new Map();
    const re = /<(linearGradient|radialGradient)\s([^>]*?)id="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
    for (const m of svg.matchAll(re)) {
      const [, tag, pre, id, post, body] = m;
      const stops = [];
      for (const s of (body ?? "").matchAll(/<stop\s([^>]*)\/>/g)) {
        const a = s[1] ?? "";
        const offset = Number(/offset="([^"]+)"/.exec(a)?.[1] ?? 0);
        const color = /stop-color="([^"]+)"/.exec(a)?.[1] ?? "#000";
        const opacity = Number(/stop-opacity="([^"]+)"/.exec(a)?.[1] ?? 1);
        stops.push({ offset, color, opacity });
      }
      out.set(id ?? "", { id: id ?? "", tag, attrs: `${pre ?? ""}${post ?? ""}`.trim(), stops });
    }
    return out;
  }
  function meanOf(g) {
    if (!g.stops.length) return { color: "#808080", opacity: 1 };
    let w = 0;
    const acc = [0, 0, 0];
    for (const s of g.stops) {
      const c = rgb(s.color) ?? [128, 128, 128];
      const k = s.opacity + 0.05;
      w += k;
      c.forEach((v, i) => acc[i] = (acc[i] ?? 0) + v * k);
    }
    const color = `#${acc.map((v) => Math.round(v / w).toString(16).padStart(2, "0")).join("")}`;
    return { color, opacity: g.stops.reduce((t, s) => t + s.opacity, 0) / g.stops.length };
  }
  function dropGroups(svg, test) {
    let out = "";
    let i = 0;
    const open = /<g\b([^>]*)>/g;
    for (; ; ) {
      open.lastIndex = i;
      const m = open.exec(svg);
      if (!m) break;
      if (!test.test(m[1] ?? "")) {
        out += svg.slice(i, m.index + m[0].length);
        i = m.index + m[0].length;
        continue;
      }
      out += svg.slice(i, m.index);
      let depth = 1;
      let j = m.index + m[0].length;
      const tag = /<g\b[^>]*?(\/?)>|<\/g>/g;
      while (depth > 0) {
        tag.lastIndex = j;
        const t = tag.exec(svg);
        if (!t) {
          j = svg.length;
          break;
        }
        if (t[0] === "</g>") depth--;
        else if (t[1] !== "/") depth++;
        j = t.index + t[0].length;
      }
      i = j;
    }
    return out + svg.slice(i);
  }
  var dropBlooms = (svg) => dropGroups(svg, /filter="url\(#sc-(bloom|wide)\)"/);
  var stripLight = (svg) => svg.replace(/\sfilter="url\(#sc-[^"]*\)"/g, "").replace(/\sstyle="mix-blend-mode:[^"]*"/g, "");
  function repaint(svg, o) {
    return svg.replace(/\s(fill|stroke|color|stop-color)="([^"]*)"/g, (all, attr, value) => {
      const u = /^url\(#([^)]+)\)$/.exec(value);
      if (u) {
        const to2 = o.url?.(u[1] ?? "", attr);
        return to2 === void 0 ? all : ` ${attr}="${to2}"`;
      }
      if (value === "none" || value === "currentColor" || !rgb(value)) return all;
      const to = o.ink(value, attr);
      return to === void 0 ? all : ` ${attr}="${to}"`;
    });
  }
  var opacities = (svg, f3) => svg.replace(/\s(opacity|stroke-opacity|fill-opacity)="([\d.]+)"/g, (_, a, v) => ` ${a}="${+f3(Number(v)).toFixed(2)}"`);
  var n = (v) => (Math.round(v * 100) / 100).toString();
  var t1 = (v) => {
    const r2 = Math.round(v * 10) / 10;
    const s = r2.toString();
    return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? `-${s.slice(2)}` : s;
  };
  function poly(points, dx = 0, dy = 0, close = true) {
    if (!points.length) return "";
    let px = Math.round(((points[0]?.[0] ?? 0) + dx) * 10);
    let py = Math.round(((points[0]?.[1] ?? 0) + dy) * 10);
    let d = `M${t1(px / 10)} ${t1(py / 10)}l`;
    for (const [x, y] of points.slice(1)) {
      const qx = Math.round((x + dx) * 10);
      const qy = Math.round((y + dy) * 10);
      const sx = t1((qx - px) / 10);
      const sy = t1((qy - py) / 10);
      d += `${sx}${sy.startsWith("-") ? "" : " "}${sy} `;
      px = qx;
      py = qy;
    }
    return d.trimEnd() + (close ? "z" : "");
  }

  // ../hooks/art/roles.ts
  var r = (family, depth) => ({ family, depth });
  var ROLES = {
    // Forest at dawn.
    "forest.sky": r("sky", 0),
    "forest.sun": r("body", 0),
    "forest.clouds": r("cloud", 0.05),
    "forest.ridge": r("land", 0.1),
    "forest.firs-far": r("foliage", 0.15),
    "forest.mist": r("air", 0.2),
    "forest.firs-mid": r("foliage", 0.3),
    "forest.fir-trunks": r("bark", 0.45),
    "forest.firs": r("foliage", 0.45),
    "forest.shafts": r("beam", 0.4),
    "forest.motes": r("life", 0.5),
    "forest.meadow": r("grass", 0.5),
    "forest.shrubs": r("foliage", 0.5),
    "forest.groundmist": r("air", 0.5),
    "forest.path": r("ground", 0.6),
    "forest.litter": r("mark", 0.6),
    "forest.sunpatch": r("glow", 0.6),
    "forest.grass": r("grass", 0.85),
    "forest.ferns": r("foliage", 0.95),
    "forest.trunks": r("bark", 1),
    "forest.canopy": r("foliage", 1),
    // Earthrise on the moon.
    "space.sky": r("sky", 0),
    "space.milkyway": r("stars", 0),
    "space.stars": r("stars", 0),
    "space.earth": r("body", 0),
    "space.regolith": r("ground", 0.5),
    "space.swells": r("land", 0.5),
    "space.craters": r("rock", 0.6),
    "space.rocks": r("rock", 0.7),
    "space.pits": r("mark", 0.6),
    "space.base": r("built", 0.4),
    "space.lamps": r("lamp", 0.4),
    // Blue hour in the city.
    "city.sky": r("sky", 0),
    "city.stars": r("stars", 0),
    "city.clouds": r("cloud", 0.05),
    "city.towers-far": r("built", 0.15),
    "city.windows-far": r("lamp", 0.15),
    "city.spire": r("built", 0.25),
    "city.towers-mid": r("built", 0.3),
    "city.windows-mid": r("lamp", 0.3),
    "city.rail": r("built", 0.4),
    "city.train": r("built", 0.4),
    "city.towers-low": r("built", 0.45),
    "city.windows-low": r("lamp", 0.45),
    "city.street": r("ground", 0.7),
    "city.reflection": r("water", 0.7),
    "city.curb": r("built", 0.6),
    "city.lamps": r("lamp", 0.8),
    // Mesa sunset.
    "desert.sky": r("sky", 0),
    "desert.clouds": r("cloud", 0.05),
    "desert.sun": r("body", 0),
    "desert.hawk": r("life", 0.1),
    "desert.mesas-far": r("rock", 0.15),
    "desert.glare": r("glow", 0.2),
    "desert.mesas": r("rock", 0.35),
    "desert.sand": r("ground", 0.6),
    "desert.ripples": r("mark", 0.6),
    "desert.scrub": r("foliage", 0.7),
    "desert.saguaro": r("foliage", 0.85),
    "desert.boulders": r("rock", 1),
    // Night eruption.
    "volcano.sky": r("sky", 0),
    "volcano.stars": r("stars", 0),
    "volcano.glow": r("glow", 0),
    "volcano.ridges": r("land", 0.15),
    "volcano.puffs": r("cloud", 0.2),
    "volcano.ash": r("cloud", 0.2),
    "volcano.crater": r("fire", 0.25),
    "volcano.cone": r("rock", 0.3),
    "volcano.lava": r("fire", 0.3),
    "volcano.embers": r("fire", 0.3),
    "volcano.plain": r("ground", 0.6),
    "volcano.cracks": r("fire", 0.6),
    "volcano.stream": r("fire", 0.7),
    "volcano.boulders": r("rock", 1),
    // The lab at night.
    "lab.wall": r("built", 0.2),
    "lab.window": r("glass", 0.2),
    "lab.board": r("built", 0.25),
    "lab.bench": r("built", 0.5),
    "lab.books": r("built", 0.45),
    "lab.lamp": r("built", 0.45),
    "lab.mug": r("built", 0.45),
    "lab.monitors": r("glass", 0.45),
    "lab.rack": r("built", 0.4),
    "lab.pool": r("glow", 0.5),
    "lab.cone": r("beam", 0.5),
    "lab.motes": r("life", 0.5),
    "lab.floor": r("ground", 0.8),
    "lab.reflection": r("water", 0.8),
    // A village under the moon.
    "night.sky": r("sky", 0),
    "night.stars": r("stars", 0),
    "night.moon": r("body", 0),
    "night.clouds": r("cloud", 0.05),
    "night.hills-far": r("land", 0.1),
    "night.mist": r("air", 0.2),
    "night.hill": r("land", 0.3),
    "night.crest": r("mark", 0.3),
    "night.trees": r("foliage", 0.3),
    "night.cottages": r("built", 0.3),
    "night.meadow": r("grass", 0.6),
    "night.path": r("ground", 0.6),
    "night.grass": r("grass", 0.95),
    "night.oak": r("foliage", 1),
    "night.fireflies": r("life", 0.7),
    // Every scene.
    particles: r("life", 0.6),
    lens: r("lens", 1)
  };
  var LIT = { el: (_role, svg) => svg, defs: (svg) => svg };

  // ../hooks/art/painter.ts
  var POOL = /<ellipse\b(?=[^>]*\sfilter="url\(#sc-soft\)")(?=[^>]*\scx="([\d.-]+)")(?=[^>]*\scy="([\d.-]+)")(?=[^>]*\srx="([\d.-]+)")(?=[^>]*\sry="([\d.-]+)")[^>]*\/>/g;
  var CONE = /<path\b[^>]*fill="url\(#sc-cone\)"[^>]*\/>/g;
  var ANIM = /<(animate|animateTransform|animateMotion)\b[^>]*\/>/g;
  function painter(rules, suffix) {
    const known = /* @__PURE__ */ new Map();
    const made2 = /* @__PURE__ */ new Set();
    const remapGradient = (id, family, depth) => {
      const g = known.get(id);
      if (!g) return void 0;
      const nid = `${id}-${suffix}-${family}`;
      if (made2.has(nid)) return `url(#${nid})`;
      made2.add(nid);
      const stops = g.stops.map((s) => `<stop offset="${s.offset}" stop-color="${rules.ink(s.color, family, depth, "stop-color")}"${s.opacity < 1 ? ` stop-opacity="${+(rules.opacity?.(family, s.opacity) ?? s.opacity).toFixed(3)}"` : ""}/>`).join("");
      pending2 += `<${g.tag} id="${nid}" ${g.attrs}>${stops}</${g.tag}>`;
      return `url(#${nid})`;
    };
    let pending2 = "";
    const pool = (e, depth) => {
      const lamp = rules.ink("#ffd8a0", "lamp", depth, "fill");
      const at = `cx="${+e.cx.toFixed(1)}" cy="${+e.cy.toFixed(1)}"`;
      return `<ellipse ${at} rx="${+e.rx.toFixed(1)}" ry="${+e.ry.toFixed(1)}" fill="${lamp}" opacity=".28"/><ellipse ${at} rx="${+(e.rx * 0.55).toFixed(1)}" ry="${+(e.ry * 0.55).toFixed(1)}" fill="${lamp}" opacity=".4"/>`;
    };
    const general = (svg, family, depth) => {
      for (const [id, g] of gradients(svg)) known.set(id, g);
      let out = stripLight(dropBlooms(svg)).replace(/<rect\b[^>]*fill="url\(#sc-wet\)"[^>]*\/>/g, "");
      out = repaint(out, {
        ink: (color, attr) => rules.ink(color, family, depth, attr),
        url: (id, attr) => attr === "stop-color" ? void 0 : rules.url?.(id, family, attr, known.get(id)) ?? remapGradient(id, family, depth)
      });
      if (rules.opacity) out = opacities(out, (v) => rules.opacity?.(family, v) ?? v);
      if (rules.post) out = rules.post(out, family, depth);
      const line = rules.line?.(family, depth) ?? "";
      if (line) {
        const lim = rules.lineless ?? 0.6;
        out = out.replace(/<(path|rect|circle|ellipse|use)\b([^>]*?)(\/?)>/g, (all, tag, attrs, close) => {
          const op = /\sopacity="([\d.]+)"/.exec(attrs);
          if (/\sstroke=/.test(attrs) || !op || Number(op[1]) >= lim) return all;
          return rules.faint === "hide" ? `<${tag}${attrs} visibility="hidden"${close}>` : `<${tag}${attrs} stroke="none"${close}>`;
        });
        out = `<g ${line}>${out}</g>`;
      }
      const defs = pending2;
      pending2 = "";
      return (defs ? `<defs>${defs}</defs>` : "") + out;
    };
    return {
      el(role, svg, meta = {}) {
        const info = ROLES[role];
        if (role === "lab.cone") return "";
        let lit = "";
        if (role === "city.lamps" || role === "lab.pool") {
          svg = svg.replace(CONE, "").replace(POOL, (_all, cx, cy, rx, ry) => {
            lit += (rules.pool ?? pool)({ cx: +cx, cy: +cy, rx: +rx, ry: +ry }, info.depth);
            return "";
          });
          if (!svg.trim()) return lit;
        }
        const c = {
          role,
          family: info.family,
          depth: info.depth,
          meta,
          repaint: (s) => general(s, info.family, info.depth),
          motion: (s) => (s.match(ANIM) ?? []).join(""),
          gradient: (s) => known.get(/url\(#([^)]+)\)/.exec(s)?.[1] ?? "")
        };
        const own = rules.redraw?.[role] ?? rules.redraw?.[info.family];
        if (own) {
          for (const [id, g] of gradients(svg)) known.set(id, g);
          const out = own(svg, c);
          const defs = pending2;
          pending2 = "";
          return lit + (defs ? `<defs>${defs}</defs>` : "") + out;
        }
        return lit + general(svg, info.family, info.depth);
      },
      defs(svg) {
        for (const [id, g] of gradients(svg)) known.set(id, g);
        const noFilters = svg.replace(/<filter\b[^>]*>[\s\S]*?<\/filter>/g, "");
        const kept = noFilters.replace(
          /<(linearGradient|radialGradient)\b[^>]*?id="([^"]+)"[\s\S]*?<\/\1>/g,
          (all, _t, id) => noFilters.includes(`url(#${id})`) ? all : ""
        );
        const fam = rules.templateFamily ?? "foliage";
        const held = [];
        const shielded = kept.replace(/<(mask|clipPath|linearGradient|radialGradient)\b[\s\S]*?<\/\1>/g, (m) => `\0${held.push(stripLight(m)) - 1}\0`);
        return repaint(shielded, { ink: (color, attr) => rules.ink(color, fam, 0.5, attr) }).replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)] ?? "");
      }
    };
  }

  // ../hooks/styles/aero.ts
  var K = { light: "#ffbd5c", mid: "#ff7f17", deep: "#e0480a", edge: "#b23a06", eye: "#5c1d05" };
  var SANS = "'Segoe UI', 'Frutiger', 'Myriad Pro', 'Helvetica Neue', Arial, sans-serif";
  var R = {
    green: ["#12501c", "#1b7024", "#28922a", "#46b232", "#84d44a", "#c4ee80"],
    aqua: ["#063456", "#0a5a88", "#1280b8", "#2aa4da", "#6ccbee", "#c4eefc"],
    steel: ["#0f2a46", "#1b4670", "#2e6896", "#4f8cb8", "#86b6d8", "#cfe6f4"],
    // Pearl: Aero's interiors and buildings, cool silvers and soft blues rather than raw cyan.
    pearl: ["#16324e", "#284e72", "#47729a", "#7097bc", "#a6c4dc", "#d8e8f4"],
    // Moonlit green: the Frutiger Aurora meadow, deep teal greens.
    night: ["#072a1e", "#0c402c", "#13583a", "#1d7048", "#2f8a5a", "#58aa78"],
    // Glass: the city's towers, clear aqua curtain walls.
    glass: ["#0a3a60", "#11598a", "#2079b0", "#4499cc", "#82c4e6", "#cbe9f8"],
    // Basalt: dark rock under a night sky, a glassy blue-violet, never brown.
    basalt: ["#121833", "#1e2748", "#2d3a64", "#43548a", "#6577a8", "#98a8cc"],
    warm: ["#8a2a04", "#b23a06", K.deep, K.mid, K.light, "#ffe6b0"],
    sand: ["#5a3a12", "#8a5e22", "#c08a3a", "#e6b864", "#f6dca0", "#fff4d8"]
  };
  var night = false;
  function tone(color, family) {
    let t = Math.min(0.99, Math.pow(lum(color), 0.9) * 1.1);
    const warm = isWarm(color);
    switch (family) {
      // Lava glows tangerine to amber, never white; a lamp burns a little hotter.
      case "fire":
        return step(R.warm, Math.min(0.8, Math.max(0.4, t)));
      case "lamp":
        return step(R.warm, Math.max(0.5, t));
      case "foliage":
      case "grass":
        return step(night ? R.night : R.green, t);
      // The land is never chalk: its palest tone stays the ramp's fourth, so it keeps its color under the sky.
      case "land":
        t = Math.min(t, night ? 0.5 : 0.66);
        if (warm && lum(color) < 0.4) return step(R.basalt, t);
        return warm ? step(R.sand, t) : isGreen(color) ? step(night ? R.night : R.green, t) : step(R.steel, t);
      case "water":
      case "glass":
        return step(R.aqua, t);
      case "bark":
        return step(R.sand, t * 0.6);
      case "ground":
      case "rock":
      case "mark":
        t = Math.min(t, 0.66);
        if (!isGreen(color) && (warm || brownish(color)) && lum(color) < 0.4) return step(R.basalt, t);
        return isGreen(color) ? step(R.green, t) : warm || brownish(color) ? step(R.sand, t) : step(R.steel, t);
      case "built":
        return warm && lum(color) > 0.5 ? step(R.sand, t) : step(R.pearl, Math.min(t, 0.84));
      default:
        return warm ? step(R.warm, t) : isGreen(color) ? step(R.green, t) : step(R.aqua, t);
    }
  }
  function brownish(color) {
    const c = color.replace("#", "");
    if (c.length !== 6) return false;
    return parseInt(c.slice(0, 2), 16) > parseInt(c.slice(4, 6), 16) + 16;
  }
  var made = /* @__PURE__ */ new Set();
  var pending = "";
  function glossy(color) {
    const id = `ae-g${color.slice(1)}`;
    if (!made.has(id)) {
      made.add(id);
      pending += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(color, "#ffffff", 0.28)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, "#001428", 0.22)}"/></linearGradient>`;
    }
    return `url(#${id})`;
  }
  function sky(svg, c) {
    const g = c.gradient(svg);
    const stops = g?.stops ?? [];
    const top = stops[0]?.color ?? "#3060a0";
    const low = stops[stops.length - 1]?.color ?? "#80a0c0";
    const sw = c.meta.sw ?? 640;
    night = lum(top) < 0.2 && lum(low) < 0.45;
    const dusk = !night && isWarm(low);
    if (night) {
      return `<rect width="${sw}" height="128" fill="url(#ae-night)"/><g opacity=".7"><path d="M-20 34C${n(sw * 0.2)} 6 ${n(sw * 0.45)} 54 ${n(sw * 0.7)} 20S${n(sw + 20)} 30 ${n(sw + 20)} 30v14C${n(sw * 0.8)} 34 ${n(sw * 0.6)} 64 ${n(sw * 0.35)} 40S-20 46 -20 46z" fill="url(#ae-aurora)"><animate attributeName="opacity" values=".8;1;.8" dur="9s" repeatCount="indefinite"/></path><path d="M-20 58C${n(sw * 0.3)} 36 ${n(sw * 0.55)} 72 ${n(sw + 20)} 44v8C${n(sw * 0.55)} 82 ${n(sw * 0.3)} 46 -20 66z" fill="url(#ae-aurora2)" opacity=".7"/></g>`;
    }
    return `<rect width="${sw}" height="128" fill="url(#${dusk ? "ae-dusk" : "ae-day"})"/>`;
  }
  function bokeh(svg, c) {
    const discs = (pts) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3"/>`).join("");
    return c.repaint(svg).replace(/<(path|rect)\b([^>]*?)(\/?)>/g, (_all, tag, attrs, close) => {
      const pts = tag === "path" ? [...(/\sd="([^"]*)"/.exec(attrs)?.[1] ?? "").matchAll(/M([\d.-]+) ([\d.-]+)/g)].map((m) => [m[1], m[2]]) : [[/\sx="([^"]*)"/.exec(attrs)?.[1] ?? "0", /\sy="([^"]*)"/.exec(attrs)?.[1] ?? "0"]];
      const kept = attrs.replace(/\s(d|x|y|width|height|fill|stroke|stroke-width|stroke-linecap)="[^"]*"/g, "");
      return `<g${kept} fill="url(#ae-bokeh)">${discs(pts)}${close ? "</g>" : ""}`;
    }).replace(/<\/(path|rect)>/g, "</g>");
  }
  function swap(svg, from, to) {
    return from.reduce((out, color, i) => out.split(`url(#ae-g${color.slice(1)})`).join(glossy(to[i] ?? color)), svg);
  }
  var scenery = () => {
    night = false;
    made = /* @__PURE__ */ new Set();
    pending = "";
    const p = painter(
      {
        ink: (color, family, _depth, attr) => (
          // A gradient can fill or stroke, but not be a currentColor: lines, stops and colors take the plain tone.
          attr !== "fill" ? tone(color, family) : family === "stars" || family === "life" ? "#ffffff" : glossy(tone(color, family))
        ),
        // A gradient of the lit scene becomes one glossy surface in its overall tone; a wash of light is not drawn.
        // A radial wash of light stays a soft falloff, carried over in Aero's colors.
        url: (_id, family, attr, g) => g?.tag === "radialGradient" ? void 0 : attr === "stroke" ? tone(g ? meanOf(g).color : "#808080", family) : g && meanOf(g).opacity < 0.5 ? "none" : glossy(tone(g ? meanOf(g).color : "#808080", family)),
        // The gloss: a thin white highlight round the nearer surfaces, never a dark outline.
        line: (family, depth) => family === "sky" || family === "stars" || family === "life" || family === "lens" || family === "air" || family === "beam" || family === "glow" || family === "fire" || family === "lamp" || depth < 0.25 ? "" : `stroke="#ffffff" stroke-opacity="${n(0.18 + depth * 0.22)}" stroke-width="${n(0.35 + depth * 0.3)}" stroke-linejoin="round"`,
        lineless: 0.6,
        faint: "hide",
        redraw: {
          sky,
          // The city's towers are glass, and the volcano's cone dark rock under the night.
          "city.towers-far": (svg, c) => swap(c.repaint(svg), R.pearl, R.glass),
          "city.towers-mid": (svg, c) => swap(c.repaint(svg), R.pearl, R.glass),
          "city.towers-low": (svg, c) => swap(c.repaint(svg), R.pearl, R.glass),
          "city.spire": (svg, c) => swap(c.repaint(svg), R.pearl, R.glass),
          "volcano.cone": (svg, c) => swap(c.repaint(svg), R.sand, R.basalt),
          lens: () => "",
          glow: () => "",
          stars: bokeh,
          // A white sun with its bloom and a lens flare toward the middle of the stage; the Earth a glossy globe.
          body: (_svg, c) => {
            const cx = c.meta.cx ?? 0;
            const cy = c.meta.cy ?? 0;
            const r2 = c.meta.r ?? 8;
            if (c.role === "space.earth") return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="url(#ae-earth)"/><ellipse cx="${n(cx - r2 * 0.25)}" cy="${n(cy - r2 * 0.55)}" rx="${n(r2 * 0.55)}" ry="${n(r2 * 0.28)}" fill="#fff" opacity=".45"/>`;
            if (c.meta.part === "halo") return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 6)}" fill="url(#ae-flare)"/>`;
            if (c.role === "night.moon") return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 3)}" fill="url(#ae-flare)" opacity=".6"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 1.1)}" fill="#eaf8ff"/>`;
            const rings = [0.3, 0.55, 0.8].map((k, i) => `<circle cx="${n(cx + (320 - cx) * k)}" cy="${n(cy + (80 - cy) * k)}" r="${[4, 8, 3][i]}" fill="${i === 1 ? "url(#ae-ring)" : "none"}" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>`).join("");
            return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 3)}" fill="url(#ae-flare)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 1.05)}" fill="#ffffff"/>` + rings;
          },
          // Cumulus: white, its underside a soft blue.
          // At night, and in the ash over the volcano, the cumulus is moonlit: a soft blue rather than white.
          cloud: (svg, c) => {
            const lit = /\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1] ?? c.gradient(svg)?.stops[0]?.color ?? "#ffffff";
            const fill = lum(lit) < 0.4 ? "url(#ae-cloudn)" : "url(#ae-cloud)";
            return `<g>${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${fill}"`).replace(/\sopacity="[^"]*"/g, "")}</g>`;
          },
          air: (svg, c) => `<g opacity=".22">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="#cdeeff"')}</g>`,
          // Light falling through the air: soft white beams.
          beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="url(#ae-beam)"')}</g>`
        }
      },
      "ae"
    );
    return {
      el: (role, svg, meta) => {
        const out = p.el(role, svg, meta);
        const defs = pending;
        pending = "";
        return (defs ? `<defs>${defs}</defs>` : "") + out;
      },
      defs: p.defs
    };
  };
  var hero = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    const body = m.parts.find((p) => p.name === "body");
    let cap = "";
    if (body) {
      const xs = body.hull.map((p) => p[0] + cx);
      const ys = body.hull.map((p) => p[1] + floor);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      const y0 = Math.min(...ys);
      const y1 = Math.max(...ys);
      const w = x1 - x0;
      const h = y1 - y0;
      cap = `<rect x="${t1(x0 + w * 0.1)}" y="${t1(y0 + h * 0.06)}" width="${t1(w * 0.8)}" height="${t1(h * 0.4)}" rx="${t1(h * 0.18)}" fill="url(#ae-cap)"/><ellipse cx="${t1(x0 + w * 0.25)}" cy="${t1(y0 + h * 0.18)}" rx="${t1(w * 0.07)}" ry="${t1(h * 0.05)}" fill="#fff" opacity=".95"/>`;
    }
    const faces = outlinedFaces(m).filter((f3) => f3.part === "body" && f3.name !== "front").map((f3) => `<path fill="${f3.name === "top" ? "#ffeec8" : "#aa3205"}" opacity="${f3.name === "top" ? 0.3 : n(0.22 * (1 - f3.light))}" d="${poly(f3.pts, cx, floor)}"/>`).join("");
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="url(#ae-eye)" stroke="#ffe6c8" stroke-opacity=".55" stroke-width=".5" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx - 0.2)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor - 0.2)}" r=".6" fill="#fff"/>` : `<path fill="none" stroke="#7a2809" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
    ).join("");
    return `<path fill="url(#ae-shadow)" d="${poly(m.shadow, cx, floor)}"/><path fill="${K.edge}" stroke="${K.edge}" stroke-width="2.4" stroke-linejoin="round" d="${hulls}"/><path fill="url(#ae-jelly)" stroke="url(#ae-jelly)" stroke-width="1.2" stroke-linejoin="round" d="${hulls}"/>` + faces + cap + eyes;
  };
  var escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var AERO = {
    name: "aero",
    label: "Frutiger Aero",
    voice: "an upbeat mid-2000s eco-tech ad",
    cell: "solid",
    figure: "3d",
    font: SANS,
    charW: 5.2,
    caption: { fill: "#f4fbff", stroke: "#2a8ad8", ink: "#14385a", radius: 8 },
    paper: { card: "#f4fbff", ink: "#14385a", kinds: { code: "#0a7a8a", path: "#1d6fc4", fn: "#6a4ac4", num: "#e0702a", bad: "#d0303a", good: "#2e9a2e", face: "#e0702a" } },
    inset: 4,
    titleColor: "#ffffff",
    art: {
      painter: scenery,
      hero,
      sky: "#0d78dc",
      ground: "#1f8a1c",
      defs: () => `<linearGradient id="ae-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a62c4"/><stop offset=".4" stop-color="#2f8ae0"/><stop offset=".75" stop-color="#72c2f0"/><stop offset="1" stop-color="#c6ecfb"/></linearGradient><linearGradient id="ae-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a3a8a"/><stop offset=".45" stop-color="#2a7ad0"/><stop offset=".75" stop-color="#8ac8ea"/><stop offset="1" stop-color="#ffc878"/></linearGradient><linearGradient id="ae-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020c2a"/><stop offset=".55" stop-color="#06305a"/><stop offset="1" stop-color="#0a6a7a"/></linearGradient><linearGradient id="ae-aurora" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3cff9a" stop-opacity="0"/><stop offset=".3" stop-color="#3cff9a" stop-opacity=".55"/><stop offset=".65" stop-color="#3ce0ff" stop-opacity=".5"/><stop offset="1" stop-color="#3ce0ff" stop-opacity="0"/></linearGradient><linearGradient id="ae-aurora2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5affd0" stop-opacity="0"/><stop offset=".5" stop-color="#5affd0" stop-opacity=".4"/><stop offset="1" stop-color="#7a9aff" stop-opacity="0"/></linearGradient><linearGradient id="ae-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f4fbff"/><stop offset="1" stop-color="#b8dcf4"/></linearGradient><linearGradient id="ae-cloudn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8dcf0"/><stop offset=".6" stop-color="#8eaad0"/><stop offset="1" stop-color="#5a76a8"/></linearGradient><linearGradient id="ae-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient><radialGradient id="ae-bokeh"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#cff4ff" stop-opacity=".5"/><stop offset="1" stop-color="#cff4ff" stop-opacity="0"/></radialGradient><radialGradient id="ae-ring"><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#bff0ff" stop-opacity=".35"/></radialGradient><radialGradient id="ae-flare"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".15" stop-color="#fffff0" stop-opacity=".6"/><stop offset=".45" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="ae-earth" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#9fe0f2"/><stop offset=".6" stop-color="#1478a8"/><stop offset="1" stop-color="#0a3d73"/></radialGradient><linearGradient id="ae-jelly" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="${K.light}"/><stop offset=".4" stop-color="${K.mid}"/><stop offset="1" stop-color="${K.deep}"/></linearGradient><linearGradient id="ae-cap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="ae-eye" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c0c02"/><stop offset=".6" stop-color="${K.eye}"/><stop offset="1" stop-color="#b8460f"/></linearGradient><radialGradient id="ae-shadow"><stop offset="0" stop-color="#ff9628" stop-opacity=".5"/><stop offset=".6" stop-color="#1e5a0a" stop-opacity=".25"/><stop offset="1" stop-color="#1e5a0a" stop-opacity="0"/></radialGradient><linearGradient id="ae-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity=".04"/><stop offset=".31" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="ae-pill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ad0f7"/><stop offset=".5" stop-color="#2a8ad8"/><stop offset="1" stop-color="#1a6ab8"/></linearGradient>`
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#ae-gloss)"/>`,
    frame: (sw, h) => `<rect x="2" y="2" width="${sw - 4}" height="${h - 4}" rx="8" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.4"/><rect x="3.4" y="3.4" width="${sw - 6.8}" height="${h - 6.8}" rx="7" fill="none" stroke="#2a8ad8" stroke-opacity=".7" stroke-width=".8"/>`,
    tag: (text, inset) => {
      const x = inset + 5;
      const y = inset + 4;
      const w = text.length * 5.6 + 14;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="13" rx="6.5" fill="url(#ae-pill)" stroke="#fff" stroke-width=".8"/><rect x="${x + 2}" y="${y + 1}" width="${n(w - 4)}" height="5" rx="2.5" fill="#fff" opacity=".4"/><text x="${x + 7}" y="${y + 9.4}" font-family="${SANS}" font-size="8" font-weight="700" fill="#fff">${escape(text)}</text>`,
        w: x + w + 4,
        h: y + 17
      };
    },
    bubble: {
      font: SANS,
      size: 9,
      charW: 5.2,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => (
        // Frosted glass: a pale panel, a gloss along its top half, a blue rim and a white one.
        `<path fill="#f4fbff" fill-opacity=".9" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="7" fill="#f4fbff" fill-opacity=".9" stroke="#2a8ad8" stroke-width="1"/><rect x="${n(x + 1.5)}" y="${n(y + 1.2)}" width="${w - 3}" height="${n(h * 0.42)}" rx="5.5" fill="#fff" opacity=".7"/>`
      )
    }
  };

  // ../hooks/styles/blueprint.ts
  var SHEET = "#1f4f9a";
  var LINE = "#e8f0ff";
  var DARK = "#173e80";
  var SANS2 = "'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  var PHANTOM = 'stroke-dasharray="7 1.8 1.4 1.8 1.4 1.8"';
  var UNLINED = ["sky", "stars", "life", "lens", "fire", "lamp", "glow", "beam", "air", "cloud", "body", "water", "mark"];
  var DENSE = ["foliage", "grass"];
  var denseLine = (depth) => `stroke="${LINE}" stroke-width="${n(0.12 + depth * 0.16)}" stroke-opacity="${n(0.5 + depth * 0.3)}" stroke-linejoin="round"`;
  var HATCHED = ["rock", "built", "land", "bark"];
  function ink(color, family, attr) {
    const l = lum(color);
    if (attr === "stroke") return LINE;
    if (attr === "color") return SHEET;
    switch (family) {
      case "stars":
      case "life":
      case "fire":
      case "lamp":
        return LINE;
      case "glow":
      case "beam":
      case "air":
        return "none";
      case "ground":
      case "grass":
        return l > 0.8 ? "none" : "url(#bp-earth)";
      default:
        if (l > 0.78) return "none";
        if (HATCHED.includes(family) && l < 0.2) return "url(#bp-hatch)";
        return "url(#bp-sheet)";
    }
  }
  var lineFor = (depth) => `stroke="${LINE}" stroke-width="${n(0.22 + depth * 0.5)}" stroke-opacity="${n(0.55 + depth * 0.4)}" stroke-linejoin="round"`;
  var phantom = (svg, c, opacity = 0.6) => `<g fill="none" stroke="${LINE}" stroke-opacity="${opacity}" stroke-width=".4" ${PHANTOM}>` + c.repaint(svg).replace(/\sfill="[^"]*"/g, ' fill="none"').replace(/\sstroke="[^"]*"/g, "").replace(/\sstroke-width="[^"]*"/g, "") + `</g>`;
  var centred = (cx, cy, r2) => {
    const w = 0.7;
    const m = r2 + 3;
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="url(#bp-sheet)" stroke="${LINE}" stroke-width="${w}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 1.45)}" fill="none" stroke="${LINE}" stroke-opacity=".5" stroke-width=".35" stroke-dasharray="1.3 1.3"/><path stroke="${LINE}" stroke-opacity=".75" stroke-width=".35" stroke-dasharray="2.2 .9 .5 .9" d="M${n(cx - m)} ${n(cy)}h${n(m * 2)}M${n(cx)} ${n(cy - m)}v${n(m * 2)}"/>`;
  };
  var scenery2 = (_sw) => painter(
    {
      ink: (color, family, _depth, attr) => ink(color, family, attr),
      // A gradient fill is light or a lit surface: lamps' cones and pools are left out, surfaces knocked out.
      url: (_id, family, attr) => attr === "stroke" ? LINE : family === "lamp" ? "none" : ink("#808080", family, attr),
      line: (family, depth) => UNLINED.includes(family) ? "" : DENSE.includes(family) ? denseLine(depth) : lineFor(depth),
      lineless: 0.6,
      faint: "hide",
      templateFamily: "foliage",
      redraw: {
        // The sky is the bare sheet, its grid and all.
        sky: (_svg, c) => `<rect width="${c.meta.sw ?? 640}" height="128" fill="url(#bp-sheet)"/>`,
        lens: () => "",
        glow: () => "",
        // A sun or moon drawn as a circle with its centre marked; its halo is light, and is left out.
        body: (_svg, c) => {
          if (c.meta.part === "halo") return "";
          const r2 = (c.meta.r ?? 8) * (c.role === "space.earth" ? 1 : 1.3);
          const cx = c.meta.cx ?? 0;
          const cy = c.meta.cy ?? 0;
          if (c.role !== "space.earth") return centred(cx, cy, r2);
          return centred(cx, cy, r2) + `<g fill="none" stroke="${LINE}" stroke-opacity=".6" stroke-width=".35"><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r2)}" ry="${n(r2 * 0.3)}"/><ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(r2 * 0.42)}" ry="${n(r2)}"/></g>`;
        },
        cloud: (svg, c) => phantom(svg, c, 0.55),
        beam: (svg, c) => phantom(svg, c, 0.4),
        air: (svg, c) => {
          const y = c.meta.y ?? 80;
          const h = c.meta.h ?? 12;
          const w = c.meta.sw ?? 640;
          return `<g fill="none" stroke="${LINE}" stroke-opacity=".45" stroke-width=".4" ${PHANTOM}><path d="M${n(-20)} ${n(y + h * 0.4)}H${n(w + 20)}M${n(-10)} ${n(y + h * 0.75)}H${n(w + 20)}"/>${c.motion(svg)}</g>`;
        },
        "space.milkyway": (svg, c) => phantom(svg, c, 0.35),
        water: (svg, c) => `<g opacity=".45">${c.repaint(svg)}</g>`,
        mark: (svg, c) => `<g stroke-opacity=".6">${c.repaint(svg).replace(/\sstroke-width="([\d.]+)"/g, (_, w) => ` stroke-width="${Math.min(0.5, +w)}"`)}</g>`
      }
    },
    "bp"
  );
  var hero2 = () => (m, cx, floor) => {
    const sil = 0.75;
    const crease = 0.4;
    const seg = (e) => poly([e.a, e.b], cx, floor, false);
    let parts = "";
    let hidden = "";
    for (const pt of outlinedOrder(m)) {
      parts += `<path fill="url(#bp-sheet)" d="${poly(pt.hull, cx, floor)}"/>`;
      const c = pt.edges.filter((e) => e.kind === "crease").map(seg).join("");
      if (c) parts += `<path class="c" d="${c}"/>`;
      hidden += pt.edges.filter((e) => e.kind === "hidden").map(seg).join("");
    }
    const eyes = m.eyes.map((e) => e.poly ? `<path fill="none" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" d="${poly(e.line ?? [], cx, floor, false)}"/>`).join("");
    const body = m.parts.find((p) => p.name === "body");
    let axis = "";
    if (body) {
      const xs = body.hull.map((p) => p[0]);
      const ys = body.hull.map((p) => p[1]);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2 + cx;
      axis = `<path stroke-width=".3" stroke-opacity=".45" stroke-dasharray="6 1.6 1.2 1.6" d="M${t1(mx)} ${t1(Math.min(...ys) + floor - 3)}V${t1(floor + 2)}"/>`;
    }
    return `<style>.c{stroke-width:${crease}px;stroke-opacity:.82}</style><g fill="none" stroke="${LINE}" stroke-width="${sil}" stroke-linecap="round" stroke-linejoin="round">` + parts + (hidden ? `<path stroke-width=".35" stroke-opacity=".5" stroke-dasharray="1.6 1.2" d="${hidden}"/>` : "") + `<g stroke-width=".55">${eyes}</g>` + axis + `</g>`;
  };
  var escape2 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var BLUEPRINT = {
    name: "blueprint",
    label: "Blueprint",
    voice: "an engineer annotating a technical drawing",
    cell: "solid",
    figure: "3d",
    font: SANS2,
    charW: 5.4,
    caption: { fill: DARK, stroke: LINE, ink: LINE, radius: 0 },
    paper: { card: DARK, ink: LINE, kinds: { code: "#bfe6ff", path: "#a8d8ff", fn: "#d8c8ff", num: "#ffffff", bad: "#ffb4a0", good: "#b8ffd0", face: "#ffe08a" } },
    inset: 5,
    titleColor: LINE,
    art: {
      painter: scenery2,
      hero: hero2,
      sky: SHEET,
      ground: SHEET,
      defs: () => (
        // The sheet: Prussian ground, a fine grid every 3.2 units and a heavier line every fifth.
        `<pattern id="bp-sheet" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${SHEET}"/><path d="M3.2 0v16M6.4 0v16M9.6 0v16M12.8 0v16M0 3.2h16M0 6.4h16M0 9.6h16M0 12.8h16" stroke="${LINE}" stroke-opacity=".075" stroke-width=".38"/><path d="M0 0v16M0 0h16" stroke="${LINE}" stroke-opacity=".17" stroke-width=".6"/></pattern><pattern id="bp-hatch" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="url(#bp-sheet)"/><path d="M-4 4l8 -8M0 16L16 0M12 20l8 -8M-4 12l8 -8M4 20L20 4" stroke="${LINE}" stroke-opacity=".38" stroke-width=".35"/></pattern><pattern id="bp-earth" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="url(#bp-sheet)"/><path d="M3 1l-2.6 2.8" stroke="${LINE}" stroke-opacity=".32" stroke-width=".35"/></pattern><filter id="bp-mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .03" numOctaves="4" seed="13"/><feColorMatrix values="0 0 0 0 .6  0 0 0 0 .78  0 0 0 0 1  0 0 0 -2.2 1.15"/></filter><radialGradient id="bp-vignette" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#08184a" stop-opacity="0"/><stop offset="1" stop-color="#08184a" stop-opacity=".45"/></radialGradient>`
      )
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#bp-mottle)" opacity=".16"/><rect width="${sw}" height="${h}" fill="url(#bp-vignette)"/>`,
    frame: (sw, h) => `<rect x="2.5" y="2.5" width="${sw - 5}" height="${h - 5}" fill="none" stroke="${LINE}" stroke-opacity=".9" stroke-width="1.1"/><rect x="5" y="5" width="${sw - 10}" height="${h - 10}" fill="none" stroke="${LINE}" stroke-opacity=".8" stroke-width=".45"/>`,
    tag: (text, inset) => {
      const t = `FIG. 1 \u2014 ${text.toUpperCase()}`;
      const w = t.length * 5.1 + 10;
      const x = inset + 4;
      const y = inset + 4;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="12" fill="${DARK}" fill-opacity=".7" stroke="${LINE}" stroke-width=".8"/><text x="${x + 5}" y="${y + 8.6}" font-family="${SANS2}" font-size="7" font-weight="700" letter-spacing=".9" fill="${LINE}">${escape2(t)}</text>`,
        w: x + w + 4,
        h: y + 16
      };
    },
    bubble: {
      font: SANS2,
      size: 8.4,
      charW: 5.6,
      line: 11,
      base: 12,
      upper: true,
      draw: ({ x, y, w, h }, { base, tip }) => {
        const mx = (base[0][0] + base[1][0]) / 2;
        const my = (base[0][1] + base[1][1]) / 2;
        return `<path d="M${n(mx)} ${n(my)}L${n(tip[0])} ${n(tip[1])}" stroke="${LINE}" stroke-width=".6"/><circle cx="${n(tip[0])}" cy="${n(tip[1])}" r="1.1" fill="${LINE}"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${DARK}" fill-opacity=".92" stroke="${LINE}" stroke-width=".95"/><rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${w - 3.6}" height="${h - 3.6}" fill="none" stroke="${LINE}" stroke-opacity=".55" stroke-width=".35"/>`;
      }
    }
  };

  // ../hooks/styles/cave.ts
  var SOOT = "#1b130f";
  var OCH = "#a4452a";
  var OCH_L = "#c96b40";
  var OCH_P = "#dc9a6a";
  var OCH_D = "#66241a";
  var YOCH = "#cf8a2e";
  var WALL = "#cdb892";
  var PALE = "#e6d6b2";
  var PIGMENT_FONT = "'Marker Felt', 'Chalkboard SE', 'Comic Neue', 'Trebuchet MS', sans-serif";
  function pigment(color, family) {
    const l = lum(color);
    if (family === "fire" || family === "lamp") return l > 0.7 ? YOCH : OCH;
    if (family === "stars" || family === "life") return OCH;
    if (l > 0.72) return PALE;
    if (l < 0.18) return SOOT;
    if (isGreen(color)) return l < 0.35 ? "#3b2a1e" : "#6a5a3a";
    if (isWarm(color)) return l > 0.45 ? YOCH : l > 0.3 ? OCH_L : OCH;
    return l < 0.32 ? "#3b2a1e" : l < 0.5 ? OCH_D : "#8a6a4a";
  }
  var strength = (depth) => 0.38 + depth * 0.5;
  var scenery3 = () => painter(
    {
      ink: (color, family, _depth, attr) => attr === "stroke" ? SOOT : pigment(color, family),
      // A radial gradient is a pool of light: the bare wall is the light, so it is not painted.
      url: (_id, family, attr, g) => attr === "stroke" ? SOOT : g && (meanOf(g).opacity < 0.5 || g.tag === "radialGradient") ? "none" : pigment(g ? meanOf(g).color : "#808080", family),
      // The soot line: thick, broken in places, wavering with the finger that drew it.
      line: (family, depth) => family === "sky" || family === "stars" || family === "life" || family === "lens" || family === "air" || family === "beam" || family === "glow" || family === "fire" ? "" : `stroke="${SOOT}" stroke-width="${n(0.5 + depth * 0.9)}" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${n(14 + depth * 10)} ${n(1.5 + depth)}" stroke-opacity=".8"`,
      // Rubbed thin: the rock shows through every mass, but rock, hills and buildings are laid on thick enough to hide what stands behind them.
      post: (svg, family, depth) => `<g opacity="${n(family === "rock" || family === "land" || family === "built" ? 0.92 : strength(depth))}">${svg}</g>`,
      lineless: 0.6,
      faint: "hide",
      // A pool of lamplight is a smear of yellow ochre rubbed into the wall.
      pool: (e) => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${YOCH}" opacity=".55"/><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.5)}" ry="${n(e.ry * 0.5)}" fill="${OCH_P}" opacity=".7"/>`,
      redraw: {
        sky: () => "",
        lens: () => "",
        glow: () => "",
        air: () => "",
        beam: () => "",
        // The Milky Way as a spray of red dots, its band not painted.
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        "forest.sun": (_s, c) => sun(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 7) * 1.5, c.meta.part),
        "desert.sun": (_s, c) => sun(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 11) * 1.2, c.meta.part),
        "night.moon": (_s, c) => `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n((c.meta.r ?? 9) * 1.2)}" fill="${OCH_P}" stroke="${SOOT}" stroke-width="1.4" stroke-dasharray="9 2" opacity=".85"/>`
      }
    },
    "cv"
  );
  function sun(cx, cy, r2, part) {
    if (part === "halo") return "";
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      rays += `M${n(cx + Math.cos(a) * (r2 + 3))} ${n(cy + Math.sin(a) * (r2 + 3))}L${n(cx + Math.cos(a) * (r2 + 7))} ${n(cy + Math.sin(a) * (r2 + 7))}`;
    }
    return `<g opacity=".85"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="${YOCH}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 * 0.45)}" fill="${OCH}"/><path d="${rays}" stroke="${OCH}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  }
  var hero3 = () => (m, cx, floor) => {
    const body = m.parts.filter((p) => p.name !== "leg").map((pt) => poly(pt.hull, cx, floor)).join("");
    const legs = m.parts.filter((p) => p.name === "leg").map((pt) => poly(pt.hull, cx, floor)).join("");
    let dabs = "";
    for (const f3 of outlinedFaces(m)) {
      if (f3.part === "leg") continue;
      const tone3 = f3.light > 0.65 ? OCH_P : f3.light > 0.4 ? OCH_L : OCH_D;
      dabs += `<path fill="${tone3}" opacity="${n(0.35 + f3.light * 0.4)}" d="${poly(f3.pts, cx, floor)}"/>`;
    }
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="${SOOT}" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${SOOT}" stroke-width="1.3" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
    ).join("");
    return `<path fill="${SOOT}" opacity=".3" stroke="${SOOT}" stroke-width="1.6" stroke-linejoin="round" d="${legs}"/><path fill="${SOOT}" opacity=".85" d="${legs}"/><path fill="none" stroke="${SOOT}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="11 2.5 6 2" d="${body}"/><path fill="${OCH}" d="${body}"/><g filter="url(#cv-blow)">${dabs}</g>` + eyes + // A grain of the rock over the paint.
    `<path fill="url(#cv-pits)" d="${body}"/>`;
  };
  var escape3 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var CAVE = {
    name: "cave",
    label: "Cave Painting",
    voice: "a storyteller by the fire, in short plain words",
    cell: "solid",
    figure: "3d",
    font: PIGMENT_FONT,
    charW: 5.4,
    caption: { fill: PALE, stroke: SOOT, ink: SOOT, radius: 6 },
    paper: { card: "#e2d2b0", ink: "#2e2119", kinds: { code: "#6a3a1e", path: "#4a3a5a", fn: "#6a3a1e", num: "#8a3220", bad: "#8a3220", good: "#4a5a2a", face: "#8a3220" } },
    inset: 4,
    titleColor: SOOT,
    // The pigments' edges blown and wavering, as if daubed and sprayed on rock.
    grade: () => `<feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="2" seed="3" result="wob"/><feDisplacementMap in="SourceGraphic" in2="wob" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>`,
    art: {
      painter: scenery3,
      hero: hero3,
      sky: WALL,
      ground: WALL,
      defs: () => (
        // The wall: limestone mottled pale, grey and ochre-stained.
        `<filter id="cv-wall" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="5"/><feComponentTransfer><feFuncR type="table" tableValues=".67 .84 .93"/><feFuncG type="table" tableValues=".57 .74 .88"/><feFuncB type="table" tableValues=".43 .59 .78"/></feComponentTransfer></filter><filter id="cv-rock" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".035 .05" numOctaves="4" seed="9"/><feDiffuseLighting surfaceScale="4" diffuseConstant="1.1" lighting-color="#f4ead6"><feDistantLight azimuth="235" elevation="40"/></feDiffuseLighting></filter><filter id="cv-blow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".8"/></filter><pattern id="cv-pits" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".45" fill="#54392a" opacity=".35"/><circle cx="5.4" cy="4.6" r=".35" fill="#fff6e2" opacity=".35"/></pattern><radialGradient id="cv-torch" cx="0" cy="1" r="1.1"><stop offset="0" stop-color="#ffa050" stop-opacity=".35"/><stop offset=".5" stop-color="#ff8c38" stop-opacity=".12"/><stop offset="1" stop-color="#ff7832" stop-opacity="0"/></radialGradient><radialGradient id="cv-dark" cx=".5" cy=".5" r=".7"><stop offset=".55" stop-color="#1a0c05" stop-opacity="0"/><stop offset="1" stop-color="#1a0c05" stop-opacity=".5"/></radialGradient>`
      ),
      // The bare wall, under everything painted on it.
      under: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#cv-wall)"/>`
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#cv-rock)" style="mix-blend-mode:multiply" opacity=".55"/><rect width="${sw}" height="${h}" fill="url(#cv-torch)"/><rect width="${sw}" height="${h}" fill="url(#cv-dark)"/>`,
    tag: (text, inset) => {
      const x = inset + 6;
      const y = inset + 5;
      const marks = [0, 1, 2, 3].map((i) => `M${n(x + i * 2.4)} ${y}l.4 9`).join("") + `M${x - 1} ${y + 7}l10 -5`;
      return {
        svg: `<rect x="${x - 4}" y="${y - 3}" width="${n(text.length * 6.2 + 26)}" height="15" rx="6" fill="${PALE}" opacity=".75"/><path d="${marks}" stroke="${SOOT}" stroke-width="1.2" stroke-linecap="round" fill="none"/><text x="${x + 14}" y="${y + 8}" font-family="${PIGMENT_FONT}" font-size="8.4" letter-spacing=".6" fill="${SOOT}">${escape3(text.toUpperCase())}</text>`,
        w: x + 14 + text.length * 6.2 + 6,
        h: y + 14
      };
    },
    bubble: {
      font: PIGMENT_FONT,
      size: 9,
      charW: 5.4,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => (
        // A smoothed patch of wall, its rim a broken soot line; a soot stroke points at Claude.
        `<path d="M${n((base[0][0] + base[1][0]) / 2)} ${n((base[0][1] + base[1][1]) / 2)}L${n(tip[0])} ${n(tip[1])}" stroke="${SOOT}" stroke-width="1.6" stroke-linecap="round"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="7" fill="#e8dcbe" stroke="${SOOT}" stroke-width="1.5" stroke-dasharray="16 2.5 9 2"/>`
      )
    }
  };

  // ../hooks/art/mist.ts
  function mistBanks(o) {
    let seed = Math.round(o.seed * 7919 + o.y * 131) % 233280;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const banks = [];
    const thick = Math.max(3.2, Math.min(9, o.h * 0.42));
    for (let row = 0; row < (o.lean ? 1 : o.rows ?? 2); row++) {
      const base = o.y + o.h * (row ? 0.82 : 0.5);
      const lobeH = thick * (row ? 0.85 : 1);
      for (let x = -30 + rnd() * 40 + row * 55; x < o.w + 30; ) {
        const len = 70 + rnd() * 110;
        const lobes = Math.max(3, Math.round(len / Math.max(16, lobeH * 2.6)));
        const step2 = len / lobes;
        const bottom = base + (rnd() - 0.5) * 2;
        const r0 = lobeH * 0.5;
        let top = `M${t1(x)} ${t1(bottom)}a${t1(r0)} ${t1(r0)} 0 0 1 ${t1(r0)} ${t1(-r0)}`;
        let echo = "";
        let px = x + r0;
        let py = bottom - r0;
        for (let k = 0; k < lobes; k++) {
          const mid = 1 - Math.abs((k + 0.5) / lobes - 0.5) * 1.4;
          const rise = lobeH * (0.45 + mid * 0.55) * (0.85 + rnd() * 0.3);
          const span = k === lobes - 1 ? x + len - r0 - px : step2 * (0.85 + rnd() * 0.3);
          const ny = k === lobes - 1 ? bottom - r0 : bottom - lobeH * (0.3 + rnd() * 0.25);
          top += `a${t1(span / 2)} ${t1(rise)} 0 0 1 ${t1(span)} ${t1(ny - py)}`;
          echo += `M${t1(px + span * 0.22)} ${t1(py + (ny - py) * 0.2 + rise * 0.15)}a${t1(span * 0.3)} ${t1(rise * 0.55)} 0 0 1 ${t1(span * 0.56)} ${t1((ny - py) * 0.56)}`;
          px += span;
          py = ny;
        }
        const end = x + len;
        top += `a${t1(r0)} ${t1(r0)} 0 0 1 ${t1(r0)} ${t1(bottom - py)}`;
        const d = `${top}Q${t1((x + end) / 2)} ${t1(bottom + 1.4)} ${t1(x)} ${t1(bottom)}z`;
        banks.push({ d, echo, under: `M${t1(x + r0)} ${t1(bottom + 0.6)}Q${t1((x + end) / 2)} ${t1(bottom + 1.9)} ${t1(end - r0)} ${t1(bottom + 0.6)}` });
        x = end + (o.lean ? 70 : 25) + rnd() * 80;
      }
    }
    return banks;
  }
  var MIST_TILE = 640;
  function tiled(id, svg, sw) {
    let uses = "";
    for (let k = 1; k * MIST_TILE < sw + 30; k++) uses += `<use href="#${id}" transform="translate(${k * MIST_TILE} ${k % 2 ? 1.5 : 0})"/>`;
    return `<g id="${id}">${svg}</g>${uses}`;
  }

  // ../hooks/styles/engraving.ts
  var INK = "#1c1611";
  var PAPER = "#f2ebda";
  var HI = "#f6f0e2";
  var SERIF = "'Big Caslon', 'Caslon', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  var DIDONE = "Didot, 'Bodoni 72', 'Bodoni MT', 'Iowan Old Style', Georgia, serif";
  var GRAIN = {
    sky: "h",
    cloud: "h",
    air: "h",
    water: "h",
    ground: "h",
    mark: "h",
    glass: "h",
    stars: "h",
    bark: "v",
    built: "v",
    grass: "v",
    foliage: "d",
    land: "d",
    rock: "d",
    fire: "h",
    lamp: "h",
    body: "h",
    beam: "h",
    glow: "h",
    life: "h",
    lens: "h"
  };
  var LEVELS = 6;
  var ANGLE = { h: 0, v: 90, d: -38 };
  var CUT = [
    { w: 0, cross: 0 },
    { w: 0.18, cross: 0 },
    { w: 0.3, cross: 0 },
    { w: 0.42, cross: 1 },
    { w: 0.55, cross: 1 },
    { w: 0.72, cross: 2 }
  ];
  var GAP = 1.7;
  function hatches() {
    let out = "";
    for (const g of ["h", "v", "d"]) {
      for (let k = 1; k < LEVELS; k++) {
        const c = CUT[k];
        out += `<pattern id="eg-${g}${k}" width="8" height="${GAP}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g]})"><rect width="8" height="${GAP}" fill="${PAPER}"/><path d="M0 ${n(GAP / 2)}H8" stroke="${INK}" stroke-width="${c.w}"/></pattern>`;
        if (c.cross) {
          out += `<pattern id="eg-${g}${k}x" width="8" height="${n(GAP * 1.15)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g] + 55})"><rect width="8" height="${n(GAP * 1.15)}" fill="url(#eg-${g}${k})"/><path d="M0 ${n(GAP * 0.55)}H8" stroke="${INK}" stroke-width="${n(c.w * 0.8)}"/></pattern>`;
        }
        if (c.cross > 1) {
          out += `<pattern id="eg-${g}${k}xx" width="8" height="${n(GAP * 1.3)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE[g] - 55})"><rect width="8" height="${n(GAP * 1.3)}" fill="url(#eg-${g}${k}x)"/><path d="M0 ${n(GAP * 0.6)}H8" stroke="${INK}" stroke-width="${n(c.w * 0.6)}"/></pattern>`;
        }
      }
    }
    return out;
  }
  function cut(t, g) {
    const k = Math.max(0, Math.min(LEVELS - 1, Math.floor(t * LEVELS)));
    if (k === 0) return PAPER;
    const c = CUT[k];
    return `url(#eg-${g}${k}${c.cross > 1 ? "xx" : c.cross ? "x" : ""})`;
  }
  function darkness(color, family) {
    const d = 1 - Math.min(1, Math.pow(lum(color), 0.75) * 1.1);
    switch (family) {
      case "fire":
      case "lamp":
      case "body":
      case "stars":
      case "life":
        return 0;
      case "sky":
      case "cloud":
        return d * 0.55;
      case "air":
      case "beam":
      case "glow":
        return 0;
      default:
        return d;
    }
  }
  function ink2(color, family, attr) {
    if (attr === "stroke") return family === "fire" || family === "lamp" ? PAPER : INK;
    if (attr === "color") return INK;
    if (attr === "stop-color") return lum(color) > 0.5 ? PAPER : INK;
    if (lum(color) > 0.82 && family !== "stars" && family !== "life") return PAPER;
    if (family === "stars" || family === "life") return INK;
    return cut(darkness(color, family), GRAIN[family] ?? "h");
  }
  var UNLINED2 = ["sky", "air", "beam", "glow", "stars", "life", "lens", "water"];
  function ruledSky(c, dark) {
    const sw = c.meta.sw ?? 640;
    const bands = 7;
    let out = "";
    for (let b = 0; b < bands; b++) {
      const y0 = 3 + b * 15;
      const k = b / (bands - 1);
      const w = n(Math.min(0.95, 0.12 + dark * 0.55 + (0.2 + dark * 0.35) * k));
      let d = "";
      for (let y = y0; y < y0 + 15 && y < 112; y += GAP) d += `M0 ${n(y)}H${sw}`;
      const dash = `${80 + b * 23} ${6 + b % 3 * 5}`;
      out += `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-dashoffset="${b * 37}"/>`;
    }
    return `<rect width="${sw}" height="128" fill="${PAPER}"/>${out}`;
  }
  function reserved(c, rays) {
    if (c.meta.part === "halo") return "";
    const cx = c.meta.cx ?? 0;
    const cy = c.meta.cy ?? 0;
    const r2 = (c.meta.r ?? 8) * 1.2;
    let d = "";
    if (rays) for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const r1 = r2 + 2.2;
      const r22 = r2 + (i % 2 ? 5 : 8);
      d += `M${n(cx + Math.cos(a) * r1)} ${n(cy + Math.sin(a) * r1)}L${n(cx + Math.cos(a) * r22)} ${n(cy + Math.sin(a) * r22)}`;
    }
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2 + (rays ? 9 : 3))}" fill="${PAPER}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="${PAPER}" stroke="${INK}" stroke-width=".5"/>` + (d ? `<path d="${d}" stroke="${INK}" stroke-width=".35"/>` : "");
  }
  var scenery4 = () => painter(
    {
      ink: (color, family, _depth, attr) => ink2(color, family, attr),
      // A gradient is cut at its overall tone; a stroke is a line of ink.
      url: (_id, family, attr, g) => attr === "stroke" ? INK : g && meanOf(g).opacity < 0.5 ? "none" : ink2(g ? meanOf(g).color : "#808080", family, "fill"),
      line: (family, depth) => UNLINED2.includes(family) ? "" : `stroke="${INK}" stroke-width="${n(0.18 + depth * 0.4)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: "hide",
      // A pool of lamplight is left as bare paper, its edge flicked in short strokes of the graver.
      pool: (e) => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${PAPER}" stroke="${INK}" stroke-width=".45" stroke-dasharray="2 1.6"/><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.6)}" ry="${n(e.ry * 0.6)}" fill="none" stroke="${INK}" stroke-width=".3" stroke-dasharray=".8 2.4"/>`,
      redraw: {
        sky: (svg, c) => {
          const g = c.gradient(svg);
          return ruledSky(c, g ? 1 - lum(meanOf(g).color) : 0.4);
        },
        // The Milky Way as a drift of fine dots, no band.
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        lens: () => "",
        // No reflections: the street and the floor stay plain.
        water: () => "",
        glow: () => "",
        "forest.sun": (_s, c) => reserved(c, true),
        "desert.sun": (_s, c) => reserved(c, true),
        "night.moon": (_s, c) => reserved(c, false),
        // Mist is reserved paper, its banks cut round with a fine contour along their tops and a few
        // level strokes of shade beneath them, as an engraver sculpts cloud.
        air: (svg, c) => {
          const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 8, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true });
          const shade = banks.map((b) => b.under).join("");
          const art = `<path fill="${PAPER}" stroke="${INK}" stroke-width=".45" stroke-dasharray="40 2 12 1.5" d="${banks.map((b) => b.d).join("")}"/><path fill="none" stroke="${INK}" stroke-width=".35" d="${shade}"/><path fill="none" stroke="${INK}" stroke-width=".22" stroke-opacity=".7" d="${banks.map((b) => b.echo).join("")}"/>`;
          return `<g>${tiled(`eg-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`;
        },
        beam: (svg, c) => `<g opacity=".35">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${PAPER}"`)}</g>`
      }
    },
    "eg"
  );
  var hero4 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    let faces = "";
    let fill = "";
    let d = "";
    for (const f3 of outlinedFaces(m)) {
      const g = f3.name === "front" || f3.name === "back" ? "h" : f3.name === "top" ? "d" : "v";
      const t = Math.min(0.95, (1 - f3.light) * 0.85 + (f3.part === "leg" ? 0.25 : 0.08));
      const c = cut(t, g);
      if (c !== fill && d) {
        faces += `<path fill="${fill}" d="${d}"/>`;
        d = "";
      }
      fill = c;
      d += poly(f3.pts, cx, floor);
    }
    if (d) faces += `<path fill="${fill}" d="${d}"/>`;
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="${INK}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".4" fill="${HI}"/>` : `<path fill="none" stroke="${INK}" stroke-width=".9" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
    ).join("");
    return `<path fill="url(#eg-h4x)" opacity=".7" d="${poly(m.shadow, cx, floor)}"/><path fill="${PAPER}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round" d="${hulls}"/><g stroke="${INK}" stroke-width=".4" stroke-linejoin="round">${faces}</g>` + eyes;
  };
  var escape4 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var ENGRAVING = {
    name: "engraving",
    label: "Copperplate Engraving",
    voice: "a learned 18th-century natural-history plate",
    cell: "solid",
    figure: "3d",
    font: SERIF,
    charW: 5.1,
    caption: { fill: HI, stroke: INK, ink: INK, radius: 0 },
    paper: { card: HI, ink: INK, kinds: { code: "#3a2a1c", path: "#3a2a1c", fn: "#3a2a1c", num: "#6a2a1a", bad: "#6a2a1a", good: "#2a3a1c", face: "#6a2a1a" } },
    inset: 6,
    titleColor: INK,
    art: {
      painter: scenery4,
      hero: hero4,
      sky: PAPER,
      ground: PAPER,
      defs: () => hatches() + // Laid paper: fine chain lines and a scatter of fibres and foxing.
      `<filter id="eg-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7 .9" numOctaves="2" seed="808"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .15  -1.5 0 0 0 .95"/></filter>`
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#eg-paper)" opacity=".18"/>`,
    frame: (sw, h) => (
      // The plate mark: the sheet pressed into the plate, shadowed on two sides and catching light on two.
      `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${PAPER}" stroke-width="3"/><path d="M2.6 ${h - 2.6}V2.6H${sw - 2.6}" fill="none" stroke="#6a5030" stroke-opacity=".5" stroke-width=".8"/><path d="M${sw - 2.6} 2.6V${h - 2.6}H2.6" fill="none" stroke="#fffdf6" stroke-width=".8"/><rect x="5.5" y="5.5" width="${sw - 11}" height="${h - 11}" fill="none" stroke="${INK}" stroke-width=".5"/>`
    ),
    tag: (text, inset) => {
      const t = text.toUpperCase();
      const x = inset + 4;
      const y = inset + 4;
      const w = t.length * 6.6 + 34;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="12" fill="${PAPER}"/><text x="${x + 3}" y="${y + 9}" font-family="${SERIF}" font-style="italic" font-size="8" fill="${INK}">Pl. I.</text><text x="${x + 27}" y="${y + 9}" font-family="${DIDONE}" font-size="7.5" font-weight="700" letter-spacing="1.6" fill="${INK}">${escape4(t)}</text>`,
        w: x + w + 4,
        h: y + 15
      };
    },
    bubble: {
      font: SERIF,
      size: 9,
      charW: 5.1,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => (
        // An engraved legend: a paper panel ruled twice, its pointer cut as a fine wedge.
        `<path fill="${INK}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${HI}" stroke="${INK}" stroke-width=".6"/><rect x="${n(x + 1.8)}" y="${n(y + 1.8)}" width="${w - 3.6}" height="${h - 3.6}" fill="none" stroke="${INK}" stroke-width=".25"/>`
      )
    }
  };

  // ../hooks/styles/golden.ts
  var P = {
    paper: "#f1dfa9",
    sky: "#f6ae2d",
    dot: "#e0502a",
    red: "#d63a2a",
    yellow: "#ffd23f",
    ink: "#16120f",
    white: "#fffbe8",
    top: "#ffb48c",
    front: "#f0683a",
    side: "#b9442a",
    leg: "#d9592f",
    legDark: "#9f3c24"
  };
  var COMIC = "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif";
  var GROTESK = "'Arial Black', 'Helvetica Neue', Impact, sans-serif";
  var RAMP = {
    blue: [P.ink, "#1d3f8f", "#2a7bc0", "#7ab8e0", "#cfe6f5"],
    warm: [P.ink, "#a8261a", P.red, "#f08a3a", P.sky, P.yellow],
    green: [P.ink, "#2f6a24", "#4f9a3a", "#8ac24a", "#c8e07a"],
    earth: [P.ink, "#5a3a1a", "#8a5a2b", "#c08a4a", "#e8c07a"],
    stone: [P.ink, "#3a3a5a", "#5a6a8a", "#9aa8c0", "#dde4ee"],
    fire: ["#a01e10", P.red, "#f08a3a", P.yellow, "#fff6c0"],
    cloud: ["#7ab8e0", "#cfe6f5", P.white]
  };
  var SCREENED = [RAMP.blue, RAMP.warm, RAMP.green, RAMP.earth, RAMP.stone].map((r2) => r2[1]);
  var dotted = (hex) => `url(#ga-${hex.slice(1)})`;
  function rampFor(color, family) {
    const warm = isWarm(color);
    switch (family) {
      case "fire":
        return RAMP.fire;
      case "lamp":
        return warm || lum(color) > 0.6 ? RAMP.fire.slice(2) : RAMP.blue;
      case "foliage":
      case "grass":
        return RAMP.green;
      case "bark":
        return RAMP.earth;
      case "cloud":
        return warm ? RAMP.warm.slice(3) : RAMP.cloud;
      case "land":
        return isGreen(color) ? RAMP.green : warm ? RAMP.warm : RAMP.blue;
      case "rock":
      case "ground":
      case "mark":
        return isGreen(color) ? RAMP.green : warm || brownish2(color) ? RAMP.earth : RAMP.stone;
      case "built":
      case "glass":
        return warm ? RAMP.warm : RAMP.stone;
      default:
        return warm ? RAMP.warm : RAMP.blue;
    }
  }
  function brownish2(color) {
    const c = color.replace("#", "");
    if (c.length !== 6) return false;
    const r2 = parseInt(c.slice(0, 2), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return r2 > b + 16;
  }
  function ink3(color, family, attr) {
    if (attr === "stroke" && family !== "fire" && family !== "lamp" && family !== "stars" && family !== "life" && family !== "mark") return P.ink;
    const ramp = rampFor(color, family);
    const l = Math.min(1, Math.pow(lum(color), 0.7) * 1.1);
    const c = step(ramp, l);
    return attr === "fill" && SCREENED.includes(c) ? dotted(c) : c;
  }
  var UNLINED3 = ["sky", "air", "beam", "glow", "stars", "life", "lens", "water", "fire", "lamp"];
  function sky2(svg, c) {
    const g = c.gradient(svg);
    const mean = g ? meanOf(g).color : "#808080";
    const warm = isWarm(mean) || (g?.stops.some((s) => isWarm(s.color)) ?? false) && lum(mean) > 0.35;
    const base = warm ? lum(mean) > 0.5 ? P.sky : "#f08a3a" : step(RAMP.blue, Math.min(0.99, lum(mean) * 1.6));
    const dots = warm ? "ga-sky-warm" : "ga-sky-cool";
    const sw = c.meta.sw ?? 640;
    return `<rect width="${sw}" height="128" fill="${base}"/><rect width="${sw}" height="128" fill="url(#${dots})" mask="url(#ga-gather)"/>`;
  }
  var disc = (c, fill, r2) => c.meta.part === "halo" ? "" : `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n(r2)}" fill="${fill}" stroke="${P.ink}" stroke-width="1.2"/>`;
  var scenery5 = () => painter(
    {
      ink: (color, family, _depth, attr) => ink3(color, family, attr),
      // Gradients print as one flat ink: the comic has no blends.
      // A wash of light (mostly transparent) is not printed at all; lamps' cones neither.
      url: (_id, family, attr, g) => g && meanOf(g).opacity < 0.5 || family === "lamp" ? "none" : ink3(g ? meanOf(g).color : "#808080", family, attr === "stroke" ? "stroke" : "fill"),
      line: (family, depth) => UNLINED3.includes(family) ? "" : `stroke="${P.ink}" stroke-width="${n(0.35 + depth * 0.8)}" stroke-linejoin="round"`,
      lineless: 0.6,
      faint: "hide",
      redraw: {
        sky: sky2,
        lens: () => "",
        glow: () => "",
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        "forest.sun": (_s, c) => disc(c, P.yellow, (c.meta.r ?? 7) * 1.6),
        "desert.sun": (_s, c) => disc(c, P.yellow, (c.meta.r ?? 11) * 1.25),
        "night.moon": (_s, c) => disc(c, "#fff0b0", (c.meta.r ?? 9) * 1.2),
        // Mist as a band of white dots lying across the scene.
        air: (svg, c) => {
          const y = c.meta.y ?? 80;
          const h = c.meta.h ?? 12;
          const w = c.meta.sw ?? 640;
          return `<g><rect x="-20" y="${n(y + h * 0.2)}" width="${w + 40}" height="${n(h * 0.6)}" fill="url(#ga-mist)"/>${c.motion(svg)}</g>`;
        },
        beam: (svg, c) => `<g opacity=".3">${c.repaint(svg).replace(/\sfill="[^"]*"/g, ` fill="${P.yellow}"`)}</g>`
      }
    },
    "ga"
  );
  var hero5 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    const plate = m.parts.map((pt) => poly(pt.hull, cx + 1.1, floor + 0.8)).join("");
    let faces = "";
    for (const f3 of outlinedFaces(m)) {
      const tone3 = f3.part === "leg" ? f3.name === "front" ? P.leg : P.legDark : f3.name === "top" ? P.top : f3.name === "front" ? P.front : P.side;
      const fill = f3.name !== "front" && f3.name !== "top" ? "url(#ga-claude)" : tone3;
      faces += `<path fill="${fill}" d="${poly(f3.pts, cx, floor)}"/>`;
    }
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="${P.ink}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".5" fill="#fff"/>` : `<path fill="none" stroke="${P.ink}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
    ).join("");
    return `<path fill="${P.ink}" opacity=".35" d="${poly(m.shadow, cx, floor)}"/><path fill="${P.front}" d="${plate}"/><path fill="none" stroke="${P.ink}" stroke-width="1.7" stroke-linejoin="round" d="${hulls}"/><g stroke="${P.ink}" stroke-width=".45" stroke-linejoin="round">${faces}</g>` + eyes;
  };
  var escape5 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var screen = (id, base, dot, r2 = 0.6, size = 2.2) => `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` + (base === "none" ? "" : `<rect width="${size}" height="${size}" fill="${base}"/>`) + `<circle cx="${n(size / 2)}" cy="${n(size / 2)}" r="${r2}" fill="${dot}"/></pattern>`;
  var GOLDEN = {
    name: "golden",
    label: "Golden Age Comic",
    voice: "a punchy 1938 comic book",
    cell: "solid",
    figure: "3d",
    font: COMIC,
    charW: 5.6,
    caption: { fill: P.white, stroke: P.ink, ink: P.ink, radius: 8 },
    paper: { card: P.white, ink: P.ink, kinds: { code: "#1d3f8f", path: "#1d3f8f", fn: "#6a2a8a", num: P.red, bad: P.red, good: "#2f6a24", face: P.red } },
    inset: 4,
    titleColor: P.ink,
    art: {
      painter: scenery5,
      hero: hero5,
      sky: P.paper,
      ground: P.paper,
      defs: () => SCREENED.map((c) => screen(`ga-${c.slice(1)}`, c, mix(c, P.ink, 0.55))).join("") + screen("ga-claude", P.side, P.red, 0.55, 2) + screen("ga-sky-warm", "none", P.dot, 0.75, 2.6) + screen("ga-sky-cool", "none", "#2a7bc0", 0.7, 2.6) + screen("ga-mist", "none", P.white, 0.6, 2) + // The sky's dots gather toward the horizon.
      `<linearGradient id="ga-gatherfade" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="white" stop-opacity="0"/><stop offset=".85" stop-color="white" stop-opacity=".9"/></linearGradient><mask id="ga-gather" maskContentUnits="userSpaceOnUse"><rect width="4000" height="128" fill="url(#ga-gatherfade)"/></mask><filter id="ga-pulp" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="41"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .24  0 0 0 0 .08  -1.4 0 0 0 .95"/></filter>`
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#ga-pulp)" opacity=".2"/>`,
    frame: (sw, h) => `<rect x="1" y="1" width="${sw - 2}" height="${h - 2}" fill="none" stroke="${P.paper}" stroke-width="2"/><rect x="3" y="3" width="${sw - 6}" height="${h - 6}" fill="none" stroke="${P.ink}" stroke-width="2.4"/>`,
    tag: (text, inset) => {
      const t = `${text.toUpperCase()}!`;
      const x = inset + 4;
      const y = inset + 4;
      const w = t.length * 6.4 + 34;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="${P.red}" stroke="${P.ink}" stroke-width="1.4"/><rect x="${x + 2}" y="${y + 2}" width="22" height="11" fill="${P.yellow}" stroke="${P.ink}" stroke-width=".8"/><text x="${x + 13}" y="${y + 10.6}" text-anchor="middle" font-family="${GROTESK}" font-size="6.5" fill="${P.ink}">No.1</text><text x="${x + 29}" y="${y + 11}" font-family="${GROTESK}" font-style="italic" font-size="8.5" fill="${P.yellow}" stroke="${P.ink}" stroke-width=".9" paint-order="stroke">${escape5(t)}</text>`,
        w: x + w + 4,
        h: y + 19
      };
    },
    bubble: {
      font: COMIC,
      size: 8.6,
      charW: 5.7,
      line: 11,
      base: 12,
      upper: true,
      draw: ({ x, y, w, h }, { base, tip }) => {
        const mx = (base[0][0] + base[1][0]) / 2;
        const my = (base[0][1] + base[1][1]) / 2;
        const tail = `M${n(base[0][0])} ${n(base[0][1])}Q${n((mx + tip[0]) / 2)} ${n((my + tip[1]) / 2 - 2)} ${n(tip[0])} ${n(tip[1])}Q${n((mx + tip[0]) / 2 + 2)} ${n((my + tip[1]) / 2)} ${n(base[1][0])} ${n(base[1][1])}z`;
        const shape = `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="${n(Math.min(10, h / 2))}"/><path d="${tail}"/>`;
        return `<g fill="${P.ink}" stroke="${P.ink}" stroke-width="2.6" stroke-linejoin="round">${shape}</g><g fill="${P.white}">${shape}</g>`;
      }
    }
  };

  // ../hooks/styles/kamon.ts
  var CREAM = "#eee7d7";
  var SILK = "#1a1816";
  var SEAL = "#b3271d";
  var SERIF2 = "'Hiragino Mincho ProN', 'Yu Mincho', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
  var cutWidth = (depth) => n(0.55 + depth * 0.45);
  function threshold(family) {
    switch (family) {
      case "fire":
      case "lamp":
      case "stars":
      case "life":
      case "body":
        return 0.2;
      case "cloud":
        return 0.25;
      case "sky":
        return 2;
      default:
        return 0.36;
    }
  }
  var tone2 = (color, family) => Math.pow(lum(color), 0.85) > threshold(family) ? CREAM : SILK;
  var scenery6 = () => painter(
    {
      ink: (color, family, _depth, attr) => attr === "stroke" ? family === "mark" || family === "fire" || family === "water" ? CREAM : SILK : tone2(color, family),
      // A gradient is one plane or the other; a wash of light is not drawn.
      url: (_id, family, attr, g) => attr === "stroke" ? CREAM : g && meanOf(g).opacity < 0.5 ? "none" : tone2(g ? meanOf(g).color : "#808080", family),
      // Cream planes are parted by silk cuts; the line is set on the group, and a silk plane takes a cream one instead.
      line: (family, depth) => family === "sky" || family === "lens" ? "" : `stroke="${SILK}" stroke-width="${cutWidth(depth)}" stroke-linejoin="miter"`,
      post: (svg, _family, depth) => svg.replace(
        /<(path|rect|circle|ellipse)\b([^>]*?)(\/?)>/g,
        (all, tag, attrs, close) => new RegExp(`\\sfill="${SILK}"`).test(attrs) && !/\sstroke=/.test(attrs) ? `<${tag}${attrs} stroke="${CREAM}" stroke-width="${n(0.3 + depth * 0.25)}"${close}>` : all
      ),
      lineless: 0.75,
      faint: "hide",
      opacity: (_f, v) => v >= 0.4 ? 1 : v,
      // A pool of lamplight is a cream plane parted from the ground by a cut, ringed as the sun is.
      pool: (e) => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="none" stroke="${SILK}" stroke-width="1.2"/><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx - 1.4)}" ry="${n(Math.max(0.6, e.ry - 0.9))}" fill="${CREAM}" stroke="${SILK}" stroke-width=".55"/>`,
      redraw: {
        sky: () => "",
        lens: () => "",
        glow: () => "",
        beam: () => "",
        // A reflection fades, and a crest has no fades: the floor and the street stay plain.
        water: () => "",
        // A drift of cream dots; the band of the Milky Way is light, and is not drawn.
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        "forest.sun": (_s, c) => futae(c, (c.meta.r ?? 7) * 1.6),
        "desert.sun": (_s, c) => futae(c, (c.meta.r ?? 11) * 1.3),
        "night.moon": (_s, c) => futae(c, (c.meta.r ?? 9) * 1.3),
        // Mist as kumo: cream banks of lobes, each lobe parted from the next by a silk cut, as the crest's cloud is.
        air: (svg, c) => {
          const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 5, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true });
          const art = `<path fill="${CREAM}" stroke="${SILK}" stroke-width=".9" stroke-linejoin="round" d="${banks.map((b) => b.d).join("")}"/><path fill="none" stroke="${SILK}" stroke-width=".8" stroke-linecap="round" d="${banks.map((b) => b.echo).join("")}"/>`;
          return `<g>${tiled(`km-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`;
        }
      }
    },
    "km"
  );
  function futae(c, r2) {
    if (c.meta.part === "halo") return "";
    const cx = n(c.meta.cx ?? 0);
    const cy = n(c.meta.cy ?? 0);
    return `<circle cx="${cx}" cy="${cy}" r="${n(r2 + 3.2)}" fill="none" stroke="${CREAM}" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="${n(r2)}" fill="${CREAM}"/>`;
  }
  var hero6 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    const parts = outlinedOrder(m).filter((pt) => pt.faces.length).map((pt) => `<path d="${pt.faces.map((f3) => poly(f3.pts, cx, floor)).join("")}"/>`).join("");
    const eyes = m.eyes.map((e) => e.poly ? `<path fill="${SILK}" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${SILK}" stroke-width="1.1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`).join("");
    return `<path fill="${SILK}" stroke="${SILK}" stroke-width="2.4" stroke-linejoin="round" d="${hulls}"/><g fill="${CREAM}" stroke="${SILK}" stroke-width="1" stroke-linejoin="miter">${parts}</g>` + eyes;
  };
  var escape6 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var KAMON = {
    name: "kamon",
    label: "Kamon",
    voice: "a terse family crest motto",
    cell: "solid",
    figure: "3d",
    font: SERIF2,
    charW: 5.1,
    caption: { fill: SILK, stroke: CREAM, ink: CREAM, radius: 0 },
    paper: { card: SILK, ink: CREAM, kinds: { code: "#d8c89a", path: "#d8c89a", fn: "#d8c89a", num: "#e0705e", bad: "#e0705e", good: "#b8d0a8", face: "#e0705e" } },
    inset: 6,
    titleColor: CREAM,
    art: {
      painter: scenery6,
      hero: hero6,
      sky: SILK,
      ground: SILK,
      defs: () => (
        // Twill: warp threads on the diagonal, alternately catching the light; and the sheen across the lacquer.
        `<pattern id="km-twill" width="2.3" height="2.3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v2.3" stroke="white" stroke-opacity=".04" stroke-width=".6"/></pattern><linearGradient id="km-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".45" stop-color="white" stop-opacity=".05"/><stop offset=".55" stop-color="white" stop-opacity=".02"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><radialGradient id="km-vignette" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="black" stop-opacity="0"/><stop offset="1" stop-color="black" stop-opacity=".4"/></radialGradient>`
      )
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" fill="url(#km-twill)"/><rect width="${sw}" height="${h}" fill="url(#km-sheen)"/><rect width="${sw}" height="${h}" fill="url(#km-vignette)"/>`,
    frame: (sw, h) => (
      // The ring of the crest, laid straight: a thick cream rule and a thin one inside, parted by a cut.
      `<rect x="2" y="2" width="${sw - 4}" height="${h - 4}" fill="none" stroke="${CREAM}" stroke-width="2.2"/><rect x="5.4" y="5.4" width="${sw - 10.8}" height="${h - 10.8}" fill="none" stroke="${CREAM}" stroke-width=".7"/>`
    ),
    tag: (text, inset) => {
      const x = inset + 5;
      const y = inset + 4;
      return {
        svg: `<rect x="${x - 2}" y="${y - 2}" width="${n(text.length * 6.2 + 25)}" height="16" fill="${SILK}" stroke="${CREAM}" stroke-width=".5"/><rect x="${x}" y="${y}" width="12" height="12" rx="1.4" fill="${SEAL}"/><text x="${x + 6}" y="${y + 9.4}" text-anchor="middle" font-family="${SERIF2}" font-size="9" font-weight="700" fill="#f6eee4">\u722A</text><text x="${x + 17}" y="${y + 9}" font-family="${SERIF2}" font-size="8" letter-spacing="1.4" fill="${CREAM}">${escape6(text)}</text>`,
        w: x + 17 + text.length * 6.2 + 6,
        h: y + 15
      };
    },
    bubble: {
      font: SERIF2,
      size: 9,
      charW: 5.1,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => `<path fill="${CREAM}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${SILK}" stroke="${CREAM}" stroke-width="1.4"/><rect x="${n(x + 2.4)}" y="${n(y + 2.4)}" width="${w - 4.8}" height="${h - 4.8}" fill="none" stroke="${CREAM}" stroke-width=".45"/>`
    }
  };

  // ../hooks/grade.ts
  var f = (v) => (Math.round(v * 1e3) / 1e3).toString();
  function cells(from, size, result) {
    const dot = Math.min(0.4, size / 4);
    return `<feFlood x="${f((size - dot) / 2)}" y="${f((size - dot) / 2)}" width="${f(dot)}" height="${f(dot)}" flood-color="black"/><feComposite x="0" y="0" width="${f(size)}" height="${f(size)}"/><feTile result="${result}-grid"/><feComposite in="${from}" in2="${result}-grid" operator="in"/><feMorphology operator="dilate" radius="${f((size - dot) / 2)}" result="${result}"/>`;
  }
  var gradeFilter = (id, sw, h, body) => `<filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${h}" color-interpolation-filters="sRGB">${body}</filter>`;

  // ../hooks/styles/mosaic.ts
  var P2 = {
    grout: "#857b69",
    cream: "#e8dec6",
    black: "#2c2723",
    ochre: "#c49a58",
    red: "#a5452f",
    sea: "#3b76a6",
    sea2: "#6ca5c9",
    foam: "#dbe7ea",
    fish: "#4b5560",
    top: "#eaa47e",
    front: "#cf6a48",
    side: "#9c4a33",
    leg: "#bd5d40",
    legDark: "#8e432e",
    rim: "#5b2a1e",
    eye: "#1e1a17"
  };
  var SERIF3 = "'Trajan Pro', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
  var STONE = 3.2;
  var RAMP2 = {
    cool: [P2.black, P2.fish, P2.sea, P2.sea2, P2.foam, P2.cream],
    warm: [P2.rim, P2.red, "#c9784a", P2.ochre, "#dcc497", P2.cream],
    green: [P2.black, "#3e4a2c", "#4e5e36", "#76845a", "#a4aa80"],
    earth: [P2.black, P2.rim, "#7a5a3a", "#a07848", P2.ochre, "#d4c6a6"],
    stone: [P2.black, P2.fish, "#857b69", "#b3a88e", "#d4c6a6", P2.cream],
    fire: [P2.rim, P2.red, P2.ochre, P2.cream]
  };
  var pick = (ramp, t) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? ramp[0];
  function stone(color, family) {
    const t = Math.min(1, Math.pow(lum(color), 0.7) * 1.15);
    const warm = isWarm(color);
    switch (family) {
      case "fire":
      case "lamp":
        return pick(RAMP2.fire, t);
      case "stars":
      case "life":
        return warm ? P2.ochre : P2.cream;
      case "body":
        return warm ? P2.ochre : P2.cream;
      case "sky":
      case "cloud":
      case "water":
        return pick(warm ? RAMP2.warm : RAMP2.cool, t);
      case "foliage":
      case "grass":
        return pick(RAMP2.green, t);
      case "bark":
        return pick(RAMP2.earth, t * 0.8);
      default:
        return isGreen(color) ? pick(RAMP2.green, t) : warm || brownish3(color) ? pick(RAMP2.earth, t) : pick(RAMP2.stone, t);
    }
  }
  function brownish3(color) {
    const c = color.replace("#", "");
    if (c.length !== 6) return false;
    return parseInt(c.slice(0, 2), 16) > parseInt(c.slice(4, 6), 16) + 16;
  }
  var scenery7 = () => painter(
    {
      ink: (color, family, _depth, attr) => attr === "stroke" ? family === "fire" || family === "lamp" ? P2.ochre : P2.black : stone(color, family),
      url: (_id, family, attr, g) => attr === "stroke" ? P2.black : g && meanOf(g).opacity < 0.5 ? "none" : stone(g ? meanOf(g).color : "#808080", family),
      // The lines of a mosaic are rows of dark stones: a stone's width, on the nearer things.
      line: (family, depth) => family === "sky" || family === "stars" || family === "life" || family === "lens" || family === "air" || family === "beam" || family === "glow" || family === "cloud" || depth < 0.3 ? "" : `stroke="${P2.black}" stroke-width="${n(STONE * 0.7)}" stroke-linejoin="round"`,
      // Every stone is a full stone: no half-laid washes.
      opacity: (_f, v) => v >= 0.35 ? 1 : 0,
      lineless: 0.6,
      faint: "hide",
      // A pool of lamplight is set in ochre and cream stones, the cream at its heart.
      pool: (e) => `<ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx)}" ry="${n(e.ry)}" fill="${P2.ochre}" opacity=".85"/><ellipse cx="${n(e.cx)}" cy="${n(e.cy)}" rx="${n(e.rx * 0.55)}" ry="${n(e.ry * 0.55)}" fill="${P2.cream}"/>`,
      redraw: {
        lens: () => "",
        // No reflections: the street and the floor stay plain.
        water: () => "",
        glow: () => "",
        beam: () => "",
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        air: (svg, c) => {
          const y = c.meta.y ?? 80;
          const h = c.meta.h ?? 12;
          const w = c.meta.sw ?? 640;
          return `<g><rect x="-20" y="${n(y + h * 0.35)}" width="${w + 40}" height="${n(STONE)}" fill="${P2.foam}"/>${c.motion(svg)}</g>`;
        }
      }
    },
    "ms"
  );
  var hero7 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    let faces = "";
    for (const f3 of outlinedFaces(m)) {
      const tone3 = f3.part === "leg" ? f3.name === "front" ? P2.leg : P2.legDark : f3.name === "top" ? P2.top : f3.name === "front" ? P2.front : P2.side;
      faces += `<path fill="${tone3}" d="${poly(f3.pts, cx, floor)}"/>`;
    }
    const eyes = m.eyes.map((e) => e.poly ? `<path fill="${P2.eye}" stroke="${P2.eye}" stroke-width="1.6" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${P2.eye}" stroke-width="2.4" d="${poly(e.line ?? [], cx, floor, false)}"/>`).join("");
    return `<path fill="${P2.grout}" opacity=".7" d="${poly(m.shadow, cx, floor)}"/><path fill="${P2.rim}" stroke="${P2.rim}" stroke-width="${STONE * 1.1}" stroke-linejoin="round" d="${hulls}"/>` + faces + eyes;
  };
  var escape7 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var MOSAIC = {
    name: "mosaic",
    label: "Mosaic",
    voice: "a Roman floor inscription",
    cell: "solid",
    figure: "3d",
    font: SERIF3,
    charW: 5.3,
    caption: { fill: P2.cream, stroke: P2.black, ink: P2.black, radius: 0 },
    paper: { card: "#f1ead8", ink: P2.black, kinds: { code: P2.sea, path: P2.sea, fn: "#6a4a8a", num: P2.red, bad: P2.red, good: "#4e5e36", face: P2.red } },
    inset: 8,
    titleColor: P2.red,
    // The medium: every element, laid, is set into square stones on one grid.
    grade: () => cells("SourceGraphic", STONE, "set"),
    art: {
      painter: scenery7,
      hero: hero7,
      sky: P2.cream,
      ground: P2.ochre,
      defs: () => (
        // The grout between the stones, and each stone's uneven seating as a faint shade at its edge.
        `<pattern id="ms-grout" width="${STONE}" height="${STONE}" patternUnits="userSpaceOnUse"><path d="M0 0h${STONE}v.5h-${STONE}zM0 0h.5v${STONE}h-.5z" fill="${P2.grout}"/><path d="M.5 ${STONE - 0.35}h${STONE - 0.5}v.35h-${STONE - 0.5}z" fill="#000" opacity=".12"/></pattern><filter id="ms-stone" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="31"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .38  -1.2 0 0 0 .7"/></filter>`
      )
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#ms-stone)" opacity=".2"/><rect width="${sw}" height="${h}" fill="url(#ms-grout)"/>`,
    frame: (sw, h) => {
      const key = (id, flip) => `<pattern id="${id}" width="10" height="8" patternUnits="userSpaceOnUse"><rect width="10" height="8" fill="${P2.cream}"/><path d="M1 ${flip ? 7 : 1}h8v${flip ? -6 : 6}h-6v${flip ? 3 : -3}h3" fill="none" stroke="${P2.black}" stroke-width="1.4"/></pattern>`;
      return `<defs>${key("ms-key", false)}${key("ms-keyb", true)}</defs><rect width="${sw}" height="8" fill="url(#ms-key)"/><g transform="translate(0 ${h - 8})"><rect width="${sw}" height="8" fill="url(#ms-keyb)"/></g><rect x="0" y="0" width="${sw}" height="${h}" fill="none" stroke="${P2.black}" stroke-width="2"/>`;
    },
    tag: (text, inset) => {
      const t = text.toUpperCase().replace(/U/g, "V");
      const x = inset + 5;
      const y = inset + 4;
      const w = t.length * 7.4 + 12;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="14" fill="${P2.cream}" stroke="${P2.black}" stroke-width="1.6"/><text x="${x + 6}" y="${y + 10.4}" font-family="${SERIF3}" font-size="8.4" font-weight="700" letter-spacing="1.2" fill="${P2.black}">${escape7(t)}</text>`,
        w: x + w + 4,
        h: y + 18
      };
    },
    bubble: {
      font: SERIF3,
      size: 9,
      charW: 5.3,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => `<path fill="${P2.black}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#f1ead8" stroke="${P2.black}" stroke-width="1.8"/><rect x="${n(x + 2.6)}" y="${n(y + 2.6)}" width="${w - 5.2}" height="${h - 5.2}" fill="none" stroke="${P2.red}" stroke-width=".6"/>`
    }
  };

  // ../hooks/styles/tapestry.ts
  var WOOL = ["#4a1712", "#6e2219", "#93321f", "#b64a2d", "#cf6a4b", "#e08b6c", "#efb39a"];
  var W = {
    madder: [WOOL[0], WOOL[1], WOOL[2], WOOL[3], WOOL[4], WOOL[5]],
    woad: ["#141e38", "#1c2a4a", "#2f4a6a", "#4a6a8e", "#7a96b4", "#b4c4d4"],
    weld: ["#5a3a10", "#8a5a1e", "#c08a2e", "#e2b437", "#f0d27a"],
    green: ["#12241a", "#1e3a27", "#2f5236", "#4d7d3f", "#7aa05a", "#b4c48a"],
    walnut: ["#1a0e08", "#2a1a12", "#4a2e1c", "#6a3f20", "#8e6038", "#b88e5a"],
    cream: ["#cdbfa8", "#e8dab4", "#f2eedf"]
  };
  var DARK2 = "#1a0b08";
  var SERIF4 = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  var PICK = 2.2;
  var pick2 = (ramp, t) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))] ?? ramp[0];
  function wool(color, family) {
    const t = Math.min(1, Math.pow(lum(color), 0.7) * 1.15);
    const warm = isWarm(color);
    switch (family) {
      case "grass":
        return "url(#tp-mille)";
      case "fire":
      case "lamp":
      case "body":
        return pick2(W.weld, t);
      case "stars":
      case "life":
        return W.cream[2];
      case "sky":
      case "water":
        return pick2(warm ? W.madder : W.woad, t);
      case "cloud":
      case "air":
        return pick2(W.cream, t);
      case "foliage":
        return pick2(W.green, t);
      case "bark":
        return pick2(W.walnut, t);
      default:
        return isGreen(color) ? pick2(W.green, t) : warm ? pick2(W.madder, t) : t > 0.75 ? pick2(W.cream, t) : brownish4(color) ? pick2(W.walnut, t) : pick2(W.woad, t);
    }
  }
  function brownish4(color) {
    const c = color.replace("#", "");
    if (c.length !== 6) return false;
    return parseInt(c.slice(0, 2), 16) > parseInt(c.slice(4, 6), 16) + 16;
  }
  var scenery8 = () => painter(
    {
      ink: (color, family, _depth, attr) => attr === "stroke" ? DARK2 : wool(color, family),
      url: (_id, family, attr, g) => attr === "stroke" ? DARK2 : g && meanOf(g).opacity < 0.5 ? "none" : wool(g ? meanOf(g).color : "#808080", family),
      line: (family, depth) => family === "sky" || family === "stars" || family === "life" || family === "lens" || family === "air" || family === "beam" || family === "glow" || depth < 0.25 ? "" : `stroke="${DARK2}" stroke-width="${n(0.6 + depth * 0.6)}" stroke-linejoin="round"`,
      opacity: (_f, v) => v >= 0.4 ? 1 : 0,
      lineless: 0.6,
      faint: "hide",
      redraw: {
        lens: () => "",
        // No reflections: the street and the floor stay plain.
        water: () => "",
        glow: () => "",
        beam: () => "",
        "space.milkyway": (svg, c) => c.repaint(svg.replace(/<ellipse[^>]*\/>/, "")),
        "forest.sun": (_s, c) => c.meta.part === "halo" ? "" : `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n((c.meta.r ?? 7) * 1.5)}" fill="${W.weld[3]}" stroke="${DARK2}" stroke-width="1"/>`,
        "desert.sun": (_s, c) => c.meta.part === "halo" ? "" : `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n((c.meta.r ?? 11) * 1.2)}" fill="${W.weld[3]}" stroke="${DARK2}" stroke-width="1"/>`,
        "night.moon": (_s, c) => `<circle cx="${n(c.meta.cx ?? 0)}" cy="${n(c.meta.cy ?? 0)}" r="${n((c.meta.r ?? 9) * 1.25)}" fill="${W.cream[2]}" stroke="${DARK2}" stroke-width="1"/>`,
        // Mist as banks of undyed wool: cream, a paler pass along their tops, outlined in dark thread.
        air: (svg, c) => {
          const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 4, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true });
          const art = `<path fill="${W.cream[1]}" stroke="${DARK2}" stroke-width=".9" stroke-linejoin="round" d="${banks.map((b) => b.d).join("")}"/><path fill="none" stroke="${W.cream[2]}" stroke-width="1.4" d="${banks.map((b) => b.echo).join("")}"/><path fill="none" stroke="${W.cream[0]}" stroke-width="1.2" d="${banks.map((b) => b.under).join("")}"/>`;
          return `<g>${tiled(`tp-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.motion(svg)}</g>`;
        }
      }
    },
    "tp"
  );
  var hero8 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    let faces = "";
    for (const f3 of outlinedFaces(m)) {
      const k = f3.part === "leg" ? 1.5 : 1.5 + f3.light * 4;
      faces += `<path fill="${WOOL[Math.min(6, Math.round(k))]}" d="${poly(f3.pts, cx, floor)}"/>`;
    }
    const eyes = m.eyes.map((e) => e.poly ? `<path fill="${DARK2}" d="${poly(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${DARK2}" stroke-width="1.6" d="${poly(e.line ?? [], cx, floor, false)}"/>`).join("");
    return `<path fill="${DARK2}" stroke="${DARK2}" stroke-width="2.6" stroke-linejoin="round" d="${hulls}"/>` + faces + eyes;
  };
  var escape8 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var MILLE = `<pattern id="tp-mille" width="22" height="18" patternUnits="userSpaceOnUse"><rect width="22" height="18" fill="${W.green[1]}"/><g transform="translate(4 4)">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${n(Math.cos(i) * 1.6)}" cy="${n(Math.sin(i) * 1.6)}" r="1" fill="#f2eedf"/>`).join("")}<circle r=".8" fill="#e7b52f"/></g><g transform="translate(15 6)">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${n(Math.cos(i * 1.26) * 1.3)}" cy="${n(Math.sin(i * 1.26) * 1.3)}" r="1.1" fill="#c9342a"/>`).join("")}<circle r=".6" fill="#7a1a14"/></g><g transform="translate(9 13)">${[0, 1, 2, 3].map((i) => `<circle cx="${n(Math.cos(i * 1.57) * 1.4)}" cy="${n(Math.sin(i * 1.57) * 1.4)}" r="1" fill="#4161b0"/>`).join("")}</g><path d="M18 15q1.5 -2 3 -1M2 12q1.2 -1.6 2.6 -.8" stroke="#4d7d3f" stroke-width="1" fill="none"/><circle cx="20" cy="2" r=".8" fill="#e2b437"/></pattern>`;
  var TAPESTRY = {
    name: "tapestry",
    label: "Millefleur Tapestry",
    voice: "a gentle medieval tapestry legend",
    cell: "solid",
    figure: "3d",
    font: SERIF4,
    charW: 5.1,
    caption: { fill: "#efe2c0", stroke: DARK2, ink: "#2a2418", radius: 0 },
    paper: { card: "#efe2c0", ink: "#2a2418", kinds: { code: "#2f4a6a", path: "#2f4a6a", fn: "#5a3a6a", num: "#9a2f24", bad: "#9a2f24", good: "#3a5a2a", face: "#c4552e" } },
    inset: 6,
    titleColor: "#efe2c0",
    // The medium: everything woven on the loom's grid.
    grade: () => cells("SourceGraphic", PICK, "woven"),
    art: {
      painter: scenery8,
      hero: hero8,
      sky: W.woad[2],
      ground: W.green[1],
      defs: () => MILLE + // The weave: ribs of the weft, with the warp's shadow between them.
      `<pattern id="tp-weave" width="${PICK}" height="${PICK}" patternUnits="userSpaceOnUse"><path d="M0 ${PICK * 0.72}h${PICK}v${n(PICK * 0.28)}h-${PICK}z" fill="#000" opacity=".22"/><path d="M0 0h${PICK}v${n(PICK * 0.18)}h-${PICK}z" fill="#fff" opacity=".1"/><path d="M${PICK * 0.5} 0v${PICK}" stroke="#000" stroke-opacity=".08" stroke-width=".25"/></pattern><filter id="tp-band" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .18" numOctaves="2" seed="404"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1.8 0 -.7"/></filter>`
    },
    texture: (sw, h) => `<rect width="${sw}" height="${h}" filter="url(#tp-band)" opacity=".25"/><rect width="${sw}" height="${h}" fill="url(#tp-weave)"/>`,
    frame: (sw, h) => {
      const colors = ["#9a2f24", "#e0b050", "#2f4a6a", "#e0b050"];
      const repeat = `<pattern id="tp-border" width="24" height="5" patternUnits="userSpaceOnUse"><rect width="24" height="5" fill="${W.green[0]}"/>` + colors.map((c, i) => `<path d="M${i * 6} 2.5l3 -2.5l3 2.5l-3 2.5z" fill="${c}"/>`).join("") + `</pattern>`;
      return `<defs>${repeat}</defs><rect width="${sw}" height="5" fill="url(#tp-border)"/><g transform="translate(0 ${h - 5})"><rect width="${sw}" height="5" fill="url(#tp-border)"/></g><rect x="0" y="0" width="${sw}" height="${h}" fill="none" stroke="${W.green[0]}" stroke-width="3"/>`;
    },
    tag: (text, inset) => {
      const x = inset + 9;
      const y = inset + 3;
      const w = text.length * 6.6 + 12;
      const ends = `<path d="M${x} ${y}l-5 0l3.5 7.5l-3.5 7.5l5 0zM${n(x + w)} ${y}l5 0l-3.5 7.5l3.5 7.5l-5 0z" fill="#c9b88a" stroke="#9a2f24" stroke-width="1"/>`;
      return {
        svg: ends + `<rect x="${x}" y="${y}" width="${n(w)}" height="15" fill="#efe2c0" stroke="#9a2f24" stroke-width="1"/><text x="${x + 6}" y="${y + 10.6}" font-family="${SERIF4}" font-style="italic" font-size="8.6" fill="#7a2418">${escape8(text)}</text>`,
        w: x + w + 9,
        h: y + 19
      };
    },
    bubble: {
      font: SERIF4,
      size: 9,
      charW: 5.1,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => `<path fill="${DARK2}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#efe2c0" stroke="${DARK2}" stroke-width="1.2"/><rect x="${n(x + 2)}" y="${n(y + 2)}" width="${w - 4}" height="${h - 4}" fill="none" stroke="#9a2f24" stroke-width=".7"/>`
    }
  };

  // ../hooks/styles/ukiyoe.ts
  var P3 = {
    paper: "#e9dcc0",
    blot: "#b9a47a",
    deep: "#1d3866",
    mid: "#3a62a0",
    pale: "#9db6cf",
    foam: "#f6f1e4",
    key: "#1a2238",
    seal: "#b8322a",
    top: "#f1a27c",
    front: "#d9643f",
    side: "#a8472d",
    leg: "#c55a39",
    legDark: "#93402a"
  };
  var INK2 = {
    sky: ["#14284e", P3.deep, P3.mid, "#6e8fb5", P3.pale, "#cdd6d4", P3.paper],
    dawn: ["#a8301f", "#cf5232", "#e88a5a", "#efb486", "#f3d6a8", P3.paper],
    blue: [P3.key, P3.deep, P3.mid, "#6e8fb5", P3.pale, "#cdd6d4"],
    stone: ["#1d2a44", "#33486e", "#5a76a0", "#8ea6c4", "#c4d0d8"],
    pine: ["#16222a", "#1f3330", "#2f4a3a", "#4a6a4c", "#7a9468", "#b4b98a"],
    earth: ["#3a2618", "#5a3a22", "#8a5a32", "#b5844a", "#d8b07a", "#eadab0"],
    bark: ["#22160f", "#3a2418", "#5a3622", "#7a4e30", "#a07048"],
    fire: ["#7a2016", P3.seal, "#cf5232", "#e88a5a", "#f2c14e", P3.foam],
    lamp: ["#c9902e", "#e8b84a", "#f2c14e", "#f6e2a0", P3.foam],
    cloud: [P3.mid, "#6e8fb5", P3.pale, "#d9d8cc", P3.paper, P3.foam],
    foam: [P3.pale, "#d9d8cc", P3.foam]
  };
  var lift = (l) => Math.min(1, Math.pow(l, 0.8) * 1.08);
  function ink4(color, family, depth) {
    const l = lift(lum(color));
    const warm = isWarm(color);
    const green = isGreen(color);
    const far = depth < 0.25 ? 0.12 : 0;
    const t = Math.min(1, l + far);
    switch (family) {
      case "sky":
        return step(warm ? INK2.dawn : INK2.sky, t);
      case "cloud":
      case "air":
        return warm ? step(INK2.dawn, Math.max(0.5, t)) : step(INK2.cloud, t);
      case "stars":
      case "life":
        return warm ? step(INK2.lamp, t) : step(INK2.foam, t);
      case "body":
      case "beam":
      case "glow":
        return warm ? step(INK2.lamp, t) : step(INK2.foam, t);
      case "fire":
        return step(INK2.fire, l);
      case "lamp":
        return warm || l > 0.55 ? step(INK2.lamp, l) : step(INK2.blue, t);
      case "foliage":
      case "grass":
        return warm ? step(INK2.pine, 0.95) : step(INK2.pine, t);
      case "bark":
        return step(INK2.bark, t);
      case "land":
        return green ? step(INK2.pine, t) : warm ? step(INK2.earth, t) : step(INK2.blue, t);
      case "ground":
      case "mark":
        return green ? step(INK2.pine, t) : warm || hueIsBrown(color) ? step(INK2.earth, t) : step(INK2.stone, t);
      case "rock":
        return warm || hueIsBrown(color) ? step(INK2.earth, t) : step(INK2.stone, t);
      case "built":
      case "glass":
        return warm ? step(INK2.earth, t) : step(INK2.stone, t);
      case "water":
        return step(INK2.blue, t);
      default:
        return step(INK2.blue, t);
    }
  }
  function hueIsBrown(color) {
    const c = color.replace("#", "");
    if (c.length !== 6) return false;
    const r2 = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return r2 > b + 18 && r2 >= g;
  }
  var UNLINED4 = ["sky", "glow", "beam", "stars", "life", "lens", "water", "air"];
  function kasumi(c, sw) {
    const banks = mistBanks({ w: Math.min(MIST_TILE, c.meta.sw ?? 640), y: c.meta.y ?? 80, h: c.meta.h ?? 12, seed: 36, rows: (c.meta.h ?? 12) < 12 || c.meta.veil ? 1 : 2, lean: c.meta.lean === true });
    const fill = c.meta.veil ? "#e4dcc4" : "#efe6cc";
    const art = `<path fill="${fill}" stroke="${P3.key}" stroke-width=".5" stroke-linejoin="round" d="${banks.map((b) => b.d).join("")}"/><path fill="none" stroke="${P3.mid}" stroke-width=".35" stroke-opacity=".7" d="${banks.map((b) => b.echo).join("")}"/>`;
    return `<g>${tiled(`uk-mist-${Math.round(c.meta.y ?? 80)}-${Math.round(c.meta.h ?? 12)}`, art, c.meta.sw ?? 640)}${c.meta.anim ?? ""}</g>`;
  }
  var disc2 = (cx, cy, r2, fill) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="${fill}" stroke="${P3.key}" stroke-width=".5"/>`;
  var scenery9 = (sw) => painter(
    {
      ink: (color, family, depth) => ink4(color, family, depth),
      line: (family, depth) => UNLINED4.includes(family) ? "" : `stroke="${P3.key}" stroke-width="${n(0.25 + depth * 0.35)}" stroke-linejoin="round"`,
      opacity: (family, v) => family === "glow" || family === "beam" ? v * 0.55 : family === "air" ? Math.min(1, v * 1.2) : v,
      lineless: 0.6,
      redraw: {
        air: (svg, c) => kasumi({ ...c, meta: { ...c.meta, anim: c.motion(svg) } }, sw),
        "forest.sun": (_svg, c) => c.meta.part === "core" ? disc2(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 7) * 1.5, P3.seal) : "",
        "desert.sun": (_svg, c) => c.meta.part === "core" ? disc2(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 11) * 1.25, P3.seal) : "",
        "night.moon": (_svg, c) => disc2(c.meta.cx ?? 0, c.meta.cy ?? 0, (c.meta.r ?? 9) * 1.15, "#f3ead6"),
        "space.earth": (_svg, c) => {
          const cx = c.meta.cx ?? 0;
          const cy = c.meta.cy ?? 0;
          const r2 = c.meta.r ?? 30;
          return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="${P3.mid}"/><path fill="${P3.deep}" d="M${n(cx + r2 * 0.1)} ${n(cy - r2)}a${n(r2)} ${n(r2)} 0 0 1 0 ${n(r2 * 2)}a${n(r2 * 0.7)} ${n(r2)} 0 0 0 0 ${n(-r2 * 2)}z"/><path fill="none" stroke="${P3.foam}" stroke-width="1" stroke-linecap="round" d="M${n(cx - r2 * 0.8)} ${n(cy - r2 * 0.3)}q${n(r2 * 0.5)} ${n(-r2 * 0.15)} ${n(r2 * 0.9)} 0M${n(cx - r2 * 0.6)} ${n(cy + r2 * 0.25)}q${n(r2 * 0.4)} ${n(-r2 * 0.12)} ${n(r2 * 0.8)} 0"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r2)}" fill="none" stroke="${P3.key}" stroke-width=".6"/>`;
        },
        // A print has no reflections: the wet street and the polished floor stay plain.
        water: () => "",
        lens: () => ""
      }
    },
    "uk"
  );
  var hero9 = () => (m, cx, floor) => {
    const hulls = m.parts.map((pt) => poly(pt.hull, cx, floor)).join("");
    let faces = "";
    let tone3 = "";
    let d = "";
    for (const f3 of outlinedFaces(m)) {
      const t = f3.part === "leg" ? f3.name === "front" ? P3.leg : P3.legDark : f3.name === "top" ? P3.top : f3.name === "front" ? P3.front : P3.side;
      if (t !== tone3 && d) {
        faces += `<path fill="${tone3}" d="${d}"/>`;
        d = "";
      }
      tone3 = t;
      d += poly(f3.pts, cx, floor);
    }
    if (d) faces += `<path fill="${tone3}" d="${d}"/>`;
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="${P3.key}" d="${poly(e.poly, cx, floor)}"/><circle cx="${t1((e.poly[3]?.[0] ?? 0) + cx)}" cy="${t1((e.poly[3]?.[1] ?? 0) + floor)}" r=".45" fill="${P3.foam}"/>` : `<path fill="none" stroke="${P3.key}" stroke-width="1" stroke-linecap="round" d="${poly(e.line ?? [], cx, floor, false)}"/>`
    ).join("");
    return `<path fill="${P3.key}" opacity=".28" d="${poly(m.shadow, cx, floor)}"/><path fill="${P3.front}" stroke="${P3.key}" stroke-width="1.5" stroke-linejoin="round" d="${hulls}"/><g stroke="${P3.key}" stroke-width=".5" stroke-linejoin="round">${faces}</g>` + eyes;
  };
  var SERIF5 = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
  var escape9 = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var UKIYOE = {
    name: "ukiyoe",
    label: "Ukiyo-e",
    voice: "a calm Edo-period woodblock print",
    cell: "solid",
    figure: "3d",
    font: SERIF5,
    charW: 5.1,
    caption: { fill: "#f3ead6", stroke: P3.key, ink: P3.key, radius: 0 },
    paper: { card: "#f3ead6", ink: P3.key, kinds: { code: "#2f4d7a", path: "#2f4d7a", fn: "#5a3a6a", num: P3.seal, bad: P3.seal, good: "#3a5a3a", face: P3.seal } },
    inset: 4,
    titleColor: P3.key,
    art: {
      painter: scenery9,
      hero: hero9,
      sky: P3.paper,
      ground: P3.key,
      defs: () => `<filter id="uk-paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8 .5" numOctaves="3" seed="36"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .15  -1.6 0 0 0 1"/></filter><linearGradient id="uk-bokashi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P3.deep}" stop-opacity=".55"/><stop offset="1" stop-color="${P3.deep}" stop-opacity="0"/></linearGradient>`
    },
    texture: (sw, h) => (
      // The bokashi along the top of the sheet, and the paper's grain over the whole print.
      `<rect width="${sw}" height="18" fill="url(#uk-bokashi)"/><rect width="${sw}" height="${h}" filter="url(#uk-paper)" opacity=".3"/>`
    ),
    frame: (sw, h) => `<rect x="1.5" y="1.5" width="${sw - 3}" height="${h - 3}" fill="none" stroke="${P3.paper}" stroke-width="3"/><rect x="3.5" y="3.5" width="${sw - 7}" height="${h - 7}" fill="none" stroke="${P3.key}" stroke-width="1"/>`,
    tag: (text, inset) => {
      const t = text.toUpperCase();
      const w = t.length * 6.2 + 12;
      const x = inset + 6;
      const y = inset + 5;
      return {
        svg: `<rect x="${x}" y="${y}" width="${n(w)}" height="13" fill="#f3ead6" stroke="${P3.key}" stroke-width="1"/><rect x="${x - 2}" y="${y - 2}" width="${n(w + 4)}" height="17" fill="none" stroke="${P3.key}" stroke-width=".5"/><text x="${x + 6}" y="${y + 9.5}" font-family="${SERIF5}" font-size="8" font-weight="600" letter-spacing="1.2" fill="${P3.key}">${escape9(t)}</text><rect x="${n(x + w + 6)}" y="${y - 1}" width="11" height="12" rx="1" fill="${P3.seal}"/><text x="${n(x + w + 11.5)}" y="${y + 8.4}" text-anchor="middle" font-family="${SERIF5}" font-size="8" font-weight="700" fill="${P3.paper}">C</text>`,
        w: x + w + 22,
        h: y + 19
      };
    },
    bubble: {
      font: SERIF5,
      size: 9,
      charW: 5.1,
      line: 12,
      base: 13,
      draw: ({ x, y, w, h }, { base, tip }) => (
        // A printed cartouche: cream, ruled twice in key, with a cut wedge pointing at Claude.
        `<path fill="${P3.key}" d="M${n(base[0][0])} ${n(base[0][1])}L${n(tip[0])} ${n(tip[1])}L${n(base[1][0])} ${n(base[1][1])}z"/><rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="#f3ead6" stroke="${P3.key}" stroke-width="1.2"/><rect x="${n(x + 2)}" y="${n(y + 2)}" width="${w - 4}" height="${h - 4}" fill="none" stroke="${P3.key}" stroke-width=".4"/>`
      )
    }
  };

  // ../hooks/looks.ts
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var PAPER2 = {
    card: "#f6f1e7",
    ink: "#2b2420",
    kinds: { code: "#186a5a", path: "#2b5f9e", fn: "#7b3fa0", num: "#b5541a", bad: "#b3261e", good: "#2e7d32", face: "#c4613f" }
  };
  var ORIGINAL = {
    name: "original",
    label: "Original",
    voice: "",
    cell: "solid",
    figure: "pixel",
    font: MONO,
    charW: 5.7,
    caption: { fill: "#2b1c1a", stroke: "#cfc8b8", ink: "#ece9df", radius: 2 }
  };
  var PIXEL = { ...ORIGINAL, name: "pixel", label: "Pixel Art", pixel: true };
  var LOOKS = {
    pixel: PIXEL,
    original: ORIGINAL,
    cave: CAVE,
    blueprint: BLUEPRINT,
    mosaic: MOSAIC,
    aero: AERO,
    engraving: ENGRAVING,
    tapestry: TAPESTRY,
    golden: GOLDEN,
    ukiyoe: UKIYOE,
    kamon: KAMON
  };
  var LOOK_NAMES = Object.keys(LOOKS);
  var DEFAULT_LOOK = "pixel";
  var STYLE_NAMES = LOOK_NAMES.filter((name) => name !== "pixel" && name !== "original");
  var lookFor = (name) => LOOKS[name ?? DEFAULT_LOOK] ?? PIXEL;

  // ../hooks/hero3d.ts
  var SKIN = {
    body: { dark: "#a9583d", light: "#f0ac8e" },
    arm: { dark: "#a9583d", light: "#eba083" },
    leg: { dark: "#8f4a33", light: "#d4785a" },
    eye: "#1f1412"
  };
  var STEPS = 6;
  var n1 = (v) => (Math.round(v * 10) / 10).toString();
  function mix2(a, b, t) {
    const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, "0")).join("")}`;
  }
  var shadeOf = (part, light) => {
    const skin = SKIN[part === "eye" ? "body" : part];
    const step2 = Math.round(Math.pow(light, 0.8) * (STEPS - 1)) / (STEPS - 1);
    return mix2(skin.dark, skin.light, step2);
  };
  var poly2 = (pts, dx, dy) => `M${pts.map(([x, y]) => `${n1(x + dx)} ${n1(y + dy)}`).join("L")}Z`;
  function modelSvg(m, cx, floor) {
    const shadow = `<path fill="#1f1e1d" opacity=".22" d="${poly2(m.shadow, cx, floor)}"/>`;
    const runs = [];
    for (const f3 of m.faces) {
      const fill = shadeOf(f3.part, f3.light);
      const last = runs[runs.length - 1];
      if (last && last.fill === fill) last.d.push(poly2(f3.pts, cx, floor));
      else runs.push({ fill, d: [poly2(f3.pts, cx, floor)] });
    }
    const paths = runs.map((r2) => `<path fill="${r2.fill}" stroke="${r2.fill}" d="${r2.d.join("")}"/>`).join("");
    const faces = `<g stroke-width=".5" stroke-linejoin="round">${paths}</g>`;
    const eyes = m.eyes.map(
      (e) => e.poly ? `<path fill="${SKIN.eye}" d="${poly2(e.poly, cx, floor)}"/>` : `<path fill="none" stroke="${SKIN.eye}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" d="M${(e.line ?? []).map(([x, y]) => `${n1(x + cx)} ${n1(y + floor)}`).join("L")}"/>`
    ).join("");
    return shadow + faces + eyes;
  }
  function motionSvg(motion, o) {
    const frames = Math.min(MOTION_TIMING[motion].frames, o.maxFrames ?? Infinity);
    const { dur } = MOTION_TIMING[motion];
    const s = o.height / MODEL_H;
    const timing = o.until !== void 0 ? `repeatDur="${n1(o.until)}s"` : o.from !== void 0 ? `begin="${n1(o.from)}s" repeatCount="indefinite"` : 'repeatCount="indefinite"';
    const groups = Array.from({ length: frames }, (_, k) => {
      const model = build(poseAt(motion, k / frames, o.yaw), s);
      const at = (v) => (Math.round(v / frames * 1e4) / 1e4).toString();
      const anim = k === 0 ? `<animate attributeName="visibility" values="visible;hidden" keyTimes="0;${at(1)}" calcMode="discrete" dur="${dur}s" ${timing}/>` : `<animate attributeName="visibility" values="hidden;visible;hidden" keyTimes="0;${at(k)};${at(k + 1)}" calcMode="discrete" dur="${dur}s" ${timing}/>`;
      return `<g visibility="hidden">${(o.hero ?? modelSvg)(model, o.cx, o.floor)}${anim}</g>`;
    });
    return { svg: groups.join(""), frames };
  }

  // ../hooks/monocraft.ts
  var MONOCRAFT = "d09GMgABAAAAAAZ8AA4AAAAAGbAAAAYqAAQzMwAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbEBwgBmAAXBEICqp0n0MBNgIkA4FOC4FOAAQgBQYHIBs6ElFUauah+JGQuXmpGSpEHC6UebToe7Lin+Dpf7/f75kzT/wgIhkqlGzNk9mNRLVMgyShsFidpk2s2//5aP1eVvIKJdnl0ZqxpY1nPMyHrlqTp07qUxInDt7/Lt4QFaiAPT5gG7AN2Fz1VrwD9h/Y5Me5T5vcANghCcXujJ3Qv8lLcr8vbY8Q0j9qR0Du/IDVTpiBUkB20mwbS4920/bHuRQx8jVigPRpiQCy6CGhEPIIgYA0wYIdjB/cpR4dHZ9YID8xtDAF5mPA9Fd2iQG91n/ACVhG49iTilxmUvMHWxEO0Ih+3w2NTfvuJqwy1P7xnbQG7XdnDqynSl1NKQ6CKcZZdp65KG/hLy711NjetNu0H8IxcGH8m+EtXIWN197n++c7BB0VN1S47DgAbslsm/grJOaQnt+hDtuDVAgXMfq/Blq2GYG+bXqt3Vqz1U4rTcomYWJt9nHkXFTpaysRdG70bmnU/66V1XI2G5vxxj5fWVyZzP5PbC3tEkqHtSy5XFxaXOwzLd1wRenitD9GhqJ0ab4VRu1c5FvNQNe+7nYuxvuZxoY3pi5F9DhjHBotIS5lMjC8yw1SNaGL8bonC7IbD+UxaYLIE9+ORBA2C0QfbnaevRrE1iX8NqWKFERzxQ1Vv7cjJkaBvqjKADw2SC63u/RdggmbALDOQUlLHGgBMJ43PREGk4QW9Vgoan0TUHAwe0YM4VTqog4OiQandY8hOZlyhmtqe2SOymY4oykH58YS0LRgLRLjUjGgb2NxytYQixW0Yqwt/OGAJR4wkr0dccLEVHpB9Wd5YVTDLlriIRnOqlFmkSklEku1bIJlRTvDzXLktCT6t0w9ODsQGGnCIF0tN1avpCJEMyPFMxFfYrqLCVmlcmNuSCN39HMUiSrW1JYYh6Jhl77TLFOwm1pFJh9DNv16POQQquwkJqQiT3TFQtYmXkkCyaiSBcuADp6pbhft9wMLSQukCDnRZjmxJksRLa6r3rGNjO8OqTsqYO/J1OCQTakTXNKEYaIhuE6Zqc5gkWTqIAU8dFK+0CIM4lQ6Gz2JAcVQhqpSGFHYBBRgajCdm1B8w+xYKN5WfvP8rkB9NEcsjiYLrGNfG9K4dOAbGPwjE+KNC+TFWCB9GTeDMRWUS8jtBea0oZSWKqsx5TaihQgUg/BVJBjtJrJTgTV1upJMSgOhARlTcDFQXTOrm0AAIzbx3I2URoy6QWIR+OwCReGkFPxBGG90xkwCCIeEwQFSNXQZuFmLDTxgEZw9xIBReCIyJQmcyIaTxNf55l7jfQG9T2lKdV9gfwoAdDBNRHVliCWMGi1jQ442mpGCT6m9KTrYsYw5RfepU4CDgscUU+fYH3Q73d3Se5r8XoJRAYnqdJMWIWAA5q8h0QHgFKkAbQAIFAodhSlomWfGOv1NmGi36JSFz8rEDIGQ8oYhpoa1qFHV8jRQO9lmTEXF3lyUuj8G06uwk5sCTMKD9PucjjPo71aDeV6M0HN0LzGYKGVfMvwUGAKTUBIP2k8IgcNkOKplmDXQYX5yI3yADQ3MBb9nHGmZoTTDo2VHgOk+TqADpj9NWUx6zFgWJ+9wZvulnBLCsA5PLBcdgcMc8BTN8EC7GW2W6qw/fVivgYPHsnZ68ITQuGjAuCQwMnpfTzE9Ag5nPaMLx3oFBUjEXX6OF0nBTRHOrvq0wFIvZ7DhW4oV6qJ5ERHEPbI06McIjBp17N5CNskzgF3Um/DSWQQQkMuoqPeq2xpS6BsqS2szPJGgv/ku9h7tS2FaSbxMKVqucSxbiH7/Uw8Bi4o+xn+Rr7qgNMagn0Wu76m+wdBTJAaNopVJnjaATOQftsJe2jct7fLKyXjqpZwY6WABKpkqPDESQyNRLvuGfDrKiqBQjtW9CUJ65gfEErpCMJlUYHAtCIZ5Cl92n2xu62LJ6IFEzYdewTodzFdR/kmojq9oowPM8Ry6+6UAGxhMvWmW0cJQrbv79+fOP4zT/0m3Q4Cv/vNH8L4XCH4QdgkkKa6W8S8Gz1D5hbMzCBLcsq/cCnwTCcOUCBFGasdauR0zgopnhHNFIJDXM6Y9fhXbeK5vIrbqxvmf1GWHel6cyr3CKV1gAQ==";
  var MONOCRAFT_BOLD = "d09GMgABAAAAAAeoAA4AAAAAGowAAAdWAAQzMwAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbEBwgBmAAXBEICqxQoB8BNgIkA4FOC4FOAAQgBQYHIBuWEqOiTk1OKoK/SMjGkLDPXqkbx5qIGw6ivNjRa6rvvMnfqFTRxK0gsrGc3QcqAMcT+QpZB6QAdVNPaFsHgBJREcSj6vma7n2GnCKfnURfV8Dp07B22UMFgLGgnqJmLL/C93lSLeOFpxUrFjCAH7D4a9XY6s0UJHoUwOjZ6okV/nsv6uucBQnYZmnbGqcAC2wabAL2H9gPYMD64gIGbBqsAzb1f9OanRy1qNIlD8VDOB5WJP//2WFnMqRtdu8umyu1Tl4orVq6PUeTpUqHAqGwmNmyOGpgD8jlyKZxFKMxAgs2+5qxCODFzWxFECqRYNHda5+e6K9FEYNWVFU341Nd2lwL/QpY9Uw3sYFu6xdgyD1A7WRIaBWna8ZSrWAB4rj55DBx8b2WXdMote6Jk7Q9aL2lJAZ7Sy1LMchR0m+xUvgvfHCi2Glhltu4lPju+F5jgDhm6L9hnszXtD0W3F/dXyLc1AkSqXwpVeVYR/PbwP4IjkXYk6hrFd9tIcgRSYQYUyvijHstRM6wgo+WOKvZi+HkWbhUqTdvOT5WLZpOtdwEXlNNde3uXV17c+lUHaZBfTwDnh1zl7k9aYYt3H0/lcAwSwtt9mfWlmV5DEqN2XRt8nK7VZvON52z2Rb2ztSkpiudlWbZvcJputWXqk/ePY3aIz4j+9/DX8VmjvK6jHWw1UZsaKMgh7CrOqIehpvI761qGsK03XV/il21mIQJ9XzQNDpNz23k++me8EiG5UCGYtEWGFcNl2xZnjMnfj2M9ReUuh628txLz07XkG09V/UEslrcWjGm8TYzJAI6hIwwBGXWZktGZDG815f86TOPKY4Ut09cWlBM7/TxWQL0qw0UjockD6VNHPAl7moMk2uYpKziV2ILgFa9VmNGV7+pgFpfi0wX1Bh1U3/aUc0jCOL1+SZVwE7eoOM2l4we18CtPLbbAjklzre5MOnbIiMHER/BvmmYoU1xGrd74rjSoSs5KIqOWmxjRIHDjlC6ngErUzXVDO2rVU6oyJ5M5bAExl1JA6I+SVaZX2toC7JsFSMUaZqGsqXM7EFOZZvFIMMsDAOKJVPQ2TKMUTfMkYEpBvIwA4cCZsUyXdllEI/GBxA6CPGTZll+zqDhuQdzNZ6MhLbjhoyGVVOYh+LpjqsdpYuGQgU5/T3FbQdGZz10Ebk2ajojHfPKVnIGT8ywko2Ph4qdALsLOmSXmeboBKE96ETo36m2oWSg/X6D8a0NgiYzgzM+Ef8xYBSm7GwVG5mBDrKyG8vbJpA5L5oortqdbZx+ZPLzSfmuhPJQSvYuFDnTtK1AFzvlbjMR5uDn15MPneZzt5lD0CKrxGIO4eiAN7Ylc5g7R+ohN4yGLURHZhA8VD+9piENIQ1jTBqzJVvihuJSTKuLHSX2fyOa+7MnKVsCria5Z4eM/9hLdqefH8DqUamjUq3cEXHeKRRCSUZC/rkZJSuahCRRhcYrg8fzq9iB7ZJSEL9u5YyIf78zpNhfUpUUQreOv4gTirSh+ZWHWkWShiR/pf9utIDywBKLuWDxwPk6IpOBGEJY8m+tdMwAln2d7iAOUvjmPmv/SF0ajhMb5Z/8kVdiuWnsnS4AWZXJMUpUC/if9pk0Sai+j7+n9XHneh0gYnabr9GVZmOEST5dQVWmS1KplnSkmSEpTVg70dxM7yy9zaT3mgugaeX9zUWDKooyj4XzBp6Vv5/q0b7wbafQTknxMYxJ5/+LvlXmlLOZv91ssutWkkxZDqn9S2UMMty3hen08PNt69Ha/758sEe2f9atIqFAygFPHQiDR1zB4tbGKpsor9V9Q5K+eHp8vaSnsDZXVJUYZ3qS6O3w/Vo3MRyxWemFzYimApT/yEGT5pqgrnSFugdxhHB9eLdL0bY3SSSa7WbZ8ZWgjOvUFvrklP56r5R+NiYJlQxEYdGhPaMU12xzJZ280NT6L68eI+WMDygjtSjKbAs5eLSp5YcQGmRXA548u5k5QH0cIQjduegULGrWILfE5oKgLgMBGHbhUPmJIhPvSQwddPcISVaXhfvRsT4aawfemT6l8yXa8RCltGqscohomPt9mqLGKY7CffRbrgz6H5Y4qGSvsSo+/Xxqz6oqxUipcU9+dErNngHsb6mJuhKbnuTnKxjr/SCa7edbig9PW5GOq3X1Z6uK7QYhQSxfXFQS8O3F4mmAhYIeO2/rF6thS//YkObjmfKRvd2WbHACysDNDC0EgQtjzdX/kshza2kpEd1kpkk0n/IzkA7wjWUvsOyOU1H30ryxxuJweZ3AT1hHJvnv3gqJHEl6EfCAxxiu0jp7EG8xBh3TO2/oA8vHhzZC9LgBUP7eZY4SDqOVBgQF5YGdO8TNauFXrWlpFfHNa7Fv/nddazbAW9HYjfvB8Sjz+f93sa97yI8TPNqm7WAT7vUMWj26mvMzhA1MIQm4owSkO6CgdggY2V1uQ5GE5jR5wfwmh6tEkgMdUVkkX4rRYp79VfJF1iH3ZqcdC88zI6QCAw==";

  // ../hooks/scenery.ts
  var f2 = (v) => (Math.round(v * 10) / 10).toString();
  var between = (rand, a, b) => a + rand() * (b - a);
  var H = 128;
  var rgb2 = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  function mix3(a, b, t) {
    const x = rgb2(a);
    const y = rgb2(b);
    return `#${x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * t).toString(16).padStart(2, "0")).join("")}`;
  }
  var vgrad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === void 0 ? "" : ` stop-opacity="${a}"`}/>`).join("")}</linearGradient>`;
  var rgrad = (id, color, strength2 = 0.55) => `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${strength2}"/><stop offset=".3" stop-color="${color}" stop-opacity="${f2(strength2 * 0.32)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  function noise(rand, waves) {
    const phases = waves.map(() => rand() * Math.PI * 2);
    return (x) => waves.reduce((t, [amp, len], i) => t + amp * (0.5 + 0.5 * Math.sin(x / len * Math.PI * 2 + (phases[i] ?? 0))), 0);
  }
  function smooth(points, floor) {
    const p = points;
    let d = `M${f2(p[0][0])} ${f2(floor)}L${f2(p[0][0])} ${f2(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)];
      const b = p[i];
      const c = p[i + 1];
      const e = p[Math.min(p.length - 1, i + 2)];
      d += `C${f2(b[0] + (c[0] - a[0]) / 6)} ${f2(b[1] + (c[1] - a[1]) / 6)} ${f2(c[0] - (e[0] - b[0]) / 6)} ${f2(c[1] - (e[1] - b[1]) / 6)} ${f2(c[0])} ${f2(c[1])}`;
    }
    return `${d}L${f2(p[p.length - 1][0])} ${f2(floor)}z`;
  }
  function ridge(sw, base, h, step2 = 16, floor = H + 4) {
    const pts = [];
    for (let x = -step2; x <= sw + step2; x += step2) pts.push([x, base - h(x)]);
    return smooth(pts, floor);
  }
  var orb = (cx, cy, r2, color, id) => `<radialGradient id="${id}" cx=".38" cy=".36" r=".7"><stop offset="0" stop-color="white" stop-opacity=".22"/><stop offset=".6" stop-color="black" stop-opacity="0"/><stop offset="1" stop-color="black" stop-opacity=".42"/></radialGradient><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r2)}" fill="${color}"/><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r2)}" fill="url(#${id})"/>`;
  function stars(rand, sw, n3, bottom, avoid) {
    let dim = "";
    let bright = "";
    let twinkle = "";
    for (let i = 0; i < n3; i++) {
      const x = between(rand, 3, sw - 3);
      const y = 3 + (bottom - 3) * rand() ** 1.8;
      if (avoid && Math.hypot(x - avoid[0], y - avoid[1]) < avoid[2]) continue;
      const d = `M${f2(x)} ${f2(y)}h1v1h-1z`;
      if (i % 11 === 0) twinkle += `<path d="${d}" fill="white"><animate attributeName="opacity" values=".9;.2;.9" dur="${f2(between(rand, 3, 6))}s" begin="${f2(-rand() * 5)}s" repeatCount="indefinite"/></path>`;
      else if (rand() < 0.25) bright += d;
      else dim += d;
    }
    return `<path d="${dim}" fill="white" opacity=".3"/><path d="${bright}" fill="white" opacity=".7"/>${twinkle}`;
  }
  var clip = (svg) => `<g clip-path="url(#sc-stage)">${svg}</g>`;
  function texture(id, fx, fy, dark, light, seed, octaves = 2) {
    return `<filter id="${id}" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="${octaves}" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${dark} 0 0 0 ${f2(-dark * 0.52)}" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 ${light} 0 0 ${f2(-light * 0.56)}" result="l"/><feComposite in="d" in2="SourceAlpha" operator="in" result="dm"/><feComposite in="l" in2="SourceAlpha" operator="in" result="lm"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dm"/><feMergeNode in="lm"/></feMerge></filter>`;
  }
  function material(id, palette, fx, fy, octaves, seed, contrast = 2.6) {
    const ch = (i) => palette.map((c) => (parseInt(c.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(" ");
    const o = f2(0.5 - contrast * 0.5);
    return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="${octaves}" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="${contrast} 0 0 0 ${o}  ${contrast} 0 0 0 ${o}  ${contrast} 0 0 0 ${o}  0 0 0 0 1" result="g"/><feComponentTransfer in="g" result="m"><feFuncR type="discrete" tableValues="${ch(0)}"/><feFuncG type="discrete" tableValues="${ch(1)}"/><feFuncB type="discrete" tableValues="${ch(2)}"/></feComponentTransfer><feComposite in="m" in2="SourceGraphic" operator="arithmetic" k1="1.5" k2="0" k3="0" k4="0" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter>`;
  }
  var LIGHT2 = `<filter id="sc-dof" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter><filter id="sc-haze" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="3"/></filter><filter id="sc-bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>`;
  var bloom = (svg, opacity = 0.8) => `<g filter="url(#sc-bloom)" opacity="${opacity}">${svg}</g>${svg}`;
  var glow = (svg) => `<g filter="url(#sc-glow)">${svg}</g>`;
  function forest(c) {
    const { rand, sw, ground } = c;
    const mid = ground - 6;
    const sunX = sw * 0.7;
    const sunY = 58;
    const clearing = 30;
    const KEY = "#ffe2b2";
    const RIM = "#f7c88a";
    const SHADE = "#5f6f80";
    const DEEP = "#3a4252";
    const haze = "#c9cfae";
    const near = (x) => Math.max(0, 1 - Math.abs(x - sunX) / (sw * 0.45));
    const cloud = (x, y, w) => `<g filter="url(#sc-soft)"><path fill="#58706e" d="M${f2(x)} ${f2(y)}q${f2(w * 0.25)} -3.2 ${f2(w * 0.5)} -2.4q${f2(w * 0.3)} -2.6 ${f2(w * 0.5)} 1.2q${f2(-w * 0.5)} 2.2 ${f2(-w)} 1.2z"/><path fill="#f2c08a" opacity=".8" d="M${f2(x + w * 0.08)} ${f2(y + 0.4)}q${f2(w * 0.42)} 1.4 ${f2(w * 0.86)} -0.4q${f2(-w * 0.42)} -0.6 ${f2(-w * 0.86)} 0.4z"/></g>`;
    const sun2 = { cx: sunX, cy: sunY, r: 7 };
    const sky3 = () => c.p.el("forest.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/>`, { sw }) + c.p.el("forest.sun", `<circle cx="${f2(sunX)}" cy="${sunY}" r="160" fill="url(#sc-sunwide)"/><circle cx="${f2(sunX)}" cy="${sunY}" r="46" fill="url(#sc-sun)"/>`, { ...sun2, part: "halo" }) + c.p.el("forest.clouds", cloud(sw * 0.04, 30, 150) + cloud(sw * 0.36, 20, 110) + cloud(sw * 0.56, 38, 90) + cloud(sw * 0.82, 26, 100), { sw }) + c.p.el("forest.sun", bloom(`<circle cx="${f2(sunX)}" cy="${sunY}" r="7" fill="#fff8e6"/>`, 1), { ...sun2, part: "core" });
    const firRow = (base, hgt, spacing, color, rimOn, width = sw) => {
      let d = "";
      const r2 = ["", "", ""];
      for (let x = -spacing; x < width + spacing; x += spacing * between(rand, 0.7, 1.2)) {
        const h = hgt(x) * between(rand, 0.85, 1.1);
        const w = h * 0.36;
        const b = base(x);
        d += `M${f2(x - w / 2)} ${f2(b)}L${f2(x - w * 0.18)} ${f2(b - h * 0.5)}L${f2(x - w * 0.3)} ${f2(b - h * 0.5)}L${f2(x)} ${f2(b - h)}L${f2(x + w * 0.3)} ${f2(b - h * 0.5)}L${f2(x + w * 0.18)} ${f2(b - h * 0.5)}L${f2(x + w / 2)} ${f2(b)}z`;
        const k = near(x);
        if (rimOn && k > 0.25) {
          const side = x < sunX ? 1 : -1;
          r2[Math.min(2, Math.floor((k - 0.25) * 4))] += `M${f2(x)} ${f2(b - h)}L${f2(x + side * w * 0.3)} ${f2(b - h * 0.5)}L${f2(x + side * w * 0.22)} ${f2(b - h * 0.5)}z`;
        }
      }
      return `<path fill="${color}" d="${d}"/>` + r2.map((p, i) => p ? `<path fill="${RIM}" opacity="${f2(0.2 + i * 0.14)}" d="${p}"/>` : "").join("");
    };
    const farA = noise(rand, [[8, 160], [5, 60]]);
    const TILE = 420;
    const mirrorTile = (svg, id) => {
      if (sw <= TILE) return svg;
      let uses = "";
      for (let k = 1; k * TILE < sw; k++) uses += `<use href="#${id}" transform="${k % 2 ? `matrix(-1 0 0 1 ${(k + 1) * TILE} 0)` : `translate(${k * TILE} 0)`}"/>`;
      return `<g id="${id}">${svg}</g>${uses}`;
    };
    const farB = noise(rand, [[12, 200], [6, 70]]);
    const farRidge = `<path fill="${mix3("#7f9c8a", haze, 0.4)}" d="${ridge(sw, 80, noise(rand, [[10, 300], [4, 90]]))}" filter="url(#sc-dof)"/>`;
    const farRow = `<g filter="url(#sc-dof)">${mirrorTile(firRow((x) => 86 - farA(x) * 0.2, (x) => 16 + farA(x), 7, mix3("#6f9080", haze, 0.45), false, Math.min(sw, TILE)), "sc-rowa")}</g>`;
    const farMist = `<rect x="${-sw * 0.1}" y="74" width="${sw * 1.2}" height="20" fill="url(#sc-mist)"><animateTransform attributeName="transform" type="translate" values="0 0;${f2(sw * 0.04)} 0;0 0" dur="34s" repeatCount="indefinite"/></rect>`;
    const midRow = firRow((x) => 93 - farB(x) * 0.15, (x) => 22 + farB(x), c.detail < 1 ? 12 : 9, "#4c6c60", true);
    const midMist = `<rect x="${-sw * 0.1}" y="86" width="${sw * 1.2}" height="16" fill="url(#sc-mist)" opacity=".7"><animateTransform attributeName="transform" type="translate" values="0 0;${f2(-sw * 0.03)} 0;0 0" dur="28s" repeatCount="indefinite"/></rect>`;
    const far = () => c.p.el("forest.ridge", farRidge, { sw }) + c.p.el("forest.firs-far", farRow, { sw }) + c.p.el("forest.mist", farMist, { lean: c.detail < 1, sw, y: 74, h: 20 }) + c.p.el("forest.firs-mid", midRow, { sw }) + c.p.el("forest.mist", midMist, { lean: c.detail < 1, sw, y: 86, h: 16 });
    const shafts = [-0.5, -0.26, -0.06, 0.16, 0.38].map((k, i) => {
      const x0 = sunX + k * 30;
      const x1 = sunX + k * 300;
      const w0 = 6 + i % 2 * 4;
      const w1 = 34 + i % 3 * 14;
      return `<path d="M${f2(x0 - w0)} ${sunY}L${f2(x0 + w0)} ${sunY}L${f2(x1 + w1)} ${ground + 6}L${f2(x1 - w1)} ${ground + 6}z" fill="url(#sc-shaft)"><animate attributeName="opacity" values=".55;1;.55" dur="${9 + i * 2.5}s" begin="${-i * 2}s" repeatCount="indefinite"/></path>`;
    }).join("");
    const UNIT = 60;
    const KINDS = 6;
    let templates = "";
    for (let n3 = 0; n3 < KINDS; n3++) {
      const tierCount = 4 + Math.min(3, Math.floor(n3 / 1.5));
      const w = UNIT * between(rand, 0.4, 0.52);
      let body = "";
      let half = "";
      let under = "";
      let rimD = "";
      for (let i = 0; i < tierCount; i++) {
        const k = (i + 1) / tierCount;
        const top2 = -UNIT + UNIT * 0.7 * i / tierCount;
        const bottom = top2 + UNIT * 0.7 / tierCount + UNIT * 0.13;
        const hw = w / 2 * (0.3 + 0.7 * k);
        const sag = 2 + k * 3;
        const hl = hw * between(rand, 0.82, 1.12);
        const hr = hw * between(rand, 0.82, 1.12);
        const lean = (rand() - 0.5) * 1.2;
        const side = (h, dir) => {
          let d = "";
          for (const t of [0.3, 0.55, 0.8]) {
            const x = dir * h * t * (0.75 + t * 0.2);
            const y = top2 + (bottom - top2) * t;
            d += `L${f2(x + dir * between(rand, 0.8, 2))} ${f2(y + between(rand, 0.4, 1.4))}L${f2(x)} ${f2(y - 0.6)}`;
          }
          return d;
        };
        const tuft = [];
        const teeth = Math.max(4, Math.round((hl + hr) / 3.6));
        for (let q = 0; q <= teeth * 2; q++) {
          const u = -hl + (hl + hr) * q / (teeth * 2);
          const reach = Math.abs(u) / (u < 0 ? hl : hr);
          const y = bottom - sag * 0.6 * (1 - reach ** 2) + (q % 2 ? 0 : 1.2 + reach * 1.4) + (rand() - 0.5) * 0.8;
          tuft.push([u + lean * (1 - reach), y]);
        }
        const edge = tuft.map(([x, y]) => `L${f2(x)} ${f2(y)}`).join("");
        const left = side(hl, -1);
        body += `M${f2(lean)} ${f2(top2)}${left}${edge}${side(hr, 1).split("L").filter(Boolean).reverse().map((q) => "L" + q).join("")}z`;
        half += `M${f2(lean)} ${f2(top2)}${left}L${f2(-hl)} ${f2(bottom)}L${f2(lean * 0.5)} ${f2(bottom - sag * 0.6)}z`;
        under += `M${tuft.map(([x, y]) => `${f2(x)} ${f2(y + 0.2)}`).join("L")}L${[...tuft].reverse().map(([x, y]) => `${f2(x)} ${f2(y - 2.4 - (1 - Math.abs(x) / hw) * 0.8)}`).join("L")}z`;
        rimD += `M${f2(lean)} ${f2(top2)}L${f2(hr * 0.85)} ${f2(bottom - 0.5)}l${f2(-2.4)} -1.4L${f2(lean)} ${f2(top2 + 1.6)}z`;
      }
      templates += `<g id="sc-fir${n3}"><path d="${body}"/><path fill="currentColor" opacity=".5" d="${half}"/><path fill="currentColor" d="${under}"/></g><path id="sc-firrim${n3}" fill="${RIM}" d="${rimD}"/>`;
    }
    const TW = UNIT * 0.07;
    const TT = -UNIT * 0.22;
    templates += `<g id="sc-trunk"><path d="M${f2(-TW / 2)} ${f2(TT)}h${f2(TW)}l${f2(TW * 0.25)} ${f2(-TT - 2)}l${f2(TW * 0.6)} 2H${f2(-TW * 1.35)}l${f2(TW * 0.6)} -2z"/><path fill="currentColor" d="M${f2(-TW * 1.35)} 0l${f2(TW * 0.6)} -2h${f2(TW * 1.5)}l${f2(TW * 0.6)} 2z"/></g><path id="sc-trunkkey" fill="${KEY}" d="M${f2(TW / 2 - 1)} ${f2(TT)}h1v${f2(-TT - 2)}h-1z"/>`;
    const firs = [];
    for (const [depth, lo, hi, gapLo, gapHi] of [[-4, 34, 48, 16, 34], [0, 44, 68, 22, 52]].slice(c.detail < 1 ? 1 : 0)) {
      for (let x = between(rand, 4, 20); x < sw - 4; x += between(rand, gapLo, gapHi) * (c.detail < 1 ? 1.2 : 1)) {
        if (Math.abs(x - sunX) < clearing + (depth < 0 ? 0 : 10)) continue;
        const kind = depth < 0 ? Math.floor(rand() * 3) : Math.floor(rand() * KINDS);
        firs.push({ x, h: between(rand, lo, hi), kind, base: mid + depth });
      }
    }
    let trunks = "";
    let tiers = "";
    let shadows = "";
    const rows = [];
    let lastBase = firs[0]?.base;
    for (const t of firs) {
      if (t.base !== lastBase) {
        rows.push({ trunks, tiers });
        trunks = "";
        tiers = "";
        lastBase = t.base;
      }
      const back2 = t.base < ground - 6;
      const glowAt = near(t.x) ** 2;
      const toSun = t.x < sunX ? 1 : -1;
      const sc = t.h / UNIT;
      const at = `transform="translate(${f2(t.x)} ${f2(t.base)}) scale(${f2(toSun * sc)} ${f2(sc)})"`;
      trunks += `<use href="#sc-trunk" ${at}/>` + (glowAt > 0.05 ? `<use href="#sc-trunkkey" ${at} opacity="${f2(0.15 + glowAt * 0.8)}"/>` : "");
      tiers += `<use href="#sc-fir${t.kind}" ${at}/>` + (glowAt > 0.04 ? `<use href="#sc-firrim${t.kind}" ${at} opacity="${f2(glowAt * 0.9)}"/>` : "");
      const tw = TW * sc;
      const reach = 18 + t.h * 0.3;
      shadows += `M${f2(t.x - tw)} ${t.base}h${f2(tw * 2)}l${f2(-toSun * reach * 0.6 + 6)} ${f2(ground + 14 - t.base)}h${f2(-tw * 6)}z`;
    }
    rows.push({ trunks, tiers });
    const veil = `<rect x="0" y="${mid - 34}" width="${sw}" height="36" fill="url(#sc-veil)"/>`;
    const row = () => c.p.defs(`<defs>${templates}</defs>`) + rows.map((r2, i) => {
      const paint = i === 0 && rows.length > 1 ? 'fill="#8a98a0" color="#6a7682"' : `fill="${SHADE}" color="${DEEP}"`;
      const depth = { sw, back: i === 0 && rows.length > 1 };
      return (i > 0 ? c.p.el("forest.mist", veil, { lean: c.detail < 1, sw, y: mid - 34, h: 36, veil: true }) : "") + c.p.el("forest.fir-trunks", `<g filter="url(#sc-bark)" ${paint}>${r2.trunks}</g>`, depth) + c.p.el("forest.firs", `<g filter="url(#sc-needles)" ${paint}>${r2.tiers}</g>`, depth);
    }).join("");
    const pools = `<ellipse cx="${f2(sunX)}" cy="${ground}" rx="${f2(clearing * 2.6)}" ry="9" fill="#fff0c8"/>` + [-0.3, -0.12, 0.14].map((k) => `<ellipse cx="${f2(sunX + k * 300)}" cy="${ground + 3}" rx="${f2(22 + Math.abs(k) * 30)}" ry="4" fill="${KEY}"/>`).join("");
    const groundLight = `<rect x="0" y="${mid - 2}" width="${sw}" height="${H - mid + 2}" fill="url(#sc-groundlight)"/><g filter="url(#sc-blur3)">${pools}<path fill="${DEEP}" opacity=".9" d="${shadows}"/></g>`;
    const edgeA = noise(rand, [[2, 120], [1, 40]]);
    const edgeB = noise(rand, [[2, 140], [1, 45]]);
    let top = "";
    let bot = "";
    for (let x = -10; x <= sw + 10; x += 10) {
      top += `${x === -10 ? "M" : "L"}${x} ${f2(ground - 2 - edgeA(x) * 0.6)}`;
      bot = `L${x} ${f2(ground + 5 + edgeB(x) * 0.7)}` + bot;
    }
    const path = `<g filter="url(#sc-soil)"><path fill="url(#sc-pathlight)" d="${top}${bot}z"/></g>`;
    let blades = "";
    let lit = "";
    const clump = (x, y, n3, size) => {
      for (let k = 0; k < n3; k++) {
        const bx = x + (k - n3 / 2) * 1.5 * size;
        const h = between(rand, 3, 6.5) * size;
        const lean = between(rand, -1.8, 1.8) * size;
        blades += `M${f2(bx - 0.8 * size)} ${f2(y)}Q${f2(bx + lean * 0.4)} ${f2(y - h * 0.6)} ${f2(bx + lean)} ${f2(y - h)}Q${f2(bx + lean * 0.4 + 0.5 * size)} ${f2(y - h * 0.5)} ${f2(bx + 0.8 * size)} ${f2(y)}z`;
        if (near(bx) > 0.55 && rand() < 0.5) lit += `M${f2(bx + lean)} ${f2(y - h)}l${f2(0.5 * size)} ${f2(h * 0.3)}h${f2(-0.8 * size)}z`;
      }
    };
    const edgeBlades = blades;
    const edgeLit = lit;
    let clumpDefs = "";
    const tips = [];
    for (let n3 = 0; n3 < 5; n3++) {
      blades = "";
      lit = "";
      const size = between(rand, 1.4, 2);
      const count = Math.round(between(rand, 4, 7));
      for (let k = 0; k < count; k++) {
        const bx = (k - count / 2) * 1.5 * size;
        const h = between(rand, 3, 6.5) * size;
        const lean = between(rand, -1.8, 1.8) * size;
        blades += `M${f2(bx - 0.8 * size)} 0Q${f2(bx + lean * 0.4)} ${f2(-h * 0.6)} ${f2(bx + lean)} ${f2(-h)}Q${f2(bx + lean * 0.4 + 0.5 * size)} ${f2(-h * 0.5)} ${f2(bx + 0.8 * size)} 0z`;
        if (rand() < 0.5) lit += `M${f2(bx + lean)} ${f2(-h)}l${f2(0.5 * size)} ${f2(h * 0.3)}h${f2(-0.8 * size)}z`;
      }
      clumpDefs += `<path id="sc-clump${n3}" d="${blades}"/>`;
      tips.push(lit);
    }
    let front = "";
    let frontLit = "";
    for (let x = between(rand, 0, 20); x < sw; x += between(rand, 22, 48)) {
      const n3 = Math.floor(rand() * 5);
      const flip = rand() < 0.5 ? -1 : 1;
      front += `<use href="#sc-clump${n3}" transform="translate(${f2(x)} ${H + 1})${flip < 0 ? " scale(-1 1)" : ""}"/>`;
      if (near(x) > 0.55) frontLit += `<path transform="translate(${f2(x)} ${H + 1})${flip < 0 ? " scale(-1 1)" : ""}" d="${tips[n3]}"/>`;
    }
    let edgeUses = "";
    for (let x = between(rand, 4, 20); x < sw; x += between(rand, 10, 24) / c.detail) {
      const k = between(rand, 0.45, 0.7);
      edgeUses += `<use href="#sc-clump${Math.floor(rand() * 5)}" transform="translate(${f2(x)} ${f2(ground - 1.6 - edgeA(x) * 0.6)}) scale(${f2(rand() < 0.5 ? -k : k)} ${f2(k)})"/>`;
    }
    const grass = `<defs>${clumpDefs}</defs><path fill="#1a2c1a" d="${edgeBlades}"/><g fill="#1a2c1a">${edgeUses}${front}</g><path fill="#e8d590" opacity=".55" d="${edgeLit}"/><g fill="#e8d590" opacity=".55">${frontLit}</g>`;
    const bigTrunk = (x, w, side) => {
      const inner = side > 0 ? x + w : x;
      return `<path fill="${SHADE}" d="M${f2(x)} -4h${f2(w)}l${f2(w * 0.06)} ${ground - 8}q${f2(w * 0.3)} 6 ${f2(w * 0.7)} 12H${f2(x - w * 0.7)}q${f2(w * 0.4)} -6 ${f2(w * 0.7)} -12z"/><path fill="${DEEP}" d="M${f2(side > 0 ? x : x + w * 0.6)} -4h${f2(w * 0.4)}v${ground + 6}h${f2(-w * 0.4)}z" opacity=".6"/><path fill="${KEY}" opacity=".7" d="M${f2(inner - side * 2)} -4h2v${ground - 6}h-2z"/>`;
    };
    const moss = (x, w) => `<path fill="#4d7a3a" d="M${f2(x - w * 0.9)} ${ground + 1}q${f2(w * 1.1)} -9 ${f2(w * 2.6)} 0z" opacity=".85"/>`;
    const canopyLight = (cx, dir) => {
      let d = "";
      let e = "";
      for (let i = 0; i < 12; i++) {
        const x = cx + dir * i * between(rand, 4.5, 6.5);
        const y = between(rand, -2, 6) + i % 3 * 3 - i * 0.4;
        const r2 = between(rand, 9, 13) * (1 - i / 18);
        d += `M${f2(x - r2)} ${f2(y)}a${f2(r2)} ${f2(r2 * 0.7)} 0 1 0 ${f2(r2 * 2)} 0a${f2(r2)} ${f2(r2 * 0.7)} 0 1 0 ${f2(-r2 * 2)} 0z`;
        e += `M${f2(x - r2 * 0.8)} ${f2(y + r2 * 0.35)}a${f2(r2 * 0.8)} ${f2(r2 * 0.4)} 0 0 0 ${f2(r2 * 1.6)} 0z`;
      }
      return `<path fill="${SHADE}" d="${d}"/><path fill="${DEEP}" d="${e}"/>`;
    };
    const trunksSvg = `<g filter="url(#sc-bark)">${bigTrunk(-8, 24, 1)}${bigTrunk(sw - 18, 28, -1)}</g>` + moss(2, 14) + moss(sw - 10, 14);
    const canopySvg = `<g filter="url(#sc-leaves)">${canopyLight(8, 1)}${canopyLight(sw - 10, -1)}</g>`;
    const motes = Array.from({ length: Math.round(12 * c.detail) }, () => {
      const x = sunX + between(rand, -140, 160);
      const y = between(rand, 54, ground - 8);
      const d = between(rand, 6, 10);
      return `<circle cx="${f2(x)}" cy="${f2(y)}" r=".7" fill="#fff0cf" opacity="0"><animate attributeName="opacity" values="0;.9;0" dur="${f2(d * 0.7)}s" begin="${f2(-rand() * 6)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${f2(between(rand, -6, 6))} -7" dur="${f2(d)}s" repeatCount="indefinite"/></circle>`;
    }).join("");
    let shrubDefs = "";
    for (let n3 = 0; n3 < 3; n3++) {
      const b = foliage(rand, 0, -3, between(rand, 7, 12), 3.4, 9, { x: 0.6, y: -1 }, { body: DEEP, lit: RIM, deep: "#262c38" });
      shrubDefs += `<g id="sc-shrub${n3}">${b.body}${b.deep}</g><g id="sc-shrublit${n3}">${b.lit}</g>`;
    }
    let shrubs = "";
    for (let x = between(rand, -10, 10); x < sw + 10; x += between(rand, 22, 64) / c.detail) {
      if (Math.abs(x - sunX) < clearing * 0.8) continue;
      const n3 = Math.floor(rand() * 3);
      const k = between(rand, 0.55, 1.35);
      const at = `transform="translate(${f2(x)} ${f2(mid + between(rand, 0, 3))}) scale(${f2(rand() < 0.5 ? -k : k)} ${f2(k)})"`;
      shrubs += `<use href="#sc-shrub${n3}" ${at}/>` + (near(x) > 0.3 ? `<use href="#sc-shrublit${n3}" ${at} opacity="${f2(near(x) * 0.8)}"/>` : "");
    }
    let litter = "";
    for (let i = 0; i < Math.round(60 * c.detail); i++) {
      const x = between(rand, 0, sw);
      const y = ground - 1 + rand() * 5;
      litter += `M${f2(x)} ${f2(y)}h${f2(0.8 + rand())}v.5h${f2(-0.8 - rand() * 0.5)}z`;
    }
    let ruts = "";
    for (const dy of [0.6, 3.2]) {
      let d = "";
      for (let x = -10; x <= sw + 10; x += 20) d += `${x === -10 ? "M" : "L"}${x} ${f2(ground + dy - edgeA(x) * 0.3)}`;
      ruts += d;
    }
    const L = 30;
    let frond = "";
    for (let t = 0.06; t < 0.98; t += 0.06) {
      const y = -L * t;
      const x = Math.sin(t * 2.2) * 2.4 * t;
      const w = 8.5 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.4);
      for (const side of [-1, 1]) frond += `M${f2(x)} ${f2(y)}q${f2(side * w * 0.6)} ${f2(-w * 0.15)} ${f2(side * w)} ${f2(-w * 0.55)}q${f2(-side * w * 0.5)} ${f2(w * 0.05)} ${f2(-side * w)} ${f2(w * 0.55 + 1.4)}z`;
    }
    frond += `M-.4 0Q${f2(1.2)} ${f2(-L * 0.5)} ${f2(2.4 * Math.sin(2.2))} ${f2(-L)}l.6 .2Q${f2(1.8)} ${f2(-L * 0.5)} .4 0z`;
    let fernDefs = "";
    for (let n3 = 0; n3 < 3; n3++) {
      const fronds = 5 + n3;
      let g = "";
      for (let j = 0; j < fronds; j++) {
        const a = -70 + 140 * (j + 0.5) / fronds + (rand() - 0.5) * 12;
        g += `<use href="#sc-frond" transform="rotate(${f2(a)}) scale(${f2(between(rand, 0.75, 1.1))})"/>`;
      }
      fernDefs += `<g id="sc-fern${n3}">${g}</g>`;
    }
    let ferns = "";
    let fernsLit = "";
    for (let x = between(rand, -10, 30); x < sw + 10; x += between(rand, 60, 130) / c.detail) {
      const n3 = Math.floor(rand() * 3);
      const k = between(rand, 0.8, 1.25);
      const flip = rand() < 0.5 ? -k : k;
      ferns += `<use href="#sc-fern${n3}" transform="translate(${f2(x)} ${H + 2}) scale(${f2(flip)} ${f2(k)})"/>`;
      if (near(x) > 0.35) fernsLit += `<use href="#sc-fern${n3}" transform="translate(${f2(x)} ${H + 1.2}) scale(${f2(flip)} ${f2(k)})"/>`;
    }
    const floor = () => c.p.defs(`<defs>${shrubDefs}<path id="sc-frond" d="${frond}"/>${fernDefs}</defs>`) + c.p.el("forest.litter", `<path fill="none" stroke="#2a2418" stroke-width=".6" opacity=".45" d="${ruts}"/><path fill="#c8884a" opacity=".55" d="${litter}"/>`) + "";
    const fernSvg = `<g fill="${RIM}" opacity=".3">${fernsLit}</g><g fill="#0e1912">${ferns}</g>`;
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, "#203a3c"], [0.28, "#56726a"], [0.46, "#b4a888"], [0.6, "#ecca94"], [0.75, "#f6dcaa"], [1, "#f8e6bc"]]) + rgrad("sc-sun", "#fff4dc", 0.85) + rgrad("sc-sunwide", "#ffd29a", 0.5) + vgrad("sc-shaft", [[0, "#ffe2b0", 0.5], [0.55, "#ffe2b0", 0.22], [1, "#ffe2b0", 0.04]]) + vgrad("sc-mist", [[0, "#f4ead0", 0], [0.5, "#f4ead0", 0.55], [1, "#f4ead0", 0]]) + vgrad("sc-veil", [[0, "#d8dcc4", 0], [1, "#d8dcc4", 0.42]]) + material("sc-needles", ["#11241d", "#172e24", "#1e392b", "#284634"], 1.3, 0.9, 2, 3) + material("sc-bark", ["#3a2216", "#4e2f1e", "#653e28", "#7c5034"], 0.9, 0.05, 3, 5) + `</defs>`
    ) + sky3() + far() + row() + // The light is in the air in front of the trees, so the shafts are drawn over them.
    c.p.el("forest.shafts", `<g filter="url(#sc-haze)" style="mix-blend-mode:screen">${shafts}</g>`, { cx: sunX, cy: sunY, y: ground }) + c.p.el("forest.motes", motes);
    const near_ = c.p.defs(
      `<defs>` + vgrad("sc-groundlight", [[0, "#7e8478"], [0.2, "#666e76"], [1, "#353c4a"]]) + vgrad("sc-pathlight", [[0, "#c8b898"], [1, "#8a8478"]]) + rgrad("sc-sunpatch", "#ffd690", 0.55) + vgrad("sc-groundmist", [[0, "#d8dcc4", 0], [0.6, "#d8dcc4", 0.45], [1, "#d8dcc4", 0]]) + material("sc-grassmat", ["#1c3420", "#244228", "#2e5030", "#3a5e38"], 0.25, 0.9, 3, 8) + material("sc-soil", ["#3c3020", "#463826", "#50412c", "#5a4a32"], 0.35, 1.4, 3, 9, 1.8) + material("sc-leaves", ["#1a3320", "#22402a", "#2c5032", "#38603a"], 0.9, 0.9, 2, 13) + `<filter id="sc-blur3" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>`
    ) + c.p.el("forest.meadow", `<g filter="url(#sc-grassmat)">${groundLight}</g>`, { sw, y: mid - 2 }) + // The meadow's far edge dissolves into the mist instead of meeting it in a line.
    c.p.el("forest.shrubs", `<g filter="url(#sc-needles)">${shrubs}</g>`) + c.p.el("forest.groundmist", `<rect x="0" y="${mid - 8}" width="${sw}" height="10" fill="url(#sc-groundmist)"/>`, { lean: c.detail < 1, sw, y: mid - 8, h: 10 }) + c.p.el("forest.trunks", trunksSvg) + c.p.el("forest.path", path, { sw }) + floor() + // Where the sun lands through the clearing the light is strong enough to add, not just tint.
    c.p.el("forest.sunpatch", `<ellipse cx="${f2(sunX)}" cy="${ground}" rx="${f2(clearing * 3.4)}" ry="14" fill="url(#sc-sunpatch)" style="mix-blend-mode:screen"/>`, { cx: sunX, cy: ground }) + c.p.el("forest.grass", grass) + c.p.el("forest.ferns", fernSvg) + c.p.el("forest.canopy", canopySvg);
    return { sky: "#1c3436", soil: "#2c4a30", groundTop: mid - 2, back, near: near_, keep: [[sunX, sunY, 12]] };
  }
  function space(c) {
    const { rand, sw } = c;
    const floor = 96;
    const horizon = 82;
    const KEY = "#fff2e0";
    const SHADE = "#7a7e9a";
    const DEEP = "#2e3046";
    const earthX = sw * 0.74;
    const earthR = 34;
    const earthY = horizon + 14;
    const surface = (x) => horizon - noise(rand, [[3, 300], [1.5, 90]])(x);
    let dust = "";
    for (let i = 0; i < Math.round(160 * c.detail); i++) {
      const t = rand();
      dust += `M${f2(t * sw)} ${f2(8 + t * 46 + (rand() - 0.5) * 20)}h.6v.6h-.6z`;
    }
    const spikes = [0.1, 0.44, 0.92].map((k, i) => bloom(`<path d="M${f2(sw * k - 3.5)} ${12 + i * 9}h7M${f2(sw * k)} ${8.5 + i * 9}v7" stroke="white" stroke-width=".35" opacity=".8"/><circle cx="${f2(sw * k)}" cy="${12 + i * 9}" r=".8" fill="white"/>`, 0.9)).join("");
    const shooting = `<path d="M${f2(sw * 0.36)} 14l-24 9" stroke="white" stroke-width="1" stroke-linecap="round" opacity="0"><animate attributeName="opacity" values="0;0;.85;0" keyTimes="0;.93;.96;1" dur="17s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;-36 13" keyTimes="0;.93;1" dur="17s" repeatCount="indefinite"/></path>`;
    const earth = `<circle cx="${f2(earthX)}" cy="${earthY}" r="${earthR + 7}" fill="url(#sc-atmo)"/><g clip-path="url(#sc-globe)"><g filter="url(#sc-planet)"><circle cx="${f2(earthX)}" cy="${earthY}" r="${earthR}" fill="url(#sc-earthlight)"/></g><rect x="${f2(earthX - earthR)}" y="${earthY - earthR}" width="${earthR * 2}" height="${earthR * 2}" filter="url(#sc-clouds)" opacity=".8"/><circle cx="${f2(earthX)}" cy="${earthY}" r="${earthR}" fill="url(#sc-night)"/></g><circle cx="${f2(earthX)}" cy="${earthY}" r="${earthR}" fill="none" stroke="url(#sc-limb)" stroke-width="1.6"/>`;
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, "#03040a"], [1, "#0e1228"]]) + rgrad("sc-band", "#b8a8d8", 0.24) + texture("sc-milky", 0.025, 0.07, 1.4, 1.6, 4, 3) + `<radialGradient id="sc-atmo"><stop offset=".82" stop-color="#7ac8ff" stop-opacity="0"/><stop offset=".88" stop-color="#7ac8ff" stop-opacity=".5"/><stop offset="1" stop-color="#7ac8ff" stop-opacity="0"/></radialGradient><linearGradient id="sc-earthlight" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#fff4e4"/><stop offset=".5" stop-color="#c0c4cc"/><stop offset="1" stop-color="#6a7080"/></linearGradient><linearGradient id="sc-night" x1="0" y1="0" x2="1" y2=".3"><stop offset=".45" stop-color="#02030a" stop-opacity="0"/><stop offset=".72" stop-color="#02030a" stop-opacity=".85"/><stop offset="1" stop-color="#02030a"/></linearGradient><linearGradient id="sc-limb" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#bfe6ff" stop-opacity=".9"/><stop offset=".55" stop-color="#7ac8ff" stop-opacity=".2"/><stop offset="1" stop-color="#7ac8ff" stop-opacity="0"/></linearGradient>` + material("sc-planet", ["#0f2c5a", "#163e74", "#2a6a5c", "#5a7a46"], 0.035, 0.05, 4, 9, 2.2) + `<filter id="sc-clouds" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".05 .12" numOctaves="4" seed="19"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 3.6 -1.95"/></filter><clipPath id="sc-globe"><circle cx="${f2(earthX)}" cy="${earthY}" r="${earthR}"/></clipPath></defs>`
    ) + c.p.el("space.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/>`, { sw }) + c.p.el("space.milkyway", `<ellipse cx="${f2(sw * 0.45)}" cy="34" rx="${f2(sw * 0.55)}" ry="15" fill="url(#sc-band)" transform="rotate(12 ${f2(sw * 0.45)} 34)" filter="url(#sc-milky)"/><path d="${dust}" fill="white" opacity=".45"/>`, { sw }) + c.p.el("space.stars", stars(rand, sw, Math.round(80 * c.detail), horizon - 6, [earthX, earthY, earthR + 10]) + spikes + shooting) + c.p.el("space.earth", earth, { cx: earthX, cy: earthY, r: earthR });
    const swells = [];
    const bands = [
      { y: horizon + 1, amp: 2.5, len: 140 },
      { y: floor - 4, amp: 3.5, len: 180 },
      { y: floor + 8, amp: 5, len: 240 }
    ];
    for (const b of bands) {
      const h = noise(rand, [[b.amp, b.len], [b.amp * 0.4, b.len * 0.3]]);
      const top = (x) => b.y - h(x);
      swells.push(`<path fill="url(#sc-swell)" d="${ridge(sw, 0, (x) => -top(x), 12)}"/><path fill="none" stroke="${KEY}" stroke-opacity=".4" stroke-width="1.4" filter="url(#sc-soft)" d="${crestLine(sw, top)}"/>`);
    }
    const crater = (x, y, r2) => {
      const ry = r2 * 0.3;
      return (
        // ejecta: a pale halo, its lee (right) side shadowed by the raised rim
        `<ellipse cx="${f2(x - r2 * 0.1)}" cy="${f2(y)}" rx="${f2(r2 * 1.7)}" ry="${f2(ry * 1.9)}" fill="${KEY}" opacity=".18" filter="url(#sc-soft)"/><ellipse cx="${f2(x + r2 * 0.5)}" cy="${f2(y + ry * 0.2)}" rx="${f2(r2 * 1.05)}" ry="${f2(ry * 1.15)}" fill="${DEEP}" opacity=".55"/><ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(r2 * 1.1)}" ry="${f2(ry * 1.3)}" fill="url(#sc-rim)"/><ellipse cx="${f2(x + r2 * 0.02)}" cy="${f2(y + ry * 0.12)}" rx="${f2(r2)}" ry="${f2(ry)}" fill="url(#sc-bowl)"/>`
      );
    };
    const craters = [
      [0.1, floor + 12, 16],
      [0.36, horizon + 5, 8],
      [0.6, floor + 22, 26],
      [0.88, floor + 7, 12]
    ].map(([k, y, r2]) => crater(sw * (k ?? 0), y ?? 0, r2 ?? 0)).join("");
    let rocks = "";
    for (let i = 0; i < Math.round(14 * c.detail) + 4; i++) {
      const x = between(rand, 6, sw - 6);
      const y = between(rand, horizon + 4, H - 4);
      const k = (y - horizon) / (H - horizon);
      const r2 = (0.8 + rand() * 1.6) * (0.5 + k * 1.6);
      const w = r2 * 1.3;
      const top = r2 * (0.8 + rand() * 0.5);
      rocks += `<path fill="${DEEP}" opacity=".85" d="M${f2(x - w * 0.2)} ${f2(y - top * 0.3)}L${f2(x + w + r2 * 5)} ${f2(y + r2 * 0.1)}L${f2(x + w * 0.6)} ${f2(y + r2 * 0.35)}L${f2(x - w * 0.6)} ${f2(y + r2 * 0.2)}z"/><path fill="#4a4c62" d="M${f2(x - w)} ${f2(y)}c${f2(w * 0.1)} ${f2(-top)} ${f2(w * 1.4)} ${f2(-top * 1.2)} ${f2(w * 2)} 0z"/><path fill="${KEY}" opacity=".9" d="M${f2(x - w)} ${f2(y)}c${f2(w * 0.1)} ${f2(-top)} ${f2(w * 0.9)} ${f2(-top * 1.1)} ${f2(w * 1.2)} ${f2(-top * 0.7)}c${f2(-w * 0.5)} ${f2(top * 0.1)} ${f2(-w * 0.9)} ${f2(top * 0.4)} ${f2(-w * 1.2)} ${f2(top * 0.7)}z"/>`;
    }
    let pits = "";
    let lips = "";
    for (let i = 0; i < Math.round(90 * c.detail); i++) {
      const x = between(rand, 0, sw);
      const y = between(rand, horizon + 2, H);
      const k = (y - horizon) / (H - horizon);
      const r2 = (0.5 + rand() * 1.2) * (0.4 + k * 1.4);
      pits += `M${f2(x - r2)} ${f2(y)}a${f2(r2)} ${f2(r2 * 0.3)} 0 0 1 ${f2(r2 * 2)} 0z`;
      lips += `M${f2(x - r2 * 0.2)} ${f2(y + r2 * 0.3)}a${f2(r2)} ${f2(r2 * 0.3)} 0 0 0 ${f2(r2 * 1.2)} ${f2(-r2 * 0.3)}h${f2(r2 * 0.3)}a${f2(r2 * 1.2)} ${f2(r2 * 0.4)} 0 0 1 ${f2(-r2 * 1.5)} ${f2(r2 * 0.4)}z`;
    }
    const pock = `<path fill="${DEEP}" opacity=".7" d="${pits}"/><path fill="${KEY}" opacity=".6" d="${lips}"/>`;
    const base = sw * 0.24;
    const by = surface(base) + 1;
    const outpost = () => c.p.el(
      "space.base",
      `<path fill="url(#sc-domelight)" d="M${f2(base - 9)} ${f2(by)}a9 6.5 0 0 1 18 0z"/><path fill="none" stroke="#fff4e0" stroke-opacity=".5" stroke-width=".6" d="M${f2(base - 8)} ${f2(by - 2)}a8 5.5 0 0 1 6 -4"/><rect x="${f2(base + 10)}" y="${f2(by - 4.5)}" width="9" height="4.5" fill="#8a8c9a"/><rect x="${f2(base + 15)}" y="${f2(by - 4.5)}" width="4" height="4.5" fill="${DEEP}" opacity=".6"/>`,
      { cx: base, cy: by }
    ) + c.p.el("space.lamps", bloom(`<rect x="${f2(base + 11.5)}" y="${f2(by - 3.2)}" width="2" height="1.4" fill="#ffd98a"/>`, 1)) + c.p.el("space.base", `<rect x="${f2(base - 14)}" y="${f2(by - 15)}" width=".8" height="15" fill="#b8b8c4"/><ellipse cx="${f2(base + 14)}" cy="${f2(by + 0.5)}" rx="22" ry="1.2" fill="${DEEP}" opacity=".7"/>`, { cx: base, cy: by, part: "mast" }) + c.p.el("space.lamps", bloom(`<circle cx="${f2(base - 13.6)}" cy="${f2(by - 15.5)}" r="1.1" fill="#ff6a5a"><animate attributeName="opacity" values="1;.1;1" dur="2.2s" repeatCount="indefinite"/></circle>`, 1));
    const near = c.p.defs(
      `<defs>` + vgrad("sc-regolight", [[0, "#d8d8e0"], [0.2, "#a8a8b8"], [1, "#5a5c72"]]) + `<linearGradient id="sc-bowl"><stop offset="0" stop-color="#14151f"/><stop offset=".5" stop-color="${DEEP}"/><stop offset=".78" stop-color="${SHADE}"/><stop offset="1" stop-color="${KEY}"/></linearGradient><linearGradient id="sc-rim"><stop offset="0" stop-color="${KEY}"/><stop offset=".6" stop-color="#c8c6d0"/><stop offset="1" stop-color="${SHADE}"/></linearGradient>` + vgrad("sc-foreshade", [[0, "#000", 0], [0.55, "#000", 0], [1, "#05060e", 0.45]]) + vgrad("sc-swell", [[0, "#f0ecf0"], [0.06, "#c4c4d0"], [0.3, "#8c8ea4"], [0.7, "#5c5e78"], [1, "#3a3c56"]]) + `<linearGradient id="sc-domelight"><stop offset="0" stop-color="#eae6e0"/><stop offset=".6" stop-color="#9a98a6"/><stop offset="1" stop-color="#5a5a6c"/></linearGradient><linearGradient id="sc-sunside"><stop offset="0" stop-color="#ffe8cc" stop-opacity=".35"/><stop offset=".5" stop-color="#ffe8cc" stop-opacity="0"/><stop offset="1" stop-color="#101428" stop-opacity=".35"/></linearGradient>` + material("sc-regolith", ["#6a6872", "#76747d", "#817f88", "#8e8b93"], 0.3, 1, 4, 21, 1.5) + `</defs>`
    ) + c.p.el("space.regolith", `<g filter="url(#sc-regolith)"><rect x="0" y="${horizon - 2}" width="${sw}" height="${H - horizon + 2}" fill="${SHADE}"/>`, { sw, y: horizon - 2, part: "open" }) + c.p.el("space.swells", swells.join(""), { sw }) + c.p.el("space.pits", pock) + c.p.el("space.craters", craters) + c.p.el("space.rocks", rocks) + c.p.el("space.regolith", `<rect x="0" y="${horizon - 2}" width="${sw}" height="${H - horizon + 2}" fill="url(#sc-sunside)"/></g><rect x="0" y="${horizon}" width="${sw}" height="${H - horizon}" fill="url(#sc-foreshade)"/>`, { sw, y: horizon, part: "close" }) + outpost();
    return { sky: "#03040a", soil: "#3a3844", floor, groundTop: H, back, near, keep: [[earthX, earthY - 12, earthR + 4]] };
  }
  function city(c) {
    const { rand, sw, ground } = c;
    const top = "#141d44";
    const dusk = "#ffb48a";
    const street = ground - 6;
    const lights = (x, t, w, base, rate, cell, win) => {
      const [cw, ch] = cell;
      for (let wy = t + 3; wy < base - ch; wy += ch) {
        const floor = rand();
        const p = floor < 0.25 ? 0.85 : floor < 0.5 ? rate : rate * 0.2;
        const cool = rand() < 0.18;
        for (let wx = x + 2; wx < x + w - cw * 0.6; wx += cw) {
          if (rand() < p) {
            const d = `M${f2(wx)} ${f2(wy)}h${f2(cw * 0.5)}v${f2(ch * 0.5)}h${f2(-cw * 0.5)}z`;
            if (cool) win.cool += d;
            else if (rand() < 0.25) win.dim += d;
            else win.warm += d;
          }
        }
      }
    };
    const rank = (base, o) => {
      let front = "";
      let side = "";
      let rimP = "";
      let roof = "";
      let red = "";
      const win = { warm: "", cool: "", dim: "" };
      for (let x = -10 - rand() * 20; x < sw + 10; ) {
        const w = between(rand, o.minW, o.maxW);
        const h = between(rand, o.lo, o.hi);
        const t = base - h;
        const dp = o.depth * (0.6 + rand() * 0.6);
        front += `M${f2(x)} ${base}V${f2(t)}h${f2(w)}V${base}z`;
        side += `M${f2(x + w)} ${base}V${f2(t)}l${f2(dp)} ${f2(-dp * 0.35)}V${base}z`;
        rimP += `M${f2(x)} ${base}V${f2(t)}h.8V${base}z`;
        const kind = rand();
        if (kind < 0.25) roof += `M${f2(x + w * 0.6)} ${f2(t)}v-3h4v3zM${f2(x + w * 0.6 - 0.5)} ${f2(t - 3)}h5l-2.5 -1.6z`;
        else if (kind < 0.45) {
          roof += `M${f2(x + w * 0.3)} ${f2(t)}V${f2(t - 9)}h.6V${f2(t)}z`;
          red += `M${f2(x + w * 0.3 + 0.3)} ${f2(t - 9.5)}m-.9 0a.9 .9 0 1 0 1.8 0a.9 .9 0 1 0 -1.8 0z`;
        } else if (kind < 0.7) roof += `M${f2(x + 2)} ${f2(t)}v-2h${f2(w * 0.4)}v2z`;
        lights(x, t, w, base, o.rate, o.cell, win);
        x += w + dp + (rand() < 0.35 ? between(rand, 2, o.gap) : 0);
      }
      return {
        body: `<g filter="url(#sc-concrete)"><path fill="url(#${o.tone})" d="${front}"/><path fill="${o.side}" d="${side}"/><path fill="url(#${o.tone})" d="${roof}"/></g><path fill="${dusk}" opacity="${o.rim}" d="${rimP}"/>`,
        windows: glow(`<path fill="#ffd28a" d="${win.warm}"/><path fill="#cfe4ff" d="${win.cool}"/>`) + `<path fill="#c08a5a" d="${win.dim}"/>` + (red ? `<path fill="#ff5a4a" d="${red}"><animate attributeName="opacity" values="1;.2;1" dur="2.6s" repeatCount="indefinite"/></path>` : "")
      };
    };
    const spireX = sw * 0.62;
    const spireBase = ground - 22;
    const spire = `<g filter="url(#sc-concrete)"><path fill="url(#sc-facade)" d="M${f2(spireX - 9)} ${spireBase}V${spireBase - 50}l3 -6h12l3 6V${spireBase}z"/><path fill="#3a4266" d="M${f2(spireX + 9)} ${spireBase}V${spireBase - 50}l3 -1.4V${spireBase}z"/><path fill="url(#sc-facade)" d="M${f2(spireX - 3)} ${spireBase - 56}l3 -22l3 22z"/></g><path fill="${dusk}" opacity=".6" d="M${f2(spireX - 9)} ${spireBase}V${spireBase - 50}l3 -6h.8l-3 6V${spireBase}zM${f2(spireX - 3)} ${spireBase - 56}l3 -22v1.5l-2.4 20.5z"/>` + // The crown is floodlit from below.
    bloom(`<path fill="#ffe6b0" opacity=".8" d="M${f2(spireX - 6)} ${spireBase - 56}h12l-1 -1.2h-10z"/>`, 0.8) + `<circle cx="${f2(spireX)}" cy="${spireBase - 78}" r="1.4" fill="#ff5a4a"><animate attributeName="opacity" values="1;.15;1" dur="3s" repeatCount="indefinite"/></circle>`;
    const deckY = ground - 30;
    let piers = "";
    for (let x = 20; x < sw; x += 80) piers += `M${x} ${deckY + 3}h4V${street}h-4z`;
    const carriages = Array.from({ length: 5 }, (_, i) => `<rect x="${i * 26}" y="-8" width="24" height="8" rx="1.5" fill="#3a405e"/><rect x="${i * 26}" y="-8" width="24" height="1" fill="white" opacity=".14"/>${bloom(`<path fill="#ffe1a0" d="${[4, 9, 14, 19].map((k) => `M${i * 26 + k} -6h3v3h-3z`).join("")}"/>`, 0.8)}`).join("");
    const train = `<g>${carriages}<animateTransform attributeName="transform" type="translate" values="${sw + 10} ${deckY};-150 ${deckY};-150 ${deckY}" keyTimes="0;.55;1" dur="${f2(Math.max(14, sw / 30))}s" repeatCount="indefinite"/></g>`;
    const far = rank(ground - 22, { tone: "sc-facade-far", side: "#7a86c0", rim: 0.3, lo: 30, hi: 56, minW: 14, maxW: 34, rate: 0.12, cell: [3, 3.6], depth: 3, gap: 6 });
    const mid = rank(ground - 14, { tone: "sc-facade-mid", side: "#3a4270", rim: 0.55, lo: 20, hi: 44, minW: 22, maxW: 50, rate: 0.3, cell: [4.2, 5], depth: 5, gap: 10 });
    const low = rank(street, { tone: "sc-facade-low", side: "#262c4c", rim: 0.4, lo: 10, hi: 22, minW: 30, maxW: 70, rate: 0.25, cell: [5, 6], depth: 6, gap: 14 });
    const cloud = (x, y, w) => `<g filter="url(#sc-soft)"><path fill="#2e3664" d="M${f2(x)} ${f2(y)}q${f2(w * 0.25)} -3.2 ${f2(w * 0.5)} -2.4q${f2(w * 0.3)} -2.6 ${f2(w * 0.5)} 1.2q${f2(-w * 0.5)} 2.2 ${f2(-w)} 1.2z"/><path fill="#e89a8a" opacity="${f2(Math.max(0.15, 0.8 - x / sw))}" d="M${f2(x + w * 0.08)} ${f2(y + 0.4)}q${f2(w * 0.42)} 1.4 ${f2(w * 0.86)} -0.4q${f2(-w * 0.42)} -0.6 ${f2(-w * 0.86)} 0.4z"/></g>`;
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, top], [0.5, "#34427e"], [0.8, "#7a6a9a"], [1, "#d89088"]]) + `<radialGradient id="sc-west" cx="0" cy="${ground - 20}" r="${f2(sw * 0.7)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb07a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb07a" stop-opacity="0"/></radialGradient>` + vgrad("sc-facade", [[0, "#8a96cc"], [1, "#4a5480"]]) + vgrad("sc-facade-far", [[0, "#94a0d4"], [1, "#9a98c4"]]) + vgrad("sc-facade-mid", [[0, "#7682ba"], [1, "#48507e"]]) + vgrad("sc-facade-low", [[0, "#434c7a"], [1, "#1e2442"]]) + material("sc-concrete", ["#50566e", "#565c74", "#5c627a", "#626880"], 0.25, 0.3, 2, 31, 1.3) + `</defs>`
    ) + c.p.el("city.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/><rect width="${sw}" height="${H}" fill="url(#sc-west)"/>`, { sw }) + c.p.el("city.stars", stars(rand, sw, Math.round(18 * c.detail), 26)) + c.p.el("city.clouds", cloud(sw * 0.04, 26, 150) + cloud(sw * 0.4, 16, 110) + cloud(sw * 0.74, 30, 120), { sw }) + c.p.el("city.towers-far", `<g id="sc-skyline"><g filter="url(#sc-dof)">${far.body}</g>`, { part: "open" }) + c.p.el("city.windows-far", far.windows) + c.p.el("city.spire", spire, { cx: spireX, cy: spireBase - 78 }) + c.p.el("city.towers-mid", mid.body) + c.p.el("city.windows-mid", mid.windows) + c.p.el("city.rail", `<path fill="#1c2036" d="M0 ${deckY}h${sw}v3H0z${piers}"/><path fill="${dusk}" opacity=".3" d="M0 ${deckY}h${sw}v.6H0z"/>`, { sw, y: deckY }) + c.p.el("city.train", train, { y: deckY }) + c.p.el("city.towers-low", low.body) + c.p.el("city.windows-low", low.windows + `</g>`, { part: "close" });
    let puddles = "";
    for (let i = 0; i < Math.round(9 * c.detail) + 3; i++) {
      const y = between(rand, street + 3, H - 2);
      const k = (y - street) / (H - street);
      const w = (14 + rand() * 30) * (0.5 + k);
      const x = between(rand, 0, sw);
      puddles += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(w)}" ry="${f2(1 + k * 3)}"/>`;
    }
    const lamp = (x) => `<path fill="url(#sc-cone)" d="M${f2(x - 2)} ${ground - 38}L${f2(x - 16)} ${ground + 2}H${f2(x + 16)}L${f2(x + 2)} ${ground - 38}z" style="mix-blend-mode:screen"/><rect x="${f2(x - 0.9)}" y="${ground - 40}" width="1.8" height="40" fill="#22263c"/><rect x="${f2(x - 0.9)}" y="${ground - 40}" width=".6" height="40" fill="${dusk}" opacity=".4"/><path fill="#22263c" d="M${f2(x - 4)} ${ground - 41}h8l-1.5 2.4h-5z"/>` + bloom(`<rect x="${f2(x - 2.5)}" y="${ground - 38.6}" width="5" height="1.2" fill="#ffe1a0"/>`, 1) + `<ellipse cx="${f2(x)}" cy="${ground + 3}" rx="24" ry="3.4" fill="#ffd8a0" opacity=".22" filter="url(#sc-soft)"/><rect x="${f2(x - 2)}" y="${ground}" width="4" height="${H - ground}" fill="url(#sc-wet)" filter="url(#sc-streak)"/>`;
    const mirror = `<use href="#sc-skyline" transform="matrix(1 0 0 -1 0 ${2 * street})"/>`;
    const near = c.p.defs(
      `<defs>` + vgrad("sc-walk", [[0, "#8a90b8"], [0.3, "#5a6088"], [1, "#2a2e48"]]) + material("sc-asphalt", ["#3a3c4a", "#40424f", "#474956", "#4e505c"], 0.7, 1.4, 2, 33, 1.4) + `<radialGradient id="sc-cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffe1a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe1a0" stop-opacity="0"/></radialGradient>` + vgrad("sc-wet", [[0, "#ffe1a0", 0.6], [1, "#ffe1a0", 0]]) + `<filter id="sc-streak" x="-200%" y="-10%" width="500%" height="120%"><feGaussianBlur stdDeviation=".9 2.4"/></filter><filter id="sc-ripple" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation=".5 1.2" result="b"/><feTurbulence type="fractalNoise" baseFrequency=".02 .6" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="b" in2="t" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter><mask id="sc-wetmask" maskUnits="userSpaceOnUse" x="0" y="${street}" width="${sw}" height="${H - street}"><rect x="0" y="${street}" width="${sw}" height="${H - street}" fill="#5a5a5a"/><g fill="white" filter="url(#sc-soft)">${puddles}</g></mask></defs>`
    ) + c.p.el("city.street", `<g filter="url(#sc-asphalt)"><rect x="0" y="${street}" width="${sw}" height="${H - street}" fill="url(#sc-walk)"/></g>`, { sw, y: street, h: H - street }) + c.p.el("city.reflection", `<g mask="url(#sc-wetmask)" opacity=".75"><g filter="url(#sc-ripple)">${mirror}</g></g>`, { sw, y: street, h: H - street }) + c.p.el("city.curb", `<rect x="0" y="${street}" width="${sw}" height="1.2" fill="#2a2e44"/><rect x="0" y="${street}" width="${sw}" height=".5" fill="${dusk}" opacity=".45"/>`, { sw, y: street }) + c.p.el("city.lamps", lamp(sw * 0.16) + lamp(sw * 0.86), { y: ground });
    return { sky: top, soil: "#2a2d42", groundTop: street, back, near, keep: [[spireX, spireBase - 62, 14]] };
  }
  function desert(c) {
    const { rand, sw, ground } = c;
    const KEY = "#ffc07a";
    const HOT = "#ffe0a0";
    const SHADE = "#8a6a9a";
    const DEEP = "#4a3458";
    const sunX = sw * 0.57;
    const sunY = 70;
    const horizon = ground - 18;
    const midBase = ground - 8;
    const rank = (base, every, lo, hi) => {
      const rocks = [];
      for (let x = between(rand, -30, 10); x < sw + 20; ) {
        const kind = rand();
        const h = between(rand, lo, hi) * (kind > 0.82 ? 1.3 : 1);
        const w = kind > 0.82 ? between(rand, 8, 14) : kind > 0.5 ? between(rand, 30, 52) : between(rand, 56, 104);
        const talus = h * 0.5;
        const t = base - h;
        const cap = t + h * (kind > 0.82 ? 0.7 : 0.34);
        const l = x + talus;
        const r2 = l + w;
        const clear = 18;
        if (x < sunX + clear && r2 + talus > sunX - clear) {
          x = sunX + clear + between(rand, 2, 10);
          continue;
        }
        const body = `M${f2(x)} ${base}Q${f2(l - talus * 0.15)} ${f2(cap + (base - cap) * 0.25)} ${f2(l)} ${f2(cap)}` + (kind > 0.5 && kind <= 0.82 ? `L${f2(l + w * 0.12)} ${f2(cap - 1)}L${f2(l + w * 0.2)} ${f2(t)}H${f2(r2 - w * 0.22)}L${f2(r2 - w * 0.14)} ${f2(cap - 1)}` : `L${f2(l + 0.6)} ${f2(t)}H${f2(r2 - 0.6)}`) + `L${f2(r2)} ${f2(cap)}Q${f2(r2 + talus * 0.15)} ${f2(cap + (base - cap) * 0.25)} ${f2(r2 + talus)} ${base}z`;
        rocks.push({ x, l, r: r2, t, cap, base, body });
        x = r2 + talus + between(rand, every * 0.25, every);
      }
      return rocks;
    };
    const paint = (rocks, o) => {
      let body = "";
      let side = "";
      let lip = "";
      let groove = "";
      let joints = "";
      for (const k of rocks) {
        body += k.body;
        const toward = (k.l + k.r) / 2 < sunX ? 1 : -1;
        const edge = toward > 0 ? k.r : k.l;
        const wSide = Math.min(6, (k.r - k.l) * 0.18) * Math.min(1, Math.abs((k.l + k.r) / 2 - sunX) / (sw * 0.2) + 0.3);
        side += `M${f2(edge)} ${f2(k.t)}L${f2(edge - toward * wSide)} ${f2(k.t)}L${f2(edge - toward * wSide * 0.8)} ${f2(k.cap)}L${f2(edge + toward * (k.base - k.cap) * 0.5)} ${k.base}L${f2(edge + toward * ((k.base - k.cap) * 0.5 + 1))} ${k.base}L${f2(edge)} ${f2(k.cap)}z`;
        lip += `M${f2(k.l)} ${f2(k.t)}H${f2(k.r)}v.9H${f2(k.l)}z`;
        if (o.gullies) for (let j = k.l + between(rand, 3, 8); j < k.r - 3; j += between(rand, 5, 14)) joints += `M${f2(j)} ${f2(k.t + between(rand, 1, 3))}V${f2(k.cap - between(rand, 0, 3))}`;
        if (o.gullies) {
          for (let g = k.x + 3; g < k.r + (k.base - k.cap) * 0.5 - 3; g += between(rand, 2.5, 6)) {
            const top = g < k.l ? k.cap + (k.l - g) / (k.l - k.x) * (k.base - k.cap) : g > k.r ? k.cap + (g - k.r) / (k.l - k.x) * (k.base - k.cap) : k.cap;
            if (top < k.base - 1.5) groove += `M${f2(g)} ${f2(top + 0.6)}L${f2(g + (g - (k.l + k.r) / 2) * 0.08)} ${k.base}`;
          }
        }
      }
      return `<g filter="url(#sc-sandstone)"><path fill="url(#sc-rockshade)" d="${body}"/><path fill="none" stroke="${DEEP}" stroke-width=".7" opacity=".6" d="${groove}"/><path fill="none" stroke="${DEEP}" stroke-width=".5" opacity=".35" d="${joints}"/><path fill="${o.side}" d="${side}"/><path fill="${o.lip}" d="${lip}"/></g>`;
    };
    const farRocks = rank(horizon, 50, 10, 20);
    const midRocks = rank(midBase, 130, 22, 42);
    const cloud = (x, y, w) => {
      const lit = Math.max(0.2, 1 - Math.abs(x + w / 2 - sunX) / (sw * 0.5));
      return `<g filter="url(#sc-soft)"><path fill="#5a3a64" d="M${f2(x)} ${f2(y)}q${f2(w * 0.25)} -3.4 ${f2(w * 0.5)} -2.6q${f2(w * 0.3)} -2.8 ${f2(w * 0.5)} 1.2q${f2(-w * 0.5)} 2.4 ${f2(-w)} 1.4z"/><path fill="#ffb07a" opacity="${f2(lit)}" d="M${f2(x + w * 0.08)} ${f2(y + 0.5)}q${f2(w * 0.42)} 1.6 ${f2(w * 0.86)} -0.4q${f2(-w * 0.42)} -0.7 ${f2(-w * 0.86)} 0.4z"/></g>`;
    };
    const hawk = `<g transform="translate(${f2(sw * 0.3)} 26)"><path d="M-6 0q3 -2.6 6 0q3 -2.6 6 0" fill="none" stroke="#3a2438" stroke-width="1" stroke-linecap="round" transform="translate(16 0)"/><animateTransform attributeName="transform" type="rotate" values="0;360" dur="26s" additive="sum" repeatCount="indefinite"/></g>`;
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, "#26214a"], [0.35, "#5a3466"], [0.62, "#c06258"], [0.8, "#f0a066"], [1, "#ffd894"]]) + `<radialGradient id="sc-sunwide" cx="${f2(sunX)}" cy="${sunY}" r="220" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd890" stop-opacity=".7"/><stop offset=".3" stop-color="#ffb070" stop-opacity=".25"/><stop offset="1" stop-color="#ff9060" stop-opacity="0"/></radialGradient>` + vgrad("sc-rockshade", [[0, "#c0a0c0"], [0.3, SHADE], [1, DEEP]]) + material("sc-sandstone", ["#7a3e34", "#88483a", "#965240", "#a45e46"], 0.012, 0.32, 3, 41, 1.8) + vgrad("sc-farhaze", [[0, "#ffb880", 0.42], [1, "#ffd090", 0.68]]) + `</defs>`
    ) + c.p.el("desert.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/>`, { sw }) + c.p.el("desert.sun", `<rect width="${sw}" height="${H}" fill="url(#sc-sunwide)"/>`, { cx: sunX, cy: sunY, r: 11, part: "halo" }) + c.p.el("desert.clouds", cloud(sw * 0.06, 24, 140) + cloud(sw * 0.4, 16, 120) + cloud(sw * 0.62, 34, 90) + cloud(sw * 0.8, 22, 120), { sw }) + c.p.el("desert.sun", bloom(`<circle cx="${f2(sunX)}" cy="${sunY}" r="11" fill="#fff4d0"/>`, 1), { cx: sunX, cy: sunY, r: 11, part: "core" }) + c.p.el("desert.hawk", hawk) + // The far rank, its shade lost in the glow.
    c.p.el("desert.mesas-far", paint(farRocks, { side: "#ffd0a0", lip: "none", gullies: false }) + `<path fill="url(#sc-farhaze)" d="${farRocks.map((k) => k.body).join("")}"/>`) + // A band of glare along the horizon, shimmering.
    c.p.el("desert.glare", `<rect x="0" y="${horizon - 6}" width="${sw}" height="8" fill="#ffe0a0" opacity=".2" filter="url(#sc-soft)"><animate attributeName="opacity" values=".12;.26;.12" dur="5s" repeatCount="indefinite"/></rect>`, { sw, y: horizon - 6, h: 8 }) + c.p.el("desert.mesas", paint(midRocks, { side: KEY, lip: HOT, gullies: true }));
    const vy = horizon;
    const ray = (x, y, to) => sunX + (x - sunX) * (to - vy) / (y - vy);
    let shadows = "";
    for (const k of midRocks) {
      const a = k.l - 2;
      const b = k.r + 2;
      shadows += `M${f2(a)} ${k.base}L${f2(b)} ${k.base}L${f2(ray(b, k.base, H + 10))} ${H + 10}L${f2(ray(a, k.base, H + 10))} ${H + 10}z`;
    }
    let scrub = "";
    let scrubLit = "";
    let scrubShadow = "";
    for (let i = 0; i < Math.round(7 * c.detail) + 3; i++) {
      const x = between(rand, 0, sw);
      const y = between(rand, midBase + 6, H - 2);
      const k = (y - midBase) / (H - midBase);
      const r2 = (2.4 + rand() * 2) * (0.4 + k * 1.2);
      for (const [ox, oy, k2] of [[-0.6, 0, 0.7], [0.5, 0, 0.75], [0, -0.35, 0.85]]) {
        const bx = x + ox * r2;
        const by = y + oy * r2;
        const rr = r2 * k2;
        scrub += `M${f2(bx - rr)} ${f2(by)}a${f2(rr)} ${f2(rr * 0.8)} 0 0 1 ${f2(rr * 2)} 0z`;
        scrubLit += `M${f2(bx - rr * 0.8)} ${f2(by - rr * 0.45)}a${f2(rr * 0.85)} ${f2(rr * 0.6)} 0 0 1 ${f2(rr * 1.6)} 0`;
      }
      scrubShadow += `M${f2(x - r2 * 0.6)} ${f2(y)}L${f2(x + r2 * 0.6)} ${f2(y)}L${f2(ray(x + r2 * 0.6, y, y + 4 + k * 10))} ${f2(y + 4 + k * 10)}L${f2(ray(x - r2 * 0.6, y, y + 4 + k * 10))} ${f2(y + 4 + k * 10)}z`;
    }
    let ripples = "";
    for (let y = midBase + 2, gap = 1.6; y < H + 2; y += gap, gap *= 1.16) {
      const k = (y - midBase) / (H - midBase);
      for (let x = between(rand, -40, 0); x < sw + 10; ) {
        const len = between(rand, 30, 90) * (0.6 + k);
        const amp = 0.4 + k * 0.6;
        ripples += `M${f2(x)} ${f2(y)}`;
        for (let s = 0; s < len; s += 8 + k * 6) ripples += `q${f2(4 + k * 3)} ${f2((rand() - 0.5) * amp * 2)} ${f2(8 + k * 6)} ${f2((rand() - 0.5) * 0.4)}`;
        x += len + between(rand, 10, 40);
      }
    }
    const sx = sw - 28;
    const saguaroBody = `M${f2(sx)} ${ground + 2}V${ground - 58}a3.5 3.5 0 0 1 7 0V${ground + 2}zM${f2(sx)} ${ground - 30}h-6a3 3 0 0 1 -3 -3V${ground - 44}a3 3 0 0 1 6 0V${ground - 36}h3zM${f2(sx + 7)} ${ground - 22}h6V${ground - 38}a3 3 0 0 1 6 0V${ground - 22}a3 3 0 0 1 -3 3h-9z`;
    const saguaro = `<path fill="${DEEP}" opacity=".7" d="M${f2(sx - 1)} ${ground + 2}L${f2(sx + 8)} ${ground + 2}L${f2(ray(sx + 8, ground + 2, H + 10))} ${H + 10}L${f2(ray(sx - 1, ground + 2, H + 10))} ${H + 10}z"/><path fill="#2a1a2a" d="${saguaroBody}"/><g filter="url(#sc-soft)" opacity=".9"><path fill="none" stroke="${KEY}" stroke-width=".9" d="M${f2(sx + 0.4)} ${ground}V${ground - 58}a3.1 3.1 0 0 1 1.5 -2.7M${f2(sx - 8.6)} ${ground - 33}V${ground - 44}a2.6 2.6 0 0 1 1.5 -2.4"/></g><path fill="none" stroke="#3a2638" stroke-width=".35" d="M${f2(sx + 2.3)} ${ground}V${ground - 58}M${f2(sx + 4.6)} ${ground}V${ground - 58}"/>`;
    const near = c.p.defs(
      `<defs>` + vgrad("sc-sandlight", [[0, "#ffe2b0"], [0.3, "#e0a070"], [1, "#8a5a5a"]]) + `<radialGradient id="sc-sunlane" cx="${f2(sunX)}" cy="${horizon}" r="${f2(sw * 0.6)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff0c0" stop-opacity=".55"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></radialGradient>` + vgrad("sc-shadowfade", [[0, "#3a2a50", 0.95], [0.4, "#4a3864", 0.85], [1, "#5a4874", 0.7]]) + material("sc-sand", ["#9a6648", "#a46e4e", "#ae7854", "#b8825c"], 0.02, 0.4, 3, 43, 1.6) + `</defs>`
    ) + c.p.el(
      "desert.sand",
      `<g filter="url(#sc-sand)"><rect x="0" y="${midBase - 1}" width="${sw}" height="${H - midBase + 1}" fill="url(#sc-sandlight)"/><rect x="0" y="${midBase - 1}" width="${sw}" height="${H - midBase + 1}" fill="url(#sc-sunlane)"/><g filter="url(#sc-soft)"><path fill="url(#sc-shadowfade)" d="${shadows}"/><path fill="${SHADE}" opacity=".8" d="${scrubShadow}"/></g>`,
      { sw, y: midBase - 1, part: "open" }
    ) + c.p.el("desert.ripples", `<path fill="none" stroke="#fff0c8" stroke-width=".45" opacity=".3" d="${ripples}"/></g>`, { part: "close" }) + c.p.el("desert.scrub", `<path fill="#3a2436" d="${scrub}"/><path fill="none" stroke="${KEY}" stroke-width=".8" opacity=".75" filter="url(#sc-soft)" d="${scrubLit}"/>`) + c.p.el("desert.saguaro", saguaro) + // Boulders in the near left corner, black, their crowns rimmed by the sun.
    c.p.el(
      "desert.boulders",
      `<path fill="#2a1a28" d="M-6 ${H}V${ground + 10}c4 -8 14 -10 22 -6c4 -5 12 -4 15 2c3 1 5 4 5 ${H - ground - 6}z"/><path fill="none" stroke="${KEY}" stroke-width=".8" opacity=".6" filter="url(#sc-soft)" d="M16 ${ground + 4}c4 -5 12 -4 15 2"/>`
    );
    return { sky: "#26214a", soil: "#a86a4a", groundTop: midBase, back, near, keep: [[sunX, sunY, 16]] };
  }
  function ribbon(pts, w0, w1) {
    const left = [];
    const right = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2;
      left.push([p[0] - dy / l * w, p[1] + dx / l * w]);
      right.push([p[0] + dy / l * w, p[1] - dx / l * w]);
    });
    const all = [...left, ...right.reverse()];
    return `M${all.map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}z`;
  }
  function curve(p) {
    let d = `M${f2(p[0][0])} ${f2(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)];
      const b = p[i];
      const c = p[i + 1];
      const e = p[Math.min(p.length - 1, i + 2)];
      d += `C${f2(b[0] + (c[0] - a[0]) / 6)} ${f2(b[1] + (c[1] - a[1]) / 6)} ${f2(c[0] - (e[0] - b[0]) / 6)} ${f2(c[1] - (e[1] - b[1]) / 6)} ${f2(c[0])} ${f2(c[1])}`;
    }
    return d;
  }
  function volcano(c) {
    const { rand, sw, ground } = c;
    const cx = sw * 0.72;
    const apexY = 36;
    const rimW = 10;
    const vw = Math.min(320, sw * 0.6);
    const base = 92;
    const GLOW = "#ff7a32";
    const flank = (s) => `C${f2(cx + s * (rimW + 14))} ${apexY + 26} ${f2(cx + s * vw * 0.22)} ${base - 6} ${f2(cx + s * vw * 0.5)} ${base}`;
    const cone = `M${f2(cx + rimW)} ${apexY - 0.6}L${f2(cx + rimW * 0.4)} ${apexY + 1.4}Q${f2(cx)} ${apexY + 2.4} ${f2(cx - rimW * 0.5)} ${apexY + 1.6}L${f2(cx - rimW)} ${apexY}${flank(-1)}L${f2(cx + vw / 2)} ${base}C${f2(cx + vw * 0.22)} ${base - 6} ${f2(cx + rimW + 14)} ${apexY + 26} ${f2(cx + rimW)} ${apexY}z`;
    let masses = "";
    let crown = "";
    const billows = [
      [cx - 1, apexY - 6, 6, 4],
      [cx - 3, apexY - 13, 9, 5],
      [cx - 7, 15, 13, 6],
      [cx - 12, 6, 18, 7],
      [cx - 18, -4, 24, 8],
      [cx - 52, 4, 26, 7],
      [cx - 90, 9, 24, 6],
      [cx + 14, 2, 16, 7]
    ];
    for (const [x, y, rx, ry] of billows.slice(0, Math.max(4, Math.round(billows.length * c.detail)))) {
      let mass = "";
      for (let i = 0; i < Math.round(rx * 0.7); i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand());
        const bx = x + Math.cos(a) * rx * d;
        const by = y + Math.sin(a) * ry * d;
        const r2 = between(rand, 3.5, 7) * (1.2 - d * 0.4);
        const blob = (k, dy) => `M${f2(bx - r2 * k)} ${f2(by + dy)}a${f2(r2 * k)} ${f2(r2 * k * 0.8)} 0 1 0 ${f2(r2 * k * 2)} 0a${f2(r2 * k)} ${f2(r2 * k * 0.8)} 0 1 0 ${f2(-r2 * k * 2)} 0z`;
        mass += blob(1, 0);
        if (by < y) crown += blob(0.75, -r2 * 0.25);
      }
      masses += `<path fill="url(#sc-cloudlight)" d="${mass}"/>`;
    }
    const cloud = `<g filter="url(#sc-ash)">${masses}<path fill="#120a10" opacity=".5" d="${crown}"/><animateTransform attributeName="transform" type="translate" values="0 0;-5 .5;0 0" dur="38s" repeatCount="indefinite"/></g>`;
    const puffs = Array.from({ length: 5 }, (_, i) => {
      const d = 9;
      const b = -i * (d / 5);
      return `<circle cx="${f2(cx)}" cy="${apexY - 2}" r="4" fill="url(#sc-puff)" opacity="0"><animateTransform attributeName="transform" type="translate" values="0 0;${f2(-14 - i * 2)} -22" dur="${d}s" begin="${f2(b)}s" repeatCount="indefinite"/><animate attributeName="r" values="4;13" dur="${d}s" begin="${f2(b)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;0" keyTimes="0;.2;1" dur="${d}s" begin="${f2(b)}s" repeatCount="indefinite"/></circle>`;
    }).join("");
    const embers = Array.from({ length: Math.round(14 * c.detail) }, () => {
      const x = cx + between(rand, -6, 6);
      const d = between(rand, 2.4, 4.5);
      const b = -rand() * d;
      const dx = between(rand, -26, 18);
      const up = between(rand, 14, 26);
      return `<circle cx="${f2(x)}" cy="${apexY - 1}" r=".7" fill="#ffd08a" opacity="0"><animateMotion path="M0 0Q${f2(dx * 0.5)} ${f2(-up)} ${f2(dx)} ${f2(-up * 0.4)}" dur="${f2(d)}s" begin="${f2(b)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;.8;0" dur="${f2(d)}s" begin="${f2(b)}s" repeatCount="indefinite"/></circle>`;
    }).join("");
    const far = noise(rand, [[12, 260], [5, 80]]);
    const mid = noise(rand, [[8, 200], [3, 50]]);
    const ridges = `<path fill="#22101a" d="${ridge(sw, base - 14, far, 14)}" filter="url(#sc-dof)"/><path fill="none" stroke="url(#sc-edge)" stroke-width="1.2" filter="url(#sc-soft)" d="${crestLine(sw, (x) => base - 14 - far(x))}"/><path fill="#170a10" d="${ridge(sw, base - 2, mid, 14)}"/><path fill="none" stroke="url(#sc-edge)" stroke-width=".8" opacity=".8" d="${crestLine(sw, (x) => base - 2 - mid(x))}"/>`;
    const reach = [];
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const u = 1 - t;
      const x = u * u * u * rimW + 3 * u * u * t * (rimW + 14) + 3 * u * t * t * vw * 0.22 + t * t * t * vw * 0.5;
      const y = u * u * u * apexY + 3 * u * u * t * (apexY + 26) + 3 * u * t * t * (base - 6) + t * t * t * base;
      reach.push([x, y]);
    }
    let gullies = "";
    let spurs = "";
    const n3 = 18;
    for (let i = 0; i < n3; i++) {
      const s0 = (i + 0.3 + rand() * 0.4) / n3 * 2 - 1;
      const w = 0.02 + rand() * 0.03;
      const side = (k) => reach.map(([x, y], m) => [cx + (s0 + k + Math.sin(m * 1.3 + i) * 0.015) * x, y]);
      const a = side(0);
      const b = side(w);
      const lit = side(-w * 1.4);
      gullies += `M${a.concat([...b].reverse()).map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}z`;
      spurs += `M${lit.concat([...a].reverse()).map(([x, y]) => `${f2(x)} ${f2(y)}`).join("L")}z`;
    }
    const channels = [
      [[cx - 3, apexY + 1], [cx - 7, apexY + 14], [cx - 5, apexY + 28], [cx - 14, apexY + 42], [cx - 22, base - 2]],
      [[cx + 4, apexY + 1], [cx + 8, apexY + 12], [cx + 7, apexY + 26], [cx + 16, apexY + 40], [cx + 30, base]]
    ];
    const coneBody = `<g filter="url(#sc-basalt)"><path fill="url(#sc-conelight)" d="${cone}"/><path fill="url(#sc-coneside)" d="${cone}"/><g clip-path="url(#sc-cone)"><path fill="#1a0e12" opacity=".55" d="${gullies}"/><path fill="#ffc090" opacity=".25" d="${spurs}"/></g><g filter="url(#sc-wide)">${channels.map((p) => `<path d="${curve(p)}" fill="none" stroke="#ffb070" stroke-width="9" opacity=".7"/>`).join("")}</g></g>`;
    const flow = (p, w, dur) => `<path d="${curve(p)}" fill="none" stroke="url(#sc-lava)" stroke-width="${w}" stroke-linecap="round"/><path d="${curve(p)}" fill="none" stroke="#fff6c8" stroke-width="${f2(w * 0.3)}" stroke-linecap="round"><animate attributeName="opacity" values=".9;.3;.9" dur="${dur}s" repeatCount="indefinite"/></path>`;
    const lavaSvg = `<ellipse cx="${f2(cx - 22)}" cy="${base - 1}" rx="10" ry="2.4" fill="${GLOW}" opacity=".7" filter="url(#sc-bloom)"/>` + bloom(flow(channels[0], 2.4, 6) + flow(channels[1], 1.8, 7) + `<ellipse cx="${f2(cx - 22)}" cy="${base - 1.2}" rx="4" ry="1" fill="#ffc060"/>`, 1);
    const crater = `<g filter="url(#sc-bloom)"><ellipse cx="${f2(cx)}" cy="${apexY - 2}" rx="${rimW + 2}" ry="5" fill="${GLOW}" opacity=".9"/></g><ellipse cx="${f2(cx)}" cy="${apexY + 1.2}" rx="${rimW - 1}" ry="1.6" fill="#ffe6a8"/>`;
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, "#07050b"], [0.45, "#1a0b14"], [0.8, "#43140f"], [1, "#6a2410"]]) + `<radialGradient id="sc-glow" cx="${f2(cx)}" cy="${apexY}" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${GLOW}" stop-opacity=".55"/><stop offset=".35" stop-color="${GLOW}" stop-opacity=".16"/><stop offset="1" stop-color="${GLOW}" stop-opacity="0"/></radialGradient><radialGradient id="sc-edge" cx="${f2(cx)}" cy="${base}" r="${f2(vw * 0.95)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".9"/><stop offset=".6" stop-color="#ff6a3a" stop-opacity=".25"/><stop offset="1" stop-color="#ff6a3a" stop-opacity="0"/></radialGradient><radialGradient id="sc-puff" cy=".8"><stop offset="0" stop-color="#e2783a"/><stop offset=".7" stop-color="#5a2e2a"/><stop offset="1" stop-color="#3a2024" stop-opacity="0"/></radialGradient><clipPath id="sc-cone"><path d="${cone}"/></clipPath><filter id="sc-wide" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${sw + 40}" height="${H + 40}"><feGaussianBlur stdDeviation="3"/></filter><filter id="sc-ash" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter><linearGradient id="sc-cloudlight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22141a"/><stop offset=".4" stop-color="#4a2626"/><stop offset=".7" stop-color="#b04c2a"/><stop offset="1" stop-color="#f08a46"/></linearGradient>` + vgrad("sc-conelight", [[0, "#ffd2a0"], [0.15, "#e89a6a"], [0.5, "#a0605a"], [1, "#4a3238"]]) + `<linearGradient id="sc-coneside" x1="0" x2="1"><stop offset="0" stop-color="#8a9ad0" stop-opacity=".35"/><stop offset=".4" stop-color="#8a9ad0" stop-opacity="0"/><stop offset=".6" stop-color="#140a10" stop-opacity="0"/><stop offset="1" stop-color="#140a10" stop-opacity=".7"/></linearGradient>` + material("sc-basalt", ["#2a2224", "#33292a", "#3d3130", "#4a3a36"], 0.22, 0.035, 4, 51, 2) + vgrad("sc-lava", [[0, "#fff0b0"], [0.4, "#ffb04a"], [1, "#e2461a"]]) + `</defs>`
    ) + c.p.el("volcano.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/>`, { sw }) + c.p.el("volcano.stars", stars(rand, sw, Math.round(26 * c.detail), 40, [cx - 60, 20, 140])) + c.p.el("volcano.glow", `<rect width="${sw}" height="${H}" fill="url(#sc-glow)"/>`, { cx, cy: apexY, r: 150 }) + c.p.el("volcano.ridges", ridges, { sw }) + c.p.el("volcano.puffs", `<g filter="url(#sc-wide)">${puffs}</g>`, { cx, cy: apexY }) + c.p.el("volcano.ash", cloud, { cx, cy: apexY }) + c.p.el("volcano.crater", crater, { cx, cy: apexY, r: rimW }) + c.p.el("volcano.cone", coneBody, { cx, cy: apexY, d: cone }) + c.p.el("volcano.lava", lavaSvg, { d: channels.map(curve).join("") }) + c.p.el("volcano.embers", embers);
    const streamPts = [[cx + 30, base], [cx + 40, base + 5], [cx + 38, base + 12], [cx + 60, base + 22], [cx + 110, H + 6]];
    const rows = [];
    for (let y = base + 2.5, gap = 2.4; y < H + 8; y += gap, gap *= 1.32) {
      const k = (y - base) / (H - base);
      const cell = 7 + k * 26;
      const row = [];
      for (let x = -cell * rand(); x < sw + cell; x += cell * between(rand, 0.75, 1.25)) row.push([x, y + (rand() - 0.5) * gap * 0.6]);
      rows.push(row);
    }
    const edge = (p, q) => {
      const mx = (p[0] + q[0]) / 2 + (rand() - 0.5) * Math.abs(q[0] - p[0]) * 0.3;
      const my = (p[1] + q[1]) / 2 + (rand() - 0.5) * 1.2;
      return `M${f2(p[0])} ${f2(p[1])}L${f2(mx)} ${f2(my)}L${f2(q[0])} ${f2(q[1])}`;
    };
    let farCracks = "";
    let cracks = "";
    rows.forEach((row, r2) => {
      const below = rows[r2 + 1];
      const k = (row[0][1] - base) / (H - base);
      let d = "";
      row.forEach((p, i) => {
        const right = row[i + 1];
        if (right && rand() < 0.85) d += edge(p, right);
        if (below && rand() < 0.75) {
          let best = below[0];
          for (const q of below) if (Math.abs(q[0] - p[0]) < Math.abs(best[0] - p[0])) best = q;
          d += edge(p, best);
        }
      });
      if (k < 0.3) farCracks += d;
      else cracks += `<path d="${d}" stroke-width="${f2(0.35 + k * 0.6)}"/>`;
    });
    const crackSvg = `<g fill="none" stroke="url(#sc-crackglow)" stroke-linecap="round" stroke-linejoin="round"><path d="${farCracks}" stroke-width=".35"/>${cracks}<animate attributeName="opacity" values="1;.65;1" dur="5s" repeatCount="indefinite"/></g>`;
    const boulder = (x, w, h, lit) => `<path fill="#0c0608" d="M${f2(x - w)} ${H + 2}C${f2(x - w)} ${f2(H - h)} ${f2(x - w * 0.2)} ${f2(H - h * 1.2)} ${f2(x + w * 0.3)} ${f2(H - h * 0.9)}S${f2(x + w)} ${f2(H - h * 0.4)} ${f2(x + w)} ${H + 2}z"/><path fill="none" stroke="#ff7a3a" stroke-width=".9" opacity=".7" filter="url(#sc-soft)" d="${lit > 0 ? `M${f2(x + w * 0.3)} ${f2(H - h * 0.9)}S${f2(x + w)} ${f2(H - h * 0.4)} ${f2(x + w)} ${H}` : `M${f2(x - w)} ${H}C${f2(x - w)} ${f2(H - h)} ${f2(x - w * 0.2)} ${f2(H - h * 1.2)} ${f2(x + w * 0.3)} ${f2(H - h * 0.9)}`}"/>`;
    const near = c.p.defs(
      `<defs>` + vgrad("sc-plainlight", [[0, "#d07a5a"], [0.25, "#7a4a48"], [1, "#2a1e26"]]) + `<radialGradient id="sc-crackglow" cx="${f2(cx + 60)}" cy="${base + 10}" r="${f2(sw * 0.7)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb060"/><stop offset=".25" stop-color="#ff6a2a" stop-opacity=".85"/><stop offset=".6" stop-color="#c03a1a" stop-opacity=".25"/><stop offset="1" stop-color="#a02a14" stop-opacity=".06"/></radialGradient>` + material("sc-crust", ["#1a1214", "#221819", "#2a1e1e", "#352624"], 0.06, 0.3, 4, 53, 2.2) + `</defs>`
    ) + c.p.el(
      "volcano.plain",
      `<g filter="url(#sc-crust)"><rect x="0" y="${base - 1}" width="${sw}" height="${H - base + 1}" fill="url(#sc-plainlight)"/><g filter="url(#sc-wide)"><path d="${curve(streamPts)}" fill="none" stroke="#ffa070" stroke-width="22" opacity=".8"/></g></g>`,
      { sw, y: base - 1, d: curve(streamPts) }
    ) + c.p.el("volcano.cracks", glow(crackSvg)) + c.p.el(
      "volcano.stream",
      `<g filter="url(#sc-wide)" style="mix-blend-mode:screen" opacity=".6"><path d="${curve(streamPts)}" fill="none" stroke="${GLOW}" stroke-width="14"/></g>` + bloom(`<path fill="url(#sc-lava)" d="${ribbon(streamPts, 2, 9)}"/><path d="${curve(streamPts)}" fill="none" stroke="#7a1e08" stroke-width="1.6" stroke-dasharray="2 9 1 12" opacity=".3" filter="url(#sc-soft)"><animate attributeName="stroke-dashoffset" values="0;-48" dur="10s" repeatCount="indefinite"/></path>`, 1),
      { d: curve(streamPts), ribbon: ribbon(streamPts, 2, 9) }
    ) + c.p.el("volcano.boulders", boulder(sw * 0.02, 22, 10, 1) + boulder(sw - 6, 34, 16, -1));
    return { sky: "#07050b", soil: "#1e1210", groundTop: base, back, near, keep: [[cx, apexY, 18]] };
  }
  function lab(c) {
    const { rand, sw, ground } = c;
    const cyan = "#5fd3c8";
    const warm = "#ffcf8a";
    const bench = ground - 22;
    const floorY = ground - 4;
    const lampX = sw * 0.47;
    const sx = lampX - 12;
    const sy = bench - 22;
    const wx = sw * 0.56;
    const ww = Math.min(150, sw * 0.3);
    const wy = 14;
    const wh = 56;
    let skyline = "";
    for (let x = wx; x < wx + ww; ) {
      const w = between(rand, 8, 18);
      const h = between(rand, 12, 34);
      skyline += `M${f2(x)} ${wy + wh}V${f2(wy + wh - h)}h${f2(w)}V${wy + wh}z`;
      x += w + 1;
    }
    let bokehWarm = "";
    let bokehCool = "";
    for (let i = 0; i < 26; i++) {
      const r2 = between(rand, 1, 3.6);
      const d = `M${f2(wx + rand() * ww - r2)} ${f2(wy + wh - rand() * 34)}a${f2(r2)} ${f2(r2)} 0 1 0 ${f2(r2 * 2)} 0a${f2(r2)} ${f2(r2)} 0 1 0 ${f2(-r2 * 2)} 0z`;
      if (rand() < 0.75) bokehWarm += d;
      else bokehCool += d;
    }
    let beads = "";
    let caps = "";
    for (let i = 0; i < Math.round(40 * c.detail); i++) {
      const x = wx + rand() * ww;
      const y = wy + rand() * wh;
      const r2 = between(rand, 0.4, 1);
      beads += `M${f2(x - r2)} ${f2(y)}a${f2(r2)} ${f2(r2)} 0 1 0 ${f2(r2 * 2)} 0a${f2(r2)} ${f2(r2)} 0 1 0 ${f2(-r2 * 2)} 0z`;
      caps += `M${f2(x - r2 * 0.4)} ${f2(y - r2 * 0.4)}h${f2(r2 * 0.6)}v${f2(r2 * 0.4)}h${f2(-r2 * 0.6)}z`;
    }
    const runs = Array.from({ length: Math.round(9 * c.detail) }, () => {
      const x = wx + rand() * ww;
      const d = between(rand, 4, 9);
      return `<path d="M${f2(x)} ${wy}q.6 4 0 8" fill="none" stroke="#c8e0f0" stroke-width=".5" opacity=".45"><animateTransform attributeName="transform" type="translate" values="0 -8;-1 ${wh}" dur="${f2(d)}s" begin="${f2(-rand() * d)}s" repeatCount="indefinite"/></path>`;
    }).join("");
    const windowSvg = `<clipPath id="sc-glass"><rect x="${f2(wx)}" y="${wy}" width="${f2(ww)}" height="${wh}"/></clipPath><g clip-path="url(#sc-glass)"><rect x="${f2(wx)}" y="${wy}" width="${f2(ww)}" height="${wh}" fill="url(#sc-night)"/><path fill="#141a2c" d="${skyline}" filter="url(#sc-haze)"/><g filter="url(#sc-dof)" opacity=".75"><path fill="#f6c97a" d="${bokehWarm}"/><path fill="#9ad0ff" d="${bokehCool}"/></g><path fill="#0a0e18" opacity=".5" d="${beads}"/><path fill="#d8ecff" opacity=".7" d="${caps}"/>${runs}<ellipse cx="${f2(wx + ww * 0.22)}" cy="${wy + wh * 0.7}" rx="10" ry="6" fill="${warm}" opacity=".12" filter="url(#sc-haze)"/><path d="M${f2(wx + ww * 0.15)} ${wy}l${f2(ww * 0.22)} 0l${f2(-ww * 0.3)} ${wh}l${f2(-ww * 0.12)} 0z" fill="white" opacity=".04"/></g><path fill="#3a3630" d="M${f2(wx - 3)} ${wy - 3}h3v${wh + 3}h-3z"/><path fill="#1e2228" d="M${f2(wx + ww)} ${wy - 3}h3v${wh + 3}h-3zM${f2(wx - 3)} ${wy - 3}h${f2(ww + 6)}v3h${f2(-ww - 6)}z"/><rect x="${f2(wx + ww / 2 - 1)}" y="${wy}" width="2" height="${wh}" fill="#22262e"/><rect x="${f2(wx - 5)}" y="${wy + wh}" width="${f2(ww + 10)}" height="2.4" fill="#4a4640"/><rect x="${f2(wx - 5)}" y="${wy + wh}" width="${f2(ww + 10)}" height=".6" fill="${warm}" opacity=".35"/>`;
    let joints = "";
    for (let y = 7; y < bench; y += 7) joints += `M0 ${y}H${sw}`;
    for (let x = 30 + rand() * 20; x < sw; x += 60) joints += `M${f2(x)} 0V${bench}`;
    let holes = "";
    let lips = "";
    for (let y = 10.5; y < bench - 3; y += 21) {
      for (let x = 15; x < sw; x += 30) {
        holes += `M${f2(x - 0.9)} ${f2(y)}a.9 .9 0 1 0 1.8 0a.9 .9 0 1 0 -1.8 0z`;
        lips += `M${f2(x - 0.8)} ${f2(y + 0.5)}h1.6v.4h-1.6z`;
      }
    }
    const wallSvg = `<g filter="url(#sc-plaster)"><rect width="${sw}" height="${bench}" fill="#5a5c66"/><circle cx="${f2(sx)}" cy="${bench}" r="260" fill="url(#sc-lampwash)" opacity=".45"/><circle cx="${f2(sx)}" cy="${bench}" r="110" fill="url(#sc-lampwash)"/><circle cx="${f2(sw * 0.31 + 30)}" cy="${bench - 14}" r="60" fill="url(#sc-screenwash)"/><path fill="none" stroke="#2a2c34" stroke-width=".5" opacity=".4" d="${joints}"/><path fill="#2a2a30" d="${holes}"/><path fill="#c8c0b0" opacity=".6" d="${lips}"/></g>`;
    const monitor = (x, w) => {
      let lines = "";
      const colors = [cyan, "#c8a0ff", cyan, "#ffd08a", cyan];
      for (let k = 0; k < 5; k++) lines += `<rect x="${f2(x + 3 + k % 2 * 3)}" y="${f2(bench - 20.5 + k * 2.8)}" width="${f2(between(rand, w * 0.25, w * 0.6))}" height="1" fill="${colors[k]}" opacity=".85"><animate attributeName="opacity" values=".85;.35;.85" dur="${f2(between(rand, 2, 4))}s" begin="${f2(-rand() * 3)}s" repeatCount="indefinite"/></rect>`;
      return `<rect x="${f2(x)}" y="${bench - 24}" width="${f2(w)}" height="17" rx="1" fill="#0e1418"/><rect x="${f2(x)}" y="${bench - 24}" width="${f2(w)}" height=".6" fill="${warm}" opacity=".3"/><rect x="${f2(x + 1.5)}" y="${bench - 22.5}" width="${f2(w - 3)}" height="14" fill="#0c2628"/>` + bloom(lines, 0.9) + `<rect x="${f2(x + w / 2 - 1.5)}" y="${bench - 7}" width="3" height="7" fill="#0e1418"/><rect x="${f2(x + w / 2 - 5)}" y="${bench - 1}" width="10" height="1" fill="#1a2026"/>`;
    };
    const lamp = `<path fill="#2a2e36" d="M${f2(lampX - 5)} ${bench}h10v-1.6a5 1.6 0 0 0 -10 0z"/><path d="M${f2(lampX)} ${bench - 1.5}L${f2(lampX + 4)} ${bench - 16}L${f2(sx + 2)} ${f2(sy)}" fill="none" stroke="#3a3e46" stroke-width="1.4" stroke-linejoin="round"/><path d="M${f2(lampX)} ${bench - 1.5}L${f2(lampX + 4)} ${bench - 16}" fill="none" stroke="${warm}" stroke-width=".4" opacity=".4"/><circle cx="${f2(lampX + 4)}" cy="${bench - 16}" r="1.2" fill="#4a4e58"/><path fill="#3a3e46" d="M${f2(sx - 5)} ${f2(sy + 3)}L${f2(sx - 1)} ${f2(sy - 3)}L${f2(sx + 6)} ${f2(sy - 1)}L${f2(sx + 6)} ${f2(sy + 3)}z"/><path fill="#5a5e68" d="M${f2(sx - 1)} ${f2(sy - 3)}L${f2(sx + 6)} ${f2(sy - 1)}v1.2L${f2(sx - 1.5)} ${f2(sy - 2)}z"/>` + bloom(`<path fill="#fff0c8" d="M${f2(sx - 5)} ${f2(sy + 3)}H${f2(sx + 6)}v.8H${f2(sx - 5)}z"/>`, 1);
    const cone = `<path d="M${f2(sx - 5)} ${f2(sy + 3.5)}L${f2(sx - 22)} ${bench}H${f2(sx + 20)}L${f2(sx + 6)} ${f2(sy + 3.5)}z" fill="url(#sc-cone)" filter="url(#sc-soft)" style="mix-blend-mode:screen"/>`;
    const motes = Array.from({ length: Math.round(8 * c.detail) }, () => {
      const x = sx + between(rand, -10, 10);
      const y = between(rand, sy + 6, bench - 3);
      const d = between(rand, 6, 12);
      return `<circle cx="${f2(x)}" cy="${f2(y)}" r=".35" fill="#fff0c8" opacity="0"><animateTransform attributeName="transform" type="translate" values="0 0;${f2(between(rand, -4, 4))} ${f2(between(rand, -4, 2))}" dur="${f2(d)}s" begin="${f2(-rand() * d)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;0" dur="${f2(d)}s" begin="${f2(-rand() * d)}s" repeatCount="indefinite"/></circle>`;
    }).join("");
    const mx = sx + 18;
    const mug = `<path fill="#d8d0c4" d="M${f2(mx)} ${bench}v-5h4.4v5z"/><path fill="#8a8478" d="M${f2(mx + 3)} ${bench}v-5h1.4v5z"/><path fill="none" stroke="#c8c0b4" stroke-width=".8" d="M${f2(mx + 4.4)} ${bench - 4}a1.4 1.4 0 0 1 0 2.6"/><path fill="none" stroke="white" stroke-width=".6" stroke-linecap="round" opacity="0" d="M${f2(mx + 2)} ${bench - 6}q-1.4 -2 0 -4q1.4 -2 0 -4"><animate attributeName="opacity" values="0;.35;0" dur="5s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 1;0 -3" dur="5s" repeatCount="indefinite"/></path>`;
    const bx0 = sx - 30;
    const books = [["#6a3a3a", 3, 10], ["#3a4a6a", 2.4, 12], ["#5a5a3a", 3.4, 9], ["#2e4a44", 2.2, 11]].map(([col, w, h], i, all) => {
      const x = bx0 + all.slice(0, i).reduce((t, b) => t + b[1] + 0.3, 0);
      return `<rect x="${f2(x)}" y="${f2(bench - h)}" width="${w}" height="${h}" fill="${col}"/><rect x="${f2(x + w - 0.6)}" y="${f2(bench - h)}" width=".6" height="${h}" fill="${warm}" opacity=".35"/>`;
    }).join("");
    const bx = Math.max(16, sw * 0.06);
    const bw = Math.min(90, sw * 0.18);
    let marks = "";
    for (let k = 0; k < 5; k++) marks += `M${f2(bx + 6)} ${f2(28 + k * 6)}h${f2(between(rand, bw * 0.3, bw * 0.7))}`;
    const board = `<rect x="${f2(bx)}" y="20" width="${f2(bw)}" height="38" fill="url(#sc-boardlight)"/><rect x="${f2(bx)}" y="20" width="${f2(bw)}" height="38" fill="none" stroke="#4a4e58" stroke-width="1.6"/><path d="${marks}" stroke="#4a78b8" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round"/><path d="M${f2(bx + bw * 0.62)} 34l8 -5l8 7" fill="none" stroke="#c85a5a" stroke-opacity=".6" stroke-width=".9"/><rect x="${f2(bx + bw - 14)}" y="24" width="8" height="8" fill="#e3c86a" opacity=".8" transform="rotate(4 ${f2(bx + bw - 10)} 28)"/><rect x="${f2(bx + bw - 24)}" y="44" width="8" height="8" fill="#8ad0a8" opacity=".7" transform="rotate(-5 ${f2(bx + bw - 20)} 48)"/><rect x="${f2(bx + 4)}" y="58" width="${f2(bw - 8)}" height="1.6" fill="#4a4e58"/><rect x="${f2(bx)}" y="58.5" width="${f2(bw)}" height="3" fill="black" opacity=".25" filter="url(#sc-soft)"/>`;
    const rx = sw - 30;
    let units = "";
    let leds = "";
    for (let k = 0; k < 8; k++) {
      const y = 22 + k * 9.5;
      units += `M${f2(rx + 3)} ${f2(y)}h26v7.5h-26z`;
      leds += `<rect x="${f2(rx + 5)}" y="${f2(y + 3)}" width="2" height="1.4" fill="${k % 3 ? cyan : "#7aff9a"}"><animate attributeName="opacity" values="1;.2;1" dur="${f2(between(rand, 0.8, 2.4))}s" begin="${f2(-rand() * 2)}s" repeatCount="indefinite"/></rect>`;
    }
    const rack = `<rect x="${f2(rx)}" y="18" width="34" height="${floorY - 18}" fill="#0e1218"/><path fill="#181e26" d="${units}"/><path fill="none" stroke="#2a323c" stroke-width=".4" d="${units}"/><rect x="${f2(rx)}" y="18" width=".8" height="${floorY - 18}" fill="${cyan}" opacity=".2"/>` + bloom(leds, 0.8);
    let doors = "";
    for (let x = 4; x < sw - 34; x += 40) doors += `M${x} ${bench + 5}h37v${floorY - bench - 7}h-37z`;
    const benchSvg = `<g filter="url(#sc-wood)"><rect x="0" y="${bench}" width="${sw}" height="3" fill="url(#sc-benchlight)"/></g><rect x="0" y="${bench + 3}" width="${sw}" height="${floorY - bench - 3}" fill="url(#sc-cabinet)"/><rect x="0" y="${bench + 3}" width="${sw}" height="2" fill="black" opacity=".4"/><path fill="none" stroke="#0a0c10" stroke-width=".6" d="${doors}"/><path fill="none" stroke="url(#sc-handle)" stroke-width="1" d="${doors.replace(/M(\d+) (\S+)h37v\S+h-37z/g, (_, x) => `M${+x + 16} ${bench + 9}h5`)}"/>`;
    const at = (x) => Math.min(1, Math.max(0, x / sw)).toFixed(4);
    const lampRamp = (id, dark, lit, reach) => `<linearGradient id="${id}" x1="0" x2="${sw}" gradientUnits="userSpaceOnUse"><stop offset="${at(sx - reach)}" stop-color="${dark}"/><stop offset="${at(sx)}" stop-color="${lit}"/><stop offset="${at(sx + reach)}" stop-color="${dark}"/></linearGradient>`;
    const back = c.p.defs(
      `<defs><radialGradient id="sc-lampwash"><stop offset="0" stop-color="#fff0d0"/><stop offset=".15" stop-color="#ffd8a0"/><stop offset=".45" stop-color="#b0907a" stop-opacity=".6"/><stop offset="1" stop-color="#b0907a" stop-opacity="0"/></radialGradient><radialGradient id="sc-screenwash"><stop offset="0" stop-color="#8ae0d8" stop-opacity=".55"/><stop offset="1" stop-color="#8ae0d8" stop-opacity="0"/></radialGradient>` + material("sc-plaster", ["#2a2c30", "#2e3034", "#323438", "#36383c"], 0.06, 0.09, 4, 71, 1.6) + material("sc-wood", ["#5a3a24", "#6a442a", "#7a4e30", "#8a5a36"], 0.02, 0.9, 2, 75, 2) + lampRamp("sc-benchlight", "#5a5c64", "#ffe2b0", 130) + lampRamp("sc-cabinet", "#14171c", "#2a2620", 110) + lampRamp("sc-handle", "#4a4e56", "#d8c8a8", 110) + `<linearGradient id="sc-boardlight" x2="1"><stop offset="0" stop-color="#9a9a98"/><stop offset="1" stop-color="#cfc8b8"/></linearGradient>` + vgrad("sc-night", [[0, "#0a1020"], [1, "#283050"]]) + vgrad("sc-cone", [[0, warm, 0.4], [1, warm, 0.05]]) + `</defs>`
    ) + c.p.el("lab.wall", `<g id="sc-room">` + wallSvg, { sw, y: bench, cx: sx, part: "open" }) + c.p.el("lab.window", windowSvg, { cx: wx, cy: wy, sw: ww, h: wh }) + c.p.el("lab.board", board, { cx: bx, cy: 20, sw: bw }) + c.p.el("lab.bench", benchSvg, { sw, y: bench }) + c.p.el("lab.books", books) + c.p.el("lab.lamp", lamp, { cx: sx, cy: sy }) + c.p.el("lab.mug", mug) + c.p.el("lab.monitors", monitor(sw * 0.31, 28) + monitor(sw * 0.31 + 32, 24)) + c.p.el("lab.rack", rack + `</g>`, { part: "close" }) + c.p.el("lab.pool", `<ellipse cx="${f2(sx)}" cy="${bench + 0.3}" rx="22" ry="1.6" fill="#fff0c8" opacity=".5" filter="url(#sc-soft)"/>`, { cx: sx, cy: bench }) + c.p.el("lab.cone", cone, { cx: sx, cy: sy, y: bench }) + c.p.el("lab.motes", motes);
    const near = c.p.defs(
      `<defs>` + vgrad("sc-floor", [[0, "#5a5c64"], [1, "#2a2c32"]]) + material("sc-epoxy", ["#2a2c30", "#2e3034", "#32343a", "#36383e"], 0.03, 0.4, 3, 73, 1.4) + `<filter id="sc-polish" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation=".6 1.6"/></filter>` + vgrad("sc-fade", [[0, "white", 0.7], [1, "white", 0.05]]) + `<mask id="sc-floormask" maskUnits="userSpaceOnUse" x="0" y="${floorY}" width="${sw}" height="${H - floorY}"><rect x="0" y="${floorY}" width="${sw}" height="${H - floorY}" fill="url(#sc-fade)"/></mask></defs>`
    ) + c.p.el("lab.floor", `<g filter="url(#sc-epoxy)"><rect x="0" y="${floorY}" width="${sw}" height="${H - floorY}" fill="url(#sc-floor)"/></g>`, { sw, y: floorY, h: H - floorY }) + c.p.el("lab.reflection", `<g mask="url(#sc-floormask)"><g filter="url(#sc-polish)"><use href="#sc-room" transform="matrix(1 0 0 -1 0 ${2 * floorY})"/></g></g>`, { sw, y: floorY }) + c.p.el("lab.pool", `<ellipse cx="${f2(sx)}" cy="${floorY + 6}" rx="50" ry="5" fill="${warm}" opacity=".12" filter="url(#sc-soft)"/>`, { cx: sx, cy: floorY + 6 });
    return { sky: "#1a2028", soil: "#1a1e24", groundTop: floorY, back, near, keep: [[wx + ww / 2, wy + wh / 2, 22], [bx + bw / 2, 39, bw / 2], [sx, sy, 12]] };
  }
  function foliage(rand, cx, cy, rx, ry, n3, light, paint) {
    const clumps = [];
    for (let i = 0; i < n3; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand());
      const x = cx + Math.cos(a) * rx * d;
      const y = cy + Math.sin(a) * ry * d;
      clumps.push([x, y, between(rand, 3, 6.5) * (1.25 - d * 0.5)]);
    }
    clumps.sort((a, b) => a[1] - b[1]);
    const len = Math.hypot(light.x, light.y) || 1;
    const ux = light.x / len;
    const uy = light.y / len;
    let body = "";
    let lit = "";
    let glint = "";
    let deep = "";
    for (const [x, y, r2] of clumps) {
      const blob = (ox, oy, k) => `M${f2(x + ox - r2 * k)} ${f2(y + oy)}a${f2(r2 * k)} ${f2(r2 * k * 0.86)} 0 1 0 ${f2(r2 * k * 2)} 0a${f2(r2 * k)} ${f2(r2 * k * 0.86)} 0 1 0 ${f2(-r2 * k * 2)} 0z`;
      const facing = (x - cx) / rx * ux + (y - cy) / ry * uy;
      body += blob(0, 0, 1);
      if (facing < -0.25) deep += blob(0, 0, 0.92);
      else deep += blob(-ux * r2 * 0.35, -uy * r2 * 0.35 + r2 * 0.25, 0.72);
      if (facing > 0.3) lit += blob(ux * r2 * 0.38, uy * r2 * 0.38, 0.52);
      else if (facing > -0.15) glint += blob(ux * r2 * 0.42, uy * r2 * 0.42, 0.4);
    }
    return {
      body: `<path fill="${paint.body}" d="${body}"/>`,
      deep: `<path fill="${paint.deep}" d="${deep}"/>`,
      lit: `<path fill="${paint.lit}" d="${lit}"/><path fill="${paint.lit}" opacity=".45" d="${glint}"/>`
    };
  }
  function crestLine(sw, y, step2 = 12) {
    let d = "";
    for (let x = -step2; x <= sw + step2; x += step2) d += `${x === -step2 ? "M" : "L"}${x} ${f2(y(x))}`;
    return d;
  }
  function night2(c) {
    const { rand, sw, ground } = c;
    const moonX = sw * 0.8;
    const moonY = 24;
    const KEY = "#cad6ff";
    const SHADE = "#66709a";
    const DEEP = "#3c4466";
    const top = "#0b1030";
    const low = "#2a3a6e";
    const farH = noise(rand, [[10, 300], [4, 110]]);
    const midH = noise(rand, [[7, 260], [3, 90]]);
    const far = (x) => 74 - farH(x);
    const hill = (x) => ground - 18 - midH(x);
    const vx = sw * 0.46;
    const nightStars = stars(rand, sw, Math.round(90 * c.detail), 64, [moonX, moonY, 28]);
    const sky3 = () => c.p.el("night.sky", `<rect width="${sw}" height="${H}" fill="url(#sc-sky)"/>`, { sw }) + c.p.el("night.stars", nightStars) + c.p.el(
      "night.moon",
      `<circle cx="${f2(moonX)}" cy="${moonY}" r="70" fill="url(#sc-moon)"/><circle cx="${f2(moonX)}" cy="${moonY}" r="23" fill="none" stroke="#c8cce8" stroke-opacity=".1" stroke-width="3" filter="url(#sc-soft)"/>` + bloom(orb(moonX, moonY, 9.5, "#f3ecd4", "sc-moonball"), 0.8),
      { cx: moonX, cy: moonY, r: 9.5 }
    ) + c.p.el("night.clouds", `<g filter="url(#sc-soft)"><path fill="#3a4676" d="M${f2(moonX - 90)} ${moonY + 10}q40 -3 80 -1.5q30 -2 50 1.5q-60 2.4 -130 0z"/><path fill="#8a94c8" opacity=".6" d="M${f2(moonX - 60)} ${moonY + 10.6}q40 -1.4 70 0q-35 1 -70 0z"/></g>`, { cx: moonX - 30, cy: moonY + 10 });
    const farHills = `<path fill="url(#sc-farhill)" d="${ridge(sw, 0, (x) => -far(x))}" filter="url(#sc-dof)"/>`;
    const hillLight = `<path fill="url(#sc-hilllight)" d="${ridge(sw, 0, (x) => -hill(x))}"/>`;
    const cottages = [-40, -16, 8, 30, 52].map((dx, i) => {
      const x = vx + dx;
      const y = hill(x + 5) + 2.5;
      const w = 13 - i % 2 * 3;
      const h = 7 - i % 3;
      const roof = w * 0.5;
      const lit = i === 1;
      return `<path fill="#2a3256" d="M${f2(x)} ${f2(y)}v${-h}l${f2(w / 2)} ${f2(-roof)}l${f2(w / 2)} ${f2(roof)}v${h}z"/><path fill="#5a6898" d="M${f2(x + w / 2)} ${f2(y - h - roof)}l${f2(w / 2)} ${f2(roof)}v${h}h${f2(-w * 0.18)}v${f2(-h + 0.6)}z" opacity=".75"/><path fill="#1a2040" d="M${f2(x - 0.8)} ${f2(y - h + 0.4)}l${f2(w / 2 + 0.8)} ${f2(-roof - 0.8)}l${f2(w / 2 + 0.8)} ${f2(roof + 0.8)}l-1 0l${f2(-w / 2 - 0.3)} ${f2(-roof)}l${f2(-w / 2 - 0.3)} ${f2(roof)}z"/>` + (lit ? `<circle cx="${f2(x + 3.2)}" cy="${f2(y - 3.4)}" r="9" fill="url(#sc-window)"/>` + bloom(`<rect x="${f2(x + 2.2)}" y="${f2(y - 4.4)}" width="2" height="2" fill="#ffd27a"/>`, 1) + `<rect x="${f2(x + w - 4.5)}" y="${f2(y - h - roof * 0.5 - 3)}" width="2" height="4" fill="#2a3256"/>` + [0, 1, 2].map((k) => `<circle cx="${f2(x + w - 3.5)}" cy="${f2(y - h - roof * 0.5 - 4)}" r="1.4" fill="#8a90b8" opacity="0" filter="url(#sc-soft)"><animateTransform attributeName="transform" type="translate" values="0 0;${-5 - k * 2} -16" dur="8s" begin="${k * 2.6}s" repeatCount="indefinite"/><animate attributeName="r" values="1.2;3.4" dur="8s" begin="${k * 2.6}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.4;0" dur="8s" begin="${k * 2.6}s" repeatCount="indefinite"/></circle>`).join("") : `<rect x="${f2(x + 2.2)}" y="${f2(y - 4.4)}" width="2" height="2" fill="#121830"/>`);
    }).join("");
    const villageTrees = [-56, 66, 76].map((dx) => {
      const x = vx + dx;
      const y = hill(x) + 2;
      const r2 = 6 + Math.abs(dx % 3);
      return `<path fill="#141c34" d="M${f2(x - r2)} ${f2(y - r2 * 0.6)}a${r2} ${f2(r2 * 0.9)} 0 1 1 ${r2 * 2} 0q0 ${f2(r2 * 0.6)} ${-r2} ${f2(r2 * 0.6)}q${-r2} 0 ${-r2} ${f2(-r2 * 0.6)}z"/><path fill="${KEY}" opacity=".22" d="M${f2(x)} ${f2(y - r2 * 1.5)}a${r2} ${f2(r2 * 0.9)} 0 0 1 ${f2(r2 * 0.9)} ${f2(r2 * 0.6)}a${f2(r2 * 1.1)} ${f2(r2 * 0.8)} 0 0 0 ${f2(-r2 * 0.9)} ${f2(-r2 * 0.6)}z"/>`;
    }).join("");
    const meadowTop = noise(rand, [[3, 220], [1.5, 70]]);
    const meadowLight = `<path fill="url(#sc-meadowlight)" d="${ridge(sw, ground - 6, meadowTop, 16)}"/><g filter="url(#sc-blur3)"><ellipse cx="${f2(moonX - 40)}" cy="${ground + 4}" rx="${f2(sw * 0.3)}" ry="12" fill="${KEY}" opacity=".55"/></g>`;
    const pathD = `M${f2(sw * 0.2)} ${H + 2}C${f2(sw * 0.3)} ${ground + 10} ${f2(sw * 0.34)} ${ground} ${f2(vx + 6)} ${f2(hill(vx) + 3)}l3 0C${f2(sw * 0.4)} ${ground + 2} ${f2(sw * 0.42)} ${ground + 12} ${f2(sw * 0.34)} ${H + 2}z`;
    let blades = "";
    let tips = "";
    for (let x = between(rand, 0, 16); x < sw; x += between(rand, 18, 40)) {
      const size = between(rand, 1.2, 2);
      const y = H + 1;
      for (let k = 0; k < 6; k++) {
        const bx = x + (k - 3) * 1.6 * size;
        const h = between(rand, 4, 8) * size;
        const lean = between(rand, -2, 2) * size;
        blades += `M${f2(bx - 0.9 * size)} ${y}Q${f2(bx + lean * 0.4)} ${f2(y - h * 0.6)} ${f2(bx + lean)} ${f2(y - h)}Q${f2(bx + lean * 0.4 + 0.5 * size)} ${f2(y - h * 0.5)} ${f2(bx + 0.9 * size)} ${y}z`;
        if (bx > sw * 0.45 && rand() < 0.3) tips += `M${f2(bx + lean)} ${f2(y - h)}l${f2(0.5 * size)} ${f2(h * 0.25)}h${f2(-0.7 * size)}z`;
      }
    }
    const oakX = 8;
    const trunk = `<path fill="${SHADE}" d="M${oakX - 10} ${ground + 6}C${oakX - 2} ${ground - 2} ${oakX} ${ground - 26} ${oakX - 2} ${ground - 56}L${oakX + 10} ${ground - 58}C${oakX + 10} ${ground - 32} ${oakX + 13} ${ground - 12} ${oakX + 26} ${ground + 6}zM${oakX} ${ground - 52}C${oakX + 8} ${ground - 62} ${oakX + 22} ${ground - 66} ${oakX + 40} ${ground - 70}l1 3C${oakX + 26} ${ground - 62} ${oakX + 14} ${ground - 56} ${oakX + 9} ${ground - 48}z"/><path fill="${DEEP}" d="M${oakX - 10} ${ground + 6}C${oakX - 2} ${ground - 2} ${oakX} ${ground - 26} ${oakX - 2} ${ground - 56}l4 0C${oakX + 3} ${ground - 26} ${oakX + 2} ${ground - 4} ${oakX - 2} ${ground + 6}z"/><path fill="${KEY}" d="M${oakX + 8} ${ground - 56}C${oakX + 8} ${ground - 32} ${oakX + 11} ${ground - 12} ${oakX + 24} ${ground + 6}h2C${oakX + 13} ${ground - 12} ${oakX + 10} ${ground - 32} ${oakX + 10} ${ground - 58}z" opacity=".8"/>`;
    const crown = foliage(rand, oakX + 30, 30, 48, 24, 120, { x: 1, y: -0.8 }, { body: SHADE, lit: KEY, deep: DEEP });
    const oak = `<g filter="url(#sc-oakbark)">${trunk}</g><g filter="url(#sc-oakleaves)">${crown.body}${crown.deep}${crown.lit}</g><g opacity=".3" style="mix-blend-mode:screen" filter="url(#sc-soft)">${crown.lit.replaceAll(`fill="${KEY}"`, 'fill="#8a9ad8"')}</g>`;
    const flies = Array.from({ length: Math.round(10 * c.detail) }, () => {
      const x = between(rand, sw * 0.12, sw * 0.95);
      const y = between(rand, ground - 28, ground - 4);
      return `<circle cx="${f2(x)}" cy="${f2(y)}" r=".9" fill="#f6e98a"><animate attributeName="opacity" values="0;1;0" dur="${f2(between(rand, 2.5, 4))}s" begin="${f2(-rand() * 4)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${f2(between(rand, -6, 6))} -4;0 0" dur="${f2(between(rand, 5, 8))}s" repeatCount="indefinite"/></circle>`;
    }).join("");
    const back = c.p.defs(
      `<defs>` + vgrad("sc-sky", [[0, top], [0.55, "#1a2656"], [0.78, low], [1, "#5a6aa0"]]) + rgrad("sc-moon", "#f4ecd0", 0.42) + rgrad("sc-window", "#ffc870", 0.55) + vgrad("sc-farhill", [[0, "#3c4a7e"], [0.15, "#2a3666"], [1, "#202a52"]]) + `<linearGradient id="sc-crest"><stop offset="0" stop-color="#8a96d0" stop-opacity=".15"/><stop offset=".75" stop-color="#c8d4ff" stop-opacity=".7"/><stop offset="1" stop-color="#c8d4ff" stop-opacity=".9"/></linearGradient>` + vgrad("sc-hilllight", [[0, "#d0daff"], [0.06, "#a0aad4"], [0.3, "#6e78a2"], [1, "#3a4266"]]) + material("sc-nightgrass", ["#18223a", "#1d2942", "#232f4a", "#2a3854"], 0.07, 0.18, 4, 31, 2) + `</defs>`
    ) + sky3() + c.p.el("night.hills-far", `<path fill="#3a4880" opacity=".7" d="${ridge(sw, 0, (x) => -(far(x) - 6 - farH(x * 1.7) * 0.4))}" filter="url(#sc-dof)"/>` + farHills, { sw }) + // Mist lying in the valley between the far hills and the village's hill.
    c.p.el("night.mist", `<g filter="url(#sc-haze)"><rect x="${-sw * 0.1}" y="66" width="${sw * 1.2}" height="20" fill="url(#sc-lowmist)"><animateTransform attributeName="transform" type="translate" values="0 0;${f2(sw * 0.03)} 0;0 0" dur="40s" repeatCount="indefinite"/></rect></g>`, { lean: c.detail < 1, sw, y: 66, h: 20 }) + c.p.el("night.hill", `<g filter="url(#sc-nightgrass)">${hillLight}</g>`, { sw }) + // The crest catches the moon: a fine line of light along it, strongest toward the moon.
    c.p.el("night.crest", `<g filter="url(#sc-soft)" style="mix-blend-mode:screen"><path fill="none" stroke="url(#sc-crest)" stroke-width="1.6" d="${crestLine(sw, hill)}"/></g>`, { d: crestLine(sw, hill) }) + c.p.el("night.trees", villageTrees) + c.p.el("night.cottages", cottages);
    const near = c.p.defs(
      `<defs>` + vgrad("sc-lowmist", [[0, "#9aa8e0", 0], [0.6, "#9aa8e0", 0.35], [1, "#9aa8e0", 0]]) + vgrad("sc-meadowlight", [[0, "#5e6890"], [0.3, "#6a76a0"], [1, "#30384f"]]) + vgrad("sc-pathnight", [[0, "#9aa4c8"], [1, "#6a7294"]]) + material("sc-meadow", ["#141d30", "#182339", "#1d2a42", "#23324c"], 0.06, 0.16, 4, 33, 2) + material("sc-nightsoil", ["#34323c", "#3a3842", "#423f4a", "#4a4652"], 0.12, 0.3, 3, 35, 1.6) + material("sc-oakbark", ["#2a1a12", "#3a2418", "#4a2e1e", "#5a3a26"], 0.7, 0.05, 3, 37) + material("sc-oakleaves", ["#0e1a1e", "#132226", "#192a2e", "#203436"], 0.8, 0.8, 2, 39) + `<filter id="sc-blur3" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>`
    ) + c.p.el("night.meadow", `<g filter="url(#sc-meadow)">${meadowLight}</g>`, { sw }) + c.p.el("night.path", `<g filter="url(#sc-nightsoil)"><path fill="url(#sc-pathnight)" d="${pathD}" filter="url(#sc-soft)"/></g>`, { d: pathD }) + c.p.el("night.grass", `<path fill="#0c1222" d="${blades}"/><path fill="${KEY}" opacity=".22" d="${tips}"/>`) + c.p.el("night.oak", oak) + c.p.el("night.fireflies", flies);
    return { sky: top, soil: "#141c30", groundTop: H, back, near, keep: [[moonX, moonY, 14]] };
  }
  var SCENES = { forest, space, city, desert, volcano, lab, night: night2 };
  function richBackdrop(scene, rand, sw, ground, _w, lean = false, soft = false, p = LIT) {
    const make = SCENES[scene.backdrop] ?? night2;
    const s = make({ rand, sw, ground, detail: lean ? 0.4 : 1, p });
    const floor = s.floor ?? ground;
    const groundTop = s.groundTop ?? ground - 6;
    return {
      // The authored scenes keep their own light: a palette from the narrator would only fight it.
      sky: s.sky,
      ground: s.soil,
      floor,
      groundTop,
      back: `<defs><clipPath id="sc-stage"><rect width="${sw}" height="${H}"/></clipPath><filter id="sc-soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>` + LIGHT2 + `<filter id="sc-glow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${sw + 40}" height="${H + 40}"><feGaussianBlur stdDeviation="2.4"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` + // Drawn smooth, a slight softness over all the scenery keeps Claude and the caption reading first.
      (soft ? `<filter id="sc-calm" filterUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${H}"><feGaussianBlur stdDeviation=".6" edgeMode="duplicate"/></filter>` : "") + `</defs>` + clip(soft ? `<g filter="url(#sc-calm)">${s.back}</g>` : s.back),
      near: clip(soft ? `<g filter="url(#sc-calm)">${s.near}</g>` : s.near),
      keep: (s.keep ?? []).map(([x, y, r2]) => ({ x: x - r2, y: y - r2, w: r2 * 2, h: r2 * 2 })),
      lens: p.el("lens", clip(
        `<defs><filter id="sc-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11"/><feColorMatrix type="saturate" values="0"/></filter><radialGradient id="sc-vignette" cx=".5" cy=".46" r=".72"><stop offset=".5" stop-color="black" stop-opacity="0"/><stop offset="1" stop-color="black" stop-opacity=".42"/></radialGradient></defs><rect width="${sw}" height="${H}" filter="url(#sc-grain)" opacity=".1" style="mix-blend-mode:overlay"/><rect width="${sw}" height="${H}" fill="url(#sc-vignette)"/>`
      ), { sw })
    };
  }

  // ../hooks/svg.ts
  var W2 = 640;
  var H2 = 128;
  var MIN_W = 320;
  var MAX_W = 1600;
  var U = 4;
  var GROUND_Y = 104;
  var BUDGET = 126e3;
  var FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var INK3 = "#1f1e1d";
  var PAPER3 = "#ece9df";
  function escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function rng(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
    return () => {
      seed = seed + 1831565813 | 0;
      let t = seed;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var n2 = (v) => (Math.round(v * 100) / 100).toString();
  function pixelPaths(rows, colorOf, _cell = "solid") {
    const byColor = /* @__PURE__ */ new Map();
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const key = row[x] ?? ".";
        const color = key === "." ? void 0 : colorOf(key);
        let end = x + 1;
        while (end < row.length && row[end] === key) end++;
        if (color) {
          const list = byColor.get(color) ?? [];
          list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
          byColor.set(color, list);
        }
        x = end;
      }
    });
    return [...byColor].map(([color, d]) => `<path fill="${color}" d="${d.join("")}"/>`).join("");
  }
  var widthOf = (rows) => Math.max(0, ...rows.map((r2) => r2.length));
  function artFor(prop) {
    if (typeof prop.sprite === "string") {
      const sprite = SPRITES[prop.sprite] ?? SPRITES.star;
      const accent = prop.color ?? sprite.accent;
      return { rows: sprite.rows, colorOf: (k) => k === "a" ? accent : PALETTE[k] };
    }
    const { pixels, colors } = prop.sprite;
    return { rows: pixels, colorOf: (k) => colors[k] };
  }
  function backdrop(scene, rand, sw) {
    const accent = scene.palette.accent;
    const parts = [];
    const front = [];
    const at = (v) => Math.round(v / U) * U;
    let sky3 = "#262624";
    let ground = "#3a3833";
    let floor = GROUND_Y;
    switch (scene.backdrop) {
      case "forest": {
        sky3 = "#20261f";
        ground = "#3c6e34";
        for (let i = 0; i < Math.round(9 * sw / W2); i++) {
          const x = at(rand() * sw);
          const h = at(24 + rand() * 30);
          parts.push(
            `<rect x="${x}" y="${GROUND_Y - h}" width="${U * 3}" height="${h}" fill="#2a3a26"/>`,
            `<rect x="${x - U * 2}" y="${GROUND_Y - h - U * 3}" width="${U * 7}" height="${U * 5}" fill="#2f4a2a"/>`
          );
        }
        for (let x = 0; x < sw; x += U * 5) {
          const h = U * (1 + Math.floor(rand() * 3));
          front.push(`<rect x="${x + at(rand() * 8)}" y="${GROUND_Y - h}" width="${U}" height="${h}" fill="#5e9c4a"/>`);
        }
        break;
      }
      case "space": {
        sky3 = "#14121c";
        ground = "#14121c";
        floor = 92;
        for (let i = 0; i < 3; i++) {
          const r2 = 4 + rand() * 12;
          parts.push(`<circle cx="${n2(rand() * sw)}" cy="${n2(10 + rand() * 60)}" r="${n2(r2)}" fill="${["#54408a", "#7b5fb5", "#8a8780"][i]}" opacity=".7"/>`);
        }
        break;
      }
      case "city": {
        sky3 = "#1e2230";
        ground = "#33353d";
        let x = 0;
        while (x < sw) {
          const w = at(24 + rand() * 40);
          const h = at(30 + rand() * 50);
          parts.push(`<rect x="${x}" y="${GROUND_Y - h}" width="${w - U}" height="${h}" fill="#2b2f3d"/>`);
          for (let wy = GROUND_Y - h + U * 2; wy < GROUND_Y - U * 2; wy += U * 3) {
            for (let wx = x + U; wx < x + w - U * 2; wx += U * 3) {
              if (rand() < 0.35) {
                const blink = rand() < 0.2 ? `<animate attributeName="opacity" values="1;.2;1" dur="${n2(2 + rand() * 4)}s" repeatCount="indefinite"/>` : "";
                parts.push(`<rect x="${wx}" y="${wy}" width="${U}" height="${U}" fill="#e3b341" opacity=".8">${blink}</rect>`);
              }
            }
          }
          x += w;
        }
        break;
      }
      case "desert": {
        sky3 = "#2e2620";
        ground = "#c9a46a";
        parts.push(`<circle cx="${n2(80 + rand() * (sw - 160))}" cy="26" r="14" fill="#f0c060"/>`);
        for (let i = 0; i < Math.round(4 * sw / W2); i++) {
          const cx = rand() * sw;
          parts.push(`<ellipse cx="${n2(cx)}" cy="${GROUND_Y}" rx="${n2(60 + rand() * 60)}" ry="${n2(8 + rand() * 10)}" fill="#a8844f"/>`);
        }
        break;
      }
      case "volcano": {
        sky3 = "#2a1a17";
        ground = "#4a2c20";
        const vx = at(sw * 0.6 + rand() * (sw * 0.4 - 120));
        parts.push(
          `<polygon points="${vx},${GROUND_Y} ${vx + 50},${GROUND_Y - 70} ${vx + 66},${GROUND_Y - 70} ${vx + 116},${GROUND_Y}" fill="#5a3520"/>`,
          `<rect x="${vx + 50}" y="${GROUND_Y - 74}" width="16" height="6" fill="#f06a2b"><animate attributeName="fill" values="#f06a2b;#e3b341;#f06a2b" dur="1.4s" repeatCount="indefinite"/></rect>`
        );
        for (let i = 0; i < 6; i++) {
          const dx = (rand() - 0.5) * 60;
          parts.push(
            `<rect x="${vx + 56}" y="${GROUND_Y - 76}" width="${U}" height="${U}" fill="#f06a2b"><animateTransform attributeName="transform" type="translate" values="0 0;${n2(dx)} -30;${n2(dx * 1.6)} 10" dur="${n2(1.6 + rand())}s" begin="${n2(rand() * 2)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" dur="${n2(1.6 + rand())}s" repeatCount="indefinite"/></rect>`
          );
        }
        break;
      }
      case "lab": {
        sky3 = "#202628";
        ground = "#3b3e47";
        for (let x = 0; x < sw; x += 32) parts.push(`<rect x="${x}" y="0" width="1" height="${GROUND_Y}" fill="#2a3134"/>`);
        for (let y = 0; y < GROUND_Y; y += 32) parts.push(`<rect x="0" y="${y}" width="${sw}" height="1" fill="#2a3134"/>`);
        for (let x = 0; x < sw; x += U * 4) front.push(`<rect x="${x}" y="${GROUND_Y}" width="${U * 2}" height="${U}" fill="#5b5f6b"/>`);
        break;
      }
      case "night":
      default: {
        sky3 = "#1b1d26";
        ground = "#2c2e36";
        parts.push(`<circle cx="${n2(60 + rand() * (sw - 120))}" cy="24" r="10" fill="#e8e3c8"/>`);
        break;
      }
    }
    if (accent) front.push(`<rect x="0" y="${GROUND_Y}" width="${sw}" height="2" fill="${accent}" opacity=".7"/>`);
    return {
      sky: scene.palette.sky ?? sky3,
      ground: scene.palette.ground ?? ground,
      floor,
      back: parts.join(""),
      front: front.join("")
    };
  }
  var flatStage = (s) => ({ sky: s.sky, ground: s.ground, floor: s.floor, groundTop: GROUND_Y, back: s.back, near: s.front, keep: [], lens: "" });
  function particles(scene, rand, sw) {
    if (!scene.particles) return "";
    const { kind, density } = scene.particles;
    const count = Math.round(density * 36 * sw / W2);
    const out = [];
    for (let i = 0; i < count; i++) {
      const x = n2(rand() * sw);
      const y = n2(rand() * GROUND_Y);
      const dur = n2(1.5 + rand() * 3);
      const begin = n2(-rand() * 4);
      switch (kind) {
        case "stars":
          out.push(
            `<rect x="${x}" y="${n2(rand() * 80)}" width="2" height="2" fill="#e3d9a0"><animate attributeName="opacity" values="1;.15;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></rect>`
          );
          break;
        case "rain":
          out.push(
            `<rect x="${x}" y="-8" width="1" height="6" fill="#6fa8d0"><animateTransform attributeName="transform" type="translate" values="0 0;-8 ${GROUND_Y + 8}" dur="${n2(0.6 + rand() * 0.5)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`
          );
          break;
        case "snow":
          out.push(
            `<rect x="${x}" y="-4" width="2" height="2" fill="${PAPER3}"><animateTransform attributeName="transform" type="translate" values="0 0;6 ${GROUND_Y / 2};-4 ${GROUND_Y + 4}" dur="${n2(4 + rand() * 4)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`
          );
          break;
        case "bubbles":
          out.push(
            `<circle cx="${x}" cy="${GROUND_Y}" r="${n2(1 + rand() * 2)}" fill="none" stroke="#9fd3e0"><animateTransform attributeName="transform" type="translate" values="0 0;4 -${GROUND_Y / 2};-2 -${GROUND_Y}" dur="${n2(3 + rand() * 3)}s" begin="${begin}s" repeatCount="indefinite"/></circle>`
          );
          break;
        case "sparks":
          out.push(
            `<rect x="${x}" y="${y}" width="2" height="2" fill="#e3b341"><animateTransform attributeName="transform" type="translate" values="0 0;${n2((rand() - 0.5) * 20)} -20" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></rect>`
          );
          break;
        case "leaves":
          out.push(
            `<rect x="${x}" y="-4" width="3" height="2" fill="${rand() < 0.5 ? "#c98a3a" : "#5e9c4a"}"><animateTransform attributeName="transform" type="translate" values="0 0;30 ${GROUND_Y / 2};10 ${GROUND_Y + 4}" dur="${n2(4 + rand() * 3)}s" begin="${begin}s" repeatCount="indefinite"/></rect>`
          );
          break;
      }
    }
    return out.join("");
  }
  function fixed(hex) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m?.[1]) return hex;
    const v = parseInt(m[1], 16);
    return `rgb(${v >> 16 & 255},${v >> 8 & 255},${v & 255})`;
  }
  function label(text, cx, y, tag, sw) {
    const w = text.length * 5 + 8;
    const x = Math.min(sw - w - 2, Math.max(2, cx - w / 2));
    const top = Math.max(2, y - 13);
    return `<rect x="${n2(x)}" y="${n2(top)}" width="${w}" height="11" fill="${fixed(tag.fill)}" stroke="${fixed(tag.stroke)}" stroke-width="1"/><text x="${n2(x + 4)}" y="${n2(top + 8)}" font-family="${FONT}" font-size="8" fill="${fixed(tag.ink)}">${escapeXml(text)}</text>`;
  }
  function propSvg(prop, floor, index, sw, cell) {
    const art = artFor(prop);
    const w = widthOf(art.rows) * U;
    const h = art.rows.length * U;
    const x = Math.round((sw - w) * prop.x / 100);
    const y = prop.y === "ground" ? floor - h : prop.y === "air" ? 58 - h / 2 : 8;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const body = `<g transform="translate(${x} ${n2(y)}) scale(${U})">${pixelPaths(art.rows, art.colorOf, cell)}</g>`;
    const slow = n2(2 + index % 3 * 0.7);
    let motion = "";
    switch (prop.motion) {
      case "bob":
        motion = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U};0 0" dur="${slow}s" repeatCount="indefinite"/>`;
        break;
      case "drift":
        motion = `<animateTransform attributeName="transform" type="translate" values="0 0;24 -2;0 0" dur="${n2(6 + index)}s" repeatCount="indefinite"/>`;
        break;
      case "shake":
        motion = `<animateTransform attributeName="transform" type="translate" values="0 0;-2 0;2 0;0 0" dur=".25s" repeatCount="indefinite"/>`;
        break;
      case "fall":
        motion = `<animateTransform attributeName="transform" type="translate" values="0 -${n2(y + h)};0 0;0 0" keyTimes="0;.4;1" dur="3s" repeatCount="indefinite"/>`;
        break;
      case "spin":
        motion = `<animateTransform attributeName="transform" type="rotate" values="0 ${n2(cx)} ${n2(cy)};360 ${n2(cx)} ${n2(cy)}" dur="${slow}s" repeatCount="indefinite"/>`;
        break;
      case "blink":
        motion = `<animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite"/>`;
        break;
      case "scroll":
        motion = `<animateTransform attributeName="transform" type="translate" values="${sw - x} 0;${-x - w} 0" dur="${n2(7 + index)}s" repeatCount="indefinite"/>`;
        break;
    }
    const tint = prop.color ?? "#d9d4c7";
    const style = { fill: INK3, ink: tint, stroke: tint };
    const tag = prop.label ? label(prop.label, cx, y, style, sw) : "";
    return `<g>${body}${tag}${motion}</g>`;
  }
  var HERO_W = 13 * U;
  var HERO_H = 9 * U;
  var heroColor = (k) => PALETTE[k];
  var isApproach = (scene) => scene.hero.action === "approach";
  var MODEL_STAGE_H = 40;
  var APPROACH_MARGIN = 4;
  var APPROACH_YAW = 0;
  var asMotion = (a) => a === "approach" ? "walk" : a;
  var SPRITE_ACTION = {
    walk: "walk",
    run: "run",
    fly: "fly",
    dig: "dig",
    inspect: "inspect",
    celebrate: "celebrate",
    think: "think",
    carry: "walk",
    sneak: "walk",
    jump: "run",
    tumble: "run",
    panic: "inspect",
    sleep: "think",
    dance: "celebrate",
    spin: "celebrate",
    wave: "celebrate",
    point: "inspect",
    peek: "inspect",
    trip: "think",
    shrug: "think",
    approach: "walk",
    angry: "inspect",
    dazed: "think"
  };
  var SPEED = { run: 110, fly: 80, tumble: 90, jump: 60, carry: 30, sneak: 25 };
  var heroReach = (action) => action === "celebrate" ? 16 : action === "jump" ? 18 : action === "dance" ? 6 : action === "fly" || action === "panic" || action === "angry" ? 2 : 0;
  var LOOP_FIRST = (motion) => Math.max(2.4, 2 * MOTION_TIMING[motion].dur);
  function hero10(scene, floor, sw, figure, tint = (svg) => svg) {
    const cell = figure.kind === "pixel" ? figure.cell : "solid";
    const approach = isApproach(scene);
    const action = asMotion(figure.kind === "pixel" ? SPRITE_ACTION[scene.hero.action] : scene.hero.action);
    const then = figure.kind === "pixel" || !scene.hero.then ? void 0 : asMotion(scene.hero.then);
    const kind = MOTION_TIMING[action].kind;
    const isMoving = kind === "travel";
    const span = sw - HERO_W;
    const fromX = Math.round(span * scene.hero.from / 100);
    const toX = Math.round(span * scene.hero.to / 100);
    const baseY = action === "fly" ? 34 : floor - HERO_H;
    const speed = SPEED[action] ?? 45;
    const moveDur = approach ? APPROACH_SECONDS : isMoving ? Math.max(0.6, Math.abs(toX - fromX) / speed) : 0;
    const step2 = action === "run" ? 0.18 : 0.32;
    const steps = isMoving ? Math.max(2, Math.round(moveDur / step2)) : 0;
    const yaw = approach ? APPROACH_YAW : 0.55;
    const flip = toX < fromX && !(approach && figure.kind === "3d" && yaw === 0) ? ` translate(${HERO_W} 0) scale(-1 1)` : "";
    const second = figure.kind === "pixel" ? void 0 : then ?? (kind === "once" || isMoving && action !== "fly" ? "idle" : void 0);
    const handover = second === void 0 ? void 0 : isMoving ? moveDur : kind === "once" ? MOTION_TIMING[action].dur : LOOP_FIRST(action);
    const legs = (frame, values) => `<g opacity="${frame === 0 ? 1 : 0}" transform="scale(${U})">${pixelPaths(HERO_FRAMES[frame] ?? [], heroColor, cell)}` + (steps ? `<animate attributeName="opacity" values="${values}" dur="${step2 * 2}s" calcMode="discrete" repeatCount="${steps / 2}"/>` : "") + `</g>`;
    const model = (motion, when = {}) => figure.kind === "3d" ? motionSvg(motion, { height: MODEL_STAGE_H, cx: HERO_W / 2, floor: HERO_H, yaw, hero: figure.hero, ...when }).svg : "";
    const frames = figure.kind === "pixel" ? legs(0, "1;0") + legs(1, "0;1") : second === void 0 || handover === void 0 ? model(action) : model(action, { until: handover }) + model(second, { from: handover, maxFrames: figure.kind === "3d" ? figure.lean ? 2 : figure.second : void 0 });
    const until = handover === void 0 ? 'repeatCount="indefinite"' : `repeatDur="${n2(handover)}s"`;
    let inner = "";
    const baked = figure.kind === "3d";
    switch (baked && action !== "fly" && action !== "inspect" ? "baked" : action) {
      case "fly":
        inner = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U};0 0" dur="1.2s" ${until} additive="sum"/>`;
        break;
      case "dig":
        inner = `<animateTransform attributeName="transform" type="rotate" values="-6 ${HERO_W / 2} ${HERO_H};6 ${HERO_W / 2} ${HERO_H};-6 ${HERO_W / 2} ${HERO_H}" dur=".4s" repeatCount="indefinite" additive="sum"/>`;
        break;
      case "inspect":
        inner = `<animateTransform attributeName="transform" type="translate" values="0 0;-${U * 2} 0;0 0;${U * 2} 0;0 0" dur="3s" ${until} additive="sum"/>`;
        break;
      case "celebrate":
        inner = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -16;0 0" keyTimes="0;.4;1" dur=".7s" repeatCount="indefinite" additive="sum"/>`;
        break;
      case "walk":
      case "run":
        inner = steps ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${U / 2}" dur="${step2}s" calcMode="discrete" repeatCount="${steps}" additive="sum"/>` : "";
        break;
    }
    const shown = (svg2, begin, end) => !svg2 || begin === void 0 && end === void 0 ? svg2 : `<g visibility="hidden">${svg2}<set attributeName="visibility" to="visible"${begin ? ` begin="${n2(begin)}s"` : ""}${end !== void 0 ? ` end="${n2(end)}s"` : ""}/></g>`;
    const extras = shown(flourish(action, figure), handover === void 0 ? void 0 : 0, handover) + (second && handover !== void 0 ? shown(flourish(second, figure), handover) : "");
    const travel = isMoving ? `<animateTransform attributeName="transform" type="translate" values="${fromX} ${baseY};${toX} ${baseY}" dur="${n2(moveDur)}s" fill="freeze"/>` : "";
    const at = isMoving ? fromX : toX;
    const body = `<g>${inner}<g transform="${flip.trim() || "translate(0 0)"}">${frames}</g>${tint(extras)}</g>`;
    const grow = `begin="0s" dur="${n2(APPROACH_SECONDS)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".4 0 .6 1"`;
    const svg = approach ? `<g transform="translate(${fromX + HERO_W / 2} ${floor})"><animateTransform attributeName="transform" type="translate" values="${fromX + HERO_W / 2} ${floor};${toX + HERO_W / 2} ${H2 - APPROACH_MARGIN}" ${grow}/><g transform="scale(1)"><animateTransform attributeName="transform" type="scale" values="1;${APPROACH_SCALE}" ${grow}/><g transform="translate(${-HERO_W / 2} ${-HERO_H})">${body}</g></g></g>` : `<g transform="translate(${at} ${baseY})">${travel}${body}</g>`;
    return { svg, startX: isMoving ? fromX : toX, endX: toX, endY: baseY, arrive: isMoving ? moveDur : 0 };
  }
  function flourish(action, figure) {
    if (action === "think" && figure.kind === "pixel") {
      return [0, 1, 2].map(
        (i) => `<rect x="${HERO_W + 2 + i * 6}" y="-6" width="${U}" height="${U}" fill="${PAPER3}"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.3;.8;1" dur="1.5s" begin="${i * 0.3}s" repeatCount="indefinite"/></rect>`
      ).join("");
    }
    if (action === "dig") {
      return [0, 1, 2, 3].map(
        (i) => `<rect x="${HERO_W / 2}" y="${HERO_H - 2}" width="${U}" height="${U}" fill="#7a4a2b"><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 1.5) * 14} -18;${(i - 1.5) * 22} 4" dur=".9s" begin="${i * 0.2}s" repeatCount="indefinite"/></rect>`
      ).join("");
    }
    if (action === "celebrate") {
      return [0, 1, 2, 3, 4].map(
        (i) => `<rect x="${i * 12}" y="-4" width="3" height="3" fill="${["#e3b341", "#e05252", "#6fc2c9", "#5e9c4a", "#7b5fb5"][i]}"><animateTransform attributeName="transform" type="translate" values="0 0;${(i - 2) * 6} -20" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/></rect>`
      ).join("");
    }
    if (action === "sleep") {
      return [0, 1, 2, 3].map(
        (i) => `<g transform="translate(${HERO_W * 0.62} ${HERO_H - MODEL_STAGE_H + 2})" opacity="0"><animateTransform attributeName="transform" type="translate" values="${HERO_W * 0.62} ${HERO_H - MODEL_STAGE_H + 2};${HERO_W * 0.62 + 10 + i % 2 * 6} ${HERO_H - MODEL_STAGE_H - 30}" dur="2.8s" begin="${n2(i * 0.7)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.7;1" dur="2.8s" begin="${n2(i * 0.7)}s" repeatCount="indefinite"/><g><animateTransform attributeName="transform" type="scale" values=".5;1.8" dur="2.8s" begin="${n2(i * 0.7)}s" repeatCount="indefinite"/><text x="0" y="0" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="900" fill="#f6f1e2" stroke="#1d1a2e" stroke-width="1.4" stroke-linejoin="round" paint-order="stroke">Z</text></g></g>`
      ).join("");
    }
    if (action === "trip") {
      const { dur } = MOTION_TIMING.trip;
      const star = (x, y) => `<path d="M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/>`;
      return `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.32;.36;.68;.72;1" dur="${dur}s" fill="freeze"/><g transform="translate(${HERO_W / 2 + 8} ${HERO_H - MODEL_STAGE_H - 10}) scale(1 .45)"><g fill="#ffd84a" stroke="#3a2a10" stroke-width=".8" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" values="0;360" dur=".9s" repeatCount="indefinite"/>${star(15, 0)}${star(-7.5, 13)}${star(-7.5, -13)}</g></g></g>`;
    }
    return "";
  }
  var MONO_FONT = "Monocraft, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var MONO_FACE = `<defs><style>@font-face{font-family:Monocraft;font-weight:400;src:url(data:font/woff2;base64,${MONOCRAFT}) format("woff2")}@font-face{font-family:Monocraft;font-weight:700;src:url(data:font/woff2;base64,${MONOCRAFT_BOLD}) format("woff2")}</style></defs>`;
  var paper = (shape, skin) => `<g transform="translate(1.2 1.8)" fill="black" opacity=".22">${shape}</g><g fill="${skin.ink}" stroke="${skin.ink}" stroke-width="2.2" stroke-linejoin="round">${shape}</g><g fill="${skin.card}">${shape}</g>`;
  var kindAttrs = (kind, skin) => `fill="${skin.kinds[kind]}"${kind === "num" || kind === "bad" || kind === "good" ? ' font-weight="700"' : ""}`;
  var FACE = /^(\^_\^|\^\^;?|>_<|>\.<|o_O|O_o|o\.O|:-?[)(DPpO3|/]|;-?\)|[xX]D|T_T|-_-|\._\.|\\o\/|<3|¯\\_\(ツ\)_\/¯|\(•_•\)|\(⌐■_■\)|->|=>|<-|~>|>>>|\.\.\.|\[(OK|ok|WIP|TODO|DONE)\]|\/\/|#!|\$|&&|\|\|)$/;
  var BAD = /^(✗|FAIL(ED)?|failed|failing|fails|broke|broken|crash(ed|es)?|red|\w*Error|\w*Exception|N\+1|panic|segfault|404|500)$/;
  var GOOD = /^(✓|PASS(ED)?|passed|passes|passing|green|clean|fixed|ships?|shipped|done|OK|merged|liftoff|LGTM)$/i;
  var NUM = /^[~+\-]?\d[\d.,]*(%|x|×|s|ms|kb|mb|gb|k)?$|^\d+\/\d+$/i;
  var FN = /^[\w.$#]+\(\)$/;
  var PATH = /^[\w@~./-]*\w\.(tsx?|jsx?|mjs|cjs|py|rb|go|rs|java|kt|swift|json|ya?ml|toml|css|scss|html|md|sql|sh|lock|env|test\.ts)$|^~?\.?\/?[\w@.-]+\/[\w@./-]*$/i;
  var CMD = /^(npm|npx|pnpm|yarn|bun|git|pytest|tsc|eslint|cargo|go|make|pip|docker|curl|gh)$|^--?\w/;
  function words(text, tone3) {
    const out = [];
    const mark = tone3 === "trouble" ? "\u2717" : tone3 === "milestone" ? "\u2713" : "";
    if (mark && !text.trimStart().startsWith(mark)) out.push({ lead: "", core: mark, tail: "", kind: tone3 === "trouble" ? "bad" : "good" });
    let inCode = false;
    for (const raw of text.split(" ").filter(Boolean)) {
      const opens = raw.startsWith("`");
      const ticks = (raw.match(/`/g) ?? []).length;
      const code = inCode || opens;
      if (ticks % 2 === 1) inCode = !inCode;
      const bare = raw.replace(/`/g, "");
      if (!bare) continue;
      if (FACE.test(bare)) {
        out.push({ lead: "", core: bare, tail: "", kind: code ? "code" : "face" });
        continue;
      }
      const call = /^(.*\(\))([.,;:!?]*)$/.exec(bare);
      const m = call && FN.test(call[1] ?? "") ? ["", "", call[1], call[2]] : /^([("'[]*)(.*?)([.,;:!?)"'\]]*)$/.exec(bare);
      const [lead, core, tail] = m ? [m[1] ?? "", m[2] ?? "", m[3] ?? ""] : ["", bare, ""];
      const kind = !core ? "plain" : code || CMD.test(core) ? "code" : BAD.test(core) ? "bad" : GOOD.test(core) ? "good" : FN.test(core) ? "fn" : PATH.test(core) ? "path" : NUM.test(core) ? "num" : "plain";
      out.push({ lead, core, tail, kind });
    }
    return out;
  }
  var WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/g;
  var cols = (t) => t.length + (t.match(WIDE)?.length ?? 0);
  var wordLen = (w) => cols(w.lead) + cols(w.core) + cols(w.tail);
  var MAX_LINES = 4;
  function wrapWords(list, width) {
    const lines = [];
    let line = [];
    let len = 0;
    for (const w0 of list) {
      const w = wordLen(w0) > width ? { ...w0, core: w0.core.slice(0, Math.max(1, width - w0.lead.length - w0.tail.length)) } : w0;
      if (line.length && len + 1 + wordLen(w) > width) {
        lines.push(line);
        line = [];
        len = 0;
      }
      len += (line.length ? 1 : 0) + wordLen(w);
      line.push(w);
    }
    if (line.length) lines.push(line);
    return lines;
  }
  function bubbleTimeline(cols2, o) {
    const out = [];
    cols2.forEach((c, i) => {
      let typeStart = o.start;
      if (i > 0) typeStart = out[i - 1].typeEnd;
      if (i >= o.lines) {
        const gone = out[i - o.lines];
        const hold = Math.max(READ_HOLD_MIN, 2 * o.secondsPerChar * cols2[i - o.lines]);
        gone.leaves = Math.max(out[i - 1].typeEnd, gone.typeEnd + hold);
        typeStart = gone.leaves + SCROLL_SECONDS;
      }
      out.push({ typeStart, typeEnd: typeStart + Math.max(0.2, c * o.secondsPerChar) });
    });
    return out;
  }
  var lineLen = (line) => line.reduce((t, w) => t + wordLen(w), 0) + line.length - 1;
  var lineSvg = (line, skin) => line.map((w) => escapeXml(w.lead) + (w.kind === "plain" ? escapeXml(w.core) : `<tspan ${kindAttrs(w.kind, skin)}>${escapeXml(w.core)}</tspan>`) + escapeXml(w.tail)).join(" ");
  var overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  function propRects(prop, floor, sw, unit) {
    if (prop.motion === "scroll") return [];
    const art = artFor(prop);
    const w = widthOf(art.rows) * unit;
    const h = art.rows.length * unit;
    const x = Math.round((sw - w) * prop.x / 100);
    const y = prop.y === "ground" ? floor - h : prop.y === "air" ? 58 - h / 2 : 8;
    const reach = prop.motion === "drift" ? 24 : prop.motion === "bob" ? 0 : 2;
    const rects = [{ x: x - 2, y: y - 4, w: w + reach + 4, h: h + 6 }];
    if (prop.label) {
      const lw = prop.label.length * 5 + 8;
      rects.push({ x: Math.min(sw - lw - 2, Math.max(2, x + w / 2 - lw / 2)), y: Math.max(2, y - 13), w: lw, h: 11 });
    }
    return rects;
  }
  function caption(text, hero11, idPrefix, sw, look, avoid, tone3, start = 0.2, bubble, secondsPerChar = TYPE_SECONDS_PER_CHAR) {
    const { fill, stroke, radius } = look.caption;
    const onPaper = tone3 !== void 0;
    const skin = look.paper ?? PAPER2;
    const ink5 = onPaper ? skin.ink : look.caption.ink;
    const heroX = hero11.x;
    const heroY = hero11.y;
    const scale = hero11.scale ?? 1;
    const [heroW, heroH, modelH] = [HERO_W * scale, HERO_H * scale, MODEL_STAGE_H * scale];
    const heroBox = { x: heroX - 4 - hero11.sway, y: heroY - 8 - hero11.jump, w: heroW + 8 + hero11.sway * 2, h: heroH + 12 + hero11.jump };
    const top = heroY + heroH - modelH - hero11.jump;
    const list = onPaper ? words(look.bubble?.upper ? text.toUpperCase() : text, tone3) : text.split(" ").filter(Boolean).map((core) => ({ lead: "", core, tail: "", kind: "plain" }));
    const type = onPaper ? look.bubble ?? { font: MONO_FONT, size: 9, charW: 6, line: 12, base: 13 } : { font: look.font, size: 9.5, charW: look.charW, line: 11, base: 12 };
    const KEYS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const heroAt = (k) => hero11.startX + (heroX - hero11.startX) * k;
    const boxAt = (k) => ({ ...heroBox, x: heroAt(k) - 4 - hero11.sway });
    const clampX = (v, w2) => Math.min(sw - w2 - 2, Math.max(2, v));
    const slipAt = (k, ox2, w2) => Math.abs(clampX(heroAt(k) + ox2, w2) - (heroAt(k) + ox2));
    const FINE = Array.from({ length: 101 }, (_, i) => i / 100);
    const joinsAt = (ox2, w2) => {
      if (!hero11.arrive) return 0;
      let k = 1;
      while (k > 0 && slipAt(Math.round((k - 0.01) * 100) / 100, ox2, w2) < 1) k = Math.round((k - 0.01) * 100) / 100;
      return FINE.includes(k) && slipAt(k, ox2, w2) < 1 ? k : 1;
    };
    const lo = 2 - Math.min(hero11.startX, heroX);
    const hi = (w2) => sw - w2 - 2 - Math.max(hero11.startX, heroX);
    const isRightward = heroX > hero11.startX;
    let best = { x: 2, y: 4, ox: 0, score: Infinity, lines: [], w: 0, h: 0 };
    const wraps = (bubble ? [32] : [32, 25, 19, 15]).map((width) => wrapWords(list, width));
    const fits = wraps.filter((lines2) => bubble || lines2.length <= MAX_LINES);
    for (const [wi, lines2] of (fits.length ? fits : wraps.slice(0, 1)).entries()) {
      const w2 = Math.ceil(Math.max(...lines2.map(lineLen)) * type.charW + 14);
      const h2 = (bubble ? bubble.lines : lines2.length) * type.line + 7;
      const beside = Math.min(GROUND_Y - h2 - 4, Math.max(4, top - 4));
      const above = top - h2 - 8;
      const below = heroY + heroH + 9;
      const spots = [
        [heroW + 8, beside],
        [-w2 - 8, beside],
        [heroW / 2 - w2 / 2, above],
        [heroW - 10, above],
        [-w2 + 10, above],
        // Under Claude, for when it flies and there is no room above it.
        [heroW / 2 - w2 / 2, below]
      ];
      for (const [si, [ox0, y0]] of spots.entries()) {
        const y2 = y0 === below ? Math.min(H2 - h2 - 3, y0) : Math.min(GROUND_Y - h2 - 4, Math.max(4, y0));
        const isOver = si >= 2;
        const [a, b] = [Math.max(lo, -w2 + 14), Math.min(hi(w2), heroW - 14)];
        const along = Math.min(heroW - 14, Math.max(-w2 + 14, ox0));
        const ox2 = !isOver ? ox0 : a <= b ? Math.min(b, Math.max(a, ox0)) : isRightward ? Math.max(-w2 + 14, Math.min(along, hi(w2))) : Math.min(heroW - 14, Math.max(along, lo));
        const x2 = clampX(heroX + ox2, w2);
        const covers = KEYS.reduce((t, k) => t + overlap({ x: clampX(heroAt(k) + ox2, w2), y: y2, w: w2, h: h2 }, boxAt(k)), 0);
        const waits = joinsAt(ox2, w2) * hero11.arrive;
        const score = covers * 50 + waits * 3e3 + avoid.reduce((t, a2) => t + overlap({ x: x2, y: y2, w: w2, h: h2 }, a2) * 3, 0) + si * 6 + wi * 40;
        if (score < best.score) best = { x: x2, y: y2, ox: ox2, score, lines: lines2, w: w2, h: h2 };
      }
    }
    const { lines, w, h, x, y, ox } = best;
    const joins = joinsAt(ox, w);
    const appear = joins * hero11.arrive + (hero11.wait ?? 0);
    let delay = start + appear;
    const timeline = bubble ? bubbleTimeline(lines.map(lineLen), { lines: bubble.lines, secondsPerChar, start: delay }) : [];
    const typed = lines.map((line, i) => {
      const dur = timeline[i] ? timeline[i].typeEnd - timeline[i].typeStart : Math.max(0.2, lineLen(line) * secondsPerChar);
      const id = `${idPrefix}${i}`;
      const reveal = `<clipPath id="${id}"><rect x="${n2(x)}" y="${n2(y + 2 + i * type.line)}" width="0" height="${type.line + 2}"><animate attributeName="width" from="0" to="${w}" dur="${n2(dur)}s" begin="${n2(timeline[i]?.typeStart ?? delay)}s" fill="freeze"/></rect></clipPath>`;
      delay += dur;
      return reveal + `<text clip-path="url(#${id})" x="${n2(x + 7)}" y="${n2(y + type.base + i * type.line)}" font-family="${type.font}" font-size="${type.size}" fill="${ink5}">${lineSvg(line, skin)}</text>`;
    }).join("");
    const rises = timeline.map(
      (t, i) => t.leaves === void 0 ? "" : `<animateTransform attributeName="transform" type="translate" from="0 ${n2(-i * type.line)}" to="0 ${n2(-(i + 1) * type.line)}" begin="${n2(t.leaves)}s" dur="${n2(SCROLL_SECONDS)}s" fill="freeze"/>`
    ).join("");
    const rows = bubble ? `<clipPath id="${idPrefix}win"><rect x="${n2(x)}" y="${n2(y + type.base - type.line + type.size * 0.3 + 0.5)}" width="${w}" height="${bubble.lines * type.line}"/></clipPath><g clip-path="url(#${idPrefix}win)"><g>${rises}${typed}</g></g>` : typed;
    const dims = bubble ? ` data-lines="${bubble.lines}" data-rows="${lines.length}"` : "";
    const follows = [.../* @__PURE__ */ new Set([0, joins, ...KEYS.filter((k) => k > joins)])].sort((p, q) => p - q);
    const follow = hero11.arrive && hero11.startX !== heroX ? ` transform="translate(${n2(clampX(heroAt(0) + ox, w) - x)} 0)"><animateTransform attributeName="transform" type="translate" values="${follows.map((k) => `${n2(clampX(heroAt(k) + ox, w) - x)} 0`).join(";")}" keyTimes="${follows.join(";")}" dur="${n2(hero11.arrive)}s" fill="freeze"/` : "";
    const fade = `<animate attributeName="opacity" values="0;1" dur=".2s"${appear ? ` begin="${n2(appear)}s"` : ""} fill="freeze"/>`;
    const hidden = appear ? ` opacity="0" data-speaks="${n2(appear)}"` : "";
    if (onPaper) {
      const hx = heroX + heroW / 2;
      const hy = top + 10;
      let base;
      if (x >= hx) base = [[x + 2, y + h - 13], [x + 2, y + h - 5]];
      else if (x + w <= hx) base = [[x + w - 2, y + h - 13], [x + w - 2, y + h - 5]];
      else {
        const cx = Math.min(x + w - 12, Math.max(x + 12, hx));
        base = y + h < hy ? [[cx - 4, y + h - 2], [cx + 4, y + h - 2]] : [[cx - 4, y + 2], [cx + 4, y + 2]];
      }
      const mx = (base[0][0] + base[1][0]) / 2;
      const my = (base[0][1] + base[1][1]) / 2;
      const len = Math.hypot(hx - mx, hy - my) || 1;
      const reach = Math.min(10, len * 0.6);
      const tip = [mx + (hx - mx) / len * reach, my + (hy - my) / len * reach];
      if (look.bubble) return `<g data-part="speech" data-tone="${tone3}"${dims}${hidden}${follow || ""}>${look.bubble.font.includes("Monocraft") ? MONO_FACE : ""}${look.bubble.draw({ x, y, w, h }, { base, tip })}${rows}${fade}</g>`;
      const shape = `<rect x="${n2(x)}" y="${n2(y)}" width="${w}" height="${h}" rx="6"/><path d="M${n2(base[0][0])} ${n2(base[0][1])}L${n2(tip[0])} ${n2(tip[1])}L${n2(base[1][0])} ${n2(base[1][1])}z"/>`;
      return `<g data-part="speech" data-tone="${tone3}"${dims}${hidden}${follow || ""}>${MONO_FACE}${paper(shape, skin)}${rows}${fade}</g>`;
    }
    return `<g data-part="speech"${dims}${hidden}${follow || ""}><rect x="${n2(x)}" y="${n2(y)}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>${rows}${fade}</g>`;
  }
  function title(text, color, look) {
    const w = text.length * (look.charW - 0.3) + 16;
    const inset = look.inset ?? 0;
    return `<g font-family="${look.font}" font-size="9" fill="${color}" transform="translate(${inset} ${inset})"><path d="M6 12V6h6M${n2(6 + w)} 12V6h-6" fill="none" stroke="${color}" stroke-width="1"/><text x="14" y="10">${escapeXml(text)}</text></g>`;
  }
  function chapterTag(text, color, look, rich) {
    const inset = look.inset ?? 0;
    if (look.tag) return look.tag(text, inset);
    const shown = rich ? { ...look, font: MONO_FONT, charW: 6.3 } : look;
    return { svg: title(text, color, shown), w: text.length * look.charW + 34 + inset, h: 16 + inset };
  }
  function stageWidth(width, height) {
    const fit = Number.isFinite(width / height) && width > 0 && height > 0 ? width * H2 / height : W2;
    return Math.round(Math.min(MAX_W, Math.max(MIN_W, fit)));
  }
  var SPRITE_EYE = "#1f1412";
  var SPRITE_OUTLINE = "#3a1e14";
  var PIXEL2 = 2;
  var PIXELIZE = (sw, claude, grade = "", sprite = { eye: SPRITE_EYE, outline: SPRITE_OUTLINE }) => {
    const dot = 0.4;
    const r2 = n2((PIXEL2 - dot) / 2);
    const grid = (at) => {
      const gx = Math.ceil(at.x / PIXEL2) * PIXEL2;
      const gy = Math.ceil(at.y / PIXEL2) * PIXEL2;
      return `<feFlood x="${n2(gx + (PIXEL2 - dot) / 2)}" y="${n2(gy + (PIXEL2 - dot) / 2)}" width="${dot}" height="${dot}" flood-color="black"/><feComposite x="${n2(gx)}" y="${n2(gy)}" width="${PIXEL2}" height="${PIXEL2}"/><feTile result="grid"/>`;
    };
    const sample = (from, result) => `<feComposite in="${from}" in2="grid" operator="in"/><feMorphology operator="dilate" radius="${r2}" result="${result}"/>`;
    const region = (at) => `filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${n2(at.x)}" y="${n2(at.y)}" width="${n2(at.w)}" height="${n2(at.h)}"`;
    const stage = { x: 0, y: 0, w: sw, h: H2 };
    return (
      // Claude, on the same grid, as a sprite: its solid body sampled crisp; its dark features
      // (eyes, finer than a pixel) found by their darkness, thickened just enough to land on
      // whole pixels and set solid; a one-pixel dark outline round the body. The translucent
      // ground shadow is sampled too, under it all, but kept out of the outline and the eyes.
      `<filter id="sc-pixelize-claude" ${region(claude)} color-interpolation-filters="sRGB">` + grid(claude) + `<feComponentTransfer in="SourceGraphic" result="solid"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer>` + sample("SourceGraphic", "all") + sample("solid", "sampled") + `<feComponentTransfer in="sampled" result="body"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 -17.7 -3.3 0 3.6"/><feComposite in2="solid" operator="in"/><feMorphology operator="dilate" radius=".7" result="dark"/>` + sample("dark", "darkpx") + `<feComponentTransfer in="darkpx"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feComposite in2="body" operator="in" result="eyemask"/><feFlood flood-color="${sprite.eye}"/><feComposite in2="eyemask" operator="in" result="eyes"/><feMorphology in="body" operator="dilate" radius="${PIXEL2}"/><feComposite in2="body" operator="out" result="ring"/><feFlood flood-color="${sprite.outline}"/><feComposite in2="ring" operator="in" result="outline"/><feMerge><feMergeNode in="all"/><feMergeNode in="outline"/><feMergeNode in="body"/><feMergeNode in="eyes"/></feMerge></filter><filter id="sc-pixelize" ${region(stage)} color-interpolation-filters="sRGB">` + (grade ? `${grade}<feMerge result="graded"><feMergeNode/></feMerge>` : "") + `${grid(stage)}${sample(grade ? "graded" : "SourceGraphic", "px")}</filter>`
    );
  };
  function sceneToSvg(scene, options = {}) {
    const sw = options.width && options.height ? stageWidth(options.width, options.height) : W2;
    const width = options.width ?? sw;
    const height = options.height ?? Math.round(width * H2 / sw);
    const look = lookFor(options.look);
    const rand = rng(`${scene.backdrop}|${scene.caption}`);
    const wants = options.figure && options.figure !== "auto" ? options.figure : look.figure;
    const rich = wants === "3d";
    const pixelArt = rich && look.pixel === true;
    const art = rich ? look.art : void 0;
    const painter2 = art?.painter(sw);
    const figure = rich ? { kind: "3d", hero: art?.hero() } : { kind: "pixel", cell: look.cell };
    const stageAt = (lean) => rich ? richBackdrop(scene, rng(`${scene.backdrop}|${scene.caption}|stage`), sw, GROUND_Y, W2, lean, !pixelArt && !look.grade && !art, painter2) : flatStage(backdrop(scene, rand, sw));
    let stage = stageAt(false);
    const dust = painter2 ? painter2.el("particles", particles(scene, rand, sw)) : particles(scene, rand, sw);
    const props = rich ? [] : scene.props.map((p, i) => propSvg(p, stage.floor, i, sw, look.cell));
    const tint = painter2 ? (svg2) => painter2.el("particles", svg2) : void 0;
    let plan = hero10(scene, stage.floor, sw, figure, tint);
    const accent = scene.palette.accent ?? "#d9d4c7";
    const idPrefix = `fable${Math.floor(rand() * 2 ** 31).toString(36)}-`;
    const entrance = scene.enter === "fade" ? ENTRANCE_SECONDS : 0;
    const sky3 = art?.sky ?? stage.sky;
    const ground = art?.ground ?? stage.ground;
    const gradeBody = look.grade?.(sw, H2, pixelArt) ?? "";
    const grade = gradeBody && !pixelArt ? `<defs>${gradeFilter("lk-grade", sw, H2, gradeBody)}</defs>` : "";
    const edge = look.edge ?? sky3;
    const tag = scene.title ? chapterTag(scene.title, look.titleColor ?? (rich ? "#efe6d2" : accent), look, rich) : void 0;
    const avoid = (propCount) => [
      ...scene.props.slice(0, propCount).flatMap((p) => propRects(p, stage.floor, sw, U)),
      ...tag ? [{ x: 0, y: 0, w: tag.w, h: tag.h }] : [],
      ...stage.keep
    ];
    const approach = isApproach(scene);
    const grown = HERO_W * APPROACH_SCALE;
    const claudeBox = approach ? { x: Math.min(plan.startX, plan.endX) + HERO_W / 2 - grown / 2 - 30, y: 0, w: Math.abs(plan.endX - plan.startX) + grown + 60, h: H2 } : { x: Math.min(plan.startX, plan.endX) - 30, y: plan.endY - 40, w: Math.abs(plan.endX - plan.startX) + HERO_W + 60, h: HERO_H + 56 };
    const reach = Math.max(heroReach(scene.hero.action), scene.hero.then ? heroReach(scene.hero.then) : 0);
    const sway = scene.hero.action === "inspect" ? 2 * U : 0;
    const bigX = plan.endX + HERO_W / 2 - grown / 2;
    const speaker = approach ? { startX: bigX, x: bigX, y: H2 - APPROACH_MARGIN - HERO_H * APPROACH_SCALE, arrive: 0, jump: reach * APPROACH_SCALE, sway: sway * APPROACH_SCALE, scale: APPROACH_SCALE, wait: APPROACH_SECONDS } : { startX: plan.startX, x: plan.endX, y: plan.endY, arrive: plan.arrive, jump: reach, sway };
    const fore = (withDust, propCount) => (withDust ? dust : "") + props.slice(0, propCount).join("") + (pixelArt ? `<g filter="url(#sc-pixelize-claude)">${plan.svg}</g>` : plan.svg);
    const build2 = (withDust, propCount) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sw} ${H2}" width="${width}" height="${height}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" style="display:block;background:${look.grade ? edge : ground}"${look.grade || art ? ` data-look="${look.name}"` : ""}>` + grade + `<rect x="${-sw * 4}" y="${-H2 * 4}" width="${sw * 9}" height="${H2 * 4 + GROUND_Y}" fill="${look.grade ? edge : sky3}"/>` + (art?.defs ? `<defs>${art.defs(sw, H2)}</defs>` : "") + (pixelArt ? `<defs>${PIXELIZE(sw, claudeBox, gradeBody)}</defs><g filter="url(#sc-pixelize)">` : "") + (grade ? `<g filter="url(#lk-grade)">` : "") + // The graded stage carries its own sky, so the grade sees the whole picture.
    (look.grade ? `<rect width="${sw}" height="${H2}" fill="${sky3}"/>` : "") + (art?.under?.(sw, H2) ?? "") + stage.back + `<rect x="${-sw * 4}" y="${stage.groundTop}" width="${sw * 9}" height="${H2 * 4}" fill="${ground}"/>` + // Ground-level scenery goes down before anything that stands on it.
    stage.near + fore(withDust, propCount) + stage.lens + (grade ? "</g>" : "") + (pixelArt ? "</g>" : "") + (look.texture?.(sw, H2, GROUND_Y, pixelArt) ?? "") + (look.frame?.(sw, H2, GROUND_Y) ?? "") + (tag?.svg ?? "") + caption(scene.caption, speaker, idPrefix, sw, look, avoid(propCount), rich ? scene.tone ?? (scene.hero.action === "celebrate" ? "milestone" : "work") : void 0, entrance + 0.2, options.bubble, options.secondsPerChar) + // A new setting fades in from the dark, so the band never jumps from one place to the next.
    (entrance ? `<rect x="${-sw * 4}" y="${-H2 * 4}" width="${sw * 9}" height="${H2 * 9}" fill="#0b0b10" pointer-events="none"><animate attributeName="opacity" values="1;0" dur="${n2(entrance)}s" fill="freeze"/></rect>` : "") + `</svg>`;
    const propsShown = props.length;
    let svg = build2(true, propsShown);
    if (svg.length > BUDGET && figure.kind === "3d") {
      plan = hero10(scene, stage.floor, sw, { ...figure, second: 6 }, tint);
      svg = build2(true, propsShown);
    }
    if (svg.length > BUDGET && rich) {
      stage = stageAt(true);
      svg = build2(true, propsShown);
    }
    if (svg.length > BUDGET) svg = build2(false, propsShown);
    if (svg.length > BUDGET && figure.kind === "3d") {
      plan = hero10(scene, stage.floor, sw, { ...figure, lean: true }, tint);
      svg = build2(false, propsShown);
    }
    if (svg.length > BUDGET && rich) {
      stage = flatStage(backdrop(scene, rand, sw));
      svg = build2(false, propsShown);
    }
    for (let count = propsShown - 1; svg.length > BUDGET && count >= 0; count--) svg = build2(false, count);
    return svg;
  }
  var speaksAfter = (svg) => Number(/data-part="speech"[^>]*\sdata-speaks="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  function typedAfter(svg) {
    const bubble = svg.slice(Math.max(0, svg.indexOf('data-part="speech"')));
    let last = 0;
    for (const m of bubble.matchAll(/<animate attributeName="width" from="0" to="[\d.]+" dur="([\d.]+)s" begin="(-?[\d.]+)s"/g)) last = Math.max(last, Number(m[1]) + Number(m[2]));
    return Math.round(last * 100) / 100;
  }

  // index.ts
  var SCHEMA_VERSION = 2;
  var BUBBLE_LINES = [1, 4];
  var SECONDS_PER_CHAR = [0.01, 0.2];
  function renderScene(input, options = {}) {
    try {
      let raw = input;
      if (typeof input === "string") {
        try {
          raw = JSON.parse(input);
        } catch {
          return { ok: false, error: "input is not valid JSON" };
        }
      }
      if (options.look !== void 0 && !LOOK_NAMES.includes(options.look)) {
        return { ok: false, error: `unknown look "${options.look}"` };
      }
      if (options.figure !== void 0 && !VOCAB.figures.includes(options.figure)) {
        return { ok: false, error: `unknown figure "${options.figure}"` };
      }
      const { bubble, secondsPerChar } = options;
      if (bubble !== void 0) {
        const lines = bubble?.lines;
        if (typeof bubble !== "object" || bubble === null || typeof lines !== "number" || !Number.isInteger(lines) || lines < BUBBLE_LINES[0] || lines > BUBBLE_LINES[1]) {
          return { ok: false, error: `bubble must be { lines: integer ${BUBBLE_LINES[0]}-${BUBBLE_LINES[1]} }` };
        }
      }
      if (secondsPerChar !== void 0 && (typeof secondsPerChar !== "number" || !Number.isFinite(secondsPerChar) || secondsPerChar < SECONDS_PER_CHAR[0] || secondsPerChar > SECONDS_PER_CHAR[1])) {
        return { ok: false, error: `secondsPerChar must be a number between ${SECONDS_PER_CHAR[0]} and ${SECONDS_PER_CHAR[1]}` };
      }
      const scene = parseScene(raw, { maxCaption: bubble ? MAX_LONG_CAPTION : MAX_CAPTION });
      if (!scene) return { ok: false, error: "not a scene: it needs a caption" };
      if (options.fadeIn) scene.enter = "fade";
      const svg = sceneToSvg(scene, { look: options.look, figure: options.figure, width: options.width, height: options.height, bubble: bubble && { lines: bubble.lines }, secondsPerChar });
      const warnings = [];
      const figure = options.figure && options.figure !== "auto" ? options.figure : LOOKS[options.look ?? DEFAULT_LOOK]?.figure;
      if (scene.props?.length && figure === "3d") {
        warnings.push('props-not-drawn: the 3d figure draws no props; pass figure "pixel" to show them');
      }
      return { ok: true, svg, scene, speaksAfter: speaksAfter(svg), typedAfter: typedAfter(svg), warnings };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
  var VOCAB = {
    schemaVersion: SCHEMA_VERSION,
    backdrops: BACKDROPS,
    actions: HERO_ACTIONS,
    motions: MOTIONS,
    particles: PARTICLES,
    sprites: SPRITE_NAMES,
    looks: LOOK_NAMES,
    figures: ["auto", "pixel", "3d"],
    tones: ["work", "trouble", "milestone"],
    heights: ["ground", "air", "sky"],
    defaults: { look: DEFAULT_LOOK, width: W2, height: H2, secondsPerChar: TYPE_SECONDS_PER_CHAR },
    limits: {
      maxProps: MAX_PROPS,
      maxCaption: MAX_CAPTION,
      maxLongCaption: MAX_LONG_CAPTION,
      bubbleLines: BUBBLE_LINES,
      maxLabel: MAX_LABEL,
      maxTitle: MAX_TITLE,
      maxPixelSide: MAX_PIXEL_SIDE,
      minWidth: MIN_W,
      maxWidth: MAX_W
    }
  };
  return __toCommonJS(index_exports);
})();
