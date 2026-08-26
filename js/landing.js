// ============================================================================
// landing.js — Portada cinematográfica scroll-driven (estilo animejs.com).
//
// Una única línea de tiempo maestra de anime.js ("core") expone cuatro
// escenas encadenadas sobre un único elemento pegado (sticky) mientras el
// documento recorre una "pista" de ~600vh:
//
//   01 INTRO       Héroe: foto a sangre completa, tipografía que se despliega,
//                  HUD de telemetría, anillos orbitando.
//   02 CIRCUITO    El "vehículo" (silueta SVG blueprint) recorre un circuito
//                  SVG que se dibuja con el scroll; nodos de marcas se activan.
//   03 FICHA       El vehículo se aparca en una composición de especificaciones:
//                  dos gauges circulares y lecturas métricas que cuentan.
//   04 MERCADO     La escena se resuelve hacia la interfaz normal: CTA que
//                  conduce al grid del marketplace.
//
// El scroll es la única entrada: progress del observador -> tiempo del timeline.
// Los rotadores/flotantes ambientales (anime loop) se pausan fuera de su escena.
//
// Integración 3D: `js/landing-3d.js` (módulo ES, Three.js vendored) registra
// `window.LUXICAR_3D` y monta un canvas WebGL sobre el escenario; recibe la
// misma pose que la silueta SVG y la oculta al cargar el modelo GLB
// (assets/models/car-concept — "Car Concept", Eric Chadwick / Darmstadt
// Graphics Group, CC-BY-4.0). Sin WebGL/módulo: la silueta SVG permanece.
//
// Sin framework, sin rerender: el montaje devuelve una función de limpieza
// (revert del scope + listeners) que `app.js` invoca al cambiar de ruta.
// ============================================================================
"use strict";

/* eslint-disable -- los nombres de anime viven en window.anime (UMD vendor) */

// ---------------------------------------------------------------------------
// Datos de la coreografía (duraciones en ms a lo largo del timeline maestro)
// ---------------------------------------------------------------------------
const FX_DUR = 15400;
const FX = {
  // Segmentos (ms en el timeline)
  salidaHero: 2500,        // el héroe empieza a salir
  finSalidaHero: 3300,
  entradaCircuito: 2900,
  finEntradaCircuito: 3800,
  inicioRuta: 4300,
  finRuta: 9600,
  entradaSpecs: 9700,
  finEntradaSpecs: 10600,
  parkingFin: 11200,
  gaugesIni: 10800,
  gaugesFin: 13200,
  filasIni: 11400,
  filasFin: 14600,
  ctaIni: 14400,
  // Recorrido del coche en la ruta [0..1]
  fNodos: [0.1, 0.28, 0.46, 0.64, 0.82],
  marcasNodos: ["PORSCHE", "FERRARI", "LAMBORGHINI", "MCLAREN", "ROLLS-ROYCE"],
  capitulos: [
    ["01 / INTRO", 0, 2600],
    ["02 / CIRCUITO", 2600, 9700],
    ["03 / FICHA TÉCNICA", 9700, 14400],
    ["04 / MERCADO", 14400, 15400],
  ],
};

// ---------------------------------------------------------------------------
// Silueta blueprint del vehículo (SVG inline, trazable por stroke-dasharray).
// Superdeportivo de perfil, morro a +x, dibujado sobre 560x160.
// ---------------------------------------------------------------------------
function landingCarSvg() {
  return (
    '<svg class="fx-car-svg" viewBox="0 0 560 160" aria-hidden="true">' +
    '<g class="fx-car-stroke" fill="none" stroke="currentColor">' +
    // --- carrocería (contorno con pasos de rueda) ---
    '<path vector-effect="non-scaling-stroke" stroke-width="1.6" stroke-linejoin="round" ' +
    'd="M 20 110 ' +
    "C 15 100 16 89 25 81 " +
    "C 31 65 45 57 64 53 " +
    "L 78 50 " +
    "C 96 46 111 45 128 44 " +
    "C 152 25 194 14 236 14 " +
    "C 274 14 306 24 330 42 " +
    "L 356 52 " +
    "C 396 64 462 80 508 94 " +
    "L 530 102 " +
    "C 536 104 536 109 530 111 " +
    "L 500 114 " +
    // arco rueda delantera (rueda centrada en 446)
    "C 488 88 468 76 445 76 " +
    "C 421 76 402 92 394 114 " +
    "L 168 114 " +
    // arco rueda trasera (rueda centrada en 116)
    "C 160 92 140 76 116 76 " +
    "C 92 76 72 92 64 114 " +
    "Z\"/>" +
    // --- detalles de carrocería ---
    '<path stroke-width="1.2" opacity="0.28" d="M 132 46 C 156 30 196 21 232 20"/>' + // capó del parabrisas
    '<path stroke-width="1.2" opacity="0.28" d="M 258 17 L 296 24 L 318 40 L 252 39 Z"/>' + // ventana
    '<path stroke-width="1.2" opacity="0.35" d="M 333 45 L 302 84 L 200 88 L 188 46"/>' + // línea de puerta
    '<path stroke-width="1.2" opacity="0.30" d="M 500 96 L 462 104"/>' + // faro
    '<path stroke-width="1.2" opacity="0.25" d="M 30 84 L 62 80"/>' + // spoiler trasero
    // --- ruedas ---
    '<g stroke-width="1.4" >' +
    '<circle cx="116" cy="106" r="26"/>' +
    '<circle cx="116" cy="106" r="11"/>' +
    '<circle cx="446" cy="106" r="26"/>' +
    '<circle cx="446" cy="106" r="11"/>' +
    '<path stroke-width="1.2" opacity="0.5" d="M 116 80 L 116 132 M 90 106 L 142 106 M 446 80 L 446 132 M 420 106 L 472 106"/>' +
    "</g>" +
    // --- línea de suelo y cotas técnica ---
    '<path stroke-width="1" stroke-dasharray="3 7" opacity="0.5" d="M 8 138 L 552 138"/>' +
    '<path stroke-width="1" opacity="0.35" d="M 20 138 L 20 112 M 540 138 L 540 112"/>' +
    "</g>" +
    "</svg>"
  );
}

// ---------------------------------------------------------------------------
// Helpers de formato de especs (idénticos a los del catálogo)
// ---------------------------------------------------------------------------
function fxEspecs(v) {
  return [
    { id: "potencia", valor: v.potencia, unidad: "HP", etiqueta: "Potencia", max: 1100 },
    { id: "velocidad", valor: v.velocidadMaxima, unidad: "KM/H", etiqueta: "Vel. máxima", max: 400 },
    { id: "aceleracion", valor: v.aceleracion0a100, unidad: "S", etiqueta: "0–100 km/h", max: 6 },
    { id: "torque", valor: v.torque, unidad: "NM", etiqueta: "Torque", max: 1000 },
  ];
}

// ---------------------------------------------------------------------------
// HTML del escenario cinematográfico (se inyecta antes de las secciones
// estáticas en pageHome). Con `fx-static` cae en la versión sin secuencias.
// ---------------------------------------------------------------------------
function landingStageHtml(hero, specsVeh) {
  const specs = fxEspecs(specsVeh);
  const letras = "LUXICAR"
    .split("")
    .map((c) => '<span class="fx-char">' + c + "</span>")
    .join("");

  const filas = specs
    .map(
      (s) =>
        '<li class="fx-fila" data-fila="' + s.id + '">' +
        '<span class="fx-fila-etq">' + s.etiqueta + "</span>" +
        '<span class="fx-fila-linea"></span>' +
        '<span class="fx-fila-val" data-counter="' + s.id + '" data-valor="' + s.valor + '" data-unidad="' + s.unidad + '">0 ' + s.unidad + "</span>" +
        "</li>"
    )
    .join("");

  const chips = [
    [esc(specsVeh.marca + " · " + specsVeh.modelo), "fx-chip-a"],
    ["MOTOR: " + esc(specsVeh.motor), "fx-chip-b"],
    ["TRANSMISIÓN: " + esc(specsVeh.transmision), "fx-chip-c"],
    ["TRACCIÓN: " + esc(specsVeh.traccion) + " · " + esc(specsVeh.combustible), "fx-chip-d"],
  ]
    .map(
      (c) =>
        '<span class="fx-chip ' + c[1] + '">' + c[0] + "</span>"
    )
    .join("");

  const nodos = FX.marcasNodos
    .map(
      (m, i) =>
        '<g class="fx-nodo" transform="translate(0 0)" data-nodo="' + i + '">' +
        '<circle class="fx-nodo-c" r="5"/>' +
        '<rect class="fx-nodo-marco" x="0" y="0" rx="3"/>' +
        '<text class="fx-nodo-t">' + m + "</text>" +
        "</g>"
    )
    .join("");

  return (
    // El fallback estático se muestra por defecto (CSS); el modo cinematográfico
    // solo se activa por JS cuando hay anime + soporte y no hay reduced-motion.
    '<section id="fx" class="fx" data-fx>' +
    // ---------- versión estática (fallback) ----------
    '<div class="fx-estatico">' +
    '<div class="fx-estatico-bg">' +
    smartImg(hero.imagenes[0], hero.marca + " " + hero.modelo, { priority: true }) +
    '<div class="fx-estatico-grad"></div>' +
    "</div>" +
    '<div class="fx-estatico-cont">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)] anim-in" style="--dur:0.8s">Digital Marketplace · Alta Gama</p>' +
    '<h1 class="text-display mt-6 text-5xl sm:text-7xl lg:text-8xl anim-in" style="--dur:1s;--delay:0.12s;--from-y:24px">Pura<br><span class="text-gradient">adrenalina</span></h1>' +
    '<p class="mt-7 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg anim-in" style="--dur:1s;--delay:0.26s;--from-y:24px">Los automóviles más extraordinarios del mundo, reunidos en una sola colección.</p>' +
    '<div class="fx-estatico-specs anim-in" style="--dur:0.9s;--delay:0.4s">' +
    '<div><b>' + formatearNumero(specsVeh.potencia) + " HP</b><span>" + esc(specsVeh.marca + " " + specsVeh.modelo) + "</span></div>" +
    "<div><b>" + specsVeh.aceleracion0a100 + 's</b><span>0–100 km/h</span></div>' +
    '<div><b>' + specsVeh.velocidadMaxima + ' km/h</b><span>Vel. máxima</span></div>' +
    "</div>" +
    '<a href="/marketplace" data-nav class="fx-estatico-cta anim-in" style="--dur:0.8s;--delay:0.55s">Explorar vehículos ' + icon("ArrowRight", "h-4 w-4") + "</a>" +
    "</div></div>" +
    // ---------- versión cinematográfica ----------
    '<div class="fx-cine">' +
    '<div class="fx-sticky">' +
    // ESC 01 — INTRO: foto a sangre completa + tipografía + HUD
    '<div class="fx-scene fx-intro" data-scene="intro">' +
    '<div class="fx-photo" data-fx-photo>' +
    smartImg(hero.imagenes[0], hero.marca + " " + hero.modelo, { priority: true }) +
    '<div class="fx-photo-grad"></div>' +
    "</div>" +
    '<div class="fx-grid-bg" aria-hidden="true"></div>' +
    '<div class="fx-intro-tipo">' +
    '<p class="fx-kicker">Digital Marketplace — Automóviles de alta gama</p>' +
    '<h1 class="fx-titulo" aria-label="LUXICAR">' + letras + "</h1>" +
    '<p class="fx-sub">Pura adrenalina. Una colección viva en constante movimiento.</p>' +
    "</div>" +
    '<div class="fx-chips" data-fx-chips>' + chips + "</div>" +
    '<div class="fx-rings" aria-hidden="true">' +
    '<svg class="fx-ring fx-ring-a" viewBox="0 0 200 200"><circle cx="100" cy="100" r="84" stroke-dasharray="2 12"/><circle cx="100" cy="100" r="62" stroke-dasharray="80 40"/><circle cx="100" cy="100" r="100" stroke-dasharray="1 26" class="fx-ring-fine"/></svg>' +
    "</div>" +
    '<div class="fx-scroll-hint" aria-hidden="true"><span>DESLIZA</span><i></i></div>' +
    "</div>" +
    // ESC 02 — CIRCUITO: el coche recorre un grafo SVG
    '<div class="fx-scene fx-track" data-scene="track">' +
    '<svg class="fx-circuit-svg" id="fx-circuit" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">' +
    '<g class="fx-circuit-stroke" fill="none" stroke="currentColor">' +
    // ramificaciones circuit-board (decorativas)
    '<path class="fx-rama" stroke-width="1.4" stroke-dasharray="2 6" d="M 340 470 L 340 610 L 520 610"/>' +
    '<path class="fx-rama" stroke-width="1.4" stroke-dasharray="2 6" d="M 700 235 L 880 235 L 880 96 L 1030 96"/>' +
    '<path class="fx-rama" stroke-width="1.4" stroke-dasharray="2 6" d="M 560 340 L 760 340 L 760 500"/>' +
    '<circle class="fx-rama-p" cx="520" cy="610" r="4"/><circle class="fx-rama-p" cx="1030" cy="96" r="4"/><circle class="fx-rama-p" cx="760" cy="500" r="4"/>' +
    // trazo principal
    '<path id="fx-path" class="fx-path" stroke-width="2.4" ' +
    'd="M -40 560 L 260 560 ' +
    "C 340 560 340 470 260 470 L 180 470 " +
    "C 95 470 95 365 185 365 L 430 365 " +
    "C 520 365 520 255 430 255 L 262 255 " +
    "C 152 255 152 148 258 148 L 700 148 " +
    "C 796 148 796 236 700 236 L 560 236 L 560 340 L 760 340 " +
    "C 858 340 858 450 760 450 L 1018 450 L 1120 540 L 1260 540\"/>" +
    // nodos (se reposicionan por JS a lo largo del path)
    nodos +
    "</g></svg>" +
    '</div>' +
    // ESC 03 — FICHA: composición de especificaciones
    '<div class="fx-scene fx-specs" data-scene="specs">' +
    '<div class="fx-blueprint" aria-hidden="true"></div>' +
    '<div class="fx-spec-cab">' +
    '<p class="fx-kicker">Ficha técnica — ' + esc(specsVeh.marca + " " + specsVeh.modelo) + "</p>" +
    '<h2 class="fx-spec-titulo"><span>' + esc(specsVeh.modelo) + "</span></h2>" +
    "</div>" +
    '<div class="fx-vehicle-spot" aria-hidden="true"></div>' +
    '<div class="fx-spec-der">' +
    '<div class="fx-gauges">' +
    gaugeSvg("potencia", "POTENCIA", "0", specs[0]) +
    gaugeSvg("velocidad", "VELOCIDAD MÁX", "0", specs[1]) +
    "</div>" +
    '<ul class="fx-filas">' + filas + "</ul>" +
    "</div>" +
    '<p class="fx-credit">Modelo 3D “Car Concept” — Eric Chadwick / Darmstadt Graphics Group · CC-BY-4.0</p>' +
    "</div>" +
    // ESC 04 — MERCADO: transición a la interfaz normal
    '<div class="fx-scene fx-market" data-scene="market">' +
    '<div class="fx-market-box">' +
    '<p class="fx-kicker">El mercado te espera</p>' +
    '<h2 class="fx-market-titulo">88 vehículos. <span class="fx-market-brillante">Una colección.</span></h2>' +
    '<a href="/marketplace" data-nav class="fx-market-cta">Entrar al marketplace ' + icon("ArrowRight", "h-4 w-4") + "</a>" +
    "</div></div>" +
    // El vehículo persistente (silueta SVG). La capa WebGL (landing-3d.js)
    // añade su propio <canvas> a .fx-sticky y oculta esta silueta al cargar.
    '<div class="fx-vehicle" id="fx-vehicle" aria-hidden="true">' +
    landingCarSvg() +
    '<div class="fx-vehicle-glow"></div>' +
    "</div>" +
    // HUD lateral fijo (capítulos + barra + porcentaje)
    '<div class="fx-hud" aria-hidden="true">' +
    '<ol class="fx-hud-caps"></ol>' +
    '<div class="fx-hud-marc"><i data-fx-barra></i></div>' +
    '<div class="fx-hud-pct" data-fx-pct>0</div>' +
    "</div>" +
    "</div>" +
    '<div class="fx-runway" aria-hidden="true"></div>' +
    "</div>" +
    "</section>"
  );
}

// Gauge circular (círculo rellenable con ticks manuales de precisión)
function gaugeSvg(id, etiqueta, inicial, s) {
  const T = 34;
  const ticks = [];
  for (let i = 0; i <= T; i++) {
    const a = (i / T) * Math.PI; // semicírculo superior
    const x1 = 80 - Math.cos(a) * 56,
      y1 = 80 - Math.sin(a) * 56;
    const x2 = 80 - Math.cos(a) * (i % 5 === 0 ? 47 : 51),
      y2 = 80 - Math.sin(a) * (i % 5 === 0 ? 47 : 51);
    ticks.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>');
  }
  return (
    '<figure class="fx-gauge fx-gauge-' + id + '" data-gauge="' + id + '" data-max="' + s.max + '">' +
    '<svg viewBox="0 0 160 160" aria-hidden="true">' +
    '<g class="fx-gauge-ticks" stroke="currentColor" stroke-width="1">' + ticks.join("") + "</g>" +
    '<circle class="fx-gauge-base" cx="80" cy="84" r="56" pathLength="100" fill="none" stroke="currentColor" transform="rotate(-180 80 84)"/>' +
    '<path class="fx-gauge-arc" data-gauge-arc="' + id + '" d="M 24 84 A 56 56 0 0 1 136 84" fill="none" stroke="currentColor" stroke-linecap="round" pathLength="100"/>' +
    '<text class="fx-gauge-val" data-gauge-val="' + id + '" data-valor="' + s.valor + '" x="80" y="74" text-anchor="middle">' + inicial + "</text>" +
    '<text class="fx-gauge-unidad" x="80" y="92" text-anchor="middle">' + s.unidad + "</text>" +
    "</svg>" +
    "<figcaption>" + etiqueta + "</figcaption></figure>"
  );
}

// ---------------------------------------------------------------------------
// Montaje — scope de anime con mediaQueries: solo desktop y sin reduced-motion
// ---------------------------------------------------------------------------
function mountLanding() {
  const root = document.getElementById("fx");
  if (!root || !window.anime || !window.anime.createScope) return null;

  let scope = null;
  try {
    scope = window.anime.createScope({
      root,
      mediaQueries: {
        cinematica: "(min-width: 1024px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
    });

    scope.add((self) => {
      const { cinematica, reduced } = self.matches;
      if (!cinematica || reduced) return;

      root.classList.add("fx-cinematica");
      const a = window.anime;
      const utils = a.utils;

      // Referencias DOM
      const elIntro = root.querySelector('[data-scene="intro"]');
      const elTrack = root.querySelector('[data-scene="track"]');
      const elSpecs = root.querySelector('[data-scene="specs"]');
      const elMarket = root.querySelector('[data-scene="market"]');
      const elSticky = root.querySelector(".fx-sticky");
      const veh = root.querySelector("#fx-vehicle");
      const path = root.querySelector("#fx-path");
      const hudBars = root.querySelector("[data-fx-barra]");
      const hudPct = root.querySelector("[data-fx-pct]");
      const capsList = root.querySelector(".fx-hud-caps");
      const filas = Array.from(root.querySelectorAll("[data-counter]"));
      const gauges = Array.from(root.querySelectorAll("[data-gauge-arc]"));
      const nodos = Array.from(root.querySelectorAll("[data-nodo]"));
      const chars = Array.from(root.querySelectorAll(".fx-char"));
      const chips = Array.from(root.querySelectorAll(".fx-chip"));
      const photo = root.querySelector("[data-fx-photo]");

      // -- geometric state ------------------------------------------------
      let pathLen = 0;
      let spotPoint = { x: 0, y: 0 };
      let stageW = 1, stageH = 1;
      let vw = 1, vh = 1;
      let carW = veh.clientWidth || 340;

      const posicionarNodos = () => {
        pathLen = path.getTotalLength();
        path.setAttribute("stroke-dasharray", pathLen);
        path.setAttribute("stroke-dashoffset", pathLen);
        nodos.forEach((n, i) => {
          const f = FX.fNodos[i];
          const pt = path.getPointAtLength(f * pathLen);
          n.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
          const t = n.querySelector(".fx-nodo-t");
          const m = n.querySelector(".fx-nodo-marco");
          const w = t.getBBox().width;
          const est = w + 18;
          m.setAttribute("y", "-13");
          t.setAttribute("y", "22");
          t.setAttribute("x", -(w / 2 + 9).toFixed(1));
          m.setAttribute("width", est.toFixed(1));
          m.setAttribute("x", -(est / 2).toFixed(1));
          m.setAttribute("height", "19");
        });
      };

      const medir = () => {
        // Medidas del escenario pegado: el sticky ocupa la ventana visible
        stageW = elSticky.clientWidth;
        stageH = elSticky.clientHeight || window.innerHeight;
        vw = window.innerWidth;
        vh = window.innerHeight;
        carW = veh.clientWidth || carW;
        // Punto de aparcamiento (escena specs): el contenedor del hueco
        const spotEl = root.querySelector(".fx-vehicle-spot");
        if (!spotEl) return;
        const spot = spotEl.getBoundingClientRect();
        spotPoint = { x: spot.left + spot.width / 2, y: spot.top + spot.height / 2 };
      };

      try { posicionarNodos(); } catch (e0) { /* navegadores sin SMIL path API */ }
      medir();
      window.addEventListener("resize", medir);

      // -- timeline maestro -------------------------------------------------
      const tl = a.createTimeline({ autoplay: false, defaults: { ease: "linear" } });

      // Hero: las letras se disgregan / chips salen / kicker y sub desaparecen
      tl.add(".fx-kicker, .fx-sub", { opacity: 0, y: -20, duration: 900, ease: "outCubic", delay: a.stagger(80) }, 0);
      tl.add(chars, {
        x: (c, i) => (i < 3 ? -(140 + 22 * (3 - i)) : 140 + 22 * (i - 3)),
        y: -34,
        opacity: 0,
        duration: 1900,
        ease: "inOut(3)",
        delay: a.stagger(46, { from: "center" }),
      }, 0);
      tl.add(chips, {
        x: (c, i) => [-120, 120, -90, 90][i % 4],
        opacity: 0,
        duration: 1300,
        delay: a.stagger(70),
      }, 0);
      tl.add(".fx-scroll-hint", { opacity: 0, duration: 500 }, 0);
      tl.add(photo, { scale: 1.16, duration: FX.salidaHero + 1500, ease: "outQuad" }, 0);
      tl.add(".fx-intro-tipo", { opacity: 0, duration: 700 }, FX.salidaHero - 200);
      tl.add(".fx-chips", { opacity: 0, duration: 700 }, FX.salidaHero - 300);
      tl.add(".fx-rings", { opacity: 0, duration: 700 }, FX.salidaHero - 100);
      tl.add(elIntro, { opacity: 0, duration: 800, ease: "inOutQuad" }, FX.salidaHero);
      // Circuito entra
      tl.add(elTrack, { opacity: 1, duration: 900, ease: "inOutQuad" }, FX.entradaCircuito);
      // Specs entra (circuito sale solapado)
      tl.add(elSpecs, { opacity: 1, duration: 900, ease: "inOutQuad" }, FX.entradaSpecs);
      tl.add(elTrack, { opacity: 0, duration: 800, ease: "inOutQuad" }, FX.entradaSpecs + 300);
      // Filas de specs escalonadas (barras)
      tl.add(".fx-fila", {
        x: [48, 0],
        opacity: [0, 1],
        duration: 800,
        ease: "outCubic",
        delay: a.stagger(220),
      }, FX.filasIni);
      // Mercado entra; specs se apaga
      tl.add(elMarket, { opacity: 1, scale: [0.96, 1], duration: 1000, ease: "outQuad" }, FX.ctaIni);
      tl.add(elSpecs, { opacity: 0, duration: 700, ease: "inOutQuad" }, FX.ctaIni + 200);

      // -- coreografía (parte paramétrica del scrub) ------------------------
      const pctState = { actual: -1 };
      const capState = { actual: -1 };
      const counters = { potencia: -1, velocidad: -1, aceleracion: -1, torque: -1 };

      const capsHtml = FX.capitulos
        .map((c, i) => '<li data-cap="' + i + '"><span>' + c[0] + "</span></li>")
        .join("");
      capsList.innerHTML = capsHtml;
      const capsEls = Array.from(capsList.querySelectorAll("[data-cap]"));

      const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
      const easeInOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
      const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
      const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
      const pointAt = (f) => path.getPointAtLength(f * pathLen);

      let prevFRuta = 0;
      let ultimaPose = null;
      let fx3d = null;
      function placeCar(t) {
        // posición del coche durante la ruta + mezcla hacia el parking
        const fRuta = clamp01((t - FX.inicioRuta) / (FX.finRuta - FX.inicioRuta));
        const fPark = clamp01((t - FX.parkingFin + 600) / (FX.parkingFin - (FX.entradaSpecs + 300) - 200));
        let x, y, rot, scale;

        if (fRuta < 1) {
          // durante la ruta
          const pt = pathLen ? pointAt(fRuta) : { x: 0, y: 0 };
          const pt2 = pathLen ? pointAt(Math.min(1, fRuta + 0.002)) : { x: 0, y: 0 };
          const sx = stageW / 1200, sy = stageH / 700;
          x = pt.x * sx;
          y = pt.y * sy;
          rot = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
          scale = clamp(vw / 2200, 0.42, 0.72);
        } else {
          // aparcado / desaparición
          const pt = pathLen ? pointAt(1) : { x: 0, y: 0 };
          const sx = stageW / 1200, sy = stageH / 700;
          const ex = pt.x * sx, ey = pt.y * sy;
          const e = easeInOutQuad(fPark);
          x = utils.lerp(ex, spotPoint.x, e);
          y = utils.lerp(ey, spotPoint.y, e);
          rot = 0;
          scale = utils.lerp(0.72, 1, e);
        }
        veh.style.transform =
          "translate3d(" + (x - carW / 2).toFixed(1) + "px," + (y - carW * 0.25).toFixed(1) + "px,0) rotate(" + rot.toFixed(1) + "deg) scale(" + scale.toFixed(3) + ")";
        // velocidad angular de ruedas (signo según dirección del scroll)
        const ruedasVel = (fRuta - prevFRuta) * 3200;
        prevFRuta = fRuta;
        return { x: x, y: y, rotDeg: rot, scale: scale, parkingBlend: fRuta >= 1 ? fPark : 0, ruedasVel: ruedasVel };
      }

      function chores(self) {
        const t = self.progress * FX_DUR;
        // escenas por core (opacidades suaves en paralelo al timeline)
        // coche: visible sólo en 02-04; desaparece completo iniciando el mercado
        const visCoche = clamp01((t - FX.entradaCircuito) / 600);
        const fadeCoche = Math.min(500, Math.max(120, FX_DUR - FX.ctaIni - 50));
        const visCocheOut = t > FX.ctaIni ? clamp01(1 - (t - FX.ctaIni) / fadeCoche) : 1;
        veh.style.opacity = (visCoche * visCocheOut).toFixed(3);
        let pose = null;
        if (pathLen && t > FX.entradaCircuito && t < FX.ctaIni) pose = placeCar(t);
        else if (t <= FX.entradaCircuito && pathLen) pose = placeCar(FX.entradaCircuito + 1);
        // tras el cta: el coche queda en su última pose (aparcado)
        if (pose) ultimaPose = pose;
        if (fx3d) {
          fx3d.update({
            // antes del circuito no hay pose: el visor hace turntable en el intro
            pose: t < FX.entradaCircuito ? null : ultimaPose,
            vis: t < FX.entradaCircuito ? 1 : visCoche * visCocheOut,
            carWPx: carW,
          });
        }

        // dibujo de la ruta (stroke-dashoffset directo — GPU-friendly en GPU? no layout)
        if (pathLen) {
          const fDib = clamp01((t - FX.inicioRuta) / (FX.finRuta - FX.inicioRuta));
          path.style.strokeDashoffset = (pathLen * (1 - fDib)).toFixed(1);
          nodos.forEach((n, i) => {
            n.classList.toggle("on", fDib >= FX.fNodos[i]);
          });
        } else {
          nodos.forEach((n) => n.classList.add("on"));
        }

        // gauges + contadores (escena specs)
        const fG = easeOutCubic(clamp01((t - FX.gaugesIni) / (FX.gaugesFin - FX.gaugesIni)));
        gauges.forEach((g) => {
          const id = g.getAttribute("data-gauge-arc");
          const max = gauges.length ? +root.querySelector('[data-gauge="' + id + '"]').getAttribute("data-max") : 1;
          const valTxt = root.querySelector('[data-gauge-val="' + id + '"]');
          const valor = +valTxt.getAttribute("data-valor");
          const fill = id === "aceleracion" ? clamp01(1 - valor / max) : clamp01(valor / max);
          const e = (fG * fill * 100).toFixed(2);
          g.setAttribute("stroke-dasharray", e + " 100");
          const v = Math.round(valor * fG);
          if (counters[id] !== v) { counters[id] = v; valTxt.textContent = (id === "aceleracion" ? (valor * fG).toFixed(1) : String(v)); }
        });
        filas.forEach((f) => {
          const id = f.getAttribute("data-counter");
          const valor = +f.getAttribute("data-valor");
          const unidad = f.getAttribute("data-unidad");
          const fT = easeOutCubic(clamp01((t - (FX.filasIni + 400)) / (FX.filasFin - FX.filasIni - 400)));
          let vTxt;
          if (id === "aceleracion") vTxt = (valor * fT).toFixed(1);
          else vTxt = Math.round(valor * fT);
          const nuevo = vTxt + " " + unidad;
          if (f.textContent !== nuevo) f.textContent = nuevo;
        });

        // HUD: barra, porcentaje, capítulo activo
        const p = self.progress;
        if (hudBars) hudBars.style.transform = "scaleY(" + p.toFixed(4) + ")";
        const pct = p >= 0.998 ? 100 : Math.round(p * 100);
        if (pctState.actual !== pct) { pctState.actual = pct; hudPct.textContent = String(pct); }
        let capIdx = 0;
        for (let i = 0; i < FX.capitulos.length; i++) if (t >= FX.capitulos[i][1]) capIdx = i;
        if (capState.actual !== capIdx) {
          capState.actual = capIdx;
          capsEls.forEach((c, i) => c.classList.toggle("activo", i === capIdx));
        }
      }

      // -- observador de scroll (master scrub) -------------------------------
      const obs = a.onScroll({
        container: null, // ventana
        target: root,
        axis: "y",
        enter: "start start",
        leave: "end end",
        sync: 1,
        onUpdate: chores,
      });
      obs.link(tl);
      // Sin refresh() manual: onScroll resuelve su target de forma diferida
      // (microtask) y refresca los bounds él mismo; llamarlo antes rompe
      // updateBounds con this.target a null.
      // Estado inicial del HUD (capítulo, porcentaje) sin esperar al primer scroll.
      try { chores({ progress: 0 }); } catch (eIni) { /* noop */ }

      // -- ambientes (loops independientes del scroll, se pausan fuera) ------
      const introLoops = [
        a.animate(".fx-ring-a", { rotate: 360, duration: 22000, loop: true, ease: "linear" }),
        a.animate(".fx-scroll-hint i", { scaleY: [1, 0.25], duration: 1300, loop: true, alternate: true, ease: "inOutQuad" }),
      ];

      let introVivo = true;
      function controlarLoops(self) {
        const t = self.progress * FX_DUR;
        const dentro = t < FX.salidaHero;
        if (dentro !== introVivo) {
          introVivo = dentro;
          introLoops.forEach((l) => (dentro ? l.play() : l.pause()));
        }
      }
      a.onScroll({
        container: null,
        target: root,
        enter: "start start",
        leave: "end end",
        onUpdate: controlarLoops,
      });

      // Animación de entrada inmediata (no scrub): tipografía se instala; de
      // ahí en adelante el timeline scrube. Usamos solo opacidad y traslación
      // inicial común para no pelear con los tweens del timeline.
      a.animate(chars, { y: [46, 0], opacity: [0, 1], duration: 1200, ease: "outCubic", delay: a.stagger(40, { from: "center" }) }, { autoplay: true });
      a.animate(chips, { opacity: [0, 1], duration: 900, ease: "outCubic", delay: a.stagger(90, { start: 220 }) });
      a.animate([root.querySelector(".fx-kicker"), root.querySelector(".fx-sub")], { opacity: [0, 1], y: [14, 0], duration: 1000, ease: "outCubic", delay: a.stagger(80, { start: 150 }) }, { });

      // Integración 3D (mejora progresiva): si el visor GLB está disponible
      // (js/landing-3d.js + WebGL), sustituye la silueta SVG por el modelo.
      function iniciar3D() {
        if (fx3d || !window.LUXICAR_3D || !window.LUXICAR_3D.init) return;
        fx3d = window.LUXICAR_3D.init({
          sticky: elSticky,
          model: "/assets/models/car-concept/CarConcept.glb",
          onReady: () => {
            veh.classList.add("fx-vehicle-3d-activo");
            root.classList.add("fx-3d-activo");
          },
          onError: () => { /* la silueta SVG permanece como vehículo */ },
        });
      }
      iniciar3D();
      if (!fx3d) window.addEventListener("luxicar-3d-ready", iniciar3D, { once: true });

      return () => {
        window.removeEventListener("resize", medir);
        window.removeEventListener("luxicar-3d-ready", iniciar3D);
        introLoops.forEach((l) => l.pause());
        if (fx3d) fx3d.dispose();
      };
    });
  } catch (err) {
    if (typeof console !== "undefined") console.error("[landing] cinemática desactivada:", err);
    root.classList.add("fx-static");
    return null;
  }

  return () => {
    try { scope && scope.revert(); } catch (e) { /* noop */ }
  };
}
