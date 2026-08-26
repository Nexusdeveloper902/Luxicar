# LUXICAR — notas para agentes

Marketplace de vehículos de lujo en vanilla JS (sin framework). SPA con router History-API propio en `js/app.js`.

## Arquitectura

- `js/app.js`: router (`navigate`, `rerender`), mapa `ACTIONS` (delegación de eventos vía `data-action`), listeners delegados de click/input/change en `document`, subscripciones (`Auth.subscribe` → `rerender(true)` para el header; `Tienda.subscribe` → `sincronizarTiendaUI` para sync fino).
- `js/pages.js`, `js/pages-auth.js`, `js/pages-cuenta.js`: renderers de páginas (HTML strings).
- `js/components.js`: componentes compartidos + helpers de actualización en el sitio (`actualizarInsignias`, `actualizarSaldosUI`, `refrescarBotonFavCompare`, `actualizarStickyCta`).
- `js/store.js` (`Tienda`), `js/data.js` (`DB`, `Auth`, `Tema`), `js/admin-data.js`, `js/charts.js`, `js/icons.js`.
- `js/landing.js`: portada cinematográfica (escenas FX scroll-driven) + `js/vendor/anime.umd.min.js` (anime.js v4.5.0 UMD → `window.anime`).
- `css/landing.css`: estilos de las escenas; fallback estático activo por defecto (sin JS / reduced-motion / móvil <1024px).

## Regla de oro: no re-render global en interacciones

- NUNCA llamar `rerender()` desde una interacción (toggle, input, slider, chip). Usar los helpers de sync en el sitio o `actualizarSeccion()`/re-render de sección concreta.
- Los inputs con actualización en vivo usan listeners delegados (`data-*` attrs) y actualizan solo la zona afectada (grid, outputs, badges). El rAF scheduler de `app.js` coalesce sliders.
- Modal de checkout: `renderCheckoutModal()` solo al cambiar de paso; durante tecleo usar `actualizarCheckoutUI()` (errores, preview de tarjeta, disabled de botones) — re-render por tecla rompe foco/caret.
- Auth (login/logout/registro) sí re-renderiza todo vía `Auth.subscribe` — es intencional (cambia header + guards).

## Hooks de sync en el DOM

- `data-badge="favoritos|comparar|carrito|garaje"`, `data-saldo`, `data-sticky-cta`, `data-fav-btn`/`data-compare-btn` (+`data-slug`), `data-cart-btn` (+`data-slug`), `data-checkout-field`/`data-checkout-error`/`data-checkout-icon`, `data-cp="tarjeta|titular|venc"`.

## Verificación

- Sin suite de tests. `node --check js/*.js` para sintaxis; pruebas manuales en navegador contra el server estático (cualquier static server con fallback a index.html).
- Credenciales demo: usuario `carlos@demo.com` / `demo1234`; admin `admin@luxicar.com` / `admin123` (mismo store `Auth`; el login de admin sustituye la sesión de usuario).

## Landing cinematográfica (portada / home)

- Escenas FX: `#fx` (620vh de pista) → `.fx-sticky` (viewport pegado) con 4 escenas apiladas (INTRO/CIRCUITO/FICHA/MERCADO) y `#fx-vehicle` persistente. HUD lateral con capítulos, barra de progreso y %.
- Montaje: `pageHome().mount()` → `mountLanding()` → devuelve función de limpieza (`scope.revert()`); `app.js` la invoca al salir de ruta.
- Coreografía: `createTimeline({autoplay:false})` (duración ~15400ms) vinculado con `onScroll({sync:1, enter:'start start', leave:'end end'}).link(tl)`. `chores(self)` actualiza lo paramétrico (coche por `getPointAtLength`, gauges, contadores, nodos, HUD) en cada `onUpdate`.
- Fallback: sin clase `fx-cinematica` el CSS muestra la versión estática; la cinemática solo se activa en `createScope({mediaQueries:{cinematica:'(min-width:1024px)', reduced:'(prefers-reduced-motion: reduce)'}})` cuando no hay reduced-motion.
- Cuidado: NO llamar `obs.refresh()` sincrónicamente tras `link()` — onScroll resuelve su target en microtask; un refresh manual rompe `updateBounds`.
- Integración 3D activa: `js/landing-3d.js` (ES module, Three.js r170 vendored en `js/vendor/three/` vía importmap) registra `window.LUXICAR_3D.init({sticky, model, onReady, onError})` → monta `<canvas class="fx-canvas-3d">` dentro de `.fx-sticky` y, al cargar el GLB (`assets/models/car-concept/CarConcept.glb`, "Car Concept" de Eric Chadwick / Darmstadt Graphics Group, CC-BY-4.0), oculta la silueta SVG (`fx-vehicle-3d-activo`). Recibe poses de `chores` (`update({pose:{x,y,rotDeg,scale,parking,ruedasVel}|null, vis, carWPx})`); pose null = turntable en el intro. Sin WebGL/módulo → el silueta SVG sigue (fallback).
- Auditoría headless WebGL (Chromium 1440x900): lanzar SIN `--disable-gpu`, con `--no-sandbox --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader` y `DISPLAY=:99` (Xvfb); verificar `canvas.getContext('webgl2')` ≠ null. `canvas.toDataURL()` devuelve lienzo en blanco aunque renderice (sin `preserveDrawingBuffer`) — validar pixelación a partir del screenshot de página, no del canvas. Saltos directos de `scrollTo` pueden ser reseteados por la lógica de restauración de scroll del router; usar pasos progresivos (p. ej. 0 → 2900 → 4600).
