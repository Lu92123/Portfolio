/* ============================================================
   LU92123 // VT-100 PHOSPHOR TERMINAL
   script.js — Vanilla JS, sin build step.

   PERSONALIZA TUS DATOS AQUÍ ABAJO.
   ============================================================ */

'use strict';

const CONFIG = {
  name: 'Lucas',
  alias: 'LU92123',
  github: 'https://github.com/Lu92123',
  // Rellena estos campos cuando los tengas. Si quedan vacíos,
  // la terminal mostrará un marcador "[PENDIENTE]" en su lugar.
  email: '',
  linkedin: '',
  cubingAverage: '~30 s',
  firstSeasons: '3+',
  // Enlaces de media. Pega una URL y el botón se vuelve un enlace real.
  media: {
    firstPhotos: '',
    firstGithub: '',
    probotPhotos: '',
    probotGithub: '',
    cubingWca: ''
  }
};

const THEMES = {
  amber: { label: 'ÁMBAR', long: 'FÓSFORO ÁMBAR · P1', color: '#ffb000', bg: '#120c00' },
  green: { label: 'VERDE CRT', long: 'FÓSFORO VERDE · P1', color: '#3dff85', bg: '#02120a' },
  mono: { label: 'MONO NEÓN', long: 'MONOCROMÁTICO NEÓN', color: '#d9f5ff', bg: '#05080b' }
};

const THEME_ORDER = ['amber', 'green', 'mono'];

/* ---------- Referencias del DOM ---------- */

const docEl = document.documentElement;
const bodyEl = document.body;
const screenEl = document.getElementById('screen');
const outputEl = document.getElementById('output');
const scrollEl = document.getElementById('terminal-scroll');
const terminalEl = document.getElementById('terminal');
const formEl = document.getElementById('prompt-form');
const inputEl = document.getElementById('command-input');
const mirrorEl = document.getElementById('mirror');
const caretEl = document.getElementById('caret');
const quickbarEl = document.querySelector('.quickbar');
const crtToggleEl = document.getElementById('crt-toggle');
const clockEl = document.getElementById('clock');
const rxLedEl = document.getElementById('rx-led');
const modeEl = document.getElementById('status-mode');
const txEl = document.getElementById('tx-status');
const promptHintEl = document.getElementById('prompt-hint');
const phosphorEl = document.getElementById('phosphor-label');
const toastEl = document.getElementById('toast');
const matrixCanvas = document.getElementById('matrix-canvas');
const matrixVeil = document.getElementById('matrix-veil');
const yearEl = document.getElementById('year');

/* ---------- Estado global ---------- */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const state = {
  busy: false,
  skipRequested: false,
  simulating: false,
  simCancel: false,
  booting: true,
  history: [],
  histIndex: 0,
  draft: '',
  theme: 'amber',
  crt: true,
  matrixActive: false,
  matrixCleanup: null,
  toastTimer: 0,
  startedAt: Date.now(),
  rxTimer: 0,
  commandCount: 0
};

let taskChain = Promise.resolve();

/* ---------- Utilidades ---------- */

const $ = (selector, root = document) => root.querySelector(selector);

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(value, length) {
  return String(value).padEnd(length, ' ').slice(0, length);
}

function centerText(value, width) {
  const len = [...String(value)].length;
  const left = Math.max(0, Math.floor((width - len) / 2));
  const right = Math.max(0, width - len - left);
  return ' '.repeat(left) + String(value) + ' '.repeat(right);
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* modo privado */ }
}

function normalizeTheme(value) {
  return THEME_ORDER.includes(value) ? value : 'amber';
}

function themeInfo(name = state.theme) {
  return THEMES[normalizeTheme(name)];
}

function enqueue(task) {
  taskChain = taskChain.then(task).catch((error) => {
    console.error('[terminal]', error);
    state.busy = false;
    state.simulating = false;
    setBusy(false);
  });
  return taskChain;
}

/* ---------- Feedback de la interfaz ---------- */

function pulseLed() {
  rxLedEl.classList.add('pulse');
  clearTimeout(state.rxTimer);
  state.rxTimer = window.setTimeout(() => {
    rxLedEl.classList.remove('pulse');
  }, 180);
}

function setMode(text) {
  modeEl.textContent = text;
}

function setTx(text) {
  txEl.textContent = text;
}

function setBusy(isBusy) {
  state.busy = isBusy;
  bodyEl.classList.toggle('is-busy', isBusy);
  promptHintEl.textContent = isBusy ? '[enter] saltar' : '[enter] run';
  if (isBusy) {
    setMode('TRANSMITIENDO');
    setTx('RX STREAM');
  } else {
    setMode('READY');
    setTx('TX IDLE');
  }
}

function showToast(message, duration = 1900) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}

/* ---------- Tema de fósforo ---------- */

function applyTheme(name, options = {}) {
  const theme = normalizeTheme(name);
  state.theme = theme;
  docEl.setAttribute('data-theme', theme);

  const info = themeInfo(theme);
  phosphorEl.textContent = `P1 · ${info.label}`;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', info.bg);

  storageSet('vt-theme', theme);

  if (options.announce) {
    showToast(`FÓSFORO: ${info.long}`);
    pulseLed();
  }
}

function cycleTheme() {
  const index = THEME_ORDER.indexOf(state.theme);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}

function parseThemeArg(arg) {
  if (!arg) return null;
  const value = arg.toLowerCase().replace(/[áà]/g, 'a');
  if (value === 'amber' || value === 'ambar') return 'amber';
  if (value === 'green' || value === 'verde') return 'green';
  if (value === 'mono' || value === 'neon' || value === 'monocromo') return 'mono';
  return null;
}

/* ---------- Efecto CRT ---------- */

function kickScreen() {
  if (reducedMotion.matches) return;
  screenEl.classList.remove('kick');
  void screenEl.offsetWidth;
  screenEl.classList.add('kick');
  window.setTimeout(() => screenEl.classList.remove('kick'), 460);
}

function setCrt(enabled, options = {}) {
  state.crt = Boolean(enabled);
  docEl.classList.toggle('crt-off', !state.crt);
  crtToggleEl.textContent = `[ CRT: ${state.crt ? 'ON' : 'OFF'} ]`;
  crtToggleEl.setAttribute('aria-pressed', String(state.crt));
  storageSet('vt-crt', state.crt ? 'on' : 'off');

  if (state.crt && options.kick !== false) kickScreen();

  if (options.announce) {
    showToast(`EFECTO CRT: ${state.crt ? 'ACTIVADO' : 'DESACTIVADO'}`);
    pulseLed();
  }
}

/* ---------- Motor de salida / máquina de escribir ---------- */

function scrollBottom() {
  if (scrollBottom.pending) return;
  scrollBottom.pending = true;
  requestAnimationFrame(() => {
    scrollBottom.pending = false;
    scrollEl.scrollTop = scrollEl.scrollHeight;
  });
}

function createLine(html, className = '') {
  const line = document.createElement('div');
  line.className = `line ${className}`.trim();
  line.innerHTML = html;
  return line;
}

function appendInstant(block) {
  const line = createLine(block.html, block.cls);
  outputEl.appendChild(line);
  pulseLed();
  scrollBottom();
  return line;
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    if (current.nodeValue && current.nodeValue.length) {
      nodes.push({ node: current, full: current.nodeValue });
    }
    current = walker.nextNode();
  }
  return nodes;
}

async function typeBlock(block) {
  const line = createLine(block.html, block.cls);
  outputEl.appendChild(line);
  pulseLed();

  if (reducedMotion.matches || state.skipRequested || block.instant) {
    scrollBottom();
    return Boolean(state.skipRequested);
  }

  const nodes = collectTextNodes(line);
  const total = nodes.reduce((sum, item) => sum + item.full.length, 0);

  if (!total) {
    scrollBottom();
    return false;
  }

  nodes.forEach((item) => { item.node.nodeValue = ''; });

  let delay = 9;
  let batch = 1;

  if (total > 1400) { delay = 2; batch = 4; }
  else if (total > 800) { delay = 3; batch = 3; }
  else if (total > 420) { delay = 5; batch = 2; }
  else if (total > 180) { delay = 7; batch = 2; }

  if (block.slow) delay = Math.max(delay, 22);

  let skipped = false;

  outer:
  for (const item of nodes) {
    let index = 0;
    while (index < item.full.length) {
      if (state.skipRequested) {
        skipped = true;
        break outer;
      }
      const take = Math.min(batch, item.full.length - index);
      item.node.nodeValue += item.full.slice(index, index + take);
      index += take;
      scrollBottom();
      // Los saltos de línea merecen una pausa mínima.
      await sleep(item.full[index - 1] === '\n' ? delay * 2 : delay);
    }
  }

  nodes.forEach((item) => { item.node.nodeValue = item.full; });
  scrollBottom();
  return skipped;
}

async function respond(blocks) {
  let skipRest = false;
  outputEl.setAttribute('aria-busy', 'true');

  for (const block of blocks) {
    if (!block) continue;

    if (skipRest) {
      appendInstant(block);
    } else {
      const skipped = await typeBlock(block);
      if (skipped) skipRest = true;
    }

    if (block.pause && !skipRest) {
      await sleep(block.pause);
    }
  }

  outputEl.removeAttribute('aria-busy');
  state.skipRequested = false;
  scrollBottom();
}

function echoCommand(raw) {
  appendInstant({
    cls: 'echo',
    html: `<span class="prompt-echo">guest@system:~$</span> <span class="echo-cmd">${esc(raw)}</span>`
  });
}

/* ---------- Helpers de contenido ---------- */

function kv(rows, className = '') {
  return `<div class="kv-grid ${className}">
    ${rows.map(([key, value]) => `<span class="k">${key}</span><span class="v">${value}</span>`).join('')}
  </div>`;
}

function tags(items) {
  return `<div class="tags">${items.map((item) => `<span class="tag">${item}</span>`).join('')}</div>`;
}

function mediaButton(label, url, key) {
  if (url) {
    return `<a class="term-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
  return `<button type="button" class="term-btn" data-todo="${esc(key)}">${label}</button>`;
}

function makeBoxed(lines, width = 50) {
  const border = '+' + '='.repeat(width) + '+';
  const body = lines.map((line) => '|' + centerText(line, width) + '|').join('\n');
  return `${border}\n${body}\n${border}`;
}

function bannerBlock() {
  const art = makeBoxed([
    'LUCAS  //  LU92123',
    '',
    'LOW-LEVEL MAKER · PROBLEM SOLVER',
    'FIRST ROBOTICS · EMBEDDED · CUBING',
    '',
    'VT-100 PHOSPHOR TERMINAL · REV 1.0'
  ], 50);

  return {
    cls: 'block',
    html: `<pre class="ascii banner">${art}</pre>`
  };
}

/* ============================================================
   CONTENIDO DEL PORTAFOLIO
   ============================================================ */

function aboutBlocks() {
  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">PERFIL / OPERADOR</div>
        <h3>LUCAS · <span class="dim">@${CONFIG.alias}</span></h3>
        <p class="lead">Me muevo donde el software toca el mundo físico: programación, sistemas embebidos, electrónica y robótica. Disfruto desarmar problemas complejos hasta convertirlos en piezas pequeñas, medibles y resolubles.</p>
        <p>Mi formación práctica viene de competir: más de tres temporadas en <strong>FIRST</strong> (FTC y FRC) y robots de competición en <strong>Probot School</strong>, donde una idea solo vale cuando el robot funciona en la cancha. Ahí aprendí a depurar bajo presión, a iterar rápido y a comunicar decisiones técnicas.</p>
        <p>Me interesa lo que ocurre <em>debajo</em> de la abstracción: cómo responde un microcontrolador, por qué falla un driver, cuánto tarda una rutina y qué pasa cuando el hardware no perdona. Prefiero entender el sistema completo antes que memorizar la receta.</p>
      `
    },
    {
      cls: 'block',
      html: `
        <div class="panel">
          <div class="panel-title">Ficha rápida</div>
          ${kv([
            ['ENFOQUE', 'Sistemas embebidos · robótica · software de bajo nivel'],
            ['HERRAMIENTAS', 'C/C++ · Python · Java · JavaScript · Git · CAD'],
            ['AHORA', 'Construyendo este terminal y nuevos proyectos de hardware'],
            ['MÉTODO', 'Entender → medir → construir → iterar'],
            ['FUERA DE PANTALLA', `Speedcubing (${CONFIG.cubingAverage})`]
          ])}
          <blockquote class="quote">“No me basta con usarlo: necesito saber por qué funciona.”</blockquote>
        </div>
      `
    },
    {
      cls: 'line dim',
      html: `Escribe <button type="button" class="term-btn ghost" data-cmd="projects">projects</button> para ver lo que he construido, o <button type="button" class="term-btn ghost" data-cmd="cubing">cubing</button> para la parte menos obvia.`
    }
  ];
}

/* ---------- Proyectos ---------- */

function projectsIndexBlocks() {
  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">ÍNDICE DE PROYECTOS <span class="dim">// 3 ÁREAS</span></div>
        <p class="dim mono-small">Selecciona una tarjeta o escribe <span class="hl">projects 1</span>, <span class="hl">projects 2</span> o <span class="hl">projects 3</span>.</p>
        <div class="project-grid">
          <button type="button" class="project-card" data-cmd="projects 1">
            <span class="pc-head"><span class="pc-index">01</span><span class="pc-title">FIRST · FTC / FRC</span><span class="pc-arrow">→</span></span>
            <span class="pc-desc">Más de tres temporadas de robótica competitiva internacional: mecánica, autonomía y presión real.</span>
            <span class="pc-tags"><span class="tag">Ingeniería</span><span class="tag">Equipo</span><span class="tag">Competencia</span></span>
          </button>
          <button type="button" class="project-card" data-cmd="projects 2">
            <span class="pc-head"><span class="pc-index">02</span><span class="pc-title">PROBOT SCHOOL</span><span class="pc-arrow">→</span></span>
            <span class="pc-desc">Robots de fútbol, mini sumo y sigue-líneas: chasis, circuitos, motores y firmware en C/C++.</span>
            <span class="pc-tags"><span class="tag">Hardware</span><span class="tag">Firmware</span><span class="tag">Pista</span></span>
          </button>
          <button type="button" class="project-card" data-cmd="projects 3">
            <span class="pc-head"><span class="pc-index">03</span><span class="pc-title">SPEEDCUBING</span><span class="pc-arrow">→</span></span>
            <span class="pc-desc">Cubo de Rubik en ${CONFIG.cubingAverage}. Disciplina, patrones y un método de aprendizaje aplicado a la ingeniería.</span>
            <span class="pc-tags"><span class="tag">Disciplina</span><span class="tag">Patrones</span><span class="tag">Método</span></span>
          </button>
        </div>
      `
    }
  ];
}

function projectFirstBlocks() {
  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">PROYECTO 01 / ROBÓTICA DE COMPETICIÓN</div>
        <h3>FIRST · FTC / FRC</h3>
        <p class="lead"><strong>${CONFIG.firstSeasons} temporadas</strong> compitiendo en equipos internacionales de FIRST. Ingeniería mecánica, programación, trabajo en equipo bajo presión y una sola regla: el robot tiene que funcionar.</p>
        <p>FIRST no es un club de robótica tranquilo. Es un ciclo corto y brutal de diseño, fabricación, cableado, programación, pruebas y fallos que aparecen justo antes de la competencia. Aprendí a iterar con información incompleta y a defender decisiones técnicas frente al equipo.</p>
        ${kv([
          ['TRAYECTORIA', `${CONFIG.firstSeasons} temporadas · FTC & FRC`],
          ['DISCIPLINAS', 'Diseño mecánico · CAD · programación · electrónica'],
          ['AUTÓNOMO', 'Lógica de control, sensores, lazos PID y calibración'],
          ['PIT CREW', 'Diagnóstico y reparación con el reloj en contra'],
          ['HABILIDADES', 'Trabajo en equipo · comunicación · resolución real']
        ])}
        <div class="section-title">Qué construí / qué aprendí</div>
        <ul class="bullets">
          <li><strong>Subsistemas mecánicos:</strong> chasis, intakes, elevadores y transmisiones pensadas para reparar rápido.</li>
          <li><strong>Programación autónoma y teleoperada:</strong> control, sensores, secuencias, telemetría y ajuste fino.</li>
          <li><strong>Iteración real:</strong> prototipo → prueba → fallo → corrección, con fechas que no se mueven.</li>
          <li><strong>Coordinación:</strong> mecánica, electricidad, programación y scouting tomando decisiones en cancha.</li>
          <li><strong>Mentalidad:</strong> no existe el “casi funciona”; el robot compite o no compite.</li>
        </ul>
      `
    },
    {
      cls: 'block',
      html: `
        <div class="media-row">
          ${mediaButton('[ VER FOTOS/VIDEO ]', CONFIG.media.firstPhotos, 'firstPhotos')}
          ${mediaButton('[ LINK GITHUB ]', CONFIG.media.firstGithub, 'firstGithub')}
          <button type="button" class="term-btn ghost" data-cmd="projects">[ ← ÍNDICE ]</button>
        </div>
        <div class="line dim mono-small">Material audiovisual en preparación. El enlace de GitHub está disponible en <button type="button" class="term-btn ghost" data-cmd="contact">contact</button>.</div>
      `
    }
  ];
}

function projectProbotBlocks() {
  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">PROYECTO 02 / HARDWARE + FIRMWARE</div>
        <h3>PROBOT SCHOOL · ROBÓTICA DE COMPETICIÓN</h3>
        <p class="lead">Robots autónomos y teleoperados para <strong>fútbol robótico, mini sumo y sigue-líneas</strong>. Del esquema al chasis, del driver al firmware, y de la mesa de trabajo a la pista.</p>
        <p>Aquí el aprendizaje fue vertical: tocar motores, medir voltajes, soldar conexiones, leer sensores y descubrir que un cable flojo puede arruinar una estrategia perfecta. Programar el robot es solo la mitad; la otra mitad es hacer que el mundo físico coopere.</p>
        ${kv([
          ['CATEGORÍAS', 'Fútbol robótico · Mini sumo · Sigue-líneas'],
          ['HARDWARE', 'Drivers de motor · puentes H · sensores IR/US · baterías'],
          ['FIRMWARE', 'C/C++ sobre Arduino, AVR y ESP32'],
          ['CONTROL', 'Lazos de seguimiento, calibración y lógica de decisión'],
          ['DISEÑO', 'Chasis, soportes y circuitos pensados para reparar rápido']
        ])}
        <div class="section-title">Logros y aprendizajes</div>
        <ul class="bullets">
          <li><strong>Integración completa:</strong> chasis, electrónica, alimentación y firmware funcionando como un sistema.</li>
          <li><strong>Calibración real:</strong> ajuste de sensores y control después de cada prueba en pista, no solo en el escritorio.</li>
          <li><strong>Competencia:</strong> participación en categorías locales y escolares de fútbol, mini sumo y sigue-líneas.</li>
          <li><strong>Diagnóstico:</strong> aislar fallas eléctricas, mecánicas y de software con herramientas limitadas.</li>
          <li><strong>Documentación:</strong> registrar cambios para que el siguiente ajuste no empiece desde cero.</li>
        </ul>
      `
    },
    {
      cls: 'block',
      html: `
        <div class="media-row">
          ${mediaButton('[ VER FOTOS/VIDEO ]', CONFIG.media.probotPhotos, 'probotPhotos')}
          ${mediaButton('[ LINK GITHUB ]', CONFIG.media.probotGithub, 'probotGithub')}
          <button type="button" class="term-btn ghost" data-cmd="projects">[ ← ÍNDICE ]</button>
        </div>
        <div class="line dim mono-small">Logros, categorías y material de pista: la lista crece con cada temporada.</div>
      `
    }
  ];
}

function cubingBlocks(extended = false) {
  const blocks = [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">PROYECTO 03 / APRENDIZAJE AUTÓNOMO</div>
        <h3>SPEEDCUBING · ${CONFIG.cubingAverage}</h3>
        <p class="lead">Resuelvo el cubo de Rubik en un promedio cercano a los <strong>${CONFIG.cubingAverage.replace('~', '')}</strong>. No es un truco de manos: es un sistema de aprendizaje con métricas, repetición deliberada y presión autoimpuesta.</p>
        <div class="stat-row">
          <div class="stat"><span class="stat-value">${CONFIG.cubingAverage}</span><span class="stat-label">Promedio aprox.</span></div>
          <div class="stat"><span class="stat-value">3×3</span><span class="stat-label">Cubo principal</span></div>
          <div class="stat"><span class="stat-value">∞</span><span class="stat-label">Repeticiones</span></div>
        </div>
        <p>El cronómetro no premia la suerte. Un promedio de ${CONFIG.cubingAverage} es el resultado de reconocimiento de patrones, memoria muscular y una rutina que no negocia con el cansancio. Cada solve es una prueba corta: hay un problema, un tiempo y una decisión siguiente.</p>
        <p>Entreno por etapas: identifico el caso, anticipo el paso siguiente (<em>look-ahead</em>) y ejecuto sin pausas. Cuando un tiempo sale mal, no lo ignoro: separo el problema, practico esa parte y vuelvo a medir.</p>
      `
    },
    {
      cls: 'block',
      html: `
        <div class="section-title">Por qué lo cuento en un portafolio de tecnología</div>
        <p>Porque el cubo es un sistema con reglas finitas y un espacio de estados enorme. Resolverlo rápido exige exactamente lo mismo que depurar un sistema embebido: descomponer, observar, medir, corregir y repetir.</p>
        <ul class="bullets">
          <li><strong>Disciplina:</strong> practicar lo que falla, no solo lo que ya sale bien.</li>
          <li><strong>Reconocimiento de patrones:</strong> leer el estado y elegir el siguiente movimiento sin dudar.</li>
          <li><strong>Memoria muscular:</strong> convertir secuencias complejas en respuestas automáticas.</li>
          <li><strong>Perseverancia:</strong> aceptar tiempos malos y volver al siguiente intento.</li>
          <li><strong>Método:</strong> un plan estructurado vence a la improvisación, dentro y fuera del cubo.</li>
        </ul>
        <blockquote class="quote">“La constancia no es repetir: es medir, ajustar y volver a intentarlo.”</blockquote>
      `
    }
  ];

  if (extended) {
    blocks.push({
      cls: 'block',
      html: `
        <div class="panel">
          <div class="panel-title">Transferencia a ingeniería</div>
          <p class="mono-small">Speedcubing me entrenó en algo que ningún tutorial enseña: mantener la calma cuando el patrón no aparece y el reloj sigue corriendo. Esa misma calma la uso cuando un robot no arranca cinco minutos antes de una ronda.</p>
          ${tags(['Disciplina', 'Patrones', 'Look-ahead', 'Perseverancia', 'Método'])}
        </div>
        <div class="media-row">
          ${mediaButton('[ PERFIL WCA ]', CONFIG.media.cubingWca, 'cubingWca')}
          <button type="button" class="term-btn ghost" data-cmd="projects 3">[ FICHA DE PROYECTO ]</button>
          <button type="button" class="term-btn ghost" data-cmd="projects">[ ← ÍNDICE ]</button>
        </div>
      `
    });
  } else {
    blocks.push({
      cls: 'block',
      html: `
        <div class="media-row">
          ${mediaButton('[ PERFIL WCA ]', CONFIG.media.cubingWca, 'cubingWca')}
          <button type="button" class="term-btn ghost" data-cmd="cubing">[ LEER MÁS ]</button>
          <button type="button" class="term-btn ghost" data-cmd="projects">[ ← ÍNDICE ]</button>
        </div>
      `
    });
  }

  return blocks;
}

/* ---------- Tarjeta ASCII del operador ---------- */

function makeOperatorCard(title, rows, width = 50) {
  const border = '+' + '='.repeat(width) + '+';
  const separator = '+' + '='.repeat(width) + '+';
  const titleRow = '|' + centerText(title, width) + '|';
  const body = rows
    .map((row) => '|' + pad(' ' + row, width) + '|')
    .join('\n');
  return [border, titleRow, separator, body, border].join('\n');
}

function authorCardBlocks() {
  const githubText = CONFIG.github.replace(/^https?:\/\//, '');
  const rows = [
    `IDENT  : ${CONFIG.name.toUpperCase()} // @${CONFIG.alias}`,
    'ROL    : MAKER · DEV · FIRST COMPETITOR',
    'BASE   : /home/lucas',
    'STACK  : C/C++ · PYTHON · JAVA · JS',
    'HARD   : AVR · ESP32 · SENSORS · SOLDERING',
    `HOBBY  : SPEEDCUBING ${CONFIG.cubingAverage.toUpperCase()}`,
    'LEMA   : ENTENDER, LUEGO CONSTRUIR',
    `GITHUB : ${githubText}`,
    `EMAIL  : ${CONFIG.email || '[ PENDIENTE ]'}`,
    `LINKED : ${CONFIG.linkedin || '[ PENDIENTE ]'}`
  ];

  const art = makeOperatorCard('OPERATOR CARD', rows, 50);

  return [
    {
      cls: 'block',
      html: `<pre class="ascii card">${esc(art)}</pre>`
    },
    {
      cls: 'block',
      html: `
        <div class="panel">
          <div class="panel-title">Fuera de la pantalla</div>
          <p>Me interesan los sistemas que se pueden tocar: robótica, automatización, firmware, herramientas de desarrollo y diseño mecánico. También el speedcubing, que aparece en este portafolio porque explica bastante de cómo aprendo.</p>
          ${kv([
            ['INTERESES', 'Sistemas embebidos · robótica · automatización · tooling'],
            ['AHORA', 'Nuevos robots, firmware propio y este portafolio'],
            ['ABIERTO A', 'Colaboraciones · competencias · proyectos open source'],
            ['DISPONIBLE', CONFIG.email ? `Email: ${esc(CONFIG.email)}` : 'Canal de contacto pendiente de publicar']
          ])}
        </div>
        <div class="media-row">
          <a class="term-btn" href="${esc(CONFIG.github)}" target="_blank" rel="noopener noreferrer">[ GITHUB ]</a>
          <button type="button" class="term-btn ghost" data-cmd="contact">[ CONTACTO ]</button>
          <button type="button" class="term-btn ghost" data-cmd="about">[ SOBRE MÍ ]</button>
        </div>
      `
    }
  ];
}

/* ---------- Contacto ---------- */

function contactBlocks() {
  const emailValue = CONFIG.email
    ? `<a class="term-link" href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a>`
    : '<span class="dim">[ PENDIENTE — edita CONFIG.email ]</span>';

  const linkedinValue = CONFIG.linkedin
    ? `<a class="term-link" href="${esc(CONFIG.linkedin)}" target="_blank" rel="noopener noreferrer">${esc(CONFIG.linkedin.replace(/^https?:\/\//, ''))}</a>`
    : '<span class="dim">[ PENDIENTE — edita CONFIG.linkedin ]</span>';

  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">CANALES / CONTACTO</div>
        <h3>HABLEMOS DE SISTEMAS</h3>
        <p>Si tienes una idea, un robot que no arranca, un proyecto open source o una competencia en mente, escríbeme. Respondo más rápido de lo que tarda un <em>solve</em>.</p>
        ${kv([
          ['GITHUB', `<a class="term-link" href="${esc(CONFIG.github)}" target="_blank" rel="noopener noreferrer">${esc(CONFIG.github.replace(/^https?:\/\//, ''))}</a>`],
          ['EMAIL', emailValue],
          ['LINKEDIN', linkedinValue],
          ['DISPONIBILIDAD', 'Colaboraciones · competencias · proyectos open source']
        ])}
      `
    },
    {
      cls: 'block',
      html: `
        <div class="panel">
          <div class="panel-title">Protocolo sugerido</div>
          <ul class="bullets">
            <li>Cuéntame qué intentas construir y qué está fallando.</li>
            <li>Si es un proyecto, adjunta repositorio, fotos o video.</li>
            <li>Si es una competencia, indica categoría y fechas.</li>
          </ul>
        </div>
        <div class="line dim mono-small">Los campos marcados como pendientes se configuran en <span class="hl">CONFIG</span> (script.js).</div>
      `
    }
  ];
}

/* ---------- Ayuda ---------- */

function helpBlocks() {
  const rows = COMMAND_META.map((command) => {
    const usage = command.usage ? `<span class="dim"> ${command.usage}</span>` : '';
    return `<span class="cmd">${command.name}${usage}</span><span class="desc">${command.desc}</span>`;
  }).join('');

  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">COMANDOS DISPONIBLES <span class="dim">// ${COMMAND_META.length}</span></div>
        <div class="cmd-list">${rows}</div>
        <div class="line dim mono-small">
          <span class="bright">TAB</span> autocompleta ·
          <span class="bright">↑ ↓</span> recorre el historial ·
          <span class="bright">ENTER</span> ejecuta o salta la animación ·
          <span class="bright">CTRL+L</span> limpia
        </div>
        <div class="line dim mono-small">Alias útiles: <span class="hl">proj</span> → projects · <span class="hl">nombre</span> → autor · <span class="hl">cls</span> → clear.</div>
      `
    }
  ];
}

/* ---------- Neofetch ---------- */

function uptimeString() {
  const total = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function neofetchBlocks() {
  const logo = [
    '+--------------+',
    '|  >_          |',
    '|              |',
    '|  LU92123     |',
    '+--------------+'
  ].join('\n');

  return [
    {
      cls: 'block',
      html: `
        <div class="fetch">
          <pre class="ascii">${logo}</pre>
          ${kv([
            ['HOST', 'VT-100 · Phosphor Terminal'],
            ['OS', 'PhosphorOS 1.0 (vanilla)'],
            ['KERNEL', 'js-vanilla'],
            ['SHELL', 'guest-sh 1.0'],
            ['UPTIME', uptimeString()],
            ['THEME', themeInfo().long],
            ['CRT', state.crt ? 'ON · scanlines + glow' : 'OFF · sharp mode'],
            ['RES', '80×24 · 9600 8N1'],
            ['COMANDOS', `${state.commandCount}`]
          ], 'fetch-info')}
        </div>
      `
    },
    {
      cls: 'line dim mono-small',
      html: `Servidor local · sin frameworks · sin cookies · solo JavaScript y fósforo.`
    }
  ];
}

/* ---------- Easter eggs ---------- */

function sudoBlocks(args) {
  if (args.join(' ').toLowerCase().includes('make me a sandwich')) {
    return [
      {
        cls: 'block',
        html: `
          <div class="eyebrow">SUDO / SANDWICH PROTOCOL</div>
          <p class="lead">Request received. Consulting the kitchen.</p>
          <pre class="ascii">   .-""""""-.
  /          \\
 |  [======]  |
  \\          /
   '-......-'</pre>
          <p class="dim">El protocolo retro exige ASCII puro. Operación cancelada.</p>
          <p>Intenta con: <span class="hl">sudo apt install sandwich</span></p>
        `
      }
    ];
  }

  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">SUDO / CONTROL DE PRIVILEGIOS</div>
        <p class="dim">[sudo] password for guest: <span class="faint">************</span></p>
        <p class="warn">guest is not in the sudoers file. This incident has been reported.</p>
        <pre class="ascii">    __
  &lt;(o )___
   ( ._&gt; /
    &#96;---'</pre>
        <p class="dim">El único privilegio real en esta terminal es escribir <button type="button" class="term-btn ghost" data-cmd="help">help</button> y seguir explorando.</p>
        <p class="mono-small">Si necesitas root, primero demuestra que sabes qué vas a romper.</p>
      `
    }
  ];
}

function exitBlocks() {
  return [
    {
      cls: 'block',
      html: `
        <div class="eyebrow">LOGOUT</div>
        <p class="lead">logout: esta terminal no tiene salida.</p>
        <p class="dim">La sesión permanece abierta. Puedes cerrar la pestaña, pero el fósforo se va a quedar encendido un rato.</p>
        <p>Alternativas: <button type="button" class="term-btn ghost" data-cmd="clear">clear</button> <button type="button" class="term-btn ghost" data-cmd="matrix">matrix</button></p>
      `
    }
  ];
}

/* ============================================================
   COMANDOS
   ============================================================ */

const COMMAND_META = [
  { name: 'help', aliases: ['ayuda', '?'], desc: 'Muestra esta lista de comandos.', usage: '' },
  { name: 'about', aliases: ['acerca', 'info'], desc: 'Perfil, enfoque y filosofía de trabajo.', usage: '' },
  { name: 'projects', aliases: ['proj', 'proyectos'], desc: 'Índice y detalle de proyectos.', usage: '[1-3]' },
  { name: 'cubing', aliases: ['cube', 'rubik'], desc: 'Speedcubing: método, disciplina y mentalidad.', usage: '' },
  { name: 'theme', aliases: ['fosforo'], desc: 'Cambia el fósforo de la pantalla.', usage: '[amber|green|mono]' },
  { name: 'crt', aliases: ['scanlines'], desc: 'Activa o desactiva el efecto CRT.', usage: '[on|off]' },
  { name: 'matrix', aliases: ['neo'], desc: 'Lluvia digital durante unos segundos.', usage: '' },
  { name: 'clear', aliases: ['cls', 'limpiar'], desc: 'Limpia la pantalla.', usage: '' },
  { name: 'autor', aliases: ['nombre', 'author'], desc: 'Tarjeta ASCII del operador.', usage: '' },
  { name: 'contact', aliases: ['contacto'], desc: 'Canales de contacto.', usage: '' },
  { name: 'neofetch', aliases: ['fetch', 'sysinfo'], desc: 'Ficha del sistema y del operador.', usage: '' },
  { name: 'date', aliases: ['fecha'], desc: 'Fecha y hora del sistema.', usage: '' },
  { name: 'whoami', aliases: ['who'], desc: 'Identidad de la sesión actual.', usage: '' },
  { name: 'history', aliases: ['hist'], desc: 'Historial de comandos de esta sesión.', usage: '' },
  { name: 'ls', aliases: ['dir'], desc: 'Lista los archivos del directorio.', usage: '' },
  { name: 'cat', aliases: ['type'], desc: 'Lee un archivo del sistema.', usage: '<archivo>' },
  { name: 'echo', aliases: ['print'], desc: 'Repite el texto recibido.', usage: '<texto>' },
  { name: 'banner', aliases: ['logo'], desc: 'Vuelve a imprimir el banner de inicio.', usage: '' },
  { name: 'sudo', aliases: ['root'], desc: 'Intenta elevar privilegios. Spoiler: no.', usage: '[comando]' },
  { name: 'exit', aliases: ['logout', 'quit'], desc: 'Intenta cerrar la sesión.', usage: '' }
];

const ALIAS_MAP = Object.create(null);
COMMAND_META.forEach((command) => {
  ALIAS_MAP[command.name] = command.name;
  command.aliases.forEach((alias) => { ALIAS_MAP[alias] = command.name; });
});

const COMMAND_NAMES = COMMAND_META.map((command) => command.name);

const ARG_COMPLETIONS = {
  projects: ['1', '2', '3'],
  theme: ['amber', 'green', 'mono'],
  crt: ['on', 'off']
};

function swatchesBlock() {
  const items = THEME_ORDER.map((name) => {
    const info = THEMES[name];
    const active = state.theme === name ? ' active' : '';
    return `<span class="swatch-item${active}"><span class="swatch swatch-${name}"></span>${name} · ${info.label}</span>`;
  }).join('');

  return { cls: 'block', html: `<div class="swatches">${items}</div>` };
}

async function handleHelp() {
  await respond(helpBlocks());
}

async function handleAbout() {
  await respond(aboutBlocks());
}

async function handleProjects(args) {
  const target = (args[0] || '').toLowerCase();

  if (!target) {
    await respond(projectsIndexBlocks());
    return;
  }

  if (['1', 'first', 'ftc', 'frc'].includes(target)) {
    await respond(projectFirstBlocks());
    return;
  }

  if (['2', 'probot', 'probot-school', 'local'].includes(target)) {
    await respond(projectProbotBlocks());
    return;
  }

  if (['3', 'cubing', 'rubik', 'speedcubing'].includes(target)) {
    await respond(cubingBlocks(false));
    return;
  }

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">PROYECTOS / ERROR</div>
        <p><span class="warn">projects:</span> índice desconocido: <span class="hl">${esc(args[0])}</span></p>
        <p class="dim">Opciones válidas:</p>
        <div class="media-row">
          <button type="button" class="term-btn ghost" data-cmd="projects 1">[ 01 · FIRST ]</button>
          <button type="button" class="term-btn ghost" data-cmd="projects 2">[ 02 · PROBOT ]</button>
          <button type="button" class="term-btn ghost" data-cmd="projects 3">[ 03 · CUBING ]</button>
          <button type="button" class="term-btn ghost" data-cmd="projects">[ ÍNDICE ]</button>
        </div>
      `
    }
  ]);
}

async function handleCubing() {
  await respond(cubingBlocks(true));
}

async function handleTheme(args) {
  let target;

  if (args.length) {
    target = parseThemeArg(args[0]);
    if (!target) {
      await respond([
        {
          cls: 'block',
          html: `
            <div class="eyebrow">TEMA / ERROR</div>
            <p><span class="warn">theme:</span> valor desconocido: <span class="hl">${esc(args[0])}</span></p>
            <p class="dim">Usa <span class="hl">theme amber</span>, <span class="hl">theme green</span> o <span class="hl">theme mono</span>.</p>
          `
        }
      ]);
      return;
    }
  } else {
    target = cycleTheme();
  }

  applyTheme(target, { announce: true });

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">TEMA DE FÓSFORO</div>
        <p class="lead">${themeInfo(target).long} <span class="dim">// ACTIVO</span></p>
        ${swatchesBlock().html}
        <p class="dim mono-small">El tema se guarda en este navegador. Uso: <span class="hl">theme [amber|green|mono]</span>.</p>
      `
    }
  ]);
}

async function handleCrt(args) {
  let target = !state.crt;

  if (args.length) {
    const value = args[0].toLowerCase();
    if (['on', '1', 'true', 'si', 'sí', 'yes'].includes(value)) target = true;
    else if (['off', '0', 'false', 'no'].includes(value)) target = false;
    else {
      await respond([
        {
          cls: 'block',
          html: `
            <div class="eyebrow">CRT / ERROR</div>
            <p><span class="warn">crt:</span> valor desconocido: <span class="hl">${esc(args[0])}</span></p>
            <p class="dim">Usa <span class="hl">crt on</span> o <span class="hl">crt off</span>. Sin argumentos, alterna el estado.</p>
          `
        }
      ]);
      return;
    }
  }

  setCrt(target, { announce: true });

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">EFECTO CRT</div>
        <p class="lead">CRT EFFECT: <span class="hl">${state.crt ? 'ON' : 'OFF'}</span></p>
        ${kv([
          ['SCANLINES', state.crt ? 'ENGAGED' : 'DISABLED'],
          ['CURVATURA', state.crt ? 'SIMULADA' : 'PLANA'],
          ['FÓSFORO', state.crt ? 'GLOW + FLICKER' : 'NITIDEZ TOTAL'],
          ['PERSISTENCIA', 'LOCAL · ESTE NAVEGADOR']
        ])}
        <p class="dim mono-small">${state.crt ? 'El monitor vuelve a sentirse como un tubo de verdad.' : 'Modo legible: sin líneas, sin brillo, sin nostalgia.'}</p>
      `
    }
  ]);
}

async function handleMatrix() {
  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">MATRIX PROTOCOL</div>
        <p class="lead">Despertando la lluvia digital...</p>
        <p class="dim mono-small">7 segundos. Cualquier tecla o clic para salir.</p>
      `,
      pause: 220
    }
  ]);

  startMatrix();
}

function clearScreen() {
  outputEl.innerHTML = '';
  scrollEl.scrollTop = 0;
  showToast('PANTALLA LIMPIA');
  setMode('READY');
}

async function handleSudo(args) {
  await respond(sudoBlocks(args));
}

async function handleAuthor() {
  await respond(authorCardBlocks());
}

async function handleContact() {
  await respond(contactBlocks());
}

async function handleNeofetch() {
  await respond(neofetchBlocks());
}

async function handleDate() {
  const now = new Date();
  const dateText = now.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
  const timeText = now.toLocaleTimeString('es-AR', { hour12: false });
  let timezone = 'local';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; } catch (e) { /* noop */ }

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">SISTEMA / RELOJ</div>
        ${kv([
          ['FECHA', esc(dateText)],
          ['HORA', `<span class="bright">${esc(timeText)}</span>`],
          ['ZONA', esc(timezone)],
          ['ÉPOCA', String(Math.floor(now.getTime() / 1000))]
        ])}
        <p class="dim mono-small">El fósforo no entiende de zonas horarias, pero JavaScript sí.</p>
      `
    }
  ]);
}

async function handleWhoami() {
  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">IDENTIDAD</div>
        <p><span class="hl">guest</span> (${esc(CONFIG.name)}) · uid=1000(guest) gid=1000(makers)</p>
        <p class="dim">groups=first, robotics, embedded, cubing, problem-solving</p>
      `
    }
  ]);
}

async function handleHistory() {
  if (!state.history.length) {
    await respond([
      { cls: 'line dim', html: 'Sin comandos todavía. El historial empieza con el primer ENTER.' }
    ]);
    return;
  }

  const rows = state.history.map((command, index) => {
    const number = String(index + 1).padStart(2, '0');
    return `<div><span class="dim">${number}</span>  ${esc(command)}</div>`;
  }).join('');

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">HISTORIAL DE SESIÓN <span class="dim">// ${state.history.length}</span></div>
        <div class="mono-small">${rows}</div>
        <p class="dim mono-small">Usa ↑ y ↓ en el prompt para recorrerlo.</p>
      `
    }
  ]);
}

async function handleLs() {
  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">/HOME/LUCAS</div>
        <div class="media-row">
          <button type="button" class="term-btn ghost" data-cmd="cat about.md">about.md</button>
          <button type="button" class="term-btn ghost" data-cmd="cat cubing.md">cubing.md</button>
          <button type="button" class="term-btn ghost" data-cmd="projects">projects/</button>
          <button type="button" class="term-btn ghost" data-cmd="cat contact.txt">contact.txt</button>
          <button type="button" class="term-btn ghost" data-cmd="cat .secrets">.secrets</button>
        </div>
        <p class="dim mono-small">5 entradas · 1 oculta · permisos de solo lectura</p>
      `
    }
  ]);
}

async function handleCat(args) {
  const raw = (args[0] || '').toLowerCase().replace(/\/+$/, '');

  if (!raw) {
    await respond([
      { cls: 'line', html: '<span class="warn">cat:</span> falta el nombre del archivo. Uso: <span class="hl">cat about.md</span>' }
    ]);
    return;
  }

  if (raw === 'about.md') {
    await respond([
      {
        cls: 'block',
        html: `
          <div class="eyebrow">CAT / ABOUT.MD</div>
          <p class="lead">Lucas · @${esc(CONFIG.alias)}</p>
          <p>Maker y desarrollador enfocado en sistemas embebidos, robótica y software de bajo nivel. ${CONFIG.firstSeasons} temporadas en FIRST (FTC/FRC) y robots de competición en Probot School.</p>
          <p class="dim mono-small">Método: entender → medir → construir → iterar.</p>
          <button type="button" class="term-btn ghost" data-cmd="about">[ ABRIR PERFIL COMPLETO ]</button>
        `
      }
    ]);
    return;
  }

  if (raw === 'cubing.md') {
    await respond([
      {
        cls: 'block',
        html: `
          <div class="eyebrow">CAT / CUBING.MD</div>
          <p class="lead">Speedcubing · ${esc(CONFIG.cubingAverage)} de promedio</p>
          <p>Disciplina, reconocimiento de patrones y repetición deliberada. Un laboratorio portátil de aprendizaje.</p>
          <button type="button" class="term-btn ghost" data-cmd="cubing">[ LEER COMPLETO ]</button>
        `
      }
    ]);
    return;
  }

  if (raw === 'contact.txt' || raw === 'contact.md') {
    await respond(contactBlocks());
    return;
  }

  if (raw === '.secrets') {
    await respond([
      {
        cls: 'block',
        html: `
          <div class="eyebrow">CAT / .SECRETS</div>
          <p class="warn">cat: .secrets: Permission denied</p>
          <p class="dim">Buen intento. La contraseña no está escondida en el código fuente... o eso diría el código fuente.</p>
          <p class="mono-small">Prueba con <button type="button" class="term-btn ghost" data-cmd="sudo">sudo</button> y observa cómo termina.</p>
        `
      }
    ]);
    return;
  }

  if (raw === 'projects') {
    await respond([
      { cls: 'line', html: '<span class="warn">cat:</span> projects: Is a directory. Usa <button type="button" class="term-btn ghost" data-cmd="projects">projects</button>.' }
    ]);
    return;
  }

  await respond([
    { cls: 'line', html: `<span class="warn">cat:</span> ${esc(args[0])}: No such file or directory` }
  ]);
}

async function handleEcho(args) {
  const text = args.join(' ');
  await respond([
    { cls: 'line', html: text ? esc(text) : '<span class="dim">(nada que repetir)</span>' }
  ]);
}

async function handleBanner() {
  await respond([
    bannerBlock(),
    {
      cls: 'line dim mono-small',
      html: `Sistema listo · <button type="button" class="term-btn ghost" data-cmd="help">help</button> para los comandos · <button type="button" class="term-btn ghost" data-cmd="about">about</button> para el operador.`
    }
  ]);
}

async function handleExit() {
  await respond(exitBlocks());
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function closestCommand(input) {
  let best = null;
  let bestDistance = Infinity;

  COMMAND_NAMES.forEach((name) => {
    const distance = levenshtein(input, name);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  });

  return bestDistance <= 2 ? best : null;
}

async function handleUnknown(line, command) {
  const suggestion = closestCommand(command.toLowerCase());
  const suggestionHtml = suggestion
    ? `<p class="dim">¿Quisiste decir <button type="button" class="term-btn ghost" data-cmd="${esc(suggestion)}">${esc(suggestion)}</button>?</p>`
    : '';

  if (/^rm\s+-rf/.test(line) || /^del\s+\/f/i.test(line)) {
    await respond([
      {
        cls: 'block',
        html: `
          <div class="eyebrow">OPERACIÓN BLOQUEADA</div>
          <p class="warn">rm -rf detectado. Esta terminal es de solo lectura.</p>
          <p class="dim">Además, borrar el portafolio sería un mal primer commit.</p>
          <pre class="ascii">    (╯°□°）╯︵ ┻━┻</pre>
        `
      }
    ]);
    return;
  }

  await respond([
    {
      cls: 'block',
      html: `
        <div class="eyebrow">COMANDO NO RECONOCIDO</div>
        <p><span class="warn">command not found:</span> <span class="hl">${esc(command)}</span></p>
        ${suggestionHtml}
        <p class="dim">Escribe <button type="button" class="term-btn ghost" data-cmd="help">help</button> para ver los comandos disponibles.</p>
      `
    }
  ]);
}

const COMMAND_HANDLERS = {
  help: () => handleHelp(),
  about: () => handleAbout(),
  projects: (args) => handleProjects(args),
  cubing: () => handleCubing(),
  theme: (args) => handleTheme(args),
  crt: (args) => handleCrt(args),
  matrix: () => handleMatrix(),
  clear: () => { clearScreen(); return Promise.resolve(); },
  autor: () => handleAuthor(),
  contact: () => handleContact(),
  neofetch: () => handleNeofetch(),
  date: () => handleDate(),
  whoami: () => handleWhoami(),
  history: () => handleHistory(),
  ls: () => handleLs(),
  cat: (args) => handleCat(args),
  echo: (args) => handleEcho(args),
  banner: () => handleBanner(),
  sudo: (args) => handleSudo(args),
  exit: () => handleExit()
};

/* ============================================================
   EJECUCIÓN E INTERACCIÓN
   ============================================================ */

async function executeCommand(raw) {
  const line = String(raw).trim();
  echoCommand(raw);
  state.skipRequested = false;

  if (!line) return;

  setBusy(true);
  state.commandCount += 1;

  const parts = line.split(/\s+/);
  const typed = parts[0].toLowerCase();
  const canonical = ALIAS_MAP[typed];

  try {
    if (!canonical || !COMMAND_HANDLERS[canonical]) {
      await handleUnknown(line, typed);
      return;
    }
    await COMMAND_HANDLERS[canonical](parts.slice(1), line);
  } finally {
    state.skipRequested = false;
    setBusy(false);
    focusInput();
  }
}

function pushHistory(command) {
  if (!command) return;
  if (state.history[state.history.length - 1] !== command) {
    state.history.push(command);
  }
  if (state.history.length > 100) state.history.shift();
  state.histIndex = state.history.length;
  state.draft = '';
}

function submitInput() {
  if (state.busy || state.simulating || state.booting) return;

  const raw = inputEl.value;
  inputEl.value = '';
  updateCaret();

  const trimmed = raw.trim();
  if (trimmed) pushHistory(trimmed);

  enqueue(() => executeCommand(raw));
}

function navigateHistory(direction) {
  if (!state.history.length || state.simulating || state.booting) return;

  if (direction < 0) {
    if (state.histIndex === state.history.length) {
      state.draft = inputEl.value;
    }
    if (state.histIndex > 0) state.histIndex -= 1;
  } else if (state.histIndex < state.history.length) {
    state.histIndex += 1;
  }

  const next = state.histIndex === state.history.length
    ? state.draft
    : state.history[state.histIndex];

  setInputValue(next);
}

function longestCommonPrefix(values) {
  if (!values.length) return '';
  let prefix = values[0];
  values.slice(1).forEach((value) => {
    while (!value.startsWith(prefix) && prefix.length) {
      prefix = prefix.slice(0, -1);
    }
  });
  return prefix;
}

function printCompletionHint(matches) {
  appendInstant({
    cls: 'line dim mono-small',
    html: `completar: ${matches.map((match) => `<span class="hl">${esc(match)}</span>`).join(' · ')}`
  });
}

function autocomplete() {
  if (state.simulating || state.matrixActive || state.booting) return;

  const raw = inputEl.value;
  const value = raw.replace(/^\s+/, '');

  if (!value) {
    printCompletionHint(COMMAND_NAMES);
    return;
  }

  const firstSpace = value.search(/\s/);

  if (firstSpace === -1) {
    const query = value.toLowerCase();
    const matches = COMMAND_NAMES.filter((name) => name.startsWith(query));

    if (!matches.length) {
      showToast('SIN COINCIDENCIAS');
      return;
    }

    if (matches.length === 1) {
      setInputValue(`${matches[0]} `);
      return;
    }

    const common = longestCommonPrefix(matches);
    if (common.length > query.length) {
      setInputValue(common);
    } else {
      printCompletionHint(matches);
    }
    return;
  }

  const parts = value.split(/\s+/);
  const typed = parts[0].toLowerCase();
  const canonical = ALIAS_MAP[typed];
  const options = canonical ? ARG_COMPLETIONS[canonical] : null;

  if (!options) return;

  const trailingSpace = /\s$/.test(value);
  const current = trailingSpace ? '' : parts[parts.length - 1];
  const matches = options.filter((option) => option.startsWith(current.toLowerCase()));

  if (!matches.length) {
    showToast('SIN COINCIDENCIAS');
    return;
  }

  if (matches.length === 1) {
    const base = trailingSpace ? value : value.slice(0, value.length - current.length);
    setInputValue(`${base}${matches[0]}`);
    return;
  }

  const common = longestCommonPrefix(matches);
  if (common.length > current.length) {
    const base = trailingSpace ? value : value.slice(0, value.length - current.length);
    setInputValue(`${base}${common}`);
  } else {
    printCompletionHint(matches);
  }
}

/* ---------- Caret personalizado ---------- */

function updateCaret() {
  const value = inputEl.value;
  const position = typeof inputEl.selectionStart === 'number'
    ? inputEl.selectionStart
    : value.length;

  mirrorEl.textContent = value.slice(0, position);
  const width = mirrorEl.getBoundingClientRect().width;
  const offset = width - (inputEl.scrollLeft || 0);
  caretEl.style.left = `${Math.max(0, offset)}px`;
}

function scheduleCaret() {
  requestAnimationFrame(updateCaret);
}

function setInputValue(value) {
  inputEl.value = value;
  inputEl.setSelectionRange(value.length, value.length);
  updateCaret();
}

function focusInput() {
  if (state.matrixActive) return;
  try {
    inputEl.focus({ preventScroll: true });
  } catch (e) {
    inputEl.focus();
  }
}

/* ---------- Simulación de tipeo desde la barra de comandos ---------- */

async function simulateCommand(command) {
  if (state.matrixActive) return;

  state.simulating = true;
  state.simCancel = false;
  inputEl.readOnly = true;
  setBusy(true);
  setMode('TECLEANDO');
  setTx('TX COMMAND');
  setInputValue('');
  focusInput();

  const characters = [...command];
  for (const character of characters) {
    if (state.simCancel) break;
    inputEl.value += character;
    updateCaret();
    pulseLed();
    await sleep(reducedMotion.matches ? 0 : 42);
  }

  setInputValue(command);
  await sleep(reducedMotion.matches ? 0 : 130);

  inputEl.value = '';
  updateCaret();
  state.simulating = false;
  state.simCancel = false;
  inputEl.readOnly = false;

  pushHistory(command);
  await executeCommand(command);
}

function runCommandFromUI(command) {
  if (!command || state.booting || state.matrixActive || state.simulating) return;
  if (state.busy) state.skipRequested = true;
  enqueue(() => simulateCommand(command));
}

/* ---------- Recursos pendientes (placeholders) ---------- */

const TODO_LABELS = {
  firstPhotos: 'fotos / video de FIRST',
  firstGithub: 'repositorio de FIRST',
  probotPhotos: 'fotos / video de Probot School',
  probotGithub: 'repositorio de Probot School',
  cubingWca: 'perfil WCA de speedcubing'
};

function handleTodo(key) {
  if (state.booting || state.matrixActive) return;
  if (state.busy) state.skipRequested = true;

  const label = TODO_LABELS[key] || 'recurso';

  enqueue(async () => {
    setBusy(true);
    await respond([
      {
        cls: 'block',
        html: `
          <div class="eyebrow">RECURSO PENDIENTE</div>
          <p>El enlace para <span class="hl">${esc(label)}</span> todavía no está publicado.</p>
          <p class="dim mono-small">Vuelve pronto. Mientras tanto puedes explorar el resto del proyecto.</p>
          <div class="media-row">
            <a class="term-btn" href="${esc(CONFIG.github)}" target="_blank" rel="noopener noreferrer">[ GITHUB ]</a>
            <button type="button" class="term-btn ghost" data-cmd="projects">[ PROYECTOS ]</button>
          </div>
        `
      }
    ]);
    setBusy(false);
    focusInput();
  });
}

/* ============================================================
   MATRIX
   ============================================================ */

function startMatrix() {
  if (state.matrixActive) return;

  if (reducedMotion.matches) {
    showToast('MATRIX OMITIDO · PREFERS-REDUCED-MOTION');
    return;
  }

  const ctx = matrixCanvas.getContext('2d');
  if (!ctx) {
    showToast('CANVAS NO DISPONIBLE');
    return;
  }

  state.matrixActive = true;
  docEl.classList.add('matrix-on');
  inputEl.blur();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fontSize = window.innerWidth < 640 ? 14 : 17;
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/\\\\[]{}#$%&*+=LU92123';
  const fg = getComputedStyle(docEl).getPropertyValue('--fg').trim() || '#ffb000';
  const duration = 7000;
  const startedAt = performance.now();

  let width = 0;
  let height = 0;
  let columns = 0;
  let drops = [];
  let rafId = 0;
  let timerId = 0;
  let lastFrame = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    matrixCanvas.width = Math.max(1, Math.floor(width * dpr));
    matrixCanvas.height = Math.max(1, Math.floor(height * dpr));
    matrixCanvas.style.width = `${width}px`;
    matrixCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.max(1, Math.floor(width / fontSize));
    drops = Array.from({ length: columns }, () => Math.random() * -60);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }

  function stop(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!state.matrixActive) return;

    state.matrixActive = false;
    docEl.classList.remove('matrix-on');
    cancelAnimationFrame(rafId);
    clearTimeout(timerId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', stop, true);
    matrixCanvas.removeEventListener('pointerdown', stop);
    showToast('MATRIX // FIN DE TRANSMISIÓN');
    if (finePointer.matches) focusInput();
  }

  function draw(now) {
    if (!state.matrixActive) return;

    if (now - lastFrame > 42) {
      lastFrame = now;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';

      for (let column = 0; column < columns; column += 1) {
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = column * fontSize;
        const y = drops[column] * fontSize;

        if (Math.random() > 0.975) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = fg;
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = fg;
          ctx.shadowBlur = 0;
        }

        ctx.fillText(glyph, x, y);

        if (y > height && Math.random() > 0.972) {
          drops[column] = 0;
        }
        drops[column] += 1;
      }
      ctx.shadowBlur = 0;
    }

    if (now - startedAt > duration) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('keydown', stop, true);
  matrixCanvas.addEventListener('pointerdown', stop);
  timerId = window.setTimeout(() => stop(), duration + 200);
  rafId = requestAnimationFrame(draw);
}

/* ============================================================
   BOOT + EVENTOS
   ============================================================ */

async function bootSequence() {
  state.booting = true;
  inputEl.readOnly = true;
  inputEl.placeholder = 'inicializando…';
  setMode('BOOTING');
  setTx('BOOT SEQ');

  await respond([
    {
      cls: 'line mono-small',
      html: `<span class="dim">[ 0.000 ]</span> VT-100 TERMINAL ........ <span class="ok">READY</span>`
    },
    {
      cls: 'line mono-small tight',
      html: `<span class="dim">[ 0.084 ]</span> PHOSPHOR P1 ............ <span class="ok">100%</span>`
    },
    {
      cls: 'line mono-small tight',
      html: `<span class="dim">[ 0.211 ]</span> MEMORY CHECK ........... <span class="ok">640K OK</span>`
    },
    {
      cls: 'line mono-small tight',
      html: `<span class="dim">[ 0.348 ]</span> OPERATOR PROFILE ....... <span class="ok">${esc(CONFIG.alias)}</span>`
    },
    {
      cls: 'line mono-small tight',
      html: `<span class="dim">[ 0.472 ]</span> CARTRIDGE BUS .......... <span class="ok">READY</span>`,
      pause: 220
    },
    bannerBlock(),
    {
      cls: 'line',
      html: `<span class="bright">Bienvenido al portafolio de ${esc(CONFIG.name)}.</span>`
    },
    {
      cls: 'line dim',
      html: `Escribe <span class="hl">help</span> para ver los comandos, o usa la barra superior. <span class="dim">TAB autocompleta · ↑↓ historial.</span>`,
      pause: 120
    }
  ]);

  state.booting = false;
  inputEl.readOnly = false;
  inputEl.placeholder = 'help';
  state.skipRequested = false;
  setBusy(false);
  setMode('READY');
  updateCaret();

  if (finePointer.matches) {
    window.setTimeout(focusInput, 180);
  }
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour12: false });
  clockEl.textContent = time;
  clockEl.setAttribute('datetime', now.toISOString());
}

function bindEvents() {
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.busy && !state.simulating && !state.booting) submitInput();
  });

  document.addEventListener('keydown', (event) => {
    if (!state.booting) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      state.skipRequested = true;
    }
  }, true);

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (state.matrixActive) return;

      if (state.booting) {
        state.skipRequested = true;
        return;
      }

      if (state.simulating) {
        state.simCancel = true;
        return;
      }

      if (state.busy) {
        state.skipRequested = true;
        return;
      }

      submitInput();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (!state.busy && !state.booting) autocomplete();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigateHistory(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateHistory(1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setInputValue('');
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      if (state.busy) state.skipRequested = true;
      clearScreen();
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      if (state.busy) state.skipRequested = true;
      appendInstant({
        cls: 'line',
        html: `<span class="prompt-echo">guest@system:~$</span> ^C`
      });
      setInputValue('');
    }
  });

  inputEl.addEventListener('input', () => {
    scheduleCaret();
  });

  inputEl.addEventListener('keyup', scheduleCaret);
  inputEl.addEventListener('click', scheduleCaret);
  inputEl.addEventListener('select', scheduleCaret);
  inputEl.addEventListener('scroll', scheduleCaret);
  inputEl.addEventListener('focus', scheduleCaret);

  crtToggleEl.addEventListener('click', () => {
    setCrt(!state.crt, { announce: true });
  });

  terminalEl.addEventListener('click', (event) => {
    if (event.target.closest('button, a, input, .project-card, .term-btn')) return;
    if (String(window.getSelection())) return;
    focusInput();
  });

  document.addEventListener('click', (event) => {
    const commandButton = event.target.closest('[data-cmd]');
    if (commandButton) {
      event.preventDefault();
      runCommandFromUI(commandButton.getAttribute('data-cmd'));
      return;
    }

    const todoButton = event.target.closest('[data-todo]');
    if (todoButton) {
      event.preventDefault();
      handleTodo(todoButton.getAttribute('data-todo'));
    }
  });

  window.addEventListener('resize', scheduleCaret);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !state.matrixActive) scheduleCaret();
  });
}

function init() {
  const initialTheme = normalizeTheme(
    storageGet('vt-theme') || docEl.getAttribute('data-theme')
  );
  applyTheme(initialTheme);

  const savedCrt = storageGet('vt-crt');
  const initialCrt = savedCrt ? savedCrt !== 'off' : !docEl.classList.contains('crt-off');
  setCrt(initialCrt, { kick: false });

  updateClock();
  window.setInterval(updateClock, 1000);

  yearEl.textContent = String(new Date().getFullYear());

  bindEvents();
  updateCaret();
  bootSequence();
}

init();




