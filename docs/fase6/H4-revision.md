---
proyecto: klothulhu
fase: 6
hito: H4
fecha: 2026-10-18
veredicto: aprobado con un retoque (R1); pendiente Z1-Z6 en Konnos
---

# Fase 6 · H4 — revisión

Revisado contra el código de `ceee0eb` y el encargo (`bcf9301`), no contra el informe.

## 1. Comprobado

- **`layout.js`**:
  - `sizeGeometry`, `nextSize`, `resizeBounds` y `startBounds` siguen T1;
  - la regla de solape de `startBounds` es la del encargo;
  - `openBounds` y `closeBounds` no cambian (J5 y J6 pasan);
  - `main.js` importa `STAGE_*` e `INPUT_H` en lugar de definirlos.
- **`state.js`**:
  - `parseState` nunca lanza y devuelve copias del valor por defecto;
  - `writeState` escribe en `.tmp` y renombra;
  - toma `SIZE_ORDER` de `layout.js`, así que no hay una segunda lista que mantener.
- **`main.js`**:
  - `estado.json` se lee después de `whenReady`;
  - `saveState()` guarda la posición del panel cerrado (`x + panelShift`) y los fallos no rompen nada;
  - `size` devuelve `null` con el panel abierto;
  - `setBounds` es una sola función, que usan el panel y el cambio de tamaño;
  - se guarda en `drag-end` y al cambiar de tamaño;
  - **no se escribe `config.json` en ningún sitio**;
  - el tray envía `size-request`.
- **`index.html`**:
  - `requestSize` respeta «parado y sin panel»;
  - el motor recibe `width: geom.stageW, height: STAGE_H`, que en `narrow` da un `viewBox` de 320 × 128 (lo comprobé con el motor vendorizado);
  - `applyGeom` se aplica antes de `bootScenes`, así que la primera escena ya sale con el tamaño guardado;
  - nada de HTML (D10).
- **Pruebas**: `desktop/test/fase6-h4.test.js` es idéntica a la normativa (`cmp`), `npm test` da 60 y `npm run check` está en verde.
- **Desviaciones del informe**: un solo commit en lugar de uno por tarea, y `state` como variable global. Aceptadas.

## 2. Hallazgos

### 2.1 La ruta de `estado.json` no es `%APPDATA%\klothulhu` — retoque R1

Electron calcula `userData` a partir de `app.getName()`, que sale de `productName` o, si no hay, de `name` en
`package.json`. Aquí es `klothulhu-desktop`, así que el fichero vive en
`%APPDATA%\klothulhu-desktop\estado.json`. El README (y la prueba Z6 del encargo) dicen `%APPDATA%\klothulhu`.

- **Atribución:** hueco del plan (arquitecto). Di la ruta sin comprobar el nombre de la app, y el README la copió.
- **Arreglo:** corregir la ruta en el README. No se cambia el nombre de la app: moverla de carpeta no aporta nada.

### 2.2 Menores, sin retoque

- Un clic en ⤡ antes de que responda `init` haría fallar `geom.size`. En la práctica no pasa, porque `init`
  responde antes de que la ventana se pinte. Atribución: implementación, aceptable.
- En `lingering`, cambiar de tamaño vuelve a escribir el bocadillo de la última respuesta. Es lo que pedía el
  encargo («se repinta desde el principio»).

## 3. Veredicto

**Aprobado con un retoque (R1).** Después, Josem prueba Z1-Z6 en Konnos, con la ruta corregida en Z6.

## Para el programador

Responde a: ceee0eb (H4-informe)

1. **R1:** en `desktop/README.md`, `%APPDATA%\klothulhu\estado.json` → `%APPDATA%\klothulhu-desktop\estado.json`.
   Un commit. No hace falta informe: basta con el mensaje de commit (`Fase 6 H4 R1: …`).

Después, para hasta que Josem pruebe S1-S4 (H3) y Z1-Z6 (H4).
