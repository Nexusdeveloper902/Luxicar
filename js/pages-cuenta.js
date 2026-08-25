// ============================================================================
// pages-cuenta.js — Favoritos, comparador, garaje, carrito + checkout y
// recarga del saldo interno de la cuenta.
// ============================================================================
"use strict";

// ---------------------------------------------------------------------------
// FAVORITOS
// ---------------------------------------------------------------------------
function favoritosContenidoHtml() {
  const favoritos = Tienda.estado.favoritos
    .map((id) => DB.vehiculo(id))
    .filter(Boolean);

  const n = favoritos.length;
  return (
    pageHeaderHtml(
      "Tu selección personal",
      "Favoritos",
      n > 0
        ? n + " vehículo" + (n === 1 ? " guardado" : "s guardados") + " en tu lista de favoritos."
        : "",
      n > 0 ? "" : "Marca tus vehículos preferidos con el corazón para guardarlos aquí y encontrarlos rápidamente cuando quieras."
    ) +
    (n > 0
      ? '<section class="mt-8 pb-4"><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">' +
        favoritos.map((v, i) => vehicleCard(v, { variante: "favoritos", index: i })).join("") +
        "</div></section>"
      : emptyStateHtml({
          icono: "Heart",
          titulo: "Guarda aquí los vehículos que más te inspiren",
          descripcion: "Toca el ícono de corazón en cualquier vehículo del marketplace para guardarlo en tu lista personal de favoritos.",
          ctaLabel: "Descubrir vehículos",
          ctaHref: "/marketplace",
        }))
  );
}

/** Re-render local de /favoritos al quitar un vehículo (sin tocar el resto). */
function renderFavoritosContenido() {
  const cont = document.getElementById("favoritos-contenido");
  if (cont) cont.innerHTML = favoritosContenidoHtml();
  initObservers();
}

function pageFavoritos() {
  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="favoritos-contenido">' +
    favoritosContenidoHtml() +
    "</div>";

  return { title: "Favoritos · Digital Marketplace", html: siteShell("/favoritos", html) };
}

// ---------------------------------------------------------------------------
// COMPARADOR
// ---------------------------------------------------------------------------
const COMPARE_NUMERICAS = [
  ["precio", "Precio", "", "menor", "precio"],
  ["potencia", "Potencia", " HP", "mayor", "numero"],
  ["torque", "Torque", " Nm", "mayor", "numero"],
  ["velocidadMaxima", "Vel. máxima", " km/h", "mayor", "numero"],
  ["aceleracion0a100", "0-100 km/h", " s", "menor", "raw"],
  ["año", "Año", "", "mayor", "raw"],
];
const COMPARE_TEXTO = [
  ["motor", "Motor"],
  ["transmision", "Transmisión"],
  ["combustible", "Combustible"],
  ["traccion", "Tracción"],
  ["categoria", "Categoría"],
];

function compararContenidoHtml() {
  const vehiculos = Tienda.estado.comparar
    .map((id) => DB.vehiculo(id))
    .filter(Boolean);
  const n = vehiculos.length;

  let contenido;
  if (n === 0) {
    contenido =
      emptyStateHtml({
        icono: "GitCompareArrows",
        titulo: "No hay vehículos para comparar",
        descripcion: "Ve al marketplace y selecciona hasta 3 vehículos usando el botón de comparar para ver sus características lado a lado.",
        ctaLabel: "Ir al marketplace",
        ctaHref: "/marketplace",
      });
  } else {
    const gridCols = "grid-template-columns: 140px repeat(" + n + ", 1fr)";

    const headerCells = vehiculos.map((v, i) => {
      const nombre = v.marca + " " + v.modelo;
      return (
        '<div class="card-in relative overflow-hidden rounded-xl border border-border/70 bg-card" style="--delay:' + (i * 0.05).toFixed(2) + 's">' +
        '<div class="relative aspect-[16/10] w-full overflow-hidden bg-secondary">' +
        smartImg(v.imagenes[0], nombre, {}) +
        '<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/90 to-transparent"></div>' +
        '<button data-action="quitar-comparar" data-slug="' + v.id + '" class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/70 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground" aria-label="Quitar ' + esc(nombre) + '">' +
        icon("X", "h-3.5 w-3.5") +
        "</button></div>" +
        '<div class="p-3">' +
        '<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">' + esc(v.marca) + "</p>" +
        '<a href="/vehiculos/' + v.id + '" data-nav class="block truncate text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground">' + esc(v.modelo) + "</a>" +
        '<p class="mt-0.5 text-[11px] text-muted-foreground">' + v.año + "</p>" +
        "</div></div>"
      );
    }).join("");

    let filas = "";
    COMPARE_NUMERICAS.forEach((spec) => {
      const clave = spec[0], etiqueta = spec[1], unidad = spec[2], direccion = spec[3], formato = spec[4];
      let mejorId = null;
      if (n > 1) {
        let mejor = null;
        vehiculos.forEach((v) => {
          const val = v[clave];
          if (mejor === null) mejor = val;
          else if (direccion === "mayor" ? val > mejor : val < mejor) mejor = val;
        });
        const ganadores = vehiculos.filter((v) => v[clave] === mejor);
        if (ganadores.length === 1) mejorId = ganadores[0].id;
      }
      filas +=
        '<div class="grid items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-secondary/40" style="' + gridCols + '">' +
        '<div class="sticky left-0 z-10 bg-background py-0.5 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">' + etiqueta + "</div>" +
        vehiculos.map((v) => {
          const esMejor = mejorId === v.id;
          let valor;
          if (formato === "precio") valor = formatearPrecio(v[clave]);
          else if (formato === "numero") valor = formatearNumero(v[clave]);
          else valor = v[clave];
          return (
            '<div class="flex items-center gap-1.5">' +
            '<span class="text-sm font-semibold ' + (esMejor ? "text-[var(--success)]" : "text-foreground") + '">' + valor + unidad + "</span>" +
            (esMejor ? icon("Trophy", "h-3.5 w-3.5 text-[var(--success)]", 2.2) : "") +
            "</div>"
          );
        }).join("") +
        "</div>";
    });
    COMPARE_TEXTO.forEach((spec) => {
      filas +=
        '<div class="grid items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-secondary/40" style="' + gridCols + '">' +
        '<div class="sticky left-0 z-10 bg-background py-0.5 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">' + spec[1] + "</div>" +
        vehiculos.map((v) => '<div class="text-sm font-medium text-foreground">' + esc(v[spec[0]]) + "</div>").join("") +
        "</div>";
    });

    contenido =
      '<div class="mt-4 flex flex-wrap items-center justify-between gap-4">' +
      '<p class="text-sm text-muted-foreground">Comparando ' + n + " de 3 vehículos máximos.</p>" +
      '<button data-action="vaciar-comparador" class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">' +
      icon("X", "h-3.5 w-3.5") + "Vaciar comparador</button>" +
      "</div>" +
      '<div class="scrollbar-premium mt-8 overflow-x-auto">' +
      '<div class="min-w-full" style="min-width: ' + (n * 240 + 140) + 'px">' +
      '<div class="grid gap-3" style="' + gridCols + '">' +
      '<div class="sticky left-0 z-10 flex items-end bg-background pb-3 pr-3">' +
      '<span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vehículo</span>' +
      "</div>" +
      headerCells +
      "</div>" +
      '<div class="mt-4 space-y-1">' + filas + "</div>" +
      "</div></div>" +
      (n < 3
        ? '<div class="mt-8 rounded-2xl border border-dashed border-border p-6">' +
          '<p class="text-sm font-medium text-foreground">Añade más vehículos al comparador</p>' +
          '<p class="mt-1 text-xs text-muted-foreground">Puedes comparar hasta 3 vehículos a la vez. Explora el catálogo y usa el botón de comparar.</p>' +
          '<a href="/marketplace" data-nav class="group mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">' +
          icon("Plus", "h-4 w-4", 2.2) + "Añadir desde el marketplace</a>" +
          "</div>"
        : "");
  }

  return (
    pageHeaderHtml(
      "Análisis lado a lado",
      "Comparador de vehículos",
      "",
      n === 0 ? "Selecciona hasta 3 vehículos desde el marketplace para comparar sus características lado a lado y encontrar el ideal para ti." : ""
    ) +
    '<section class="pb-4">' + contenido + "</section>"
  );
}

/** Re-render local de /comparar al quitar/vaciar vehículos. */
function renderCompararContenido() {
  const cont = document.getElementById("comparar-contenido");
  if (cont) cont.innerHTML = compararContenidoHtml();
  initObservers();
}

function pageComparar() {
  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="comparar-contenido">' +
    compararContenidoHtml() +
    "</div>";

  return { title: "Comparar vehículos · Digital Marketplace", html: siteShell("/comparar", html) };
}

// ---------------------------------------------------------------------------
// GARAJE
// ---------------------------------------------------------------------------
function pageGaraje() {
  if (!Auth.isAuthenticated()) {
    return { redirect: "/login?redirect=/garaje" };
  }
  const user = Auth.user();

  let contenido;
  const completados = DB.pedidosDe(user.email).filter((p) => p.status === "COMPLETED");
  const compras = new Map();
  completados.forEach((p) => {
    p.items.forEach((it) => {
      compras.set(it.vehicleSlug, {
        vehicleSlug: it.vehicleSlug,
        orderNumber: p.number,
        fecha: p.createdAt,
        precio: it.priceAtPurchase,
      });
    });
  });
  const items = Array.from(compras.values())
    .map((c) => ({ compra: c, vehiculo: DB.vehiculo(c.vehicleSlug) }))
    .filter((x) => x.vehiculo);
  const valorTotal = items.reduce((s, x) => s + x.compra.precio, 0);

  if (items.length === 0) {
    contenido =
      emptyStateHtml({
        icono: "CarFront",
        titulo: "Tu colección comienza aquí",
        descripcion: "Los vehículos que adquieras aparecerán en tu garaje privado, listos para que los inspecciones cuando quieras.",
        ctaLabel: "Explorar marketplace",
        ctaHref: "/marketplace",
      });
  } else {
    contenido =
      '<div class="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">' +
      "<div>" +
      '<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vehículos</p>' +
      '<p class="text-2xl font-semibold tracking-tight text-foreground">' + items.length + "</p>" +
      "</div>" +
      '<div class="hidden h-10 w-px bg-border sm:block"></div>' +
      "<div>" +
      '<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Valor total</p>' +
      '<p class="text-2xl font-semibold tracking-tight text-foreground">' + formatearPrecio(valorTotal) + "</p>" +
      "</div></div>" +
      '<section class="mt-8 pb-4"><div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">' +
      items.map((x, i) =>
        "<div>" +
        vehicleCard(x.vehiculo, { variante: "garaje", etiquetaBoton: "Inspeccionar", index: i }) +
        '<div class="mt-2 rounded-xl border border-border/40 bg-card/60 p-3 text-xs">' +
        '<p class="font-mono text-[10px] text-muted-foreground">' + esc(x.compra.orderNumber) + "</p>" +
        '<p class="mt-0.5 text-muted-foreground">Comprado el ' + formatearFecha(x.compra.fecha) + "</p>" +
        '<p class="mt-0.5 font-medium text-foreground">' + formatearPrecio(x.compra.precio) + "</p>" +
        "</div></div>"
      ).join("") +
      "</div></section>";
  }

  const vacio =
    DB.pedidosDe(user.email).filter((p) => p.status === "COMPLETED").length === 0;
  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">' +
    pageHeaderHtml(
      "Tu colección privada",
      "Mi Garaje",
      "",
      vacio ? "Aún no has adquirido ningún vehículo. Explora el marketplace y añade tu primer automóvil de alta gama a la colección." : ""
    ) +
    contenido +
    "</div>";

  return { title: "Mi Garaje · Digital Marketplace", html: siteShell("/garaje", html) };
}

// ---------------------------------------------------------------------------
// CARRITO
// ---------------------------------------------------------------------------
function carritoContenidoHtml() {
  const items = Tienda.estado.carrito
    .map((id) => DB.vehiculo(id))
    .filter(Boolean);
  const n = items.length;
  const total = items.reduce((s, v) => s + v.precio, 0);

  // Estimación fija: 20% inicial, 60 meses, 6.5% anual.
  const inicial = total * 0.2;
  const monto = total - inicial;
  const tasaMensual = 6.5 / 100 / 12;
  const cuotaMensual =
    monto === 0 ? 0 : (monto * tasaMensual * Math.pow(1 + tasaMensual, 60)) / (Math.pow(1 + tasaMensual, 60) - 1);

  let contenido;
  if (n === 0) {
    contenido =
      emptyStateHtml({
        icono: "ShoppingBag",
        titulo: "Todavía no has agregado ningún vehículo",
        descripcion: "Explora el marketplace y añade los automóviles que más te gusten. Aparecerán aquí listos para finalizar tu compra.",
        ctaLabel: "Comenzar a explorar",
        ctaHref: "/marketplace",
      });
  } else {
    const lista = items.map((v, i) => {
      const nombre = v.marca + " " + v.modelo;
      return (
        '<li class="card-in group flex gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:border-border sm:p-4" style="--delay:' + (i * 0.05).toFixed(2) + 's">' +
        '<a href="/vehiculos/' + v.id + '" data-nav class="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-secondary sm:w-36" aria-label="Ver detalles del ' + esc(nombre) + '">' +
        smartImg(v.imagenes[0], nombre, { hoverScale: 1.05 }) +
        "</a>" +
        '<div class="flex flex-1 flex-col justify-between py-1">' +
        '<div class="flex items-start justify-between gap-3">' +
        "<div>" +
        '<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">' + esc(v.marca) + "</p>" +
        '<a href="/vehiculos/' + v.id + '" data-nav class="text-base font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground sm:text-lg">' + esc(v.modelo) + "</a>" +
        '<p class="mt-0.5 text-xs text-muted-foreground">' + v.año + " · " + esc(v.combustible) + " · " + formatearNumero(v.potencia) + " HP</p>" +
        "</div>" +
        '<button data-action="quitar-carrito" data-slug="' + v.id + '" data-nombre="' + esc(nombre) + '" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Quitar ' + esc(nombre) + ' del carrito">' +
        icon("Trash2", "h-4 w-4", 2) +
        "</button></div>" +
        '<div class="flex items-end justify-between">' +
        '<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Subtotal</p>' +
        '<p class="text-lg font-semibold tracking-tight text-foreground">' + formatearPrecio(v.precio) + "</p>" +
        "</div></div></li>"
      );
    }).join("");

    contenido =
      '<div class="mt-8 grid grid-cols-1 gap-8 pb-4 lg:grid-cols-[1fr_360px] lg:gap-10">' +
      '<ul class="flex flex-col gap-4">' + lista + "</ul>" +
      '<aside class="lg:sticky lg:top-20 lg:self-start">' +
      '<div class="rounded-2xl border border-border/70 bg-card p-6">' +
      '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Resumen del pedido</h2>' +
      '<dl class="mt-5 space-y-3 text-sm">' +
      '<div class="flex items-center justify-between"><dt class="text-muted-foreground">Vehículos (' + n + ")</dt><dd class=\"font-medium text-foreground\">" + formatearPrecio(total) + "</dd></div>" +
      '<div class="flex items-center justify-between"><dt class="text-muted-foreground">Tramitación</dt><dd class="font-medium text-[var(--success)]">Incluida</dd></div>' +
      "</dl>" +
      '<div class="mt-5 flex items-center justify-between border-t border-border/60 pt-5">' +
      '<span class="text-sm font-medium text-muted-foreground">Total</span>' +
      '<span class="text-2xl font-semibold tracking-tight text-foreground">' + formatearPrecio(total) + "</span>" +
      "</div>" +
      (cuotaMensual > 0
        ? '<div class="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3.5">' +
          "<div>" +
          '<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Financiación estimada</p>' +
          '<p class="text-lg font-semibold tracking-tight text-foreground">' + formatearPrecio(Math.round(cuotaMensual)) +
          ' <span class="text-[10px] font-normal text-muted-foreground">/ mes · 60 cuotas</span></p>' +
          "</div>" +
          '<p class="text-right text-[10px] text-muted-foreground">Cuota inicial:<br>' + formatearPrecio(Math.round(inicial)) + "</p>" +
          "</div>"
        : "") +
      (Auth.isAuthenticated()
        ? '<div class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-3 text-xs">' +
          '<span class="flex items-center gap-1.5 text-muted-foreground">' + icon("Wallet", "h-3.5 w-3.5") + "Tu saldo</span>" +
          '<span class="flex items-center gap-2"><span data-saldo class="font-semibold text-foreground">' + formatearPrecio(DB.saldoDe(Auth.user().email)) + "</span>" +
          '<a href="/recargar" data-nav class="font-medium text-[var(--signature)] transition-colors hover:text-foreground">Recargar</a></span>' +
          "</div>"
        : "") +
      '<button data-action="abrir-checkout" class="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:gap-3 hover:shadow-[0_8px_30px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.99]">Finalizar compra ' +
      icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") +
      "</button>" +
      '<ul class="mt-5 space-y-2.5 text-xs text-muted-foreground">' +
      '<li class="flex items-center gap-2">' + icon("ShieldCheck", "h-3.5 w-3.5 text-[var(--success)]", 2.2) + "Pago seguro</li>" +
      '<li class="flex items-center gap-2">' + icon("BadgeCheck", "h-3.5 w-3.5 text-[var(--success)]", 2.2) + "Compra protegida</li>" +
      '<li class="flex items-center gap-2">' + icon("Award", "h-3.5 w-3.5 text-[var(--signature)]", 2.2) + "Garantía oficial</li>" +
      '<li class="flex items-center gap-2">' + icon("Zap", "h-3.5 w-3.5 text-[var(--signature)]", 2.2) + "Entrega inmediata a tu garaje</li>" +
      "</ul>" +
      "</div></aside></div>";
  }

  return (
    pageHeaderHtml(
      "Tu selección",
      "Carrito de compras",
      n > 0 ? n + " vehículo" + (n === 1 ? " listo" : "s listos") + " para finalizar la compra." : "",
      n === 0 ? "Tu carrito está vacío. Explora el marketplace y añade los vehículos que más te gusten para comenzar tu colección." : ""
    ) +
    contenido
  );
}

/** Re-render local de /carrito al quitar vehículos o completar la compra. */
function renderCarritoContenido() {
  const cont = document.getElementById("carrito-contenido");
  if (cont) cont.innerHTML = carritoContenidoHtml();
  initObservers();
}

function pageCarrito() {
  const html =
    '<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="carrito-contenido">' +
    carritoContenidoHtml() +
    "</div>";

  return {
    title: "Carrito · Digital Marketplace",
    html: siteShell("/carrito", html),
    mount() {
      // Reabrir el checkout si hay un borrador pendiente (tras login).
      const borrador = leerBorradorCheckout();
      if (borrador && Tienda.estado.carrito.length > 0) {
        setTimeout(() => abrirCheckout(borrador.datos), 300);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// CHECKOUT (modal de 4 pasos)
// ---------------------------------------------------------------------------
const CHECKOUT_DRAFT_KEY = "luxicar-checkout-draft";

function guardarBorradorCheckout(datos) {
  try { sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ datos })); } catch (e) {}
}
function leerBorradorCheckout() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function borrarBorradorCheckout() {
  try { sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); } catch (e) {}
}

const checkoutState = {
  abierto: false,
  paso: "datos",
  metodo: "tarjeta", // "tarjeta" | "saldo"
  datos: { nombre: "", email: "", telefono: "" },
  pago: { tarjeta: "", vencimiento: "", cvv: "", nombreTarjeta: "" },
  mensajeError: "",
  numeroPedido: "",
  metodoExito: "tarjeta",
};

function fmtTarjeta(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function fmtVencimiento(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
function fmtCvv(v) { return v.replace(/\D/g, "").slice(0, 4); }
function fmtTelefono(v) { return v.replace(/[^\d\s+-]/g, "").slice(0, 20); }

function checkoutErrores() {
  const d = checkoutState.datos, p = checkoutState.pago;
  const errores = {};
  if (d.nombre && d.nombre.trim().length < 3) errores.nombre = "El nombre debe tener al menos 3 caracteres";
  if (d.email && !/\S+@\S+\.\S+/.test(d.email)) errores.email = "Correo electrónico inválido";
  if (d.telefono && d.telefono.trim().length < 7) errores.telefono = "Número de teléfono inválido";
  const digitos = p.tarjeta.replace(/\D/g, "");
  if (p.tarjeta && digitos.length !== 16) errores.tarjeta = "La tarjeta debe tener 16 dígitos";
  if (p.vencimiento) {
    const m = /^(\d{2})\/(\d{2})$/.exec(p.vencimiento);
    if (!m || parseInt(m[1], 10) < 1 || parseInt(m[1], 10) > 12) errores.vencimiento = "Formato inválido (MM/AA)";
  }
  if (p.cvv && p.cvv.length < 3) errores.cvv = "Mínimo 3 dígitos";
  if (p.nombreTarjeta && p.nombreTarjeta.trim().length < 3) errores.nombreTarjeta = "Nombre demasiado corto";
  return errores;
}

function datosValidos() {
  const d = checkoutState.datos;
  return d.nombre.trim().length > 2 && /\S+@\S+\.\S+/.test(d.email) && d.telefono.trim().length >= 7;
}
function totalCarrito() {
  return Tienda.estado.carrito
    .map((id) => DB.vehiculo(id))
    .filter(Boolean)
    .reduce((s, v) => s + v.precio, 0);
}
function pagoValido() {
  if (checkoutState.metodo === "saldo") {
    const u = Auth.user();
    return !!u && DB.saldoDe(u.email) >= totalCarrito();
  }
  const p = checkoutState.pago;
  return (
    p.tarjeta.replace(/\D/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(p.vencimiento) &&
    p.cvv.length >= 3 &&
    p.nombreTarjeta.trim().length > 2
  );
}

// Selector de método de pago (tarjeta / saldo interno) del paso "pago".
function selectorMetodoHtml(metodoActivo) {
  const opciones = [
    ["tarjeta", "CreditCard", "Tarjeta"],
    ["saldo", "Wallet", "Saldo LUXICAR"],
  ];
  return (
    '<div class="grid grid-cols-2 gap-2" role="group" aria-label="Método de pago">' +
    opciones.map((o) => {
      const activo = metodoActivo === o[0];
      return (
        '<button type="button" data-action="checkout-metodo" data-metodo="' + o[0] + '" aria-pressed="' + activo + '" class="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ' +
        (activo
          ? "border-foreground/40 bg-secondary text-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:bg-secondary/50 hover:text-foreground") + '">' +
        icon(o[1], "h-4 w-4", 2) + "<span>" + o[2] + "</span>" +
        (activo ? icon("Check", "h-3.5 w-3.5 text-[var(--signature)]", 2.5) : "") +
        "</button>"
      );
    }).join("") +
    "</div>"
  );
}

// Panel informativo cuando se paga con el saldo de la cuenta.
function panelSaldoHtml(total) {
  const u = Auth.user();
  const saldo = u ? DB.saldoDe(u.email) : 0;
  const falta = total - saldo;
  const suficiente = falta <= 0;
  return (
    '<div class="space-y-3 rounded-xl border border-border/70 bg-secondary/30 p-4">' +
    '<div class="flex items-center justify-between text-sm">' +
    '<span class="flex items-center gap-1.5 text-muted-foreground">' + icon("Wallet", "h-3.5 w-3.5") + "Saldo disponible</span>" +
    '<span class="font-semibold text-foreground">' + formatearPrecio(saldo) + "</span></div>" +
    '<div class="flex items-center justify-between text-sm">' +
    '<span class="text-muted-foreground">Total a pagar</span>' +
    '<span class="font-semibold text-foreground">' + formatearPrecio(total) + "</span></div>" +
    '<div class="flex items-center justify-between border-t border-border/60 pt-3 text-sm">' +
    (suficiente
      ? '<span class="text-muted-foreground">Saldo restante</span><span class="font-semibold text-[var(--success)]">' + formatearPrecio(saldo - total) + "</span>"
      : '<span class="text-muted-foreground">Te faltan</span><span class="font-semibold text-[var(--destructive)]">' + formatearPrecio(falta) + "</span>") +
    "</div>" +
    (suficiente
      ? ""
      : '<a href="/recargar" data-nav data-action="checkout-cerrar" class="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">' +
        icon("Plus", "h-4 w-4") + "Recargar saldo</a>") +
    "</div>"
  );
}

function campoCheckout(opts) {
  const error = opts.error;
  return (
    "<div>" +
    '<label class="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground" for="' + opts.id + '">' + opts.label + "</label>" +
    '<div class="relative">' +
    '<span data-checkout-icon="' + opts.field + '" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ' + (error ? "text-[var(--destructive)]" : "text-muted-foreground") + '">' +
    icon(opts.icono, "h-4 w-4") +
    "</span>" +
    '<input id="' + opts.id + '" type="' + (opts.type || "text") + '" inputmode="' + (opts.inputmode || "text") + '" placeholder="' + esc(opts.placeholder) + '" value="' + esc(opts.value) + '" data-checkout-field="' + opts.field + '" autocomplete="off" class="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 ' +
    (error
      ? "border-[var(--destructive)]/50 focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20"
      : "border-border focus:border-foreground/30 focus:ring-ring/30") + '">' +
    "</div>" +
    '<div data-checkout-error="' + opts.field + '">' +
    (error
      ? '<p class="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--destructive)]">' + icon("AlertCircle", "h-3 w-3") + esc(error) + "</p>"
      : "") +
    "</div>" +
    "</div>"
  );
}

function resumenCompraHtml() {
  const n = Tienda.estado.carrito.length;
  const total = Tienda.estado.carrito.map((id) => DB.vehiculo(id)).filter(Boolean).reduce((s, v) => s + v.precio, 0);
  return (
    '<div class="mx-6 mb-2 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">' +
    '<span class="text-muted-foreground">' + n + " vehículo" + (n === 1 ? "" : "s") + "</span>" +
    '<span class="font-semibold text-foreground">' + formatearPrecio(total) + "</span>" +
    "</div>"
  );
}

function indicadorPasosHtml(pasoActual) {
  const pasos = ["Datos", "Pago", "Confirmar"];
  return (
    '<div class="flex items-center gap-2 px-6 py-2">' +
    pasos.map((label, i) => {
      const num = i + 1;
      const alcanzado = num <= pasoActual;
      return (
        (i > 0 ? '<div class="h-px flex-1 ' + (alcanzado ? "bg-[var(--signature)]" : "bg-border") + '"></div>' : "") +
        '<div class="flex items-center gap-2">' +
        '<span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ' +
        (alcanzado ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground") + '">' + num + "</span>" +
        '<span class="text-[11px] font-medium ' + (alcanzado ? "text-foreground" : "text-muted-foreground") + '">' + label + "</span>" +
        "</div>"
      );
    }).join("") +
    "</div>"
  );
}

function checkoutContenidoHtml() {
  const s = checkoutState;
  const errores = checkoutErrores();
  const total = Tienda.estado.carrito.map((id) => DB.vehiculo(id)).filter(Boolean).reduce((s2, v) => s2 + v.precio, 0);

  if (s.paso === "datos") {
    return (
      '<div class="px-6 pb-3 pt-6">' +
      '<h2 class="text-xl font-semibold tracking-tight text-foreground">Finalizar compra</h2>' +
      '<p class="mt-1 text-sm text-muted-foreground">Datos de contacto para la tramitación del pedido.</p>' +
      "</div>" +
      indicadorPasosHtml(1) +
      '<div class="space-y-4 px-6 py-5">' +
      campoCheckout({ id: "co-nombre", label: "Nombre completo", icono: "User", placeholder: "Juan Pérez", value: s.datos.nombre, field: "nombre", error: errores.nombre }) +
      campoCheckout({ id: "co-email", label: "Correo electrónico", icono: "Mail", type: "email", inputmode: "email", placeholder: "juan@ejemplo.com", value: s.datos.email, field: "email", error: errores.email }) +
      campoCheckout({ id: "co-telefono", label: "Teléfono", icono: "Phone", inputmode: "tel", placeholder: "+34 600 123 456", value: s.datos.telefono, field: "telefono", error: errores.telefono }) +
      "</div>" +
      resumenCompraHtml() +
      '<div class="flex gap-3 px-6 pb-6 pt-4">' +
      '<button data-action="checkout-cerrar" class="rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Cancelar</button>' +
      '<button data-action="checkout-paso-pago" ' + (datosValidos() ? "" : "disabled ") + 'class="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Continuar al pago ' +
      icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") +
      "</button></div>"
    );
  }

  if (s.paso === "pago") {
    const numTarjeta = s.pago.tarjeta || "•••• •••• •••• ••••";
    const titular = s.pago.nombreTarjeta ? s.pago.nombreTarjeta.toUpperCase() : "NOMBRE DEL TITULAR";
    const venc = s.pago.vencimiento || "MM/AA";
    const conSaldo = s.metodo === "saldo";
    return (
      '<div class="px-6 pb-3 pt-6">' +
      '<h2 class="text-xl font-semibold tracking-tight text-foreground">Datos de pago</h2>' +
      '<p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">' + icon("Lock", "h-3.5 w-3.5", 2) + "Pago simulado · No se realiza ningún cargo real</p>" +
      "</div>" +
      indicadorPasosHtml(2) +
      '<div class="space-y-4 px-6 py-5">' +
      selectorMetodoHtml(s.metodo) +
      (conSaldo
        ? panelSaldoHtml(total)
        : '<div class="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-secondary to-accent/40 p-5">' +
          '<div class="flex items-center justify-between">' +
          '<div class="h-8 w-11 rounded-md bg-primary/80"></div>' +
          icon("CreditCard", "h-6 w-6 text-muted-foreground", 1.5) +
          "</div>" +
          '<p data-cp="tarjeta" class="mt-5 font-mono text-base tracking-wider text-foreground">' + esc(numTarjeta) + "</p>" +
          '<div class="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">' +
          '<span data-cp="titular">' + esc(titular) + '</span><span data-cp="venc">' + esc(venc) + "</span>" +
          "</div></div>" +
          campoCheckout({ id: "co-tarjeta", label: "Número de tarjeta", icono: "CreditCard", inputmode: "numeric", placeholder: "4242 4242 4242 4242", value: s.pago.tarjeta, field: "tarjeta", error: errores.tarjeta }) +
          '<div class="grid grid-cols-2 gap-3">' +
          campoCheckout({ id: "co-vencimiento", label: "Vencimiento", icono: "Calendar", inputmode: "numeric", placeholder: "MM/AA", value: s.pago.vencimiento, field: "vencimiento", error: errores.vencimiento }) +
          campoCheckout({ id: "co-cvv", label: "CVV", icono: "Lock", inputmode: "numeric", placeholder: "123", value: s.pago.cvv, field: "cvv", error: errores.cvv }) +
          "</div>" +
          campoCheckout({ id: "co-titular", label: "Titular de la tarjeta", icono: "User", placeholder: "Juan Pérez", value: s.pago.nombreTarjeta, field: "nombreTarjeta", error: errores.nombreTarjeta })) +
      "</div>" +
      resumenCompraHtml() +
      '<div class="flex gap-3 px-6 pb-6 pt-4">' +
      '<button data-action="checkout-paso-datos" class="flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">' +
      icon("ArrowLeft", "h-4 w-4") + "Atrás</button>" +
      '<button data-action="checkout-pagar" ' + (pagoValido() ? "" : "disabled ") + 'class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">' +
      icon(conSaldo ? "Wallet" : "Lock", "h-4 w-4", 2.2) + "Pagar " + formatearPrecio(total) +
      "</button></div>"
    );
  }

  if (s.paso === "procesando") {
    return (
      '<div class="flex flex-col items-center justify-center px-6 py-20 text-center">' +
      icon("Loader2", "h-12 w-12 animate-spin text-[var(--signature)]", 1.5) +
      '<p class="mt-6 text-lg font-semibold tracking-tight text-foreground">Procesando pago…</p>' +
      '<p class="mt-2 text-sm text-muted-foreground">Estamos verificando tu transacción de forma segura.</p>' +
      '<p class="mt-6 flex items-center gap-2 text-xs text-muted-foreground">' + icon("ShieldCheck", "h-3.5 w-3.5 text-[var(--success)]", 2.2) + "Conexión cifrada de 256 bits</p>" +
      "</div>"
    );
  }

  if (s.paso === "exito") {
    const slugs = checkoutState.vehiculosExito || [];
    const vehiculos = slugs.map((id) => DB.vehiculo(id)).filter(Boolean);
    const primero = vehiculos[0];
    const ultimos4 = (checkoutState.pago.tarjeta || "").replace(/\D/g, "").slice(-4);
    return (
      (primero
        ? '<div class="relative aspect-[16/9] w-full overflow-hidden">' +
          smartImg(primero.imagenes[0], primero.marca + " " + primero.modelo, { priority: true }) +
          '<div class="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent"></div>' +
          '<span class="success-pop absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)] text-primary-foreground shadow-lg">' +
          icon("CheckCircle2", "h-7 w-7", 2) + "</span>" +
          '<div class="absolute bottom-4 left-4">' +
          '<p class="text-eyebrow text-[10px] text-[var(--signature)]">' + esc(primero.marca) + "</p>" +
          '<p class="mt-1 text-xl font-semibold tracking-tight text-foreground">' + esc(primero.modelo) + "</p>" +
          (vehiculos.length > 1
            ? '<p class="mt-0.5 text-xs text-muted-foreground">+' + (vehiculos.length - 1) + " vehículo" + (vehiculos.length - 1 === 1 ? "" : "s") + " más</p>"
            : "") +
          "</div></div>"
        : "") +
      '<div class="px-6 pt-6 text-center">' +
      '<span class="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">' +
      icon("Sparkles", "h-3 w-3 text-[var(--signature)]", 2.2) + "Pago confirmado</span>" +
      '<h2 class="text-display mt-4 text-2xl text-foreground sm:text-3xl">¡Felicidades!</h2>' +
      '<p class="mt-2 text-sm text-muted-foreground">' +
      (vehiculos.length === 1 && primero
        ? "Tu " + esc(primero.marca) + " " + esc(primero.modelo) + " te está esperando en tu garaje privado."
        : "Tus " + vehiculos.length + " vehículos te están esperando en tu garaje privado.") +
      "</p></div>" +
      '<div class="mx-6 mt-6 space-y-2.5 rounded-xl border border-border/70 bg-secondary/40 p-4">' +
      '<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Nº de pedido</span><span class="font-mono text-xs font-semibold text-foreground">' + esc(s.numeroPedido) + "</span></div>" +
      '<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Fecha de entrega</span><span class="font-semibold text-foreground">Inmediata</span></div>' +
      '<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Vehículos</span><span class="font-semibold text-foreground">' + slugs.length + "</span></div>" +
      '<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">Método de pago</span><span class="text-xs font-semibold text-foreground">' +
      (checkoutState.metodoExito === "saldo"
        ? "Saldo LUXICAR"
        : '<span class="font-mono">•••• ' + esc(ultimos4 || "****") + "</span>") +
      "</span></div>" +
      '<div class="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm"><span class="text-muted-foreground">Total pagado</span><span class="text-lg font-semibold tracking-tight text-foreground">' + formatearPrecio(checkoutState.totalExito || 0) + "</span></div>" +
      "</div>" +
      '<p class="mx-6 mt-4 text-center text-xs italic leading-relaxed text-muted-foreground">Gracias por confiar en Digital Marketplace.</p>' +
      '<div class="flex flex-col gap-2.5 px-6 pb-6 pt-5">' +
      '<a href="/gracias" data-nav data-action="checkout-cerrar" class="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:gap-3 hover:opacity-90">Ver resumen del pedido ' +
      icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") + "</a>" +
      '<a href="/garaje" data-nav data-action="checkout-cerrar" class="w-full rounded-xl border border-border bg-card px-6 py-3.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-accent">Ver en mi garaje</a>' +
      '<a href="/marketplace" data-nav data-action="checkout-cerrar" class="w-full rounded-xl border border-border bg-card px-6 py-3.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-accent">Seguir explorando vehículos</a>' +
      "</div>"
    );
  }

  // error
  return (
    '<div class="flex flex-col items-center justify-center px-6 py-16 text-center">' +
    '<span class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--destructive)]/15 text-[var(--destructive)]">' +
    icon("AlertCircle", "h-7 w-7") + "</span>" +
    '<h2 class="mt-5 text-lg font-semibold tracking-tight text-foreground">No se pudo completar la compra</h2>' +
    '<p class="mt-2 max-w-xs text-sm text-muted-foreground">' + esc(s.mensajeError || "Ocurrió un error inesperado. Inténtalo de nuevo.") + "</p>" +
    '<div class="mt-6 flex gap-3">' +
    '<button data-action="checkout-paso-pago" class="rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Reintentar</button>' +
    '<button data-action="checkout-cerrar" class="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Cerrar</button>' +
    "</div></div>"
  );
}

function renderCheckoutModal() {
  const root = document.getElementById("modal-root");
  if (!checkoutState.abierto) {
    root.innerHTML = "";
    document.body.classList.remove("no-scroll");
    return;
  }
  document.body.classList.add("no-scroll");
  root.innerHTML =
    '<div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-action="checkout-overlay">' +
    '<div class="modal-content max-h-[85vh] w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-lg border border-border/70 bg-card shadow-lg sm:max-w-md" role="dialog" aria-modal="true">' +
    (checkoutState.paso !== "procesando"
      ? '<button data-action="checkout-cerrar" class="absolute right-4 top-4 z-10 rounded-xs opacity-70 transition-opacity hover:opacity-100" aria-label="Cerrar">' + icon("X", "h-4 w-4") + "</button>"
      : "") +
    checkoutContenidoHtml() +
    "</div></div>";

  // Formateo en vivo de los campos: actualiza el estado y sincroniza la UI
  // en el sitio (sin re-render del modal, para no perder foco ni caret).
  root.querySelectorAll("[data-checkout-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.getAttribute("data-checkout-field");
      let val = input.value;
      if (field === "tarjeta") val = fmtTarjeta(val);
      if (field === "vencimiento") val = fmtVencimiento(val);
      if (field === "cvv") val = fmtCvv(val);
      if (field === "telefono") val = fmtTelefono(val);
      if (val !== input.value) {
        const diff = input.value.length - val.length;
        const pos = Math.max(0, (input.selectionStart || 0) - diff);
        input.value = val;
        try { input.setSelectionRange(pos, pos); } catch (e) {}
      }
      if (["tarjeta", "vencimiento", "cvv", "nombreTarjeta"].includes(field)) {
        checkoutState.pago[field] = val;
      } else {
        checkoutState.datos[field] = val;
      }
      actualizarCheckoutUI();
    });
  });
}

// Sincroniza errores, vista previa de tarjeta y botones del checkout sin
// reconstruir el modal.
function actualizarCheckoutUI() {
  const root = document.getElementById("modal-root");
  if (!root || !checkoutState.abierto) return;
  const errores = checkoutErrores();
  root.querySelectorAll("[data-checkout-error]").forEach((box) => {
    const field = box.getAttribute("data-checkout-error");
    const msg = errores[field] || "";
    box.innerHTML = msg
      ? '<p class="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--destructive)]">' + icon("AlertCircle", "h-3 w-3") + esc(msg) + "</p>"
      : "";
    const campo = box.parentElement;
    const input = campo ? campo.querySelector("[data-checkout-field]") : null;
    if (input) {
      ["border-[var(--destructive)]/50", "focus:border-[var(--destructive)]", "focus:ring-[var(--destructive)]/20"].forEach((c) => input.classList.toggle(c, !!msg));
      ["border-border", "focus:border-foreground/30", "focus:ring-ring/30"].forEach((c) => input.classList.toggle(c, !msg));
    }
    const ico = campo ? campo.querySelector('[data-checkout-icon="' + field + '"]') : null;
    if (ico) {
      ico.classList.toggle("text-[var(--destructive)]", !!msg);
      ico.classList.toggle("text-muted-foreground", !msg);
    }
  });
  // Vista previa de la tarjeta.
  const p = checkoutState.pago;
  const cpT = root.querySelector('[data-cp="tarjeta"]');
  if (cpT) cpT.textContent = p.tarjeta || "•••• •••• •••• ••••";
  const cpTi = root.querySelector('[data-cp="titular"]');
  if (cpTi) cpTi.textContent = p.nombreTarjeta ? p.nombreTarjeta.toUpperCase() : "NOMBRE DEL TITULAR";
  const cpV = root.querySelector('[data-cp="venc"]');
  if (cpV) cpV.textContent = p.vencimiento || "MM/AA";
  // Botones de acción.
  const btnPago = root.querySelector('[data-action="checkout-paso-pago"]');
  if (btnPago && btnPago.tagName === "BUTTON") btnPago.disabled = !datosValidos();
  const btnPagar = root.querySelector('[data-action="checkout-pagar"]');
  if (btnPagar) btnPagar.disabled = !pagoValido();
}

function abrirCheckout(datosIniciales) {
  // Revalidación local: quita del carrito lo que ya no está disponible.
  const quitados = [];
  Tienda.estado.carrito.slice().forEach((slug) => {
    const v = DB.vehiculo(slug);
    if (!v || !DB.estaDisponible(v)) {
      quitados.push(v ? v.marca + " " + v.modelo : slug);
      Tienda.quitarDelCarrito(slug);
    }
  });
  if (quitados.length) {
    toast(
      quitados.length === 1 ? "Vehículo ya no disponible" : "Algunos vehículos ya no están disponibles",
      quitados.join(", ") + (quitados.length === 1 ? " se quitó del carrito." : " se quitaron del carrito.")
    );
  }
  if (Tienda.estado.carrito.length === 0) return;

  if (!Auth.isAuthenticated()) {
    toast("Inicia sesión para continuar", "Necesitas una cuenta para finalizar la compra.");
    navigate("/login?redirect=/carrito");
    return;
  }

  checkoutState.abierto = true;
  checkoutState.paso = "datos";
  checkoutState.metodo = "tarjeta";
  checkoutState.mensajeError = "";
  checkoutState.numeroPedido = "";
  checkoutState.metodoExito = "tarjeta";
  checkoutState.pago = { tarjeta: "", vencimiento: "", cvv: "", nombreTarjeta: "" };
  const u = Auth.user();
  checkoutState.datos = datosIniciales || {
    nombre: u && u.name ? u.name : "",
    email: u ? u.email : "",
    telefono: "",
  };
  renderCheckoutModal();
}

function cerrarCheckout() {
  checkoutState.abierto = false;
  renderCheckoutModal();
  setTimeout(() => {
    checkoutState.paso = "datos";
    checkoutState.metodo = "tarjeta";
    checkoutState.mensajeError = "";
    checkoutState.datos = { nombre: "", email: "", telefono: "" };
    checkoutState.pago = { tarjeta: "", vencimiento: "", cvv: "", nombreTarjeta: "" };
  }, 300);
}

function checkoutPagar() {
  if (!Auth.isAuthenticated()) {
    guardarBorradorCheckout(checkoutState.datos);
    cerrarCheckout();
    navigate("/login?redirect=/carrito");
    return;
  }
  checkoutState.paso = "procesando";
  checkoutState.mensajeError = "";
  renderCheckoutModal();
  const slugs = Tienda.estado.carrito.slice();
  const total = slugs.map((id) => DB.vehiculo(id)).filter(Boolean).reduce((s, v) => s + v.precio, 0);
  const metodo = checkoutState.metodo;
  setTimeout(() => {
    const u = Auth.user();
    const res = DB.checkout(slugs, u.email, metodo === "saldo" ? "SALDO" : "CARD");
    if (!res.ok) {
      checkoutState.mensajeError = res.error || "No se pudo completar la compra.";
      checkoutState.paso = "error";
      renderCheckoutModal();
      return;
    }
    checkoutState.numeroPedido = res.orderNumber || "—";
    checkoutState.vehiculosExito = slugs;
    checkoutState.totalExito = total;
    checkoutState.metodoExito = metodo;
    Tienda.finalizarCompra();
    actualizarSaldos();
    borrarBorradorCheckout();
    checkoutState.paso = "exito";
    renderCheckoutModal();
  }, 1600);
}

// ---------------------------------------------------------------------------
// GRACIAS
// ---------------------------------------------------------------------------
function pageGracias() {
  const html =
    '<section class="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:py-24">' +
    '<div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-60" style="background: radial-gradient(50% 60% at 50% 40%, oklch(0.72 0.16 155 / 0.08), transparent 70%)"></div>' +
    '<div class="success-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">' +
    icon("CheckCircle2", "h-10 w-10", 2) +
    "</div>" +
    '<div class="anim-in" style="--dur:0.6s;--delay:0.2s;--from-y:12px">' +
    '<p class="text-eyebrow mt-8 text-[11px] text-[var(--success)]">' + icon("Sparkles", "mr-1 inline h-3 w-3", 2) + "Pedido completado</p>" +
    '<h1 class="text-display mt-4 text-4xl text-foreground sm:text-5xl">¡Gracias por tu compra!</h1>' +
    '<p class="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Tu pedido se ha completado correctamente. Ya puedes disfrutar de tu nuevo vehículo en tu garaje privado. Hemos guardado todo para que lo revises cuando quieras.</p>' +
    "</div></section>" +
    '<div class="mx-auto -mt-6 flex max-w-2xl flex-col items-center gap-3 px-4 pb-20 sm:flex-row sm:justify-center">' +
    '<a href="/garaje" data-nav class="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:gap-3 hover:shadow-[0_12px_40px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98]">Ver en mi garaje ' +
    icon("ArrowRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1") + "</a>" +
    '<a href="/marketplace" data-nav class="inline-flex items-center justify-center rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Seguir explorando</a>' +
    "</div>" +
    '<p class="pb-16 text-center text-xs text-muted-foreground">Digital Marketplace · Vehículos de Alta Gama</p>';

  return { title: "Gracias por tu compra · Digital Marketplace", html: siteShell("/gracias", html) };
}

// ---------------------------------------------------------------------------
// RECARGAR SALDO (moneda interna de la tienda, por cuenta)
// ---------------------------------------------------------------------------
const RECARGA_MONTOS = [10000, 50000, 100000, 250000];
const RECARGA_MAX = 10000000;
const recargaState = { monto: 0, procesando: false };

/** Sincroniza chips, importe y botón de la página /recargar sin re-render global. */
function actualizarRecargaUI() {
  const monto = recargaState.monto;
  const input = document.getElementById("recarga-custom");
  const valor = monto ? String(monto) : "";
  // No sobrescribir el campo mientras el usuario escribe en él.
  if (input && document.activeElement !== input && input.value !== valor) input.value = valor;
  document.querySelectorAll("[data-recarga-chip]").forEach((el) => {
    const esActivo = Number(el.getAttribute("data-monto")) === monto;
    el.classList.toggle("border-foreground/40", esActivo);
    el.classList.toggle("bg-secondary", esActivo);
    el.classList.toggle("text-foreground", esActivo);
    el.classList.toggle("border-border/60", !esActivo);
    el.classList.toggle("bg-background", !esActivo);
    el.classList.toggle("text-muted-foreground", !esActivo);
  });
  pintarRecargaBtn();
}

function pintarRecargaBtn() {
  const btn = document.getElementById("recarga-btn");
  if (!btn) return;
  btn.disabled = recargaState.monto <= 0 || recargaState.procesando;
  btn.innerHTML = recargaState.procesando
    ? icon("Loader2", "h-4 w-4 animate-spin") + "<span>Procesando recarga…</span>"
    : icon("Plus", "h-4 w-4") + "<span>Recargar saldo</span>";
}

function movimientosHtml(movimientos) {
  return movimientos.length === 0
    ? '<div class="flex flex-col items-center py-10 text-center">' +
      icon("Wallet", "h-10 w-10 text-muted-foreground/40", 1.5) +
      '<p class="mt-4 text-sm text-muted-foreground">Aún no hay movimientos en tu saldo.</p></div>'
    : '<ul class="mt-5 divide-y divide-border/40">' +
      movimientos.map((m) => {
        const esRecarga = m.tipo === "RECARGA";
        return (
          '<li class="flex items-center gap-3 py-3.5">' +
          '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' +
          (esRecarga ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--signature)]/15 text-[var(--signature)]") + '">' +
          icon(esRecarga ? "TrendingUp" : "ShoppingBag", "h-4 w-4", 2) + "</span>" +
          '<div class="min-w-0 flex-1">' +
          '<p class="truncate text-sm font-medium text-foreground">' + (esRecarga ? "Recarga de saldo" : esc(m.detalle || "Compra con saldo")) + "</p>" +
          '<p class="mt-0.5 text-xs text-muted-foreground">' + formatearFechaCorta(m.createdAt) + "</p>" +
          "</div>" +
          '<span class="text-sm font-semibold tabular-nums ' + (esRecarga ? "text-[var(--success)]" : "text-foreground") + '">' +
          (esRecarga ? "+" : "") + formatearPrecio(m.monto) + "</span>" +
          "</li>"
        );
      }).join("") +
      "</ul>";
}

function confirmarRecarga() {
  const u = Auth.user();
  if (!u || recargaState.procesando) return;
  const monto = recargaState.monto;
  if (!Number.isFinite(monto) || monto <= 0) {
    toast("Importe no válido", "Selecciona o introduce un importe mayor que cero.");
    return;
  }
  if (monto > RECARGA_MAX) {
    toast("Importe demasiado alto", "El máximo por recarga es " + formatearPrecio(RECARGA_MAX) + ".");
    return;
  }
  const email = u.email;
  recargaState.procesando = true;
  pintarRecargaBtn();
  setTimeout(() => {
    recargaState.procesando = false;
    const actual = Auth.user();
    if (!actual || actual.email !== email) return; // la sesión cambió durante la recarga
    const res = DB.recargarSaldo(email, monto);
    recargaState.monto = 0;
    if (!res.ok) {
      toast("No se pudo completar la recarga", res.error);
      actualizarRecargaUI();
      return;
    }
    toast("Recarga completada", "Se han añadido " + formatearPrecio(monto) + " a tu saldo LUXICAR.");
    actualizarRecargaUI();
    actualizarSaldos();
    const mov = document.getElementById("movimientos");
    if (mov) mov.innerHTML = movimientosHtml(DB.movimientosSaldoDe(email).slice(0, 8));
  }, 900);
}

function pageRecargar() {
  if (!Auth.isAuthenticated()) {
    return { redirect: "/login?redirect=/recargar" };
  }
  const user = Auth.user();
  const saldo = DB.saldoDe(user.email);
  const movimientos = DB.movimientosSaldoDe(user.email).slice(0, 8);
  const procesando = recargaState.procesando;
  const monto = recargaState.monto;

  const chipsHtml = RECARGA_MONTOS.map((m) => {
    const activo = monto === m;
    return (
      '<button type="button" data-action="recarga-chip" data-monto="' + m + '" data-recarga-chip class="rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ' +
      (activo
        ? "border-foreground/40 bg-secondary text-foreground"
        : "border-border/60 bg-background text-muted-foreground hover:bg-secondary/50 hover:text-foreground") + '">' +
      formatearPrecio(m) +
      "</button>"
    );
  }).join("");

  const html =
    '<div class="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">' +
    '<div class="anim-in border-b border-border/40 pb-10" style="--dur:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Monedero</p>' +
    '<h1 class="text-display mt-5 text-4xl text-foreground sm:text-5xl">Recargar saldo</h1>' +
    '<p class="mt-3 max-w-xl text-sm text-muted-foreground">Añade saldo a tu cuenta y úsalo como método de pago al finalizar tus compras.</p>' +
    "</div>" +
    '<section class="anim-in mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-card sm:p-7" style="--delay:0.05s">' +
    '<div class="flex flex-wrap items-start justify-between gap-4">' +
    "<div>" +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Saldo LUXICAR</p>' +
    '<p data-saldo class="mt-3 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">' + formatearPrecio(saldo) + "</p>" +
    '<p class="mt-2 text-sm text-muted-foreground">Moneda interna de la tienda · sin caducidad</p>' +
    "</div>" +
    '<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--signature)]/15 text-[var(--signature)]">' +
    icon("Wallet", "h-6 w-6", 1.8) + "</span>" +
    "</div></section>" +
    '<section class="anim-in mt-6 rounded-2xl border border-border/50 bg-card p-6 shadow-card sm:p-7" style="--delay:0.1s">' +
    '<h2 class="text-lg font-semibold tracking-tight text-foreground">Recargar saldo</h2>' +
    '<p class="mt-1 text-sm text-muted-foreground">Elige un importe o escribe el tuyo. Recarga simulada: no se realiza ningún cargo real.</p>' +
    '<div class="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">' + chipsHtml + "</div>" +
    '<div class="mt-4">' +
    '<label class="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground" for="recarga-custom">Importe personalizado</label>' +
    '<div class="relative">' +
    icon("DollarSign", "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground") +
    '<input id="recarga-custom" type="text" inputmode="numeric" placeholder="Ej. 75000" value="' + (monto ? monto : "") + '" autocomplete="off" class="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-ring/30">' +
    "</div></div>" +
    '<button id="recarga-btn" data-action="recarga-confirmar" ' + (monto > 0 && !procesando ? "" : "disabled ") + 'class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">' +
    (procesando
      ? icon("Loader2", "h-4 w-4 animate-spin") + "<span>Procesando recarga…</span>"
      : icon("Plus", "h-4 w-4") + "<span>Recargar saldo</span>") +
    "</button>" +
    '<p class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">' + icon("ShieldCheck", "h-3.5 w-3.5 text-[var(--success)]", 2.2) + "El saldo está disponible como método de pago en el checkout.</p>" +
    "</section>" +
    '<section class="anim-in mt-6 rounded-2xl border border-border/50 bg-card p-6 shadow-card sm:p-7" style="--delay:0.15s">' +
    '<h2 class="text-lg font-semibold tracking-tight text-foreground">Movimientos recientes</h2>' +
    '<div id="movimientos">' + movimientosHtml(movimientos) + "</div>" +
    "</section>" +
    "</div>";

  return {
    title: "Recargar saldo · Digital Marketplace",
    html: siteShell("/recargar", html),
    mount() {
      const input = document.getElementById("recarga-custom");
      if (!input) return;
      input.addEventListener("input", () => {
        const limpio = input.value.replace(/\D/g, "").slice(0, 8);
        if (input.value !== limpio) input.value = limpio;
        recargaState.monto = limpio ? parseInt(limpio, 10) : 0;
        actualizarRecargaUI();
      });
    },
  };
}
