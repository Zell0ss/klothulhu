Responde a: 221f998 (PLAN.md, fase 3)

# Fase 3 · H0 — revisión del plan

**Veredicto: aprobado con tres matices.** El plan cumple D21 y el encargo. Lo he contrastado con
`desktop/renderer/index.html` (cola, `pump`, `think`, eventos) y con el contrato de `server/app.py`.

## 1. Lista previa (convención §4), comprobada

- **¿Se borra algo?** Solo el log propio, truncado a 256 KB, y sus pruebas van en `os.tmpdir()`. Bien.
- **¿API?** Las pruebas no llaman a la API (servidor local con `KLOTHULHU_FAKE=1`). Las preguntas de Josem en Konnos
  van contra producción: es uso normal. Bien dicho.
- **¿Producción?** El servidor no cambia y el merge es de Josem. Bien.

## 2. Respuestas a «Decisiones que necesito»

1. **`debug` + IPC + fichero (§1.3): aprobado.** El renderer no elige ruta, el proceso principal solo escribe con
   `cfg.debug` y hay un tope de tamaño. `first-scene`, `done` y `director=` sirven justo para D20.
2. **Orden de llegada sin reordenar (§2): aprobado.** Ya lo garantizan TCP y D19.
   **Nada con los accesorios 3D (§3): aprobado como decisión, pero corrige el motivo en el plan.** El motor **sí**
   expone la figura: `renderScene(escena, { figure: 'auto' | 'pixel' | '3d' })` (`PARA-KLOTHULHU.md` §2, fables
   D12). La razón buena para no usarla es la otra que das: fijar `pixel` estropearía el look 3D que Josem elija.
   Queda fuera de alcance, tal como propones en §7.
3. **¿C1-C9 normativas? No.** En una fase `plan: programador` las pruebas son tuyas. Cuídalas igual: si las cambias,
   explica por qué en el informe.

## 3. Matices

- **M1 · L2 de la prueba en Konnos, mal planteada.** Las escenas llegan **después** del texto (el director
  necesita la respuesta entera), así que «antes de que el texto termine» no puede pasar. Lo que cambia con D21 es
  que la primera escena sale sin esperar a que el director acabe con todas. Reescribe L2 en términos que Josem
  pueda ver: en el log, `first-scene ms` **menor** que `done ms`, y a simple vista, que la segunda escena no
  tarda más que la primera en aparecer.
- **M2 · El criterio de D20 para Josem.** Añade a L5 el indicador de falsación tal cual: «si notas la espera hasta
  la primera escena como demasiado larga, dilo; con eso se reabre D20». Los números de L5 ayudan, pero lo que
  decide es su percepción.
- **M3 · Motivo del §3**, corregido según el punto 2.

## Para el programador

Responde a: 221f998 (PLAN.md, fase 3)

**Plan aprobado.** Aplica M1-M3 en el `PLAN.md` (una edición con commit, o anótalo al principio del informe) y
sigue con T1-T7. Para con el informe `docs/fase3/H1-informe.md`, con commit.
