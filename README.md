# KEYWAVE 75 — Taller 1: Landing Page Animada

Landing de un teclado mecánico ficticio con estética **synthwave**, hecha con HTML, CSS y JavaScript.

![Hero](docs/capturas/hero.jpg)

## Cómo verla

Abre `index.html` en el navegador, o levanta un servidor local:

```bash
python -m http.server 5500
```

y entra a http://localhost:5500

## Equipo y aportes

| Integrante | Aporte |
|------------|--------|
| **Nico** | Hero completo: teclado interactivo 75% con el motor de luz por ondas, modos de luz y perilla, pantalla que muestra lo que escribes (con palabras por minuto), sonido de teclas con Web Audio, cielo de estrellas en canvas, sol retro, parallax, menú para celular e integración de las secciones. |
| **Gabriel** | Base inicial del proyecto, video de fondo, barra de progreso del scroll, sección de switches (contenido y selección), ficha técnica y reserva con animación de entrada escalonada. |
| **Cata** | Sección "Por dentro": vista explosionada del teclado por capas, panel de composición, corte interno del switch y animación ligada al scroll. Laboratorio de sonido en la sección de switches. |
| **Seba** | Librería de animación (GSAP) para los contadores de la ficha técnica y la reserva, modal de reserva confirmada y footer. |

## Requisitos del enunciado

| # | Requisito | Dónde se cumple |
|---|-----------|-----------------|
| 1 | Presentación del producto | Hero, Por dentro, Switches, Ficha técnica y Reserva |
| 2 | Animación de fondo | Hero: video synthwave con desenfoque, estrellas en `<canvas>` y sol detrás del video |
| 3 | Animación por eventos | Teclas con teclado, mouse y touch; modos de luz; elección de switch; capas de "Por dentro" |
| 4 | Animación por scroll | Barra de progreso, parallax del hero, vista explosionada de "Por dentro" |
| 5 | Entrada / transición | Entrada del hero, cambio de color al elegir switch, aparición escalonada de ficha técnica y reserva, contadores animados con **GSAP** |
| 6 | Animación propia (JS) | **Motor de luz por ondas** del teclado (`js/script.js`, sección 2) |
| 7 | Responsive | Todas las secciones se adaptan a celular; en el celular se puede escribir con el teclado del teléfono |

### Animación propia: motor de luz por ondas

Cada pulsación crea una onda circular que se expande desde la tecla. La luz de cada tecla depende de su distancia `d` al frente de la onda:

```
r(t) = v · (t − t0)
luz  = A · e^(−(d − r)² / w²) · (1 − edad/vida)
```

A eso se suma el modo de luz elegido (Ola, Pulso, Fijo) y una "linterna" que sigue al cursor. El color promedio de todas las teclas alimenta la tira de luz frontal y el reflejo bajo el teclado.

## Estilo

- Tipografía pixel: **Press Start 2P** (títulos), **Silkscreen** (botones y etiquetas) y **VT323** (texto).
- Paleta synthwave: noche violeta, magenta, cian y el ámbar del sol.
- Esquinas rectas y bordes de 2 px en todos los controles.
- Respeta `prefers-reduced-motion`: con movimiento reducido el fondo parte en pausa.

## Estructura

```
├── index.html
├── css/style.css
├── js/script.js
├── assets/
│   ├── favicon.svg
│   └── video/fondo-synthwave.mp4 (+ .jpg de portada)
├── docs/capturas/
└── TAREAS.md
```
