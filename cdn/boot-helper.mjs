/**
 * Arranque compartido — usado desde loader.ts (Paty ISA) vía import() dinámico.
 */

export function isaCdnBase() {
  const { hostname } = globalThis.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return new URL("../../front-shared/cdn/isa", document.baseURI).href.replace(/\/$/, "");
  }
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa";
}

export async function importShared(subpath) {
  const cdn = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/" + subpath;
  const { hostname } = globalThis.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const local = new URL("../../front-shared/cdn/" + subpath, document.baseURI).href;
    try {
      return await import(local);
    } catch (_) {
      /* fallback jsDelivr */
    }
  }
  return import(cdn);
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
  const cdn = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa/js/index.js";
  const { hostname } = globalThis.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const local = new URL("../../front-shared/cdn/isa/js/index.js", document.baseURI).href;
    try {
      await import(local);
      return;
    } catch (_) {
      /* jsDelivr */
    }
  }
  await import(cdn);
}

export function sharedUiBase() {
  const { hostname } = globalThis.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return new URL("../../front-shared/cdn/ui", document.baseURI).href.replace(/\/$/, "");
  }
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/ui";
}

/** TSX compartidos — transpilados en runtime (mismo Babel que la app). */
export const SHARED_UI_FILES = ["layouts/AppShell.tsx"];

export async function transpileUrl(url, Babel) {
  if (!Babel?.transform) throw new Error("Babel standalone no cargó");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + url + " (" + res.status + ")");
  const src = await res.text();
  const presets = url.endsWith(".tsx") ? ["typescript", "react"] : ["typescript"];
  const code = Babel.transform(src, { presets, filename: url }).code;
  // eslint-disable-next-line no-eval
  eval(code);
}

export async function loadSharedUi(Babel) {
  const base = sharedUiBase();
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
    const presets = file.endsWith(".tsx") ? ["typescript", "react"] : ["typescript"];
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
