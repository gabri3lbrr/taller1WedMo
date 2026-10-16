# KEYWAVE 75 — Taller 1: Landing Page Animada

Landing de un teclado mecánico ficticio con estética **synthwave**, hecha con HTML, CSS y JavaScript.

![Hero](docs/capturas/hero.jpg)

## Cómo verla

Abre `index.html` directamente en el navegador, o levanta un servidor local:

```bash
python -m http.server 5500
```

y entra a http://localhost:5500

## Estado y reparto

El trabajo está dividido por secciones entre los 4 integrantes. El detalle y las tareas pendientes están en **[TAREAS.md](TAREAS.md)**.

| Sección | Responsable | Estado |
|---------|-------------|--------|
| Hero + teclado interactivo | Nicowo | ✅ Terminada |
| Switches (+ video y barra de progreso) | Gabriel | 🟡 Falta pulir |
| Por dentro | Cata | ⬜ Por hacer |
| Especificaciones + Reserva | Seba | ⬜ Por hacer |

## Requisitos del enunciado

| # | Requisito | Dónde | Estado |
|---|-----------|-------|--------|
| 1 | Presentación del producto | Hero + Switches (+ Por dentro y Specs) | ✅ |
| 2 | Animación de fondo | Hero: video synthwave con desenfoque, estrellas en `<canvas>`, sol detrás del video (`mix-blend-mode: screen`) | ✅ |
| 3 | Animación por eventos | Hero: teclas con `keydown`/`pointerdown`, perilla, modos, inclinación y linterna con el mouse. Switches: elección de switch | ✅ |
| 4 | Animación por scroll | Barra de progreso y parallax del hero ✅ · Por dentro (Cata) ⬜ | 🟡 |
| 5 | Entrada / transición | Hero: secuencia de entrada y onda de luz inicial; cambio de color al elegir switch ✅ · Specs/Reserva (Seba) ⬜ | 🟡 |
| 6 | Animación propia (JS) | **Motor de luz por ondas** (`js/script.js`, sección 2) | ✅ |
| 7 | Responsive | Hero y Switches ✅ · resto de secciones ⬜ | 🟡 |

### La animación propia: motor de luz por ondas

Cada pulsación crea una onda circular que se expande desde la tecla. La luz de cada tecla depende de su distancia `d` al frente de la onda:

```
r(t) = v · (t − t0)
luz  = A · e^(−(d − r)² / w²) · (1 − edad/vida)
```

Sobre eso se suman el modo de luz elegido (Ola, Respiración, Estático) y la "linterna" del cursor. El color promedio de todas las teclas alimenta la tira de luz frontal, el reflejo bajo el teclado y la perilla.

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

Respeta `prefers-reduced-motion`.
