/**
 * Arranque compartido — usado desde loader.ts (Paty ISA) vía import() dinámico.
 * Todo el CDN desde jsDelivr (repo público Jeff-Aporta/front-shared).
 */

const CDN = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn";

export function sharedCdnBase() {
  return CDN;
}

export async function importShared(subpath) {
  return import(CDN + "/" + subpath);
}

export function showBootError(msg) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<pre style="color:#ff8a80;padding:24px;font-family:monospace">' + msg + "</pre>";
  }
}

export function assertStack() {
  const { React, ReactDOM, MaterialUI } = globalThis;
  if (!React?.createElement) throw new Error("React no disponible — ejecutar stack.mjs antes");
  if (!ReactDOM?.createRoot) throw new Error("ReactDOM.createRoot no disponible");
  if (!MaterialUI?.createTheme) throw new Error("MaterialUI no disponible (stack.mjs)");
}

export async function loadIsaFront() {
  await import(CDN + "/isa/js/index.js");
}

function babelPresets(url) {
  const reactClassic = ["react", { runtime: "classic" }];
  if (url.endsWith(".jsx")) return [reactClassic];
  if (url.endsWith(".tsx")) return ["typescript", reactClassic];
  return ["typescript"];
}

export async function transpileUrl(url, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + url + " (" + res.status + ")");
  const src = await res.text();
  const presets = babelPresets(url);
  const code = Babel.transform(src, { presets, filename: url }).code;
  // eslint-disable-next-line no-eval
  eval(code);
}

/** JSX compartidos — transpilados en runtime (mismo Babel que la app). */
export const SHARED_UI_FILES = ["layouts/AppShell.jsx"];

export async function loadSharedUi(Babel) {
  const base = CDN + "/ui";
  for (const file of SHARED_UI_FILES) {
    await transpileUrl(base + "/" + file, Babel);
  }
}

export async function transpileFiles(files, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  for (const file of files) {
    const res = await fetch(file, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar " + file + " (" + res.status + ")");
    const src = await res.text();
    const presets = babelPresets(file);
    const code = Babel.transform(src, { presets, filename: file }).code;
    // eslint-disable-next-line no-eval
    eval(code);
  }
}

/** @param {{ files: string[], afterLoad?: () => void, Babel: unknown }} opts */
export async function bootApp({ files, afterLoad, Babel }) {
  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await loadIsaFront();
  await loadSharedUi(Babel);
  await transpileFiles(files, Babel);
  if (afterLoad) afterLoad();
}
