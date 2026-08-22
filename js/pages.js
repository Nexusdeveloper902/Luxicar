// ============================================================================
// pages.js — Páginas públicas: inicio, marketplace, marcas, detalle.
// ============================================================================
"use strict";

// ---------------------------------------------------------------------------
// INICIO
// ---------------------------------------------------------------------------
function pageHome() {
  const vehiculos = DB.vehiculos();
  const hero = vehiculos.find((v) => v.id === "porsche-911-carrera") || vehiculos[0];
  const showcase = vehiculos.find((v) => v.id === "lamborghini-revuelto") || vehiculos[0];
  const destacadosIds = [
    "mclaren-750s", "rolls-royce-ghost", "lamborghini-revuelto",
    "porsche-taycan-turbos", "rivian-r1t", "dodge-demon-170",
  ];
  const destacados = destacadosIds.map((id) => vehiculos.find((v) => v.id === id)).filter(Boolean);
  const marcas = DB.marcas().map((m) => m.name);

  const razones = [
    ["ShieldCheck", "Autenticidad garantizada", "Especificaciones verificadas de fábrica en cada modelo del catálogo."],
    ["Gauge", "Rendimiento comprobado", "Datos técnicos precisos de los motores más extraordinarios del mundo."],
    ["Sparkles", "Selección curada", "Una colección cuidadosamente elegida entre las marcas más prestigiosas."],
    ["Headset", "Experiencia premium", "Cada detalle diseñado para que explorar sea tan emocionante como conducir."],
  ];

  const specsShowcase = [
    [formatearNumero(showcase.potencia), "Caballos"],
    [showcase.aceleracion0a100 + "s", "0—100 km/h"],
    [formatearNumero(showcase.velocidadMaxima), "Vel. máxima km/h"],
  ];

  const html =
    // --- Hero cinematográfico ---
    '<section id="hero" class="relative flex min-h-[100svh] items-end overflow-hidden">' +
    '<div class="parallax-layer absolute inset-0 z-0" id="hero-bg">' +
    smartImg(hero.imagenes[0], hero.marca + " " + hero.modelo, { priority: true }) +
    '<div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>' +
    '<div class="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent"></div>' +
    "</div>" +
    '<div class="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8 lg:pb-32" id="hero-content">' +
    '<div class="max-w-2xl">' +
    '<p class="anim-in text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.8s;--from-y:12px">Digital Marketplace · Alta Gama</p>' +
    '<h1 class="anim-in text-display mt-6 text-5xl text-foreground sm:text-7xl lg:text-8xl xl:text-[7.5rem]" style="--dur:1s;--delay:0.15s;--from-y:24px">Pura<br><span class="text-gradient">adrenalina</span></h1>' +
    '<p class="anim-in mt-7 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg" style="--dur:1s;--delay:0.3s;--from-y:24px">Los automóviles más extraordinarios del mundo, reunidos en una sola colección.</p>' +
    '<div class="anim-in mt-10" style="--dur:1s;--delay:0.45s;--from-y:24px">' +
    '<a href="/marketplace" data-nav class="group inline-flex items-center gap-3 rounded-xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:gap-4 hover:shadow-[0_12px_40px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98]">Explorar vehículos ' +
    icon("ArrowRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1") + "</a>" +
    "</div></div></div>" +
    '<div class="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 lg:block" id="hero-scroll-hint">' +
    '<div class="scroll-hint">' + icon("ChevronDown", "h-5 w-5 text-muted-foreground/60", 1.5) + "</div>" +
    "</div></section>" +
    // --- Selección destacada ---
    '<section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">' +
    '<div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">' +
    '<div class="max-w-2xl">' +
    '<p class="anim-view text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.5s;--from-y:10px">Nuestra Selección</p>' +
    '<h2 class="anim-view text-display mt-5 text-4xl text-foreground sm:text-5xl lg:text-6xl" style="--dur:0.7s;--delay:0.05s">Potencia sin<br><span class="text-gradient">compromisos</span></h2>' +
    "</div>" +
    '<div class="anim-view" style="--dur:0.5s;--delay:0.1s;--from-y:10px">' +
    '<a href="/marketplace" data-nav class="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground">Ver todo el catálogo ' +
    icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") + "</a>" +
    "</div></div>" +
    '<div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">' +
    destacados.map((v, i) => vehicleCard(v, { etiquetaBoton: "Explorar vehículo", index: i })).join("") +
    "</div></section>" +
    // --- Showcase cinematográfico ---
    '<section id="showcase" class="relative flex min-h-[90svh] items-center overflow-hidden border-y border-border/40">' +
    '<div class="parallax-layer absolute inset-0 z-0" id="showcase-bg">' +
    smartImg(showcase.imagenes[1] || showcase.imagenes[0], showcase.marca + " " + showcase.modelo, {}) +
    '<div class="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent"></div>' +
    '<div class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30"></div>' +
    "</div>" +
    '<div class="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><div class="max-w-xl">' +
    '<p class="anim-view text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.6s">' + esc(showcase.marca) + "</p>" +
    '<h2 class="anim-view text-display mt-5 text-4xl text-foreground sm:text-6xl lg:text-7xl" style="--dur:0.8s;--delay:0.1s;--from-y:24px">' + esc(showcase.modelo) + "</h2>" +
    '<p class="anim-view mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg" style="--dur:0.8s;--delay:0.2s;--from-y:24px">Ingeniería que redefine los límites. Una síntesis perfecta entre tradición y futuro.</p>' +
    '<div class="anim-view mt-10 flex items-center gap-8 sm:gap-10" style="--dur:0.8s;--delay:0.3s;--from-y:24px">' +
    specsShowcase.map((s, i) =>
      (i > 0 ? '<div class="h-10 w-px bg-border/60"></div>' : "") +
      "<div>" +
      '<p class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">' + s[0] + "</p>" +
      '<p class="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">' + s[1] + "</p>" +
      "</div>"
    ).join("") +
    "</div>" +
    '<div class="anim-view mt-10" style="--dur:0.8s;--delay:0.4s;--from-y:24px">' +
    '<a href="/vehiculos/' + showcase.id + '" data-nav class="group inline-flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur-md transition-all duration-300 hover:bg-background/60 hover:gap-4 active:scale-[0.98]">Descubrir el vehículo ' +
    icon("ArrowUpRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5") + "</a>" +
    "</div></div></div></section>" +
    // --- Por qué elegirnos ---
    '<section class="border-y border-border/40 bg-secondary/20">' +
    '<div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">' +
    '<div class="max-w-2xl">' +
    '<p class="anim-view text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.5s;--from-y:10px">El lujo en movimiento</p>' +
    '<h2 class="anim-view text-display mt-5 text-4xl text-foreground sm:text-5xl lg:text-6xl" style="--dur:0.7s;--delay:0.05s">Diseñado para los<br><span class="text-gradient">amantes del detalle</span></h2>' +
    "</div>" +
    '<div class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">' +
    razones.map((r, i) =>
      '<div class="anim-view group rounded-2xl border border-border/50 bg-card/50 p-7 shadow-card transition-all duration-500 hover:border-border hover:bg-card hover:shadow-card-hover" style="--dur:0.6s;--delay:' + Math.min(i * 0.08, 0.4).toFixed(2) + 's;--from-y:24px">' +
      '<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">' + icon(r[0], "h-5 w-5", 1.8) + "</span>" +
      '<h3 class="mt-6 text-base font-semibold tracking-tight text-foreground">' + r[1] + "</h3>" +
      '<p class="mt-2.5 text-sm leading-relaxed text-muted-foreground">' + r[2] + "</p>" +
      "</div>"
    ).join("") +
    "</div></div></section>" +
    // --- Marcas ---
    '<section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">' +
    '<div class="max-w-2xl">' +
    '<p class="anim-view text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.5s;--from-y:10px">Las casas más prestigiosas</p>' +
    '<h2 class="anim-view text-display mt-5 text-4xl text-foreground sm:text-5xl lg:text-6xl" style="--dur:0.7s;--delay:0.05s">Marcas que<br><span class="text-gradient">definen épocas</span></h2>' +
    '<p class="anim-view mt-6 max-w-md text-base leading-relaxed text-muted-foreground" style="--dur:0.6s;--delay:0.1s">Trabajamos con los fabricantes más legendarios del mundo para ofrecerte lo mejor de cada casa.</p>' +
    "</div>" +
    '<div class="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">' +
    marcas.map((m, i) =>
      '<div class="anim-view group flex aspect-[3/2] items-center justify-center rounded-2xl border border-border/50 bg-card/50 px-4 shadow-card transition-all duration-500 hover:border-border hover:bg-card hover:shadow-card-hover" style="--dur:0.4s;--delay:' + Math.min(i * 0.03, 0.3).toFixed(2) + 's">' +
      '<span class="text-center text-sm font-semibold tracking-tight text-muted-foreground transition-colors duration-500 group-hover:text-foreground sm:text-base">' + esc(m) + "</span>" +
      "</div>"
    ).join("") +
    "</div>" +
    '<div class="mt-14">' +
    '<a href="/marketplace" data-nav class="group inline-flex items-center gap-3 rounded-xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:gap-4 hover:shadow-[0_12px_40px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98]">Explorar todos los vehículos ' +
    icon("ArrowRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1") + "</a>" +
    "</div></section>";

  return {
    title: "Vehículos de Alta Gama · Digital Marketplace",
    html: siteShell("/", html),
    mount() {
      // Parallax del hero y del showcase (equivale a useScroll/useTransform).
      const heroBg = document.getElementById("hero-bg");
      const heroContent = document.getElementById("hero-content");
      const showcaseBg = document.getElementById("showcase-bg");
      const showcaseSec = document.getElementById("showcase");
      const hint = document.getElementById("hero-scroll-hint");
      let raf = null;
      function onScroll() {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const y = window.scrollY;
          const vh = window.innerHeight;
          if (heroBg) {
            const p = Math.min(1, Math.max(0, y / vh));
            heroBg.style.transform = "translateY(" + p * 80 + "px) scale(" + (1 + p * 0.08) + ")";
            if (heroContent) {
              heroContent.style.transform = "translateY(" + p * -30 + "px)";
              heroContent.style.opacity = String(1 - Math.min(1, p / 0.6));
            }
            if (hint) hint.style.opacity = String(1 - Math.min(1, p / 0.6));
          }
          if (showcaseBg && showcaseSec) {
            const r = showcaseSec.getBoundingClientRect();
            const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
            const ty = -8 + prog * 16;
            const sc = prog < 0.5 ? 1.1 - prog * 0.2 : 1 + (prog - 0.5) * 0.1;
            showcaseBg.style.transform = "translateY(" + ty + "%) scale(" + sc.toFixed(3) + ")";
          }
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    },
  };
}

// ---------------------------------------------------------------------------
// MARKETPLACE
// ---------------------------------------------------------------------------
const ORDENAMIENTOS = [
  { valor: "relevancia", etiqueta: "Relevancia" },
  { valor: "precio-asc", etiqueta: "Precio: menor a mayor" },
  { valor: "precio-desc", etiqueta: "Precio: mayor a menor" },
  { valor: "año-desc", etiqueta: "Año: más reciente" },
  { valor: "potencia-desc", etiqueta: "Potencia: mayor a menor" },
];
const PRECIO_MIN = 20000, PRECIO_MAX = 600000;
const AÑO_MIN = 2020, AÑO_MAX = 2024;
const POTENCIA_MAX = 1100;

const marketplaceState = {
  busqueda: "",
  filtros: {
    marca: null, categorias: [], combustibles: [], tracciones: [],
    precioMin: PRECIO_MIN, precioMax: PRECIO_MAX,
    añoMin: AÑO_MIN, añoMax: AÑO_MAX, potenciaMin: 0,
  },
  panelAbierto: false,
};

function marketplaceFiltrados() {
  const vehiculos = DB.vehiculos();
  const f = marketplaceState.filtros;
  const termino = marketplaceState.busqueda.trim().toLowerCase();
  const resultado = vehiculos.filter((v) => {
    const coincideBusqueda = termino ? (v.marca + " " + v.modelo).toLowerCase().includes(termino) : true;
    const coincideMarca = f.marca ? v.marca === f.marca : true;
    const coincideCategoria = f.categorias.length === 0 || f.categorias.includes(v.categoria);
    const coincideCombustible = f.combustibles.length === 0 || f.combustibles.includes(v.combustible);
    const coincideTraccion = f.tracciones.length === 0 || f.tracciones.includes(v.traccion);
    const coincidePrecio = v.precio >= f.precioMin && v.precio <= f.precioMax;
    const coincideAño = v.año >= f.añoMin && v.año <= f.añoMax;
    const coincidePotencia = v.potencia >= f.potenciaMin;
    return coincideBusqueda && coincideMarca && coincideCategoria && coincideCombustible &&
      coincideTraccion && coincidePrecio && coincideAño && coincidePotencia;
  });
  switch (Tienda.estado.ordenamiento) {
    case "precio-asc": resultado.sort((a, b) => a.precio - b.precio); break;
    case "precio-desc": resultado.sort((a, b) => b.precio - a.precio); break;
    case "año-desc": resultado.sort((a, b) => b.año - a.año); break;
    case "potencia-desc": resultado.sort((a, b) => b.potencia - a.potencia); break;
  }
  return resultado;
}

function hayFiltrosActivos() {
  const f = marketplaceState.filtros;
  return (
    marketplaceState.busqueda.trim() !== "" ||
    f.marca !== null ||
    f.categorias.length > 0 ||
    f.combustibles.length > 0 ||
    f.tracciones.length > 0 ||
    f.precioMin !== PRECIO_MIN ||
    f.precioMax !== PRECIO_MAX ||
    f.añoMin !== AÑO_MIN ||
    f.añoMax !== AÑO_MAX ||
    f.potenciaMin !== 0
  );
}

function chipFiltro(grupo, valor, activo) {
  return (
    '<button data-action="filtro-chip" data-grupo="' + grupo + '" data-valor="' + esc(valor) + '" class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ' +
    (activo ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground") + '">' +
    esc(valor) + "</button>"
  );
}

function grupoFiltro(etiqueta, chips) {
  return (
    "<div>" +
    '<p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">' + etiqueta + "</p>" +
    '<div class="flex flex-wrap gap-1.5">' + chips + "</div>" +
    "</div>"
  );
}

function sliderGrupo(etiqueta, contenido) {
  return (
    "<div>" +
    '<p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">' + etiqueta + "</p>" +
    contenido +
    "</div>"
  );
}

function filtrosPanelHtml() {
  const f = marketplaceState.filtros;
  return (
    '<div class="space-y-5 rounded-2xl border border-border/70 bg-card p-5">' +
    '<div class="flex items-center gap-2">' +
    icon("SlidersHorizontal", "h-4 w-4 text-muted-foreground") +
    '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Filtros</h2>' +
    "</div>" +
    grupoFiltro("Categoría", CATEGORIAS.map((c) => chipFiltro("categorias", c, f.categorias.includes(c))).join("")) +
    sliderGrupo(
      "Precio: " + f.precioMin.toLocaleString("es-ES") + " - " + f.precioMax.toLocaleString("es-ES"),
      '<input type="range" class="slider-premium" min="' + PRECIO_MIN + '" max="' + PRECIO_MAX + '" step="5000" value="' + f.precioMin + '" data-filtro-range="precioMin" aria-label="Precio mínimo">' +
      '<input type="range" class="slider-premium" min="' + PRECIO_MIN + '" max="' + PRECIO_MAX + '" step="5000" value="' + f.precioMax + '" data-filtro-range="precioMax" aria-label="Precio máximo">' +
      '<div class="flex items-center justify-between text-[11px] text-muted-foreground"><span>Mín: ' + f.precioMin.toLocaleString("es-ES") + '</span><span>Máx: ' + f.precioMax.toLocaleString("es-ES") + "</span></div>"
    ) +
    sliderGrupo(
      "Año: " + f.añoMin + " - " + f.añoMax,
      '<input type="range" class="slider-premium" min="' + AÑO_MIN + '" max="' + AÑO_MAX + '" step="1" value="' + f.añoMin + '" data-filtro-range="añoMin" aria-label="Año mínimo">' +
      '<input type="range" class="slider-premium" min="' + AÑO_MIN + '" max="' + AÑO_MAX + '" step="1" value="' + f.añoMax + '" data-filtro-range="añoMax" aria-label="Año máximo">'
    ) +
    sliderGrupo(
      "Potencia mín: " + f.potenciaMin + " HP",
      '<input type="range" class="slider-premium" min="0" max="' + POTENCIA_MAX + '" step="50" value="' + f.potenciaMin + '" data-filtro-range="potenciaMin" aria-label="Potencia mínima">'
    ) +
    grupoFiltro("Combustible", COMBUSTIBLES.map((c) => chipFiltro("combustibles", c, f.combustibles.includes(c))).join("")) +
    grupoFiltro("Tracción", TRACCIONES.map((t) => chipFiltro("tracciones", t, f.tracciones.includes(t))).join("")) +
    "</div>"
  );
}

function pageMarketplace() {
  const vehiculos = DB.vehiculos();
  const marcas = DB.marcasDisponibles();
  const filtrados = marketplaceFiltrados();
  const f = marketplaceState.filtros;

  const chipsMarcas =
    '<div class="scrollbar-premium -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">' +
    '<button data-action="filtro-marca" data-valor="" class="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ' +
    (f.marca === null ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground") + '">Todas</button>' +
    marcas.map((m) =>
      '<button data-action="filtro-marca" data-valor="' + esc(m) + '" class="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ' +
      (f.marca === m ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground") + '">' + esc(m) + "</button>"
    ).join("") +
    "</div>";

  const grid =
    filtrados.length > 0
      ? '<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">' +
        filtrados.map((v, i) => vehicleCard(v, { etiquetaBoton: "Explorar vehículo", index: i })).join("") +
        "</div>"
      : '<div class="anim-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">' +
        icon("Search", "h-8 w-8 text-muted-foreground", 1.5) +
        '<p class="mt-4 text-lg font-medium text-foreground">No se encontraron vehículos</p>' +
        '<p class="mt-1 text-sm text-muted-foreground">Prueba ajustando los filtros de búsqueda.</p>' +
        '<button data-action="limpiar-filtros" class="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Limpiar filtros</button>' +
        "</div>";

  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">' +
    '<section class="hero-glow relative overflow-hidden rounded-3xl border border-border/50 px-6 py-16 sm:px-10 sm:py-20">' +
    '<div class="relative z-10 mx-auto max-w-3xl text-center">' +
    '<span class="anim-in inline-block text-eyebrow text-[11px] text-[var(--signature)]" style="--dur:0.5s;--from-y:10px">Catálogo completo · ' + vehiculos.length + " modelos</span>" +
    '<h1 class="anim-in text-display mt-6 text-4xl text-foreground sm:text-5xl lg:text-6xl" style="--dur:0.7s;--delay:0.05s">Descubre el vehículo<br><span class="text-gradient">ideal para ti</span></h1>' +
    "</div></section>" +
    '<section class="mt-8 flex flex-col gap-3">' +
    '<div class="flex flex-col gap-3 sm:flex-row sm:items-center">' +
    '<div class="relative flex-1">' +
    icon("Search", "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") +
    '<input id="busqueda" type="text" placeholder="Buscar por marca o modelo…" aria-label="Buscar vehículos" value="' + esc(marketplaceState.busqueda) + '" class="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-ring/40">' +
    (marketplaceState.busqueda
      ? '<button data-action="limpiar-busqueda" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground" aria-label="Limpiar búsqueda">' + icon("X", "h-4 w-4") + "</button>"
      : "") +
    "</div>" +
    '<div class="flex items-center gap-2">' +
    '<button data-action="toggle-panel-filtros" class="flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors sm:px-4 lg:hidden ' +
    (marketplaceState.panelAbierto ? "border-foreground/30 bg-secondary text-foreground" : "border-border bg-card text-muted-foreground") + '">' +
    icon("SlidersHorizontal", "h-4 w-4") + "<span>Filtros</span></button>" +
    '<div class="relative min-w-0 flex-1 sm:flex-none">' +
    '<select id="ordenamiento" aria-label="Ordenar por" class="select-premium h-12 w-full appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground outline-none transition-colors focus:border-foreground/30 sm:w-auto sm:pl-4 sm:pr-10">' +
    ORDENAMIENTOS.map((o) =>
      '<option value="' + o.valor + '"' + (Tienda.estado.ordenamiento === o.valor ? " selected" : "") + ">" + o.etiqueta + "</option>"
    ).join("") +
    "</select>" +
    icon("ChevronDown", "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") +
    "</div></div></div>" +
    chipsMarcas +
    '<div class="flex items-center justify-between">' +
    '<div class="flex items-center gap-2 text-sm text-muted-foreground">' +
    icon("SlidersHorizontal", "h-4 w-4") +
    "<span>" + filtrados.length + " resultado" + (filtrados.length === 1 ? "" : "s") + "</span>" +
    "</div>" +
    (hayFiltrosActivos()
      ? '<button data-action="limpiar-filtros" class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">' + icon("X", "h-3.5 w-3.5") + "Limpiar filtros</button>"
      : "") +
    "</div></section>" +
    '<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">' +
    '<div id="panel-filtros-movil" class="filtros-movil lg:hidden" style="height:' + (marketplaceState.panelAbierto ? "auto" : "0") + '">' +
    (marketplaceState.panelAbierto ? filtrosPanelHtml() : "") +
    "</div>" +
    '<aside class="hidden lg:block"><div class="sticky top-20">' + filtrosPanelHtml() + "</div></aside>" +
    '<section class="pb-4">' + grid + "</section>" +
    "</div></div>";

  return {
    title: "Marketplace de vehículos · Digital Marketplace",
    html: siteShell("/marketplace", html),
    mount() {
      const input = document.getElementById("busqueda");
      if (input) {
        input.addEventListener("input", () => {
          marketplaceState.busqueda = input.value;
          rerender(true);
        });
      }
      const sel = document.getElementById("ordenamiento");
      if (sel) {
        sel.addEventListener("change", () => {
          Tienda.setOrdenamiento(sel.value);
          rerender(true);
        });
      }
      document.querySelectorAll("[data-filtro-range]").forEach((r) => {
        r.addEventListener("input", () => {
          const key = r.getAttribute("data-filtro-range");
          const val = parseInt(r.value, 10);
          const f = marketplaceState.filtros;
          f[key] = val;
          // Restricciones cruzadas (min <= max)
          if (key === "precioMin" && f.precioMin > f.precioMax) f.precioMax = f.precioMin;
          if (key === "precioMax" && f.precioMax < f.precioMin) f.precioMin = f.precioMax;
          if (key === "añoMin" && f.añoMin > f.añoMax) f.añoMax = f.añoMin;
          if (key === "añoMax" && f.añoMax < f.añoMin) f.añoMin = f.añoMax;
          rerender(true);
        });
      });
    },
  };
}

// ---------------------------------------------------------------------------
// MARCAS
// ---------------------------------------------------------------------------
function pageMarcas() {
  const marcas = DB.marcas();
  const cards = marcas.map((b, i) => {
    const inicial = b.name.charAt(0);
    return (
      '<a href="/marcas/' + b.slug + '" data-nav class="card-in group block overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-500 hover:border-border hover:shadow-card-hover" style="--delay:' + Math.min(i * 0.04, 0.4).toFixed(2) + 's">' +
      '<div class="relative aspect-[16/9] w-full overflow-hidden bg-secondary">' +
      (b.imagen
        ? '<div class="h-full w-full opacity-70 transition-opacity duration-700 group-hover:opacity-90">' +
          smartImg(b.imagen, "Vehículo destacado de " + b.name, { hoverScale: 1.05 }) +
          "</div>"
        : '<div class="flex h-full w-full items-center justify-center"><span class="text-3xl font-bold text-muted-foreground/40">' + esc(inicial) + "</span></div>") +
      '<div class="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent"></div>' +
      '<span class="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-background/70 text-base font-bold text-foreground backdrop-blur-md">' + esc(inicial) + "</span>" +
      "</div>" +
      '<div class="p-5">' +
      '<h2 class="text-lg font-semibold tracking-tight text-foreground">' + esc(b.name) + "</h2>" +
      '<p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">' + esc(b.description) + "</p>" +
      '<div class="mt-4 flex items-end justify-between">' +
      "<div>" +
      '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Modelos</p>' +
      '<p class="text-base font-semibold text-foreground">' + b.cantidad + "</p>" +
      "</div>" +
      '<div class="text-right">' +
      '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Desde</p>' +
      '<p class="text-sm font-semibold text-foreground">' + formatearPrecio(b.precioMin) + "</p>" +
      "</div></div>" +
      '<div class="mt-4 flex items-center gap-1.5 text-sm font-medium text-foreground">Ver modelos ' +
      icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") +
      "</div></div></a>"
    );
  }).join("");

  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">' +
    pageHeaderHtml(
      "Explora los fabricantes",
      "Marcas disponibles",
      "Descubre los fabricantes más prestigiosos del mundo. Cada marca ofrece una selección única de vehículos con su propio carácter y herencia."
    ).replace('class="mt-3 text-sm text-muted-foreground"', 'class="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground"') +
    '<section class="mt-8 pb-4"><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">' +
    cards +
    "</div></section></div>";

  return { title: "Marcas · Digital Marketplace", html: siteShell("/marcas", html) };
}

// ---------------------------------------------------------------------------
// MARCA (detalle)
// ---------------------------------------------------------------------------
function pageMarca(slug) {
  const slugNorm = String(slug || "").toLowerCase();
  const marca = DB.marcas().find((m) => m.slug === slugNorm);
  const orden = SEED.ordenRelevancia || [];
  const vehiculos = DB.vehiculos()
    .filter((v) => marca && v.marca === marca.name)
    .sort((a, b) => {
      const ia = orden.indexOf(a.id);
      const ib = orden.indexOf(b.id);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });

  if (!marca || vehiculos.length === 0) {
    const html =
      '<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">' +
      '<h1 class="text-display text-3xl text-foreground">Marca no encontrada</h1>' +
      '<a href="/marcas" data-nav class="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Ver todas las marcas</a>' +
      "</div>";
    return { title: "Marca no encontrada · Digital Marketplace", html: siteShell("/marcas", html) };
  }

  const precios = vehiculos.map((v) => v.precio);
  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">' +
    '<a href="/marcas" data-nav class="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("ArrowLeft", "h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5") + "Todas las marcas</a>" +
    '<section class="anim-in mt-6 border-b border-border/60 pb-8" style="--dur:0.5s">' +
    '<div class="flex items-center gap-4">' +
    '<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">' + esc(marca.name.charAt(0)) + "</span>" +
    "<div>" +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Fabricante</p>' +
    '<h1 class="text-display mt-2 text-3xl text-foreground sm:text-4xl lg:text-5xl">' + esc(marca.name) + "</h1>" +
    "</div></div>" +
    '<div class="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">' +
    "<div>" +
    '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Modelos disponibles</p>' +
    '<p class="text-2xl font-semibold tracking-tight text-foreground">' + vehiculos.length + "</p>" +
    "</div>" +
    '<div class="hidden h-10 w-px bg-border sm:block"></div>' +
    "<div>" +
    '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rango de precios</p>' +
    '<p class="text-2xl font-semibold tracking-tight text-foreground">' + formatearPrecio(Math.min.apply(null, precios)) + " - " + formatearPrecio(Math.max.apply(null, precios)) + "</p>" +
    "</div></div></section>" +
    '<section class="mt-8 pb-4"><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">' +
    vehiculos.map((v, i) => vehicleCard(v, { etiquetaBoton: "Explorar vehículo", index: i })).join("") +
    "</div></section></div>";

  return { title: "Vehículos " + marca.name + " · Digital Marketplace", html: siteShell("/marcas", html) };
}

// ---------------------------------------------------------------------------
// VEHÍCULO (detalle)
// ---------------------------------------------------------------------------
function relacionados(actual, cantidad) {
  return DB.vehiculos()
    .filter((v) => v.id !== actual.id)
    .map((v) => {
      let score = 0;
      if (v.marca === actual.marca) score += 3;
      if (v.categoria === actual.categoria) score += 2;
      if (v.combustible === actual.combustible) score += 1;
      const diff = Math.abs(v.precio - actual.precio) / actual.precio;
      if (diff < 0.3) score += 2;
      else if (diff < 0.6) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, cantidad || 3)
    .map((r) => r.v);
}

const SPECS = [
  ["motor", "Motor", "Gauge", ""],
  ["potencia", "Potencia", "Zap", " HP"],
  ["torque", "Torque", "Gauge", " Nm"],
  ["transmision", "Transmisión", "Cog", ""],
  ["combustible", "Combustible", "Fuel", ""],
  ["traccion", "Tracción", "Wind", ""],
  ["año", "Año", "Calendar", ""],
  ["velocidadMaxima", "Vel. máxima", "Rocket", " km/h"],
  ["aceleracion0a100", "0-100 km/h", "Timer", " s"],
];

function pageVehiculo(slug) {
  const v = DB.vehiculo(slug);
  if (!v) {
    const html =
      '<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">' +
      '<h1 class="text-display text-3xl text-foreground">Vehículo no encontrado</h1>' +
      '<a href="/marketplace" data-nav class="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Volver al marketplace</a>' +
      "</div>";
    return { title: "Vehículo no encontrado · Digital Marketplace", html: siteShell("/marketplace", html) };
  }

  const nombre = v.marca + " " + v.modelo;
  const disponible = DB.estaDisponible(v);
  const comprado = Tienda.estaComprado(v.id);
  const enCarrito = Tienda.estaEnCarrito(v.id);
  const rel = relacionados(v, 3);

  const highlights = [
    ["Rocket", "Velocidad máxima", formatearNumero(v.velocidadMaxima) + " km/h"],
    ["Timer", "0—100 km/h", v.aceleracion0a100 + "s"],
    ["Zap", "Potencia", formatearNumero(v.potencia) + " HP"],
    ["Gauge", "Torque", formatearNumero(v.torque) + " Nm"],
  ];

  let ctaCls, ctaHtml, ctaDisabled = false;
  if (!disponible) {
    ctaCls = "cursor-not-allowed border border-border/50 bg-secondary/40 text-muted-foreground";
    ctaHtml = icon("Ban", "h-4 w-4", 2.2) + "<span>Vehículo agotado</span>";
    ctaDisabled = true;
  } else if (comprado) {
    ctaCls = "cursor-default border border-border/50 bg-secondary/50 text-muted-foreground";
    ctaHtml = icon("BadgeCheck", "h-4 w-4 text-[var(--success)]", 2.3) + "<span>Vehículo comprado</span>";
    ctaDisabled = true;
  } else if (enCarrito) {
    ctaCls = "cursor-default border border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]";
    ctaHtml = icon("Check", "h-4 w-4", 2.5) + "<span>En el carrito</span>";
    ctaDisabled = true;
  } else {
    ctaCls = "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.99]";
    ctaHtml = icon("ShoppingCart", "h-4 w-4", 2.2) + "<span>Agregar al carrito</span>";
  }

  const thumbs = v.imagenes.map((img, i) =>
    '<button data-action="galeria" data-index="' + i + '" class="relative aspect-[4/3] overflow-hidden rounded-xl border transition-all duration-200 ' +
    (i === 0 ? "border-foreground/40 ring-2 ring-ring/40" : "border-border/70 opacity-60 hover:opacity-100") +
    '" aria-label="Ver imagen ' + (i + 1) + '">' +
    '<img src="' + imgUrl(img) + '" alt="' + esc(nombre) + " - miniatura " + (i + 1) + '" class="h-full w-full object-cover" loading="lazy">' +
    "</button>"
  ).join("");

  const specs = SPECS.map((s) => {
    let valor = v[s[0]];
    if (typeof valor === "number" && s[0] !== "año" && s[0] !== "aceleracion0a100") valor = formatearNumero(valor);
    return (
      '<div class="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border">' +
      '<div class="flex items-center gap-2 text-muted-foreground">' +
      icon(s[2], "h-4 w-4", 2) +
      '<span class="text-[11px] font-medium uppercase tracking-wider">' + s[1] + "</span>" +
      "</div>" +
      '<p class="mt-2 text-sm font-semibold text-foreground">' + valor + s[3] + "</p>" +
      "</div>"
    );
  }).join("");

  const html =
    '<div class="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">' +
    '<a href="/marketplace" data-nav class="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("ArrowLeft", "h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5") + "Volver al marketplace</a>" +
    '<div class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">' +
    // Columna izquierda: galería
    '<div class="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start lg:h-fit">' +
    '<div id="galeria-main" class="anim-in relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-card" style="--dur:0.5s">' +
    smartImg(v.imagenes[0], nombre + " - imagen 1", { priority: true }) +
    '<span class="absolute left-4 top-4 rounded-full bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground backdrop-blur-md">' + esc(v.marca) + "</span>" +
    favCompareButtons(v, nombre) +
    (comprado
      ? '<span class="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-[var(--success)]/20 px-3 py-1.5 text-[11px] font-semibold text-[var(--success)] backdrop-blur-md">' + icon("BadgeCheck", "h-3.5 w-3.5", 2.5) + "<span>Comprado</span></span>"
      : "") +
    "</div>" +
    '<div class="grid grid-cols-4 gap-2 sm:gap-3" id="galeria-thumbs">' + thumbs + "</div>" +
    '<div class="mt-4 hidden rounded-2xl border border-border/50 bg-card p-5 lg:block">' +
    '<p class="text-eyebrow text-[10px] text-[var(--signature)]">Destacados</p>' +
    '<div class="mt-4 grid grid-cols-2 gap-4">' +
    highlights.map((h) =>
      "<div>" +
      '<div class="flex items-center gap-1.5 text-muted-foreground">' + icon(h[0], "h-3.5 w-3.5") +
      '<span class="text-[10px] font-medium uppercase tracking-wider">' + h[1] + "</span></div>" +
      '<p class="mt-1.5 text-base font-semibold tracking-tight text-foreground">' + h[2] + "</p>" +
      "</div>"
    ).join("") +
    "</div></div></div>" +
    // Columna derecha: información
    "<div>" +
    '<div class="anim-in" style="--dur:0.5s">' +
    '<div class="flex items-center gap-2">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">' + esc(v.marca) + "</p>" +
    '<span class="rounded-lg border border-border/70 bg-secondary/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">' + esc(v.categoria) + "</span>" +
    "</div>" +
    '<h1 class="text-display mt-4 text-4xl text-foreground sm:text-5xl lg:text-6xl">' + esc(v.modelo) + "</h1>" +
    '<p class="mt-4 text-sm font-medium text-muted-foreground">' + v.año + " · " + esc(v.combustible) + " · " + formatearNumero(v.potencia) + " HP</p>" +
    "</div>" +
    '<div class="anim-in mt-8 rounded-2xl border border-border/70 bg-secondary/40 p-6" style="--dur:0.5s;--delay:0.1s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Precio</p>' +
    '<p class="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">' + formatearPrecio(v.precio) + "</p>" +
    '<p class="mt-2 text-xs text-muted-foreground">Financiamiento disponible · Simulación sin compromiso</p>' +
    "</div>" +
    '<p class="anim-in mt-8 max-w-prose text-base leading-relaxed text-muted-foreground" style="--dur:0.5s;--delay:0.15s">' + esc(v.descripcion) + "</p>" +
    '<div class="anim-in mt-8" style="--dur:0.5s;--delay:0.2s">' +
    '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Especificaciones técnicas</h2>' +
    '<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">' + specs + "</div>" +
    "</div>" +
    '<div class="anim-in mt-8" style="--dur:0.5s;--delay:0.25s" id="financing"></div>' +
    '<div class="anim-in mt-8 flex flex-col gap-3" style="--dur:0.5s;--delay:0.3s">' +
    "<button " + (ctaDisabled ? "disabled " : "") + 'data-action="add-carrito" data-slug="' + v.id + '" data-nombre="' + esc(nombre) + '" class="flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300 ' + ctaCls + '">' +
    ctaHtml +
    "</button>" +
    (enCarrito
      ? '<a href="/carrito" data-nav class="rounded-xl border border-border bg-card px-6 py-4 text-center text-sm font-semibold text-foreground transition-colors hover:bg-accent">Ver carrito y finalizar compra</a>'
      : "") +
    (comprado
      ? '<a href="/garaje" data-nav class="rounded-xl border border-border bg-card px-6 py-4 text-center text-sm font-semibold text-foreground transition-colors hover:bg-accent">Ver en mi garaje</a>'
      : "") +
    "</div>" +
    "</div></div>" +
    // Relacionados
    (rel.length
      ? '<section class="mt-20 border-t border-border/40 pt-16">' +
        '<p class="text-eyebrow text-[11px] text-[var(--signature)]">También te puede interesar</p>' +
        '<h2 class="text-display mt-5 text-3xl text-foreground sm:text-4xl">Vehículos relacionados</h2>' +
        '<div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">' +
        rel.map((rv, i) => vehicleCard(rv, { etiquetaBoton: "Explorar vehículo", index: i })).join("") +
        "</div></section>"
      : "") +
    // Reseñas
    '<section id="reviews" class="anim-view mt-10 rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-8"></section>' +
    "</div>";

  return {
    title: nombre + " · Digital Marketplace",
    html: siteShell("/vehiculos", html),
    mount() {
      Tienda.marcarVisto(v.id);
      DB.trackEvent("VEHICLE_VIEWED");
      mountFinancing(document.getElementById("financing"), v.precio);
      mountReviews(document.getElementById("reviews"), v);
    },
  };
}

// --- Galería (acción global usada por app.js) --------------------------------
function galeriaCambiar(index) {
  const main = document.getElementById("galeria-main");
  const thumbs = document.getElementById("galeria-thumbs");
  if (!main || !thumbs) return;
  // La imagen se obtiene del botón pulsado.
  const btn = thumbs.querySelector('[data-index="' + index + '"]');
  if (!btn) return;
  const img = btn.querySelector("img");
  const wrap = main.querySelector(".smart-img");
  if (wrap && img) {
    wrap.classList.remove("loaded");
    const mainImg = wrap.querySelector("img");
    mainImg.src = img.src;
    mainImg.alt = img.alt.replace("miniatura", "imagen");
    if (mainImg.complete) wrap.classList.add("loaded");
  }
  thumbs.querySelectorAll("button").forEach((b) => {
    const activo = b.getAttribute("data-index") === String(index);
    b.className =
      "relative aspect-[4/3] overflow-hidden rounded-xl border transition-all duration-200 " +
      (activo ? "border-foreground/40 ring-2 ring-ring/40" : "border-border/70 opacity-60 hover:opacity-100");
  });
}

// --- Simulador de financiamiento ---------------------------------------------
function mountFinancing(container, precio) {
  if (!container) return;
  const estado = {
    cuotaInicial: Math.round(precio * 0.2),
    numCuotas: 48,
    tasaInteres: 6.5,
  };

  function calcular() {
    const montoFinanciar = Math.max(0, precio - estado.cuotaInicial);
    const tasaMensual = estado.tasaInteres / 100 / 12;
    const cuotaMensual =
      montoFinanciar === 0 || estado.numCuotas === 0
        ? 0
        : tasaMensual === 0
          ? montoFinanciar / estado.numCuotas
          : (montoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, estado.numCuotas)) /
            (Math.pow(1 + tasaMensual, estado.numCuotas) - 1);
    const totalPagar = cuotaMensual * estado.numCuotas + estado.cuotaInicial;
    const totalInteres = cuotaMensual * estado.numCuotas - montoFinanciar;
    return { montoFinanciar, cuotaMensual, totalPagar, totalInteres };
  }

  function render() {
    const c = calcular();
    const porcentajeInicial = Math.round((estado.cuotaInicial / precio) * 100);
    container.innerHTML =
      '<div class="rounded-2xl border border-border/70 bg-card p-6 sm:p-7">' +
      '<div class="flex items-center gap-2.5">' +
      '<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">' + icon("Calculator", "h-4 w-4", 2.2) + "</span>" +
      "<div>" +
      '<p class="text-base font-semibold tracking-tight text-foreground">Simulador de financiamiento</p>' +
      '<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Estimación visual, no es una oferta real</p>' +
      "</div></div>" +
      '<div class="mt-6 space-y-5">' +
      "<div>" +
      '<div class="flex items-center justify-between">' +
      '<label class="text-sm font-medium text-foreground" for="fin-inicial">Cuota inicial</label>' +
      '<span class="text-sm font-semibold text-foreground">' + formatearPrecio(estado.cuotaInicial) + ' <span class="text-muted-foreground">(' + porcentajeInicial + "%)</span></span>" +
      "</div>" +
      '<input id="fin-inicial" type="range" class="slider-premium mt-2" min="0" max="' + precio + '" step="1000" value="' + estado.cuotaInicial + '" aria-label="Cuota inicial">' +
      "</div>" +
      "<div>" +
      '<div class="flex items-center justify-between">' +
      '<label class="text-sm font-medium text-foreground" for="fin-cuotas">Número de cuotas</label>' +
      '<span class="text-sm font-semibold text-foreground">' + estado.numCuotas + " meses</span>" +
      "</div>" +
      '<input id="fin-cuotas" type="range" class="slider-premium mt-2" min="12" max="84" step="12" value="' + estado.numCuotas + '" aria-label="Número de cuotas">' +
      '<div class="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>12</span><span>84</span></div>' +
      "</div>" +
      "<div>" +
      '<div class="flex items-center justify-between">' +
      '<label class="text-sm font-medium text-foreground" for="fin-tasa">Tasa de interés anual</label>' +
      '<span class="text-sm font-semibold text-foreground">' + estado.tasaInteres.toFixed(1) + "%</span>" +
      "</div>" +
      '<input id="fin-tasa" type="range" class="slider-premium mt-2" min="0" max="15" step="0.5" value="' + estado.tasaInteres + '" aria-label="Tasa de interés">' +
      "</div>" +
      "</div>" +
      '<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">' +
      '<div class="rounded-xl border border-[var(--signature)]/40 bg-[var(--signature)]/5 p-4">' +
      '<div class="flex items-center gap-1.5 text-muted-foreground">' + icon("Wallet", "h-3.5 w-3.5") +
      '<span class="text-[10px] font-medium uppercase tracking-wider">Cuota mensual</span></div>' +
      '<p class="mt-2 text-lg font-semibold tracking-tight text-[var(--signature)]">' + formatearPrecio(Math.round(c.cuotaMensual)) + "</p>" +
      "</div>" +
      '<div class="rounded-xl border border-border/70 bg-secondary/40 p-4">' +
      '<div class="flex items-center gap-1.5 text-muted-foreground">' + icon("Receipt", "h-3.5 w-3.5") +
      '<span class="text-[10px] font-medium uppercase tracking-wider">Monto financiado</span></div>' +
      '<p class="mt-2 text-base font-semibold tracking-tight text-foreground">' + formatearPrecio(c.montoFinanciar) + "</p>" +
      "</div>" +
      '<div class="rounded-xl border border-border/70 bg-secondary/40 p-4">' +
      '<div class="flex items-center gap-1.5 text-muted-foreground">' + icon("TrendingUp", "h-3.5 w-3.5") +
      '<span class="text-[10px] font-medium uppercase tracking-wider">Total a pagar</span></div>' +
      '<p class="mt-2 text-base font-semibold tracking-tight text-foreground">' + formatearPrecio(Math.round(c.totalPagar)) + "</p>" +
      '<p class="mt-0.5 text-[11px] text-muted-foreground">Intereses: ' + formatearPrecio(Math.round(c.totalInteres)) + "</p>" +
      "</div>" +
      "</div></div>";

    container.querySelector("#fin-inicial").addEventListener("input", (e) => {
      estado.cuotaInicial = parseInt(e.target.value, 10);
      render();
    });
    container.querySelector("#fin-cuotas").addEventListener("input", (e) => {
      estado.numCuotas = parseInt(e.target.value, 10);
      render();
    });
    container.querySelector("#fin-tasa").addEventListener("input", (e) => {
      estado.tasaInteres = parseFloat(e.target.value);
      render();
    });
  }
  render();
}

// --- Reseñas ------------------------------------------------------------------
function mountReviews(container, v) {
  if (!container) return;
  const slug = v.id;
  let escribiendo = false;
  let rating = 5;
  let comentario = "";
  let enviando = false;
  let error = "";

  function render() {
    const user = Auth.user();
    const data = DB.reviewsDe(slug);
    const promedio = data.average;
    const total = data.count;

    let accion = "";
    if (!user) {
      accion =
        '<div class="mt-5 flex items-center justify-between rounded-xl border border-border/40 bg-secondary/20 px-4 py-3">' +
        '<p class="text-sm text-muted-foreground">Inicia sesión para escribir una reseña.</p>' +
        '<a href="/login?redirect=/vehiculos/' + slug + '" data-nav class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--signature)] hover:underline">' +
        icon("LogIn", "h-4 w-4") + "Entrar</a></div>";
    } else if (escribiendo) {
      accion =
        '<form id="review-form" class="mt-5 space-y-4 rounded-xl border border-border/40 bg-secondary/20 p-4">' +
        "<div>" +
        '<label class="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tu valoración</label>' +
        '<div class="flex items-center gap-1">' +
        [1, 2, 3, 4, 5].map((n) =>
          '<button type="button" data-review-star="' + n + '" class="p-0.5" aria-label="' + n + ' estrellas">' +
          icon("Star", "h-6 w-6 transition-colors " + (n <= rating ? "fill-[var(--signature)] text-[var(--signature)]" : "text-muted-foreground/40 hover:text-muted-foreground"), 2) +
          "</button>"
        ).join("") +
        "</div></div>" +
        "<div>" +
        '<label class="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground" for="review-comment">Comentario (opcional)</label>' +
        '<textarea id="review-comment" rows="3" maxlength="500" placeholder="Cuéntanos tu experiencia con este vehículo…" class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-ring/30">' + esc(comentario) + "</textarea>" +
        "</div>" +
        (error
          ? '<div class="flex items-center gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">' + icon("AlertCircle", "h-4 w-4 shrink-0") + "<span>" + esc(error) + "</span></div>"
          : "") +
        '<div class="flex gap-3">' +
        '<button type="button" id="review-cancel" class="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Cancelar</button>' +
        '<button type="submit" ' + (enviando ? "disabled " : "") + 'class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">' +
        (enviando ? icon("Loader2", "h-4 w-4 animate-spin") + "<span>Publicando…</span>" : "<span>Publicar reseña</span>") +
        "</button></div></form>";
    } else {
      accion =
        '<div class="mt-5">' +
        '<button id="review-write" class="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">' +
        icon("PenLine", "h-4 w-4") + "Escribir una reseña</button>" +
        '<p class="mt-2 text-xs text-muted-foreground">Solo puedes reseñar vehículos que has comprado.</p>' +
        "</div>";
    }

    let lista;
    if (total === 0) {
      lista = '<p class="py-8 text-center text-sm text-muted-foreground">Aún no hay reseñas. ¡Sé el primero en opinar!</p>';
    } else {
      lista =
        '<ul class="mt-6 space-y-4">' +
        data.reviews.map((r, i) => {
          const nombre = r.user.name || "Cliente";
          return (
            '<li class="card-in rounded-xl border border-border/40 p-4" style="--delay:' + (i * 0.05).toFixed(2) + 's">' +
            '<div class="flex items-center justify-between">' +
            '<div class="flex items-center gap-2.5">' +
            '<span class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold uppercase text-muted-foreground">' + esc(nombre.charAt(0)) + "</span>" +
            "<div>" +
            '<p class="text-sm font-medium text-foreground">' + esc(nombre) + "</p>" +
            '<p class="text-[11px] text-muted-foreground">' + formatearFechaCorta(r.createdAt) + "</p>" +
            "</div></div>" +
            starsHtml(r.rating) +
            "</div>" +
            (r.comment ? '<p class="mt-3 text-sm leading-relaxed text-muted-foreground">' + esc(r.comment) + "</p>" : "") +
            "</li>"
          );
        }).join("") +
        "</ul>";
    }

    container.innerHTML =
      '<div class="flex items-center gap-2">' +
      icon("MessageSquare", "h-4 w-4 text-[var(--signature)]", 2) +
      '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Opiniones</h2>' +
      "</div>" +
      '<div class="mt-2 flex flex-wrap items-center justify-between gap-4">' +
      '<p class="text-lg font-semibold tracking-tight text-foreground">Reseñas de clientes</p>' +
      (total > 0
        ? '<div class="flex items-center gap-2">' +
          starsHtml(Math.round(promedio), "lg") +
          '<span class="text-sm font-medium text-foreground">' + promedio.toFixed(1) + "</span>" +
          '<span class="text-xs text-muted-foreground">(' + total + " reseña" + (total === 1 ? "" : "s") + ")</span>" +
          "</div>"
        : "") +
      "</div>" +
      accion +
      lista;

    const write = container.querySelector("#review-write");
    if (write) write.addEventListener("click", () => { escribiendo = true; error = ""; comentario = ""; render(); });
    const cancel = container.querySelector("#review-cancel");
    if (cancel) cancel.addEventListener("click", () => { escribiendo = false; error = ""; comentario = ""; render(); });
    const textarea = container.querySelector("#review-comment");
    if (textarea) textarea.addEventListener("input", () => { comentario = textarea.value; });
    container.querySelectorAll("[data-review-star]").forEach((b) => {
      b.addEventListener("click", () => {
        rating = parseInt(b.getAttribute("data-review-star"), 10);
        render();
      });
    });
    const form = container.querySelector("#review-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const u = Auth.user();
        if (!u) return;
        const comment = comentario;
        enviando = true;
        error = "";
        render();
        setTimeout(() => {
          const res = DB.crearReview(slug, u.email, rating, comment);
          enviando = false;
          if (res.ok) {
            escribiendo = false;
            comentario = "";
            toast("Reseña publicada", "Gracias por compartir tu experiencia.");
          } else {
            error = res.error || "No se pudo publicar la reseña.";
          }
          render();
        }, 600);
      });
    }
  }
  render();
}
