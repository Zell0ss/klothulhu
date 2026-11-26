# Fase 12 · H1: la caja grande y copiar la conversación — informe

Responde a: 184b3d5 (PLAN)

## Hecho

H1 completo, en los dos clientes. Commits en `fase12`:

- `4fff433`: `ChatIn.text` a 4000 (D65), la línea de I5 en `tests/test_fase10.py` y en su original (§4.3, el único cambio en
  normativas viejas) y `tests/test_fase12.py`. Nada más en el servidor recorta o rechaza por encima de 1000: solo el recorte
  de eventos de `memoria_bd.py`, que se queda.
- `9998ca5`: `entrada.js` (`KlEntrada`: `MAX_LINEAS`, `teclaEnter`, `altoCaja`), `toMarkdown` en `convo.js`, `textarea` + ⤢,
  Enter según el cliente (D64), 📋 en la cabecera del historial (D66), `npm run check`, README y
  `desktop/test/fase12-extra.test.js` (las dos recomendadas de §5 y una de regresión, ver desviación 2).

Pruebas: pytest 151 passed / 8 skipped, ruff limpio, desktop 114/114, web 31/31, `npm run check` en los dos. Las normativas de
la fase y la cambiada de la fase 10 son idénticas a sus originales (`cmp`).

### A mano, web (servidor de pruebas `KLOTHULHU_FAKE=1`, Chrome sin pantalla, 360 y 390 px, página por `http` no segura)

Capturas en `docs/fase12/capturas/` (`01`–`07`, con el ancho en el nombre). Sin errores ni avisos en consola.

| Qué | Resultado |
|---|---|
| Caja vacía | 44 px, como antes; la fila cabe (caja de 198 px a 360 y 228 a 390; con miniatura, 148 y 178) |
| 3 líneas | 88 px; el historial encoge; Enter no envía |
| 20 líneas | tope de 6 (154 px) y scroll |
| ⤢ | 407 px de 740 (55dvh), «Reducir la caja», `aria-pressed="true"` |
| ➤ y Ctrl+Enter | envían; tras enviar, una línea y sin ampliar |
| 1600 caracteres | llegan (contesta la respuesta enlatada) |
| 📋 del historial | `isSecureContext` falso, sin `navigator.clipboard`: copia el plan B; ✅ 1,2 s; pegado igual a lo copiado. Con `execCommand` fallando, ✕ |

Lo copiado a 360 px y pegado (la última pregunta eran 200 veces «palabra»; recortada aquí):

```markdown
# Klothulhu · 2026-11-26

**Tú:** busca el tiempo en Gijón

**Klothulhu:** Consulto los grimorios, mortal. Mañana habrá nubes y claros. Los astros no se comprometen.
fuentes: [example.org](https://example.org/)

**Tú:** uno
dos
tres

**Klothulhu:** Modo de pruebas, mortal. Si lees esto, el tubo funciona de punta a punta.

**Tú:** con control

**Klothulhu:** Respuesta enlatada número tres. Ph'nglui... zzz.

**Tú:** palabra palabra palabra […]

**Klothulhu:** ¿Otra vez? Vale, el streaming sigue vivo.
```

### A mano, escritorio (extra: Electron 44.4.5 de **Linux** bajo xvfb, en una copia fuera del repo)

No sustituye a K1-K3 en Windows. Capturas `d1`, `d3`, `d4`, `d6`, `d8`.

- Una línea: caja de 32 px en `y=198`, como antes (ahora 30 px más estrecha, por el ⤢).
- Crece hacia arriba (68 px con 3 líneas, 122 con 6) y la ventana sigue en 960×236. ⤢: 192 px desde `y=38`; los botones de
  arriba quedan libres. El foco no se va de la caja.
- Sobre la caja crecida la ventana pide los clics (`clickThrough(false)`). Mayús+Enter salta, Enter envía; Enter mientras
  espera no envía ni mete salto.
- 📋 del panel: ✅ y el Markdown en el portapapeles del sistema; sigue tras repintar; apagado tras «Olvidar».
- Tamaño estrecho con miniatura: cabe.

## Gasto

0.

## Desviaciones

1. **Móvil, ⤢ con poco alto:** `55dvh` es ahora el máximo. Con el teclado abierto (420 px de alto) la fila se salía y ➤
   quedaba fuera (borde inferior en 484). `#entry` puede encoger y la caja con ella; comprobado a 360 y 390 con 740, 480,
   420 y 360 de alto, con 1 línea, 6 y ampliada.
2. **Konnos, ratón (importa para tu revisión):** anclar `#entry` sobre la escena (§3.1) deja su contenedor transparente
   encima de klothulhu y se quedaba con el ratón: huecos sobre el ⤢ y la miniatura y, tras Esc con la caja ampliada,
   un clic en klothulhu ya no abría la caja. Ahora `#entry` va con `pointer-events: none` y solo sus piezas, abierta, con
   `auto`. Reproducido y comprobado en Electron; `main.js`, la IPC y `onStrip` sin cambios.
3. El panel de Konnos pasa a ser cabecera + `#turns` (lo que repinta `renderHistory()` y hace scroll); en la web,
   `#historyHead` es hermano de `#history`. La cabecera se lleva 37 px de historial en el móvil y 22 en Konnos.
4. Menores: ⤢ no roba el foco (en el móvil no cierra el teclado); en Konnos solo se ve con la caja abierta; si
   `writeText` falla en una página segura, también se intenta el plan B; texto de ayuda a 14 px en la web cuando hay
   miniatura (a 360 se cortaba); barras de scroll finas en la caja y en el panel de Konnos (salían blancas).
5. Esc en Konnos cierra la caja y conserva borrador y ampliado: solo enviar los reinicia (§3.2).

## Decisiones que necesito

1. **¿El historial del móvil sigue pegado al final cuando la caja crece?** Hoy encoge por abajo y tapa lo último dicho
   (en 360×640: 66 px con 4 líneas, 308 al ampliar). El plan solo dice que encoge y no lo he cambiado. Propongo: si estaba
   al final, que siga al final (unas 4 líneas en `web/app.js`); si habías subido a leer, no se toca (hoy ya es así).

## Para el despliegue (Josem, tras la revisión)

Merge `--ff-only`, reinicio de `klothulhu-api.service`, recargar el móvil y, en Konnos, `git pull` y reiniciar la app.
Al empezar la sesión, `origin/main` iba 23 commits por detrás de `main`: si Konnos tira de `main`, falta subirlo.

No probado: Windows real (click-through y escalado), el portapapeles y el teclado de un móvil real, iOS.
