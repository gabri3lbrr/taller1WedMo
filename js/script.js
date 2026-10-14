const barraProgreso = document.getElementById("scroll-progress-bar");

function actualizarProgreso() {
    // Cantidad de píxeles recorridos
    const scrollActual = window.scrollY;
    // Altura total que se puede recorrer
    const alturaTotal =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
    // Calcular porcentaje recorrido
    const porcentaje = alturaTotal > 0
        ? (scrollActual / alturaTotal) * 100
        : 0;
    // Actualizar el ancho de la barra
    barraProgreso.style.width = porcentaje + "%";
}

// Ejecutar al desplazarse
window.addEventListener("scroll", actualizarProgreso);
// Actualizar cuando cambia el tamaño de pantalla
window.addEventListener("resize", actualizarProgreso);
// Estado inicial
actualizarProgreso();





// SELECCIÓN DE SWITCHES

const tarjetasSwitch = document.querySelectorAll(".switch-card");

let switchSeleccionado = "tactile";

const estadoSwitch = document.getElementById("switch-estado");

const nombresSwitch = {
    tactile: "Neon Violet",
    linear: "Plasma Blue",
    silent: "Cyber Yellow"
};


tarjetasSwitch.forEach((tarjeta) => {

    tarjeta.addEventListener("click", () => {

        // 1. Identificar el switch seleccionado
        switchSeleccionado = tarjeta.dataset.switch;

        // 2. Desactivar las otras tarjetas
        tarjetasSwitch.forEach((item) => {
            item.classList.remove("activo");
            item.setAttribute("aria-pressed", "false");
        });

        // 3. Activar la tarjeta seleccionada
        tarjeta.classList.add("activo");
        tarjeta.setAttribute("aria-pressed", "true");

        // 4. Actualizar el texto
        estadoSwitch.textContent =
            "Seleccionado: " + nombresSwitch[switchSeleccionado];

        // 5. Reproducir automáticamente su sonido
        reproducirSonido();

    });

});




// SONIDO DE LOS SWITCHES

let audioCtx = null;

function reproducirSonido() {

    // Crear contexto de audio
    if (!audioCtx) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const ahora = audioCtx.currentTime;

    const oscilador = audioCtx.createOscillator();
    const volumen = audioCtx.createGain();
    const filtro = audioCtx.createBiquadFilter();

    // SWITCH TÁCTIL
    if (switchSeleccionado === "tactile") {

        oscilador.type = "sawtooth";
        oscilador.frequency.setValueAtTime(420, ahora);
        oscilador.frequency.exponentialRampToValueAtTime(
            80, ahora + 0.08
        );

        filtro.type = "highpass";
        filtro.frequency.value = 500;

        volumen.gain.setValueAtTime(0.3, ahora);
        volumen.gain.exponentialRampToValueAtTime(
            0.001, ahora + 0.09
        );

    }

    // SWITCH LINEAL
    else if (switchSeleccionado === "linear") {

        oscilador.type = "triangle";
        oscilador.frequency.setValueAtTime(260, ahora);
        oscilador.frequency.exponentialRampToValueAtTime(
            60, ahora + 0.08
        );

        filtro.type = "bandpass";
        filtro.frequency.value = 1000;

        volumen.gain.setValueAtTime(0.25, ahora);
        volumen.gain.exponentialRampToValueAtTime(
            0.001, ahora + 0.09
        );

    }

    // SWITCH SILENCIOSO
    else {

        oscilador.type = "sine";
        oscilador.frequency.setValueAtTime(130, ahora);
        oscilador.frequency.exponentialRampToValueAtTime(
            40, ahora + 0.12
        );

        filtro.type = "lowpass";
        filtro.frequency.value = 300;

        volumen.gain.setValueAtTime(0.35, ahora);
        volumen.gain.exponentialRampToValueAtTime(
            0.001, ahora + 0.13
        );

    }

    // Conectar los componentes de audio
    oscilador.connect(filtro);
    filtro.connect(volumen);
    volumen.connect(audioCtx.destination);

    // Reproducir
    oscilador.start(ahora);
    oscilador.stop(ahora + 0.14);
}







// ========================================
// TECLADO KEYWAVE INTERACTIVO
// ========================================

(() => {

    const teclado = document.getElementById("teclado-interactivo");

    if (!teclado) return;

    // DISTRIBUCIÓN DEL TECLADO ORIGINAL
    const layout75 = [
        ["ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "DEL"],

        ["~", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "BKSP"],

        ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "ENTER"],

        ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ", "'"],

        ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "UP"],

        ["CTRL", "WIN", "ALT", "SPACE", "ALT", "FN", "LEFT", "DOWN", "RIGHT"]
    ];

    const teclas = new Map();

    // DETERMINAR ANCHO DE CADA TECLA
    function obtenerAncho(nombre) {
        if (nombre === "SPACE") return 5;
        if (nombre === "SHIFT") return 2.2;
        if (nombre === "BKSP") return 2;
        if (nombre === "ENTER") return 2;
        if (nombre === "CAPS") return 1.8;
        if (nombre === "TAB") return 1.5;

        return 1;
    }

    // GENERAR CADA FILA
    layout75.forEach((fila, indice) => {

        const filaHTML = document.createElement("div");
        filaHTML.className = "teclado-fila";

        fila.forEach((nombre) => {

            const tecla = document.createElement("button");

            tecla.type = "button";
            tecla.className = "tecla";
            tecla.textContent = nombre === "SPACE" ? "" : nombre;

            tecla.setAttribute("aria-label", nombre);
            tecla.style.setProperty("--ancho", obtenerAncho(nombre));

            // Colores especiales
            if (["ESC", "ENTER", "SPACE"].includes(nombre)) {
                tecla.classList.add("tecla-rosa");
            }

            if (["W", "A", "S", "D", "DEL"].includes(nombre)) {
                tecla.classList.add("tecla-cian");
            }

            // Pulsar con el mouse o dedo
            tecla.addEventListener("click", () => {
                pulsarTecla(tecla, nombre);
            });

            if (!teclas.has(nombre)) {
                teclas.set(nombre, tecla);
            }

            filaHTML.appendChild(tecla);

        });

        // Perilla en la primera fila
        if (indice === 0) {
            const perilla = document.createElement("div");
            perilla.className = "teclado-perilla";
            perilla.setAttribute("aria-hidden", "true");
            filaHTML.appendChild(perilla);
        }

        teclado.appendChild(filaHTML);

    });

    // ANIMACIÓN DE PULSACIÓN
    function pulsarTecla(tecla, nombre) {

        tecla.classList.remove("presionada");
        void tecla.offsetWidth;
        tecla.classList.add("presionada");

        setTimeout(() => {
            tecla.classList.remove("presionada");
        }, 120);

        reproducirSonidoTeclado(
            ["ESC", "ENTER", "SPACE"].includes(nombre)
        );
    }

    // ========================================
    // SONIDO ORIGINAL ADAPTADO
    // ========================================

    let audioTeclado = null;

    function reproducirSonidoTeclado(esEspecial = false) {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioTeclado) {
            audioTeclado = new AudioContextClass();
        }

        if (audioTeclado.state === "suspended") {
            audioTeclado.resume();
        }

        // Leer el switch seleccionado en la otra sección
        const tarjetaActiva = document.querySelector(
            ".switch-card.activo, .switch-card.active"
        );

        const tipo = tarjetaActiva?.dataset.switch
            || tarjetaActiva?.id.replace("switch-", "")
            || "tactile";

        const perfiles = {
            tactile: {
                onda: "sawtooth",
                frecuencia: esEspecial ? 520 : 380,
                final: 80,
                filtro: "highpass",
                corte: 600,
                volumen: 0.3,
                duracion: 0.07
            },

            linear: {
                onda: "triangle",
                frecuencia: esEspecial ? 350 : 240,
                final: 60,
                filtro: "bandpass",
                corte: 1200,
                volumen: 0.25,
                duracion: 0.08
            },

            silent: {
                onda: "sine",
                frecuencia: esEspecial ? 180 : 120,
                final: 40,
                filtro: "lowpass",
                corte: 350,
                volumen: 0.35,
                duracion: 0.10
            }
        };

        const perfil = perfiles[tipo] || perfiles.tactile;
        const ahora = audioTeclado.currentTime;

        const oscilador = audioTeclado.createOscillator();
        const filtro = audioTeclado.createBiquadFilter();
        const ganancia = audioTeclado.createGain();

        oscilador.type = perfil.onda;

        oscilador.frequency.setValueAtTime(
            perfil.frecuencia, ahora
        );

        oscilador.frequency.exponentialRampToValueAtTime(
            perfil.final, ahora + perfil.duracion
        );

        filtro.type = perfil.filtro;
        filtro.frequency.value = perfil.corte;

        ganancia.gain.setValueAtTime(
            perfil.volumen, ahora
        );

        ganancia.gain.exponentialRampToValueAtTime(
            0.001, ahora + perfil.duracion
        );

        oscilador.connect(filtro);
        filtro.connect(ganancia);
        ganancia.connect(audioTeclado.destination);

        oscilador.start(ahora);
        oscilador.stop(ahora + perfil.duracion + 0.01);
    }

    // ========================================
    // TECLADO FÍSICO DEL COMPUTADOR
    // ========================================

    const equivalencias = {
        Escape: "ESC",
        Backspace: "BKSP",
        Enter: "ENTER",
        " ": "SPACE",
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        Shift: "SHIFT",
        Control: "CTRL",
        Alt: "ALT",
        Meta: "WIN",
        CapsLock: "CAPS",
        Delete: "DEL",
        Tab: "TAB"
    };

    window.addEventListener("keydown", (evento) => {

        if (evento.repeat || evento.ctrlKey ||
            evento.metaKey || evento.altKey) return;

        // No interferir con inputs ni otros botones
        if (evento.target.closest(
            "input, textarea, select, button, a"
        )) return;

        // Solo cuando el hero está visible
        const hero = document.getElementById("inicio");
        const rect = hero.getBoundingClientRect();

        if (rect.bottom <= 100 ||
            rect.top >= window.innerHeight) return;

        const nombre = equivalencias[evento.key]
            || evento.key.toUpperCase();

        const tecla = teclas.get(nombre);

        if (tecla) {
            pulsarTecla(tecla, nombre);
        }

    });

})();
