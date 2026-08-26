// ============================================================================
// landing.js — Portada cinematográfica scroll-driven (estilo animejs.com).
//
// Una única línea de tiempo maestra de anime.js ("core") expone cuatro
// escenas encadenadas sobre un único elemento pegado (sticky) mientras el
// documento recorre una "pista" de ~600vh:
//
//   01 INTRO       Héroe: foto a sangre completa, tipografía que se despliega,
//                  HUD de telemetría, anillos orbitando.
//   02 CIRCUITO    Un circuito SVG se dibuja con el scroll (una chispa recorre
//                  la punta del trazo); nodos de marcas se activan al paso.
//   03 FICHA       Composición de especificaciones: fotografía del modelo en
//                  marco con reveal, dos gauges circulares y lecturas métricas.
//   04 MERCADO     La escena se resuelve hacia la interfaz normal: CTA que
//                  conduce al grid del marketplace.
//
// El scroll es la única entrada: progress del observador -> tiempo del timeline.
// Los rotadores/flotantes ambientales (anime loop) se pausan fuera de su escena.
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
    // chispa que corona la punta del trazo mientras se dibuja
    '<i class="fx-punta" data-fx-punta aria-hidden="true"></i>' +
    '</div>' +
    // ESC 03 — FICHA: composición de especificaciones
    '<div class="fx-scene fx-specs" data-scene="specs">' +
    '<div class="fx-blueprint" aria-hidden="true"></div>' +
    '<div class="fx-spec-cab">' +
    '<p class="fx-kicker">Ficha técnica — ' + esc(specsVeh.marca + " " + specsVeh.modelo) + "</p>" +
    '<h2 class="fx-spec-titulo"><span>' + esc(specsVeh.modelo) + "</span></h2>" +
    "</div>" +
    '<figure class="fx-spec-foto" data-fx-foto>' +
    smartImg(specsVeh.imagenes[1] || specsVeh.imagenes[0], specsVeh.marca + " " + specsVeh.modelo) +
    '<figcaption class="fx-spec-foto-pie">' +
    '<span class="fx-spec-foto-eyebrow">Unidad destacada</span>' +
    '<span class="fx-spec-foto-nombre">' + esc(specsVeh.marca + " " + specsVeh.modelo) + "</span>" +
    '<span class="fx-spec-foto-meta">' + esc(specsVeh.año + " · " + specsVeh.motor) + "</span>" +
    "</figcaption>" +
    "</figure>" +
    '<div class="fx-spec-der">' +
    '<div class="fx-gauges">' +
    gaugeSvg("potencia", "POTENCIA", "0", specs[0]) +
    gaugeSvg("velocidad", "VELOCIDAD MÁX", "0", specs[1]) +
    "</div>" +
    '<ul class="fx-filas">' + filas + "</ul>" +
    "</div>" +
    "</div>" +
    // ESC 04 — MERCADO: transición a la interfaz normal
    '<div class="fx-scene fx-market" data-scene="market">' +
    '<div class="fx-market-box">' +
    '<p class="fx-kicker">El mercado te espera</p>' +
    '<h2 class="fx-market-titulo">88 vehículos. <span class="fx-market-brillante">Una colección.</span></h2>' +
    '<a href="/marketplace" data-nav class="fx-market-cta">Entrar al marketplace ' + icon("ArrowRight", "h-4 w-4") + "</a>" +
    "</div></div>" +
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

      // Referencias DOM
      const elIntro = root.querySelector('[data-scene="intro"]');
      const elTrack = root.querySelector('[data-scene="track"]');
      const elSpecs = root.querySelector('[data-scene="specs"]');
      const elMarket = root.querySelector('[data-scene="market"]');
      const elSticky = root.querySelector(".fx-sticky");
      const punta = root.querySelector("[data-fx-punta]");
      const foto = root.querySelector("[data-fx-foto]");
      const fotoImg = foto ? foto.querySelector("img") : null;
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
      let stageW = 1, stageH = 1;
      let vw = 1, vh = 1;

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
      // Foto del modelo: reveal de izquierda a derecha con leve asentamiento
      tl.add(foto, {
        opacity: [0, 1],
        clipPath: ["inset(0 100% 0 0 round 16px)", "inset(0 0% 0 0 round 16px)"],
        duration: 1500,
        ease: "inOutQuad",
      }, FX.entradaSpecs + 250);
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
      const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
      const pointAt = (f) => path.getPointAtLength(f * pathLen);

      function placePunta(fDib) {
        // la chispa corona la punta del trazo que se está dibujando
        const pt = pathLen ? pointAt(fDib) : { x: 0, y: 0 };
        const sx = stageW / 1200, sy = stageH / 700;
        punta.style.transform =
          "translate3d(" + (pt.x * sx).toFixed(1) + "px," + (pt.y * sy).toFixed(1) + "px,0)";
      }

      function chores(self) {
        const t = self.progress * FX_DUR;

        // dibujo de la ruta (stroke-dashoffset directo — GPU-friendly en GPU? no layout)
        if (pathLen) {
          const fDib = clamp01((t - FX.inicioRuta) / (FX.finRuta - FX.inicioRuta));
          path.style.strokeDashoffset = (pathLen * (1 - fDib)).toFixed(1);
          nodos.forEach((n, i) => {
            n.classList.toggle("on", fDib >= FX.fNodos[i]);
          });
          // chispa: aparece al empezar el trazo y se apaga al salir el circuito
          const visPunta = clamp01((t - FX.inicioRuta) / 300) * clamp01(1 - (t - FX.entradaSpecs) / 500);
          punta.style.opacity = visPunta.toFixed(3);
          if (visPunta > 0) placePunta(fDib);
        } else {
          nodos.forEach((n) => n.classList.add("on"));
        }

        // deriva Ken Burns de la foto durante la escena de specs
        if (fotoImg) {
          const fFoto = clamp01((t - FX.entradaSpecs) / (FX.ctaIni - FX.entradaSpecs));
          fotoImg.style.transform = "scale(" + (1.02 + 0.06 * fFoto).toFixed(4) + ")";
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

      return () => {
        window.removeEventListener("resize", medir);
        introLoops.forEach((l) => l.pause());
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
