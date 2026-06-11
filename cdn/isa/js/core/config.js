/** Factory API local/online — URL desde constants.js (main-orchestrator). */
import {
  MAIN_ORCHESTRATOR_EVENT,
  MAIN_ORCHESTRATOR_LS_KEY,
  MAIN_ORCHESTRATOR_URL_LOCAL,
  MAIN_ORCHESTRATOR_URL_PROD,
} from "./constants.js";

export function createApiConfig(opts = {}) {
  const local = opts.local || MAIN_ORCHESTRATOR_URL_LOCAL;
  const online = opts.online || MAIN_ORCHESTRATOR_URL_PROD;
  const lsKey = opts.lsKey || MAIN_ORCHESTRATOR_LS_KEY;
  const evt = opts.event || opts.evt || MAIN_ORCHESTRATOR_EVENT;

  function isLocal() {
    try {
      return localStorage.getItem(lsKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function setLocal(on) {
    try {
      localStorage.setItem(lsKey, on ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
    window.dispatchEvent(new Event(evt));
  }

  function base() {
    return (isLocal() ? local : online).replace(/\/$/, "");
  }

  function apiUrl(path) {
    return base() + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function label() {
    return isLocal() ? "Orquestador local" : "Orquestador producción";
  }

  return { isLocal, setLocal, base, apiUrl, label, EVENT: evt, ONLINE: online, LOCAL: local, lsKey };
}

export function registerConfig(ns, opts) {
  window[ns] = window[ns] || {};
  window[ns].Config = createApiConfig(opts);
}
