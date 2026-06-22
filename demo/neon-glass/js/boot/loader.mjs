import { demoAppUrl } from "./cdn.mjs";

async function ensureIconify() {
  if (customElements.get("iconify-icon")) return;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="iconify"]');
    if (existing) {
      customElements.whenDefined("iconify-icon").then(resolve).catch(reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js";
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar iconify-icon"));
    document.head.appendChild(s);
  });
}

async function loadRuntimeGlobals() {
  const [reactMod, domMod, muiMod] = await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("@mui/material"),
  ]);
  globalThis.React = reactMod.default ?? reactMod;
  globalThis.ReactDOM = domMod;
  globalThis.MaterialUI = muiMod;
}

async function boot() {
  if (new URLSearchParams(location.search).has("isa_boot_hold")) return;
  await loadRuntimeGlobals();
  await ensureIconify();
  await import(demoAppUrl());
}

boot().catch((err) => {
  const root = document.getElementById("root");
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  if (root) {
    root.innerHTML = `<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n${msg}</pre>`;
  }
  console.error(err);
});
