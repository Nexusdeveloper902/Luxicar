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

- Escenas FX: `#fx` (620vh de pista) → `.fx-sticky` (viewport pegado) con 4 escenas apiladas (INTRO/CIRCUITO/FICHA/MERCADO). HUD lateral con capítulos, barra de progreso y %.
- Montaje: `pageHome().mount()` → `mountLanding()` → devuelve función de limpieza (`scope.revert()`); `app.js` la invoca al salir de ruta.
- Coreografía: `createTimeline({autoplay:false})` (duración ~15400ms) vinculado con `onScroll({sync:1, enter:'start start', leave:'end end'}).link(tl)`. `chores(self)` actualiza lo paramétrico (chispa por `getPointAtLength`, gauges, contadores, nodos, HUD) en cada `onUpdate`.
- Fallback: sin clase `fx-cinematica` el CSS muestra la versión estática; la cinemática solo se activa en `createScope({mediaQueries:{cinematica:'(min-width:1024px)', reduced:'(prefers-reduced-motion: reduce)'}})` cuando no hay reduced-motion.
- Cuidado: NO llamar `obs.refresh()` sincrónicamente tras `link()` — onScroll resuelve su target en microtask; un refresh manual rompe `updateBounds`.
- Ya no hay vehículo persistente: la silueta SVG blueprint se retiró por decisión de diseño. En CIRCUITO una chispa (`.fx-punta`) corona la punta del trazo que se dibuja (`placePunta(fDib)`); en FICHA el hueco del coche es ahora una foto real del modelo (`.fx-spec-foto`, reveal por `clip-path` en el timeline + deriva Ken Burns paramétrica en `chores`).


## Visor 3D de vehículos (three.js local)

- Motor: three.js vendereado localmente en `assets/3d/js/vendor/three/`. Bundle IIFE `luxicar3d.min.js` expone `window.Luxicar3D.mountViewer(container, glbUrl, {autoRotate})` (incluye GLTFLoader + DRACOLoader + MeshoptDecoder). Se carga en `index.html` con `<script>` clásico (sin import maps).
- Catálogo de modelos: `js/model3d.js` — `MODEL3D_STAGES` (stage → ruta GLB local), `MODEL3D_MAP` (id de vehículo → stage; reusa el mismo stage para varios anuncios del mismo modelo base), `MODEL3D_FALLBACK` (descripción de fallbacks/equivalencias), y `modelo3dDeVehiculo(id)` → ruta GLB o "".
- Modelos: `assets/3d/cars/*.glb` (46 stages, ~363 MB total). TODO es local; cero descargas en runtime.
- Página de detalle: `pageVehiculo()` en `js/pages.js` inserta `.lx3d-container` con `data-viewer` y lo monta en `mount()` vía `window.Luxicar3D.mountViewer`; `mount()` devuelve cleanup que llama `dispose()` (el router de app.js lo invoca al salir de ruta).
- El visor solo se monta al abrir un detalle (lazy): el marketplace/landing NO cargan GLBs. Landing usa solo fotos — no tocar.
- Interacción: arrastre (giro), rueda/pinch (zoom), idle rotation opcional, encuadre automático por bounding box. Overlay de carga y estado de error vía CSS `.lx3d-*` en `css/app.css`.
- Regenerar bundle: `esbuild` desde `/tmp/viewerbuild/viewer.js`; `import.meta.url` se define a literal (DRACO resuelve rutas no usadas en init).
