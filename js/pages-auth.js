// ============================================================================
// pages-auth.js — Login, registro, perfil, pedidos, admin, legales, 404.
// ============================================================================
"use strict";

// ---------------------------------------------------------------------------
// Autenticación (split-screen compartido por login / registro / admin login)
// ---------------------------------------------------------------------------
function authSplitHtml(opts) {
  const v = DB.vehiculo(opts.heroId) || DB.vehiculos()[0];
  return (
    '<div class="flex min-h-screen bg-background">' +
    // Columna izquierda (solo escritorio)
    '<div class="relative hidden lg:flex lg:w-1/2">' +
    '<div class="absolute inset-0">' +
    smartImg(v.imagenes[0], opts.heroAlt, { priority: true }) +
    '<div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30"></div>' +
    '<div class="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent"></div>' +
    "</div>" +
    '<div class="relative z-10 flex flex-col justify-end p-12 xl:p-16">' +
    '<div class="anim-in" style="--dur:0.8s;--from-y:20px">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">' + esc(opts.eyebrow) + "</p>" +
    '<h1 class="text-display mt-5 text-4xl text-foreground xl:text-5xl">' + esc(opts.titulo) + "</h1>" +
    '<p class="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">' + esc(opts.sub) + "</p>" +
    "</div></div></div>" +
    // Columna derecha: formulario
    '<div class="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-12 lg:w-1/2">' +
    '<div class="anim-in w-full max-w-sm" style="--dur:0.6s">' +
    '<a href="/" data-nav class="group mb-10 flex items-center gap-2.5">' +
    '<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">' +
    icon("Gauge", "h-5 w-5", 2.2) + "</span>" +
    '<span class="flex flex-col">' +
    '<span class="text-base font-semibold tracking-tight text-foreground">Digital <span class="text-gradient">Marketplace</span></span>' +
    '<span class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">' + esc(opts.logoSub) + "</span>" +
    "</span></a>" +
    '<div class="mb-8">' +
    '<h2 class="text-display text-3xl text-foreground">' + esc(opts.formTitulo) + "</h2>" +
    '<p class="mt-2 text-sm text-muted-foreground">' + opts.formSub + "</p>" +
    "</div>" +
    opts.formHtml +
    '<a href="/" data-nav class="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("ArrowLeft", "h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5") +
    "Volver al marketplace</a>" +
    "</div></div></div>"
  );
}

function authInputHtml(opts) {
  return (
    "<div>" +
    '<label class="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground" for="' + opts.id + '">' + opts.label + "</label>" +
    '<div class="relative">' +
    icon(opts.icono, "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", 2) +
    '<input id="' + opts.id + '" type="' + opts.type + '" placeholder="' + esc(opts.placeholder) + '" autocomplete="' + opts.autocomplete + '" required class="h-12 w-full rounded-xl border border-border bg-card pl-10 ' + (opts.conToggle ? "pr-10" : "pr-4") + ' text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-ring/30">' +
    (opts.conToggle
      ? '<button type="button" data-action="toggle-password" data-target="' + opts.id + '" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Mostrar contraseña">' + icon("Eye", "h-4 w-4") + "</button>"
      : "") +
    "</div></div>"
  );
}

function authErrorHtml(error) {
  if (!error) return "";
  return (
    '<div class="flex items-center gap-2 rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">' +
    icon("AlertCircle", "h-4 w-4 shrink-0") + "<span>" + esc(error) + "</span></div>"
  );
}

function authSubmitHtml(texto, cargando, textoCargando, extra) {
  return (
    '<button type="submit" disabled class="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all ' + (extra || "") + ' hover:shadow-[0_8px_30px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">' +
    (cargando
      ? icon("Loader2", "h-4 w-4 animate-spin") + "<span>" + textoCargando + "</span>"
      : "<span>" + texto + "</span>" + icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5")) +
    "</button>"
  );
}

// Habilita el botón de envío solo cuando todos los campos tienen valor
// (igual que `disabled={cargando || !campo…}` en los formularios originales).
// `validadores` permite exigir formato por campo (email, longitud mínima…).
function authVigilarSubmit(formId, campoIds, validadores) {
  const form = document.getElementById(formId);
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');
  const revisar = () => {
    btn.disabled = campoIds.some((id) => {
      const valor = document.getElementById(id).value;
      const fn = validadores && validadores[id];
      return fn ? !fn(valor) : !valor.trim();
    });
  };
  campoIds.forEach((id) => document.getElementById(id).addEventListener("input", revisar));
  revisar();
}

// --- LOGIN -------------------------------------------------------------------
function pageLogin(params) {
  const redirect = params.get("redirect") || "/perfil";
  const registroHref = "/registro" + (redirect !== "/perfil" ? "?redirect=" + encodeURIComponent(redirect) : "");
  const formHtml =
    '<form id="login-form" class="space-y-5">' +
    authInputHtml({ id: "login-email", label: "Correo electrónico", icono: "Mail", type: "email", placeholder: "tu@ejemplo.com", autocomplete: "email" }) +
    authInputHtml({ id: "login-password", label: "Contraseña", icono: "Lock", type: "password", placeholder: "••••••••", autocomplete: "current-password", conToggle: true }) +
    '<div id="login-error"></div>' +
    authSubmitHtml("Iniciar sesión", false, "Verificando…") +
    '<p class="pt-2 text-center text-xs text-muted-foreground">Cuenta demo: <span class="font-medium text-foreground">carlos@demo.com</span> / demo1234</p>' +
    "</form>";

  return {
    title: "Iniciar sesión · Digital Marketplace",
    html: authSplitHtml({
      heroId: "lamborghini-revuelto",
      heroAlt: "Lamborghini Revuelto",
      eyebrow: "Tu cuenta LUXICAR",
      titulo: "Accede a tu garaje privado",
      sub: "Inicia sesión para conservar tus favoritos, pedidos y vehículos comprados en todos tus dispositivos.",
      logoSub: "Alta Gama",
      formTitulo: "Iniciar sesión",
      formSub: '¿Aún no tienes cuenta? <a href="' + registroHref + '" data-nav class="font-medium text-[var(--signature)] hover:underline">Regístrate</a>',
      formHtml,
    }),
    mount() {
      authVigilarSubmit("login-form", ["login-email", "login-password"]);
      const form = document.getElementById("login-form");
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const errBox = document.getElementById("login-error");
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = icon("Loader2", "h-4 w-4 animate-spin") + "<span>Verificando…</span>";
        setTimeout(() => {
          const res = Auth.login(email, password);
          if (!res.ok) {
            errBox.innerHTML = authErrorHtml(res.error || "Credenciales incorrectas");
            btn.disabled = false;
            btn.innerHTML = "<span>Iniciar sesión</span>" + icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5");
            return;
          }
          Auth.mergeGuestFavorites(Tienda.estado.favoritos);
          Auth.syncFavoritesFromAccount();
          Auth.syncGarageFromAccount();
          navigate(redirect);
        }, 500);
      });
    },
  };
}

// --- REGISTRO ------------------------------------------------------------------
function pageRegistro(params) {
  const redirect = params.get("redirect") || "/perfil";
  const loginHref = "/login" + (redirect !== "/perfil" ? "?redirect=" + encodeURIComponent(redirect) : "");
  const formHtml =
    '<form id="registro-form" class="space-y-5">' +
    authInputHtml({ id: "reg-nombre", label: "Nombre completo", icono: "User", type: "text", placeholder: "Juan Pérez", autocomplete: "name" }) +
    authInputHtml({ id: "reg-email", label: "Correo electrónico", icono: "Mail", type: "email", placeholder: "tu@ejemplo.com", autocomplete: "email" }) +
    authInputHtml({ id: "reg-password", label: "Contraseña", icono: "Lock", type: "password", placeholder: "Mínimo 6 caracteres", autocomplete: "new-password", conToggle: true }) +
    '<div id="reg-error"></div>' +
    authSubmitHtml("Crear cuenta", false, "Creando cuenta…") +
    "</form>";

  return {
    title: "Crear cuenta · Digital Marketplace",
    html: authSplitHtml({
      heroId: "ferrari-sf90-stradale",
      heroAlt: "Ferrari SF90 Stradale",
      eyebrow: "Únete a LUXICAR",
      titulo: "Crea tu cuenta premium",
      sub: "Conserva tus favoritos, historial de pedidos y garaje privado en todos tus dispositivos.",
      logoSub: "Alta Gama",
      formTitulo: "Crear cuenta",
      formSub: '¿Ya tienes cuenta? <a href="' + loginHref + '" data-nav class="font-medium text-[var(--signature)] hover:underline">Inicia sesión</a>',
      formHtml,
    }),
    mount() {
      authVigilarSubmit("registro-form", ["reg-nombre", "reg-email", "reg-password"], {
        "reg-nombre": (v) => v.trim().length >= 2,
        "reg-email": (v) => /^\S+@\S+\.\S+$/.test(v.trim()),
        "reg-password": (v) => v.length >= 6,
      });
      const form = document.getElementById("registro-form");
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("reg-nombre").value;
        const email = document.getElementById("reg-email").value;
        const password = document.getElementById("reg-password").value;
        const errBox = document.getElementById("reg-error");
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = icon("Loader2", "h-4 w-4 animate-spin") + "<span>Creando cuenta…</span>";
        setTimeout(() => {
          const res = Auth.register(nombre, email, password);
          if (!res.ok) {
            errBox.innerHTML = authErrorHtml(res.error || "No se pudo registrar");
            btn.disabled = false;
            btn.innerHTML = "<span>Crear cuenta</span>" + icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5");
            return;
          }
          Auth.mergeGuestFavorites(Tienda.estado.favoritos);
          Auth.syncFavoritesFromAccount();
          Auth.syncGarageFromAccount();
          navigate(redirect);
        }, 500);
      });
    },
  };
}

// --- ADMIN LOGIN -----------------------------------------------------------------
function pageAdminLogin() {
  const formHtml =
    '<form id="admin-login-form" class="space-y-5">' +
    authInputHtml({ id: "admin-email", label: "Correo electrónico", icono: "Mail", type: "email", placeholder: "admin@luxicar.com", autocomplete: "email" }) +
    authInputHtml({ id: "admin-password", label: "Contraseña", icono: "Lock", type: "password", placeholder: "••••••••", autocomplete: "current-password", conToggle: true }) +
    '<div id="admin-error"></div>' +
    authSubmitHtml("Iniciar sesión", false, "Verificando…", "hover:gap-3") +
    '<p class="pt-2 text-center text-xs text-muted-foreground">Admin demo: <span class="font-medium text-foreground">admin@luxicar.com</span> / admin123</p>' +
    "</form>";

  return {
    title: "Admin · Digital Marketplace",
    html: authSplitHtml({
      heroId: "lamborghini-revuelto",
      heroAlt: "Lamborghini Revuelto",
      eyebrow: "Panel administrativo",
      titulo: "Gestiona el rendimiento de tu concesionaria",
      sub: "Métricas en tiempo real, análisis de ventas y visión completa de tu marketplace de alta gama.",
      logoSub: "Admin",
      formTitulo: "Bienvenido de nuevo",
      formSub: "Inicia sesión para acceder al panel administrativo.",
      formHtml,
    }),
    mount() {
      authVigilarSubmit("admin-login-form", ["admin-email", "admin-password"]);
      const form = document.getElementById("admin-login-form");
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("admin-email").value;
        const password = document.getElementById("admin-password").value;
        const errBox = document.getElementById("admin-error");
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = icon("Loader2", "h-4 w-4 animate-spin") + "<span>Verificando…</span>";
        setTimeout(() => {
          const res = Auth.login(email, password);
          if (!res.ok) {
            errBox.innerHTML = authErrorHtml(res.error || "Credenciales incorrectas");
            btn.disabled = false;
            btn.innerHTML = "<span>Iniciar sesión</span>" + icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5");
            return;
          }
          navigate("/admin");
        }, 500);
      });
    },
  };
}

// ---------------------------------------------------------------------------
// PERFIL
// ---------------------------------------------------------------------------
function pagePerfil() {
  if (!Auth.isAuthenticated()) {
    return { redirect: "/login?redirect=/perfil" };
  }
  const user = Auth.user();
  const pedidos = DB.pedidosDe(user.email);
  const completados = pedidos.filter((p) => p.status === "COMPLETED");
  const comprados = new Set();
  completados.forEach((p) => p.items.forEach((it) => comprados.add(it.vehicleSlug)));
  const totalInvertido = completados.reduce((s, p) => s + p.total, 0);
  const inicial = (user.name || user.email).charAt(0).toUpperCase();

  const kpis = [
    ["Receipt", "Pedidos", String(pedidos.length)],
    ["Car", "Vehículos comprados", String(comprados.size)],
    ["Heart", "Favoritos", String(Tienda.estado.favoritos.length)],
    ["CalendarDays", "Total invertido", formatearPrecio(totalInvertido)],
  ];

  const kpisHtml = kpis.map((k, i) =>
    '<div class="card-in rounded-2xl border border-border/50 bg-card p-5 shadow-card" style="--delay:' + (0.05 + i * 0.05).toFixed(2) + 's">' +
    icon(k[0], "h-5 w-5 text-[var(--signature)]", 2) +
    '<p class="mt-3 text-2xl font-semibold tracking-tight text-foreground">' + k[2] + "</p>" +
    '<p class="mt-0.5 text-xs text-muted-foreground">' + k[1] + "</p>" +
    "</div>"
  ).join("");

  const recientes = pedidos.slice(0, 5);
  const pedidosHtml = recientes.length === 0
    ? '<div class="flex flex-col items-center py-10 text-center">' +
      icon("Package", "h-10 w-10 text-muted-foreground/40", 1.5) +
      '<p class="mt-4 text-sm text-muted-foreground">Aún no tienes pedidos.</p>' +
      '<a href="/marketplace" data-nav class="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Explorar marketplace ' +
      icon("ArrowRight", "h-4 w-4") + "</a></div>"
    : '<ul class="mt-5 divide-y divide-border/40">' +
      recientes.map((o) => {
        const nombres = o.items.map((it) => it.marca + " " + it.modelo).join(", ") || "—";
        return (
          '<li class="flex items-center justify-between py-4">' +
          "<div>" +
          '<p class="font-mono text-xs text-muted-foreground">' + esc(o.number) + "</p>" +
          '<p class="mt-0.5 truncate text-sm font-medium text-foreground">' + esc(nombres) + "</p>" +
          '<p class="mt-0.5 text-xs text-muted-foreground">' + formatearFecha(o.createdAt) + "</p>" +
          "</div>" +
          '<div class="ml-4 flex flex-col items-end gap-1">' +
          '<span class="text-sm font-semibold text-foreground">' + formatearPrecio(o.total) + "</span>" +
          '<span class="text-[10px] font-medium text-muted-foreground">' + (ORDER_STATUS_LABELS[o.status] || o.status) + "</span>" +
          "</div></li>"
        );
      }).join("") +
      "</ul>";

  const garajeItems = Array.from(comprados)
    .map((slug) => {
      const v = DB.vehiculo(slug);
      const pedido = completados.find((p) => p.items.some((it) => it.vehicleSlug === slug));
      return v ? { v, pedido } : null;
    })
    .filter(Boolean);

  const garajeHtml = garajeItems.length === 0
    ? ""
    : '<section class="anim-in mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.35s">' +
      '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Garaje</p>' +
      '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Vehículos adquiridos</p>' +
      '<div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">' +
      garajeItems.map((x) =>
        '<a href="/vehiculos/' + x.v.id + '" data-nav class="group overflow-hidden rounded-xl border border-border/50 transition-colors hover:border-border">' +
        '<div class="relative aspect-[16/9]">' +
        smartImg(x.v.imagenes[0], x.v.marca + " " + x.v.modelo, { hoverScale: 1.05 }) +
        "</div>" +
        '<div class="p-3">' +
        '<p class="text-[10px] uppercase tracking-wider text-muted-foreground">' + esc(x.v.marca) + "</p>" +
        '<p class="truncate text-sm font-semibold text-foreground">' + esc(x.v.modelo) + "</p>" +
        (x.pedido ? '<p class="mt-1 font-mono text-[10px] text-muted-foreground">' + esc(x.pedido.number) + "</p>" : "") +
        "</div></a>"
      ).join("") +
      "</div></section>";

  const html =
    '<div class="mx-auto max-w-5xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">' +
    '<div class="anim-in border-b border-border/40 pb-10" style="--dur:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Mi cuenta</p>' +
    '<div class="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">' +
    '<div class="flex items-center gap-4">' +
    '<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold uppercase text-primary-foreground shadow-lg">' + esc(inicial) + "</span>" +
    "<div>" +
    '<h1 class="text-display text-3xl text-foreground sm:text-4xl">' + esc(user.name || "Cliente") + "</h1>" +
    '<p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">' + icon("Mail", "h-3.5 w-3.5") + esc(user.email) + "</p>" +
    "</div></div>" +
    '<button data-action="logout-home" class="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("LogOut", "h-4 w-4") + "Cerrar sesión</button>" +
    "</div></div>" +
    '<div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">' + kpisHtml + "</div>" +
    '<div class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">' +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.25s">' +
    '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Cuenta</h2>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Información</p>' +
    '<dl class="mt-5 space-y-4">' +
    [["User", "Nombre", user.name || "—"], ["Mail", "Correo", user.email], ["CalendarDays", "Miembro desde", formatearFecha(user.createdAt)]].map((d) =>
      '<div class="flex items-start gap-3">' +
      icon(d[0], "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground") +
      "<div>" +
      '<dt class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">' + d[1] + "</dt>" +
      '<dd class="mt-0.5 truncate text-sm font-medium text-foreground">' + esc(d[2]) + "</dd>" +
      "</div></div>"
    ).join("") +
    "</dl></section>" +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:col-span-2 lg:p-7" style="--delay:0.3s">' +
    '<div class="flex items-center justify-between">' +
    "<div>" +
    '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Historial</h2>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Pedidos recientes</p>' +
    "</div>" +
    '<a href="/pedidos" data-nav class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Ver todos ' +
    icon("ArrowRight", "h-3.5 w-3.5") + "</a>" +
    "</div>" +
    pedidosHtml +
    "</section></div>" +
    garajeHtml +
    "</div>";

  return { title: "Mi perfil · Digital Marketplace", html: siteShell("/perfil", html) };
}

// ---------------------------------------------------------------------------
// PEDIDOS
// ---------------------------------------------------------------------------
function pagePedidos() {
  if (!Auth.isAuthenticated()) {
    return { redirect: "/login?redirect=/pedidos" };
  }
  const user = Auth.user();
  const pedidos = DB.pedidosDe(user.email);

  let contenido;
  if (pedidos.length === 0) {
    contenido =
      '<div class="flex flex-col items-center py-20 text-center">' +
      icon("Package", "h-12 w-12 text-muted-foreground/40", 1.5) +
      '<p class="mt-5 text-base font-medium text-foreground">Aún no tienes pedidos</p>' +
      '<p class="mt-1 text-sm text-muted-foreground">Cuando completes una compra aparecerá aquí.</p>' +
      '<a href="/marketplace" data-nav class="group mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Explorar marketplace ' +
      icon("ArrowRight", "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5") + "</a></div>";
  } else {
    contenido =
      '<ul class="mt-8 space-y-4">' +
      pedidos.map((o, i) => {
        const nombres = o.items.map((it) => it.marca + " " + it.modelo).join(", ");
        return (
          '<li class="card-in" style="--delay:' + (i * 0.05).toFixed(2) + 's">' +
          '<button data-action="pedido-detalle" data-number="' + esc(o.number) + '" class="flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 text-left shadow-card transition-colors hover:border-border">' +
          '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">' +
          icon("Receipt", "h-5 w-5") + "</span>" +
          '<span class="min-w-0 flex-1">' +
          '<span class="block font-mono text-sm font-medium text-foreground">' + esc(o.number) + "</span>" +
          '<span class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">' + icon("CalendarDays", "h-3 w-3") + formatearFecha(o.createdAt) + "</span>" +
          '<span class="mt-1 block truncate text-sm text-muted-foreground">' + esc(nombres) + "</span>" +
          "</span>" +
          '<span class="flex flex-col items-end gap-1">' +
          '<span class="text-base font-semibold text-foreground">' + formatearPrecio(o.total) + "</span>" +
          '<span class="rounded-lg px-2 py-0.5 text-[10px] font-medium ' + (ORDER_STATUS_BADGE[o.status] || "") + '">' + (ORDER_STATUS_LABELS[o.status] || o.status) + "</span>" +
          "</span>" +
          icon("ChevronRight", "h-5 w-5 shrink-0 text-muted-foreground") +
          "</button></li>"
        );
      }).join("") +
      "</ul>";
  }

  const html =
    '<div class="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">' +
    '<div class="anim-in border-b border-border/40 pb-10" style="--dur:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Historial</p>' +
    '<h1 class="text-display mt-5 text-4xl text-foreground sm:text-5xl">Mis pedidos</h1>' +
    "</div>" +
    contenido +
    '<a href="/perfil" data-nav class="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("ArrowLeft", "h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5") + "Volver a mi perfil</a>" +
    "</div>";

  return { title: "Mis pedidos · Digital Marketplace", html: siteShell("/pedidos", html) };
}

// Modal de detalle de pedido
function abrirPedidoModal(number) {
  const user = Auth.user();
  if (!user) return;
  const o = DB.pedidosDe(user.email).find((p) => p.number === number);
  if (!o) return;
  const root = document.getElementById("modal-root");
  document.body.classList.add("no-scroll");
  root.innerHTML =
    '<div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" data-action="pedido-cerrar">' +
    '<div class="modal-content relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" role="dialog" aria-modal="true" data-stop>' +
    '<button data-action="pedido-cerrar" class="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground" aria-label="Cerrar">' +
    icon("X", "h-5 w-5") + "</button>" +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Pedido</p>' +
    '<h2 class="mt-2 font-mono text-xl font-semibold text-foreground">' + esc(o.number) + "</h2>" +
    '<p class="mt-1 text-sm text-muted-foreground">' + formatearFecha(o.createdAt) + "</p>" +
    '<span class="mt-3 inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-medium ' + (ORDER_STATUS_BADGE[o.status] || "") + '">' + (ORDER_STATUS_LABELS[o.status] || o.status) + "</span>" +
    '<div class="mt-6 space-y-3">' +
    o.items.map((it) => {
      const v = DB.vehiculo(it.vehicleSlug);
      return (
        '<a href="/vehiculos/' + it.vehicleSlug + '" data-nav data-action="pedido-cerrar" class="group flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-colors hover:border-border">' +
        (v
          ? '<div class="h-14 w-20 shrink-0 overflow-hidden rounded-lg"><img src="' + imgUrl(v.imagenes[0]) + '" alt="' + esc(it.marca + " " + it.modelo) + '" class="h-full w-full object-cover" loading="lazy"></div>'
          : "") +
        '<div class="min-w-0 flex-1">' +
        '<p class="text-[10px] uppercase tracking-wider text-muted-foreground">' + esc(it.marca) + "</p>" +
        '<p class="truncate text-sm font-medium text-foreground">' + esc(it.modelo) + "</p>" +
        '<p class="mt-0.5 text-xs text-muted-foreground">Precio de compra: ' + formatearPrecio(it.priceAtPurchase) + "</p>" +
        "</div>" +
        icon("ArrowRight", "h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5") +
        "</a>"
      );
    }).join("") +
    "</div>" +
    '<div class="mt-6 flex items-center justify-between border-t border-border/60 pt-4">' +
    '<span class="text-sm font-medium text-muted-foreground">Total</span>' +
    '<span class="text-lg font-semibold text-foreground">' + formatearPrecio(o.total) + "</span>" +
    "</div></div></div>";
}

function cerrarPedidoModal() {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";
  document.body.classList.remove("no-scroll");
}

// ---------------------------------------------------------------------------
// ADMIN (dashboard)
// ---------------------------------------------------------------------------
function pageAdmin() {
  if (!Auth.isAuthenticated()) return { redirect: "/admin/login" };
  if (!Auth.isAdmin()) return { redirect: "/" };

  const datos = calcularDatosDashboard();
  const k = datos.kpis;

  const kpiCards = [
    ["DollarSign", "Ventas totales", formatearPrecio(k.ventasTotales), 18.5],
    ["Car", "Vehículos vendidos", formatearNumero(k.vehiculosVendidos), 12.3],
    ["Users", "Clientes", formatearNumero(k.clientes), 9.8],
    ["Receipt", "Ticket promedio", formatearPrecio(k.ticketPromedio), 4.2],
    ["TrendingUp", "Crecimiento anual", k.crecimientoAnual + "%", k.crecimientoAnual],
    ["Gauge", "Marcas disponibles", String(k.marcasDisponibles), 0],
    ["Target", "Tasa de conversión", k.tasaConversion.toFixed(1) + "%", 0.6],
    ["Clock", "Pedidos pendientes", String(k.pedidosPendientes), -3.1],
  ];

  const kpisHtml = kpiCards.map((c, i) => {
    const variacion = c[3];
    const esPositivo = variacion > 0;
    return (
      '<div class="card-in rounded-2xl border border-border/50 bg-card p-5 shadow-card transition-all duration-500 hover:border-border hover:shadow-card-hover lg:p-6" style="--delay:' + (0.1 + i * 0.06).toFixed(2) + 's">' +
      '<div class="flex items-start justify-between">' +
      '<span class="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">' + icon(c[0], "h-5 w-5", 1.8) + "</span>" +
      (variacion !== 0
        ? '<span class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ' +
          (esPositivo ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--destructive)]/15 text-[var(--destructive)]") + '">' +
          icon(esPositivo ? "TrendingUp" : "TrendingDown", "h-3 w-3") + Math.abs(variacion) + "%</span>"
        : "") +
      "</div>" +
      '<p class="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">' + c[1] + "</p>" +
      '<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">' + c[2] + "</p>" +
      "</div>"
    );
  }).join("");

  const pedidosRows = datos.pedidosRecientes.map((p, i) => {
    const badge =
      p.estado === "Completado" ? "bg-[var(--success)]/15 text-[var(--success)]"
      : p.estado === "En proceso" ? "bg-[var(--signature)]/15 text-[var(--signature)]"
      : p.estado === "Pendiente" ? "bg-secondary text-muted-foreground"
      : "bg-[var(--destructive)]/15 text-[var(--destructive)]";
    return (
      '<tr class="card-in border-b border-border/30 transition-colors hover:bg-secondary/30" style="--delay:' + (0.6 + i * 0.04).toFixed(2) + 's">' +
      '<td class="py-3 pr-4 font-mono text-xs text-muted-foreground">' + esc(p.id) + "</td>" +
      '<td class="py-3 pr-4 text-foreground">' + esc(p.cliente) + "</td>" +
      '<td class="py-3 pr-4 text-muted-foreground">' + esc(p.vehiculo) + "</td>" +
      '<td class="py-3 pr-4"><span class="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium ' + badge + '">' + esc(p.estado) + "</span></td>" +
      '<td class="py-3 text-right font-semibold text-foreground">' + formatearPrecio(p.valor) + "</td>" +
      "</tr>"
    );
  }).join("");

  const topRows = datos.topVehiculos.map((t, i) =>
    '<div class="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40">' +
    '<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">' + (i + 1) + "</span>" +
    '<div class="min-w-0 flex-1">' +
    '<p class="truncate text-sm font-medium text-foreground">' + esc(t.vehiculo) + "</p>" +
    '<p class="text-[11px] text-muted-foreground">' + esc(t.marca) + " · " + formatearNumero(t.ventas) + " unidades</p>" +
    "</div>" +
    '<p class="shrink-0 text-sm font-semibold text-foreground">' + formatearPrecio(t.ingresos) + "</p>" +
    "</div>"
  ).join("");

  const html =
    '<header class="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">' +
    '<div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">' +
    '<a href="/" data-nav class="group flex shrink-0 items-center gap-2.5" aria-label="Ir al inicio">' +
    '<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">' +
    icon("Gauge", "h-5 w-5", 2.2) + "</span>" +
    '<span class="hidden flex-col items-start leading-none sm:flex">' +
    '<span class="text-[15px] font-semibold tracking-tight text-foreground">Digital <span class="text-gradient">Marketplace</span></span>' +
    '<span class="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">' +
    icon("LayoutDashboard", "h-2.5 w-2.5") + " Admin Dashboard</span>" +
    "</span></a>" +
    '<div class="flex items-center gap-2">' +
    '<a href="/" data-nav class="hidden items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex">Ver marketplace ' +
    icon("ArrowUpRight", "h-3.5 w-3.5") + "</a>" +
    '<button data-action="logout-admin" class="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("LogOut", "h-4 w-4") + '<span class="hidden sm:inline">Cerrar sesión</span></button>' +
    "</div></div></header>" +
    '<main class="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">' +
    '<div class="anim-in mb-10" style="--dur:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Resumen ejecutivo</p>' +
    '<h1 class="text-display mt-4 text-4xl text-foreground sm:text-5xl">Panel administrativo</h1>' +
    '<p class="mt-3 max-w-2xl text-sm text-muted-foreground">Métricas y análisis de los últimos 36 meses de operación del marketplace.</p>' +
    "</div>" +
    '<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">' + kpisHtml + "</div>" +
    // Gráfico de ingresos (área)
    '<section class="anim-in mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:mt-10 lg:p-7" style="--delay:0.3s">' +
    '<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">' +
    "<div>" +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Tendencia de ingresos</p>' +
    '<p class="mt-2 text-xl font-semibold tracking-tight text-foreground">Últimos 36 meses</p>' +
    "</div></div>" +
    '<div id="chart-ingresos" class="chart-wrap"></div>' +
    "</section>" +
    '<div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">' +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.4s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Comparativa anual</p>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Ingresos por año</p>' +
    '<div id="chart-anual" class="chart-wrap mt-5"></div>' +
    "</section>" +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.45s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Ventas por marca</p>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Marcas más vendidas</p>' +
    '<div id="chart-marcas" class="chart-wrap mt-5"></div>' +
    "</section></div>" +
    '<div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">' +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.5s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Categorías</p>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Distribución</p>' +
    '<div id="chart-categorias" class="chart-wrap mt-5"></div>' +
    "</section>" +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:col-span-2 lg:p-7" style="--delay:0.55s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Actividad reciente</p>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Últimos pedidos</p>' +
    '<div class="mt-5 overflow-x-auto">' +
    '<table class="w-full text-sm">' +
    '<thead><tr class="border-b border-border/60 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">' +
    '<th class="pb-3 pr-4 font-medium">Pedido</th>' +
    '<th class="pb-3 pr-4 font-medium">Cliente</th>' +
    '<th class="pb-3 pr-4 font-medium">Vehículo</th>' +
    '<th class="pb-3 pr-4 font-medium">Estado</th>' +
    '<th class="pb-3 text-right font-medium">Valor</th>' +
    "</tr></thead>" +
    "<tbody>" + pedidosRows + "</tbody>" +
    "</table></div></section></div>" +
    '<div class="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">' +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.6s">' +
    '<div class="flex items-center gap-2">' +
    icon("Trophy", "h-4 w-4 text-[var(--signature)]") +
    '<h2 class="text-eyebrow text-[11px] text-[var(--signature)]">Top modelos</h2>' +
    "</div>" +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Vehículos más vendidos</p>' +
    '<div class="mt-5 space-y-2.5">' + topRows + "</div>" +
    "</section>" +
    '<section class="anim-in rounded-2xl border border-border/50 bg-card p-6 shadow-card lg:p-7" style="--delay:0.65s">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Volumen mensual</p>' +
    '<p class="mt-2 text-lg font-semibold tracking-tight text-foreground">Vehículos vendidos (12 meses)</p>' +
    '<div id="chart-volumen" class="chart-wrap mt-5"></div>' +
    "</section></div>" +
    '<div class="mt-12 flex items-center justify-between border-t border-border/40 pt-6 text-xs text-muted-foreground">' +
    "<p>Datos sintéticos generados para demostración.</p>" +
    '<a href="/" data-nav class="group inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground">Volver al marketplace ' +
    icon("ChevronRight", "h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5") + "</a>" +
    "</div></main>";

  return {
    title: "Panel administrativo · Digital Marketplace",
    html: '<div class="min-h-screen bg-background">' + html + "</div>",
    mount() {
      const años = [
        { label: "Año 1", ingresos: datos.meses.slice(0, 12).reduce((s, m) => s + m.ingresos, 0) },
        { label: "Año 2", ingresos: datos.meses.slice(12, 24).reduce((s, m) => s + m.ingresos, 0) },
        { label: "Año 3", ingresos: datos.meses.slice(24, 36).reduce((s, m) => s + m.ingresos, 0) },
      ];
      Charts.area(document.getElementById("chart-ingresos"), {
        data: datos.meses.map((m) => ({ label: m.mesLabel, value: m.ingresos })),
        height: 320,
        color: "var(--signature)",
        labelInterval: 3,
        yFormat: (v) => "$" + (v / 1000000).toFixed(1) + "M",
        tooltipFormat: (v) => formatearPrecio(v) + " · Ingresos",
      });
      Charts.barras(document.getElementById("chart-anual"), {
        data: años.map((a) => ({ label: a.label, value: a.ingresos })),
        height: 260,
        color: "var(--signature)",
        radius: 8,
        yFormat: (v) => "$" + (v / 1000000).toFixed(0) + "M",
        tooltipFormat: (v) => formatearPrecio(v) + " · Ingresos",
      });
      Charts.barrasH(document.getElementById("chart-marcas"), {
        data: datos.ventasPorMarca.slice(0, 6).map((m) => ({ label: m.marca, value: m.ventas })),
        height: 260,
        tooltipFormat: (v) => v + " vehículos · Ventas",
      });
      Charts.donut(document.getElementById("chart-categorias"), {
        data: datos.ventasPorCategoria.map((c) => ({ label: c.categoria, value: c.ventas })),
        height: 260,
        tooltipFormat: (v) => v + " vehículos",
      });
      Charts.barras(document.getElementById("chart-volumen"), {
        data: datos.meses.slice(-12).map((m) => ({ label: m.mesLabel, value: m.ventas })),
        height: 320,
        color: "var(--success)",
        radius: 6,
        yFormat: (v) => String(v),
        tooltipFormat: (v) => v + " vehículos · Ventas",
      });
    },
  };
}

// ---------------------------------------------------------------------------
// LEGALES
// ---------------------------------------------------------------------------
function legalShellHtml(titulo, intro, ultimaActualizacion, body) {
  return (
    '<article class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">' +
    '<a href="/" data-nav class="group mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">' +
    icon("ArrowLeft", "h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5") + "Volver al inicio</a>" +
    '<header class="mb-10">' +
    '<p class="text-eyebrow text-[11px] text-[var(--signature)]">Digital Marketplace · Legal</p>' +
    '<h1 class="text-display mt-4 text-4xl text-foreground sm:text-5xl">' + esc(titulo) + "</h1>" +
    '<p class="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">' + esc(intro) + "</p>" +
    '<p class="mt-4 text-xs text-muted-foreground">Última actualización: ' + esc(ultimaActualizacion) + "</p>" +
    "</header>" +
    '<div class="space-y-10 text-sm leading-relaxed text-muted-foreground sm:text-base">' + body + "</div>" +
    '<footer class="mt-16 border-t border-border/40 pt-8 text-xs text-muted-foreground">' +
    "<p>Digital Marketplace · Vehículos de Alta Gama</p>" +
    '<p class="mt-1">Experiencia de compra simulada.</p>' +
    "</footer></article>"
  );
}

function legalSection(titulo, body) {
  return (
    "<section>" +
    '<h2 class="text-xl font-semibold text-foreground">' + esc(titulo) + "</h2>" +
    body +
    "</section>"
  );
}

function pagePrivacidad() {
  const body =
    legalSection("1. Responsable del tratamiento",
      '<p class="mt-3">El responsable del tratamiento de tus datos personales es <strong class="text-foreground">Digital Marketplace</strong>. Al tratarse de una experiencia de compra simulada, los datos que facilitas se usan únicamente para el funcionamiento de la demo y no se comparten con terceros con fines comerciales.</p>') +
    legalSection("2. Datos que recopilamos",
      '<ul class="mt-3 list-disc space-y-2 pl-5">' +
      '<li><strong class="text-foreground">Cuenta:</strong> nombre, correo electrónico y contraseña (almacenada localmente en tu navegador en esta demo, nunca en un servidor) cuando creas una cuenta.</li>' +
      '<li><strong class="text-foreground">Pedidos:</strong> datos de contacto (nombre, email, teléfono) que facilitas durante el checkout para gestionar tus compras simuladas.</li>' +
      '<li><strong class="text-foreground">Preferencias:</strong> tus favoritos, comparaciones y garaje, guardados en tu navegador o en tu cuenta.</li>' +
      '<li><strong class="text-foreground">Analítica:</strong> métricas de uso anónimas y agregadas (páginas vistas, eventos) que se conservan únicamente en tu navegador. No vendemos ni compartimos datos personales con terceros con fines comerciales.</li>' +
      "</ul>") +
    legalSection("3. Finalidad del tratamiento",
      '<p class="mt-3">Tratamos tus datos para: gestionar tu cuenta y autenticarte, procesar y conservar tus pedidos, ofrecer la experiencia personalizada (favoritos, garaje) y mejorar el servicio mediante analítica anónima. La base legal es la ejecución de un contrato (tu cuenta y pedidos) y nuestro interés legítimo en mejorar el producto (analítica).</p>') +
    legalSection("4. Cookies",
      '<p class="mt-3">Usamos cookies técnicas esenciales para el funcionamiento del sitio (sesión y preferencias) y cookies de análisis anónimo. Puedes aceptar o rechazar el análisis desde el banner de cookies que aparece en tu primera visita. Tu elección se guarda en tu navegador.</p>') +
    legalSection("5. Conservación de los datos",
      '<p class="mt-3">Conservamos tus datos mientras mantengas la cuenta activa y el tiempo necesario para cumplir con obligaciones legales o fiscales. Puedes solicitar su eliminación en cualquier momento.</p>') +
    legalSection("6. Tus derechos",
      '<p class="mt-3">Como interesado tienes derecho a acceder, rectificar, suprimir, oponerte, limitar y portar tus datos personales, así como a retirar el consentimiento prestado. También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD).</p>') +
    legalSection("7. Seguridad",
      '<p class="mt-3">Aplicamos medidas técnicas y organizativas adecuadas: contraseñas con hash scrypt, sesiones firmadas, acceso restringido a datos y comunicación cifrada (HTTPS). Ningún método es absolutamente seguro, pero trabajamos para proteger tu información.</p>') +
    legalSection("8. Naturaleza simulada",
      '<p class="mt-3">Digital Marketplace es una experiencia de compra simulada: no se realizan cobros reales ni transacciones financieras. Los datos de pago no se almacenan ni se procesan; los datos de contacto se usan únicamente para simular y mostrar tus pedidos.</p>');

  return {
    title: "Política de Privacidad · Digital Marketplace",
    html: siteShell("/privacidad", legalShellHtml(
      "Política de Privacidad",
      "En Digital Marketplace respetamos tu privacidad. Esta política explica qué datos recopilamos, cómo los usamos y qué derechos tienes sobre ellos, en cumplimiento del Reglamento General de Protección de Datos (RGPD/UE 2016/679).",
      "1 de junio de 2026",
      body
    )),
  };
}

function pageTerminos() {
  const body =
    legalSection("1. Aceptación",
      '<p class="mt-3">El acceso a este sitio implica la aceptación de los presentes términos y la política de privacidad. Si no estás de acuerdo, te pedimos que no uses el sitio.</p>') +
    legalSection("2. Titular",
      '<p class="mt-3">El titular de este sitio es <strong class="text-foreground">Digital Marketplace</strong>, una experiencia de compra simulada.</p>') +
    legalSection("3. Naturaleza simulada",
      '<p class="mt-3">Digital Marketplace es una plataforma de demostración. Los vehículos mostrados, precios, existencias y compras son simulados: no se realizan transacciones reales, ni cobros, ni entregas. El checkout no procesa pagos ni almacena datos de tarjeta.</p>') +
    legalSection("4. Cuentas de usuario",
      '<p class="mt-3">Eres responsable de la veracidad de los datos facilitados al crear tu cuenta y de mantener la confidencialidad de tu contraseña. Nos reservamos el derecho a suspender cuentas que incumplan estos términos.</p>') +
    legalSection("5. Propiedad intelectual",
      '<p class="mt-3">El diseño, código, contenidos y marcas del sitio pertenecen a Digital Marketplace o a sus licenciantes. Las imágenes de los vehículos se incluyen con fines ilustrativos. Queda prohibida la reproducción no autorizada del contenido sin permiso.</p>') +
    legalSection("6. Uso aceptable",
      '<p class="mt-3">Te comprometes a no usar el sitio para fines ilícitos, a no intentar acceder a datos ajenos o alterar el funcionamiento del servicio, y a no automatizar el acceso de forma que degrade la experiencia de otros usuarios.</p>') +
    legalSection("7. Limitación de responsabilidad",
      '<p class="mt-3">Digital Marketplace no garantiza la disponibilidad continua del servicio ni la ausencia de errores. Dado el carácter simulado del sitio, no se realiza ningún cobro ni entrega, y no se asume responsabilidad por decisiones basadas en la información mostrada.</p>') +
    legalSection("8. Modificaciones",
      '<p class="mt-3">Podemos modificar estos términos en cualquier momento. La versión vigente es la publicada en esta página; la fecha de última actualización indica cuándo se revisaron por última vez.</p>') +
    legalSection("9. Legislación aplicable",
      '<p class="mt-3">Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid, con renuncia a cualquier otro fuero que pudiera corresponderles.</p>');

  return {
    title: "Términos y Condiciones · Digital Marketplace",
    html: siteShell("/terminos", legalShellHtml(
      "Términos y Condiciones",
      "Estos términos regulan el acceso y uso de Digital Marketplace. Al navegar o crear una cuenta aceptas quedar vinculado por ellos.",
      "1 de junio de 2026",
      body
    )),
  };
}

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
function pageNotFound() {
  const html =
    '<main class="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">' +
    '<div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-50" style="background: radial-gradient(50% 50% at 50% 30%, oklch(0.85 0.09 80 / 0.06), transparent 70%)"></div>' +
    '<div class="relative flex flex-col items-center">' +
    '<span class="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-muted-foreground shadow-card">' +
    icon("Compass", "h-9 w-9", 1.5) + "</span>" +
    '<p class="text-eyebrow mt-7 text-[11px] text-[var(--signature)]">Error 404</p>' +
    '<h1 class="text-display mt-4 text-5xl text-foreground sm:text-6xl">Página no encontrada</h1>' +
    '<p class="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">La página que buscas no existe o se ha movido. Vuelve al inicio o explora nuestra colección de vehículos de alta gama.</p>' +
    '<div class="mt-9 flex flex-col gap-3 sm:flex-row">' +
    '<a href="/" data-nav class="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:gap-3 hover:shadow-[0_8px_30px_-8px_oklch(0.98_0_0/0.35)] active:scale-[0.98]">Volver al inicio ' +
    icon("ArrowRight", "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1") + "</a>" +
    '<a href="/marketplace" data-nav class="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Explorar vehículos</a>' +
    "</div>" +
    '<p class="mt-10 text-xs text-muted-foreground">Digital Marketplace · Vehículos de Alta Gama</p>' +
    "</div></main>";

  return { title: "Página no encontrada · Digital Marketplace", html };
}
