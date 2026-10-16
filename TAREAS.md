# Reparto del Taller 1 — KEYWAVE 75

Somos 4. Cada uno se hace cargo de una sección y la deja terminada en su propia rama.
Los nombres son una propuesta: si quieren cambiar de sección, se cambia acá.

| Sección | Responsable | Estado |
|---------|-------------|--------|
| Hero + teclado interactivo | Nicowo | ✅ Terminada |
| Switches (+ video de fondo y barra de progreso) | Gabriel | 🟡 Base lista, falta pulir |
| Por dentro | Cata | ⬜ Por hacer |
| Especificaciones + Reserva | Seba | ⬜ Por hacer |

Todo va en `index.html`, `css/style.css` y `js/script.js` (el enunciado pide archivos separados).
Usen la paleta que ya está en `:root` del CSS (`--magenta`, `--cyan`, `--muted`, `--accent-h`, etc.)
y la tipografía Chakra Petch para que todo se vea como una sola página.

---

## ✅ Hero + teclado interactivo — Nicowo

Terminado. Cubre los requisitos 2, 3, 5, 6 y 7:

- Fondo: video synthwave con desenfoque, estrellas en canvas y sol detrás del video.
- Teclado 75% con **motor de luz por ondas** (la animación propia del equipo, 15% de la nota).
- Keycaps esculpidos, 4 modos de luz, perilla, inclinación 3D y "linterna" con el mouse.
- Pantalla con lo que escribes y palabras por minuto. Sonido sintetizado por switch.
- Responsive y táctil.

**Ojo:** `state.targetHue` y `state.switchType` (en `js/script.js`) cambian el color y el
sonido del teclado. Si tu sección quiere reaccionar al switch elegido, lee `--accent-h` en el CSS.

---

## 🟡 Switches — Gabriel

Ya está tu contenido (Neon Violet, Plasma Blue, Cyber Yellow) y elegir un switch cambia el color
y el sonido del teclado de arriba. También están tu video de fondo y tu barra de progreso.

Falta:
- [ ] Una animación propia de las tarjetas (por ejemplo, el switch se "presiona" al pasar el mouse, o las tarjetas entran escalonadas al aparecer en pantalla).
- [ ] Revisar que los textos y datos de cada switch sean los que quieres.
- [ ] Probarla en celular.

## ⬜ Por dentro — Cata

Sección `#por-dentro`. Hoy solo tiene el título.

Idea: mostrar cómo está hecho el teclado (keycaps, switches, placa, carcasa).
Cubre el **requisito 4: animación ligada al scroll**, que es lo que más pesa de esta sección.

- [ ] Contenido: las partes del teclado con un texto corto cada una.
- [ ] Animación por scroll: por ejemplo, que las capas del teclado se separen a medida que bajas (vista explosionada), o un parallax entre capas.
- [ ] Que funcione en celular.

Pista: el patrón del enunciado (`window.addEventListener("scroll", ...)` + `transform`) sirve tal cual.
`position: sticky` ayuda a dejar la sección fija mientras se anima.

## ⬜ Especificaciones + Reserva — Seba

Secciones `#specs` y `#reservar`. Hoy solo tienen el título.

Cubre el indicador de **librerías de animación** (RA1, 5%) y ayuda con el **requisito 5: entrada/transición**.

- [ ] Ficha técnica: formato, conexión, batería, luz, peso, etc.
- [ ] Reserva: precio, botón y un estado de "reservado" al hacer clic (animación de transición).
- [ ] Usar una librería de animación (GSAP, Anime.js o AOS) para la entrada de los datos o para el precio.
  GSAP desde CDN: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
- [ ] Footer: revisar el texto final.
- [ ] Que funcione en celular.

---

## Cómo trabajar

La base está en la rama `nicowo` (cuando se mergee a `main`, partan desde `main`):

```bash
git fetch
git switch nicowo
git pull
git switch -c tu-nombre
```

Haz commits en tu rama y sube con `git push -u origin tu-nombre`. Después se abre un Pull Request.
Para no pisarse, cada uno toca **solo su sección** en el HTML y agrega su CSS/JS al final del archivo,
bajo un comentario con el nombre de la sección.

Para probar en local: `python -m http.server 5500` y entrar a http://localhost:5500
