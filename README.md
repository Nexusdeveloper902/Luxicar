# Luxicar

Luxicar is a Spanish-language digital marketplace demo for high-end vehicles.
It is a static, client-side application with a curated vehicle catalog, account
and authentication views, dashboards, and multiple visual themes.

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
