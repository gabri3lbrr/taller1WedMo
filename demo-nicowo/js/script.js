/* =========================================================
   KEYWAVE 75 — interacción y animaciones (JS sin librerías)
   ========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ---------------------------------------------------------
   1. Distribución del teclado 75% (ancho total: 16 unidades)
   [leyenda, event.code, ancho, carácter que escribe]
   --------------------------------------------------------- */
const LETTERS = (s) => [...s].map((c) => [c, "Key" + c, 1, c.toLowerCase()]);
const DIGITS = [..."1234567890"].map((d) => [d, "Digit" + d, 1, d]);

const LAYOUT = [
  [["Esc", "Escape", 1], ...Array.from({ length: 12 }, (_, i) => ["F" + (i + 1), "F" + (i + 1), 1]),
    ["Impr", "PrintScreen", 1], ["Supr", "Delete", 1], ["KNOB"]],
  [["º", "Backquote", 1, "º"], ...DIGITS, ["'", "Minus", 1, "'"], ["¡", "Equal", 1, "¡"],
    ["Borrar", "Backspace", 2], ["Inicio", "Home", 1]],
  [["Tab", "Tab", 1.5], ...LETTERS("QWERTYUIOP"), ["`", "BracketLeft", 1, "`"], ["+", "BracketRight", 1, "+"],
    ["Ç", "Backslash", 1.5, "ç"], ["RePág", "PageUp", 1]],
  [["Bloq Mayús", "CapsLock", 1.75], ...LETTERS("ASDFGHJKL"), ["Ñ", "Semicolon", 1, "ñ"], ["´", "Quote", 1, "´"],
    ["Intro", "Enter", 2.25], ["AvPág", "PageDown", 1]],
  [["Shift", "ShiftLeft", 2.25], ...LETTERS("ZXCVBNM"), [",", "Comma", 1, ","], [".", "Period", 1, "."], ["-", "Slash", 1, "-"],
    ["Shift", "ShiftRight", 1.75], ["↑", "ArrowUp", 1], ["Fin", "End", 1]],
  [["Ctrl", "ControlLeft", 1.25], ["Win", "MetaLeft", 1.25], ["Alt", "AltLeft", 1.25], ["", "Space", 6.25, " "],
    ["AltGr", "AltRight", 1], ["Fn", "Fn", 1], ["Ctrl", "ControlRight", 1], ["←", "ArrowLeft", 1], ["↓", "ArrowDown", 1], ["→", "ArrowRight", 1]],
];

// teclas físicas que no existen en el layout ANSI → se iluminan en su vecina
const CODE_ALIAS = { IntlBackslash: "ShiftLeft", NumpadEnter: "Enter", OSLeft: "MetaLeft", MetaRight: "AltRight", ContextMenu: "Fn" };

const board = document.getElementById("board");
const keys = [];            // { el, code, x, y, l, h, char }
const keyByCode = new Map();
let knobEl = null;

LAYOUT.forEach((row, y) => {
  const rowEl = document.createElement("div");
  rowEl.className = "board__row" + (y === 0 ? " board__row--f" : "");
  let x = 0;
  row.forEach(([legend, code, w = 1, char]) => {
    if (legend === "KNOB") {
      knobEl = document.createElement("button");
      knobEl.className = "knob";
      knobEl.setAttribute("aria-label", "Perilla: cambiar modo de luz");
      knobEl.innerHTML = '<span class="knob__body"></span>';
      rowEl.append(knobEl);
      x += 1;
      return;
    }
    const el = document.createElement("div");
    el.className = "key" + (w > 1.2 ? " key--wide" : "") + (legend.length > 2 ? " key--mod" : "");
    el.style.setProperty("--w", w);
    el.dataset.code = code;
    el.innerHTML = `<span class="cap"><span class="legend">${legend}</span></span>`;
    rowEl.append(el);
    const k = { el, code, x: x + w / 2, y: y + (y > 0 ? 0.2 : 0) + 0.5, l: 0, h: 330, char, down: false };
    keys.push(k);
    keyByCode.set(code, k);
    x += w;
  });
  board.append(rowEl);
});

/* ---------------------------------------------------------
   2. Motor de luz (animación propia del equipo)
   Cada pulsación crea una "onda" circular que se expande
   desde la tecla. La luz de cada tecla depende de su
   distancia al frente de la onda:
       r(t) = v · (t − t0)
       luz  = A · e^(−(d − r)² / w²) · (1 − edad/vida)
   --------------------------------------------------------- */
const state = {
  mode: "reactivo",
  hue: 330,          // tono actual (se interpola)
  targetHue: 330,    // tono del switch elegido
  sound: true,
  switchType: "lineal",
};
const ripples = [];

function addRipple(x, y, opts = {}) {
  ripples.push({ x, y, t0: performance.now() / 1000, speed: 13, width: 1.1, life: 0.9, amp: 1, ...opts });
  if (ripples.length > 24) ripples.shift();
}

function hueLerp(a, b, f) {
  const d = ((b - a + 540) % 360) - 180; // camino más corto en el círculo
  return (a + d * f + 360) % 360;
}

function lightFrame(nowMs) {
  const t = nowMs / 1000;
  state.hue = hueLerp(state.hue, state.targetHue, 0.08);

  for (let i = ripples.length - 1; i >= 0; i--) {
    if (t - ripples[i].t0 > ripples[i].life) ripples.splice(i, 1);
  }

  for (const k of keys) {
    let base = 0.07;
    let hue = state.hue;
    if (state.mode === "ola") {
      hue = (k.x * 22 - t * 110 + 3600) % 360;
      base = 0.55;
    } else if (state.mode === "respira") {
      base = 0.12 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2));
    } else if (state.mode === "estatico") {
      base = 0.5;
    }

    let wave = 0;
    for (const r of ripples) {
      const age = t - r.t0;
      const radius = r.speed * age;
      const d = Math.hypot(k.x - r.x, (k.y - r.y) * 1.05);
      wave += r.amp * Math.exp(-((d - radius) ** 2) / (r.width * r.width)) * (1 - age / r.life);
    }

    const l = k.down ? 1 : clamp(base + wave);
    if (Math.abs(l - k.l) > 0.01) {
      k.l = l;
      k.el.style.setProperty("--l", l.toFixed(3));
    }
    if (Math.abs(hue - k.h) > 0.5) {
      k.h = hue;
      k.el.style.setProperty("--h", hue.toFixed(1));
    }
  }
  requestAnimationFrame(lightFrame);
}
requestAnimationFrame(lightFrame);

// Entrada: una onda barre el teclado de izquierda a derecha al cargar
setTimeout(() => addRipple(-1.5, 3, { speed: 14, width: 1.6, life: 1.6, amp: 0.95 }), 650);

/* ---------------------------------------------------------
   3. Sonido sintetizado (Web Audio, sin archivos)
   --------------------------------------------------------- */
let audio = null;
let noiseBuffer = null;

function ensureAudio() {
  if (!audio) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio = new Ctx();
    noiseBuffer = audio.createBuffer(1, audio.sampleRate * 0.12, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (audio.state === "suspended") audio.resume();
  return audio;
}

const PROFILES = {
  lineal: [{ type: "lowpass", f: 900, q: 1, g: 0.55, dec: 0.05 }, { tone: 140, g: 0.35, dec: 0.07 }],
  tactil: [{ type: "bandpass", f: 1500, q: 1.2, g: 0.5, dec: 0.045 }, { tone: 220, g: 0.22, dec: 0.045 }],
  clicky: [{ type: "bandpass", f: 4200, q: 3, g: 0.7, dec: 0.02 }, { type: "bandpass", f: 3000, q: 3, g: 0.5, dec: 0.02, delay: 0.014 }, { tone: 300, g: 0.1, dec: 0.03 }],
};

function playClick(kind = state.switchType, pitch = 1) {
  if (!state.sound) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const vary = pitch * (0.92 + Math.random() * 0.16);
  for (const p of PROFILES[kind]) {
    const start = now + (p.delay || 0);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(p.g * 0.5, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + p.dec);
    gain.connect(ctx.destination);
    if (p.tone) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(p.tone * vary, start);
      osc.frequency.exponentialRampToValueAtTime(p.tone * vary * 0.6, start + p.dec);
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + p.dec + 0.02);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = p.type;
      filter.frequency.value = p.f * vary;
      filter.Q.value = p.q;
      src.connect(filter).connect(gain);
      src.start(start);
      src.stop(start + p.dec + 0.02);
    }
  }
}

/* ---------------------------------------------------------
   4. Pulsar / soltar teclas (teclado físico, mouse y touch)
   --------------------------------------------------------- */
const screenText = document.getElementById("screen-text");
let typed = "";

function renderTyped() {
  const max = window.innerWidth < 500 ? 22 : 34;
  screenText.textContent = typed.slice(-max);
}

function press(code, key) {
  const k = keyByCode.get(CODE_ALIAS[code] || code);
  if (!k) return;
  if (!k.down) playClick(state.switchType, code === "Space" ? 0.8 : 1);
  k.down = true;
  k.el.classList.add("is-down");
  addRipple(k.x, k.y);

  // pantalla
  const char = key && key.length === 1 ? key : k.char;
  if (code === "Backspace") typed = typed.slice(0, -1);
  else if (code === "Enter" || code === "Escape") typed = "";
  else if (char) typed += char;
  renderTyped();
}

function release(code) {
  const k = keyByCode.get(CODE_ALIAS[code] || code);
  if (!k) return;
  k.down = false;
  k.el.classList.remove("is-down");
}

// ¿el teclado está a la vista? solo ahí "capturamos" espacio/flechas
let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0.35 })
  .observe(document.getElementById("board-wrap"));

const BLOCK_DEFAULT = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Backspace", "PageUp", "PageDown", "Home", "End", "Slash", "Quote"]);

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (heroVisible && BLOCK_DEFAULT.has(e.code)) e.preventDefault();
  if (e.repeat) {
    const k = keyByCode.get(CODE_ALIAS[e.code] || e.code);
    if (k) addRipple(k.x, k.y, { amp: 0.4 });
    return;
  }
  press(e.code, e.key);
});
window.addEventListener("keyup", (e) => release(e.code));
window.addEventListener("blur", () => keys.forEach((k) => release(k.code)));

// Mouse / touch (multitáctil: cada dedo tiene su propia tecla)
const pointerKeys = new Map();
board.addEventListener("pointerdown", (e) => {
  const keyEl = e.target.closest(".key");
  if (!keyEl) return;
  e.preventDefault();
  pointerKeys.set(e.pointerId, keyEl.dataset.code);
  press(keyEl.dataset.code);
});
const endPointer = (e) => {
  const code = pointerKeys.get(e.pointerId);
  if (code) { release(code); pointerKeys.delete(e.pointerId); }
};
["pointerup", "pointercancel", "pointerleave"].forEach((t) => board.addEventListener(t, endPointer));
window.addEventListener("pointerup", endPointer);

/* ---------------------------------------------------------
   5. Modos de luz + perilla + sonido
   --------------------------------------------------------- */
const MODES = ["reactivo", "ola", "respira", "estatico"];
const modeButtons = document.querySelectorAll(".mode");
let knobAngle = 0;

function setMode(mode) {
  state.mode = mode;
  modeButtons.forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  // destello de confirmación desde la perilla
  addRipple(15.5, 0.5, { speed: 18, width: 1.8, life: 1.3, amp: 0.8 });
}
modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

knobEl.addEventListener("click", () => {
  knobAngle += 60;
  knobEl.style.setProperty("--knob", knobAngle + "deg");
  setMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]);
  playClick("clicky", 1.3);
});

const soundBtn = document.getElementById("sound");
soundBtn.addEventListener("click", () => {
  state.sound = !state.sound;
  soundBtn.setAttribute("aria-pressed", state.sound);
});

/* ---------------------------------------------------------
   6. Selector de switches (cambia color + sonido)
   --------------------------------------------------------- */
const switchButtons = document.querySelectorAll(".switch");
switchButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const hue = Number(btn.style.getPropertyValue("--sw"));
    state.switchType = btn.dataset.switch;
    state.targetHue = hue;
    document.documentElement.style.setProperty("--accent-h", hue);
    switchButtons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on);
    });
    btn.classList.add("is-pressing");
    playClick(state.switchType);
    setTimeout(() => btn.classList.remove("is-pressing"), 140);
  });
});

/* ---------------------------------------------------------
   7. Cielo de estrellas (canvas, animación de fondo)
   --------------------------------------------------------- */
const canvas = document.getElementById("stars");
const ctx2d = canvas.getContext("2d");
let stars = [];
let shooting = null;
let skyVisible = true;

function sizeSky() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.round((canvas.clientWidth * canvas.clientHeight) / 5200);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    r: Math.random() * 1.3 + 0.3,
    tw: Math.random() * Math.PI * 2,
    sp: 0.6 + Math.random() * 1.8,
  }));
}

function drawSky(nowMs) {
  const t = nowMs / 1000;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx2d.clearRect(0, 0, w, h);
  for (const s of stars) {
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw));
    // las estrellas se apagan cerca del horizonte
    ctx2d.globalAlpha = a * clamp(1.15 - s.y / h);
    ctx2d.fillStyle = s.r > 1.2 ? "#ffd6f5" : "#ffffff";
    ctx2d.beginPath();
    ctx2d.arc((s.x + t * 4 * s.r) % w, s.y, s.r, 0, Math.PI * 2);
    ctx2d.fill();
  }
  // estrella fugaz ocasional
  if (!shooting && Math.random() < 0.004) {
    shooting = { x: Math.random() * w * 0.6 + w * 0.2, y: Math.random() * h * 0.35, t0: t };
  }
  if (shooting) {
    const age = t - shooting.t0;
    const x = shooting.x + age * 520, y = shooting.y + age * 190;
    const grad = ctx2d.createLinearGradient(x, y, x - 90, y - 33);
    grad.addColorStop(0, "rgba(255,255,255,.9)");
    grad.addColorStop(1, "rgba(255,45,149,0)");
    ctx2d.globalAlpha = clamp(1 - age / 0.9);
    ctx2d.strokeStyle = grad;
    ctx2d.lineWidth = 2;
    ctx2d.beginPath(); ctx2d.moveTo(x, y); ctx2d.lineTo(x - 90, y - 33); ctx2d.stroke();
    if (age > 0.9) shooting = null;
  }
  ctx2d.globalAlpha = 1;
  if (!reduceMotion && skyVisible) requestAnimationFrame(drawSky);
}

sizeSky();
requestAnimationFrame(drawSky);
window.addEventListener("resize", () => { sizeSky(); renderTyped(); if (reduceMotion) requestAnimationFrame(drawSky); });
new IntersectionObserver(([e]) => {
  const was = skyVisible;
  skyVisible = e.isIntersecting;
  if (skyVisible && !was && !reduceMotion) requestAnimationFrame(drawSky);
}).observe(canvas);

/* ---------------------------------------------------------
   8. Animaciones ligadas al scroll
   --------------------------------------------------------- */
const nav = document.querySelector(".nav");
const hero = document.querySelector(".hero");
const sun = document.getElementById("sun");
const sunGlow = document.querySelector(".scene__sun-glow");
const inside = document.getElementById("por-dentro");
const explode = document.getElementById("explode");
const layerItems = document.querySelectorAll("#layers-list li");

// rejillas de las capas (keycaps y switches)
for (const id of ["caps-grid", "switch-grid"]) {
  const grid = document.getElementById(id);
  grid.innerHTML = "<span></span>".repeat(96);
}

const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("is-scrolled", y > 40);

  // Hero: el sol se hunde y el teclado se inclina hacia atrás
  const hp = clamp(y / hero.offsetHeight);
  sun.style.setProperty("--sun-y", hp * 140 + "px");
  sunGlow.style.setProperty("--sun-y", hp * 140 + "px");
  board.style.setProperty("--tilt", hp * 32 + "deg");

  // Por dentro: las capas se separan según el avance del scroll
  const rect = inside.getBoundingClientRect();
  const progress = clamp(-rect.top / (rect.height - window.innerHeight));
  explode.style.setProperty("--p", easeInOut(clamp((progress - 0.05) / 0.7)).toFixed(4));
  layerItems.forEach((li, i) => li.classList.toggle("is-on", progress > 0.08 + i * 0.17));

  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

/* ---------------------------------------------------------
   9. Reserva (demo)
   --------------------------------------------------------- */
const reserveBtn = document.getElementById("reserve");
const reserveNote = document.getElementById("reserve-note");
reserveBtn.addEventListener("click", () => {
  reserveBtn.textContent = "Reservado";
  reserveBtn.disabled = true;
  reserveNote.textContent = "Listo, quedaste en la lista. Te escribiremos cuando salga la primera tanda.";
  reserveNote.classList.add("is-ok");
  playClick("clicky", 1.2);
});
