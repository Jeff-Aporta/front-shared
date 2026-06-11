# front-shared

Recursos compartidos para micro-frontends Jeff-Aporta (GH Pages + Babel + MUI 9).

**Estructura detallada:** [`docs/STRUCTURE.md`](docs/STRUCTURE.md)

## Resumen

| Ruta | Rol |
|------|-----|
| `cdn/stack.mjs`, `boot-helper.mjs` | Arranque: React ESM único + pipeline loader |
| `cdn/isa/` | Runtime JS: `ISAFront.registerApp`, tema, auth, widgets, login |
| `cdn/ui/` | **TSX compartidos** (layouts/componentes) vía CDN + Babel |
| `docs/` | Stack, MUI llms, CORS, deploy |
| `worker-swagger/` | OpenAPI Workers (no CDN) |
| `scripts/` | Ops (Neon, etc.) |

## TSX compartido (homogeneidad)

Tras `registerApp`, el loader transpila automáticamente los archivos en `cdn/ui/` (ver `SHARED_UI_FILES` en `boot-helper.mjs`).

Uso en una app:

```javascript
const Shell = window.ISAFront.Layout.AppShell;
React.createElement(Shell, {
  ns: "IAT",
  title: "Herramientas de IA",
  icon: "mdi:robot-outline",
  loginGate: true,
}, /* contenido */);
```

Añadir un TSX nuevo: crear bajo `cdn/ui/` y registrar la ruta en `SHARED_UI_FILES`.

## jsDelivr

```
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/css/base.css
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/js/index.js
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/ui/layouts/AppShell.tsx
```

Local: `../../front-shared/cdn/…` desde `apps/<app>/frontend/`.

## MUI llms

```bash
cd apps/front-shared && npm run refresh:mui-llms
```
