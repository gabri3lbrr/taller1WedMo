const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const LETTERS = (s) => [...s].map((c) => [c, "Key" + c, 1, c.toLowerCase()]);
const DIGITS = [..."1234567890"].map((d) => [d, "Digit" + d, 1, d]);

const LAYOUT = [
  [["Esc", "Escape", 1], ...Array.from({ length: 12 }, (_, i) => ["F" + (i + 1), "F" + (i + 1), 1]),
    ["Impr", "PrintScreen", 1], ["Supr", "Delete", 1], ["KNOB"]],
  [["º", "Backquote", 1, "º"], ...DIGITS, ["'", "Minus", 1, "'"], ["¡", "Equal", 1, "¡"],
    ["Borrar", "Backspace", 2], ["Inic", "Home", 1]],
  [["Tab", "Tab", 1.5], ...LETTERS("QWERTYUIOP"), ["`", "BracketLeft", 1, "`"], ["+", "BracketRight", 1, "+"],
    ["Ç", "Backslash", 1.5, "ç"], ["RePg", "PageUp", 1]],
  [["Mayús", "CapsLock", 1.75], ...LETTERS("ASDFGHJKL"), ["Ñ", "Semicolon", 1, "ñ"], ["´", "Quote", 1, "´"],
    ["Intro", "Enter", 2.25], ["AvPg", "PageDown", 1]],
  [["Shift", "ShiftLeft", 2.25], ...LETTERS("ZXCVBNM"), [",", "Comma", 1, ","], [".", "Period", 1, "."], ["-", "Slash", 1, "-"],
    ["Shift", "ShiftRight", 1.75], ["↑", "ArrowUp", 1], ["Fin", "End", 1]],
  [["Ctrl", "ControlLeft", 1.25], ["Win", "MetaLeft", 1.25], ["Alt", "AltLeft", 1.25], ["", "Space", 6.25, " "],
    ["AltGr", "AltRight", 1], ["Fn", "Fn", 1], ["Ctrl", "ControlRight", 1], ["←", "ArrowLeft", 1], ["↓", "ArrowDown", 1], ["→", "ArrowRight", 1]],
];

const TECLAS_ROSA = new Set(["Escape", "Enter", "Space"]);
const TECLAS_CIAN = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Delete"]);

const CODE_ALIAS = { IntlBackslash: "ShiftLeft", NumpadEnter: "Enter", OSLeft: "MetaLeft", MetaRight: "AltRight", ContextMenu: "Fn" };

const board = document.getElementById("teclado-interactivo");
const keys = [];
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
    el.className = "key"
      + (legend.length === 1 ? " key--alpha" : " key--mod")
      + (TECLAS_ROSA.has(code) ? " key--rosa" : "")
      + (TECLAS_CIAN.has(code) ? " key--cian" : "");
    el.style.setProperty("--w", w);
    el.dataset.code = code;
    el.innerHTML = `<span class="cap"><span class="legend"><span class="legend__txt">${legend}</span></span></span>`;
    rowEl.append(el);
    const k = { el, code, x: x + w / 2, y: y + (y > 0 ? 0.2 : 0) + 0.5, l: 0, h: 330, char, down: false };
    keys.push(k);
    keyByCode.set(code, k);
    x += w;
  });
  board.append(rowEl);
});

function ajustarLeyendas() {
  for (const k of keys) {
    const caja = k.el.querySelector(".legend");
    const texto = caja.firstChild;
    k.el.style.removeProperty("--ajuste");
    const disponible = caja.clientWidth * 0.86;
    if (texto.offsetWidth > disponible) {
      k.el.style.setProperty("--ajuste", (disponible / texto.offsetWidth).toFixed(3));
    }
  }
}
document.fonts.ready.then(ajustarLeyendas);

const state = {
  mode: "reactivo",
  hue: 330,
  targetHue: 330,
  sound: true,
  switchType: "tactile",
};
const ripples = [];
const keyboardLightingListeners = new Set();

const linterna = { x: 0, y: 0, fuerza: 0, objetivo: 0 };
const inclinacion = { rx: 0, ry: 0, objetivoX: 0, objetivoY: 0 };
const boardWrap = document.getElementById("board-wrap");

function addRipple(x, y, opts = {}) {
  ripples.push({ x, y, t0: performance.now() / 1000, speed: 13, width: 1.1, life: 0.9, amp: 1, ...opts });
  if (ripples.length > 24) ripples.shift();
}

function hueLerp(a, b, f) {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * f + 360) % 360;
}

function lightFrame(nowMs) {
  const t = nowMs / 1000;
  state.hue = hueLerp(state.hue, state.targetHue, 0.08);
  linterna.fuerza += (linterna.objetivo - linterna.fuerza) * 0.12;
  let sumaLuz = 0, sumaX = 0, sumaY = 0;

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

    if (linterna.fuerza > 0.01) {
      const d2 = (k.x - linterna.x) ** 2 + (k.y - linterna.y) ** 2;
      wave += 0.42 * linterna.fuerza * Math.exp(-d2 / 2.6);
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
    const rad = (hue * Math.PI) / 180;
    sumaLuz += l; sumaX += Math.cos(rad) * l; sumaY += Math.sin(rad) * l;
  }

  const promedio = sumaLuz / keys.length;
  const tonoPromedio = sumaLuz > 0.01 ? ((Math.atan2(sumaY, sumaX) * 180) / Math.PI + 360) % 360 : state.hue;
  boardWrap.style.setProperty("--glow-l", promedio.toFixed(3));
  boardWrap.style.setProperty("--glow-h", tonoPromedio.toFixed(1));
  keyboardLightingListeners.forEach((listener) => listener(t, tonoPromedio, promedio));

  inclinacion.rx += (inclinacion.objetivoX - inclinacion.rx) * 0.08;
  inclinacion.ry += (inclinacion.objetivoY - inclinacion.ry) * 0.08;
  board.style.setProperty("--rx", inclinacion.rx.toFixed(2) + "deg");
  board.style.setProperty("--ry", inclinacion.ry.toFixed(2) + "deg");

  actualizarPpm(t);
  requestAnimationFrame(lightFrame);
}
requestAnimationFrame(lightFrame);

if (!reduceMotion) setTimeout(() => addRipple(-1.5, 3, { speed: 14, width: 1.6, life: 1.6, amp: 0.95 }), 650);

const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (conMouse && !reduceMotion) {
  const heroEl = document.getElementById("inicio");
  heroEl.addEventListener("pointermove", (e) => {
    const bajoCursor = document.elementFromPoint(e.clientX, e.clientY);
    const teclaEl = bajoCursor && bajoCursor.closest(".key");
    if (teclaEl) {
      const k = keyByCode.get(teclaEl.dataset.code);
      linterna.x = k.x; linterna.y = k.y;
    }
    linterna.objetivo = teclaEl ? 1 : 0;
    const rect = board.getBoundingClientRect();

    const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2), -1, 1);
    const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2), -1, 1);
    inclinacion.objetivoY = nx * 7;
    inclinacion.objetivoX = -ny * 5;
  });
  heroEl.addEventListener("pointerleave", () => {
    linterna.objetivo = 0;
    inclinacion.objetivoX = 0; inclinacion.objetivoY = 0;
  });
}

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
  tactile: [{ type: "bandpass", f: 4200, q: 3, g: 0.7, dec: 0.02 }, { type: "bandpass", f: 3000, q: 3, g: 0.5, dec: 0.02, delay: 0.014 }, { tone: 300, g: 0.1, dec: 0.03 }],
  linear: [{ type: "bandpass", f: 1500, q: 1.2, g: 0.5, dec: 0.045 }, { tone: 220, g: 0.22, dec: 0.045 }],
  silent: [{ type: "lowpass", f: 700, q: 1, g: 0.5, dec: 0.06 }, { tone: 120, g: 0.4, dec: 0.08 }],
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

const screenText = document.getElementById("screen-text");
const screenPpm = document.getElementById("screen-ppm");
let typed = "";

const pulsaciones = [];
let ultimoPpm = -1, proximoPpm = 0;
function actualizarPpm(t) {
  if (t < proximoPpm) return;
  proximoPpm = t + 0.25;
  while (pulsaciones.length && t - pulsaciones[0] > 10) pulsaciones.shift();
  const ppm = Math.round((pulsaciones.length / 5) * 6);
  if (ppm !== ultimoPpm) {
    ultimoPpm = ppm;
    screenPpm.firstChild.textContent = ppm;
    screenPpm.classList.toggle("is-on", ppm > 0);
  }
}

function renderTyped() {
  const max = window.innerWidth < 500 ? 22 : 34;
  screenText.textContent = typed.slice(-max);
}

function press(code, key) {
  const k = keyByCode.get(CODE_ALIAS[code] || code);
  const esCaracter = key && [...key].length === 1;
  if (k) {
    if (!k.down) playClick(state.switchType, code === "Space" ? 0.8 : 1);
    k.down = true;
    k.el.classList.add("is-down");
    addRipple(k.x, k.y);
  } else if (esCaracter) {
    playClick(state.switchType);
    addRipple(8, 3.2);
  } else {
    return;
  }

  const char = esCaracter ? key : k.char;
  if (code === "Backspace") typed = typed.slice(0, -1);
  else if (code === "Enter" || code === "Escape") typed = "";
  else if (char) { typed += char; pulsaciones.push(performance.now() / 1000); }
  renderTyped();
}

function release(code) {
  const k = keyByCode.get(CODE_ALIAS[code] || code);
  if (!k) return;
  k.down = false;
  k.el.classList.remove("is-down");
}

let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0.35 })
  .observe(document.getElementById("board-wrap"));

const BLOCK_DEFAULT = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Backspace", "PageUp", "PageDown", "Home", "End", "Slash", "Quote"]);

const entrada = document.getElementById("entrada");
let ultimaTeclaFisica = 0;

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if ((tag === "INPUT" || tag === "TEXTAREA") && document.activeElement !== entrada) return;
  if (document.activeElement.closest("button, a, select, [contenteditable='true']")) return;
  if (e.key === "Unidentified" || e.keyCode === 229) return;
  if (document.activeElement.closest && document.activeElement.closest("#modos") && e.code.startsWith("Arrow")) return;
  ultimaTeclaFisica = performance.now();
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

const codigoPorCaracter = new Map();
for (const k of keys) if (k.char) codigoPorCaracter.set(k.char, k.code);
function codigoDe(c) {
  const base = c.toLowerCase().normalize("NFD")[0];
  return codigoPorCaracter.get(c.toLowerCase()) || codigoPorCaracter.get(base);
}
function tocar(code, char) {
  press(code, char);
  setTimeout(() => release(code), 110);
}
entrada.addEventListener("input", (e) => {
  const texto = e.data ?? entrada.value;
  entrada.value = "";
  if (performance.now() - ultimaTeclaFisica < 80) return;
  if (e.inputType && e.inputType.startsWith("delete")) { tocar("Backspace"); return; }
  for (const c of texto || "") tocar(codigoDe(c), c);
});
entrada.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrada.blur();
});

const pantallaTactil = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
screenText.dataset.placeholder = pantallaTactil ? "Toca aquí para escribir" : "Escribe o toca una tecla…";

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

const MODES = ["reactivo", "ola", "respira", "estatico"];
const modeButtons = document.querySelectorAll(".mode");
const segmentado = document.getElementById("modos");
let knobAngle = 0;

function setMode(mode) {
  state.mode = mode;
  segmentado.style.setProperty("--i", MODES.indexOf(mode));
  modeButtons.forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
    b.tabIndex = on ? 0 : -1;
  });
  addRipple(15.5, 0.5, { speed: 18, width: 1.8, life: 1.3, amp: 0.8 });
}
modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
segmentado.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  e.preventDefault();
  const paso = e.key === "ArrowRight" ? 1 : -1;
  const siguiente = MODES[(MODES.indexOf(state.mode) + paso + MODES.length) % MODES.length];
  setMode(siguiente);
  segmentado.querySelector(`[data-mode="${siguiente}"]`).focus();
});

knobEl.addEventListener("click", () => {
  knobAngle += 60;
  knobEl.style.setProperty("--knob", knobAngle + "deg");
  setMode(MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]);
  playClick("tactile", 1.3);
});

const soundBtn = document.getElementById("sound");
soundBtn.addEventListener("click", () => {
  state.sound = !state.sound;
  soundBtn.setAttribute("aria-pressed", state.sound);
});

const tarjetasSwitch = document.querySelectorAll(".switch-card, .inside-switch-option");
const estadoSwitch = document.getElementById("switch-estado");
const nombresSwitch = { tactile: "Neon Violet", linear: "Plasma Blue", silent: "Cyber Yellow" };

function seleccionarSwitch(tipo) {
  if (!Object.prototype.hasOwnProperty.call(nombresSwitch, tipo)) return;
  const hue = { tactile: 330, linear: 184, silent: 43 }[tipo];
  state.switchType = tipo;
  state.targetHue = hue;
  document.documentElement.style.setProperty("--accent-h", hue);
  tarjetasSwitch.forEach((item) => {
    const on = item.dataset.switch === tipo;
    item.classList.toggle("activo", on);
    item.classList.toggle("is-active", on);
    item.setAttribute(item.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", String(on));
    item.tabIndex = on ? 0 : -1;
  });
  estadoSwitch.textContent = "Seleccionado: " + nombresSwitch[tipo];
  document.dispatchEvent(new CustomEvent("switchchange", { detail: { tipo } }));
  playClick(tipo);
}

tarjetasSwitch.forEach((tarjeta) => {
  tarjeta.tabIndex = tarjeta.dataset.switch === state.switchType ? 0 : -1;
  tarjeta.addEventListener("click", () => seleccionarSwitch(tarjeta.dataset.switch));
  tarjeta.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const siblings = [...tarjeta.parentElement.querySelectorAll(".switch-card, .inside-switch-option")];
    const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const index = event.key === "Home" ? 0 : event.key === "End" ? siblings.length - 1 : (siblings.indexOf(tarjeta) + step + siblings.length) % siblings.length;
    seleccionarSwitch(siblings[index].dataset.switch);
    siblings[index].focus();
  });
});

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
    ctx2d.globalAlpha = a * clamp(1.15 - s.y / h);
    ctx2d.fillStyle = s.r > 1.2 ? "#ffd6f5" : "#ffffff";
    ctx2d.beginPath();
    ctx2d.arc((s.x + t * 4 * s.r) % w, s.y, s.r, 0, Math.PI * 2);
    ctx2d.fill();
  }
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
  if (!reduceMotion && skyVisible && !fondoPausado) requestAnimationFrame(drawSky);
}

const pausaFondo = document.getElementById("pausa-fondo");
let fondoPausado = false;
function pausarFondo(pausar) {
  fondoPausado = pausar;
  pausaFondo.setAttribute("aria-pressed", pausar);
  pausaFondo.setAttribute("aria-label", pausar ? "Reanudar el fondo animado" : "Pausar el fondo animado");
  const video = document.getElementById("video-fondo");
  if (pausar) video.pause(); else video.play().catch(() => {});
  if (!pausar) requestAnimationFrame(drawSky);
}
pausaFondo.addEventListener("click", () => pausarFondo(!fondoPausado));

sizeSky();
requestAnimationFrame(drawSky);
window.addEventListener("resize", () => { sizeSky(); renderTyped(); if (reduceMotion) requestAnimationFrame(drawSky); });
new IntersectionObserver(([e]) => {
  const was = skyVisible;
  skyVisible = e.isIntersecting;
  if (skyVisible && !was && !reduceMotion && !fondoPausado) requestAnimationFrame(drawSky);
}).observe(canvas);

const nav = document.getElementById("nav");
const hero = document.querySelector(".hero");
const scene = document.getElementById("scene");
const video = document.getElementById("video-fondo");
const barraProgreso = document.getElementById("scroll-progress-bar");
const sun = document.getElementById("sun");
const sunGlow = document.querySelector(".scene__sun-glow");
const tituloHero = document.querySelector(".hero__title");

const HORIZONTE_VIDEO = 0.548;
function calcularHorizonte() {
  const w = scene.clientWidth, h = scene.clientHeight;
  const vw = video.videoWidth || 960, vh = video.videoHeight || 540;
  const escala = Math.max(w / vw, h / vh);
  const altoVideo = vh * escala;
  const horizonte = (h - altoVideo) / 2 + altoVideo * HORIZONTE_VIDEO;
  scene.style.setProperty("--horizon", horizonte + "px");

  const lead = document.querySelector(".hero__lead");
  const leadAbajo = lead.offsetTop + lead.offsetHeight;
  const movil = window.innerWidth <= 860;
  const maximo = Math.min(window.innerWidth * (movil ? 0.58 : 0.6), movil ? 340 : 480);
  const centroSol = sun.offsetLeft;
  const encima = lead.offsetLeft < centroSol + maximo / 2 && lead.offsetLeft + lead.offsetWidth > centroSol - maximo / 2;
  const espacio = encima ? 2 * (horizonte - leadAbajo - 24) : maximo;
  scene.style.setProperty("--sun-size", Math.max(160, Math.min(maximo, espacio)) + "px");
}
document.fonts.ready.then(calcularHorizonte);
calcularHorizonte();
video.addEventListener("loadedmetadata", calcularHorizonte);
window.addEventListener("resize", calcularHorizonte);
if (reduceMotion) pausarFondo(true);

let ticking = false;

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("is-scrolled", y > 40);
  nav.classList.toggle("con-logo", tituloHero.getBoundingClientRect().bottom < 60);

  const alturaTotal = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  barraProgreso.style.width = (alturaTotal > 0 ? (y / alturaTotal) * 100 : 0) + "%";

  const hp = clamp(y / hero.offsetHeight);
  scene.style.setProperty("--parallax", Math.min(y, hero.offsetHeight) * 0.4 + "px");
  sun.style.setProperty("--sun-y", hp * 140 + "px");
  sunGlow.style.setProperty("--sun-y", hp * 140 + "px");
  board.style.setProperty("--tilt", hp * 32 + "deg");

  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

const navToggle = document.getElementById("nav-toggle");
const menu = document.getElementById("menu-principal");
function cerrarMenu() {
  menu.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir menú");
}
navToggle.addEventListener("click", () => {
  const abierto = menu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", abierto);
  navToggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", cerrarMenu));


/* ---------------------------------------------------------
   Mensaje de reserva (reemplaza al alert)
   --------------------------------------------------------- */
const modalReserva = document.getElementById("modal-reserva");
const modalDetalle = document.getElementById("modal-detalle");
const modalCerrar = document.getElementById("modal-cerrar");
let focoPrevio = null;

function abrirModal(detalle) {
  focoPrevio = document.activeElement;
  modalDetalle.textContent = detalle || "";
  modalReserva.hidden = false;
  // doble frame para que la transición CSS parta del estado inicial
  requestAnimationFrame(() => requestAnimationFrame(() => modalReserva.classList.add("is-open")));
  modalCerrar.focus();
  // destello de luz en el teclado del hero, si existe
  if (typeof addRipple === "function") addRipple(8, 3, { speed: 16, width: 2, life: 1.4, amp: 0.9 });
}

function cerrarModal() {
  modalReserva.classList.remove("is-open");
  setTimeout(() => {
    modalReserva.hidden = true;
    if (focoPrevio) focoPrevio.focus();
  }, reduceMotion ? 0 : 350);
}

modalCerrar.addEventListener("click", cerrarModal);
modalReserva.addEventListener("click", (e) => { if (e.target === modalReserva) cerrarModal(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalReserva.hidden) cerrarModal();
});

function confirmarReserva(event) {
  event.preventDefault();
  const selects = event.target.querySelectorAll("select");
  const layout = selects[0].options[selects[0].selectedIndex].text;
  const sw = selects[1].options[selects[1].selectedIndex].text;
  abrirModal(`${layout} · ${sw}`);
  event.target.reset();
}


document.addEventListener("DOMContentLoaded", () => {
  const elementsToReveal = document.querySelectorAll(".text-cyber-reveal");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          const container = target.closest(".reservar-card") || target.closest(".specs-container");
          let delay = 0;

          if (container) {
            const siblings = Array.from(container.querySelectorAll(".text-cyber-reveal"));
            const index = siblings.indexOf(target);
            delay = index >= 0 ? index * 120 : 0;
          }

          setTimeout(() => {
            target.classList.add("is-visible");
          }, delay);

          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementsToReveal.forEach((el) => revealObserver.observe(el));
});

(() => {
    const section = document.getElementById("por-dentro");
    const diagram = document.getElementById("inside-keyboard");
    if (!section || !diagram) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const layerButtons = section.querySelectorAll(".inside-layer-button");
    const assemblyButton = document.getElementById("inside-assembly");
    const focusButton = document.getElementById("inside-focus");
    const switchPanel = section.querySelector(".inside-switch-panel");
    let selectedLayer = "switches";
    let assembled = false;
    let focused = false;
    let zoomFrame = 0;
    let scrollFrame = 0;
    let separation = 76;
    let pressTimer;

    const layers = [
        { id: "keycaps", label: "KEYCAPS", title: "Keycaps", description: "PBT de doble inyección con leyendas resistentes al desgaste.", fill: "url(#inside-case)", side: "#09090c", thickness: 8 },
        { id: "switches", label: "SWITCHES", title: "Switches", description: "Montaje hot-swap: switches intercambiables sin soldar.", fill: "#15151c", side: "#0b0b10", thickness: 6 },
        { id: "plate", label: "PLACA", title: "Placa", description: "Placa de aluminio que sujeta y mantiene alineados los switches.", fill: "url(#inside-metal)", side: "#4a375a", thickness: 5 },
        { id: "pcb", label: "PCB", title: "Circuito PCB", description: "Circuito que registra las pulsaciones, con sockets hot-swap y LED RGB.", fill: "#142c30", side: "#0b1c23", thickness: 5 },
        { id: "foam", label: "ESPUMA", title: "Espuma acústica", description: "Espuma PORON que absorbe vibraciones y reduce la resonancia.", fill: "url(#inside-foam)", side: "#241c2d", thickness: 9 },
        { id: "case", label: "CARCASA", title: "Carcasa", description: "Carcasa de aluminio negro que sostiene y protege los componentes.", fill: "url(#inside-case)", side: "#09090c", thickness: 20 }
    ];

    const switchProfiles = {
        tactile: { name: "Neon Violet", type: "Táctil · Click definido", force: "55 g", sound: "Sharp Click", color: "#ff57b4" },
        linear: { name: "Plasma Blue", type: "Lineal · Pulsación fluida", force: "45 g", sound: "Clack Suave", color: "#38f4ff" },
        silent: { name: "Cyber Yellow", type: "Lineal · Amortiguado", force: "50 g", sound: "Deep Thock", color: "#ffd36e" }
    };

    function svgElement(tag, attributes = {}, parent = diagram) {
        const element = document.createElementNS(svgNS, tag);
        Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
        parent.appendChild(element);
        return element;
    }

    const defs = svgElement("defs");
    const gradients = [
        ["inside-metal", "#817b8a", "#45414c"],
        ["inside-case", "#232329", "#0b0b0d"],
        ["inside-keycap", "#34343b", "#1c1c21"],
        ["inside-keycap-mod", "#2d2d33", "#18181c"],
        ["inside-keycap-rose", "#402332", "#2c1624"],
        ["inside-keycap-cyan", "#233942", "#13242b"]
    ];
    gradients.forEach(([id, start, end]) => {
        const gradient = svgElement("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
        svgElement("stop", { offset: "0%", "stop-color": start }, gradient);
        svgElement("stop", { offset: "100%", "stop-color": end }, gradient);
    });
    const knobGradient = svgElement("radialGradient", { id: "inside-knob-metal", cx: ".34", cy: ".28", r: ".75" }, defs);
    [["0%", "#ffffff"], ["40%", "#e3dcf5"], ["76%", "#b6a8d3"], ["100%", "#786b98"]].forEach(([offset, color]) => {
        svgElement("stop", { offset, "stop-color": color }, knobGradient);
    });
    const foamPattern = svgElement("pattern", { id: "inside-foam", width: 7, height: 7, patternUnits: "userSpaceOnUse" }, defs);
    svgElement("rect", { width: 7, height: 7, fill: "#3b3045" }, foamPattern);
    svgElement("circle", { cx: 2, cy: 2, r: .8, fill: "#796087", opacity: .5 }, foamPattern);
    svgElement("circle", { cx: 5, cy: 5, r: .7, fill: "#130d1e", opacity: .6 }, foamPattern);
    const glow = svgElement("filter", { id: "inside-glow", x: "-20%", y: "-30%", width: "140%", height: "160%" }, defs);
    svgElement("feGaussianBlur", { stdDeviation: 2, result: "blur" }, glow);
    const merge = svgElement("feMerge", {}, glow);
    svgElement("feMergeNode", { in: "blur" }, merge);
    svgElement("feMergeNode", { in: "SourceGraphic" }, merge);

    const width = 480;
    const padding = 12;
    const totalUnits = Math.max(...LAYOUT.map((row) => row.reduce((sum, [, , units = 1]) => sum + units, 0)));
    const unit = (width - padding * 2) / totalUnits;
    const gap = unit * .09;
    const depth = padding * 2 + (LAYOUT.length + .2) * unit;
    const origin = { x: 126, y: 36 };
    const project = (x, y) => [origin.x + .94 * x - .48 * y, origin.y + .13 * x + .6 * y];
    const corners = [project(0, 0), project(width, 0), project(width, depth), project(0, depth)];
    const points = (vertices) => vertices.map((point) => point.join(",")).join(" ");
    const guide = svgElement("g", { class: "inside-guide", "aria-hidden": "true" });
    [corners[0], corners[1], corners[3]].forEach(([x, y]) => {
        svgElement("line", { x1: x, y1: y - 15, x2: x, y2: y + 405, stroke: "#836397", "stroke-opacity": .3, "stroke-dasharray": "3 7" }, guide);
    });

    const keyParts = [];
    const keyLights = [];
    LAYOUT.forEach((row, rowIndex) => {
        let offset = 0;
        row.forEach(([legend, code, units = 1]) => {
            keyParts.push({
                x: padding + offset * unit + gap / 2,
                y: padding + (rowIndex + (rowIndex > 0 ? .2 : 0)) * unit + gap / 2,
                width: units * unit - gap,
                height: unit - gap,
                key: legend,
                code,
                units,
                isKnob: legend === "KNOB"
            });
            offset += units;
        });
    });

    function drawKnob(surface, part, mounted = false) {
        const cx = part.x + part.width / 2;
        const cy = part.y + part.height / 2;
        const radius = unit * .43;
        const knob = svgElement("g", { class: mounted ? "inside-knob-mount" : "inside-knob", "data-code": "KNOB" }, surface);
        svgElement("circle", { cx, cy: cy + 4, r: radius, fill: "#16121f", stroke: "#5a526c", "stroke-width": 1 }, knob);
        svgElement("circle", { cx, cy, r: radius, fill: mounted ? "#55515e" : "url(#inside-knob-metal)", stroke: "#160e23", "stroke-width": 1.5 }, knob);
        if (mounted) {
            svgElement("circle", { cx, cy, r: radius * .36, fill: "#cfc4e4", stroke: "#eee5ff", "stroke-width": 1 }, knob);
            return;
        }
        for (let index = 0; index < 36; index++) {
            const angle = index * Math.PI / 18;
            svgElement("line", { x1: cx + Math.cos(angle) * radius * .81, y1: cy + Math.sin(angle) * radius * .81, x2: cx + Math.cos(angle) * radius * .96, y2: cy + Math.sin(angle) * radius * .96, stroke: "#796b9c", "stroke-width": .8 }, knob);
        }
        svgElement("circle", { cx, cy, r: radius * .75, fill: "url(#inside-knob-metal)", stroke: "#ede7fa", "stroke-width": .65 }, knob);
        const indicator = svgElement("g", { class: "inside-knob-indicator", style: `transform-origin:${cx}px ${cy}px` }, knob);
        svgElement("line", { x1: cx, y1: cy - radius * .66, x2: cx, y2: cy - radius * .26, stroke: "hsl(var(--accent-h) 100% 62%)", "stroke-width": 2.1, "stroke-linecap": "round" }, indicator);
    }

    const groups = new Map();
    [...layers].reverse().forEach((layer) => {
        const index = layers.indexOf(layer);
        const group = svgElement("g", { class: "inside-diagram-layer", "data-layer": layer.id, "aria-hidden": "true" });
        group.style.transform = `translateY(${index * 76}px)`;
        groups.set(layer.id, group);
        const visual = svgElement("g", { class: "inside-layer-visual" }, group);
        const thickness = layer.thickness;
        const lower = corners.map(([x, y]) => [x, y + thickness]);
        svgElement("polygon", { points: points([corners[1], corners[2], lower[2], lower[1]]), fill: layer.side, stroke: "#836797", "stroke-width": .7 }, visual);
        svgElement("polygon", { points: points([corners[2], corners[3], lower[3], lower[2]]), fill: layer.side, stroke: "#836797", "stroke-width": .7 }, visual);
        if (!["keycaps", "case"].includes(layer.id)) {
            svgElement("polygon", { points: points(corners), fill: layer.fill, stroke: "#766f82", "stroke-width": 1 }, visual);
        }
        const surface = svgElement("g", { transform: `matrix(.94 .13 -.48 .6 ${origin.x} ${origin.y})` }, visual);
        if (["keycaps", "case"].includes(layer.id)) {
            svgElement("rect", { width, height: depth, rx: 8, fill: layer.fill, stroke: "#59565e", "stroke-width": 1.3 }, surface);
        }

        if (layer.id === "case") {
            svgElement("rect", { x: 9, y: 9, width: width - 18, height: depth - 18, rx: 5, fill: "#050506", stroke: "#59555f", "stroke-width": 2 }, surface);
            svgElement("rect", { x: 19, y: 18, width: width - 38, height: depth - 36, rx: 3, fill: "#15151b", stroke: "#39343f" }, surface);
            [[28, 26], [width - 28, 26], [28, depth - 26], [width - 28, depth - 26]].forEach(([cx, cy]) => {
                svgElement("circle", { cx, cy, r: 4, fill: "#9b82aa" }, surface);
                svgElement("circle", { cx, cy, r: 1.8, fill: "#1b1129" }, surface);
            });
            svgElement("rect", { x: 200, y: 2, width: 32, height: 5, fill: "#07050d", stroke: "#a08aa9" }, surface);
            const start = project(width * .08, depth);
            const end = project(width * .92, depth);
            svgElement("path", { class: "inside-front-light", d: `M${start[0]} ${start[1] + thickness * .55}L${end[0]} ${end[1] + thickness * .55}`, "stroke-width": 1.6, "stroke-linecap": "round" }, visual);
        } else if (layer.id === "pcb") {
            keyParts.forEach(({ x, y, width: keyWidth, height, isKnob }, index) => {
                const cx = x + keyWidth / 2;
                const cy = y + height / 2;
                svgElement("path", { d: `M${cx} ${cy}h${index % 2 ? 8 : -8}v16h20`, stroke: "#4aa493", "stroke-width": 1, fill: "none", opacity: .65 }, surface);
                if (isKnob) {
                    svgElement("rect", { x: cx - 10, y: cy - 10, width: 20, height: 20, rx: 2, fill: "#777381", stroke: "#d2c8e2", "stroke-width": 1 }, surface);
                    svgElement("circle", { cx, cy, r: 5, fill: "#28222f", stroke: "#c2b8d2" }, surface);
                    [cx - 8, cx, cx + 8].forEach((pinX) => svgElement("rect", { x: pinX - 1.5, y: cy + 10, width: 3, height: 4, fill: "#d6b775" }, surface));
                    return;
                }
                svgElement("rect", { x: cx - 5, y: cy - 4.5, width: 10, height: 9, rx: 2, fill: "#0c151c", stroke: "#8c9a84", "stroke-width": .8 }, surface);
                svgElement("circle", { cx: cx - 2, cy, r: 1.3, fill: "#d6b775" }, surface);
                svgElement("circle", { cx: cx + 2, cy, r: 1.3, fill: "#d6b775" }, surface);
                svgElement("rect", { x: cx - 2, y: cy - 9, width: 4, height: 2, fill: "hsl(var(--accent-h) 100% 65%)" }, surface);
            });
        } else if (layer.id === "plate" || layer.id === "foam") {
            keyParts.forEach(({ x, y, width: keyWidth, height, isKnob }) => {
                const cx = x + keyWidth / 2;
                const cy = y + height / 2;
                const attributes = { fill: "#09080e", stroke: layer.id === "plate" ? "#ada4b9" : "#766080", "stroke-width": .8 };
                if (isKnob) {
                    svgElement("circle", { cx, cy, r: unit * .32, ...attributes }, surface);
                } else {
                    const opening = unit * .58;
                    svgElement("rect", { x: cx - opening / 2, y: cy - opening / 2, width: opening, height: opening, rx: 1, ...attributes }, surface);
                }
            });
        } else if (layer.id === "switches") {
            keyParts.forEach((part) => {
                const { x, y, width: keyWidth, height, isKnob } = part;
                if (isKnob) {
                    drawKnob(surface, part, true);
                    return;
                }
                const cx = x + keyWidth / 2;
                const cy = y + height / 2;
                svgElement("rect", { x: cx - 9, y: cy - 5, width: 18, height: 18, rx: 2, fill: "#0e0918", stroke: "#9c7daf", "stroke-width": .8 }, surface);
                svgElement("rect", { x: cx - 8, y: cy - 8, width: 16, height: 16, rx: 2, fill: "var(--inside-switch-color)", "fill-opacity": .25, stroke: "var(--inside-switch-color)", "stroke-width": 1 }, surface);
                svgElement("path", { d: `M${cx - 2} ${cy - 5}h4v3h3v4h-3v3h-4v-3h-3v-4h3Z`, fill: "var(--inside-switch-color)" }, surface);
            });
        } else {
            svgElement("rect", { x: 8, y: 7, width: width - 16, height: depth - 14, rx: 5, fill: "#050506", stroke: "#333037", "stroke-width": .8 }, surface);
            keyParts.forEach((part) => {
                const { x, y, width: keyWidth, height, key, code, units, isKnob } = part;
                if (isKnob) {
                    drawKnob(surface, part);
                    return;
                }
                const rose = TECLAS_ROSA.has(code);
                const cyan = TECLAS_CIAN.has(code);
                const model = svgElement("g", { class: "inside-keycap", "data-code": code, "data-units": units }, surface);
                svgElement("rect", { class: "inside-key-light", x: x - 1, y: y + 2, width: keyWidth + 2, height: height + 3, rx: 3 }, model);
                svgElement("rect", { x, y: y + 3.2, width: keyWidth, height, rx: 3, fill: rose ? "#180b13" : cyan ? "#0a1418" : "#0d0d10", stroke: "#060508", "stroke-width": 1 }, model);
                svgElement("rect", { x, y, width: keyWidth, height, rx: 3, fill: rose ? "url(#inside-keycap-rose)" : cyan ? "url(#inside-keycap-cyan)" : key.length === 1 ? "url(#inside-keycap)" : "url(#inside-keycap-mod)", stroke: "#49434e", "stroke-width": .65 }, model);
                svgElement("rect", { x: x + keyWidth * .09, y: y + height * .06, width: keyWidth * .82, height: height * .76, rx: 2, fill: "#ffffff04", stroke: "#ffffff10", "stroke-width": .45 }, model);
                if (key) {
                    const text = svgElement("text", { class: "inside-key-legend", x: x + keyWidth / 2, y: y + height * .5, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": unit * (key.length === 1 ? .24 : .16), "font-family": "Silkscreen, monospace" }, model);
                    text.textContent = key;
                }
                keyLights.push({ element: model, source: keyByCode.get(code), hue: NaN, brightness: NaN });
            });
        }

        svgElement("polygon", { class: "inside-layer-outline", points: points(corners), fill: "none", stroke: ["keycaps", "case"].includes(layer.id) ? "#59525f" : "#9975ab", "stroke-width": .8, "pointer-events": "none" }, visual);
        svgElement("path", { class: "inside-diagram-leader", d: "M577 128h10l8-12h10" }, group);
        const number = svgElement("text", { class: "inside-diagram-label", x: 605, y: 111 }, group);
        number.textContent = `0${index + 1}`;
        const label = svgElement("text", { class: "inside-diagram-label", x: 605, y: 126, style: "font-size:8px;letter-spacing:.3px" }, group);
        label.textContent = layer.label;
        group.addEventListener("click", () => {
            if (assembled) setAssembled(false);
            selectLayer(layer.id);
        });
    });

    let keyboardVisible = false;
    let nextLightingUpdate = 0;
    let lastKnobAngle = NaN;
    keyboardLightingListeners.add((time, hue, brightness) => {
        if (!keyboardVisible || time < nextLightingUpdate || (focused && selectedLayer === "switches")) return;
        nextLightingUpdate = time + .05;
        keyLights.forEach((key) => {
            if (!key.source) return;
            if (!Number.isFinite(key.hue) || Math.abs(key.source.h - key.hue) > .5) {
                key.hue = key.source.h;
                key.element.style.setProperty("--key-h", key.hue.toFixed(1));
            }
            if (!Number.isFinite(key.brightness) || Math.abs(key.source.l - key.brightness) > .01) {
                key.brightness = key.source.l;
                key.element.style.setProperty("--key-l", key.brightness.toFixed(3));
            }
        });
        section.style.setProperty("--glow-h", hue.toFixed(1));
        section.style.setProperty("--glow-l", brightness.toFixed(3));
        if (lastKnobAngle !== knobAngle) {
            lastKnobAngle = knobAngle;
            section.style.setProperty("--inside-knob-angle", knobAngle + "deg");
        }
    });
    new IntersectionObserver(([entry]) => { keyboardVisible = entry.isIntersecting; }).observe(diagram);

    const caption = document.createElement("div");
    caption.className = "inside-focus-caption";
    caption.inert = true;
    caption.setAttribute("aria-hidden", "true");
    const captionName = document.createElement("span");
    const captionText = document.createElement("p");
    caption.append(captionName, captionText);
    const focusNavigation = document.createElement("div");
    focusNavigation.className = "inside-focus-navigation";
    [-1, 1].forEach((direction) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inside-outline-button";
        button.textContent = direction === -1 ? "← Anterior" : "Siguiente →";
        button.setAttribute("aria-label", direction === -1 ? "Ampliar la pieza anterior" : "Ampliar la siguiente pieza");
        button.addEventListener("click", () => {
            const index = layers.findIndex((layer) => layer.id === selectedLayer);
            selectLayer(layers[(index + direction + layers.length) % layers.length].id);
        });
        focusNavigation.appendChild(button);
    });
    caption.appendChild(focusNavigation);
    section.querySelector(".inside-stage").appendChild(caption);
    const focusSwitch = document.getElementById("inside-switch-cutaway").cloneNode(true);
    focusSwitch.id = "inside-focus-switch";
    focusSwitch.removeAttribute("role");
    focusSwitch.removeAttribute("aria-labelledby");
    focusSwitch.setAttribute("aria-hidden", "true");
    focusSwitch.querySelector("title").remove();
    [["Vástago", 21], ["Contactos", 100], ["Muelle", 149]].forEach(([name, y]) => {
        const label = svgElement("text", { x: 136, y, fill: "#cdb4df", "font-family": "VT323, monospace", "font-size": 7 }, focusSwitch);
        label.textContent = name;
    });
    section.querySelector(".inside-stage").appendChild(focusSwitch);

    function animateViewBox(target) {
        cancelAnimationFrame(zoomFrame);
        const from = diagram.getAttribute("viewBox").split(" ").map(Number);
        const start = performance.now();
        function frame(now) {
            const progress = reduceMotion ? 1 : Math.min((now - start) / 650, 1);
            const eased = 1 - (1 - progress) ** 4;
            diagram.setAttribute("viewBox", target.map((value, i) => from[i] + (value - from[i]) * eased).join(" "));
            if (progress < 1) zoomFrame = requestAnimationFrame(frame);
        }
        frame(start);
    }

    function setFocused(value) {
        if (value && assembled) setAssembled(false);
        focused = value;
        caption.inert = !value;
        caption.setAttribute("aria-hidden", String(!value));
        section.classList.toggle("inside-focused", value);
        section.dataset.focusedLayer = selectedLayer;
        focusButton.setAttribute("aria-pressed", String(value));
        focusButton.textContent = value ? "Volver al despiece ↙" : "Ampliar pieza ↗";
        const layer = layers.find((item) => item.id === selectedLayer);
        captionName.textContent = layer.label;
        captionText.textContent = layer.description;
        animateViewBox(value ? [15, layers.indexOf(layer) * separation - 183, 620, 620] : [0, 0, 660, 660]);
        document.getElementById("inside-svg-description").textContent = value ? layer.title + " " + layer.description : "Vista por capas: keycaps, switches, placa, circuito PCB, espuma acústica y carcasa.";
    }
    function showViewer() {
        section.querySelector(".inside-viewer").scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
    }
    focusButton.addEventListener("click", () => {
        setFocused(!focused);
        if (focused) showViewer();
    });
    section.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && focused) {
            setFocused(false);
            focusButton.focus({ preventScroll: true });
        }
    });

    function selectLayer(id) {
        const layer = layers.find((item) => item.id === id);
        if (!layer) return;
        selectedLayer = id;
        layerButtons.forEach((button) => {
            const active = button.dataset.layer === id;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
        groups.forEach((group, key) => group.classList.toggle("is-active", key === id));
        document.getElementById("inside-layer-title").textContent = layer.title;
        document.getElementById("inside-layer-description").textContent = layer.description;
        const detail = section.querySelector(".inside-layer-detail");
        detail.classList.remove("is-changing");
        void detail.offsetWidth;
        detail.classList.add("is-changing");
        if (focused) setFocused(true);
    }

    layerButtons.forEach((button) => button.addEventListener("click", () => {
        if (assembled) setAssembled(false);
        selectLayer(button.dataset.layer);
        if (focused) showViewer();
    }));

    function setAssembled(value) {
        if (focused) setFocused(false);
        assembled = value;
        section.classList.toggle("inside-assembled", value);
        layers.forEach((layer, index) => {
            groups.get(layer.id).style.transform = `translateY(${value ? 190 + index * 2 : index * separation}px)`;
        });
        assemblyButton.setAttribute("aria-pressed", String(value));
        assemblyButton.replaceChildren(document.createTextNode(value ? "Ver por capas " : "Ensamblar "));
        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = value ? "↑" : "↓";
        assemblyButton.appendChild(arrow);
        document.getElementById("inside-svg-description").textContent = value
            ? "Teclado ensamblado."
            : "Keycaps de PBT, switches hot-swap, placa de aluminio, PCB, espuma PORON, carcasa de aluminio y perilla metálica.";
    }
    assemblyButton.addEventListener("click", () => {
        setAssembled(!assembled);
        showViewer();
    });

    function updateSwitch(type) {
        const profile = switchProfiles[type];
        if (!profile) return;
        section.style.setProperty("--inside-switch-color", profile.color);
        document.getElementById("inside-switch-name").textContent = profile.name;
        document.getElementById("inside-switch-type").textContent = profile.type;
        document.getElementById("inside-switch-force").textContent = profile.force;
        document.getElementById("inside-switch-sound").textContent = profile.sound;
        if (assembled) setAssembled(false);
        selectLayer("switches");
        animatePress();
    }

    function animatePress() {
        clearTimeout(pressTimer);
        switchPanel.classList.remove("is-pressing");
        void switchPanel.offsetWidth;
        switchPanel.classList.add("is-pressing");
        section.classList.add("is-pressing");
        pressTimer = setTimeout(() => {
            switchPanel.classList.remove("is-pressing");
            section.classList.remove("is-pressing");
        }, 160);
    }

    document.addEventListener("switchchange", (event) => updateSwitch(event.detail.tipo));
    document.getElementById("inside-test-switch").addEventListener("click", () => {
        animatePress();
        if (!state.sound) soundBtn.click();
        playClick(state.switchType);
    });
    selectLayer(selectedLayer);

    function updateScroll() {
        scrollFrame = 0;
        if (reduceMotion || assembled || focused) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const progress = clamp((innerHeight * .85 - rect.top) / (innerHeight * .9));
        separation = 48 + progress * 28;
        layers.forEach((layer, index) => groups.get(layer.id).style.transform = `translateY(${index * separation}px)`);
    }
    window.addEventListener("scroll", () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    }, { passive: true });
    window.addEventListener("resize", updateScroll);
    section.classList.add("is-enhanced");
    new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) return;
        section.classList.add("is-revealed");
        updateScroll();
        observer.disconnect();
    }, { threshold: .08 }).observe(section);
})();

(() => {
    const lab = document.querySelector(".sound-lab");
    if (!lab) return;
    const switchKey = document.getElementById("lab-switch-key");
    const typingButton = document.getElementById("lab-typing");
    const status = document.getElementById("lab-playback-status");
    const profiles = {
        tactile: { name: "Neon Violet", force: "55 g", feel: "Táctil", sound: "Sharp Click" },
        linear: { name: "Plasma Blue", force: "45 g", feel: "Lineal", sound: "Clack Suave" },
        silent: { name: "Cyber Yellow", force: "50 g", feel: "Amortiguado", sound: "Deep Thock" }
    };
    let timers = [];
    let releaseTimer;
    let playing = false;

    document.querySelectorAll(".switch-card").forEach((card) => {
        const model = card.querySelector(".switch__model");
        const svg = document.getElementById("lab-switch-svg").cloneNode(true);
        svg.removeAttribute("id");
        svg.style.setProperty("--accent-h", "var(--sw)");
        svg.querySelectorAll("[id]").forEach((element) => {
            const previous = element.id;
            const next = `${card.dataset.switch}-${previous}`;
            svg.querySelectorAll(`[fill="url(#${previous})"]`).forEach((shape) => shape.setAttribute("fill", `url(#${next})`));
            element.id = next;
        });
        model.replaceChildren(svg);
    });

    const wave = lab.querySelector(".lab-wave");
    for (let index = 0; index < 40; index++) {
        const bar = document.createElement("span");
        const envelope = Math.sin(index / 39 * Math.PI);
        bar.style.setProperty("--bar-height", `${8 + envelope * (14 + (index * 17 % 19))}px`);
        wave.appendChild(bar);
    }

    function release() {
        clearTimeout(releaseTimer);
        lab.classList.remove("is-pressing");
        document.querySelectorAll(".switch-card.is-pressing").forEach((card) => card.classList.remove("is-pressing"));
    }

    function pulse(hold = false) {
        clearTimeout(releaseTimer);
        lab.classList.remove("is-pressing");
        void lab.offsetWidth;
        lab.classList.add("is-pressing");
        document.querySelector(`.switch-card[data-switch="${state.switchType}"]`).classList.add("is-pressing");
        playClick(state.switchType);
        status.textContent = `Reproduciendo ${profiles[state.switchType].name}`;
        if (!hold) releaseTimer = setTimeout(release, 160);
    }

    function stopSequence() {
        timers.forEach(clearTimeout);
        timers = [];
        playing = false;
        typingButton.setAttribute("aria-pressed", "false");
        typingButton.textContent = "Prueba de escritura";
        release();
    }

    function enableAudio() {
        if (!state.sound) soundBtn.click();
    }

    document.getElementById("lab-listen").addEventListener("click", () => {
        stopSequence();
        enableAudio();
        pulse();
    });
    typingButton.addEventListener("click", () => {
        if (playing) {
            stopSequence();
            status.textContent = "Prueba detenida.";
            return;
        }
        enableAudio();
        playing = true;
        typingButton.setAttribute("aria-pressed", "true");
        typingButton.textContent = "Detener prueba";
        [0, 130, 240, 400, 520, 680, 830, 980].forEach((delay) => timers.push(setTimeout(() => pulse(), delay)));
        timers.push(setTimeout(() => {
            stopSequence();
            status.textContent = "Prueba terminada.";
        }, 1230));
    });
    switchKey.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        stopSequence();
        enableAudio();
        switchKey.setPointerCapture(event.pointerId);
        pulse(true);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => switchKey.addEventListener(name, release));
    switchKey.addEventListener("click", (event) => {
        if (event.detail !== 0) return;
        stopSequence();
        enableAudio();
        pulse();
    });

    document.addEventListener("switchchange", (event) => {
        stopSequence();
        const profile = profiles[event.detail.tipo];
        lab.dataset.switch = event.detail.tipo;
        document.getElementById("lab-switch-name").textContent = profile.name;
        document.getElementById("lab-switch-force").textContent = profile.force;
        document.getElementById("lab-switch-feel").textContent = profile.feel;
        document.getElementById("lab-switch-sound").textContent = profile.sound;
        lab.classList.add("is-pressing");
        document.querySelector(`.switch-card[data-switch="${event.detail.tipo}"]`).classList.add("is-pressing");
        releaseTimer = setTimeout(release, 160);
        status.textContent = profile.name;
    });
    soundBtn.addEventListener("click", () => {
        if (!state.sound) {
            stopSequence();
            status.textContent = "Audio silenciado.";
        }
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopSequence(); });
    window.addEventListener("pagehide", stopSequence);
})();
/* ---------------------------------------------------------
   10. Contadores animados (ficha técnica, precio y stock)
   Cada número parte en 0 y sube con easing exponencial
   (arranca rápido y frena al llegar a la meta).
   --------------------------------------------------------- */
(() => {
  const contadores = document.querySelectorAll(".contador");
  if (!contadores.length) return;

  const formato = (el, valor) => {
    let s = valor.toFixed(Number(el.dataset.decimales || 0));
    if (el.dataset.coma) s = s.replace(".", ",");
    return s;
  };
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function animar(el, retardo) {
    const meta = parseFloat(el.dataset.meta);
    const duracion = Number(el.dataset.duracion || 1600);
    if (reduceMotion) { el.textContent = formato(el, meta); return; }
    // Con GSAP (librería de animación) el número se interpola con su easing "expo.out"
    if (window.gsap) {
      const n = { v: 0 };
      gsap.to(n, {
        v: meta,
        duration: duracion / 1000,
        delay: retardo / 1000,
        ease: "expo.out",
        onStart: () => el.classList.add("contando"),
        onUpdate: () => (el.textContent = formato(el, n.v)),
        onComplete: () => { el.classList.remove("contando"); el.classList.add("listo"); },
      });
      return;
    }
    // Respaldo sin GSAP: mismo efecto con requestAnimationFrame
    setTimeout(() => {
      el.classList.add("contando");
      const t0 = performance.now();
      const paso = (ahora) => {
        const p = Math.min((ahora - t0) / duracion, 1);
        el.textContent = formato(el, meta * easeOutExpo(p));
        if (p < 1) requestAnimationFrame(paso);
        else { el.classList.remove("contando"); el.classList.add("listo"); }
      };
      requestAnimationFrame(paso);
    }, retardo);
  }

  // Estado inicial: todo en 0 (el HTML trae el valor final por si falla el JS)
  if (!reduceMotion) contadores.forEach((el) => (el.textContent = formato(el, 0)));

  // Se observa el contenedor de cada número; el conteo parte cuando aparece
  const contenedores = new Map();
  contadores.forEach((el) => {
    const cont = el.closest(".spec-card, .reservar-precio, .reserva-stock") || el;
    if (!contenedores.has(cont)) contenedores.set(cont, []);
    contenedores.get(cont).push(el);
  });

  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      const grupo = contenedores.get(e.target);
      // escalonado: misma cadencia (120 ms) que la aparición de las tarjetas
      const tarjetas = [...document.querySelectorAll(".specs-grid .spec-card")];
      const i = tarjetas.indexOf(e.target);
      const retardo = (i >= 0 ? i * 120 : 0) + 200;
      grupo.forEach((el) => animar(el, retardo));
      o.unobserve(e.target);
    });
  }, { threshold: 0.3 });

  contenedores.forEach((_, cont) => obs.observe(cont));
})();
