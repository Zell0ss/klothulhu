Responde a: 15a71ae (H1-informe)

# Fase 1 · H1 — revisión del arquitecto

**Veredicto: aprobado con retoques** (dos, pequeños). Revisado contra el código de `fase1` (`2b1c32f`), no
contra el informe.

## 1. Lo comprobado

- `desktop/test/fase1.test.js` es **idéntico** al bloque normativo del plan (diff vacío). Bien.
- `npm test`: 14/15. P4 falla en la línea 72 (`deepEqual(r.warnings, [])`), por lo que dice el informe.
- `scenes.js`: `beats`, `sceneFor`, `readMs`, `STAGING`, `LINES` cumplen T3. `sceneFor` copia `hero` y
  `particles` (no comparte estado con `STAGING`). He probado a mano casos que el plan no cubría
  (`…`, `«…»`, puntos dentro de palabra como `v1.2` o una URL, texto solo con espacios), y todos salen bien.
- `index.html`: CSP exacta de D10, scripts clásicos, `<img>` con `data:`, sin `innerHTML`, el `src`
  solo se asigna si cambia, la cola sigue el §T4 (thinking se sustituye al momento, una pregunta nueva
  vacía la cola, el error espera a la escena en pantalla, 30 s y `idle`), el look inválido cae al de
  por defecto avisando una vez, los botones y el ratón según D12.
- `main.js`: ventana `640·scale × 128·scale + INPUT_H`, `init` con `look`, tray con `klothulhu.ico`,
  sprites fuera. `VENDOR.md` y el sha256 correctos. Electron `44.4.5` con lockfile.
- `CLAUDE.md` del repo: corto y correcto.

## 2. Hallazgos

| # | Hallazgo | Atribución |
|---|---|---|
| 2.1 | **P4 está mal escrita.** `r.warnings` (y, en general, cualquier array que cree el motor) vive en el reino de `vm`, y `deepStrictEqual` compara prototipos. Al comprobar el plan medí `props`, que sale de la escena de entrada (reino de Node), y no `warnings`. El diagnóstico del programador es correcto y su P4b lo cubre bien | **arquitecto** (plan) |
| 2.2 | El plan decía que `ruff check .` «sigue en verde», y en `main` ya hay 3 errores (`server/app.py` I001; `tests/test_core.py` I001 y F401). No lo comprobé al escribirlo. No se arregla en esta fase, que no toca el servidor: va a la fase 2 | **arquitecto** (plan) |
| 2.3 | El README de `fase1` y el README corregido sin commit en `main` tocan líneas vecinas (lista de la sección del cliente y la línea «Requires Node.js 20+»). Además, una de las viñetas de `main` («Long replies scroll inside the bubble…») deja de ser verdad en v2 | **arquitecto** (dejé el README sin commit al abrir la fase) |
| 2.4 | Respuesta vacía (`done` sin texto, raro pero posible): `beats` da `[]`, la escena de «pensando» se queda 30 s y después `idle`. No es grave; solo queda anotado | observación |
| 2.5 | Se pierde `prefers-reduced-motion`, que respetaba el cliente de sprites. El SVG de SMIL no tiene esa opción. No lo pedía el plan; queda anotado para la fase 3 | observación (plan) |

## 3. Desviaciones del informe

1. P4: ver 2.1. Corrección abajo (R1).
2. `"test": "node --test"`: **aprobado**. Bien visto.
3. README y `vendor/` en `main`: ver 2.3 y R2. El `vendor/` sin seguimiento lo borra Josem antes del merge (ya está
   en el diario).
4. Recorte de `boot` y los textos de `thinking`/`idle`: **aprobados**.

## Para el programador

Responde a: 15a71ae (H1-informe)

Se aprueba H1 salvo dos retoques. En este orden:

**R1 · Sustituye P4 en `desktop/test/fase1.test.js`** por este bloque, tal cual. Es la versión
normativa que vale desde ahora; la del `PLAN.md` queda superada por esta. Solo cambia la comparación
de arrays del motor (`[...x]` los trae al reino de Node):

```js
// P4 — toda la puesta en escena es válida: el motor la pinta sin corregir nada
// (H1-revision §2.1: los arrays del motor viven en el reino de vm; se copian antes de comparar)
test('P4 STAGING pinta sin correcciones en pixel y en un estilo 3D', () => {
  for (const kind of KINDS) assert.ok(K.STAGING[kind], `falta STAGING.${kind}`);
  for (const kind of KINDS) {
    const scene = K.sceneFor(kind, 'Los astros aplauden, sectario.');
    for (const look of ['pixel', 'ukiyoe']) {
      const r = M.renderScene(scene, { look });
      assert.equal(r.ok, true, `${kind}/${look}: ${r.error}`);
      assert.deepEqual([...r.warnings], [], `${kind}/${look}`);
      assert.equal(r.scene.caption, scene.caption);
      assert.equal(r.scene.backdrop, scene.backdrop);
      assert.deepEqual({ ...r.scene.hero }, { ...scene.hero });
      assert.equal(r.scene.tone, scene.tone);
      assert.deepEqual([...r.scene.props], []);
      if (scene.particles) assert.deepEqual({ ...r.scene.particles }, { ...scene.particles });
    }
  }
});
```

P4b se queda en `scenes.extra.test.js` o se borra, como prefieras: ahora es redundante.

**R2 · README.** Espera a que Josem haga commit del README de `main` (está en su lista). Después:
`git merge main` en `fase1` y resuelve el conflicto así: quédate con lo de `main` (clonar el repo, «Plain
JavaScript…», la viñeta del acceso directo de Windows con `create-shortcut.ps`) y con lo tuyo de v2, y
**quita la viñeta «Long replies scroll inside the bubble…»**. En v2 no hay burbuja; si quieres, cámbiala
por una línea sobre los botones 📋 (copia la respuesta entera) y ✕ (cierra la app). Si Josem aún no lo ha
hecho cuando acabes R1, haz R1, deja dicho en el anexo que R2 espera y para.

**Dónde parar:** `npm test` 15/15 (o 14/14 sin P4b), push de `fase1` y un anexo corto en
`H1-informe.md` (`## Anexo 1 — retoques`) con commit. Después Josem prueba K1-K7 en Konnos. Los errores de
ruff del servidor **no** se tocan (2.2, fase 2).

## 4. Revisión del anexo 1 (2026-10-15)

Responde a: 0e0f319 (H1-informe, anexo 1)

R1 comprobado contra el código: la P4 de `fase1.test.js` es el bloque de la revisión, tal cual, y P4b
se ha quitado. `npm test`: 14/14. **R1 aprobado.**

## Para el programador

Responde a: 0e0f319 (H1-informe, anexo 1)

R1 aprobado. **R2: adelante en cuanto Josem haga commit del README en `main`**, sin esperar otra
revisión mía, con las instrucciones de la sección anterior. Después, push de `fase1` y `## Anexo 2` con
commit. Para ahí: lo siguiente es la prueba de Josem en Konnos.

## 5. Revisión del anexo 2 (2026-10-15)

Responde a: c75988c (H1-informe, anexo 2)

R2 comprobado: `main` (`53c4f1d`) está dentro de `fase1`, el README conserva lo de Josem y lo de v2, sin
la viñeta de la burbuja y sin marcas de conflicto. `npm test`: 14/14. **R2 aprobado. El código de H1
queda aprobado.** La fase se cierra cuando Josem pase K1-K7 en Konnos (PLAN §5).

## Para el programador

Responde a: c75988c (H1-informe, anexo 2)

Nada que hacer hasta que Josem pruebe en Konnos. Si algo de K1-K7 falla, llegará como `H2-encargo.md`.
