// ============================================================================
// components.js — Componentes compartidos (header, footer, tarjetas, etc.)
// ============================================================================
"use strict";

// ---------------------------------------------------------------------------
// SmartImage: contenedor con shimmer que aparece suave al cargar.
// ---------------------------------------------------------------------------
function smartImg(src, alt, attrs) {
  attrs = attrs || {};
  const cls = attrs.imgClass || "h-full w-full object-cover";
  const extra = attrs.hoverScale
    ? ' hover-scale" style="--hs:' + attrs.hoverScale + '"'
    : '"';
  return (
    '<span class="smart-img block h-full w-full' + extra + ">" +
    '<img src="' + imgUrl(src) + '" alt="' + esc(alt) + '" class="' + cls + '"' +
    (attrs.priority ? ' fetchpriority="high"' : ' loading="lazy"') + ">" +
    "</span>"
  );
}

// Marca una imagen como cargada (delegación en fase de captura desde app.js).
function smartImgBoot() {
  document.addEventListener(
    "load",
    function (ev) {
      if (ev.target && ev.target.tagName === "IMG") {
        const wrap = ev.target.closest(".smart-img");
        if (wrap) wrap.classList.add("loaded");
      }
    },
    true
  );
}

// ---------------------------------------------------------------------------
// Header (sticky) con navegación, insignias, tema y cuenta.
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "Home" },
  { href: "/marketplace", label: "Marketplace", icon: "Store" },
  { href: "/marcas", label: "Marcas", icon: "Building2" },
  { href: "/favoritos", label: "Favoritos", icon: "Heart", badge: "favoritos" },
  { href: "/comparar", label: "Comparar", icon: "GitCompareArrows", badge: "comparar" },
  { href: "/garaje", label: "Mi Garaje", icon: "CarFront", badge: "garaje" },
];

function estaActivo(path, href) {
  if (href === "/") return path === "/";
  if (href === "/marketplace") return path === "/marketplace" || path.indexOf("/vehiculos") === 0;
  return path.indexOf(href) === 0;
}

function badgeCount(key) {
  const e = Tienda.estado;
  const n = e[key] ? e[key].length : 0;
  return n;
}

function logoHtml(size) {
  const big = size === "lg";
  return (
    '<a href="/" data-nav class="group flex shrink-0 items-center gap-2.5" aria-label="Ir al inicio">' +
    '<span class="flex ' + (big ? "h-10 w-10" : "h-9 w-9") + ' items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-105">' +
    icon("Gauge", big ? "h-5 w-5" : "h-5 w-5", 2.2) +
    "</span>" +
    '<span class="hidden flex-col items-start leading-none sm:flex">' +
    '<span class="text-[15px] font-semibold tracking-tight text-foreground">Digital <span class="text-gradient">Marketplace</span></span>' +
    '<span class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Alta Gama</span>' +
    "</span></span></a>"
  );
}

function headerHtml(path) {
  const user = Auth.user();
  let nav = "";
  NAV_ITEMS.forEach((item) => {
    const activo = estaActivo(path, item.href);
    const cnt = item.badge ? badgeCount(item.badge) : 0;
    nav +=
      '<a href="' + item.href + '" data-nav class="relative flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition-colors duration-200 lg:px-3.5 ' +
      (activo ? "text-foreground" : "text-muted-foreground hover:text-foreground") +
      '" aria-label="' + item.label + '">' +
      (activo ? '<span class="absolute inset-0 rounded-full bg-secondary"></span>' : "") +
      '<span class="relative z-10 flex items-center gap-2">' +
      icon(item.icon, "h-4 w-4", 2) +
      '<span class="hidden xl:inline">' + item.label + "</span>" +
      (cnt > 0
        ? '<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">' + cnt + "</span>"
        : "") +
      "</span></a>";
  });

  let cuenta = "";
  if (user) {
    const inicial = (user.name || user.email || "?").charAt(0).toUpperCase();
    cuenta =
      '<div class="relative" id="cuenta-wrap">' +
      '<button id="cuenta-btn" class="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border/70 px-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground sm:px-3" aria-label="Menú de cuenta">' +
      '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold uppercase text-primary-foreground">' + esc(inicial) + "</span>" +
      '<span class="hidden max-w-[90px] truncate lg:inline">' + esc(user.name || "Cuenta") + "</span>" +
      "</button>" +
      '<div id="cuenta-menu" class="menu-pop absolute right-0 top-12 z-50 hidden w-52 min-w-[8rem] rounded-md border border-border bg-popover p-1 shadow-md">' +
      '<div class="px-2 py-1.5">' +
      '<p class="truncate text-sm font-medium text-foreground">' + esc(user.name || "Cuenta") + "</p>" +
      '<p class="truncate text-xs text-muted-foreground">' + esc(user.email) + "</p>" +
      "</div>" +
      '<div class="-mx-1 my-1 h-px bg-border"></div>' +
      menuItem("/perfil", "User", "Mi perfil") +
      menuItem("/pedidos", "Receipt", "Mis pedidos") +
      (user.role === "ADMIN" ? menuItem("/admin", "Shield", "Panel admin") : "") +
      '<div class="-mx-1 my-1 h-px bg-border"></div>' +
      '<button data-action="logout" class="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[var(--destructive)] outline-none select-none hover:bg-accent">' +
      icon("LogOut", "h-4 w-4") + "<span>Cerrar sesión</span></button>" +
      "</div></div>";
  } else {
    cuenta =
      '<a href="/login" data-nav class="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all duration-300 hover:text-foreground sm:flex ' +
      (estaActivo(path, "/login")
        ? "border-border bg-secondary text-foreground"
        : "border-border/70 text-muted-foreground") +
      '" aria-label="Iniciar sesión">' +
      icon("User", "h-4 w-4", 2) +
      '<span class="hidden lg:inline">Entrar</span></a>';
  }

  const cartCount = Tienda.estado.carrito.length;
  const carrito =
    '<a href="/carrito" data-nav class="group relative flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-2 text-sm font-medium transition-all duration-200 sm:px-3.5 ' +
    (estaActivo(path, "/carrito")
      ? "border-border bg-secondary text-foreground"
      : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground") +
    '" aria-label="Carrito con ' + cartCount + ' vehículo(s)">' +
    '<span class="relative">' +
    icon("ShoppingCart", "h-4 w-4 sm:h-[18px] sm:w-[18px]", 2) +
    (cartCount > 0
      ? '<span class="badge-pop absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">' + cartCount + "</span>"
      : "") +
    "</span>" +
    '<span class="hidden xl:inline">Carrito</span></a>';

  return (
    '<header class="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">' +
    '<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">' +
    logoHtml() +
    '<nav class="hidden items-center gap-0.5 lg:flex">' + nav + "</nav>" +
    '<div class="flex items-center gap-1.5 sm:gap-2">' +
    '<div class="hidden sm:block">' + themeToggleHtml() + "</div>" +
    cuenta +
    carrito +
    '<button data-action="menu-abrir" class="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground lg:hidden" aria-label="Abrir menú de navegación">' +
    icon("Menu", "h-5 w-5", 2) +
    "</button>" +
    "</div></div></header>"
  );
}

function menuItem(href, ic, label) {
  return (
    '<a href="' + href + '" data-nav class="relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none select-none hover:bg-accent">' +
    icon(ic, "h-4 w-4") + "<span>" + label + "</span></a>"
  );
}

// --- Selector de tema (escritorio) -----------------------------------------
function themeToggleHtml() {
  return (
    '<div class="relative" id="tema-wrap">' +
    '<button id="tema-btn" data-action="tema-menu" class="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-all duration-300 hover:text-foreground" aria-label="Cambiar tema">' +
    icon("Palette", "h-4 w-4", 2) +
    "</button>" +
    '<div id="tema-menu" class="menu-pop absolute right-0 top-12 z-50 hidden w-64 overflow-hidden rounded-2xl border border-border/70 bg-card p-2 shadow-card-hover">' +
    '<p class="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Tema visual</p>' +
    '<div class="space-y-0.5">' +
    TEMAS.map((t) => {
      const activo = Tema.actual() === t.id;
      return (
        '<button data-action="tema-set" data-tema="' + t.id + '" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ' +
        (activo ? "bg-secondary" : "hover:bg-secondary/50") + '">' +
        '<span class="h-6 w-6 shrink-0 rounded-lg border border-border/50" style="background-color:' + t.muestra + '"></span>' +
        '<span class="min-w-0 flex-1">' +
        '<span class="block text-sm font-medium text-foreground">' + t.nombre + "</span>" +
        '<span class="block truncate text-[11px] text-muted-foreground">' + t.descripcion + "</span>" +
        "</span>" +
        (activo ? icon("Check", "h-4 w-4 shrink-0 text-[var(--signature)]", 2.5) : "") +
        "</button>"
      );
    }).join("") +
    "</div></div></div>"
  );
}

// --- Selector de tema (móvil, dentro del sheet) ------------------------------
function themeToggleMobileHtml() {
  return (
    '<div class="grid grid-cols-3 gap-2">' +
    TEMAS.map((t) => {
      const activo = Tema.actual() === t.id;
      return (
        '<button data-action="tema-set" data-tema="' + t.id + '" class="flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ' +
        (activo ? "border-foreground/40 bg-secondary" : "border-border/50 hover:bg-secondary/50") +
        '" aria-label="' + t.nombre + '">' +
        '<span class="h-6 w-6 rounded-lg border border-border/50" style="background-color:' + t.muestra + '"></span>' +
        '<span class="text-[10px] font-medium text-muted-foreground">' + t.nombre + "</span></button>"
      );
    }).join("") +
    "</div>"
  );
}

// --- Menú móvil (sheet) ------------------------------------------------------
function sheetHtml(path) {
  const user = Auth.user();
  let items = "";
  NAV_ITEMS.forEach((item) => {
    const activo = estaActivo(path, item.href);
    const cnt = item.badge ? badgeCount(item.badge) : 0;
    items +=
      '<a href="' + item.href + '" data-nav data-sheet-close class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ' +
      (activo ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground") + '">' +
      icon(item.icon, "h-5 w-5", 2) +
      '<span class="flex-1">' + item.label + "</span>" +
      (cnt > 0
        ? '<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">' + cnt + "</span>"
        : "") +
      "</a>";
  });
  items +=
    '<a href="/carrito" data-nav data-sheet-close class="mt-2 flex items-center gap-3 rounded-xl border-t border-border/60 px-4 pt-4 text-sm font-medium transition-colors ' +
    (estaActivo(path, "/carrito") ? "text-foreground" : "text-muted-foreground hover:text-foreground") + '">' +
    icon("ShoppingCart", "h-5 w-5", 2) +
    '<span class="flex-1">Carrito</span>' +
    (badgeCount("carrito") > 0
      ? '<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">' + badgeCount("carrito") + "</span>"
      : "") +
    "</a>";

  let cuentaRows = "";
  if (user) {
    if (user.role === "ADMIN") {
      cuentaRows += sheetRow("/admin", "Shield", "Panel admin", estaActivo(path, "/admin"));
    }
    cuentaRows += sheetRow("/perfil", "User", "Mi perfil", estaActivo(path, "/perfil"));
    cuentaRows += sheetRow("/pedidos", "Receipt", "Mis pedidos", estaActivo(path, "/pedidos"));
    cuentaRows +=
      '<button data-action="logout" data-sheet-close class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10">' +
      icon("LogOut", "h-5 w-5") + "<span>Cerrar sesión</span></button>";
  } else {
    cuentaRows += sheetRow("/login", "User", "Iniciar sesión", estaActivo(path, "/login"));
  }

  return (
    '<div class="sheet-overlay fixed inset-0 z-50 bg-black/50" data-action="menu-cerrar">' +
    '<aside class="sheet-panel inset-y-0 right-0 fixed z-50 flex h-full w-[280px] flex-col gap-4 border-l border-border bg-background shadow-lg sm:w-[320px]">' +
    '<div class="flex flex-col gap-1.5 border-b border-border/60 px-6 py-5">' +
    '<h2 class="text-left text-base font-semibold tracking-tight text-foreground">Navegación</h2>' +
    "</div>" +
    '<nav class="flex flex-col gap-1 p-4">' +
    items +
    cuentaRows +
    '<div class="mt-2 border-t border-border/60 px-4 pt-4">' +
    '<p class="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Tema visual</p>' +
    themeToggleMobileHtml() +
    "</div>" +
    "</nav></aside></div>"
  );
}

function sheetRow(href, ic, label, activo) {
  return (
    '<a href="' + href + '" data-nav data-sheet-close class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ' +
    (activo ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground") + '">' +
    icon(ic, "h-5 w-5", 2) + '<span class="flex-1">' + label + "</span></a>"
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function footerHtml() {
  const año = new Date().getFullYear();
  function col(titulo, links) {
    return (
      '<div class="flex flex-col gap-2">' +
      '<p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">' + titulo + "</p>" +
      links.map((l) => '<a href="' + l[0] + '" data-nav class="transition-colors hover:text-foreground">' + l[1] + "</a>").join("") +
      "</div>"
    );
  }
  return (
    '<footer class="mt-auto border-t border-border/40 bg-background">' +
    '<div class="mx-auto max-w-7xl px-4 py-12 pb-28 sm:px-6 lg:px-8 lg:pb-12">' +
    '<div class="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-start">' +
    '<div class="max-w-xs">' +
    '<a href="/" data-nav class="flex items-center gap-2.5" aria-label="Ir al inicio">' +
    '<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">' + icon("Gauge", "h-4 w-4", 2.2) + "</span>" +
    '<span class="text-sm font-semibold tracking-tight">Digital <span class="text-gradient">Marketplace</span></span>' +
    "</a></div>" +
    '<nav class="flex flex-wrap items-start gap-x-8 gap-y-3 text-sm text-muted-foreground sm:gap-x-10">' +
    col("Explorar", [["/marketplace", "Marketplace"], ["/marcas", "Marcas"], ["/comparar", "Comparar"]]) +
    col("Cuenta", [["/favoritos", "Favoritos"], ["/garaje", "Mi Garaje"], ["/carrito", "Carrito"]]) +
    col("Legal", [["/privacidad", "Privacidad"], ["/terminos", "Términos"]]) +
    "</nav></div>" +
    '<div class="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">' +
    "<p>© " + año + " Digital Marketplace. Todos los derechos reservados.</p>" +
    "<p>Experiencia de compra simulada.</p>" +
    "</div></div></footer>"
  );
}

// ---------------------------------------------------------------------------
// Banner CTA + CTA móvil fijo + banner de cookies
// ---------------------------------------------------------------------------
function ctaBannerHtml() {
  return (
    '<section class="relative overflow-hidden border-t border-border/40 bg-card">' +
    '<div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-60" style="background: radial-gradient(60% 80% at 50% 0%, oklch(0.85 0.09 80 / 0.08), transparent 70%)"></div>' +
    '<div class="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Digital Marketplace · Vehículos de Alta Gama</p>' +
    '<h2 class="text-display mt-5 text-3xl text-foreground sm:text-4xl lg:text-5xl">Tu próximo vehículo te espera.</h2>' +
    '<p class="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Explora la colección, compara y reserva el modelo que siempre quisiste. Experiencia de compra premium, de principio a fin.</p>' +
    '<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">' +
    '<a href="/marketplace" data-nav class="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:gap-3 hover:shadow-[0_12px_40px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98] sm:w-auto">Explorar vehículos ' + icon("ArrowRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1") + "</a>" +
    '<a href="/marcas" data-nav class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:w-auto">Ver marcas</a>' +
    "</div></div></section>"
  );
}

function stickyMobileCtaHtml(path) {
  const rutasSinCta = ["/login", "/registro", "/admin", "/privacidad", "/terminos", "/gracias"];
  if (rutasSinCta.some((r) => path.indexOf(r) === 0)) return "";
  const enCarrito = Tienda.estado.carrito.length;
  const href = enCarrito ? "/carrito" : "/marketplace";
  const label = enCarrito ? "Ir al carrito" : "Explorar vehículos";
  const ic = enCarrito ? "ShoppingCart" : "ArrowRight";
  return (
    '<div id="sticky-cta" class="fixed inset-x-0 bottom-0 z-40 hidden lg:hidden">' +
    '<div class="sticky-cta-in border-t border-border/70 bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">' +
    '<a href="' + href + '" data-nav class="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98]" aria-label="' + label + '">' +
    icon(ic, "h-4 w-4", 2.2) +
    "<span>" + label + "</span>" +
    (enCarrito
      ? '<span class="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[11px] font-bold">' + enCarrito + "</span>"
      : "") +
    "</a></div></div>"
  );
}

function cookieBannerHtml() {
  let estado = null;
  try { estado = localStorage.getItem("dm-cookie-consent"); } catch (e) {}
  if (estado !== null) return "";
  return (
    '<div id="cookie-banner" class="cookie-in fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:bottom-4 sm:left-4 sm:right-auto sm:px-0 sm:pb-0" role="region" aria-label="Banner de consentimiento de cookies">' +
    '<div class="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur-xl sm:max-w-md sm:p-5">' +
    '<div class="flex items-start gap-3">' +
    '<span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">' + icon("Cookie", "h-5 w-5", 2) + "</span>" +
    '<div class="flex-1">' +
    '<p class="text-sm font-semibold text-foreground">Cookies y privacidad</p>' +
    '<p class="mt-1 text-xs leading-relaxed text-muted-foreground">Usamos cookies propias para el funcionamiento del sitio y de análisis anónimo para entender cómo se usa. Puedes aceptar o rechazar el análisis en cualquier momento. Lee nuestra <a href="/privacidad" data-nav class="font-medium text-[var(--signature)] hover:underline">política de privacidad</a>.</p>' +
    '<div class="mt-3 flex flex-col gap-2 sm:flex-row">' +
    '<button data-action="cookie-aceptar" class="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]">Aceptar todo</button>' +
    '<button data-action="cookie-rechazar" class="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent active:scale-[0.98]">Solo necesarias</button>' +
    "</div></div>" +
    '<button data-action="cookie-rechazar" class="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Cerrar banner de cookies">' + icon("X", "h-4 w-4", 2) + "</button>" +
    "</div></div></div>"
  );
}

// ---------------------------------------------------------------------------
// SiteShell = header + main + cta + footer + sticky cta
// ---------------------------------------------------------------------------
function siteShell(path, contenido) {
  return (
    '<div class="flex min-h-screen flex-col bg-background">' +
    headerHtml(path) +
    '<main class="flex-1">' + contenido + "</main>" +
    ctaBannerHtml() +
    footerHtml() +
    stickyMobileCtaHtml(path) +
    "</div>" +
    cookieBannerHtml()
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de vehículo
// ---------------------------------------------------------------------------
const SPARKLE_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" class="h-3 w-3">' +
  '<path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" /></svg>';

function obtenerEtiqueta(v) {
  if (v.combustible === "Eléctrico") return { texto: "Eléctrico", icono: "Battery", color: "text-[var(--chart-4)]" };
  if (v.categoria === "Superdeportivo") return { texto: "Superdeportivo", icono: "Flame", color: "text-[var(--signature)]" };
  if (v.precio > 200000) return { texto: "Edición exclusiva", icono: "Crown", color: "text-[var(--signature)]" };
  if (v.año >= 2024) return { texto: "Nuevo", icono: "Sparkle", color: "text-[var(--success)]" };
  return null;
}

function favCompareButtons(v, nombreCompleto) {
  const esFav = Tienda.esFavorito(v.id);
  const esComp = Tienda.estaEnComparador(v.id);
  return (
    '<div class="absolute right-3 top-3 flex items-center gap-1.5">' +
    '<button data-action="toggle-comparar" data-slug="' + v.id + '" data-nombre="' + esc(nombreCompleto) + '" class="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-all duration-200 hover:bg-background/80 sm:h-9 sm:w-9" aria-label="' +
    (esComp ? "Quitar " : "Añadir ") + esc(nombreCompleto) + (esComp ? " del comparador" : " al comparador") + '">' +
    (esComp
      ? icon("Check", "h-3.5 w-3.5 text-[var(--success)] sm:h-4 sm:w-4", 2.5)
      : icon("GitCompareArrows", "h-3.5 w-3.5 sm:h-4 sm:w-4", 2)) +
    "</button>" +
    '<button data-action="toggle-favorito" data-slug="' + v.id + '" data-nombre="' + esc(nombreCompleto) + '" class="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-all duration-200 hover:bg-background/80 sm:h-9 sm:w-9" aria-label="' +
    (esFav ? "Quitar " : "Añadir ") + esc(nombreCompleto) + (esFav ? " de favoritos" : " a favoritos") + '">' +
    (esFav
      ? icon("Heart", "h-3.5 w-3.5 fill-[var(--signature)] text-[var(--signature)] sm:h-4 sm:w-4", 2)
      : icon("Heart", "h-3.5 w-3.5 sm:h-4 sm:w-4", 2)) +
    "</button></div>"
  );
}

function vehicleCard(v, opts) {
  opts = opts || {};
  const variante = opts.variante || "marketplace";
  const etiquetaBoton = opts.etiquetaBoton || "Ver detalles";
  const index = opts.index || 0;
  const delay = "style=\"--delay:" + Math.min(index * 0.04, 0.4).toFixed(2) + "s\"";
  const nombre = v.marca + " " + v.modelo;
  const href = "/vehiculos/" + v.id;
  const disponible = DB.estaDisponible(v);
  const comprado = Tienda.estaComprado(v.id);
  const enCarrito = Tienda.estaEnCarrito(v.id);
  const tag = obtenerEtiqueta(v);

  let acciones;
  if (variante === "garaje" || variante === "favoritos") {
    acciones =
      '<a href="' + href + '" data-nav class="group/btn mt-auto flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-accent">' +
      "<span>" + etiquetaBoton + "</span>" +
      icon("ChevronRight", "h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5") +
      "</a>";
  } else {
    let btnCls, btnHtml, disabled = false;
    if (!disponible) {
      btnCls = "cursor-not-allowed border-border/50 bg-secondary/40 text-muted-foreground";
      btnHtml = icon("Ban", "h-4 w-4", 2.2) + "<span>Agotado</span>";
      disabled = true;
    } else if (comprado) {
      btnCls = "cursor-default border-border/50 bg-secondary/50 text-muted-foreground";
      btnHtml = icon("BadgeCheck", "h-4 w-4", 2.3) + "<span>Comprado</span>";
      disabled = true;
    } else if (enCarrito) {
      btnCls = "cursor-default border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]";
      btnHtml = icon("Check", "h-4 w-4", 2.5) + "<span>En el carrito</span>";
      disabled = true;
    } else {
      btnCls = "border-border bg-secondary text-foreground hover:bg-accent";
      btnHtml = icon("ShoppingCart", "h-4 w-4", 2.2) + "<span>Agregar al carrito</span>";
    }
    acciones =
      '<div class="mt-auto flex flex-col gap-2.5 sm:flex-row">' +
      '<button ' + (disabled ? "disabled " : "") + 'data-action="add-carrito" data-slug="' + v.id + '" data-nombre="' + esc(nombre) + '" class="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-300 active:scale-[0.98] ' + btnCls + '">' +
      btnHtml +
      "</button>" +
      '<a href="' + href + '" data-nav class="group/btn flex flex-1 items-center justify-between gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">' +
      "<span>" + etiquetaBoton + "</span>" +
      icon("ChevronRight", "h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5") +
      "</a></div>";
  }

  return (
    '<article class="card-in group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-500 ease-out hover:border-border/80 hover:bg-card/95 hover:shadow-card-hover" ' + delay + ">" +
    '<div class="relative block aspect-[16/10] w-full overflow-hidden bg-secondary">' +
    '<a href="' + href + '" data-nav class="block h-full w-full" aria-label="Ver detalles del ' + esc(nombre) + '">' +
    smartImg(v.imagenes[0], nombre + " " + v.año, { hoverScale: 1.04 }) +
    '<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/90 via-card/5 to-transparent"></div>' +
    "</a>" +
    (tag
      ? '<span class="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-background/70 px-2.5 py-1 text-[10px] font-semibold tracking-wide backdrop-blur-md">' +
        (tag.icono === "Sparkle" ? SPARKLE_SVG : icon(tag.icono, "h-3 w-3 " + tag.color, 2)) +
        "<span class=\"" + tag.color + "\">" + tag.texto + "</span></span>"
      : '<span class="pointer-events-none absolute left-3 top-3 rounded-lg bg-background/60 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground backdrop-blur-md">' + esc(v.marca) + "</span>") +
    favCompareButtons(v, nombre) +
    (comprado
      ? '<span class="pointer-events-none absolute right-3 top-12 flex items-center gap-1 rounded-lg bg-[var(--success)]/15 px-2.5 py-1 text-[10px] font-semibold text-[var(--success)] backdrop-blur-md">' + icon("BadgeCheck", "h-3 w-3", 2.5) + "<span>Comprado</span></span>"
      : "") +
    (!disponible
      ? '<span class="pointer-events-none absolute inset-0 flex items-center justify-center"><span class="rounded-xl bg-background/85 px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground shadow-lg backdrop-blur-md">Agotado</span></span>'
      : "") +
    '<a href="' + href + '" data-nav class="absolute inset-x-0 bottom-0 p-4 text-left">' +
    '<p class="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">' + esc(v.marca) + "</p>" +
    '<h3 class="mt-0.5 text-lg font-semibold leading-tight text-foreground drop-shadow-sm sm:text-xl">' + esc(v.modelo) + "</h3>" +
    '<p class="mt-0.5 text-[11px] font-medium text-muted-foreground">' + v.año + " · " + esc(v.categoria) + "</p>" +
    "</a></div>" +
    '<div class="flex flex-1 flex-col gap-4 p-4 sm:p-5">' +
    '<div class="flex items-end justify-between gap-3">' +
    "<div>" +
    '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Precio</p>' +
    '<p class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">' + formatearPrecio(v.precio) + "</p>" +
    "</div>" +
    '<div class="flex items-center gap-3 text-right">' +
    "<div>" +
    '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Potencia</p>' +
    '<p class="flex items-center justify-end gap-1 text-sm font-semibold text-foreground">' + icon("Zap", "h-3 w-3 text-[var(--signature)]", 2.5) + formatearNumero(v.potencia) + " HP</p>" +
    "</div>" +
    '<div class="hidden h-8 w-px bg-border sm:block"></div>' +
    '<div class="hidden sm:block">' +
    '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">0-100</p>' +
    '<p class="text-sm font-semibold text-foreground">' + v.aceleracion0a100 + "s</p>" +
    "</div></div></div>" +
    acciones +
    "</div></article>"
  );
}

// ---------------------------------------------------------------------------
// Estado vacío
// ---------------------------------------------------------------------------
function emptyStateHtml(opts) {
  return (
    '<section class="anim-in hero-glow relative mt-12 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/40 py-24 text-center sm:py-32" style="--dur:0.5s">' +
    '<div class="absolute inset-0 -z-10 animate-pulse rounded-full bg-[var(--signature)]/10 blur-2xl"></div>' +
    '<span class="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-muted-foreground shadow-card">' + icon(opts.icono, "h-9 w-9", 1.5) + "</span>" +
    '<h2 class="text-display mt-7 text-2xl text-foreground sm:text-3xl">' + esc(opts.titulo) + "</h2>" +
    '<p class="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">' + esc(opts.descripcion) + "</p>" +
    (opts.ctaHref
      ? '<a href="' + opts.ctaHref + '" data-nav class="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:gap-3 hover:shadow-[0_8px_30px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98]">' + esc(opts.ctaLabel) + icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") + "</a>"
      : "") +
    "</section>"
  );
}

// ---------------------------------------------------------------------------
// Estrellas de valoración
// ---------------------------------------------------------------------------
function starsHtml(rating, size) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  let out = '<span class="flex items-center gap-0.5">';
  for (let i = 1; i <= 5; i++) {
    const lleno = i <= Math.round(rating);
    out += '<span class="' + (lleno ? "text-[var(--signature)]" : "text-muted-foreground/30") + '">' +
      icon("Star", cls + (lleno ? " fill-[var(--signature)]" : ""), 2) + "</span>";
  }
  return out + "</span>";
}

// ---------------------------------------------------------------------------
// Encabezado de página estándar (eyebrow + h1 + sub)
// ---------------------------------------------------------------------------
function pageHeaderHtml(eyebrow, titulo, sub, subExtendido) {
  return (
    '<div class="anim-in border-b border-border/40 pb-10 pt-14 sm:pt-20" style="--dur:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">' + esc(eyebrow) + "</p>" +
    '<h1 class="text-display mt-5 text-4xl text-foreground sm:text-5xl lg:text-6xl">' + titulo + "</h1>" +
    (subExtendido
      ? '<p class="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">' + subExtendido + "</p>"
      : sub
        ? '<p class="mt-3 text-sm text-muted-foreground">' + sub + "</p>"
        : "") +
    "</div>"
  );
}
