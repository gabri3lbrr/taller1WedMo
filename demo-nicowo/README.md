# KEYWAVE 75 — Demo Taller 1 (Landing Page Animada)

Landing de un teclado mecánico ficticio con estética **synthwave**.
HTML + CSS + JavaScript puro, sin librerías (solo Google Fonts: Monoton y Chakra Petch).

**Demo en vivo:** https://konicat.lol

## Cómo verla

Abre `index.html` en el navegador, o levanta un servidor local:

```bash
python -m http.server 5500
```

y entra a http://localhost:5500

## Qué se puede hacer

- **Escribir con el teclado físico**: cada tecla se ilumina en el teclado de la página, suena y lo que escribes aparece en la pantallita.
- **Tocar/clickear las teclas** (funciona con touch y multitáctil en el celular).
- **Perilla** (arriba a la derecha del teclado) o botones: cambian el modo de luz → Reactivo, Ola (arcoíris), Respiración, Estático.
- **Bajar con el scroll**: el sol se hunde, el teclado se inclina, y en "Por dentro" el teclado se separa en sus 4 capas.
- **Elegir switch** (Lineal / Táctil / Clicky): cambia el color de toda la luz y el sonido de las teclas.

## Requisitos del enunciado → dónde están

| # | Requisito | Implementación |
|---|-----------|----------------|
| 1 | Presentación del producto | Hero con el teclado + secciones Por dentro, Switches, Ficha técnica y Reserva |
| 2 | Animación de fondo | Cielo de estrellas en `<canvas>` (con estrellas fugaces), grilla synthwave en movimiento, sol con franjas y montañas, todo con desenfoque para resaltar el producto |
| 3 | Animación por eventos | Teclas que se iluminan con `keydown`/`keyup` y `pointerdown` (mouse/touch), perilla, switches, botón de reserva |
| 4 | Animación por scroll | El sol baja y el teclado se inclina (`--sun-y`, `--tilt`); vista explosionada de capas controlada por el avance del scroll |
| 5 | Entrada / transición | Secuencia de entrada del hero + onda de luz que barre el teclado al cargar; transición de color al cambiar de switch |
| 6 | Animación propia (JS) | **Motor de luz por ondas** en `js/script.js` (sección 2): cada pulsación genera una onda circular `r(t) = v·(t − t0)` y la luz de cada tecla es `A·e^(−(d − r)²/w²)·(1 − edad/vida)` según su distancia al frente de la onda |
| 7 | Responsive | `--u` (tamaño de tecla) se calcula con `clamp()` según el ancho de pantalla; layout de 1 columna en móvil |

Extra: sonido de teclas sintetizado con Web Audio API (sin archivos de audio), respeta `prefers-reduced-motion`.

## Estructura

```
demo-nicowo/
├── index.html
├── css/style.css
├── js/script.js
├── assets/favicon.svg
└── capturas/        ← imágenes para mostrar la idea
```
