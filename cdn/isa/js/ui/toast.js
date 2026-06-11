/** Toasts ligeros sin React — contenedor fijo en la esquina inferior derecha. */
const TOAST_EVENT = "isa:toast";

const COLORS = {
  info: { bg: "#1565c0", fg: "#fff" },
  success: { bg: "#2e7d32", fg: "#fff" },
  warning: { bg: "#ed6c02", fg: "#fff" },
  error: { bg: "#c62828", fg: "#fff" },
};

function ensureContainer() {
  let el = document.getElementById("isa-toast-root");
  if (el) return el;
  el = document.createElement("div");
  el.id = "isa-toast-root";
  el.setAttribute("aria-live", "polite");
  el.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:min(360px,calc(100vw - 32px));pointer-events:none;font-family:IBM Plex Sans,system-ui,sans-serif;";
  document.body.appendChild(el);
  return el;
}

/**
 * @param {{ message: string, severity?: keyof typeof COLORS, durationMs?: number }} opts
 */
export function showToast(opts) {
  const message = opts && opts.message ? String(opts.message) : "";
  if (!message) return;
  const severity = (opts && opts.severity) || "info";
  const durationMs = (opts && opts.durationMs) || 4500;
  const palette = COLORS[severity] || COLORS.info;

  const root = ensureContainer();
  const item = document.createElement("div");
  item.textContent = message;
  item.style.cssText =
    "pointer-events:auto;padding:10px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.25);font-size:14px;line-height:1.4;opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;background:" +
    palette.bg +
    ";color:" +
    palette.fg +
    ";";
  root.appendChild(item);
  requestAnimationFrame(() => {
    item.style.opacity = "1";
    item.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    setTimeout(() => item.remove(), 220);
  }, durationMs);

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, severity, durationMs } }));
}

export function registerToast(ns) {
  window[ns] = window[ns] || {};
  window[ns].Toast = { show: showToast };
}

export { TOAST_EVENT };
