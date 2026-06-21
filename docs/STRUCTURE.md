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
│   │   ├── css/base.css
│   │   └── js/
│   │       ├── index.js       # window.ISAFront
│   │       ├── core/          # config, auth, constants, register-app
│   │       └── ui/            # theme, widgets, login-gate
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
- **Login modal:** estándar único en `ui/login-button.js` + `ui/login-surface.js` (`isa-login-dialog`, `LoginHeaderBand`, `contapymeLoginTextFieldProps`, botones Cancelar/Entrar). **No duplicar** modales de login en apps — usar `UI.LoginButton` registrado vía `registerApp({ loginButton: … })`.
- **Tabs:** `NavTabRow`, `ViewFrame` (tercer nivel dentro de vistas).
- **Auth / API local-prod:** `ISAFront.registerApp({ ns, api, … })` en `js/core/isa-setup.ts` (único archivo por app).

## Sincronizar tras cambios en front-shared

Cuando se modifica o pushea **`components/front-shared`**, propagar el pin y refs a **todos** los consumidores desde `apps/src/scripts`:

```bash
cd Personal/apps/src/scripts
npm run sync:front-shared-ref:git    # HEAD → versions.json + pins @commit en fronts
npm run sync:cdn-refs:git             # stack/base.css y assets CDN alineados
npm run sync:component-refs:git       # swagger, lightbox, neon-glass
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

- `…/cdn/isa/js/index.js`
- `…/cdn/ui/layouts/AppShell.jsx`
- `…/cdn/stack.mjs`

Local monorepo: `boot-resolver.mjs` + `boot-helper.mjs` desde `apps/components/front-shared/cdn/`; assets (stack/isa/ui) vía jsDelivr.
