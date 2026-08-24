# Luxicar

Luxicar is a Spanish-language digital marketplace demo for high-end vehicles.
It is a static, client-side application with a curated vehicle catalog, account
and authentication views, dashboards, and multiple visual themes.

## Account balance (saldo)

Each account has an internal store balance (saldo) that can be used as a
payment method at checkout alongside the simulated card payment:

- `/recargar` — top up the balance with preset or custom amounts (simulated)
- Checkout — choose "Saldo LUXICAR" or "Tarjeta" at the payment step; paying
  with balance requires sufficient funds, otherwise the missing amount is
  shown with a link to recharge
- The balance and recent movements are visible on `/recargar`, in the account
  menu, in the mobile navigation sheet, in the cart summary, and on `/perfil`

Balances and movements are stored per account in `localStorage`
(`luxicar-balances`).

## Run locally

Serve the project root with SPA fallback enabled, then open the displayed local
URL in a browser:

```bash
npx serve -s
```

The `-s` flag serves `index.html` for unmatched routes, allowing direct visits
to client-side URLs such as `/vehiculos/...`.

## Project structure

- `index.html` — application entry point
- `css/` — base and application styles
- `js/` — application views, components, state, and local demo data
- `assets/` — fonts, branding, icons, and vehicle images

## Notes

All catalog data is local demo data. Playwright MCP artifacts are intentionally
ignored and are not part of the project.
