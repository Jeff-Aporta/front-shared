# Estructura de `front-shared`

Repositorio único para **CDN (fronts estáticos GH Pages)** y utilidades de backend compartidas.

## Árbol recomendado (actual)

```
apps/components/front-shared/
├── cdn/
│   ├── stack.mjs              # React + MUI 9 (ESM único, import map)
│   ├── boot-helper.mjs        # bootApp: stack → isa → ui TSX → app
│   ├── base-href.js           # fragmento <head> (Live Server / GH Pages)
│   ├── importmap.html         # pins esm.sh
│   ├── versions.json
│   ├── isa/                   # Runtime ESM (.js, sin build) — lógica + widgets base
│   │   ├── css/
│   │   │   ├── base.css
│   │   │   └── kits/neon-glass/neon-glass.css  # un archivo por look & feel
│   │   └── js/
│   │       ├── index.js       # window.ISAFront
│   │       ├── core/          # boot, config, auth, http, caps, …
│   │       └── ui/kits/       # neon-glass, kit-assets (lazy CSS)
│   ├── _dist/                 # npm run build:cdn — minificado para jsDelivr prod
│   │   ├── manifest.json
│   │   └── isa/css|js/*.min.*
│   └── ui/                    # TSX compartido (Babel en runtime, homogeneidad visual)
│       └── layouts/
│           └── AppShell.jsx   # AppBar + tema + TargetSwitch + LoginGate
├── docs/                      # front-cdn-stack, cors, mui-llms, deploy
├── scripts/                   # Neon, ops
└── worker-swagger/            # OpenAPI compartido Workers (no es CDN)
```

## Dos capas de UI compartida

| Capa | Formato | Cuándo usar |
|------|---------|-------------|
| **`cdn/isa/js/`** | `.js` ESM nativo | Config, auth, tema, hooks, widgets primitivos (`Icon`, `TargetSwitch`). Carga con `import()`. |
| **`cdn/ui/`** | `.tsx` fuente | Layouts y componentes visuales compuestos. Babel los transpila en el navegador (igual que la app). |

No hace falta build step: en producción jsDelivr sirve los `.tsx`; `boot-helper` los `fetch` + `Babel.transform` + `eval`.

## Flujo de arranque (cada front)

```
index.html (import map + Babel)
    → loader.ts
        → boot-helper.bootApp
            1. stack.mjs
            2. isa/js/index.js  → ISAFront.registerApp en isa-setup.ts
            3. cdn/ui/**/*.tsx  → ISAFront.Layout.*
            4. js/app/*.tsx     → lógica de la app
            5. NS.mount()
```

## Homogeneidad

- **Estilos:** `isa/css/base.css` + tema dodgerblue (`Theme.useThemeMode`).
- **Shell:** `ISAFront.Layout.AppShell({ ns, navRows, toolbarExtra, children })` — `navRows[0]` (tier `primary`) en toolbar del AppBar; `navRows[1+]` (tier `secondary` por defecto) compactos (26px) bajo la barra vía AppShell + `base.css` + tema dodger; chip Local/Producción + body sin scroll global.
- **Login modal:** estándar único en `ui/kits/neon-glass/login/` (`login-button.js`, `login-surface.js`, `login-form-fields.js`, `login-gate.js`). **No duplicar** modales de login en apps — usar `UI.LoginButton` registrado vía `registerApp({ loginButton: … })`.
- **Kits visuales:** `ISAFront.Kits` + `ISAFront.activeKit`. Kit por defecto: **neon-glass** (`ui/kits/neon-glass/`) — `ISAFront.Glass`, `GlassCard`, `GlassPageSurface`, `useGlassColors`, etc. CSS en `css/kits/neon-glass/` (importados por `base.css`). Rutas legacy en `ui/login-*.js` y `ui/neon-glass/` reexportan el kit. Catálogo visual: [demo/neon-glass](https://jeff-aporta.github.io/front-shared/neon-glass/) (GH Pages del mismo repo).
- **Tabs:** `NavTabRow`, `ViewFrame` (tercer nivel dentro de vistas).
- **Auth / API local-prod:** `ISAFront.registerApp({ ns, api, … })` en `js/core/isa-setup.ts` (único archivo por app).

## Sincronizar tras cambios en front-shared

Cuando se modifica o pushea **`components/front-shared`**, propagar el pin y refs a **todos** los consumidores desde `apps/src/scripts`:

```bash
cd Personal/apps/src/scripts
npm run sync:front-shared-ref:git    # HEAD → versions.json + pins @commit en fronts
npm run sync:cdn-refs:git             # stack/base.css y assets CDN alineados
npm run sync:component-refs:git       # swagger, lightbox
```

Opcional por app: `npm run gen:front-dist -- --slug <app>` si el front usa `_dist`.

Skill Cursor: **`sync-front-shared`** (obligatorio tras push de front-shared o cambios en login/AppShell/base.css).

Ver también `push-personal` — el push de front-shared debe ir seguido de sync + commit de punteros en Apps-fullstack.

## Qué no va aquí

- Código de negocio de una sola app → `apps/<app>/frontend/js/`.
- Backend / Workers → `apps/<app>/backend/`.
- Monolito Azure legacy — retirado; ver `apps/src/docs/DEPRECATED-langlab-azure.md`.

## Próximos candidatos a `cdn/ui/`

- `layouts/PageWithSidebar.tsx` (jagudeloe).
- `components/ConfirmDialog.tsx`, `EmptyState.tsx`.
- Migrar shells duplicados en iatools, conversations, flsjeff a `AppShell`.

## Publicación

Un solo repo GitHub **`Jeff-Aporta/front-shared`**, rama `@main` en jsDelivr:

- **Producción (recomendado):** `…/cdn/_dist/isa/js/index.min.js` — `boot-helper` lo usa fuera de localhost.
- **Desarrollo / fuente:** `…/cdn/isa/js/index.js`
- `…/cdn/ui/layouts/AppShell.jsx`
- `…/cdn/stack.mjs`

Tras cambiar `cdn/isa/` o CSS de kits: `npm run build:cdn` y commit de `cdn/_dist/`.

### Look & feel (kits)

- Un CSS por kit: `cdn/isa/css/kits/<id>/<id>.css` (p. ej. `neon-glass/neon-glass.css`).
- El CSS del kit **no** va en `index.html`; `attachDefaultKit()` lo inyecta lazy (`ensureKitCss`).
- Chunk JS opcional: `cdn/_dist/isa/js/kits/<id>.min.js` vía `ISAFront.loadKitModule(id)`.

Local monorepo: `boot-resolver.mjs` + `boot-helper.mjs` desde `apps/components/front-shared/cdn/`; runtime ISA desde `cdn/_dist/` (minificado). Para depurar fuente: `window.__ISA_CDN_SRC__ = true` antes del boot (requiere grafo sin JSX en imports estáticos).
