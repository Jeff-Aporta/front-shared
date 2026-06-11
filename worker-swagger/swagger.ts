/**
 * Fuente canónica — copiar a {backend}/src/lib/swagger.ts
 * Swagger UI + OpenAPI JSON en /ui y /doc, con panel de JWT de prueba (system-login).
 */
import { swaggerUI } from "@hono/swagger-ui";
import type { Env, Hono } from "hono";

export type OpenApiSpec = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, unknown>;
  components?: Record<string, unknown>;
};

export const SYSTEM_LOGIN_URL_PROD = "https://system-login.jeffaporta.workers.dev";
export const SYSTEM_LOGIN_URL_LOCAL = "http://localhost:8781";

export type MountSwaggerOpts = {
  docPath?: string;
  uiPath?: string;
  /**
   * Base URL para el panel JWT. Por defecto "" = mismo origen (requiere mountAuthProxy).
   * Pasa SYSTEM_LOGIN_URL_PROD solo si no usas proxy.
   */
  authLoginUrl?: string;
  title?: string;
};

export function mountSwagger<E extends Env = Env>(
  app: Hono<E>,
  spec: OpenApiSpec,
  opts: MountSwaggerOpts = {},
) {
  const docPath = opts.docPath ?? "/doc";
  const uiPath = opts.uiPath ?? "/ui";
  const authLoginUrl = opts.authLoginUrl ?? "";
  const title = opts.title ?? spec.info.title + " — Swagger";

  app.get(docPath, (c) => c.json(spec));
  app.get(
    uiPath,
    swaggerUI({
      url: docPath,
      persistAuthorization: true,
      title,
      manuallySwaggerUIHtml: (asset) => buildSwaggerUiFragment(asset, docPath, authLoginUrl),
    }),
  );
}

export const jsonResponse = (description: string, schema: Record<string, unknown> = { type: "object" }) => ({
  description,
  content: { "application/json": { schema } },
});

export const bearerSecurity = [{ Bearer: [] as string[] }];

export function bearerComponents() {
  return {
    securitySchemes: {
      Bearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT de system-login. Usa el panel «JWT de prueba» arriba (POST /auth/test-token, 1 h) o Authorize con un token propio.",
      },
    },
  };
}

const authCredBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: {
            type: "string",
            description: "Contraseña con transporte César (el panel Swagger la codifica automáticamente).",
          },
        },
      },
    },
  },
};

/** Rutas Auth documentadas en cada Worker (proxy → system-login, salvo system-login nativo). */
export function authOpenApiPaths(opts: { proxied?: boolean } = {}) {
  const note = opts.proxied !== false
    ? "Proxy al servicio system-login (autenticación centralizada)."
    : "Autenticación centralizada Jeff-Aporta.";
  return {
    "/auth/token": {
      post: {
        tags: ["Auth"],
        summary: "Login — JWT 30 días",
        description: note,
        requestBody: authCredBody,
        responses: {
          "200": jsonResponse("JWT emitido"),
          "401": jsonResponse("Credenciales inválidas"),
          "429": jsonResponse("Penalización por intentos"),
        },
      },
    },
    "/auth/test-token": {
      post: {
        tags: ["Auth"],
        summary: "JWT de prueba Swagger — 1 hora",
        description:
          note + " Emite JWT con purpose=swagger-test. Usar desde el panel superior o Try it out.",
        requestBody: authCredBody,
        responses: {
          "200": jsonResponse("JWT de prueba emitido"),
          "401": jsonResponse("Credenciales inválidas"),
          "429": jsonResponse("Penalización por intentos"),
        },
      },
    },
  };
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Fragmento HTML insertado en <body> por @hono/swagger-ui (no documento completo). */
function buildSwaggerUiFragment(
  asset: { css: string[]; js: string[] },
  docPath: string,
  authLoginUrl: string,
): string {
  const specUrl = escHtml(docPath);
  const authBase = authLoginUrl
    ? escHtml(authLoginUrl.replace(/\/$/, ""))
    : "";
  const cssLinks = asset.css.map((url) => `<link rel="stylesheet" href="${escHtml(url)}" />`).join("\n");
  const jsScripts = asset.js
    .map((url) => `<script src="${escHtml(url)}" crossorigin="anonymous"><\/script>`)
    .join("\n");

  return `
<style>
  #swagger-auth-bar {
    font-family: system-ui, sans-serif;
    padding: 10px 16px;
    background: #1b2638;
    color: #e8eef7;
    border-bottom: 1px solid #2d3a4f;
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  #swagger-auth-bar h2 { margin: 0; font-size: 14px; font-weight: 600; flex: 1 1 auto; }
  #swagger-auth-bar button {
    padding: 7px 12px; border-radius: 4px; border: none; background: #1976d2;
    color: #fff; cursor: pointer; font-size: 13px;
  }
  #swagger-auth-bar button.secondary { background: #455a64; }
  #swagger-auth-bar button:disabled { opacity: 0.6; cursor: wait; }
  #swagger-auth-status { font-size: 12px; flex: 1 1 100%; min-height: 1.2em; }
  #swagger-auth-status.ok { color: #81c784; }
  #swagger-auth-status.err { color: #ff8a80; }
  .swagger-modal {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  }
  .swagger-modal.hidden { display: none; }
  .swagger-modal-backdrop {
    position: absolute; inset: 0; background: rgba(0,0,0,0.55);
  }
  .swagger-modal-dialog {
    position: relative; z-index: 1; width: min(420px, 92vw);
    background: #1b2638; color: #e8eef7; border-radius: 8px;
    border: 1px solid #2d3a4f; padding: 16px 18px 18px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  }
  .swagger-modal-dialog h3 { margin: 0 0 12px; font-size: 16px; }
  .swagger-modal-dialog label {
    display: flex; flex-direction: column; gap: 4px;
    font-size: 12px; margin-bottom: 10px;
  }
  .swagger-modal-dialog input, .swagger-modal-dialog textarea {
    padding: 8px 10px; border-radius: 4px; border: 1px solid #3d4f6a;
    background: #0f1623; color: #e8eef7; font-family: inherit; font-size: 13px;
  }
  .swagger-modal-dialog textarea { min-height: 100px; resize: vertical; font-family: ui-monospace, monospace; }
  .swagger-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  .swagger-modal-hint { font-size: 11px; opacity: 0.75; margin: 0 0 10px; }
</style>
<div id="swagger-auth-bar">
  <h2>Autenticación Swagger</h2>
  <button type="button" id="swagger-open-login">Iniciar sesión</button>
  <button type="button" id="swagger-open-jwt" class="secondary">Pegar JWT</button>
  <button type="button" id="swagger-auth-clear" class="secondary">Limpiar</button>
  <div id="swagger-auth-status"></div>
</div>
<div id="swagger-login-modal" class="swagger-modal hidden" aria-hidden="true">
  <div class="swagger-modal-backdrop" data-close="login"></div>
  <div class="swagger-modal-dialog" role="dialog" aria-labelledby="swagger-login-title">
    <h3 id="swagger-login-title">Iniciar sesión</h3>
    <p class="swagger-modal-hint">Obtiene JWT de prueba (1 h) vía POST /auth/test-token${authBase ? " → " + authBase : " (proxy system-login)"}.</p>
    <label>Usuario<input id="swagger-auth-user" type="text" autocomplete="username" placeholder="usuario"/></label>
    <label>Contraseña<input id="swagger-auth-pass" type="password" autocomplete="current-password" placeholder="••••"/></label>
    <div class="swagger-modal-actions">
      <button type="button" class="secondary" data-close="login">Cancelar</button>
      <button type="button" id="swagger-auth-btn">Obtener JWT y autorizar</button>
    </div>
  </div>
</div>
<div id="swagger-jwt-modal" class="swagger-modal hidden" aria-hidden="true">
  <div class="swagger-modal-backdrop" data-close="jwt"></div>
  <div class="swagger-modal-dialog" role="dialog" aria-labelledby="swagger-jwt-title">
    <h3 id="swagger-jwt-title">Pegar JWT</h3>
    <p class="swagger-modal-hint">Pega el token Bearer (con o sin prefijo «Bearer »). También puedes usar el botón Authorize nativo de Swagger UI.</p>
    <label>Token<textarea id="swagger-jwt-paste" placeholder="eyJhbG…"></textarea></label>
    <div class="swagger-modal-actions">
      <button type="button" class="secondary" data-close="jwt">Cancelar</button>
      <button type="button" id="swagger-jwt-apply">Aplicar JWT</button>
    </div>
  </div>
</div>
<div id="swagger-ui"></div>
${cssLinks}
${jsScripts}
<script>
(function () {
  var specUrl = "${specUrl}";
  var AUTH_BASE = "${authBase}";
  if (!AUTH_BASE) {
    AUTH_BASE = location.origin;
  } else if ((location.hostname === "localhost" || location.hostname === "127.0.0.1") && AUTH_BASE.indexOf("system-login.jeffaporta") >= 0) {
    AUTH_BASE = "http://localhost:8781";
  }
  var PREFIX = "abc123";
  var SUFFIX = "xyz987";
  var STORAGE_KEY = "jeffaporta:swagger-test-jwt";

  function caesarShiftForDate(d) { return d.getUTCDate(); }
  function caesarEncode(text, shift) {
    return text.split("").map(function (c) {
      var code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    }).join("");
  }
  function wrapPassword(plain) {
    if (!plain) return plain;
    return caesarEncode(PREFIX + plain + SUFFIX, caesarShiftForDate(new Date()));
  }

  function setStatus(msg, kind) {
    var el = document.getElementById("swagger-auth-status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = kind || "";
  }

  function authorizeSwagger(token) {
    if (!window.ui) return false;
    try {
      window.ui.authActions.authorize({
        Bearer: {
          name: "Bearer",
          schema: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          value: token,
        },
      });
      return true;
    } catch (e) { return false; }
  }

  function clearSwaggerAuth() {
    try { if (window.ui) window.ui.authActions.logout(["Bearer"]); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    setStatus("", "");
  }

  async function fetchTestJwt(username, password) {
    var res = await fetch(AUTH_BASE + "/auth/test-token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: username, password: wrapPassword(password) }),
    });
    var data = {};
    try { data = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok || !data.ok || !data.token) {
      var err = data.error || ("HTTP " + res.status);
      if (data.retryAfterSeconds) err += " (reintenta en " + data.retryAfterSeconds + " s)";
      throw new Error(err);
    }
    return data;
  }

  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  }

  function normalizeJwt(raw) {
    var t = (raw || "").trim();
    if (/^bearer\\s+/i.test(t)) t = t.replace(/^bearer\\s+/i, "");
    return t;
  }

  function applyJwtPaste() {
    var ta = document.getElementById("swagger-jwt-paste");
    var token = normalizeJwt(ta ? ta.value : "");
    if (!token) {
      setStatus("Pega un JWT válido.", "err");
      return;
    }
    if (!authorizeSwagger(token)) {
      setStatus("No se pudo autorizar. Comprueba el token.", "err");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token }));
    } catch (e) { /* ignore */ }
    setStatus("JWT aplicado manualmente.", "ok");
    closeModal("swagger-jwt-modal");
  }

  async function onAuthClick() {
    var userEl = document.getElementById("swagger-auth-user");
    var passEl = document.getElementById("swagger-auth-pass");
    var btn = document.getElementById("swagger-auth-btn");
    var username = (userEl && userEl.value || "").trim();
    var password = passEl ? passEl.value : "";
    if (!username || !password) {
      setStatus("Usuario y contraseña requeridos.", "err");
      return;
    }
    if (btn) btn.disabled = true;
    setStatus("Solicitando JWT…", "");
    try {
      var data = await fetchTestJwt(username, password);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          token: data.token, expiresAt: data.expiresAt, username: data.username,
        }));
      } catch (e) { /* ignore */ }
      if (!authorizeSwagger(data.token)) {
        setStatus("JWT obtenido. Usa Authorize y pega el token si no se aplicó solo.", "err");
        return;
      }
      setStatus("Autorizado como " + data.username + " · expira " + (data.expiresAt || "en 1 h"), "ok");
      closeModal("swagger-login-modal");
    } catch (e) {
      setStatus(e.message || String(e), "err");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function restoreStoredJwt() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved.token) return;
      if (saved.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (authorizeSwagger(saved.token)) {
        setStatus(
          "Sesión restaurada" + (saved.username ? " (" + saved.username + ")" : "") +
            (saved.expiresAt ? " · expira " + saved.expiresAt : ""),
          "ok",
        );
      }
    } catch (e) { /* ignore */ }
  }

  document.getElementById("swagger-auth-btn").addEventListener("click", onAuthClick);
  document.getElementById("swagger-auth-clear").addEventListener("click", clearSwaggerAuth);
  document.getElementById("swagger-open-login").addEventListener("click", function () { openModal("swagger-login-modal"); });
  document.getElementById("swagger-open-jwt").addEventListener("click", function () { openModal("swagger-jwt-modal"); });
  document.getElementById("swagger-jwt-apply").addEventListener("click", applyJwtPaste);
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      var which = el.getAttribute("data-close");
      if (which === "login") closeModal("swagger-login-modal");
      if (which === "jwt") closeModal("swagger-jwt-modal");
    });
  });

  window.onload = function () {
    if (typeof SwaggerUIBundle === "undefined") {
      setStatus("No se pudo cargar Swagger UI.", "err");
      return;
    }
    window.ui = SwaggerUIBundle({
      url: specUrl,
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      onComplete: function () { restoreStoredJwt(); },
    });
  };
})();
<\/script>`;
}
