// ============================================================================
// app.js — Router por History API, delegación de eventos y arranque.
// ============================================================================
"use strict";

const ROUTES = [
  { pattern: /^\/$/, page: () => pageHome() },
  { pattern: /^\/marketplace$/, page: () => pageMarketplace() },
  { pattern: /^\/marcas$/, page: () => pageMarcas() },
  { pattern: /^\/marcas\/([^/]+)$/, page: (m) => pageMarca(m[1]) },
  { pattern: /^\/vehiculos\/([^/]+)$/, page: (m) => pageVehiculo(m[1]) },
  { pattern: /^\/favoritos$/, page: () => pageFavoritos() },
  { pattern: /^\/comparar$/, page: () => pageComparar() },
  { pattern: /^\/garaje$/, page: () => pageGaraje() },
  { pattern: /^\/carrito$/, page: () => pageCarrito() },
  { pattern: /^\/gracias$/, page: () => pageGracias() },
  { pattern: /^\/login$/, page: (m, p) => pageLogin(p) },
  { pattern: /^\/registro$/, page: (m, p) => pageRegistro(p) },
  { pattern: /^\/perfil$/, page: () => pagePerfil() },
  { pattern: /^\/pedidos$/, page: () => pagePedidos() },
  { pattern: /^\/admin$/, page: () => pageAdmin() },
  { pattern: /^\/admin\/login$/, page: () => pageAdminLogin() },
  { pattern: /^\/privacidad$/, page: () => pagePrivacidad() },
  { pattern: /^\/terminos$/, page: () => pageTerminos() },
];

let currentPath = null;
let currentUnmount = null;
let currentRouteKey = null;
let currentFullRoute = null;

// Abierto como archivo local (file://) no se puede usar pushState: las rutas
// viajan entonces en el hash (#/marketplace) y el resto del código no cambia.
const ES_ARCHIVO = location.protocol === "file:";

function rutaActual() {
  if (ES_ARCHIVO) {
    const h = location.hash.replace(/^#/, "");
    return h.charAt(0) === "/" ? h : "/";
  }
  return (location.pathname || "/") + (location.search || "");
}

function routeKey(path) {
  if (path.indexOf("/vehiculos/") === 0) return "/vehiculos/*";
  if (path.indexOf("/marcas/") === 0) return "/marcas/*";
  return path;
}

function resolvePage(path, params) {
  for (const r of ROUTES) {
    const m = r.pattern.exec(path);
    if (m) return r.page(m, params);
  }
  return pageNotFound();
}

/** Render completo de la página actual. */
function render() {
  const full = rutaActual();
  const qIdx = full.indexOf("?");
  const path = (qIdx === -1 ? full : full.slice(0, qIdx)).replace(/\/$/, "") || "/";
  const params = new URLSearchParams(qIdx === -1 ? "" : full.slice(qIdx + 1));

  if (typeof currentUnmount === "function") {
    try { currentUnmount(); } catch (e) {}
    currentUnmount = null;
  }

  const result = resolvePage(path, params);

  if (result && result.redirect) {
    navigate(result.redirect, { replace: true });
    return;
  }

  currentPath = path;
  currentFullRoute = full;
  currentRouteKey = routeKey(path);
  const app = document.getElementById("app");
  app.innerHTML = result.html;
  document.title = result.title || "Digital Marketplace";

  // Transición de página al navegar entre vistas.
  app.classList.remove("page-enter");
  void app.offsetWidth;
  app.classList.add("page-enter");

  if (typeof result.mount === "function") {
    const cleanup = result.mount();
    if (typeof cleanup === "function") currentUnmount = cleanup;
  }

  requestAnimationFrame(initObservers);
}

/** Re-render conservando la posición del scroll (para cambios de estado). */
function rerender(keepScroll) {
  const y = keepScroll ? window.scrollY : 0;
  render();
  if (keepScroll) window.scrollTo(0, y);
}

/** Navegación SPA. */
function navigate(href, opts) {
  opts = opts || {};
  let target = href;
  if (target.indexOf("?") !== -1) {
    const parts = target.split("?");
    target = (parts[0].replace(/\/$/, "") || "/") + "?" + parts[1];
  }
  if (ES_ARCHIVO) {
    if (opts.replace) location.replace("#" + target);
    else location.hash = "#" + target;
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (opts.replace) history.replaceState({ path: target }, "", target);
  else history.pushState({ path: target }, "", target);
  render();
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// Observadores de animación al hacer scroll (animaciones de entrada)
// ---------------------------------------------------------------------------
let animObserver = null;
function initObservers() {
  if (!animObserver) {
    animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            animObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
  }
  document.querySelectorAll(".anim-view:not(.in-view)").forEach((el) => {
    animObserver.observe(el);
  });
  // Imágenes ya cacheadas (complete antes del evento load).
  document.querySelectorAll(".smart-img > img").forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      const wrap = img.closest(".smart-img");
      if (wrap) wrap.classList.add("loaded");
    }
  });
}

// ---------------------------------------------------------------------------
// Acciones globales (delegación de eventos)
// ---------------------------------------------------------------------------
function toggleFavorito(slug, nombre) {
  const dentro = Tienda.toggleFavorito(slug);
  Auth.persistFavorite(slug, dentro);
  toast(
    dentro ? "Añadido a favoritos" : "Eliminado de favoritos",
    nombre + (dentro ? " se ha añadido a tus favoritos." : " se ha quitado de tus favoritos.")
  );
  rerender(true);
}

function toggleComparar(slug, nombre) {
  const res = Tienda.toggleComparar(slug);
  if (!res.ok) {
    toast("Comparador lleno", "Solo puedes comparar hasta 3 vehículos a la vez.");
    return;
  }
  toast(
    res.dentro ? "Añadido al comparador" : "Quitado del comparador",
    nombre + (res.dentro ? " se ha añadido al comparador." : " se ha quitado del comparador.")
  );
  rerender(true);
}

function addCarrito(slug, nombre) {
  const v = DB.vehiculo(slug);
  if (!v || !DB.estaDisponible(v)) return;
  const ok = Tienda.agregarAlCarrito(slug, true);
  if (!ok) return;
  DB.trackEvent("CART_ADDED");
  toast("Añadido al carrito", nombre + " se ha añadido a tu carrito.");
  rerender(true);
}

function logoutAdmin() {
  Auth.logout();
  navigate("/admin/login", { replace: true });
}

const ACTIONS = {
  "toggle-favorito": (el) => toggleFavorito(el.getAttribute("data-slug"), el.getAttribute("data-nombre") || ""),
  "toggle-comparar": (el) => toggleComparar(el.getAttribute("data-slug"), el.getAttribute("data-nombre") || ""),
  "add-carrito": (el) => addCarrito(el.getAttribute("data-slug"), el.getAttribute("data-nombre") || ""),
  "quitar-carrito": (el) => {
    Tienda.quitarDelCarrito(el.getAttribute("data-slug"));
    toast("Vehículo eliminado", (el.getAttribute("data-nombre") || "") + " se ha quitado del carrito.");
    rerender(true);
  },
  "quitar-comparar": (el) => {
    Tienda.quitarDelComparador(el.getAttribute("data-slug"));
    rerender(true);
  },
  "vaciar-comparador": () => {
    Tienda.vaciarComparador();
    rerender(true);
  },
  "menu-abrir": () => {
    cerrarSheet();
    const div = document.createElement("div");
    div.id = "sheet-root";
    div.innerHTML = sheetHtml(currentPath || "/");
    document.body.appendChild(div);
    document.body.classList.add("no-scroll");
  },
  "menu-cerrar": () => cerrarSheet(),
  "tema-menu": () => {
    const menu = document.getElementById("tema-menu");
    if (menu) menu.classList.toggle("hidden");
  },
  "tema-set": (el) => {
    Tema.set(el.getAttribute("data-tema"));
    setTimeout(() => rerender(true), 200);
  },
  "logout": () => {
    Auth.logout();
    cerrarSheet();
    rerender(true);
  },
  "logout-home": () => {
    Auth.logout();
    navigate("/");
  },
  "logout-admin": () => logoutAdmin(),
  "toggle-password": (el) => {
    const input = document.getElementById(el.getAttribute("data-target"));
    if (!input) return;
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    el.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
    el.innerHTML = icon(mostrar ? "EyeOff" : "Eye", "h-4 w-4");
  },
  "cookie-aceptar": () => cerrarCookies("accepted"),
  "cookie-rechazar": () => cerrarCookies("rejected"),
  "abrir-checkout": () => abrirCheckout(),
  "checkout-cerrar": () => cerrarCheckout(),
  "checkout-overlay": (el, ev) => {
    if (ev.target === el && checkoutState.paso !== "procesando") cerrarCheckout();
  },
  "checkout-paso-pago": () => {
    checkoutState.paso = "pago";
    renderCheckoutModal();
  },
  "checkout-paso-datos": () => {
    checkoutState.paso = "datos";
    renderCheckoutModal();
  },
  "checkout-pagar": () => checkoutPagar(),
  "pedido-detalle": (el) => abrirPedidoModal(el.getAttribute("data-number")),
  "pedido-cerrar": (el, ev) => {
    if (el.hasAttribute("data-stop")) return;
    if (el.classList.contains("modal-overlay") && ev.target !== el) return;
    cerrarPedidoModal();
  },
  "galeria": (el) => galeriaCambiar(el.getAttribute("data-index")),
  "limpiar-busqueda": () => {
    marketplaceState.busqueda = "";
    rerender(true);
  },
  "limpiar-filtros": () => {
    marketplaceState.busqueda = "";
    marketplaceState.filtros = {
      marca: null, categorias: [], combustibles: [], tracciones: [],
      precioMin: PRECIO_MIN, precioMax: PRECIO_MAX,
      añoMin: AÑO_MIN, añoMax: AÑO_MAX, potenciaMin: 0,
    };
    rerender(true);
  },
  "toggle-panel-filtros": () => {
    marketplaceState.panelAbierto = !marketplaceState.panelAbierto;
    rerender(true);
  },
  "filtro-marca": (el) => {
    const valor = el.getAttribute("data-valor") || null;
    marketplaceState.filtros.marca = marketplaceState.filtros.marca === valor ? null : valor;
    rerender(true);
  },
  "filtro-chip": (el) => {
    const grupo = el.getAttribute("data-grupo");
    const valor = el.getAttribute("data-valor");
    const arr = marketplaceState.filtros[grupo];
    marketplaceState.filtros[grupo] = arr.includes(valor)
      ? arr.filter((x) => x !== valor)
      : arr.concat(valor);
    rerender(true);
  },
};

function cerrarSheet() {
  const root = document.getElementById("sheet-root");
  if (root) {
    const panel = root.querySelector(".sheet-panel");
    const overlay = root.querySelector(".sheet-overlay");
    if (panel) panel.classList.add("closing");
    if (overlay) overlay.classList.add("closing");
    setTimeout(() => root.remove(), 300);
  }
  document.body.classList.remove("no-scroll");
}

function cerrarCookies(valor) {
  try { localStorage.setItem("dm-cookie-consent", valor); } catch (e) {}
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    banner.classList.remove("cookie-in");
    banner.classList.add("cookie-out");
    setTimeout(() => banner.remove(), 300);
  }
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  smartImgBoot();

  // Clics: navegación SPA + acciones.
  document.addEventListener("click", (ev) => {
    const actionEl = ev.target.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.getAttribute("data-action");
      if (action === "checkout-cerrar" && actionEl.hasAttribute("data-nav")) {
        // Enlace dentro del modal de éxito: cierra el modal y deja que el
        // manejador data-nav de abajo procese la navegación SPA.
        cerrarCheckout();
      } else {
      const fn = ACTIONS[action];
      if (fn) {
        if (actionEl.hasAttribute("data-sheet-close")) setTimeout(cerrarSheet, 50);
        if (actionEl.tagName === "A" && actionEl.hasAttribute("data-nav")) {
          ev.preventDefault();
          navigate(actionEl.getAttribute("href"));
          return;
        }
        fn(actionEl, ev);
        return;
      }
      }
    }

    // Navegación SPA.
    const link = ev.target.closest("a[data-nav]");
    if (link) {
      ev.preventDefault();
      const href = link.getAttribute("href");
      if (link.hasAttribute("data-sheet-close")) {
        cerrarSheet();
        setTimeout(() => navigate(href), 120);
      } else {
        navigate(href);
      }
      return;
    }

    // Cerrar menús al hacer clic fuera.
    const cuentaMenu = document.getElementById("cuenta-menu");
    if (cuentaMenu && !cuentaMenu.classList.contains("hidden") && !ev.target.closest("#cuenta-wrap")) {
      cuentaMenu.classList.add("hidden");
    }
    const temaMenu = document.getElementById("tema-menu");
    if (temaMenu && !temaMenu.classList.contains("hidden") && !ev.target.closest("#tema-wrap")) {
      temaMenu.classList.add("hidden");
    }
  });

  // Botón de cuenta (menú desplegable).
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("#cuenta-btn");
    if (btn) {
      const menu = document.getElementById("cuenta-menu");
      if (menu) menu.classList.toggle("hidden");
    }
  });

  // Escape: cierra modales y menús.
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    cerrarSheet();
    const cuentaMenu = document.getElementById("cuenta-menu");
    if (cuentaMenu) cuentaMenu.classList.add("hidden");
    const temaMenu = document.getElementById("tema-menu");
    if (temaMenu) temaMenu.classList.add("hidden");
    cerrarPedidoModal();
    if (checkoutState.abierto && checkoutState.paso !== "procesando") cerrarCheckout();
  });

  // Historial (atrás / adelante).
  window.addEventListener("popstate", () => {
    render();
  });
  window.addEventListener("hashchange", () => {
    if (ES_ARCHIVO && rutaActual() !== currentFullRoute) render();
  });

  // CTA móvil fijo al hacer scroll.
  window.addEventListener(
    "scroll",
    () => {
      const cta = document.getElementById("sticky-cta");
      if (cta) {
        if (window.scrollY > 320) cta.classList.remove("hidden");
        else cta.classList.add("hidden");
      }
    },
    { passive: true }
  );

  // Re-render cuando cambia la autenticación (para reflejar el header, etc.).
  Auth.subscribe(() => rerender(true));

  render();
});
