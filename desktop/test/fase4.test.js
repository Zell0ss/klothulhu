'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../renderer/scenes.js');

// G1 (cliente) — isCut con los casos compartidos con is_cut del servidor (D23)
test('G1 isCut = is_cut (cut_cases.json)', () => {
  const file = path.join(__dirname, '..', '..', 'tests', 'fixtures', 'cut_cases.json');
  for (const c of JSON.parse(fs.readFileSync(file, 'utf8')).cases) assert.equal(K.isCut(c.caption), c.cut, c.caption);
});
