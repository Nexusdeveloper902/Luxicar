// ============================================================================
// store.js — Estado de la aplicación, persistencia local y "capa de datos".
// Sustituye al backend (API + base de datos) de la aplicación original:
//   - Tienda: carrito, garaje, favoritos, comparador, vistos recientes.
//   - Auth: usuarios demo + registro/inicio de sesión de demostración.
//   - DB local: pedidos, reseñas, inventario, eventos de analítica.
// Todo se persiste en localStorage con las mismas claves que la app original.
// ============================================================================
"use strict";

// ---------------------------------------------------------------------------
// Utilidades de formato (equivalentes a src/lib/format.ts)
// ---------------------------------------------------------------------------
function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(precio);
}

function formatearNumero(n) {
  return new Intl.NumberFormat("es-ES").format(n);
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearFechaCorta(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Las rutas de imágenes originales son absolutas (/vehicles/...); aquí se
// reescriben a la carpeta local de assets.
function imgUrl(p) {
  if (!p) return "";
  if (p.indexOf("/vehicles/") === 0) return "/assets/vehicles/" + p.slice("/vehicles/".length);
  return p;
}

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* almacenamiento lleno o no disponible */ }
}

// ---------------------------------------------------------------------------
// Tienda (equivalente a src/store/use-store.ts, persistida en localStorage
// con la misma clave y estructura que zustand/persist).
// ---------------------------------------------------------------------------
const MAX_COMPARAR = 3;
const MAX_RECIENTES = 8;

const Tienda = (function () {
  const KEY = "digital-marketplace-tienda";
  const listeners = [];

  const estado = Object.assign(
    {
      carrito: [],
      garaje: [],
      favoritos: [],
      comparar: [],
      recientes: [],
      ordenamiento: "relevancia",
    },
    (lsGet(KEY, {}).state || {})
  );

  function guardar() {
    lsSet(KEY, { state: estado, version: 0 });
  }

  function emitir() {
    guardar();
    listeners.forEach((cb) => cb());
  }

  function dedup(arr) {
    return Array.from(new Set(arr));
  }

  return {
    estado,
    subscribe(cb) { listeners.push(cb); },
    agregarAlCarrito(id, disponible) {
      if (disponible === false || estado.carrito.includes(id)) return false;
      estado.carrito.push(id);
      emitir();
      return true;
    },
    quitarDelCarrito(id) {
      estado.carrito = estado.carrito.filter((x) => x !== id);
      emitir();
    },
    estaEnCarrito(id) { return estado.carrito.includes(id); },
    vaciarCarrito() {
      if (!estado.carrito.length) return;
      estado.carrito = [];
      emitir();
    },
    estaComprado(id) { return estado.garaje.includes(id); },
    setGaraje(ids) {
      estado.garaje = dedup(ids);
      emitir();
    },
    finalizarCompra() {
      if (!estado.carrito.length) return;
      estado.garaje = dedup(estado.garaje.concat(estado.carrito));
      estado.carrito = [];
      emitir();
    },
    toggleFavorito(id) {
      estado.favoritos = estado.favoritos.includes(id)
        ? estado.favoritos.filter((x) => x !== id)
        : estado.favoritos.concat(id);
      emitir();
      return estado.favoritos.includes(id);
    },
    esFavorito(id) { return estado.favoritos.includes(id); },
    setFavoritos(ids) {
      estado.favoritos = dedup(ids);
      emitir();
    },
    toggleComparar(id) {
      if (estado.comparar.includes(id)) {
        estado.comparar = estado.comparar.filter((x) => x !== id);
        emitir();
        return { ok: true, dentro: false };
      }
      if (estado.comparar.length >= MAX_COMPARAR) return { ok: false, dentro: true };
      estado.comparar = estado.comparar.concat(id);
      emitir();
      return { ok: true, dentro: true };
    },
    quitarDelComparador(id) {
      estado.comparar = estado.comparar.filter((x) => x !== id);
      emitir();
    },
    estaEnComparador(id) { return estado.comparar.includes(id); },
    vaciarComparador() {
      estado.comparar = [];
      emitir();
    },
    marcarVisto(id) {
      estado.recientes = [id].concat(estado.recientes.filter((x) => x !== id)).slice(0, MAX_RECIENTES);
      guardar(); // sin re-render: no es visible inmediatamente
    },
    setOrdenamiento(o) {
      estado.ordenamiento = o;
      guardar();
    },
  };
})();

// ---------------------------------------------------------------------------
// Base de datos local (pedidos, reseñas, inventario, usuarios, favoritos de
// cuenta, eventos). Se inicializa desde SEED la primera vez.
// ---------------------------------------------------------------------------
const DB = (function () {
  const KEY_PEDIDOS = "luxicar-orders";
  const KEY_REVIEWS = "luxicar-reviews";
  const KEY_INVENTARIO = "luxicar-inventory";
  const KEY_USUARIOS = "luxicar-users";
  const KEY_FAVORITOS = "luxicar-favorites";
  const KEY_EVENTOS = "luxicar-events";
  const KEY_SALDOS = "luxicar-balances";

  function init(key, seedValue) {
    let v = lsGet(key, null);
    if (v === null) {
      v = seedValue;
      lsSet(key, v);
    }
    return v;
  }

  const pedidos = init(KEY_PEDIDOS, SEED.pedidos);
  const reviews = init(KEY_REVIEWS, SEED.reviews);
  const inventario = init(KEY_INVENTARIO, (function () {
    const m = {};
    SEED.vehiculos.forEach((v) => { m[v.id] = { stock: v.stock, available: v.available }; });
    return m;
  })());
  const usuarios = init(KEY_USUARIOS, SEED.usuarios);
  const favoritosCuentas = init(KEY_FAVORITOS, SEED.favoritos);
  const saldos = init(KEY_SALDOS, {});
  const eventos = init(KEY_EVENTOS, (function () {
    const completados = SEED.pedidos.filter((p) => p.status === "COMPLETED").length;
    return { VEHICLE_VIEWED: 201, CART_ADDED: 40, PURCHASE_COMPLETED: completados };
  })());

  function guardarPedidos() { lsSet(KEY_PEDIDOS, pedidos); }
  function guardarReviews() { lsSet(KEY_REVIEWS, reviews); }
  function guardarInventario() { lsSet(KEY_INVENTARIO, inventario); }
  function guardarUsuarios() { lsSet(KEY_USUARIOS, usuarios); }
  function guardarFavoritos() { lsSet(KEY_FAVORITOS, favoritosCuentas); }
  function guardarSaldos() { lsSet(KEY_SALDOS, saldos); }

  // Saldo de moneda interna por cuenta (recargable en /recargar, gastable en
  // el checkout). Se guarda aparte de los usuarios para no tocar su formato.
  function cuentaSaldo(email) {
    if (!saldos[email]) {
      saldos[email] = { balance: 0, movimientos: [] };
      guardarSaldos();
    }
    return saldos[email];
  }

  return {
    // --- Catálogo ---
    vehiculos() {
      return SEED.vehiculos.map((v) => {
        const inv = inventario[v.id];
        return Object.assign({}, v, {
          stock: inv ? inv.stock : v.stock,
          available: inv ? inv.available : v.available,
        });
      });
    },
    vehiculo(slug) {
      return this.vehiculos().find((v) => v.id === slug) || null;
    },
    marcas() { return SEED.marcas; },
    marcasDisponibles() {
      const set = new Set(this.vehiculos().filter((v) => v.available).map((v) => v.marca));
      return Array.from(set).sort();
    },
    estaDisponible(v) {
      return v && v.available !== false && (v.stock == null ? 1 : v.stock) > 0;
    },
    // --- Usuarios ---
    usuarios() { return usuarios; },
    buscarUsuario(email) {
      return usuarios.find((u) => u.email === String(email).toLowerCase()) || null;
    },
    crearUsuario(name, email, password) {
      const u = {
        email: String(email).toLowerCase(),
        name,
        role: "USER",
        password,
        createdAt: new Date().toISOString(),
      };
      usuarios.push(u);
      guardarUsuarios();
      return u;
    },
    // --- Pedidos ---
    pedidos() { return pedidos; },
    pedidosDe(email) {
      return pedidos
        .filter((p) => p.userEmail === email)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    siguienteNumeroPedido() {
      const año = new Date().getFullYear();
      let max = 0;
      pedidos.forEach((p) => {
        const m = /^LXC-(\d+)-(\d+)$/.exec(p.number || "");
        if (m) max = Math.max(max, parseInt(m[2], 10));
      });
      return "LXC-" + año + "-" + String(max + 1).padStart(5, "0");
    },
    /**
     * Checkout transaccional local (equivale a data/orders.ts::checkout):
     * valida disponibilidad/stock, congela el precio, cobra con tarjeta
     * (simulado) o con el saldo de la cuenta, crea el pedido COMPLETED
     * y decrementa el inventario.
     */
    checkout(slugs, userEmail, metodoPago) {
      if (!slugs.length) return { ok: false, error: "El carrito está vacío" };
      metodoPago = metodoPago === "SALDO" ? "SALDO" : "CARD";
      const items = [];
      for (const slug of slugs) {
        const v = this.vehiculo(slug);
        if (!v || !this.estaDisponible(v)) {
          return { ok: false, error: "Uno o más vehículos ya no están disponibles" };
        }
        if ((v.stock == null ? 1 : v.stock) < 1) {
          return {
            ok: false,
            error: "Stock insuficiente para " + v.marca + " " + v.modelo + " (disponible: " + (v.stock || 0) + ")",
          };
        }
        items.push({
          vehicleSlug: v.id,
          marca: v.marca,
          modelo: v.modelo,
          priceAtPurchase: v.precio,
          quantity: 1,
        });
      }
      const total = items.reduce((s, it) => s + it.priceAtPurchase * it.quantity, 0);
      const number = this.siguienteNumeroPedido();
      if (metodoPago === "SALDO") {
        const cobro = this.gastarSaldo(userEmail, total, "Pedido " + number);
        if (!cobro.ok) {
          return { ok: false, error: "Saldo insuficiente para completar la compra. Recarga tu saldo o paga con tarjeta." };
        }
      }
      const pedido = {
        id: number,
        number,
        userEmail,
        status: "COMPLETED",
        total,
        paymentMethod: metodoPago,
        createdAt: new Date().toISOString(),
        items,
      };
      pedidos.push(pedido);
      guardarPedidos();
      items.forEach((it) => {
        const inv = inventario[it.vehicleSlug];
        if (inv) {
          inv.stock = Math.max(0, inv.stock - 1);
          if (inv.stock <= 0) inv.available = false;
          guardarInventario();
        }
      });
      this.trackEvent("PURCHASE_COMPLETED");
      return { ok: true, orderId: number, orderNumber: number, total, vehicles: items.map((i) => i.vehicleSlug) };
    },
    // --- Reseñas ---
    reviewsDe(vehicleSlug) {
      const lista = reviews
        .filter((r) => r.vehicleSlug === vehicleSlug)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const count = lista.length;
      const average = count ? lista.reduce((s, r) => s + r.rating, 0) / count : 0;
      return { reviews: lista, average, count };
    },
    crearReview(vehicleSlug, userEmail, rating, comment) {
      const v = this.vehiculo(vehicleSlug);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { ok: false, error: "La valoración debe estar entre 1 y 5" };
      }
      const texto = (comment || "").trim();
      if (texto.length > 1000) return { ok: false, error: "El comentario es demasiado largo" };
      if (!v) return { ok: false, error: "Vehículo no encontrado" };
      const comprado = pedidos.some(
        (p) =>
          p.userEmail === userEmail &&
          p.status === "COMPLETED" &&
          p.items.some((it) => it.vehicleSlug === vehicleSlug)
      );
      if (!comprado) {
        return { ok: false, error: "Solo puedes reseñar vehículos que hayas comprado" };
      }
      if (reviews.some((r) => r.vehicleSlug === vehicleSlug && r.user.email === userEmail)) {
        return { ok: false, error: "Ya has reseñado este vehículo" };
      }
      const u = this.buscarUsuario(userEmail);
      const review = {
        id: "rev-" + Date.now().toString(36),
        vehicleSlug,
        rating,
        comment: texto,
        createdAt: new Date().toISOString(),
        user: { email: userEmail, name: u ? u.name : null },
      };
      reviews.push(review);
      guardarReviews();
      return { ok: true, review };
    },
    // --- Favoritos por cuenta ---
    favoritosDe(email) {
      return (favoritosCuentas[email] || []).slice();
    },
    setFavoritosDe(email, slugs) {
      favoritosCuentas[email] = Array.from(new Set(slugs));
      guardarFavoritos();
    },
    // --- Saldo de moneda interna (por cuenta) ---
    saldoDe(email) {
      return cuentaSaldo(email).balance;
    },
    movimientosSaldoDe(email) {
      return cuentaSaldo(email).movimientos.slice();
    },
    recargarSaldo(email, monto) {
      monto = Math.round(Number(monto));
      if (!Number.isFinite(monto) || monto <= 0) {
        return { ok: false, error: "Introduce un importe válido mayor que cero" };
      }
      if (monto > 10000000) {
        return { ok: false, error: "El importe máximo por recarga es " + formatearPrecio(10000000) };
      }
      const c = cuentaSaldo(email);
      c.balance += monto;
      c.movimientos.unshift({
        id: "mov-" + Date.now().toString(36),
        tipo: "RECARGA",
        monto,
        createdAt: new Date().toISOString(),
      });
      c.movimientos = c.movimientos.slice(0, 50);
      guardarSaldos();
      return { ok: true, balance: c.balance };
    },
    gastarSaldo(email, monto, detalle) {
      const c = cuentaSaldo(email);
      if (c.balance < monto) return { ok: false, error: "Saldo insuficiente" };
      c.balance -= monto;
      c.movimientos.unshift({
        id: "mov-" + Date.now().toString(36),
        tipo: "COMPRA",
        monto: -monto,
        detalle: detalle || "",
        createdAt: new Date().toISOString(),
      });
      c.movimientos = c.movimientos.slice(0, 50);
      guardarSaldos();
      return { ok: true, balance: c.balance };
    },
    // --- Eventos de analítica ---
    trackEvent(tipo) {
      eventos[tipo] = (eventos[tipo] || 0) + 1;
      lsSet(KEY_EVENTOS, eventos);
    },
    contadoresEventos() { return Object.assign({}, eventos); },
  };
})();

// ---------------------------------------------------------------------------
// Autenticación de demostración (sustituye a la API /api/auth y a la cookie
// de sesión). La contraseña se guarda en texto plano: ES SOLO UNA DEMO LOCAL.
// ---------------------------------------------------------------------------
const Auth = (function () {
  const KEY_SESION = "luxicar-session";
  const listeners = [];

  function emailSesion() {
    try { return localStorage.getItem(KEY_SESION); } catch (e) { return null; }
  }

  function emitir() { listeners.forEach((cb) => cb()); }

  return {
    subscribe(cb) { listeners.push(cb); },
    user() {
      const email = emailSesion();
      return email ? DB.buscarUsuario(email) : null;
    },
    isAuthenticated() { return !!this.user(); },
    isAdmin() {
      const u = this.user();
      return !!u && u.role === "ADMIN";
    },
    login(email, password) {
      email = String(email || "").trim().toLowerCase();
      if (!email || !password) return { ok: false, error: "Credenciales incorrectas" };
      const u = DB.buscarUsuario(email);
      if (!u || u.password !== password) return { ok: false, error: "Credenciales incorrectas" };
      try { localStorage.setItem(KEY_SESION, u.email); } catch (e) {}
      emitir();
      return { ok: true, user: u };
    },
    register(name, email, password) {
      name = String(name || "").trim();
      email = String(email || "").trim().toLowerCase();
      if (name.length < 2) return { ok: false, error: "El nombre debe tener al menos 2 caracteres" };
      if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Correo electrónico inválido" };
      if (String(password).length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
      if (DB.buscarUsuario(email)) {
        return { ok: false, error: "Ya existe una cuenta con este correo electrónico" };
      }
      const u = DB.crearUsuario(name, email, String(password));
      try { localStorage.setItem(KEY_SESION, u.email); } catch (e) {}
      emitir();
      return { ok: true, user: u };
    },
    logout() {
      try { localStorage.removeItem(KEY_SESION); } catch (e) {}
      // El garaje en memoria pertenece a la cuenta que sale: no debe quedar
      // visible (badges "Comprado", contador del header) para el siguiente usuario.
      Tienda.setGaraje([]);
      emitir();
    },
    /** Reconstruye el garaje de la tienda desde los pedidos completados de la cuenta. */
    syncGarageFromAccount() {
      const u = this.user();
      if (!u) return;
      const ids = [];
      DB.pedidosDe(u.email)
        .filter((p) => p.status === "COMPLETED")
        .forEach((p) => p.items.forEach((it) => ids.push(it.vehicleSlug)));
      Tienda.setGaraje(ids);
    },
    /** Fusiona los favoritos de invitado con los de la cuenta (como /api/favorites merge). */
    mergeGuestFavorites(slugs) {
      const u = this.user();
      if (!u || !slugs || !slugs.length) return;
      DB.setFavoritosDe(u.email, DB.favoritosDe(u.email).concat(slugs));
    },
    /** Sincroniza la tienda con los favoritos de la cuenta al iniciar sesión. */
    syncFavoritesFromAccount() {
      const u = this.user();
      if (!u) return;
      const cuenta = DB.favoritosDe(u.email);
      const invitado = Tienda.estado.favoritos;
      const merged = cuenta.concat(invitado.filter((s) => !cuenta.includes(s)));
      if (invitado.length) DB.setFavoritosDe(u.email, merged);
      Tienda.setFavoritos(merged);
    },
    /** Refleja un toggle de favorito en la cuenta activa. */
    persistFavorite(slug, dentro) {
      const u = this.user();
      if (!u) return;
      const actuales = DB.favoritosDe(u.email);
      DB.setFavoritosDe(
        u.email,
        dentro ? actuales.concat(slug) : actuales.filter((s) => s !== slug)
      );
    },
  };
})();

// ---------------------------------------------------------------------------
// Tema visual (equivalente a src/store/use-tema.ts)
// ---------------------------------------------------------------------------
const TEMAS = [
  { id: "midnight", nombre: "Midnight", descripcion: "Noche profunda con acento champán", muestra: "#d4a857", variables: { "--background": "oklch(0.12 0.004 75)", "--foreground": "oklch(0.98 0.002 75)", "--card": "oklch(0.165 0.005 75)", "--popover": "oklch(0.17 0.005 75)", "--primary": "oklch(0.98 0.002 75)", "--primary-foreground": "oklch(0.12 0.004 75)", "--secondary": "oklch(0.215 0.005 75)", "--muted": "oklch(0.2 0.005 75)", "--muted-foreground": "oklch(0.64 0.012 75)", "--accent": "oklch(0.245 0.006 75)", "--border": "oklch(1 0 0 / 8%)", "--input": "oklch(1 0 0 / 12%)", "--ring": "oklch(0.98 0 0 / 35%)", "--signature": "oklch(0.85 0.09 80)", "--success": "oklch(0.72 0.16 155)" } },
  { id: "arctic", nombre: "Arctic", descripcion: "Azul glacial luminoso y sereno", muestra: "#5fa8d3", variables: { "--background": "oklch(0.13 0.006 240)", "--foreground": "oklch(0.98 0.003 240)", "--card": "oklch(0.17 0.008 240)", "--popover": "oklch(0.18 0.008 240)", "--primary": "oklch(0.97 0.01 240)", "--primary-foreground": "oklch(0.13 0.006 240)", "--secondary": "oklch(0.22 0.008 240)", "--muted": "oklch(0.2 0.008 240)", "--muted-foreground": "oklch(0.66 0.015 240)", "--accent": "oklch(0.25 0.01 240)", "--border": "oklch(1 0 0 / 8%)", "--input": "oklch(1 0 0 / 12%)", "--ring": "oklch(0.7 0.12 240 / 40%)", "--signature": "oklch(0.72 0.12 220)", "--success": "oklch(0.72 0.16 155)" } },
  { id: "emerald", nombre: "Emerald", descripcion: "Verde esmeralda sofisticado", muestra: "#34d399", variables: { "--background": "oklch(0.12 0.006 160)", "--foreground": "oklch(0.98 0.003 160)", "--card": "oklch(0.165 0.008 160)", "--popover": "oklch(0.17 0.008 160)", "--primary": "oklch(0.97 0.01 160)", "--primary-foreground": "oklch(0.12 0.006 160)", "--secondary": "oklch(0.215 0.008 160)", "--muted": "oklch(0.2 0.008 160)", "--muted-foreground": "oklch(0.65 0.015 160)", "--accent": "oklch(0.245 0.01 160)", "--border": "oklch(1 0 0 / 8%)", "--input": "oklch(1 0 0 / 12%)", "--ring": "oklch(0.72 0.16 155 / 40%)", "--signature": "oklch(0.75 0.15 155)", "--success": "oklch(0.72 0.16 155)" } },
  { id: "crimson", nombre: "Crimson", descripcion: "Rojo intenso pasional y audaz", muestra: "#ef4444", variables: { "--background": "oklch(0.13 0.008 25)", "--foreground": "oklch(0.98 0.003 25)", "--card": "oklch(0.17 0.01 25)", "--popover": "oklch(0.18 0.01 25)", "--primary": "oklch(0.97 0.01 25)", "--primary-foreground": "oklch(0.13 0.008 25)", "--secondary": "oklch(0.22 0.01 25)", "--muted": "oklch(0.2 0.01 25)", "--muted-foreground": "oklch(0.66 0.018 25)", "--accent": "oklch(0.25 0.012 25)", "--border": "oklch(1 0 0 / 8%)", "--input": "oklch(1 0 0 / 12%)", "--ring": "oklch(0.62 0.22 25 / 40%)", "--signature": "oklch(0.65 0.22 25)", "--success": "oklch(0.72 0.16 155)" } },
  { id: "royal", nombre: "Royal", descripcion: "Púrpura regio y elegante", muestra: "#a78bfa", variables: { "--background": "oklch(0.13 0.008 290)", "--foreground": "oklch(0.98 0.003 290)", "--card": "oklch(0.17 0.01 290)", "--popover": "oklch(0.18 0.01 290)", "--primary": "oklch(0.97 0.01 290)", "--primary-foreground": "oklch(0.13 0.008 290)", "--secondary": "oklch(0.22 0.01 290)", "--muted": "oklch(0.2 0.01 290)", "--muted-foreground": "oklch(0.66 0.018 290)", "--accent": "oklch(0.25 0.012 290)", "--border": "oklch(1 0 0 / 8%)", "--input": "oklch(1 0 0 / 12%)", "--ring": "oklch(0.6 0.2 290 / 40%)", "--signature": "oklch(0.68 0.18 290)", "--success": "oklch(0.72 0.16 155)" } },
  { id: "carbon", nombre: "Carbon", descripcion: "Grafito neutro industrial", muestra: "#94a3b8", variables: { "--background": "oklch(0.11 0.002 250)", "--foreground": "oklch(0.96 0.002 250)", "--card": "oklch(0.155 0.003 250)", "--popover": "oklch(0.165 0.003 250)", "--primary": "oklch(0.96 0.002 250)", "--primary-foreground": "oklch(0.11 0.002 250)", "--secondary": "oklch(0.205 0.003 250)", "--muted": "oklch(0.19 0.003 250)", "--muted-foreground": "oklch(0.6 0.005 250)", "--accent": "oklch(0.235 0.004 250)", "--border": "oklch(1 0 0 / 7%)", "--input": "oklch(1 0 0 / 11%)", "--ring": "oklch(0.96 0 0 / 30%)", "--signature": "oklch(0.7 0.015 250)", "--success": "oklch(0.72 0.16 155)" } },
];

const Tema = (function () {
  const KEY = "digital-marketplace-tema";

  function actual() {
    const raw = lsGet(KEY, null);
    const id = raw && raw.state && raw.state.temaActivo;
    return TEMAS.some((t) => t.id === id) ? id : "midnight";
  }

  function aplicar(id) {
    const tema = TEMAS.find((t) => t.id === id) || TEMAS[0];
    Object.keys(tema.variables).forEach((k) => {
      document.documentElement.style.setProperty(k, tema.variables[k]);
    });
  }

  return {
    actual,
    lista: TEMAS,
    aplicar,
    set(id) {
      if (!TEMAS.some((t) => t.id === id)) id = "midnight";
      lsSet(KEY, { state: { temaActivo: id }, version: 0 });
      aplicar(id);
    },
  };
})();

// ---------------------------------------------------------------------------
// Toasts (sustituyen a sonner)
// ---------------------------------------------------------------------------
function toast(titulo, descripcion) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.innerHTML =
    '<p class="toast-title">' + esc(titulo) + "</p>" +
    (descripcion ? '<p class="toast-desc">' + esc(descripcion) + "</p>" : "");
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add("closing");
    setTimeout(() => el.remove(), 260);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Constantes del dominio (equivalentes a types/vehicle.ts y data/orders.ts)
// ---------------------------------------------------------------------------
const CATEGORIAS = ["Sedán", "SUV", "Coupé", "Hatchback", "Convertible", "Pickup", "Deportivo", "Superdeportivo", "Familiar"];
const COMBUSTIBLES = ["Gasolina", "Híbrido", "Eléctrico", "Diésel"];
const TRACCIONES = ["AWD", "RWD", "FWD", "4WD"];

const ORDER_STATUS_LABELS = {
  PENDING: "Pendiente",
  PROCESSING: "En proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const ORDER_STATUS_BADGE = {
  COMPLETED: "bg-[var(--success)]/15 text-[var(--success)]",
  PROCESSING: "bg-[var(--signature)]/15 text-[var(--signature)]",
  PENDING: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
};
