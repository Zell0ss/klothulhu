# klothulhu — cliente de escritorio

Electron en JavaScript plano, sin build. Corre en Konnos (Windows). Contexto general: `../README.md`.

```powershell
cd desktop ; npm ci ; copy config.example.json config.json ; npm start
```

`config.json`: `apiUrl`, `token`, `scale`, `hotkey`, `look`, `debug` y `readSpeed`.

`readSpeed` (número entre 0.25 y 4, por defecto 1) mueve a la vez la velocidad de escritura y el scroll
del bocadillo, y con ellos el tiempo que se queda cada escena (D25): 0.5 va el doble de rápido, 2 el doble de lento. Un valor inválido
(p. ej. un string) se ignora y sale un aviso en la consola de `npm start`; lo mismo vale para `debug`, que
solo se enciende con `true` sin comillas.

## Historial (📜, D27)

El botón 📜 de la franja abre y cierra, a la derecha, un panel con la conversación de esta sesión; la ventana se
ensancha para hacerle sitio. Vive en memoria: «Forget conversation» del tray lo vacía, y al cerrar klothulhu se pierde.

## Tamaños (⤡, D31, D32)

El botón ⤡ de la franja alterna entre `normal` y `narrow` (escenario de 320; D32 quitó `half`, que no se leía); las
entradas `Size:` del tray hacen lo mismo. Solo cambia con klothulhu parado y el panel 📜 cerrado, y la esquina de abajo
a la derecha se queda donde está. El tamaño y la posición se guardan en `estado.json`
(`%APPDATA%\klothulhu-desktop\estado.json` en Windows); borrarlo devuelve klothulhu a `normal` y abajo a la derecha.
`config.json` no se escribe nunca.

## Escenas del servidor (fase 3, D21)

Cada evento `scene` entra en la cola en cuanto llega (`renderer/feed.js`, lógica pura con pruebas en
`test/fase3.test.js`). Se pinta la escena del director; si el evento trae `scene: null`, o el motor no la
acepta, se pinta la escena fija de `STAGING` con el caption del evento. Si `done` llega sin ningún `scene`
(servidor anterior a la fase 2), se trocea con `beats()` como en la fase 1; nunca se hacen las dos cosas.

## Depuración (`"debug": true`)

Escribe en `desktop/klothulhu-debug.log` (se vacía al pasar de 256 KB; no se versiona):

- `first-scene ms=… director=0|1 painted=server|fixed`: desde `Enter` hasta que se pinta la primera escena
  del servidor. `director=0` significa que el servidor mandó `scene: null`.
- `done ms=… scenes=n`: desde `Enter` hasta `done`.
- `warning …`: avisos del motor.

## Accesorios con estilos 3D

Con un `look` 3D el motor no pinta los accesorios (`props-not-drawn`) y lo avisa; el cliente lo registra y
sigue. Con `pixel` no pasa.
