/* ======= Util ======= */
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

let reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ======= Canvas: estrellas ======= */
const starCanvas = qs("#stars");
const ctx = starCanvas.getContext("2d");
let stars = [],
  rafId = null;

function resizeCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  if (!reduceMotion) initStars();
}
function initStars() {
  const { width, height } = starCanvas;
  const count = Math.round((width * height) / 9000); // densidad
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.2 + 0.3,
    a: Math.random() * 0.7 + 0.1,
    v: Math.random() * 0.5 + 0.2,
  }));
}
function drawStars(ts) {
  const { width, height } = starCanvas;
  ctx.clearRect(0, 0, width, height);
  for (const s of stars) {
    s.a += s.v / 100;
    const twinkle = (Math.sin(s.a) + 1) / 2; // 0..1
    ctx.globalAlpha = twinkle;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  rafId = requestAnimationFrame(drawStars);
}

/* ======= Parallax ======= */
const parallaxEls = qsa(".parallax");
function handleParallax(e) {
  const x = e.clientX / window.innerWidth - 0.5;
  const y = e.clientY / window.innerHeight - 0.5;
  for (const el of parallaxEls) {
    const depth = parseFloat(el.dataset.depth || "0.05");
    const tx = -x * 40 * depth;
    const ty = -y * 30 * depth;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }
}

/* ======= Escaneo de ruta ======= */
const scanner = qs("#scanner");
const scanBtn = qs("#scan");
const scanPct = qs("#scan-pct");
const scanStatus = qs("#scan-status");
let scanning = false,
  progress = 0;

function startScan() {
  if (scanning) return;
  scanning = true;
  progress = 0;
  scanner.hidden = false;
  scanner.classList.remove("done");
  scanBtn.setAttribute("aria-expanded", "true");
  tickScan();
}
function tickScan() {
  progress += Math.random() * 6 + 1.5; // velocidad variable
  progress = clamp(progress, 0, 100);
  scanPct.textContent = `${progress.toFixed(0)}%`;
  qs(".scanner__bar").style.setProperty("--w", progress + "%");
  qs(
    ".scanner__bar"
  ).style.background = `linear-gradient(90deg, #1b2440 ${Math.max(
    0,
    progress - 1
  )}%, #25d366 ${progress}%, #1b2440 ${progress + 1}%)`;
  qs(".scanner__bar").setAttribute("aria-valuenow", progress.toFixed(0));

  if (progress < 100) {
    scanStatus.textContent =
      progress > 66
        ? "Triangulando satélites de retorno…"
        : progress > 33
        ? "Analizando terreno marciano…"
        : "Iniciando escaneo de coordenadas…";
    setTimeout(tickScan, 120);
  } else {
    scanStatus.textContent = "Ruta encontrada. Pulsa para volver a casa.";
    scanner.classList.add("done");
    scanBtn.textContent = "🚀 Regresar ahora";
    scanBtn.classList.remove("accent");
    scanBtn.classList.add("primary");
    scanBtn.onclick = () => window.location.assign("/");
    scanning = false;
  }
}

/* ======= Rover: luces ======= */
const rover = qs(".rover");
const toggleLightsBtn = qs("#toggle-lights");
function toggleLights() {
  const off = rover.classList.toggle("rover--lights-off");
  toggleLightsBtn.setAttribute("aria-pressed", (!off).toString());
}

/* ======= Atajos ======= */
function handleShortcuts(e) {
  const key = e.key.toLowerCase();
  if (key === "h") {
    window.location.assign("/");
  }
  if (key === "r") {
    toggleLights();
  }
  if (key === "c") {
    toggleContrast();
  }
  if (key === "m") {
    toggleMotion();
  }
}

/* ======= Alto contraste y movimiento ======= */
const root = document.documentElement;
const contrastBtn = qs("#toggle-contrast");
const motionBtn = qs("#toggle-motion");

function toggleContrast() {
  root.classList.toggle("high-contrast");
  const pressed = root.classList.contains("high-contrast");
  contrastBtn.setAttribute("aria-pressed", pressed.toString());
  localStorage.setItem("high-contrast", pressed ? "1" : "0");
}

function toggleMotion() {
  const active = root.classList.toggle("reduce-motion");
  motionBtn.setAttribute("aria-pressed", active.toString());
  localStorage.setItem("reduce-motion", active ? "1" : "0");

  reduceMotion =
    active || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  } else {
    initStars();
    rafId = requestAnimationFrame(drawStars);
  }
}

/* ======= Compartir ======= */
qs("#share")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const shareData = {
    title: "404 – Perdidos rumbo a Marte",
    text: "Me perdí en Marte buscando esta página 👩‍🚀🛠️",
    url: location.href,
  };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(location.href);
      alert("Enlace copiado al portapapeles 🚀");
    }
  } catch {}
});

/* ======= Init ======= */
window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", handleParallax, { passive: true });
window.addEventListener("keydown", handleShortcuts);

scanBtn.addEventListener("click", () =>
  scanner.hidden ? ((scanner.hidden = false), startScan()) : startScan()
);
toggleLightsBtn.addEventListener("click", toggleLights);
contrastBtn.addEventListener("click", toggleContrast);
motionBtn.addEventListener("click", toggleMotion);

// Estados guardados
if (localStorage.getItem("high-contrast") === "1")
  root.classList.add("high-contrast");
if (localStorage.getItem("reduce-motion") === "1")
  root.classList.add("reduce-motion");

// Canvas + estrellas
resizeCanvas();
if (!reduceMotion) {
  initStars();
  rafId = requestAnimationFrame(drawStars);
}

// Progreso visual en CSS (fallback si no hay JS para gradiente)
const bar = qs(".scanner__bar");
if (bar) bar.style.setProperty("--w", "0%");

/* ===== Rover Runner (mini-juego tipo Dino) ===== */
(() => {
  const canvas = document.getElementById("runner");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("runner-score");
  const restartBtn = document.getElementById("runner-restart");

  // Escalado responsivo
  function fitCanvas() {
    const cssWidth = canvas.clientWidth;
    const ratio = canvas.height / canvas.width; // (220/900)
    canvas.width = Math.round(cssWidth * window.devicePixelRatio);
    canvas.height = Math.round(canvas.width * ratio);
    ctx.setTransform(
      window.devicePixelRatio,
      0,
      0,
      window.devicePixelRatio,
      0,
      0
    );
  }
  window.addEventListener("resize", fitCanvas, { passive: true });
  fitCanvas();

  // === MODO FÁCIL ===
  const GROUND_Y = 170; // suelo
  const GRAVITY = 1700; // gravedad
  const JUMP_VY = -640; // fuerza del salto
  const BASE_SPEED = 220; // velocidad del mundo (más lenta)
  const ROCK_MIN_GAP = 120; // distancia mínima entre rocas (muy amplia)
  const ROCK_VAR_GAP = 110; // variación de distancia
  const MAX_ROCKS = 1; // <-- ¡solo una roca!

  // Estado
  let speed = BASE_SPEED;
  let lastTime = 0;
  let running = false;
  let gameOver = false;
  let score = 0;

  const rover = {
    x: 90,
    y: GROUND_Y,
    vy: 0,
    w: 56,
    h: 32,
    onGround: true,
    animT: 0,
  };

  // Obstáculos
  const rocks = [];
  let spawnCooldown = 0; // distancia restante (en px) para la próxima roca

  function spawnRock(initialX) {
    if (rocks.length >= MAX_ROCKS) return; // nunca más de 1
    const size = 30 + Math.random() * 16;
    const h = size;
    const w = size * (0.95 + Math.random() * 0.15);
    const x = initialX ?? canvas.width / window.devicePixelRatio + 60;
    // apoyada justo en el suelo, sin “flotar”
    rocks.push({
      x,
      y: GROUND_Y - h,
      w,
      h,
      passed: false,
      r: Math.random() * Math.PI * 0.08,
    });
  }

  function resetGame() {
    speed = BASE_SPEED;
    running = true;
    gameOver = false;
    score = 0;
    rover.y = GROUND_Y;
    rover.vy = 0;
    rover.onGround = true;
    rover.animT = 0;
    rocks.length = 0;
    // roca inicial y enfriar el siguiente spawn
    spawnRock();
    spawnCooldown = ROCK_MIN_GAP + Math.random() * ROCK_VAR_GAP;

    scoreEl.textContent = "0";
    restartBtn.hidden = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function jump() {
    if (!running || gameOver) return;
    if (rover.onGround) {
      rover.vy = JUMP_VY;
      rover.onGround = false;
    }
  }

  // Controles
  function onKey(e) {
    if (e.code === "Space") {
      e.preventDefault();
      jump();
    }
    if (e.key.toLowerCase() === "r" && gameOver) {
      resetGame();
    }
  }
  canvas.addEventListener("pointerdown", jump);
  window.addEventListener("keydown", onKey);
  restartBtn.addEventListener("click", resetGame);

  // Dibujo
  function drawGround() {
    ctx.save();
    // línea fina del borde del suelo
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 0.5);
    ctx.lineTo(canvas.width, GROUND_Y + 0.5);
    ctx.stroke();

    // franja y marcas
    ctx.translate(0, GROUND_Y + 10);
    ctx.fillStyle = "#7b3626";
    ctx.fillRect(0, 0, canvas.width, 8);

    const stripeW = 40;
    const offset = (performance.now() / (1000 / speed)) % stripeW;
    ctx.fillStyle = "#a94933";
    for (let x = -offset; x < canvas.width; x += stripeW) {
      ctx.fillRect(x, -6, 22, 4);
    }
    ctx.restore();
  }

  function drawRover(dt) {
    rover.animT += dt;
    const wobble = Math.sin(rover.animT * 14) * (rover.onGround ? 1 : 0.3);

    ctx.save();
    ctx.translate(rover.x, rover.y - rover.h);
    ctx.fillStyle = "#e4e7f1";
    roundRect(ctx, 0, 0, rover.w, rover.h, 8, true);

    // mástil + cámara
    ctx.fillStyle = "#d9ddec";
    ctx.fillRect(8, -26, 8, 26);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -6, -38, 30, 14, 6, true);

    // ruedas
    ctx.save();
    ctx.translate(0, rover.h - 6);
    for (let i = 0; i < 3; i++) {
      const rx = 8 + i * 22;
      drawWheel(rx, 0, wobble + i * 0.4);
    }
    ctx.restore();

    // faro si en la escena grande están las luces encendidas
    if (
      !document.querySelector(".rover")?.classList.contains("rover--lights-off")
    ) {
      ctx.fillStyle = "rgba(255,255,200,.25)";
      ctx.beginPath();
      ctx.moveTo(rover.w - 4, 10);
      ctx.lineTo(rover.w + 90, -10);
      ctx.lineTo(rover.w + 90, 26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWheel(x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#232b3f";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#121728";
    ctx.stroke();
    ctx.rotate(t);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#3a4460";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawRock(r) {
    ctx.save();
    ctx.translate(r.x, Math.round(r.y)); // apoyar visualmente
    ctx.rotate(r.r);
    ctx.fillStyle = "#a94933";
    roundRect(ctx, 0, 0, r.w, r.h, 6, true);
    ctx.fillStyle = "#7b3626";
    ctx.globalAlpha = 0.35;
    roundRect(ctx, 6, 6, r.w * 0.6, r.h * 0.5, 5, true);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r, fill) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    if (fill) c.fill();
  }

  // Bucle principal
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // física
    rover.vy += GRAVITY * dt;
    rover.y += rover.vy * dt;
    if (rover.y >= GROUND_Y) {
      rover.y = GROUND_Y;
      rover.vy = 0;
      rover.onGround = true;
    }

    // mover roca
    for (const r of rocks) r.x -= speed * dt;

    // si no hay roca, contamos “distancia” para la siguiente y la creamos
    if (rocks.length === 0) {
      spawnCooldown -= speed * dt;
      if (spawnCooldown <= 0) {
        spawnRock();
        spawnCooldown = ROCK_MIN_GAP + Math.random() * ROCK_VAR_GAP;
      }
    }

    // si la roca salió por la izquierda, elimínala y prepara siguiente
    while (rocks.length && rocks[0].x + rocks[0].w < -20) {
      rocks.shift();
      spawnCooldown = ROCK_MIN_GAP + Math.random() * ROCK_VAR_GAP;
    }

    // puntuación al pasar la roca
    for (const r of rocks) {
      if (!r.passed && r.x + r.w < rover.x) {
        r.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
        // Sin incremento de velocidad → juego fácil
      }
    }

    // colisión
    for (const r of rocks) {
      if (
        aabb(rover.x, rover.y - rover.h, rover.w, rover.h, r.x, r.y, r.w, r.h)
      ) {
        endGame();
        break;
      }
    }

    // dibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    for (const r of rocks) drawRock(r);
    drawRover(dt);

    if (!gameOver) requestAnimationFrame(loop);
  }

  function endGame() {
    gameOver = true;
    running = false;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 28px Outfit, system-ui";
    ctx.textAlign = "center";
    ctx.fillText("¡Game Over!", canvas.width / 2, 80);
    ctx.font = "400 16px Outfit, system-ui";
    ctx.fillText("Pulsa R o el botón para reiniciar", canvas.width / 2, 110);
    ctx.restore();
    restartBtn.hidden = false;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // ARRANCA AUTOMÁTICAMENTE (no necesitas pulsar espacio para verlo)
  resetGame();
})();
