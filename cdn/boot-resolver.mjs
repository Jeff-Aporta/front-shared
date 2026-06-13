/**
 * Punto de entrada del arranque compartido — siempre jsDelivr (Jeff-Aporta/front-shared).
 * stack, isa, ui y boot-helper se consumen solo desde CDN; nunca rutas locales ../../front-shared.
 */
/** Bump al publicar front-shared (evita caché stale de jsDelivr @main). */
export const FRONT_SHARED_REF = "9e576a1";

export const BOOT_HELPER_CDN =
  "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/boot-helper.mjs";

export const BOOT_RESOLVER_CDN =
  "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/boot-resolver.mjs";

/** @returns {Promise<import("./boot-helper.mjs")>} */
export async function importBootHelper() {
  return import(BOOT_HELPER_CDN);
}

/** URL del resolver (para loaders que importan este módulo). */
export function bootResolverUrl() {
  return BOOT_RESOLVER_CDN;
}
