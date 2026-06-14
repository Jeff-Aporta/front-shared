/**
 * Toast embebido en Swagger UI (Workers / bridge Azure).
 * Fuente canónica — consumir vía npm `@jeff-aporta/front-shared/worker-swagger/swagger-toast`.
 */

export const SWAGGER_TOAST_ROOT_ID = "swagger-toast-root";

/** CSS para inyectar dentro del <style> del fragmento Swagger UI. */
export const SWAGGER_TOAST_CSS = `
  #swagger-toast-root {
    position: fixed; right: 16px; bottom: 16px; z-index: 10050;
    display: flex; flex-direction: column; gap: 8px; pointer-events: none;
    max-width: min(420px, 92vw);
  }
  .swagger-toast {
    padding: 12px 14px; border-radius: 8px; font-family: system-ui, sans-serif;
    font-size: 13px; line-height: 1.45; color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    opacity: 0; transform: translateY(8px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .swagger-toast.show { opacity: 1; transform: translateY(0); }
  .swagger-toast-error { background: #c62828; border-left: 4px solid #ff8a80; }
  .swagger-toast-success { background: #2e7d32; border-left: 4px solid #81c784; }
  .swagger-toast-info { background: #1565c0; border-left: 4px solid #64b5f6; }
  .swagger-toast-warning { background: #ef6c00; border-left: 4px solid #ffb74d; }
`.trim();

export const SWAGGER_TOAST_HTML =
  `<div id="${SWAGGER_TOAST_ROOT_ID}" aria-live="polite" aria-relevant="additions"></div>`;

/**
 * Funciones JS del panel auth (sin wrapper).
 * Usa ISAFront.Feedback.toast si está cargado; si no, DOM local sobre #swagger-toast-root.
 */
export const SWAGGER_TOAST_SCRIPT = `
  function bridgeIsaToast(type, message) {
    try {
      var fb = window.ISAFront && window.ISAFront.Feedback && window.ISAFront.Feedback.toast;
      if (!fb) return false;
      if (type === "error" && fb.error) { fb.error(message); return true; }
      if (type === "success" && fb.success) { fb.success(message); return true; }
      if (type === "warning" && fb.warning) { fb.warning(message); return true; }
      if (type === "info" && fb.info) { fb.info(message); return true; }
      if (fb.show) { fb.show({ message: message, severity: type }); return true; }
    } catch (e) { /* ignore */ }
    return false;
  }

  function showToast(type, message, timeoutMs) {
    if (!message) return;
    if (bridgeIsaToast(type, message)) return;
    var root = document.getElementById("${SWAGGER_TOAST_ROOT_ID}");
    if (!root) return;
    var item = document.createElement("div");
    item.className = "swagger-toast swagger-toast-" + (type || "info");
    item.textContent = message;
    root.appendChild(item);
    requestAnimationFrame(function () { item.classList.add("show"); });
    var ms = timeoutMs || (type === "error" ? 7000 : 4500);
    setTimeout(function () {
      item.classList.remove("show");
      setTimeout(function () { item.remove(); }, 280);
    }, ms);
  }

  function setStatus(msg, kind, opts) {
    opts = opts || {};
    var el = document.getElementById("swagger-auth-status");
    if (el) {
      el.textContent = msg || "";
      el.className = kind || "";
    }
    if (!msg || opts.noToast) return;
    if (kind === "err") showToast("error", msg);
    else if (kind === "ok") showToast("success", msg);
    else if (kind === "warn") showToast("warning", msg);
  }
`.trim();
