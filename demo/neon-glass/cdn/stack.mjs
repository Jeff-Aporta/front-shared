/**
 * Una sola instancia React (ESM import map) + MUI 9 — obligatorio para hooks/ThemeProvider.
 * GH Pages: https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/stack.mjs
 *
 * No cargar React UMD en index.html (duplica React → useMemo null en MUI).
 */
const w = globalThis;

export const stackReady = (async () => {
  const [ReactMod, clientMod, MUIMod] = await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("@mui/material"),
  ]);
  const React = ReactMod.default ?? ReactMod;
  const createRoot = clientMod.createRoot ?? clientMod.default?.createRoot;
  if (!createRoot) throw new Error("react-dom/client: createRoot no disponible");

  w.React = React;
  w.ReactDOM = { createRoot };
  w.MaterialUI = MUIMod;
})();

w.__stackReady = stackReady;
