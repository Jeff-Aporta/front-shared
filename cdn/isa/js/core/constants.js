/** Paleta y endpoints compartidos — Jeff-Aporta ISA fronts. */
export const DODGER = "#1e90ff";

/**
 * Orquestador central de APIs (Cloudflare Worker main-orchestrator).
 * ÚNICO lugar donde se define la URL de producción/local para todos los fronts.
 */
export const MAIN_ORCHESTRATOR_URL_PROD = "https://main-orchestrator.jeffaporta.workers.dev";
export const MAIN_ORCHESTRATOR_URL_LOCAL = "http://localhost:8780";
/** Panel admin (repo privado GH Pages). */
export const MAIN_ORCHESTRATOR_PAGES_URL = "https://jeff-aporta.github.io/main-orchestrator-front/";
export const MAIN_ORCHESTRATOR_LS_KEY = "jeff:gateway-local";
export const MAIN_ORCHESTRATOR_EVENT = "jeff:gateway-target";

/** @deprecated Usar MAIN_ORCHESTRATOR_* — alias temporal */
export const GATEWAY_URL_PROD = MAIN_ORCHESTRATOR_URL_PROD;
/** @deprecated */
export const GATEWAY_URL_LOCAL = MAIN_ORCHESTRATOR_URL_LOCAL;
/** @deprecated */
export const GATEWAY_LS_KEY = MAIN_ORCHESTRATOR_LS_KEY;
/** @deprecated */
export const GATEWAY_EVENT = MAIN_ORCHESTRATOR_EVENT;

export const AUTH_DEFAULTS = {
  sessionKey: "system-login:session",
  authEvent: "system-login:auth",
  authLocalKey: MAIN_ORCHESTRATOR_LS_KEY,
  authLocal: MAIN_ORCHESTRATOR_URL_LOCAL,
  authOnline: MAIN_ORCHESTRATOR_URL_PROD,
  loginUrl: "https://jeff-aporta.github.io/system-login-front/",
};

/** jsDelivr — rama main = última versión publicada (repo front-shared). */
export const CDN_BASE = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/isa";
export const UI_CDN_BASE = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/ui";
