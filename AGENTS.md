# LUXICAR — notas para agentes

Marketplace de vehículos de lujo en vanilla JS (sin framework). SPA con router History-API propio en `js/app.js`.

## Arquitectura

- `js/app.js`: router (`navigate`, `rerender`), mapa `ACTIONS` (delegación de eventos vía `data-action`), listeners delegados de click/input/change en `document`, subscripciones (`Auth.subscribe` → `rerender(true)` para el header; `Tienda.subscribe` → `sincronizarTiendaUI` para sync fino).
- `js/pages.js`, `js/pages-auth.js`, `js/pages-cuenta.js`: renderers de páginas (HTML strings).
- `js/components.js`: componentes compartidos + helpers de actualización en el sitio (`actualizarInsignias`, `actualizarSaldosUI`, `refrescarBotonFavCompare`, `actualizarStickyCta`).
- `js/store.js` (`Tienda`), `js/data.js` (`DB`, `Auth`, `Tema`), `js/admin-data.js`, `js/charts.js`, `js/icons.js`.

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
