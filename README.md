# front-shared

Recursos compartidos para micro-frontends Jeff-Aporta (GH Pages + Babel + MUI 9).

## Arquitectura
![Diagrama de arquitectura](https://mermaid.ink/img/JSV7aW5pdDogeyJmbG93Y2hhcnQiOiB7ImN1cnZlIjogInN0ZXBBZnRlciIsICJodG1sTGFiZWxzIjogdHJ1ZSwgIm5vZGVTcGFjaW5nIjogNDQsICJyYW5rU3BhY2luZyI6IDUyLCAicGFkZGluZyI6IDE4fX19JSUKZmxvd2NoYXJ0IExSCiAgc3ViZ3JhcGggcGFnZXMgW0Zyb250cyBHSCBQYWdlc10KICAgIEYxW2phZ3VkZWxvZS1mcm9udF0KICAgIEYyW2lhdG9vbHMtZnJvbnRdCiAgICBGTlvigKZdCiAgZW5kCiAgc3ViZ3JhcGggY2RuIFtmcm9udC1zaGFyZWQganNEZWxpdnJdCiAgICBCT09UW2Jvb3QtaGVscGVyLm1qc10KICAgIElTQVtjZG4vaXNhL2pzXQogICAgVUlbY2RuL3VpIFRTWF0KICAgIENPTlNUW2NvbnN0YW50cy5qc10KICBlbmQKICBzdWJncmFwaCBvcmNoIFttYWluLW9yY2hlc3RyYXRvcl0KICAgIEFQSVsiL2FwaS8qIl0KICBlbmQKICBwYWdlcyAtLT58aW1wb3J0fCBCT09UCiAgQk9PVCAtLT4gSVNBICYgVUkKICBJU0EgLS0-IENPTlNUCiAgcGFnZXMgLS0-fFJFU1R8IEFQSQogIENPTlNUIC0tPnxNQUlOX09SQ0hFU1RSQVRPUl9VUkx8IHBhZ2Vz)

> **Fuente del diagrama:** [`docs/arquitectura.mmd`](docs/arquitectura.mmd) — editar el `.mmd`; regenerar imagen: `node scripts/mermaid-ink-url.mjs front-shared/docs/arquitectura.mmd` (desde `apps/`).

**Estructura detallada:** [`docs/STRUCTURE.md`](docs/STRUCTURE.md)

## Resumen

| Ruta | Rol |
|------|-----|
| `cdn/stack.mjs`, `boot-helper.mjs` | Arranque: React ESM único + pipeline loader |
| `cdn/isa/js/core/app-meta.js` | Metadatos HTML por front (title, OG, favicon vía Iconify API) |
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

## Metadatos por front (`JeffAppMeta`)

Cada `index.html` de micro-frontend puede declarar identidad propia (title, description, Open Graph, favicon):

```html
<script src="https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/js/core/app-meta.js"></script>
<script>
JeffAppMeta.apply({
  title: "Mi App — Jeff-Aporta",
  description: "…",
  icon: "mdi:robot-outline",
  themeColor: "#e65100",
  url: "https://jeff-aporta.github.io/mi-front/",
});
</script>
```

Favicon y miniatura OG usan temporalmente la [Iconify API](https://iconify.design/docs/api/icon.html) (`api.iconify.design`). Iconos alineados con `catalog.ts` del orquestador.

## Repositorio GitHub

[jsDelivr](https://www.jsdelivr.com/) sirve `@main` solo desde repos accesibles. Tras cambios en `cdn/`, hacer push a `main` (puede tardar 1–2 min en propagarse).

Los fronts **no duplican** `caesar`, `auth-api`, `session`, `stack` ni `AppShell`: todo se carga desde jsDelivr vía `boot-helper.mjs`.

**GitHub:** [Jeff-Aporta/front-shared](https://github.com/Jeff-Aporta/front-shared)

## Main Orchestrator (URL central)

Todos los micro-frontends ISA usan **una sola URL**, definida solo aquí:

| Modo | Constante | Valor |
|------|-----------|-------|
| Producción | `MAIN_ORCHESTRATOR_URL_PROD` | `https://main-orchestrator.jeffaporta.workers.dev` |
| Local | `MAIN_ORCHESTRATOR_URL_LOCAL` | `http://localhost:8780` |
| Panel hub (GH Pages) | `MAIN_ORCHESTRATOR_PAGES_URL` | `https://jeff-aporta.github.io/main-orchestrator-front/` |

Archivo: `cdn/isa/js/core/constants.js`

Los fronts **no** repiten la URL en `isa-setup.ts`; `registerApp()` aplica estos defaults.

Tras cambiar la URL: **push a front-shared** (jsDelivr) y redeploy del worker `main-orchestrator`.

## jsDelivr

```
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/css/base.css
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/js/index.js
https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/ui/layouts/AppShell.tsx
```

Local: solo desarrollo de `front-shared` en la misma máquina; en GH Pages todo es jsDelivr.

## MUI llms

```bash
cd apps/front-shared && npm run refresh:mui-llms
```
