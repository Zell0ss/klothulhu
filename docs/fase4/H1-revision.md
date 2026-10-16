---
proyecto: klothulhu
fase: 4
hito: H1
fecha: 2026-10-16
veredicto: aprobado con retoques
---

# Fase 4 · H1 — revisión

> **Para:** el claudcoder y Josem. **Desde:** el claudquitecto, 2026-10-16.
> Revisado contra el código de `6b878d7..9e8f782` (rama `fase4`), no contra el informe.

## 1. Lo comprobado

- **Pruebas normativas:** `tests/test_fase4.py`, `tests/fixtures/cut_cases.json` y
  `desktop/test/fase4.test.js` son **idénticos** a los del plan (comparados con `diff`). Las pruebas y
  los fixtures de las fases anteriores y `desktop/renderer/` no han cambiado.
- **Ejecutado aquí:** `pytest` da 37 passed, `npm test` 35/35 y `ruff` no da avisos.
- **T1:** `is_cut` usa la misma expresión que `isCut` del cliente, y el fixture lo comprueba desde los
  dos lados.
- **T2:** `continue_scene` cumple D23:
  - es pura y trabaja sobre una copia profunda;
  - si el anterior no tenía partículas, quita la clave;
  - con acción en el sitio, `from` y `to` valen lo mismo; con desplazamiento, solo cambia `from`;
  - `then`, `props` y `tone` no se tocan.
  `TRAVEL` coincide con `MOTION_TIMING` del motor vendorizado, y el comentario dice dónde mirar.
- **T3:**
  - `last` guarda la escena ya corregida, así que una frase en tres trozos encadena bien (G8);
  - una `null` rompe la cadena (G9);
  - las `null` de relleno no pasan por aquí;
  - el `log.info` por respuesta cuenta fondo y personaje por separado.
- **T4:**
  - el prompt cambia la frase blanda por la regla de D23 y aclara que entre frases distintas hay
    libertad total;
  - `(continues)` va detrás de la emoción, como pide G10.
- **T5, preparación:**
  - las cuentas se hacen **antes** de la corrección: es la medida que hace falta;
  - el tope está en $0.10;
  - la ruta por defecto pasa a `docs/fase4/`, que es mejor que lo que pedía el plan, porque ya no se
    puede pisar `docs/fase2/` por despiste;
  - hay 3 preguntas nuevas de frase larga y no se ha quitado ninguna.

## 2. Desviaciones del informe

Todas **aprobadas**:
- T2 y T4 en un solo commit;
- la exención en `ruff.toml` para el fichero normativo, igual que en la fase 2;
- el ensayo `--fake` sin continuaciones, que cubren G7-G9;
- que no se cuente como continuación el golpe que va detrás de una `null`.

## 3. Hallazgos

- **3.1 · Comentario fuera de sitio** (programador, menor). En `server/beats.py`, el bloque nuevo
  `_ENDS_SENTENCE` está entre el comentario `# Fin de frase: …` y `_SENTENCE`, al que se refería. Ahora
  parece que ese comentario describe `_ENDS_SENTENCE`. Hay que moverlo para que cada comentario quede
  encima de su expresión. No cambia el comportamiento.

## 4. Veredicto

**Aprobado con un retoque (R1).** H2 (la pasada con la API real) puede empezar ya, sin esperar a R1.

## Para el programador

Responde a: 162ec9e (H1-informe)

1. **R1:** recoloca los comentarios de `server/beats.py` (§3.1). Un commit. Las pruebas no cambian.
2. **H2:** cuando Josem haya lanzado T5 (la orden está en el plan, en su shell y con la clave),
   escribe `docs/fase4/H2-informe.md` con:
   - el coste por modelo;
   - `continuations`, `fixed_backdrop`, `fixed_hero` y `long_beat_replies`;
   - 2-3 ejemplos de continuaciones que el servidor tuvo que corregir: qué dijo el director y qué
     salió;
   - la ruta de la galería.
   Haz commit de `docs/fase4/capturas/` junto con el informe. **Para** ahí.
