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

- Motor: three.js r184 vendereado localmente en `assets/3d/js/vendor/three/`. Bundle IIFE `luxicar3d.min.js` expone `window.Luxicar3D.mountViewer(container, glbUrl, {autoRotate, yaw})` (incluye GLTFLoader + DRACOLoader + MeshoptDecoder). Se carga en `index.html` con `<script>` clásico (sin import maps).
- Catálogo de modelos: `js/model3d.js` — `MODEL3D_STAGES` (stage → `{ glb, yaw }`; `yaw` orienta el FRENTE del coche al encuadre héroe del visor), `MODEL3D_MAP` (id de vehículo → stage; reusa el mismo stage para varios anuncios de la misma generación), `MODEL3D_FALLBACK` (aproximaciones documentadas), `modelo3dConfigDeVehiculo(id)` → `{url, yaw}` (usado por la página de detalle) y `modelo3dDeVehiculo(id)` → ruta (retro-compatibilidad).
- Modelos: `assets/3d/cars/*.glb` (88 stages, ~425 MB total; los >8 MB llevan compresión EXT_meshopt_compression que el bundle decodifica con MeshoptDecoder). TODO es local; cero descargas en runtime. Atribuciones por modelo en `assets/3d/CREDITS.md`.
- Auditoría de precisión (2026-08): cada anuncio se verificó contra su foto de ficha (metadatos GLB + auditoría visual por lotes). 44 stages se reemplazaron o reconstruyeron (cuerpo/generación erróneos, rips de juego, mallas blancas rotas, frankensteins, texturas destruidas por la optimización). Regla de oro al reemplazar: pipeline MÍNIMO `gltf-transform dedup in.glb tmp.glb && gltf-transform meshopt tmp.glb out.glb --level high` — preserva materiales y raíz de escena. El comando `optimize` (con flatten/join/prune) DESTRUYE texturas y estructura en varios modelos (p.ej. tahoe perdió 23 materiales texturizados) y la compresión WebP de texturas corrompe materiales: NO usarlos. Las aproximaciones restantes están documentadas en `MODEL3D_FALLBACK`.
- Página de detalle: `pageVehiculo()` en `js/pages.js` inserta `.lx3d-container` con `data-viewer` + `data-viewer-yaw` y lo monta en `mount()` vía `window.Luxicar3D.mountViewer`; `mount()` devuelve cleanup que llama `dispose()` (el router de app.js lo invoca al salir de ruta).
- El visor solo se monta al abrir un detalle (lazy): el marketplace/landing NO cargan GLBs. Landing usa solo fotos — no tocar.
- Presentación: iluminación de estudio de tres puntos (key con sombras PCF + fill + rim) + entorno IBL generado proceduralmente (túnel de luz PMREM), piso showroom con reflejo y sombra de contacto, ACESFilmic + exposición 1.12. Cámara orbital con amortiguación exponencial, inercia, dolly de entrada (~1.5 s), deriva sutil en reposo (5 s sin interacción) y límites de ángulo/zoom. UI overlay: tag, pista de uso, botones (giro/reset/zoom), progreso de carga — estilos `.lx3d-*` en el propio bundle.
- dispose() libera geometrías, materiales, texturas (mapas incluidos), entorno PMREM, listeners, observers y el contexto WebGL (forceContextLoss) — crítico porque la SPA reutiliza el documento al navegar.
- Regenerar bundle: `esbuild` desde `viewerbuild/viewer.js` (workspace fuera del repo) con alias `three` → three@0.184 y `import.meta.url` definido a literal válido (DRACOLoader construye URLs relativas en init). Ver `viewerbuild/build.sh`.
