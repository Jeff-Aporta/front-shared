/**
 * Resuelve front-shared local (monorepo dev) o jsDelivr (prod).
 */
import { FRONT_SHARED_REF } from "./front-shared-ref.mjs";

export { FRONT_SHARED_REF };

export function isDevHost() {
  return typeof location !== "undefined" && /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);
}

export function cdnAsset(subpath) {
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/" + subpath;
}

async function importFirst(urls, label) {
  let lastErr;
  const seen = new Set();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      return await import(url);
    } catch (e) {
      lastErr = e;
      console.warn(label + " falló:", url, e);
    }
  }
  throw lastErr || new Error(label + " no disponible");
}

function localSharedUrls(file) {
  const urls = [];
  if (!isDevHost()) return urls;
  try {
    urls.push(new URL("./" + file, import.meta.url).href);
  } catch (_) { /* ignore */ }
  const fsLocal = globalThis.__FS_LOCAL__;
  if (typeof fsLocal === "string" && fsLocal) {
    try {
      urls.push(new URL(file, new URL(fsLocal, location.href)).href);
    } catch (_) { /* ignore */ }
  }
  return urls;
}

/** @param {string} [localFsRel] ruta relativa desde el loader → …/front-shared/cdn */
export async function importBootHelper(localFsRel) {
  const cdn = cdnAsset("boot-helper.mjs?v=" + FRONT_SHARED_REF);
  const urls = [...localSharedUrls("boot-helper.mjs")];
  if (isDevHost() && localFsRel) {
    try {
      urls.push(new URL("boot-helper.mjs", new URL(localFsRel, import.meta.url)).href);
    } catch (_) { /* ignore */ }
  }
  urls.push(cdn);
  return importFirst(urls, "boot-helper");
}

/** @param {string} [localFsRel] */
export async function importBootLoader(localFsRel) {
  const cdn = cdnAsset("boot-loader.mjs?v=" + FRONT_SHARED_REF);
  const urls = [...localSharedUrls("boot-loader.mjs")];
  if (isDevHost() && localFsRel) {
    try {
      urls.push(new URL("boot-loader.mjs", new URL(localFsRel, import.meta.url)).href);
    } catch (_) { /* ignore */ }
  }
  urls.push(cdn);
  return importFirst(urls, "boot-loader");
}
