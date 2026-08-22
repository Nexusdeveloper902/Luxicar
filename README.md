# Luxicar

Luxicar is a Spanish-language digital marketplace demo for high-end vehicles.
It is a static, client-side application with a curated vehicle catalog, account
and authentication views, dashboards, and multiple visual themes.

## Run locally

Serve the project root with any static file server, then open the displayed
local URL in a browser. For example:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

## Project structure

- `index.html` — application entry point
- `css/` — base and application styles
- `js/` — application views, components, state, and local demo data
- `assets/` — fonts, branding, icons, and vehicle images

## Notes

All catalog data is local demo data. Playwright MCP artifacts are intentionally
ignored and are not part of the project.
