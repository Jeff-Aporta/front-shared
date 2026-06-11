/** Factory API local/online (Cloudflare Workers). */
export function createApiConfig(opts) {
  const local = opts.local;
  const online = opts.online;
  const lsKey = opts.lsKey;
  const evt = opts.event || opts.evt || lsKey.replace(":local", ":target");

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
    } catch (e) {}
    window.dispatchEvent(new Event(evt));
  }
  function base() {
    return (isLocal() ? local : online).replace(/\/$/, "");
  }
  function apiUrl(path) {
    return base() + (path.charAt(0) === "/" ? path : "/" + path);
  }
  function label() {
    return isLocal() ? "Pruebas locales" : "Producción";
  }

  return { isLocal, setLocal, base, apiUrl, label, EVENT: evt, ONLINE: online, LOCAL: local };
}

export function registerConfig(ns, opts) {
  window[ns] = window[ns] || {};
  window[ns].Config = createApiConfig(opts);
}
