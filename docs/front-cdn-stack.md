# Front CDN stack (Jeff-Aporta · sin build · GH Pages)

Patrón **Paty ISA** para el loader; **MUI 9 exige React ESM único** (no mezclar UMD + esm.sh).

## Versiones

| Paquete | Versión | Carga |
|---------|---------|--------|
| React | 18.3.1 | import map → `stack.mjs` |
| ReactDOM | 18.3.1 | import map → `stack.mjs` |
| @mui/material | **9.1.0** | import map → `stack.mjs` |
| @babel/standalone | 7.26.9 | unpkg (head) |

## Regla crítica

**No** poner `<script src=".../react...umd...">` en el head. MUI 9 importado vía esm.sh usa el React del import map; si además hay React UMD en `window`, `ThemeProvider` falla con `useMemo` null.

## `index.html`

1. `<base href>` dinámico.
2. Import map (react, react-dom, @mui/material, @emotion/*).
3. Babel + iconify (si aplica).
4. Body: `<script type="module" src="js/boot/loader.mjs"></script>`.

## `loader.ts`

1. `import()` de `boot-resolver.mjs` (monorepo local o jsDelivr).
2. `importBootHelper()` → `boot-helper.mjs` (assets compartidos **siempre jsDelivr**).
3. `bootApp` → **`stack.mjs`** → `cdn/isa` → `AppShell.jsx` → módulos `.ts/.jsx` de la app.
4. `App.jsx` llama `NS.mount()` al final.

## jsDelivr (assets compartidos)

`https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/…`

No resolver rutas `../../front-shared` para stack/isa/ui en runtime — solo el script `boot-helper.mjs` puede cargarse local en dev monorepo.
