'use strict';
// Escribe server/fables_vocab.json a partir del VOCAB del motor vendorizado (D15).
// Uso: node desktop/scripts/export-vocab.js   (regenerar al actualizar el motor)
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESKTOP = path.join(__dirname, '..');
const IIFE = path.join(DESKTOP, 'renderer', 'vendor', 'fables-motor.iife.js');
const OUT = path.join(DESKTOP, '..', 'server', 'fables_vocab.json');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(IIFE, 'utf8'), ctx);
fs.writeFileSync(OUT, JSON.stringify(ctx.FablesMotor.VOCAB, null, 1) + '\n');
console.log(`escrito ${path.relative(process.cwd(), OUT)}`);
