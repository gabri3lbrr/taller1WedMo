# Revisión de diseño: Hero + teclado interactivo

Revisión hecha con la skill **Apple Design** (Human Interface Guidelines de Apple).
Como es una web, aplican los principios y los fundamentos (accesibilidad, color, tipografía,
layout, movimiento, escritura), no las convenciones nativas de iOS/macOS.
Plataforma objetivo: web móvil y escritorio.

## Resumen

**Antes: Critical issues → Después: Good.**
La idea central del hero es "un teclado que responde a ti": la luz por ondas es el elemento
por el que se recuerda la página. Los problemas estaban en el celular, donde ese mismo
elemento no se podía usar cómodamente, y en un texto ilegible sobre el sol.

## Critical (corregidos)

- **Teclas de 20×20 px en el celular.**
  `accessibility.md › Mobility`: "Offer sufficiently sized controls" (iOS: 44×44 pt por defecto, 28×28 pt mínimo).
  **Arreglo:** tocar la pantalla abre el teclado del teléfono (teclas de tamaño estándar) y cada
  carácter ilumina su tecla. Se mantiene el toque directo, pero ya no es la única forma de escribir
  (`accessibility.md › Mobility`: "Offer alternatives to gestures"; `design-principles.md › Flexibility`:
  "Consider a variety of input methods").

- **Texto sobre el sol: contraste 1,15:1** (#e3d6ff sobre #ffc46a; mínimo 4,5:1).
  `accessibility.md › Vision`: "Strive to meet color contrast minimum standards".
  **Arreglo:** el tamaño del sol se calcula para que su borde quede siempre 24 px bajo el párrafo.
  En el celular el teclado baja hasta el horizonte y el sol queda a la vista entre el texto y la pantalla.
  Contraste del párrafo sobre el cielo: 11,8:1.

## Improvements (corregidos)

- **High: el video se reproducía solo, sin forma de pararlo.**
  `accessibility.md › Cognitive`: "Avoid autoplaying audio and video content without also providing controls to start and stop it".
  **Arreglo:** botón de pausa (44×44) en la esquina del hero; pausa el video y las estrellas.
  Con "reducir movimiento" el fondo parte en pausa.

- **High: modos de luz como píldoras sueltas de 36 px de alto, en dos filas, con el botón de sonido dentro del grupo.**
  `segmented-controls.md › Best practices`: "keep segment size consistent", "Don't assign actions to segments in a control that otherwise represents selection state".
  `buttons.md › Best practices`: hit region "at least 44x44 pt".
  **Arreglo:** control segmentado real: 4 segmentos iguales de 44 px, en una fila, con un indicador
  que se desliza al elegido y flechas ← → para cambiar (un solo Tab entra al grupo).
  El sonido es un botón aparte de 52×52.
  Nombres más cortos y sustantivos: Reactivo, Ola, Pulso, Fijo (`segmented-controls.md › Content`).

- **Medium: sin respuesta a "reducir movimiento", alto contraste ni menos transparencia.**
  `accessibility.md › Cognitive`: "Tightening animation springs to reduce bounce effects".
  **Arreglo:** con reducir movimiento: sin onda de entrada, sin rebote en las teclas, sin inclinación 3D,
  fondo en pausa. Con alto contraste: textos y bordes más marcados. Con menos transparencia: fondos sólidos.

- **Medium: presión de botones.** `buttons.md › Best practices`: "Always include a press state for a custom button".
  **Arreglo:** los segmentos y los botones de icono se achican levemente al presionarlos.

## Craft notes

- **Low: la marca se repetía.** El logo de la barra y el título grande decían "KEYWAVE" a la vez.
  `branding.md › Best practices`: "Resist the temptation to display your logo throughout your app".
  **Arreglo:** el logo de la barra aparece solo cuando el título sale de la pantalla.

- **Se quitó un accesorio:** la línea de ayuda bajo los modos. La instrucción ahora vive dentro de
  la pantalla y cambia según el dispositivo ("Toca aquí para escribir" / "Escribe o toca una tecla…").

- **Decisión de marca (juicio propio):** la página es solo oscura. Apple pide soportar modo claro y oscuro
  en apps (`dark-mode.md`), pero en una landing synthwave el modo oscuro es parte de la identidad.

## What works (mantener)

- El motor de luz por ondas como único elemento protagonista; todo lo demás está en segundo plano.
- La luz como feedback inmediato y breve de cada tecla (`motion.md › Providing feedback`:
  "Aim for brevity and precision in feedback animations").
- Dos familias tipográficas: Monoton solo para la marca y Chakra Petch para todo lo demás
  (`typography.md`: "Minimize the number of typefaces you use").
- Un color de acento con un solo significado: el switch elegido (`color.md`:
  "Avoid using the same color to mean different things").

## Medidas (celular, 375 px)

| Elemento | Antes | Después |
|---|---|---|
| Segmento de modo | 95×36 | 72×44 |
| Botón de sonido | 44×36 | 52×52 |
| Pausa del fondo | — | 44×44 |
| Pantalla (área táctil) | 338×42 | 338×44 |
| Párrafo vs. sol | se solapan 39 px | 100+ px de separación |
| Controles | 2 filas | 1 fila |
